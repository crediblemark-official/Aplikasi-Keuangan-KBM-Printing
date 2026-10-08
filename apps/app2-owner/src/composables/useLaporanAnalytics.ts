import { computed, type Ref } from 'vue'
import {
  formatRupiah,
  formatKategori,
  formatMetode,
  isDateInFilterRange,
} from '@shared/utils/formatters'
import type { KasMasuk, KasKeluar, DateFilterValue } from '@shared/types'

export const kategoriColorMap: Record<string, string> = {
  BAHAN_BAKU: '#059669', // Emerald
  OPERASIONAL: '#0284c7', // Sky
  GAJI: '#6366f1', // Indigo
  KONSUMSI: '#f59e0b', // Amber
  LAIN_LAIN: '#64748b', // Slate
}

export const sumberColorMap: Record<string, string> = {
  KASIR_TUNAI: '#10b981', // Emerald
  BANK: '#3b82f6', // Blue
  QRIS: '#a855f7', // Purple
}

export function useLaporanAnalytics(
  kasMasukList: Ref<KasMasuk[]>,
  kasKeluarList: Ref<KasKeluar[]>,
  dateFilter: Ref<DateFilterValue>,
  selectedPeriode: Ref<string>
) {
  const filteredKasMasukByPeriode = computed(() =>
    kasMasukList.value.filter((k) => {
      if (!k.tanggal) return false
      return isDateInFilterRange(k.tanggal, dateFilter.value)
    })
  )

  const filteredKasKeluarByPeriode = computed(() =>
    kasKeluarList.value.filter((k) => {
      if (!k.tanggal) return false
      return isDateInFilterRange(k.tanggal, dateFilter.value)
    })
  )

  const totalMasuk = computed(() =>
    filteredKasMasukByPeriode.value
      .filter((k) => k.status_verifikasi === 'VERIFIED')
      .reduce((s, k) => s + k.nominal, 0)
  )

  const totalKeluar = computed(() =>
    filteredKasKeluarByPeriode.value.reduce((s, k) => s + k.nominal, 0)
  )

  const labaBersih = computed(() => totalMasuk.value - totalKeluar.value)

  const profitMargin = computed(() => {
    if (totalMasuk.value <= 0) return '0.0'
    return ((labaBersih.value / totalMasuk.value) * 100).toFixed(1)
  })

  const expenseRatio = computed(() => {
    if (totalMasuk.value <= 0) return '0.0'
    return ((totalKeluar.value / totalMasuk.value) * 100).toFixed(1)
  })

  const kpiMetrics = computed(() => [
    {
      label: 'Kas Masuk (Verified)',
      value: formatRupiah(totalMasuk.value),
      valueClass: 'text-emerald-600',
      sub: 'Periode ' + (dateFilter.value.label || selectedPeriode.value),
      subClass: 'text-emerald-600',
      subDot: 'bg-emerald-500',
      minWidth: 'min-w-[150px]',
    },
    {
      label: 'Total Pengeluaran Kas',
      value: formatRupiah(totalKeluar.value),
      valueClass: 'text-rose-600',
      sub: 'Periode ' + (dateFilter.value.label || selectedPeriode.value),
      subClass: 'text-rose-600',
      subDot: 'bg-rose-500',
      minWidth: 'min-w-[150px]',
    },
    {
      label: 'Laba Bersih Operasional',
      value: formatRupiah(Math.abs(labaBersih.value)),
      valueClass: labaBersih.value >= 0 ? 'text-emerald-600' : 'text-rose-600',
      sub: labaBersih.value >= 0 ? '+ Surplus Kas' : '- Defisit Kas',
      subClass: labaBersih.value >= 0 ? 'text-emerald-600' : 'text-rose-600',
      subDot: labaBersih.value >= 0 ? 'bg-emerald-500' : 'bg-rose-500',
      minWidth: 'min-w-[150px]',
    },
    {
      label: 'Net Profit Margin',
      value: `${profitMargin.value}%`,
      valueClass: Number(profitMargin.value) >= 0 ? 'text-indigo-600' : 'text-rose-600',
      sub: 'Margin laba bersih',
      subClass: 'text-slate-500',
      subDot: 'bg-indigo-500',
      minWidth: 'min-w-[130px]',
    },
    {
      label: 'Rasio Beban Kas',
      value: `${expenseRatio.value}%`,
      valueClass: 'text-amber-600',
      sub: 'Beban terhadap masuk',
      subClass: 'text-slate-500',
      subDot: 'bg-amber-500',
      minWidth: 'min-w-[130px]',
    },
  ])

  const kategoriBreakdown = computed(() => {
    const totals: Record<string, number> = {
      BAHAN_BAKU: 0,
      OPERASIONAL: 0,
      GAJI: 0,
      KONSUMSI: 0,
      LAIN_LAIN: 0,
    }
    filteredKasKeluarByPeriode.value.forEach((k) => {
      if (totals[k.kategori] !== undefined) {
        totals[k.kategori] += k.nominal
      } else {
        totals['LAIN_LAIN'] += k.nominal
      }
    })

    const sumTotal = totalKeluar.value || 1
    return Object.entries(totals)
      .map(([kat, nominal]) => ({
        kategori: kat,
        label: formatKategori(kat),
        nominal,
        color: kategoriColorMap[kat] || '#94a3b8',
        percentage: ((nominal / sumTotal) * 100).toFixed(1),
      }))
      .sort((a, b) => b.nominal - a.nominal)
  })

  const topCategory = computed(() => {
    if (kategoriBreakdown.value.length === 0 || totalKeluar.value === 0) {
      return { label: 'Tidak ada pengeluaran', nominal: 0, percentage: '0' }
    }
    return kategoriBreakdown.value[0]
  })

  const sumberBreakdown = computed(() => {
    const totals: Record<string, number> = {
      KASIR_TUNAI: 0,
      BANK: 0,
      QRIS: 0,
    }
    filteredKasMasukByPeriode.value
      .filter((k) => k.status_verifikasi === 'VERIFIED')
      .forEach((k) => {
        const key = (k.metode || '').toUpperCase().includes('BANK') ? 'BANK' : k.metode
        if (totals[key] !== undefined) {
          totals[key] += k.nominal
        }
      })

    const sumTotal = totalMasuk.value || 1
    return Object.entries(totals)
      .map(([sumber, nominal]) => ({
        sumber,
        label: formatMetode(sumber),
        nominal,
        color: sumberColorMap[sumber] || '#94a3b8',
        percentage: ((nominal / sumTotal) * 100).toFixed(1),
      }))
      .sort((a, b) => b.nominal - a.nominal)
  })

  const jenisBreakdown = computed(() => {
    let dp = 0
    let pelunasan = 0
    filteredKasMasukByPeriode.value
      .filter((k) => k.status_verifikasi === 'VERIFIED')
      .forEach((k) => {
        if (k.jenis_pembayaran === 'DP') dp += k.nominal
        else if (k.jenis_pembayaran === 'PELUNASAN') pelunasan += k.nominal
      })
    const total = dp + pelunasan || 1
    return {
      dp,
      pelunasan,
      dpPct: Math.round((dp / total) * 100),
      pelunasanPct: Math.round((pelunasan / total) * 100),
    }
  })

  return {
    filteredKasMasukByPeriode,
    filteredKasKeluarByPeriode,
    totalMasuk,
    totalKeluar,
    labaBersih,
    profitMargin,
    expenseRatio,
    kpiMetrics,
    kategoriBreakdown,
    topCategory,
    sumberBreakdown,
    jenisBreakdown,
  }
}
