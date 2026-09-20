// ============================================================
// FORMATTERS — Utility functions
// ============================================================

/**
 * Format angka ke format Rupiah Indonesia
 * @example formatRupiah(5000000) → "Rp 5.000.000"
 */
export function formatRupiah(nominal: number, withPrefix = true): string {
  const formatted = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(nominal)
  return withPrefix ? `Rp ${formatted}` : formatted
}

/**
 * Format ISO date string ke tanggal Indonesia
 * @example formatTanggal("2026-09-19") → "19 Sep 2026"
 */
export function formatTanggal(dateStr: string): string {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

/**
 * Format datetime ke format pendek
 * @example formatDatetime("2026-09-19T10:30:00") → "19 Sep 2026, 10:30"
 */
export function formatDatetime(dateStr: string): string {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/**
 * Parse string rupiah ke angka
 * @example parseRupiah("Rp 5.000.000") → 5000000
 */
export function parseRupiah(str: string): number {
  return parseInt(str.replace(/[^\d]/g, ''), 10) || 0
}

/**
 * Get current date as YYYY-MM-DD
 */
export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Get current month as YYYY-MM
 */
export function getCurrentPeriode(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Format metode bayar untuk display
 */
export function formatMetode(metode: string): string {
  const map: Record<string, string> = {
    KASIR_TUNAI: '💵 Tunai',
    TUNAI: '💵 Tunai',
    BANK_BCA: '🏦 Bank',
    BANK: '🏦 Bank',
    TRANSFER: '🏦 Bank',
    QRIS: '📱 QRIS',
  }
  return map[metode] ?? (metode === 'BANK_BCA' ? '🏦 Bank' : metode)
}

/**
 * Format kategori kas keluar untuk display
 */
export function formatKategori(kategori: string): string {
  const map: Record<string, string> = {
    BAHAN_BAKU: 'Bahan Baku Kertas',
    OPERASIONAL: 'Operasional / Listrik',
    GAJI: 'Gaji & Lembur',
    KONSUMSI: 'Konsumsi',
    LAIN_LAIN: 'Lain-lain',
  }
  return map[kategori] ?? kategori
}

/**
 * Format jenis kertas untuk display
 */
export function formatKertas(kertas: string): string {
  const map: Record<string, string> = {
    BP_57: 'Bookpaper 57g (BP 57)',
    BP_72: 'Bookpaper 72g (BP 72)',
    HVS_70: 'HVS 70g Putih',
    HVS_80: 'HVS 80g Putih',
    BOOKPAPER_55G: 'Bookpaper 55g',
    'BOOKPAPER_57.5G': 'Bookpaper 57.5g',
    HVS_70G: 'HVS 70g Putih',
    HVS_80G: 'HVS 80g Putih',
    ART_PAPER_120G: 'Art Paper 120g',
    ART_CARTON_210G: 'Art Carton 210g',
    LAIN_LAIN: 'Kertas Khusus',
  }
  return map[kertas] ?? kertas
}

/**
 * Format finishing array untuk display
 */
export function formatFinishing(finishing: string[]): string {
  const map: Record<string, string> = {
    SOFT_COVER: 'Soft Cover',
    HARD_COVER: 'Hard Cover',
    BINDING_POTONG: 'Binding + Potong Rapi',
    LAMINASI_DOFF: 'Laminasi Doff',
    LAMINASI_GLOSSY: 'Laminasi Glossy',
    PACKING_DUS: 'Packing Dus',
    PACKING_DUS_KECIL: 'Dus Kecil',
    PACKING_DUS_BESAR: 'Dus Besar',
    SHRINK_WRAP: 'Shrink Wrap',
    SPIRAL: 'Spiral',
    JILID_LEM: 'Jilid Lem Panas',
  }
  return finishing.map((f) => map[f] ?? f).join(', ')
}

/**
 * Hitung persentase DP
 */
export function hitungPersentaseDP(nominal: number, total: number): number {
  if (total === 0) return 0
  return Math.round((nominal / total) * 100)
}

/**
 * Hitung status piutang
 */
export function hitungStatusBayar(
  totalMasuk: number,
  totalHarga: number,
): 'LUNAS' | 'DP' | 'KURANG_BAYAR' | 'BELUM_BAYAR' {
  if (totalMasuk <= 0) return 'BELUM_BAYAR'
  if (totalMasuk >= totalHarga) return 'LUNAS'
  return 'DP'
}
