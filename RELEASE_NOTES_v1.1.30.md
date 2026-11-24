# 📚 KBM Printing Enterprise Suite — v1.1.30 Hotfix Release

> **Sistem Terpadu Manajemen Operasional & Keuangan Percetakan Buku**  
> *Hotfix URL Endpoint Produksi: Memastikan Aplikasi Selalu Terhubung ke Cloudflare Workers & Database PostgreSQL Sumobase.*

---

## 🏛️ Gambaran Rilis (Release Highlights)

Pembaruan **v1.1.30** memperbaiki konfigurasi target API pada instalasi desktop (`.exe`) dan mobile (`.apk`). Pada rilis sebelumnya, build CI/CD di GitHub Actions menyuntikkan rahasia *secret* lama yang mengarah ke Google Apps Script (Legacy) yang datanya telah berhenti di bulan Oktober 2026. 

### 1. 🌐 Proteksi & Penegakan Endpoint Cloudflare Workers
* **Pembersihan Target Legacy Google Apps Script**:
  * Menambahkan validasi ketat pada `packages/shared/src/api/gasClient.ts` untuk menolak dan mengabaikan URL lama `script.google.com`.
  * Memastikan seluruh komunikasi data operasional dan keuangan selalu mengarah langsung ke server Cloudflare Workers: `https://kbm-api.karyabaktimakmur.workers.dev/api`.
* **Pembaruan GitHub Actions Secret**:
  * Memperbarui secret `VITE_GAS_URL` di repositori GitHub ke endpoint Cloudflare Workers resmi sehingga installer Windows dan Android selalu memuat seluruh data November (241+ order).

---

## 📦 Matriks Distribusi Aplikasi (Production Packages)

| Aplikasi | Platform | Target Pengguna | Peran & Kapabilitas Utama |
| :--- | :---: | :--- | :--- |
| **Aplikasi 1: Operasional Percetakan**<br>*(Order, SPK & Kasir)* | 🖥️ Windows (`.exe`)<br>📱 Android (`.apk`) | Tim CS, Estimator, & Operator Produksi | • Sinkronisasi langsung ke data PostgreSQL live (241 order)<br>• Tombol shortcut `+ Bayar` langsung dari daftar order<br>• Perbaikan reaktivitas halaman Detail Order<br>• Cetak invoice, SPK & kirim rincian WA |
| **Aplikasi 2: Dashboard Owner & Keuangan**<br>*(Monitoring & Buku Kas)* | 🖥️ Windows (`.exe`)<br>📱 Android (`.apk`) | Owner, Manajer Keuangan, & Pimpinan | • Monitoring omzet & pembukuan kas harian terverifikasi<br>• Verifikasi transfer, tolak transfer, & refund kas<br>• Akses audit trail perubahan spesifikasi order & biaya<br>• Ekspor rekap keuangan ke Microsoft Excel (`.xlsx`) |

---

### 📥 Unduhan Paket Instalasi Resmi (v1.1.30)

#### 🖥️ Desktop Windows (PC Meja Operasional & PC Pimpinan)
* **[KBM-Operasional-Setup.exe](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.30/KBM-Operasional-Setup.exe)**  
* **[KBM-Owner-Setup.exe](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.30/KBM-Owner-Setup.exe)**  

#### 📱 Mobile Android (Smartphone & Tablet)
* **[KBM-Operasional.apk](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.30/KBM-Operasional.apk)**  
* **[KBM-Owner.apk](https://github.com/crediblemark-official/Aplikasi-Keuangan-KBM-Printing/releases/download/v1.1.30/KBM-Owner.apk)**  

---

*Build & Release Timestamp: 24 November 2026 — Cloudflare Workers API Production Sync.*
