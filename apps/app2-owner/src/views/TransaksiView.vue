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
          @click="loadData(true)"
          :disabled="isLoading || isRefreshing"
          class="btn-secondary h-8 text-xs font-semibold inline-flex items-center gap-1.5 px-2.5 rounded-md cursor-pointer shrink-0 disabled:opacity-50"
        >
          <svg class="w-3.5 h-3.5" :class="{ 'animate-spin': isLoading || isRefreshing }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span class="hidden sm:inline">{{ isRefreshing ? 'Menyinkronkan...' : 'Refresh' }}</span>
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

    <!-- Alert Rekonsiliasi Kas Tanpa Order -->
    <div
      v-if="totalUnlinkedNominal > 0"
      class="px-[8px] sm:px-[15px] lg:px-[20px] py-2 bg-amber-50 border-b border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
    >
      <div class="flex items-center gap-2 text-amber-900 font-medium">
        <span class="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
        <span>
          <strong>Rekonsiliasi Kas:</strong> Ditemukan <strong>{{ dateFilteredUnlinkedPayments.length }} transaksi kas masuk</strong> senilai <strong class="font-mono text-amber-800">{{ formatRupiah(totalUnlinkedNominal) }}</strong> yang tercatat di Buku Kas tetapi nomor ordernya tidak ada di daftar pesanan aktif.
        </span>
      </div>
      <button
        type="button"
        @click="statusFilter = statusFilter === 'UNLINKED' ? 'ALL' : 'UNLINKED'"
        class="text-amber-800 font-bold hover:underline shrink-0 text-left sm:text-right cursor-pointer"
      >
        {{ statusFilter === 'UNLINKED' ? 'Kembali ke Semua Order' : 'Lihat Data Kas Tanpa Order →' }}
      </button>
    </div>

    <!-- Control Bar: Date Filter, Status Filter & Ringkasan (Sticky) -->
    <div class="sticky top-0 z-30 px-[8px] sm:px-[15px] lg:px-[20px] py-2 border-b border-slate-200 bg-white flex flex-col xl:flex-row xl:items-center justify-between gap-2.5 shadow-xs">
      <!-- Date Filter Bar (Tanggal, Bulan, Tahun, Rentang) -->
      <div class="shrink-0 overflow-x-auto scrollbar-none">
        <DateFilterBar v-model="dateFilter" />
      </div>

      <!-- Status Filter Buttons & Count -->
      <div class="flex items-center gap-2.5 w-full xl:w-auto overflow-x-auto scrollbar-none py-0.5 justify-between xl:justify-end shrink-0">
        <div class="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto scrollbar-none flex-nowrap shrink-0">
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
        <div class="text-xs text-slate-500 font-medium shrink-0 whitespace-nowrap pl-1">
          <span v-if="statusFilter === 'UNLINKED'">
            <strong class="text-slate-800">{{ filteredUnlinkedPayments.length }}</strong> transaksi tanpa order
          </span>
          <span v-else-if="hasMoreRows">
            Menampilkan <strong class="text-slate-800">{{ displayedPiutangRows.length }}</strong> dari <strong class="text-slate-800">{{ filteredPiutangRows.length }}</strong> order
          </span>
          <span v-else>
            <strong class="text-slate-800">{{ filteredPiutangRows.length }}</strong> order
          </span>
        </div>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- TABEL REKONSILIASI: KAS MASUK TANPA ORDER                         -->
    <!-- ================================================================= -->
    <TableScrollWrapper v-if="statusFilter === 'UNLINKED'">
      <div class="p-3.5 sm:p-4 bg-amber-50/60 border-b border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h4 class="text-xs sm:text-sm font-bold text-amber-950 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
            Daftar Kas Masuk Tanpa Order (Tercatat di Buku Kas)
          </h4>
          <p class="text-[11px] sm:text-xs text-amber-800 mt-0.5">
            Transaksi uang masuk di bawah ini berstatus terverifikasi dan masuk ke saldo Buku Kas, namun nomor order referensinya tidak ada di sheet Orders.
          </p>
        </div>
        <div class="sm:text-right shrink-0">
          <span class="text-[11px] font-semibold text-slate-500 block">Total Nominal:</span>
          <span class="text-base font-black font-mono text-amber-800">{{ formatRupiah(totalUnlinkedNominal) }}</span>
        </div>
      </div>
      <table class="data-table w-full min-w-[1000px]">
        <thead>
          <tr class="whitespace-nowrap bg-slate-50 text-slate-600 text-xs">
            <th class="py-2.5 px-3 text-left">ID Kas Masuk</th>
            <th class="py-2.5 px-3 text-left">Tanggal</th>
            <th class="py-2.5 px-3 text-left">Nomor Order Terkait</th>
            <th class="py-2.5 px-3 text-left">Nama Penerbit</th>
            <th class="py-2.5 px-3 text-left">Jenis Bayar</th>
            <th class="py-2.5 px-3 text-left">Metode Kas</th>
            <th class="py-2.5 px-3 text-right">Nominal Masuk</th>
            <th class="py-2.5 px-3 text-center">Status Verifikasi</th>
            <th class="py-2.5 px-3 text-left">Keterangan</th>
            <th class="py-2.5 px-3 text-center">Bukti Resi</th>
            <th class="py-2.5 px-3 text-center">Tindakan</th>
          </tr>
        </thead>
        <tbody>
          <TableStateRow
            :colspan="11"
            :loading="isLoading"
            :is-empty="filteredUnlinkedPayments.length === 0"
            empty-text="Tidak ada data kas masuk tanpa order pada periode ini"
          />
          <tr
            v-for="item in filteredUnlinkedPayments"
            :key="item.id"
            class="hover:bg-amber-50/30 transition-colors"
          >
            <td class="font-mono font-bold text-xs text-slate-800 px-3 py-3 whitespace-nowrap">{{ item.id }}</td>
            <td class="whitespace-nowrap text-xs text-slate-700 px-3 py-3">{{ formatTanggal(item.tanggal) }}</td>
            <td class="px-3 py-3 whitespace-nowrap">
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                <span>{{ item.id_order || 'Tanpa ID Order' }}</span>
                <span class="text-[10px] text-rose-500 font-sans font-medium">(Tidak Ada di Order)</span>
              </span>
            </td>
            <td class="font-medium text-xs text-slate-900 px-3 py-3 whitespace-nowrap">{{ item.nama_penerbit }}</td>
            <td class="text-xs text-slate-700 px-3 py-3 whitespace-nowrap">{{ item.jenis_pembayaran }}</td>
            <td class="text-xs text-slate-700 px-3 py-3 whitespace-nowrap">{{ formatMetode(item.metode) }}</td>
            <td class="text-right font-mono font-bold text-xs text-emerald-600 px-3 py-3 whitespace-nowrap">
              {{ formatRupiah(item.nominal) }}
            </td>
            <td class="text-center px-3 py-3 whitespace-nowrap">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {{ item.status_verifikasi }}
              </span>
            </td>
            <td class="text-xs text-slate-600 max-w-[260px] truncate px-3 py-3" :title="item.keterangan">
              {{ item.keterangan || '-' }}
            </td>
            <td class="text-center px-3 py-3 whitespace-nowrap">
              <a
                v-if="item.fileId"
                :href="`https://drive.google.com/file/d/${item.fileId}/view`"
                target="_blank"
                rel="noopener"
                class="text-blue-600 hover:text-blue-800 font-bold underline text-xs"
              >
                Lihat
              </a>
              <span v-else class="text-slate-300 text-xs italic">-</span>
            </td>
            <td class="text-center px-3 py-3 whitespace-nowrap">
              <button
                @click="router.push('/dashboard/buku-kas')"
                type="button"
                class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1"
              >
                <span>Buku Kas</span>
                <svg class="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </TableScrollWrapper>

    <!-- ================================================================= -->
    <!-- TABEL GABUNGAN: ORDER, RINCIAN PEMBAYARAN MASUK, & PIUTANG       -->
    <!-- ================================================================= -->
    <TableScrollWrapper v-else>
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
            v-for="row in displayedPiutangRows"
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
              <template v-for="tx in row.dpPayments" :key="tx.id">
                <div>{{ formatTanggal(tx.tanggal) }}</div>
              </template>
              <span v-if="row.dpPayments.length === 0" class="text-slate-300 italic">—</span>
            </td>

            <!-- Nominal DP -->
            <td
              class="text-right align-top py-3 whitespace-nowrap text-xs font-mono font-bold bg-amber-50/40 group-hover/row:bg-amber-100/70 transition-colors"
              :class="row.dpPending ? 'text-amber-700' : 'text-slate-900'"
            >
              <template v-for="tx in row.dpPayments" :key="tx.id">
                <div>{{ formatRupiah(tx.nominal) }}</div>
              </template>
              <span v-if="row.dpPayments.length === 0" class="text-slate-300 font-normal italic">—</span>
            </td>

            <!-- Metode DP -->
            <td class="align-top py-3 whitespace-nowrap text-xs text-slate-700 bg-amber-50/40 group-hover/row:bg-amber-100/70 transition-colors">
              <template v-for="tx in row.dpPayments" :key="tx.id">
                <div>{{ formatMetode(tx.metode) }}</div>
              </template>
              <span v-if="row.dpPayments.length === 0" class="text-slate-300 italic">—</span>
            </td>

            <!-- Bukti/Status DP -->
            <td class="text-center align-top py-3 text-xs bg-amber-50/40 group-hover/row:bg-amber-100/70 transition-colors">
              <template v-for="tx in row.dpPayments" :key="tx.id">
                <div class="flex items-center justify-center gap-1">
                  <a
                    v-if="tx.fileId"
                    :href="`https://drive.google.com/file/d/${tx.fileId}/view`"
                    target="_blank"
                    rel="noopener"
                    class="text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                  >
                    Resi
                  </a>
                  <button
                    v-if="tx.status_verifikasi === 'PENDING'"
                    @click.stop="verifyTx(tx)"
                    :disabled="verifyingId === tx.id"
                    type="button"
                    class="px-1.5 py-0.5 font-bold rounded bg-amber-500 hover:bg-amber-600 text-white cursor-pointer transition-colors"
                  >
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
              <span v-if="row.dpPayments.length === 0" class="text-slate-300 italic">—</span>
            </td>

            <!-- Tgl Pelunasan -->
            <td class="align-top py-3 whitespace-nowrap text-xs text-slate-700 border-l-2 border-emerald-300 bg-emerald-50/40 group-hover/row:bg-emerald-100/70 transition-colors">
              <template v-for="tx in row.pelunasanPayments" :key="tx.id">
                <div>{{ formatTanggal(tx.tanggal) }}</div>
              </template>
              <span v-if="row.pelunasanPayments.length === 0" class="text-slate-300 italic">—</span>
            </td>

            <!-- Nominal Pelunasan -->
            <td
              class="text-right align-top py-3 whitespace-nowrap text-xs font-mono font-bold bg-emerald-50/40 group-hover/row:bg-emerald-100/70 transition-colors"
              :class="row.pelunasanPending ? 'text-amber-700' : 'text-slate-900'"
            >
              <template v-for="tx in row.pelunasanPayments" :key="tx.id">
                <div>{{ formatRupiah(tx.nominal) }}</div>
              </template>
              <span v-if="row.pelunasanPayments.length === 0" class="text-slate-300 font-normal italic">—</span>
            </td>

            <!-- Metode Pelunasan -->
            <td class="align-top py-3 whitespace-nowrap text-xs text-slate-700 bg-emerald-50/40 group-hover/row:bg-emerald-100/70 transition-colors">
              <template v-for="tx in row.pelunasanPayments" :key="tx.id">
                <div>{{ formatMetode(tx.metode) }}</div>
              </template>
              <span v-if="row.pelunasanPayments.length === 0" class="text-slate-300 italic">—</span>
            </td>

            <!-- Bukti/Status Pelunasan -->
            <td class="text-center align-top py-3 text-xs bg-emerald-50/40 group-hover/row:bg-emerald-100/70 transition-colors">
              <template v-for="tx in row.pelunasanPayments" :key="tx.id">
                <div class="flex items-center justify-center gap-1">
                  <a
                    v-if="tx.fileId"
                    :href="`https://drive.google.com/file/d/${tx.fileId}/view`"
                    target="_blank"
                    rel="noopener"
                    class="text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                  >
                    Resi
                  </a>
                  <button
                    v-if="tx.status_verifikasi === 'PENDING'"
                    @click.stop="verifyTx(tx)"
                    :disabled="verifyingId === tx.id"
                    type="button"
                    class="px-1.5 py-0.5 font-bold rounded bg-amber-500 hover:bg-amber-600 text-white cursor-pointer transition-colors"
                  >
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
              <span v-if="row.pelunasanPayments.length === 0" class="text-slate-300 italic">—</span>
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
              <div
                v-if="row.total_masuk_verified > row.order.total_harga"
                class="text-[10px] font-bold text-emerald-600 mt-0.5"
                title="Pembayaran melebihi total tagihan faktur"
              >
                +{{ formatRupiah(row.total_masuk_verified - row.order.total_harga) }} (Lebih)
              </div>
            </td>

            <!-- 7. Sisa Piutang -->
            <td class="text-right font-extrabold whitespace-nowrap align-top py-3 bg-sky-50/30 group-hover/row:bg-sky-100/60 transition-colors"
                :class="row.sisa_tagihan > 0 ? 'text-rose-600' : 'text-emerald-600'">
              {{ formatRupiah(row.sisa_tagihan) }}
            </td>

            <!-- 8. Status Bayar Badge -->
            <td class="text-center whitespace-nowrap align-top py-3 bg-sky-50/30 group-hover/row:bg-sky-100/60 transition-colors">
              <StatusBadge :status="row.status_bayar" :verification="getVerificationStatus(row.payments)" />
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

    <!-- Load More Section -->
    <div
      v-if="statusFilter !== 'UNLINKED' && hasMoreRows"
      class="px-4 py-3.5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs"
    >
      <div class="flex items-center gap-2 text-xs text-slate-600 font-medium">
        <span>Menampilkan <strong>{{ displayedPiutangRows.length }}</strong> dari total <strong>{{ filteredPiutangRows.length }}</strong> data order</span>
        <span class="text-slate-300">|</span>
        <span class="text-slate-500 font-mono">Tersisa {{ filteredPiutangRows.length - displayedPiutangRows.length }} order lagi</span>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <button
          type="button"
          @click="loadMore"
          class="h-8 px-4 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-2xs hover:border-slate-400 active:scale-97 transition-all inline-flex items-center gap-1.5 cursor-pointer"
        >
          <svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
          </svg>
          <span>Muat Lebih Banyak (+{{ nextBatchCount }})</span>
        </button>

        <button
          v-if="filteredPiutangRows.length - displayedPiutangRows.length > PAGE_SIZE"
          type="button"
          @click="showAll"
          class="h-8 px-3 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-all cursor-pointer"
        >
          Tampilkan Semua ({{ filteredPiutangRows.length }})
        </button>
      </div>
    </div>

    <!-- ================================================================= -->
    <!-- MODAL: CATAT PEMBAYARAN ORDER BARU (Modular Component)            -->
    <!-- ================================================================= -->
    <PaymentOrderModal
      v-model="showPaymentModal"
      :orders-list="ordersList"
      :kas-masuk-list="kasMasukList"
      :initial-data="selectedPaymentInitialData"
      @success="() => loadData(true)"
      @toast="showToast"
    />

    <!-- ================================================================= -->
    <!-- MODAL: EDIT & BATAL PEMBAYARAN ORDER (Modular Component)          -->
    <!-- ================================================================= -->
    <EditPaymentOrderModal
      v-model="showEditPaymentModal"
      :tx="selectedEditTx"
      :order="selectedEditOrder"
      :kas-masuk-list="kasMasukList"
      @success="() => loadData(true)"
      @toast="showToast"
    />

    <!-- Toast Notification (Shared Component) -->
    <ToastNotification
      :message="toastMessage"
      :type="toastType"
      @close="clearToast"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '@shared/components/PageHeader.vue'
