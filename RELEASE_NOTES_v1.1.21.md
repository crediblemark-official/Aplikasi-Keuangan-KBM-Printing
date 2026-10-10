# 📚 KBM Printing Enterprise Suite — v1.1.21 Production Release

> **Sistem Terpadu Manajemen Operasional & Keuangan Percetakan Buku**  
> *Pembaruan Tabel Diskon Oplah Finishing Resmi, Refactoring UI Form Order Cepat (Checklist Langganan Pintar pada Nama Penerbit), dan Sinkronisasi Logika Pricelist.*

---

## 🏛️ Gambaran Umum Rilis (Release Overview)

Pembaruan **v1.1.21** berfokus pada penyelarasan skema harga resmi terbaru serta peningkatan efisiensi antarmuka kasir (*UI/UX streamlining*) pada pencatatan pesanan:

1. **Penyelarasan Diskon Oplah Finishing Resmi (`Harga Percetakan (2).xlsx`)**:
   - Memperbarui tabel diskon finishing (Cover Offset + min 200 halaman) pada modul kalkulator `pricelist.ts`:
     - **Tarif Normal**: 300 pcs (**10%**), 500 pcs (**25%**), 1.000–2.500 pcs (**50%**).
     - **Tarif Langganan**: 300 pcs (**25%**), 500 pcs (**50%**), 1.000–2.500 pcs (**75%**).
   - Memberikan diferensiasi tarif yang lebih adil dan menarik bagi mitra penerbit langganan tetap KBM Printing.

2. **Refactoring UI Form Order — Checklist Langganan Pintar**:
   - **Formulir Lebih Bersih**: Menghilangkan tombol tab segmented skema tarif yang sebelumnya memakan tempat di bagian *Biaya & Pembayaran*.
   - **Checklist Cepat di Label Penerbit**: Menambahkan tombol checklist `[✓ ⭐ Langganan]` langsung di samping label `Nama Penerbit *` pada data identitas klien.
   - **Auto-Detection Riwayat Klien**: Saat kasir memilih nama penerbit dari daftar rekomendasi yang sebelumnya berstatus Langganan, sistem secara cerdas otomatis mengaktifkan skema harga langganan.
   - **Komponen Combobox Ekstensibel**: Menambahkan dukungan slot `#label-extra` pada komponen `ComboboxInput.vue` untuk kontrol interaktif di samping label input.

---

## 💎 Sorotan Pembaruan (Key Highlights & Enhancements)

* ⚡ **Kalkulasi Harga Instan & Akurat**: Menyesuaikan rumus potongan finishing soft cover secara akurat sesuai master dokumen Excel terbaru.
* 🎯 **Pengalaman Input Kasir Lebih Cepat**: Kasir tidak perlu scroll bolak-balik antara identitas penerbit dan panel biaya untuk menentukan tarif langganan.
* 🏷️ **Indikator Transparan**: Ringkasan biaya tetap menampilkan badge `⭐ Tarif Langganan` jika skema langganan aktif.

---

## 📦 Matriks Distribusi Aplikasi (Production Packages)

| Aplikasi | Platform | Target Pengguna | Peran & Kapabilitas Utama |
| :--- | :---: | :--- | :--- |
| **Aplikasi 1: Operasional Percetakan**<br>*(Order, SPK & Produksi)* | 🖥️ Windows (`.exe`)<br>📱 Android (`.apk`) | Tim CS, Estimator, & Operator Produksi | • Kalkulator spesifikasi buku & pembuatan SPK<br>• Penerbitan Invoice PDF standar & kirim WA<br>• Checklist langganan pintar & manajemen data pelanggan |
| **Aplikasi 2: Dashboard Owner & Keuangan**<br>*(Monitoring & Buku Kas)* | 🖥️ Windows (`.exe`)<br>📱 Android (`.apk`) | Owner, Manajer Keuangan, & Pimpinan | • Monitoring omzet & pembukuan kas harian<br>• Pelacakan dan rekap sisa piutang pemesan<br>• Ekspor rekap keuangan ke Microsoft Excel (`.xlsx`)<br>• KBM Business AI Advisor terintegrasi |

---

### 📥 Unduhan Paket Instalasi Resmi (v1.1.21)

#### 🖥️ Desktop Windows (PC Meja Operasional & PC Pimpinan)
* **[KBM-Operasional-Setup.exe](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.21/KBM-Operasional-Setup.exe)**  
  *Aplikasi Operasional, Estimasi Harga Buku & Cetak SPK/Invoice (Windows 10/11 x64)*
* **[KBM-Owner-Dashboard-Setup.exe](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.21/KBM-Owner-Dashboard-Setup.exe)**  
  *Aplikasi Dashboard Keuangan, Buku Kas & Laporan Owner (Windows 10/11 x64)*

#### 📱 Mobile Android (Smartphone Tim Lapangan & Owner)
* **[KBM-Operasional.apk](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.21/KBM-Operasional.apk)**  
  *Input pesanan cetak & cek status produksi mobile (Android 8.0+)*
* **[KBM-Owner-Dashboard.apk](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.21/KBM-Owner-Dashboard.apk)**  
  *Monitoring keuangan real-time, approval kas & laporan laba-rugi (Android 8.0+)*

---

*Hak Cipta © 2026 KBM Printing. Seluruh hak cipta dilindungi undang-undang.*
