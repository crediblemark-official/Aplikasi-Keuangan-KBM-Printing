# Laporan Bug — KBM Printing Monorepo

> Status: **FINAL + semua temuan DIBAIKI** (Tahap 1–3, 2026-09-23). 21/21 temuan selesai; tanda
> `⚠️` = perlu langkah operasional di sisi user (keystore: set GitHub Secrets + install ulang APK).
> Tanggal review: 2026-09-23 · Branch: `main` (HEAD `c194bc4`)

Ringkasan: **3 Critical, 11 High, 7 Medium**. Tema utama: routing API GAS rusak total (banyak action
tidak dirutekan / menunjuk handler yang tidak ada), keamanan signing APK, pembayaran PENDING/BATAL ikut
dihitung sebagai LUNAS, inkonsistensi zona waktu UTC vs WIB, dan beberapa salah hitung finansial di
view owner.

## ✅ Perbaikan yang sudah diterapkan (2026-09-23)

Keputusan desain (dari diskusi): **verifikasi = rekonsiliasi akhir hari** — owner memverifikasi apakah
uang benar masuk rekening (`VERIFIED`) atau tidak (`BATAL`); operasional tetap jalan tanpa menunggu
owner. Badge pembayaran di kedua app kini menampilkan **dua dimensi sekaligus** (1 pill):
`Lunas ✓ Terverifikasi` vs `Lunas ⏳ Menunggu Verifikasi`.

1. **Routing GAS diperbaiki** (`gas/Code.gs:46–112`) — temuan #1:
   - `doGet` kini melayani `ping, getOrders, getKasMasuk, getKasKeluar, getClients, getSummaryReport` (semua handler ada).
   - `doPost` kini melayani `verifyKasMasuk`, `updateKasMasuk`, `deleteKasMasuk`, `updateKasKeluar`, `attachBuktiKasMasuk` (semua handler ada); rute mengambang (`updateStatusVerifikasi`, `saveClient`, `deleteClient`, dan 4 rute GET tanpa handler) dicabut.
2. **`checkAndUpdateOrderStatus`** (`Code.gs:882–903`) — tambah jalur balik `SELESAI → PROSES` saat
   total pembayaran terverifikasi turun di bawah tagihan (pembatalan/pengeditan); hanya naikkan
   `PROSES → SELESAI` untuk order yang sedang PROSES.
3. **Cache summary tidak basi** (`Code.gs:139–153`, `1123–1138`) — semua `summary_report_*` yang pernah
   di-cache ikut di-invalidate pada setiap mutasi data (registry periode).
4. **Badge gabungan status pembayaran + verifikasi** — `StatusBadge.vue` (prop `verification` baru,
   glyph `✓`/`⏳`/`✕` + suffix "Terverifikasi"/"Menunggu Verifikasi"/"Dibatalkan"); helper
   `getVerificationStatus()` di `formatters.ts`; di-wire di `HomeView`, `OrderListView`,
   `OrderDetailView` (app1) dan `TransaksiView`, `PiutangView` (app2). Badge status tetap dihitung dari
   semua pembayaran tercatat (sudut pandang operasional), dimensi verifikasi menyusul otomatis.
5. **`KasKeluarView`** (`apps/app2-owner/src/views/KasKeluarView.vue:281`) — `tanggal` kini dikirim ke
   `createKasKeluar` (sebelumnya dibuang, selalu ter-save tanggal hari ini).
