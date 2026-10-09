# 📚 KBM Printing Enterprise Suite — v1.1.17 Production Release

> **Sistem Terpadu Manajemen Operasional & Keuangan Percetakan Buku**  
> *Arsitektur Hibrida Modern: PostgreSQL Berkecepatan Tinggi, Live Mirror Google Sheets, Cron Auto-Sync 15 Menit di Cloud, dan Asisten AI Finansial Terintegrasi.*

---

## 🏛️ Gambaran Umum Rilis (Release Overview)

Pembaruan **v1.1.17** menghadirkan evolusi arsitektur data paling signifikan pada ekosistem **KBM Printing**:
1. **Mesin Database Utama (PostgreSQL Sumobase JKT)**: Memberikan respon transaksi secepat kilat tanpa terikat kuota eksekusi Google Apps Script.
2. **Penyelarasan Data Otomatis (Bi-Directional Mirroring)**: Transaksi tersinkronisasi dua arah antara **PostgreSQL** dan **Google Sheets**, menjamin bahwa catatan spreadsheet Google Drive pemilik toko selalu identik dan menjadi cadangan hidup (*live backup*).
3. **Cloudflare Scheduled Cron Auto-Sync (15 Menit)**: Sinkronisasi mandiri di cloud setiap 15 menit tanpa perlu intervensi manual atau kehadiran teknisi.
4. **Tombol Mandiri "Tarik dari Google Sheets"**: Akses instan di antarmuka aplikasi untuk menyedot transaksi versi lama ke versi baru kapan pun dibutuhkan.

---

## 💎 Sorotan Pembaruan (Key Highlights & Enhancements)

### 1. ⚡ Arsitektur Sinkronisasi Hibrida (PostgreSQL ↔ Google Sheets)
* **High-Speed Relational Engine**: Seluruh operasi transaksi kasir dan pembukuan dilayani langsung oleh PostgreSQL untuk performa stabil pada volume pesanan tinggi.
* **Non-Destructive Upsert Protocol**: Mekanisme penarikan data dari Google Sheets ke PostgreSQL menggunakan logika `ON CONFLICT DO UPDATE`, menjamin tidak ada duplikasi data atau nomor SPK/Order yang bentrok.
* **Scheduled Cron Cloud (15 Menit)**: Cloudflare Worker di cloud otomatis memeriksa dan menyelaraskan perubahan data antara Google Sheets dan PostgreSQL setiap 15 menit 24/7.
* **Antarmuka Self-Service di UI**: Disediakan tombol **`Tarik dari Google Sheets`** dan **`Cadangkan ke Sheets`** langsung pada menu *Log Sinkronisasi*.

### 2. 🤖 KBM Business AI Advisor (Financial Intelligence Engine)
* **Live Financial Data Synthesis**: Menghubungkan metrik finansial riil (omzet produksi, arus kas masuk, pengeluaran bahan baku kertas/tinta, serta sisa piutang pemesan) ke dalam rekomendasi strategis.
* **Optimasi Tampilan Layar Penuh Mobile**: Desain modal adaptif (*full-height bottom sheet*) yang telah disesuaikan agar tidak menghalangi bilah navigasi utama perangkat Android.
* **Format Teks & Tipografi Eksekutif**: Tampilan saran bisnis yang bersih tanpa karakter matematis atau formula mentah.

### 3. 🏗️ Modularisasi Sistem Keuangan & Operasional
* **Buku Kas & Mutasi Saldo**: Pemisahan komponen rekap, tabel mutasi, dan penarikan data kas untuk pemuatan instan.
* **Laporan Laba Rugi & Export Excel**: Visualisasi grafik keuangan yang lebih presisi dengan fitur ekspor pembukuan ke file `.xlsx`.
* **Kalkulator Cetak & Invoice PDF**: Kalkulasi spesifikasi buku (ukuran, jenis kertas isi/cover, finishing jilid) serta integrasi kirim surat pesanan ke WhatsApp.

---

## 📦 Matriks Distribusi Aplikasi (Production Packages)

| Aplikasi | Platform | Target Pengguna | Peran & Kapabilitas Utama |
| :--- | :---: | :--- | :--- |
| **Aplikasi 1: Operasional Percetakan**<br>*(Order, SPK & Produksi)* | 🖥️ Windows (`.exe`)<br>📱 Android (`.apk`) | Tim CS, Estimator, & Operator Produksi | • Kalkulator spesifikasi buku (kertas isi, cover, jilid, halaman, eksemplar)<br>• Pembuatan Surat Perintah Kerja (SPK) Cetak Buku<br>• Penerbitan Invoice PDF standar & kirim via WhatsApp<br>• Manajemen data pelanggan, penulis, & penerbit |
| **Aplikasi 2: Dashboard Owner & Keuangan**<br>*(Monitoring & Buku Kas)* | 🖥️ Windows (`.exe`)<br>📱 Android (`.apk`) | Owner, Manajer Keuangan, & Pimpinan | • Monitoring omzet harian & grafik laba rugi real-time<br>• Buku Kas operasional (pembelian kertas, tinta, & bahan cetak)<br>• Pelacakan dan rekap sisa piutang pemesan buku<br>• Ekspor rekap laporan keuangan ke Microsoft Excel (`.xlsx`)<br>• Asisten AI Konsultasi Keuangan Percetakan |

---

### 📥 Unduhan Paket Instalasi Resmi (v1.1.17)

#### 🖥️ Desktop Windows (PC Meja Operasional & PC Pimpinan)
* **[KBM-Operasional-Setup.exe](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.17/KBM-Operasional-Setup.exe)**  
  *Aplikasi Operasional, Estimasi Harga Buku & Cetak SPK/Invoice (Windows 10/11 x64)*
* **[KBM-Owner-Dashboard-Setup.exe](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.17/KBM-Owner-Dashboard-Setup.exe)**  
  *Aplikasi Dashboard Keuangan, Buku Kas & Laporan Owner (Windows 10/11 x64)*

#### 📱 Mobile Android (Smartphone Tim Lapangan & Owner)
* **[KBM-Operasional.apk](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.17/KBM-Operasional.apk)**  
  *Input pesanan cetak & cek status produksi mobile (Android 8.0+)*
* **[KBM-Owner-Dashboard.apk](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.17/KBM-Owner-Dashboard.apk)**  
  *Monitoring omzet, piutang, dan AI Advisor langsung di genggaman (Android 8.0+)*

---

## 🛡️ Kompatibilitas Sistem
* **Windows**: Kompatibel dengan Windows 10 & Windows 11 (64-bit Architecture).
* **Android**: Mendukung Android 8.0 (Oreo) hingga Android 15 (Target SDK 34/35).
* **Arsitektur Data**: Sinkronisasi ganda PostgreSQL (Sumobase JKT) + Google Sheets Live Backup.

---
*© 2026 KBM Printing • Solusi Manajemen Percetakan Modern & Profesional.*
