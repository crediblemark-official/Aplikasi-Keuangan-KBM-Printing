<template>
  <div class="w-full min-h-full bg-white fade-in">
    <!-- Header Section (Exact h-14) -->
    <PageHeader>
      <template #title>
        <div class="min-w-0">
          <h1 class="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-none truncate">
            <span class="hidden md:inline">Transaksi &amp; Piutang Order</span>
            <span class="md:hidden">Transaksi Order</span>
          </h1>
        </div>
      </template>
      <template #actions>
        <!-- Search Input -->
        <div class="w-40 sm:w-64">
          <SearchInput v-model="searchQuery" placeholder="Cari order / penerbit / judul..." />
        </div>

        <!-- Refresh Button -->
        <button
          @click="loadData"
          class="btn-secondary h-8 text-xs font-semibold inline-flex items-center gap-1.5 px-2.5 rounded-md cursor-pointer shrink-0"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span class="hidden sm:inline">Refresh</span>
        </button>

        <!-- Catat Pembayaran Order Button -->
        <BaseButton @click="openNewPaymentModal()" size="sm" class="whitespace-nowrap px-2.5 sm:px-3 shrink-0">
          <template #icon>
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </template>
          <span class="hidden sm:inline">Catat Bayar Order</span>
          <span class="sm:hidden">Bayar</span>
        </BaseButton>
      </template>
    </PageHeader>

    <!-- Summary Metrics Strip -->
    <MetricStrip :items="summaryMetrics" />

    <!-- Control Bar: Date Filter, Status Filter & Ringkasan -->
    <div class="px-[8px] sm:px-[15px] lg:px-[20px] py-2.5 border-b border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-2.5">
      <!-- Date Filter Bar (Tanggal, Bulan, Tahun, Rentang) -->
      <DateFilterBar v-model="dateFilter" />

      <!-- Status Filter Buttons & Count -->
      <div class="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto scrollbar-none py-0.5 justify-between md:justify-end">
        <div class="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto scrollbar-none flex-nowrap shrink-0 max-w-full">
          <button
            v-for="tab in filterOptions"
            :key="tab.value"
            @click="statusFilter = tab.value"
            class="px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
            :class="statusFilter === tab.value ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'"
          >
            <span>{{ tab.label }}</span>
            <span
              v-if="tab.count !== undefined"
              class="px-1.5 py-0.2 rounded-full text-[10px] font-bold shrink-0"
              :class="tab.badgeClass || (statusFilter === tab.value ? 'bg-red-50 text-red-600' : 'bg-slate-300 text-slate-700')"
            >
              {{ tab.count }}
            </span>
          </button>
        </div>

        <!-- Info Count -->
        <div class="text-xs text-slate-500 font-medium shrink-0 whitespace-nowrap">
          <strong class="text-slate-800">{{ filteredPiutangRows.length }}</strong> order
        </div>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- TABEL GABUNGAN: ORDER, RINCIAN PEMBAYARAN MASUK, & PIUTANG       -->
    <!-- ================================================================= -->
    <TableScrollWrapper>
      <table class="data-table w-full min-w-[1900px]">
        <thead>
          <!-- Baris 1: Group Headers -->
          <tr class="whitespace-nowrap">
            <th colspan="7" class="text-center font-bold text-xs border-b border-slate-300 py-2.5 text-slate-700 bg-slate-100">Info Order</th>
            <th colspan="4" class="text-center font-bold text-xs border-b border-amber-300 border-l-2 border-amber-400 py-2.5 text-amber-900 bg-amber-100">Uang Muka (DP)</th>
            <th colspan="4" class="text-center font-bold text-xs border-b border-emerald-300 border-l-2 border-emerald-400 py-2.5 text-emerald-900 bg-emerald-100">Pelunasan</th>
            <th colspan="4" class="text-center font-bold text-xs border-b border-sky-300 border-l-2 border-sky-400 py-2.5 text-sky-950 bg-sky-100">Ringkasan Tagihan</th>
          </tr>
          <!-- Baris 2: Kolom Detail -->
          <tr class="whitespace-nowrap">
            <th class="bg-slate-50 text-slate-600">ID Order</th>
            <th class="bg-slate-50 text-slate-600">Penerbit</th>
            <th class="bg-slate-50 text-slate-600">Judul</th>
            <th class="text-right bg-slate-50 text-slate-600">Qty</th>
            <th class="bg-slate-50 text-slate-600">Ukuran</th>
            <th class="bg-slate-50 text-slate-600">Kertas</th>
            <th class="text-right bg-slate-50 text-slate-600">Total Tagihan</th>
            <th class="border-l-2 border-amber-400 bg-amber-50 text-amber-800">Tgl DP</th>
            <th class="text-right bg-amber-50 text-amber-800">Nominal DP</th>
            <th class="bg-amber-50 text-amber-800">Metode DP</th>
            <th class="text-center bg-amber-50 text-amber-800">Bukti DP</th>
            <th class="border-l-2 border-emerald-400 bg-emerald-50 text-emerald-800">Tgl Pelunasan</th>
            <th class="text-right bg-emerald-50 text-emerald-800">Nominal Pelunasan</th>
            <th class="bg-emerald-50 text-emerald-800">Metode Pelunasan</th>
            <th class="text-center bg-emerald-50 text-emerald-800">Bukti Pelunasan</th>
            <th class="text-right border-l-2 border-sky-400 bg-sky-50 text-sky-800">Sudah Masuk</th>
            <th class="text-right bg-sky-50 text-sky-800">Sisa Piutang</th>
            <th class="text-center bg-sky-50 text-sky-800">Status Bayar</th>
            <th class="text-center bg-sky-50 text-sky-800">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <TableStateRow
            :colspan="19"
            :loading="isLoading"
            :is-empty="filteredPiutangRows.length === 0"
            empty-text="Tidak ada data transaksi order pada filter ini"
          />

          <tr
            v-for="row in filteredPiutangRows"
            :key="row.order.id_order"
            class="group/row hover:bg-slate-50/70 transition-colors"
          >
            <!-- 1. ID Order -->
            <td class="font-mono text-xs font-semibold text-slate-700 whitespace-nowrap align-top py-3">
              <div class="inline-flex items-center gap-1.5">
                <span>{{ row.order.id_order }}</span>
                <span
                  v-if="row.has_pending"
                  class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"
                  title="Ada transfer kasir yang menunggu verifikasi"
                ></span>
              </div>
            </td>

            <!-- 2. Penerbit -->
            <td class="font-bold text-slate-900 max-w-[150px] truncate align-top py-3" :title="row.order.nama_penerbit">
              {{ row.order.nama_penerbit }}
            </td>

            <!-- 3. Judul -->
            <td class="max-w-[200px] align-top py-3">
              <p class="font-semibold text-xs text-slate-800 truncate" :title="row.order.judul_penulis">
                {{ row.order.judul_penulis }}
              </p>
            </td>

            <!-- 4. Qty -->
            <td class="text-right align-top py-3 whitespace-nowrap font-mono font-bold text-slate-900 text-xs">
              {{ row.order.jml_pcs }}
            </td>

            <!-- 5. Ukuran -->
            <td class="align-top py-3 whitespace-nowrap text-xs text-slate-700">
              {{ row.order.ukuran_custom || row.order.ukuran }}
            </td>

            <!-- 6. Kertas -->
            <td class="align-top py-3 text-xs text-slate-600 whitespace-nowrap">
              {{ formatKertasOrder(row.order) }}
            </td>

            <!-- 4. Total Tagihan -->
            <td class="text-right font-mono font-bold text-slate-900 whitespace-nowrap align-top py-3">
              {{ formatRupiah(row.order.total_harga) }}
            </td>

            <!-- Tgl DP -->
            <td class="align-top py-3 whitespace-nowrap text-xs text-slate-700 border-l-2 border-amber-300 bg-amber-50/40 group-hover/row:bg-amber-100/70 transition-colors">
              <template v-for="tx in row.payments.filter(t => t.jenis_pembayaran === 'DP')" :key="tx.id">
                <div>{{ formatTanggal(tx.tanggal) }}</div>
              </template>
              <span v-if="row.payments.filter(t => t.jenis_pembayaran === 'DP').length === 0" class="text-slate-300 italic">—</span>
            </td>

            <!-- Nominal DP -->
            <td class="text-right align-top py-3 whitespace-nowrap text-xs font-mono font-bold bg-amber-50/40 group-hover/row:bg-amber-100/70 transition-colors"
              :class="row.payments.filter(t => t.jenis_pembayaran === 'DP').some(t => t.status_verifikasi === 'PENDING') ? 'text-amber-700' : 'text-slate-900'">
              <template v-for="tx in row.payments.filter(t => t.jenis_pembayaran === 'DP')" :key="tx.id">
                <div>{{ formatRupiah(tx.nominal) }}</div>
              </template>
              <span v-if="row.payments.filter(t => t.jenis_pembayaran === 'DP').length === 0" class="text-slate-300 font-normal italic">—</span>
            </td>

            <!-- Metode DP -->
            <td class="align-top py-3 whitespace-nowrap text-xs text-slate-700 bg-amber-50/40 group-hover/row:bg-amber-100/70 transition-colors">
              <template v-for="tx in row.payments.filter(t => t.jenis_pembayaran === 'DP')" :key="tx.id">
                <div>{{ formatMetode(tx.metode) }}</div>
              </template>
              <span v-if="row.payments.filter(t => t.jenis_pembayaran === 'DP').length === 0" class="text-slate-300 italic">—</span>
            </td>

            <!-- Bukti/Status DP -->
            <td class="text-center align-top py-3 text-xs bg-amber-50/40 group-hover/row:bg-amber-100/70 transition-colors">
              <template v-for="tx in row.payments.filter(t => t.jenis_pembayaran === 'DP')" :key="tx.id">
                <div class="flex items-center justify-center gap-1">
                  <a v-if="tx.fileId" :href="`https://drive.google.com/file/d/${tx.fileId}/view`" target="_blank" rel="noopener"
                    class="text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer">Resi</a>
                  <button v-if="tx.status_verifikasi === 'PENDING'" @click.stop="verifyTx(tx)" :disabled="verifyingId === tx.id"
                    type="button" class="px-1.5 py-0.5 font-bold rounded bg-amber-500 hover:bg-amber-600 text-white cursor-pointer transition-colors">
                    {{ verifyingId === tx.id ? '...' : 'Verif' }}
                  </button>
                  <span v-else class="text-emerald-600 font-bold" title="Terverifikasi">✓</span>
                  <!-- Tombol Edit Pembayaran DP -->
                  <button
                    @click.stop="openEditPaymentModal(tx, row.order)"
                    type="button"
                    class="p-0.5 rounded text-slate-400 hover:text-amber-700 hover:bg-amber-100/70 transition-colors cursor-pointer"
                    title="Edit Data DP"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
              </template>
              <span v-if="row.payments.filter(t => t.jenis_pembayaran === 'DP').length === 0" class="text-slate-300 italic">—</span>
            </td>

            <!-- Tgl Pelunasan -->
            <td class="align-top py-3 whitespace-nowrap text-xs text-slate-700 border-l-2 border-emerald-300 bg-emerald-50/40 group-hover/row:bg-emerald-100/70 transition-colors">
              <template v-for="tx in row.payments.filter(t => t.jenis_pembayaran !== 'DP')" :key="tx.id">
                <div>{{ formatTanggal(tx.tanggal) }}</div>
              </template>
              <span v-if="row.payments.filter(t => t.jenis_pembayaran !== 'DP').length === 0" class="text-slate-300 italic">—</span>
            </td>

            <!-- Nominal Pelunasan -->
            <td class="text-right align-top py-3 whitespace-nowrap text-xs font-mono font-bold bg-emerald-50/40 group-hover/row:bg-emerald-100/70 transition-colors"
              :class="row.payments.filter(t => t.jenis_pembayaran !== 'DP').some(t => t.status_verifikasi === 'PENDING') ? 'text-amber-700' : 'text-slate-900'">
              <template v-for="tx in row.payments.filter(t => t.jenis_pembayaran !== 'DP')" :key="tx.id">
                <div>{{ formatRupiah(tx.nominal) }}</div>
              </template>
              <span v-if="row.payments.filter(t => t.jenis_pembayaran !== 'DP').length === 0" class="text-slate-300 font-normal italic">—</span>
            </td>

            <!-- Metode Pelunasan -->
            <td class="align-top py-3 whitespace-nowrap text-xs text-slate-700 bg-emerald-50/40 group-hover/row:bg-emerald-100/70 transition-colors">
              <template v-for="tx in row.payments.filter(t => t.jenis_pembayaran !== 'DP')" :key="tx.id">
                <div>{{ formatMetode(tx.metode) }}</div>
              </template>
              <span v-if="row.payments.filter(t => t.jenis_pembayaran !== 'DP').length === 0" class="text-slate-300 italic">—</span>
            </td>

            <!-- Bukti/Status Pelunasan -->
            <td class="text-center align-top py-3 text-xs bg-emerald-50/40 group-hover/row:bg-emerald-100/70 transition-colors">
              <template v-for="tx in row.payments.filter(t => t.jenis_pembayaran !== 'DP')" :key="tx.id">
                <div class="flex items-center justify-center gap-1">
                  <a v-if="tx.fileId" :href="`https://drive.google.com/file/d/${tx.fileId}/view`" target="_blank" rel="noopener"
                    class="text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer">Resi</a>
                  <button v-if="tx.status_verifikasi === 'PENDING'" @click.stop="verifyTx(tx)" :disabled="verifyingId === tx.id"
                    type="button" class="px-1.5 py-0.5 font-bold rounded bg-amber-500 hover:bg-amber-600 text-white cursor-pointer transition-colors">
                    {{ verifyingId === tx.id ? '...' : 'Verif' }}
                  </button>
                  <span v-else class="text-emerald-600 font-bold" title="Terverifikasi">✓</span>
                  <!-- Tombol Edit Pembayaran Pelunasan -->
                  <button
                    @click.stop="openEditPaymentModal(tx, row.order)"
                    type="button"
                    class="p-0.5 rounded text-slate-400 hover:text-emerald-700 hover:bg-emerald-100/70 transition-colors cursor-pointer"
                    title="Edit Data Pelunasan"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
              </template>
              <span v-if="row.payments.filter(t => t.jenis_pembayaran !== 'DP').length === 0" class="text-slate-300 italic">—</span>
            </td>

            <!-- 6. Sudah Masuk -->
            <td class="text-right font-mono font-semibold text-emerald-700 whitespace-nowrap align-top py-3 border-l-2 border-sky-300 bg-sky-50/30 group-hover/row:bg-sky-100/60 transition-colors">
              <div class="inline-flex items-center gap-1.5 justify-end">
                <span>{{ formatRupiah(row.total_masuk ?? row.total_masuk_verified) }}</span>
                <span
                  v-if="row.has_pending"
                  class="text-[10px] text-amber-700 font-bold bg-amber-100 px-1 rounded border border-amber-300"
                  title="Ada transaksi kasir menunggu approval"
                >
                  Wait
                </span>
              </div>
            </td>

            <!-- 7. Sisa Piutang -->
            <td class="text-right font-extrabold whitespace-nowrap align-top py-3 bg-sky-50/30 group-hover/row:bg-sky-100/60 transition-colors"
                :class="row.sisa_tagihan > 0 ? 'text-rose-600' : 'text-emerald-600'">
              {{ formatRupiah(row.sisa_tagihan) }}
            </td>

            <!-- 8. Status Bayar Badge -->
            <td class="text-center whitespace-nowrap align-top py-3 bg-sky-50/30 group-hover/row:bg-sky-100/60 transition-colors">
              <StatusBadge :status="row.status_bayar" />
            </td>

            <!-- 9. Aksi -->
            <td class="text-center whitespace-nowrap align-top py-3 bg-sky-50/30 group-hover/row:bg-sky-100/60 transition-colors">
              <button
                v-if="row.sisa_tagihan > 0"
                @click="openPaymentModalForOrder(row)"
                type="button"
                class="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-all cursor-pointer inline-flex items-center gap-1"
              >
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>Bayar</span>
              </button>
              <span v-else class="text-xs text-emerald-600 font-bold inline-flex items-center gap-1">
                <span>✓ Lunas</span>
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </TableScrollWrapper>

    <!-- ================================================================= -->
    <!-- MODAL: CATAT PEMBAYARAN ORDER BARU                                -->
    <!-- ================================================================= -->
    <BaseModal v-model="showPaymentModal" title="Catat Pembayaran Order Cetak">
      <form @submit.prevent="submitPayment" class="space-y-4">
        <!-- Tanggal & Jenis Bayar -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="form-label">Tanggal Bayar *</label>
            <input v-model="paymentForm.tanggal" type="date" class="form-input bg-white" required />
          </div>
          <div>
            <label class="form-label">Jenis Pembayaran *</label>
            <select v-model="paymentForm.jenis_pembayaran" class="form-input bg-white font-medium" required>
              <option value="DP">Uang Muka (DP)</option>
              <option value="PELUNASAN">Pelunasan Tagihan</option>
            </select>
          </div>
        </div>

        <!-- Pilih Order Cetak (Wajib) -->
        <div>
          <label class="form-label">Pilih Transaksi / Order Cetak *</label>
          <select
            v-model="paymentForm.id_order"
            class="form-input bg-white font-medium"
            required
          >
            <option value="" disabled>-- Pilih Order yang akan dibayar --</option>
            <option v-for="ord in availableOrders" :key="ord.order.id_order" :value="ord.order.id_order">
              {{ ord.order.id_order }} — {{ ord.order.nama_penerbit }} — {{ ord.order.judul_penulis }} (Sisa: {{ formatRupiah(ord.sisa_tagihan) }})
            </option>
          </select>
        </div>

        <!-- Ringkasan Order Terpilih -->
        <div v-if="selectedOrder" class="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
          <div class="flex justify-between items-start">
            <div>
              <span class="text-slate-500">Judul Buku:</span>
              <span class="font-bold text-slate-900 ml-1.5">{{ selectedOrder.judul_penulis }}</span>
            </div>
            <span class="font-mono text-slate-500 font-semibold">{{ selectedOrder.id_order }}</span>
          </div>
          <div class="flex justify-between items-center text-slate-600">
            <span>Total Tagihan: <strong class="text-slate-900">{{ formatRupiah(selectedOrder.total_harga) }}</strong></span>
            <span>Sisa Tagihan: <strong class="text-rose-600 font-bold">{{ formatRupiah(selectedOrderSisa) }}</strong></span>
          </div>
          <div class="pt-1.5 flex gap-2 border-t border-slate-200/80">
            <button
              v-if="selectedOrderSisa > 0"
              type="button"
              @click="paymentForm.nominal = selectedOrderSisa"
              class="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 transition-colors cursor-pointer border border-emerald-200"
            >
              Isi Lunas ({{ formatRupiah(selectedOrderSisa) }})
            </button>
            <button
              type="button"
              @click="paymentForm.nominal = Math.round(selectedOrder.total_harga * 0.5)"
              class="px-2.5 py-1 rounded bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition-colors cursor-pointer border border-blue-200"
            >
              Isi DP 50% ({{ formatRupiah(Math.round(selectedOrder.total_harga * 0.5)) }})
            </button>
          </div>
        </div>

        <!-- Nama Penerbit (Read-only / Locked) -->
        <div>
          <label class="form-label flex items-center justify-between">
            <span>Nama Penerbit / Klien *</span>
            <span class="text-[11px] text-slate-400 font-normal flex items-center gap-1">
              <svg class="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Terkunci sesuai data order
            </span>
          </label>
          <input
            :value="paymentForm.nama_penerbit"
            type="text"
            readonly
            placeholder="Pilih order di atas terlebih dahulu"
            class="form-input bg-slate-100 text-slate-600 font-medium cursor-not-allowed select-none"
            required
          />
        </div>

        <!-- Nominal & Metode -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="form-label">Nominal Bayar *</label>
            <div class="flex rounded-lg border border-slate-300 overflow-hidden focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100 bg-white transition-all shadow-2xs">
              <span class="inline-flex items-center px-3 bg-slate-100 border-r border-slate-200 text-xs font-mono font-bold text-slate-500 select-none">
                Rp
              </span>
              <input
                :value="paymentForm.nominal ? paymentForm.nominal.toLocaleString('id-ID') : ''"
                @input="onNominalInput"
                type="text"
                inputmode="numeric"
                placeholder="0"
                class="w-full px-3 py-2 text-sm font-bold font-mono text-slate-900 outline-none border-0 bg-transparent"
                required
              />
            </div>
          </div>
          <div>
            <label class="form-label">Metode Pembayaran *</label>
            <select v-model="paymentForm.metode" class="form-input bg-white" required>
              <option value="BANK_BCA">🏦 Bank BCA</option>
              <option value="KASIR_TUNAI">💵 Kasir Tunai</option>
              <option value="QRIS">📱 QRIS</option>
            </select>
          </div>
        </div>

        <!-- Catatan -->
        <div>
          <label class="form-label">Catatan / Rincian Pembayaran</label>
          <textarea
            v-model="paymentForm.keterangan"
            rows="2"
            placeholder="Contoh: Pembayaran DP 50% via transfer m-banking"
            class="form-input resize-none bg-white"
          ></textarea>
        </div>

        <!-- Upload Bukti Transfer -->
        <div>
          <label class="form-label">Upload Bukti Transfer / Resi (Opsional)</label>
          <ImageUploader
            label="Pilih / Foto Bukti Transfer"
            sublabel="Otomatis dikompres sebelum upload"
            @change="handlePhotoChange"
          />
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3 pt-2">
          <BaseButton variant="secondary" type="button" @click="showPaymentModal = false" class="flex-1">
            Batal
          </BaseButton>
          <BaseButton type="submit" :loading="isSubmittingPayment" class="flex-1">
            Simpan Pembayaran Order
          </BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- ================================================================= -->
    <!-- MODAL: EDIT PEMBAYARAN ORDER (KOREKSI DP / PELUNASAN)             -->
    <!-- ================================================================= -->
    <BaseModal v-model="showEditPaymentModal" :title="`Edit Pembayaran (${editPaymentForm.jenis_pembayaran === 'DP' ? 'Uang Muka DP' : 'Pelunasan'})`">
      <form @submit.prevent="submitEditPayment" class="space-y-4">
        <!-- Info Order Terkait -->
        <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
          <div class="flex items-center justify-between">
            <span class="text-slate-500 font-mono">Order: <strong class="text-slate-800">{{ editPaymentForm.id_order }}</strong></span>
            <span class="font-mono text-slate-500">ID Kas: <strong class="text-slate-800">{{ editPaymentForm.id_kas_masuk }}</strong></span>
          </div>
          <p class="font-bold text-slate-900 truncate">{{ editPaymentForm.judul }}</p>
          <p class="text-slate-600 font-semibold">{{ editPaymentForm.nama_penerbit }} • Total Tagihan: {{ formatRupiah(editPaymentForm.total_harga) }}</p>
        </div>

        <!-- Tanggal & Metode Bayar -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="form-label">Tanggal Bayar *</label>
            <input v-model="editPaymentForm.tanggal" type="date" class="form-input bg-white" required />
          </div>
          <div>
            <label class="form-label">Metode Pembayaran *</label>
            <select v-model="editPaymentForm.metode" class="form-input bg-white font-medium" required>
              <option value="BANK_BCA">🏦 Bank BCA</option>
              <option value="KASIR_TUNAI">💵 Kasir Tunai</option>
              <option value="QRIS">📱 QRIS</option>
              <option value="SALDO_DEPOSIT">💳 Saldo Deposit</option>
            </select>
          </div>
        </div>

        <!-- Nominal -->
        <div>
          <label class="form-label">Nominal Bayar *</label>
          <div class="flex rounded-lg border border-slate-300 overflow-hidden focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100 bg-white transition-all shadow-2xs">
            <span class="inline-flex items-center px-3 bg-slate-100 border-r border-slate-200 text-xs font-mono font-bold text-slate-500 select-none">
              Rp
            </span>
            <input
              :value="editPaymentForm.nominal ? editPaymentForm.nominal.toLocaleString('id-ID') : ''"
              @input="onEditPaymentNominalInput"
              type="text"
              inputmode="numeric"
              placeholder="0"
              class="w-full px-3 py-2 text-sm font-bold font-mono text-slate-900 outline-none border-0 bg-transparent"
              required
            />
          </div>
        </div>

        <!-- Catatan -->
        <div>
          <label class="form-label">Catatan / Keterangan Pembayaran</label>
          <input
            v-model="editPaymentForm.keterangan"
            type="text"
            placeholder="Catatan rincian pembayaran..."
            class="form-input bg-white"
          />
        </div>

        <!-- Action Buttons -->
        <div class="pt-3 flex items-center justify-between gap-2 border-t border-slate-100">
          <button
            @click="showDeletePaymentConfirmModal = true"
            type="button"
            class="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200 cursor-pointer"
            :disabled="isSubmittingEditPayment"
          >
            Batalkan Pembayaran Ini
          </button>
          <div class="flex items-center gap-2">
            <button
              @click="showEditPaymentModal = false"
              type="button"
              class="btn-secondary text-xs px-3 py-1.5"
              :disabled="isSubmittingEditPayment"
            >
              Batal
            </button>
            <button
              type="submit"
              class="btn-primary text-xs px-4 py-1.5"
              :disabled="isSubmittingEditPayment || !editPaymentForm.nominal"
            >
              {{ isSubmittingEditPayment ? 'Menyimpan...' : 'Simpan Perubahan' }}
            </button>
          </div>
        </div>
      </form>
    </BaseModal>

    <!-- Modern Styled Confirm Modal for Cancel/Delete Payment -->
    <ConfirmModal
      v-model="showDeletePaymentConfirmModal"
      title="Batalkan Pembayaran Order?"
      :message="`Yakin ingin membatalkan/menghapus pembayaran ${editPaymentForm.id_kas_masuk}?`"
      detail="Data kas dan sisa piutang order cetak ini akan otomatis disesuaikan dan dihitung ulang."
      confirm-text="Ya, Batalkan Pembayaran"
      cancel-text="Kembali"
      type="danger"
      :loading="isSubmittingEditPayment"
      @confirm="executeDeletePayment()"
    />

    <!-- Snackbar Toast (Success & Error support) -->
    <transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-2.5"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-300 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2.5"
    >
      <div
        v-if="snackbar"
        class="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-[10000] px-5 py-3 rounded-xl text-sm font-semibold shadow-xl flex items-center gap-2.5"
        :class="snackbarType === 'error' ? 'bg-rose-600 text-white shadow-rose-200' : 'bg-emerald-600 text-white shadow-emerald-200'"
      >
        <svg v-if="snackbarType === 'error'" class="w-4 h-4 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <svg v-else class="w-4 h-4 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>{{ snackbar }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@shared/components/PageHeader.vue'
import BaseButton from '@shared/components/BaseButton.vue'
import MetricStrip from '@shared/components/MetricStrip.vue'
import TableStateRow from '@shared/components/TableStateRow.vue'
import StatusBadge from '@shared/components/StatusBadge.vue'
import TableScrollWrapper from '@shared/components/TableScrollWrapper.vue'
import BaseModal from '@shared/components/BaseModal.vue'
import ConfirmModal from '@shared/components/ConfirmModal.vue'
import ImageUploader from '@shared/components/ImageUploader.vue'
import SearchInput from '@shared/components/SearchInput.vue'
import DateFilterBar from '@shared/components/DateFilterBar.vue'
import { api } from '@shared/api/gasClient'
import { useAuthStore } from '../stores/auth'
import {
  formatRupiah,
  formatTanggal,
  formatMetode,
  formatKertasOrder,
  hitungStatusBayar,
  getTodayISO,
  isDateInFilterRange,
} from '@shared/utils/formatters'
import type { KasMasuk, Order, SumberKas, PiutangRow, DateFilterValue } from '@shared/types'

const route = useRoute()
const authStore = useAuthStore()

const isLoading = ref(false)
const isSubmittingPayment = ref(false)
const verifyingId = ref<string | null>(null)
const snackbar = ref('')
const snackbarType = ref<'success' | 'error'>('success')
const searchQuery = ref('')
const statusFilter = ref<'ALL' | 'PIUTANG' | 'LUNAS' | 'PENDING_VERIF'>('ALL')
const dateFilter = ref<DateFilterValue>({ mode: 'ALL' })

function showToast(msg: string, type: 'success' | 'error' = 'success') {
  snackbar.value = msg
  snackbarType.value = type
  setTimeout(() => {
    if (snackbar.value === msg) snackbar.value = ''
  }, 4000)
}

// Modal Edit Pembayaran Order
const showEditPaymentModal = ref(false)
const showDeletePaymentConfirmModal = ref(false)
const isSubmittingEditPayment = ref(false)
const editPaymentForm = ref({
  id_kas_masuk: '',
  id_order: '',
  judul: '',
  nama_penerbit: '',
  total_harga: 0,
  jenis_pembayaran: 'DP',
  tanggal: '',
  nominal: 0,
  metode: 'BANK_BCA',
  keterangan: '',
})

// Raw Data
const kasMasukList = ref<KasMasuk[]>([])
const ordersList = ref<Order[]>([])

export interface OrderTxRow {
  id: string
  tanggal: string
  id_order?: string | null
  nama_penerbit: string
  judul_buku?: string
  jenis_pembayaran: string
  metode: string
  nominal: number
  status_verifikasi: string
  fileId?: string
  keterangan?: string
}

export interface EnrichedPiutangRow extends PiutangRow {
  payments: OrderTxRow[]
}

// All payments linked to orders
const allOrdersTx = computed<OrderTxRow[]>(() => {
  return kasMasukList.value
    .filter((k) => {
      if (k.jenis_pembayaran === 'NON_ORDER' || k.jenis_pembayaran === 'DEPOSIT') {
        return false
      }
      return true
    })
    .map((k) => {
      const order = ordersList.value.find((o) => o.id_order === k.id_order)
      return {
        id: k.id_kas_masuk,
        tanggal: k.tanggal,
        id_order: k.id_order,
        nama_penerbit: (k.nama_penerbit || order?.nama_penerbit || '-').trim(),
        judul_buku: order?.judul_penulis || '',
        jenis_pembayaran: k.jenis_pembayaran,
        metode: k.metode,
        nominal: k.nominal,
        status_verifikasi: k.status_verifikasi,
        fileId: k.file_id_bukti,
        keterangan: k.keterangan,
      }
    })
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
})

const pendingVerifikasiCount = computed(() => allOrdersTx.value.filter((t) => t.status_verifikasi === 'PENDING').length)

// Master Rows (Orders with payments attached directly)
const piutangRows = computed<EnrichedPiutangRow[]>(() => {
  return ordersList.value.map((order) => {
    const payments = allOrdersTx.value.filter((tx) => tx.id_order === order.id_order)
    const total_masuk = payments.reduce((s, k) => s + k.nominal, 0)
    const total_masuk_verified = payments
      .filter((k) => k.status_verifikasi === 'VERIFIED')
      .reduce((s, k) => s + k.nominal, 0)
    const has_pending = payments.some((k) => k.status_verifikasi === 'PENDING')
    const sisa_tagihan = Math.max(0, order.total_harga - total_masuk)
    const status_bayar = hitungStatusBayar(total_masuk, order.total_harga)

    return {
      order,
      total_masuk,
      total_masuk_verified,
      has_pending,
      sisa_tagihan,
      status_bayar,
      payments,
    }
  })
})

const filterOptions = computed(() => [
  { value: 'ALL' as const, label: 'Semua Order', count: piutangRows.value.length },
  {
    value: 'PIUTANG' as const,
    label: 'Ada Piutang',
    count: piutangRows.value.filter((r) => r.sisa_tagihan > 0).length,
    badgeClass: 'bg-rose-50 text-rose-600 font-bold',
  },
  {
    value: 'LUNAS' as const,
    label: 'Lunas',
    count: piutangRows.value.filter((r) => r.sisa_tagihan <= 0).length,
    badgeClass: 'bg-emerald-50 text-emerald-700 font-bold',
  },
  {
    value: 'PENDING_VERIF' as const,
    label: 'Perlu Verifikasi',
    count: piutangRows.value.filter((r) => r.has_pending).length,
    badgeClass: piutangRows.value.some((r) => r.has_pending)
      ? 'bg-amber-500 text-white font-extrabold animate-pulse'
      : 'bg-slate-300 text-slate-600',
  },
])

const filteredPiutangRows = computed(() => {
  return piutangRows.value.filter((r) => {
    if (statusFilter.value === 'PIUTANG' && r.sisa_tagihan <= 0) return false
    if (statusFilter.value === 'LUNAS' && r.sisa_tagihan > 0) return false
    if (statusFilter.value === 'PENDING_VERIF' && !r.has_pending) return false

    // Date filter: mencakup tanggal order dibuat ataupun transaksi pembayaran masuk
    if (dateFilter.value.mode !== 'ALL') {
      const orderMatch = isDateInFilterRange(r.order.tanggal, dateFilter.value)
      const payMatch = r.payments.some((p) => isDateInFilterRange(p.tanggal, dateFilter.value))
      if (!orderMatch && !payMatch) return false
    }

    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase()
      return (
        r.order.nama_penerbit.toLowerCase().includes(q) ||
        r.order.judul_penulis.toLowerCase().includes(q) ||
        r.order.id_order.toLowerCase().includes(q)
      )
    }
    return true
  })
})

