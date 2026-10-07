<template>
  <div class="w-full min-h-full bg-white fade-in">
    <!-- Header Section (Exact h-14) -->
    <PageHeader>
      <template #title>
        <div class="min-w-0">
          <h1 class="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-none truncate">
            <span class="hidden md:inline">Buku Kas &amp; Mutasi Keuangan</span>
            <span class="md:hidden">Buku Kas</span>
          </h1>
        </div>
      </template>
      <template #actions>
        <!-- Periode Selector -->
        <!-- Export Excel Button -->
        <BaseButton
          @click="exportExcel"
          :loading="isExporting"
          size="sm"
          variant="secondary"
          title="Export (.xlsx)"
          class="px-2 sm:px-3 shrink-0"
        >
          <template #icon>
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </template>
          <span class="hidden md:inline">Export (.xlsx)</span>
          <span class="hidden sm:inline md:hidden">Export</span>
        </BaseButton>

        <!-- Refresh Button -->
        <button
          type="button"
          @click="loadData(true)"
          :disabled="isLoading || isRefreshing"
          class="h-8 px-2 sm:px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-2xs shrink-0 cursor-pointer disabled:opacity-50"
          title="Segarkan Data Buku Kas"
        >
          <svg class="w-3.5 h-3.5" :class="{ 'animate-spin': isLoading || isRefreshing }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span class="hidden sm:inline">{{ isRefreshing ? 'Menyinkronkan...' : 'Refresh' }}</span>
        </button>

        <!-- Input Kas Masuk Button -->
        <button
          @click="showKasMasukModal = true"
          type="button"
          class="h-8 px-2.5 sm:px-3 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span class="hidden sm:inline">Kas Masuk</span>
          <span class="sm:hidden">Masuk</span>
        </button>

        <!-- Input Kas Keluar Button -->
        <button
          @click="showKasKeluarModal = true"
          type="button"
          class="h-8 px-2.5 sm:px-3 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-2xs transition-all inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
          </svg>
          <span class="hidden sm:inline">Kas Keluar</span>
          <span class="sm:hidden">Keluar</span>
        </button>
      </template>
    </PageHeader>

    <!-- Control Bar: Date Filter (Tanggal, Bulan, Tahun, Rentang) - Sticky -->
    <div
      class="sticky top-0 z-30 px-[8px] sm:px-[15px] lg:px-[20px] py-2.5 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs"
    >
      <DateFilterBar v-model="dateFilter" initial-mode="MONTH" />
      <span class="text-xs text-slate-500 font-semibold font-mono shrink-0 text-center w-full sm:w-auto">
        Periode: <strong class="text-slate-800">{{ dateFilter.label || selectedPeriode }}</strong>
      </span>
    </div>

    <!-- Summary Metrics Strip -->
    <MetricStrip :items="summaryMetrics" />

    <!-- Rekapitulasi per Sumber Kas (Full-bleed) -->
    <div class="border-b border-slate-200 bg-white">
      <div
        class="px-[8px] sm:px-[15px] lg:px-[20px] py-2.5 border-b border-slate-100 bg-slate-50/40 flex items-center justify-between"
      >
        <h3 class="text-slate-900 font-bold text-xs sm:text-sm">Rekapitulasi Saldo Kas per Akun</h3>
        <span class="text-[11px] font-semibold text-slate-500 font-mono">
          Periode: {{ dateFilter.label || selectedPeriode }}
        </span>
      </div>
      <TableScrollWrapper>
        <table class="data-table w-full min-w-[500px]">
          <thead>
            <tr class="whitespace-nowrap">
              <th>Akun / Sumber Kas</th>
              <th class="text-right">Total Masuk (Debit)</th>
              <th class="text-right">Total Keluar (Kredit)</th>
              <th class="text-right">Saldo Bersih</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sumber in sumberRekapData" :key="sumber.label">
              <td class="font-medium text-slate-900">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full" :class="sumber.dotColor"></span>
                  <span>{{ sumber.label }}</span>
                </div>
              </td>
              <td class="text-right font-semibold text-emerald-600">{{ formatRupiah(sumber.masuk) }}</td>
              <td class="text-right font-semibold text-rose-600">{{ formatRupiah(sumber.keluar) }}</td>
              <td class="text-right font-extrabold" :class="sumber.saldo >= 0 ? 'text-emerald-600' : 'text-rose-600'">
                {{ formatRupiah(Math.abs(sumber.saldo)) }}
                <span class="text-xs ml-0.5">{{ sumber.saldo >= 0 ? '(+)' : '(-)' }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </TableScrollWrapper>
    </div>

    <!-- Mutasi Kas Detail (Full-bleed) -->
    <div class="bg-white">
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-[8px] sm:px-[15px] lg:px-[20px] py-2.5 border-b border-slate-100 bg-slate-50/40"
      >
        <div class="flex items-center gap-2">
          <h3 class="text-slate-900 font-bold text-xs sm:text-sm">Jurnal Mutasi Buku Kas</h3>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/80 text-slate-700">
            {{ filteredMutasi.length }} Transaksi
          </span>
        </div>

        <div
          class="flex items-center gap-2 w-full sm:w-auto overflow-x-auto scrollbar-none py-0.5 justify-between sm:justify-end"
        >
          <!-- Filter Tabs Tipe -->
          <div
            class="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-lg overflow-x-auto scrollbar-none flex-nowrap shrink-0 max-w-full"
          >
            <button
              v-for="tab in mutasiTabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              class="px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap"
              :class="activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'"
            >
              <span>{{ tab.label }}</span>
            </button>
          </div>

          <!-- Search Input -->
          <div class="w-36 sm:w-48 shrink-0">
            <SearchInput v-model="searchQuery" placeholder="Cari keterangan..." />
          </div>
        </div>
      </div>

      <TableScrollWrapper>
        <table class="data-table w-full min-w-[760px]">
          <thead>
            <tr class="whitespace-nowrap">
              <th>Tanggal</th>
              <th>Tipe</th>
              <th>Kategori / Jenis</th>
              <th>Keterangan / Rincian</th>
              <th>Sumber Kas</th>
              <th class="text-right">Debit (Masuk)</th>
              <th class="text-right">Kredit (Keluar)</th>
              <th class="text-center">Bukti / Nota</th>
              <th class="text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <TableStateRow
              :colspan="9"
              :loading="isLoading"
              :is-empty="filteredMutasi.length === 0"
              empty-text="Belum ada mutasi kas tercatat pada periode ini"
            />
            <tr v-for="row in displayedMutasi" :key="row.id" class="hover:bg-slate-50/70">
              <td class="font-mono text-xs font-semibold text-slate-600 whitespace-nowrap">
                {{ formatTanggal(row.tanggal) }}
              </td>
              <td class="whitespace-nowrap">
                <span
                  v-if="row.tipe === 'MASUK'"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
                >
                  <span>⬇ Kas Masuk</span>
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200"
                >
                  <span>⬆ Kas Keluar</span>
                </span>
              </td>
              <td class="whitespace-nowrap font-medium text-slate-700 text-xs">
                {{ row.kategori }}
              </td>
              <td class="max-w-[260px]">
                <p class="truncate text-slate-900 font-medium text-xs" :title="row.keterangan">
                  {{ row.keterangan }}
                </p>
              </td>
              <td class="whitespace-nowrap text-slate-600 font-medium text-xs">
                {{ formatMetode(row.sumber_kas) }}
              </td>
              <td class="text-right font-mono font-semibold text-emerald-600 whitespace-nowrap">
                {{ row.tipe === 'MASUK' ? formatRupiah(row.nominal) : '-' }}
              </td>
              <td class="text-right font-mono font-semibold text-rose-600 whitespace-nowrap">
                {{ row.tipe === 'KELUAR' ? formatRupiah(row.nominal) : '-' }}
              </td>
              <td class="text-center whitespace-nowrap">
                <a
                  v-if="row.fileId"
                  :href="getDriveFileUrl(row.fileId)"
                  target="_blank"
                  rel="noopener"
                  class="text-blue-600 hover:text-blue-800 text-xs font-semibold underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Lihat</span>
                </a>
                <span v-else class="text-slate-400 text-[11px] italic">-</span>
              </td>
              <td class="text-center whitespace-nowrap">
                <button
                  @click="openEditModal(row)"
                  type="button"
                  class="px-2 py-0.5 rounded text-slate-500 hover:text-amber-700 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-all inline-flex items-center gap-1 text-xs font-semibold cursor-pointer"
                  title="Edit Transaksi Mutasi"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </TableScrollWrapper>

      <!-- Load More Mutasi Kas Section -->
      <div
        v-if="hasMoreMutasi"
        class="px-4 py-3.5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs"
      >
        <div class="flex items-center gap-2 text-xs text-slate-600 font-medium">
          <span>
            Menampilkan <strong>{{ displayedMutasi.length }}</strong> dari total
            <strong>{{ filteredMutasi.length }}</strong> transaksi kas
          </span>
          <span class="text-slate-300">|</span>
          <span class="text-slate-500 font-mono">
            Tersisa {{ filteredMutasi.length - displayedMutasi.length }} lagi
          </span>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <button
            type="button"
            @click="loadMoreMutasi"
            class="h-8 px-4 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-2xs hover:border-slate-400 active:scale-97 transition-all inline-flex items-center gap-1.5 cursor-pointer"
          >
            <svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
            </svg>
            <span>Muat Lebih Banyak (+{{ nextMutasiBatchCount }})</span>
          </button>

          <button
            v-if="filteredMutasi.length - displayedMutasi.length > MUTASI_PAGE_SIZE"
            type="button"
            @click="showAllMutasi"
            class="h-8 px-3 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-all cursor-pointer"
          >
            Tampilkan Semua ({{ filteredMutasi.length }})
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL 1: INPUT KAS MASUK (DEPOSIT / NON-ORDER) -->
    <KasMasukModal
      v-model="showKasMasukModal"
      :penerbit-options="penerbitOptions"
      @success="onModalSuccess"
      @error="onModalError"
    />

    <!-- MODAL 2: INPUT KAS KELUAR -->
    <KasKeluarModal
      v-model="showKasKeluarModal"
      :kategori-options="kategoriOptions"
      @success="onModalSuccess"
      @error="onModalError"
    />

    <!-- MODAL 3: EDIT MUTASI KAS (MASUK / KELUAR) -->
    <EditKasModal
      v-model="showEditModal"
      :mutasi="selectedMutasiRow"
      :penerbit-options="penerbitOptions"
      :kategori-options="kategoriOptions"
      @success="onModalSuccess"
      @error="onModalError"
    />

    <!-- Snackbar Toast (Success & Error support) -->
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
import { useRoute } from 'vue-router'
import PageHeader from '@shared/components/PageHeader.vue'
import BaseButton from '@shared/components/BaseButton.vue'
import MetricStrip from '@shared/components/MetricStrip.vue'
import TableStateRow from '@shared/components/TableStateRow.vue'
import TableScrollWrapper from '@shared/components/TableScrollWrapper.vue'
import SearchInput from '@shared/components/SearchInput.vue'
import type { ComboboxOption } from '@shared/components/ComboboxInput.vue'
import DateFilterBar from '@shared/components/DateFilterBar.vue'
import ToastNotification from '@shared/components/ToastNotification.vue'
import KasMasukModal from '../components/KasMasukModal.vue'
import KasKeluarModal from '../components/KasKeluarModal.vue'
import EditKasModal from '../components/EditKasModal.vue'
import { api } from '@shared/api/gasClient'
import { useAuthStore } from '../stores/auth'
import { useToast } from '@shared/utils/useToast'
import { KATEGORI_KAS_KELUAR_OPTIONS } from '@shared/constants'
import {
  formatRupiah,
  formatTanggal,
  formatMetode,
  formatKategori,
  getCurrentPeriode,
  formatJenisPembayaran,
  isDateInFilterRange,
} from '@shared/utils/formatters'
import type { KasMasuk, KasKeluar, SumberKas, KategoriKasKeluar, Client, Order, DateFilterValue } from '@shared/types'
import { useFinanceStore } from '../stores/finance'
import { storeToRefs } from 'pinia'

const route = useRoute()
const authStore = useAuthStore()
const financeStore = useFinanceStore()

const { kasMasukList, kasKeluarList, clientsList, ordersList, isLoading, isRefreshing } = storeToRefs(financeStore)
const isExporting = ref(false)
const selectedPeriode = ref(getCurrentPeriode())
const dateFilter = ref<DateFilterValue>({ mode: 'MONTH' })

const { toastMessage, toastType, showToast, clearToast } = useToast()

// Filter state
const activeTab = ref<'SEMUA' | 'MASUK' | 'KELUAR' | 'DEPOSIT'>('SEMUA')
const searchQuery = ref('')

const mutasiTabs: Array<{ id: 'SEMUA' | 'MASUK' | 'KELUAR' | 'DEPOSIT'; label: string }> = [
  { id: 'SEMUA', label: 'Semua Mutasi' },
  { id: 'MASUK', label: 'Kas Masuk' },
  { id: 'KELUAR', label: 'Kas Keluar' },
  { id: 'DEPOSIT', label: 'Deposit Saldo' },
]

const kategoriOptions = KATEGORI_KAS_KELUAR_OPTIONS

// Modal Visibility & Selected Mutasi Row
const showKasMasukModal = ref(false)
const showKasKeluarModal = ref(false)
const showEditModal = ref(false)
const selectedMutasiRow = ref<MutasiRow | null>(null)

// Publisher combobox options (matches App 1 ComboboxInput standard)
const penerbitOptions = computed<ComboboxOption[]>(() => {
  const seen = new Set<string>()
  const list: ComboboxOption[] = []

  // 1. Dari master clients
  clientsList.value.forEach((c) => {
    const name = c.nama_penerbit?.trim()
    if (!name) return
    const key = name.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    const subParts = [c.kontak, c.alamat].filter(Boolean)
    list.push({
      label: name,
      value: name,
      sub: subParts.length > 0 ? subParts.join(' • ') : 'Klien Terdaftar',
      extra: c,
    })
  })

  // 2. Dari database order
  ordersList.value.forEach((o) => {
    const name = o.nama_penerbit?.trim()
    if (!name) return
    const key = name.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    list.push({
      label: name,
      value: name,
      sub: o.id_order ? `Order ${o.id_order}` : undefined,
      extra: o,
    })
  })

  // 3. Dari transaksi kas masuk sebelumnya
  kasMasukList.value.forEach((k) => {
    const name = k.nama_penerbit?.trim()
    if (!name) return
    const key = name.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    list.push({
      label: name,
      value: name,
      sub: 'Riwayat Transaksi',
      extra: k,
    })
  })

  return list.sort((a, b) => a.label.localeCompare(b.label))
})

// Filter kas masuk by active date filter (excluding non-cash settlements like SALDO_DEPOSIT)
const filteredKasMasukByPeriode = computed(() =>
  kasMasukList.value.filter((k) => {
    if (!k.tanggal) return false
    return isDateInFilterRange(k.tanggal, dateFilter.value)
  })
)

const filteredKasKeluarByPeriode = computed(() =>
  kasKeluarList.value.filter((k) => {
    if (!k.tanggal) return false
    return isDateInFilterRange(k.tanggal, dateFilter.value)
  })
)

// Summary metrics calculations
const totalMasuk = computed(() =>
  filteredKasMasukByPeriode.value
    .filter((k) => k.status_verifikasi === 'VERIFIED' && k.metode !== 'SALDO_DEPOSIT')
    .reduce((s, k) => s + k.nominal, 0)
)
const totalKeluar = computed(() => filteredKasKeluarByPeriode.value.reduce((s, k) => s + k.nominal, 0))
const saldoKas = computed(() => totalMasuk.value - totalKeluar.value)

// Perhitungan saldo deposit mengendap per penerbit
const depositSummary = computed(() => {
  const map = new Map<string, { masuk: number; keluar: number }>()

  // Top-up deposit masuk
  kasMasukList.value.forEach((k) => {
    if (k.jenis_pembayaran === 'DEPOSIT' && (k as any).status_verifikasi === 'VERIFIED') {
      const name = (k.nama_penerbit || 'Penerbit Lain').trim().toLowerCase()
      const curr = map.get(name) || { masuk: 0, keluar: 0 }
      curr.masuk += k.nominal
      map.set(name, curr)
    }
  })

  // Pemakaian deposit untuk bayar order
  kasMasukList.value.forEach((k) => {
    if (k.metode === 'SALDO_DEPOSIT' && (k as any).status_verifikasi === 'VERIFIED') {
      const order = ordersList.value.find((o) => o.id_order === k.id_order)
      const name = (k.nama_penerbit || order?.nama_penerbit || 'Penerbit Lain').trim().toLowerCase()
      const curr = map.get(name) || { masuk: 0, keluar: 0 }
      curr.keluar += k.nominal
      map.set(name, curr)
    }
  })

  let totalMengendap = 0
  let activeCount = 0
  map.forEach((val) => {
    const sisa = Math.max(0, val.masuk - val.keluar)
    if (sisa > 0) {
      totalMengendap += sisa
      activeCount++
    }
  })

  return { totalMengendap, activeCount }
})

const summaryMetrics = computed(() => [
  {
    label: 'Total Kas Masuk (Riil)',
    value: formatRupiah(totalMasuk.value),
    valueClass: 'text-emerald-600',
    minWidth: 'min-w-[150px]',
  },
  {
    label: 'Total Kas Keluar',
    value: formatRupiah(totalKeluar.value),
    valueClass: 'text-rose-600',
    minWidth: 'min-w-[150px]',
  },
  {
    label: 'Surplus / Defisit Kas',
    value: formatRupiah(Math.abs(saldoKas.value)),
    valueClass: saldoKas.value >= 0 ? 'text-emerald-600' : 'text-rose-600',
    sub: saldoKas.value >= 0 ? '+ Surplus Saldo' : '- Defisit Saldo',
    subClass: saldoKas.value >= 0 ? 'text-emerald-600' : 'text-rose-600',
    subDot: saldoKas.value >= 0 ? 'bg-emerald-500' : 'bg-rose-500',
    minWidth: 'min-w-[150px]',
  },
  {
    label: 'Deposit Mengendap',
    value: formatRupiah(depositSummary.value.totalMengendap),
    valueClass: 'text-emerald-700',
    sub: `${depositSummary.value.activeCount} Penerbit Aktif`,
    subClass: 'text-emerald-600',
    subDot: 'bg-emerald-500',
    minWidth: 'min-w-[160px]',
  },
])

// Rekap Saldo Kas per Akun
const sumberList = ['KASIR_TUNAI', 'BANK', 'QRIS']
const sumberConfig: Record<string, { label: string; dotColor: string }> = {
  KASIR_TUNAI: { label: 'Kasir Tunai', dotColor: 'bg-emerald-500' },
  BANK: { label: 'Bank', dotColor: 'bg-blue-500' },
  QRIS: { label: 'QRIS', dotColor: 'bg-purple-500' },
}

const sumberRekapData = computed(() =>
  sumberList.map((s) => {
    const cfg = sumberConfig[s] || { label: s, dotColor: 'bg-slate-400' }
    const matchSumber = (val: string) => s === 'BANK' ? (val || '').toUpperCase().includes('BANK') : val === s
    const masuk = filteredKasMasukByPeriode.value
      .filter((k) => matchSumber(k.metode) && k.status_verifikasi === 'VERIFIED')
      .reduce((sum, k) => sum + k.nominal, 0)
    const keluar = filteredKasKeluarByPeriode.value
      .filter((k) => matchSumber(k.sumber_kas))
      .reduce((sum, k) => sum + k.nominal, 0)
    return { label: cfg.label, dotColor: cfg.dotColor, masuk, keluar, saldo: masuk - keluar }
  })
)

// Mutasi Row Interface
interface MutasiRow {
  id: string
  tanggal: string
  tipe: 'MASUK' | 'KELUAR'
  kategori: string
  keterangan: string
  sumber_kas: string
  nominal: number
  fileId?: string
  raw?: KasMasuk | KasKeluar
}

function formatKmKeterangan(k: KasMasuk): string {
  if (k.jenis_pembayaran === 'DEPOSIT') {
    return `[DEPOSIT] ${k.nama_penerbit || 'Penerbit'}${k.keterangan ? ' — ' + k.keterangan : ''}`
  }
  if (k.jenis_pembayaran === 'NON_ORDER') {
    return `[NON-ORDER] ${k.keterangan || k.nama_penerbit || 'Pendapatan Lain'}`
  }
  const orderStr = k.id_order ? `(${k.id_order})` : ''
  const penerbitStr = k.nama_penerbit ? `${k.nama_penerbit} ${orderStr}`.trim() : k.id_order ?? k.keterangan ?? ''
  return `${formatJenisPembayaran(k.jenis_pembayaran)} — ${penerbitStr}`
}

function getDriveFileUrl(fileId: string): string {
  if (fileId.startsWith('http')) return fileId
  return `https://drive.google.com/file/d/${fileId}/view`
}

const allMutasi = computed<MutasiRow[]>(() => {
  const list: MutasiRow[] = []

  // Verified Kas Masuk (exclude non-cash SALDO_DEPOSIT from cash register mutasi)
  filteredKasMasukByPeriode.value
    .filter((k) => k.status_verifikasi === 'VERIFIED' && k.metode !== 'SALDO_DEPOSIT')
    .forEach((k) => {
      list.push({
        id: k.id_kas_masuk,
        tanggal: k.tanggal,
        tipe: 'MASUK',
        kategori: formatJenisPembayaran(k.jenis_pembayaran),
        keterangan: formatKmKeterangan(k),
        sumber_kas: k.metode,
        nominal: k.nominal,
        fileId: k.file_id_bukti,
        raw: k,
      })
    })

  // Kas Keluar
  filteredKasKeluarByPeriode.value.forEach((k) => {
    list.push({
      id: k.id_kas_keluar,
      tanggal: k.tanggal,
      tipe: 'KELUAR',
      kategori: formatKategori(k.kategori),
      keterangan: k.rincian,
      sumber_kas: k.sumber_kas,
      nominal: k.nominal,
      fileId: k.file_id_nota,
      raw: k,
    })
  })

  return list.sort((a, b) => b.tanggal.localeCompare(a.tanggal))
})

const filteredMutasi = computed(() => {
  return allMutasi.value.filter((m) => {
    if (activeTab.value === 'MASUK' && m.tipe !== 'MASUK') return false
    if (activeTab.value === 'KELUAR' && m.tipe !== 'KELUAR') return false
    if (activeTab.value === 'DEPOSIT' && !m.kategori.toLowerCase().includes('deposit')) return false
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase()
      return (
        m.keterangan.toLowerCase().includes(q) ||
        m.kategori.toLowerCase().includes(q) ||
        formatMetode(m.sumber_kas).toLowerCase().includes(q)
      )
    }
    return true
  })
})

