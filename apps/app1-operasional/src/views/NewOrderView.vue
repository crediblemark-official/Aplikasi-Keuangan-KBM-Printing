<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <PageHeader
        :title="isEditMode ? 'Edit Order Cetak' : 'Order Cetak Baru'"
        :subtitle="isEditMode ? `ID Order: ${editOrderId}` : ''"
        :show-back="true"
        back-label="Daftar Order"
        @back="router.push('/order/list')"
      >
        <template #actions>
          <div v-if="isEditMode" class="flex items-center gap-2">
            <span class="font-mono text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
              {{ editOrderId }}
            </span>
          </div>
          <button
            v-else
            type="button"
            @click="orderForm.resetForm"
            class="btn-secondary h-8 text-xs font-semibold px-2.5 rounded-md cursor-pointer text-slate-500 hover:text-slate-800"
          >
            Reset Form
          </button>
        </template>
      </PageHeader>
    </ion-header>

    <ion-content :fullscreen="true">
      <form @submit.prevent="submitOrder" class="w-full min-h-full pb-28 lg:pb-12 bg-white">
        <div class="grid grid-cols-1 lg:grid-cols-12 border-b border-slate-200">

          <!-- Left Column: Identitas & Spesifikasi Teknis -->
          <div class="lg:col-span-7 border-b lg:border-b-0 lg:border-r border-slate-200">
            <OrderIdentitySection
              :form="orderForm.form.value"
              :client-options="orderForm.clientOptions.value"
              :book-title-options="orderForm.bookTitleOptions.value"
              :author-options="orderForm.authorOptions.value"
              :address-options="orderForm.addressOptions.value"
              :contact-options="orderForm.contactOptions.value"
              @client-select="orderForm.onClientSelect"
              @client-add="orderForm.onClientAdd"
              @book-select="orderForm.onBookSelect"
              @book-add="orderForm.onBookAdd"
              @author-add="orderForm.onAuthorAdd"
              @address-add="orderForm.onAddressAdd"
              @contact-add="orderForm.onContactAdd"
              @toggle-langganan="(isLangganan) => orderForm.setSkemaHarga(isLangganan ? 'LANGGANAN' : 'NORMAL')"
            />

            <OrderTechnicalSpecSection
              :form="orderForm.form.value"
              :price-breakdown="orderForm.priceBreakdown.value"
              :tarif-b-w="orderForm.tarifBW.value"
              :tarif-f-c="orderForm.tarifFC.value"
              :ukuran-options="ukuranOptions"
              :kertas-options="kertasOptions"
              :finishing-options="finishingOptions"
              @set-ukuran="orderForm.setUkuran"
              @set-kertas="orderForm.setKertas"
              @set-kertas-bw="orderForm.setKertasBW"
              @set-kertas-fc="orderForm.setKertasFC"
              @toggle-kertas-dual="orderForm.toggleKertasDual"
              @toggle-finishing="orderForm.toggleFinishing"
              @set-packing-tipe="orderForm.setPackingTipe"
              @input-jml-pcs="orderForm.onJmlPcsInput"
              @input-cetak-bw="orderForm.onCetakBWInput"
              @input-cetak-fc="orderForm.onCetakFCInput"
              @input-packing-qty="orderForm.onPackingDusQtyInput"
            />
          </div>

          <!-- Right Column: Biaya, Estimasi, Catatan, Submit -->
          <div class="lg:col-span-5">
            <OrderPricingSection
              :form="orderForm.form.value"
              :price-breakdown="orderForm.priceBreakdown.value"
              :is-custom-price="orderForm.isCustomPrice.value"
              :is-form-valid="orderForm.isFormValid.value"
              :is-submitting="orderStore.isLoading"
              :is-edit-mode="isEditMode"
              @set-skema="orderForm.setSkemaHarga"
              @apply-pricelist="orderForm.applyPricelistCalculation"
              @input-total-harga="orderForm.onTotalHargaInput"
            />
          </div>

        </div>
      </form>
    </ion-content>

    <!-- Mobile Sticky Bottom Bar -->
    <div class="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-[8px] sm:px-[15px] py-3 bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center justify-between gap-3 shadow-lg">
      <div class="min-w-0">
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Biaya</p>
        <p class="font-mono font-black text-red-600 text-base sm:text-lg truncate">
          {{ formatRupiah(orderForm.form.value.total_harga || 0) }}
        </p>
      </div>
      <button
        type="button"
        @click="submitOrder"
        :disabled="orderStore.isLoading || !orderForm.isFormValid.value"
        class="btn-primary h-11 px-5 justify-center text-xs sm:text-sm font-bold flex-shrink-0 shadow-2xs"
      >
        <span v-if="orderStore.isLoading" class="flex items-center justify-center gap-2">
          <ion-spinner name="crescent" class="w-4 h-4"></ion-spinner>
          <span>Menyimpan...</span>
        </span>
        <span v-else class="flex items-center justify-center gap-2">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>{{ isEditMode ? 'Simpan Perubahan' : 'Simpan Order' }}</span>
        </span>
      </button>
    </div>

    <!-- Error Toast -->
    <ion-toast
      :is-open="toastOpen"
      :message="toastMsg"
      :duration="3000"
      position="top"
      color="danger"
      @didDismiss="toastOpen = false"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  IonPage, IonHeader, IonContent, IonSpinner, IonToast, useIonRouter, onIonViewWillEnter,
} from '@ionic/vue'
import PageHeader from '@shared/components/PageHeader.vue'
import OrderIdentitySection from '../components/order/OrderIdentitySection.vue'
import OrderTechnicalSpecSection from '../components/order/OrderTechnicalSpecSection.vue'
import OrderPricingSection from '../components/order/OrderPricingSection.vue'
import {
  useNewOrderForm,
  ukuranOptions,
  kertasOptions,
  finishingOptions,
} from '../composables/useNewOrderForm'
import { useOrderStore } from '../stores/orders'
import { formatRupiah, getTodayISO } from '@shared/utils/formatters'
import { api } from '@shared/api/gasClient'
import type { UkuranBuku, JenisKertas, JenisFinishing, SkemaHarga } from '@shared/types'

