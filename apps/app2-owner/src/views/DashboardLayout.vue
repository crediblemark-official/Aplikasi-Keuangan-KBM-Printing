<template>
  <div class="flex w-full h-full min-h-screen bg-white">
    <!-- Desktop Sidebar (Direct Universal Shared Component) -->
    <DesktopSidebar
      brand-title="KBM Dashboard"
      brand-subtitle="Owner & Manajemen"
      brand-badge="Owner"
      :nav-items="navItems"
      :current-path="route.path"
      :user-name="authStore.nama || 'Owner KBM'"
      user-role="Owner Aktif"
      @navigate="navigate"
      @logout="logout"
    >
      <template #item-icon="{ item }">
        <!-- Dashboard Icon -->
        <svg v-if="item.id === 'summary'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>

        <!-- Transaksi Icon -->
        <svg v-else-if="item.id === 'transaksi'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>

        <!-- Buku Kas Icon -->
        <svg v-else-if="item.id === 'buku-kas'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>

        <!-- Verifikasi Icon -->
        <svg v-else-if="item.id === 'verifikasi'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>

        <!-- Piutang Icon -->
        <svg v-else-if="item.id === 'piutang'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>

        <!-- Laporan Icon -->
        <svg v-else-if="item.id === 'laporan'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>

        <!-- Log Sinkronisasi Icon -->
        <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </template>
    </DesktopSidebar>

    <!-- Main Content Area -->
    <main class="flex-1 min-w-0 h-full relative overflow-y-auto pb-24 lg:pb-0 bg-white">
      <router-view v-slot="{ Component }">
        <transition
          enter-active-class="transition-opacity duration-150 ease-out"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition-opacity duration-150 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
          mode="out-in"
        >
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Mobile/Tablet Docked Bottom Navigation Bar -->
    <MobileBottomNav
      :left-items="mobileLeftItems"
      :center-item="mobileCenterItem"
      :right-items="mobileRightItems"
      :current-path="route.path"
      @navigate="navigate"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DesktopSidebar from '@shared/components/DesktopSidebar.vue'
import type { SidebarNavItem } from '@shared/components/DesktopSidebar.vue'
import MobileBottomNav from '@shared/components/MobileBottomNav.vue'
import type { BottomNavItem } from '@shared/components/MobileBottomNav.vue'
import { api } from '@shared/api/gasClient'
import { useAuthStore } from '../stores/auth'
import { useSyncStore } from '@shared/stores/syncStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const syncStore = useSyncStore()

const pendingVerifikasiCount = ref(0)

let lastCheckTime = 0
async function checkPendingVerifikasi() {
  const now = Date.now()
  if (now - lastCheckTime < 30_000) return
  try {
    const res = await api.getKasMasuk()
    if (res.success && res.data) {
      lastCheckTime = Date.now()
      pendingVerifikasiCount.value = res.data.filter((k) => k.status_verifikasi === 'PENDING').length
    }
  } catch (e) {
    console.warn('Failed to check pending verification:', e)
  }
}

onMounted(() => {
  checkPendingVerifikasi()
})

const navItems = computed<SidebarNavItem[]>(() => [
  { id: 'summary', path: '/dashboard/summary', label: 'Dashboard' },
  {
    id: 'transaksi',
    path: '/dashboard/transaksi',
    label: 'Transaksi Order',
    badge: pendingVerifikasiCount.value > 0 ? pendingVerifikasiCount.value : undefined,
  },
  { id: 'buku-kas', path: '/dashboard/buku-kas', label: 'Buku Kas' },
  { id: 'laporan', path: '/dashboard/laporan', label: 'Laporan' },
  {
    id: 'sync-log',
    path: '/dashboard/sync-log',
    label: 'Log Sinkronisasi',
    badge: (syncStore.pendingCount + syncStore.failedCount) > 0 ? (syncStore.pendingCount + syncStore.failedCount) : undefined,
  },
])

const mobileLeftItems = computed<BottomNavItem[]>(() => [
  { id: 'summary', path: '/dashboard/summary', label: 'Dashboard' },
  {
    id: 'transaksi',
    path: '/dashboard/transaksi',
    label: 'Transaksi & Piutang',
    badge: pendingVerifikasiCount.value > 0 ? pendingVerifikasiCount.value : undefined,
  },
])

const mobileCenterItem: BottomNavItem = {
  id: 'buku-kas',
  path: '/dashboard/buku-kas',
  label: 'Buku Kas',
}

const mobileRightItems = computed<BottomNavItem[]>(() => [
  { id: 'laporan', path: '/dashboard/laporan', label: 'Laporan' },
  {
    id: 'sync-log',
    path: '/dashboard/sync-log',
    label: 'Sync Log',
    badge: (syncStore.pendingCount + syncStore.failedCount) > 0 ? (syncStore.pendingCount + syncStore.failedCount) : undefined,
  },
])

function navigate(path: string) {
  router.push(path)
}

function logout() {
  authStore.logout()
}
</script>
