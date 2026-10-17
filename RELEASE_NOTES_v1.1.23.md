# 📚 KBM Printing Enterprise Suite — v1.1.23 Production Release

> **Sistem Terpadu Manajemen Operasional & Keuangan Percetakan Buku**  
> *Proteksi Financial Locking pada Order Lunas, Pembaruan UI Kasir & Tombol Pricelist Ramping, Kontekstualisasi Pelunasan Bertahap, serta Pengamanan Arah Sinkronisasi Cloudflare Server.*

---

## 🏛️ Gambaran Umum Rilis (Release Overview)

Pembaruan **v1.1.23** berfokus pada pengamanan integritas pembukuan kas terhadap perubahan pesanan yang sudah dibayar, perapian estetika antarmuka kasir dan kalkulator cetak, serta eliminasi bug sinkronisasi data antar PostgreSQL dan Google Sheets:

1. **Proteksi Financial Locking pada Order Lunas/Terbayar**:
   - **Kunci Otomatis Spesifikasi & Harga**: Pesanan yang sudah mencatat pembayaran riil di Buku Kas (DP maupun Lunas) secara otomatis mengunci oplah (pcs), detail spesifikasi cetak, dan nominal harga agar tidak terjadi selisih kas atau pergeseran status menjadi *Kurang Bayar*.
   - **Banner Ringkas Sebaris**: Informasi penguncian disajikan dalam satu baris teks bersih dan rapi (`🔒 Spesifikasi teknis dikunci (sudah lunas / ada pembayaran)`).
   - **Mekanisme Buka Kunci Darurat**: Tersedia tombol *Buka Kunci* dengan dialog konfirmasi (`ConfirmModal`) yang menyajikan informasi total pembayaran yang sudah masuk dan peringatan risiko sebelum kunci dibuka untuk revisi darurat.
   - **Pembersihan Badge Redundan**: Menghapus label ganda (`🔒 Dikunci` dan `⭐ Tarif Langganan`) pada form harga untuk tampilan yang lebih lega dan elegan.

2. **Penyempurnaan UI Form Kasir & Tombol Pricelist**:
   - **Tombol Jenis Pembayaran Bersih**: Menghilangkan garis border kaku pada tombol jenis pembayaran di form kasir (`PaymentFormSteps.vue`), digantikan dengan aksen soft background dan radio dot yang halus dan interaktif.
   - **Tombol Hitung Ulang Sleek**: Tombol sinkronisasi perhitungan pricelist dirombak dari blok padat menjadi tombol kartu putih dengan ikon SVG yang elegan dan responsif.
   - **Deteksi Pelunasan Bertahap**: Notifikasi pelunasan kini otomatis mendeteksi penyesuaian nilai order (`Pelunasan Tambahan / Penyesuaian Nilai Order`) saat masih terdapat selisih sisa tagihan, mencegah kebingungan kasir.

3. **Pengamanan Integritas Sinkronisasi Cloudflare Server & Google Sheets**:
   - **Pembalikan Arah Cron Backup**: Mengubah cron otomatis Cloudflare Workers (`packages/server/src/index.ts`) dari `syncFromSheets` menjadi `syncBackupToSheets`. PostgreSQL kini berfungsi penuh sebagai *Single Source of Truth* tanpa risiko order yang sudah dihapus muncul kembali dari spreadsheet.
   - **Proteksi Penimpaan Nominal Order**: Fungsi sync Sheets (`backupService.ts`) kini diproteksi sehingga data lama di Sheets tidak dapat menimpa nominal harga pesanan yang pembayarannya sudah cocok di PostgreSQL.

---

## 💎 Sorotan Pembaruan (Key Highlights & Enhancements)

* 🛡️ **Buku Kas Aman dari Human Error**: Order yang sudah dibayar tidak bisa diubah spesifikasi dan harganya secara tidak sengaja.
* ✨ **Tampilan Kasir Lebih Bersih**: Pilihan pembayaran tanpa border kaku dan banner kunci yang ringkas sebaris.
* ⚡ **Anti-Rebound Data Terhapus**: Order yang dihapus tidak akan di-restore kembali oleh cron latar belakang.
* 📦 **Distribusi Lengkap**: Tersedia installer mutakhir untuk Desktop Windows dan Mobile Android.

---

## 📦 Matriks Distribusi Aplikasi (Production Packages)

| Aplikasi | Platform | Target Pengguna | Peran & Kapabilitas Utama |
| :--- | :---: | :--- | :--- |
| **Aplikasi 1: Operasional Percetakan**<br>*(Order, SPK & Kasir)* | 🖥️ Windows (`.exe`)<br>📱 Android (`.apk`) | Tim CS, Estimator, & Operator Produksi | • Kalkulator spesifikasi buku & pembuatan SPK<br>• Proteksi financial locking pesanan lunas<br>• Penerbitan Invoice PDF standar & kirim WA<br>• Pembayaran kasir cepat & kontekstual |
| **Aplikasi 2: Dashboard Owner & Keuangan**<br>*(Monitoring & Buku Kas)* | 🖥️ Windows (`.exe`)<br>📱 Android (`.apk`) | Owner, Manajer Keuangan, & Pimpinan | • Monitoring omzet & pembukuan kas harian<br>• Audit saldo deposit & pencegahan selisih kas<br>• Ekspor rekap keuangan ke Microsoft Excel (`.xlsx`)<br>• KBM Business AI Advisor (Ollama Cloud & Workers AI) |

---

### 📥 Unduhan Paket Instalasi Resmi (v1.1.23)

#### 🖥️ Desktop Windows (PC Meja Operasional & PC Pimpinan)
* **[KBM-Operasional-Setup.exe](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.23/KBM-Operasional-Setup.exe)**  
  *Aplikasi Operasional, Estimasi Harga Buku & Cetak SPK/Invoice (Windows 10/11 x64)*
* **[KBM-Owner-Dashboard-Setup.exe](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.23/KBM-Owner-Dashboard-Setup.exe)**  
  *Aplikasi Dashboard Keuangan, Buku Kas & Laporan Owner (Windows 10/11 x64)*

#### 📱 Mobile Android (Smartphone Tim Lapangan & Owner)
* **[KBM-Operasional.apk](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.23/KBM-Operasional.apk)**  
  *Input pesanan cetak & cek status produksi mobile (Android 8.0+)*
* **[KBM-Owner-Dashboard.apk](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.23/KBM-Owner-Dashboard.apk)**  
  *Monitoring keuangan real-time, approval kas & laporan laba-rugi (Android 8.0+)*

---

*Hak Cipta © 2026 KBM Printing. Seluruh hak cipta dilindungi undang-undang.*
