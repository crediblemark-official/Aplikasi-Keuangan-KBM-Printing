<template>
  <div class="w-full min-h-full bg-white fade-in">
    <!-- Header Section (Exact h-14) -->
    <PageHeader>
      <template #title>
        <div class="min-w-0">
          <h1 class="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-none truncate">
            <span class="hidden md:inline">Transaksi &amp; Piutang Order</span>
            <span class="md:hidden">Transaksi Order</span>
          </h1>
        </div>
      </template>
      <template #actions>
        <!-- Search Input -->
        <div class="w-40 sm:w-64">
          <SearchInput v-model="searchQuery" placeholder="Cari order / penerbit / judul..." />
        </div>

        <!-- Refresh Button -->
        <button
          @click="loadData(true)"
          :disabled="isLoading || isRefreshing"
          class="btn-secondary h-8 text-xs font-semibold inline-flex items-center gap-1.5 px-2.5 rounded-md cursor-pointer shrink-0 disabled:opacity-50"
        >
          <svg class="w-3.5 h-3.5" :class="{ 'animate-spin': isLoading || isRefreshing }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span class="hidden sm:inline">{{ isRefreshing ? 'Menyinkronkan...' : 'Refresh' }}</span>
        </button>

        <!-- Catat Pembayaran Order Button -->
        <BaseButton @click="openNewPaymentModal()" size="sm" class="whitespace-nowrap px-2.5 sm:px-3 shrink-0">
          <template #icon>
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </template>
          <span class="hidden sm:inline">Catat Bayar Order</span>
          <span class="sm:hidden">Bayar</span>
        </BaseButton>
      </template>
    </PageHeader>

    <!-- Summary Metrics Strip -->
    <MetricStrip :items="summaryMetrics" />

    <!-- Alert Rekonsiliasi Kas Tanpa Order -->
    <div
      v-if="totalUnlinkedNominal > 0"
      class="px-[8px] sm:px-[15px] lg:px-[20px] py-2 bg-amber-50 border-b border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
    >
      <div class="flex items-center gap-2 text-amber-900 font-medium">
        <span class="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
        <span>
          <strong>Rekonsiliasi Kas:</strong> Ditemukan <strong>{{ dateFilteredUnlinkedPayments.length }} transaksi kas masuk</strong> senilai <strong class="font-mono text-amber-800">{{ formatRupiah(totalUnlinkedNominal) }}</strong> yang tercatat di Buku Kas tetapi nomor ordernya tidak ada di daftar pesanan aktif.
        </span>
      </div>
      <button
        type="button"
        @click="statusFilter = statusFilter === 'UNLINKED' ? 'ALL' : 'UNLINKED'"
        class="text-amber-800 font-bold hover:underline shrink-0 text-left sm:text-right cursor-pointer"
      >
        {{ statusFilter === 'UNLINKED' ? 'Kembali ke Semua Order' : 'Lihat Data Kas Tanpa Order →' }}
      </button>
    </div>

    <!-- Control Bar: Date Filter, Status Filter & Ringkasan (Sticky) -->
    <div class="sticky top-0 z-30 px-[8px] sm:px-[15px] lg:px-[20px] py-2 border-b border-slate-200 bg-white flex flex-col xl:flex-row xl:items-center justify-between gap-2.5 shadow-xs">
      <!-- Date Filter Bar (Tanggal, Bulan, Tahun, Rentang) -->
      <div class="shrink-0 overflow-x-auto scrollbar-none">
        <DateFilterBar v-model="dateFilter" />
      </div>

      <!-- Status Filter Buttons & Count -->
      <div class="flex items-center gap-2.5 w-full xl:w-auto overflow-x-auto scrollbar-none py-0.5 justify-between xl:justify-end shrink-0">
        <div class="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto scrollbar-none flex-nowrap shrink-0">
          <button
            v-for="tab in filterOptions"
            :key="tab.value"
            @click="statusFilter = tab.value"
            class="px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
            :class="statusFilter === tab.value ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'"
          >
            <span>{{ tab.label }}</span>
            <span
              v-if="tab.count !== undefined"
              class="px-1.5 py-0.2 rounded-full text-[10px] font-bold shrink-0"
              :class="tab.badgeClass || (statusFilter === tab.value ? 'bg-red-50 text-red-600' : 'bg-slate-300 text-slate-700')"
            >
              {{ tab.count }}
            </span>
          </button>
        </div>

        <!-- Info Count -->
        <div class="text-xs text-slate-500 font-medium shrink-0 whitespace-nowrap pl-1">
          <span v-if="statusFilter === 'UNLINKED'">
            <strong class="text-slate-800">{{ filteredUnlinkedPayments.length }}</strong> transaksi tanpa order
          </span>
          <span v-else-if="hasMoreRows">
            Menampilkan <strong class="text-slate-800">{{ displayedPiutangRows.length }}</strong> dari <strong class="text-slate-800">{{ filteredPiutangRows.length }}</strong> order
          </span>
          <span v-else>
            <strong class="text-slate-800">{{ filteredPiutangRows.length }}</strong> order
          </span>
        </div>
      </div>
    </div>

    <!-- TABEL REKONSILIASI: KAS MASUK TANPA ORDER -->
    <TransaksiUnlinkedTable
      v-if="statusFilter === 'UNLINKED'"
      :items="filteredUnlinkedPayments"
      :total-nominal="totalUnlinkedNominal"
      :is-loading="isLoading"
    />

    <!-- TABEL GABUNGAN: ORDER, RINCIAN PEMBAYARAN MASUK, & PIUTANG -->
    <TransaksiOrderTable
      v-else
      :rows="displayedPiutangRows"
      :is-loading="isLoading"
      :verifying-id="verifyingId"
      @verify-tx="verifyTx"
      @edit-payment="openEditPaymentModal"
      @edit-order="openEditOrderModal"
      @bayar-order="openPaymentModalForOrder"
      @select-edit-payment="openSelectEditPayment"
    />

    <!-- Load More Section -->
    <div
      v-if="statusFilter !== 'UNLINKED' && hasMoreRows"
      class="px-4 py-3.5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs"
    >
      <div class="flex items-center gap-2 text-xs text-slate-600 font-medium">
        <span>Menampilkan <strong>{{ displayedPiutangRows.length }}</strong> dari total <strong>{{ filteredPiutangRows.length }}</strong> data order</span>
        <span class="text-slate-300">|</span>
        <span class="text-slate-500 font-mono">Tersisa {{ filteredPiutangRows.length - displayedPiutangRows.length }} order lagi</span>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <button
          type="button"
          @click="loadMore"
          class="h-8 px-4 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-2xs hover:border-slate-400 active:scale-97 transition-all inline-flex items-center gap-1.5 cursor-pointer"
        >
          <svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
          </svg>
          <span>Muat Lebih Banyak (+{{ nextBatchCount }})</span>
        </button>

        <button
          v-if="filteredPiutangRows.length - displayedPiutangRows.length > PAGE_SIZE"
          type="button"
          @click="showAll"
          class="h-8 px-3 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-all cursor-pointer"
        >
          Tampilkan Semua ({{ filteredPiutangRows.length }})
        </button>
      </div>
    </div>

    <!-- MODAL: CATAT PEMBAYARAN ORDER BARU -->
    <PaymentOrderModal
      v-model="showPaymentModal"
      :orders-list="ordersList"
      :kas-masuk-list="kasMasukList"
      :initial-data="selectedPaymentInitialData"
      @success="() => loadData(true)"
      @toast="showToast"
    />

    <!-- MODAL: EDIT & BATAL PEMBAYARAN ORDER -->
    <EditPaymentOrderModal
      v-model="showEditPaymentModal"
      :tx="selectedEditTx"
      :order="selectedEditOrder"
      :kas-masuk-list="kasMasukList"
      @success="() => loadData(true)"
      @toast="showToast"
    />

    <!-- MODAL: EDIT DATA ORDER -->
    <EditOrderModal
      v-model="showEditOrderModal"
      :order="selectedEditOrderData"
      :kas-masuk-list="kasMasukList"
      @success="() => loadData(true)"
      @toast="showToast"
    />

    <!-- MODAL: PILIH PEMBAYARAN UNTUK DIEDIT (Jika Ada > 1 Transaksi) -->
    <BaseModal
      v-model="showPaymentChooserModal"
      title="Pilih Transaksi Pembayaran yang Ingin Diedit"
    >
      <div class="space-y-3">
        <p class="text-xs text-slate-600">
          Order <strong>{{ selectedChooserRow?.order.id_order }}</strong> memiliki <strong>{{ selectedChooserRow?.payments.length }}</strong> transaksi pembayaran tercatat. Silakan pilih transaksi yang ingin Anda ubah:
        </p>
        <div class="space-y-2">
          <div
            v-for="tx in selectedChooserRow?.payments"
            :key="tx.id"
            @click="choosePaymentToEdit(tx)"
            class="p-3 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/60 cursor-pointer transition-all flex items-center justify-between group"
          >
            <div>
              <div class="flex items-center gap-2">
                <span
                  class="px-2 py-0.5 rounded text-[10px] font-bold"
                  :class="tx.jenis_pembayaran === 'DP' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'"
                >
                  {{ tx.jenis_pembayaran === 'DP' ? 'Uang Muka (DP)' : 'Pelunasan' }}
                </span>
                <span class="text-xs font-mono text-slate-500">{{ formatTanggal(tx.tanggal) }}</span>
              </div>
              <p class="text-xs text-slate-600 mt-1 font-medium">
                ID: {{ tx.id }} • {{ formatMetode(tx.metode) }}
              </p>
            </div>
            <div class="text-right">
              <span class="font-mono font-bold text-sm text-slate-900 block">{{ formatRupiah(tx.nominal) }}</span>
              <span class="text-[11px] text-amber-700 font-semibold group-hover:underline mt-0.5 inline-block">
                Edit Transaksi →
              </span>
            </div>
          </div>
        </div>
      </div>
    </BaseModal>

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
import BaseModal from '@shared/components/BaseModal.vue'
import SearchInput from '@shared/components/SearchInput.vue'
import DateFilterBar from '@shared/components/DateFilterBar.vue'
import ToastNotification from '@shared/components/ToastNotification.vue'
import PaymentOrderModal from '../components/PaymentOrderModal.vue'
import EditPaymentOrderModal from '../components/EditPaymentOrderModal.vue'
import EditOrderModal from '../components/EditOrderModal.vue'
import TransaksiUnlinkedTable from '../components/transaksi/TransaksiUnlinkedTable.vue'
import TransaksiOrderTable from '../components/transaksi/TransaksiOrderTable.vue'
import { useTransaksiFilter, type OrderTxRow, type EnrichedPiutangRow } from '../composables/useTransaksiFilter'
import { api } from '@shared/api/gasClient'
import { useAuthStore } from '../stores/auth'
import { useFinanceStore } from '../stores/finance'
import { useToast } from '@shared/utils/useToast'
import { formatRupiah, formatTanggal, formatMetode, getTodayISO } from '@shared/utils/formatters'
import type { Order, PiutangRow, DateFilterValue } from '@shared/types'

