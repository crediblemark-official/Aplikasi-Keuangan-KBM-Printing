# 📚 KBM Printing Enterprise Suite — v1.1.27 Production Release

> **Sistem Terpadu Manajemen Operasional & Keuangan Percetakan Buku**  
> *Penambahan Kolom & Fitur Biaya Penanganan (Biaya Lain-lain: Nama Bebas, Jumlah × Harga).*

---

## 🏛️ Gambaran Rilis (Release Highlights)

Pembaruan **v1.1.27** menghadirkan dukungan menyeluruh untuk pencatatan **Biaya Penanganan (Biaya Lain-lain)** pada aplikasi **KBM Operasional**, terintegrasi langsung mulai dari input form, kalkulasi tarif otomatis, pencatatan database, audit trail perubahaan, hingga penerbitan invoice resmi.

### 1. 🛠️ Fleksibilitas Biaya Penanganan (Biaya Lain-lain)
* **Nama Bebas (Bisa Diinput Sendiri)**:
  * Pengguna dapat memasukkan nama biaya lain-lain secara mandiri (misal: *Sertifikat*, *Plastik Shrink*, *Ongkos Kirim Khusus*, *Jasa Layout/Desain Cover*, *Plat Tambahan*, dll.).
  * Dilengkapi placeholder intuitif: `Contoh: Sertifikat`.
* **Kalkulasi Presisi (Jumlah × Harga Satuan)**:
  * Input kuantitas numerik (`Qty`) dan harga satuan dalam Rupiah (`Harga Satuan`).
  * Subtotal langsung terhitung secara otomatis (`Jumlah × Harga = Total Biaya Penanganan`).
* **Akumulasi Otomatis ke Total Tagihan**:
  * Terintegrasi ke mesin kalkulasi pricelist resmi (`calculateOrderPriceDetailed`).
  * Muncul pada kartu **Rincian Estimasi Biaya** di samping rincian cetak isi dan finishing cover/jilid.

### 2. 🗄️ Database PostgreSQL & Cloudflare Workers Backend
* **Skema Database `orders`**:
  * Penambahan kolom resmi pada PostgreSQL Sumobase:
    * `penanganan_nama` (`VARCHAR(255)`)
    * `penanganan_qty` (`NUMERIC(10,2)`)
    * `penanganan_harga` (`NUMERIC(15,2)`)
    * `biaya_penanganan` (`NUMERIC(15,2)`)
  * File migrasi versioned: `packages/server/migrations/003_add_biaya_penanganan.sql`.
* **Audit Trail & Logging Perubahan (`order_logs`)**:
  * Setiap pesanan baru yang mencakup biaya penanganan otomatis mencatat ringkasan biaya penanganan pada pembuatan pesanan.
  * Setiap revisi/edit nilai biaya penanganan atau nama penanganan otomatis tersimpan pada riwayat perubahan (*order change logs*).
* **Cloudflare Workers Deployment**:
  * Telah diverifikasi dan dideploy ke akun resmi **`karyabaktimakmur@gmail.com`** di endpoint [kbm-api.karyabaktimakmur.workers.dev](https://kbm-api.karyabaktimakmur.workers.dev).

### 3. 🖥️ Integrasi Tampilan Antarmuka (UI/UX)
* **Tabel Daftar Order (`OrderListView`)**:
  * Penambahan kolom tabel khusus **Biaya Penanganan** dengan badge nominal Rupiah dan subteks nama penanganan.
* **Detail Pesanan (`OrderDetailView`)**:
  * Menampilkan baris spesifikasi Biaya Penanganan lengkap dengan rincian `Qty × Harga`.
* **Faktur / Invoice & WhatsApp (`useInvoiceData`)**:
  * Otomatis tercantum sebagai baris item tagihan resmi pada Faktur / Bukti Pesanan cetak.
  * Otomatis terlampir pada template pesan rincian WhatsApp ke pelanggan/penerbit.
* **Beranda Operasional (`HomeView`)**:
  * Label indikator `+ Penanganan` pada tabel ringkasan pesanan aktif.

---

## 📦 Matriks Distribusi Aplikasi (Production Packages)

| Aplikasi | Platform | Target Pengguna | Peran & Kapabilitas Utama |
| :--- | :---: | :--- | :--- |
| **Aplikasi 1: Operasional Percetakan**<br>*(Order, SPK & Kasir)* | 🖥️ Windows (`.exe`)<br>📱 Android (`.apk`) | Tim CS, Estimator, & Operator Produksi | • Input Biaya Penanganan fleksibel (`Nama`, `Jumlah × Harga`)<br>• Kolom Biaya Penanganan di tabel daftar order<br>• Faktur Invoice & pesan WhatsApp otomatis memuat item penanganan<br>• Kalkulator harga spesifikasi buku & audit trail teknis |
| **Aplikasi 2: Dashboard Owner & Keuangan**<br>*(Monitoring & Buku Kas)* | 🖥️ Windows (`.exe`)<br>📱 Android (`.apk`) | Owner, Manajer Keuangan, & Pimpinan | • Monitoring omzet & pembukuan kas harian terverifikasi<br>• Verifikasi transfer, tolak transfer, & refund kas<br>• Akses log perubahan spesifikasi order & biaya tambahan<br>• Ekspor rekap keuangan ke Microsoft Excel (`.xlsx`) |

---

### 📥 Unduhan Paket Instalasi Resmi (v1.1.27)

#### 🖥️ Desktop Windows (PC Meja Operasional & PC Pimpinan)
* **[KBM-Operasional-Setup.exe](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.27/KBM-Operasional-Setup.exe)**  
* **[KBM-Owner-Setup.exe](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.27/KBM-Owner-Setup.exe)**  

#### 📱 Mobile Android (Smartphone & Tablet)
* **[KBM-Operasional.apk](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.27/KBM-Operasional.apk)**  
* **[KBM-Owner.apk](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.27/KBM-Owner.apk)**  

---

*Build & Release Timestamp: 16 November 2026 — Cloudflare Workers API Production Sync.*
