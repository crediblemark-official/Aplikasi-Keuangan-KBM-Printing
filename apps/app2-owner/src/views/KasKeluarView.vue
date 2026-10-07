<template>
  <div class="w-full min-h-full bg-white fade-in">

    <!-- Header Section (Exact h-14) -->
    <PageHeader title="Kas Keluar">
      <template #actions>
        <button
          @click="loadData(true)"
          :disabled="isLoading || isRefreshing"
          class="btn-secondary h-8 text-xs font-semibold inline-flex items-center gap-1.5 px-2.5 rounded-md cursor-pointer shrink-0 disabled:opacity-50"
          title="Segarkan Data Kas Keluar"
        >
          <svg class="w-3.5 h-3.5" :class="{ 'animate-spin': isLoading || isRefreshing }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span class="hidden sm:inline">{{ isRefreshing ? 'Menyinkronkan...' : 'Refresh' }}</span>
        </button>
        <BaseButton @click="showModal = true" size="sm">
          <template #icon>
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </template>
          Input Kas Keluar
        </BaseButton>
      </template>
    </PageHeader>

    <!-- Summary Metrics Strip -->
    <MetricStrip :items="summaryMetrics" />

    <!-- Filter Bar: Capsule Pill Buttons (Sticky) -->
    <div class="sticky top-0 z-30 px-[8px] sm:px-[15px] lg:px-[20px] py-2.5 border-b border-slate-200 bg-white flex items-center gap-2 overflow-x-auto scrollbar-none shadow-xs">
      <!-- Kategori Pills -->
      <button
        @click="filterKategori = ''"
        type="button"
        class="filter-pill"
        :class="{ 'active-dark': filterKategori === '' }"
      >
        Semua
      </button>
      <button
        v-for="k in kategoriOptions"
        :key="k.value"
        @click="filterKategori = (filterKategori === k.value ? '' : k.value)"
        type="button"
        class="filter-pill"
        :class="{ active: filterKategori === k.value }"
      >
        {{ k.shortLabel || k.label }}
      </button>

      <span class="h-4 w-px bg-slate-200 mx-1 flex-shrink-0"></span>

      <!-- Sumber Kas Pills -->
      <button
        v-for="s in sumberOptions"
        :key="s.value"
        @click="filterSumber = (filterSumber === s.value ? '' : s.value)"
        type="button"
        class="filter-pill"
        :class="{ 'active-emerald': filterSumber === s.value }"
      >
        {{ s.label }}
      </button>
    </div>

    <!-- Table with Top Horizontal Scrollbar -->
    <TableScrollWrapper>
      <table class="data-table w-full min-w-[780px]">
        <thead>
          <tr class="whitespace-nowrap">
            <th>Tanggal</th>
            <th>Kategori</th>
            <th>Rincian</th>
            <th>Sumber Kas</th>
            <th class="text-right">Nominal</th>
            <th>Diinput</th>
            <th>Nota</th>
          </tr>
        </thead>
        <tbody>
          <TableStateRow
            :colspan="7"
            :loading="isLoading"
            :is-empty="filteredData.length === 0"
            empty-text="Belum ada data pengeluaran kas"
          />
          <tr v-for="item in filteredData" :key="item.id_kas_keluar">
            <td class="font-mono text-xs font-semibold text-slate-600">{{ formatTanggal(item.tanggal) }}</td>
            <td>
              <span class="chip font-medium">{{ formatKategori(item.kategori) }}</span>
            </td>
            <td class="max-w-xs">
              <p class="truncate text-slate-900 font-medium" :title="item.rincian">{{ item.rincian }}</p>
            </td>
            <td class="text-slate-700 font-medium">{{ formatMetode(item.sumber_kas) }}</td>
            <td class="text-right text-rose-600 font-bold">
              - {{ formatRupiah(item.nominal) }}
            </td>
            <td class="text-slate-500 text-xs">{{ item.diinput_oleh }}</td>
            <td>
              <a v-if="item.file_id_nota || item.link_nota"
                 :href="item.link_nota || (item.file_id_nota && item.file_id_nota.startsWith('http') ? item.file_id_nota : `https://drive.google.com/file/d/${item.file_id_nota}/view`)"
                 target="_blank" rel="noopener"
                 class="text-blue-600 hover:text-blue-800 text-xs font-semibold underline inline-flex items-center gap-1">
                <span>Lihat Nota</span>
              </a>
              <span v-else class="text-slate-400 text-[11px] italic">Tanpa nota</span>
            </td>
          </tr>
        </tbody>
      </table>
    </TableScrollWrapper>

    <!-- Bottom Sheet Input Kas Keluar (Modular Component) -->
    <KasKeluarModal
      v-model="showModal"
      :kategori-options="kategoriOptions"
      @success="onKasKeluarSuccess"
      @error="onKasKeluarError"
    />

    <!-- Toast Notification (Shared Component) -->
    <ToastNotification
      :message="toastMessage"
      :type="toastType"
      @close="clearToast"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageHeader from '@shared/components/PageHeader.vue'
