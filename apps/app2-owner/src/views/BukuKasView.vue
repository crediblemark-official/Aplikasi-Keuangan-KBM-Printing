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

    <!-- Control Bar: Date Filter (Sticky) -->
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

    <!-- Rekapitulasi per Sumber Kas -->
    <BukuKasRekapTable
      :items="sumberRekapData"
      :periode-label="dateFilter.label || selectedPeriode"
    />

    <!-- Mutasi Kas Detail -->
    <BukuKasMutasiTable
      :items="displayedMutasi"
      :filtered-count="filteredMutasi.length"
      :active-tab="activeTab"
      :mutasi-tabs="mutasiTabs"
      :search-query="searchQuery"
      :is-loading="isLoading"
      :has-more-mutasi="hasMoreMutasi"
      :next-mutasi-batch-count="nextMutasiBatchCount"
      :mutasi-page-size="MUTASI_PAGE_SIZE"
      @update:active-tab="activeTab = $event"
      @update:search-query="searchQuery = $event"
      @edit:row="openEditModal"
      @load-more="loadMoreMutasi"
      @show-all="showAllMutasi"
    />

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

    <!-- Toast Notification -->
    <ToastNotification
      :message="toastMessage"
      :type="toastType"
      @close="clearToast"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import PageHeader from '@shared/components/PageHeader.vue'
import BaseButton from '@shared/components/BaseButton.vue'
import MetricStrip from '@shared/components/MetricStrip.vue'
import DateFilterBar from '@shared/components/DateFilterBar.vue'
import ToastNotification from '@shared/components/ToastNotification.vue'
import KasMasukModal from '../components/KasMasukModal.vue'
import KasKeluarModal from '../components/KasKeluarModal.vue'
import EditKasModal from '../components/EditKasModal.vue'
import BukuKasRekapTable from '../components/bukukas/BukuKasRekapTable.vue'
import BukuKasMutasiTable from '../components/bukukas/BukuKasMutasiTable.vue'
import { useBukuKasData, type MutasiRow } from '../composables/useBukuKasData'
import { useFinanceStore } from '../stores/finance'
import { useToast } from '@shared/utils/useToast'
import { KATEGORI_KAS_KELUAR_OPTIONS } from '@shared/constants'
import { getCurrentPeriode } from '@shared/utils/formatters'
import type { DateFilterValue } from '@shared/types'

const route = useRoute()
const financeStore = useFinanceStore()

const { kasMasukList, kasKeluarList, clientsList, ordersList, isLoading, isRefreshing } = storeToRefs(financeStore)
const selectedPeriode = ref(getCurrentPeriode())
const dateFilter = ref<DateFilterValue>({ mode: 'MONTH' })
const activeTab = ref<'SEMUA' | 'MASUK' | 'KELUAR' | 'DEPOSIT'>('SEMUA')
const searchQuery = ref('')
const MUTASI_PAGE_SIZE = 25

const { toastMessage, toastType, showToast, clearToast } = useToast()

const mutasiTabs: Array<{ id: 'SEMUA' | 'MASUK' | 'KELUAR' | 'DEPOSIT'; label: string }> = [
  { id: 'SEMUA', label: 'Semua Mutasi' },
  { id: 'MASUK', label: 'Kas Masuk' },
  { id: 'KELUAR', label: 'Kas Keluar' },
  { id: 'DEPOSIT', label: 'Deposit Saldo' },
]

const kategoriOptions = KATEGORI_KAS_KELUAR_OPTIONS

const showKasMasukModal = ref(false)
const showKasKeluarModal = ref(false)
const showEditModal = ref(false)
const selectedMutasiRow = ref<MutasiRow | null>(null)

const {
  isExporting,
  penerbitOptions,
  summaryMetrics,
  sumberRekapData,
  filteredMutasi,
  displayedMutasi,
  hasMoreMutasi,
  nextMutasiBatchCount,
  loadMoreMutasi,
  showAllMutasi,
  exportExcel,
} = useBukuKasData(
  kasMasukList,
  kasKeluarList,
  clientsList,
  ordersList,
  dateFilter,
  activeTab,
  searchQuery,
  selectedPeriode
)

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