const totalTagihanPiutang = computed(() => filteredPiutangRows.value.reduce((s, r) => s + r.order.total_harga, 0))
const totalMasukPiutang = computed(() => filteredPiutangRows.value.reduce((s, r) => s + (r.total_masuk ?? r.total_masuk_verified), 0))
const totalSisaPiutang = computed(() => filteredPiutangRows.value.reduce((s, r) => s + r.sisa_tagihan, 0))
const orderLunasCount = computed(() => filteredPiutangRows.value.filter((r) => r.sisa_tagihan <= 0).length)
const filteredPendingVerifikasiCount = computed(() => filteredPiutangRows.value.filter((r) => r.has_pending).length)

// Summary Metrics Bar
const summaryMetrics = computed(() => [
  {
    label: 'Order Aktif',
    value: filteredPiutangRows.value.filter((r) => r.order.status_order === 'PROSES').length,
    minWidth: 'min-w-[120px]',
  },
  {
    label: 'Total Nilai Tagihan',
    value: formatRupiah(totalTagihanPiutang.value),
    minWidth: 'min-w-[140px]',
  },
  {
    label: 'Total Terbayar',
    value: formatRupiah(totalMasukPiutang.value),
    valueClass: 'text-emerald-600',
    minWidth: 'min-w-[140px]',
  },
  {
    label: 'Sisa Piutang',
    value: formatRupiah(totalSisaPiutang.value),
    valueClass: 'text-rose-600',
    minWidth: 'min-w-[140px]',
  },
  {
    label: 'Perlu Verifikasi',
    value: filteredPendingVerifikasiCount.value > 0 ? `${filteredPendingVerifikasiCount.value} Order` : '0 Pending',
    valueClass: filteredPendingVerifikasiCount.value > 0 ? 'text-amber-600 font-extrabold' : 'text-slate-600',
    sub: filteredPendingVerifikasiCount.value > 0 ? 'Menunggu Approval Owner' : 'Semua Tervalidasi',
    subClass: filteredPendingVerifikasiCount.value > 0 ? 'text-amber-600' : 'text-slate-400',
    subDot: filteredPendingVerifikasiCount.value > 0 ? 'bg-amber-500' : 'bg-emerald-500',
    minWidth: 'min-w-[160px]',
  },
  {
    label: 'Order Lunas',
    value: `${orderLunasCount.value} / ${filteredPiutangRows.value.length}`,
    valueClass: 'text-emerald-700',
    minWidth: 'min-w-[130px]',
  },
])

