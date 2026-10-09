-- Migrasi 001: Foreign Keys, Indexes, dan Hardening Integritas Data
-- Database: PostgreSQL (KBM Printing)

-- 1. Pastikan Foreign Key constraint aktif pada kas_masuk (id_order -> orders.id_order)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'kas_masuk_id_order_fkey'
  ) THEN
    ALTER TABLE kas_masuk
      ADD CONSTRAINT kas_masuk_id_order_fkey
      FOREIGN KEY (id_order) REFERENCES orders(id_order)
      ON DELETE SET NULL;
  END IF;
END $$;

-- 2. Performance & Integrity Indexes
-- Mempercepat filter status_order & sorting order
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status_order);
CREATE INDEX IF NOT EXISTS idx_orders_tanggal_id ON orders(tanggal DESC, id_order DESC);

-- Mempercepat relasi kas_masuk ke order & filter status_verifikasi
CREATE INDEX IF NOT EXISTS idx_kas_masuk_id_order ON kas_masuk(id_order);
CREATE INDEX IF NOT EXISTS idx_kas_masuk_status ON kas_masuk(status_verifikasi);
CREATE INDEX IF NOT EXISTS idx_kas_masuk_tanggal_id ON kas_masuk(tanggal DESC, id_kas_masuk DESC);

-- Mempercepat sorting buku kas keluar
CREATE INDEX IF NOT EXISTS idx_kas_keluar_tanggal_id ON kas_keluar(tanggal DESC, id_kas_keluar DESC);
