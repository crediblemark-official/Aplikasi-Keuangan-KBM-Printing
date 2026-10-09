<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <PageHeader
        title="Beranda Operasional"
        :show-back="false"
      >
        <template #leading>
          <div class="flex items-center gap-2 shrink-0">
            <KbmLogo size="sm" variant="icon" />
            <SyncIndicatorPill @click="router.push('/sync-log')" />
          </div>
        </template>
        <template #actions>
          <label class="text-xs font-semibold text-slate-500 hidden sm:inline shrink-0 whitespace-nowrap">Periode:</label>
          <div class="inline-flex items-center h-8 p-0.5 bg-slate-100 rounded-lg border border-slate-200/80 shrink-0 gap-0.5">
            <button
              type="button"
              @click="setPeriodeAll"
              class="h-7 px-3.5 sm:px-4 min-w-[58px] flex items-center justify-center text-xs font-sans rounded-md transition-all cursor-pointer shrink-0 leading-none outline-none focus:outline-none focus:ring-0 active:outline-none"
              :class="isAllPeriode
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-900 font-medium'"
              title="Tampilkan Semua Periode"
            >
              Semua
            </button>
            <div
              class="relative h-7 flex items-center rounded-md transition-all shrink-0"
              :class="!isAllPeriode ? 'bg-white shadow-2xs' : ''"
            >
              <span class="absolute left-2.5 flex items-center pointer-events-none text-slate-400">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </span>
              <input
                type="month"
                :value="isAllPeriode ? '' : selectedPeriode"
                @input="onMonthInput($event)"
                @change="onMonthInput($event)"
                class="period-month-input h-7 pl-8 pr-2.5 w-[168px] min-w-[168px] text-xs font-sans bg-transparent border-0 outline-none focus:outline-none focus:ring-0 cursor-pointer leading-none m-0 py-0"
                :class="!isAllPeriode ? 'font-active !text-slate-900 text-slate-900 font-bold' : 'font-inactive text-slate-500 font-medium'"
                title="Pilih Bulan Spesifik"
              />
            </div>
          </div>
          <button
            type="button"
            @click="orderStore.refreshOrders()"
            :disabled="orderStore.isLoading || orderStore.isRefreshing"
            class="h-8 px-2 sm:px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-2xs shrink-0 cursor-pointer disabled:opacity-50"
            title="Segarkan Data Operasional"
          >
            <svg class="w-3.5 h-3.5" :class="{ 'animate-spin': orderStore.isLoading || orderStore.isRefreshing }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span class="hidden sm:inline">{{ orderStore.isRefreshing ? 'Menyinkronkan...' : 'Refresh' }}</span>
          </button>
          <button
            type="button"
            @click="logout"
            title="Keluar / Logout"
            class="flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 active:bg-rose-100 transition-colors text-xs font-semibold cursor-pointer shrink-0"
          >
            <ion-icon :icon="logOutOutline" class="text-lg"></ion-icon>
          </button>
        </template>
      </PageHeader>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="w-full min-h-full bg-white pb-28">

        <!-- 1. Metric Strip (Edge-to-edge, same as App 2) -->
        <MetricStrip :items="shiftMetrics" />

        <!-- 2. Operational Charts & Insights Section -->
        <OperationalInsights
          :orders="filteredOrdersByPeriode"
          :get-payment-status="orderStore.getPaymentStatus"
        />

        <!-- 3. Section Title: Order Terbaru -->
        <SectionHeader title="Order Terbaru">
          <template #badge>
            <span
              v-if="filteredOrdersByPeriode.length > 0"
              class="px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold font-mono"
            >
              {{ filteredOrdersByPeriode.length }}
            </span>
          </template>
          <template #actions>
            <button
              type="button"
              @click="router.push('/order/list')"
              class="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 transition-all cursor-pointer"
            >
              <span>Lihat Semua</span>
              <ion-icon :icon="chevronForwardOutline" class="text-xs"></ion-icon>
            </button>
          </template>
        </SectionHeader>

        <!-- Order Table -->
        <div class="pb-28 lg:pb-8">
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
                <TableStateRow
                  :colspan="8"
                  :loading="orderStore.isLoading"
                  :is-empty="recentOrders.length === 0"
                  empty-text="Belum ada pesanan terbaru hari ini"
                  loading-text="Memuat daftar order terbaru..."
                />
                <tr
                  v-for="order in recentOrders"
                  :key="order.id_order"
                  @click="router.push(`/order/${order.id_order}`)"
                  class="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td class="font-mono text-xs font-semibold text-slate-700 whitespace-nowrap">
                    {{ order.id_order }}
                  </td>
                  <td class="text-xs text-slate-500 font-mono whitespace-nowrap">
                    {{ formatTanggal(order.tanggal) }}
                  </td>
                  <td class="max-w-[240px]">
                    <p class="font-bold text-xs text-slate-900 truncate">{{ order.nama_penerbit }}</p>
                    <p class="text-[11px] text-slate-500 truncate mt-0.5" :title="order.judul_penulis">{{ order.judul_penulis }}</p>
                  </td>
                  <td class="whitespace-nowrap">
                    <div class="flex items-center gap-1 text-[11px] text-slate-600">
                      <span class="px-1.5 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">{{ order.jml_pcs }} pcs</span>
                      <span class="px-1.5 py-0.5 rounded bg-slate-100">{{ order.ukuran }}</span>
                      <span v-if="order.kertas" class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{{ formatKertasOrder(order) }}</span>
                      <span v-if="order.packing_dus_tipe" class="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold">{{ order.packing_dus_qty || 1 }}x Dus</span>
                    </div>
                  </td>
                  <td class="text-right font-extrabold font-mono text-xs whitespace-nowrap" :class="order.status_order === 'BATAL' ? 'line-through text-slate-400' : 'text-red-600'">
                    {{ formatRupiah(order.total_harga) }}
                  </td>
                  <td class="text-center whitespace-nowrap" @click.stop>
                    <button
                      type="button"
                      @click="toggleOrderStatus(order)"
                      :disabled="updatingOrderId === order.id_order || order.status_order === 'BATAL'"
                      class="group inline-flex items-center cursor-pointer transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
                      :title="order.status_order === 'PROSES' ? 'Klik untuk tandai SELESAI' : order.status_order === 'BATAL' ? 'Order dibatalkan — tidak dapat diubah status' : 'Klik untuk kembalikan ke PROSES'"
                    >
                      <StatusBadge
                        :status="order.status_order"
                        size="xs"
                        :loading="updatingOrderId === order.id_order"
                        class="group-hover:ring-2 group-hover:ring-red-400/40"
                      />
                    </button>
                  </td>
                  <td class="text-center whitespace-nowrap">
                    <StatusBadge :status="orderStore.getPaymentStatus(order.id_order, order.total_harga)"
                      :verification="order.status_order === 'BATAL' ? '' : getVerificationStatus(orderStore.kasMasukList.filter(k => k.id_order === order.id_order))" size="xs" />
                  </td>
                  <td class="text-center whitespace-nowrap">
                    <button
                      @click.stop="router.push(`/order/${order.id_order}`)"
                      class="px-2.5 py-1 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      Detail →
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </TableScrollWrapper>
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
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { IonPage, IonHeader, IonContent, IonIcon, useIonRouter, onIonViewWillEnter } from '@ionic/vue'
import { chevronForwardOutline, logOutOutline } from 'ionicons/icons'
import { useAuthStore } from '../stores/auth'
import { useOrderStore } from '../stores/orders'
import { useSyncStore } from '@shared/stores/syncStore'
import { formatTanggal, formatRupiah, getTodayISO, getCurrentPeriode, formatKertasOrder, getVerificationStatus } from '@shared/utils/formatters'
import SyncIndicatorPill from '@shared/components/SyncIndicatorPill.vue'

