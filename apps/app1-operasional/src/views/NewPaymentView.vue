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
        <div class="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 border border-indigo-100 shadow-xs">
          <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 class="text-base font-bold text-slate-800">Pilih Order Terlebih Dahulu</h3>
        <p class="text-xs text-slate-500 mt-1.5 leading-relaxed">
          Pembayaran masuk kini terikat otomatis dengan order pelanggan. Silakan buka halaman detail pesanan, lalu klik tombol <strong class="text-slate-700">"Catat Pembayaran Masuk"</strong>.
        </p>
        <div class="mt-6 flex justify-center gap-2">
          <button @click="router.push('/order/list')" class="btn-primary h-9 px-4 text-xs font-bold cursor-pointer">
            Buka Daftar Order
          </button>
        </div>
      </div>

      <!-- State: Order ID Not Found -->
      <div v-else-if="!selectedOrder" class="max-w-lg mx-auto py-16 px-4 text-center">
        <div class="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
          <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 class="text-base font-bold text-slate-800">Pesanan Tidak Ditemukan</h3>
        <p class="text-xs text-slate-500 mt-1">
          Order <span class="font-mono font-bold text-slate-700">{{ targetOrderId }}</span> tidak ditemukan.
        </p>
        <div class="mt-5 flex justify-center gap-2">
          <button @click="loadData" class="btn-secondary h-8.5 px-3.5 text-xs font-bold">
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

          <!-- LEFT COLUMN: Order Context & Financial Summary (lg:col-span-5) -->
          <div class="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-slate-200 bg-white lg:bg-slate-50/30">
            <div class="lg:sticky lg:top-0 z-10">
              <!-- Order Header Summary -->
              <div class="p-3.5 sm:p-4 space-y-2 bg-white">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="px-2 py-0.5 rounded text-xs font-bold font-mono bg-slate-100 border border-slate-200 text-slate-700">
                    {{ selectedOrder.id_order }}
                  </span>
                  <span
                    class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                    :class="sisaTagihan === 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' : totalTerbayar > 0 ? 'bg-amber-50 text-amber-700 border border-amber-300' : 'bg-rose-50 text-rose-700 border border-rose-300'"
                  >
                    {{ sisaTagihan === 0 ? 'Lunas' : totalTerbayar > 0 ? 'DP Masuk' : 'Belum Bayar' }}
                  </span>
                </div>
                <div>
                  <h2 class="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug">
                    {{ selectedOrder.nama_penerbit }}
                  </h2>
                  <p class="text-xs text-slate-500 font-medium mt-0.5">
                    Buku: <strong class="text-slate-800">{{ selectedOrder.judul_buku || selectedOrder.judul_penulis }}</strong>
                  </p>
                </div>
              </div>

              <!-- Financial Metrics Tiles (Crisp 1px grid divider) -->
              <div class="grid grid-cols-3 bg-slate-200 gap-px border-t border-b border-slate-200 text-center">
                <div class="bg-white p-2.5">
                  <p class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total Nilai</p>
                  <p class="text-xs sm:text-sm font-bold font-mono text-slate-900 mt-0.5">{{ formatRupiah(selectedOrder.total_harga) }}</p>
                </div>
                <div class="bg-white p-2.5">
                  <p class="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">Sudah Masuk</p>
                  <p class="text-xs sm:text-sm font-bold font-mono text-emerald-600 mt-0.5">{{ formatRupiah(totalTerbayar) }}</p>
                </div>
                <div class="bg-white p-2.5">
                  <p class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Sisa Tagihan</p>
                  <p class="text-xs sm:text-sm font-bold font-mono mt-0.5" :class="sisaTagihan === 0 ? 'text-emerald-600' : 'text-red-600'">
                    {{ formatRupiah(sisaTagihan) }}
                  </p>
                </div>
              </div>

              <!-- Desktop Guidance Note -->
              <div class="hidden lg:block p-4 text-xs text-slate-500 leading-relaxed space-y-2">
                <p class="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Petunjuk Pembayaran</p>
                <ul class="list-disc list-inside space-y-1 text-slate-500 text-xs">
                  <li>Pilih jenis pembayaran: <strong class="text-slate-700">Uang Muka (DP)</strong> atau <strong class="text-slate-700">Pelunasan</strong>.</li>
                  <li>Gunakan pilihan cepat nominal (50%, 100%, sisa tagihan) untuk mengisi cepat.</li>
                  <li>Pilih metode pembayaran (Saldo Deposit, Tunai, Bank, atau QRIS).</li>
                  <li><strong class="text-slate-700">Potong Deposit:</strong> Otomatis aktif jika penerbit memiliki saldo deposit dari Buku Kas.</li>
                  <li>Unggah foto struk atau bukti transfer jika ada untuk verifikasi.</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- RIGHT COLUMN: Payment Form Steps & Submit (lg:col-span-7) -->
          <div class="lg:col-span-7 bg-white flex flex-col justify-between">
            <div>

              <!-- STEP 1: JENIS PEMBAYARAN -->
              <div class="border-b border-slate-200">
                <SectionHeader title="1. Jenis Pembayaran" />

                <div class="p-3.5 sm:p-4 space-y-3">
                  <div class="grid grid-cols-2 gap-2.5">
                    <label
                      v-for="jp in jenisPembayaranOptions"
                      :key="jp.value"
                      class="cursor-pointer p-2.5 rounded-lg border transition-all flex items-center gap-2.5 select-none"
                      :class="form.jenis_pembayaran === jp.value ? 'border-red-600 bg-red-50/40 ring-1 ring-red-600/30' : 'border-slate-200 bg-white hover:bg-slate-50'"
                    >
                      <input type="radio" v-model="form.jenis_pembayaran" :value="jp.value" class="hidden" @change="onJenisBayarChanged" />
                      <div
                        class="w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs shrink-0 transition-colors"
                        :class="form.jenis_pembayaran === jp.value ? 'bg-red-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'"
                      >
                        {{ jp.value === 'DP' ? 'DP' : '✓' }}
                      </div>
                      <div class="min-w-0">
                        <p class="text-slate-900 text-xs font-bold truncate">{{ jp.label }}</p>
                        <p class="text-slate-500 text-[10px] truncate">{{ jp.desc }}</p>
                      </div>
                    </label>
                  </div>

                  <!-- Lunas Notice if sisaTagihan is 0 -->
                  <div v-if="sisaTagihan === 0" class="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                    <svg class="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Pesanan ini sudah lunas terverifikasi.</span>
                  </div>
                </div>
              </div>

              <!-- STEP 2: NOMINAL & METODE PEMBAYARAN -->
              <div class="border-b border-slate-200">
                <SectionHeader title="2. Nominal & Metode Pembayaran" />

                <div class="p-3.5 sm:p-4 space-y-3.5">
                  <!-- Banner Saldo Deposit Penerbit -->
                  <div
                    v-if="publisherDepositBalance > 0"
                    class="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between gap-2 shadow-2xs"
                  >
                    <div class="flex items-center gap-2.5 min-w-0">
                      <div class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-base shrink-0">
                        💳
                      </div>
                      <div class="min-w-0">
                        <p class="text-xs font-bold text-emerald-900 truncate">Penerbit memiliki Saldo Deposit</p>
                        <p class="text-[11px] text-emerald-700 font-semibold font-mono">{{ formatRupiah(publisherDepositBalance) }} tersedia</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      @click="useDepositQuick"
                      class="px-2.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg transition-colors shrink-0 shadow-2xs cursor-pointer"
                    >
                      Potong Deposit
                    </button>
                  </div>

                  <!-- Nominal Input -->
                  <div class="space-y-1">
                    <div class="flex items-center justify-between">
                      <label class="text-xs font-bold text-slate-700">Nominal Pembayaran *</label>
                      <span class="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {{ formatRupiah(form.nominal || 0) }}
                      </span>
                    </div>
                    <div class="flex rounded-lg border border-slate-300 overflow-hidden focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500 bg-white shadow-2xs">
                      <span class="inline-flex items-center px-3 bg-slate-100 border-r border-slate-200 text-xs font-mono font-bold text-slate-500 select-none">
                        Rp
                      </span>
                      <input
                        :value="form.nominal ? form.nominal.toLocaleString('id-ID') : ''"
                        type="text"
                        inputmode="numeric"
                        placeholder="0"
                        class="w-full px-3 py-2 text-sm sm:text-base font-bold font-mono text-slate-800 outline-none border-0 bg-transparent"
                        required
                        @input="onNominalInput"
                      />
                    </div>
                  </div>

                  <!-- Quick Percentage / Balance Chips -->
                  <div v-if="selectedOrder && quickPresets.length > 0" class="space-y-1.5">
                    <p class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pilihan Cepat Nominal:</p>
                    <div class="flex flex-wrap gap-2">
                      <button
                        v-for="p in quickPresets"
                        :key="p.id"
                        type="button"
                        class="filter-pill"
                        :class="{ active: activePreset === p.id }"
                        @click="applyQuickPreset(p)"
                      >
                        {{ p.label }}
                      </button>
                    </div>
                  </div>

                  <!-- Metode Bayar -->
                  <div class="space-y-1.5 pt-1.5 border-t border-slate-100">
                    <label class="text-xs font-bold text-slate-700">Metode Pembayaran</label>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <label
                        v-for="m in metodeOptions"
                        :key="m.value"
                        class="py-2 px-2 text-center rounded-lg border transition-all select-none flex flex-col justify-center"
                        :class="[
                          m.disabled ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400' : 'cursor-pointer',
                          !m.disabled && form.metode === m.value ? 'border-red-600 bg-red-50/40 ring-1 ring-red-600/30 text-red-900 font-bold' : (!m.disabled ? 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700' : '')
                        ]"
                      >
                        <input type="radio" v-model="form.metode" :value="m.value" :disabled="m.disabled" class="hidden" />
                        <p class="text-xs font-bold truncate">{{ m.label }}</p>
                        <p class="text-[10px] mt-0.5 truncate" :class="m.disabled ? 'text-slate-400 italic' : 'text-slate-400'">{{ m.desc }}</p>
                      </label>
                    </div>
                  </div>

                  <!-- Keterangan -->
                  <div class="space-y-1 pt-1.5 border-t border-slate-100">
                    <label class="text-xs font-semibold text-slate-600">Keterangan / Catatan Pembayaran (opsional)</label>
                    <input
                      v-model="form.keterangan"
                      placeholder="Contoh: Transfer Bank a.n. Penerbit..."
                      class="form-input text-xs py-2 rounded-lg border-slate-200 focus:border-red-500 focus:ring-red-100"
                    />
                  </div>
                </div>
              </div>

              <!-- STEP 3: BUKTI PEMBAYARAN -->
              <div class="border-b border-slate-200">
                <SectionHeader title="3. Bukti Pembayaran (Opsional)" />
                <div class="p-3.5 sm:p-4 space-y-2">
                  <p class="text-slate-500 text-xs">Foto bukti transfer, nota fisik, atau struk pembayaran</p>
                  <ImageUploader ref="proofUploaderRef" :compact="true" @change="handleProofChange" />
                </div>
              </div>

            </div>

            <!-- Desktop Submit Button -->
            <div class="hidden lg:block p-3.5 sm:p-4 bg-slate-50/60 border-t border-slate-200">
              <button
                type="button"
                @click="submitPayment"
                :disabled="isSubmitting || !isFormValid"
                class="btn-primary w-full h-9.5 justify-center text-xs font-bold rounded-lg shadow-xs cursor-pointer"
              >
                <span v-if="isSubmitting" class="flex items-center justify-center gap-2">
                  <ion-spinner name="crescent" class="w-4 h-4"></ion-spinner>
                  <span>Menyimpan Pembayaran...</span>
                </span>
                <span v-else class="flex items-center justify-center gap-2">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Simpan & Catat Pembayaran ({{ formatRupiah(form.nominal || 0) }})</span>
                </span>
              </button>
            </div>

          </div>

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
        :disabled="isSubmitting || !isFormValid"
        class="btn-primary w-full h-11 justify-center text-xs font-bold rounded-xl cursor-pointer"
      >
        <span v-if="isSubmitting" class="flex items-center justify-center gap-2">
          <ion-spinner name="crescent" class="w-4 h-4"></ion-spinner>
          <span>Menyimpan...</span>
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
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  IonPage, IonHeader, IonContent, IonSpinner, IonToast, useIonRouter, onIonViewWillEnter,
} from '@ionic/vue'
import PageHeader from '@shared/components/PageHeader.vue'
import SectionHeader from '@shared/components/SectionHeader.vue'
import { useOrderStore } from '../stores/orders'
import { useAuthStore } from '../stores/auth'
import { api } from '@shared/api/gasClient'
import ImageUploader from '@shared/components/ImageUploader.vue'
import { formatRupiah, getTodayISO } from '@shared/utils/formatters'
import type { JenisPembayaran, MetodeBayar, KasMasuk } from '@shared/types'

