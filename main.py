import os
from fastapi import FastAPI, Query, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
import httpx
from lib.auth import TokenManager, APIErrorHandler
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Downloads directory removed - using RapidAPI for conversions

YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3"

# Initialize auth utilities
token_manager = TokenManager()
api_error_handler = APIErrorHandler()

# 📺 List user's uploaded videos
@app.get("/list_user_videos")
async def list_user_videos(request: Request):
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = auth.split(" ")[1]
    
    try:
        # Validate token with comprehensive error handling
        await token_manager.validate_token(token)
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Step 1: get uploads playlist ID with retry logic
            try:
                res = await api_error_handler.make_request_with_retry(
                    client=client,
                    method="GET",
                    url=f"{YOUTUBE_API_URL}/channels",
                    params={
                        "part": "contentDetails,snippet",
                        "mine": "true"
                    },
                    headers={"Authorization": f"Bearer {token}"}
                )
                
                if res.status_code != 200:
                    error_detail = res.text
                    user_error = api_error_handler.get_user_friendly_error(res.status_code, error_detail)
                    raise HTTPException(status_code=res.status_code, detail=user_error)
                
                channel_data = res.json()
                if not channel_data.get("items"):
                    raise HTTPException(status_code=404, detail="No YouTube channel found for this account")
                
                channel_info = channel_data["items"][0]
                uploads_id = channel_info["contentDetails"]["relatedPlaylists"]["uploads"]
                
                # Step 2: get videos from playlist with retry logic
                res2 = await api_error_handler.make_request_with_retry(
                    client=client,
                    method="GET",
                    url=f"{YOUTUBE_API_URL}/playlistItems",
                    params={
                        "part": "snippet,contentDetails",
                        "playlistId": uploads_id,
                        "maxResults": 25
                    },
                    headers={"Authorization": f"Bearer {token}"}
                )
                
                if res2.status_code != 200:
                    error_detail = res2.text
                    user_error = api_error_handler.get_user_friendly_error(res2.status_code, error_detail)
                    raise HTTPException(status_code=res2.status_code, detail=user_error)
                
                videos_data = res2.json()
                
                # Return structured response with channel info
                return {
                    "channel": {
                        "id": channel_info["id"],
                        "title": channel_info["snippet"]["title"],
                        "description": channel_info["snippet"]["description"],
                        "publishedAt": channel_info["snippet"]["publishedAt"]
                    },
                    "videos": [{
                        "videoId": item["snippet"]["resourceId"]["videoId"],
                        "title": item["snippet"]["title"],
                        "description": item["snippet"]["description"],
                        "publishedAt": item["snippet"]["publishedAt"],
                        "thumbnail": item["snippet"]["thumbnails"]["high"]["url"] if "high" in item["snippet"]["thumbnails"] else item["snippet"]["thumbnails"]["default"]["url"]
                    } for item in videos_data.get("items", [])],
                    "totalResults": videos_data.get("pageInfo", {}).get("totalResults", 0),
                    "nextPageToken": videos_data.get("nextPageToken")
                }
                
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to fetch YouTube data: {str(e)}"
                )
                
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=api_error_handler.get_user_friendly_error(500, str(e))
        )

# OLD CONVERSION METHODS REMOVED - NOW USING RAPIDAPI
# The /api/rapidapi/convert endpoint below handles all conversions

