import type { UkuranBuku, JenisKertas, JenisFinishing } from '../types'

// ============================================================
// PRICELIST RESMI — KBM Percetakan
// Berdasarkan Dokumen Resmi "Harga Orderan"
// ============================================================

export interface PriceCalcInput {
  jml_pcs: number
  ukuran: UkuranBuku
  kertas: JenisKertas
  kertas_bw?: JenisKertas
  kertas_fc?: JenisKertas
  cetak_bw: number
  cetak_fc: number
  finishing: JenisFinishing[]
  packing_dus_tipe?: 'DUS_KECIL' | 'DUS_BESAR' | null
  packing_dus_qty?: number
}

export interface PriceCalcResult {
  harga_per_pcs: number
  biaya_cetak_bw_per_pcs: number
  biaya_cetak_fc_per_pcs: number
  biaya_finishing_per_pcs: number
  diskon_finishing_persen: number
  biaya_packing_total: number
  total_harga: number
}

/**
 * 1. Tarif Cetak BW per halaman (Rp/hal)
 */
export function getTarifBWPerHalaman(ukuran: UkuranBuku, kertas: JenisKertas): number {
  const isA6 = ukuran === 'A6'
  const isA4orB5 = ukuran === 'A4' || ukuran === 'B5'
  const isHeavyPaper =
    kertas === 'BP_72' ||
    kertas === 'HVS_80' ||
    kertas === 'HVS_80G' ||
    kertas === 'ART_CARTON_210G'

  if (isA6) {
    return 40 // A6: BP 57/72 - Hvs 70/80 = Rp 40
  }

  if (isA4orB5) {
    // B5 / A4: BP 57 - Hvs 70 = Rp 150 | BP 72 - Hvs 80 = Rp 160
    return isHeavyPaper ? 160 : 150
  }

  // Default A5 / Unesco / CUSTOM:
  // BP 57 - Hvs 70 = Rp 75 | BP 72 - Hvs 80 = Rp 80
  return isHeavyPaper ? 80 : 75
}

/**
 * 2. Tarif Cetak FC per halaman (Rp/hal)
 */
export function getTarifFCPerHalaman(ukuran: UkuranBuku, kertas: JenisKertas): number {
  const isA6 = ukuran === 'A6'
  const isA4orB5 = ukuran === 'A4' || ukuran === 'B5'
  const isHvsPaper =
    kertas === 'HVS_70' ||
    kertas === 'HVS_80' ||
    kertas === 'HVS_70G' ||
    kertas === 'HVS_80G'

  if (isA6) {
    return 188 // A6: BP 57/72 - Hvs 70/80 = Rp 188
  }

  if (isA4orB5) {
    // B5 / A4: BP 57 - BP 72 = Rp 750 | Hvs 70 - Hvs 80 = Rp 625
    return isHvsPaper ? 625 : 750
  }

  // Default A5 / Unesco / CUSTOM:
  // BP 57 - BP 72 = Rp 375 | Hvs 70 - Hvs 80 = Rp 313
  return isHvsPaper ? 313 : 375
}

/**
 * 3. Tarif Finishing Soft Cover (Cover + Laminasi + Binding + Shrink) per pcs
 */
export function getTarifSoftCover(ukuran: UkuranBuku, totalHalaman: number): number {
  const isA4orB5 = ukuran === 'A4' || ukuran === 'B5'

  if (isA4orB5) {
    if (totalHalaman <= 150) return 9000
    if (totalHalaman <= 200) return 9750
    if (totalHalaman <= 400) return 10500
    if (totalHalaman <= 500) return 11250
    if (totalHalaman <= 600) return 12000
    if (totalHalaman <= 700) return 12750
    return 13500
  }

  // A5 / Unesco / A6 / Custom
  if (totalHalaman <= 150) return 6000
  if (totalHalaman <= 200) return 6500
  if (totalHalaman <= 400) return 7000
  if (totalHalaman <= 500) return 7500
  if (totalHalaman <= 600) return 8000
  if (totalHalaman <= 700) return 8500
  return 9000
}

/**
 * 4. Tarif Finishing Hard Cover (Cover + Laminasi + Binding + Shrink + Pita) per pcs
 */
export function getTarifHardCover(ukuran: UkuranBuku, totalHalaman: number): number {
  const isA4orB5 = ukuran === 'A4' || ukuran === 'B5'
  const baseA5 = totalHalaman <= 500 ? 15000 : 18000
  return isA4orB5 ? Math.round(baseA5 * 1.5) : baseA5
}

/**
 * 5. Tarif Binding + Potong per pcs (Berdasarkan Tabel Excel)
 */
export function getTarifBindingPotong(ukuran: UkuranBuku, totalHalaman: number): number {
  const isA4orB5 = ukuran === 'A4' || ukuran === 'B5'
  if (totalHalaman <= 100) return isA4orB5 ? 600 : 500
  if (totalHalaman <= 150) return isA4orB5 ? 650 : 550
  if (totalHalaman <= 200) return isA4orB5 ? 700 : 600
  if (totalHalaman <= 250) return isA4orB5 ? 750 : 650
  if (totalHalaman <= 300) return isA4orB5 ? 800 : 700
  if (totalHalaman <= 400) return isA4orB5 ? 850 : 750
  if (totalHalaman <= 450) return isA4orB5 ? 950 : 800
  if (totalHalaman <= 500) return isA4orB5 ? 1150 : 850
  if (totalHalaman <= 550) return isA4orB5 ? 1250 : 900
  if (totalHalaman <= 600) return isA4orB5 ? 1350 : 950
  if (totalHalaman <= 650) return isA4orB5 ? 1550 : 1000
  if (totalHalaman <= 700) return isA4orB5 ? 1750 : 1050
  return isA4orB5 ? 1950 : 1100
}