const route = useRoute()
const authStore = useAuthStore()
const financeStore = useFinanceStore()

const { kasMasukList, ordersList, isLoading, isRefreshing } = storeToRefs(financeStore)
const verifyingId = ref<string | null>(null)
const searchQuery = ref('')
const statusFilter = ref<'ALL' | 'PIUTANG' | 'LUNAS' | 'PENDING_VERIF' | 'UNLINKED'>('ALL')
const dateFilter = ref<DateFilterValue>({ mode: 'ALL' })

const { toastMessage, toastType, showToast, clearToast } = useToast()

// Composable for filtering, search, pagination & summaries
const {
  PAGE_SIZE,
  dateFilteredUnlinkedPayments,
  filteredUnlinkedPayments,
  totalUnlinkedNominal,
  filterOptions,
  filteredPiutangRows,
  displayedPiutangRows,
  hasMoreRows,
  nextBatchCount,
  loadMore,
  showAll,
  summaryMetrics,
} = useTransaksiFilter(ordersList, kasMasukList, searchQuery, statusFilter, dateFilter)

// Modal States
const showPaymentModal = ref(false)
const selectedPaymentInitialData = ref<any>(null)
const showEditPaymentModal = ref(false)
const selectedEditTx = ref<OrderTxRow | null>(null)
const selectedEditOrder = ref<Order | null>(null)
const showEditOrderModal = ref(false)
const selectedEditOrderData = ref<Order | null>(null)
const showPaymentChooserModal = ref(false)
const selectedChooserRow = ref<EnrichedPiutangRow | null>(null)

