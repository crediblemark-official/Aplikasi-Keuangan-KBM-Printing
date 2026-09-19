<template>
  <div class="w-full min-h-full bg-white fade-in">

    <!-- Header Section (Edge-to-Edge, exact same h-14 height as sidebar) -->
    <PageHeader title="Dashboard Keuangan">
      <template #leading>
        <div class="flex items-center">
          <KbmLogo size="sm" variant="icon" />
        </div>
      </template>
      <template #actions>
        <label class="text-xs font-semibold text-slate-500 hidden sm:inline">Periode:</label>
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
      </template>
    </PageHeader>

    <!-- Metrics Section (Horizontal Scroll) -->
    <MetricStrip :items="summaryMetrics" />

    <!-- Chart + Kas per Sumber Section (Full Edge, Line-Divided) -->
    <div class="grid grid-cols-1 md:grid-cols-12 border-b border-slate-200">

      <!-- Chart Column (7 cols on md, 8 cols on lg) -->
      <div class="md:col-span-7 lg:col-span-8 px-[8px] py-4 sm:px-[15px] sm:py-5 lg:px-[20px] border-b md:border-b-0 md:border-r border-slate-200">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 class="text-slate-900 font-bold text-sm sm:text-base tracking-tight">Arus Kas Masuk vs Kas Keluar</h3>
            <p class="text-xs text-slate-500 font-medium">Tren pergerakan kas 6 bulan terakhir</p>
          </div>
          <div class="flex items-center gap-4 text-xs font-semibold">
            <span class="flex items-center gap-1.5 text-slate-700">
              <span class="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block"></span>Kas Masuk
            </span>
            <span class="flex items-center gap-1.5 text-slate-700">
              <span class="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block"></span>Kas Keluar
            </span>
          </div>
        </div>
        <div class="h-64 sm:h-72 w-full">
          <canvas ref="chartCanvas"></canvas>
        </div>
      </div>

      <!-- Saldo per Sumber Kas Column (5 cols on md, 4 cols on lg) -->
      <div class="md:col-span-5 lg:col-span-4 px-[8px] py-4 sm:px-[15px] sm:py-5 lg:px-[20px] flex flex-col justify-between">
        <div>
          <div class="mb-4">
            <h3 class="text-slate-900 font-bold text-sm sm:text-base tracking-tight">Saldo per Sumber Kas</h3>
            <p class="text-xs text-slate-500 font-medium">Distribusi saldo kas terkini</p>
          </div>

          <div class="divide-y divide-slate-100">
            <div v-for="sumber in kasPerSumber" :key="sumber.label"
                 class="flex items-center justify-between py-3">
              <div class="flex items-center gap-2.5">
                <span class="w-2.5 h-2.5 rounded-full" :class="sumber.dotColor"></span>
                <span class="text-sm text-slate-700 font-medium">{{ sumber.label }}</span>
              </div>
              <span class="text-slate-900 font-bold text-sm font-mono tracking-tight">{{ formatRupiah(sumber.nilai) }}</span>
            </div>
          </div>
        </div>

        <!-- Donut mini -->
        <div class="mt-6 pt-4 border-t border-slate-100">
          <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Proporsi Kas</p>
          <div class="h-28 flex items-center justify-center">
            <canvas ref="donutCanvas"></canvas>
          </div>
        </div>
      </div>

    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center py-8">
      <div class="flex items-center gap-2 text-red-600 text-sm font-semibold">
        <div class="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        Memuat data...
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import PageHeader from '@shared/components/PageHeader.vue'
import KbmLogo from '@shared/components/KbmLogo.vue'
import MetricStrip from '@shared/components/MetricStrip.vue'
import type { MetricItem } from '@shared/components/MetricStrip.vue'
import { api } from '@shared/api/gasClient'
import { formatRupiah, getCurrentPeriode } from '@shared/utils/formatters'
import type { SummaryReport } from '@shared/types'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const isLoading = ref(false)
const chartCanvas = ref<HTMLCanvasElement>()
const donutCanvas = ref<HTMLCanvasElement>()
let chartInstance: Chart | null = null
let donutInstance: Chart | null = null

const currentPeriode = computed(() => getCurrentPeriode())
const selectedPeriode = ref(getCurrentPeriode())

// Generate last 6 months for filter
const periodeOptions = computed(() => {
  const opts = []
  const now = new Date()
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    opts.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return opts
})

const summary = ref<SummaryReport>({
  kas_masuk_bulan_ini: 0,
  kas_keluar_bulan_ini: 0,
  estimasi_laba: 0,
  total_piutang: 0,
  kas_per_sumber: { kasir_tunai: 0, bank_bca: 0, qris: 0 },
  chart_data: [],
})