/**
 * 6. Diskon Finishing Berdasarkan Jumlah Cetak (Oplah)
 * Keterangan: Cover cetak Offset + minimal 200 hal
 */
export function getDiskonFinishing(jmlPcs: number, totalHalaman: number): number {
  if (totalHalaman >= 200) {
    if (jmlPcs >= 1000) return 0.8 // Diskon 80%
    if (jmlPcs >= 500) return 0.5 // Diskon 50%
    if (jmlPcs >= 300) return 0.25 // Diskon 25%
  }
  return 0
}

/**
 * Kalkulasi Rinci Harga Order
 */
export function calculateOrderPriceDetailed(input: PriceCalcInput): PriceCalcResult {
  const { jml_pcs, ukuran, kertas, cetak_bw, cetak_fc, finishing } = input

  if (jml_pcs <= 0) {
    return {
      harga_per_pcs: 0,
      biaya_cetak_bw_per_pcs: 0,
      biaya_cetak_fc_per_pcs: 0,
      biaya_finishing_per_pcs: 0,
      diskon_finishing_persen: 0,
      biaya_packing_total: 0,
      total_harga: 0,
    }
  }

  const bwPages = Math.max(0, cetak_bw || 0)
  const fcPages = Math.max(0, cetak_fc || 0)
  const totalHalaman = bwPages + fcPages

  // Dukungan 2 jenis kertas dalam 1 buku: kertas BW & kertas Warna (FC)
  const paperBW = input.kertas_bw || input.kertas
  const paperFC = input.kertas_fc || input.kertas

  // Biaya cetak per halaman per pcs
  const tarifBW = getTarifBWPerHalaman(ukuran, paperBW)
  const tarifFC = getTarifFCPerHalaman(ukuran, paperFC)

  const biaya_cetak_bw_per_pcs = bwPages * tarifBW
  const biaya_cetak_fc_per_pcs = fcPages * tarifFC

  // Biaya finishing per pcs (tanpa packing dus)
  let baseFinishingPerPcs = 0

  if (finishing.includes('HARD_COVER')) {
    baseFinishingPerPcs += getTarifHardCover(ukuran, totalHalaman)
  } else if (finishing.includes('SOFT_COVER')) {
    baseFinishingPerPcs += getTarifSoftCover(ukuran, totalHalaman)
  } else if (finishing.includes('BINDING_POTONG')) {
    baseFinishingPerPcs += getTarifBindingPotong(ukuran, totalHalaman)
  }

  // Tambahan laminasi jika dipilih terpisah
  if (finishing.includes('LAMINASI_DOFF') || finishing.includes('LAMINASI_GLOSSY')) {
    if (!finishing.includes('SOFT_COVER') && !finishing.includes('HARD_COVER')) {
      baseFinishingPerPcs += 1500
    }
  }

  // Diskon finishing buku berdasarkan oplah (syarat: cover offset + min 200 hal)
  const diskonPersen = getDiskonFinishing(jml_pcs, totalHalaman)
  const biaya_finishing_per_pcs = Math.round(baseFinishingPerPcs * (1 - diskonPersen))

  // Biaya packing dus: dihitung berdasarkan kuantitas dus yang dibutuhkan (misal: 20 dus)
  let biaya_packing_total = 0
  const qtyDus = Math.max(0, input.packing_dus_qty || 0)

  if (input.packing_dus_tipe === 'DUS_BESAR') {
    biaya_packing_total = qtyDus * 10000
  } else if (input.packing_dus_tipe === 'DUS_KECIL') {
    biaya_packing_total = qtyDus * 5000
  } else if (finishing.includes('PACKING_DUS_BESAR')) {
    // Estimasi otomatis jika dipilih via checklist tanpa qty
    const autoQty = qtyDus > 0 ? qtyDus : Math.max(1, Math.ceil(jml_pcs / 100))
    biaya_packing_total = autoQty * 10000
  } else if (finishing.includes('PACKING_DUS') || finishing.includes('PACKING_DUS_KECIL')) {
    const autoQty = qtyDus > 0 ? qtyDus : Math.max(1, Math.ceil(jml_pcs / 100))
    biaya_packing_total = autoQty * 5000
  }

  // Total per buku / pcs
  const harga_per_pcs = biaya_cetak_bw_per_pcs + biaya_cetak_fc_per_pcs + biaya_finishing_per_pcs
  const total_harga = Math.round(harga_per_pcs * jml_pcs) + biaya_packing_total

  return {
    harga_per_pcs,
    biaya_cetak_bw_per_pcs,
    biaya_cetak_fc_per_pcs,
    biaya_finishing_per_pcs,
    diskon_finishing_persen: Math.round(diskonPersen * 100),
    biaya_packing_total,
    total_harga,
  }
}

/**
 * Helper ringkas untuk mendapatkan total harga (number)
 */
export function calcOrderPrice(input: PriceCalcInput): number {
  return calculateOrderPriceDetailed(input).total_harga
}
