// ============================================================
// SYNC TYPES — KBM Percetakan
// ============================================================

export type SyncStatus = 'SYNCED' | 'PENDING' | 'SYNCING' | 'FAILED'

export type SyncEntityType =
  | 'ORDER'
  | 'KAS_MASUK'
  | 'KAS_KELUAR'
  | 'STATUS_ORDER'
  | 'VERIFIKASI'

export interface SyncLogItem {
  id: string
  entity_type: SyncEntityType
  title: string
  subtitle?: string
  status: SyncStatus
  action: string
  nominal?: number
  payload: Record<string, unknown>
  created_at: string
  synced_at?: string
  attempts: number
  error_message?: string
}

export interface SyncStats {
  percentage: number
  total: number
  synced: number
  pending: number
  failed: number
  is_online: boolean
  gas_latency_ms: number | null
  last_synced_at: string | null
}