// Modal State
const showPaymentModal = ref(false)
const photoBase64 = ref('')
const photoFilename = ref('')

const paymentForm = ref({
  tanggal: getTodayISO(),
  jenis_pembayaran: 'DP' as 'DP' | 'PELUNASAN',
  id_order: '',
  nama_penerbit: '',
  nominal: 0,
  metode: 'BANK_BCA' as SumberKas,
  keterangan: '',
})

function openNewPaymentModal() {
  paymentForm.value = {
    tanggal: getTodayISO(),
    jenis_pembayaran: 'DP',
    id_order: '',
    nama_penerbit: '',
    nominal: 0,
    metode: 'BANK_BCA',
    keterangan: '',
  }
  photoBase64.value = ''
  photoFilename.value = ''
  showPaymentModal.value = true
}

function openPaymentModalForOrder(row: PiutangRow) {
  const isPelunasan = row.status_bayar === 'DP' || row.status_bayar === 'KURANG_BAYAR'
  paymentForm.value = {
    tanggal: getTodayISO(),
    jenis_pembayaran: isPelunasan ? 'PELUNASAN' : 'DP',
    id_order: row.order.id_order,
    nama_penerbit: row.order.nama_penerbit,
    nominal: row.sisa_tagihan > 0 ? row.sisa_tagihan : Math.round(row.order.total_harga * 0.5),
    metode: 'BANK_BCA',
    keterangan: `Pembayaran ${isPelunasan ? 'Pelunasan' : 'DP'} Order ${row.order.id_order}`,
  }
  photoBase64.value = ''
  photoFilename.value = ''
  showPaymentModal.value = true
}

