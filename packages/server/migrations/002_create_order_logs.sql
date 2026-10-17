-- Migrasi 002: Tabel order_logs untuk audit trail dan riwayat perubahan order
CREATE TABLE IF NOT EXISTS order_logs (
  id SERIAL PRIMARY KEY,
  id_order VARCHAR(50) NOT NULL REFERENCES orders(id_order) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'CREATE', 'UPDATE', 'STATUS_CHANGE', 'RESTORE'
  actor VARCHAR(100) DEFAULT 'SISTEM',
  keterangan TEXT,
  changes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_logs_id_order ON order_logs(id_order);
CREATE INDEX IF NOT EXISTS idx_order_logs_created_at ON order_logs(created_at DESC);
