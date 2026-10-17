# 📚 KBM Printing Enterprise Suite — v1.1.25 Production Release

> **Sistem Terpadu Manajemen Operasional & Keuangan Percetakan Buku**  
> *Pembaruan Skema Tarif Finishing: Paket Soft & Hard Cover Lengkap dan Opsi Eceran Cetak Cover Berdasarkan Ukuran Buku (A6, A5, B5/A4).*

---

## 🏛️ Gambaran Umum Rilis (Release Overview)

Pembaruan **v1.1.25** menyempurnakan struktur tarif finishing buku agar selaras dengan skema harga resmi KBM Printing:

1. **Penambahan Opsi Cetak Cover (Eceran / Terpisah)**:
   - Bagi pesanan yang hanya membutuhkan cetak cover atau kombinasi custom non-paket (misal: Cetak Cover + Binding, atau Cetak Cover saja), kini tersedia opsi **Cetak Cover** dengan tarif per ukuran buku:
     - **A6**: `Rp 1.500` / pcs
     - **A5 / Unesco / Custom**: `Rp 2.500` / pcs
     - **B5 / A4**: `Rp 5.000` / pcs

2. **Klarifikasi Opsi Paket Finishing Lengkap**:
   - **Soft Cover (Paket)**: Sudah mencakup Cover + Laminasi + Binding + Shrink.
   - **Hard Cover (Paket)**: Sudah mencakup Cover + Laminasi + Binding + Shrink + Pita.
   - Pemilihan opsi paket secara otomatis menonaktifkan cetak cover eceran agar tidak terjadi duplikasi biaya finishing. Sebaliknya, memilih Cetak Cover secara cerdas melepas pilihan paket all-in-one.

3. **Perhitungan Otomatis & Terintegrasi ke Seluruh Sistem**:
   - Logika kalkulasi harga di `calculateOrderPriceDetailed` otomatis menambahkan biaya cetak cover terpisah saat opsi eceran dipilih.
   - Tampilan form pesanan operasional menyajikan label dan sub-keterangan tarif yang jelas untuk mempermudah CS dan operator saat input pesanan.
   - Riwayat log perubahan pesanan (*Audit Trail*) mencatat perubahan status cetak cover dan finishing secara detail.
   - Komponen rekap dan tabel piutang/laporan owner menampilkan label **Cetak Cover** secara rapi dan presisi.

---

## 💎 Ringkasan Perubahan Teknis (Technical Highlights)

* 🏷️ **Jenis Finishing Baru**: Penambahan `'CETAK_COVER'` pada tipe `JenisFinishing`.
* 🧮 **Fungsi Tarif Cetak Cover**: Implementasi `getTarifCetakCover(ukuran: UkuranBuku)` di `@shared/utils/pricelist`.
* 🔄 **Logika Antar-Opsi**: Pemilihan cerdas antara paket all-in-one vs pengerjaan cover eceran pada composable form order.
* 🛡️ **Pencatatan Audit Trail**: Sinkronisasi diff finishing di server backend saat spesifikasi cover diperbarui.

---

## 📦 Matriks Distribusi Aplikasi (Production Packages)

| Aplikasi | Platform | Target Pengguna | Peran & Kapabilitas Utama |
| :--- | :---: | :--- | :--- |
| **Aplikasi 1: Operasional Percetakan**<br>*(Order, SPK & Kasir)* | 🖥️ Windows (`.exe`)<br>📱 Android (`.apk`) | Tim CS, Estimator, & Operator Produksi | • Kalkulator harga spesifikasi buku presisi (Paket vs Cetak Cover Eceran)<br>• Riwayat log perubahan order & audit trail teknis<br>• Penerbitan Invoice PDF standar & kirim WA<br>• Pembayaran kasir cepat & kontekstual |
| **Aplikasi 2: Dashboard Owner & Keuangan**<br>*(Monitoring & Buku Kas)* | 🖥️ Windows (`.exe`)<br>📱 Android (`.apk`) | Owner, Manajer Keuangan, & Pimpinan | • Monitoring omzet & pembukuan kas harian<br>• Verifikasi transfer, tolak transfer, & refund lebih<br>• Akses instan log perubahan spesifikasi & finishing order<br>• Ekspor rekap keuangan ke Microsoft Excel (`.xlsx`) |

---

### 📥 Unduhan Paket Instalasi Resmi (v1.1.25)

#### 🖥️ Desktop Windows (PC Meja Operasional & PC Pimpinan)
* **[KBM-Operasional-Setup.exe](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.25/KBM-Operasional-Setup.exe)**  
  *(Paket instalasi installer Windows untuk PC meja kasir dan operator produksi)*
* **[KBM-Owner-Setup.exe](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.25/KBM-Owner-Setup.exe)**  
  *(Paket instalasi installer Windows untuk laptop pimpinan dan PC keuangan)*

#### 📱 Mobile Android (Smartphone & Tablet)
* **[KBM-Operasional.apk](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.25/KBM-Operasional.apk)**  
  *(Instalasi mandiri Android untuk operasional gudang, kasir portabel, dan SPK)*
* **[KBM-Owner.apk](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.25/KBM-Owner.apk)**  
  *(Aplikasi Android untuk pimpinan memantau omzet, kas riil, dan verifikasi mutasi kapan saja)*

---

*Build & Release Timestamp: 17 Oktober 2026 — Cloudflare Workers API Production Sync.*
