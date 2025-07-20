import os
import uuid
import subprocess
from fastapi import FastAPI, Query, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
import httpx

app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DOWNLOADS_DIR = os.path.join(os.path.dirname(__file__), '..', 'downloads')
os.makedirs(DOWNLOADS_DIR, exist_ok=True)

GOOGLE_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo"
YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3"

# 🔒 Verify Google token
async def verify_token(access_token: str):
    async with httpx.AsyncClient() as client:
        res = await client.get(GOOGLE_TOKEN_INFO_URL, params={"access_token": access_token})
        if res.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid Google token")
        return res.json()

# 📺 List user's uploaded videos
@app.get("/list_user_videos")
async def list_user_videos(request: Request):
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = auth.split(" ")[1]
    await verify_token(token)

    async with httpx.AsyncClient() as client:
        # Step 1: get uploads playlist ID
        res = await client.get(f"{YOUTUBE_API_URL}/channels", params={
            "part": "contentDetails",
            "mine": "true"
        }, headers={"Authorization": f"Bearer {token}"})

        if res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch channel")

        uploads_id = res.json()["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]

        # Step 2: get videos from playlist
        res2 = await client.get(f"{YOUTUBE_API_URL}/playlistItems", params={
            "part": "snippet,contentDetails",
            "playlistId": uploads_id,
            "maxResults": 10
        }, headers={"Authorization": f"Bearer {token}"})

        if res2.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch videos")

        return res2.json()

# 🔁 Convert by direct URL (GET)
@app.get("/convert")
def convert(url: str = Query(..., description="YouTube video URL")):
    filename = str(uuid.uuid4())
    output_path = os.path.join(DOWNLOADS_DIR, f"{filename}.mp4")

    yt_dlp_cmd = [
        "yt-dlp",
        "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "-f", "bv[ext=mp4][height<=2160]+ba[ext=m4a]/best[ext=mp4]",
        "--merge-output-format", "mp4",
        "-o", output_path,
        url
    ]
    try:
        result = subprocess.run(yt_dlp_cmd, capture_output=True, text=True, timeout=600)
        if result.returncode != 0:
            raise HTTPException(status_code=400, detail=f"yt-dlp error: {result.stderr}")
        if not os.path.exists(output_path):
            raise HTTPException(status_code=500, detail="File was not created.")
        return FileResponse(output_path, media_type='video/mp4', filename=f"{filename}.mp4")
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="yt-dlp timed out.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 📥 Serve previously downloaded file
@app.get("/download/{filename}")
def download(filename: str):
    file_path = os.path.join(DOWNLOADS_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path, media_type="video/mp4", filename=filename)
