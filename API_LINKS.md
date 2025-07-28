# PodPay - Complete API Reference

## 📺 YouTube Data API v3 (Google)

### **Channel Information**
```
GET https://www.googleapis.com/youtube/v3/channels
```
**Parameters:**
- `part=snippet,contentDetails,statistics`
- `mine=true` 
- `access_token={USER_OAUTH_TOKEN}`

**Usage:** Gets channel title, description, subscriber count, uploads playlist ID

### **Video List from Channel**
```
GET https://www.googleapis.com/youtube/v3/playlistItems
```
**Parameters:**
- `part=snippet,contentDetails`
- `playlistId={UPLOADS_PLAYLIST_ID}` (from channel data)
- `maxResults=25`
- `access_token={USER_OAUTH_TOKEN}`

**Usage:** Gets list of videos from user's uploads playlist

---

## 🎙️ Megaphone API

### **Create Podcast**
```
POST https://cms.megaphone.fm/api/networks/efc0956a-0adc-11ee-a037-5b2c5cb9fec6/podcasts
```
**Headers:**
- `Content-Type: application/json`
- `Authorization: Token token="{MEGAPHONE_API_TOKEN}"`
- `Accept: application/json`
- `Origin: {BROWSER_ORIGIN}`

**Body Example:**
```json
{
  "title": "My YouTube Podcast",
  "subtitle": "Podcast from my YouTube channel",
  "summary": "Description from YouTube channel",
  "itunesCategories": ["Technology"],
  "language": "en",
  "link": "https://www.youtube.com/channel/CHANNEL_ID",
  "copyright": "(c) 2025 Creator Name",
  "author": "Creator Name",
  "backgroundImageFileUrl": "",
  "explicit": "clean",
  "ownerName": "Creator Name",
  "ownerEmail": "",
  "podcastType": "serial",
  "slug": "my-youtube-podcast"
}
```

### **Create Episode**
```
POST https://cms.megaphone.fm/api/networks/efc0956a-0adc-11ee-a037-5b2c5cb9fec6/podcasts/{PODCAST_ID}/episodes
```
**Headers:** (same as above)

**Body Example:**
```json
{
  "title": "Episode Title from YouTube",
  "summary": "Episode description from YouTube",
  "pubDate": "2025-01-01T00:00:00Z",
  "audioUrl": "https://youtube.com/watch?v=VIDEO_ID",
  "draft": false
}
```

---

## 🔐 Google OAuth 2.0

### **Authorization URL** (Redirect)
```
https://accounts.google.com/o/oauth2/v2/auth
```
**Parameters:**
- `client_id=678018511336-jgd34uakj7vika3m6nvf028ekcfu2ucf.apps.googleusercontent.com`
- `redirect_uri={ORIGIN}/auth/callback`
- `response_type=token`
- `scope=https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email`
- `include_granted_scopes=true`
- `state={RANDOM_STATE}`
- `prompt=consent`

### **Token Validation**
```
GET https://oauth2.googleapis.com/tokeninfo
```
**Parameters:**
- `access_token={OAUTH_TOKEN}`

**Usage:** Validates token and gets expiration info

### **User Profile**
```
GET https://www.googleapis.com/oauth2/v2/userinfo
```
**Parameters:**
- `access_token={OAUTH_TOKEN}`

**Usage:** Gets user name, email, profile picture

---

## 🚫 Deprecated/Unused APIs

### **Backend APIs** (No longer used - replaced with direct integration)
- ❌ `https://yt-converter-api-gy0s.onrender.com/list_user_videos`
- ❌ `https://yt-converter-api-gy0s.onrender.com/convert`

These were causing 404 errors and have been replaced with direct YouTube API calls.

---

## 🔧 Configuration Constants

### **Network IDs & Client IDs**
```javascript
// Megaphone Network ID (hardcoded)
const NETWORK_ID = "efc0956a-0adc-11ee-a037-5b2c5cb9fec6"

// Google OAuth Client ID
const CLIENT_ID = "678018511336-jgd34uakj7vika3m6nvf028ekcfu2ucf.apps.googleusercontent.com"

// API Base URLs
const YOUTUBE_API = "https://www.googleapis.com/youtube/v3"
const MEGAPHONE_API = "https://cms.megaphone.fm/api"
const GOOGLE_OAUTH = "https://accounts.google.com/o/oauth2/v2/auth"
```

---

## ⚙️ Environment Variables Required

### **For Production (Real Megaphone Integration)**
```env
REACT_APP_MEGAPHONE_API_TOKEN=your_token_here
REACT_APP_MEGAPHONE_NETWORK_ID=efc0956a-0adc-11ee-a037-5b2c5cb9fec6
```

### **For Development (Mock Mode)**
```
# No environment variables needed - uses mock responses
```

---

## 🔍 API Call Flow

### **Complete Authentication & Setup Flow:**
1. **OAuth Redirect** → `https://accounts.google.com/o/oauth2/v2/auth`
2. **Token Validation** → `https://oauth2.googleapis.com/tokeninfo`
3. **User Info** → `https://www.googleapis.com/oauth2/v2/userinfo`
4. **Channel Data** → `https://www.googleapis.com/youtube/v3/channels`
5. **Video List** → `https://www.googleapis.com/youtube/v3/playlistItems`
6. **Create Podcast** → `https://cms.megaphone.fm/api/networks/.../podcasts`
7. **Create Episodes** → `https://cms.megaphone.fm/api/networks/.../podcasts/.../episodes`

---

## ❓ Questions to Verify

1. **Megaphone Network ID**: Is `efc0956a-0adc-11ee-a037-5b2c5cb9fec6` correct?
2. **Megaphone API Token**: Do you have the correct token format?
3. **Google Client ID**: Is `678018511336-jgd34uakj7vika3m6nvf028ekcfu2ucf.apps.googleusercontent.com` your client?
4. **CORS Setup**: Does Megaphone API allow browser calls from your domain?
5. **OAuth Redirect**: Should the callback be `/auth/callback` or different?

Please verify these URLs and IDs are correct for your setup! 🎯