function openNewPaymentModal() {
  selectedPaymentInitialData.value = null
  showPaymentModal.value = true
}

function openPaymentModalForOrder(row: PiutangRow) {
  const isPelunasan = row.status_bayar === 'DP'
  selectedPaymentInitialData.value = {
    tanggal: getTodayISO(),
    jenis_pembayaran: isPelunasan ? 'PELUNASAN' : 'DP',
    id_order: row.order.id_order,
    nama_penerbit: row.order.nama_penerbit,
    nominal: row.sisa_tagihan > 0 ? row.sisa_tagihan : Math.round(row.order.total_harga * 0.5),
    metode: 'BANK',
    keterangan: `Pembayaran ${isPelunasan ? 'Pelunasan' : 'DP'} Order ${row.order.id_order}`,
  }
  showPaymentModal.value = true
}

function openEditPaymentModal(tx: OrderTxRow, order: Order) {
  selectedEditTx.value = tx
  selectedEditOrder.value = order
  showEditPaymentModal.value = true
}

function openEditOrderModal(order: Order) {
  selectedEditOrderData.value = order
  showEditOrderModal.value = true
}

function openSelectEditPayment(row: EnrichedPiutangRow) {
  if (row.payments.length === 1) {
    openEditPaymentModal(row.payments[0], row.order)
  } else if (row.payments.length > 1) {
    selectedChooserRow.value = row
    showPaymentChooserModal.value = true
  }
}

