<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <PageHeader title="Daftar Order" :show-back="true" back-label="Beranda" @back="router.push('/home')">
        <template #actions>
          <BaseButton @click="router.push('/order/new')" size="sm">
            <template #icon>
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M12 4v16m8-8H4" />
              </svg>
            </template>
            Order Baru
          </BaseButton>
        </template>
      </PageHeader>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="w-full min-h-full bg-white pb-24 lg:pb-8">
        <!-- Toolbar: Search Bar (Full Width) -->
        <div class="w-full px-[8px] sm:px-[15px] lg:px-[20px] py-2.5 border-b border-slate-200 bg-white">
          <SearchInput v-model="search" placeholder="Cari penerbit, judul buku, SPK..." @input="debouncedSearch" />
        </div>

        <!-- Toolbar: Status Tabs & Date Filter Bar -->
        <div class="px-[8px] sm:px-[15px] lg:px-[20px] py-2 border-b border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          <FilterTabs v-model="activeFilter" :tabs="filterTabs" />
          <DateFilterBar v-model="dateFilter" />
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
              <tr v-for="order in filteredOrders" :key="order.id_order" @click="router.push(`/order/${order.id_order}`)"
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
                  <button type="button" @click="toggleOrderStatus(order)" :disabled="updatingOrderId === order.id_order"
                    class="group inline-flex items-center cursor-pointer transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
                    :title="order.status_order === 'PROSES' ? 'Klik untuk tandai SELESAI' : 'Klik untuk kembalikan ke PROSES'">
                    <StatusBadge :status="order.status_order" size="xs" :loading="updatingOrderId === order.id_order"
                      class="group-hover:ring-2 group-hover:ring-red-400/40" />
                  </button>
                </td>
                <td class="text-center whitespace-nowrap">
                  <StatusBadge :status="orderStore.getPaymentStatus(order.id_order, order.total_harga)" size="xs" />
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
  IonPage, IonHeader, IonContent, useIonRouter, onIonViewWillEnter,
} from '@ionic/vue'
import PageHeader from '@shared/components/PageHeader.vue'
import FilterTabs from '@shared/components/FilterTabs.vue'
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
import { formatRupiah, formatTanggal, formatKertasOrder, isDateInFilterRange } from '@shared/utils/formatters'
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
let searchTimer: ReturnType<typeof setTimeout>

async function toggleOrderStatus(order: any) {
  if (updatingOrderId.value) return
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
  { value: 'all', label: 'Semua', count: dateFilteredOrders.value.length },
  { value: 'PROSES', label: 'Proses', count: dateFilteredOrders.value.filter((o) => o.status_order === 'PROSES').length },
  { value: 'SELESAI', label: 'Selesai', count: dateFilteredOrders.value.filter((o) => o.status_order === 'SELESAI').length },
  { value: 'BATAL', label: 'Batal', count: dateFilteredOrders.value.filter((o) => o.status_order === 'BATAL').length },
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
