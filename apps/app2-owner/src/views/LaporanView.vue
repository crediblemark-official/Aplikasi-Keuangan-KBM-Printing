<template>
  <div class="w-full min-h-full bg-white fade-in">
    <!-- Header Section (Exact h-14) -->
    <PageHeader title="Laporan & Analitik Keuangan">
      <template #actions>
        <BaseButton
          @click="refreshData"
          :loading="isRefreshing"
          variant="secondary"
          size="sm"
          title="Segarkan data dari server"
        >
          <template #icon>
            <svg class="w-3.5 h-3.5" :class="{ 'animate-spin': isRefreshing }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </template>
          Segarkan
        </BaseButton>
        <BaseButton @click="exportExcelSummary" :loading="isExporting" variant="secondary" size="sm">
          <template #icon>
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </template>
          Export (.xlsx)
        </BaseButton>
        <BaseButton
          @click="isPdfModalOpen = true"
          variant="primary"
          size="sm"
          class="shadow-xs font-bold"
          title="Cetak & Ekspor Laporan Lengkap Resmi (PDF A4 Dokumen Kantor)"
        >
          <template #icon>
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </template>
          Export PDF Resmi
        </BaseButton>
      </template>
    </PageHeader>

    <!-- Control Bar: Date Filter (Sticky) -->
    <div class="sticky top-0 z-30 px-[8px] sm:px-[15px] lg:px-[20px] py-2.5 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs">
      <DateFilterBar v-model="dateFilter" initial-mode="MONTH" />
      <span class="text-xs text-slate-500 font-semibold font-mono shrink-0 text-center w-full sm:w-auto">
        Periode Analisis: <strong class="text-slate-800">{{ dateFilter.label || selectedPeriode }}</strong>
      </span>
    </div>

    <!-- Top Metric Strip -->
    <MetricStrip :items="kpiMetrics" />

    <!-- Section 1: Tren Arus Kas Bulanan (Bar & Line Chart) -->
    <LaporanTrendSection ref="trendSectionRef" />

    <!-- Section 2: 2 Column Visualizations (Komposisi Beban & Distribusi Metode) -->
    <LaporanDonutBreakdown
      ref="donutBreakdownRef"
      :total-keluar="totalKeluar"
      :total-masuk="totalMasuk"
      :kategori-breakdown="kategoriBreakdown"
      :sumber-breakdown="sumberBreakdown"
    />

    <!-- Section 3: Jenis Pembayaran & Highlight Financial Insight Cards -->
    <LaporanInsightCards
      :jenis-breakdown="jenisBreakdown"
      :top-category="topCategory"
      :laba-bersih="labaBersih"
      :profit-margin="profitMargin"
    />

    <!-- Loading Overlay -->
    <div v-if="isLoading" class="flex justify-center py-10">
      <div class="flex items-center gap-2 text-red-600 text-sm font-semibold">
        <div class="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        Memuat dan merender laporan visual...
      </div>
    </div>

    <!-- Official PDF Report Modal & Printable A4 Template -->
    <LaporanOfficialPdfModal
      v-model="isPdfModalOpen"
      :period-label="dateFilter.label || selectedPeriode"
      :total-masuk="totalMasuk"
      :total-keluar="totalKeluar"
      :laba-bersih="labaBersih"
      :profit-margin="profitMargin"
      :expense-ratio="expenseRatio"
      :kategori-breakdown="kategoriBreakdown"
      :sumber-breakdown="sumberBreakdown"
      :jenis-breakdown="jenisBreakdown"
      :kas-masuk-list="filteredKasMasukByPeriode"
      :kas-keluar-list="filteredKasKeluarByPeriode"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { storeToRefs } from 'pinia'
import PageHeader from '@shared/components/PageHeader.vue'
import BaseButton from '@shared/components/BaseButton.vue'
import MetricStrip from '@shared/components/MetricStrip.vue'
import DateFilterBar from '@shared/components/DateFilterBar.vue'
import LaporanTrendSection from '../components/laporan/LaporanTrendSection.vue'
import LaporanDonutBreakdown from '../components/laporan/LaporanDonutBreakdown.vue'
import LaporanInsightCards from '../components/laporan/LaporanInsightCards.vue'
import LaporanOfficialPdfModal from '../components/laporan/LaporanOfficialPdfModal.vue'
import { useLaporanAnalytics } from '../composables/useLaporanAnalytics'
import { useFinanceStore } from '../stores/finance'
import { formatRupiah, getCurrentPeriode, isDateInFilterRange } from '@shared/utils/formatters'
import type { DateFilterValue } from '@shared/types'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const financeStore = useFinanceStore()
const { kasMasukList, kasKeluarList, isLoading: storeLoading, isRefreshing } = storeToRefs(financeStore)

const isLoading = computed(() => storeLoading.value && kasMasukList.value.length === 0 && kasKeluarList.value.length === 0)
const isExporting = ref(false)
const isPdfModalOpen = ref(false)
const selectedPeriode = ref(getCurrentPeriode())
const dateFilter = ref<DateFilterValue>({ mode: 'MONTH' })

const trendSectionRef = ref<InstanceType<typeof LaporanTrendSection>>()
const donutBreakdownRef = ref<InstanceType<typeof LaporanDonutBreakdown>>()

