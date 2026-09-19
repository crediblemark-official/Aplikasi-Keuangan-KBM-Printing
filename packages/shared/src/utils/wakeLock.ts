/**
 * Utility Screen Wake Lock API untuk menjaga layar HP Android tetap menyala (Always On)
 * ketika aplikasi dalam keadaan terbuka & sudah login / unlock via kunci HP.
 */

class ScreenWakeLockManager {
  private sentinel: any = null
  private isRequested = false
  private visibilityHandler: (() => void) | null = null

  /**
   * Cek apakah Screen Wake Lock API didukung di browser ini
   */
  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'wakeLock' in navigator
  }

  /**
   * Aktifkan wake lock (mencegah layar mati atau terkunci otomatis)
   */
  public async acquire(): Promise<boolean> {
    this.isRequested = true

    if (!this.isSupported()) {
      return false
    }

    try {
      if (this.sentinel && !this.sentinel.released) {
        return true
      }

      this.sentinel = await (navigator as any).wakeLock.request('screen')

      this.sentinel.addEventListener('release', () => {
        if (this.isRequested) {
          // Re-acquire automatically when tab comes back
        }
      })

      // Re-acquire saat user kembali ke tab/aplikasi dari background
      if (!this.visibilityHandler && typeof document !== 'undefined') {
        this.visibilityHandler = async () => {
          if (this.isRequested && document.visibilityState === 'visible') {
            await this.reacquire()
          }
        }
        document.addEventListener('visibilitychange', this.visibilityHandler)
      }

      return true
    } catch (err: any) {
      console.warn('[WakeLock] Gagal mengaktifkan wake lock:', err?.message || err)
      return false
    }
  }

  /**
   * Aktifkan kembali saat kembali ke tab/aplikasi
   */
  private async reacquire(): Promise<void> {
    if (!this.isRequested || !this.isSupported()) return
    try {
      if (!this.sentinel || this.sentinel.released) {
        this.sentinel = await (navigator as any).wakeLock.request('screen')
      }
    } catch (err) {
      console.warn('[WakeLock] Gagal re-acquire wake lock:', err)
    }
  }

  /**
   * Lepaskan wake lock (layar kembali mengikuti pengaturan timeout OS)
   */
  public async release(): Promise<void> {
    this.isRequested = false
    try {
      if (this.sentinel && !this.sentinel.released) {
        await this.sentinel.release()
      }
    } catch (err) {
      console.warn('[WakeLock] Gagal melepas wake lock:', err)
    } finally {
      this.sentinel = null
      if (this.visibilityHandler && typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', this.visibilityHandler)
        this.visibilityHandler = null
      }
    }
  }

  /**
   * Status apakah wake lock sedang aktif
   */
  public isActive(): boolean {
    return !!(this.sentinel && !this.sentinel.released)
  }
}

export const screenWakeLock = new ScreenWakeLockManager()
