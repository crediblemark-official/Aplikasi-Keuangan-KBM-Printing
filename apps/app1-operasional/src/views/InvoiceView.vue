<template>
  <ion-page>
    <ion-header class="ion-no-border no-print">
      <PageHeader
        :show-back="true"
        back-label="Detail Order"
        @back="orderId ? router.push(`/order/${orderId}`) : router.push('/order/list')"
      >
        <template #title>
          <div class="flex items-center gap-2 min-w-0">
            <span class="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0"></span>
            <span class="text-xs sm:text-sm font-bold text-slate-900 font-mono tracking-tight truncate">
              {{ nomorInvoice || 'Faktur Penjualan' }}
            </span>
            <span
              v-if="order"
              class="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0"
              :class="sisaTagihan === 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : totalMasuk > 0 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-rose-50 text-rose-700 border border-rose-200'"
            >
              {{ sisaTagihan === 0 ? 'LUNAS' : totalMasuk > 0 ? 'DP MASUK' : 'BELUM BAYAR' }}
            </span>
          </div>
        </template>

        <template #actions>
          <div v-if="order" class="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <!-- Setting Button -->
            <button
              @click="isSettingModalOpen = true"
              class="btn-secondary !h-8.5 sm:!h-9 !w-8.5 sm:!w-auto !p-0 sm:!px-3 !rounded-xl !text-xs !font-bold inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-xs active:scale-95 transition-all"
              title="Edit Profil Percetakan & Rekening"
            >
              <svg class="w-4 h-4 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span class="hidden sm:inline">Info Invoice</span>
            </button>

            <!-- Export PDF Button -->
            <button
              @click="printInvoice"
              :disabled="isPrinting"
              class="btn-secondary !h-8.5 sm:!h-9 !w-8.5 sm:!w-auto !p-0 sm:!px-3.5 !rounded-xl !text-xs !font-bold inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-xs active:scale-95 transition-all"
              title="Export PDF Faktur"
            >
              <ion-spinner v-if="isPrinting" name="crescent" class="w-3.5 h-3.5 text-red-600"></ion-spinner>
              <template v-else>
                <svg class="w-4 h-4 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span class="hidden sm:inline">Export PDF</span>
              </template>
            </button>

            <!-- WhatsApp Button -->
            <button
              @click="sendWhatsApp"
              :disabled="isSendingWA"
              class="btn-primary !h-8.5 sm:!h-9 !w-8.5 sm:!w-auto !p-0 sm:!px-3.5 !rounded-xl !text-xs !font-bold inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-xs active:scale-95 transition-all"
              title="Kirim Faktur via WhatsApp"
            >
              <ion-spinner v-if="isSendingWA" name="crescent" class="w-3.5 h-3.5 text-white"></ion-spinner>
              <template v-else>
                <svg class="w-4 h-4 text-white shrink-0 fill-current" viewBox="0 0 16 16">
                  <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.655.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.596-6.592 6.596m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.016-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.707 1.916.81 2.049c.098.133 1.39 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
                </svg>
                <span class="hidden sm:inline">Kirim WhatsApp</span>
              </template>
            </button>
          </div>
        </template>
      </PageHeader>
    </ion-header>

    <ion-content :fullscreen="true">
      <!-- Loading State -->
      <div v-if="isLoading && !order" class="flex flex-col items-center justify-center py-20 gap-3">
        <ion-spinner name="crescent" class="w-8 h-8 text-indigo-600"></ion-spinner>
        <p class="text-xs text-slate-400 font-medium">Memuat data faktur / invoice...</p>
      </div>

      <!-- Not Found / Error State -->
      <div v-else-if="!order" class="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div class="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 class="text-sm font-bold text-slate-800">Order Tidak Ditemukan</h3>
        <p class="text-xs text-slate-500 mt-1 max-w-xs">
          Order <span class="font-mono font-semibold text-slate-700">{{ orderId }}</span> tidak ditemukan dalam sistem.
        </p>
        <div class="flex items-center gap-2 mt-4">
          <button @click="loadData" class="btn-secondary h-8.5 px-3.5 text-xs font-bold cursor-pointer">
            Muat Ulang
          </button>
          <button @click="router.push('/order/list')" class="btn-primary h-8.5 px-3.5 text-xs font-bold cursor-pointer">
            Ke Daftar Order
          </button>
        </div>
      </div>

      <!-- Invoice Paper Container -->
      <div
        v-else
        class="invoice-outer-container w-full min-h-full py-3 sm:py-6 pb-32 lg:pb-12 bg-slate-100/90 overflow-x-auto print:bg-white print:p-0 print:m-0 print:w-full print:min-h-0"
      >
        <InvoicePaper
          :order="order"
          :company="company"
          :nomor-invoice="nomorInvoice"
          :total-masuk="totalMasuk"
          :sisa-tagihan="sisaTagihan"
          :invoice-items="invoiceItems"
        />

        <!-- Setting Drawer -->
        <InvoiceSettingDrawer
          :is-open="isSettingModalOpen"
          :initial-profile="company"
          @close="isSettingModalOpen = false"
          @save="handleSaveSettings"
          @reset="handleResetSettings"
        />
      </div>
    </ion-content>

    <!-- Mobile Bottom Action Bar -->
    <div
      v-if="order"
      class="fixed bottom-0 left-0 right-0 z-50 px-4 py-3 bg-white/95 backdrop-blur-md border-t border-slate-200 lg:hidden no-print"
    >
      <div class="grid grid-cols-2 gap-3">
        <button
          @click="printInvoice"
          :disabled="isPrinting"
          class="btn-secondary h-11 justify-center text-xs font-bold rounded-xl cursor-pointer"
        >
          <span v-if="isPrinting">
            <ion-spinner name="crescent" class="w-4 h-4 text-indigo-600"></ion-spinner>
          </span>
          <span v-else class="flex items-center justify-center gap-2">
            <svg class="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Export PDF</span>
          </span>
        </button>
        <button
          @click="sendWhatsApp"
          :disabled="isSendingWA"
          class="btn-primary h-11 justify-center text-xs font-bold rounded-xl !bg-[#4f46e5] cursor-pointer"
        >
          <span v-if="isSendingWA">
            <ion-spinner name="crescent" class="w-4 h-4"></ion-spinner>
          </span>
          <span v-else class="flex items-center justify-center gap-2">
            <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <span>WhatsApp</span>
          </span>
        </button>
      </div>
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
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  IonPage, IonHeader, IonContent, IonSpinner, IonToast, useIonRouter, onIonViewWillEnter,
} from '@ionic/vue'
import PageHeader from '@shared/components/PageHeader.vue'
import InvoicePaper from '../components/invoice/InvoicePaper.vue'
import InvoiceSettingDrawer from '../components/invoice/InvoiceSettingDrawer.vue'
import { useInvoiceData } from '../composables/useInvoiceData'
import { useCompanyStore, type CompanyProfile } from '@shared/stores/companyStore'

const route = useRoute()
const router = useIonRouter()
const companyStore = useCompanyStore()

const orderId = computed(() => ((route.params.orderId as string) || '').trim())
const isSettingModalOpen = ref(false)
const toastOpen = ref(false)
const toastMsg = ref('')
const toastColor = ref('success')

const {
  company,
  order,
  isLoading,
  isPrinting,
  isSendingWA,
  nomorInvoice,
  totalMasuk,
  sisaTagihan,
  invoiceItems,
  printInvoice,
  sendWhatsApp,
  loadData,
} = useInvoiceData(orderId)

function handleSaveSettings(profile: CompanyProfile) {
  companyStore.updateProfile(profile)
  isSettingModalOpen.value = false
  toastMsg.value = 'Pengaturan info invoice & rekening berhasil disimpan!'
  toastColor.value = 'success'
  toastOpen.value = true
}

function handleResetSettings() {
  companyStore.resetProfile()
  toastMsg.value = 'Pengaturan info invoice dikembalikan ke bawaan.'
  toastColor.value = 'warning'
  toastOpen.value = true
}

onMounted(() => {
  loadData()
})

onIonViewWillEnter(() => {
  loadData()
})
</script>