import BaseButton from '@shared/components/BaseButton.vue'
import MetricStrip from '@shared/components/MetricStrip.vue'
import TableStateRow from '@shared/components/TableStateRow.vue'
import StatusBadge from '@shared/components/StatusBadge.vue'
import TableScrollWrapper from '@shared/components/TableScrollWrapper.vue'
import ToastNotification from '@shared/components/ToastNotification.vue'
import PaymentOrderModal from '../components/PaymentOrderModal.vue'
import EditPaymentOrderModal from '../components/EditPaymentOrderModal.vue'
import SearchInput from '@shared/components/SearchInput.vue'
import DateFilterBar from '@shared/components/DateFilterBar.vue'
import { api } from '@shared/api/gasClient'
import { useAuthStore } from '../stores/auth'
import { useToast } from '@shared/utils/useToast'
import {
  formatRupiah,
  formatTanggal,
  formatMetode,
  formatKertasOrder,
  hitungStatusBayar,
  getTodayISO,
  isDateInFilterRange,
  getVerificationStatus,
} from '@shared/utils/formatters'
import type { KasMasuk, Order, SumberKas, PiutangRow, DateFilterValue } from '@shared/types'
import { useFinanceStore } from '../stores/finance'
import { storeToRefs } from 'pinia'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const financeStore = useFinanceStore()