const orderStore = useOrderStore()
const router = useIonRouter()
const route = useRoute()
const orderForm = useNewOrderForm()

const isEditMode = computed(() => Boolean(route.params.id || route.query.edit))
const editOrderId = computed(() => String(route.params.id || route.query.edit || ''))

const toastOpen = ref(false)
const toastMsg = ref('')

async function loadExistingOrder() {
  if (!editOrderId.value) return
  await orderStore.ensureOrderLoaded(editOrderId.value)
  const existing = orderStore.orders.find((o) => o.id_order.trim() === editOrderId.value.trim())
  if (existing) {
    const rawJudulPenulis = existing.judul_penulis || ''
    const parts = rawJudulPenulis.split(' / ')
    const derivedJudul = existing.judul_buku || parts[0]?.trim() || ''
    const derivedPenulis = existing.nama_penulis || (parts.length > 1 ? parts.slice(1).join(' / ').trim() : '')

    let parsedFinishing: JenisFinishing[] = ['SOFT_COVER']
    if (Array.isArray(existing.finishing)) {
      parsedFinishing = [...existing.finishing]
    } else if (typeof existing.finishing === 'string') {
      const raw = (existing.finishing as string).trim()
      if (raw.startsWith('[') && raw.endsWith(']')) {
        try {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed) && parsed.length > 0) parsedFinishing = parsed
        } catch {}
      } else {
        const upper = raw.toUpperCase()
        if (upper.includes('HARD_COVER') || upper.includes('HARDCOVER')) {
          parsedFinishing = ['HARD_COVER']
        } else if (upper.includes('SOFT_COVER') || upper.includes('SOFTCOVER')) {
          parsedFinishing = ['SOFT_COVER']
        }
      }
    }

    orderForm.form.value = {
      tanggal: existing.tanggal ? String(existing.tanggal).split('T')[0] : getTodayISO(),
      skema_harga: (existing.skema_harga as SkemaHarga) || 'NORMAL',
      nama_penerbit: existing.nama_penerbit || '',
      judul_buku: derivedJudul,
      nama_penulis: derivedPenulis,
      alamat_penerbit: existing.alamat_penerbit || '',
      kontak_penerbit: existing.kontak_penerbit || '',
      jml_pcs: existing.jml_pcs || 100,
      ukuran: (existing.ukuran as UkuranBuku) || 'A5',
      ukuran_custom: existing.ukuran_custom || '',
      kertas: (existing.kertas as JenisKertas) || 'BP_57',
      kertas_bw: (existing.kertas_bw as JenisKertas) || (existing.kertas as JenisKertas) || 'BP_57',
      kertas_fc: (existing.kertas_fc as JenisKertas) || (existing.kertas as JenisKertas) || 'HVS_80',
      is_kertas_sama: !existing.kertas_fc || existing.kertas_bw === existing.kertas_fc,
      packing_dus_tipe: existing.packing_dus_tipe || null,
      packing_dus_qty: existing.packing_dus_qty || 0,
      cetak_bw: existing.cetak_bw || 0,
      cetak_fc: existing.cetak_fc || 0,
      finishing: parsedFinishing,
      total_harga: existing.total_harga || 0,
      catatan: existing.catatan || '',
    }
    orderForm.isCustomPrice.value = true
  }
}