// Modular Shared Components
import PageHeader from '@shared/components/PageHeader.vue'
import KbmLogo from '@shared/components/KbmLogo.vue'
import MetricStrip from '@shared/components/MetricStrip.vue'
import OperationalInsights from '@shared/components/OperationalInsights.vue'
import MobileBottomNav from '@shared/components/MobileBottomNav.vue'
import type { BottomNavItem } from '@shared/components/MobileBottomNav.vue'
import SectionHeader from '@shared/components/SectionHeader.vue'
import StatusBadge from '@shared/components/StatusBadge.vue'
import TableScrollWrapper from '@shared/components/TableScrollWrapper.vue'
import TableStateRow from '@shared/components/TableStateRow.vue'

const route = useRoute()
const authStore = useAuthStore()
const orderStore = useOrderStore()
const syncStore = useSyncStore()
const router = useIonRouter()

const selectedPeriode = ref(getCurrentPeriode())
const isAllPeriode = computed(() => !selectedPeriode.value || selectedPeriode.value === 'ALL')

function setPeriodeAll() {
  selectedPeriode.value = 'ALL'
}

function onMonthInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  if (val) {
    selectedPeriode.value = val
  }
}

const currentDate = computed(() => formatTanggal(getTodayISO()))
const updatingOrderId = ref<string | null>(null)

