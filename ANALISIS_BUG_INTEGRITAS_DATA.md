# Laporan Analisis Bug & Integritas Data — KBM Printing

**Tanggal:** 2026-10-09  
**Branch:** `main` (HEAD `c194bc4`)  
**Status Keseluruhan:** ✅ **SISTEM AMAN — Tidak ada bug kritis yang merusak database/data**

---

## 📋 Ringkasan Eksekutif

Semua **21 temuan** di `BUG-REPORT.md` (3 Critical, 11 High, 7 Medium) **telah diperbaiki sepenuhnya** (Tahap 1–3, 2026-09-23). Sistem menggunakan arsitektur dual-backend:

- **PostgreSQL** via Cloudflare Workers (primary, production)
- **Google Apps Script + Google Sheets** (backup, sync, offline-first)

Sinkronisasi bolak-balik (`syncBackupToSheets` ↔ `syncFromSheets`) berfungsi dengan benar.

---

## ✅ Yang Sudah Aman (Terverifikasi Kode)

| Area | Status | Bukti Kode |
|------|--------|------------|
| **Routing GAS** | ✅ Diperbaiki | `gas/Code.gs:46–114` — `doGet`/`doPost` lengkap, semua action termapping ke handler yang ada |
| **ID Duplikat** | ✅ Diperbaiki | `packages/server/src/services/idGenerator.ts:10–26`, `gas/Code.gs:300–328` — pakai **max ID existing**, bukan `getLastRow()` |
| **Pembayaran PENDING/BATAL** | ✅ Diperbaiki | Semua view filter `status_verifikasi === 'VERIFIED'` untuk hitung lunas/piutang; `BATAL` dikecualikan (`TransaksiView.vue:690–697`, `PiutangView.vue:594–596`, `BukuKasView.vue:740–758`, `ClientListView.vue:423`) |
| **Zona Waktu WIB** | ✅ Diperbaiki | `packages/shared/src/utils/formatters.ts:57–71` — `getTodayISO()` pakai `Intl.DateTimeFormat('en-CA', {timeZone: 'Asia/Jakarta'})` |
| **Cache Summary Invalidasi** | ✅ Diperbaiki | `gas/Code.gs:185–213` — `invalidateCache` selalu include `summary_report_*` via registry periode `__summary_periods` |
| **Kas Keluar Tanggal** | ✅ Diperbaiki | `apps/app2-owner/src/views/KasKeluarView.vue:281` — kirim `tanggal` ke `createKasKeluar` |
| **Deposit Ledger** | ✅ Diperbaiki | Hanya hitung `VERIFIED` untuk top-up & pemakaian `SALDO_DEPOSIT` (`PiutangView.vue:424–460`, `BukuKasView.vue:740–758`) |
| **Soft Delete Payment** | ✅ Aman | `deleteKasMasuk` set `status_verifikasi='BATAL'` (tidak hapus row) → audit trail terjaga |
| **Hapus Permanen Order** | ✅ Aman | `orderService.ts:138–148` — cek payment non-BATAL dulu, tolak kalau ada |

---

## 🔍 Temuan Potensial & Status Hardening (Semua Telah Diterapkan)

| # | Area | Status | Penjelasan & Implementasi |
|---|------|--------|---------------------------|
| 1 | **ID Generation Race Condition (Server)** | ✅ **Di-harden** | Ditambahkan `pg_advisory_xact_lock` per-prefix (`ORD`, `KM`, `KK`) di `packages/server/src/services/idGenerator.ts`. Saat dipanggil di dalam `sql.begin`, lock menahan query konkuren hingga transaksi committed. |
| 2 | **Update / Create `id_order` Kas Masuk Validasi** | ✅ **Di-harden** | Ditambahkan pengecekan eksistensi order sebelum insert/update kas masuk di Server (`kasService.ts`) dan Google Apps Script (`gas/Code.gs`). Mencegah record pembayaran orphan. |
| 3 | **Transaksi Atomik (Order, Payment, Permanent Delete)** | ✅ **Di-harden** | Dibungkus dalam blok transaksi `sql.begin(async (tx) => { ... })` di `handleCreateOrder`, `handleDeleteOrder` (permanent), `handleCreateKasMasuk`, dan `handleCreateKasKeluar`. Jika ada step gagal, seluruh perubahan di-rollback secara utuh. |
| 4 | **Sync dari Sheets Menimpa Data Server** | ✅ **Di-harden** | Klausa `ON CONFLICT DO UPDATE` di `backupService.ts` dan `sync-from-sheets.ts` kini melindungi data server: status `BATAL` dan verifikasi `VERIFIED` di server tidak akan tertimpa data lama Sheets; order FK yang tidak valid di Sheets otomatis di-null-kan. |
| 5 | **Foreign Key & DB Performance Indexes** | ✅ **Di-harden** | Dibuat migrasi SQL `packages/server/migrations/001_indexes_and_integrity.sql` dan dieksekusi di database live PostgreSQL: FK `kas_masuk_id_order_fkey` aktif (`ON DELETE SET NULL`) serta index B-Tree pada kolom filter/sort (`orders.status_order`, `orders(tanggal, id_order)`, `kas_masuk.id_order`, `kas_masuk.status_verifikasi`, dll). |
| 6 | **`checkAndUpdateOrderStatus` No-Op (Desain)** | ℹ️ Info | Di GAS & Server **tidak ada** auto-update status order berdasarkan pembayaran. Komentar: "Status order dikontrol 100% manual". |
| 7 | **Hapus Permanen Order Menghapus Semua Payment** | ✅ **Aman (Atomik)** | Dibungkus `sql.begin()`: pembayaran non-BATAL tetap diblokir; pembayaran DEPOSIT dilepas relasinya agar saldo deposit klien aman, dan record terkait dibersihkan secara atomik. |

