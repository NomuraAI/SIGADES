-- SQL Migration Script to update 'projects' table
-- Run this in your Supabase SQL Editor

-- 1. Remove the 'status_desa' column
ALTER TABLE projects DROP COLUMN IF EXISTS status_desa;

-- 2. Add 'jumlah_angka_kemiskinan' column (integer, default 0)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS jumlah_angka_kemiskinan INTEGER DEFAULT 0;

-- 3. Add 'jumlah_balita_stunting' column (integer, default 0)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS jumlah_balita_stunting INTEGER DEFAULT 0;

-- Optional: Verify the changes by selecting one row
SELECT * FROM projects LIMIT 1;