import BaseButton from '@shared/components/BaseButton.vue'
import MetricStrip from '@shared/components/MetricStrip.vue'
import TableStateRow from '@shared/components/TableStateRow.vue'
import TableScrollWrapper from '@shared/components/TableScrollWrapper.vue'
import ToastNotification from '@shared/components/ToastNotification.vue'
import KasKeluarModal from '../components/KasKeluarModal.vue'
import { useFinanceStore } from '../stores/finance'
import { storeToRefs } from 'pinia'
import { useToast } from '@shared/utils/useToast'
import { KATEGORI_KAS_KELUAR_OPTIONS, SUMBER_KAS_OPTIONS } from '@shared/constants'
import { formatRupiah, formatTanggal, formatMetode, formatKategori, getTodayISO, getCurrentPeriode } from '@shared/utils/formatters'
import type { KasKeluar } from '@shared/types'

const financeStore = useFinanceStore()
const { kasKeluarList: data, isLoading, isRefreshing } = storeToRefs(financeStore)
const showModal = ref(false)
const filterKategori = ref('')
const filterSumber = ref('')

const { toastMessage, toastType, showToast, clearToast } = useToast()

function onKasKeluarSuccess(msg: string) {
  loadData(true)
  showToast(msg, 'success')
}

function onKasKeluarError(msg: string) {
  showToast(msg, 'error')
}

const kategoriOptions = KATEGORI_KAS_KELUAR_OPTIONS
const sumberOptions = SUMBER_KAS_OPTIONS

const filteredData = computed(() => {
  return data.value.filter((d) => {
    if (filterKategori.value && d.kategori !== filterKategori.value) return false
    if (filterSumber.value && d.sumber_kas !== filterSumber.value) return false
    return true
  })
})

// 4 Stats Computeds (Overall metrics)
const totalSemuaKeluar = computed(() => data.value.reduce((s, d) => s + (Number(d.nominal) || 0), 0))

const totalBulanIni = computed(() => {
  const curMonth = getCurrentPeriode()
  return data.value
    .filter((d) => d.tanggal && String(d.tanggal).startsWith(curMonth))
    .reduce((s, d) => s + (Number(d.nominal) || 0), 0)
})

const totalHariIni = computed(() => {
  const today = getTodayISO()
  return data.value
    .filter((d) => d.tanggal && String(d.tanggal).startsWith(today))
    .reduce((s, d) => s + (Number(d.nominal) || 0), 0)
})

const totalKasirTunai = computed(() => {
  return data.value
    .filter((d) => d.sumber_kas === 'KASIR_TUNAI')
    .reduce((s, d) => s + (Number(d.nominal) || 0), 0)
})

const summaryMetrics = computed(() => [
  { label: 'Total Keluar', value: formatRupiah(totalSemuaKeluar.value), valueClass: 'text-rose-600' },
  { label: 'Bulan Ini', value: formatRupiah(totalBulanIni.value) },
  { label: 'Hari Ini', value: formatRupiah(totalHariIni.value) },
  { label: 'Kasir Tunai', value: formatRupiah(totalKasirTunai.value), valueClass: 'text-amber-600' },
])

async function loadData(force = false) {
  await financeStore.loadFinanceData({ force })
}

onMounted(() => {
  loadData(false)
})
</script>
