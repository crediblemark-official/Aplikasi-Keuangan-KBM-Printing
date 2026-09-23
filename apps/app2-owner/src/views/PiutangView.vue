<template>
  <div class="w-full min-h-full bg-white fade-in">
    <!-- Standard Shared Header -->
    <PageHeader title="Monitoring Piutang & Deposit">
      <template #actions>
        <div class="w-40 sm:w-60">
          <SearchInput
            v-model="search"
            :placeholder="mainTab === 'PIUTANG' ? 'Cari penerbit / judul...' : 'Cari nama penerbit...'"
          />
        </div>
        <button
          @click="loadData"
          class="btn-secondary h-8 text-xs font-semibold inline-flex items-center gap-1.5 px-2.5 rounded-md cursor-pointer"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span class="hidden sm:inline">Refresh</span>
        </button>
      </template>
    </PageHeader>

    <!-- Summary Metrics Strip -->
    <MetricStrip :items="summaryMetrics" />

    <!-- Main Tab Selector Bar -->
    <div class="px-[8px] sm:px-[15px] lg:px-[20px] py-2.5 border-b border-slate-200 bg-slate-50/60 flex flex-wrap items-center justify-between gap-2.5">
      <div class="inline-flex p-1 bg-slate-200/80 rounded-xl gap-1">
        <button
          @click="mainTab = 'PIUTANG'"
          class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer"
          :class="mainTab === 'PIUTANG' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
        >
          <span>📑 Tagihan Order (Piutang)</span>
          <span
            class="px-1.5 py-0.2 rounded-full text-[10px] font-bold"
            :class="mainTab === 'PIUTANG' ? 'bg-red-50 text-red-600' : 'bg-slate-300 text-slate-700'"
          >
            {{ rows.length }}
          </span>
        </button>
        <button
          @click="mainTab = 'DEPOSIT'"
          class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer"
          :class="mainTab === 'DEPOSIT' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'"
        >
          <span>💳 Buku Saldo Deposit Penerbit</span>
          <span
            class="px-1.5 py-0.2 rounded-full text-[10px] font-bold"
            :class="mainTab === 'DEPOSIT' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-300 text-slate-700'"
          >
            {{ depositLedger.length }}
          </span>
        </button>
      </div>

      <!-- Secondary Filter for each tab -->
      <div v-if="mainTab === 'PIUTANG'" class="overflow-x-auto">
        <FilterTabs v-model="statusFilter" :tabs="statusFilters" />
      </div>
      <div v-else class="flex items-center gap-1.5 bg-slate-200/60 p-0.5 rounded-lg">
        <button
          v-for="df in depositFilters"
          :key="df.value"
          @click="depositFilter = df.value"
          class="px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer"
          :class="depositFilter === df.value ? 'bg-white text-emerald-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'"
        >
          {{ df.label }}
        </button>
      </div>
    </div>

    <!-- TAB 1: TAGIHAN ORDER (PIUTANG) -->
    <div v-if="mainTab === 'PIUTANG'">
      <TableScrollWrapper>
        <table class="data-table w-full min-w-[1100px]">
          <thead>
            <tr class="whitespace-nowrap">
              <th>ID Order</th>
              <th>Penerbit</th>
              <th>Judul / Penulis</th>
              <th>Pcs</th>
              <th>Ukuran</th>
              <th>Kertas</th>
              <th>BW</th>
              <th>FC</th>
              <th>Finishing</th>
              <th class="text-right">Total Tagihan</th>
              <th class="text-right">Masuk</th>
              <th class="text-right">Sisa Tagihan</th>
              <th class="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            <TableStateRow
              :colspan="13"
              :loading="isLoading"
              :is-empty="filteredRows.length === 0"
              empty-text="Tidak ada data piutang ditemukan"
            />
            <tr v-for="row in filteredRows" :key="row.order.id_order">
              <td class="font-mono text-xs font-semibold text-slate-600 whitespace-nowrap">{{ row.order.id_order }}</td>
              <td class="font-bold text-slate-900 max-w-[160px] truncate" :title="row.order.nama_penerbit">
                {{ row.order.nama_penerbit }}
              </td>
              <td class="max-w-[220px] truncate text-xs text-slate-600" :title="row.order.judul_penulis">
                {{ row.order.judul_penulis }}
              </td>
              <td class="text-center font-semibold text-slate-700">{{ row.order.jml_pcs }}</td>
              <td class="text-slate-700 font-medium text-xs">{{ row.order.ukuran_custom || row.order.ukuran }}</td>
              <td class="text-slate-700 font-medium text-xs">{{ formatKertasOrder(row.order) }}</td>
              <td class="text-center text-xs text-slate-600">{{ row.order.cetak_bw }}</td>
              <td class="text-center text-xs text-slate-600">{{ row.order.cetak_fc }}</td>
              <td class="text-xs text-slate-500 max-w-[160px] truncate" :title="formatFinishing(row.order.finishing)">
                {{ formatFinishing(row.order.finishing) }}
              </td>
              <td class="text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                {{ formatRupiah(row.order.total_harga) }}
              </td>
              <td class="text-right font-mono font-semibold text-emerald-600 whitespace-nowrap">
                <div class="inline-flex items-center gap-1.5 justify-end">
                  <span>{{ formatRupiah(row.total_masuk ?? row.total_masuk_verified) }}</span>
                  <span
                    v-if="row.has_pending"
                    class="w-2 h-2 rounded-full bg-amber-400 shrink-0"
                    title="Ada pembayaran kasir yang belum direkonsiliasi"
                  ></span>
                </div>
              </td>
              <td class="text-right font-extrabold whitespace-nowrap"
                  :class="row.sisa_tagihan > 0 ? 'text-rose-600' : 'text-emerald-600'">
                {{ formatRupiah(row.sisa_tagihan) }}
              </td>
              <td class="text-center whitespace-nowrap">
                <StatusBadge :status="row.status_bayar"
                  :verification="getVerificationStatus(rawKasMasukList.filter(k => k.id_order === row.order.id_order))" />
              </td>
            </tr>
          </tbody>
        </table>
      </TableScrollWrapper>
    </div>

    <!-- TAB 2: BUKU SALDO DEPOSIT PENERBIT -->
    <div v-else>
      <TableScrollWrapper>
        <table class="data-table w-full min-w-[750px]">
          <thead>
            <tr class="whitespace-nowrap">
              <th>Nama Penerbit</th>
              <th class="text-right">Total Deposit Masuk</th>
              <th class="text-right">Terpakai Bayar Order</th>
              <th class="text-right">Sisa Saldo Aktif</th>
              <th class="text-center">Status Saldo</th>
              <th class="text-center">Mutasi & Riwayat</th>
            </tr>
          </thead>
          <tbody>
            <TableStateRow
              :colspan="6"
              :loading="isLoading"
              :is-empty="filteredDepositLedger.length === 0"
              empty-text="Belum ada data deposit penerbit yang tercatat"
            />
            <tr v-for="item in filteredDepositLedger" :key="item.nama_penerbit" class="hover:bg-slate-50/80 transition-colors">
              <td class="font-bold text-slate-900">
                <div class="flex items-center gap-2">
                  <span class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                    {{ item.nama_penerbit.charAt(0).toUpperCase() }}
                  </span>
                  <div>
                    <div class="font-bold text-slate-900 text-sm">{{ item.nama_penerbit }}</div>
                    <div class="text-[11px] text-slate-400 font-normal">
                      {{ item.riwayat.length }} transaksi mutasi
                    </div>
                  </div>
                </div>
              </td>
              <td class="text-right font-mono font-semibold text-slate-700 whitespace-nowrap">
                {{ formatRupiah(item.total_masuk) }}
              </td>
              <td class="text-right font-mono font-semibold text-amber-600 whitespace-nowrap">
                {{ formatRupiah(item.total_terpakai) }}
              </td>
              <td class="text-right font-mono font-extrabold whitespace-nowrap text-base"
                  :class="item.sisa_saldo > 0 ? 'text-emerald-600' : 'text-slate-400'">
                {{ formatRupiah(item.sisa_saldo) }}
              </td>
              <td class="text-center whitespace-nowrap">
                <span
                  v-if="item.sisa_saldo > 0"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Saldo Aktif
                </span>
                <span
                  v-else
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200"
                >
                  Habis (Rp 0)
                </span>
              </td>
              <td class="text-center whitespace-nowrap">
                <button
                  @click="openDetailModal(item)"
                  class="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>Lihat Mutasi ({{ item.riwayat.length }})</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </TableScrollWrapper>
    </div>

    <!-- MODAL RINCIAN MUTASI DEPOSIT PENERBIT -->
    <BaseModal
      v-if="selectedDepositPublisher"
      v-model="showDetailModal"
      :title="`Buku Mutasi Deposit — ${selectedDepositPublisher.nama_penerbit}`"
      @close="showDetailModal = false"
    >
      <div class="space-y-4">
        <!-- Summary Cards Inside Modal -->
        <div class="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div class="text-center">
            <div class="text-[11px] font-semibold text-slate-500">Total Deposit Masuk</div>
            <div class="text-xs sm:text-sm font-bold text-slate-800 font-mono mt-0.5">
              {{ formatRupiah(selectedDepositPublisher.total_masuk) }}
            </div>
          </div>
          <div class="text-center border-x border-slate-200">
            <div class="text-[11px] font-semibold text-slate-500">Total Terpakai Order</div>
            <div class="text-xs sm:text-sm font-bold text-amber-600 font-mono mt-0.5">
              {{ formatRupiah(selectedDepositPublisher.total_terpakai) }}
            </div>
          </div>
          <div class="text-center">
            <div class="text-[11px] font-semibold text-slate-500">Sisa Saldo Aktif</div>
            <div class="text-xs sm:text-sm font-extrabold text-emerald-600 font-mono mt-0.5">
              {{ formatRupiah(selectedDepositPublisher.sisa_saldo) }}
            </div>
          </div>
        </div>

        <!-- History Table -->
        <div class="border border-slate-200 rounded-xl overflow-hidden max-h-[420px] overflow-y-auto">
          <table class="data-table w-full text-xs">
            <thead class="bg-slate-100 text-slate-700 sticky top-0 z-10">
              <tr>
                <th class="py-2">Tanggal</th>
                <th class="py-2">Aksi / Tipe</th>
                <th class="py-2">Keterangan / Order</th>
                <th class="py-2">Metode</th>
                <th class="py-2 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="tx in selectedDepositPublisher.riwayat"
                :key="tx.id"
                class="hover:bg-slate-50/60"
              >
                <td class="font-mono text-slate-600 whitespace-nowrap py-2">
                  {{ formatTanggal(tx.tanggal) }}
                </td>
                <td class="whitespace-nowrap py-2">
                  <span
                    v-if="tx.tipe === 'TOPUP'"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
                  >
                    <span>➕ Top-up Masuk</span>
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200"
                  >
                    <span>💳 Potong Order</span>
                  </span>
                </td>
                <td class="py-2 text-slate-700">
                  <div v-if="tx.id_order" class="font-semibold text-slate-900">
                    Order: <span class="font-mono text-indigo-600">{{ tx.id_order }}</span>
                    <span v-if="tx.judul_buku" class="font-normal text-slate-600 ml-1">({{ tx.judul_buku }})</span>
                  </div>
                  <div class="text-slate-500 text-[11px] italic" v-if="tx.keterangan">
                    {{ tx.keterangan }}
                  </div>
                </td>
                <td class="whitespace-nowrap py-2 font-medium text-slate-600">
                  {{ formatMetode(tx.metode) }}
                </td>
                <td
                  class="text-right font-mono font-bold whitespace-nowrap py-2 text-xs sm:text-sm"
                  :class="tx.tipe === 'TOPUP' ? 'text-emerald-600' : 'text-rose-600'"
                >
                  {{ tx.tipe === 'TOPUP' ? '+' : '-' }} {{ formatRupiah(tx.nominal) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Modal Footer Actions -->
        <div class="flex justify-end pt-2">
          <BaseButton variant="secondary" @click="showDetailModal = false">
            Tutup
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageHeader from '@shared/components/PageHeader.vue'
import FilterTabs from '@shared/components/FilterTabs.vue'
import StatusBadge from '@shared/components/StatusBadge.vue'
import SearchInput from '@shared/components/SearchInput.vue'
import MetricStrip from '@shared/components/MetricStrip.vue'
import TableStateRow from '@shared/components/TableStateRow.vue'
import TableScrollWrapper from '@shared/components/TableScrollWrapper.vue'
import BaseModal from '@shared/components/BaseModal.vue'
import BaseButton from '@shared/components/BaseButton.vue'
import { api } from '@shared/api/gasClient'
import {
  formatRupiah,
  formatFinishing,
  hitungStatusBayar,
  formatKertasOrder,
  formatTanggal,
  formatMetode,
  getVerificationStatus,
} from '@shared/utils/formatters'
import type { Order, KasMasuk, PiutangRow } from '@shared/types'

const isLoading = ref(false)
const mainTab = ref<'PIUTANG' | 'DEPOSIT'>('PIUTANG')

// Tab 1 state
const rows = ref<PiutangRow[]>([])
const search = ref('')
const statusFilter = ref('ALL')

const statusFilters = [
  { value: 'ALL', label: 'Semua' },
  { value: 'BELUM_BAYAR', label: 'Belum Bayar' },
  { value: 'DP', label: 'DP' },
  { value: 'LUNAS', label: 'Lunas' },
]

// Tab 2 state
const rawOrdersList = ref<Order[]>([])
const rawKasMasukList = ref<KasMasuk[]>([])
const depositFilter = ref('ALL')
const selectedDepositPublisher = ref<PublisherDepositSummary | null>(null)
const showDetailModal = ref(false)

const depositFilters = [
  { value: 'ALL', label: 'Semua Penerbit' },
  { value: 'AKTIF', label: 'Saldo Aktif' },
  { value: 'HABIS', label: 'Saldo Habis' },
]

interface DepositHistoryItem {
  id: string
  tanggal: string
  tipe: 'TOPUP' | 'PEMAKAIAN'
  id_order?: string | null
  judul_buku?: string
  nominal: number
  metode: string
  keterangan?: string
  status: string
}

interface PublisherDepositSummary {
  nama_penerbit: string
  total_masuk: number
  total_terpakai: number
  sisa_saldo: number
  riwayat: DepositHistoryItem[]
}

function openDetailModal(item: PublisherDepositSummary) {
  selectedDepositPublisher.value = item
  showDetailModal.value = true
}

// Deposit Ledger computation
const depositLedger = computed<PublisherDepositSummary[]>(() => {
  const map = new Map<string, {
    nama_penerbit: string
    total_masuk: number
    total_terpakai: number
    riwayat: DepositHistoryItem[]
  }>()

  function getOrCreate(name: string) {
    const cleanName = (name || 'Penerbit Lain').trim()
    const key = cleanName.toLowerCase()
    if (!map.has(key)) {
      map.set(key, {
        nama_penerbit: cleanName,
        total_masuk: 0,
        total_terpakai: 0,
        riwayat: [],
      })
    }
    return map.get(key)!
  }

  // 1. Process top-ups (jenis_pembayaran === 'DEPOSIT')
  rawKasMasukList.value.forEach((k) => {
    if (k.jenis_pembayaran === 'DEPOSIT' && (k as any).status_verifikasi === 'VERIFIED') {
      const pubName = (k.nama_penerbit || 'Penerbit Lain').trim()
      const item = getOrCreate(pubName)
      item.total_masuk += k.nominal
      item.riwayat.push({
        id: k.id_kas_masuk,
        tanggal: k.tanggal,
        tipe: 'TOPUP',
        nominal: k.nominal,
        metode: k.metode,
        keterangan: k.keterangan || 'Top-up Saldo Deposit',
        status: k.status_verifikasi,
      })
    }
  })

  // 2. Process order deductions (metode === 'SALDO_DEPOSIT')
  rawKasMasukList.value.forEach((k) => {
    if (k.metode === 'SALDO_DEPOSIT' && (k as any).status_verifikasi === 'VERIFIED') {
      const order = rawOrdersList.value.find((o) => o.id_order === k.id_order)
      const pubName = (k.nama_penerbit || order?.nama_penerbit || 'Penerbit Lain').trim()
      const item = getOrCreate(pubName)
      item.total_terpakai += k.nominal
      item.riwayat.push({
        id: k.id_kas_masuk,
        tanggal: k.tanggal,
        tipe: 'PEMAKAIAN',
        id_order: k.id_order,
        judul_buku: order?.judul_penulis || '',
        nominal: k.nominal,
        metode: k.metode,
        keterangan: k.keterangan || `Pembayaran ${k.jenis_pembayaran || 'Order'} ${k.id_order || ''}`,
        status: k.status_verifikasi,
      })
    }
  })

  // Array transform
  const result: PublisherDepositSummary[] = Array.from(map.values()).map((val) => ({
    nama_penerbit: val.nama_penerbit,
    total_masuk: val.total_masuk,
    total_terpakai: val.total_terpakai,
    sisa_saldo: Math.max(0, val.total_masuk - val.total_terpakai),
    riwayat: val.riwayat.sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || '')),
  }))

  return result.sort((a, b) => b.sisa_saldo - a.sisa_saldo || a.nama_penerbit.localeCompare(b.nama_penerbit))
})

