<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <PageHeader
        title="Beranda Operasional"
        :show-back="false"
      >
        <template #leading>
          <div class="flex items-center shrink-0">
            <KbmLogo size="sm" variant="icon" />
          </div>
        </template>
        <template #actions>
          <SyncIndicatorPill @click="router.push('/sync-log')" />
          <span class="hidden md:inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 font-mono shadow-2xs">
            {{ currentDate }}
          </span>
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
          :orders="orderStore.orders"
          :get-payment-status="orderStore.getPaymentStatus"
        />

        <!-- 3. Section Title: Order Terbaru -->
        <SectionHeader title="Order Terbaru">
          <template #badge>
            <span
              v-if="orderStore.orders.length > 0"
              class="px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold font-mono"
            >
              {{ orderStore.orders.length }}
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
                      <span v-if="order.kertas" class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{{ formatKertas(order.kertas) }}</span>
                    </div>
                  </td>
                  <td class="text-right font-extrabold font-mono text-xs text-red-600 whitespace-nowrap">
                    {{ formatRupiah(order.total_harga) }}
                  </td>
                  <td class="text-center whitespace-nowrap" @click.stop>
                    <button
                      type="button"
                      @click="toggleOrderStatus(order)"
                      :disabled="updatingOrderId === order.id_order"
                      class="group inline-flex items-center cursor-pointer transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
                      :title="order.status_order === 'PROSES' ? 'Klik untuk tandai SELESAI' : 'Klik untuk kembalikan ke PROSES'"
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
                    <StatusBadge :status="orderStore.getPaymentStatus(order.id_order, order.total_harga)" size="xs" />
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
import { IonPage, IonHeader, IonContent, IonIcon, useIonRouter } from '@ionic/vue'
import { chevronForwardOutline, logOutOutline } from 'ionicons/icons'
import { useAuthStore } from '../stores/auth'
import { useOrderStore } from '../stores/orders'
import { formatTanggal, formatRupiah, getTodayISO } from '@shared/utils/formatters'
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
const router = useIonRouter()

const currentDate = computed(() => formatTanggal(getTodayISO()))
const updatingOrderId = ref<string | null>(null)

const todayOrders = computed(() => orderStore.orders.length)
const todayTotal = computed(() =>
  orderStore.orders.reduce((sum, o) => sum + (o.total_harga || 0), 0)
)
const prosesCount = computed(() =>
  orderStore.orders.filter((o) => o.status_order === 'PROSES').length
)
const selesaiCount = computed(() =>
  orderStore.orders.filter((o) => o.status_order === 'SELESAI').length
)
const recentOrders = computed(() => orderStore.orders.slice(0, 5))

const shiftMetrics = computed(() => [
  {
    label: 'Order Hari Ini',
    value: todayOrders.value,
    unit: 'order',
    minWidth: 'min-w-[130px]',
  },
  {
    label: 'Total Nilai Pekerjaan',
    value: formatRupiah(todayTotal.value),
    valueClass: 'text-red-600',
    minWidth: 'min-w-[150px]',
  },
  {
    label: 'Dalam Proses',
    value: prosesCount.value,
    unit: 'order',
    valueClass: 'text-amber-600',
    minWidth: 'min-w-[130px]',
  },
  {
    label: 'Order Selesai',
    value: selesaiCount.value,
    unit: 'order',
    valueClass: 'text-emerald-600',
    minWidth: 'min-w-[130px]',
  },
])

const mobileLeftItems: BottomNavItem[] = [
  { id: 'home', path: '/home', label: 'Beranda' },
  { id: 'order-list', path: '/order/list', label: 'Pesanan' },
]

const mobileCenterItem: BottomNavItem = {
  id: 'new-order',
  path: '/order/new',
  label: 'Order Baru',
}

const mobileRightItems: BottomNavItem[] = [
  { id: 'sync-log', path: '/sync-log', label: 'Log Sync' },
  { id: 'invoice', path: '/order/list', label: 'Invoice' },
]

function navigate(path: string) {
  router.push(path)
}

function formatKertas(kertas: string) {
  return (kertas || '').replace(/_/g, ' ')
}

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

onMounted(() => {
  orderStore.fetchOrders()
})

function logout() {
  authStore.logout()
}
</script>
