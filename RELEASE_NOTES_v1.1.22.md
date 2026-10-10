# 📚 KBM Printing Enterprise Suite — v1.1.22 Production Release

> **Sistem Terpadu Manajemen Operasional & Keuangan Percetakan Buku**  
> *Penyempurnaan Konversi Saldo Deposit & Audit Trail Relasional, Targeted Single-Order Fetching Cepat, Streamlining KBM AI Advisor (Ollama Cloud & Workers AI), dan Pembersihan Peringatan Kas Tanpa Order.*

---

## 🏛️ Gambaran Umum Rilis (Release Overview)

Pembaruan **v1.1.22** berfokus pada penguatan keandalan relasi data keuangan, akselerasi pemuatan pesanan pada perangkat mobile, serta penyempurnaan menyeluruh asisten bisnis kecerdasan buatan (*AI Advisor*):

1. **Penyempurnaan Konversi Saldo Deposit & Integritas Relasional**:
   - **Audit Trail Utuh**: Saat pesanan yang sudah dibayar dibatalkan dan dialihkan ke deposit klien, transaksi kas masuk tetap mempertahankan relasi `id_order` sumber (`ORD-xxxxxx-xxx`), bukan diset kosong/null. Hal ini memastikan riwayat uang masuk tetap memiliki referensi asal-usul yang jelas.
   - **Eliminasi Peringatan Palsu**: Memperbarui filter audit kas di Dashboard Owner (`useTransaksiFilter.ts`) agar secara eksplisit mengecualikan transaksi bertipe `DEPOSIT` dan `NON_ORDER`, sehingga tidak memicu indikator peringatan kuning *"Kas Masuk Tanpa Order"* yang keliru.

2. **Akselerasi Pencarian Order Cepat (Targeted Single-Order Fetch)**:
   - **Endpoint Terarah di Cloudflare Workers**: Menambahkan parameter `id_order` pada API `handleGetOrders` (`SELECT * FROM orders WHERE id_order = ? LIMIT 1`), menghasilkan waktu respon instan (sub-25ms).
   - **Pencegahan Error Kasir Mobile**: Pada form pembayaran baru (`NewPaymentView.vue` & `useNewPaymentForm.ts`), sistem secara otomatis memvalidasi order target secara live. Jika data belum tersimpan di memori lokal, sistem langsung mengambil order spesifik tersebut tanpa perlu mendownload seluruh katalog pesanan yang berat.
   - **Tombol Muat Ulang Adaptif**: Tombol "Muat Ulang" kini memiliki parameter bypass cache paksa (`nocache: true`) untuk sinkronisasi seketika saat jaringan lambat.

3. **Modernisasi KBM AI Advisor & Eliminasi Fallback Lokal**:
   - **Penghapusan Total Google Gemini**: Menghapus dependensi dan alur fallback lama Gemini yang rentan terhadap limit kuota dan jeda waktu request.
   - **Arsitektur Cepat & Mandiri**: AI Advisor kini berjalan langsung menggunakan **Ollama Cloud** (`gemma4:31b` berkemampuan reasoning tinggi) dengan fallback mulus ke **Cloudflare Workers AI**.
   - **Eliminasi Fallback Lokal Darurat**: Menghapus mekanisme fallback kalkulasi lokal buatan. Jika terjadi keterbatasan kuota token atau kendala jaringan, AI Advisor secara transparan menampilkan notifikasi informasi limit token yang jelas tanpa mengaburkan konteks analitik.
   - **Antarmuka Header Bersih & Minimalis**: Menghapus dropdown pemilihan model manual dari header modal AI Advisor di Dashboard Owner. Routing provider ditangani secara otomatis di belakang layar.

---

## 💎 Sorotan Pembaruan (Key Highlights & Enhancements)

* ⚡ **Pemuatan Kasir Instan**: Pembayaran untuk pesanan yang baru dibuat langsung dapat diproses di smartphone tanpa kendala *"Order tidak ditemukan"*.
* 🛡️ **Buku Kas Bersih & Akurat**: Tidak ada lagi peringatan kuning pada kas deposit pembatalan order.
* 🤖 **AI Advisor Responsif**: Analisis keuangan dan saran bisnis dijawab secara cepat tanpa gangguan quota limit.
* 📦 **Sinkronisasi Multi-Platform**: Peningkatan performa berlaku seragam untuk Desktop Windows dan Mobile Android.

---

## 📦 Matriks Distribusi Aplikasi (Production Packages)

| Aplikasi | Platform | Target Pengguna | Peran & Kapabilitas Utama |
| :--- | :---: | :--- | :--- |
| **Aplikasi 1: Operasional Percetakan**<br>*(Order, SPK & Kasir)* | 🖥️ Windows (`.exe`)<br>📱 Android (`.apk`) | Tim CS, Estimator, & Operator Produksi | • Kalkulator spesifikasi buku & pembuatan SPK<br>• Penerbitan Invoice PDF standar & kirim WA<br>• Pencarian order instan & validasi pembayaran live |
| **Aplikasi 2: Dashboard Owner & Keuangan**<br>*(Monitoring & Buku Kas)* | 🖥️ Windows (`.exe`)<br>📱 Android (`.apk`) | Owner, Manajer Keuangan, & Pimpinan | • Monitoring omzet & pembukuan kas harian<br>• Pelacakan dan audit saldo deposit klien<br>• Ekspor rekap keuangan ke Microsoft Excel (`.xlsx`)<br>• KBM Business AI Advisor (Ollama Cloud & Workers AI) |

---

### 📥 Unduhan Paket Instalasi Resmi (v1.1.22)

#### 🖥️ Desktop Windows (PC Meja Operasional & PC Pimpinan)
* **[KBM-Operasional-Setup.exe](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.22/KBM-Operasional-Setup.exe)**  
  *Aplikasi Operasional, Estimasi Harga Buku & Cetak SPK/Invoice (Windows 10/11 x64)*
* **[KBM-Owner-Dashboard-Setup.exe](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.22/KBM-Owner-Dashboard-Setup.exe)**  
  *Aplikasi Dashboard Keuangan, Buku Kas & Laporan Owner (Windows 10/11 x64)*

#### 📱 Mobile Android (Smartphone Tim Lapangan & Owner)
* **[KBM-Operasional.apk](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.22/KBM-Operasional.apk)**  
  *Input pesanan cetak & cek status produksi mobile (Android 8.0+)*
* **[KBM-Owner-Dashboard.apk](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.22/KBM-Owner-Dashboard.apk)**  
  *Monitoring keuangan real-time, approval kas & laporan laba-rugi (Android 8.0+)*

---

*Hak Cipta © 2026 KBM Printing. Seluruh hak cipta dilindungi undang-undang.*