// Load More / Pagination State untuk Mutasi Kas
const MUTASI_PAGE_SIZE = 25
const mutasiDisplayLimit = ref(MUTASI_PAGE_SIZE)

// Reset batas mutasi kas jika filter atau pencarian berubah
watch([activeTab, dateFilter, searchQuery], () => {
  mutasiDisplayLimit.value = MUTASI_PAGE_SIZE
})

const displayedMutasi = computed(() => {
  return filteredMutasi.value.slice(0, mutasiDisplayLimit.value)
})

const hasMoreMutasi = computed(() => {
  return displayedMutasi.value.length < filteredMutasi.value.length
})

const nextMutasiBatchCount = computed(() => {
  return Math.min(MUTASI_PAGE_SIZE, filteredMutasi.value.length - displayedMutasi.value.length)
})

function loadMoreMutasi() {
  mutasiDisplayLimit.value += MUTASI_PAGE_SIZE
}

function showAllMutasi() {
  mutasiDisplayLimit.value = filteredMutasi.value.length
}

// Modal handlers
function openEditModal(row: MutasiRow) {
  selectedMutasiRow.value = row
  showEditModal.value = true
}

async function onModalSuccess(msg: string) {
  showToast(msg, 'success')
  await loadData(true)
}

function onModalError(msg: string) {
  showToast(msg, 'error')
}

