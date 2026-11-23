# 📚 KBM Printing Enterprise Suite — v1.1.29 Production Release

> **Sistem Terpadu Manajemen Operasional & Keuangan Percetakan Buku**  
> *Perbaikan Kritis Reaktivitas Detail Order, Pool Koneksi Database Cloudflare Workers, dan Shortcut Langsung Catat Bayar.*

---

## 🏛️ Gambaran Rilis (Release Highlights)

Pembaruan **v1.1.29** mengatasi kendala operasional kasir dan pencatatan pembayaran pesanan, di mana sebelumnya operator menemui tampilan error *"Order Tidak Ditemukan"* saat hendak mencatat pembayaran. Pembaruan ini mengoptimalkan arsitektur koneksi database serverless, menyempurnakan reaktivitas routing Ionic Vue, dan mempermudah alur kerja operator kasir dengan tombol aksi langsung.

### 1. ⚡ Shortcut Langsung `+ Bayar` di Daftar Order (`OrderListView`)
* **Tombol Cepat Catat Bayar**:
  * Ditambahkan tombol aksi **`+ Bayar`** (warna hijau emerald) langsung pada kolom Aksi di tabel Daftar Order untuk setiap pesanan yang belum lunas (`BELUM_BAYAR` atau `DP`).
* **Memangkas Alur Kerja**:
  * Operator kasir tidak lagi diwajibkan membuka halaman Detail terlebih dahulu hanya untuk mencatat pembayaran masuk, sehingga alur transaksi lebih cepat dan tahan gangguan rendering halaman.

### 2. 🛡️ Perbaikan Reaktivitas & Caching Ionic Vue (`OrderDetailView`)
* **Passing Route Params sebagai Props**:
  * Rute `/order/:id` kini menggunakan `props: true` pada `router/index.ts` untuk memastikan ID pesanan diteruskan secara deterministik ke komponen.
* **Watcher & Computed Fallback**:
  * `orderId` kini mendeteksi props, params, dan query string secara reaktif.
  * Ditambahkan `watch(() => [route.params.id, props.id], ...)` dengan opsi `{ immediate: true }` agar ketika berpindah antar pesanan dalam DOM cache Ionic, data pesanan dan riwayat kas masuk selalu dimuat ulang (*auto-fetch*).
* **Peningkatan Pesan Fallback**:
  * Teks error kini menampilkan ID pesanan yang sedang diproses (`{{ orderId || 'yang dipilih' }}`) dan tombol *Muat Ulang* mengeksekusi *force reload*.

### 3. 🗄️ Optimasi Pool Koneksi Database Worker (`EMAXPOOLSREACHED`)
* **Singleton Pool Per-Isolate**:
  * Mengganti pembuatan instance `postgres(dbUrl, { max: 5 })` per-request pada [packages/server/src/index.ts](file:///media/rasyiqi/7653717A1C07B131/KBM-Pinting/packages/server/src/index.ts) dengan lazy singleton `getWorkerSql(dbUrl)` (`max: 1`, `idle_timeout: 20s`, `connect_timeout: 10s`).
  * Mencegah kebocoran koneksi ke PgBouncer Sumobase (port 6432) akibat pembekuan (*freezing*) isolate serverless yang sebelumnya memicu error `(EMAXPOOLSREACHED) max pools count reached`.
* **Deployment Terverifikasi**:
  * Dideploy dan terverifikasi di akun resmi **`karyabaktimakmur@gmail.com`** (Account ID: `45384fbd4f0ba09a31ad5bcd47510db5`) pada endpoint [kbm-api.karyabaktimakmur.workers.dev](https://kbm-api.karyabaktimakmur.workers.dev) (Version ID: `0b6ac215-0882-4e8c-81ab-e61330d555b2`).

---

## 📦 Matriks Distribusi Aplikasi (Production Packages)

| Aplikasi | Platform | Target Pengguna | Peran & Kapabilitas Utama |
| :--- | :---: | :--- | :--- |
| **Aplikasi 1: Operasional Percetakan**<br>*(Order, SPK & Kasir)* | 🖥️ Windows (`.exe`)<br>📱 Android (`.apk`) | Tim CS, Estimator, & Operator Produksi | • Tombol shortcut `+ Bayar` langsung dari daftar order<br>• Perbaikan reaktivitas halaman Detail Order<br>• Kelola multi-item Biaya Penanganan & kalkulasi harga<br>• Cetak invoice, SPK & kirim rincian WA |
| **Aplikasi 2: Dashboard Owner & Keuangan**<br>*(Monitoring & Buku Kas)* | 🖥️ Windows (`.exe`)<br>📱 Android (`.apk`) | Owner, Manajer Keuangan, & Pimpinan | • Monitoring omzet & pembukuan kas harian terverifikasi<br>• Verifikasi transfer, tolak transfer, & refund kas<br>• Akses audit trail perubahan spesifikasi order & biaya<br>• Ekspor rekap keuangan ke Microsoft Excel (`.xlsx`) |

---

### 📥 Unduhan Paket Instalasi Resmi (v1.1.29)

#### 🖥️ Desktop Windows (PC Meja Operasional & PC Pimpinan)
* **[KBM-Operasional-Setup.exe](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.29/KBM-Operasional-Setup.exe)**  
* **[KBM-Owner-Setup.exe](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.29/KBM-Owner-Setup.exe)**  

#### 📱 Mobile Android (Smartphone & Tablet)
* **[KBM-Operasional.apk](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.29/KBM-Operasional.apk)**  
* **[KBM-Owner.apk](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.29/KBM-Owner.apk)**  

---

*Build & Release Timestamp: 23 November 2026 — Cloudflare Workers API Production Sync.*
