# 📚 KBM Printing Enterprise Suite — v1.1.18 Production Release

> **Sistem Terpadu Manajemen Operasional & Keuangan Percetakan Buku**  
> *Penyempurnaan Alur Penyelesaian Keuangan (Refund & Deposit), Redesain Mobile-First Layar Detail Order, dan Peningkatan Integritas Sinkronisasi Multi-Device.*

---

## 🏛️ Gambaran Umum Rilis (Release Overview)

Pembaruan **v1.1.18** menghadirkan penyempurnaan menyeluruh pada alur pembatalan & penyelesaian keuangan pesanan percetakan, tata letak mobile-first yang ergonomis, serta penguatan sinkronisasi transaksi kas:

1. **Siklus Penyelesaian Keuangan Order Batal (Selesai Tuntas)**:
   - Pemrosesan **Refund (Kas Keluar)** kini secara otomatis mencatat pengeluaran kas sekaligus membatalkan tagihan kas masuk terkait pada database & Google Sheets, sehingga status keuangan pesanan langsung bersih (Rp 0) seketika dan tombol hapus permanen dapat diakses.
   - Pemrosesan **Alihkan ke Saldo Deposit** langsung memperbarui kategori kas masuk menjadi deposit penerbit dan tidak lagi tercampur sebagai tagihan order yang dibatalkan.
2. **Redesain Mobile-First Detail Order & Banner Status Batal**:
   - Tombol siklus pesanan (`[Pulihkan Order]` dan `[Hapus Permanen]`) ditata dalam format 50/50 simetris (`grid grid-cols-2`) yang nyaman bagi jangkauan jempol di smartphone.
   - Tombol `[Proses Refund / Deposit]` kini berukuran *full-width* pada tampilan ponsel.
   - Eliminasi duplikasi tombol pada sticky bottom bar mobile saat membuka pesanan yang dibatalkan.
3. **Penyempurnaan Label Badge & Layout Header Sebaris**:
   - Mengganti label redundan `Batal (Ada Uang)` menjadi **`Ada Dana`** berdampingan dengan badge status order `Batal`.
   - Mengunci baris tanggal dan badge dalam format satu baris (*single-line flex-nowrap*) dengan scrollbar halus agar tanggal tidak turun ke baris baru pada layar HP kecil.
4. **Keandalan & Stabilitas Penyimpanan Data**:
   - Sanitasi proxy Vue 3 secara rekursif sebelum penulisan ke IndexedDB/localStorage untuk mencegah `DataCloneError`.
   - Pencegahan peringatan WAI-ARIA `Blocked aria-hidden` pada transisi halaman Ionic.

---

## 💎 Sorotan Pembaruan (Key Highlights & Enhancements)

### 1. 🔄 Penyelesaian Alur Refund & Konversi Deposit
* **Otomasi Kas Keluar & Pembatalan Kas Masuk**: Pencatatan refund langsung mengurangi saldo kas dan menuntaskan riwayat kas masuk pesanan sehingga banner tagihan menggantung langsung hilang seketika.
* **Integrasi Saldo Deposit**: Opsi pengalihan deposit langsung memutakhirkan saldo deposit pelanggan tanpa mengurangi saldo fisik kas perusahaan.
* **Force Cache Bypass (`nocache: true`)**: Memastikan perubahan status keuangan langsung termutakhirkan tanpa jeda cache lokal.

### 2. 📱 Pengalaman Pengguna Mobile-First
* **Tata Letak Tombol Simetris**: Grid 2 kolom seimbang untuk aksi pulihkan dan hapus permanen pada layar mobile.
* **Header Rapi Tanpa Baris Patah**: ID order, badge produksi, badge keuangan, dan tanggal pesanan selalu presisi dalam satu baris.

---

## 📦 Matriks Distribusi Aplikasi (Production Packages)

| Aplikasi | Platform | Target Pengguna | Peran & Kapabilitas Utama |
| :--- | :---: | :--- | :--- |
| **Aplikasi 1: Operasional Percetakan**<br>*(Order, SPK & Produksi)* | 🖥️ Windows (`.exe`)<br>📱 Android (`.apk`) | Tim CS, Estimator, & Operator Produksi | • Kalkulator spesifikasi buku & pembuatan SPK<br>• Penerbitan Invoice PDF standar & kirim WA<br>• Manajemen data pelanggan & status pesanan mobile-first |
| **Aplikasi 2: Dashboard Owner & Keuangan**<br>*(Monitoring & Buku Kas)* | 🖥️ Windows (`.exe`)<br>📱 Android (`.apk`) | Owner, Manajer Keuangan, & Pimpinan | • Monitoring omzet & pembukuan kas harian<br>• Pelacakan dan rekap sisa piutang pemesan<br>• Ekspor rekap keuangan ke Microsoft Excel (`.xlsx`)<br>• KBM Business AI Advisor terintegrasi |

---

### 📥 Unduhan Paket Instalasi Resmi (v1.1.18)

#### 🖥️ Desktop Windows (PC Meja Operasional & PC Pimpinan)
* **[KBM-Operasional-Setup.exe](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.18/KBM-Operasional-Setup.exe)**  
  *Aplikasi Operasional, Estimasi Harga Buku & Cetak SPK/Invoice (Windows 10/11 x64)*
* **[KBM-Owner-Dashboard-Setup.exe](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.18/KBM-Owner-Dashboard-Setup.exe)**  
  *Aplikasi Dashboard Keuangan, Buku Kas & Laporan Owner (Windows 10/11 x64)*

#### 📱 Mobile Android (Smartphone Tim Lapangan & Owner)
* **[KBM-Operasional.apk](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.18/KBM-Operasional.apk)**  
  *Input pesanan cetak & cek status produksi mobile (Android 8.0+)*
* **[KBM-Owner-Dashboard.apk](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.18/KBM-Owner-Dashboard.apk)**  
  *Monitoring omzet, piutang, dan AI Advisor langsung di genggaman (Android 8.0+)*

---

## 🛡️ Kompatibilitas Sistem
* **Windows**: Kompatibel dengan Windows 10 & Windows 11 (64-bit Architecture).
* **Android**: Mendukung Android 8.0 (Oreo) hingga Android 15 (Target SDK 34/35).
* **Arsitektur Data**: Sinkronisasi ganda PostgreSQL (Sumobase JKT) + Google Sheets Live Backup.

---
*© 2026 KBM Printing • Solusi Manajemen Percetakan Modern & Profesional.*
