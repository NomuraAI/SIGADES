-- Hapus kolom strata_desa dari tabel projects
ALTER TABLE public.projects DROP COLUMN IF EXISTS strata_desa;
