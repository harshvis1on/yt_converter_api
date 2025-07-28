# N8N Workflows for Megaphone Sync

## Required Workflows

### 1. `/webhook/sync-podcast-data` 
**Purpose**: Sync podcast metadata from Megaphone to Supabase (called on user login)

**Trigger**: HTTP Webhook
- Method: POST
- Body: `{ "userId": "user_id_here" }`

**Workflow Steps**:
1. **Get User's Podcast** (Supabase Node)
   ```sql
   SELECT * FROM podcasts WHERE user_id = '{{ $json.userId }}' LIMIT 1
   ```

2. **Get Megaphone Data** (HTTP Request Node)
   - URL: `https://cms.megaphone.fm/api/podcasts/{{ $json.megaphone_id }}`
   - Headers: `Authorization: Bearer 359a75d62bfb7e0c5214ac2404d04bc4`

3. **Update Supabase** (Supabase Node)
   ```sql
   UPDATE podcasts 
   SET 
     title = '{{ $json.title }}',
     subtitle = '{{ $json.subtitle }}',
     summary = '{{ $json.summary }}',
     episodes_count = {{ $json.episodes_count }},
     updated_at = NOW()
   WHERE user_id = '{{ $json.userId }}'
   ```

4. **Return Response**
   ```json
   {
     "success": true,
     "podcast": "{{ $json }}",
     "message": "Podcast data synced from Megaphone"
   }
   ```

### 2. `/webhook/sync-megaphone-episodes`
**Purpose**: Sync episodes from Megaphone to Supabase episodes table

**Trigger**: HTTP Webhook
- Method: POST  
- Body: `{ "podcastId": "megaphone_id", "userId": "user_id" }`

**Workflow Steps**:
1. **Get Episodes from Megaphone** (HTTP Request Node)
   - URL: `https://cms.megaphone.fm/api/podcasts/{{ $json.podcastId }}/episodes`
   - Headers: `Authorization: Bearer 359a75d62bfb7e0c5214ac2404d04bc4`

2. **Get Podcast UUID** (Supabase Node)
   ```sql
   SELECT id FROM podcasts WHERE megaphone_id = '{{ $json.podcastId }}'
   ```

3. **Upsert Episodes** (Loop + Supabase Node)
   ```sql
   INSERT INTO episodes (
     podcast_id, megaphone_episode_id, title, summary, 
     published_at, duration, status, file_url, 
     play_count, download_count, created_at, updated_at
   ) VALUES (
     '{{ $json.podcast_id }}', '{{ $json.id }}', '{{ $json.title }}', 
     '{{ $json.summary }}', '{{ $json.published_at }}', {{ $json.duration }}, 
     '{{ $json.status }}', '{{ $json.file_url }}', {{ $json.play_count }}, 
     {{ $json.download_count }}, NOW(), NOW()
   )
   ON CONFLICT (megaphone_episode_id) DO UPDATE SET
     title = EXCLUDED.title,
     summary = EXCLUDED.summary,
     published_at = EXCLUDED.published_at,
     duration = EXCLUDED.duration,
     status = EXCLUDED.status,
     play_count = EXCLUDED.play_count,
     download_count = EXCLUDED.download_count,
     updated_at = NOW()
   ```

4. **Return Response**
   ```json
   {
     "success": true,
     "episodeCount": {{ $json.length }},
     "episodes": "{{ $json }}",
     "message": "Episodes synced from Megaphone"
   }
   ```

### 3. `/webhook/create-episodes` (Enhanced)
**Purpose**: Create episodes in Megaphone AND save to Supabase

**Existing workflow enhanced with**:
- After creating episodes in Megaphone
- Save each episode to Supabase episodes table
- Return both Megaphone response and Supabase data

## Environment Variables Needed
```
MEGAPHONE_API_TOKEN=359a75d62bfb7e0c5214ac2404d04bc4
SUPABASE_URL=https://etzrlqtqjvqqjjeqpkrb.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Testing
1. Login → Should sync podcast data
2. Create episodes → Should save to Supabase  
3. Manual sync → Should fetch latest episodes
4. Auto-refresh → Should keep data fresh