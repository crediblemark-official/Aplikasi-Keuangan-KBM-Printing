-- Migrasi 003: Tambah Kolom Biaya Penanganan (Biaya Lain-lain) pada Tabel orders
-- KBM Printing

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS penanganan_nama VARCHAR(255) DEFAULT '',
  ADD COLUMN IF NOT EXISTS penanganan_qty NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS penanganan_harga NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS biaya_penanganan NUMERIC(15,2) DEFAULT 0;
