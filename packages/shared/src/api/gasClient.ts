import type { ApiResponse } from '../types'
import { useSyncStore } from '../stores/syncStore'

function tryLogSync(item: {
  entity_type: import('../types/sync').SyncEntityType
  title: string
  subtitle?: string
  status: import('../types/sync').SyncStatus
  action: string
  nominal?: number
  payload: Record<string, unknown>
  error_message?: string
}) {
  try {
    const syncStore = useSyncStore()
    syncStore.addLog(item)
  } catch {
    // Silently ignore if called before Pinia is installed
  }
}

function notifyNetworkStatus(isOnline: boolean) {
  try {
    const syncStore = useSyncStore()
    syncStore.setOnlineStatus(isOnline)
  } catch {
    // Silently ignore if called before Pinia is installed
  }
}

// ============================================================
// GAS API CLIENT
// Ganti GAS_URL setelah deploy Google Apps Script
// ============================================================

export const CONFIG = {
  GAS_URL: 'https://script.google.com/macros/s/AKfycbwGVC-HCtsQygsRgrAUSlF4V-IpU5pCHEojxO02tUWLMGq-Dz1CQHtVmV4MnNPzJYcFOA/exec',
  APP_NAME: 'KBM Percetakan',
}

// ---- Timeout helper ----
function withTimeout<T>(promise: Promise<T>, ms = 30000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), ms),
    ),
  ])
}

// ---- GET request ----
export async function gasGet<T = unknown>(
  action: string,
  params: Record<string, string | number | boolean> = {},
  timeoutMs = 30000,
): Promise<ApiResponse<T>> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    notifyNetworkStatus(false)
    return {
      success: false,
      error: 'Koneksi internet terputus (Offline)',
      isOffline: true,
    }
  }

  const url = new URL(CONFIG.GAS_URL)
  url.searchParams.set('action', action)
  if (action === 'ping') {
    url.searchParams.set('_t', String(Date.now()))
  }
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))

  try {
    const res = await withTimeout(
      fetch(url.toString(), {
        method: 'GET',
        redirect: 'follow',
      }),
      timeoutMs,
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    notifyNetworkStatus(true)
    return data
  } catch (err) {
    notifyNetworkStatus(false)
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine
    return {
      success: false,
      error: isOffline ? 'Koneksi internet terputus (Offline)' : (err instanceof Error ? err.message : 'Terjadi kesalahan jaringan'),
      isOffline: true,
    }
  }
}

// ---- POST request ----
export async function gasPost<T = unknown>(
  action: string,
  body: Record<string, unknown> = {},
  timeoutMs = 30000,
): Promise<ApiResponse<T>> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    notifyNetworkStatus(false)
    return {
      success: false,
      error: 'Koneksi internet terputus (Offline)',
      isOffline: true,
    }
  }

  try {
    const res = await withTimeout(
      fetch(CONFIG.GAS_URL, {
        method: 'POST',
        // Menggunakan text/plain;charset=utf-8 menghindari browser mengirim CORS preflight OPTIONS request
        // yang tidak didukung oleh Google Apps Script Web App
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ action, ...body }),
        redirect: 'follow',
      }),
      timeoutMs,
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    notifyNetworkStatus(true)
    return data
  } catch (err) {
    notifyNetworkStatus(false)
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine
    return {
      success: false,
      error: isOffline ? 'Koneksi internet terputus (Offline)' : (err instanceof Error ? err.message : 'Terjadi kesalahan jaringan'),
      isOffline: true,
    }
  }
}

