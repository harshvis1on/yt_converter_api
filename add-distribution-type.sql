-- Migration: Add distribution_type field to podcasts table
-- Run this in your Supabase SQL Editor

-- Add distribution_type column to podcasts table
ALTER TABLE podcasts ADD COLUMN IF NOT EXISTS distribution_type TEXT DEFAULT 'audio';

-- Add constraint to ensure only valid values
ALTER TABLE podcasts ADD CONSTRAINT IF NOT EXISTS check_distribution_type 
    CHECK (distribution_type IN ('audio', 'video'));

-- Add index for better performance when filtering by distribution type
CREATE INDEX IF NOT EXISTS idx_podcasts_distribution_type ON podcasts(distribution_type);

-- Update existing podcasts to have 'audio' as default if they don't have this field
UPDATE podcasts 
SET distribution_type = 'audio' 
WHERE distribution_type IS NULL;

-- Verify the changes
SELECT id, title, distribution_type 
FROM podcasts 
LIMIT 5;