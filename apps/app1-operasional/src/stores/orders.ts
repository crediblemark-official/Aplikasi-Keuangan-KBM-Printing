import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { api } from '@shared/api/gasClient'
import { useSyncStore } from '@shared/stores/syncStore'
import type { Order, KasMasuk } from '@shared/types'
import { hitungStatusBayar, getTodayISO } from '@shared/utils/formatters'

const STORAGE_KEY = 'kbm_cached_orders_v2'
const KM_STORAGE_KEY = 'kbm_cached_kas_masuk_v2'

function loadCachedOrders(): Order[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem('kbm_cached_orders_v1')
      if (raw) return JSON.parse(raw)
    }
  } catch {}
  return []
}

function saveCachedOrders(items: Order[]) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    }
  } catch {}
}

function loadCachedKasMasuk(): KasMasuk[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(KM_STORAGE_KEY) || sessionStorage.getItem('kbm_cached_kas_masuk_v1')
      if (raw) return JSON.parse(raw)
    }
  } catch {}
  return []
}

function saveCachedKasMasuk(items: KasMasuk[]) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(KM_STORAGE_KEY, JSON.stringify(items))
    }
  } catch {}
}

export const useOrderStore = defineStore('orders', () => {
  const orders = ref<Order[]>(loadCachedOrders())
  const kasMasukList = ref<KasMasuk[]>(loadCachedKasMasuk())
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const currentOrderId = ref<string | null>(null)

  // In-memory TTL Caching untuk menghemat kuota eksekusi GAS
  let lastFetchOrdersTime = 0
  let lastFetchKasMasukTime = 0
  const CACHE_TTL_MS = 30_000 // 30 detik

  // Auto-persist to localStorage (Tahan saat offline / tab ditutup)
  watch(
    orders,
    (val) => {
      saveCachedOrders(val)
    },
    { deep: true },
  )

  watch(
    kasMasukList,
    (val) => {
      saveCachedKasMasuk(val)
    },
    { deep: true },
  )

  // Dengarkan rekonsiliasi ID Order saat sinkronisasi offline berhasil
  if (typeof window !== 'undefined') {
    window.addEventListener('kbm_order_synced', ((e: CustomEvent) => {
      const { temp_id, real_id } = e.detail || {}
      if (temp_id && real_id) {
        const target = orders.value.find((o) => o.id_order === temp_id)
        if (target) {
          target.id_order = real_id
        }
        if (currentOrderId.value === temp_id) {
          currentOrderId.value = real_id
        }
      }
    }) as EventListener)

    window.addEventListener('kbm_kas_masuk_synced', ((e: CustomEvent) => {
      const { temp_id, real_id } = e.detail || {}
      if (temp_id && real_id) {
        const target = kasMasukList.value.find((k) => k.id_kas_masuk === temp_id)
        if (target) {
          target.id_kas_masuk = real_id
        }
      }
    }) as EventListener)
  }

  const currentOrder = computed(() =>
    orders.value.find((o) => o.id_order === currentOrderId.value),
  )

  const activeOrders = computed(() =>
    orders.value.filter((o) => o.status_order === 'PROSES'),
  )

  function getPaymentStatus(orderId: string, totalHarga: number): 'LUNAS' | 'DP' | 'BELUM_BAYAR' {
    if (!orderId) return 'BELUM_BAYAR'
    const trimmedId = orderId.trim()
    const payments = kasMasukList.value.filter(
      (k) => k.id_order && k.id_order.trim() === trimmedId && (k as any).status_verifikasi !== 'BATAL'
    )
    const totalMasuk = payments.reduce((s, k) => s + (k.nominal || 0), 0)
    const status = hitungStatusBayar(totalMasuk, totalHarga)
    if (status === 'KURANG_BAYAR') return 'DP'
    return status
  }

  async function fetchKasMasuk(force = false) {
    const now = Date.now()
    if (!force && kasMasukList.value.length > 0 && (now - lastFetchKasMasukTime < CACHE_TTL_MS)) {
      return
    }
    try {
      const kmRes = await api.getKasMasuk(force ? { nocache: 'true' } : undefined)
      if (kmRes.success && kmRes.data) {
        lastFetchKasMasukTime = Date.now()
        const backendKmIds = new Set(kmRes.data.map((k) => k.id_kas_masuk.trim()))
        // Hanya pertahankan data lokal jika berstatus offline pending (KM-OFFLINE-*)
        const localPendingKm = kasMasukList.value.filter(
          (k) => k.id_kas_masuk.startsWith('KM-OFFLINE-') && !backendKmIds.has(k.id_kas_masuk.trim())
        )
        kasMasukList.value = [...localPendingKm, ...kmRes.data]
      }
    } catch (e) {
      console.warn('Failed to fetch kas masuk:', e)
    }
  }

  async function fetchOrders(search?: string, force = false) {
    const now = Date.now()
    // Jika data lokal sudah ada dan belum lewat 30s, jangan tembak GAS (hemat kuota)
    if (!force && !search && orders.value.length > 0 && (now - lastFetchOrdersTime < CACHE_TTL_MS)) {
      return
    }

    isLoading.value = true
    error.value = null
    try {
      const cleanSearch = search && search.trim() !== '' ? search.trim() : undefined
      const res = await api.getOrders(
        cleanSearch ? { search: cleanSearch } : (force ? { nocache: 'true' } : undefined),
      )

      if (res.success && res.data) {
        lastFetchOrdersTime = Date.now()
        // Merge with existing local orders:
        // HANYA pertahankan data lokal yang berstatus offline pending (ORD-OFFLINE-*).
        // Order reguler yang tidak ada di respon backend berarti sudah dihapus dari Sheet,
        // sehingga harus dibuang dari memori lokal dan localStorage.
        const backendIds = new Set(res.data.map((o) => o.id_order.trim()))
        const localPending = orders.value.filter(
          (o) => o.id_order.startsWith('ORD-OFFLINE-') && !backendIds.has(o.id_order.trim()),
        )
        orders.value = [...localPending, ...res.data]
      } else if (!res.isOffline) {
        error.value = res.error ?? 'Gagal memuat data'
      }

      // Ambil kas masuk hanya jika belum pernah diambil sama sekali
      if (kasMasukList.value.length === 0) {
        fetchKasMasuk().catch(() => {})
      }
    } finally {
      isLoading.value = false
    }
  }

  async function createOrder(
    orderData: Omit<Order, 'id_order' | 'tanggal' | 'status_order'>,
  ): Promise<{ id_order: string; nomor_invoice: string } | null> {
    isLoading.value = true
    error.value = null

    try {
      const res = await api.createOrder(orderData)

      if (res.success && res.data) {
        // Berhasil terkirim online ke server GAS
        const localOrder: Order = {
          id_order: res.data.id_order,
          tanggal: getTodayISO(),
          status_order: 'PROSES',
          nama_penerbit: orderData.nama_penerbit,
          judul_penulis: orderData.judul_penulis,
          judul_buku: orderData.judul_buku,
          nama_penulis: orderData.nama_penulis,
          jml_pcs: orderData.jml_pcs,
          ukuran: orderData.ukuran,
          ukuran_custom: orderData.ukuran_custom,
          kertas: orderData.kertas,
          kertas_bw: orderData.kertas_bw,
          kertas_fc: orderData.kertas_fc,
          packing_dus_tipe: orderData.packing_dus_tipe,
          packing_dus_qty: orderData.packing_dus_qty,
          biaya_packing: orderData.biaya_packing,
          cetak_bw: orderData.cetak_bw,
          cetak_fc: orderData.cetak_fc,
          finishing: orderData.finishing,
          total_harga: orderData.total_harga,
          catatan: orderData.catatan,
          alamat_penerbit: orderData.alamat_penerbit,
          kontak_penerbit: orderData.kontak_penerbit,
          link_bukti: orderData.link_bukti || '',
        }

        orders.value = [localOrder, ...orders.value.filter((o) => o.id_order !== localOrder.id_order)]
        currentOrderId.value = localOrder.id_order
        return res.data
      } else {
        // Cek apakah offline / masalah koneksi internet
        const isOffline = res.isOffline || (typeof navigator !== 'undefined' && !navigator.onLine)
        if (isOffline) {
          // MODE OFFLINE: Buat ID sementara, simpan lokal, & daftarkan antrean sync
          const tempSeq = Date.now().toString(36).slice(-4).toUpperCase()
          const tempId = `ORD-OFFLINE-${tempSeq}`
          const tempInv = `INV-OFFLINE-${tempSeq}`

          const offlineOrder: Order = {
            id_order: tempId,
            tanggal: getTodayISO(),
            status_order: 'PROSES',
            nama_penerbit: orderData.nama_penerbit,
            judul_penulis: orderData.judul_penulis,
            judul_buku: orderData.judul_buku,
            nama_penulis: orderData.nama_penulis,
            jml_pcs: orderData.jml_pcs,
            ukuran: orderData.ukuran,
            ukuran_custom: orderData.ukuran_custom,
            kertas: orderData.kertas,
            kertas_bw: orderData.kertas_bw,
            kertas_fc: orderData.kertas_fc,
            packing_dus_tipe: orderData.packing_dus_tipe,
            packing_dus_qty: orderData.packing_dus_qty,
            biaya_packing: orderData.biaya_packing,
            cetak_bw: orderData.cetak_bw,
            cetak_fc: orderData.cetak_fc,
            finishing: orderData.finishing,
            total_harga: orderData.total_harga,
            catatan: orderData.catatan,
            alamat_penerbit: orderData.alamat_penerbit,
            kontak_penerbit: orderData.kontak_penerbit,
            link_bukti: orderData.link_bukti || '',
          }

          orders.value = [offlineOrder, ...orders.value]
          currentOrderId.value = tempId

          try {
            const syncStore = useSyncStore()
            syncStore.addLog({
              entity_type: 'ORDER',
              title: `Order [Offline]: ${orderData.nama_penerbit} — ${orderData.judul_penulis}`,
              subtitle: `Oplah ${orderData.jml_pcs} pcs • ID: ${tempId}`,
              nominal: orderData.total_harga,
              status: 'PENDING',
              action: 'createOrder',
              payload: { order: orderData, temp_id_order: tempId },
            })
          } catch (syncErr) {
            console.warn('Failed to queue offline order to syncStore:', syncErr)
          }

          return { id_order: tempId, nomor_invoice: tempInv }
        }

        error.value = res.error ?? 'Gagal membuat order'
        return null
      }
    } finally {
      isLoading.value = false
    }
  }

  async function ensureOrderLoaded(id: string): Promise<Order | undefined> {
    const trimmedId = id.trim()
    let found = orders.value.find((o) => o.id_order.trim() === trimmedId)
    if (!found) {
      await fetchOrders(undefined, true)
      found = orders.value.find((o) => o.id_order.trim() === trimmedId)
    }
    return found
  }

  async function updateOrderStatus(id_order: string, newStatus: 'PROSES' | 'SELESAI' | 'BATAL') {
    const trimmedId = id_order.trim()
    const target = orders.value.find((o) => o.id_order.trim() === trimmedId)
    const oldStatus = target?.status_order
    if (target) {
      target.status_order = newStatus
    }
    try {
      const res = await api.updateOrderStatus(trimmedId, newStatus)
      if (!res.success && target && oldStatus && !res.isOffline) {
        target.status_order = oldStatus
      }
      return res
    } catch (err) {
      if (target && oldStatus) target.status_order = oldStatus
      return { success: false, error: String(err) }
    }
  }

  async function updateOrder(orderData: Partial<Order> & { id_order: string }) {
    const trimmedId = orderData.id_order.trim()
    const targetIdx = orders.value.findIndex((o) => o.id_order.trim() === trimmedId)
    const oldOrder = targetIdx !== -1 ? { ...orders.value[targetIdx] } : null

    if (targetIdx !== -1) {
      orders.value[targetIdx] = {
        ...orders.value[targetIdx],
        ...orderData,
      }
    }

    isLoading.value = true
    try {
      const res = await api.updateOrder(orderData)
      if (!res.success && oldOrder && targetIdx !== -1 && !res.isOffline) {
        orders.value[targetIdx] = oldOrder
      }
      return res
    } catch (err: any) {
      if (oldOrder && targetIdx !== -1) orders.value[targetIdx] = oldOrder
      return { success: false, error: err?.message || String(err) }
    } finally {
      isLoading.value = false
    }
  }

  function setCurrentOrder(id: string) {
    currentOrderId.value = id
  }

  async function refreshOrders() {
    return fetchOrders(undefined, true)
  }

  return {
    orders,
    isLoading,
    error,
    currentOrder,
    activeOrders,
    kasMasukList,
    getPaymentStatus,
    fetchOrders,
    refreshOrders,
    fetchKasMasuk,
    createOrder,
    updateOrder,
    updateOrderStatus,
    ensureOrderLoaded,
    setCurrentOrder,
  }
})
