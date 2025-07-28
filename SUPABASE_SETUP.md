# Supabase Setup Guide

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy your project URL and anon key to `.env`:
   ```
   REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key
   ```

## 2. Create Database Tables

1. Go to your Supabase dashboard
2. Click "SQL Editor" in the sidebar
3. Copy and paste the contents of `supabase-schema.sql`
4. Click "Run" to create the tables

## 3. Create Storage Bucket

1. Go to "Storage" in your Supabase dashboard
2. Click "Create bucket"
3. Name: `podcast-images`
4. Set as **Public bucket** ✅
5. Click "Create bucket"

## 4. Configure Storage Policies

Add these policies in the Storage > Policies section:

### For `podcast-images` bucket:

**INSERT Policy:**
```sql
CREATE POLICY "Allow public uploads" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'podcast-images');
```

**SELECT Policy:**
```sql
CREATE POLICY "Allow public access" ON storage.objects 
FOR SELECT USING (bucket_id = 'podcast-images');
```

## 5. Test the Integration

1. Start your React app: `npm start`
2. Go through the podcast creation flow
3. Upload a custom artwork image
4. Check your Supabase Storage to see the uploaded image
5. Check your database tables for saved preferences

## Folder Structure in Storage

Images will be organized as:
```
podcast-images/
├── artwork/
│   ├── 2024-01-15-abc123.jpg
│   └── 2024-01-15-def456.png
```

## Database Schema

### `podcast_preferences` Table
- Stores all podcast settings and preferences
- Links to YouTube channel via `channel_id`
- Includes artwork URLs from Supabase Storage

### `payout_details` Table  
- Stores Airwallex beneficiary information
- Tracks payout setup status
- Links to podcasts via `podcast_id`
- Handles error logging for failed setups

## Environment Variables Required

```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key

# n8n Configuration (existing)
REACT_APP_N8N_BASE_URL=https://n8n-6s78.onrender.com
REACT_APP_DEV_MODE=false
```

## Troubleshooting

### Image Upload Issues
- Check bucket exists and is public
- Verify storage policies are set
- Check browser console for CORS errors

### Database Issues  
- Verify tables were created successfully
- Check RLS policies if using authentication
- Ensure user_id format matches your auth system

### Environment Issues
- Restart your React app after adding .env variables
- Verify no spaces around = in .env file
- Check for typos in variable names

## Next Steps

Once setup is complete:
1. Test image uploads in your form
2. Verify data is saved to database tables  
3. Check that N8N receives the Supabase image URLs
4. Test the full podcast creation workflow