async function exportExcel() {
  isExporting.value = true
  try {
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()

    // Sheet 1: Mutasi Kas
    const mutasiData = allMutasi.value.map((m) => ({
      Tanggal: formatTanggal(m.tanggal),
      Tipe: m.tipe,
      Kategori: m.kategori,
      Keterangan: m.keterangan,
      'Sumber Kas': formatMetode(m.sumber_kas),
      'Debit (Masuk)': m.tipe === 'MASUK' ? m.nominal : 0,
      'Kredit (Keluar)': m.tipe === 'KELUAR' ? m.nominal : 0,
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mutasiData), 'Mutasi Kas')

    // Sheet 2: Rekap Akun
    const rekapData = sumberRekapData.value.map((s) => ({
      Akun: s.label,
      'Total Masuk': s.masuk,
      'Total Keluar': s.keluar,
      'Saldo Bersih': s.saldo,
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rekapData), 'Rekap Akun')

    const periodLabel = (dateFilter.value.label || selectedPeriode.value).replace(/[^a-zA-Z0-9_-]/g, '_')
    XLSX.writeFile(wb, `Buku_Kas_KBM_${periodLabel}.xlsx`)
  } finally {
    isExporting.value = false
  }
}

async function loadData(force = false) {
  await financeStore.loadFinanceData({ force })
}

onMounted(() => {
  loadData(false)
  if (route.query.action === 'input-kas-masuk') {
    showKasMasukModal.value = true
  } else if (route.query.action === 'input-kas-keluar') {
    showKasKeluarModal.value = true
  }
})
</script>
