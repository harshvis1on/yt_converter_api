import os
import uuid
import subprocess
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

app = FastAPI()

# Allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DOWNLOADS_DIR = os.path.join(os.path.dirname(__file__), '..', 'downloads')
os.makedirs(DOWNLOADS_DIR, exist_ok=True)

@app.get("/convert")
def convert(url: str = Query(..., description="YouTube video URL")):
    filename = str(uuid.uuid4())
    output_path = os.path.join(DOWNLOADS_DIR, f"{filename}.mp4")
    yt_dlp_cmd = [
        "yt-dlp",
        '-f', 'bv[ext=mp4][height<=2160]+ba[ext=m4a]/best[ext=mp4]',
        '--merge-output-format', 'mp4',
        '-o', output_path,
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