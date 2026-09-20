<template>
  <div class="border-b border-slate-200 bg-slate-50/60">
    
    <!-- 1. Operational Quick Alerts / Smart Insights -->
    <div class="px-3 sm:px-5 py-3.5 border-b border-slate-200 bg-white grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
      
      <!-- Card 1: Antrean Produksi Aktif -->
      <div class="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex flex-col justify-between">
        <div class="flex items-center justify-between mb-1">
          <span class="text-[11px] font-bold text-amber-900 uppercase tracking-wider">Antrean Cetak</span>
          <span class="flex h-2 w-2 relative">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
        </div>
        <div>
          <div class="flex items-baseline gap-1">
            <span class="text-xl sm:text-2xl font-black text-amber-950 font-mono">{{ activeOrdersCount }}</span>
            <span class="text-xs font-semibold text-amber-700">order</span>
          </div>
          <p class="text-[11px] text-amber-700 font-medium truncate mt-0.5">
            {{ formatRibuan(activeTotalPcs) }} total oplah pcs
          </p>
        </div>
      </div>

      <!-- Card 2: Siap Kirim / Ambil -->
      <div class="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex flex-col justify-between">
        <div class="flex items-center justify-between mb-1">
          <span class="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">Siap Kirim / Ambil</span>
          <svg class="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <div class="flex items-baseline gap-1">
            <span class="text-xl sm:text-2xl font-black text-emerald-950 font-mono">{{ completedOrdersCount }}</span>
            <span class="text-xs font-semibold text-emerald-700">order</span>
          </div>
          <p class="text-[11px] text-emerald-700 font-medium truncate mt-0.5">
            {{ formatRibuan(completedTotalPcs) }} pcs cetak selesai
          </p>
        </div>
      </div>

      <!-- Card 3: Peringatan Belum Lunas (Siap Ambil tapi Belum Lunas) -->
      <div class="p-3 rounded-2xl bg-rose-50/70 border border-rose-200/80 flex flex-col justify-between">
        <div class="flex items-center justify-between mb-1">
          <span class="text-[11px] font-bold text-rose-900 uppercase tracking-wider">Perlu Pelunasan</span>
          <svg class="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <div class="flex items-baseline gap-1">
            <span class="text-xl sm:text-2xl font-black text-rose-950 font-mono">{{ unpaidCompletedCount }}</span>
            <span class="text-xs font-semibold text-rose-700">order</span>
          </div>
          <p class="text-[11px] text-rose-700 font-medium truncate mt-0.5" title="Order selesai cetak namun belum lunas">
            Cek kasir sblm serah terima
          </p>
        </div>
      </div>

      <!-- Card 4: Kertas Terbanyak Dipakai -->
      <div class="p-3 rounded-2xl bg-slate-100/90 border border-slate-200 flex flex-col justify-between">
        <div class="flex items-center justify-between mb-1">
          <span class="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Bahan Dominan</span>
          <svg class="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <span class="text-sm sm:text-base font-extrabold text-slate-800 line-clamp-1">
            {{ dominantPaper.name }}
          </span>
          <p class="text-[11px] text-slate-500 font-medium truncate mt-0.5">
            {{ dominantPaper.percentage }}% dari total volume
          </p>
        </div>
      </div>

    </div>

    <!-- 2. Charts Row (Edge-to-Edge Divided) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 bg-white">
      
      <!-- Chart Left: Tren Volume Produksi 7 Hari Terakhir (8 cols on lg) -->
      <div class="lg:col-span-7 xl:col-span-8 p-3 sm:p-5 border-b lg:border-b-0 lg:border-r border-slate-200">
        <div class="flex items-center justify-between mb-3">
          <div>
            <h3 class="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-red-600"></span>
              <span>Tren Volume Produksi (7 Hari Terakhir)</span>
            </h3>
            <p class="text-[11px] text-slate-400">Total eksemplar buku (pcs) dan jumlah pesanan masuk per hari</p>
          </div>
          <span class="text-[11px] font-bold text-slate-600 font-mono bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
            {{ formatRibuan(last7DaysTotalPcs) }} pcs
          </span>
        </div>

        <!-- Canvas Container -->
        <div class="h-52 sm:h-60 relative w-full">
          <canvas ref="productionChartCanvas"></canvas>
        </div>
      </div>

      <!-- Chart Right: Komposisi Bahan & Ukuran Buku (4 cols on lg) -->
      <div class="lg:col-span-5 xl:col-span-4 p-3 sm:p-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-xs sm:text-sm font-bold text-slate-800">
            Distribusi Produksi
          </h3>
          <!-- Toggle Breakdown Type -->
          <div class="inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold shadow-2xs">
            <button
              type="button"
              @click="activeBreakdown = 'kertas'"
              :class="[
                'px-2.5 py-1 rounded-lg transition-all cursor-pointer text-xs',
                activeBreakdown === 'kertas'
                  ? 'bg-white text-red-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              ]"
            >
              Kertas
            </button>
            <button
              type="button"
              @click="activeBreakdown = 'ukuran'"
              :class="[
                'px-2.5 py-1 rounded-lg transition-all cursor-pointer text-xs',
                activeBreakdown === 'ukuran'
                  ? 'bg-white text-red-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              ]"
            >
              Ukuran
            </button>
            <button
              type="button"
              @click="activeBreakdown = 'status'"
              :class="[
                'px-2.5 py-1 rounded-lg transition-all cursor-pointer text-xs',
                activeBreakdown === 'status'
                  ? 'bg-white text-red-600 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              ]"
            >
              Status
            </button>
          </div>
        </div>

        <!-- Donut Canvas Container -->
        <div class="h-52 sm:h-60 relative w-full flex items-center justify-center">
          <canvas ref="distributionChartCanvas"></canvas>
        </div>
      </div>

    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'
