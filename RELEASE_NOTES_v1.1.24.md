# 📚 KBM Printing Enterprise Suite — v1.1.24 Production Release

> **Sistem Terpadu Manajemen Operasional & Keuangan Percetakan Buku**  
> *Audit Trail & Log Riwayat Perubahan Order Lengkap, Penyelarasan Status Lunas Antar-Aplikasi, Fitur Tolak Verifikasi Mutasi, dan Penyelesaian Refund Kelebihan Bayar.*

---

## 🏛️ Gambaran Umum Rilis (Release Overview)

Pembaruan **v1.1.24** menghadirkan transparansi penuh pada setiap perubahan data pesanan cetak dan akurasi rekonsiliasi keuangan antara Tim Operasional dan Owner:

1. **Audit Trail & Riwayat Perubahan Order (Spesifikasi & Harga)**:
   - **Pencatatan Otomatis Perubahan**: Sistem secara ketat melacak setiap perubahan pada spesifikasi teknis yang mempengaruhi harga cetak:
     - Total Nilai Order (misal: `Rp 4.246.250` → `Rp 3.668.750`).
     - Skema Tarif Harga (`NORMAL` vs `LANGGANAN`).
     - Jumlah Oplah Eksemplar (`jml_pcs`).
     - Ukuran Buku & Jenis Kertas (termasuk dual-paper `kertas_bw` dan `kertas_fc`).
     - Halaman Cetak Hitam Putih (BW) & Full Color (FC).
     - Finishing Jilid & Cover (Soft Cover, Hard Cover, Laminasi Doff/Glossy, Shrink Wrap).
     - Packing Dus & Biaya Pengemasan.
     - Perubahan Status Pesanan (Dibuat, Diproses, Selesai, Dibatalkan, Dipulihkan).
   - **Tampilan Visual di Detail Order (`OrderDetailView.vue`)**: Card timeline modern dengan badge aktor pembuat perubahan, tanggal & jam, serta kartu *diff* perbandingan nilai sebelum dan sesudah.
   - **Akses Cepat Owner (`TransaksiOrderTable.vue`)**: Owner dapat membuka modal pop-up riwayat perubahan order ([OrderLogsModal.vue](file:///media/rasyiqi/7653717A1C07B131/KBM-Pinting/packages/shared/src/components/OrderLogsModal.vue)) langsung dari kolom ID Order di tabel transaksi tanpa perlu berpindah halaman.

2. **Penyelarasan Status Lunas Antar-Aplikasi**:
   - Kalkulasi `sisa_tagihan` dan status pembayaran di Dashboard Owner kini sepenuhnya sinkron dengan Operasional, berbasis pada `total_masuk`.
   - Order yang telah dibayar penuh namun menunggu verifikasi transfer mutasi tampil konsisten sebagai `Lunas ⏳ Menunggu Verifikasi` dengan sisa tagihan `Rp 0`.

3. **Alur Tolak / Gagal Verifikasi Kas Masuk**:
   - Owner dapat menolak transaksi transfer yang tidak ditemukan mutasinya di bank dengan tombol `[Tolak]`.
   - Status verifikasi otomatis berubah menjadi `BATAL` dengan alasan penolakan yang tercantum transparan di riwayat kas masuk.

4. **Alur Refund Lebih / Penyelesaian Kelebihan Bayar**:
   - Sistem mendeteksi otomatis jika terjadi kelebihan transfer (`total_masuk > total_harga`) dan memunculkan tombol `🔄 Refund Lebih`.
   - Modal refund memudahkan pengembalian dana via Kas Keluar atau pengalihan surplus ke Saldo Deposit Penerbit.

---

## 💎 Sorotan Pembaruan (Key Highlights & Enhancements)

* 📜 **Riwayat Perubahan Spesifikasi Jelas**: Tidak ada lagi kebingungan saat harga atau spek pesanan disesuaikan.
* ⚖️ **Keuangan Sinkron**: Status lunas dan sisa tagihan di Dashboard Owner sama persis dengan aplikasi Operasional.
* ❌ **Verifikasi Transparan**: Pencatatan alasan penolakan verifikasi transfer mutasi bank.
* 🔄 **Penyelesaian Lebih Bayar Mudah**: Refund surplus atau ubah ke saldo deposit penerbit dengan satu klik.

---

## 📦 Matriks Distribusi Aplikasi (Production Packages)

| Aplikasi | Platform | Target Pengguna | Peran & Kapabilitas Utama |
| :--- | :---: | :--- | :--- |
| **Aplikasi 1: Operasional Percetakan**<br>*(Order, SPK & Kasir)* | 🖥️ Windows (`.exe`)<br>📱 Android (`.apk`) | Tim CS, Estimator, & Operator Produksi | • Kalkulator spesifikasi buku & pembuatan SPK<br>• Riwayat log perubahan order & spesifikasi<br>• Penerbitan Invoice PDF standar & kirim WA<br>• Pembayaran kasir cepat & kontekstual |
| **Aplikasi 2: Dashboard Owner & Keuangan**<br>*(Monitoring & Buku Kas)* | 🖥️ Windows (`.exe`)<br>📱 Android (`.apk`) | Owner, Manajer Keuangan, & Pimpinan | • Monitoring omzet & pembukuan kas harian<br>• Verifikasi transfer, tolak transfer, & refund lebih<br>• Akses instan log perubahan spesifikasi order<br>• Ekspor rekap keuangan ke Microsoft Excel (`.xlsx`) |

---

### 📥 Unduhan Paket Instalasi Resmi (v1.1.24)

#### 🖥️ Desktop Windows (PC Meja Operasional & PC Pimpinan)
* **[KBM-Operasional-Setup.exe](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.24/KBM-Operasional-Setup.exe)**  
  *Aplikasi Operasional, Estimasi Harga Buku & Cetak SPK/Invoice (Windows 10/11 x64)*
* **[KBM-Owner-Dashboard-Setup.exe](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.24/KBM-Owner-Dashboard-Setup.exe)**  
  *Aplikasi Dashboard Keuangan, Buku Kas & Laporan Owner (Windows 10/11 x64)*

#### 📱 Mobile Android (Smartphone Tim Lapangan & Owner)
* **[KBM-Operasional.apk](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.24/KBM-Operasional.apk)**  
  *Input pesanan cetak & cek status produksi mobile (Android 8.0+)*
* **[KBM-Owner-Dashboard.apk](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.24/KBM-Owner-Dashboard.apk)**  
  *Monitoring keuangan real-time, approval kas & laporan laba-rugi (Android 8.0+)*