const availableOrders = computed(() => {
  return ordersList.value
    .map((order) => {
      const orderPayments = kasMasukList.value.filter(
        (k) => k.id_order === order.id_order && (k as any).status_verifikasi !== 'BATAL'
      )
      const paid = orderPayments.reduce((s, k) => s + k.nominal, 0)
      const sisa = Math.max(0, order.total_harga - paid)
      return { order, sisa_tagihan: sisa, total_bayar: paid }
    })
    .filter((item) => item.sisa_tagihan > 0 || item.order.status_order === 'PROSES')
    .sort((a, b) => b.order.id_order.localeCompare(a.order.id_order))
})

const selectedOrder = computed(() => {
  if (!paymentForm.value.id_order) return null
  return ordersList.value.find((o) => o.id_order === paymentForm.value.id_order) || null
})

const selectedOrderSisa = computed(() => {
  if (!selectedOrder.value) return 0
  const orderPayments = kasMasukList.value.filter(
    (k) => k.id_order === selectedOrder.value!.id_order && (k as any).status_verifikasi !== 'BATAL'
  )
  const paid = orderPayments.reduce((s, k) => s + k.nominal, 0)
  return Math.max(0, selectedOrder.value.total_harga - paid)
})

watch(
  () => paymentForm.value.id_order,
  (newId) => {
    if (newId && selectedOrder.value) {
      paymentForm.value.nama_penerbit = selectedOrder.value.nama_penerbit
      if (paymentForm.value.jenis_pembayaran === 'PELUNASAN' && selectedOrderSisa.value > 0) {
        paymentForm.value.nominal = selectedOrderSisa.value
      } else if (paymentForm.value.jenis_pembayaran === 'DP' && !paymentForm.value.nominal) {
        paymentForm.value.nominal = Math.round(selectedOrder.value.total_harga * 0.5)
      }
    }
  }
)