const { kasMasukList, ordersList, isLoading, isRefreshing } = storeToRefs(financeStore)
const verifyingId = ref<string | null>(null)
const searchQuery = ref('')
const statusFilter = ref<'ALL' | 'PIUTANG' | 'LUNAS' | 'PENDING_VERIF' | 'UNLINKED'>('ALL')
const dateFilter = ref<DateFilterValue>({ mode: 'ALL' })

const { toastMessage, toastType, showToast, clearToast } = useToast()

// Modal States
const showPaymentModal = ref(false)
const selectedPaymentInitialData = ref<any>(null)
const showEditPaymentModal = ref(false)
const selectedEditTx = ref<OrderTxRow | null>(null)
const selectedEditOrder = ref<Order | null>(null)

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
  dpPayments: OrderTxRow[]
  pelunasanPayments: OrderTxRow[]
  dpPending: boolean
  pelunasanPending: boolean
}

// All payments linked to orders
const allOrdersTx = computed<OrderTxRow[]>(() => {
  return kasMasukList.value
    .filter((k) => {
      if (k.jenis_pembayaran === 'NON_ORDER' || k.jenis_pembayaran === 'DEPOSIT') {
        return false
      }
      if (k.status_verifikasi === 'BATAL') {
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
    const dpPayments = payments.filter((tx) => tx.jenis_pembayaran === 'DP')
    const pelunasanPayments = payments.filter((tx) => tx.jenis_pembayaran !== 'DP')
    const dpPending = dpPayments.some((tx) => tx.status_verifikasi === 'PENDING')
    const pelunasanPending = pelunasanPayments.some((tx) => tx.status_verifikasi === 'PENDING')
    const total_masuk = payments.reduce((s, k) => s + k.nominal, 0)
    const total_masuk_verified = payments
      .filter((k) => k.status_verifikasi === 'VERIFIED')
      .reduce((s, k) => s + k.nominal, 0)
    const has_pending = payments.some((k) => k.status_verifikasi === 'PENDING')
    // Sudut pandang owner: sisa tagihan & status bayar dihitung dari pembayaran TERVERIFIKASI saja
    const sisa_tagihan = Math.max(0, order.total_harga - total_masuk_verified)
    const status_bayar = hitungStatusBayar(total_masuk_verified, order.total_harga)

    return {
      order,
      total_masuk,
      total_masuk_verified,
      has_pending,
      sisa_tagihan,
      status_bayar,
      payments,
      dpPayments,
      pelunasanPayments,
      dpPending,
      pelunasanPending,
    }
  })
})

// Data baris yang disaring berdasarkan tanggal pembuatan order aktif
// sehingga setiap order hanya tercatat di bulannya (tidak terhitung ganda antar bulan)
// dan penjumlahan seluruh bulan (Agustus + September + ...) 100% klop dengan Grand Total
const dateFilteredPiutangRows = computed(() => {
  return piutangRows.value.filter((r) => {
    if (dateFilter.value.mode !== 'ALL') {
      return isDateInFilterRange(r.order.tanggal, dateFilter.value)
    }
    return true
  })
})

// Transaksi kas masuk yang tercatat di Buku Kas namun nomor ordernya tidak ada di master Orders
const unlinkedPayments = computed(() => {
  const orderIdSet = new Set(ordersList.value.map((o) => o.id_order))
  return kasMasukList.value
    .filter((k) => {
      if (k.status_verifikasi === 'BATAL') return false
      return !k.id_order || !orderIdSet.has(k.id_order)
    })
    .map((k) => ({
      id: k.id_kas_masuk,
      tanggal: k.tanggal,
      id_order: k.id_order,
      nama_penerbit: k.nama_penerbit || '-',
      nominal: k.nominal,
      metode: k.metode,
      jenis_pembayaran: k.jenis_pembayaran,
      status_verifikasi: k.status_verifikasi,
      keterangan: k.keterangan,
      fileId: k.file_id_bukti,
    }))
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
})

const dateFilteredUnlinkedPayments = computed(() => {
  return unlinkedPayments.value.filter((k) => {
    if (dateFilter.value.mode !== 'ALL') {
      return isDateInFilterRange(k.tanggal, dateFilter.value)
    }
    return true
  })
})

const filteredUnlinkedPayments = computed(() => {
  return dateFilteredUnlinkedPayments.value.filter((k) => {
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase()
      return (
        k.id.toLowerCase().includes(q) ||
        (k.id_order && k.id_order.toLowerCase().includes(q)) ||
        k.nama_penerbit.toLowerCase().includes(q) ||
        (k.keterangan && k.keterangan.toLowerCase().includes(q))
      )
    }
    return true
  })
})

