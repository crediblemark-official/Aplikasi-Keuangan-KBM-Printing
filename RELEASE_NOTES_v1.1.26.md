# 📚 KBM Printing Enterprise Suite — v1.1.26 Production Release

> **Sistem Terpadu Manajemen Operasional & Keuangan Percetakan Buku**  
> *Koreksi Skema Tarif Finishing Cetak Cover B5 / A4 Menjadi Rp 4.000.*

---

## 🏛️ Gambaran Rilis (Release Highlights)

Pembaruan **v1.1.26** menyesuaikan tarif pengerjaan eceran **Cetak Cover** untuk ukuran besar (B5 dan A4):

* **Koreksi Tarif Cetak Cover**:
  * **A6**: `Rp 1.500` / pcs
  * **A5 / Unesco / Custom**: `Rp 2.500` / pcs
  * **B5 / A4**: **`Rp 4.000`** / pcs *(diperbarui dari Rp 5.000 menjadi Rp 4.000 sesuai instruksi skema harga resmi KBM Printing)*

* **Opsi Paket All-in-One Tetap Lengkap**:
  * **Soft Cover (Paket)**: Cover + Laminasi + Binding + Shrink
  * **Hard Cover (Paket)**: Cover + Laminasi + Binding + Shrink + Pita

* **Sinkronisasi Otomatis**:
  * Kalkulator harga otomatis (`calculateOrderPriceDetailed`) langsung menggunakan tarif Rp 4.000 untuk buku berukuran B5 atau A4 saat opsi Cetak Cover dipilih.
  * Tampilan opsi finishing di form kasir/operasional menyajikan sub-label `A6: 1.5rb • A5: 2.5rb • B5/A4: 4rb`.

---

## 📦 Matriks Distribusi Aplikasi (Production Packages)

| Aplikasi | Platform | Target Pengguna | Peran & Kapabilitas Utama |
| :--- | :---: | :--- | :--- |
| **Aplikasi 1: Operasional Percetakan**<br>*(Order, SPK & Kasir)* | 🖥️ Windows (`.exe`)<br>📱 Android (`.apk`) | Tim CS, Estimator, & Operator Produksi | • Kalkulator harga spesifikasi buku presisi (Paket vs Cetak Cover Eceran B5/A4 Rp 4.000)<br>• Riwayat log perubahan order & audit trail teknis<br>• Penerbitan Invoice PDF standar & kirim WA<br>• Pembayaran kasir cepat & kontekstual |
| **Aplikasi 2: Dashboard Owner & Keuangan**<br>*(Monitoring & Buku Kas)* | 🖥️ Windows (`.exe`)<br>📱 Android (`.apk`) | Owner, Manajer Keuangan, & Pimpinan | • Monitoring omzet & pembukuan kas harian<br>• Verifikasi transfer, tolak transfer, & refund lebih<br>• Akses instan log perubahan spesifikasi & finishing order<br>• Ekspor rekap keuangan ke Microsoft Excel (`.xlsx`) |

---

### 📥 Unduhan Paket Instalasi Resmi (v1.1.26)

#### 🖥️ Desktop Windows (PC Meja Operasional & PC Pimpinan)
* **[KBM-Operasional-Setup.exe](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.26/KBM-Operasional-Setup.exe)**  
* **[KBM-Owner-Setup.exe](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.26/KBM-Owner-Setup.exe)**  

#### 📱 Mobile Android (Smartphone & Tablet)
* **[KBM-Operasional.apk](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.26/KBM-Operasional.apk)**  
* **[KBM-Owner.apk](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.26/KBM-Owner.apk)**  

---

*Build & Release Timestamp: 17 Oktober 2026 — Cloudflare Workers API Production Sync.*