const summaryMetrics = computed<MetricItem[]>(() => [
  {
    label: 'Kas Masuk (Verified)',
    value: formatRupiah(summary.value.kas_masuk_bulan_ini),
    sub: 'Bulan ini',
    subClass: 'text-emerald-600',
    subDot: 'bg-emerald-500',
    minWidth: 'min-w-[150px]',
  },
  {
    label: 'Kas Keluar',
    value: formatRupiah(summary.value.kas_keluar_bulan_ini),
    sub: 'Bulan ini',
    subClass: 'text-rose-600',
    subDot: 'bg-rose-500',
    minWidth: 'min-w-[150px]',
  },
  {
    label: 'Est. Laba Bersih',
    value: formatRupiah(Math.abs(summary.value.estimasi_laba)),
    valueClass: summary.value.estimasi_laba >= 0 ? 'text-emerald-600' : 'text-rose-600',
    sub: summary.value.estimasi_laba >= 0 ? '+ Surplus' : '- Defisit',
    subClass: summary.value.estimasi_laba >= 0 ? 'text-emerald-600' : 'text-rose-600',
    subDot: summary.value.estimasi_laba >= 0 ? 'bg-emerald-500' : 'bg-rose-500',
    minWidth: 'min-w-[150px]',
  },
  {
    label: 'Total Piutang',
    value: formatRupiah(summary.value.total_piutang),
    valueClass: 'text-amber-600',
    sub: 'Belum tertagih',
    subClass: 'text-amber-700',
    subDot: 'bg-amber-500',
    minWidth: 'min-w-[150px]',
  },
])

const kasPerSumber = computed(() => [
  { label: 'Kasir Tunai', dotColor: 'bg-emerald-500', nilai: summary.value.kas_per_sumber.kasir_tunai },
  { label: 'Bank BCA', dotColor: 'bg-blue-500', nilai: summary.value.kas_per_sumber.bank_bca },
  { label: 'QRIS', dotColor: 'bg-purple-500', nilai: summary.value.kas_per_sumber.qris },
])

async function loadData() {
  isLoading.value = true
  try {
    const res = await api.getSummaryReport(selectedPeriode.value)
    if (res.success && res.data) {
      summary.value = res.data
      await nextTick()
      renderCharts()
    }
  } finally {
    isLoading.value = false
  }
}

function formatMonthLabel(ym: string) {
  if (!ym) return ''
  const parts = ym.split('-')
  if (parts.length < 2) return ym
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const mIndex = parseInt(parts[1], 10) - 1
  return monthNames[mIndex] || ym
}

function renderCharts() {
  // Bar Chart
  if (chartCanvas.value) {
    if (chartInstance) chartInstance.destroy()
    const masukData = summary.value.chart_data.map((d) => d.kas_masuk)
    const keluarData = summary.value.chart_data.map((d) => d.kas_keluar)
    const maxVal = Math.max(...masukData, ...keluarData, 0)
    const suggestedMax = maxVal === 0 ? 5_000_000 : maxVal * 1.15

    chartInstance = new Chart(chartCanvas.value, {
      type: 'bar',
      data: {
        labels: summary.value.chart_data.map((d) => formatMonthLabel(d.bulan)),
        datasets: [
          { label: 'Kas Masuk', data: masukData, backgroundColor: 'rgba(16,185,129,0.75)', borderRadius: 6 },
          { label: 'Kas Keluar', data: keluarData, backgroundColor: 'rgba(239,68,68,0.75)', borderRadius: 6 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.dataset.label}: ${formatRupiah(Number(context.raw) || 0)}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: '#64748b',
              font: { weight: 600, size: 11 },
              maxRotation: 0,
              minRotation: 0,
            },
          },
          y: {
            beginAtZero: true,
            min: 0,
            suggestedMax,
            grid: { color: 'rgba(226, 232, 240, 0.6)' },
            ticks: {
              color: '#64748b',
              font: { weight: 500, size: 11 },
              callback: (v) => {
                const num = Number(v)
                if (num === 0) return '0'
                if (num >= 1_000_000) {
                  const jt = num / 1_000_000
                  return `${Number.isInteger(jt) ? jt : jt.toFixed(1)}Jt`
                }
                if (num >= 1_000) return `${Math.round(num / 1_000)}Rb`
                return String(num)
              },
            },
          },
        },
      },
    })
  }

  // Donut Chart
  if (donutCanvas.value) {
    if (donutInstance) donutInstance.destroy()
    donutInstance = new Chart(donutCanvas.value, {
      type: 'doughnut',
      data: {
        labels: ['Kasir Tunai', 'BCA', 'QRIS'],
        datasets: [{
          data: [
            summary.value.kas_per_sumber.kasir_tunai,
            summary.value.kas_per_sumber.bank_bca,
            summary.value.kas_per_sumber.qris,
          ],
          backgroundColor: ['#10b981', '#2563eb', '#f59e0b'],
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '70%',
        plugins: { legend: { display: false } },
      },
    })
  }
}

onMounted(loadData)
</script>