watch(
  () => paymentForm.value.jenis_pembayaran,
  (newJenis) => {
    if (newJenis === 'PELUNASAN' && selectedOrder.value && selectedOrderSisa.value > 0) {
      paymentForm.value.nominal = selectedOrderSisa.value
    } else if (newJenis === 'DP' && selectedOrder.value) {
      paymentForm.value.nominal = Math.round(selectedOrder.value.total_harga * 0.5)
    }
  }
)

function onNominalInput(e: Event) {
  const input = e.target as HTMLInputElement
  const clean = input.value.replace(/\D/g, '')
  const num = parseInt(clean, 10) || 0
  paymentForm.value.nominal = num
  input.value = num ? num.toLocaleString('id-ID') : ''
}

function handlePhotoChange(uploadData: { base64: string; filename: string } | null) {
  if (uploadData) {
    photoBase64.value = uploadData.base64
    photoFilename.value = uploadData.filename
  } else {
    photoBase64.value = ''
    photoFilename.value = ''
  }
}

async function verifyTx(tx: OrderTxRow) {
  verifyingId.value = tx.id
  try {
    const res = await api.verifyKasMasuk(tx.id, authStore.nama ?? 'OWNER')
    if (res.success) {
      const item = kasMasukList.value.find((k) => k.id_kas_masuk === tx.id)
      if (item) item.status_verifikasi = 'VERIFIED'
      snackbar.value = `Pembayaran ${formatRupiah(tx.nominal)} berhasil diverifikasi!`
      setTimeout(() => { snackbar.value = '' }, 3000)
    }
  } catch (e) {
    console.error('Gagal verifikasi:', e)
  } finally {
    verifyingId.value = null
  }
}

