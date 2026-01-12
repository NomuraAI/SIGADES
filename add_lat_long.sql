-- SQL Migration Script to add latitude and longitude columns
-- Run this in your Supabase SQL Editor

-- Add 'latitude' column (double precision)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;

-- Add 'longitude' column (double precision)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Optional: Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name IN ('latitude', 'longitude');