const filteredDepositLedger = computed(() => {
  return depositLedger.value.filter((d) => {
    if (depositFilter.value === 'AKTIF' && d.sisa_saldo <= 0) return false
    if (depositFilter.value === 'HABIS' && d.sisa_saldo > 0) return false
    if (search.value.trim()) {
      const q = search.value.toLowerCase()
      return d.nama_penerbit.toLowerCase().includes(q)
    }
    return true
  })
})

const filteredRows = computed(() => {
  return rows.value.filter((r) => {
    if (statusFilter.value !== 'ALL' && r.status_bayar !== statusFilter.value) {
      return false
    }
    if (search.value.trim()) {
      const q = search.value.toLowerCase()
      return (
        r.order.nama_penerbit.toLowerCase().includes(q) ||
        r.order.judul_penulis.toLowerCase().includes(q) ||
        r.order.id_order.toLowerCase().includes(q)
      )
    }
    return true
  })
})

const totalTagihan = computed(() => rows.value.reduce((s, r) => s + r.order.total_harga, 0))
const totalMasuk = computed(() => rows.value.reduce((s, r) => s + (r.total_masuk ?? r.total_masuk_verified), 0))
const totalPiutang = computed(() => rows.value.reduce((s, r) => s + r.sisa_tagihan, 0))
const totalDepositMengendap = computed(() =>
  depositLedger.value.reduce((s, d) => s + d.sisa_saldo, 0)
)