async function submitOrder() {
  if (!orderForm.isFormValid.value) return

  const formVal = orderForm.form.value
  const judulBuku = String(formVal.judul_buku || '').trim()
  const namaPenulis = String(formVal.nama_penulis || '').trim()
  const combinedJudulPenulis = namaPenulis ? `${judulBuku} / ${namaPenulis}` : judulBuku

  const orderPayload = {
    tanggal: formVal.tanggal || getTodayISO(),
    nama_penerbit: String(formVal.nama_penerbit || '').trim(),
    judul_penulis: combinedJudulPenulis,
    judul_buku: judulBuku,
    nama_penulis: namaPenulis,
    jml_pcs: Number(formVal.jml_pcs) || 1,
    ukuran: formVal.ukuran,
    ukuran_custom: formVal.ukuran_custom ? String(formVal.ukuran_custom).trim() : '',
    kertas: formVal.kertas_bw || formVal.kertas,
    kertas_bw: formVal.is_kertas_sama ? formVal.kertas : formVal.kertas_bw,
    kertas_fc: formVal.is_kertas_sama ? formVal.kertas : formVal.kertas_fc,
    packing_dus_tipe: formVal.packing_dus_tipe,
    packing_dus_qty: formVal.packing_dus_qty,
    biaya_packing: orderForm.priceBreakdown.value.biaya_packing_total,
    cetak_bw: Number(formVal.cetak_bw) || 0,
    cetak_fc: Number(formVal.cetak_fc) || 0,
    finishing: formVal.finishing,
    total_harga: Number(formVal.total_harga) || 0,
    skema_harga: formVal.skema_harga || 'NORMAL',
    catatan: formVal.catatan ? String(formVal.catatan).trim() : '',
    alamat_penerbit: formVal.alamat_penerbit ? String(formVal.alamat_penerbit).trim() : '',
    kontak_penerbit: formVal.kontak_penerbit != null ? String(formVal.kontak_penerbit).trim() : '',
  }

  if (isEditMode.value) {
    const res = await orderStore.updateOrder({
      id_order: editOrderId.value,
      ...orderPayload,
    })

    if (res && res.success) {
      router.push(`/order/${editOrderId.value}`)
    } else {
      toastMsg.value = res?.error || orderStore.error || 'Gagal memperbarui order'
      toastOpen.value = true
    }
  } else {
    const result = await orderStore.createOrder(orderPayload)

    if (result && result.id_order) {
      router.push(`/invoice/${result.id_order.trim()}`)
    } else {
      toastMsg.value = orderStore.error ?? 'Gagal menyimpan order'
      toastOpen.value = true
    }
  }
}

async function initView() {
  orderForm.recalculatePriceAuto()
  try {
    const res = await api.getClients()
    if (res.success && res.data) orderForm.clients.value = res.data
  } catch (err) {
    console.warn('Failed to load client list:', err)
  }
  if (orderStore.orders.length === 0) {
    await orderStore.fetchOrders().catch((err) => console.warn('Failed to fetch orders:', err))
  }
  if (isEditMode.value) {
    await loadExistingOrder()
  } else if (route.query.penerbit) {
    const pubName = String(route.query.penerbit).trim()
    orderForm.form.value.nama_penerbit = pubName
    const matched = [...orderForm.customClients.value, ...orderForm.clients.value].find(
      (c) => c.nama_penerbit.trim().toLowerCase() === pubName.toLowerCase()
    )
    if (matched) {
      if (matched.kontak && !orderForm.form.value.kontak_penerbit) orderForm.form.value.kontak_penerbit = matched.kontak
      if (matched.alamat && !orderForm.form.value.alamat_penerbit) orderForm.form.value.alamat_penerbit = matched.alamat
    }
  }
}

onMounted(async () => {
  await initView()
})

onIonViewWillEnter(async () => {
  if (isEditMode.value) {
    await loadExistingOrder()
  }
})

watch(
  () => editOrderId.value,
  async (newId) => {
    if (newId) {
      await loadExistingOrder()
    } else {
      orderForm.resetForm()
    }
  }
)
</script>