const route = useRoute()
const router = useIonRouter()
const orderStore = useOrderStore()
const authStore = useAuthStore()

const targetOrderId = computed(() => {
  return ((route.params.orderId as string) || (route.query.orderId as string) || '').trim()
})

const selectedOrder = computed(() =>
  orderStore.orders.find((o) => (o.id_order || '').trim() === targetOrderId.value),
)

const kasMasukList = ref<KasMasuk[]>([])
const isLoading = ref(true)
const isSubmitting = ref(false)
const proofUploaderRef = ref<InstanceType<typeof ImageUploader>>()
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

const jenisPembayaranOptions = [
  { value: 'DP', label: 'Uang Muka (DP)', desc: 'Pembayaran termin 1 / DP' },
  { value: 'PELUNASAN', label: 'Pelunasan', desc: 'Pelunasan sisa tagihan' },
]

const publisherDepositBalance = computed(() => {
  const penerbit = String(selectedOrder.value?.nama_penerbit || '').trim().toLowerCase()
  if (!penerbit) return 0

  const allKm = orderStore.kasMasukList.length > 0 ? orderStore.kasMasukList : kasMasukList.value

  // Total deposit masuk untuk penerbit ini
  const totalDeposit = allKm
    .filter((k) => String(k.nama_penerbit || '').trim().toLowerCase() === penerbit && k.jenis_pembayaran === 'DEPOSIT' && (k.status_verifikasi as any) !== 'BATAL')
    .reduce((sum, k) => sum + (Number(k.nominal) || 0), 0)

  // Total yang sudah terpakai untuk potong saldo deposit
  const totalTerpakai = allKm
    .filter((k) => String(k.nama_penerbit || '').trim().toLowerCase() === penerbit && k.metode === 'SALDO_DEPOSIT' && (k.status_verifikasi as any) !== 'BATAL')
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
    { value: 'BANK_BCA' as MetodeBayar, label: 'Bank', desc: 'Transfer Bank', disabled: false },
    { value: 'QRIS' as MetodeBayar, label: 'QRIS', desc: 'Scan Statis / Dinamis', disabled: false },
  ]
  return list
})

