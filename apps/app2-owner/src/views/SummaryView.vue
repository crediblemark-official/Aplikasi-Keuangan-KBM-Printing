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
            class="pl-8 pr-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:border-slate-300 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 cursor-pointer shadow-2xs transition-colors"
          />
        </div>

        <button
          type="button"
          @click="refreshData"
          :disabled="isRefreshing"
          class="h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-2xs shrink-0 cursor-pointer disabled:opacity-50"
          title="Segarkan Data dari Server"
        >
          <svg class="w-3.5 h-3.5" :class="{ 'animate-spin': isRefreshing }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span class="hidden sm:inline">{{ isRefreshing ? 'Menyinkronkan...' : 'Refresh' }}</span>
        </button>

        <BaseButton @click="router.push('/dashboard/buku-kas?action=input-kas-masuk')" size="sm">
          <template #icon>
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </template>
          Kas Masuk
        </BaseButton>
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
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '@shared/components/PageHeader.vue'
import BaseButton from '@shared/components/BaseButton.vue'
import KbmLogo from '@shared/components/KbmLogo.vue'
import MetricStrip from '@shared/components/MetricStrip.vue'
import type { MetricItem } from '@shared/components/MetricStrip.vue'
import { useFinanceStore } from '../stores/finance'
import { storeToRefs } from 'pinia'
import { formatRupiah, getCurrentPeriode } from '@shared/utils/formatters'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const router = useRouter()
const financeStore = useFinanceStore()
const { ordersList, kasMasukList, kasKeluarList, isLoading: storeLoading, isRefreshing } = storeToRefs(financeStore)

const selectedPeriode = ref(getCurrentPeriode())
const isLoading = computed(() => storeLoading.value && kasMasukList.value.length === 0 && ordersList.value.length === 0)

const chartCanvas = ref<HTMLCanvasElement>()
const donutCanvas = ref<HTMLCanvasElement>()
let chartInstance: Chart | null = null
let donutInstance: Chart | null = null

// Kas masuk terverifikasi bulan ini
const kasMasukBulanIni = computed(() => {
  return kasMasukList.value
    .filter((k) => k.tanggal?.startsWith(selectedPeriode.value) && k.status_verifikasi === 'VERIFIED')
    .reduce((s, k) => s + (Number(k.nominal) || 0), 0)
})

// Kas keluar bulan ini
const kasKeluarBulanIni = computed(() => {
  return kasKeluarList.value
    .filter((k) => k.tanggal?.startsWith(selectedPeriode.value))
    .reduce((s, k) => s + (Number(k.nominal) || 0), 0)
})

// Estimasi laba
const estimasiLaba = computed(() => kasMasukBulanIni.value - kasKeluarBulanIni.value)

// Total piutang (Order dengan status PROSES yang belum lunas)
const totalPiutang = computed(() => {
  const verifiedMap = new Map<string, number>()
  kasMasukList.value
    .filter((k) => k.status_verifikasi === 'VERIFIED')
    .forEach((k) => {
      if (!k.id_order) return
      verifiedMap.set(k.id_order, (verifiedMap.get(k.id_order) || 0) + (Number(k.nominal) || 0))
    })

  return ordersList.value
    .filter((o) => o.status_order === 'PROSES')
    .reduce((s, o) => {
      const paid = verifiedMap.get(o.id_order) || 0
      return s + Math.max(0, (Number(o.total_harga) || 0) - paid)
    }, 0)
})

const summaryMetrics = computed<MetricItem[]>(() => [
  {
    label: 'Kas Masuk (Verified)',
    value: formatRupiah(kasMasukBulanIni.value),
    sub: 'Bulan ini',
    subClass: 'text-emerald-600',
    subDot: 'bg-emerald-500',
    minWidth: 'min-w-[150px]',
  },
  {
    label: 'Kas Keluar',
    value: formatRupiah(kasKeluarBulanIni.value),
    sub: 'Bulan ini',
    subClass: 'text-rose-600',
    subDot: 'bg-rose-500',
    minWidth: 'min-w-[150px]',
  },
  {
    label: 'Est. Laba Bersih',
    value: formatRupiah(Math.abs(estimasiLaba.value)),
    valueClass: estimasiLaba.value >= 0 ? 'text-emerald-600' : 'text-rose-600',
    sub: estimasiLaba.value >= 0 ? '+ Surplus' : '- Defisit',
    subClass: estimasiLaba.value >= 0 ? 'text-emerald-600' : 'text-rose-600',
    subDot: estimasiLaba.value >= 0 ? 'bg-emerald-500' : 'bg-rose-500',
    minWidth: 'min-w-[150px]',
  },
  {
    label: 'Total Piutang',
    value: formatRupiah(totalPiutang.value),
    valueClass: 'text-amber-600',
    sub: 'Belum tertagih',
    subClass: 'text-amber-700',
    subDot: 'bg-amber-500',
    minWidth: 'min-w-[150px]',
  },
])

