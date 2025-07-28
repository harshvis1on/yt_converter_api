# PodPay - n8n Workflow Architecture

## 🔄 **Workflow Design**

### **Workflow 1: YouTube Channel Sync**
**Webhook URL**: `https://your-n8n-instance.com/webhook/youtube-sync`

**Input:**
```json
{
  "accessToken": "youtube_oauth_token",
  "userId": "user_id"
}
```

**Steps:**
1. **HTTP Request** → YouTube Channels API
2. **HTTP Request** → YouTube PlaylistItems API  
3. **Set** → Format channel and video data
4. **HTTP Request** → Megaphone Create Podcast API
5. **Supabase** → Store podcast and video data
6. **Respond** → Return formatted response

**Output:**
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

### **Workflow 2: Episode Creation**
**Webhook URL**: `https://your-n8n-instance.com/webhook/create-episodes`

**Input:**
```json
{
  "podcastId": "megaphone_podcast_id",
  "videoIds": ["video1", "video2", "video3"],
  "userId": "user_id"
}
```

**Steps:**
1. **Split In Batches** → Process videos one by one
2. **Supabase** → Get video details
3. **HTTP Request** → Megaphone Create Episode API
4. **Supabase** → Update episode status
5. **Aggregate** → Collect all results
6. **Respond** → Return batch results

**Output:**
```json
{
  "success": true,
  "results": [
    {
      "videoId": "video1",
      "episodeId": "episode_id",
      "status": "created"
    }
  ],
  "summary": {
    "total": 3,
    "successful": 2,
    "failed": 1
  }
}
```

### **Workflow 3: User Management**
**Webhook URL**: `https://your-n8n-instance.com/webhook/user-setup`

**Input:**
```json
{
  "googleToken": "oauth_token",
  "userInfo": {
    "name": "User Name",
    "email": "user@email.com"
  }
}
```

**Steps:**
1. **Supabase** → Create/update user record
2. **Set** → Prepare user data
3. **Respond** → Return user setup confirmation

## 🗄️ **Supabase Database Schema**

### **Users Table**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  google_id TEXT UNIQUE,
  name TEXT,
  email TEXT,
  profile_picture TEXT,
  google_token TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **Channels Table**
```sql
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  youtube_channel_id TEXT UNIQUE,
  title TEXT,
  description TEXT,
  subscriber_count INTEGER,
  video_count INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **Podcasts Table**
```sql
CREATE TABLE podcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID REFERENCES channels(id),
  megaphone_podcast_id TEXT,
  title TEXT,
  slug TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **Videos Table**
```sql
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID REFERENCES channels(id),
  youtube_video_id TEXT UNIQUE,
  title TEXT,
  description TEXT,
  published_at TIMESTAMP,
  thumbnail_url TEXT,
  duration INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **Episodes Table**
```sql
CREATE TABLE episodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  podcast_id UUID REFERENCES podcasts(id),
  video_id UUID REFERENCES videos(id),
  megaphone_episode_id TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP
);
```

## 🌐 **Frontend Integration**

Frontend only needs to make simple webhook calls:

### **1. User Authentication & Setup**
```javascript
const setupUser = async (googleToken, userInfo) => {
  const response = await fetch('https://your-n8n.com/webhook/user-setup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ googleToken, userInfo })
  });
  return response.json();
};
```

### **2. YouTube Channel Sync**
```javascript
const syncYouTubeChannel = async (accessToken, userId) => {
  const response = await fetch('https://your-n8n.com/webhook/youtube-sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken, userId })
  });
  return response.json();
};
```

### **3. Create Episodes**
```javascript
const createEpisodes = async (podcastId, videoIds, userId) => {
  const response = await fetch('https://your-n8n.com/webhook/create-episodes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ podcastId, videoIds, userId })
  });
  return response.json();
};
```

## ✅ **Benefits of n8n Architecture**

1. **No CORS Issues** - All API calls happen server-side
2. **Visual Workflows** - Easy to debug and modify
3. **Built-in Error Handling** - n8n handles retries and errors
4. **Database Integration** - Direct Supabase connections
5. **Scalable** - Easy to add new workflows
6. **Maintainable** - Clean separation of concerns
7. **Secure** - API tokens stay on server

## 🚀 **Next Steps**

1. Set up n8n instance (cloud or self-hosted)
2. Create the 3 workflows above
3. Set up Supabase database with schema
4. Update frontend to use webhook endpoints
5. Test end-to-end flow