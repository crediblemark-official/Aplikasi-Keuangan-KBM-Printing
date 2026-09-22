<template>
  <ion-app>
    <div class="flex w-full h-full min-h-screen bg-white">
      <DesktopSidebar
        v-if="showSidebar"
        brand-title="KBM Operasional"
        brand-subtitle="Order & Percetakan Buku"
        brand-badge="Ops"
        :nav-items="navItems"
        :current-path="route.path"
        :user-name="authStore.nama || 'Tim Operasional'"
        user-role="Admin Operasional"
        @navigate="navigate"
        @logout="logout"
      >


        <template #item-icon="{ item }">
          <!-- Beranda Icon -->
          <svg v-if="item.id === 'home'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <!-- Order Baru Icon -->
          <svg v-else-if="item.id === 'order-new'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <!-- Catat Pembayaran Icon -->
          <svg v-else-if="item.id === 'payment-new'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <!-- Daftar Order Icon -->
          <svg v-else-if="item.id === 'order-list'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <!-- Penerbit & Klien Icon -->
          <svg v-else-if="item.id === 'client-list' || item.id === 'klien'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <!-- Log Sinkronisasi Icon -->
          <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </template>
      </DesktopSidebar>
      <div class="flex-1 min-w-0 h-full relative">
        <ion-router-outlet />
      </div>
    </div>

    <!-- Proteksi Kunci Layar Bawaan Android -->
    <DeviceLockOverlay
      :model-value="!authStore.isAuthenticated"
      role-title="KBM Operasional Percetakan"
      title="KBM Operasional"
      description="Gunakan PIN, Pola, atau Sidik Jari untuk membuka aplikasi"
      @unlocked="handleUnlocked"
    />
  </ion-app>
</template>

<script setup lang="ts">
import { computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonApp, IonRouterOutlet, useIonRouter } from '@ionic/vue'
import DesktopSidebar from '@shared/components/DesktopSidebar.vue'
import type { SidebarNavItem } from '@shared/components/DesktopSidebar.vue'
import DeviceLockOverlay from '@shared/components/DeviceLockOverlay.vue'
import { screenWakeLock } from '@shared/utils/wakeLock'
import { setupAndroidBackButton } from '@shared/utils/backButton'
import { useAuthStore } from './stores/auth'
import { useOrderStore } from './stores/orders'
import { useSyncStore } from '@shared/stores/syncStore'

const route = useRoute()
const router = useIonRouter()
const vueRouter = useRouter()
const authStore = useAuthStore()
const orderStore = useOrderStore()
const syncStore = useSyncStore()

onMounted(() => {
  setupAndroidBackButton({
    router: vueRouter,
    isRootRoute: (path) => path === '/home' || path === '/' || path === '',
    fallbackRootPath: '/home',
  })
})

// Jaga layar HP Android tetap menyala tanpa sleep/lock selama login
watch(
  () => authStore.isAuthenticated,
  (authed) => {
    if (authed) {
      screenWakeLock.acquire()
    } else {
      screenWakeLock.release()
    }
  },
  { immediate: true }
)

const showSidebar = computed(() => {
  return authStore.isAuthenticated
})

const navItems = computed<SidebarNavItem[]>(() => [
  { id: 'home', path: '/home', label: 'Beranda' },
  { id: 'order-new', path: '/order/new', label: 'Order Baru' },
  { id: 'order-list', path: '/order/list', label: 'Daftar Order', badge: orderStore.orders.length },
  { id: 'client-list', path: '/klien', label: 'Penerbit & Klien' },
  {
    id: 'sync-log',
    path: '/sync-log',
    label: 'Log Sinkronisasi',
    badge: (syncStore.pendingCount + syncStore.failedCount) > 0 ? (syncStore.pendingCount + syncStore.failedCount) : undefined,
  },
])

function navigate(path: string) {
  router.push(path)
}

function handleUnlocked() {
  authStore.unlockDevice()
}

function logout() {
  authStore.logout()
}
</script>