function choosePaymentToEdit(tx: OrderTxRow) {
  if (!selectedChooserRow.value) return
  showPaymentChooserModal.value = false
  openEditPaymentModal(tx, selectedChooserRow.value.order)
}

async function verifyTx(tx: OrderTxRow) {
  verifyingId.value = tx.id
  try {
    const res = await api.verifyKasMasuk(tx.id, authStore.nama ?? 'OWNER')
    if (res.success) {
      const item = kasMasukList.value.find((k) => k.id_kas_masuk === tx.id)
      if (item) item.status_verifikasi = 'VERIFIED'
      showToast(`Pembayaran ${formatRupiah(tx.nominal)} berhasil diverifikasi!`, 'success')
    } else {
      showToast(`Gagal verifikasi: ${res.error || 'Terjadi kesalahan pada server'}`, 'error')
    }
  } catch (e: any) {
    console.error('Gagal verifikasi:', e)
    showToast(e?.message || 'Terjadi kesalahan jaringan saat verifikasi', 'error')
  } finally {
    verifyingId.value = null
  }
}

async function loadData(force = false) {
  await financeStore.loadFinanceData({ force })
}

onMounted(() => {
  loadData(false)
  if (route.query.tab === 'verifikasi') {
    statusFilter.value = 'PENDING_VERIF'
  }
  if (route.query.action === 'new-payment') {
    openNewPaymentModal()
  }
})
</script>
