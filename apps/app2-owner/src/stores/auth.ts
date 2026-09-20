import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { screenWakeLock } from '@shared/utils/wakeLock'

const DEVICE_AUTH_KEY = 'kbm_device_auth_owner'

export const useAuthStore = defineStore('auth', () => {
  const role = ref<string | null>(null)
  const nama = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => role.value !== null)

  function restoreSession() {
    const saved = localStorage.getItem(DEVICE_AUTH_KEY)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        role.value = data.role || 'OWNER'
        nama.value = data.nama || 'Owner / Keuangan'
        // Pertahankan layar tetap menyala saat sesi aktif
        screenWakeLock.acquire()
      } catch {
        localStorage.removeItem(DEVICE_AUTH_KEY)
      }
    }
  }

  /**
   * Buka kunci aplikasi dengan otentikasi perangkat Android
   */
  function unlockDevice(customName = 'Owner / Keuangan') {
    role.value = 'OWNER'
    nama.value = customName
    error.value = null
    try {
      localStorage.setItem(
        DEVICE_AUTH_KEY,
        JSON.stringify({ role: 'OWNER', nama: customName, unlockedAt: Date.now() })
      )
      // Jaga layar agar tetap menyala (Keep Awake)
      screenWakeLock.acquire()
    } catch (e) {
      console.warn('Gagal menyimpan sesi kunci owner:', e)
    }
  }

  /**
   * Kunci aplikasi (membutuhkan kunci layar Android untuk masuk kembali)
   */
  function lock() {
    role.value = null
    nama.value = null
    try {
      localStorage.removeItem(DEVICE_AUTH_KEY)
    } catch (e) {
      console.warn('Gagal menghapus sesi kunci owner:', e)
    } finally {
      // Lepaskan wake lock saat aplikasi terkunci
      screenWakeLock.release()
    }
  }

  function logout() {
    lock()
  }

  // Inisialisasi sesi
  restoreSession()

  return {
    role,
    nama,
    isAuthenticated,
    isLoading,
    error,
    unlockDevice,
    lock,
    logout,
  }
})
