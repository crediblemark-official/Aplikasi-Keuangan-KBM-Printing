import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@shared/api/gasClient'
import { getStorage, setStorage } from '@shared/utils/persistentStorage'
import type { KasMasuk, KasKeluar, Order, Client } from '@shared/types'

const KM_STORAGE_KEY = 'kbm_owner_km_cache_v1'
const KK_STORAGE_KEY = 'kbm_owner_kk_cache_v1'
const ORD_STORAGE_KEY = 'kbm_owner_orders_cache_v1'
const CL_STORAGE_KEY = 'kbm_owner_clients_cache_v1'

// Fallback synchronous load awal dari localStorage untuk render instan frame pertama
function quickInitialLoad<T>(key: string): T[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export const useFinanceStore = defineStore('finance', () => {
  const kasMasukList = ref<KasMasuk[]>(quickInitialLoad<KasMasuk>(KM_STORAGE_KEY))
  const kasKeluarList = ref<KasKeluar[]>(quickInitialLoad<KasKeluar>(KK_STORAGE_KEY))
  const ordersList = ref<Order[]>(quickInitialLoad<Order>(ORD_STORAGE_KEY))
  const clientsList = ref<Client[]>(quickInitialLoad<Client>(CL_STORAGE_KEY))

  // Hydrate data lengkap dari IndexedDB di latar belakang
  async function hydrateFromIndexedDB() {
    try {
      const [km, kk, ord, cl] = await Promise.all([
        getStorage<KasMasuk[]>(KM_STORAGE_KEY, []),
        getStorage<KasKeluar[]>(KK_STORAGE_KEY, []),
        getStorage<Order[]>(ORD_STORAGE_KEY, []),
        getStorage<Client[]>(CL_STORAGE_KEY, []),
      ])
      if (km.length && !kasMasukList.value.length) kasMasukList.value = km
      if (kk.length && !kasKeluarList.value.length) kasKeluarList.value = kk
      if (ord.length && !ordersList.value.length) ordersList.value = ord
      if (cl.length && !clientsList.value.length) clientsList.value = cl
    } catch (e) {
      console.warn('[useFinanceStore] Gagal hidrasi dari IndexedDB:', e)
    }
  }

  hydrateFromIndexedDB()

  // True hanya jika data lokal benar-benar kosong dan butuh first fetch
  const isLoading = ref(false)
  // True saat silent background revalidation sedang berlangsung
  const isRefreshing = ref(false)
  const error = ref<string | null>(null)

  let lastFetchTime = 0
  const CACHE_TTL_MS = 60_000 // 1 menit in-memory TTL

  async function loadFinanceData(options: { force?: boolean; silent?: boolean } = {}) {
    const { force = false, silent = false } = options
    const hasCachedData =
      kasMasukList.value.length > 0 ||
      kasKeluarList.value.length > 0 ||
      ordersList.value.length > 0

    // Jika data masih segar (dalam kurun waktu TTL) dan bukan paksaan manual
    if (!force && hasCachedData && Date.now() - lastFetchTime < CACHE_TTL_MS) {
      return { success: true, fromCache: true }
    }

    if (!hasCachedData && !silent) {
      isLoading.value = true
    } else {
      isRefreshing.value = true
    }
    error.value = null

    try {
      const params = force ? { nocache: 'true' } : undefined
      
      // 1. Coba batch bundle endpoint (1 round-trip untuk semua dataset)
      const bundleRes = await api.getFinanceBundle(params).catch(() => ({ success: false, data: undefined }))

      if (bundleRes.success && bundleRes.data) {
        const { orders, kas_masuk, kas_keluar, clients } = bundleRes.data
        if (kas_masuk) {
          kasMasukList.value = kas_masuk
          setStorage(KM_STORAGE_KEY, kas_masuk)
        }
        if (kas_keluar) {
          kasKeluarList.value = kas_keluar
          setStorage(KK_STORAGE_KEY, kas_keluar)
        }
        if (clients) {
          clientsList.value = clients
          setStorage(CL_STORAGE_KEY, clients)
        }
        if (orders) {
          ordersList.value = orders
          setStorage(ORD_STORAGE_KEY, orders)
        }
      } else {
        // 2. Fallback: individual calls jika deployment GAS belum menyertakan bundle endpoint
        const [kmRes, kkRes, clRes, ordRes] = await Promise.all([
          api.getKasMasuk(params),
          api.getKasKeluar(params),
          api.getClients(params).catch(() => ({ success: false, data: [] })),
          api.getOrders(params).catch(() => ({ success: false, data: [] })),
        ])

        if (kmRes.success && kmRes.data) {
          kasMasukList.value = kmRes.data
          setStorage(KM_STORAGE_KEY, kmRes.data)
        }
        if (kkRes.success && kkRes.data) {
          kasKeluarList.value = kkRes.data
          setStorage(KK_STORAGE_KEY, kkRes.data)
        }
        if (clRes.success && clRes.data) {
          clientsList.value = clRes.data
          setStorage(CL_STORAGE_KEY, clRes.data)
        }
        if (ordRes.success && ordRes.data) {
          ordersList.value = ordRes.data
          setStorage(ORD_STORAGE_KEY, ordRes.data)
        }
      }

      lastFetchTime = Date.now()
      return { success: true }
    } catch (err: any) {
      error.value = err?.message || String(err)
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
      isRefreshing.value = false
    }
  }

  // Helper untuk refresh manual dari tombol UI
  async function refresh(force = true) {
    return loadFinanceData({ force, silent: false })
  }

  return {
    kasMasukList,
    kasKeluarList,
    ordersList,
    clientsList,
    isLoading,
    isRefreshing,
    error,
    loadFinanceData,
    refresh,
  }
})
