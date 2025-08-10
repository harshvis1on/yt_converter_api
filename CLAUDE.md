# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a YouTube-to-Podcast conversion platform with both React frontend and FastAPI backend. The system allows users to:
- Connect their YouTube channels via OAuth
- Convert YouTube videos to podcast episodes 
- Create and manage podcasts through Megaphone API
- Sync data with Supabase database
- Handle payouts through Airwallex integration

## Architecture

**Frontend (React)**: React 18 app with TypeScript support, using Tailwind CSS and React Router
**Backend (Python)**: FastAPI server with YouTube Data API integration and RapidAPI for video conversion
**Database**: Supabase for user data, podcasts, episodes, and payout details
**Storage**: Supabase Storage for podcast artwork and media files
**Authentication**: Google OAuth 2.0 for YouTube access
**External APIs**: Megaphone for podcast hosting, n8n for workflow automation, RapidAPI for video conversion

## Development Commands

### Frontend Development
```bash
# Start React development server (runs on port 3001)
npm start

# Build for production  
npm run build

# Run tests
npm test

# Install dependencies 
npm install

# TypeScript compilation check
npx tsc --noEmit
```

### Backend Development  
```bash
# Start FastAPI server (from project root)
python main.py
# or
uvicorn main:app --reload

# Install Python dependencies
pip install -r requirements.txt

# Start with debug logging
python -u main.py

# Health check backend
curl http://localhost:8000/health
```

### Full Development Setup
```bash
# Terminal 1: Start backend
python main.py

# Terminal 2: Start frontend  
npm start

# The app will be available at http://localhost:3001
# Backend API at http://localhost:8000
```

## Key Components & Architecture

### Backend Structure (`main.py`)
- **FastAPI app** with CORS middleware for cross-origin requests  
- **Authentication**: TokenManager class (`lib/auth.py`) for Google OAuth token validation and refresh
- **API Error Handling**: APIErrorHandler with retry logic and user-friendly error messages
- **Video Conversion**: Uses RapidAPI services for YouTube video/audio conversion (replaced yt-dlp)
- **Key Endpoints**:
  - `GET /list_user_videos` - Fetch user's YouTube videos with auth validation
  - `POST /api/rapidapi/convert` - Convert YouTube videos using RapidAPI services
  - `GET /health` - Service health check and configuration status

### Frontend Structure (`src/`)
- **Components**: Modular React components for UI (Header, Sidebar, Dashboard, etc.)
- **Services**: 
  - `supabase.js` - Database operations and file uploads (SupabaseService class)
  - `n8nApi.js` - Workflow automation API calls (N8nApiService class with fallback mocks)
  - `episodeService.js` - Episode management
- **Hooks**: Custom hooks for data fetching (`useEpisodes.js`, `usePodcastData.ts`, `useYouTubeSync.js`)
- **Types**: TypeScript definitions in `src/types/` (podcast.ts, user.ts)
- **Utils**: Helper functions (`localStorage.js`, `onboarding.js`)

### Authentication Flow
1. User clicks "Connect YouTube" → Google OAuth flow
2. Backend validates token with `TokenManager.validate_token()`
3. Frontend stores token and user info in localStorage
4. Subsequent API calls include `Authorization: Bearer {token}` header

### Data Sync Architecture
- **n8n workflows** handle complex operations (podcast creation, episode sync) with production/test webhook routing
- **Supabase** stores persistent data (users, podcasts, episodes, payouts) with SupabaseService class
- **localStorage** maintains client state between sessions (tokens, user data, current podcast)
- **Mock fallbacks** for n8n workflows when endpoints are unavailable (dev/offline support)

## Important Configuration

### Environment Variables Required
```env
# React Frontend (.env)
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_MEGAPHONE_API_TOKEN=your_megaphone_token
REACT_APP_MEGAPHONE_NETWORK_ID=your_network_id
REACT_APP_N8N_BASE_URL=your_n8n_url
REACT_APP_USE_TEST_WEBHOOKS=false          # Set to true for test webhooks
REACT_APP_DEV_MODE=false                   # Set to true for mock responses

# Python Backend (environment or .env)
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
RAPIDAPI_KEY=your_rapidapi_key             # For video conversion services
CONVERSION_API_KEY=your_secret_conversion_key  # Internal API authentication
```

### Google OAuth Configuration
- Client ID: `678018511336-jgd34uakj7vika3m6nvf028ekcfu2ucf.apps.googleusercontent.com`
- Scopes: `youtube.readonly`

## Key API Endpoints

