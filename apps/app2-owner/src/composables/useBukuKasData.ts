import { ref, computed, watch, type Ref } from 'vue'
import type { KasMasuk, KasKeluar, Client, Order, DateFilterValue } from '@shared/types'
import type { ComboboxOption } from '@shared/components/ComboboxInput.vue'
import {
  formatRupiah,
  formatTanggal,
  formatMetode,
  formatKategori,
  formatJenisPembayaran,
  isDateInFilterRange,
} from '@shared/utils/formatters'

export interface MutasiRow {
  id: string
  tanggal: string
  tipe: 'MASUK' | 'KELUAR'
  kategori: string
  keterangan: string
  sumber_kas: string
  nominal: number
  fileId?: string
  raw?: KasMasuk | KasKeluar
}

export function useBukuKasData(
  kasMasukList: Ref<KasMasuk[]>,
  kasKeluarList: Ref<KasKeluar[]>,
  clientsList: Ref<Client[]>,
  ordersList: Ref<Order[]>,
  dateFilter: Ref<DateFilterValue>,
  activeTab: Ref<'SEMUA' | 'MASUK' | 'KELUAR' | 'DEPOSIT'>,
  searchQuery: Ref<string>,
  selectedPeriode: Ref<string>
) {
  const isExporting = ref(false)

  const penerbitOptions = computed<ComboboxOption[]>(() => {
    const seen = new Set<string>()
    const list: ComboboxOption[] = []

    clientsList.value.forEach((c) => {
      const name = c.nama_penerbit?.trim()
      if (!name) return
      const key = name.toLowerCase()
      if (seen.has(key)) return
      seen.add(key)
      const subParts = [c.kontak, c.alamat].filter(Boolean)
      list.push({
        label: name,
        value: name,
        sub: subParts.length > 0 ? subParts.join(' • ') : 'Klien Terdaftar',
        extra: c,
      })
    })

    ordersList.value.forEach((o) => {
      const name = o.nama_penerbit?.trim()
      if (!name) return
      const key = name.toLowerCase()
      if (seen.has(key)) return
      seen.add(key)
      list.push({
        label: name,
        value: name,
        sub: o.id_order ? `Order ${o.id_order}` : undefined,
        extra: o,
      })
    })

    kasMasukList.value.forEach((k) => {
      const name = k.nama_penerbit?.trim()
      if (!name) return
      const key = name.toLowerCase()
      if (seen.has(key)) return
      seen.add(key)
      list.push({
        label: name,
        value: name,
        sub: 'Riwayat Transaksi',
        extra: k,
      })
    })

    return list.sort((a, b) => a.label.localeCompare(b.label))
  })

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
      .filter((k) => k.status_verifikasi === 'VERIFIED' && k.metode !== 'SALDO_DEPOSIT')
      .reduce((s, k) => s + k.nominal, 0)
  )
  const totalKeluar = computed(() =>
    filteredKasKeluarByPeriode.value.reduce((s, k) => s + k.nominal, 0)
  )
  const saldoKas = computed(() => totalMasuk.value - totalKeluar.value)

  const depositSummary = computed(() => {
    const map = new Map<string, { masuk: number; keluar: number }>()

    kasMasukList.value.forEach((k) => {
      if (k.jenis_pembayaran === 'DEPOSIT' && (k as any).status_verifikasi === 'VERIFIED') {
        const name = (k.nama_penerbit || 'Penerbit Lain').trim().toLowerCase()
        const curr = map.get(name) || { masuk: 0, keluar: 0 }
        curr.masuk += k.nominal
        map.set(name, curr)
      }
    })

    kasMasukList.value.forEach((k) => {
      if (k.metode === 'SALDO_DEPOSIT' && (k as any).status_verifikasi === 'VERIFIED') {
        const order = ordersList.value.find((o) => o.id_order === k.id_order)
        const name = (k.nama_penerbit || order?.nama_penerbit || 'Penerbit Lain').trim().toLowerCase()
        const curr = map.get(name) || { masuk: 0, keluar: 0 }
        curr.keluar += k.nominal
        map.set(name, curr)
      }
    })

    let totalMengendap = 0
    let activeCount = 0
    map.forEach((val) => {
      const sisa = Math.max(0, val.masuk - val.keluar)
      if (sisa > 0) {
        totalMengendap += sisa
        activeCount++
      }
    })

    return { totalMengendap, activeCount }
  })

  const summaryMetrics = computed(() => [
    {
      label: 'Total Kas Masuk (Riil)',
      value: formatRupiah(totalMasuk.value),
      valueClass: 'text-emerald-600',
      minWidth: 'min-w-[150px]',
    },
    {
      label: 'Total Kas Keluar',
      value: formatRupiah(totalKeluar.value),
      valueClass: 'text-rose-600',
      minWidth: 'min-w-[150px]',
    },
    {
      label: 'Surplus / Defisit Kas',
      value: formatRupiah(Math.abs(saldoKas.value)),
      valueClass: saldoKas.value >= 0 ? 'text-emerald-600' : 'text-rose-600',
      sub: saldoKas.value >= 0 ? '+ Surplus Saldo' : '- Defisit Saldo',
      subClass: saldoKas.value >= 0 ? 'text-emerald-600' : 'text-rose-600',
      subDot: saldoKas.value >= 0 ? 'bg-emerald-500' : 'bg-rose-500',
      minWidth: 'min-w-[150px]',
    },
    {
      label: 'Deposit Mengendap',
      value: formatRupiah(depositSummary.value.totalMengendap),
      valueClass: 'text-emerald-700',
      sub: `${depositSummary.value.activeCount} Penerbit Aktif`,
      subClass: 'text-emerald-600',
      subDot: 'bg-emerald-500',
      minWidth: 'min-w-[160px]',
    },
  ])

  const sumberList = ['KASIR_TUNAI', 'BANK', 'QRIS']
  const sumberConfig: Record<string, { label: string; dotColor: string }> = {
    KASIR_TUNAI: { label: 'Kasir Tunai', dotColor: 'bg-emerald-500' },
    BANK: { label: 'Bank', dotColor: 'bg-blue-500' },
    QRIS: { label: 'QRIS', dotColor: 'bg-purple-500' },
  }

  const sumberRekapData = computed(() =>
    sumberList.map((s) => {
      const cfg = sumberConfig[s] || { label: s, dotColor: 'bg-slate-400' }
      const matchSumber = (val: string) =>
        s === 'BANK' ? (val || '').toUpperCase().includes('BANK') : val === s
      const masuk = filteredKasMasukByPeriode.value
        .filter((k) => matchSumber(k.metode) && k.status_verifikasi === 'VERIFIED')
        .reduce((sum, k) => sum + k.nominal, 0)
      const keluar = filteredKasKeluarByPeriode.value
        .filter((k) => matchSumber(k.sumber_kas))
        .reduce((sum, k) => sum + k.nominal, 0)
      return { label: cfg.label, dotColor: cfg.dotColor, masuk, keluar, saldo: masuk - keluar }
    })
  )

  function formatKmKeterangan(k: KasMasuk): string {
    if (k.jenis_pembayaran === 'DEPOSIT') {
      return `[DEPOSIT] ${k.nama_penerbit || 'Penerbit'}${k.keterangan ? ' — ' + k.keterangan : ''}`
    }
    if (k.jenis_pembayaran === 'NON_ORDER') {
      return `[NON-ORDER] ${k.keterangan || k.nama_penerbit || 'Pendapatan Lain'}`
    }
    const orderStr = k.id_order ? `(${k.id_order})` : ''
    const penerbitStr = k.nama_penerbit
      ? `${k.nama_penerbit} ${orderStr}`.trim()
      : (k.id_order ?? k.keterangan ?? '')
    return `${formatJenisPembayaran(k.jenis_pembayaran)} — ${penerbitStr}`
  }

  const allMutasi = computed<MutasiRow[]>(() => {
    const list: MutasiRow[] = []

    filteredKasMasukByPeriode.value
      .filter((k) => k.status_verifikasi === 'VERIFIED' && k.metode !== 'SALDO_DEPOSIT')
      .forEach((k) => {
        list.push({
          id: k.id_kas_masuk,
          tanggal: k.tanggal,
          tipe: 'MASUK',
          kategori: formatJenisPembayaran(k.jenis_pembayaran),
          keterangan: formatKmKeterangan(k),
          sumber_kas: k.metode,
          nominal: k.nominal,
          fileId: k.file_id_bukti,
          raw: k,
        })
      })

    filteredKasKeluarByPeriode.value.forEach((k) => {
      list.push({
        id: k.id_kas_keluar,
        tanggal: k.tanggal,
        tipe: 'KELUAR',
        kategori: formatKategori(k.kategori),
        keterangan: k.rincian,
        sumber_kas: k.sumber_kas,
        nominal: k.nominal,
        fileId: k.file_id_nota,
        raw: k,
      })
    })

    return list.sort((a, b) => b.tanggal.localeCompare(a.tanggal))
  })

  const filteredMutasi = computed(() => {
    return allMutasi.value.filter((m) => {
      if (activeTab.value === 'MASUK' && m.tipe !== 'MASUK') return false
      if (activeTab.value === 'KELUAR' && m.tipe !== 'KELUAR') return false
      if (activeTab.value === 'DEPOSIT' && !m.kategori.toLowerCase().includes('deposit')) return false
      if (searchQuery.value.trim()) {
        const q = searchQuery.value.toLowerCase()
        return (
          m.keterangan.toLowerCase().includes(q) ||
          m.kategori.toLowerCase().includes(q) ||
          formatMetode(m.sumber_kas).toLowerCase().includes(q)
        )
      }
      return true
    })
  })

  const MUTASI_PAGE_SIZE = 25
  const mutasiDisplayLimit = ref(MUTASI_PAGE_SIZE)

  watch([activeTab, dateFilter, searchQuery], () => {
    mutasiDisplayLimit.value = MUTASI_PAGE_SIZE
  })

  const displayedMutasi = computed(() => {
    return filteredMutasi.value.slice(0, mutasiDisplayLimit.value)
  })

  const hasMoreMutasi = computed(() => {
    return displayedMutasi.value.length < filteredMutasi.value.length
  })

  const nextMutasiBatchCount = computed(() => {
    return Math.min(MUTASI_PAGE_SIZE, filteredMutasi.value.length - displayedMutasi.value.length)
  })

  function loadMoreMutasi() {
    mutasiDisplayLimit.value += MUTASI_PAGE_SIZE
  }

  function showAllMutasi() {
    mutasiDisplayLimit.value = filteredMutasi.value.length
  }

  async function exportExcel() {
    isExporting.value = true
    try {
      const XLSX = await import('xlsx')
      const wb = XLSX.utils.book_new()

      const mutasiData = allMutasi.value.map((m) => ({
        Tanggal: formatTanggal(m.tanggal),
        Tipe: m.tipe,
        Kategori: m.kategori,
        Keterangan: m.keterangan,
        'Sumber Kas': formatMetode(m.sumber_kas),
        'Debit (Masuk)': m.tipe === 'MASUK' ? m.nominal : 0,
        'Kredit (Keluar)': m.tipe === 'KELUAR' ? m.nominal : 0,
      }))
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mutasiData), 'Mutasi Kas')

      const rekapData = sumberRekapData.value.map((s) => ({
        Akun: s.label,
        'Total Masuk': s.masuk,
        'Total Keluar': s.keluar,
        'Saldo Bersih': s.saldo,
      }))
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rekapData), 'Rekap Akun')

      const periodLabel = (dateFilter.value.label || selectedPeriode.value).replace(/[^a-zA-Z0-9_-]/g, '_')
      XLSX.writeFile(wb, `Buku_Kas_KBM_${periodLabel}.xlsx`)
    } finally {
      isExporting.value = false
    }
  }

  return {
    isExporting,
    penerbitOptions,
    totalMasuk,
    totalKeluar,
    saldoKas,
    depositSummary,
    summaryMetrics,
    sumberRekapData,
    allMutasi,
    filteredMutasi,
    displayedMutasi,
    hasMoreMutasi,
    nextMutasiBatchCount,
    loadMoreMutasi,
    showAllMutasi,
    exportExcel,
  }
}