const summaryMetrics = computed(() => {
  if (mainTab.value === 'DEPOSIT') {
    return [
      {
        label: 'Penerbit Terdaftar Deposit',
        value: `${depositLedger.value.length} Penerbit`,
        minWidth: 'min-w-[150px]',
      },
      {
        label: 'Total Deposit Masuk',
        value: formatRupiah(depositLedger.value.reduce((s, d) => s + d.total_masuk, 0)),
        valueClass: 'text-slate-900',
        minWidth: 'min-w-[150px]',
      },
      {
        label: 'Total Terpakai Order',
        value: formatRupiah(depositLedger.value.reduce((s, d) => s + d.total_terpakai, 0)),
        valueClass: 'text-amber-600',
        minWidth: 'min-w-[150px]',
      },
      {
        label: 'Deposit Mengendap (Aktif)',
        value: formatRupiah(totalDepositMengendap.value),
        valueClass: 'text-emerald-600',
        minWidth: 'min-w-[160px]',
      },
    ]
  }

  return [
    {
      label: 'Order Aktif',
      value: rows.value.filter((r) => r.order.status_order === 'PROSES').length,
      minWidth: 'min-w-[130px]',
    },
    {
      label: 'Total Tagihan',
      value: formatRupiah(totalTagihan.value),
      minWidth: 'min-w-[140px]',
    },
    {
      label: 'Total Masuk',
      value: formatRupiah(totalMasuk.value),
      valueClass: 'text-emerald-600',
      minWidth: 'min-w-[140px]',
    },
    {
      label: 'Sisa Piutang',
      value: formatRupiah(totalPiutang.value),
      valueClass: 'text-rose-600',
      minWidth: 'min-w-[140px]',
    },
    {
      label: 'Deposit Mengendap',
      value: formatRupiah(totalDepositMengendap.value),
      valueClass: 'text-emerald-600',
      sub: `${depositLedger.value.filter((d) => d.sisa_saldo > 0).length} Penerbit`,
      subClass: 'text-emerald-600',
      minWidth: 'min-w-[150px]',
    },
  ]
})

async function loadData() {
  isLoading.value = true
  try {
    const [ordersRes, kmRes] = await Promise.all([
      api.getOrders(),
      api.getKasMasuk(),
    ])

    if (ordersRes.success && ordersRes.data && kmRes.success && kmRes.data) {
      const orders: Order[] = ordersRes.data
      const kasMasukList: KasMasuk[] = kmRes.data

      rawOrdersList.value = orders
      rawKasMasukList.value = kasMasukList

      rows.value = orders.map((order) => {
        const payments = kasMasukList.filter(
          (k) => k.id_order === order.id_order && (k as any).status_verifikasi !== 'BATAL',
        )
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
        }
      })
    }
  } finally {
    isLoading.value = false
  }
}

onMounted(loadData)
</script>
