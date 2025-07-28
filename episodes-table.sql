-- Create episodes table for storing Megaphone episode data
CREATE TABLE episodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  podcast_id UUID REFERENCES podcasts(id) ON DELETE CASCADE,
  megaphone_episode_id TEXT UNIQUE NOT NULL,
  
  -- Episode Content
  title TEXT NOT NULL,
  summary TEXT,
  description TEXT,
  
  -- Publishing Info
  published_at TIMESTAMP WITH TIME ZONE,
  duration INTEGER, -- in seconds
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
  
  -- Media Files
  file_url TEXT,
  file_size BIGINT,
  
  -- Analytics
  play_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  
  -- Megaphone Specific
  megaphone_uid TEXT,
  megaphone_created_at TIMESTAMP WITH TIME ZONE,
  megaphone_updated_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_episodes_podcast_id ON episodes(podcast_id);
CREATE INDEX idx_episodes_status ON episodes(status);
CREATE INDEX idx_episodes_published_at ON episodes(published_at DESC);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_episodes_updated_at BEFORE UPDATE ON episodes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();