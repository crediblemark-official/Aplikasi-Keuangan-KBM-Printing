<template>
  <div class="w-full min-h-full bg-white fade-in">

    <!-- Header Section (Exact h-14) -->
    <PageHeader title="Laporan & Analitik Keuangan">
      <template #actions>
        <BaseButton @click="exportExcelSummary" :loading="isExporting" size="sm">
          <template #icon>
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </template>
          Export (.xlsx)
        </BaseButton>
      </template>
    </PageHeader>

    <!-- Control Bar: Date Filter (Tanggal, Bulan, Tahun, Rentang) -->
    <div class="px-[8px] sm:px-[15px] lg:px-[20px] py-2.5 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
      <DateFilterBar v-model="dateFilter" initial-mode="MONTH" />
      <span class="text-xs text-slate-500 font-semibold font-mono shrink-0 text-center w-full sm:w-auto">
        Periode Analisis: <strong class="text-slate-800">{{ dateFilter.label || selectedPeriode }}</strong>
      </span>
    </div>

    <!-- Top Metric Strip -->
    <MetricStrip :items="kpiMetrics" />

    <!-- Section 1: Tren Arus Kas Bulanan (Bar & Line Chart) -->
    <div class="px-[8px] py-4 sm:px-[15px] sm:py-5 lg:px-[20px] border-b border-slate-200 bg-white">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 class="text-slate-900 font-bold text-sm sm:text-base tracking-tight">Tren Arus Kas & Margin Keuntungan</h3>
          <p class="text-xs text-slate-500 font-medium">Perbandingan pergerakan Kas Masuk, Kas Keluar, dan Laba Bersih bulanan</p>
        </div>
        <div class="flex items-center gap-3.5 text-xs font-semibold flex-wrap">
          <span class="flex items-center gap-1.5 text-slate-700">
            <span class="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block"></span>Kas Masuk
          </span>
          <span class="flex items-center gap-1.5 text-slate-700">
            <span class="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block"></span>Kas Keluar
          </span>
          <span class="flex items-center gap-1.5 text-slate-700">
            <span class="w-3 h-0.5 bg-indigo-600 inline-block"></span>Laba Bersih
          </span>
        </div>
      </div>
      <div class="h-64 sm:h-72 w-full">
        <canvas ref="trendChartCanvas"></canvas>
      </div>
    </div>

    <!-- Section 2: 2 Column Visualizations (Komposisi Beban & Distribusi Metode) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 border-b border-slate-200">

      <!-- Kolom Kiri (6 cols): Komposisi Pengeluaran Kas per Kategori -->
      <div class="lg:col-span-6 px-[8px] py-4 sm:px-[15px] sm:py-5 lg:px-[20px] border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-slate-900 font-bold text-sm sm:text-base tracking-tight">Komposisi Pengeluaran Kas</h3>
              <p class="text-xs text-slate-500 font-medium">Alokasi biaya berdasarkan kategori pengeluaran</p>
            </div>
            <span class="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200/60">
              Total: {{ formatRupiah(totalKeluar) }}
            </span>
          </div>

          <!-- Donut Chart -->
          <div class="h-44 sm:h-48 flex items-center justify-center my-2">
            <canvas v-show="totalKeluar > 0" ref="kategoriDonutCanvas"></canvas>
            <div v-if="totalKeluar === 0" class="text-center text-slate-400 text-xs py-10">
              Belum ada data pengeluaran kas pada periode ini
            </div>
          </div>

          <!-- Category Breakdown Progress Bars -->
          <div class="space-y-2.5 mt-4 pt-4 border-t border-slate-100">
            <div v-for="item in kategoriBreakdown" :key="item.kategori" class="space-y-1">
              <div class="flex items-center justify-between text-xs">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: item.color }"></span>
                  <span class="font-semibold text-slate-800">{{ item.label }}</span>
                </div>
                <div class="flex items-center gap-2 font-mono">
                  <span class="font-bold text-slate-700">{{ formatRupiah(item.nominal) }}</span>
                  <span class="text-slate-400 text-[11px] w-11 text-right">({{ item.percentage }}%)</span>
                </div>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div class="h-1.5 rounded-full transition-all duration-500" :style="{ width: `${item.percentage}%`, backgroundColor: item.color }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Kolom Kanan (6 cols): Distribusi Pemasukan Kas per Sumber -->
      <div class="lg:col-span-6 px-[8px] py-4 sm:px-[15px] sm:py-5 lg:px-[20px] flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-slate-900 font-bold text-sm sm:text-base tracking-tight">Distribusi Pemasukan per Sumber Kas</h3>
              <p class="text-xs text-slate-500 font-medium">Proporsi penerimaan Tunai, Bank, dan QRIS</p>
            </div>
            <span class="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/60">
              Total: {{ formatRupiah(totalMasuk) }}
            </span>
          </div>

          <!-- Donut Chart -->
          <div class="h-44 sm:h-48 flex items-center justify-center my-2">
            <canvas v-show="totalMasuk > 0" ref="sumberDonutCanvas"></canvas>
            <div v-if="totalMasuk === 0" class="text-center text-slate-400 text-xs py-10">
              Belum ada data pemasukan kas verified pada periode ini
            </div>
          </div>

          <!-- Source Breakdown Progress Bars -->
          <div class="space-y-2.5 mt-4 pt-4 border-t border-slate-100">
            <div v-for="item in sumberBreakdown" :key="item.sumber" class="space-y-1">
              <div class="flex items-center justify-between text-xs">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: item.color }"></span>
                  <span class="font-semibold text-slate-800">{{ item.label }}</span>
                </div>
                <div class="flex items-center gap-2 font-mono">
                  <span class="font-bold text-slate-700">{{ formatRupiah(item.nominal) }}</span>
                  <span class="text-slate-400 text-[11px] w-11 text-right">({{ item.percentage }}%)</span>
                </div>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div class="h-1.5 rounded-full transition-all duration-500" :style="{ width: `${item.percentage}%`, backgroundColor: item.color }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Section 3: Jenis Pembayaran & Highlight Financial Insight Cards -->
    <div class="p-[8px] py-4 sm:p-[15px] sm:py-5 lg:p-[20px] bg-slate-50/50">
      <div class="flex md:grid md:grid-cols-3 gap-3.5 overflow-x-auto scrollbar-none snap-x snap-mandatory py-0.5">

        <!-- Card 1: Rasio DP vs Pelunasan -->
        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs w-[82vw] sm:w-[320px] md:w-auto max-w-[340px] md:max-w-none shrink-0 snap-start flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-slate-600">Struktur Pembayaran</span>
              <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono">Masuk</span>
            </div>
            <div class="space-y-2">
              <div>
                <div class="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Pelunasan</span>
                  <span class="font-mono text-emerald-600">{{ formatRupiah(jenisBreakdown.pelunasan) }}</span>
                </div>
                <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div class="bg-emerald-500 h-2 rounded-full" :style="{ width: `${jenisBreakdown.pelunasanPct}%` }"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Uang Muka (DP)</span>
                  <span class="font-mono text-blue-600">{{ formatRupiah(jenisBreakdown.dp) }}</span>
                </div>
                <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div class="bg-blue-500 h-2 rounded-full" :style="{ width: `${jenisBreakdown.dpPct}%` }"></div>
                </div>
              </div>
            </div>
          </div>
          <p class="text-[11px] text-slate-400 mt-3 pt-2.5 border-t border-slate-100">
            {{ jenisBreakdown.pelunasanPct }}% kas masuk berasal dari pelunasan final pesanan.
          </p>
        </div>

        <!-- Card 2: Pengeluaran Terbesar -->
        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs w-[82vw] sm:w-[320px] md:w-auto max-w-[340px] md:max-w-none shrink-0 snap-start flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-slate-600">Beban Terbesar</span>
              <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 font-mono">Top Cost</span>
            </div>
            <div class="mt-1">
              <h4 class="text-base font-bold text-slate-900">{{ topCategory.label }}</h4>
              <p class="text-xl font-black font-mono text-rose-600 mt-0.5">{{ formatRupiah(topCategory.nominal) }}</p>
              <p class="text-[11px] text-slate-500 font-medium mt-1">
                Menyerap <span class="font-bold text-slate-800">{{ topCategory.percentage }}%</span> dari total pengeluaran bulan ini.
              </p>
            </div>
          </div>
          <p class="text-[11px] text-slate-400 mt-3 pt-2.5 border-t border-slate-100">
            Pastikan efisiensi dan pencatatan stok terjaga.
          </p>
        </div>

        <!-- Card 3: Status Efisiensi & Cashflow -->
        <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs w-[82vw] sm:w-[320px] md:w-auto max-w-[340px] md:max-w-none shrink-0 snap-start flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-slate-600">Kesehatan Arus Kas</span>
              <span
                class="text-[10px] font-bold px-1.5 py-0.5 rounded-md font-mono"
                :class="labaBersih >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'"
              >
                {{ labaBersih >= 0 ? 'SURPLUS' : 'DEFISIT' }}
              </span>
            </div>
            <div class="mt-1">
              <h4 class="text-base font-bold" :class="labaBersih >= 0 ? 'text-emerald-700' : 'text-rose-700'">
                {{ labaBersih >= 0 ? 'Cash Flow Sehat' : 'Defisit Terdeteksi' }}
              </h4>
              <p class="text-xl font-black font-mono mt-0.5" :class="labaBersih >= 0 ? 'text-emerald-600' : 'text-rose-600'">
                {{ formatRupiah(Math.abs(labaBersih)) }}
              </p>
              <p class="text-[11px] text-slate-500 font-medium mt-1">
                Margin laba bersih tercatat sebesar <span class="font-bold text-slate-800">{{ profitMargin }}%</span>.
              </p>
            </div>
          </div>
          <p class="text-[11px] text-slate-400 mt-3 pt-2.5 border-t border-slate-100">
            Dihitung dari total masuk verified dikurangi kas keluar.
          </p>
        </div>

      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="isLoading" class="flex justify-center py-10">
      <div class="flex items-center gap-2 text-red-600 text-sm font-semibold">
        <div class="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        Memuat dan merender laporan visual...
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import PageHeader from '@shared/components/PageHeader.vue'
import BaseButton from '@shared/components/BaseButton.vue'
import MetricStrip from '@shared/components/MetricStrip.vue'
import DateFilterBar from '@shared/components/DateFilterBar.vue'
import { api } from '@shared/api/gasClient'
import {
  formatRupiah,
  getCurrentPeriode,
  formatKategori,
  formatMetode,
  formatTanggal,
  isDateInFilterRange,
} from '@shared/utils/formatters'
import type { KasMasuk, KasKeluar, SummaryReport, DateFilterValue } from '@shared/types'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const isLoading = ref(false)
const isExporting = ref(false)
const selectedPeriode = ref(getCurrentPeriode())
const dateFilter = ref<DateFilterValue>({ mode: 'MONTH' })

