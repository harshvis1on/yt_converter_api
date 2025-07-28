-- Supabase Database Schema for PodPay
-- Run these SQL commands in your Supabase SQL Editor to create the required tables

-- Table for storing podcast details (replaces podcast_preferences)
CREATE TABLE IF NOT EXISTS podcasts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    
    -- Megaphone Details
    megaphone_id TEXT UNIQUE NOT NULL, -- Megaphone podcast ID
    megaphone_uid TEXT UNIQUE NOT NULL, -- Megaphone UID (e.g., PODAGEN3818736064)
    feed_url TEXT NOT NULL, -- RSS feed URL
    network_id TEXT,
    
    -- Podcast Information
    title TEXT NOT NULL,
    subtitle TEXT,
    summary TEXT,
    author TEXT,
    language TEXT DEFAULT 'en',
    explicit BOOLEAN DEFAULT FALSE,
    primary_category TEXT,
    secondary_category TEXT,
    podcast_type TEXT DEFAULT 'serial',
    copyright TEXT,
    owner_name TEXT,
    owner_email TEXT,
    link TEXT, -- YouTube channel URL
    keywords TEXT,
    
    -- Image/Artwork
    image_url TEXT, -- Supabase storage URL
    megaphone_image_url TEXT, -- Megaphone processed image URL
    
    -- Status & Metadata
    status TEXT DEFAULT 'active', -- active, inactive, error
    episodes_count INTEGER DEFAULT 0,
    episode_limit INTEGER DEFAULT 5000,
    itunes_active BOOLEAN DEFAULT FALSE,
    slug TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    megaphone_created_at TIMESTAMP WITH TIME ZONE,
    megaphone_updated_at TIMESTAMP WITH TIME ZONE
);

-- Table for storing episodes
CREATE TABLE IF NOT EXISTS episodes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    podcast_id UUID NOT NULL REFERENCES podcasts(id) ON DELETE CASCADE,
    
    -- Episode Information
    title TEXT NOT NULL,
    summary TEXT,
    content TEXT, -- Episode description/content
    
    -- Megaphone Details
    megaphone_episode_id TEXT UNIQUE, -- Megaphone episode ID if synced
    megaphone_uid TEXT, -- Megaphone episode UID
    
    -- Media Files
    file_url TEXT, -- Audio file URL
    file_size BIGINT, -- File size in bytes
    duration INTEGER, -- Duration in seconds
    mime_type TEXT DEFAULT 'audio/mpeg',
    
    -- YouTube Integration
    youtube_video_id TEXT, -- Original YouTube video ID
    youtube_url TEXT, -- YouTube video URL
    
    -- Publishing
    status TEXT DEFAULT 'draft', -- draft, scheduled, published, processing, failed
    published_at TIMESTAMP WITH TIME ZONE,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    
    -- Analytics
    play_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    
    -- Metadata
    episode_number INTEGER,
    season_number INTEGER DEFAULT 1,
    episode_type TEXT DEFAULT 'full', -- full, trailer, bonus
    explicit BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing payout details
CREATE TABLE IF NOT EXISTS payout_details (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    podcast_id TEXT,
    beneficiary_entity_type TEXT NOT NULL,
    beneficiary_name TEXT,
    beneficiary_first_name TEXT,
    beneficiary_last_name TEXT,
    payout_email TEXT NOT NULL,
    bank_country TEXT NOT NULL,
    account_currency TEXT NOT NULL,
    bank_name TEXT,
    account_number TEXT NOT NULL,
    routing_number TEXT NOT NULL,
    transfer_method TEXT DEFAULT 'LOCAL',
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    country TEXT NOT NULL,
    airwallex_beneficiary_id TEXT,
    status TEXT DEFAULT 'pending', -- pending, active, failed, error
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_podcasts_user_id ON podcasts(user_id);
CREATE INDEX IF NOT EXISTS idx_podcasts_channel_id ON podcasts(channel_id);
CREATE INDEX IF NOT EXISTS idx_podcasts_megaphone_id ON podcasts(megaphone_id);
CREATE INDEX IF NOT EXISTS idx_podcasts_megaphone_uid ON podcasts(megaphone_uid);
CREATE INDEX IF NOT EXISTS idx_episodes_podcast_id ON episodes(podcast_id);
CREATE INDEX IF NOT EXISTS idx_episodes_status ON episodes(status);
CREATE INDEX IF NOT EXISTS idx_episodes_published_at ON episodes(published_at);
CREATE INDEX IF NOT EXISTS idx_episodes_youtube_video_id ON episodes(youtube_video_id);
CREATE INDEX IF NOT EXISTS idx_episodes_megaphone_episode_id ON episodes(megaphone_episode_id);
CREATE INDEX IF NOT EXISTS idx_payout_details_user_id ON payout_details(user_id);
CREATE INDEX IF NOT EXISTS idx_payout_details_podcast_id ON payout_details(podcast_id);
CREATE INDEX IF NOT EXISTS idx_payout_details_status ON payout_details(status);

-- Create Row Level Security (RLS) policies if needed
-- ALTER TABLE podcast_preferences ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE payout_details ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (uncomment if you want user-level access control):
-- CREATE POLICY "Users can view own podcast preferences" ON podcast_preferences FOR SELECT USING (auth.uid()::text = user_id);
-- CREATE POLICY "Users can insert own podcast preferences" ON podcast_preferences FOR INSERT WITH CHECK (auth.uid()::text = user_id);
-- CREATE POLICY "Users can update own podcast preferences" ON podcast_preferences FOR UPDATE USING (auth.uid()::text = user_id);

-- CREATE POLICY "Users can view own payout details" ON payout_details FOR SELECT USING (auth.uid()::text = user_id);
-- CREATE POLICY "Users can insert own payout details" ON payout_details FOR INSERT WITH CHECK (auth.uid()::text = user_id);
-- CREATE POLICY "Users can update own payout details" ON payout_details FOR UPDATE USING (auth.uid()::text = user_id);