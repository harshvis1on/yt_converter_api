# yt_converter_api

A FastAPI service to convert YouTube videos to MP4 using yt-dlp.

## Features
- `/convert?url=...` endpoint to download and return a YouTube video as MP4
- CORS enabled for all origins
- Stores output files in `downloads/`

## Setup & Local Development

### 1. Create a virtual environment
```bash
python3 -m venv venv
source venv/bin/activate
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Run the server
```bash
uvicorn yt_converter_api.main:app --reload
```

The API will be available at `http://127.0.0.1:8000`.

## Folder Structure
```
yt_converter_api/
  main.py
  README.md
requirements.txt
downloads/
```

## Render.com Deployment

1. **Create a new Web Service** on [Render.com](https://render.com/).
2. **Build Command:**
   ```bash
   pip install -r requirements.txt
   ```
3. **Start Command:**
   ```bash
   uvicorn yt_converter_api.main:app --host 0.0.0.0 --port 10000
   ```
4. **Environment:** Python 3.9+ (set in Render settings if needed)
5. **Persistent Storage:** Add a persistent disk and mount it to `/downloads` if you want to keep files between deploys.
6. **Expose port:** 10000 (or as configured in Render)

**Note:** yt-dlp must be available in the environment. If not, add a `render.yaml` or use a custom Dockerfile to ensure it is installed. 