const kasMasukList = ref<KasMasuk[]>([])
const kasKeluarList = ref<KasKeluar[]>([])
const summaryReport = ref<SummaryReport>({
  kas_masuk_bulan_ini: 0,
  kas_keluar_bulan_ini: 0,
  estimasi_laba: 0,
  total_piutang: 0,
  kas_per_sumber: { kasir_tunai: 0, bank_bca: 0, qris: 0 },
  chart_data: [],
})

// Canvas refs
const trendChartCanvas = ref<HTMLCanvasElement>()
const kategoriDonutCanvas = ref<HTMLCanvasElement>()
const sumberDonutCanvas = ref<HTMLCanvasElement>()

let trendChartInstance: Chart | null = null
let kategoriDonutInstance: Chart | null = null
let sumberDonutInstance: Chart | null = null

// Filter kas masuk sesuai periode / rentang tanggal yang dipilih
const filteredKasMasukByPeriode = computed(() =>
  kasMasukList.value.filter((k) => {
    if (!k.tanggal) return false
    return isDateInFilterRange(k.tanggal, dateFilter.value)
  })
)

// Filter kas keluar sesuai periode / rentang tanggal yang dipilih
const filteredKasKeluarByPeriode = computed(() =>
  kasKeluarList.value.filter((k) => {
    if (!k.tanggal) return false
    return isDateInFilterRange(k.tanggal, dateFilter.value)
  })
)

