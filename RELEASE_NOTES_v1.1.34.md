# 📚 KBM Printing Enterprise Suite — v1.1.34 Stability & Failover Release

> **Sistem Terpadu Manajemen Operasional & Keuangan Percetakan Buku**  
> *Perbaikan menyeluruh keandalan database PostgreSQL, navigasi antarmuka Electron/Android, stabilitas form transaksi, serta auto-failover Cloudflare Workers.*

---

## 🏛️ Ringkasan Perbaikan (v1.1.31 – v1.1.34)

Rilis **v1.1.34** merangkum seluruh perbaikan kritis untuk mengatasi masalah *"awalnya bisa beberapa kali, lalu tiba-tiba macet/error"*, crash navigasi halaman Order, serta error transaksi `Cannot set properties of undefined (setting 'onclose')` dan `EMAXPOOLSREACHED`.

### 1. 🛠️ Perbaikan Navigasi & Stabilitas Form Aplikasi (`App 1 & Shared Client`)
* **Perbaikan Crash Navigasi Detail Order (`OrderDetailView.vue`):**
  * Memperbaiki *Temporal Dead Zone (TDZ)* pada `watch(..., { immediate: true })` yang sebelumnya memicu `ReferenceError: Cannot access 'loadDataPromise' before initialization` dan merusak `<IonRouterOutlet>` (`TypeError: instance.update is not a function`) sehingga tombol `+ Bayar` / `Detail →` menjadi beku.
* **Reset State Pembayaran & Order Baru (`useNewPaymentForm.ts`, `NewPaymentView.vue`, `NewOrderView.vue`):**
  * Mereset pilihan jenis pembayaran, nominal, keterangan, lampiran foto, dan flag interaksi saat berpindah target `id_order`, serta mencegah *double-submit* saat membuat order baru.
* **Keamanan Timeout & Kuota Cache (`gasClient.ts`):**
  * Menambahkan `AbortController` cleanup pada `fetchWithTimeout`, mencegah respons HTTP error menyalakan status *offline* palsu, serta memangkas `foto_base64` dari log sinkronisasi agar tidak memenuhi kuota `localStorage` 5 MB.

### 2. ⚡ Perbaikan Backend Cloudflare Workers & Koneksi PostgreSQL (`kbm-api`)
* **Perbaikan Transaksi `sql.begin()` (`max_pipeline: 1`):**
  * Mengatasi error `TypeError: Cannot set properties of undefined (setting 'onclose')` pada `postgres.js` saat menyimpan kas masuk, kas keluar, dan order baru (`max_pipeline: 0` sebelumnya melewati callback `onexecute(connection)`).
* **Anti-Deadlock & Lazy DB Connection (`index.ts`, `financeService.ts`, `db.ts`):**
  * Menjalankan koneksi database secara *lazy* per-request dengan penutupan koneksi eksplisit (`db.end()`) dan eksekusi sekuensial pada `getFinanceBundle` untuk mencegah *hang* pada pooler Supavisor.
* **Direct Connection + Multi-Endpoint Auto-Failover (`65437` → `6433` → `6432`):**
  * Menggunakan jalur utama **Direct Connection (`65437`)** agar terhindar dari batas `EMAXPOOLSREACHED` pooler bersama `6432`, lengkap dengan *auto-failover* aman pada error handshake menuju Session Pooler (`6433`) dan Transaction Pooler (`6432`).
* **Akurasi Periode ID & Invoice WIB (`idGenerator.ts`, `orderService.ts`):**
  * Memastikan penomoran `ORD-YYYYMM-XXX`, `KM-YYYYMM-XXX`, `KK-YYYYMM-XXX`, dan `INV-...` selalu mengikuti zona waktu `Asia/Jakarta` (WIB).

---

## 📦 Matriks Distribusi Aplikasi (Production Packages)

| Aplikasi | Platform | Target Pengguna | Peran & Kapabilitas Utama |
| :--- | :---: | :--- | :--- |
| **Aplikasi 1: Operasional Percetakan**<br>*(Order, SPK & Kasir)* | 🖥️ Windows (`.exe`)<br>📱 Android (`.apk`) | Tim CS, Estimator, & Operator Produksi | • Navigasi stabil antara `Daftar Order`, `Detail Order`, `+ Bayar`, & `Faktur`<br>• Sinkronisasi langsung ke PostgreSQL live via Cloudflare Workers (`kbm-api`)<br>• Pencatatan order, cicilan DP/pelunasan, upload bukti, & cetak invoice/SPK |
| **Aplikasi 2: Dashboard Owner & Keuangan**<br>*(Monitoring & Buku Kas)* | 🖥️ Windows (`.exe`)<br>📱 Android (`.apk`) | Owner, Manajer Keuangan, & Pimpinan | • Monitoring omzet, piutang, & buku kas harian real-time<br>• Verifikasi kas masuk, tolak transfer, refund, & audit trail perubahan order<br>• Ekspor rekap keuangan ke Microsoft Excel (`.xlsx`) |

---

### 📥 Unduhan Paket Instalasi Resmi (v1.1.34)

#### 🖥️ Desktop Windows (PC Meja Operasional & PC Pimpinan)
* **[KBM-Operasional-Setup.exe](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.34/KBM-Operasional-Setup.exe)**
* **[KBM-Owner-Dashboard-Setup.exe](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.34/KBM-Owner-Dashboard-Setup.exe)**

#### 📱 Mobile Android (Smartphone & Tablet)
* **[KBM-Operasional.apk](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.34/KBM-Operasional.apk)**
* **[KBM-Owner-Dashboard.apk](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.34/KBM-Owner-Dashboard.apk)**

---

*Build & Release Timestamp: 25 November 2026 — Cloudflare Workers API + Direct PostgreSQL Failover.*
