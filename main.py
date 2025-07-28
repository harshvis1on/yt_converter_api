import os
from datetime import datetime
from fastapi import FastAPI, Query, HTTPException, Request
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
import requests
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

# Request models
class ConversionRequest(BaseModel):
    video_id: str
    content_type: str  # "audio" or "video"
    title: str = ""
    quality: str = "1080p"
    api_key: str

# Health check endpoint
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "YouTube Conversion API",
        "rapidapi_configured": os.getenv("RAPIDAPI_KEY", "YOUR_RAPIDAPI_KEY") != "YOUR_RAPIDAPI_KEY",
        "conversion_auth_configured": os.getenv("CONVERSION_API_KEY", "your-secret-conversion-key") != "your-secret-conversion-key"
    }

# 📺 List user's uploaded videos
@app.get("/list_user_videos")
def list_user_videos(request: Request):
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = auth.split(" ")[1]
    
    try:
        # Validate token with comprehensive error handling
        token_manager.validate_token(token)
        
        # Step 1: get uploads playlist ID 
        try:
            res = requests.get(
                f"{YOUTUBE_API_URL}/channels",
                params={
                    "part": "contentDetails,snippet",
                    "mine": "true"
                },
                headers={"Authorization": f"Bearer {token}"},
                timeout=30
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
            
            # Step 2: get videos from playlist
            res2 = requests.get(
                f"{YOUTUBE_API_URL}/playlistItems",
                params={
                    "part": "snippet,contentDetails",
                    "playlistId": uploads_id,
                    "maxResults": 25
                },
                headers={"Authorization": f"Bearer {token}"},
                timeout=30
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
def rapidapi_convert(request: ConversionRequest):
    # Authenticate the request
    expected_api_key = os.getenv("CONVERSION_API_KEY", "your-secret-conversion-key")
    if request.api_key != expected_api_key:
        raise HTTPException(
            status_code=401, 
            detail="Invalid API key. Access denied to conversion service."
        )
    
    rapidapi_key = os.getenv("RAPIDAPI_KEY", "YOUR_RAPIDAPI_KEY")
    
    # Debug logging
    print(f"[DEBUG] Converting video_id: {request.video_id}, content_type: {request.content_type}")
    print(f"[DEBUG] RapidAPI key present: {'Yes' if rapidapi_key != 'YOUR_RAPIDAPI_KEY' else 'No'}")
    
    # Check if RapidAPI key is configured
    if rapidapi_key == "YOUR_RAPIDAPI_KEY":
        raise HTTPException(
            status_code=500,
            detail="RapidAPI key not configured. Please set RAPIDAPI_KEY environment variable."
        )
    
    try:
        if request.content_type.lower() == "audio":
            # Use the correct YouTube MP3 Audio Video downloader endpoint
            audio_host = "youtube-mp3-audio-video-downloader.p.rapidapi.com"
            api_provider = "YouTube MP3 Audio Video downloader"
            
            print(f"[DEBUG] Calling audio API: {audio_host}")
            print(f"[DEBUG] Using endpoint: /get_m4a_download_link/{request.video_id}")
            
            try:
                download_response = requests.get(
                    f"https://{audio_host}/get_m4a_download_link/{request.video_id}",
                    headers={
                        "X-RapidAPI-Key": rapidapi_key,
                        "X-RapidAPI-Host": audio_host
                    },
                    timeout=60
                )
                print(f"[DEBUG] Audio API response status: {download_response.status_code}")
                
                if download_response.status_code != 200:
                    raise HTTPException(
                        status_code=502,
                        detail=f"Audio conversion failed: {download_response.text}"
                    )
                    
            except requests.exceptions.RequestException as e:
                print(f"[ERROR] Audio API request failed: {e}")
                raise HTTPException(
                    status_code=502,
                    detail=f"Audio API request failed: {str(e)}"
                )
            
        else:
            # Use the correct YouTube Video FAST Downloader 24/7 endpoint
            video_host = "youtube-video-fast-downloader-24-7.p.rapidapi.com"
            api_provider = "YouTube Video FAST Downloader 24/7"
            
            print(f"[DEBUG] Calling video API: {video_host}")
            print(f"[DEBUG] Using endpoint: /download_video/{request.video_id}")
            
            try:
                download_response = requests.get(
                    f"https://{video_host}/download_video/{request.video_id}",
                    params={"quality": request.quality},
                    headers={
                        "X-RapidAPI-Key": rapidapi_key,
                        "X-RapidAPI-Host": video_host
                    },
                    timeout=60
                )
                print(f"[DEBUG] Video API response status: {download_response.status_code}")
                
                if download_response.status_code != 200:
                    raise HTTPException(
                        status_code=502,
                        detail=f"Video conversion failed: {download_response.text}"
                    )
                    
            except requests.exceptions.RequestException as e:
                print(f"[ERROR] Video API request failed: {e}")
                raise HTTPException(
                    status_code=502,
                    detail=f"Video API request failed: {str(e)}"
                )
        
        # Handle response from either API
        print(f"[DEBUG] API response status: {download_response.status_code}")
        print(f"[DEBUG] API response headers: {dict(download_response.headers)}")
        
        if download_response.status_code == 200:
            try:
                data = download_response.json()
                print(f"[DEBUG] API response data keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
                print(f"[DEBUG] Full API response data: {data}")
            except Exception as json_error:
                print(f"[ERROR] Failed to parse JSON response: {json_error}")
                print(f"[ERROR] Raw response: {download_response.text[:500]}")
                raise HTTPException(
                    status_code=502,
                    detail=f"Invalid JSON response from {api_provider}: {json_error}"
                )
            
            # Try to get additional video info from the response or other sources
            video_info = {}
            # Most modern APIs include video info in the main response, so we'll extract from data
            
            return {
                "success": True,
                "videoId": request.video_id,
                "contentType": request.content_type,
                "downloadUrl": data.get("file") or data.get("download_url") or data.get("url") or data.get("link"),
                "title": video_info.get("title") or data.get("title", request.title),
                "duration": video_info.get("duration") or data.get("duration"),
                "fileSize": data.get("file_size") or data.get("size"),
                "quality": data.get("quality", request.quality),
                "format": data.get("format") or ("mp3" if request.content_type.lower() == "audio" else "mp4"),
                "thumbnail": video_info.get("thumbnail") or data.get("thumbnail"),
                "processedAt": datetime.utcnow().isoformat(),
                "apiProvider": api_provider,
                "distributionType": request.content_type
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
            
    except requests.exceptions.Timeout:
        print(f"[ERROR] Timeout error for video_id: {request.video_id}")
        raise HTTPException(
            status_code=504,
            detail="Conversion request timed out. Please try again."
        )
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Request error for video_id: {request.video_id}, error: {str(e)}")
        raise HTTPException(
            status_code=502,
            detail=f"External API request failed: {str(e)}"
        )
    except Exception as e:
        error_msg = str(e) if str(e) else f"Unknown error: {type(e).__name__}"
        print(f"[ERROR] Unexpected error for video_id: {request.video_id}, error: {error_msg}")
        print(f"[ERROR] Exception type: {type(e)}")
        print(f"[ERROR] Exception args: {e.args}")
        raise HTTPException(
            status_code=500,
            detail=f"Conversion service error: {error_msg}"
        )

# 📥 Serve previously downloaded file
@app.get("/download/{filename}")
def download(filename: str):
    file_path = os.path.join(DOWNLOADS_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path, media_type="video/mp4", filename=filename)