# 🚀 RapidAPI YouTube Conversion - Routes to correct API based on distribution type
@app.post("/api/rapidapi/convert")
async def rapidapi_convert(
    video_id: str,
    content_type: str,  # "audio" or "video" - from user's distribution preference
    title: str = "",
    quality: str = "1080p"  # Maximum video quality available
):
    import httpx
    import os
    
    rapidapi_key = os.getenv("RAPIDAPI_KEY", "YOUR_RAPIDAPI_KEY")
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            
            if content_type.lower() == "audio":
                # Use YouTube MP3 Audio Video downloader for audio
                audio_host = "youtube-mp3-audio-video-downloader.p.rapidapi.com"
                
                # Call audio conversion API (YouTube MP3 Audio Video downloader)
                download_response = await client.get(
                    f"https://{audio_host}/download",
                    params={
                        "videoId": video_id,
                        "format": "mp3",
                        "quality": "320"  # 320kbps - maximum quality available
                    },
                    headers={
                        "X-RapidAPI-Key": rapidapi_key,
                        "X-RapidAPI-Host": audio_host
                    }
                )
                
                api_provider = "YouTube MP3 Audio Video downloader"
                
            else:
                # Use YouTube Video FAST Downloader 24/7 for video
                video_host = "youtube-video-fast-downloader-24-7.p.rapidapi.com"
                
                # Step 1: Get available quality options
                quality_response = await client.get(
                    f"https://{video_host}/get_available_quality/{video_id}",
                    headers={
                        "X-RapidAPI-Key": rapidapi_key,
                        "X-RapidAPI-Host": video_host
                    }
                )
                
                if quality_response.status_code != 200:
                    raise HTTPException(
                        status_code=quality_response.status_code,
                        detail=f"Failed to get video quality options: {quality_response.text}"
                    )
                
                # Step 2: Download video with specified quality
                download_response = await client.get(
                    f"https://{video_host}/download_video/{video_id}",
                    params={"quality": quality},
                    headers={
                        "X-RapidAPI-Key": rapidapi_key,
                        "X-RapidAPI-Host": video_host
                    }
                )
                
                api_provider = "YouTube Video FAST Downloader 24/7"
            
            # Handle response from either API
            if download_response.status_code == 200:
                data = download_response.json()
                
                # Try to get additional video info (works for video API)
                video_info = {}
                if content_type.lower() == "video":
                    try:
                        info_response = await client.get(
                            f"https://youtube-video-fast-downloader-24-7.p.rapidapi.com/get-video-info/{video_id}",
                            headers={
                                "X-RapidAPI-Key": rapidapi_key,
                                "X-RapidAPI-Host": "youtube-video-fast-downloader-24-7.p.rapidapi.com"
                            }
                        )
                        if info_response.status_code == 200:
                            video_info = info_response.json()
                    except:
                        pass  # Continue without extra info if it fails
                
                return {
                    "success": True,
                    "videoId": video_id,
                    "contentType": content_type,
                    "downloadUrl": data.get("download_url") or data.get("url") or data.get("link"),
                    "title": video_info.get("title") or data.get("title", title),
                    "duration": video_info.get("duration") or data.get("duration"),
                    "fileSize": data.get("file_size") or data.get("size"),
                    "quality": data.get("quality", quality),
                    "format": data.get("format") or ("mp3" if content_type.lower() == "audio" else "mp4"),
                    "thumbnail": video_info.get("thumbnail") or data.get("thumbnail"),
                    "processedAt": httpx._utils.utcnow().isoformat(),
                    "apiProvider": api_provider,
                    "distributionType": content_type
                }
            elif download_response.status_code == 429:
                raise HTTPException(
                    status_code=429,
                    detail=f"Rate limit exceeded for {api_provider}. Please try again in a few minutes."
                )
            elif download_response.status_code == 404:
                raise HTTPException(
                    status_code=404,
                    detail="Video not found, private, or unavailable for conversion."
                )
            elif download_response.status_code == 403:
                raise HTTPException(
                    status_code=403,
                    detail="Video access denied. May be restricted or require authentication."
                )
            else:
                raise HTTPException(
                    status_code=download_response.status_code,
                    detail=f"Conversion failed via {api_provider}: {download_response.text}"
                )
                
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Conversion request timed out. Please try again."
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Conversion service error: {str(e)}"
        )

# 📥 Serve previously downloaded file
@app.get("/download/{filename}")
def download(filename: str):
    file_path = os.path.join(DOWNLOADS_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path, media_type="video/mp4", filename=filename)