const totalMasuk = computed(() =>
  filteredKasMasukByPeriode.value
    .filter((k) => k.status_verifikasi === 'VERIFIED')
    .reduce((s, k) => s + k.nominal, 0)
)
const totalKeluar = computed(() => filteredKasKeluarByPeriode.value.reduce((s, k) => s + k.nominal, 0))
const labaBersih = computed(() => totalMasuk.value - totalKeluar.value)

const profitMargin = computed(() => {
  if (totalMasuk.value <= 0) return '0.0'
  return ((labaBersih.value / totalMasuk.value) * 100).toFixed(1)
})

const expenseRatio = computed(() => {
  if (totalMasuk.value <= 0) return '0.0'
  return ((totalKeluar.value / totalMasuk.value) * 100).toFixed(1)
})

const kpiMetrics = computed(() => [
  {
    label: 'Kas Masuk (Verified)',
    value: formatRupiah(totalMasuk.value),
    valueClass: 'text-emerald-600',
    sub: 'Periode ' + (dateFilter.value.label || selectedPeriode.value),
    subClass: 'text-emerald-600',
    subDot: 'bg-emerald-500',
    minWidth: 'min-w-[150px]',
  },
  {
    label: 'Total Pengeluaran Kas',
    value: formatRupiah(totalKeluar.value),
    valueClass: 'text-rose-600',
    sub: 'Periode ' + (dateFilter.value.label || selectedPeriode.value),
    subClass: 'text-rose-600',
    subDot: 'bg-rose-500',
    minWidth: 'min-w-[150px]',
  },
  {
    label: 'Laba Bersih Operasional',
    value: formatRupiah(Math.abs(labaBersih.value)),
    valueClass: labaBersih.value >= 0 ? 'text-emerald-600' : 'text-rose-600',
    sub: labaBersih.value >= 0 ? '+ Surplus Kas' : '- Defisit Kas',
    subClass: labaBersih.value >= 0 ? 'text-emerald-600' : 'text-rose-600',
    subDot: labaBersih.value >= 0 ? 'bg-emerald-500' : 'bg-rose-500',
    minWidth: 'min-w-[150px]',
  },
  {
    label: 'Net Profit Margin',
    value: `${profitMargin.value}%`,
    valueClass: Number(profitMargin.value) >= 0 ? 'text-indigo-600' : 'text-rose-600',
    sub: 'Margin laba bersih',
    subClass: 'text-slate-500',
    subDot: 'bg-indigo-500',
    minWidth: 'min-w-[130px]',
  },
  {
    label: 'Rasio Beban Kas',
    value: `${expenseRatio.value}%`,
    valueClass: 'text-amber-600',
    sub: 'Beban terhadap masuk',
    subClass: 'text-slate-500',
    subDot: 'bg-amber-500',
    minWidth: 'min-w-[130px]',
  },
])