const totalUnlinkedNominal = computed(() =>
  dateFilteredUnlinkedPayments.value
    .filter((k) => k.status_verifikasi === 'VERIFIED')
    .reduce((s, k) => s + k.nominal, 0)
)

const filterOptions = computed(() => [
  { value: 'ALL' as const, label: 'Semua Order', count: dateFilteredPiutangRows.value.length },
  {
    value: 'PIUTANG' as const,
    label: 'Ada Piutang',
    count: dateFilteredPiutangRows.value.filter((r) => r.sisa_tagihan > 0).length,
    badgeClass: 'bg-rose-50 text-rose-600 font-bold',
  },
  {
    value: 'LUNAS' as const,
    label: 'Lunas',
    count: dateFilteredPiutangRows.value.filter((r) => r.sisa_tagihan <= 0).length,
    badgeClass: 'bg-emerald-50 text-emerald-700 font-bold',
  },
  {
    value: 'PENDING_VERIF' as const,
    label: 'Perlu Verifikasi',
    count: dateFilteredPiutangRows.value.filter((r) => r.has_pending).length,
    badgeClass: dateFilteredPiutangRows.value.some((r) => r.has_pending)
      ? 'bg-amber-500 text-white font-extrabold animate-pulse'
      : 'bg-slate-300 text-slate-600',
  },
  ...(dateFilteredUnlinkedPayments.value.length > 0
    ? [
        {
          value: 'UNLINKED' as const,
          label: 'Tanpa Order',
          count: dateFilteredUnlinkedPayments.value.length,
          badgeClass: 'bg-amber-100 text-amber-800 font-bold',
        },
      ]
    : []),
])