const filteredOrdersByPeriode = computed(() => {
  if (isAllPeriode.value) return orderStore.orders
  return orderStore.orders.filter((o) =>
    String(o.tanggal || '').startsWith(selectedPeriode.value)
  )
})

const todayOrders = computed(() =>
  orderStore.orders.filter((o) => o.tanggal === getTodayISO() && o.status_order !== 'BATAL').length
)
const todayTotal = computed(() =>
  orderStore.orders
    .filter((o) => o.tanggal === getTodayISO() && o.status_order !== 'BATAL')
    .reduce((sum, o) => sum + (o.total_harga || 0), 0)
)
const periodOrdersCount = computed(() =>
  filteredOrdersByPeriode.value.filter((o) => o.status_order !== 'BATAL').length
)
const periodTotal = computed(() =>
  filteredOrdersByPeriode.value
    .filter((o) => o.status_order !== 'BATAL')
    .reduce((sum, o) => sum + (o.total_harga || 0), 0)
)
const prosesCount = computed(() =>
  filteredOrdersByPeriode.value.filter((o) => o.status_order === 'PROSES').length
)
const selesaiCount = computed(() =>
  filteredOrdersByPeriode.value.filter((o) => o.status_order === 'SELESAI').length
)
const recentOrders = computed(() => {
  const source = filteredOrdersByPeriode.value.length > 0 ? filteredOrdersByPeriode.value : orderStore.orders
  return [...source]
    .sort((a, b) => String(b.tanggal || '').localeCompare(String(a.tanggal || '')))
    .slice(0, 5)
})

const shiftMetrics = computed(() => [
  {
    label: 'Order Masuk',
    value: periodOrdersCount.value,
    unit: 'order',
    sub: isAllPeriode.value ? 'Semua waktu' : (selectedPeriode.value === getCurrentPeriode() ? `Hari ini: ${todayOrders.value}` : 'Bulan terpilih'),
    minWidth: 'min-w-[130px]',
  },
  {
    label: 'Total Nilai Pekerjaan',
    value: formatRupiah(periodTotal.value),
    valueClass: 'text-red-600',
    sub: isAllPeriode.value ? 'Semua waktu' : (selectedPeriode.value === getCurrentPeriode() && todayTotal.value > 0 ? `Hari ini: ${formatRupiah(todayTotal.value)}` : 'Periode terpilih'),
    minWidth: 'min-w-[160px]',
  },
  {
    label: 'Dalam Proses',
    value: prosesCount.value,
    unit: 'order',
    valueClass: 'text-amber-600',
    sub: 'Antrean cetak',
    minWidth: 'min-w-[130px]',
  },
  {
    label: 'Order Selesai',
    value: selesaiCount.value,
    unit: 'order',
    valueClass: 'text-emerald-600',
    sub: 'Siap kirim / ambil',
    minWidth: 'min-w-[130px]',
  },
])

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

function formatKertas(kertas: string) {
  return (kertas || '').replace(/_/g, ' ')
}

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

onMounted(() => {
  orderStore.fetchOrders()
  orderStore.fetchKasMasuk()
})

onIonViewWillEnter(() => {
  orderStore.fetchOrders()
  orderStore.fetchKasMasuk()
})

function logout() {
  authStore.logout()
}
</script>
