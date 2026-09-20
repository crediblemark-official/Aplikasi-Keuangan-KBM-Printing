import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import type { Router } from 'vue-router'

let lastBackPressTime = 0

export interface BackButtonSetupOptions {
  router: Router
  isRootRoute: (currentPath: string) => boolean
  fallbackRootPath?: string
  onExit?: () => void
}

/**
 * Setup penanganan tombol kembali (hardware back button / back gesture) bawaan Android.
 * Mencegah aplikasi langsung keluar saat ditekan, melainkan mundur ke halaman sebelumnya
 * (seperti detail order -> daftar order -> beranda).
 * Hanya keluar jika sudah di halaman utama dengan konfirmasi 2x tekan.
 */
export function setupAndroidBackButton(options: BackButtonSetupOptions) {
  if (!Capacitor.isNativePlatform()) return

  // Hapus listener sebelumnya jika ada agar tidak terdaftar ganda
  CapApp.removeAllListeners()

  CapApp.addListener('backButton', async () => {
    // 1. Cek apakah ada modal atau dialog aktif yang bisa ditutup terlebih dahulu
    const modalCloseBtn = document.querySelector('[data-close-on-back="true"], .modal-close-trigger') as HTMLElement | null
    if (modalCloseBtn) {
      modalCloseBtn.click()
      return
    }

    const currentPath = options.router.currentRoute.value.path

    // 2. Jika berada di halaman utama (Root Page)
    if (options.isRootRoute(currentPath)) {
      const now = Date.now()
      // Jika ditekan 2x berturut-turut dalam 2 detik, keluar dari aplikasi
      if (now - lastBackPressTime < 2000) {
        if (options.onExit) {
          options.onExit()
        }
        CapApp.exitApp()
      } else {
        lastBackPressTime = now
        showBackToast('Tekan sekali lagi untuk keluar')
      }
      return
    }

    // 3. Jika berada di subhalaman (Detail, Form Baru, SPK, dsb.)
    // Mundur ke halaman sebelumnya
    try {
      if (window.history.length > 1) {
        options.router.back()
      } else {
        // Fallback jika tidak ada riwayat terekam
        options.router.replace(options.fallbackRootPath || '/home')
      }
    } catch (err) {
      console.warn('Gagal navigasi tombol back:', err)
      options.router.replace(options.fallbackRootPath || '/home')
    }
  })
}

function showBackToast(message: string) {
  const existing = document.getElementById('kbm-back-toast')
  if (existing) existing.remove()

  const toast = document.createElement('div')
  toast.id = 'kbm-back-toast'
  toast.className =
    'fixed bottom-14 left-1/2 -translate-x-1/2 z-[999999] px-4 py-2 bg-slate-900/90 backdrop-blur-sm text-white text-xs font-semibold rounded-full shadow-xl pointer-events-none select-none transition-opacity duration-300'
  toast.textContent = message
  document.body.appendChild(toast)

  setTimeout(() => {
    toast.style.opacity = '0'
    setTimeout(() => toast.remove(), 320)
  }, 1600)
}
