import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { SyncLogItem, SyncStatus, SyncEntityType } from '../types/sync'
import { api, CONFIG } from '../api/gasClient'

const STORAGE_KEY = 'kbm_sync_queue_v1'

export const useSyncStore = defineStore('sync', () => {
  const logs = ref<SyncLogItem[]>(loadLogsFromStorage())
  const isSyncingAll = ref(false)
  const isCheckingHealth = ref(false)
  const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const gasLatencyMs = ref<number | null>(null)
  const lastSyncedAt = ref<string | null>(loadLastSyncedAt())

  // Listeners for network status
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      isOnline.value = true
      checkServerHealth()
      // Auto-trigger sync when network recovers
      syncAllPending()
    })
    window.addEventListener('offline', () => {
      isOnline.value = false
      gasLatencyMs.value = null
    })

    // Local check every 2 seconds (0 network bytes, 0 GAS quota) for instant offline detection
    setInterval(() => {
      if (typeof navigator !== 'undefined' && !navigator.onLine && isOnline.value) {
        isOnline.value = false
        gasLatencyMs.value = null
      }
    }, 2000)

    // Check health when tab regains focus
    window.addEventListener('focus', () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        isOnline.value = false
        gasLatencyMs.value = null
      } else {
        checkServerHealth()
      }
    })
  }

  function setOnlineStatus(status: boolean) {
    isOnline.value = status
    if (!status) {
      gasLatencyMs.value = null
    }
  }

  // ---- Getters ----
  const totalCount = computed(() => logs.value.length)
  const syncedCount = computed(
    () => logs.value.filter((l) => l.status === 'SYNCED').length,
  )
  const pendingCount = computed(
    () => logs.value.filter((l) => l.status === 'PENDING' || l.status === 'SYNCING').length,
  )
  const failedCount = computed(
    () => logs.value.filter((l) => l.status === 'FAILED').length,
  )

  const syncPercentage = computed(() => {
    if (totalCount.value === 0) return 100
    return Math.round((syncedCount.value / totalCount.value) * 100)
  })

  const isAllSynced = computed(() => pendingCount.value === 0 && failedCount.value === 0)

  // ---- Storage Helpers ----
  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs.value))
    } catch (e) {
      console.warn('Failed to persist sync logs to localStorage:', e)
    }
  }

  function loadLogsFromStorage(): SyncLogItem[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (e) {
      console.warn('Failed to load sync logs from localStorage:', e)
    }

    // Default initial seed records so user sees realistic data right away
    const now = new Date()
    return [
      {
        id: 'sync_init_002',
        entity_type: 'ORDER',
        title: 'Order: BUKU KAKU — Rasyiqi',
        subtitle: 'Oplah 100 pcs • A5 Bookpaper 55g',
        nominal: 150000,
        status: 'SYNCED',
        action: 'createOrder',
        payload: { id_order: 'ORD-202609-002', nama_penerbit: 'BUKU KAKU' },
        created_at: now.toISOString(),
        synced_at: now.toISOString(),
        attempts: 1,
      },
      {
        id: 'sync_init_001',
        entity_type: 'ORDER',
        title: 'Order: dsdsds — dsdsds',
        subtitle: 'Oplah 100 pcs • A5 Bookpaper 57.5g',
        nominal: 150000,
        status: 'SYNCED',
        action: 'createOrder',
        payload: { id_order: 'ORD-202609-001' },
        created_at: new Date(now.getTime() - 1000 * 60 * 30).toISOString(),
        synced_at: new Date(now.getTime() - 1000 * 60 * 29).toISOString(),
        attempts: 1,
      },
    ]
  }

  function loadLastSyncedAt(): string | null {
    try {
      return localStorage.getItem('kbm_last_synced_at')
    } catch {
      return null
    }
  }

  function recordLastSynced() {
    const time = new Date().toISOString()
    lastSyncedAt.value = time
    try {
      localStorage.setItem('kbm_last_synced_at', time)
    } catch {}
  }

  // ---- Actions ----
  function addLog(item: {
    entity_type: SyncEntityType
    title: string
    subtitle?: string
    status: SyncStatus
    action: string
    nominal?: number
    payload: Record<string, unknown>
    error_message?: string
  }): string {
    const id = `sync_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const now = new Date().toISOString()

    const newLog: SyncLogItem = {
      id,
      entity_type: item.entity_type,
      title: item.title,
      subtitle: item.subtitle,
      nominal: item.nominal,
      status: item.status,
      action: item.action,
      payload: item.payload,
      created_at: now,
      synced_at: item.status === 'SYNCED' ? now : undefined,
      attempts: item.status === 'SYNCED' ? 1 : 0,
      error_message: item.error_message,
    }

    logs.value.unshift(newLog)
    if (item.status === 'SYNCED') recordLastSynced()
    saveToStorage()
    return id
  }

  function updateLog(id: string, updates: Partial<SyncLogItem>) {
    const idx = logs.value.findIndex((l) => l.id === id)
    if (idx !== -1) {
      logs.value[idx] = { ...logs.value[idx], ...updates }
      if (updates.status === 'SYNCED') recordLastSynced()
      saveToStorage()
    }
  }

  function removeLog(id: string) {
    logs.value = logs.value.filter((l) => l.id !== id)
    saveToStorage()
  }

  function clearSuccessfulLogs() {
    logs.value = logs.value.filter((l) => l.status !== 'SYNCED')
    saveToStorage()
  }

  async function checkServerHealth(): Promise<number | null> {
    if (isCheckingHealth.value) return gasLatencyMs.value
    isCheckingHealth.value = true
    const start = performance.now()
    try {
      const res = await api.ping()
      if (res.success || (res as any).data || (res.error && res.error.includes('Action tidak dikenal'))) {
        const ms = Math.round(performance.now() - start)
        gasLatencyMs.value = ms
        isOnline.value = true
        return ms
      } else {
        const browserOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
        if (browserOnline && !res.isOffline) {
          isOnline.value = true
          return null
        }
        isOnline.value = false
        gasLatencyMs.value = null
        return null
      }
    } catch (e) {
      console.warn('Health check failed:', e)
      const browserOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
      if (browserOnline) {
        isOnline.value = true
      } else {
        isOnline.value = false
      }
      gasLatencyMs.value = null
      return null
    } finally {
      isCheckingHealth.value = false
    }
  }

  async function retrySync(id: string): Promise<boolean> {
    const item = logs.value.find((l) => l.id === id)
    if (!item) return false

    updateLog(id, { status: 'SYNCING', attempts: item.attempts + 1 })

    try {
      let res: { success: boolean; error?: string } = { success: false }

      switch (item.action) {
        case 'createOrder': {
          const orderData = item.payload.order as any
          const createRes = await api.createOrder(orderData)
          res = createRes
          if (createRes.success && createRes.data && item.payload.temp_id_order) {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('kbm_order_synced', {
                  detail: {
                    temp_id: item.payload.temp_id_order,
                    real_id: createRes.data.id_order,
                    nomor_invoice: createRes.data.nomor_invoice,
                  },
                }),
              )
            }
          }
          break
        }
        case 'createKasMasuk': {
          const kmRes = await api.createKasMasuk(item.payload as any)
          res = kmRes
          if (kmRes.success && kmRes.data && item.payload.temp_id_kas_masuk) {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('kbm_kas_masuk_synced', {
                  detail: {
                    temp_id: item.payload.temp_id_kas_masuk,
                    real_id: kmRes.data.id_kas_masuk,
                  },
                }),
              )
            }
          }
          break
        }
        case 'createKasKeluar': {
          res = await api.createKasKeluar(item.payload as any)
          break
        }
        case 'updateOrderStatus': {
          const { id_order, status } = item.payload as any
          res = await api.updateOrderStatus(id_order, status)
          break
        }
        case 'verifyKasMasuk': {
          const { id_kas_masuk, verified_by } = item.payload as any
          res = await api.verifyKasMasuk(id_kas_masuk, verified_by)
          break
        }
        default:
          res = { success: true }
      }

      if (res.success) {
        updateLog(id, {
          status: 'SYNCED',
          synced_at: new Date().toISOString(),
          error_message: undefined,
        })
        return true
      } else {
        updateLog(id, {
          status: 'FAILED',
          error_message: res.error || 'Server menolak transaksi',
        })
        return false
      }
    } catch (err: any) {
      updateLog(id, {
        status: 'FAILED',
        error_message: err?.message || 'Gagal tersambung ke jaringan',
      })
      return false
    }
  }

  async function syncAllPending() {
    if (isSyncingAll.value) return
    isSyncingAll.value = true

    try {
      const pendingItems = logs.value.filter(
        (l) => l.status === 'PENDING' || l.status === 'FAILED',
      )

      for (const item of pendingItems) {
        await retrySync(item.id)
      }
      await checkServerHealth()
    } finally {
      isSyncingAll.value = false
    }
  }

  return {
    logs,
    isSyncingAll,
    isCheckingHealth,
    isOnline,
    gasLatencyMs,
    lastSyncedAt,
    totalCount,
    syncedCount,
    pendingCount,
    failedCount,
    syncPercentage,
    isAllSynced,
    addLog,
    updateLog,
    removeLog,
    clearSuccessfulLogs,
    checkServerHealth,
    setOnlineStatus,
    retrySync,
    syncAllPending,
  }
})
