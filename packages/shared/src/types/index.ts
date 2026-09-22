// ============================================================
// TYPES — KBM Percetakan System
// ============================================================

export type StatusOrder = 'PROSES' | 'SELESAI' | 'BATAL'
export type JenisPembayaran = 'DP' | 'PELUNASAN' | 'NON_ORDER' | 'DEPOSIT'
export type MetodeBayar = 'KASIR_TUNAI' | 'BANK_BCA' | 'QRIS' | 'SALDO_DEPOSIT'
export type StatusVerifikasi = 'PENDING' | 'VERIFIED'
export type KategoriKasKeluar =
  | 'BAHAN_BAKU'
  | 'OPERASIONAL'
  | 'GAJI'
  | 'KONSUMSI'
  | 'LAIN_LAIN'
export type SumberKas = 'KASIR_TUNAI' | 'BANK_BCA' | 'QRIS'
export type UkuranBuku = 'A6' | 'A5' | 'B5' | 'A4' | 'CUSTOM'
export type JenisKertas =
  | 'BP_57'
  | 'BP_72'
  | 'HVS_70'
  | 'HVS_80'
  | 'BOOKPAPER_55G'
  | 'BOOKPAPER_57.5G'
  | 'HVS_70G'
  | 'HVS_80G'
  | 'ART_PAPER_120G'
  | 'ART_CARTON_210G'
  | 'LAIN_LAIN'
export type JenisFinishing =
  | 'SOFT_COVER'
  | 'HARD_COVER'
  | 'LAMINASI_DOFF'
  | 'LAMINASI_GLOSSY'
  | 'SHRINK_WRAP'
  | 'SPIRAL'
  | 'JILID_LEM'
  | 'BINDING_POTONG'
  | 'PACKING_DUS'
  | 'PACKING_DUS_KECIL'
  | 'PACKING_DUS_BESAR'

// ---- Entitas Utama ----

export interface Order {
  id_order: string          // ORD-202609-001
  tanggal: string           // ISO date string
  nama_penerbit: string
  judul_penulis: string     // "Judul Buku / Nama Penulis"
  judul_buku?: string
  nama_penulis?: string
  jml_pcs: number
  ukuran: UkuranBuku
  ukuran_custom?: string    // jika CUSTOM
  kertas: JenisKertas
  kertas_bw?: JenisKertas   // Kertas khusus halaman BW (jika berbeda)
  kertas_fc?: JenisKertas   // Kertas khusus halaman FC (jika berbeda)
  cetak_bw: number          // jumlah halaman BW
  cetak_fc: number          // jumlah halaman FC
  finishing: JenisFinishing[]
  packing_dus_tipe?: 'DUS_KECIL' | 'DUS_BESAR' | null
  packing_dus_qty?: number
  biaya_packing?: number
  total_harga: number
  status_order: StatusOrder
  catatan?: string
  alamat_penerbit?: string
  kontak_penerbit?: string
  link_bukti?: string       // Google Drive view URL
}

export interface KasMasuk {
  id_kas_masuk: string      // KM-202609-001
  tanggal: string
  id_order: string | null   // null jika NON_ORDER
  jenis_pembayaran: JenisPembayaran
  nominal: number
  metode: MetodeBayar
  diinput_oleh: string      // 'KASIR' | 'FINANCE' | 'OWNER'
  status_verifikasi: StatusVerifikasi
  file_id_bukti?: string    // Google Drive file ID
  link_bukti?: string       // Google Drive view URL
  nama_penerbit?: string    // denormalized untuk display
  keterangan?: string
}

export interface KasKeluar {
  id_kas_keluar: string     // KK-202609-001
  tanggal: string
  kategori: KategoriKasKeluar
  rincian: string
  nominal: number
  sumber_kas: SumberKas
  diinput_oleh: string
  file_id_nota?: string     // Google Drive file ID
  link_nota?: string        // Google Drive view URL
}

export interface Client {
  nama_penerbit: string
  kontak?: string
  alamat?: string
}

// ---- API Types ----

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  isOffline?: boolean
  _cached?: boolean
}

export interface AuthPayload {
  role: 'KASIR' | 'OWNER' | 'FINANCE'
  nama: string
}

export interface SummaryReport {
  kas_masuk_bulan_ini: number
  kas_keluar_bulan_ini: number
  estimasi_laba: number
  total_piutang: number
  kas_per_sumber: {
    kasir_tunai: number
    bank_bca: number
    qris: number
  }
  chart_data: ChartDataPoint[]
}

export interface ChartDataPoint {
  bulan: string       // "2026-09"
  kas_masuk: number
  kas_keluar: number
}

// ---- Piutang (computed) ----

export interface PiutangRow {
  order: Order
  total_masuk_verified: number
  total_masuk?: number
  has_pending?: boolean
  sisa_tagihan: number
  status_bayar: 'LUNAS' | 'DP' | 'KURANG_BAYAR' | 'BELUM_BAYAR'
}

// ---- Invoice ----

export interface InvoiceData {
  nomor_invoice: string    // INV-202609-001
  order: Order
  pembayaran_list: KasMasuk[]
  total_masuk: number
  sisa_tagihan: number
  tanggal_invoice: string
  nama_percetakan: string
  alamat_percetakan: string
  no_rekening: string
}

// ---- Filter Tanggal & Periode ----

export type DateFilterMode = 'ALL' | 'TODAY' | 'MONTH' | 'YEAR' | 'RANGE' | 'CUSTOM_DATE'

export interface DateFilterValue {
  mode: DateFilterMode
  startDate?: string // 'YYYY-MM-DD'
  endDate?: string   // 'YYYY-MM-DD'
  month?: string     // 'YYYY-MM'
  year?: string      // 'YYYY'
  label?: string     // Human-readable summary (e.g. "Bulan Ini", "20 Sep 2026", "1-20 Sep 2026")
}

export * from './sync'
