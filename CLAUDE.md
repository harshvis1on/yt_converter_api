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
**Backend (Python)**: FastAPI server with YouTube Data API integration and yt-dlp for video conversion
**Database**: Supabase for user data, podcasts, episodes, and payout details
**Storage**: Supabase Storage for podcast artwork and media files
**Authentication**: Google OAuth 2.0 for YouTube access
**External APIs**: Megaphone for podcast hosting, n8n for workflow automation

## Development Commands

### Frontend Development
```bash
# Start React development server (runs on port 3001)
npm start

# Build for production  
npm run build

# Run tests
npm test
```

### Backend Development
```bash
# Start FastAPI server (from project root)
python main.py
# or
uvicorn main:app --reload

# Install Python dependencies
pip install -r requirements.txt
```

### Testing Commands
```bash
# Clear browser state for fresh user testing
# Run in browser console:
localStorage.clear(); sessionStorage.clear(); location.reload();

# Start development server with specific port
PORT=3001 npm start

# Check TypeScript compilation
npm run build
```

## Key Components & Architecture

### Backend Structure (`main.py`)
- **FastAPI app** with CORS middleware for cross-origin requests
- **Authentication**: TokenManager class for Google OAuth token validation and refresh
- **API Error Handling**: APIErrorHandler with retry logic and user-friendly error messages
- **Video Conversion**: Uses yt-dlp for YouTube video download and conversion to MP4

### Frontend Structure (`src/`)
- **Components**: Modular React components for UI (Header, Sidebar, Dashboard, etc.)
- **Services**: 
  - `supabase.js` - Database operations and file uploads
  - `n8nApi.js` - Workflow automation API calls
  - `episodeService.js` - Episode management
- **Hooks**: Custom hooks for data fetching (`useEpisodes.js`, `usePodcastData.ts`, `useYouTubeSync.js`)
- **Types**: TypeScript definitions in `src/types/`

### Authentication Flow
1. User clicks "Connect YouTube" → Google OAuth flow
2. Backend validates token with `TokenManager.validate_token()`
3. Frontend stores token and user info in localStorage
4. Subsequent API calls include `Authorization: Bearer {token}` header

### Data Sync Architecture
- **n8n workflows** handle complex operations (podcast creation, episode sync)
- **Supabase** stores persistent data (users, podcasts, episodes, payouts)
- **localStorage** maintains client state between sessions

## Important Configuration

### Environment Variables Required
```env
# React Frontend (.env)
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_MEGAPHONE_API_TOKEN=your_megaphone_token
REACT_APP_MEGAPHONE_NETWORK_ID=your_network_id
REACT_APP_N8N_BASE_URL=your_n8n_url

# Python Backend (environment or .env)
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
```

### Google OAuth Configuration
- Client ID: `678018511336-jgd34uakj7vika3m6nvf028ekcfu2ucf.apps.googleusercontent.com`
- Scopes: `youtube.readonly`

## Key API Endpoints

### Backend (`main.py`)
- `GET /list_user_videos` - Fetch user's YouTube videos with auth validation
- `GET /convert?url={youtube_url}` - Convert YouTube video to MP4 download
- `GET /download/{filename}` - Serve previously converted files

### Frontend API Calls
- **n8n Workflows**: `/webhook/user-setup`, `/webhook/youtube-sync`, `/webhook/create-podcast`
- **Supabase Operations**: User podcasts, episode management, payout details

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
- Uses yt-dlp with specific format selection: `bv[ext=mp4][height<=2160]+ba[ext=m4a]/best[ext=mp4]`
- Handles common YouTube errors (private videos, copyright restrictions, age restrictions)
- 10-minute timeout for video conversion
- Automatic cleanup of failed downloads

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

// Force data refresh
if (window.usePodcastData?.refreshPodcasts) {
  window.usePodcastData.refreshPodcasts();
}
```

## Common Patterns

### Authentication Check
```javascript
const auth = request.headers.get("Authorization")
if (!auth || !auth.startsWith("Bearer ")) {
    raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
}
```

### Supabase Operations
```javascript
const { data, error } = await supabase
  .from('table_name')
  .operation()
  .select()

if (error) throw new Error(`Operation failed: ${error.message}`)
```

### API Error Handling
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