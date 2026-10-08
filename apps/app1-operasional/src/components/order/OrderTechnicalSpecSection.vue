<template>
  <div class="bg-white">
    <SectionHeader title="2. Spesifikasi Teknis Cetak" />
    <div class="p-[8px] sm:p-[15px] lg:p-[20px] bg-white space-y-4">
      <!-- Jml (pcs) & Ukuran -->
      <div class="grid grid-cols-1 sm:grid-cols-12 gap-4">
        <div class="sm:col-span-5">
          <div class="flex items-center justify-between mb-1.5">
            <label class="form-label mb-0">Jml (pcs) *</label>
            <span v-if="priceBreakdown.diskon_finishing_persen > 0" class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              Diskon Finishing {{ priceBreakdown.diskon_finishing_persen }}%
            </span>
          </div>
          <div class="flex rounded-lg border border-slate-300 overflow-hidden focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500 bg-white shadow-2xs">
            <input
              :value="form.jml_pcs ? form.jml_pcs.toLocaleString('id-ID') : ''"
              type="text"
              inputmode="numeric"
              placeholder="100"
              class="w-full px-3 py-1.5 font-mono font-bold text-base text-slate-800 outline-none border-0 bg-transparent"
              required
              @input="onJmlPcsInput"
            />
            <span class="inline-flex items-center px-3 bg-slate-100 border-l border-slate-200 text-xs font-bold text-slate-500 select-none">
              pcs
            </span>
          </div>
        </div>

        <div class="sm:col-span-7">
          <div class="flex items-center justify-between mb-1.5">
            <label class="form-label mb-0">Ukuran Buku *</label>
            <button
              v-if="form.ukuran === 'CUSTOM'"
              type="button"
              class="text-[11px] font-semibold text-red-600 hover:text-red-800 cursor-pointer flex items-center gap-1"
              @click="setUkuran('A5')"
            >
              ← Kembali ke Standar
            </button>
          </div>

          <!-- Mode Pilihan Standar -->
          <div v-if="form.ukuran !== 'CUSTOM'" class="flex flex-wrap items-center gap-1.5">
            <button
              v-for="u in ukuranOptions"
              :key="u.value"
              type="button"
              class="btn-chip"
              :class="{ active: form.ukuran === u.value }"
              @click="setUkuran(u.value as UkuranBuku)"
            >
              {{ u.label }}
            </button>
          </div>

          <!-- Mode Custom: Tab lainnya sembunyi, diganti input text -->
          <div v-else class="flex items-center gap-2 max-w-sm">
            <div class="relative flex-1 flex rounded-lg border border-red-400 bg-white overflow-hidden shadow-2xs focus-within:ring-2 focus-within:ring-red-500">
              <span class="inline-flex items-center px-2.5 bg-red-50 border-r border-red-200 text-xs font-bold text-red-700 select-none">
                Custom
              </span>
              <input
                v-model="form.ukuran_custom"
                placeholder="Misal: 14 x 20 cm / Novel Saku"
                class="flex-1 px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                required
                autofocus
              />
            </div>
            <button
              type="button"
              class="btn-chip text-slate-500 hover:text-slate-700 h-8"
              title="Batal custom & kembali ke pilihan standar"
              @click="setUkuran('A5')"
            >
              ✕ Batal
            </button>
          </div>
        </div>
      </div>

      <!-- Jenis Kertas -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <label class="form-label mb-0">Jenis Kertas</label>
            <span class="text-[10px] text-slate-400 font-normal">Pricelist KBM</span>
          </div>
          <!-- Toggle 2 Jenis Kertas jika ada BW & FC -->
          <button
            type="button"
            @click="toggleKertasDual"
            class="text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-all cursor-pointer flex items-center gap-1"
            :class="!form.is_kertas_sama ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'"
          >
            <span>{{ form.is_kertas_sama ? '+ 2 Jenis Kertas (Beda BW/Warna)' : '✓ 2 Jenis Kertas Aktif' }}</span>
          </button>
        </div>

        <!-- Mode 1: Kertas Sama untuk Seluruh Buku -->
        <div v-if="form.is_kertas_sama" class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div
            v-for="k in kertasOptions"
            :key="k.value"
            @click="setKertas(k.value as JenisKertas)"
            class="option-card cursor-pointer p-2.5"
            :class="{ selected: form.kertas === k.value }"
          >
            <div class="w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs flex-shrink-0"
                 :class="form.kertas === k.value ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'">
              {{ form.kertas === k.value ? '✓' : '•' }}
            </div>
            <div class="min-w-0">
              <p class="text-slate-900 text-xs font-bold truncate">{{ k.label }}</p>
              <p class="text-slate-500 text-[10px] truncate">{{ k.sub }}</p>
            </div>
          </div>
        </div>

        <!-- Mode 2: Pemisahan Kertas BW & Kertas Warna (FC) -->
        <div v-else class="space-y-3 p-3 rounded-xl bg-amber-50/60 border border-amber-200">
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-slate-900"></span>
                Kertas Isi BW (Halaman Teks Hitam Putih)
              </span>
              <span class="text-[10px] text-slate-600 font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-amber-200">
                Tarif: Rp {{ tarifBW }}/hal
              </span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <div
                v-for="k in kertasOptions"
                :key="'bw-' + k.value"
                @click="setKertasBW(k.value as JenisKertas)"
                class="option-card cursor-pointer p-2 text-xs"
                :class="{ selected: form.kertas_bw === k.value }"
              >
                <p class="font-bold truncate text-xs">{{ k.label }}</p>
                <p class="text-[9px] text-slate-500 truncate">{{ k.sub }}</p>
              </div>
            </div>
          </div>

          <div class="pt-2 border-t border-amber-200/60">
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-red-600"></span>
                Kertas Isi Warna / FC (Halaman Foto / Full Color)
              </span>
              <span class="text-[10px] text-slate-600 font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-amber-200">
                Tarif: Rp {{ tarifFC }}/hal
              </span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <div
                v-for="k in kertasOptions"
                :key="'fc-' + k.value"
                @click="setKertasFC(k.value as JenisKertas)"
                class="option-card cursor-pointer p-2 text-xs"
                :class="{ selected: form.kertas_fc === k.value }"
              >
                <p class="font-bold truncate text-xs">{{ k.label }}</p>
                <p class="text-[9px] text-slate-500 truncate">{{ k.sub }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Cetak BW & Cetak FC -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="form-label mb-0">Cetak BW (Halaman)</label>
            <span class="text-[10px] text-red-700 font-mono font-bold bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
              Rp {{ tarifBW }}/hal
            </span>
          </div>
          <div class="flex rounded-lg border border-slate-300 overflow-hidden focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500 bg-white shadow-2xs">
            <input
              :value="form.cetak_bw ? form.cetak_bw.toLocaleString('id-ID') : (form.cetak_bw === 0 ? '0' : '')"
              type="text"
              inputmode="numeric"
              placeholder="0"
              class="w-full px-3 py-1.5 font-mono text-sm text-slate-800 outline-none border-0 bg-transparent"
              @input="onCetakBWInput"
            />
            <span class="inline-flex items-center px-2.5 bg-slate-100 border-l border-slate-200 text-xs font-semibold text-slate-500 select-none">
              hal
            </span>
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="form-label mb-0">Cetak FC (Halaman)</label>
            <span class="text-[10px] text-red-700 font-mono font-bold bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
              Rp {{ tarifFC }}/hal
            </span>
          </div>
          <div class="flex rounded-lg border border-slate-300 overflow-hidden focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500 bg-white shadow-2xs">
            <input
              :value="form.cetak_fc ? form.cetak_fc.toLocaleString('id-ID') : (form.cetak_fc === 0 ? '0' : '')"
              type="text"
              inputmode="numeric"
              placeholder="0"
              class="w-full px-3 py-1.5 font-mono text-sm text-slate-800 outline-none border-0 bg-transparent"
              @input="onCetakFCInput"
            />
            <span class="inline-flex items-center px-2.5 bg-slate-100 border-l border-slate-200 text-xs font-semibold text-slate-500 select-none">
              hal
            </span>
          </div>
        </div>
      </div>

      <!-- Finishing Buku -->
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label class="form-label mb-0">Finishing Buku</label>
          <span class="text-[10px] text-slate-400 font-normal">Pilih opsi pengerjaan cover & jilid</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <div
            v-for="f in finishingOptions"
            :key="f.value"
            @click="toggleFinishing(f.value as JenisFinishing)"
            class="option-card cursor-pointer p-2.5"
            :class="{ selected: form.finishing.includes(f.value as JenisFinishing) }"
          >
            <div class="w-5 h-5 rounded flex items-center justify-center font-bold text-xs flex-shrink-0 transition-colors"
                 :class="form.finishing.includes(f.value as JenisFinishing) ? 'bg-red-600 text-white' : 'border border-slate-300 bg-white text-transparent'">
              ✓
            </div>
            <div class="min-w-0">
              <p class="text-slate-900 text-xs font-semibold truncate">{{ f.label }}</p>
              <p class="text-slate-500 text-[10px] truncate">{{ f.sub }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Packing Kardus / Dus Pengiriman -->
      <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
        <div class="flex items-center justify-between">
          <label class="form-label mb-0 flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <span>📦</span>
            <span>Packing Kardus / Dus Pengiriman</span>
          </label>
          <span v-if="form.packing_dus_qty > 0 && form.packing_dus_tipe" class="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded font-mono">
            + {{ formatRupiah(priceBreakdown.biaya_packing_total) }}
          </span>
        </div>

        <!-- Tipe Dus Options -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div
            @click="setPackingTipe(null)"
            class="option-card cursor-pointer p-2.5"
            :class="{ selected: !form.packing_dus_tipe }"
          >
            <div
              class="w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs flex-shrink-0"
              :class="!form.packing_dus_tipe ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-400'"
            >
              {{ !form.packing_dus_tipe ? '✓' : '•' }}
            </div>
            <div class="min-w-0">
              <p class="text-slate-900 text-xs font-bold truncate">Tanpa Dus</p>
              <p class="text-slate-500 text-[10px] truncate">Packing Standar (Rp 0)</p>
            </div>
          </div>

          <div
            @click="setPackingTipe('DUS_KECIL')"
            class="option-card cursor-pointer p-2.5"
            :class="{ selected: form.packing_dus_tipe === 'DUS_KECIL' }"
          >
            <div
              class="w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs flex-shrink-0"
              :class="form.packing_dus_tipe === 'DUS_KECIL' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-400'"
            >
              {{ form.packing_dus_tipe === 'DUS_KECIL' ? '✓' : '•' }}
            </div>
            <div class="min-w-0">
              <p class="text-slate-900 text-xs font-bold truncate">Dus Kecil</p>
              <p class="text-red-700 text-[10px] font-semibold truncate">Rp 5.000 / dus</p>
            </div>
          </div>

          <div
            @click="setPackingTipe('DUS_BESAR')"
            class="option-card cursor-pointer p-2.5"
            :class="{ selected: form.packing_dus_tipe === 'DUS_BESAR' }"
          >
            <div
              class="w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs flex-shrink-0"
              :class="form.packing_dus_tipe === 'DUS_BESAR' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-400'"
            >
              {{ form.packing_dus_tipe === 'DUS_BESAR' ? '✓' : '•' }}
            </div>
            <div class="min-w-0">
              <p class="text-slate-900 text-xs font-bold truncate">Dus Besar</p>
              <p class="text-red-700 text-[10px] font-semibold truncate">Rp 10.000 / dus</p>
            </div>
          </div>
        </div>

        <!-- Input Kuantitas Dus -->
        <div v-if="form.packing_dus_tipe" class="flex items-center gap-3 pt-2 border-t border-slate-200/60">
          <label class="text-xs font-semibold text-slate-700 shrink-0">Kuantitas Dus Dibutuhkan:</label>
          <div class="flex rounded-lg border border-slate-300 overflow-hidden bg-white max-w-[130px] focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500">
            <input
              :value="form.packing_dus_qty ? form.packing_dus_qty.toLocaleString('id-ID') : ''"
              type="text"
              inputmode="numeric"
              placeholder="Contoh: 20"
              class="w-full px-2.5 py-1 text-xs font-mono font-bold text-slate-800 outline-none border-0"
              @input="onPackingDusQtyInput"
            />
            <span class="inline-flex items-center px-2 bg-slate-100 text-[10px] font-bold text-slate-500 border-l border-slate-200">
              dus
            </span>
          </div>
          <span class="text-xs text-slate-600 font-mono font-bold">
            = {{ formatRupiah(priceBreakdown.biaya_packing_total) }}
          </span>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import SectionHeader from '@shared/components/SectionHeader.vue'
import { formatRupiah } from '@shared/utils/formatters'
import type { UkuranBuku, JenisKertas, JenisFinishing } from '@shared/types'

defineProps<{
  form: any
  priceBreakdown: any
  tarifBW: number
  tarifFC: number
  ukuranOptions: Array<{ value: string; label: string }>
  kertasOptions: Array<{ value: string; label: string; sub: string }>
  finishingOptions: Array<{ value: string; label: string; sub: string }>
}>()

const emit = defineEmits<{
  (e: 'set-ukuran', u: UkuranBuku): void
  (e: 'set-kertas', k: JenisKertas): void
  (e: 'set-kertas-bw', k: JenisKertas): void
  (e: 'set-kertas-fc', k: JenisKertas): void
  (e: 'toggle-kertas-dual'): void
  (e: 'toggle-finishing', f: JenisFinishing): void
  (e: 'set-packing-tipe', t: 'DUS_KECIL' | 'DUS_BESAR' | null): void
  (e: 'input-jml-pcs', event: Event): void
  (e: 'input-cetak-bw', event: Event): void
  (e: 'input-cetak-fc', event: Event): void
  (e: 'input-packing-qty', event: Event): void
}>()

function setUkuran(u: UkuranBuku) { emit('set-ukuran', u) }
function setKertas(k: JenisKertas) { emit('set-kertas', k) }
function setKertasBW(k: JenisKertas) { emit('set-kertas-bw', k) }
function setKertasFC(k: JenisKertas) { emit('set-kertas-fc', k) }
function toggleKertasDual() { emit('toggle-kertas-dual') }
function toggleFinishing(f: JenisFinishing) { emit('toggle-finishing', f) }
function setPackingTipe(t: 'DUS_KECIL' | 'DUS_BESAR' | null) { emit('set-packing-tipe', t) }
function onJmlPcsInput(ev: Event) { emit('input-jml-pcs', ev) }
function onCetakBWInput(ev: Event) { emit('input-cetak-bw', ev) }
function onCetakFCInput(ev: Event) { emit('input-cetak-fc', ev) }
function onPackingDusQtyInput(ev: Event) { emit('input-packing-qty', ev) }
</script>
