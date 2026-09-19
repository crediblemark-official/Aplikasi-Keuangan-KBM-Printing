<template>
  <div class="w-full min-h-full bg-white fade-in">

    <!-- Header Section (Exact h-14) -->
    <PageHeader title="Transaksi & Mutasi Kas">
      <template #actions>
        <div class="relative flex items-center">
          <span class="absolute left-2.5 pointer-events-none text-slate-400">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </span>
          <input
            type="month"
            v-model="selectedPeriode"
            @change="loadData"
            class="pl-8 pr-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:border-slate-300 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 cursor-pointer shadow-2xs transition-colors"
          />
        </div>
        <BaseButton @click="exportExcel" :loading="isExporting" size="sm">
          <template #icon>
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </template>
          Export (.xlsx)
        </BaseButton>
      </template>
    </PageHeader>

    <!-- Summary Metrics Strip -->
    <MetricStrip :items="summaryMetrics" />

    <!-- Mutasi per Sumber Kas (Full-bleed) -->
    <div class="border-b border-slate-200 bg-white">
      <div class="px-[8px] sm:px-[15px] lg:px-[20px] py-2.5 border-b border-slate-100 bg-slate-50/40 flex items-center justify-between">
        <h3 class="text-slate-900 font-bold text-xs sm:text-sm">Rekapitulasi Mutasi per Sumber Kas</h3>
        <span class="text-[11px] font-semibold text-slate-500 font-mono">Periode: {{ selectedPeriode }}</span>
      </div>
      <TableScrollWrapper>
        <table class="data-table w-full min-w-[500px]">
          <thead>
            <tr class="whitespace-nowrap">
              <th>Sumber Kas</th>
              <th class="text-right">Kas Masuk</th>
              <th class="text-right">Kas Keluar</th>
              <th class="text-right">Saldo Bersih</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sumber in sumberRekapData" :key="sumber.label">
              <td class="font-bold text-slate-800">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full" :class="sumber.dotColor"></span>
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

    <!-- Riwayat Transaksi Detail (Full-bleed) -->
    <div class="bg-white">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-[8px] sm:px-[15px] lg:px-[20px] py-2.5 border-b border-slate-100 bg-slate-50/40">
        <div class="flex items-center gap-2">
          <h3 class="text-slate-900 font-bold text-xs sm:text-sm">Riwayat Transaksi Detail</h3>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/80 text-slate-700">
            {{ filteredTx.length }} Transaksi
          </span>
        </div>
        <div class="flex items-center gap-2">
          <!-- Filter Tabs -->
          <div class="flex flex-wrap gap-1 bg-slate-200/60 p-0.5 rounded-lg">
            <button
              v-for="tab in tabList"
              :key="tab.id"
              @click="txTab = tab.id"
              class="px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5"
              :class="txTab === tab.id ? 'bg-white text-red-600 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'"
            >
              <span>{{ tab.label }}</span>
              <span
                v-if="tab.count"
                class="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-amber-500 text-white"
              >
                {{ tab.count }}
              </span>
            </button>
          </div>
        </div>
      </div>

      <TableScrollWrapper>
        <table class="data-table w-full min-w-[750px]">
          <thead>
            <tr class="whitespace-nowrap">
              <th>Tanggal</th>
              <th>Tipe</th>
              <th>Keterangan</th>
              <th>Metode / Sumber</th>
              <th class="text-right">Debit (Masuk)</th>
              <th class="text-right">Kredit (Keluar)</th>
              <th class="text-center">Bukti / Nota</th>
              <th v-if="txTab === 'Perlu Verifikasi'" class="text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <TableStateRow
              :colspan="txTab === 'Perlu Verifikasi' ? 8 : 7"
              :loading="isLoading"
              :is-empty="filteredTx.length === 0"
              empty-text="Tidak ada transaksi pada filter ini"
            />
            <tr v-for="tx in filteredTx" :key="tx.id">
              <td class="text-xs font-mono font-semibold text-slate-600">{{ formatTanggal(tx.tanggal) }}</td>
              <td>
                <StatusBadge
                  :status="tx.status === 'PENDING' ? 'PENDING' : tx.tipe === 'MASUK' ? 'VERIFIED' : 'BATAL'"
                  :label="tx.status === 'PENDING' ? 'PENDING' : tx.tipe"
                />
              </td>
              <td class="text-xs text-slate-800 font-medium max-w-[240px] truncate" :title="tx.keterangan">
                {{ tx.keterangan }}
              </td>
              <td class="text-xs text-slate-600">{{ tx.metode }}</td>
              <td class="text-right font-bold text-emerald-600">
                {{ tx.tipe === 'MASUK' ? formatRupiah(tx.nominal) : '' }}
              </td>
              <td class="text-right font-bold text-rose-600">
                {{ tx.tipe === 'KELUAR' ? formatRupiah(tx.nominal) : '' }}
              </td>
              <td class="text-center">
                <a
                  v-if="tx.fileId"
                  :href="`https://drive.google.com/file/d/${tx.fileId}/view`"
                  target="_blank"
                  rel="noopener"
                  class="text-red-600 hover:text-red-800 text-xs font-semibold underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Lihat</span>
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <span v-else class="text-slate-400 text-[11px] italic">Tanpa bukti</span>
              </td>
              <td v-if="txTab === 'Perlu Verifikasi'" class="text-center">
                <BaseButton
                  v-if="tx.status === 'PENDING'"
                  @click="verifyTx(tx)"
                  :loading="verifyingId === tx.id"
                  size="xs"
                >
                  Verifikasi
                </BaseButton>
                <span v-else class="text-xs text-slate-400 font-bold">Valid</span>
              </td>
            </tr>
          </tbody>
        </table>
      </TableScrollWrapper>
    </div>

    <!-- Snackbar Toast -->
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
        class="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl text-sm font-semibold shadow-xl flex items-center gap-2"
      >
        <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>{{ snackbar }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@shared/components/PageHeader.vue'
import BaseButton from '@shared/components/BaseButton.vue'
import MetricStrip from '@shared/components/MetricStrip.vue'
import TableStateRow from '@shared/components/TableStateRow.vue'
import StatusBadge from '@shared/components/StatusBadge.vue'
import TableScrollWrapper from '@shared/components/TableScrollWrapper.vue'
import { api } from '@shared/api/gasClient'
import { useAuthStore } from '../stores/auth'
import { formatRupiah, formatTanggal, formatMetode, formatKategori, getCurrentPeriode } from '@shared/utils/formatters'
import type { KasMasuk, KasKeluar } from '@shared/types'

const route = useRoute()
const authStore = useAuthStore()

const isLoading = ref(false)
const isExporting = ref(false)
const verifyingId = ref<string | null>(null)
const snackbar = ref('')
const selectedPeriode = ref(getCurrentPeriode())
const txTab = ref('Semua')

const kasMasukList = ref<KasMasuk[]>([])
const kasKeluarList = ref<KasKeluar[]>([])

// Daftar kas masuk yang butuh verifikasi (pending)
const pendingKasMasuk = computed(() =>
  kasMasukList.value.filter((k) => k.status_verifikasi === 'PENDING')
)

const tabList = computed(() => [
  { id: 'Semua', label: 'Semua' },
  { id: 'Kas Masuk', label: 'Kas Masuk' },
  { id: 'Kas Keluar', label: 'Kas Keluar' },
  {
    id: 'Perlu Verifikasi',
    label: 'Perlu Verifikasi',
    count: pendingKasMasuk.value.length > 0 ? pendingKasMasuk.value.length : undefined,
  },
])

// Filter kas masuk sesuai periode bulan yang dipilih
const filteredKasMasukByPeriode = computed(() =>
  kasMasukList.value.filter((k) => {
    if (!k.tanggal) return false
    const tgl = String(k.tanggal).substring(0, 7)
    return tgl === selectedPeriode.value
  })
)

const totalMasuk = computed(() =>
  filteredKasMasukByPeriode.value
    .filter((k) => k.status_verifikasi === 'VERIFIED')
    .reduce((s, k) => s + k.nominal, 0)
)
const totalKeluar = computed(() => kasKeluarList.value.reduce((s, k) => s + k.nominal, 0))
const laba = computed(() => totalMasuk.value - totalKeluar.value)

const summaryMetrics = computed(() => [
  {
    label: 'Total Kas Masuk (Verified)',
    value: formatRupiah(totalMasuk.value),
    valueClass: 'text-emerald-600',
    minWidth: 'min-w-[160px]',
  },
  {
    label: 'Total Kas Keluar',
    value: formatRupiah(totalKeluar.value),
    valueClass: 'text-rose-600',
    minWidth: 'min-w-[160px]',
  },
  {
    label: 'Estimasi Laba Bersih',
    value: formatRupiah(Math.abs(laba.value)),
    valueClass: laba.value >= 0 ? 'text-emerald-600' : 'text-rose-600',
    sub: laba.value >= 0 ? '+ Surplus' : '- Defisit',
    subClass: laba.value >= 0 ? 'text-emerald-600' : 'text-rose-600',
    subDot: laba.value >= 0 ? 'bg-emerald-500' : 'bg-rose-500',
    minWidth: 'min-w-[160px]',
  },
])

const sumberList = ['KASIR_TUNAI', 'BANK_BCA', 'QRIS']
const sumberConfig: Record<string, { label: string; dotColor: string }> = {
  KASIR_TUNAI: { label: 'Kasir Tunai', dotColor: 'bg-emerald-500' },
  BANK_BCA: { label: 'Bank BCA', dotColor: 'bg-blue-500' },
  QRIS: { label: 'QRIS', dotColor: 'bg-purple-500' },
}

const sumberRekapData = computed(() =>
  sumberList.map((s) => {
    const cfg = sumberConfig[s] || { label: s, dotColor: 'bg-slate-400' }
    const masuk = filteredKasMasukByPeriode.value
      .filter((k) => k.metode === s && k.status_verifikasi === 'VERIFIED')
      .reduce((sum, k) => sum + k.nominal, 0)
    const keluar = kasKeluarList.value
      .filter((k) => k.sumber_kas === s)
      .reduce((sum, k) => sum + k.nominal, 0)
    return { label: cfg.label, dotColor: cfg.dotColor, masuk, keluar, saldo: masuk - keluar }
  })
)

type TxRow = {
  id: string
  tanggal: string
  tipe: string
  status: string
  keterangan: string
  metode: string
  nominal: number
  fileId?: string
}

const allTx = computed<TxRow[]>(() => [
  ...filteredKasMasukByPeriode.value
    .filter((k) => k.status_verifikasi === 'VERIFIED')
    .map((k) => ({
      id: k.id_kas_masuk,
      tanggal: k.tanggal,
      tipe: 'MASUK',
      status: k.status_verifikasi,
      keterangan: `${k.jenis_pembayaran} — ${k.nama_penerbit ? k.nama_penerbit + ' (' + (k.id_order || '') + ')' : (k.id_order ?? k.keterangan ?? '')}`,
      metode: formatMetode(k.metode),
      nominal: k.nominal,
      fileId: k.file_id_bukti,
    })),
  ...kasKeluarList.value.map((k) => ({
    id: k.id_kas_keluar,
    tanggal: k.tanggal,
    tipe: 'KELUAR',
    status: 'VERIFIED',
    keterangan: `${formatKategori(k.kategori)}: ${k.rincian}`,
    metode: formatMetode(k.sumber_kas),
    nominal: k.nominal,
    fileId: k.file_id_nota,
  })),
].sort((a, b) => b.tanggal.localeCompare(a.tanggal)))

const filteredTx = computed(() => {
  if (txTab.value === 'Kas Masuk') return allTx.value.filter((t) => t.tipe === 'MASUK')
  if (txTab.value === 'Kas Keluar') return allTx.value.filter((t) => t.tipe === 'KELUAR')
  if (txTab.value === 'Perlu Verifikasi') {
    return pendingKasMasuk.value.map((k) => ({
      id: k.id_kas_masuk,
      tanggal: k.tanggal,
      tipe: 'MASUK',
      status: k.status_verifikasi,
      keterangan: `${k.nama_penerbit ? k.nama_penerbit + ' (' + (k.id_order || '') + ')' : (k.id_order ?? k.keterangan ?? '')} — ${k.jenis_pembayaran}`,
      metode: formatMetode(k.metode),
      nominal: k.nominal,
      fileId: k.file_id_bukti,
    }))
  }
  return allTx.value
})

async function verifyTx(tx: TxRow) {
  verifyingId.value = tx.id
  try {
    const res = await api.verifyKasMasuk(tx.id, authStore.nama ?? 'OWNER')
    if (res.success) {
      const item = kasMasukList.value.find((k) => k.id_kas_masuk === tx.id)
      if (item) item.status_verifikasi = 'VERIFIED'
      snackbar.value = `Pembayaran ${formatRupiah(tx.nominal)} berhasil diverifikasi!`
      setTimeout(() => {
        snackbar.value = ''
      }, 3000)
    }
  } catch (e) {
    console.error('Gagal verifikasi:', e)
  } finally {
    verifyingId.value = null
  }
}

async function exportExcel() {
  isExporting.value = true
  try {
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()

    // Sheet 1: Kas Masuk
    const kmData = filteredKasMasukByPeriode.value.map((k) => ({
      ID: k.id_kas_masuk,
      Tanggal: formatTanggal(k.tanggal),
      'ID Order': k.id_order ?? '-',
      Jenis: k.jenis_pembayaran,
      Nominal: k.nominal,
      Metode: formatMetode(k.metode),
      Status: k.status_verifikasi,
      'Diinput Oleh': k.diinput_oleh,
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(kmData), 'Kas Masuk')

    // Sheet 2: Kas Keluar
    const kkData = kasKeluarList.value.map((k) => ({
      ID: k.id_kas_keluar,
      Tanggal: formatTanggal(k.tanggal),
      Kategori: formatKategori(k.kategori),
      Rincian: k.rincian,
      Nominal: k.nominal,
      'Sumber Kas': formatMetode(k.sumber_kas),
      'Diinput Oleh': k.diinput_oleh,
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(kkData), 'Kas Keluar')

    // Sheet 3: Summary
    const summaryData = [
      { Keterangan: 'Periode', Nilai: selectedPeriode.value },
      { Keterangan: 'Total Kas Masuk (Verified)', Nilai: totalMasuk.value },
      { Keterangan: 'Total Kas Keluar', Nilai: totalKeluar.value },
      { Keterangan: 'Estimasi Laba Bersih', Nilai: laba.value },
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), 'Summary')

    XLSX.writeFile(wb, `Transaksi_KBM_${selectedPeriode.value}.xlsx`)
  } finally {
    isExporting.value = false
  }
}

async function loadData() {
  isLoading.value = true
  try {
    const [kmRes, kkRes] = await Promise.all([
      api.getKasMasuk(),
      api.getKasKeluar({ periode: selectedPeriode.value }),
    ])
    if (kmRes.success && kmRes.data) kasMasukList.value = kmRes.data
    if (kkRes.success && kkRes.data) kasKeluarList.value = kkRes.data
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  if (route.query.tab === 'verifikasi') {
    txTab.value = 'Perlu Verifikasi'
  }
  loadData()
})
</script>