async function submitPayment() {
  if (!paymentForm.value.id_order) {
    showToast('Silakan pilih Transaksi / Order Cetak terlebih dahulu', 'error')
    return
  }
  if (!paymentForm.value.nominal || paymentForm.value.nominal <= 0) {
    showToast('Nominal harus lebih besar dari 0', 'error')
    return
  }

  isSubmittingPayment.value = true
  try {
    const res = await api.createKasMasuk({
      id_order: paymentForm.value.id_order.trim(),
      jenis_pembayaran: paymentForm.value.jenis_pembayaran,
      nominal: paymentForm.value.nominal,
      metode: paymentForm.value.metode,
      diinput_oleh: authStore.nama || 'OWNER',
      status_verifikasi: 'VERIFIED',
      nama_penerbit: paymentForm.value.nama_penerbit?.trim(),
      tanggal: paymentForm.value.tanggal,
      keterangan: paymentForm.value.keterangan?.trim(),
      foto_base64: photoBase64.value || undefined,
      foto_filename: photoFilename.value || undefined,
    })

    if (res.success) {
      showPaymentModal.value = false
      showToast(`Pembayaran Order ${formatRupiah(paymentForm.value.nominal)} berhasil dicatat!`, 'success')
      paymentForm.value = {
        tanggal: getTodayISO(),
        jenis_pembayaran: 'DP',
        id_order: '',
        nama_penerbit: '',
        nominal: 0,
        metode: 'BANK_BCA',
        keterangan: '',
      }
      photoBase64.value = ''
      photoFilename.value = ''
      await loadData()
    } else {
      showToast('Gagal menyimpan pembayaran: ' + (res.error || 'Terjadi kesalahan'), 'error')
    }
  } catch (err: any) {
    console.error('Submit payment error:', err)
    showToast(err?.message || 'Terjadi kesalahan jaringan saat menyimpan pembayaran.', 'error')
  } finally {
    isSubmittingPayment.value = false
  }
}

