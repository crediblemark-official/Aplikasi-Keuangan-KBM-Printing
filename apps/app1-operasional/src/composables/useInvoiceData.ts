import { ref, computed } from 'vue'
import { useOrderStore } from '../stores/orders'
import { useCompanyStore } from '@shared/stores/companyStore'
import { api } from '@shared/api/gasClient'
import type { KasMasuk, Order } from '@shared/types'
import { formatRupiah, formatFinishing, formatKertasOrder } from '@shared/utils/formatters'
import { calculateOrderPriceDetailed } from '@shared/utils/pricelist'

export interface InvoiceItem {
  sl: number
  title: string
  desc: string
  qty: number
  rate: number
  amount: number
}

export function useInvoiceData(orderId: import('vue').Ref<string>) {
  const orderStore = useOrderStore()
  const companyStore = useCompanyStore()

  const company = computed(() => companyStore.profile)
  const order = computed(() => orderStore.orders.find((o) => (o.id_order || '').trim() === orderId.value))
  const kasMasukList = ref<KasMasuk[]>([])
  const isLoading = ref(true)
  const loadError = ref<string | null>(null)
  const isPrinting = ref(false)
  const isSendingWA = ref(false)

  const nomorInvoice = computed(() => {
    const now = new Date()
    const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
    const seq = orderId.value ? (orderId.value.split('-')[2] ?? '001') : '001'
    return `INV-${yyyymm}-${seq}`
  })

  const totalMasuk = computed(() =>
    kasMasukList.value
      .filter((k) => (k as any).status_verifikasi !== 'BATAL')
      .reduce((s, k) => s + k.nominal, 0)
  )

  const sisaTagihan = computed(() =>
    Math.max(0, (order.value?.total_harga ?? 0) - totalMasuk.value)
  )

  const invoiceItems = computed<InvoiceItem[]>(() => {
    if (!order.value) return []
    const o = order.value
    const detailed = calculateOrderPriceDetailed({
      jml_pcs: o.jml_pcs || 1,
      ukuran: o.ukuran,
      kertas: o.kertas,
      kertas_bw: o.kertas_bw,
      kertas_fc: o.kertas_fc,
      cetak_bw: o.cetak_bw || 0,
      cetak_fc: o.cetak_fc || 0,
      finishing: o.finishing || [],
      packing_dus_tipe: o.packing_dus_tipe,
      packing_dus_qty: o.packing_dus_qty,
      skema_harga: o.skema_harga || 'NORMAL',
    })

    const paperLabel = formatKertasOrder(o)
    const isPricelist = Math.abs(detailed.total_harga - o.total_harga) <= 50
    const items: InvoiceItem[] = []

    if (
      isPricelist &&
      detailed.biaya_finishing_per_pcs > 0 &&
      detailed.biaya_cetak_bw_per_pcs + detailed.biaya_cetak_fc_per_pcs > 0
    ) {
      const cetakUnit = detailed.biaya_cetak_bw_per_pcs + detailed.biaya_cetak_fc_per_pcs
      const finishingUnit = detailed.biaya_finishing_per_pcs
      items.push(
        {
          sl: 1,
          title: `Cetak Isi Buku: "${o.judul_buku || o.judul_penulis}"`,
          desc: `Ukuran ${o.ukuran_custom || o.ukuran} • Kertas ${paperLabel} • ${o.cetak_bw || 0} hal BW + ${o.cetak_fc || 0} hal FC`,
          qty: o.jml_pcs,
          rate: cetakUnit,
          amount: cetakUnit * o.jml_pcs,
        },
        {
          sl: 2,
          title: `Finishing & Jilid Buku`,
          desc: `${formatFinishing(o.finishing)} (Cover, laminasi, jilid lem & perapihan)`,
          qty: o.jml_pcs,
          rate: finishingUnit,
          amount: finishingUnit * o.jml_pcs,
        }
      )
    } else {
      const boxCost = o.biaya_packing || detailed.biaya_packing_total || 0
      const productionTotal = Math.max(0, o.total_harga - boxCost)
      const unitRate = Math.round(productionTotal / (o.jml_pcs || 1))
      items.push({
        sl: 1,
        title: `Produksi Cetak Buku: "${o.judul_buku || o.judul_penulis}"`,
        desc: `Ukuran ${o.ukuran_custom || o.ukuran} • Kertas ${paperLabel} • ${o.cetak_bw || 0} hal BW + ${o.cetak_fc || 0} hal FC • Finishing: ${formatFinishing(o.finishing)}`,
        qty: o.jml_pcs,
        rate: unitRate,
        amount: productionTotal,
      })
    }

    if (o.packing_dus_tipe && o.packing_dus_qty && o.packing_dus_qty > 0) {
      const boxName = o.packing_dus_tipe === 'DUS_BESAR' ? 'Dus Besar' : 'Dus Kecil'
      const boxRate = o.packing_dus_tipe === 'DUS_BESAR' ? 10000 : 5000
      const boxAmount = o.biaya_packing || o.packing_dus_qty * boxRate
      items.push({
        sl: items.length + 1,
        title: `Packing Pengiriman: ${boxName}`,
        desc: `Kardus packing standar koli ekspedisi KBM Printing (${o.packing_dus_qty} dus)`,
        qty: o.packing_dus_qty,
        rate: boxRate,
        amount: boxAmount,
      })
    }

    return items
  })

  function printInvoice() {
    isPrinting.value = true
    const originalTitle = document.title
    const invoiceNum = nomorInvoice.value || 'INVOICE'
    const customerName = order.value?.nama_penerbit
      ? `_${order.value.nama_penerbit.replace(/[^a-zA-Z0-9_-]/g, '_')}`
      : ''
    document.title = `${invoiceNum}${customerName}`

    setTimeout(() => {
      window.print()
      setTimeout(() => {
        document.title = originalTitle
        isPrinting.value = false
      }, 1000)
    }, 250)
  }

  async function sendWhatsApp() {
    if (!order.value) return
    isSendingWA.value = true

    try {
      const o = order.value
      const paperStr = formatKertasOrder(o)
      const packingStr =
        o.packing_dus_tipe && o.packing_dus_qty
          ? `\n📦 *Packing:* ${o.packing_dus_qty}x ${o.packing_dus_tipe === 'DUS_BESAR' ? 'Dus Besar' : 'Dus Kecil'}`
          : ''
      const message = encodeURIComponent(
        `Halo! Berikut invoice untuk pesanan Anda:\n\n` +
          `📋 *${nomorInvoice.value}*\n` +
          `🏢 ${o.nama_penerbit}\n` +
          `📚 ${o.judul_penulis}\n` +
          `📄 Kertas: ${paperStr}` +
          packingStr +
          `\n` +
          `💰 *Total: ${formatRupiah(o.total_harga)}*\n` +
          `💳 Sisa Tagihan: ${formatRupiah(sisaTagihan.value)}\n\n` +
          `Terima kasih telah mempercayakan percetakan kepada ${company.value.nama} 🙏`
      )
      window.open(`https://wa.me/?text=${message}`, '_blank')
    } finally {
      isSendingWA.value = false
    }
  }

  async function loadData() {
    if (!orderId.value) {
      isLoading.value = false
      return
    }

    isLoading.value = true
    loadError.value = null

    try {
      if (!order.value) {
        await orderStore.ensureOrderLoaded(orderId.value)
      }

      const localPayments = orderStore.kasMasukList.filter((k) => k.id_order === orderId.value)
      if (localPayments.length > 0) {
        kasMasukList.value = localPayments
        isLoading.value = false
      }

      const res = await api.getKasMasuk({ id_order: orderId.value })
      if (res.success && res.data) {
        kasMasukList.value = res.data
        orderStore.mergeKasMasuk(res.data)
      }
    } catch (err: any) {
      if (!kasMasukList.value.length) {
        loadError.value = err?.message || 'Gagal memuat detail invoice'
      }
    } finally {
      isLoading.value = false
    }
  }

  return {
    company,
    order,
    kasMasukList,
    isLoading,
    loadError,
    isPrinting,
    isSendingWA,
    nomorInvoice,
    totalMasuk,
    sisaTagihan,
    invoiceItems,
    printInvoice,
    sendWhatsApp,
    loadData,
  }
}
