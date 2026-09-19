<template>
  <div class="w-full min-h-full bg-white fade-in">
    <!-- Standard Shared Header -->
    <PageHeader title="Monitoring Piutang">
      <template #actions>
        <div class="w-36 sm:w-56">
          <SearchInput
            v-model="search"
            placeholder="Cari penerbit / judul..."
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

    <!-- Status Filter Strip -->
    <div class="px-[8px] sm:px-[15px] lg:px-[20px] py-2 border-b border-slate-200 bg-white">
      <FilterTabs v-model="statusFilter" :tabs="statusFilters" />
    </div>

    <!-- Full-bleed Table with Top Horizontal Scrollbar -->
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
            <td class="text-slate-700 font-medium text-xs">{{ row.order.kertas }}</td>
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
              <StatusBadge :status="row.status_bayar" />
            </td>
          </tr>
        </tbody>
      </table>
    </TableScrollWrapper>
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
import { api } from '@shared/api/gasClient'
import { formatRupiah, formatFinishing, hitungStatusBayar } from '@shared/utils/formatters'
import type { Order, KasMasuk, PiutangRow } from '@shared/types'

const isLoading = ref(false)
const rows = ref<PiutangRow[]>([])
const search = ref('')
const statusFilter = ref('ALL')

const statusFilters = [
  { value: 'ALL', label: 'Semua' },
  { value: 'BELUM_BAYAR', label: 'Belum Bayar' },
  { value: 'KURANG_BAYAR', label: 'Kurang Bayar' },
  { value: 'DP', label: 'DP' },
  { value: 'LUNAS', label: 'Lunas' },
]

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

const summaryMetrics = computed(() => [
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
    valueClass: 'text-amber-600',
    minWidth: 'min-w-[140px]',
  },
])

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

      rows.value = orders.map((order) => {
        const payments = kasMasukList.filter(
          (k) => k.id_order === order.id_order && (k as any).status_verifikasi !== 'BATAL',
        )
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
        }
      })
    }
  } finally {
    isLoading.value = false
  }
}

onMounted(loadData)
</script>
