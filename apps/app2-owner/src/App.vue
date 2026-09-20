<template>
  <div id="owner-app" class="min-h-screen bg-white text-slate-900">
    <router-view />

    <!-- Proteksi Kunci Layar Bawaan Android -->
    <DeviceLockOverlay
      :model-value="!authStore.isAuthenticated"
      role-title="Owner & Keuangan KBM"
      title="KBM Owner"
      description="Gunakan PIN, Pola, atau Sidik Jari untuk membuka aplikasi"
      @unlocked="handleUnlocked"
    />
  </div>
</template>

<script setup lang="ts">
import { watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DeviceLockOverlay from '@shared/components/DeviceLockOverlay.vue'
import { screenWakeLock } from '@shared/utils/wakeLock'
import { setupAndroidBackButton } from '@shared/utils/backButton'
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()
const router = useRouter()

onMounted(() => {
  setupAndroidBackButton({
    router,
    isRootRoute: (path) => path === '/dashboard/summary' || path === '/dashboard' || path === '/' || path === '',
    fallbackRootPath: '/dashboard/summary',
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

function handleUnlocked() {
  authStore.unlockDevice()
}
</script>
