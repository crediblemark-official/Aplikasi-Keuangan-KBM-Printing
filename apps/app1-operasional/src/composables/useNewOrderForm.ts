import { ref, computed } from 'vue'
import type { ComboboxOption } from '@shared/components/ComboboxInput.vue'
import { getTodayISO } from '@shared/utils/formatters'
import {
  calculateOrderPriceDetailed,
  getTarifBWPerHalaman,
  getTarifFCPerHalaman,
} from '@shared/utils/pricelist'
import type { UkuranBuku, JenisKertas, JenisFinishing, SkemaHarga } from '@shared/types'
import { useOrderStore } from '../stores/orders'

export const ukuranOptions = [
  { value: 'A5', label: 'A5 / Unesco' },
  { value: 'B5', label: 'B5' },
  { value: 'A4', label: 'A4' },
  { value: 'A6', label: 'A6' },
  { value: 'CUSTOM', label: 'Custom' },
]

export const kertasOptions = [
  { value: 'BP_57', label: 'BP 57', sub: 'Bookpaper 57g' },
  { value: 'BP_72', label: 'BP 72', sub: 'Bookpaper 72g' },
  { value: 'HVS_70', label: 'HVS 70', sub: 'HVS 70g Putih' },
  { value: 'HVS_80', label: 'HVS 80', sub: 'HVS 80g Putih' },
  { value: 'BOOKPAPER_55G', label: 'BP 55', sub: 'Bookpaper 55g' },
  { value: 'ART_PAPER_120G', label: 'Art Paper', sub: 'Art Paper 120g' },
  { value: 'ART_CARTON_210G', label: 'Art Carton', sub: 'Art Carton 210g' },
  { value: 'LAIN_LAIN', label: 'Lain-lain', sub: 'Khusus' },
]

export const finishingOptions = [
  { value: 'SOFT_COVER', label: 'Soft Cover', sub: 'Cover + Lam + Binding + Shrink' },
  { value: 'HARD_COVER', label: 'Hard Cover', sub: 'Cover + Lam + Binding + Shrink + Pita' },
  { value: 'BINDING_POTONG', label: 'Binding + Potong', sub: 'Jilid lem & potong rapi' },
  { value: 'LAMINASI_DOFF', label: 'Laminasi Doff', sub: 'Doff lembut' },
  { value: 'LAMINASI_GLOSSY', label: 'Laminasi Glossy', sub: 'Glossy kilap' },
  { value: 'SHRINK_WRAP', label: 'Shrink Wrap', sub: 'Plastik segel' },
]

