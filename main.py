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
# Updated to use working alternative APIs due to 404 errors with original endpoints
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
    
    # Define multiple API providers to try as fallbacks
    audio_apis = [
        {
            "name": "Youtube To Mp3 Download",
            "host": "youtube-to-mp3-download.p.rapidapi.com", 
            "endpoint": "/mp3",
            "params": {"url": f"https://www.youtube.com/watch?v={request.video_id}"}
        },
        {
            "name": "YouTube Media Downloader",
            "host": "youtube-media-downloader.p.rapidapi.com",
            "endpoint": "/download",
            "params": {"videoId": request.video_id, "format": "mp3"}
        },
        {
            "name": "Free MP3-MP4 YouTube",
            "host": "free-mp3-mp4-youtube.p.rapidapi.com",
            "endpoint": "/mp3", 
            "params": {"url": f"https://www.youtube.com/watch?v={request.video_id}"}
        }
    ]
    
    video_apis = [
        {
            "name": "YouTube Media Downloader", 
            "host": "youtube-media-downloader.p.rapidapi.com",
            "endpoint": "/download",
            "params": {"videoId": request.video_id, "format": "mp4", "quality": request.quality}
        },
        {
            "name": "Free MP3-MP4 YouTube",
            "host": "free-mp3-mp4-youtube.p.rapidapi.com", 
            "endpoint": "/mp4",
            "params": {"url": f"https://www.youtube.com/watch?v={request.video_id}", "quality": request.quality}
        },
        {
            "name": "YouTube Downloader With MP3",
            "host": "youtube-downloader-with-mp3.p.rapidapi.com",
            "endpoint": "/json",
            "params": {"url": f"https://www.youtube.com/watch?v={request.video_id}", "quality": request.quality}
        }
    ]

    try:
        apis_to_try = audio_apis if request.content_type.lower() == "audio" else video_apis
        download_response = None
        api_provider = None
        
        # Try each API until one works
        for api_config in apis_to_try:
            print(f"[DEBUG] Trying {api_config['name']} API: {api_config['host']}")
            
            try:
                download_response = requests.get(
                    f"https://{api_config['host']}{api_config['endpoint']}",
                    params=api_config['params'],
                    headers={
                        "X-RapidAPI-Key": rapidapi_key,
                        "X-RapidAPI-Host": api_config['host']
                    },
                    timeout=60
                )
                
                print(f"[DEBUG] {api_config['name']} response status: {download_response.status_code}")
                
                # If we get a successful response, use this API
                if download_response.status_code == 200:
                    api_provider = api_config['name']
                    print(f"[DEBUG] Success with {api_provider}!")
                    break
                elif download_response.status_code == 404:
                    print(f"[DEBUG] {api_config['name']} endpoint not found, trying next...")
                    continue
                else:
                    print(f"[DEBUG] {api_config['name']} failed with status {download_response.status_code}: {download_response.text[:200]}")
                    continue
                    
            except Exception as api_error:
                print(f"[DEBUG] {api_config['name']} error: {api_error}")
                continue
        
        # If no API worked, raise an error
        if not download_response or download_response.status_code != 200:
            raise HTTPException(
                status_code=503,
                detail="All YouTube downloader APIs are currently unavailable. Please try again later."
            )
        
        # Handle response from either API
        print(f"[DEBUG] API response status: {download_response.status_code}")
        print(f"[DEBUG] API response headers: {dict(download_response.headers)}")
        
        if download_response.status_code == 200:
            try:
                data = download_response.json()
                print(f"[DEBUG] API response data keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
            except Exception as json_error:
                print(f"[ERROR] Failed to parse JSON response: {json_error}")
                print(f"[ERROR] Raw response: {download_response.text[:500]}")
                raise HTTPException(
                    status_code=502,
                    detail=f"Invalid JSON response from {api_provider}: {json_error}"
                )
            
            # Video info will be included in the main response from the new API
            video_info = {}
            
            return {
                "success": True,
                "videoId": request.video_id,
                "contentType": request.content_type,
                "downloadUrl": data.get("download_url") or data.get("url") or data.get("link") or data.get("download"),
                "title": data.get("title", request.title),
                "duration": data.get("duration") or data.get("length"),
                "fileSize": data.get("file_size") or data.get("size") or data.get("filesize"),
                "quality": data.get("quality", request.quality),
                "format": data.get("format") or ("mp3" if request.content_type.lower() == "audio" else "mp4"),
                "thumbnail": data.get("thumbnail") or data.get("thumb"),
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
