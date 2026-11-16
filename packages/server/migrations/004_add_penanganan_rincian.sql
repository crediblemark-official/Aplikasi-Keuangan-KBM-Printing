-- Migrasi 004: Tambah Kolom penanganan_rincian (JSONB) pada Tabel orders
-- Mendukung multi-item biaya penanganan (biaya lain-lain)
-- KBM Printing

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS penanganan_rincian JSONB DEFAULT '[]'::jsonb;
