<template>
  <div class="lg:col-span-7 bg-white flex flex-col justify-between">
    <div>
      <!-- STEP 1: JENIS PEMBAYARAN -->
      <div class="border-b border-slate-200">
        <SectionHeader title="1. Jenis Pembayaran" />

        <div class="p-3.5 sm:p-4 space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              v-for="jp in jenisPembayaranOptions"
              :key="jp.value"
              @click="$emit('select-jenis', jp)"
              class="cursor-pointer p-2.5 rounded-lg transition-opacity flex items-center gap-3 select-none text-left bg-transparent hover:opacity-85"
            >
              <div
                class="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors"
                :class="form.jenis_pembayaran === jp.value ? 'bg-red-600 text-white shadow-xs' : 'bg-slate-100 text-slate-400'"
              >
                {{ jp.badge }}
              </div>
              <div class="min-w-0 flex-1">
                <p
                  class="text-xs font-bold truncate"
                  :class="form.jenis_pembayaran === jp.value ? 'text-slate-900' : 'text-slate-600'"
                >
                  {{ jp.label }}
                </p>
                <p
                  class="text-[11px] truncate mt-0.5"
                  :class="form.jenis_pembayaran === jp.value ? 'text-red-600 font-semibold' : 'text-slate-400'"
                >
                  {{ jp.desc }}
                </p>
              </div>
            </button>
          </div>

          <!-- Lunas Notice if sisaTagihan is 0 -->
          <div
            v-if="sisaTagihan === 0"
            class="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-start gap-2.5 shadow-2xs"
          >
            <svg
              class="w-5 h-5 text-emerald-600 shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p class="font-bold text-emerald-900">Pesanan ini sudah Lunas!</p>
              <p class="text-[11px] text-emerald-700 mt-0.5">
                Seluruh tagihan pesanan telah selesai dibayar. Tidak diperlukan pencatatan pembayaran lagi.
              </p>
            </div>
          </div>

          <!-- Warning if existingPelunasanPayments > 0 and PELUNASAN chosen -->
          <div
            v-if="form.jenis_pembayaran === 'PELUNASAN' && existingPelunasanPayments.length > 0"
            class="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1 shadow-2xs"
          >
            <div class="flex items-center gap-1.5 font-bold text-amber-800">
              <svg class="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Perhatian: Order Ini Sudah Memiliki Riwayat Pelunasan!</span>
            </div>
            <p class="text-[11px] text-amber-700 leading-relaxed">
              Order ini sudah pernah dicatat pelunasan:
              <strong>{{ existingPelunasanSummary }}</strong>.
              Harap pastikan kembali agar tidak terjadi pencatatan pelunasan ganda.
            </p>
          </div>

          <!-- Info if DP already exists and DP chosen -->
          <div
            v-else-if="form.jenis_pembayaran === 'DP' && existingDpPayments.length > 0"
            class="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs space-y-0.5"
          >
            <div class="flex items-center gap-1.5 font-bold text-blue-800">
              <svg class="w-4 h-4 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Info: Order ini sudah pernah membayar DP</span>
            </div>
            <p class="text-[11px] text-blue-700">
              Sudah ada DP tercatat sebesar <strong>{{ existingDpSummary }}</strong>. Disarankan memilih <strong>Pelunasan</strong> untuk menyelesaikan sisa tagihan.
            </p>
          </div>
        </div>
      </div>

      <!-- STEP 2: NOMINAL & METODE PEMBAYARAN -->
      <div class="border-b border-slate-200">
        <SectionHeader title="2. Nominal & Metode Pembayaran" />

        <div class="p-3.5 sm:p-4 space-y-3.5">
          <!-- Banner Saldo Deposit Penerbit -->
          <div v-if="publisherDepositBalance > 0"
            class="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between gap-2 shadow-2xs">
            <div class="flex items-center gap-2.5 min-w-0">
              <div
                class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-base shrink-0">
                💳
              </div>
              <div class="min-w-0">
                <p class="text-xs font-bold text-emerald-900 truncate">Penerbit memiliki Saldo Deposit</p>
                <p class="text-[11px] text-emerald-700 font-semibold font-mono">
                  {{ formatRupiah(publisherDepositBalance) }} tersedia
                </p>
              </div>
            </div>
            <button type="button" @click="$emit('use-deposit')"
              class="px-2.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg transition-colors shrink-0 shadow-2xs cursor-pointer">
              Potong Deposit
            </button>
          </div>

          <!-- Nominal Input -->
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold text-slate-700">Nominal Pembayaran *</label>
              <div class="flex items-center gap-2">
                <span v-if="sisaTagihan > 0" class="text-[11px] text-slate-500 font-mono">
                  Maks: <strong class="text-slate-700">{{ formatRupiah(sisaTagihan) }}</strong>
                </span>
                <span
                  class="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {{ formatRupiah(form.nominal || 0) }}
                </span>
              </div>
            </div>
            <div
              class="flex rounded-lg border overflow-hidden focus-within:ring-2 bg-white shadow-2xs transition-all"
              :class="isNominalExceedsSisa ? 'border-rose-400 focus-within:border-rose-500 focus-within:ring-rose-100' : 'border-slate-300 focus-within:border-red-500 focus-within:ring-red-100'">
              <span
                class="inline-flex items-center px-3 bg-slate-100 border-r border-slate-200 text-xs font-mono font-bold text-slate-500 select-none">
                Rp
              </span>
              <input :value="form.nominal ? form.nominal.toLocaleString('id-ID') : ''" type="text"
                inputmode="numeric" placeholder="0"
                class="w-full px-3 py-2 text-sm sm:text-base font-bold font-mono text-slate-800 outline-none border-0 bg-transparent"
                required @input="$emit('nominal-input', $event)" />
            </div>
            <p v-if="isNominalExceedsSisa"
              class="text-xs text-rose-600 font-semibold flex items-center gap-1 mt-1">
              <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Nominal melebihi sisa tagihan! Maksimal: {{ formatRupiah(sisaTagihan) }}</span>
            </p>
          </div>

          <!-- Metode Bayar -->
          <div class="space-y-1.5 pt-1.5 border-t border-slate-100">
            <label class="text-xs font-bold text-slate-700">Metode Pembayaran</label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <label v-for="m in metodeOptions" :key="m.value"
                class="py-2 px-2 text-center rounded-lg border transition-all select-none flex flex-col justify-center"
                :class="[
                  m.disabled
                    ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400'
                    : 'cursor-pointer',
                  !m.disabled && form.metode === m.value
                    ? 'border-red-600 bg-red-50/40 ring-1 ring-red-600/30 text-red-900 font-bold'
                    : (!m.disabled ? 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700' : '')
                ]">
                <input type="radio" v-model="form.metode" :value="m.value" :disabled="m.disabled"
                  class="hidden" />
                <p class="text-xs font-bold truncate">{{ m.label }}</p>
                <p class="text-[10px] mt-0.5 truncate"
                  :class="m.disabled ? 'text-slate-400 italic' : 'text-slate-400'">{{ m.desc }}</p>
              </label>
            </div>
          </div>

          <!-- Keterangan -->
          <div class="space-y-1.5 pt-1.5 border-t border-slate-100">
            <label class="text-xs font-semibold text-slate-600">
              Keterangan / Catatan Pembayaran (opsional)
            </label>
            <input v-model="form.keterangan" placeholder="Contoh: Transfer Bank a.n. Penerbit..."
              class="form-input text-xs py-2 rounded-lg border-slate-200 focus:border-red-500 focus:ring-red-100" />
          </div>
        </div>
      </div>

      <!-- STEP 3: BUKTI PEMBAYARAN -->
      <div class="border-b border-slate-200">
        <SectionHeader title="3. Bukti Pembayaran (Opsional)" />
        <div class="p-3.5 sm:p-4 space-y-2">
          <p class="text-slate-500 text-xs">Foto bukti transfer, nota fisik, atau struk pembayaran</p>
          <ImageUploader :compact="true" @change="$emit('proof-change', $event)" />
        </div>
      </div>

    </div>

    <!-- Desktop Submit Button -->
    <div class="hidden lg:block p-3.5 sm:p-4 bg-slate-50/60 border-t border-slate-200">
      <button
        type="button"
        @click="$emit('submit')"
        :disabled="isSubmitting || !isFormValid || sisaTagihan <= 0 || isNominalExceedsSisa"
        class="btn-primary w-full h-9.5 justify-center text-xs font-bold rounded-lg shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
        <span v-if="isSubmitting" class="flex items-center justify-center gap-2">
          <ion-spinner name="crescent" class="w-4 h-4"></ion-spinner>
          <span>Menyimpan Pembayaran...</span>
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
          <span>Simpan & Catat Pembayaran ({{ formatRupiah(form.nominal || 0) }})</span>
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonSpinner } from '@ionic/vue'
import SectionHeader from '@shared/components/SectionHeader.vue'
import ImageUploader from '@shared/components/ImageUploader.vue'
import { formatRupiah } from '@shared/utils/formatters'
import type { JenisOption } from '../../composables/useNewPaymentForm'
import type { KasMasuk, MetodeBayar } from '@shared/types'

defineProps<{
  form: {
    jenis_pembayaran: any
    nominal: number
    metode: MetodeBayar
    keterangan: string
  }
  sisaTagihan: number
  publisherDepositBalance: number
  existingPelunasanPayments: KasMasuk[]
  existingDpPayments: KasMasuk[]
  existingPelunasanSummary: string
  existingDpSummary: string
  isNominalExceedsSisa: boolean
  isFormValid: boolean
  isSubmitting: boolean
  jenisPembayaranOptions: JenisOption[]
  metodeOptions: Array<{ value: MetodeBayar; label: string; desc: string; disabled?: boolean }>
}>()

defineEmits<{
  (e: 'select-jenis', option: JenisOption): void
  (e: 'use-deposit'): void
  (e: 'nominal-input', event: Event): void
  (e: 'proof-change', data: { base64: string; filename: string } | null): void
  (e: 'submit'): void
}>()
</script>
