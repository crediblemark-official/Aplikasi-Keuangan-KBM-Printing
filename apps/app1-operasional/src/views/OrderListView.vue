<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="w-full min-h-full bg-white pb-24 lg:pb-8">
        <!-- Header Section (Non-sticky, ikut scroll) -->
        <PageHeader title="Daftar Order" :show-back="true" back-label="Beranda" @back="router.push('/home')">
          <template #actions>
            <!-- Search Input (Header) -->
            <div class="w-36 sm:w-60 md:w-64">
              <SearchInput v-model="search" placeholder="Cari order / penerbit / SPK..." @input="debouncedSearch" />
            </div>

            <button
              type="button"
              @click="orderStore.refreshOrders()"
              :disabled="orderStore.isLoading || orderStore.isRefreshing"
              class="h-8 px-2 sm:px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-2xs shrink-0 cursor-pointer disabled:opacity-50"
              title="Segarkan Data Order"
            >
              <svg class="w-3.5 h-3.5" :class="{ 'animate-spin': orderStore.isLoading || orderStore.isRefreshing }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span class="hidden sm:inline">{{ orderStore.isRefreshing ? 'Menyinkronkan...' : 'Refresh' }}</span>
            </button>
            <BaseButton @click="router.push('/order/new')" size="sm" class="whitespace-nowrap px-2.5 sm:px-3 shrink-0">
              <template #icon>
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M12 4v16m8-8H4" />
                </svg>
              </template>
              <span class="hidden sm:inline">Order Baru</span>
              <span class="sm:hidden">Baru</span>
            </BaseButton>
          </template>
        </PageHeader>

        <!-- Control Bar: Date Filter, Status Filter & Ringkasan (Sticky) -->
        <div class="sticky top-0 z-30 px-[8px] sm:px-[15px] lg:px-[20px] py-2.5 border-b border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-2.5 shadow-xs">
          <!-- Date Filter Bar (Tanggal, Bulan, Tahun, Rentang) -->
          <DateFilterBar v-model="dateFilter" />

          <!-- Status Filter Buttons & Count -->
          <div class="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto scrollbar-none py-0.5 justify-between md:justify-end">
            <div class="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/60 overflow-x-auto scrollbar-none flex-nowrap shrink-0 max-w-full">
              <button
                v-for="tab in filterTabs"
                :key="tab.value"
                @click="activeFilter = tab.value"
                class="px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
                :class="activeFilter === tab.value ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'text-slate-600 hover:text-slate-900'"
              >
                <span>{{ tab.label }}</span>
                <span
                  v-if="tab.count !== undefined"
                  class="px-1.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 leading-none"
                  :class="tab.badgeClass"
                >
                  {{ tab.count }}
                </span>
              </button>
            </div>

            <!-- Info Count -->
            <div class="text-xs text-slate-500 font-medium shrink-0 whitespace-nowrap sm:pl-2 sm:border-l sm:border-slate-200 flex items-center">
              <span v-if="hasMoreRows">
                Menampilkan <strong class="text-slate-800 font-semibold">{{ displayedOrders.length }}</strong> dari <strong class="text-slate-800 font-semibold">{{ filteredOrders.length }}</strong> order
              </span>
              <span v-else>
                Total <strong class="text-slate-800 font-semibold">{{ filteredOrders.length }}</strong> order
              </span>
            </div>
          </div>
        </div>

        <!-- Order Data Table -->
        <TableScrollWrapper>
          <table class="data-table w-full min-w-[850px]">
            <thead>
              <tr class="whitespace-nowrap">
                <th>ID Order</th>
                <th>Tanggal</th>
                <th>Penerbit & Judul</th>
                <th>Spesifikasi</th>
                <th class="text-right">Total Harga</th>
                <th class="text-center">Status Cetak</th>
                <th class="text-center">Status Bayar</th>
                <th class="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <TableStateRow :colspan="8" :loading="orderStore.isLoading" :is-empty="filteredOrders.length === 0"
                empty-text="Tidak ada order ditemukan" loading-text="Memuat daftar order..." />
              <tr v-for="order in displayedOrders" :key="order.id_order" @click="router.push(`/order/${order.id_order}`)"
                class="hover:bg-slate-50/80 cursor-pointer transition-colors">
                <td class="font-mono text-xs font-semibold text-slate-700 whitespace-nowrap">
                  {{ order.id_order }}
                </td>
                <td class="text-xs text-slate-500 font-mono whitespace-nowrap">
                  {{ formatTanggal(order.tanggal) }}
                </td>
                <td class="max-w-[240px]">
                  <p class="font-bold text-xs text-slate-900 truncate">{{ order.nama_penerbit }}</p>
                  <p class="text-[11px] text-slate-500 truncate mt-0.5" :title="order.judul_penulis">{{
                    order.judul_penulis
                    }}</p>
                </td>
                <td class="whitespace-nowrap">
                  <div class="flex items-center gap-1 text-[11px] text-slate-600">
                    <span class="px-1.5 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">{{ order.jml_pcs }}
                      pcs</span>
                    <span class="px-1.5 py-0.5 rounded bg-slate-100">{{ order.ukuran }}</span>
                    <span v-if="order.kertas" class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{{
                      formatKertasOrder(order) }}</span>
                    <span v-if="order.packing_dus_tipe"
                      class="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold">{{ order.packing_dus_qty ||
                      1
                      }}x Dus</span>
                  </div>
                </td>
                <td class="text-right font-extrabold font-mono text-xs text-red-600 whitespace-nowrap">
                  {{ formatRupiah(order.total_harga) }}
                </td>
                <td class="text-center whitespace-nowrap" @click.stop>
                  <button type="button" @click="toggleOrderStatus(order)" :disabled="updatingOrderId === order.id_order || order.status_order === 'BATAL'"
                    class="group inline-flex items-center cursor-pointer transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
                    :title="order.status_order === 'PROSES' ? 'Klik untuk tandai SELESAI' : order.status_order === 'BATAL' ? 'Order dibatalkan — tidak dapat diubah status' : 'Klik untuk kembalikan ke PROSES'">
                    <StatusBadge :status="order.status_order" size="xs" :loading="updatingOrderId === order.id_order"
                      class="group-hover:ring-2 group-hover:ring-red-400/40" />
                  </button>
                </td>
                <td class="text-center whitespace-nowrap">
                  <StatusBadge :status="orderStore.getPaymentStatus(order.id_order, order.total_harga)"
                      :verification="getVerificationStatus(orderStore.kasMasukList.filter(k => k.id_order === order.id_order))" size="xs" />
                </td>
                <td class="text-center whitespace-nowrap" @click.stop>
                  <div class="inline-flex items-center gap-1.5">
                    <button type="button" @click="router.push(`/order/edit/${order.id_order}`)"
                      class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all cursor-pointer hover:shadow-xs"
                      title="Edit Spesifikasi & Data Order">
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button type="button" @click="router.push(`/order/${order.id_order}`)"
                      class="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer">
                      Detail →
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </TableScrollWrapper>

        <!-- Load More Section -->
        <div
          v-if="hasMoreRows"
          class="px-4 py-3.5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs"
        >
          <div class="flex items-center gap-2 text-xs text-slate-600 font-medium">
            <span>Menampilkan <strong>{{ displayedOrders.length }}</strong> dari total <strong>{{ filteredOrders.length }}</strong> data order</span>
            <span class="text-slate-300">|</span>
            <span class="text-slate-500 font-mono">Tersisa {{ filteredOrders.length - displayedOrders.length }} order lagi</span>
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
              v-if="filteredOrders.length - displayedOrders.length > PAGE_SIZE"
              type="button"
              @click="showAll"
              class="h-8 px-3 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-all cursor-pointer"
            >
              Tampilkan Semua ({{ filteredOrders.length }})
            </button>
          </div>
        </div>
      </div>
    </ion-content>

    <!-- Bottom Navigation Bar (Mobile only) -->
    <MobileBottomNav
      :left-items="mobileLeftItems"
      :center-item="mobileCenterItem"
      :right-items="mobileRightItems"
      :current-path="route.path"
      @navigate="navigate"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  IonPage, IonContent, useIonRouter, onIonViewWillEnter,
} from '@ionic/vue'
import PageHeader from '@shared/components/PageHeader.vue'
import SearchInput from '@shared/components/SearchInput.vue'
import { useOrderStore } from '../stores/orders'
import { useSyncStore } from '@shared/stores/syncStore'
import BaseButton from '@shared/components/BaseButton.vue'
import StatusBadge from '@shared/components/StatusBadge.vue'
import TableScrollWrapper from '@shared/components/TableScrollWrapper.vue'
import TableStateRow from '@shared/components/TableStateRow.vue'
import MobileBottomNav from '@shared/components/MobileBottomNav.vue'
import DateFilterBar from '@shared/components/DateFilterBar.vue'
import type { BottomNavItem } from '@shared/components/MobileBottomNav.vue'
import { formatRupiah, formatTanggal, formatKertasOrder, isDateInFilterRange, getVerificationStatus } from '@shared/utils/formatters'
import type { DateFilterValue } from '@shared/types'

