-- Standardize Data Structure Migration
-- 1. Rename 'desa' to 'desa_kelurahan'
DO $$
BEGIN
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'desa') THEN
        ALTER TABLE projects RENAME COLUMN desa TO desa_kelurahan;
    END IF;
END $$;

-- 2. Ensure 'latitude' and 'longitude' exist and are populated
-- If 'lat' exists, move data to 'latitude' if 'latitude' is null
DO $$
BEGIN
    -- Ensure target columns exist
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'latitude') THEN
        ALTER TABLE projects ADD COLUMN latitude DOUBLE PRECISION;
    END IF;
    
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'longitude') THEN
        ALTER TABLE projects ADD COLUMN longitude DOUBLE PRECISION;
    END IF;

    -- Migrate data from old columns if they exist
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'lat') THEN
        UPDATE projects SET latitude = lat WHERE latitude IS NULL;
    END IF;
    
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'lng') THEN
        UPDATE projects SET longitude = lng WHERE longitude IS NULL;
    END IF;
END $$;

-- 3. Drop old columns if they exist (lat, lng)
-- We keep 'lat'/'lng' drop optional or commented out if we want to be safe, but plan said to drop.
-- Let's drop them to force consistency.
ALTER TABLE projects DROP COLUMN IF EXISTS lat;
ALTER TABLE projects DROP COLUMN IF EXISTS lng;

-- 4. Verify other columns exist, if not add them
ALTER TABLE projects ADD COLUMN IF NOT EXISTS perangkat_daerah TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS program TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS kegiatan TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS sub_kegiatan TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS pekerjaan TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS pagu_anggaran NUMERIC;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS kode_desa TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS kode_kecamatan TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS kecamatan TEXT;