// Kategori Pengeluaran Data
const kategoriColorMap: Record<string, string> = {
  BAHAN_BAKU: '#059669', // Emerald
  OPERASIONAL: '#0284c7', // Sky
  GAJI: '#6366f1', // Indigo
  KONSUMSI: '#f59e0b', // Amber
  LAIN_LAIN: '#64748b', // Slate
}

const kategoriBreakdown = computed(() => {
  const totals: Record<string, number> = {
    BAHAN_BAKU: 0,
    OPERASIONAL: 0,
    GAJI: 0,
    KONSUMSI: 0,
    LAIN_LAIN: 0,
  }
  filteredKasKeluarByPeriode.value.forEach((k) => {
    if (totals[k.kategori] !== undefined) {
      totals[k.kategori] += k.nominal
    } else {
      totals['LAIN_LAIN'] += k.nominal
    }
  })

  const sumTotal = totalKeluar.value || 1
  return Object.entries(totals).map(([kat, nominal]) => ({
    kategori: kat,
    label: formatKategori(kat),
    nominal,
    color: kategoriColorMap[kat] || '#94a3b8',
    percentage: ((nominal / sumTotal) * 100).toFixed(1),
  })).sort((a, b) => b.nominal - a.nominal)
})

const topCategory = computed(() => {
  if (kategoriBreakdown.value.length === 0 || totalKeluar.value === 0) {
    return { label: 'Tidak ada pengeluaran', nominal: 0, percentage: '0' }
  }
  return kategoriBreakdown.value[0]
})

