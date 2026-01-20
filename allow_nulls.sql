
-- SQL Migration to allow NULL values in projects table
-- Run this in Supabase SQL Editor

ALTER TABLE projects ALTER COLUMN aksi_prioritas DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN perangkat_daerah DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN program DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN kegiatan DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN sub_kegiatan DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN pekerjaan DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN desa DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN kecamatan DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN luas_wilayah DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN pagu_anggaran DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN jumlah_penduduk DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN jumlah_angka_kemiskinan DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN jumlah_balita_stunting DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN potensi_desa DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN keterangan DROP NOT NULL;