const filteredPiutangRows = computed(() => {
  return dateFilteredPiutangRows.value.filter((r) => {
    if (statusFilter.value === 'PIUTANG' && r.sisa_tagihan <= 0) return false
    if (statusFilter.value === 'LUNAS' && r.sisa_tagihan > 0) return false
    if (statusFilter.value === 'PENDING_VERIF' && !r.has_pending) return false

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

// Load More / Pagination State
const PAGE_SIZE = 25
const displayLimit = ref(PAGE_SIZE)

// Reset batas tampilan jika filter atau pencarian berubah
watch([statusFilter, dateFilter, searchQuery], () => {
  displayLimit.value = PAGE_SIZE
})

const displayedPiutangRows = computed(() => {
  return filteredPiutangRows.value.slice(0, displayLimit.value)
})

const hasMoreRows = computed(() => {
  return displayedPiutangRows.value.length < filteredPiutangRows.value.length
})

const nextBatchCount = computed(() => {
  return Math.min(PAGE_SIZE, filteredPiutangRows.value.length - displayedPiutangRows.value.length)
})

function loadMore() {
  displayLimit.value += PAGE_SIZE
}

function showAll() {
  displayLimit.value = filteredPiutangRows.value.length
}

const totalTagihanPiutang = computed(() => filteredPiutangRows.value.reduce((s, r) => s + r.order.total_harga, 0))
const totalMasukPiutang = computed(() => filteredPiutangRows.value.reduce((s, r) => s + r.total_masuk_verified, 0))
const totalSisaPiutang = computed(() => filteredPiutangRows.value.reduce((s, r) => s + r.sisa_tagihan, 0))
const totalKelebihanBayar = computed(() => Math.max(0, totalMasukPiutang.value - totalTagihanPiutang.value))
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
    sub: totalKelebihanBayar.value > 0 ? `Lebih Bayar: +${formatRupiah(totalKelebihanBayar.value)}` : undefined,
    subClass: 'text-emerald-700 font-semibold',
    minWidth: 'min-w-[140px]',
  },
  ...(totalUnlinkedNominal.value > 0
    ? [
        {
          label: 'Kas Tanpa Order',
          value: formatRupiah(totalUnlinkedNominal.value),
          valueClass: 'text-amber-600',
          sub: `${dateFilteredUnlinkedPayments.value.length} mutasi (masuk Buku Kas)`,
          subClass: 'text-amber-700 font-semibold',
          subDot: 'bg-amber-500',
          minWidth: 'min-w-[150px]',
        },
      ]
    : []),
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

// Modal Handlers
function openNewPaymentModal() {
  selectedPaymentInitialData.value = null
  showPaymentModal.value = true
}

function openPaymentModalForOrder(row: PiutangRow) {
  const isPelunasan = row.status_bayar === 'DP'
  selectedPaymentInitialData.value = {
    tanggal: getTodayISO(),
    jenis_pembayaran: isPelunasan ? 'PELUNASAN' : 'DP',
    id_order: row.order.id_order,
    nama_penerbit: row.order.nama_penerbit,
    nominal: row.sisa_tagihan > 0 ? row.sisa_tagihan : Math.round(row.order.total_harga * 0.5),
    metode: 'BANK',
    keterangan: `Pembayaran ${isPelunasan ? 'Pelunasan' : 'DP'} Order ${row.order.id_order}`,
  }
  showPaymentModal.value = true
}

function openEditPaymentModal(tx: OrderTxRow, order: Order) {
  selectedEditTx.value = tx
  selectedEditOrder.value = order
  showEditPaymentModal.value = true
}

async function verifyTx(tx: OrderTxRow) {
  verifyingId.value = tx.id
  try {
    const res = await api.verifyKasMasuk(tx.id, authStore.nama ?? 'OWNER')
    if (res.success) {
      const item = kasMasukList.value.find((k) => k.id_kas_masuk === tx.id)
      if (item) item.status_verifikasi = 'VERIFIED'
      showToast(`Pembayaran ${formatRupiah(tx.nominal)} berhasil diverifikasi!`, 'success')
    } else {
      showToast(`Gagal verifikasi: ${res.error || 'Terjadi kesalahan pada server'}`, 'error')
    }
  } catch (e: any) {
    console.error('Gagal verifikasi:', e)
    showToast(e?.message || 'Terjadi kesalahan jaringan saat verifikasi', 'error')
  } finally {
    verifyingId.value = null
  }
}

async function loadData(force = false) {
  await financeStore.loadFinanceData({ force })
}

onMounted(() => {
  loadData(false)
  if (route.query.tab === 'verifikasi') {
    statusFilter.value = 'PENDING_VERIF'
  }
  if (route.query.action === 'new-payment') {
    openNewPaymentModal()
  }
})
</script>