// ---- Typed API helpers ----
export const api = {
  // Health & Ping (Super cepat & hemat kuota, dengan fallback cerdas jika GAS belum di-redeploy)
  ping: async () => {
    const res = await gasGet<{ message?: string; timestamp?: number }>('ping', {}, 8000)
    if (res.success) return res as ApiResponse<{ message: string; timestamp: number }>
    // Jika server GAS merespon pesan "Action tidak dikenal: ping", berarti server aktif dan terhubung!
    if (res.error && res.error.includes('Action tidak dikenal')) {
      return { success: true, message: 'pong', timestamp: Date.now() } as unknown as ApiResponse<{ message: string; timestamp: number }>
    }
    // Fallback: cek ke endpoint getClients yang sudah pasti ada di GAS deployment lama
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      const fallbackRes = await gasGet('getClients', {}, 8000)
      if (fallbackRes.success) {
        return { success: true, message: 'pong', timestamp: Date.now() } as unknown as ApiResponse<{ message: string; timestamp: number }>
      }
    }
    return res as ApiResponse<{ message: string; timestamp: number }>
  },


  // Orders
  getOrders: (params?: { status?: string; search?: string }) =>
    gasGet<import('../types').Order[]>('getOrders', params ?? {}),
  createOrder: async (order: Omit<import('../types').Order, 'id_order' | 'tanggal' | 'status_order'>) => {
    const res = await gasPost<{ id_order: string; nomor_invoice: string }>('createOrder', { order })
    tryLogSync({
      entity_type: 'ORDER',
      title: `Order: ${order.nama_penerbit} — ${order.judul_penulis}`,
      subtitle: `Oplah ${order.jml_pcs} pcs • ${order.ukuran}`,
      nominal: order.total_harga,
      status: res.success ? 'SYNCED' : 'FAILED',
      action: 'createOrder',
      payload: { order },
      error_message: res.error,
    })
    return res
  },
  updateOrderStatus: async (id_order: string, status: string) => {
    const res = await gasPost('updateOrderStatus', { id_order, status })
    tryLogSync({
      entity_type: 'ORDER',
      title: `Update Status: ${id_order}`,
      subtitle: `Status baru: ${status}`,
      nominal: 0,
      status: res.success ? 'SYNCED' : 'FAILED',
      action: 'updateOrderStatus',
      payload: { id_order, status },
      error_message: res.error,
    })
    return res
  },
  updateOrder: async (order: Partial<import('../types').Order> & { id_order: string }) => {
    const res = await gasPost<{ id_order: string }>('updateOrder', { order })
    tryLogSync({
      entity_type: 'ORDER',
      title: `Update Order: ${order.nama_penerbit || order.id_order}`,
      subtitle: `ID: ${order.id_order}`,
      nominal: order.total_harga || 0,
      status: res.success ? 'SYNCED' : 'FAILED',
      action: 'updateOrder',
      payload: { order },
      error_message: res.error,
    })
    return res
  },
  deleteOrder: async (id_order: string) => {
    const res = await gasPost<{ id_order: string }>('deleteOrder', { id_order })
    tryLogSync({
      entity_type: 'ORDER',
      title: `Batalkan Order: ${id_order}`,
      subtitle: `ID: ${id_order}`,
      nominal: 0,
      status: res.success ? 'SYNCED' : 'FAILED',
      action: 'deleteOrder',
      payload: { id_order },
      error_message: res.error,
    })
    return res
  },

  // Kas Masuk
  getKasMasuk: (params?: { status?: string; id_order?: string }) =>
    gasGet<import('../types').KasMasuk[]>('getKasMasuk', params ?? {}),
  createKasMasuk: async (data: {
    id_order: string | null
    jenis_pembayaran: string
    nominal: number
    metode: string
    diinput_oleh: string
    keterangan?: string
    foto_base64?: string
    foto_filename?: string
    nama_penerbit?: string
    tanggal?: string
    status_verifikasi?: string
  }) => {
    const res = await gasPost<{ id_kas_masuk: string }>('createKasMasuk', data)
    tryLogSync({
      entity_type: 'KAS_MASUK',
      title: `Kas Masuk: ${data.jenis_pembayaran} (${data.metode})`,
      subtitle: data.keterangan || (data.nama_penerbit ? `Penerbit ${data.nama_penerbit}` : data.id_order ? `Order ${data.id_order}` : 'Non-Order'),
      nominal: data.nominal,
      status: res.success ? 'SYNCED' : 'FAILED',
      action: 'createKasMasuk',
      payload: data as any,
      error_message: res.error,
    })
    return res
  },
  verifyKasMasuk: async (id_kas_masuk: string, verified_by: string) => {
    const res = await gasPost('verifyKasMasuk', { id_kas_masuk, verified_by })
    tryLogSync({
      entity_type: 'VERIFIKASI',
      title: `Verifikasi Kas Masuk: ${id_kas_masuk}`,
      subtitle: `Diverifikasi oleh ${verified_by}`,
      status: res.success ? 'SYNCED' : 'FAILED',
      action: 'verifyKasMasuk',
      payload: { id_kas_masuk, verified_by },
      error_message: res.error,
    })
    return res
  },
  updateKasMasuk: (data: {
    id_kas_masuk: string
    tanggal?: string
    nominal?: number
    metode?: string
    keterangan?: string
    nama_penerbit?: string
    jenis_pembayaran?: string
  }) => gasPost<{ success: boolean; message?: string }>('updateKasMasuk', data),
  deleteKasMasuk: (id_kas_masuk: string) =>
    gasPost<{ success: boolean; message?: string }>('deleteKasMasuk', { id_kas_masuk }),

  // Kas Keluar
  getKasKeluar: (params?: { periode?: string }) =>
    gasGet<import('../types').KasKeluar[]>('getKasKeluar', params ?? {}),
  createKasKeluar: async (data: {
    tanggal?: string
    kategori: string
    rincian: string
    nominal: number
    sumber_kas: string
    diinput_oleh: string
    foto_base64?: string
    foto_filename?: string
  }) => {
    const res = await gasPost<{ id_kas_keluar: string }>('createKasKeluar', data)
    tryLogSync({
      entity_type: 'KAS_KELUAR',
      title: `Kas Keluar: ${data.kategori}`,
      subtitle: data.rincian,
      nominal: data.nominal,
      status: res.success ? 'SYNCED' : 'FAILED',
      action: 'createKasKeluar',
      payload: data as any,
      error_message: res.error,
    })
    return res
  },
  updateKasKeluar: (data: {
    id_kas_keluar: string
    tanggal?: string
    kategori?: string
    rincian?: string
    nominal?: number
    sumber_kas?: string
    penerima?: string
  }) => gasPost<{ success: boolean; message?: string }>('updateKasKeluar', data),
  deleteKasKeluar: (id_kas_keluar: string) =>
    gasPost<{ success: boolean; message?: string }>('deleteKasKeluar', { id_kas_keluar }),

  // Laporan
  getSummaryReport: (periode: string) =>
    gasGet<import('../types').SummaryReport>('getSummaryReport', { periode }),

  // Invoice
  savePDFtoDrive: (pdf_base64: string, id_order: string, nomor_invoice: string) =>
    gasPost<{ file_id: string; drive_url: string }>('savePDFtoDrive', {
      pdf_base64,
      id_order,
      nomor_invoice,
    }),

  // Clients
  getClients: () =>
    gasGet<import('../types').Client[]>('getClients'),

  // Reset & Maintenance
  resetData: (payload: {
    pin?: string
    confirmation?: string
    reset_orders?: boolean
    reset_kas_masuk?: boolean
    reset_kas_keluar?: boolean
    reset_clients?: boolean
    reset_all?: boolean
  }) => gasPost<{ cleared: string[] }>('resetData', payload),
}