const saldoPerSumber = computed(() => {
  let tunai = 0
  let bank = 0
  let qris = 0

  kasMasukList.value
    .filter((k) => k.status_verifikasi === 'VERIFIED')
    .forEach((k) => {
      const m = (k.metode || '').toUpperCase()
      const nom = Number(k.nominal) || 0
      if (m.includes('TUNAI')) tunai += nom
      else if (m.includes('QRIS')) qris += nom
      else bank += nom
    })

  return { tunai, bank, qris }
})

const kasPerSumber = computed(() => [
  { label: 'Tunai', dotColor: 'bg-emerald-500', nilai: saldoPerSumber.value.tunai },
  { label: 'Bank', dotColor: 'bg-blue-500', nilai: saldoPerSumber.value.bank },
  { label: 'QRIS', dotColor: 'bg-purple-500', nilai: saldoPerSumber.value.qris },
])

const chartData = computed(() => {
  const parts = selectedPeriode.value.split('-')
  const baseYear = parseInt(parts[0], 10) || new Date().getFullYear()
  const baseMonth = (parseInt(parts[1], 10) || (new Date().getMonth() + 1)) - 1

  const months: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(baseYear, baseMonth - i, 1)
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    months.push(ym)
  }

  const kmMap = new Map<string, number>()
  const kkMap = new Map<string, number>()

  kasMasukList.value
    .filter((k) => k.status_verifikasi === 'VERIFIED')
    .forEach((k) => {
      const ym = String(k.tanggal || '').substring(0, 7)
      kmMap.set(ym, (kmMap.get(ym) || 0) + (Number(k.nominal) || 0))
    })

  kasKeluarList.value.forEach((k) => {
    const ym = String(k.tanggal || '').substring(0, 7)
    kkMap.set(ym, (kkMap.get(ym) || 0) + (Number(k.nominal) || 0))
  })

  return months.map((m) => ({
    bulan: m,
    kas_masuk: kmMap.get(m) || 0,
    kas_keluar: kkMap.get(m) || 0,
  }))
})

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
    const masukData = chartData.value.map((d) => d.kas_masuk)
    const keluarData = chartData.value.map((d) => d.kas_keluar)
    const maxVal = Math.max(...masukData, ...keluarData, 0)
    const suggestedMax = maxVal === 0 ? 5_000_000 : maxVal * 1.15

    chartInstance = new Chart(chartCanvas.value, {
      type: 'bar',
      data: {
        labels: chartData.value.map((d) => formatMonthLabel(d.bulan)),
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
        labels: ['Tunai', 'Bank', 'QRIS'],
        datasets: [{
          data: [
            saldoPerSumber.value.tunai,
            saldoPerSumber.value.bank,
            saldoPerSumber.value.qris,
          ],
          backgroundColor: ['#10b981', '#2563eb', '#f59e0b'],
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: { legend: { display: false } },
      },
    })
  }
}

async function loadData() {
  await nextTick()
  renderCharts()

  try {
    await financeStore.loadFinanceData()
  } catch (err) {
    console.error('Failed to load finance data:', err)
  } finally {
    await nextTick()
    renderCharts()
  }
}

async function refreshData() {
  try {
    await financeStore.loadFinanceData({ force: true })
  } finally {
    await nextTick()
    renderCharts()
  }
}

watch(
  [selectedPeriode, () => kasMasukList.value.length, () => kasKeluarList.value.length, () => ordersList.value.length],
  async () => {
    await nextTick()
    renderCharts()
  }
)

onMounted(loadData)

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
  if (donutInstance) {
    donutInstance.destroy()
    donutInstance = null
  }
})
</script>
