-- Menambahkan kolom kode_desa jika belum ada
ALTER TABLE projects ADD COLUMN IF NOT EXISTS kode_desa TEXT;

-- Menambahkan kolom kode_kecamatan jika belum ada (safety precaution)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS kode_kecamatan TEXT;