// Sumber Kas Pemasukan Data
const sumberColorMap: Record<string, string> = {
  KASIR_TUNAI: '#10b981', // Emerald
  BANK_BCA: '#3b82f6', // Blue
  QRIS: '#a855f7', // Purple
}

const sumberBreakdown = computed(() => {
  const totals: Record<string, number> = {
    KASIR_TUNAI: 0,
    BANK_BCA: 0,
    QRIS: 0,
  }
  filteredKasMasukByPeriode.value
    .filter((k) => k.status_verifikasi === 'VERIFIED')
    .forEach((k) => {
      if (totals[k.metode] !== undefined) {
        totals[k.metode] += k.nominal
      }
    })

  const sumTotal = totalMasuk.value || 1
  return Object.entries(totals).map(([sumber, nominal]) => ({
    sumber,
    label: formatMetode(sumber),
    nominal,
    color: sumberColorMap[sumber] || '#94a3b8',
    percentage: ((nominal / sumTotal) * 100).toFixed(1),
  })).sort((a, b) => b.nominal - a.nominal)
})

// Jenis Pembayaran Breakdown (DP vs Pelunasan)
const jenisBreakdown = computed(() => {
  let dp = 0
  let pelunasan = 0
  filteredKasMasukByPeriode.value
    .filter((k) => k.status_verifikasi === 'VERIFIED')
    .forEach((k) => {
      if (k.jenis_pembayaran === 'DP') dp += k.nominal
      else pelunasan += k.nominal
    })
  const total = dp + pelunasan || 1
  return {
    dp,
    pelunasan,
    dpPct: Math.round((dp / total) * 100),
    pelunasanPct: Math.round((pelunasan / total) * 100),
  }
})

function formatMonthLabel(ym: string) {
  if (!ym) return ''
  const parts = ym.split('-')
  if (parts.length < 2) return ym
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const mIndex = parseInt(parts[1], 10) - 1
  return monthNames[mIndex] || ym
}

function renderTrendChart() {
  if (!trendChartCanvas.value) return
  if (trendChartInstance) trendChartInstance.destroy()

  const rawData = summaryReport.value.chart_data || []
  const labels = rawData.map((d) => formatMonthLabel(d.bulan))
  const masukData = rawData.map((d) => d.kas_masuk)
  const keluarData = rawData.map((d) => d.kas_keluar)
  const labaData = rawData.map((d) => d.kas_masuk - d.kas_keluar)

  const maxVal = Math.max(...masukData, ...keluarData, 0)
  const suggestedMax = maxVal === 0 ? 5_000_000 : maxVal * 1.2

  trendChartInstance = new Chart(trendChartCanvas.value, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          type: 'line',
          label: 'Laba Bersih',
          data: labaData,
          borderColor: '#4f46e5',
          backgroundColor: '#4f46e5',
          borderWidth: 2.5,
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: '#4f46e5',
          order: 1,
        },
        {
          type: 'bar',
          label: 'Kas Masuk',
          data: masukData,
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderRadius: 6,
          order: 2,
        },
        {
          type: 'bar',
          label: 'Kas Keluar',
          data: keluarData,
          backgroundColor: 'rgba(244, 63, 94, 0.8)',
          borderRadius: 6,
          order: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${formatRupiah(Number(ctx.raw) || 0)}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: '#64748b',
            font: { weight: 600, size: 11 },
          },
        },
        y: {
          beginAtZero: true,
          suggestedMax,
          grid: { color: 'rgba(241, 245, 249, 0.8)' },
          ticks: {
            color: '#64748b',
            font: { weight: 500, size: 11 },
            callback: (v) => {
              const num = Number(v)
              if (num === 0) return '0'
              if (Math.abs(num) >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M'
              if (Math.abs(num) >= 1_000) return (num / 1_000).toFixed(0) + 'k'
              return String(num)
            },
          },
        },
      },
    },
  })
}

