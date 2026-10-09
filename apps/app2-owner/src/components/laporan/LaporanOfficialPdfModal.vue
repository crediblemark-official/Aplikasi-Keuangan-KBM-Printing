<template>
  <teleport to="body">
    <transition name="fade">
      <div
        v-if="modelValue"
        class="official-pdf-overlay fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm overflow-y-auto flex flex-col items-center justify-start p-0 sm:p-4 md:p-6"
      >
        <!-- TOP TOOLBAR (Always hidden in print) -->
        <div class="no-print w-full max-w-[920px] bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-slate-200 mb-0 sm:mb-4 sticky top-0 sm:top-2 z-20">
          <div class="p-3.5 sm:p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-8 h-8 rounded-lg bg-red-50 text-red-700 border border-red-200 flex items-center justify-center shrink-0">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div class="min-w-0">
                <h3 class="text-sm font-bold text-slate-900 leading-tight truncate">
                  Dokumen Resmi Laporan Keuangan
                </h3>
                <p class="text-[11px] text-slate-500 truncate">
                  Standar Dokumen Kantor & Manajemen • Siap Dicetak ke Format PDF (A4)
                </p>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-2 shrink-0">
              <button
                type="button"
                @click="printPdf"
                class="h-8.5 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                title="Cetak atau simpan sebagai PDF A4"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Cetak / Simpan PDF</span>
              </button>
              <button
                type="button"
                @click="emit('update:modelValue', false)"
                class="w-8.5 h-8.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
                title="Tutup Pratinjau"
              >
                ✕
              </button>
            </div>
          </div>

          <!-- Document Customizer Options (Collapsible / Toggleable) -->
          <div class="px-3.5 py-2.5 sm:px-4 bg-slate-50/80 border-t border-slate-100 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-3">
            <div class="flex flex-wrap items-center gap-4">
              <!-- Include Transaction Ledger Toggle -->
              <label class="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  v-model="includeLedger"
                  type="checkbox"
                  class="rounded border-slate-300 text-red-600 focus:ring-red-500 w-3.5 h-3.5 cursor-pointer"
                />
                <span class="font-medium text-slate-700">Lampirkan Rincian Transaksi Buku Kas</span>
              </label>

              <!-- Document Number Customizer -->
              <div class="flex items-center gap-1.5">
                <span class="text-slate-400 font-medium">No. Surat:</span>
                <input
                  v-model="nomorDokumen"
                  type="text"
                  class="h-7 px-2 bg-white border border-slate-300 rounded text-xs font-mono font-semibold text-slate-800 w-44 focus:outline-none focus:border-red-500"
                  placeholder="KBM/FIN-REP/..."
                />
              </div>

              <!-- Signer Customizer -->
              <div class="flex items-center gap-1.5">
                <span class="text-slate-400 font-medium">Penandatangan:</span>
                <input
                  v-model="approverName"
                  type="text"
                  class="h-7 px-2 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-800 w-36 focus:outline-none focus:border-red-500"
                  placeholder="Nama Direktur / Owner"
                />
              </div>
            </div>

            <span class="text-[11px] text-slate-400 font-medium italic hidden md:inline">
              *Tampilan di bawah adalah pratinjau persis dokumen A4 yang akan dicetak
            </span>
          </div>
        </div>

        <!-- PRINTABLE OFFICIAL A4 DOCUMENT PAPER -->
        <div
          id="laporan-resmi-print"
          class="laporan-official-paper w-full max-w-[920px] bg-white text-slate-800 p-8 sm:p-12 md:p-14 shadow-2xl rounded-b-2xl sm:rounded-2xl border border-slate-200 relative overflow-hidden font-sans print:shadow-none print:border-none print:rounded-none print:p-0 print:m-0 print:max-w-full"
        >
          <!-- 1. KOP SURAT RESMI (Official Company Letterhead) -->
          <div class="pb-3 border-b-[3px] border-slate-900">
            <div class="flex items-center justify-between gap-4">
              <!-- Left: Brand Logo & Company Title -->
              <div class="flex items-center gap-3.5">
                <KbmLogo size="lg" variant="icon" />
                <div>
                  <h1 class="text-lg sm:text-xl font-black tracking-tight text-slate-950 uppercase leading-none font-sans">
                    {{ company.nama }}
                  </h1>
                  <p class="text-xs font-extrabold uppercase tracking-widest text-red-700 mt-0.5">
                    {{ company.badan_usaha || 'Percetakan & Penerbitan Buku' }}
                  </p>
                  <p class="text-[10px] text-slate-500 leading-tight mt-1">
                    {{ company.alamat }}, {{ company.kota_kodepos }}
                  </p>
                </div>
              </div>

              <!-- Right: Contact & Verification Meta -->
              <div class="text-right text-[10px] text-slate-600 font-mono space-y-0.5 shrink-0">
                <p><strong class="font-sans text-slate-400">Telp / WA:</strong> {{ company.no_telp }}</p>
                <p><strong class="font-sans text-slate-400">Email:</strong> {{ company.email }}</p>
                <p><strong class="font-sans text-slate-400">Website:</strong> {{ company.website }}</p>
                <p><strong class="font-sans text-slate-400">NPWP / Tax:</strong> {{ company.tax_number }}</p>
              </div>
            </div>
          </div>
          <!-- Second fine line of standard Indonesian official letterhead -->
          <div class="border-b border-slate-900 mt-[2px] mb-6"></div>

          <!-- 2. JUDUL DOKUMEN & METADATA RESMI -->
          <div class="text-center mb-6">
            <h2 class="text-base sm:text-lg font-black tracking-wider text-slate-950 uppercase underline underline-offset-4 decoration-2">
              LAPORAN PERTANGGUNGJAWABAN KEUANGAN & OPERASIONAL
            </h2>
            <p class="text-xs font-semibold text-slate-600 mt-1 uppercase tracking-wide">
              Ringkasan Komprehensif Arus Kas, Pendapatan, dan Alokasi Beban Usaha
            </p>
          </div>

          <!-- Document Meta Strip -->
          <div class="bg-slate-50 rounded-lg border border-slate-200/90 p-3.5 mb-6 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nomor Dokumen</p>
              <p class="font-mono font-bold text-slate-900 mt-0.5">{{ nomorDokumen }}</p>
            </div>
            <div>
              <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Periode Laporan</p>
              <p class="font-bold text-slate-900 mt-0.5">{{ periodLabel }}</p>
            </div>
            <div>
              <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tanggal Diterbitkan</p>
              <p class="font-bold text-slate-900 mt-0.5">{{ formattedToday }}</p>
            </div>
            <div>
              <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sifat / Klasifikasi</p>
              <div class="mt-0.5 flex items-center gap-1">
                <span class="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                <span class="font-bold text-emerald-800 uppercase text-[11px]">Resmi & Terverifikasi</span>
              </div>
            </div>
          </div>

          <!-- 3. BAGIAN I: RINGKASAN EKSEKUTIF KEUANGAN -->
          <div class="mb-6 page-break-avoid">
            <div class="flex items-center justify-between pb-1.5 mb-2.5 border-b border-slate-200">
              <h3 class="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <span class="w-2 h-3.5 bg-red-600 rounded-xs inline-block"></span>
                I. Ringkasan Kinerja Arus Kas & Laba Bersih
              </h3>
              <span class="text-[10px] font-mono text-slate-400">Basis Kas Riil (Cash Basis)</span>
            </div>

            <!-- KPI Cards Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
              <div class="p-3 rounded-lg border border-emerald-200 bg-emerald-50/40">
                <p class="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Total Kas Masuk</p>
                <p class="font-mono font-black text-sm sm:text-base text-emerald-700 mt-0.5">
                  {{ formatRupiah(totalMasuk) }}
                </p>
                <p class="text-[10px] text-emerald-600 mt-0.5 font-medium">100% Terverifikasi</p>
              </div>

              <div class="p-3 rounded-lg border border-rose-200 bg-rose-50/40">
                <p class="text-[10px] font-bold uppercase tracking-wider text-rose-800">Total Kas Keluar</p>
                <p class="font-mono font-black text-sm sm:text-base text-rose-700 mt-0.5">
                  {{ formatRupiah(totalKeluar) }}
                </p>
                <p class="text-[10px] text-rose-600 mt-0.5 font-medium">Alokasi Beban Usaha</p>
              </div>

              <div class="p-3 rounded-lg border" :class="labaBersih >= 0 ? 'border-indigo-200 bg-indigo-50/40' : 'border-rose-200 bg-rose-50/40'">
                <p class="text-[10px] font-bold uppercase tracking-wider" :class="labaBersih >= 0 ? 'text-indigo-800' : 'text-rose-800'">
                  Surplus / Laba Bersih
                </p>
                <p class="font-mono font-black text-sm sm:text-base mt-0.5" :class="labaBersih >= 0 ? 'text-indigo-700' : 'text-rose-700'">
                  {{ formatRupiah(labaBersih) }}
                </p>
                <p class="text-[10px] font-medium mt-0.5" :class="labaBersih >= 0 ? 'text-indigo-600' : 'text-rose-600'">
                  {{ labaBersih >= 0 ? '+ Surplus Bersih' : '- Defisit Operasional' }}
                </p>
              </div>

              <div class="p-3 rounded-lg border border-slate-200 bg-slate-50/60">
                <p class="text-[10px] font-bold uppercase tracking-wider text-slate-600">Net Profit Margin</p>
                <p class="font-mono font-black text-sm sm:text-base text-slate-900 mt-0.5">
                  {{ profitMargin }}%
                </p>
                <p class="text-[10px] text-slate-500 mt-0.5 font-medium">
                  Rasio Beban: {{ expenseRatio }}%
                </p>
              </div>
            </div>

            <p class="text-[11px] text-slate-600 leading-relaxed">
              <strong>Evaluasi Ringkas:</strong> Pada periode <strong>{{ periodLabel }}</strong>, operasional percetakan mencatatkan penerimaan kas sebesar <strong>{{ formatRupiah(totalMasuk) }}</strong> dengan pengeluaran operasional sebesar <strong>{{ formatRupiah(totalKeluar) }}</strong>, menghasilkan <strong>{{ labaBersih >= 0 ? 'surplus laba bersih operasional' : 'defisit operasional' }}</strong> sebesar <strong :class="labaBersih >= 0 ? 'text-emerald-700' : 'text-rose-700'">{{ formatRupiah(labaBersih) }}</strong> dengan rasio margin keuntungan sebesar <strong>{{ profitMargin }}%</strong>.
            </p>
          </div>

          <!-- 4. BAGIAN II: ANALISIS KOMPOSISI BEBAN OPERASIONAL -->
          <div class="mb-6 page-break-avoid">
            <div class="flex items-center justify-between pb-1.5 mb-2.5 border-b border-slate-200">
              <h3 class="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <span class="w-2 h-3.5 bg-rose-600 rounded-xs inline-block"></span>
                II. Rincian Pos Pengeluaran & Biaya Operasional
              </h3>
              <span class="text-[10px] font-mono text-slate-400">Total: {{ formatRupiah(totalKeluar) }}</span>
            </div>

            <table class="w-full text-xs border border-slate-200 border-collapse">
              <thead>
                <tr class="bg-slate-100/90 text-slate-700 text-left font-bold border-b border-slate-200">
                  <th class="py-2 px-3 w-10 text-center">No</th>
                  <th class="py-2 px-3">Kategori Pengeluaran</th>
                  <th class="py-2 px-3">Deskripsi Alokasi</th>
                  <th class="py-2 px-3 text-right">Nominal (Rp)</th>
                  <th class="py-2 px-3 text-right w-24">Porsi (%)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200 text-slate-800">
                <tr v-for="(k, idx) in kategoriBreakdown" :key="k.kategori" class="hover:bg-slate-50/50">
                  <td class="py-1.5 px-3 text-center text-slate-400 font-mono">{{ idx + 1 }}</td>
                  <td class="py-1.5 px-3 font-semibold text-slate-900">
                    {{ k.label }}
                  </td>
                  <td class="py-1.5 px-3 text-slate-600 text-[11px]">
                    {{ getKategoriDesc(k.kategori) }}
                  </td>
                  <td class="py-1.5 px-3 text-right font-mono font-bold text-slate-900">
                    {{ formatRupiah(k.nominal) }}
                  </td>
                  <td class="py-1.5 px-3 text-right font-mono font-semibold text-slate-700">
                    {{ k.percentage }}%
                  </td>
                </tr>
                <tr v-if="kategoriBreakdown.length === 0">
                  <td colspan="5" class="py-3 text-center text-slate-400 italic">
                    Tidak ada pengeluaran kas yang tercatat pada periode ini.
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                  <td colspan="3" class="py-2 px-3 uppercase tracking-wider text-right">
                    Total Beban Operasional:
                  </td>
                  <td class="py-2 px-3 text-right font-mono font-black text-rose-700">
                    {{ formatRupiah(totalKeluar) }}
                  </td>
                  <td class="py-2 px-3 text-right font-mono">100.0%</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- 5. BAGIAN III: ANALISIS PENERIMAAN KAS -->
          <div class="mb-6 page-break-avoid">
            <div class="flex items-center justify-between pb-1.5 mb-2.5 border-b border-slate-200">
              <h3 class="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <span class="w-2 h-3.5 bg-emerald-600 rounded-xs inline-block"></span>
                III. Analisis Sumber Penerimaan & Metode Pembayaran
              </h3>
              <span class="text-[10px] font-mono text-slate-400">Total: {{ formatRupiah(totalMasuk) }}</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Sub-Table 1: Berdasarkan Metode Pembayaran -->
              <div>
                <p class="text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  1. Metode Penyetoran Kas
                </p>
                <table class="w-full text-xs border border-slate-200 border-collapse">
                  <thead>
                    <tr class="bg-slate-100/90 text-slate-700 text-left font-bold border-b border-slate-200">
                      <th class="py-1.5 px-2.5">Metode</th>
                      <th class="py-1.5 px-2.5 text-right">Nominal</th>
                      <th class="py-1.5 px-2.5 text-right w-16">Porsi</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-200 text-slate-800">
                    <tr v-for="s in sumberBreakdown" :key="s.sumber">
                      <td class="py-1.5 px-2.5 font-semibold">{{ s.label }}</td>
                      <td class="py-1.5 px-2.5 text-right font-mono font-bold">{{ formatRupiah(s.nominal) }}</td>
                      <td class="py-1.5 px-2.5 text-right font-mono text-slate-600">{{ s.percentage }}%</td>
                    </tr>
                    <tr v-if="sumberBreakdown.length === 0">
                      <td colspan="3" class="py-2 text-center text-slate-400 italic">Tidak ada data</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Sub-Table 2: Berdasarkan Struktur Pembayaran Order -->
              <div>
                <p class="text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  2. Struktur Pembayaran Pelanggan
                </p>
                <table class="w-full text-xs border border-slate-200 border-collapse">
                  <thead>
                    <tr class="bg-slate-100/90 text-slate-700 text-left font-bold border-b border-slate-200">
                      <th class="py-1.5 px-2.5">Jenis Pembayaran</th>
                      <th class="py-1.5 px-2.5 text-right">Nominal</th>
                      <th class="py-1.5 px-2.5 text-right w-16">Porsi</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-200 text-slate-800">
                    <tr>
                      <td class="py-1.5 px-2.5 font-semibold text-emerald-800">Pelunasan Final Pesanan</td>
                      <td class="py-1.5 px-2.5 text-right font-mono font-bold">{{ formatRupiah(jenisBreakdown.pelunasan) }}</td>
                      <td class="py-1.5 px-2.5 text-right font-mono text-slate-600">{{ jenisBreakdown.pelunasanPct }}%</td>
                    </tr>
                    <tr>
                      <td class="py-1.5 px-2.5 font-semibold text-blue-800">Uang Muka (DP) Pesanan</td>
                      <td class="py-1.5 px-2.5 text-right font-mono font-bold">{{ formatRupiah(jenisBreakdown.dp) }}</td>
                      <td class="py-1.5 px-2.5 text-right font-mono text-slate-600">{{ jenisBreakdown.dpPct }}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- 6. BAGIAN IV: LAMPIRAN RINCIAN TRANSAKSI (MUTASI BUKU KAS) -->
          <div v-if="includeLedger && combinedTransactions.length > 0" class="mb-6">
            <div class="flex items-center justify-between pb-1.5 mb-2.5 border-b border-slate-200">
              <h3 class="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <span class="w-2 h-3.5 bg-indigo-600 rounded-xs inline-block"></span>
                IV. Lampiran Mutasi Rincian Buku Kas Lengkap
              </h3>
              <span class="text-[10px] font-mono text-slate-400">{{ combinedTransactions.length }} Catatan Transaksi</span>
            </div>

            <table class="w-full text-[11px] border border-slate-200 border-collapse">
              <thead>
                <tr class="bg-slate-100/90 text-slate-700 text-left font-bold border-b border-slate-200">
                  <th class="py-1.5 px-2 w-8 text-center">No</th>
                  <th class="py-1.5 px-2 w-20">Tanggal</th>
                  <th class="py-1.5 px-2 w-16 text-center">Arus</th>
                  <th class="py-1.5 px-2">Kategori / Akun</th>
                  <th class="py-1.5 px-2">Keterangan / Referensi</th>
                  <th class="py-1.5 px-2 text-right">Pemasukan</th>
                  <th class="py-1.5 px-2 text-right">Pengeluaran</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200 text-slate-800 font-sans">
                <tr
                  v-for="(tx, idx) in combinedTransactions"
                  :key="tx.id"
                  class="hover:bg-slate-50/50"
                  :class="idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'"
                >
                  <td class="py-1 px-2 text-center text-slate-400 font-mono">{{ idx + 1 }}</td>
                  <td class="py-1 px-2 font-mono text-slate-600 whitespace-nowrap">{{ tx.tanggal }}</td>
                  <td class="py-1 px-2 text-center">
                    <span
                      class="px-1.5 py-0.2 rounded text-[9px] font-bold font-mono"
                      :class="tx.jenis === 'MASUK' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'"
                    >
                      {{ tx.jenis }}
                    </span>
                  </td>
                  <td class="py-1 px-2 font-semibold text-slate-900 whitespace-nowrap">
                    {{ tx.kategoriOrMetode }}
                  </td>
                  <td class="py-1 px-2 text-slate-600 truncate max-w-[200px]" :title="tx.keterangan">
                    {{ tx.keterangan || '-' }}
                  </td>
                  <td class="py-1 px-2 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                    {{ tx.jenis === 'MASUK' ? formatRupiah(tx.nominal) : '-' }}
                  </td>
                  <td class="py-1 px-2 text-right font-mono font-bold text-rose-700 whitespace-nowrap">
                    {{ tx.jenis === 'KELUAR' ? formatRupiah(tx.nominal) : '-' }}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                  <td colspan="5" class="py-1.5 px-2 uppercase tracking-wider text-right">
                    Subtotal Periode Terpilih:
                  </td>
                  <td class="py-1.5 px-2 text-right font-mono font-black text-emerald-700">
                    {{ formatRupiah(totalMasuk) }}
                  </td>
                  <td class="py-1.5 px-2 text-right font-mono font-black text-rose-700">
                    {{ formatRupiah(totalKeluar) }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- 7. BAGIAN V: PERNYATAAN & CATATAN KEPATUHAN -->
          <div class="mb-8 p-3 rounded-lg border border-slate-200 bg-slate-50/60 text-xs text-slate-600 leading-relaxed page-break-avoid">
            <p class="font-bold text-slate-800 uppercase tracking-wide text-[10px] mb-1">
              Pernyataan Manajemen & Validasi Data:
            </p>
            <p>
              Dokumen ini diterbitkan secara resmi melalui Sistem Informasi Keuangan Terintegrasi Percetakan KBM. Seluruh nilai penerimaan dan pengeluaran kas yang tercantum telah melalui proses verifikasi bukti transaksi kasir, bank, dan pencatatan operasional. Dokumen ini sah digunakan sebagai dasar evaluasi manajemen internal, arsip kantor, serta pertanggungjawaban buku kas periode operasional terkait.
            </p>
          </div>

          <!-- 8. BAGIAN VI: LEMBAR PENGESAHAN DUA PIHAK (SIGNATURE BLOCK) -->
          <div class="page-break-avoid pt-2 border-t border-slate-200">
            <div class="grid grid-cols-2 gap-8 text-xs text-slate-800">
              <!-- Left Signer: Disiapkan Oleh -->
              <div class="text-center">
                <p class="text-[11px] text-slate-500 font-medium">Disiapkan & Dibuat Oleh,</p>
                <p class="font-bold text-slate-900 uppercase tracking-wide text-[11px] mt-0.5">
                  Bagian Keuangan & Administrasi
                </p>

                <!-- Space for signature & stamp -->
                <div class="h-20 flex items-center justify-center my-1 relative">
                  <div class="text-[10px] text-slate-300 border border-dashed border-slate-200 rounded px-3 py-1 font-mono">
                    [Tanda Tangan & Verifikasi]
                  </div>
                </div>

                <div class="inline-block border-t border-slate-900 pt-1 px-6 min-w-[180px]">
                  <p class="font-bold text-slate-900 font-sans leading-tight">
                    {{ drafterName }}
                  </p>
                  <p class="text-[10px] text-slate-500 font-mono mt-0.5">
                    NIP/ID: KBM-ADM-01
                  </p>
                </div>
              </div>

              <!-- Right Signer: Mengetahui & Menyetujui -->
              <div class="text-center">
                <p class="text-[11px] text-slate-500 font-medium">
                  Yogyakarta, {{ formattedToday }}
                </p>
                <p class="font-bold text-slate-900 uppercase tracking-wide text-[11px] mt-0.5">
                  Mengetahui & Menyetujui,
                </p>

                <!-- Space for signature & official company stamp -->
                <div class="h-20 flex items-center justify-center my-1 relative">
                  <div class="w-16 h-16 rounded-full border border-dashed border-red-200/80 bg-red-50/30 flex items-center justify-center text-[9px] text-red-400 font-mono font-bold uppercase rotate-[-12deg] select-none">
                    Stempel KBM
                  </div>
                </div>

                <div class="inline-block border-t border-slate-900 pt-1 px-6 min-w-[180px]">
                  <p class="font-bold text-slate-900 font-sans leading-tight">
                    {{ approverName }}
                  </p>
                  <p class="text-[10px] text-slate-500 font-sans mt-0.5">
                    Direktur / Pemilik Percetakan
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- 9. FOOTER WATERMARK / METADATA -->
          <div class="mt-8 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 font-mono">
            <span>KBM PRINTING MANAGEMENT SYSTEM • OFFICIAL OFFICE REPORT</span>
            <span>DICETAK OTOMATIS: {{ printTimestamp }}</span>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import KbmLogo from '@shared/components/KbmLogo.vue'
import { useCompanyStore } from '@shared/stores/companyStore'
import { useAuthStore } from '../../stores/auth'
import { formatRupiah, formatKategori, formatMetode } from '@shared/utils/formatters'
import type { KasMasuk, KasKeluar } from '@shared/types'

const props = defineProps<{
  modelValue: boolean
  periodLabel: string
  totalMasuk: number
  totalKeluar: number
  labaBersih: number
  profitMargin: string
  expenseRatio: string
  kategoriBreakdown: Array<{
    kategori: string
    label: string
    nominal: number
    percentage: string
  }>
  sumberBreakdown: Array<{
    sumber: string
    label: string
    nominal: number
    percentage: string
  }>
  jenisBreakdown: {
    dp: number
    pelunasan: number
    dpPct: number
    pelunasanPct: number
  }
  kasMasukList: KasMasuk[]
  kasKeluarList: KasKeluar[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const companyStore = useCompanyStore()
const authStore = useAuthStore()

const company = computed(() => companyStore.profile)

// Customizer state
const includeLedger = ref(true)
const drafterName = ref('Staff Keuangan & Akuntansi')
const approverName = ref(authStore.nama || 'Owner / Direktur KBM')

// Nomor Dokumen Otomatis
const nomorDokumen = ref(generateDocNumber())

function generateDocNumber() {
  const d = new Date()
  const yyyymm = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`
  const randSeq = String(d.getDate()).padStart(2, '0') + String(d.getHours()).padStart(2, '0')
  return `KBM/FIN-REP/${yyyymm}/${randSeq}`
}

const formattedToday = computed(() => {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
})

const printTimestamp = computed(() => {
  const now = new Date()
  return `${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`
})

function getKategoriDesc(kategori: string): string {
  switch (kategori) {
    case 'BAHAN_BAKU':
      return 'Kertas, cover, tinta, lem jilid, laminasi & plate'
    case 'OPERASIONAL':
      return 'Listrik mesin, internet, perawatan & servis alat'
    case 'GAJI':
      return 'Upah operator cetak, jilid, dan staf kantor'
    case 'KONSUMSI':
      return 'Konsumsi lembur operator & jamuan kerja'
    default:
      return 'Biaya tak terduga, ekspedisi & keperluan umum'
  }
}

// Combined transactions sorted chronologically
const combinedTransactions = computed(() => {
  const list: Array<{
    id: string
    tanggal: string
    jenis: 'MASUK' | 'KELUAR'
    kategoriOrMetode: string
    keterangan: string
    nominal: number
  }> = []

  props.kasMasukList.forEach((km) => {
    list.push({
      id: km.id_kas_masuk,
      tanggal: String(km.tanggal || ''),
      jenis: 'MASUK',
      kategoriOrMetode: formatMetode(km.metode),
      keterangan: km.keterangan || (km.id_order ? `Order #${km.id_order}` : 'Penerimaan Kasir'),
      nominal: km.nominal,
    })
  })

  props.kasKeluarList.forEach((kk) => {
    list.push({
      id: kk.id_kas_keluar,
      tanggal: String(kk.tanggal || ''),
      jenis: 'KELUAR',
      kategoriOrMetode: formatKategori(kk.kategori),
      keterangan: kk.rincian || (kk as any).keterangan || 'Operasional',
      nominal: kk.nominal,
    })
  })

  return list.sort((a, b) => (a.tanggal < b.tanggal ? -1 : 1))
})

function printPdf() {
  const originalTitle = document.title
  const sanitizedPeriod = (props.periodLabel || 'Periode').replace(/[^a-zA-Z0-9_-]/g, '_')
  document.title = `Laporan_Keuangan_Resmi_KBM_${sanitizedPeriod}`

  setTimeout(() => {
    window.print()
    setTimeout(() => {
      document.title = originalTitle
    }, 1000)
  }, 200)
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
