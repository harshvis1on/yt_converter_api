# Megaphone to Supabase Sync Setup

## 1. Megaphone API Polling (No Webhooks Available)

Since Megaphone doesn't support webhooks, we'll use API polling to sync data.

### Megaphone API Endpoints to Use:
```
GET /podcasts/{podcast_id}/episodes
GET /podcasts/{podcast_id}
```

### API Headers:
```
Authorization: Bearer {MEGAPHONE_API_TOKEN}
Content-Type: application/json
```

## 2. n8n Workflow for Sync

### Manual Sync Workflow (`/webhook/sync-megaphone-episodes`):
1. **HTTP Request**: Call Megaphone API to get episodes
2. **Data Transformation**: Format Megaphone data for Supabase
3. **Supabase Upsert**: Insert new episodes or update existing ones
4. **Return Results**: Send back episode count and data

### Scheduled Sync Workflow (Every 15 minutes):
1. **Get All Podcasts**: Fetch podcasts from Supabase
2. **For Each Podcast**: Call Megaphone API for episodes
3. **Upsert Episodes**: Update Supabase with latest data
4. **Log Results**: Track sync success/failures

### Required Environment Variables in n8n:
```
MEGAPHONE_API_TOKEN=359a75d62bfb7e0c5214ac2404d04bc4
SUPABASE_URL=https://etzrlqtqjvqqjjeqpkrb.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 3. Supabase Episodes Table

```sql
CREATE TABLE episodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  podcast_id UUID REFERENCES podcasts(id),
  megaphone_episode_id TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  duration INTEGER, -- in seconds
  status TEXT DEFAULT 'draft',
  file_url TEXT,
  play_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 4. Manual Sync as Backup

Implement a "Sync Now" button that:
1. Calls Megaphone API to fetch latest episodes
2. Updates Supabase with any changes
3. Refreshes frontend data