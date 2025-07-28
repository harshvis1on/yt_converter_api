# PodPay Troubleshooting Guide

## Common Issues and Solutions

### 1. "Content not found or has been removed" Error

**Problem**: This error occurs when the backend API is not accessible or not deployed properly.

**Solutions**:
✅ **Automatic Fallback**: The app now automatically uses direct YouTube API when backend fails
- You'll see a toast message: "Using direct YouTube API connection..."
- The authentication flow will continue normally

✅ **Backend Issues**: If you're running your own backend:
- Check if the server is running: `uvicorn main:app --reload`
- Verify the API_BASE URL in `src/utils/apiClient.js`
- Ensure `/list_user_videos` endpoint exists

### 2. YouTube API Quota Exceeded

**Problem**: "YouTube API quota exceeded. Please try again later."

**Solution**: 
- This is a Google limitation (10,000 units per day)
- Wait 24 hours for quota to reset
- Consider requesting quota increase from Google

### 3. Authentication Issues

**Problem**: "YouTube access token expired" or OAuth redirect fails

**Solutions**:
- Clear browser localStorage: `localStorage.clear()`
- Check OAuth redirect URI matches exactly: `window.location.origin + '/auth/callback'`
- Verify Google OAuth client ID is correct

### 4. Megaphone Podcast Creation Fails

**Problem**: Podcast creation fails but YouTube connection works

**Solutions**:
✅ **Development Mode**: Works without Megaphone API tokens
- App will use mock responses and show "development mode" messages

✅ **Production Setup**: Add environment variables:
```env
REACT_APP_MEGAPHONE_API_TOKEN=your_token_here
REACT_APP_MEGAPHONE_NETWORK_ID=your_network_id
```

## Testing the Flow

### Local Testing Steps

1. **Start the app**: `npm start`
2. **Go to**: `http://localhost:3000/auth`
3. **Click**: "Continue with Google"
4. **Grant permissions**: YouTube access required
5. **Wait for redirect**: Should auto-complete setup

### Expected Behavior

✅ **Success Flow**:
1. "Welcome, [Your Name]!" toast
2. "Setting up your podcast from YouTube channel..." 
3. "Using direct YouTube API connection..." (if backend is down)
4. "🎉 Your podcast '[Channel Name]' is ready! Found X videos."
5. Redirect to dashboard

❌ **Failure Indicators**:
- Red error toasts with specific messages
- Stuck on loading screen
- Redirect to `/auth` instead of `/dashboard`

### Debug Information

**Check Browser Console** for detailed logs:
```javascript
// Open DevTools Console and look for:
"Fetching YouTube data directly from API..."
"Backend API failed, using direct YouTube API..."
"Creating podcast with enhanced data:"
```

**Check localStorage** (DevTools > Application > Local Storage):
- `google_token` - Should have OAuth token
- `user_info` - Should have user profile JSON
- `podcastId` - Should have podcast ID after creation
- `channelData` - Should have YouTube channel data

## API Endpoints Status

### Backend Endpoints (May be down)
- ❓ `GET /list_user_videos` - YouTube video fetching
- ❓ `GET /convert` - Video conversion

### Direct API Fallbacks (Always work)
- ✅ `YouTube Data API v3` - Channel and video data
- ✅ `Google OAuth 2.0` - User authentication
- ✅ `Megaphone API` - Podcast creation (with tokens)

## Network Issues

### Check API Connectivity

```bash
# Test backend (may fail - this is OK)
curl -I https://yt-converter-api-gy0s.onrender.com/list_user_videos

# Test YouTube API (should work)
curl "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true&access_token=YOUR_TOKEN"
```

### Firewall/Proxy Issues
- Ensure access to `*.googleapis.com`
- Ensure access to `*.googleusercontent.com`
- Corporate firewalls may block OAuth redirects

## Development vs Production

### Development Mode Features
- ✅ Works without backend API
- ✅ Works without Megaphone tokens
- ✅ Uses mock podcast responses
- ✅ Full YouTube integration
- ✅ Complete authentication flow

### Production Requirements
- Backend API with working endpoints
- Megaphone API tokens configured
- Proper CORS settings
- HTTPS deployment (required for OAuth)

## Getting Help

### Error Reporting
When reporting issues, include:
1. Browser console logs
2. Network tab showing failed requests
3. localStorage contents
4. Exact error messages
5. Steps to reproduce

### Quick Fixes
```javascript
// Reset app completely
localStorage.clear();
window.location.reload();

// Check if tokens exist
console.log('Tokens:', {
  google: !!localStorage.getItem('google_token'),
  podcast: !!localStorage.getItem('podcastId'),
  user: !!localStorage.getItem('user_info')
});
```

The app is designed to be resilient and should work even when some services are unavailable!