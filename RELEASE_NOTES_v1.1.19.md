# 📚 KBM Printing Enterprise Suite — v1.1.19 Production Release

> **Sistem Terpadu Manajemen Operasional & Keuangan Percetakan Buku**  
> *Penyempurnaan Hapus Permanen Order, Otomasi Pembersihan Mutasi Kas Terkait, Pengamanan Saldo Deposit, serta Perapian UI Status Batal.*

---

## 🏛️ Gambaran Umum Rilis (Release Overview)

Pembaruan **v1.1.19** menghadirkan pemecahan tuntas atas siklus hidup pesanan yang dibatalkan hingga penghapusan permanen, integritas relasional database PostgreSQL, dan eliminasi data kas fiktif di Buku Kas:

1. **Integritas Penghapusan Order Permanen & PostgreSQL Constraint**:
   - Menghilangkan *Foreign Key Violation (500 Error)* pada saat penghapusan permanen pesanan (`kas_masuk_id_order_fkey` kini menggunakan `ON DELETE SET NULL`).
   - Penambahan `app.onError` pada Hono Cloudflare Worker API untuk penanganan error JSON yang terstruktur.
2. **Otomasi Pembersihan Kas Bersih (Zero Orphaned Cash Mutation)**:
   - Saat sebuah order dihapus secara permanen, sistem secara otomatis membersihkan mutasi kas masuk batal dan mutasi kas keluar refund terkait order tersebut dari database PostgreSQL.
   - Mengamankan mutasi pembayaran yang telah dialihkan ke **Deposit Penerbit** (`id_order` dilepas menjadi `NULL`), sehingga saldo deposit pelanggan tetap terjaga dan tidak terhapus.
3. **Perapian Antarmuka Pesanan Batal (UI Polish)**:
   - Tombol **Edit Order** otomatis disembunyikan pada pesanan yang berstatus `BATAL` di halaman Detail Order, Daftar Order Operasional, maupun Tabel Transaksi Owner untuk mencegah modifikasi data yang tidak valid.
   - Mengganti label pill `✕ Batal` yang menyerupai tombol pada Tabel Transaksi dengan indikator dash `—` yang bersih dan elegan.
4. **Deploy Cloudflare Workers API**:
   - Pemutakhiran kode server Hono ke Cloudflare Workers production (`kbm-api.karyabaktimakmur.workers.dev`).

---

## 💎 Sorotan Pembaruan (Key Highlights & Enhancements)

### 1. 🛡️ Stabilitas Hapus Permanen Tanpa Error 500
* **Pembersihan Database Bersih**: Menghilangkan sisa mutasi kas fiktif di Buku Kas pasca penghapusan order testing/demo.
* **Keamanan Deposit Penerbit**: Pembayaran yang dialihkan menjadi deposit penerbit diisolasi secara aman sehingga tetap dapat digunakan untuk pesanan berikutnya.

### 2. 🎨 UI/UX Konsisten untuk Status BATAL
* **Pencegahan Edit Pesanan Batal**: Mencegah salah ubah spesifikasi atau tagihan pada order yang sudah tidak aktif.
* **Tampilan Tabel Transaksi Rapi**: Status Batal ditampilkan dengan simbol bersih tanpa membingungkan pengguna seperti tombol yang bisa diklik.

---

## 📦 Matriks Distribusi Aplikasi (Production Packages)

| Aplikasi | Platform | Target Pengguna | Peran & Kapabilitas Utama |
| :--- | :---: | :--- | :--- |
| **Aplikasi 1: Operasional Percetakan**<br>*(Order, SPK & Produksi)* | 🖥️ Windows (`.exe`)<br>📱 Android (`.apk`) | Tim CS, Estimator, & Operator Produksi | • Kalkulator spesifikasi buku & pembuatan SPK<br>• Penerbitan Invoice PDF standar & kirim WA<br>• Manajemen data pelanggan & status pesanan mobile-first |
| **Aplikasi 2: Dashboard Owner & Keuangan**<br>*(Monitoring & Buku Kas)* | 🖥️ Windows (`.exe`)<br>📱 Android (`.apk`) | Owner, Manajer Keuangan, & Pimpinan | • Monitoring omzet & pembukuan kas harian<br>• Pelacakan dan rekap sisa piutang pemesan<br>• Ekspor rekap keuangan ke Microsoft Excel (`.xlsx`)<br>• KBM Business AI Advisor terintegrasi |

---

### 📥 Unduhan Paket Instalasi Resmi (v1.1.19)

#### 🖥️ Desktop Windows (PC Meja Operasional & PC Pimpinan)
* **[KBM-Operasional-Setup.exe](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.19/KBM-Operasional-Setup.exe)**  
  *Aplikasi Operasional, Estimasi Harga Buku & Cetak SPK/Invoice (Windows 10/11 x64)*
* **[KBM-Owner-Dashboard-Setup.exe](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.19/KBM-Owner-Dashboard-Setup.exe)**  
  *Aplikasi Dashboard Keuangan, Buku Kas & Laporan Owner (Windows 10/11 x64)*

#### 📱 Mobile Android (Smartphone Tim Lapangan & Owner)
* **[KBM-Operasional.apk](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.19/KBM-Operasional.apk)**  
  *Input pesanan cetak & cek status produksi mobile (Android 8.0+)*
* **[KBM-Owner-Dashboard.apk](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.19/KBM-Owner-Dashboard.apk)**  
  *Monitoring keuangan real-time, approval kas & laporan laba-rugi (Android 8.0+)*

---

*Hak Cipta © 2026 KBM Printing. Seluruh hak cipta dilindungi undang-undang.*