let trendChartInstance: Chart | null = null
let kategoriDonutInstance: Chart | null = null
let sumberDonutInstance: Chart | null = null

const {
  filteredKasMasukByPeriode,
  filteredKasKeluarByPeriode,
  totalMasuk,
  totalKeluar,
  labaBersih,
  profitMargin,
  expenseRatio,
  kpiMetrics,
  kategoriBreakdown,
  topCategory,
  sumberBreakdown,
  jenisBreakdown,
} = useLaporanAnalytics(kasMasukList, kasKeluarList, dateFilter, selectedPeriode)

function formatMonthLabel(ym: string) {
  if (!ym) return ''
  const parts = ym.split('-')
  if (parts.length < 2) return ym
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const mIndex = parseInt(parts[1], 10) - 1
  return monthNames[mIndex] || ym
}

function renderTrendChart() {
  const canvas = trendSectionRef.value?.canvasRef
  if (!canvas) return
  if (trendChartInstance) trendChartInstance.destroy()

  const masukMap = new Map<string, number>()
  const keluarMap = new Map<string, number>()

  kasMasukList.value
    .filter((k) => k.status_verifikasi === 'VERIFIED' && isDateInFilterRange(k.tanggal, dateFilter.value))
    .forEach((k) => {
      const ym = String(k.tanggal || '').slice(0, 7)
      if (!ym) return
      masukMap.set(ym, (masukMap.get(ym) || 0) + (Number(k.nominal) || 0))
    })
  kasKeluarList.value
    .filter((k) => isDateInFilterRange(k.tanggal, dateFilter.value))
    .forEach((k) => {
      const ym = String(k.tanggal || '').slice(0, 7)
      if (!ym) return
      keluarMap.set(ym, (keluarMap.get(ym) || 0) + (Number(k.nominal) || 0))
    })

  const months = Array.from(new Set([...masukMap.keys(), ...keluarMap.keys()])).sort().slice(-6)
  const labels = months.map(formatMonthLabel)
  const masukData = months.map((m) => masukMap.get(m) || 0)
  const keluarData = months.map((m) => keluarMap.get(m) || 0)
  const labaData = months.map((m, i) => masukData[i] - keluarData[i])

  const maxVal = Math.max(...masukData, ...keluarData, 0)
  const suggestedMax = maxVal === 0 ? 5_000_000 : maxVal * 1.2

  trendChartInstance = new Chart(canvas, {
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
  const canvas = donutBreakdownRef.value?.kategoriCanvasRef
  if (!canvas || totalKeluar.value <= 0) return
  if (kategoriDonutInstance) kategoriDonutInstance.destroy()

  const activeCategories = kategoriBreakdown.value.filter((k) => k.nominal > 0)
  if (activeCategories.length === 0) return

  kategoriDonutInstance = new Chart(canvas, {
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
  const canvas = donutBreakdownRef.value?.sumberCanvasRef
  if (!canvas || totalMasuk.value <= 0) return
  if (sumberDonutInstance) sumberDonutInstance.destroy()

  const activeSources = sumberBreakdown.value.filter((s) => s.nominal > 0)
  if (activeSources.length === 0) return

  sumberDonutInstance = new Chart(canvas, {
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
  await nextTick()
  renderAllCharts()

  try {
    await financeStore.loadFinanceData()
  } catch (err) {
    console.error('Failed to load chart report data:', err)
  } finally {
    await nextTick()
    renderAllCharts()
  }
}

async function refreshData() {
  try {
    await financeStore.loadFinanceData({ force: true })
  } finally {
    await nextTick()
    renderAllCharts()
  }
}

watch(
  [() => kasMasukList.value.length, () => kasKeluarList.value.length],
  async () => {
    await nextTick()
    renderAllCharts()
  }
)

watch(
  dateFilter,
  async () => {
    await nextTick()
    renderAllCharts()
  },
  { deep: true }
)

async function exportExcelSummary() {
  isExporting.value = true
  try {
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()

    const periodLabel = (dateFilter.value.label || selectedPeriode.value).replace(/[^a-zA-Z0-9_-]/g, '_')

    const kpiData = [
      { Indikator: 'Periode Analisis', Nilai: dateFilter.value.label || selectedPeriode.value },
      { Indikator: 'Total Kas Masuk (Verified)', Nilai: totalMasuk.value },
      { Indikator: 'Total Kas Keluar', Nilai: totalKeluar.value },
      { Indikator: 'Estimasi Laba Bersih', Nilai: labaBersih.value },
      { Indikator: 'Net Profit Margin (%)', Nilai: `${profitMargin.value}%` },
      { Indikator: 'Expense Ratio (%)', Nilai: `${expenseRatio.value}%` },
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(kpiData), 'Ringkasan KPI')

    const katData = kategoriBreakdown.value.map((k) => ({
      Kategori: k.label,
      Nominal: k.nominal,
      Persentase: `${k.percentage}%`,
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(katData), 'Komposisi Beban')

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

onUnmounted(() => {
  if (trendChartInstance) {
    trendChartInstance.destroy()
    trendChartInstance = null
  }
  if (kategoriDonutInstance) {
    kategoriDonutInstance.destroy()
    kategoriDonutInstance = null
  }
  if (sumberDonutInstance) {
    sumberDonutInstance.destroy()
    sumberDonutInstance = null
  }
})
</script>