function useDepositQuick() {
  form.value.metode = 'SALDO_DEPOSIT'
  const maxCanUse = Math.min(sisaTagihan.value, publisherDepositBalance.value)
  form.value.nominal = maxCanUse
}

// Sum of all verified or recorded payments for this order
const totalTerbayar = computed(() =>
  kasMasukList.value
    .filter((k) => k.status_verifikasi !== 'BATAL' as any)
    .reduce((s, k) => s + k.nominal, 0),
)

const sisaTagihan = computed(() =>
  Math.max(0, (selectedOrder.value?.total_harga ?? 0) - totalTerbayar.value),
)

const isFormValid = computed(() => {
  return Boolean(targetOrderId.value && form.value.nominal > 0)
})

interface QuickPreset {
  id: string
  label: string
  nominal: number
  jenis: JenisPembayaran
}

const activePreset = ref<string | null>(null)

const quickPresets = computed<QuickPreset[]>(() => {
  if (!selectedOrder.value || selectedOrder.value.total_harga <= 0) return []
  const total = selectedOrder.value.total_harga
  const sisa = sisaTagihan.value

  if (totalTerbayar.value > 0) {
    if (sisa <= 0) return []
    return [
      {
        id: 'sisa',
        label: `Lunasi Seluruh Sisa (${formatRupiah(sisa)})`,
        nominal: sisa,
        jenis: 'PELUNASAN',
      },
    ]
  } else {
    return [
      {
        id: 'dp50',
        label: `DP 50% (${formatRupiah(Math.round(total * 0.5))})`,
        nominal: Math.round(total * 0.5),
        jenis: 'DP',
      },
      {
        id: 'full',
        label: `Langsung Lunas 100% (${formatRupiah(total)})`,
        nominal: total,
        jenis: 'PELUNASAN',
      },
    ]
  }
})