function renderKategoriDonut() {
  if (!kategoriDonutCanvas.value || totalKeluar.value <= 0) return
  if (kategoriDonutInstance) kategoriDonutInstance.destroy()

  const activeCategories = kategoriBreakdown.value.filter((k) => k.nominal > 0)
  if (activeCategories.length === 0) return

  kategoriDonutInstance = new Chart(kategoriDonutCanvas.value, {
    type: 'doughnut',
    data: {
      labels: activeCategories.map((c) => c.label),
      datasets: [
        {
          data: activeCategories.map((c) => c.nominal),
          backgroundColor: activeCategories.map((c) => c.color),
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${formatRupiah(Number(ctx.raw) || 0)}`,
          },
        },
      },
    },
  })
}

function renderSumberDonut() {
  if (!sumberDonutCanvas.value || totalMasuk.value <= 0) return
  if (sumberDonutInstance) sumberDonutInstance.destroy()

  const activeSources = sumberBreakdown.value.filter((s) => s.nominal > 0)
  if (activeSources.length === 0) return

  sumberDonutInstance = new Chart(sumberDonutCanvas.value, {
    type: 'doughnut',
    data: {
      labels: activeSources.map((s) => s.label),
      datasets: [
        {
          data: activeSources.map((s) => s.nominal),
          backgroundColor: activeSources.map((s) => s.color),
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${formatRupiah(Number(ctx.raw) || 0)}`,
          },
        },
      },
    },
  })
}

function renderAllCharts() {
  renderTrendChart()
  renderKategoriDonut()
  renderSumberDonut()
}

async function loadAllData() {
  isLoading.value = true
  try {
    const [kmRes, kkRes, sumRes] = await Promise.all([
      api.getKasMasuk(),
      api.getKasKeluar(),
      api.getSummaryReport(selectedPeriode.value),
    ])

    if (kmRes.success && kmRes.data) kasMasukList.value = kmRes.data
    if (kkRes.success && kkRes.data) kasKeluarList.value = kkRes.data
    if (sumRes.success && sumRes.data) summaryReport.value = sumRes.data

    await nextTick()
    renderAllCharts()
  } catch (err) {
    console.error('Failed to load chart report data:', err)
  } finally {
    isLoading.value = false
  }
}

watch(
  dateFilter,
  async () => {
    await nextTick()
    renderKategoriDonut()
    renderSumberDonut()
  },
  { deep: true }
)

async function exportExcelSummary() {
  isExporting.value = true
  try {
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()

    const periodLabel = (dateFilter.value.label || selectedPeriode.value).replace(/[^a-zA-Z0-9_-]/g, '_')

    // Sheet 1: Ringkasan KPI
    const kpiData = [
      { Indikator: 'Periode Analisis', Nilai: dateFilter.value.label || selectedPeriode.value },
      { Indikator: 'Total Kas Masuk (Verified)', Nilai: totalMasuk.value },
      { Indikator: 'Total Kas Keluar', Nilai: totalKeluar.value },
      { Indikator: 'Estimasi Laba Bersih', Nilai: labaBersih.value },
      { Indikator: 'Net Profit Margin (%)', Nilai: `${profitMargin.value}%` },
      { Indikator: 'Expense Ratio (%)', Nilai: `${expenseRatio.value}%` },
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(kpiData), 'Ringkasan KPI')

    // Sheet 2: Komposisi Biaya Operasional
    const katData = kategoriBreakdown.value.map((k) => ({
      Kategori: k.label,
      Nominal: k.nominal,
      Persentase: `${k.percentage}%`,
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(katData), 'Komposisi Beban')

    // Sheet 3: Sumber Penerimaan Kas
    const srcData = sumberBreakdown.value.map((s) => ({
      'Sumber Kas': s.label,
      Nominal: s.nominal,
      Persentase: `${s.percentage}%`,
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(srcData), 'Sumber Kas')

    XLSX.writeFile(wb, `Laporan_Analitik_KBM_${periodLabel}.xlsx`)
  } finally {
    isExporting.value = false
  }
}

onMounted(loadAllData)
</script>