const route = useRoute()
const orderStore = useOrderStore()
const syncStore = useSyncStore()
const router = useIonRouter()

const mobileLeftItems = computed<BottomNavItem[]>(() => [
  { id: 'home', path: '/home', label: 'Beranda' },
  { id: 'order-list', path: '/order/list', label: 'Pesanan', badge: orderStore.orders.length || undefined },
])

const mobileCenterItem: BottomNavItem = {
  id: 'new-order',
  path: '/order/new',
  label: 'Order Baru',
}

const mobileRightItems = computed<BottomNavItem[]>(() => [
  { id: 'klien', path: '/klien', label: 'Klien' },
  {
    id: 'sync-log',
    path: '/sync-log',
    label: 'Log Sync',
    badge: (syncStore.pendingCount + syncStore.failedCount) > 0 ? (syncStore.pendingCount + syncStore.failedCount) : undefined,
  },
])

function navigate(path: string) {
  router.push(path)
}

const search = ref('')
const activeFilter = ref('all')
const dateFilter = ref<DateFilterValue>({ mode: 'ALL' })
const updatingOrderId = ref<string | null>(null)

async function toggleOrderStatus(order: any) {
  if (order.status_order === 'BATAL') return
  if (updatingOrderId.value === order.id_order) return
  const nextStatus = order.status_order === 'PROSES' ? 'SELESAI' : 'PROSES'
  updatingOrderId.value = order.id_order
  try {
    await orderStore.updateOrderStatus(order.id_order, nextStatus)
  } finally {
    updatingOrderId.value = null
  }
}

