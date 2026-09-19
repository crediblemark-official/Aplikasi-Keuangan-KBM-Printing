import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { CONFIG } from '@shared/api/gasClient'
import { screenWakeLock } from '@shared/utils/wakeLock'

const DEVICE_AUTH_KEY = 'kbm_device_auth_operasional'

export const useAuthStore = defineStore('auth', () => {
  const role = ref<string | null>(null)
  const nama = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => role.value !== null)

  // Restore session dari sessionStorage
  function restoreSession() {
    const saved = sessionStorage.getItem(DEVICE_AUTH_KEY) || sessionStorage.getItem('kbm_device_auth_kasir') || sessionStorage.getItem(CONFIG.PIN_KEY)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        role.value = data.role || 'OPERASIONAL'
        nama.value = data.nama || 'Tim Operasional'
        // Pertahankan layar tetap menyala saat sesi aktif
        screenWakeLock.acquire()
      } catch {
        sessionStorage.removeItem(DEVICE_AUTH_KEY)
        sessionStorage.removeItem('kbm_device_auth_kasir')
        sessionStorage.removeItem(CONFIG.PIN_KEY)
      }
    }
  }

  /**
   * Buka kunci aplikasi dengan otentikasi perangkat Android
   */
  function unlockDevice(customName = 'Tim Operasional') {
    role.value = 'OPERASIONAL'
    nama.value = customName
    error.value = null
    try {
      sessionStorage.setItem(
        DEVICE_AUTH_KEY,
        JSON.stringify({ role: 'OPERASIONAL', nama: customName, unlockedAt: Date.now() })
      )
      // Jaga layar agar tetap menyala (Keep Awake)
      screenWakeLock.acquire()
    } catch (e) {
      console.warn('Gagal menyimpan sesi kunci:', e)
    }
  }

  /**
   * Kunci aplikasi (membutuhkan kunci layar Android untuk masuk kembali)
   */
  function lock() {
    role.value = null
    nama.value = null
    try {
      sessionStorage.removeItem(DEVICE_AUTH_KEY)
      sessionStorage.removeItem(CONFIG.PIN_KEY)
    } catch (e) {
      console.warn('Gagal menghapus sesi kunci:', e)
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