### Backend (`main.py`)
- `GET /health` - Service health check and configuration status
- `GET /list_user_videos` - Fetch user's YouTube videos with auth validation
- `POST /api/rapidapi/convert` - Convert YouTube videos using RapidAPI services (ConversionRequest model)

### Frontend API Calls  
- **n8n Workflows**: Production webhooks at `/webhook/{endpoint}` or test webhooks at `/webhook-test/{endpoint}`
  - `youtube-sync` - Fetch YouTube channel data for form prefill
  - `create-podcast` - Create podcast in Megaphone with all metadata
  - `create-episodes` - Convert YouTube videos to podcast episodes
  - `sync-podcast-data` - Sync podcast metadata from Megaphone
  - `fetch-episodes` - Get published episodes from Megaphone
  - `user-setup` - Store user data after OAuth
- **Supabase Operations**: User podcasts, episode management, payout details via SupabaseService

## Development Notes

### Error Handling Patterns
- Backend uses `APIErrorHandler.get_user_friendly_error()` for consistent error messages
- Frontend shows toast notifications for all operations
- Token validation includes automatic refresh logic
- Retry logic with exponential backoff for API calls

### State Management
- localStorage for persistence (user_info, google_token, currentPodcast)
- React hooks for component state
- Supabase for server-side data persistence

### Video Processing
- Uses RapidAPI services for video/audio conversion:
  - **Audio**: `youtube-mp3-audio-video-downloader.p.rapidapi.com`
  - **Video**: `youtube-video-fast-downloader-24-7.p.rapidapi.com`
- Handles common errors (private videos, copyright restrictions, rate limits)
- 60-second timeout for RapidAPI requests
- Returns download URLs instead of storing files locally
- Distribution type determines which API service to use (audio vs video)

## Testing Approach

### User Flow Testing
1. **New User**: Clear localStorage → OAuth → Channel sync → Podcast creation
2. **Returning User**: Keep tokens → Auto-sync podcast data
3. **Episode Creation**: Select videos → Create episodes → Auto-sync to Megaphone

### Debug Commands (Browser Console)
```javascript
// Check current state
console.log('Auth State:', {
  token: !!localStorage.getItem('google_token'),
  user: !!localStorage.getItem('user_info'),
  podcast: !!localStorage.getItem('currentPodcast')
});

// Check n8n API configuration
console.log('n8n Config:', {
  baseUrl: process.env.REACT_APP_N8N_BASE_URL,
  useTestWebhooks: process.env.REACT_APP_USE_TEST_WEBHOOKS,
  devMode: process.env.REACT_APP_DEV_MODE
});

// Test n8n connection
fetch(`${process.env.REACT_APP_N8N_BASE_URL}/webhook/health`)
  .then(r => console.log('n8n health:', r.status))
  .catch(e => console.log('n8n error:', e));

// Force data refresh
if (window.usePodcastData?.refreshPodcasts) {
  window.usePodcastData.refreshPodcasts();
}
```

## Common Patterns

### Authentication Check (Python Backend)
```python
auth = request.headers.get("Authorization")
if not auth or not auth.startswith("Bearer "):
    raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

token = auth.split(" ")[1]
token_manager.validate_token(token)  # Validates and handles token refresh
```

### Supabase Operations
```javascript
const { data, error } = await supabase
  .from('table_name')
  .operation()
  .select()

if (error) throw new Error(`Operation failed: ${error.message}`)
```

### API Error Handling (Python Backend)
```python
try:
    # API operation
except HTTPException:
    raise
except Exception as e:
    raise HTTPException(
        status_code=500,
        detail=api_error_handler.get_user_friendly_error(500, str(e))
    )
```

### n8n API Calls with Fallback (Frontend)
```javascript
try {
  const result = await n8nApi.makeRequest('endpoint-name', data);
  if (result.success) {
    // Handle success
  }
} catch (error) {
  // Automatically falls back to mock response for development
  console.error('n8n workflow failed:', error);
}
```

### RapidAPI Video Conversion Pattern (Backend)
```python
# Use different APIs based on content type
if request.content_type.lower() == "audio":
    api_host = "youtube-mp3-audio-video-downloader.p.rapidapi.com"
    endpoint = f"/get_m4a_download_link/{request.video_id}"
else:
    api_host = "youtube-video-fast-downloader-24-7.p.rapidapi.com" 
    endpoint = f"/download_video/{request.video_id}"

response = requests.get(f"https://{api_host}{endpoint}", 
    headers={"X-RapidAPI-Key": rapidapi_key, "X-RapidAPI-Host": api_host},
    timeout=60)
```