function onEditPaymentNominalInput(e: Event) {
  const input = e.target as HTMLInputElement
  const clean = input.value.replace(/\D/g, '')
  const num = parseInt(clean, 10) || 0
  editPaymentForm.value.nominal = num
}

function openEditPaymentModal(tx: OrderTxRow, order: Order) {
  editPaymentForm.value = {
    id_kas_masuk: tx.id,
    id_order: order.id_order,
    judul: order.judul_penulis,
    nama_penerbit: order.nama_penerbit,
    total_harga: order.total_harga,
    jenis_pembayaran: tx.jenis_pembayaran,
    tanggal: tx.tanggal ? tx.tanggal.split('T')[0] : getTodayISO(),
    nominal: tx.nominal,
    metode: tx.metode,
    keterangan: tx.keterangan || '',
  }
  showEditPaymentModal.value = true
}

async function submitEditPayment() {
  if (!editPaymentForm.value.id_kas_masuk || editPaymentForm.value.nominal <= 0) return
  isSubmittingEditPayment.value = true
  try {
    const res = await api.updateKasMasuk({
      id_kas_masuk: editPaymentForm.value.id_kas_masuk,
      tanggal: editPaymentForm.value.tanggal,
      nominal: editPaymentForm.value.nominal,
      metode: editPaymentForm.value.metode,
      keterangan: editPaymentForm.value.keterangan,
    })
    if (!res.success) {
      showToast(res.error || 'Gagal memperbarui pembayaran', 'error')
      return
    }
    showEditPaymentModal.value = false
    showToast('Pembayaran order berhasil diperbarui!', 'success')
    await loadData()
  } catch (err: any) {
    showToast(err?.message || 'Terjadi kesalahan jaringan saat memperbarui pembayaran', 'error')
  } finally {
    isSubmittingEditPayment.value = false
  }
}

