-- Add strata_desa column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS strata_desa INTEGER;
