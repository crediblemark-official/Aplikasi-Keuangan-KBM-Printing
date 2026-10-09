<template>
  <div class="bg-white lg:sticky lg:top-0 z-10 lg:max-h-[calc(100vh-56px)] lg:overflow-y-auto">
    <SectionHeader title="3. Biaya & Pembayaran">
      <template #actions>
        <button
          type="button"
          @click="emit('apply-pricelist')"
          class="text-xs font-semibold text-red-600 hover:text-red-800 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 hover:bg-red-100 transition-colors cursor-pointer border border-red-200"
          title="Hitung ulang otomatis berdasarkan pricelist resmi"
        >
          ⚡ Hitung Ulang
        </button>
      </template>
    </SectionHeader>

    <div class="p-[8px] sm:p-[15px] lg:p-[20px] bg-white space-y-4">
      <!-- Skema Tarif Selector -->
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label class="form-label mb-0">Skema Tarif *</label>
          <span
            :class="form.skema_harga === 'LANGGANAN' ? 'text-amber-800 bg-amber-50 border-amber-300' : 'text-slate-600 bg-slate-100 border-slate-200'"
            class="text-[10px] font-bold px-1.5 py-0.5 rounded border"
          >
            {{ form.skema_harga === 'LANGGANAN' ? '⭐ Tarif Khusus Langganan' : '🏷️ Tarif Reguler / Normal' }}
          </span>
        </div>
        <div class="grid grid-cols-2 p-1 bg-slate-100 rounded-lg border border-slate-200/80 gap-1">
          <button
            type="button"
            @click="emit('set-skema', 'NORMAL')"
            :class="form.skema_harga === 'NORMAL'
              ? 'bg-white text-slate-900 shadow-2xs font-bold'
              : 'text-slate-500 hover:text-slate-900 font-medium'"
            class="h-8.5 px-3 rounded-md text-xs font-sans transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer outline-none focus:outline-none focus:ring-0 active:outline-none select-none"
          >
            <span>🏷️</span>
            <span>Harga Normal</span>
          </button>
          <button
            type="button"
            @click="emit('set-skema', 'LANGGANAN')"
            :class="form.skema_harga === 'LANGGANAN'
              ? 'bg-amber-500 text-white shadow-2xs font-bold'
              : 'text-slate-500 hover:text-slate-900 font-medium'"
            class="h-8.5 px-3 rounded-md text-xs font-sans transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer outline-none focus:outline-none focus:ring-0 active:outline-none select-none"
          >
            <span>⭐</span>
            <span>Harga Langganan</span>
          </button>
        </div>
      </div>

      <!-- Harga Input -->
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label class="form-label mb-0">Harga (Total Tagihan Rp) *</label>
          <span v-if="isCustomPrice" class="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-semibold">
            Manual
          </span>
          <span v-else class="text-[10px] text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200 font-semibold">
            Otomatis (Pricelist)
          </span>
        </div>
        <div class="flex rounded-lg border border-slate-300 overflow-hidden focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500 bg-white shadow-2xs">
          <span class="inline-flex items-center px-3 bg-slate-100 border-r border-slate-200 text-slate-600 font-mono font-bold text-sm sm:text-base select-none">
            Rp
          </span>
          <input
            :value="form.total_harga ? form.total_harga.toLocaleString('id-ID') : ''"
            type="text"
            inputmode="numeric"
            placeholder="0"
            class="w-full px-3 py-2 text-xl sm:text-2xl font-black text-red-600 font-mono tracking-tight outline-none border-0 bg-transparent"
            required
            @input="emit('input-total-harga', $event)"
          />
        </div>
        <p class="font-mono font-bold text-emerald-700 text-xs mt-1">
          {{ formatRupiah(form.total_harga || 0) }}
        </p>
      </div>

      <!-- Rincian Biaya Box -->
      <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
        <p class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Rincian Estimasi</p>
        <div class="flex justify-between text-slate-600">
          <span>Harga per Buku:</span>
          <span class="font-mono font-bold text-slate-900">{{ formatRupiah(priceBreakdown.harga_per_pcs) }} / pcs</span>
        </div>
        <div class="flex justify-between text-slate-600">
          <span>Biaya Cetak Isi (BW + FC):</span>
          <span class="font-mono text-slate-800">{{ formatRupiah(priceBreakdown.biaya_cetak_bw_per_pcs + priceBreakdown.biaya_cetak_fc_per_pcs) }} / pcs</span>
        </div>
        <div class="flex justify-between text-slate-600">
          <span>Biaya Finishing:</span>
          <span class="font-mono text-slate-800">
            {{ formatRupiah(priceBreakdown.biaya_finishing_per_pcs) }} / pcs
            <span v-if="priceBreakdown.diskon_finishing_persen > 0" class="text-[10px] text-emerald-600 font-bold">(-{{ priceBreakdown.diskon_finishing_persen }}%)</span>
          </span>
        </div>
        <div class="pt-2 border-t border-slate-200 flex justify-between items-center">
          <span class="font-semibold text-slate-700">Total Oplah ({{ form.jml_pcs || 0 }} pcs):</span>
          <span class="font-mono font-extrabold text-red-600 text-sm">{{ formatRupiah(priceBreakdown.total_harga) }}</span>
        </div>
      </div>

      <!-- Catatan Order -->
      <div>
        <label class="form-label">Catatan Order (opsional)</label>
        <textarea
          v-model="form.catatan"
          rows="3"
          placeholder="Instruksi khusus, deadline, nomor SPK, pengiriman, dll..."
          class="form-input resize-none text-xs"
        ></textarea>
      </div>

      <!-- Desktop Submit Button -->
      <div class="hidden lg:block pt-3 border-t border-slate-100">
        <button
          type="submit"
          :disabled="isSubmitting || !isFormValid"
          class="btn-primary w-full h-11 justify-center text-sm font-bold shadow-2xs"
        >
          <span v-if="isSubmitting" class="flex items-center justify-center gap-2">
            <ion-spinner name="crescent" class="w-4 h-4"></ion-spinner>
            <span>{{ isEditMode ? 'Menyimpan Perubahan...' : 'Menyimpan Order...' }}</span>
          </span>
          <span v-else class="flex items-center justify-center gap-2">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{{ isEditMode ? 'Simpan Perubahan Order' : 'Simpan Order & Buat Invoice' }}</span>
          </span>
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { IonSpinner } from '@ionic/vue'
import SectionHeader from '@shared/components/SectionHeader.vue'
import { formatRupiah } from '@shared/utils/formatters'
import type { SkemaHarga } from '@shared/types'

defineProps<{
  form: any
  priceBreakdown: any
  isCustomPrice: boolean
  isFormValid: boolean
  isSubmitting: boolean
  isEditMode: boolean
}>()

const emit = defineEmits<{
  (e: 'set-skema', skema: SkemaHarga): void
  (e: 'apply-pricelist'): void
  (e: 'input-total-harga', event: Event): void
}>()
</script>
