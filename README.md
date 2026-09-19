# 📚 KBM Printing — Sistem Keuangan & Operasional Percetakan Buku

Sistem manajemen operasional dan keuangan percetakan buku terintegrasi (*2-Apps Architecture*) dengan backend **Google Sheets**, **Google Drive**, dan **Google Apps Script (GAS) Web API Engine**.

---

## 🏛️ Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────────┐
│                     KBM-Pinting Monorepo                        │
├───────────────────────────────┬─────────────────────────────────┤
│  apps/app1-operasional (Mobile)│  apps/app2-owner (Desktop)      │
│  - Ionic Vue 3 + Tailwind v4  │  - Ionic Vue 3 + Tailwind v4    │
│  - Konsta UI Components       │  - Konsta UI Components         │
│  - Kunci Bawaan Android       │  - Owner/Finance Auth           │
│  - Kalkulator Spesifikasi Buku│  - Dashboard & Charts (Chart.js)│
│  - Cetak Invoice PDF Standar  │  - Verifikasi Kas Masuk         │
│  - WhatsApp Deeplink Integration│ - Manajemen Kas Keluar        │
│                               │  - Monitoring Piutang Real-time │
│                               │  - Export Laporan Excel (.xlsx) │
├───────────────────────────────┴─────────────────────────────────┤
│                   packages/shared                               │
│  - TypeScript Types & Interfaces (Order, KasMasuk, dsb)         │
│  - GAS Client API Wrapper (doGet / doPost / JSONP fallback)     │
│  - Formatters (Rupiah, Tanggal, ID Generator)                   │
│  - Image Compressor (Canvas Base64 untuk Bukti Transfer/Nota)  │
│  - Buku Pricelist Engine (Ukuran, Kertas, Finishing)            │
├─────────────────────────────────────────────────────────────────┤
│                   gas/Code.gs (Backend Engine)                  │
│  - Google Apps Script Web App API                               │
│  - Google Sheets Database (Orders, Kas_Masuk, Kas_Keluar, Clients)│
│  - Google Drive File Storage (Folder Invoices, Bukti, Nota)    │
│  - LockService untuk Data Concurrency & Safety                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Panduan Setup & Deployment Cepat

### Langkah 1: Setup Backend Google Sheets & Apps Script

