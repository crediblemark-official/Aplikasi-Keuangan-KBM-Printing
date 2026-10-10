<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <PageHeader
        :title="targetOrderId ? `Catat Bayar • ${targetOrderId}` : 'Catat Pembayaran'"
        :show-back="true"
        :back-label="targetOrderId ? 'Detail Order' : 'Daftar Order'"
        @back="handleBack"
      />
    </ion-header>

    <ion-content :fullscreen="true">
      <!-- Loading Order State -->
      <div v-if="isLoading && !selectedOrder" class="flex flex-col items-center justify-center py-20 gap-3">
        <ion-spinner name="crescent" class="w-8 h-8 text-red-600"></ion-spinner>
        <p class="text-xs text-slate-400 font-medium">Memuat data order & sisa tagihan...</p>
      </div>

      <!-- State: No Order ID provided (Standalone /payment/new access) -->
      <div v-else-if="!targetOrderId" class="max-w-lg mx-auto py-16 px-4 text-center">
        <div
          class="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 border border-indigo-100 shadow-xs">
          <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 class="text-base font-bold text-slate-800">Pilih Order Terlebih Dahulu</h3>
        <p class="text-xs text-slate-500 mt-1.5 leading-relaxed">
          Pembayaran masuk kini terikat otomatis dengan order pelanggan. Silakan buka halaman detail pesanan, lalu klik
          tombol <strong class="text-slate-700">"Catat Pembayaran Masuk"</strong>.
        </p>
        <div class="mt-6 flex justify-center gap-2">
          <button @click="router.push('/order/list')" class="btn-primary h-9 px-4 text-xs font-bold cursor-pointer">
            Buka Daftar Order
          </button>
        </div>
      </div>

      <!-- State: Order ID Not Found -->
      <div v-else-if="!selectedOrder" class="max-w-lg mx-auto py-16 px-4 text-center">
        <div
          class="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
          <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 class="text-base font-bold text-slate-800">Pesanan Tidak Ditemukan</h3>
        <p class="text-xs text-slate-500 mt-1">
          Order <span class="font-mono font-bold text-slate-700">{{ targetOrderId }}</span> tidak ditemukan.
        </p>
        <div class="mt-5 flex justify-center gap-2">
          <button @click="loadData(true)" class="btn-secondary h-8.5 px-3.5 text-xs font-bold">
            Muat Ulang
          </button>
          <button @click="router.push('/order/list')" class="btn-primary h-8.5 px-3.5 text-xs font-bold">
            Ke Daftar Order
          </button>
        </div>
      </div>

      <!-- MAIN DYNAMIC FORM (Bound directly to targetOrderId) -->
      <form v-else @submit.prevent="submitPayment" class="w-full min-h-full pb-32 lg:pb-12 bg-white">
        <div class="grid grid-cols-1 lg:grid-cols-12 border-b border-slate-200">
          <!-- LEFT COLUMN: Order Context & Financial Summary -->
          <PaymentOrderSummary
            :order="selectedOrder"
            :total-terbayar="totalTerbayar"
            :sisa-tagihan="sisaTagihan"
          />

          <!-- RIGHT COLUMN: Payment Form Steps & Desktop Submit -->
          <PaymentFormSteps
            :form="form"
            :sisa-tagihan="sisaTagihan"
            :publisher-deposit-balance="publisherDepositBalance"
            :existing-pelunasan-payments="existingPelunasanPayments"
            :existing-dp-payments="existingDpPayments"
            :existing-pelunasan-summary="existingPelunasanSummary"
            :existing-dp-summary="existingDpSummary"
            :is-nominal-exceeds-sisa="isNominalExceedsSisa"
            :is-form-valid="isFormValid"
            :is-submitting="isSubmitting"
            :jenis-pembayaran-options="jenisPembayaranOptions"
            :metode-options="metodeOptions"
            @select-jenis="selectJenisPembayaran"
            @use-deposit="useDepositQuick"
            @nominal-input="onNominalInput"
            @proof-change="handleProofChange"
            @submit="submitPayment"
          />
        </div>
      </form>
    </ion-content>

    <!-- Mobile Sticky Submit Button (Full edge bar) -->
    <div
      v-if="selectedOrder"
      class="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 py-3 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg"
    >
      <button
        type="button"
        @click="submitPayment"
        :disabled="isSubmitting || !isFormValid || sisaTagihan <= 0 || isNominalExceedsSisa"
        class="btn-primary w-full h-11 justify-center text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
        <span v-if="isSubmitting" class="flex items-center justify-center gap-2">
          <ion-spinner name="crescent" class="w-4 h-4"></ion-spinner>
          <span>Menyimpan...</span>
        </span>
        <span v-else-if="sisaTagihan <= 0" class="flex items-center justify-center gap-2">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>Pesanan Sudah Lunas</span>
        </span>
        <span v-else class="flex items-center justify-center gap-2">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>Simpan Pembayaran ({{ formatRupiah(form.nominal || 0) }})</span>
        </span>
      </button>
    </div>

    <!-- Toast Notification -->
    <ion-toast
      :is-open="toastOpen"
      :message="toastMsg"
      :duration="3000"
      position="top"
      :color="toastColor"
      @didDismiss="toastOpen = false"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  IonPage, IonHeader, IonContent, IonSpinner, IonToast, useIonRouter, onIonViewWillEnter,
} from '@ionic/vue'
import PageHeader from '@shared/components/PageHeader.vue'
import PaymentOrderSummary from '../components/payment/PaymentOrderSummary.vue'
import PaymentFormSteps from '../components/payment/PaymentFormSteps.vue'
import { useNewPaymentForm } from '../composables/useNewPaymentForm'
import { formatRupiah } from '@shared/utils/formatters'

const route = useRoute()
const router = useIonRouter()

const targetOrderId = computed(() => {
  return ((route.params.orderId as string) || (route.query.orderId as string) || '').trim()
})

const {
  selectedOrder,
  isLoading,
  isSubmitting,
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
  onNominalInput,
  selectJenisPembayaran,
  handleProofChange,
  loadData,
  submitPayment,
} = useNewPaymentForm(targetOrderId)

function handleBack() {
  if (targetOrderId.value) {
    router.push(`/order/${targetOrderId.value}`)
  } else if (router.canGoBack()) {
    router.back()
  } else {
    router.push('/order/list')
  }
}

onMounted(() => {
  loadData()
})

onIonViewWillEnter(() => {
  loadData()
})
</script>