const dateFilteredOrders = computed(() => {
  if (dateFilter.value.mode === 'ALL') return orderStore.orders
  return orderStore.orders.filter((o) => isDateInFilterRange(o.tanggal, dateFilter.value))
})

const filterTabs = computed(() => [
  {
    value: 'all',
    label: 'Semua',
    count: dateFilteredOrders.value.length,
    badgeClass: activeFilter.value === 'all' ? 'bg-red-100 text-red-700' : 'bg-slate-200/80 text-slate-600',
  },
  {
    value: 'PROSES',
    label: 'Proses',
    count: dateFilteredOrders.value.filter((o) => o.status_order === 'PROSES').length,
    badgeClass: activeFilter.value === 'PROSES' ? 'bg-amber-100 text-amber-800' : 'bg-amber-50 text-amber-700',
  },
  {
    value: 'SELESAI',
    label: 'Selesai',
    count: dateFilteredOrders.value.filter((o) => o.status_order === 'SELESAI').length,
    badgeClass: activeFilter.value === 'SELESAI' ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-50 text-emerald-700',
  },
  {
    value: 'BATAL',
    label: 'Batal',
    count: dateFilteredOrders.value.filter((o) => o.status_order === 'BATAL').length,
    badgeClass: activeFilter.value === 'BATAL' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200/80 text-slate-500',
  },
])

const filteredOrders = computed(() => {
  let result = dateFilteredOrders.value
  if (activeFilter.value !== 'all') {
    result = result.filter((o) => o.status_order === activeFilter.value)
  }
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    result = result.filter(
      (o) =>
        o.nama_penerbit.toLowerCase().includes(q) ||
        o.judul_penulis.toLowerCase().includes(q) ||
        o.id_order.toLowerCase().includes(q),
    )
  }
  return result
})

// Load More / Pagination State (Matches TransaksiView)
const PAGE_SIZE = 25
const displayLimit = ref(PAGE_SIZE)

// Reset batas tampilan jika filter atau pencarian berubah
watch([activeFilter, dateFilter, search], () => {
  displayLimit.value = PAGE_SIZE
})

const displayedOrders = computed(() => {
  return filteredOrders.value.slice(0, displayLimit.value)
})

const hasMoreRows = computed(() => {
  return displayedOrders.value.length < filteredOrders.value.length
})

const nextBatchCount = computed(() => {
  return Math.min(PAGE_SIZE, filteredOrders.value.length - displayedOrders.value.length)
})

function loadMore() {
  displayLimit.value += PAGE_SIZE
}

function showAll() {
  displayLimit.value = filteredOrders.value.length
}

function formatKertas(kertas: string) {
  return (kertas || '').replace(/_/g, ' ')
}

function debouncedSearch() {
  // Pencarian dilakukan 100% lokal di memori browser via computed filteredOrders (Hemat kuota GAS)
}

onMounted(() => {
  if (route.query.q) {
    search.value = String(route.query.q)
  }
  orderStore.fetchOrders()
})

onIonViewWillEnter(() => {
  if (route.query.q) {
    search.value = String(route.query.q)
  }
  orderStore.fetchOrders()
})

watch(
  () => route.query.q,
  (newQ) => {
    if (newQ !== undefined) {
      search.value = String(newQ || '')
    }
  }
)
</script>