import type { Order } from '../types'

Chart.register(...registerables)

const props = defineProps<{
  orders: Order[]
  getPaymentStatus?: (orderId: string, total: number) => string
}>()

const activeBreakdown = ref<'kertas' | 'ukuran' | 'status'>('kertas')

const productionChartCanvas = ref<HTMLCanvasElement>()
const distributionChartCanvas = ref<HTMLCanvasElement>()
let productionChartInstance: Chart | null = null
let distributionChartInstance: Chart | null = null

// ---- 1. Quick Insight Metrics ----
const activeOrdersCount = computed(() => {
  return props.orders.filter(o => o.status_order === 'PROSES').length
})

const activeTotalPcs = computed(() => {
  return props.orders
    .filter(o => o.status_order === 'PROSES')
    .reduce((sum, o) => sum + (o.jml_pcs || 0), 0)
})

const completedOrdersCount = computed(() => {
  return props.orders.filter(o => o.status_order === 'SELESAI').length
})

const completedTotalPcs = computed(() => {
  return props.orders
    .filter(o => o.status_order === 'SELESAI')
    .reduce((sum, o) => sum + (o.jml_pcs || 0), 0)
})

const unpaidCompletedCount = computed(() => {
  return props.orders.filter(o => {
    if (o.status_order !== 'SELESAI') return false
    if (!props.getPaymentStatus) return false
    const payStatus = props.getPaymentStatus(o.id_order, o.total_harga)
    return payStatus === 'BELUM_BAYAR' || payStatus === 'DP'
  }).length
})

// Dominant Paper
const dominantPaper = computed(() => {
  const paperMap: Record<string, number> = {}
  let totalVolume = 0

  props.orders.forEach(o => {
    const k = cleanPaperLabel(o.kertas)
    const pcs = o.jml_pcs || 0
    paperMap[k] = (paperMap[k] || 0) + pcs
    totalVolume += pcs
  })

  let topName = '-'
  let topPcs = 0

  Object.entries(paperMap).forEach(([name, pcs]) => {
    if (pcs > topPcs) {
      topPcs = pcs
      topName = name
    }
  })

  const pct = totalVolume > 0 ? Math.round((topPcs / totalVolume) * 100) : 0
  return {
    name: topName,
    percentage: pct,
  }
})

// ---- 2. Last 7 Days Production Trend ----
const last7DaysData = computed(() => {
  const days: { dateStr: string; label: string; pcs: number; ordersCount: number }[] = []
  const today = new Date()

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const label = `${d.getDate()} ${formatMonthShort(d.getMonth())}`
    days.push({ dateStr, label, pcs: 0, ordersCount: 0 })
  }

  props.orders.forEach(o => {
    const orderDate = (o.tanggal || '').slice(0, 10)
    const found = days.find(day => day.dateStr === orderDate)
    if (found) {
      found.pcs += o.jml_pcs || 0
      found.ordersCount += 1
    }
  })

  return days
})

const last7DaysTotalPcs = computed(() => {
  return last7DaysData.value.reduce((sum, d) => sum + d.pcs, 0)
})

// ---- 3. Distribution Data (Kertas / Ukuran / Status) ----
const distributionData = computed(() => {
  const counts: Record<string, number> = {}

  if (activeBreakdown.value === 'kertas') {
    props.orders.forEach(o => {
      const label = cleanPaperLabel(o.kertas)
      counts[label] = (counts[label] || 0) + (o.jml_pcs || 1)
    })
  } else if (activeBreakdown.value === 'ukuran') {
    props.orders.forEach(o => {
      const label = o.ukuran || 'A5'
      counts[label] = (counts[label] || 0) + (o.jml_pcs || 1)
    })
  } else {
    props.orders.forEach(o => {
      const label = o.status_order || 'PROSES'
      counts[label] = (counts[label] || 0) + 1
    })
  }

  const labels = Object.keys(counts)
  const data = Object.values(counts)

  return { labels, data }
})

