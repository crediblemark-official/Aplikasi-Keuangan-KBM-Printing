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
  PIN_KEY: 'kbm_pin_session',
  PASSWORD_KEY: 'kbm_pwd_session',
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
  // Health & Ping (Super cepat & hemat kuota)
  ping: () =>
    gasGet<{ message: string; timestamp: number }>('ping', {}, 4000),

  // Auth
  validatePin: (pin: string) =>
    gasPost<{ role: string; nama: string }>('validatePin', { pin }),
  validatePassword: (password: string) =>
    gasPost<{ role: string; nama: string }>('validatePassword', { password }),

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
      entity_type: 'STATUS_ORDER',
      title: `Update Status: ${id_order}`,
      subtitle: `Status diubah menjadi ${status}`,
      status: res.success ? 'SYNCED' : 'FAILED',
      action: 'updateOrderStatus',
      payload: { id_order, status },
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
  }) => {
    const res = await gasPost<{ id_kas_masuk: string }>('createKasMasuk', data)
    tryLogSync({
      entity_type: 'KAS_MASUK',
      title: `Kas Masuk: ${data.jenis_pembayaran} (${data.metode})`,
      subtitle: data.keterangan || (data.id_order ? `Order ${data.id_order}` : 'Non-Order'),
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

  // Kas Keluar
  getKasKeluar: (params?: { periode?: string }) =>
    gasGet<import('../types').KasKeluar[]>('getKasKeluar', params ?? {}),
  createKasKeluar: async (data: {
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
