
-- SQL to manually set coordinates for 'Batulayar' (if exists) or insert a dummy project for visualization
-- Coordinates: -8.507, 116.072

-- 1. Update existing projects named 'Batulayar' (exact match)
UPDATE projects 
SET latitude = -8.507, longitude = 116.072 
WHERE desa ILIKE 'Batulayar';

-- 2. Optional: If no Batulayar project exists, insert one dummy project to visualize the dot
INSERT INTO projects (
    desa, 
    kecamatan, 
    pekerjaan, 
    pagu_anggaran, 
    latitude, 
    longitude, 
    keterangan
)
SELECT 
    'Batulayar', 
    'Batulayar', 
    'Contoh Project Batulayar', 
    150000000, 
    -8.507, 
    116.072, 
    'Titik Koordinat Manual'
WHERE NOT EXISTS (
    SELECT 1 FROM projects WHERE desa ILIKE 'Batulayar'
);