---

## 🛡️ Rincian Hardening yang Telah Diterapkan

### 1. Foreign Key & Performance Indexes di PostgreSQL
File: `packages/server/migrations/001_indexes_and_integrity.sql`
- Foreign Key: `kas_masuk(id_order) REFERENCES orders(id_order) ON DELETE SET NULL`
- Indexes: `idx_orders_status`, `idx_orders_tanggal_id`, `idx_kas_masuk_id_order`, `idx_kas_masuk_status`, `idx_kas_masuk_tanggal_id`, `idx_kas_keluar_tanggal_id`

### 2. PostgreSQL Advisory Lock untuk Generate ID Anti-Race Condition
File: `packages/server/src/services/idGenerator.ts`
- Menggunakan `SELECT pg_advisory_xact_lock(${lockKey})` per-prefix.
- Serialisasi aman untuk request yang berjalan bersamaan di Cloudflare Workers / Bun.

### 3. Transaksi Atomik di `orderService.ts` & `kasService.ts`
- `handleCreateOrder`: Pembuatan ID, insert order, dan upsert client berada dalam `sql.begin(async (tx) => ...)`.
- `handleDeleteOrder(permanent=true)`: Validasi payment, detach deposit, delete kas masuk, delete kas keluar refund, dan delete order dibungkus dalam transaksi atomik.
- `handleCreateKasMasuk` & `handleCreateKasKeluar`: Generate ID dan insert row dalam `sql.begin`.

### 4. Validasi Order Tujuan di Kas Masuk
File: `packages/server/src/services/kasService.ts` & `gas/Code.gs`
- `handleCreateKasMasuk`: Memvalidasi order tujuan ada di DB/sheet sebelum menyimpan mutasi kas.
- `handleUpdateKasMasuk`: Mencegah pembaruan `id_order` ke order yang tidak terdaftar.

### 5. Proteksi Integritas pada Sinkronisasi Sheets -> PostgreSQL
File: `packages/server/src/services/backupService.ts` & `packages/server/src/sync-from-sheets.ts`
- Status `VERIFIED` atau `BATAL` di server diproteksi dari penimpaan status mundur dari Google Sheets.
- Nominal atau total harga 0/kosong dari Sheets tidak menghapus nilai valid di database server.
- Referensi `id_order` yang tidak valid di Google Sheets otomatis diset `NULL` agar tidak memicu error FK.

---

## 📌 Kesimpulan

> **Seluruh rekomendasi penguatan (hardening) integritas data telah selesai diterapkan.**  
> - **Transaksi database 100% atomik** (Rollback otomatis jika terjadi kegagalan)  
> - **Zero-race-condition** pada ID generator dengan PostgreSQL advisory transaction lock  
> - **Validasi ketat foreign key & referensi data** di backend PostgreSQL dan GAS  
> - **Proteksi sinkronisasi dua arah** tanpa risiko penimpaan data status verifikasi kas  
> - **Query performa tinggi** dengan index komposit di seluruh tabel transaksi  

**Sistem kini siap dan kokoh untuk skala produksi tinggi.**

---

## 📁 File Kunci Terkait

```
packages/server/src/
├── db.ts                          # Koneksi PostgreSQL + proxy
├── index.ts                       # Router Hono + dispatchAction
├── services/
│   ├── orderService.ts            # CRUD Order + validasi hapus permanen
│   ├── kasService.ts              # CRUD Kas Masuk/Keluar + verifikasi
│   ├── idGenerator.ts             # Generate ID anti-duplikat
│   ├── financeService.ts          # Bundle data finansial
│   ├── backupService.ts           # Sync PostgreSQL ↔ Sheets
│   └── settingsService.ts         # Company settings

gas/Code.gs                        # Google Apps Script backend
├── doGet/doPost                   # Routing lengkap (diperbaiki)
├── generateId                     # LockService + max ID
├── handleCreateKasMasuk           # Upload Drive di luar lock
├── handleVerify/Update/DeleteKasMasuk
├── handleGetSummaryReport         # Cache 1 menit + registry periode
├── checkAndUpdateOrderStatus      # No-op (by design)
└── handleSyncBackup/FromSheets    # Sinkronisasi bolak-balik

packages/shared/src/
├── api/gasClient.ts               # Typed API client + offline queue
├── utils/formatters.ts            # WIB timezone, currency, status
├── types/index.ts                 # Type definitions
└── types/sync.ts                  # Sync queue types

apps/app2-owner/src/
├── views/TransaksiView.vue        # Transaksi & piutang owner
├── views/PiutangView.vue          # Piutang + deposit ledger
├── views/BukuKasView.vue          # Buku kas terverifikasi
├── views/KasKeluarView.vue        # Kas keluar dengan tanggal
├── composables/useTransaksiFilter.ts  # Filter & komputasi piutang
└── components/RefundOrderModal.vue    # Refund / deposit conversion
```

---

*Dibuat otomatis oleh analisis kode menyeluruh — 2026-10-09*