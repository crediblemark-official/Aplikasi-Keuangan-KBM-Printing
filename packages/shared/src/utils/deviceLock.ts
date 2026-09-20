import { Capacitor, registerPlugin } from '@capacitor/core'

export interface DeviceLockOptions {
  title?: string
  description?: string
}

export interface DeviceLockResult {
  success: boolean
  error?: string
  isSecure?: boolean
  notEnrolled?: boolean
}

export interface NativeDeviceLockPluginInterface {
  isDeviceSecure(): Promise<{ isSecure: boolean }>
  authenticate(options?: { title?: string; description?: string }): Promise<{
    success: boolean
    isSecure?: boolean
    notEnrolled?: boolean
    error?: string
  }>
}

export const NativeDeviceLock = registerPlugin<NativeDeviceLockPluginInterface>('NativeDeviceLock')

/**
 * Cek apakah perangkat memiliki kunci layar (PIN, Pola, Password, atau Biometrik).
 * Jika user tidak mengaktifkan kunci layar pada HP, maka tidak perlu dikunci.
 */
export async function checkDeviceLockRequirement(): Promise<{ shouldLock: boolean; isSecure: boolean }> {
  // Jika dijalankan di browser biasa (bukan APK native Android)
  if (!Capacitor.isNativePlatform()) {
    return { shouldLock: false, isSecure: false }
  }

  try {
    const res = await NativeDeviceLock.isDeviceSecure()
    // Jika user TIDAK mengaktifkan PIN/Pola/Kunci Layar di HP-nya -> jangan kunci
    if (!res || !res.isSecure) {
      return { shouldLock: false, isSecure: false }
    }
    return { shouldLock: true, isSecure: true }
  } catch (err) {
    console.warn('Gagal mengecek status kunci layar:', err)
    return { shouldLock: false, isSecure: false }
  }
}

/**
 * Panggil dialog kunci bawaan Android (PIN, Pola, Sandi, atau Sidik Jari).
 */
export async function promptAndroidDeviceLock(options: DeviceLockOptions = {}): Promise<DeviceLockResult> {
  // Jika di browser / non-native, langsung izinkan tanpa kunci
  if (!Capacitor.isNativePlatform()) {
    return { success: true, isSecure: false }
  }

  try {
    const res = await NativeDeviceLock.authenticate({
      title: options.title || 'KBM Percetakan',
      description: options.description || 'Gunakan PIN, Pola, atau Sidik Jari untuk membuka aplikasi',
    })

    if (res && res.success) {
      return { success: true, isSecure: res.isSecure }
    }

    return {
      success: false,
      isSecure: res?.isSecure ?? true,
      error: res?.error || 'Kunci layar dibatalkan',
    }
  } catch (err: any) {
    console.warn('Device lock error:', err)
    return {
      success: false,
      error: err?.message || 'Gagal memanggil kunci layar Android',
    }
  }
}
