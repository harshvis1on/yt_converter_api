# Custom YouTube Conversion API
# Built for scale: 100 users × 100-500 videos each

from fastapi import FastAPI, BackgroundTasks, HTTPException, Query
from fastapi.responses import JSONResponse
import asyncio
import aioredis
import yt_dlp
import uuid
import os
import subprocess
from typing import List, Optional
from pydantic import BaseModel
import boto3
from datetime import datetime
import logging

app = FastAPI(title="PodPay Conversion API", version="1.0.0")

# Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
AWS_BUCKET = os.getenv("AWS_BUCKET", "podpay-media")
TEMP_DIR = "/tmp/conversions"
MAX_CONCURRENT_JOBS = int(os.getenv("MAX_CONCURRENT_JOBS", "10"))

# Models
class ConversionRequest(BaseModel):
    video_id: str
    content_type: str  # 'audio' or 'video'
    title: Optional[str] = None
    quality: Optional[str] = "medium"  # low, medium, high
    callback_url: Optional[str] = None

class BatchConversionRequest(BaseModel):
    videos: List[ConversionRequest]
    user_id: str
    priority: Optional[int] = 0

class ConversionStatus(BaseModel):
    job_id: str
    status: str  # queued, processing, completed, failed
    progress: int
    download_url: Optional[str] = None
    error: Optional[str] = None

# Global connections
redis_client = None
s3_client = boto3.client('s3')

@app.on_event("startup")
async def startup():
    global redis_client
    redis_client = await aioredis.from_url(REDIS_URL)
    os.makedirs(TEMP_DIR, exist_ok=True)

@app.on_event("shutdown") 
async def shutdown():
    if redis_client:
        await redis_client.close()

class ConversionAPI:
    def __init__(self):
        self.active_jobs = 0
        self.max_concurrent = MAX_CONCURRENT_JOBS
        
    # Single video conversion
    @staticmethod
    async def convert_single(video_id: str, content_type: str, quality: str = "medium"):
        job_id = str(uuid.uuid4())
        
        # Add to Redis queue
        job_data = {
            "job_id": job_id,
            "video_id": video_id,
            "content_type": content_type,
            "quality": quality,
            "status": "queued",
            "created_at": datetime.utcnow().isoformat(),
            "progress": 0
        }
        
        await redis_client.hset(f"job:{job_id}", mapping=job_data)
        await redis_client.lpush("conversion_queue", job_id)
        
        return {"job_id": job_id, "status": "queued"}
    
    # Batch conversion
    @staticmethod
    async def convert_batch(batch_request: BatchConversionRequest):
        job_ids = []
        
        for video in batch_request.videos:
            job_id = str(uuid.uuid4())
            
            job_data = {
                "job_id": job_id,
                "video_id": video.video_id,
                "content_type": video.content_type,
                "quality": video.quality or "medium",
                "user_id": batch_request.user_id,
                "priority": batch_request.priority,
                "status": "queued",
                "created_at": datetime.utcnow().isoformat(),
                "progress": 0
            }
            
            await redis_client.hset(f"job:{job_id}", mapping=job_data)
            
            # Higher priority jobs go to front of queue
            if batch_request.priority > 0:
                await redis_client.rpush("priority_queue", job_id)
            else:
                await redis_client.lpush("conversion_queue", job_id)
            
            job_ids.append(job_id)
        
        return {"job_ids": job_ids, "status": "queued", "count": len(job_ids)}
    
    # Get job status
    @staticmethod
    async def get_status(job_id: str):
        job_data = await redis_client.hgetall(f"job:{job_id}")
        
        if not job_data:
            raise HTTPException(status_code=404, detail="Job not found")
        
        return ConversionStatus(**job_data)
    
    # Process video conversion
    async def process_video(self, job_id: str):
        try:
            # Update status to processing
            await redis_client.hset(f"job:{job_id}", "status", "processing")
            await redis_client.hset(f"job:{job_id}", "progress", "10")
            
            # Get job details
            job_data = await redis_client.hgetall(f"job:{job_id}")
            video_id = job_data["video_id"]
            content_type = job_data["content_type"]
            quality = job_data.get("quality", "medium")
            
            # Step 1: Download video
            file_path = await self.download_video(job_id, video_id, content_type, quality)
            
            # Step 2: Upload to cloud storage
            await redis_client.hset(f"job:{job_id}", "progress", "80")
            download_url = await self.upload_to_storage(file_path, video_id, content_type)
            
            # Step 3: Complete job
            await redis_client.hset(f"job:{job_id}", "status", "completed")
            await redis_client.hset(f"job:{job_id}", "progress", "100")
            await redis_client.hset(f"job:{job_id}", "download_url", download_url)
            
            # Cleanup
            if os.path.exists(file_path):
                os.unlink(file_path)
            
            return download_url
            
        except Exception as e:
            await redis_client.hset(f"job:{job_id}", "status", "failed")
            await redis_client.hset(f"job:{job_id}", "error", str(e))
            logging.error(f"Job {job_id} failed: {e}")
            raise
    
    # Download video using yt-dlp
    async def download_video(self, job_id: str, video_id: str, content_type: str, quality: str):
        try:
            await redis_client.hset(f"job:{job_id}", "progress", "20")
            
            # Quality settings
            quality_map = {
                "low": {
                    "audio": "ba[abr<=128]/best[abr<=128]",
                    "video": "bv[height<=480]+ba/best[height<=480]"
                },
                "medium": {
                    "audio": "ba[abr<=192]/best[abr<=192]", 
                    "video": "bv[height<=720]+ba/best[height<=720]"
                },
                "high": {
                    "audio": "ba/best",
                    "video": "bv[height<=1080]+ba/best[height<=1080]"
                }
            }
            
            format_selector = quality_map[quality][content_type]
            file_extension = "mp3" if content_type == "audio" else "mp4"
            output_path = os.path.join(TEMP_DIR, f"{job_id}.{file_extension}")
            
            ydl_opts = {
                'format': format_selector,
                'outtmpl': output_path,
                'noplaylist': True,
                'extract_flat': False,
            }
            
            if content_type == "audio":
                ydl_opts.update({
                    'postprocessors': [{
                        'key': 'FFmpegExtractAudio',
                        'preferredcodec': 'mp3',
                        'preferredquality': '192' if quality == "medium" else '128' if quality == "low" else '320',
                    }]
                })
            
            await redis_client.hset(f"job:{job_id}", "progress", "40")
            
            # Use yt-dlp in subprocess for better control
            youtube_url = f"https://youtube.com/watch?v={video_id}"
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                await asyncio.get_event_loop().run_in_executor(
                    None, ydl.download, [youtube_url]
                )
            
            await redis_client.hset(f"job:{job_id}", "progress", "60")
            
            if not os.path.exists(output_path):
                raise Exception("File not created after download")
            
            return output_path
            
        except Exception as e:
            raise Exception(f"Download failed: {str(e)}")
    
    # Upload to cloud storage
    async def upload_to_storage(self, file_path: str, video_id: str, content_type: str):
        try:
            file_extension = "mp3" if content_type == "audio" else "mp4"
            s3_key = f"conversions/{video_id}.{file_extension}"
            
            # Upload to S3
            await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: s3_client.upload_file(
                    file_path, 
                    AWS_BUCKET, 
                    s3_key,
                    ExtraArgs={
                        'ContentType': f'{content_type}/{"mpeg" if content_type == "audio" else "mp4"}',
                        'ACL': 'public-read'
                    }
                )
            )
            
            # Generate public URL
            download_url = f"https://{AWS_BUCKET}.s3.amazonaws.com/{s3_key}"
            return download_url
            
        except Exception as e:
            raise Exception(f"Upload failed: {str(e)}")

