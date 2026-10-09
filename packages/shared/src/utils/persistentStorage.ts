import { get, set, del, clear } from 'idb-keyval'

/**
 * Universal Persistent Storage using IndexedDB (via idb-keyval)
 * - Kapasitas besar (ratusan MB / GB, bukan 5 MB seperti localStorage)
 * - Asynchronous, tidak memblokir UI thread saat read/write ribuan baris
 * - Fallback aman ke localStorage jika IndexedDB diblokir/tidak tersedia
 * - Otomatis migrasi data lama dari localStorage ke IndexedDB saat pertama kali dibaca
 */

let isIndexedDBAvailable: boolean | null = null

function checkIndexedDBSupport(): boolean {
  if (isIndexedDBAvailable !== null) return isIndexedDBAvailable
  try {
    isIndexedDBAvailable = typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB !== null
  } catch {
    isIndexedDBAvailable = false
  }
  return isIndexedDBAvailable
}

/**
 * Mengambil data dari storage.
 * Mencoba IndexedDB terlebih dahulu. Jika kosong, memeriksa localStorage untuk migrasi otomatis.
 */
export async function getStorage<T>(key: string, defaultValue: T): Promise<T> {
  if (checkIndexedDBSupport()) {
    try {
      const val = await get<T>(key)
      if (val !== undefined && val !== null) {
        return val
      }

      // Migrasi data lama dari localStorage jika ada
      if (typeof window !== 'undefined' && window.localStorage) {
        const rawLocal = localStorage.getItem(key)
        if (rawLocal) {
          try {
            const parsed = JSON.parse(rawLocal) as T
            // Simpan ke IndexedDB untuk pembacaan berikutnya
            await set(key, parsed)
            // Bersihkan localStorage agar tidak memakan kuota 5MB
            localStorage.removeItem(key)
            return parsed
          } catch {
            // Abaikan jika parse gagal
          }
        }
      }
    } catch (err) {
      console.warn(`[persistentStorage] Gagal membaca IndexedDB untuk key "${key}", mencoba localStorage:`, err)
    }
  }

  // Fallback ke localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const item = localStorage.getItem(key)
      if (item !== null) {
        return JSON.parse(item) as T
      }
    } catch {
      // Return defaultValue
    }
  }

  return defaultValue
}

/**
 * Menyimpan data ke storage secara asynchronous.
 * Data di-serialize/sanitasi terlebih dahulu agar bersih dari Vue Reactive Proxy yang tidak kompatibel dengan IndexedDB Structured Clone Algorithm.
 */
export async function setStorage<T>(key: string, value: T): Promise<void> {
  // Pastikan value adalah plain data yang aman untuk Structured Clone Algorithm
  let safeValue: any = value
  if (value !== null && typeof value === 'object') {
    try {
      safeValue = JSON.parse(JSON.stringify(value))
    } catch {
      safeValue = value
    }
  }

  if (checkIndexedDBSupport()) {
    try {
      await set(key, safeValue)
      return
    } catch (err) {
      console.warn(`[persistentStorage] Gagal menulis ke IndexedDB untuk key "${key}", fallback ke localStorage:`, err)
    }
  }

  // Fallback ke localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(key, JSON.stringify(safeValue))
    } catch (err) {
      console.error(`[persistentStorage] Gagal menyimpan ke localStorage:`, err)
    }
  }
}

/**
 * Menghapus data spesifik dari storage.
 */
export async function removeStorage(key: string): Promise<void> {
  if (checkIndexedDBSupport()) {
    try {
      await del(key)
    } catch {
      // ignore
    }
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.removeItem(key)
    } catch {
      // ignore
    }
  }
}

/**
 * Mengosongkan seluruh storage IndexedDB.
 */
export async function clearAllStorage(): Promise<void> {
  if (checkIndexedDBSupport()) {
    try {
      await clear()
    } catch {
      // ignore
    }
  }
}
