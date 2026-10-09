# 📚 KBM Printing Enterprise Suite — v1.1.20 Production Release

> **Sistem Terpadu Manajemen Operasional & Keuangan Percetakan Buku**  
> *Penguatan Integritas Data Database PostgreSQL, Transaksi Atomik (ACID), Anti-Race Condition ID Generator, Validasi Kas Masuk, dan Proteksi Sinkronisasi Google Sheets.*

---

## 🏛️ Gambaran Umum Rilis (Release Overview)

Pembaruan **v1.1.20** fokus pada ketahanan data (*data integrity & hardening*) tingkat enterprise untuk memastikan keandalan sistem dalam beban kerja tinggi (*high concurrency*):

1. **Transaksi Database Atomik (ACID - Atomicity, Consistency, Isolation, Durability)**:
   - Pembuatan order baru, input kas masuk, pencatatan kas keluar, dan penghapusan order permanen dibungkus ke dalam transaksi atomik PostgreSQL (`sql.begin`).
   - Jika terjadi kegagalan pada salah satu proses (misal: insert client, kalkulasi kas, atau pencatatan mutasi), seluruh perubahan di-rollback secara otomatis dan konsisten.
2. **Pencegahan Race Condition ID Generator**:
   - Generator ID di PostgreSQL kini menggunakan *PostgreSQL Advisory Transaction Lock* (`pg_advisory_xact_lock`) per-prefix (`ORD`, `KM`, `KK`).
   - Mencegah timbulnya ID ganda saat beberapa tim kasir atau CS membuat transaksi di detik yang sama.
3. **Validasi Ketat Relasi Order pada Kas Masuk**:
   - Backend API (`kasService.ts`) dan Google Apps Script (`Code.gs`) memvalidasi keberadaan pesanan sebelum mencatat atau memperbarui mutasi kas masuk.
   - Mencegah data pembayaran piutang atau uang muka tersimpan tanpa nomor pesanan yang sah (*orphaned payment records*).
4. **Proteksi Sinkronisasi Dua Arah (Google Sheets ↔ PostgreSQL)**:
   - Mekanisme upsert di `backupService.ts` dan `sync-from-sheets.ts` dilengkapi proteksi: status verifikasi (`VERIFIED`) dan pembatalan (`BATAL`) di server database tidak akan tertimpa oleh data usang dari Google Sheets.
   - Nilai total/nominal valid di database diproteksi agar tidak tertimpa nilai 0 atau sel kosong dari spreadsheet.
5. **Indeks Performa & Skema Database**:
   - Disediakan migrasi SQL `001_indexes_and_integrity.sql` dengan indeks komposit untuk optimasi query filter tanggal, status verifikasi, dan status order.

---

## 💎 Sorotan Pembaruan (Key Highlights & Enhancements)

### 1. 🛡️ Integritas Transaksional 100% Rollback-Safe
* Menjamin tidak ada data menggantung jika koneksi jaringan atau proses penyimpanan terputus di tengah jalan.
* Operasi hapus permanen terisolasi: melepaskan relasi deposit penerbit, membersihkan mutasi kas terkait, dan menghapus order dalam satu transaksi yang aman.

### 2. ⚡ Concurrency Lock & Anti ID Duplikat
* Serialisasi aman pembuatan ID transaksi berbasis nomor urut tertinggi (`MAX`) yang dikunci pada level transaksi PostgreSQL.

### 3. 🔄 Sinkronisasi Cerdas & Aman
* Integrasi dual-backend (Cloudflare Workers PostgreSQL + Google Sheets) lebih tangguh terhadap perbedaan status offline/online.

---

## 📦 Matriks Distribusi Aplikasi (Production Packages)

| Aplikasi | Platform | Target Pengguna | Peran & Kapabilitas Utama |
| :--- | :---: | :--- | :--- |
| **Aplikasi 1: Operasional Percetakan**<br>*(Order, SPK & Produksi)* | 🖥️ Windows (`.exe`)<br>📱 Android (`.apk`) | Tim CS, Estimator, & Operator Produksi | • Kalkulator spesifikasi buku & pembuatan SPK<br>• Penerbitan Invoice PDF standar & kirim WA<br>• Manajemen data pelanggan & status pesanan mobile-first |
| **Aplikasi 2: Dashboard Owner & Keuangan**<br>*(Monitoring & Buku Kas)* | 🖥️ Windows (`.exe`)<br>📱 Android (`.apk`) | Owner, Manajer Keuangan, & Pimpinan | • Monitoring omzet & pembukuan kas harian<br>• Pelacakan dan rekap sisa piutang pemesan<br>• Ekspor rekap keuangan ke Microsoft Excel (`.xlsx`)<br>• KBM Business AI Advisor terintegrasi |

---

### 📥 Unduhan Paket Instalasi Resmi (v1.1.20)

#### 🖥️ Desktop Windows (PC Meja Operasional & PC Pimpinan)
* **[KBM-Operasional-Setup.exe](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.20/KBM-Operasional-Setup.exe)**  
  *Aplikasi Operasional, Estimasi Harga Buku & Cetak SPK/Invoice (Windows 10/11 x64)*
* **[KBM-Owner-Dashboard-Setup.exe](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.20/KBM-Owner-Dashboard-Setup.exe)**  
  *Aplikasi Dashboard Keuangan, Buku Kas & Laporan Owner (Windows 10/11 x64)*

#### 📱 Mobile Android (Smartphone Tim Lapangan & Owner)
* **[KBM-Operasional.apk](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.20/KBM-Operasional.apk)**  
  *Input pesanan cetak & cek status produksi mobile (Android 8.0+)*
* **[KBM-Owner-Dashboard.apk](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.20/KBM-Owner-Dashboard.apk)**  
  *Monitoring keuangan real-time, approval kas & laporan laba-rugi (Android 8.0+)*

---

*Hak Cipta © 2026 KBM Printing. Seluruh hak cipta dilindungi undang-undang.*
