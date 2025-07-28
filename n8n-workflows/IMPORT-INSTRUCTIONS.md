# n8n Workflow Import Instructions

## 🚀 Step-by-Step Setup Guide

### Step 1: Access Your n8n Instance
1. Make sure n8n is running on `https://n8n-6s78.onrender.com`
2. Go to https://n8n-6s78.onrender.com in your browser
3. Log in to your n8n dashboard

### Step 2: Import Workflows (In Order)
Import these JSON files **in this exact order**:

#### 1. YouTube Channel Sync Workflow ⚠️ **UPDATED - RE-IMPORT THIS!**
- Click "Add Workflow" → "Import from JSON"
- Upload: `1-youtube-channel-sync.json` (updated with proper YouTube API auth)
- **Webhook URL**: `https://n8n-6s78.onrender.com/webhook-test/youtube-sync`

#### 2. Create Episodes Workflow ⭐ **MOST IMPORTANT**
- Click "Add Workflow" → "Import from JSON"
- Upload: `2-create-episodes.json`
- **Webhook URL**: `https://n8n-6s78.onrender.com/webhook-test/create-episodes`
- **Note**: This is the core workflow needed for YouTube to podcast conversion

#### 3. User Setup Workflow
- Click "Add Workflow" → "Import from JSON"
- Upload: `3-user-setup.json`
- **Webhook URL**: `https://n8n-6s78.onrender.com/webhook-test/user-setup`

#### 4. Health Check Workflow (Optional)
- Click "Add Workflow" → "Import from JSON"
- Upload: `4-health-check.json`
- **Webhook URL**: `https://n8n-6s78.onrender.com/webhook-test/health`

#### 5. Create Podcast Workflow (Airwallex Integration)
- Click "Add Workflow" → "Import from JSON"
- Upload: `5-create-podcast.json`
- **Webhook URL**: `https://n8n-6s78.onrender.com/webhook-test/create-podcast`
- **Note**: Handles podcast creation with payment integration

#### 6. Sync Podcast Data Workflow 🆕 **OPTIMIZED**
- Click "Add Workflow" → "Import from JSON"
- Upload: `6-sync-podcast-data.json`
- **Webhook URL**: `https://n8n-6s78.onrender.com/webhook-test/sync-podcast-data`
- **Note**: User-specific podcast sync with Supabase integration

#### 7. Sync Megaphone Episodes Workflow 🆕
- Click "Add Workflow" → "Import from JSON"
- Upload: `7-sync-megaphone-episodes.json`
- **Webhook URL**: `https://n8n-6s78.onrender.com/webhook-test/sync-megaphone-episodes`
- **Note**: Syncs episode data from Megaphone API

#### 8. Fetch Episodes Workflow 🆕
- Click "Add Workflow" → "Import from JSON"
- Upload: `8-fetch-episodes.json`
- **Webhook URL**: `https://n8n-6s78.onrender.com/webhook-test/fetch-episodes`
- **Note**: Fetches episodes from Supabase database

### Step 3: Activate Workflows
After importing each workflow:
1. Click the **"Active"** toggle in the top-right corner
2. Make sure the toggle turns **green** ✅
3. Save the workflow

### Step 4: Test the Workflows
Test each webhook endpoint:

```bash
# Test Health Check
curl https://n8n-6s78.onrender.com/webhook-test/health

# Test User Setup
curl -X POST https://n8n-6s78.onrender.com/webhook-test/user-setup \
  -H "Content-Type: application/json" \
  -d '{"googleToken":"test","userInfo":{"id":"123","name":"Test","email":"test@test.com"}}'

# Test YouTube Sync (requires real YouTube access token)
curl -X POST https://n8n-6s78.onrender.com/webhook-test/youtube-sync \
  -H "Content-Type: application/json" \
  -d '{"accessToken":"YOUR_YOUTUBE_TOKEN","userId":"123"}'

# Test Create Episodes 🆕
curl -X POST https://n8n-6s78.onrender.com/webhook-test/create-episodes \
  -H "Content-Type: application/json" \
  -d '{"podcastId":"test123","videoIds":["vid1","vid2"],"userId":"user123","saveToSupabase":true}'

# Test Sync Podcast Data 🆕
curl -X POST https://n8n-6s78.onrender.com/webhook-test/sync-podcast-data \
  -H "Content-Type: application/json" \
  -d '{"userId":"test_user_123"}'

# Test Sync Megaphone Episodes 🆕
curl -X POST https://n8n-6s78.onrender.com/webhook-test/sync-megaphone-episodes \
  -H "Content-Type: application/json" \
  -d '{"podcastId":"podcast123","userId":"user123"}'

# Test Fetch Episodes 🆕
curl -X POST https://n8n-6s78.onrender.com/webhook-test/fetch-episodes \
  -H "Content-Type: application/json" \
  -d '{"podcastId":"podcast123","userId":"user123"}'
```

### Step 5: Verify Frontend Connection
Your React app is already configured to use:
- **Base URL**: `https://n8n-6s78.onrender.com`
- Environment file updated: `.env`
- **Mock Mode**: Will automatically use mock data if n8n server is down

## 🎯 Expected Results

### 1. YouTube Channel Sync Response:
```json
{
  "success": true,
  "channel": {
    "id": "channel_id",
    "title": "Channel Name",
    "description": "...",
    "subscriberCount": "1000"
  },
  "videos": [...],
  "podcastId": "megaphone_podcast_id"
}
```

### 2. Create Episodes Response:
```json
{
  "success": true,
  "results": [
    {
      "videoId": "video1",
      "episodeId": "episode_id", 
      "status": "created",
      "title": "Episode Title"
    }
  ],
  "summary": {
    "total": 3,
    "successful": 2,
    "failed": 1
  }
}
```

### 3. User Setup Response:
```json
{
  "success": true,
  "userId": "google_user_id",
  "message": "User setup completed successfully"
}
```

## ⚠️ Important Notes

1. **Webhook URLs**: All webhooks are automatically configured for your n8n instance
2. **API Tokens**: Your Megaphone API token (359a75d62bfb7e0c5214ac2404d04bc4) is hardcoded in the workflows
3. **Network ID**: Your Megaphone network ID (1077e5f2-0247-11f0-a50a-770c9b0b9b7b) is used
4. **Order Matters**: Import workflows in the exact order listed above
5. **Activate All**: Make sure to activate each workflow after importing

## 🔍 Troubleshooting

- **Workflow not responding**: Check if it's activated (green toggle)
- **CORS errors**: All API calls now happen server-side in n8n
- **API errors**: Check n8n execution logs for detailed error messages
- **Frontend errors**: Ensure `.env` file has the correct n8n URL

## ✅ Success Indicators

- ✅ All 8 workflows imported successfully
- ✅ All workflows show "Active" with green toggle
- ✅ Health check returns 200 OK
- ✅ Frontend connects without CORS errors
- ✅ YouTube authentication flows work end-to-end
- ✅ Create episodes workflow processes video selections
- ✅ Episode data syncs between Megaphone and Supabase
- ✅ Podcast metadata syncs properly