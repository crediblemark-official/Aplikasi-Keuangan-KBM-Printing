# 📚 KBM Printing Enterprise Suite — v1.1.28 Production Release

> **Sistem Terpadu Manajemen Operasional & Keuangan Percetakan Buku**  
> *Dukungan Multi-Item Biaya Penanganan (Tombol `+ Tambah Biaya` untuk Banyak Baris Biaya Lain-lain).*

---

## 🏛️ Gambaran Rilis (Release Highlights)

Pembaruan **v1.1.28** menyempurnakan fitur Biaya Penanganan pada **KBM Operasional** dengan menghadirkan kapabilitas **Multi-Item Biaya Penanganan** (*multiple handling fee line items*). Pengguna kini dapat menambahkan lebih dari satu jenis biaya penanganan dalam satu pesanan (misalnya: *Sertifikat*, *Ongkir Ekspedisi*, *Wrapping*, *Jasa Desain/Layout*, dll.) hanya dengan mengeklik tombol **`+ Tambah Biaya`**.

### 1. 🛠️ Tombol `+` & Baris Biaya Penanganan Dinamis
* **Tombol Tambah Tunggal (`+ Tambah Biaya Penanganan`)**:
  * Tombol diletakkan di bagian bawah daftar baris biaya penanganan (tidak double di header), menjaga tampilan tetap bersih dan fokus.
* **Baris Biaya Mandiri**:
  * Setiap baris memiliki input mandiri untuk:
    * **Nama Biaya Penanganan** (placeholder tetap: `Contoh: Sertifikat`).
    * **Jumlah (Qty)**.
    * **Harga Satuan (Rp)**.
  * Setiap baris otomatis mengkalkulasi subtotal: `[Nama]: [Qty] × Rp [Harga] = Rp [Subtotal]`.
* **Rincian Estimasi Biaya Per-Item**:
  * Pada kartu **Rincian Estimasi Biaya**, setiap item biaya penanganan tampil sebagai baris detail tersendiri dengan nama item dan nominalnya (tidak digabung menjadi teks "X item").
* **Hapus Baris Mudah**:
  * Tombol hapus (*trash icon*) pada tiap baris jika terdapat lebih dari satu item.
* **Akumulasi Total Real-time**:
  * Total keseluruhan biaya penanganan langsung dijumlahkan dan diintegrasikan ke kalkulasi pricelist resmi serta ringkasan estimasi biaya.

### 2. 🗄️ Database PostgreSQL & Cloudflare Workers Backend
* **Skema Database `orders`**:
  * Penambahan kolom format terstruktur JSONB: `penanganan_rincian JSONB DEFAULT '[]'::jsonb`.
  * Mempertahankan kompatibilitas penuh dengan kolom legacy (`biaya_penanganan`, `penanganan_nama`, `penanganan_qty`, `penanganan_harga`) sehingga laporan, filter query, dan data lama tetap berjalan tanpa masalah.
  * File migrasi versioned: `packages/server/migrations/004_add_penanganan_rincian.sql`.
* **Logging Audit Trail Lengkap**:
  * Riwayat pembuatan dan pengeditan order mencatat seluruh item biaya penanganan yang dimasukkan ke dalam `order_logs`.
* **Cloudflare Workers Deployment**:
  * Dideploy dan terverifikasi di akun resmi **`karyabaktimakmur@gmail.com`** (Account ID: `45384fbd4f0ba09a31ad5bcd47510db5`) pada endpoint [kbm-api.karyabaktimakmur.workers.dev](https://kbm-api.karyabaktimakmur.workers.dev).

### 3. 🖥️ Integrasi Antarmuka (UI/UX), Faktur / Invoice & WhatsApp
* **Faktur / Invoice Cetak (`useInvoiceData`)**:
  * Setiap item biaya penanganan dicetak sebagai baris item tagihan terpisah yang rapi pada invoice resmi.
* **Template WhatsApp**:
  * Jika terdapat beberapa biaya penanganan, pesan WhatsApp merinci masing-masing item beserta kuantitas, harga, dan total biaya penanganan.
* **Tabel Pesanan (`OrderListView`)**:
  * Kolom Biaya Penanganan menampilkan total nominal, jumlah item, serta tooltip hover yang merinci seluruh biaya yang dikenakan.
* **Halaman Detail Pesanan (`OrderDetailView`)**:
  * Menampilkan rincian lengkap setiap biaya penanganan yang terdaftar.

---

## 📦 Matriks Distribusi Aplikasi (Production Packages)

| Aplikasi | Platform | Target Pengguna | Peran & Kapabilitas Utama |
| :--- | :---: | :--- | :--- |
| **Aplikasi 1: Operasional Percetakan**<br>*(Order, SPK & Kasir)* | 🖥️ Windows (`.exe`)<br>📱 Android (`.apk`) | Tim CS, Estimator, & Operator Produksi | • Tambah multi-item Biaya Penanganan via tombol `+`<br>• Subtotal per item & akumulasi otomatis ke total order<br>• Cetak invoice & pesan WA merinci setiap item penanganan<br>• Kompatibilitas data lama 100% terjaga |
| **Aplikasi 2: Dashboard Owner & Keuangan**<br>*(Monitoring & Buku Kas)* | 🖥️ Windows (`.exe`)<br>📱 Android (`.apk`) | Owner, Manajer Keuangan, & Pimpinan | • Monitoring omzet & pembukuan kas harian terverifikasi<br>• Verifikasi transfer, tolak transfer, & refund kas<br>• Akses audit trail perubahan spesifikasi order & biaya<br>• Ekspor rekap keuangan ke Microsoft Excel (`.xlsx`) |

---

### 📥 Unduhan Paket Instalasi Resmi (v1.1.28)

#### 🖥️ Desktop Windows (PC Meja Operasional & PC Pimpinan)
* **[KBM-Operasional-Setup.exe](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.28/KBM-Operasional-Setup.exe)**  
* **[KBM-Owner-Setup.exe](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.28/KBM-Owner-Setup.exe)**  

#### 📱 Mobile Android (Smartphone & Tablet)
* **[KBM-Operasional.apk](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.28/KBM-Operasional.apk)**  
* **[KBM-Owner.apk](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.28/KBM-Owner.apk)**  

---

*Build & Release Timestamp: 16 November 2026 — Cloudflare Workers API Production Sync.*