# API instance
conversion_api = ConversionAPI()

# Routes
@app.post("/convert")
async def convert_video(
    video_id: str = Query(..., description="YouTube video ID"),
    content_type: str = Query(..., description="'audio' or 'video'"),
    quality: str = Query("medium", description="Quality: low, medium, high")
):
    """Convert single YouTube video"""
    return await conversion_api.convert_single(video_id, content_type, quality)

@app.post("/convert/batch")
async def convert_batch(batch_request: BatchConversionRequest):
    """Convert multiple videos in batch"""
    return await conversion_api.convert_batch(batch_request)

@app.get("/status/{job_id}")
async def get_job_status(job_id: str):
    """Get conversion job status"""
    return await conversion_api.get_status(job_id)

@app.get("/queue/stats")
async def get_queue_stats():
    """Get queue statistics"""
    queue_length = await redis_client.llen("conversion_queue")
    priority_length = await redis_client.llen("priority_queue")
    
    return {
        "queue_length": queue_length,
        "priority_queue_length": priority_length,
        "active_jobs": conversion_api.active_jobs,
        "max_concurrent": conversion_api.max_concurrent
    }

# Background worker (separate process)
async def worker():
    """Background worker to process conversion jobs"""
    while True:
        try:
            # Check priority queue first
            job_id = await redis_client.brpop("priority_queue", timeout=1)
            if not job_id:
                job_id = await redis_client.brpop("conversion_queue", timeout=1)
            
            if job_id:
                job_id = job_id[1].decode()
                
                if conversion_api.active_jobs < conversion_api.max_concurrent:
                    conversion_api.active_jobs += 1
                    try:
                        await conversion_api.process_video(job_id)
                    finally:
                        conversion_api.active_jobs -= 1
                else:
                    # Put job back in queue if at capacity
                    await redis_client.lpush("conversion_queue", job_id)
                    await asyncio.sleep(1)
            
        except Exception as e:
            logging.error(f"Worker error: {e}")
            await asyncio.sleep(5)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)