const executeDeletePayment = async () => {
  if (!editPaymentForm.value.id_kas_masuk) return

  isSubmittingEditPayment.value = true
  try {
    const res = await api.deleteKasMasuk(editPaymentForm.value.id_kas_masuk)
    if (!res.success) {
      showToast(res.error || 'Gagal membatalkan pembayaran', 'error')
      return
    }
    showDeletePaymentConfirmModal.value = false
    showEditPaymentModal.value = false
    showToast('Pembayaran order berhasil dibatalkan!', 'success')
    await loadData()
  } catch (err: any) {
    showToast(err?.message || 'Terjadi kesalahan jaringan saat membatalkan pembayaran', 'error')
  } finally {
    isSubmittingEditPayment.value = false
  }
}

async function loadData() {
  isLoading.value = true
  try {
    const [kmRes, ordRes] = await Promise.all([
      api.getKasMasuk(),
      api.getOrders().catch(() => ({ success: false, data: [] })),
    ])
    if (kmRes.success && kmRes.data) kasMasukList.value = kmRes.data
    if (ordRes.success && ordRes.data) ordersList.value = ordRes.data
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
  if (route.query.tab === 'verifikasi') {
    statusFilter.value = 'PENDING_VERIF'
  }
  if (route.query.action === 'new-payment') {
    openNewPaymentModal()
  }
})
</script>


