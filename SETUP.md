# PodPay Setup Guide

## YouTube to Podcast Connection Flow

### How it Works

1. **User clicks "Connect YouTube"** → Initiates OAuth flow
2. **Google OAuth** → User authorizes YouTube access 
3. **Fetch Channel Data** → Gets channel info and video list
4. **Create Megaphone Podcast** → Auto-creates podcast from channel data
5. **Store Configuration** → Saves podcast ID and channel info
6. **Redirect to Dashboard** → User can now sync videos

### Setup Requirements

#### 1. Environment Variables

Create a `.env` file in the project root:

```env
# Megaphone API (Required for production)
REACT_APP_MEGAPHONE_API_TOKEN=your_api_token_here
REACT_APP_MEGAPHONE_NETWORK_ID=your_network_id_here

# Development Mode
# If these are not set, the app will use mock responses
```

#### 2. Google OAuth Configuration

The app is configured with YouTube OAuth client ID:
- Client ID: `678018511336-jgd34uakj7vika3m6nvf028ekcfu2ucf.apps.googleusercontent.com`
- Scopes: `youtube.readonly`

#### 3. Backend Requirements

Make sure your backend is running with:
- FastAPI server with `/list_user_videos` endpoint
- YouTube Data API access
- Proper CORS configuration

### Testing the Flow

#### Development Mode (No Megaphone API)
1. Start the React app: `npm start`
2. Click "Connect YouTube"
3. Authorize with Google
4. App will create a mock podcast and proceed

#### Production Mode (With Megaphone API)
1. Set up environment variables
2. Configure Megaphone API credentials
3. Test the full flow end-to-end

### What Gets Created

When connecting YouTube, the app:

**Fetches from YouTube:**
- Channel title, description, subscriber count
- List of uploaded videos (up to 25 most recent)
- Video titles, descriptions, thumbnails

**Creates in Megaphone:**
- New podcast with channel title as podcast title
- Channel description as podcast summary
- Proper iTunes categories and metadata
- Unique slug based on channel title

### Error Handling

The app handles various error scenarios:
- ✅ Expired/invalid YouTube tokens
- ✅ YouTube API quota limits
- ✅ Megaphone API failures
- ✅ Network connectivity issues
- ✅ Missing environment variables

### User Experience

**Loading States:**
- "Checking authentication..."
- "Connecting to your YouTube channel..."
- "Creating your podcast..."

**Success States:**
- "🎉 Podcast created! Found X videos to sync"
- "✅ YouTube channel connected!"

**Error States:**
- Clear error messages with retry options
- Toast notifications for all operations
- Graceful fallbacks to development mode

### Development Notes

- Mock responses are used when Megaphone API token is not configured
- All operations include comprehensive logging
- Toast notifications provide real-time feedback
- State is properly managed and persisted in localStorage

### API Endpoints Used

**Megaphone API:**
- `POST /networks/{network_id}/podcasts` - Create podcast
- `POST /networks/{network_id}/podcasts/{podcast_id}/episodes` - Create episodes

**YouTube API:**
- `GET /youtube/v3/channels` - Get channel info
- `GET /youtube/v3/playlistItems` - Get uploaded videos

**Custom Backend:**
- `GET /list_user_videos` - Fetch user's YouTube videos
- `GET /convert` - Convert YouTube videos to MP4