1. **Buat Spreadsheet Baru:**
   - Buka [Google Sheets](https://sheets.new) dan buat spreadsheet baru (misal diberi nama `DB_KBM_Percetakan`).
   - Salin **Spreadsheet ID** dari URL browser:
     ```
     https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID_ANDA>/edit
     ```

2. **Buka Apps Script:**
   - Pada spreadsheet tersebut, klik menu **Extensions (Ekstensi)** > **Apps Script**.
   - Hapus kode bawaan di `Code.gs`.
   - Buka file [`gas/Code.gs`](file:///media/rasyiqi/7653717A1C07B131/KBM-Pinting/gas/Code.gs) dari proyek ini, lalu salin dan tempelkan seluruh kodenya ke editor Apps Script.
   - Ubah baris konfigurasi di baris 20-23:
     ```javascript
     const SPREADSHEET_ID = 'TEMPEL_SPREADSHEET_ID_ANDA_DI_SINI';
     const DRIVE_FOLDER_NAME = 'Percetakan_System_Drive';
     const PIN_KASIR = '1234';       // PIN login Kasir/CS
     const PASSWORD_OWNER = 'kbm2026'; // Password login Owner
     ```

3. **Inisialisasi Database Otomatis:**
   - Di toolbar Apps Script, pilih fungsi `setupDatabase` pada dropdown fungsi.
   - Klik **Run (Jalankan)** dan berikan izin akses Google (OAuth Authorization).
   - Fungsi ini akan otomatis membuat 4 sheet tab: `Orders`, `Kas_Masuk`, `Kas_Keluar`, `Clients` beserta semua header kolom dan membuat folder penyimpanan di Google Drive.

4. **Deploy sebagai Web App:**
   - Klik tombol **Deploy** > **New deployment**.
   - Pilih tipe: **Web app**.
   - Isi deskripsi: `KBM API Engine v1`.
   - **Execute as:** `Me (email Anda)`.
   - **Who has access:** `Anyone (Siapa saja)`. *(Penting agar aplikasi kasir dan owner dapat mengakses API)*.
   - Klik **Deploy** dan salin **Web App URL** yang dihasilkan (berakhiran `/exec`).

---

### Langkah 2: Konfigurasi Frontend

Buka file konfigurasi di [`packages/shared/src/api/gasClient.ts`](file:///media/rasyiqi/7653717A1C07B131/KBM-Pinting/packages/shared/src/api/gasClient.ts):

```typescript
export const CONFIG = {
  // Ganti dengan Web App URL dari deploy Langkah 1 di atas:
  GAS_URL: 'https://script.google.com/macros/s/AKfycbx.../exec',
  DEFAULT_PRINTER_TYPE: 'standard' as const, // Cetak printer biasa A4
  CURRENCY: 'IDR',
}
```

---

### Langkah 3: Menjalankan Aplikasi di Lokal (Development)

Pastikan dependensi monorepo sudah terinstal (sudah siap di folder ini):

```bash
# Menjalankan Aplikasi 1 (Operasional / Order & Produksi):
npm run dev:operasional
# Akses di: http://localhost:5173

# Menjalankan Aplikasi 2 (Owner Dashboard):
npm run dev:owner
# Akses di: http://localhost:5174
```

---

### Langkah 4: Kredensial Login Bawaan

Proteksi menggunakan **Kunci Layar Bawaan Android (Sidik Jari / Pola / PIN HP)** langsung tanpa mengetik PIN/password manual.

---

## 💻 Fitur-Fitur Utama

### 1. Aplikasi Operasional Percetakan (`apps/app1-operasional`)
- **Kunci Layar Bawaan Android:** Masuk aman & cepat via biometrik / screen lock.
- **Keep Screen Awake:** Layar HP tetap menyala tanpa sleep selama aplikasi terbuka.
- **Kalkulator Spesifikasi Cetak Buku:**
  - Pilihan Ukuran: A5, B5, A4, atau Ukuran Custom (cm).
  - Pilihan Bahan Isi: Bookpaper 57gsm, 72gsm, HVS 70gsm, 80gsm, Art Paper 120gsm, 150gsm.
  - Pilihan Cetak: Hitam Putih (BW) & Full Color (FC).
  - Pilihan Finishing Jilid: Softcover Doff/Glossy, Hardcover, Spiral Kawat, Jahit Benang.
  - Auto-kalkulasi harga subtotal instan berdasarkan kuantitas (pcs).
- **Pencatatan Pembayaran Fleksibel:**
  - Uang Muka (DP) & Pelunasan.
  - Metode: Tunai, Transfer Bank (BCA, Mandiri, BRI, BNI), QRIS.
  - Upload & Kompresi Foto Bukti Transfer (Kamera, Galeri, File Manager ke Google Drive).
- **Invoice Standar Percetakan:**
  - Diformat rapi untuk printer biasa (A4/Letter).
  - Cetak langsung via browser dialog (`window.print()`).
  - Kirim invoice langsung via WhatsApp dengan pesan otomatis & lampiran info tagihan.

### 2. Aplikasi Owner & Keuangan (`apps/app2-owner`)
- **Dashboard Eksekutif:**
  - 4 Kartu Metrik Utama: Kas Masuk Bulan Ini, Kas Keluar Bulan Ini, Estimasi Laba Bersih, dan Total Piutang Aktif.
  - Grafik Arus Kas Bulanan (Chart.js Bar Chart).
  - Komposisi Saldo per Sumber Kas (Bank BCA, Mandiri, Tunai, QRIS).
- **Kas Keluar:**
  - Input pengeluaran operasional (Bahan Baku Kertas/Tinta, Gaji/Upah Operator, Listrik/Maintenance, Ekspedisi, dsb).
  - Upload foto nota/kuitansi fisik ke Google Drive.
- **Verifikasi Kas Masuk:**
  - Filter pembayaran berstatus `PENDING`.
  - Verifikasi 1-klik untuk konfirmasi mutasi rekening bank valid.
- **Monitoring Piutang:**
  - Rekapitulasi pesanan belum lunas secara otomatis.
  - Sisa tagihan terhitung real-time.
- **Laporan & Ekspor Excel (.xlsx):**
  - Rekap pemasukan, pengeluaran, dan laba kotor/bersih.
  - Ekspor multi-sheet ke Microsoft Excel (`Rekap Keuangan`, `Rincian Kas Masuk`, `Rincian Kas Keluar`) menggunakan SheetJS.

---

## 📦 Build untuk Production / Hosting

Untuk menghasilkan bundle static HTML/CSS/JS siap hosting (misal di Vercel, Netlify, Cloudflare Pages, atau cPanel):

```bash
npm run build:all
```

- Output App 1: `apps/app1-operasional/dist`
- Output App 2: `apps/app2-owner/dist`