6. **Perhitungan finansial app2 berbasis VERIFIED** (temuan #6/#7/#9):
   - `TransaksiView.vue:694–701` — `allOrdersTx` membuang pembayaran `BATAL`;
     `sisa_tagihan` & `status_bayar` (731–734) dihitung dari `total_masuk_verified` (sudut pandang
     owner: uang yang belum diverifikasi belum dianggap lunas); `totalMasukPiutang` memakai
     `total_masuk_verified` (fallback mati `?? total_masuk_verified` dihapus).
   - `PiutangView.vue:596–600` — baris piutang berbasis VERIFIED; ledger deposit (`424–460`) wajib
     `=== 'VERIFIED'` untuk top-up **dan** pemakaian `SALDO_DEPOSIT`.
   - `BukuKasView.vue:740–758` — ledger deposit wajib `=== 'VERIFIED'`.
7. **`ClientListView`** (temuan #14) — saldo deposit (`419–442`) wajib `VERIFIED`; order dengan
   `status_order === 'BATAL'` tidak dihitung ke `orderCount`/`totalOmset`/`lastOrderDate` (klien tetap
   muncul, hanya statistiknya yang diskip).
8. **Zona waktu WIB** (temuan #15) — `formatters.ts` mendapat `toDateStringInTimeZone(date, 'Asia/Jakarta')`
   dan `getTodayISO()` kini WIB (bukan UTC); `OperationalInsights.vue:257` memakai helper untuk buket
   chart; default `tanggal` di `orders.ts` (195, 234) & `NewPaymentView.vue` (613, 642) memakai
   `getTodayISO()`. Default tanggal app2 sudah via `getTodayISO()`, jadi ikut terkoreksi.
9. **Tab `KURANG_BAYAR` mati dihapus** (temuan #17) — `PiutangView.vue:354–360` tab "Kurang Bayar"
   dibuang (parsial sudah diwakili tab `DP`); cabang mati di `TransaksiView.vue:877`
   (`|| row.status_bayar === 'KURANG_BAYAR'`) disederhanakan.
10. **"Struktur Pembayaran" hanya DP vs PELUNASAN** (temuan #18) — `LaporanView.jenisBreakdown`
   (`443–459`) tidak lagi menghitung `DEPOSIT`/`NON_ORDER` sebagai pelunasan.
11. **Grafik tren merespons filter** (temuan #19) — `renderTrendChart` dihitung dari `kasMasukList`/
    `kasKeluarList` lokal + `isDateInFilterRange` (tidak lagi `summaryReport.chart_data` statis);
    watcher `dateFilter` (664–672) kini ikut memanggil `renderTrendChart()`.
12. **Kunci update status per-order + larang toggle BATAL** (temuan #20/#21) — `OrderListView.vue:183`
    guard `updatingOrderId.value === order.id_order` (bukan global); ketiga view
    (HomeView/OrderListView/OrderDetailView) menonaktifkan toggle untuk order `BATAL` + tooltip jelas;
    order `BATAL` tidak akan aktif kembali tanpa konfirmasi.
13. **Keystore signing dirotasi & dicabut dari git** (temuan #2) — `git rm --cached` ketiga `*.jks`;
    `.gitignore` kini memblok `*.jks`/`keystore/`; keystore **baru** (kunci baru, alias `kbmprinting`,
    password acak) dibuat lokal. `build.gradle` (dua app) membaca password dari env (`KBM_STORE_PASSWORD`,
    `KBM_KEY_PASSWORD`, `KBM_KEY_ALIAS`, `KBM_STORE_FILE`); tanpa env, build release berjalan UNSIGNED.
    `.github/workflows/release-apks.yml` memulihkan keystore dari secret `KBM_KEYSTORE_B64` dan
    menyuntikkan password via env per step build. ⚠️ **Langkah user:** set GitHub Secrets
    (`KBM_KEYSTORE_B64`, `KBM_STORE_PASSWORD`, `KBM_KEY_PASSWORD`, `KBM_KEY_ALIAS`) & **uninstall APK lama**
    sebelum install yang baru (tanda tangan berubah → update APK tidak bisa lewat install).
    Base64 keystore: `keystore/kbm-release.jks.b64` (gitignored).
14. **Faktur menghitung pembayaran BATAL** (temuan #3, bagian InvoiceView) — `InvoiceView.vue:605–607`
    kini mengecualikan `status_verifikasi === 'BATAL'`. (Badge app1 sengaja dipertahankan berbasis
    semua pembayaran tercatat non-BATAL sesuai keputusan desain — dimensi verifikasi tampil terpisah
    di badge dan OrderDetailView menampilkan "Menunggu Owner".) **Deposit operasional**:
    `NewPaymentView.publisherDepositBalance` kini hanya menghitung deposit & pemakaian
    `SALDO_DEPOSIT` berstatus `VERIFIED` (dan selalu dari daftar global store, bukan fallback
    per-order) — deposit PENDING tidak bisa "dibelanjakan" → menutup celah double-spend terhadap
    nominal yang belum terverifikasi.
15. **ID duplikat setelah baris dihapus** (temuan #4) — `generateId` kini mengambil `seq` dari nilai
    maksimum ID `prefix-yyyymm-###` yang sudah ada (map kolom ID per sheet), bukan `getLastRow()`.
16. **Metrik "Hari Ini" HomeView** (temuan #10) — `todayOrders`/`todayTotal` difilter
    `o.tanggal === getTodayISO()`; `recentOrders` diurutkan tanggal desc sebelum `slice(0,5)`.
17. **Daftar kas masuk basi saat kembali ke halaman** (temuan #12) — `OrderDetailView.vue` &
    `InvoiceView.vue`: `onIonViewWillEnter` selalu memanggil `loadData()` (order boleh tetap dari cache
    `ensureOrderLoaded`, kas masuk selalu re-fetch).
18. **Spesifikasi kertas FC salah saat `is_kertas_sama`** (temuan #13) — `NewOrderView.vue:1133–1134`:
    `kertas_fc` kini mengambil `form.kertas` (bersama `kertas_bw`), bukan lagi nilai BW.
19. **Guard `indexOf` header di backend** (temuan #16) — `handleUpdateOrderStatus` & `handleDeleteOrder`
    (`Code.gs`) mengecek `idCol`/`statusCol === -1` dan mengembalikan error jelas ketimbang
    `getRange(..., 0)`.

Semua perubahan telah diverifikasi dengan `npm run build:operasional` & `npm run build:owner` (vue-tsc + vite, exit 0).

---

## 🔴 Critical

### 1. Router backend `gas/Code.gs` rusak — banyak action tidak dirutekan / menunjuk fungsi yang tidak ada — ✅ DIBAIKI (Tahap 1)

**Lokasi:** `gas/Code.gs` baris 46–112 (fungsi `doGet`/`doPost`)

`doGet` (53–63) dan `doPost` (86–102) tidak sinkron dengan klien `packages/shared/src/api/gasClient.ts`
maupun handler yang benar-benar terdefinisi. Semua action berikut gagal — dashboard owner kosong,
verifikasi/edit/hapus pembayaran & mutasi selalu error ("Aksi tidak dikenal" atau `ReferenceError`).

| Action | Lokasi router | Dipanggil dari | Masalah |
|---|---|---|---|
| `getOrderById` | `Code.gs:56` | — | Menunjuk `handleGetOrderById` yang **tidak ada** → `ReferenceError` |
| `getSummary` | `Code.gs:60` | — | Menunjuk `handleGetSummary` yang **tidak ada** → `ReferenceError` |
| `getAuditLogs` | `Code.gs:61` | — | Menunjuk `handleGetAuditLogs` yang **tidak ada** → `ReferenceError` |
| `getBukuKas` | `Code.gs:62` | — | Menunjuk `handleGetBukuKas` yang **tidak ada** → `ReferenceError` |
| `getSummaryReport` | — (tidak dirutekan) | `gasClient.ts:318–319`; `LaporanView.vue:648`, `SummaryView.vue:197` | KPI, `kas_per_sumber`, `total_piutang`, grafik tren 6 bulan **selalu 0/kosong** |
| `verifyKasMasuk` | — (tidak dirutekan) | `gasClient.ts:254`; `TransaksiView.vue:961`; `syncStore.ts:286–290` (retry offline) | `verifyTx()` selalu gagal **diam-diam** (tidak ada `else` di 962); verifikasi dari app2 mati total; retry sinkronisasi offline **tidak pernah berhasil** |
| `updateKasMasuk` | — (tidak dirutekan) | `gasClient.ts:267–275`; `TransaksiView.vue:1054`, `BukuKasView.vue:1076` | Edit pembayaran/mutasi selalu gagal |
| `deleteKasMasuk` | — (tidak dirutekan) | `gasClient.ts:276–277`; `TransaksiView.vue:1080`, `BukuKasView.vue:1118` | Batalkan pembayaran selalu gagal |
| `updateKasKeluar` | — (tidak dirutekan) | `gasClient.ts:305–313`; `BukuKasView.vue:1089` | Edit kas keluar selalu gagal |
| `updateStatusVerifikasi` | `Code.gs:94` | — | Menunjuk `handleUpdateStatusVerifikasi` yang **tidak ada** → `ReferenceError` |
| `saveClient` | `Code.gs:97` | — | Menunjuk `handleSaveClient` yang **tidak ada** → `ReferenceError` |
| `deleteClient` | `Code.gs:98` | — | Menunjuk `handleDeleteClient` yang **tidak ada** → `ReferenceError` |
| `attachBuktiKasMasuk` | — | — | `handleAttachBuktiKasMasuk` (`Code.gs:762`) terdefinisi tapi tidak pernah dirutekan |

Handler yang ada tapi **tidak terjangkau router**:
`handleVerifyKasMasuk` (734), `handleUpdateKasMasuk` (790), `handleDeleteKasMasuk` (831),
`handleUpdateKasKeluar` (957), `handleGetSummaryReport` (1017).

Catatan: commit `3ee8019` (versi awal) memiliki routing yang benar; kerusakan muncul dari refactor terakhir.
Permukaan API klien (`gasClient.ts:254, 267, 276, 305, 318`) memanggil 5 action yang semuanya tak dirutekan.

**Fix yang diharapkan:**
- Daftarkan semua action di atas di router `doGet`/`doPost`, arahkan ke nama handler yang benar.
- Hapus rujukan ke handler yang tidak ada (7 entri pada tabel).
- Tambahkan `else` penampil error di `TransaksiView.vue:962` agar verifikasi tidak gagal diam-diam.

---

### 2. Keystore & password signing APK dikomit ke git (keamanan produksi) — ✅ DIBAIKI (Tahap 3; ⚠️ lihat langkah user di bagian ✅ #13)

**Lokasi:**
- `keystore/kbm-release.jks` + `apps/app1-operasional/android/app/kbm-release.jks` + `apps/app2-owner/android/app/kbm-release.jks` (semua tracked)
- `apps/app1-operasional/android/app/build.gradle:21–24`, `apps/app2-owner/android/app/build.gradle:21–24`

```gradle
storeFile file('kbm-release.jks')
storePassword 'REDACTED'
keyAlias 'kbmprinting'
keyPassword 'REDACTED'
```

Password release **hardcoded** dan keystore ada di git publik; CI `.github/workflows/release-apks.yml`
membangun APK signed dari aset itu → siapa pun dengan akses repo bisa menandatangani APK seolah resmi.

**Fix:** `git rm --cached` keystore + tambahkan ke `.gitignore`; baca password dari env/secret CI;
rotasi keystore baru.

---

### 3. Pembayaran belum terverifikasi (PENDING) & batal (BATAL) dihitung sebagai LUNAS — app1 — ✅ DIBAIKI (penuh)

Empat titik di app1-operasional menghitung pembayaran PENDING (dan sebagian BATAL) sebagai uang masuk,
padahal backend hanya mengakui `status_verifikasi === 'VERIFIED'` (`gas/Code.gs:873, 1046, 1054`).
Akibatnya invoice/sisa tagihan/badge status lebih kecil dari kebenaran, dan pesanan yang belum lunas
tampil "✓ Lunas". Satu pola dengan Temuan #6/#7 di app2-owner.

| Lokasi | Ekspresi | Dampak |
|---|---|---|
| `apps/app1-operasional/src/views/InvoiceView.vue:605–610` | `totalMasuk` **tanpa filter status sama sekali** | Faktur menghitung pembayaran yang dibatalkan/belum diverifikasi; `sisaTagihan` (608–610) terlalu kecil; invoice bisa tampil LUNAS padahal belum dibayar |
| `apps/app1-operasional/src/views/OrderDetailView.vue:310–327` | `totalMasuk` filter `!== 'BATAL'` (310–314) | PENDING menaikkan total; `totalVerified` (315–319) **sudah benar tapi tidak pernah dipakai** → `sisaTagihan`/badge salah |
| `apps/app1-operasional/src/stores/orders.ts:110–120` | `getPaymentStatus` filter `status_verifikasi !== 'BATAL'` (114) | Badge status di HomeView, OrderListView, OrderDetailView, dan `OperationalInsights.unpaidCompletedCount` menandai lunas padahal uang belum diverifikasi |
| `apps/app1-operasional/src/views/NewPaymentView.vue:428–436` | `totalTerbayar` filter `!== 'BATAL'` (428–432) | Preset pelunasan/quick-deposit (`useDepositQuick` 421–425) salah; deposit bisa "dibelanjakan" dua kali terhadap nominal yang sama |

**Fix:** per keputusan desain, badge/status di app1 boleh memakai semua pembayaran tercatat
(non-`BATAL`, sudut pandang operasional) asalkan dimensi verifikasi tampil jelas di UI — dan
`InvoiceView` kini mengecualikan `BATAL`. Saldo deposit yang **bisa dibelanjakan** operasional wajib
`=== 'VERIFIED'` (lihat `NewPaymentView.publisherDepositBalance`).

---

## 🟠 High — Backend

### 4. `generateId()` menghasilkan ID duplikat setelah baris dihapus — ✅ DIBAIKI (Tahap 3)

**Lokasi:** `gas/Code.gs:215–227`

```js
const rows = sheet.getLastRow() - 1; // minus header
const seq = String(rows + 1).padStart(3, '0');
return `${prefix}-${yyyymm}-${seq}`;
```

Urutan dari **jumlah baris**, bukan nilai ID maksimum. Setelah `handleDeleteKasKeluar` (992) menghapus
baris, ID baru bisa **menimpa** ID lama → duplikat; berdampak ke nomor faktur (`InvoiceView.vue:601`
memecah `orderId.split('-')[2]`) dan match `id_order` di semua sheet.

**Fix:** ambil seq dari max bagian numerik kolom ID, atau counter terpisah.

### 5. Cache laporan summary tidak pernah di-invalidate — ✅ DIBAIKI (Tahap 1)

**Lokasi:** `gas/Code.gs:1020` (key `'summary_report_'+periode`) & `1094` (`putScriptCache(..., 60)`)

Tidak ada `invalidateCache(...)` yang menyertakan `summary_report_*` (cek 401, 426, 572, 602, 701, 717,
751, 780, 821, 852, 949, 982, 1006, 1260) → laporan owner **basi hingga 60 detik** setelah mutasi.

**Fix:** tambahkan prefix `summary_report_` di invalidasi semua mutasi yang memengaruhi laporan.

---

## 🟠 High — App2-Owner

### 6. Pembayaran `BATAL` tetap dihitung sebagai sudah dibayar di TransaksiView — ✅ DIBAIKI (Tahap 2)

**Lokasi:** `apps/app2-owner/src/views/TransaksiView.vue:692–717` (dipakai 722–743, template 279, 292)

`allOrdersTx` hanya memfilter `NON_ORDER`/`DEPOSIT`, tidak mengecualikan `BATAL` (backend `Code.gs:613–650`
mengembalikan semua baris; pembatalan hanya menandai `BATAL`, `Code.gs:845`). `total_masuk` (725) dan
`sisa_tagihan` (730) ikut menghitung transaksi batal → order tampak lunas / piutang mengecil.
Tidak konsisten dengan `PiutangView.vue:588` yang sudah mengecualikan `BATAL`.

**Fix:** tambahkan `.filter(k => k.status_verifikasi !== 'BATAL')` di `allOrdersTx`.

### 7. Sisa tagihan/LUNAS dari PENDING, summary KPI dari VERIFIED — tidak konsisten — ✅ DIBAIKI (Tahap 2)

**Lokasi:** `apps/app2-owner/src/views/TransaksiView.vue:724–731`, `PiutangView.vue:590–596` (tampilan 279, 124)

`total_masuk` menjumlahkan semua pembayaran termasuk PENDING; KPI dashboard (`Code.gs:1054–1061`) dan
metrik tunai BukuKas (`BukuKasView.vue:729`) hanya VERIFIED → tabel vs dashboard **saling bertentangan**
selama ada PENDING. Bonus: `row.total_masuk ?? row.total_masuk_verified` (729) mati — `total_masuk` selalu
terdefinisi.

**Fix:** hitung dari VERIFIED saja; tampilkan PENDING terpisah; hapus fallback mati.

### 8. `KasKeluarView` menghilangkan tanggal yang dipilih user — ✅ DIBAIKI (Tahap 1)

**Lokasi:** `apps/app2-owner/src/views/KasKeluarView.vue:281–289` (form `form.tanggal` 112/215)

Payload `createKasKeluar` **tidak mengirim `tanggal`** → backend mengisi hari ini (`Code.gs:936`); entri
mundur/mendatang tersimpan diam-diam salah tanggal. (`BukuKasView.vue:1013` sudah benar.)

**Fix:** sertakan `tanggal: form.value.tanggal` di payload.

### 9. Ledger deposit menghitung deposit PENDING sebagai saldo aktual — ✅ DIBAIKI (Tahap 2)

**Lokasi:** `apps/app2-owner/src/views/PiutangView.vue:422–458`, `BukuKasView.vue:740–758`

Keduanya hanya memfilter `!== 'BATAL'` → deposit PENDING dianggap saldo, pemakaian `SALDO_DEPOSIT`
PENDING dianggap terpakai; dengan routing #1 yang rusak, banyak transaksi PENDING selamanya → saldo
deposit overstated terhadap kas terverifikasi.

**Fix:** wajib `=== 'VERIFIED'` untuk top-up dan pemakaian.

---

## 🟠 High — App1-Operasional

### 10. Metrik dashboard "Hari Ini" tidak difilter tanggal — ✅ DIBAIKI (Tahap 3)

**Lokasi:** `apps/app1-operasional/src/views/HomeView.vue:194–204`

`todayOrders` = `orderStore.orders.length` (semua order), `todayTotal` menjumlahkan `total_harga` semua
order, `recentOrders` = 5 pertama daftar sepanjang masa (`slice(0,5)`) — semuanya **bukan** "hari ini" /
tidak diurutkan tanggal.

**Fix:** filter `orders` dengan `tanggal === getTodayISO()` untuk `todayOrders`/`todayTotal`; urutkan
`tanggal` desc sebelum `slice(0,5)`.

### 11. Retry sinkronisasi offline `verifyKasMasuk` tidak pernah berhasil — ✅ DIBAIKI (via #1)

**Lokasi:** `packages/shared/src/stores/syncStore.ts:286–290`

Antrian retry memanggil `api.verifyKasMasuk` yang mengirim action `verifyKasMasuk` **tidak terdaftar** di
`doPost` → setiap retry gagal permanen `'Aksi tidak dikenal'`; verifikasi yang dilakukan operator saat
offline tidak pernah tersinkron. (Ironis: `handleVerifyKasMasuk` ada di `Code.gs:734` tapi tak dirutekan.)

**Fix:** daftarkan `'verifyKasMasuk': () => handleVerifyKasMasuk(body)` di `doPost`.

### 12. Daftar kas masuk basi setelah input pembayaran (cache page Ion-Vue) — ✅ DIBAIKI (Tahap 3)

**Lokasi:** `apps/app1-operasional/src/views/OrderDetailView.vue:374–378`, `InvoiceView.vue:768–772`

`onIonViewWillEnter` hanya memanggil `loadData()` jika `!order.value`. Setelah user membayar
(meninggalkan ke `NewPaymentView` lalu kembali), `order.value` sudah hangat → `loadData` dilewati,
`kasMasukList` tetap snapshot lama → `sisaTagihan`/total invoice basi.

**Fix:** selalu re-fetch `kasMasuk` di `onIonViewWillEnter` (order boleh tetap cache).

### 13. `NewOrderView` salah menimbun spesifikasi kertas saat `is_kertas_sama` — ✅ DIBAIKI (Tahap 3)

**Lokasi:** `apps/app1-operasional/src/views/NewOrderView.vue:1134` (dengan 1102–1104)

Saat `is_kertas_sama`, payload menetapkan `kertas_fc: form.value.kertas_bw || form.value.kertas` —
kertas FC di-stempel dengan nilai kertas **BW**. Pada reload, `loadExistingOrder` (1104) menghitung
`is_kertas_sama = !existing.kertas_fc || existing.kertas_bw === existing.kertas_fc` → order dua kertas
yang kebetulan sama jenisnya termisklasifikasi sebagai satu kertas dan `kertas_fc` ditimpa/dibuang pada
simpan berikutnya.

**Fix:** saat `is_kertas_sama`, set `kertas_bw` dan `kertas_fc` keduanya dari `form.value.kertas`.

### 14. `ClientListView`: deposit PENDING dihitung & order BATAL dihitung dalam omzet klien — ✅ DIBAIKI (Tahap 2)

**Lokasi:** `apps/app1-operasional/src/views/ClientListView.vue:419–442` dan `487–516`

(a) `depositBalances` hanya skip `BATAL` (423), tidak wajib `VERIFIED` → top-up PENDING tampil sebagai
saldo bisa dipakai, pemakaian `SALDO_DEPOSIT` yang belum diverifikasi ikut mengurangi → saldo klien
menggelembung. (b) Loop seeding (487–516) menghitung **semua** order termasuk `BATAL` ke `orderCount`,
`totalOmset`, `lastOrderDate`.

**Fix:** wajib `=== 'VERIFIED'` untuk arus deposit; skip `o.status_order === 'BATAL'` di
orderCount/omset/lastOrderDate.

---

## 🟡 Medium

### 15. `getTodayISO()` & default tanggal memakai UTC, bukan WIB — ✅ DIBAIKI (Tahap 2)

**Lokasi:** `packages/shared/src/utils/formatters.ts:56–57`; `OperationalInsights.vue:257`;
`apps/app1-operasional/src/stores/orders.ts:183, 222`; app2: `TransaksiView.vue:847`,
`BukuKasView.vue:619,633`, `KasKeluarView.vue:215`, metrik "Hari Ini" `KasKeluarView.vue:240–245`.

```ts
return new Date().toISOString().split('T')[0]
```

`toISOString()` = UTC. 00.00–07.00 WIB → hasil **tanggal kemarin**; entri pagi salah tanggal, metrik
"Hari Ini" tampil 0, dan beda 1 hari dengan server yang memakai `Asia/Jakarta`.

**Fix:** format pakai timezone WIB (`Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' })`
atau helper serupa).

### 16. `indexOf` header tanpa guard di `handleUpdateOrderStatus` / `handleDeleteOrder` — ✅ DIBAIKI (Tahap 3)

**Lokasi:** `gas/Code.gs:420, 593`

`headers.indexOf('status_order')` bisa `-1` → `getRange(..., 0)` error saat update/hapus order bila
header sheet berubah/tidak lengkap. **Fix:** guard `if (statusCol < 0) throw ...`.

### 17. Status `KURANG_BAYAR` mati — tab filter tidak pernah cocok — ✅ DIBAIKI (Tahap 2)

**Lokasi:** `apps/app2-owner/src/views/PiutangView.vue:355`; `packages/shared/src/utils/formatters.ts:231–238`;
`TransaksiView.vue:872`

`hitungStatusBayar` hanya mengembalikan `BELUM_BAYAR|DP|LUNAS`, tidak pernah `KURANG_BAYAR` → tab
"Kurang Bayar" selalu tabel kosong; cabang `KURANG_BAYAR` di `openPaymentModalForOrder` dead code.
**Fix:** kembalikan `KURANG_BAYAR` untuk parsial (>0 dan <100%), atau hapus tab/branch.

### 18. "Struktur Pembayaran" menghitung DEPOSIT/NON_ORDER sebagai "Pelunasan" — ✅ DIBAIKI (Tahap 2)

**Lokasi:** `apps/app2-owner/src/views/LaporanView.vue:443–459`

Semua kas masuk terverifikasi non-DP masuk `pelunasan`, termasuk `DEPOSIT`/`NON_ORDER` → rasio
DP-vs-pelunasan bias. **Fix:** hitung hanya `jenis_pembayaran === 'PELUNASAN'`.

### 19. Grafik tren arus kas tidak merespons filter tanggal — ✅ DIBAIKI (Tahap 2)

**Lokasi:** `apps/app2-owner/src/views/LaporanView.vue:642–672`

Tren dirender sekali dari `summaryReport.chart_data`; `watch(dateFilter)` (664–672) hanya menderet ulang
dua donut → grafik basi (atau kosong, lihat #1) setelah ganti filter. **Fix:** panggil
`renderTrendChart()` di watcher / turunkan dari list lokal yang filter-aware.

### 20. Kunci status update bersifat global di OrderListView — ✅ DIBAIKI (Tahap 2)

**Lokasi:** `apps/app1-operasional/src/views/OrderListView.vue:182`

`if (updatingOrderId.value) return` memblok **semua** order saat satu update berjalan; toggle order lain
ditelan diam-diam. **Fix:** guard per-order (`updatingOrderId.value === o.id_order`).

### 21. Toggle status bisa membalasikan order BATAL/SELESAI ke PROSES tanpa konfirmasi — ✅ DIBAIKI (Tahap 2)

**Lokasi:** `apps/app1-operasional/src/views/OrderDetailView.vue:300–301` (pola sama di HomeView/OrderListView)

`nextStatus = status === 'PROSES' ? 'SELESAI' : 'PROSES'` — order `BATAL` yang disentuh langsung aktif
kembali, order `SELESAI` diturunkan, tanpa konfirmasi. **Fix:** hanya izinkan `PROSES → SELESAI` (dan
opsional `SELESAI → PROSES` dengan dialog konfirmasi); wajib konfirmasi sebelum `BATAL → PROSES`.

---

## Lampiran

- File kunci: `gas/Code.gs`, `packages/shared/src/{api/gasClient.ts, stores/syncStore.ts, utils/formatters.ts, components/OperationalInsights.vue}`,
  `apps/app1-operasional/src/{stores/orders.ts, views/{HomeView,OrderListView,OrderDetailView,NewOrderView,NewPaymentView,InvoiceView,ClientListView}.vue}`,
  `apps/app2-owner/src/views/{SummaryView,LaporanView,TransaksiView,BukuKasView,KasKeluarView,PiutangView}.vue`,
  `apps/app{1,2}/*/android/app/build.gradle`.
- Keterangan ulang: sebagian temuan (#3, #6, #7, #9, #15) adalah manifestasi pola yang sama
  (**hanya VERIFIED yang dihitung**) di view berbeda, namun dilaporkan terpisah karena lokasinya berbeda.