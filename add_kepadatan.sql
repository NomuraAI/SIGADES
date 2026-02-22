-- Tambahkan kolom kepadatan_penduduk ke tabel projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS kepadatan_penduduk INTEGER;
