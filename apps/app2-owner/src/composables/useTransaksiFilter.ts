import { ref, computed, watch, type Ref } from 'vue'
import {
  formatRupiah,
  hitungStatusBayar,
  isDateInFilterRange,
} from '@shared/utils/formatters'
import type { KasMasuk, Order, PiutangRow, DateFilterValue } from '@shared/types'

export interface OrderTxRow {
  id: string
  tanggal: string
  id_order?: string | null
  nama_penerbit: string
  judul_buku?: string
  jenis_pembayaran: string
  metode: string
  nominal: number
  status_verifikasi: string
  fileId?: string
  keterangan?: string
}

export interface EnrichedPiutangRow extends PiutangRow {
  payments: OrderTxRow[]
  dpPayments: OrderTxRow[]
  pelunasanPayments: OrderTxRow[]
  dpPending: boolean
  pelunasanPending: boolean
}

export function useTransaksiFilter(
  ordersList: Ref<Order[]>,
  kasMasukList: Ref<KasMasuk[]>,
  searchQuery: Ref<string>,
  statusFilter: Ref<'ALL' | 'PIUTANG' | 'LUNAS' | 'PENDING_VERIF' | 'UNLINKED'>,
  dateFilter: Ref<DateFilterValue>
) {
  // All payments linked to orders
  const allOrdersTx = computed<OrderTxRow[]>(() => {
    return kasMasukList.value
      .filter((k) => {
        if (k.jenis_pembayaran === 'NON_ORDER' || k.jenis_pembayaran === 'DEPOSIT') {
          return false
        }
        if (k.status_verifikasi === 'BATAL') {
          return false
        }
        return true
      })
      .map((k) => {
        const order = ordersList.value.find((o) => o.id_order === k.id_order)
        return {
          id: k.id_kas_masuk,
          tanggal: k.tanggal,
          id_order: k.id_order,
          nama_penerbit: (k.nama_penerbit || order?.nama_penerbit || '-').trim(),
          judul_buku: order?.judul_penulis || '',
          jenis_pembayaran: k.jenis_pembayaran,
          metode: k.metode,
          nominal: k.nominal,
          status_verifikasi: k.status_verifikasi,
          fileId: k.file_id_bukti,
          keterangan: k.keterangan,
        }
      })
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
  })

  const pendingVerifikasiCount = computed(() =>
    allOrdersTx.value.filter((t) => t.status_verifikasi === 'PENDING').length
  )

  // Master Rows (Orders with payments attached directly)
  const piutangRows = computed<EnrichedPiutangRow[]>(() => {
    return ordersList.value.map((order) => {
      const payments = allOrdersTx.value.filter((tx) => tx.id_order === order.id_order)
      const dpPayments = payments.filter((tx) => tx.jenis_pembayaran === 'DP')
      const pelunasanPayments = payments.filter((tx) => tx.jenis_pembayaran !== 'DP')
      const dpPending = dpPayments.some((tx) => tx.status_verifikasi === 'PENDING')
      const pelunasanPending = pelunasanPayments.some((tx) => tx.status_verifikasi === 'PENDING')
      const total_masuk = payments.reduce((s, k) => s + k.nominal, 0)
      const total_masuk_verified = payments
        .filter((k) => k.status_verifikasi === 'VERIFIED')
        .reduce((s, k) => s + k.nominal, 0)
      const has_pending = payments.some((k) => k.status_verifikasi === 'PENDING')
      const sisa_tagihan = Math.max(0, order.total_harga - total_masuk_verified)
      const status_bayar = hitungStatusBayar(total_masuk_verified, order.total_harga)

      return {
        order,
        total_masuk,
        total_masuk_verified,
        has_pending,
        sisa_tagihan,
        status_bayar,
        payments,
        dpPayments,
        pelunasanPayments,
        dpPending,
        pelunasanPending,
      }
    })
  })

  // Data baris yang disaring berdasarkan tanggal pembuatan order aktif
  const dateFilteredPiutangRows = computed(() => {
    return piutangRows.value.filter((r) => {
      if (dateFilter.value.mode !== 'ALL') {
        return isDateInFilterRange(r.order.tanggal, dateFilter.value)
      }
      return true
    })
  })

  // Transaksi kas masuk yang tercatat di Buku Kas namun nomor ordernya tidak ada di master Orders
  const unlinkedPayments = computed(() => {
    const orderIdSet = new Set(ordersList.value.map((o) => o.id_order))
    return kasMasukList.value
      .filter((k) => {
        if (k.status_verifikasi === 'BATAL') return false
        return !k.id_order || !orderIdSet.has(k.id_order)
      })
      .map((k) => ({
        id: k.id_kas_masuk,
        tanggal: k.tanggal,
        id_order: k.id_order,
        nama_penerbit: k.nama_penerbit || '-',
        nominal: k.nominal,
        metode: k.metode,
        jenis_pembayaran: k.jenis_pembayaran,
        status_verifikasi: k.status_verifikasi,
        keterangan: k.keterangan,
        fileId: k.file_id_bukti,
      }))
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
  })

  const dateFilteredUnlinkedPayments = computed(() => {
    return unlinkedPayments.value.filter((k) => {
      if (dateFilter.value.mode !== 'ALL') {
        return isDateInFilterRange(k.tanggal, dateFilter.value)
      }
      return true
    })
  })

  const filteredUnlinkedPayments = computed(() => {
    return dateFilteredUnlinkedPayments.value.filter((k) => {
      if (searchQuery.value.trim()) {
        const q = searchQuery.value.toLowerCase()
        return (
          k.id.toLowerCase().includes(q) ||
          (k.id_order && k.id_order.toLowerCase().includes(q)) ||
          k.nama_penerbit.toLowerCase().includes(q) ||
          (k.keterangan && k.keterangan.toLowerCase().includes(q))
        )
      }
      return true
    })
  })

  const totalUnlinkedNominal = computed(() =>
    dateFilteredUnlinkedPayments.value
      .filter((k) => k.status_verifikasi === 'VERIFIED')
      .reduce((s, k) => s + k.nominal, 0)
  )

  const filterOptions = computed(() => [
    { value: 'ALL' as const, label: 'Semua Order', count: dateFilteredPiutangRows.value.length },
    {
      value: 'PIUTANG' as const,
      label: 'Ada Piutang',
      count: dateFilteredPiutangRows.value.filter((r) => r.sisa_tagihan > 0).length,
      badgeClass: 'bg-rose-50 text-rose-600 font-bold',
    },
    {
      value: 'LUNAS' as const,
      label: 'Lunas',
      count: dateFilteredPiutangRows.value.filter((r) => r.sisa_tagihan <= 0).length,
      badgeClass: 'bg-emerald-50 text-emerald-700 font-bold',
    },
    {
      value: 'PENDING_VERIF' as const,
      label: 'Perlu Verifikasi',
      count: dateFilteredPiutangRows.value.filter((r) => r.has_pending).length,
      badgeClass: dateFilteredPiutangRows.value.some((r) => r.has_pending)
        ? 'bg-amber-500 text-white font-extrabold animate-pulse'
        : 'bg-slate-300 text-slate-600',
    },
    ...(dateFilteredUnlinkedPayments.value.length > 0
      ? [
          {
            value: 'UNLINKED' as const,
            label: 'Tanpa Order',
            count: dateFilteredUnlinkedPayments.value.length,
            badgeClass: 'bg-amber-100 text-amber-800 font-bold',
          },
        ]
      : []),
  ])

  const filteredPiutangRows = computed(() => {
    return dateFilteredPiutangRows.value.filter((r) => {
      if (statusFilter.value === 'PIUTANG' && r.sisa_tagihan <= 0) return false
      if (statusFilter.value === 'LUNAS' && r.sisa_tagihan > 0) return false
      if (statusFilter.value === 'PENDING_VERIF' && !r.has_pending) return false

      if (searchQuery.value.trim()) {
        const q = searchQuery.value.toLowerCase()
        return (
          r.order.nama_penerbit.toLowerCase().includes(q) ||
          r.order.judul_penulis.toLowerCase().includes(q) ||
          r.order.id_order.toLowerCase().includes(q)
        )
      }
      return true
    })
  })

  // Load More / Pagination State
  const PAGE_SIZE = 25
  const displayLimit = ref(PAGE_SIZE)

  watch([statusFilter, dateFilter, searchQuery], () => {
    displayLimit.value = PAGE_SIZE
  })

  const displayedPiutangRows = computed(() => {
    return filteredPiutangRows.value.slice(0, displayLimit.value)
  })

  const hasMoreRows = computed(() => {
    return displayedPiutangRows.value.length < filteredPiutangRows.value.length
  })

  const nextBatchCount = computed(() => {
    return Math.min(PAGE_SIZE, filteredPiutangRows.value.length - displayedPiutangRows.value.length)
  })

  function loadMore() {
    displayLimit.value += PAGE_SIZE
  }

  function showAll() {
    displayLimit.value = filteredPiutangRows.value.length
  }

  const totalTagihanPiutang = computed(() =>
    filteredPiutangRows.value.reduce((s, r) => s + r.order.total_harga, 0)
  )
  const totalMasukPiutang = computed(() =>
    filteredPiutangRows.value.reduce((s, r) => s + r.total_masuk_verified, 0)
  )
  const totalSisaPiutang = computed(() =>
    filteredPiutangRows.value.reduce((s, r) => s + r.sisa_tagihan, 0)
  )
  const totalKelebihanBayar = computed(() =>
    Math.max(0, totalMasukPiutang.value - totalTagihanPiutang.value)
  )
  const orderLunasCount = computed(() =>
    filteredPiutangRows.value.filter((r) => r.sisa_tagihan <= 0).length
  )
  const filteredPendingVerifikasiCount = computed(() =>
    filteredPiutangRows.value.filter((r) => r.has_pending).length
  )

  // Summary Metrics Bar
  const summaryMetrics = computed(() => [
    {
      label: 'Order Aktif',
      value: filteredPiutangRows.value.filter((r) => r.order.status_order === 'PROSES').length,
      minWidth: 'min-w-[120px]',
    },
    {
      label: 'Total Nilai Tagihan',
      value: formatRupiah(totalTagihanPiutang.value),
      minWidth: 'min-w-[140px]',
    },
    {
      label: 'Total Terbayar',
      value: formatRupiah(totalMasukPiutang.value),
      valueClass: 'text-emerald-600',
      sub: totalKelebihanBayar.value > 0 ? `Lebih Bayar: +${formatRupiah(totalKelebihanBayar.value)}` : undefined,
      subClass: 'text-emerald-700 font-semibold',
      minWidth: 'min-w-[140px]',
    },
    ...(totalUnlinkedNominal.value > 0
      ? [
          {
            label: 'Kas Tanpa Order',
            value: formatRupiah(totalUnlinkedNominal.value),
            valueClass: 'text-amber-600',
            sub: `${dateFilteredUnlinkedPayments.value.length} mutasi (masuk Buku Kas)`,
            subClass: 'text-amber-700 font-semibold',
            subDot: 'bg-amber-500',
            minWidth: 'min-w-[150px]',
          },
        ]
      : []),
    {
      label: 'Sisa Piutang',
      value: formatRupiah(totalSisaPiutang.value),
      valueClass: 'text-rose-600',
      minWidth: 'min-w-[140px]',
    },
    {
      label: 'Perlu Verifikasi',
      value: filteredPendingVerifikasiCount.value > 0 ? `${filteredPendingVerifikasiCount.value} Order` : '0 Pending',
      valueClass: filteredPendingVerifikasiCount.value > 0 ? 'text-amber-600 font-extrabold' : 'text-slate-600',
      sub: filteredPendingVerifikasiCount.value > 0 ? 'Menunggu Approval Owner' : 'Semua Tervalidasi',
      subClass: filteredPendingVerifikasiCount.value > 0 ? 'text-amber-600' : 'text-slate-400',
      subDot: filteredPendingVerifikasiCount.value > 0 ? 'bg-amber-500' : 'bg-emerald-500',
      minWidth: 'min-w-[160px]',
    },
    {
      label: 'Order Lunas',
      value: `${orderLunasCount.value} / ${filteredPiutangRows.value.length}`,
      valueClass: 'text-emerald-700',
      minWidth: 'min-w-[130px]',
    },
  ])

  return {
    PAGE_SIZE,
    allOrdersTx,
    pendingVerifikasiCount,
    piutangRows,
    dateFilteredPiutangRows,
    unlinkedPayments,
    dateFilteredUnlinkedPayments,
    filteredUnlinkedPayments,
    totalUnlinkedNominal,
    filterOptions,
    filteredPiutangRows,
    displayLimit,
    displayedPiutangRows,
    hasMoreRows,
    nextBatchCount,
    loadMore,
    showAll,
    totalTagihanPiutang,
    totalMasukPiutang,
    totalSisaPiutang,
    totalKelebihanBayar,
    orderLunasCount,
    filteredPendingVerifikasiCount,
    summaryMetrics,
  }
}
