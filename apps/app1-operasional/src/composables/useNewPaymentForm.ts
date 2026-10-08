import { ref, computed } from 'vue'
import { useIonRouter } from '@ionic/vue'
import { useOrderStore } from '../stores/orders'
import { useAuthStore } from '../stores/auth'
import { useSyncStore } from '@shared/stores/syncStore'
import { api } from '@shared/api/gasClient'
import { formatRupiah, getTodayISO } from '@shared/utils/formatters'
import type { JenisPembayaran, MetodeBayar, KasMasuk } from '@shared/types'

export interface JenisOption {
  value: JenisPembayaran
  label: string
  desc: string
  nominal: number
  badge: string
}

export function useNewPaymentForm(targetOrderId: import('vue').Ref<string>) {
  const router = useIonRouter()
  const orderStore = useOrderStore()
  const authStore = useAuthStore()

  const selectedOrder = computed(() =>
    orderStore.orders.find((o) => (o.id_order || '').trim() === targetOrderId.value)
  )

  const kasMasukList = ref<KasMasuk[]>([])
  const isLoading = ref(true)
  const isSubmitting = ref(false)
  const photoBase64 = ref('')
  const photoFilename = ref('')
  const toastOpen = ref(false)
  const toastMsg = ref('')
  const toastColor = ref('success')

  const form = ref({
    id_order: targetOrderId.value,
    jenis_pembayaran: 'DP' as JenisPembayaran,
    nominal: 0,
    metode: 'KASIR_TUNAI' as MetodeBayar,
    keterangan: '',
  })

  const publisherDepositBalance = computed(() => {
    const penerbit = String(selectedOrder.value?.nama_penerbit || '').trim().toLowerCase()
    if (!penerbit) return 0

    const allKm = orderStore.kasMasukList

    const totalDeposit = allKm
      .filter(
        (k) =>
          String(k.nama_penerbit || '').trim().toLowerCase() === penerbit &&
          k.jenis_pembayaran === 'DEPOSIT' &&
          (k.status_verifikasi as any) === 'VERIFIED'
      )
      .reduce((sum, k) => sum + (Number(k.nominal) || 0), 0)

    const totalTerpakai = allKm
      .filter(
        (k) =>
          String(k.nama_penerbit || '').trim().toLowerCase() === penerbit &&
          k.metode === 'SALDO_DEPOSIT' &&
          (k.status_verifikasi as any) === 'VERIFIED'
      )
      .reduce((sum, k) => sum + (Number(k.nominal) || 0), 0)

    return Math.max(0, totalDeposit - totalTerpakai)
  })

  const metodeOptions = computed(() => {
    const depositAvailable = publisherDepositBalance.value > 0
    const list: Array<{ value: MetodeBayar; label: string; desc: string; disabled?: boolean }> = [
      {
        value: 'SALDO_DEPOSIT' as MetodeBayar,
        label: '💳 Saldo Deposit',
        desc: depositAvailable ? `Sisa: ${formatRupiah(publisherDepositBalance.value)}` : 'Saldo Rp 0 (Kosong)',
        disabled: !depositAvailable,
      },
      { value: 'KASIR_TUNAI' as MetodeBayar, label: 'Tunai', desc: 'Pembayaran Tunai', disabled: false },
      { value: 'BANK' as MetodeBayar, label: 'Bank', desc: 'Transfer Bank', disabled: false },
      { value: 'QRIS' as MetodeBayar, label: 'QRIS', desc: 'Scan Statis / Dinamis', disabled: false },
    ]
    return list
  })

  function useDepositQuick() {
    form.value.metode = 'SALDO_DEPOSIT'
    const maxCanUse = Math.min(sisaTagihan.value, publisherDepositBalance.value)
    form.value.nominal = maxCanUse
  }

  const totalTerbayar = computed(() =>
    kasMasukList.value
      .filter((k) => (k.status_verifikasi as any) !== 'BATAL')
      .reduce((s, k) => s + k.nominal, 0)
  )

  const sisaTagihan = computed(() =>
    Math.max(0, (selectedOrder.value?.total_harga ?? 0) - totalTerbayar.value)
  )

  const existingPelunasanPayments = computed(() =>
    kasMasukList.value.filter(
      (k) => k.jenis_pembayaran === 'PELUNASAN' && (k.status_verifikasi as any) !== 'BATAL'
    )
  )

  const existingDpPayments = computed(() =>
    kasMasukList.value.filter(
      (k) => k.jenis_pembayaran === 'DP' && (k.status_verifikasi as any) !== 'BATAL'
    )
  )

  const isNominalExceedsSisa = computed(() => {
    return form.value.nominal > sisaTagihan.value
  })

  const existingPelunasanSummary = computed(() => {
    return existingPelunasanPayments.value
      .map((p) => `${formatRupiah(p.nominal)} (${p.tanggal ? p.tanggal.split('T')[0] : ''})`)
      .join(', ')
  })

  const existingDpSummary = computed(() => {
    return existingDpPayments.value
      .map((p) => formatRupiah(p.nominal))
      .join(', ')
  })

  const isFormValid = computed(() => {
    return Boolean(
      targetOrderId.value &&
        form.value.nominal > 0 &&
        sisaTagihan.value > 0 &&
        form.value.nominal <= sisaTagihan.value
    )
  })

  const jenisPembayaranOptions = computed<JenisOption[]>(() => {
    const total = selectedOrder.value?.total_harga || 0
    const sisa = sisaTagihan.value
    const masuk = totalTerbayar.value

    const dpNominal = Math.round(total * 0.5)

    let dpDesc = 'Pembayaran termin 1'
    if (total > 0) {
      dpDesc = `DP 50% (${formatRupiah(dpNominal)})`
    }

    let pelunasanDesc = 'Pelunasan tagihan'
    if (total > 0) {
      pelunasanDesc =
        masuk > 0 ? `Sisa Tagihan (${formatRupiah(sisa)})` : `Langsung Lunas 100% (${formatRupiah(total)})`
    }

    return [
      {
        value: 'DP' as JenisPembayaran,
        label: 'Uang Muka (DP)',
        desc: dpDesc,
        nominal: dpNominal,
        badge: 'DP',
      },
      {
        value: 'PELUNASAN' as JenisPembayaran,
        label: 'Pelunasan',
        desc: pelunasanDesc,
        nominal: sisa,
        badge: '✓',
      },
    ]
  })

  const activePreset = ref<string | null>(null)
  const userInteractedWithJenis = ref(false)

  function onNominalInput(e: Event) {
    userInteractedWithJenis.value = true
    const target = e.target as HTMLInputElement
    const raw = target.value.replace(/\D/g, '')
    const num = raw ? parseInt(raw, 10) : 0
    form.value.nominal = num
    target.value = num ? num.toLocaleString('id-ID') : ''
    activePreset.value = null
  }

  function selectJenisPembayaran(option: JenisOption) {
    userInteractedWithJenis.value = true
    form.value.jenis_pembayaran = option.value
    form.value.nominal = option.nominal
    activePreset.value = option.value === 'DP' ? 'dp50' : totalTerbayar.value > 0 ? 'sisa' : 'full'
  }

  function handleProofChange(data: { base64: string; filename: string } | null) {
    if (data) {
      photoBase64.value = data.base64
      photoFilename.value = data.filename
    } else {
      photoBase64.value = ''
      photoFilename.value = ''
    }
  }

  let loadPromise: Promise<void> | null = null

  async function doLoadData() {
    if (!targetOrderId.value) {
      isLoading.value = false
      return
    }

    isLoading.value = true

    try {
      if (!selectedOrder.value) {
        await orderStore.ensureOrderLoaded(targetOrderId.value)
      }

      form.value.id_order = targetOrderId.value

      const [resOrderKm, _] = await Promise.all([
        api.getKasMasuk({ id_order: targetOrderId.value }),
        orderStore.fetchKasMasuk(true),
      ])
      if (resOrderKm.success && resOrderKm.data) {
        kasMasukList.value = resOrderKm.data
      }

      if (selectedOrder.value && !userInteractedWithJenis.value) {
        if (totalTerbayar.value > 0 && sisaTagihan.value > 0) {
          form.value.jenis_pembayaran = 'PELUNASAN'
          form.value.nominal = sisaTagihan.value
          activePreset.value = 'sisa'
        } else if (sisaTagihan.value > 0) {
          form.value.jenis_pembayaran = 'DP'
          form.value.nominal = Math.round(selectedOrder.value.total_harga * 0.5)
          activePreset.value = 'dp50'
        } else {
          form.value.nominal = 0
          activePreset.value = null
        }
      }
    } catch (err) {
      console.error('Failed to load order/payment details:', err)
    } finally {
      isLoading.value = false
    }
  }

  function loadData() {
    if (!loadPromise) {
      loadPromise = doLoadData().finally(() => {
        loadPromise = null
      })
    }
    return loadPromise
  }

  async function submitPayment() {
    if (!isFormValid.value || isSubmitting.value) return

    if (sisaTagihan.value <= 0) {
      toastMsg.value = '⚠️ Pesanan ini sudah lunas terverifikasi.'
      toastColor.value = 'warning'
      toastOpen.value = true
      return
    }

    if (form.value.nominal > sisaTagihan.value) {
      toastMsg.value = `⚠️ Nominal melebihi sisa tagihan (${formatRupiah(sisaTagihan.value)})`
      toastColor.value = 'warning'
      toastOpen.value = true
      return
    }

    if (form.value.metode === 'SALDO_DEPOSIT' && form.value.nominal > publisherDepositBalance.value) {
      toastMsg.value = `⚠️ Nominal melebihi sisa saldo deposit penerbit (${formatRupiah(publisherDepositBalance.value)})`
      toastColor.value = 'warning'
      toastOpen.value = true
      return
    }

    isSubmitting.value = true

    try {
      const isDepositMethod = form.value.metode === 'SALDO_DEPOSIT'
      const statusVerifikasi = isDepositMethod ? 'VERIFIED' : 'PENDING'

      const payload = {
        id_order: targetOrderId.value,
        jenis_pembayaran: form.value.jenis_pembayaran,
        nominal: form.value.nominal,
        metode: form.value.metode,
        diinput_oleh: authStore.nama ?? 'OPERASIONAL',
        status_verifikasi: statusVerifikasi,
        nama_penerbit: selectedOrder.value?.nama_penerbit,
        keterangan:
          form.value.keterangan ||
          (isDepositMethod ? `Potong saldo deposit ${selectedOrder.value?.nama_penerbit || ''}` : undefined),
        foto_base64: photoBase64.value || undefined,
        foto_filename: photoFilename.value || undefined,
      }
      const res = await api.createKasMasuk(payload)

      if (res.success) {
        if (res.data?.id_kas_masuk) {
          const newKm: KasMasuk = {
            id_kas_masuk: res.data.id_kas_masuk,
            tanggal: getTodayISO(),
            id_order: targetOrderId.value,
            jenis_pembayaran: form.value.jenis_pembayaran,
            nominal: form.value.nominal,
            metode: form.value.metode,
            diinput_oleh: authStore.nama ?? 'OPERASIONAL',
            status_verifikasi: statusVerifikasi,
            keterangan: form.value.keterangan || '',
            nama_penerbit: selectedOrder.value?.nama_penerbit || '',
          }
          orderStore.kasMasukList = [newKm, ...orderStore.kasMasukList]
        }

        toastMsg.value = `✅ Pembayaran ${formatRupiah(form.value.nominal)} berhasil dicatat!`
        toastColor.value = 'success'
        toastOpen.value = true

        setTimeout(() => {
          router.push(`/order/${targetOrderId.value}`)
        }, 1200)
      } else {
        const isOffline = res.isOffline || (typeof navigator !== 'undefined' && !navigator.onLine)
        if (isOffline) {
          const tempSeq = Date.now().toString(36).slice(-4).toUpperCase()
          const tempId = `KM-OFFLINE-${tempSeq}`

          const offlineKm: KasMasuk = {
            id_kas_masuk: tempId,
            tanggal: getTodayISO(),
            id_order: targetOrderId.value,
            jenis_pembayaran: form.value.jenis_pembayaran,
            nominal: form.value.nominal,
            metode: form.value.metode,
            diinput_oleh: authStore.nama ?? 'OPERASIONAL',
            status_verifikasi: statusVerifikasi,
            keterangan: form.value.keterangan || '',
            nama_penerbit: selectedOrder.value?.nama_penerbit || '',
          }
          orderStore.kasMasukList = [offlineKm, ...orderStore.kasMasukList]

          try {
            const syncStore = useSyncStore()
            syncStore.addLog({
              entity_type: 'KAS_MASUK',
              title: `Kas Masuk [Offline]: ${form.value.jenis_pembayaran} (${form.value.metode})`,
              subtitle: `Order: ${targetOrderId.value} • ID: ${tempId}`,
              nominal: form.value.nominal,
              status: 'PENDING',
              action: 'createKasMasuk',
              payload: { ...payload, temp_id_kas_masuk: tempId },
            })
          } catch (syncErr) {
            console.warn('Failed to queue offline kas masuk:', syncErr)
          }

          toastMsg.value = `✅ Pembayaran ${formatRupiah(form.value.nominal)} dicatat offline (akan tersinkron saat online)!`
          toastColor.value = 'success'
          toastOpen.value = true

          setTimeout(() => {
            router.push(`/order/${targetOrderId.value}`)
          }, 1200)
          return
        }

        toastMsg.value = res.error ?? 'Gagal menyimpan pembayaran'
        toastColor.value = 'danger'
        toastOpen.value = true
      }
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    selectedOrder,
    kasMasukList,
    isLoading,
    isSubmitting,
    photoBase64,
    photoFilename,
    toastOpen,
    toastMsg,
    toastColor,
    form,
    publisherDepositBalance,
    metodeOptions,
    useDepositQuick,
    totalTerbayar,
    sisaTagihan,
    existingPelunasanPayments,
    existingDpPayments,
    isNominalExceedsSisa,
    existingPelunasanSummary,
    existingDpSummary,
    isFormValid,
    jenisPembayaranOptions,
    activePreset,
    userInteractedWithJenis,
    onNominalInput,
    selectJenisPembayaran,
    handleProofChange,
    loadData,
    submitPayment,
  }
}