function onNominalInput(e: Event) {
  const target = e.target as HTMLInputElement
  const raw = target.value.replace(/\D/g, '')
  const num = raw ? parseInt(raw, 10) : 0
  form.value.nominal = num
  target.value = num ? num.toLocaleString('id-ID') : ''
  activePreset.value = null
}

function applyQuickPreset(preset: QuickPreset) {
  activePreset.value = preset.id
  form.value.nominal = preset.nominal
  form.value.jenis_pembayaran = preset.jenis
}

function onJenisBayarChanged() {
  if (form.value.jenis_pembayaran === 'PELUNASAN' && sisaTagihan.value > 0) {
    form.value.nominal = sisaTagihan.value
    activePreset.value = totalTerbayar.value > 0 ? 'sisa' : 'full'
  } else if (form.value.jenis_pembayaran === 'DP' && (!form.value.nominal || form.value.nominal === sisaTagihan.value)) {
    if (selectedOrder.value) {
      form.value.nominal = Math.round(selectedOrder.value.total_harga * 0.5)
      activePreset.value = 'dp50'
    }
  }
}

function handleBack() {
  if (targetOrderId.value) {
    router.push(`/order/${targetOrderId.value}`)
  } else if (router.canGoBack()) {
    router.back()
  } else {
    router.push('/order/list')
  }
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

async function loadData() {
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

    // Smart default nominal & payment type
    if (selectedOrder.value) {
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

import { useSyncStore } from '@shared/stores/syncStore'

async function submitPayment() {
  if (!isFormValid.value || isSubmitting.value) return

  // Validasi pemotongan deposit
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
      keterangan: form.value.keterangan || (isDepositMethod ? `Potong saldo deposit ${selectedOrder.value?.nama_penerbit || ''}` : undefined),
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
        // MODE OFFLINE PEMBAYARAN
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

onMounted(() => {
  loadData()
})

onIonViewWillEnter(() => {
  loadData()
})
</script>
