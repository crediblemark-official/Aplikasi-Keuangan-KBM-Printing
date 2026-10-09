import type { KategoriKasKeluar, SumberKas, JenisPembayaran, StatusOrder, MetodeBayar } from '../types'

export interface KategoriOption {
  value: KategoriKasKeluar
  label: string
  shortLabel: string
}

export const KATEGORI_KAS_KELUAR_OPTIONS: KategoriOption[] = [
  { value: 'BAHAN_BAKU', label: 'Bahan Baku Kertas', shortLabel: 'Bahan Baku' },
  { value: 'OPERASIONAL', label: 'Operasional / Listrik', shortLabel: 'Operasional' },
  { value: 'GAJI', label: 'Gaji & Lembur', shortLabel: 'Gaji' },
  { value: 'KONSUMSI', label: 'Konsumsi', shortLabel: 'Konsumsi' },
  { value: 'REFUND', label: 'Refund / Pengembalian Dana', shortLabel: 'Refund' },
  { value: 'LAIN_LAIN', label: 'Lain-lain', shortLabel: 'Lain-lain' },
]

export interface SumberKasOption {
  value: SumberKas
  label: string
  icon?: string
}

export const SUMBER_KAS_OPTIONS: SumberKasOption[] = [
  { value: 'KASIR_TUNAI', label: 'Kasir Tunai', icon: '💵' },
  { value: 'BANK', label: 'Bank Transfer', icon: '🏦' },
  { value: 'QRIS', label: 'QRIS', icon: '📱' },
]

export interface JenisPembayaranOption {
  value: JenisPembayaran
  label: string
}

export const JENIS_PEMBAYARAN_OPTIONS: JenisPembayaranOption[] = [
  { value: 'DP', label: 'Uang Muka (DP)' },
  { value: 'PELUNASAN', label: 'Pelunasan' },
  { value: 'DEPOSIT', label: 'Deposit Saldo' },
  { value: 'NON_ORDER', label: 'Non-Order / Lainnya' },
]

export interface StatusOrderOption {
  value: StatusOrder
  label: string
}

export const STATUS_ORDER_OPTIONS: StatusOrderOption[] = [
  { value: 'PROSES', label: 'Proses Cetak' },
  { value: 'SELESAI', label: 'Selesai' },
  { value: 'BATAL', label: 'Dibatalkan' },
]