// ---- Formatters & Helpers ----
function cleanPaperLabel(k: string | undefined): string {
  if (!k) return 'Lainnya'
  return k
    .replace('BOOKPAPER_', 'BP ')
    .replace('ART_PAPER_', 'AP ')
    .replace('ART_CARTON_', 'AC ')
    .replace(/_/g, ' ')
}

function formatRibuan(val: number): string {
  return new Intl.NumberFormat('id-ID').format(val || 0)
}

function formatMonthShort(monthIdx: number): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  return months[monthIdx] || ''
}

// ---- Chart Renderers ----
function renderProductionChart() {
  if (!productionChartCanvas.value) return

  if (productionChartInstance) {
    productionChartInstance.destroy()
    productionChartInstance = null
  }

  const labels = last7DaysData.value.map(d => d.label)
  const pcsData = last7DaysData.value.map(d => d.pcs)
  const ordersData = last7DaysData.value.map(d => d.ordersCount)

  productionChartInstance = new Chart(productionChartCanvas.value, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Total Pcs Dicetak',
          data: pcsData,
          backgroundColor: 'rgba(225, 29, 72, 0.85)',
          hoverBackgroundColor: 'rgba(190, 18, 60, 1)',
          borderRadius: 6,
          order: 2,
          yAxisID: 'y',
        },
        {
          label: 'Jumlah Order',
          data: ordersData,
          type: 'line',
          borderColor: 'rgba(15, 23, 42, 0.9)',
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          order: 1,
          yAxisID: 'y1',
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
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            boxWidth: 10,
            boxHeight: 10,
            font: { size: 11, weight: 'bold' },
            color: '#475569',
          },
        },
        tooltip: {
          backgroundColor: '#0f172a',
          titleFont: { size: 12, weight: 'bold' },
          bodyFont: { size: 11 },
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => {
              if (ctx.datasetIndex === 0) {
                return ` ${ctx.dataset.label}: ${formatRibuan(ctx.raw as number)} pcs`
              }
              return ` ${ctx.dataset.label}: ${ctx.raw} pesanan`
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 10 }, color: '#64748b' },
        },
        y: {
          type: 'linear',
          position: 'left',
          beginAtZero: true,
          grid: { color: '#f1f5f9' },
          ticks: {
            font: { size: 10 },
            color: '#64748b',
            callback: (val) => formatRibuan(val as number),
          },
        },
        y1: {
          type: 'linear',
          position: 'right',
          beginAtZero: true,
          grid: { display: false },
          ticks: {
            font: { size: 10 },
            color: '#64748b',
            stepSize: 1,
          },
        },
      },
    },
  })
}

function renderDistributionChart() {
  if (!distributionChartCanvas.value) return

  if (distributionChartInstance) {
    distributionChartInstance.destroy()
    distributionChartInstance = null
  }

  const { labels, data } = distributionData.value

  const colors = [
    '#e11d48', // Red
    '#f59e0b', // Amber
    '#0ea5e9', // Sky
    '#10b981', // Emerald
    '#8b5cf6', // Violet
    '#64748b', // Slate
    '#ec4899', // Pink
    '#14b8a6', // Teal
  ]

  distributionChartInstance = new Chart(distributionChartCanvas.value, {
    type: 'doughnut',
    data: {
      labels: labels.length > 0 ? labels : ['Belum ada data'],
      datasets: [
        {
          data: data.length > 0 ? data : [1],
          backgroundColor: data.length > 0 ? colors.slice(0, labels.length) : ['#e2e8f0'],
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
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 10,
            boxHeight: 10,
            font: { size: 10, weight: 'bold' },
            color: '#475569',
            padding: 8,
          },
        },
        tooltip: {
          backgroundColor: '#0f172a',
          padding: 8,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => {
              const label = ctx.label || ''
              const val = ctx.raw as number
              const unit = activeBreakdown.value === 'status' ? 'order' : 'pcs'
              return ` ${label}: ${formatRibuan(val)} ${unit}`
            },
          },
        },
      },
    },
  })
}

function updateCharts() {
  nextTick(() => {
    renderProductionChart()
    renderDistributionChart()
  })
}

watch(() => props.orders, () => {
  updateCharts()
}, { deep: true })

watch(activeBreakdown, () => {
  nextTick(() => {
    renderDistributionChart()
  })
})

onMounted(() => {
  updateCharts()
})
</script>