export function useNewOrderForm() {
  const orderStore = useOrderStore()
  const clients = ref<{ nama_penerbit: string; kontak?: string; alamat?: string }[]>([])
  const isCustomPrice = ref(false)

  // Custom items added during current session
  const customClients = ref<{ nama_penerbit: string; kontak?: string; alamat?: string }[]>([])
  const customTitles = ref<string[]>([])
  const customAuthors = ref<string[]>([])
  const customAddresses = ref<string[]>([])
  const customContacts = ref<string[]>([])

  const form = ref({
    tanggal: getTodayISO(),
    skema_harga: 'NORMAL' as SkemaHarga,
    nama_penerbit: '',
    judul_buku: '',
    nama_penulis: '',
    alamat_penerbit: '',
    kontak_penerbit: '',
    jml_pcs: 100,
    ukuran: 'A5' as UkuranBuku,
    ukuran_custom: '',
    kertas: 'BP_57' as JenisKertas,
    kertas_bw: 'BP_57' as JenisKertas,
    kertas_fc: 'HVS_80' as JenisKertas,
    is_kertas_sama: true,
    packing_dus_tipe: null as 'DUS_KECIL' | 'DUS_BESAR' | null,
    packing_dus_qty: 0,
    cetak_bw: 150,
    cetak_fc: 0,
    finishing: ['SOFT_COVER'] as JenisFinishing[],
    total_harga: 0,
    catatan: '',
  })

  // 1. Client Options
  const clientOptions = computed<ComboboxOption[]>(() => {
    const all = [...customClients.value, ...clients.value]
    const seen = new Set<string>()
    const list: ComboboxOption[] = []
    for (const c of all) {
      const key = c.nama_penerbit.trim().toLowerCase()
      if (!key || seen.has(key)) continue
      seen.add(key)
      list.push({
        label: c.nama_penerbit,
        value: c.nama_penerbit,
        sub: [c.kontak, c.alamat].filter(Boolean).join(' • '),
        extra: c,
      })
    }
    return list
  })

  function onClientSelect(opt: ComboboxOption) {
    const c = opt.extra
    if (c?.alamat && !form.value.alamat_penerbit) form.value.alamat_penerbit = String(c.alamat)
    if (c?.kontak && !form.value.kontak_penerbit) form.value.kontak_penerbit = String(c.kontak)
  }

  function onClientAdd(val: string) {
    if (!customClients.value.some((c) => c.nama_penerbit.toLowerCase() === val.toLowerCase())) {
      customClients.value.unshift({ nama_penerbit: val })
    }
  }

  // 2. Book Title Options
  const bookTitleOptions = computed<ComboboxOption[]>(() => {
    const seen = new Set<string>()
    const list: ComboboxOption[] = []

    const curClient = form.value.nama_penerbit.trim().toLowerCase()
    const sortedOrders = [...orderStore.orders].sort((a, b) => {
      const aMatch = curClient && a.nama_penerbit.trim().toLowerCase() === curClient ? -1 : 1
      const bMatch = curClient && b.nama_penerbit.trim().toLowerCase() === curClient ? -1 : 1
      return aMatch - bMatch
    })

    for (const o of sortedOrders) {
      const title = (o.judul_buku || o.judul_penulis?.split('/')[0] || '').trim()
      const key = title.toLowerCase()
      if (!key || seen.has(key)) continue
      seen.add(key)
      const author = o.nama_penulis || o.judul_penulis?.split('/')[1]?.trim() || ''
      list.push({
        label: title,
        value: title,
        sub: author ? `Penulis: ${author}` : o.nama_penerbit,
        extra: { title, author, order: o },
      })
    }

    for (const t of customTitles.value) {
      const key = t.trim().toLowerCase()
      if (!key || seen.has(key)) continue
      seen.add(key)
      list.unshift({ label: t, value: t })
    }

    return list
  })

  function onBookSelect(opt: ComboboxOption) {
    const extra = opt.extra
    if (extra?.author && !form.value.nama_penulis) {
      form.value.nama_penulis = extra.author
    }
  }

  function onBookAdd(val: string) {
    if (!customTitles.value.includes(val)) {
      customTitles.value.unshift(val)
    }
  }

  // 3. Author Options
  const authorOptions = computed<ComboboxOption[]>(() => {
    const seen = new Set<string>()
    const list: ComboboxOption[] = []

    for (const a of customAuthors.value) {
      const key = a.trim().toLowerCase()
      if (!key || seen.has(key)) continue
      seen.add(key)
      list.push({ label: a, value: a })
    }

    for (const o of orderStore.orders) {
      const author = (o.nama_penulis || o.judul_penulis?.split('/')[1] || '').trim()
      const key = author.toLowerCase()
      if (!key || seen.has(key)) continue
      seen.add(key)
      list.push({
        label: author,
        value: author,
        sub: o.nama_penerbit ? `Penerbit: ${o.nama_penerbit}` : '',
      })
    }

    return list
  })

  function onAuthorAdd(val: string) {
    if (!customAuthors.value.includes(val)) {
      customAuthors.value.unshift(val)
    }
  }

  // 4. Address Options
  const addressOptions = computed<ComboboxOption[]>(() => {
    const seen = new Set<string>()
    const list: ComboboxOption[] = []

    for (const addr of customAddresses.value) {
      const key = addr.trim().toLowerCase()
      if (!key || seen.has(key)) continue
      seen.add(key)
      list.push({ label: addr, value: addr })
    }

    for (const c of [...customClients.value, ...clients.value]) {
      if (!c.alamat) continue
      const key = c.alamat.trim().toLowerCase()
      if (!key || seen.has(key)) continue
      seen.add(key)
      list.push({
        label: c.alamat.trim(),
        value: c.alamat.trim(),
        sub: c.nama_penerbit,
      })
    }

    for (const o of orderStore.orders) {
      if (!o.alamat_penerbit) continue
      const key = o.alamat_penerbit.trim().toLowerCase()
      if (!key || seen.has(key)) continue
      seen.add(key)
      list.push({
        label: o.alamat_penerbit.trim(),
        value: o.alamat_penerbit.trim(),
        sub: o.nama_penerbit,
      })
    }

    return list
  })

  function onAddressAdd(val: string) {
    if (!customAddresses.value.includes(val)) {
      customAddresses.value.unshift(val)
    }
  }

  // 5. Contact Options
  const contactOptions = computed<ComboboxOption[]>(() => {
    const seen = new Set<string>()
    const list: ComboboxOption[] = []

    for (const phone of customContacts.value) {
      const raw = String(phone || '').trim()
      const key = raw.toLowerCase()
      if (!key || seen.has(key)) continue
      seen.add(key)
      list.push({ label: raw, value: raw })
    }

    for (const c of [...customClients.value, ...clients.value]) {
      if (!c.kontak) continue
      const raw = String(c.kontak || '').trim()
      const key = raw.toLowerCase()
      if (!key || seen.has(key)) continue
      seen.add(key)
      list.push({
        label: raw,
        value: raw,
        sub: c.nama_penerbit ? String(c.nama_penerbit) : undefined,
      })
    }

    for (const o of orderStore.orders) {
      if (!o.kontak_penerbit) continue
      const raw = String(o.kontak_penerbit || '').trim()
      const key = raw.toLowerCase()
      if (!key || seen.has(key)) continue
      seen.add(key)
      list.push({
        label: raw,
        value: raw,
        sub: o.nama_penerbit ? String(o.nama_penerbit) : undefined,
      })
    }

    return list
  })

  function onContactAdd(val: string) {
    if (!customContacts.value.includes(val)) {
      customContacts.value.unshift(val)
    }
  }

  // Real-time Breakdown Calculation
  const priceBreakdown = computed(() => {
    return calculateOrderPriceDetailed({
      jml_pcs: form.value.jml_pcs || 0,
      ukuran: form.value.ukuran,
      kertas: form.value.kertas,
      kertas_bw: form.value.is_kertas_sama ? form.value.kertas : form.value.kertas_bw,
      kertas_fc: form.value.is_kertas_sama ? form.value.kertas : form.value.kertas_fc,
      cetak_bw: form.value.cetak_bw || 0,
      cetak_fc: form.value.cetak_fc || 0,
      finishing: form.value.finishing,
      packing_dus_tipe: form.value.packing_dus_tipe,
      packing_dus_qty: form.value.packing_dus_qty,
      skema_harga: form.value.skema_harga,
    })
  })

  const tarifBW = computed(() => {
    const k = form.value.is_kertas_sama ? form.value.kertas : (form.value.kertas_bw || form.value.kertas)
    return getTarifBWPerHalaman(form.value.ukuran, k, form.value.skema_harga)
  })

  const tarifFC = computed(() => {
    const k = form.value.is_kertas_sama ? form.value.kertas : (form.value.kertas_fc || form.value.kertas)
    return getTarifFCPerHalaman(form.value.ukuran, k, form.value.skema_harga)
  })

  const isFormValid = computed(() =>
    String(form.value.nama_penerbit || '').trim() !== '' &&
    String(form.value.judul_buku || '').trim() !== '' &&
    Number(form.value.jml_pcs) > 0 &&
    Number(form.value.total_harga) > 0,
  )

  function recalculatePriceAuto() {
    if (!isCustomPrice.value || form.value.total_harga === 0) {
      form.value.total_harga = priceBreakdown.value.total_harga
      isCustomPrice.value = false
    }
  }

  function setSkemaHarga(skema: SkemaHarga) {
    form.value.skema_harga = skema
    recalculatePriceAuto()
  }

  function setUkuran(u: UkuranBuku) {
    form.value.ukuran = u
    if (u !== 'CUSTOM') {
      form.value.ukuran_custom = ''
    }
    recalculatePriceAuto()
  }

  function setKertas(k: JenisKertas) {
    form.value.kertas = k
    form.value.kertas_bw = k
    recalculatePriceAuto()
  }

  function toggleKertasDual() {
    form.value.is_kertas_sama = !form.value.is_kertas_sama
    if (!form.value.is_kertas_sama) {
      form.value.kertas_bw = form.value.kertas
      if (!form.value.kertas_fc) form.value.kertas_fc = 'HVS_80'
    }
    recalculatePriceAuto()
  }

  function setKertasBW(k: JenisKertas) {
    form.value.kertas_bw = k
    recalculatePriceAuto()
  }

  function setKertasFC(k: JenisKertas) {
    form.value.kertas_fc = k
    recalculatePriceAuto()
  }

  function setPackingTipe(tipe: 'DUS_KECIL' | 'DUS_BESAR' | null) {
    form.value.packing_dus_tipe = tipe
    if (tipe && (!form.value.packing_dus_qty || form.value.packing_dus_qty <= 0)) {
      form.value.packing_dus_qty = Math.max(1, Math.ceil((form.value.jml_pcs || 100) / 100))
    } else if (!tipe) {
      form.value.packing_dus_qty = 0
    }
    recalculatePriceAuto()
  }

  function toggleFinishing(item: JenisFinishing) {
    const idx = form.value.finishing.indexOf(item)
    if (idx !== -1) {
      form.value.finishing.splice(idx, 1)
    } else {
      if (item === 'HARD_COVER') {
        const scIdx = form.value.finishing.indexOf('SOFT_COVER')
        if (scIdx !== -1) form.value.finishing.splice(scIdx, 1)
      } else if (item === 'SOFT_COVER') {
        const hcIdx = form.value.finishing.indexOf('HARD_COVER')
        if (hcIdx !== -1) form.value.finishing.splice(hcIdx, 1)
      }
      form.value.finishing.push(item)
    }
    recalculatePriceAuto()
  }

  function onJmlPcsInput(e: Event) {
    const target = e.target as HTMLInputElement
    const raw = target.value.replace(/\D/g, '')
    const num = raw ? parseInt(raw, 10) : 0
    form.value.jml_pcs = num
    target.value = num ? num.toLocaleString('id-ID') : ''
    recalculatePriceAuto()
  }

  function onCetakBWInput(e: Event) {
    const target = e.target as HTMLInputElement
    const raw = target.value.replace(/\D/g, '')
    const num = raw ? parseInt(raw, 10) : 0
    form.value.cetak_bw = num
    target.value = num ? num.toLocaleString('id-ID') : (raw === '0' ? '0' : '')
    recalculatePriceAuto()
  }

  function onCetakFCInput(e: Event) {
    const target = e.target as HTMLInputElement
    const raw = target.value.replace(/\D/g, '')
    const num = raw ? parseInt(raw, 10) : 0
    form.value.cetak_fc = num
    target.value = num ? num.toLocaleString('id-ID') : (raw === '0' ? '0' : '')
    recalculatePriceAuto()
  }

  function onPackingDusQtyInput(e: Event) {
    const target = e.target as HTMLInputElement
    const raw = target.value.replace(/\D/g, '')
    const num = raw ? parseInt(raw, 10) : 0
    form.value.packing_dus_qty = num
    target.value = num ? num.toLocaleString('id-ID') : ''
    recalculatePriceAuto()
  }

  function onTotalHargaInput(e: Event) {
    const target = e.target as HTMLInputElement
    const raw = target.value.replace(/\D/g, '')
    const num = raw ? parseInt(raw, 10) : 0
    form.value.total_harga = num
    target.value = num ? num.toLocaleString('id-ID') : ''
    isCustomPrice.value = true
  }

  function applyPricelistCalculation() {
    form.value.total_harga = priceBreakdown.value.total_harga
    isCustomPrice.value = false
  }

  function resetForm() {
    form.value = {
      tanggal: getTodayISO(),
      skema_harga: 'NORMAL' as SkemaHarga,
      nama_penerbit: '',
      judul_buku: '',
      nama_penulis: '',
      alamat_penerbit: '',
      kontak_penerbit: '',
      jml_pcs: 100,
      ukuran: 'A5',
      ukuran_custom: '',
      kertas: 'BP_57',
      kertas_bw: 'BP_57',
      kertas_fc: 'HVS_80',
      is_kertas_sama: true,
      packing_dus_tipe: null,
      packing_dus_qty: 0,
      cetak_bw: 150,
      cetak_fc: 0,
      finishing: ['SOFT_COVER'],
      total_harga: 0,
      catatan: '',
    }
    isCustomPrice.value = false
    recalculatePriceAuto()
  }

  return {
    form,
    clients,
    customClients,
    customTitles,
    customAuthors,
    customAddresses,
    customContacts,
    clientOptions,
    bookTitleOptions,
    authorOptions,
    addressOptions,
    contactOptions,
    priceBreakdown,
    tarifBW,
    tarifFC,
    isFormValid,
    isCustomPrice,
    setSkemaHarga,
    setUkuran,
    setKertas,
    toggleKertasDual,
    setKertasBW,
    setKertasFC,
    setPackingTipe,
    toggleFinishing,
    onClientSelect,
    onClientAdd,
    onBookSelect,
    onBookAdd,
    onAuthorAdd,
    onAddressAdd,
    onContactAdd,
    onJmlPcsInput,
    onCetakBWInput,
    onCetakFCInput,
    onPackingDusQtyInput,
    onTotalHargaInput,
    applyPricelistCalculation,
    recalculatePriceAuto,
    resetForm,
  }
}
