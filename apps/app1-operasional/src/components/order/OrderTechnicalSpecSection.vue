<template>
  <div class="bg-white">
    <SectionHeader title="2. Spesifikasi Teknis Cetak" />

    <!-- Lock Alert Banner if Order has payments/Lunas -->
    <div
      v-if="isLocked"
      class="m-2 sm:m-4 p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-center justify-between gap-3 shadow-2xs"
    >
      <div class="flex items-center gap-2 min-w-0">
        <span class="text-sm shrink-0">🔒</span>
        <p class="text-xs font-semibold text-amber-950 truncate">
          Spesifikasi teknis dikunci (sudah lunas / ada pembayaran).
        </p>
      </div>
      <button
        type="button"
        @click="emit('request-unlock')"
        class="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs shrink-0 cursor-pointer shadow-2xs flex items-center gap-1.5 transition-all"
        title="Buka kunci untuk revisi darurat spesifikasi order"
      >
        <svg class="w-3.5 h-3.5 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
        </svg>
        <span>Buka Kunci</span>
      </button>
    </div>

    <div
      class="p-[8px] sm:p-[15px] lg:p-[20px] bg-white space-y-4 transition-opacity"
      :class="{ 'opacity-60 pointer-events-none select-none': isLocked }"
    >
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
              placeholder="0"
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
              :value="form.cetak_bw ? form.cetak_bw.toLocaleString('id-ID') : ''"
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
              :value="form.cetak_fc ? form.cetak_fc.toLocaleString('id-ID') : ''"
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

      <!-- Biaya Penanganan (Biaya Lain-lain) -->
      <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
        <div class="flex items-center justify-between">
          <label class="form-label mb-0 flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <span>🛠️</span>
            <span>Biaya Penanganan (Biaya Lain-lain)</span>
          </label>
          <span v-if="priceBreakdown.biaya_penanganan_total > 0" class="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded font-mono">
            + {{ formatRupiah(priceBreakdown.biaya_penanganan_total) }}
          </span>
        </div>

        <p class="text-[11px] text-slate-500 leading-tight">
          Biaya penanganan atau biaya lain-lain seperti sertifikat, packing khusus, ongkir, wrapping, jasa desain, dll.
        </p>

        <!-- List Item Penanganan -->
        <div class="space-y-2.5">
          <div
            v-for="(item, idx) in penangananList"
            :key="item.id || idx"
            class="p-2.5 rounded-lg bg-white border border-slate-200/90 shadow-2xs space-y-2"
          >
            <div class="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
              <!-- Nama Biaya Penanganan (Bisa Input Sendiri) -->
              <div :class="penangananList.length > 1 ? 'sm:col-span-5' : 'sm:col-span-6'">
                <div class="flex items-center justify-between mb-1">
                  <label class="text-[11px] font-semibold text-slate-600">
                    Nama Biaya {{ penangananList.length > 1 ? `#${idx + 1}` : 'Penanganan' }}
                  </label>
                </div>
                <input
                  :value="item.nama"
                  @input="onItemNamaChange(idx, $event)"
                  :disabled="isLocked"
                  type="text"
                  placeholder="Contoh: Sertifikat"
                  class="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-slate-800 font-medium disabled:bg-slate-100"
                />
              </div>

              <!-- Jumlah (Qty) -->
              <div class="sm:col-span-3">
                <label class="text-[11px] font-semibold text-slate-600 mb-1 block">Jumlah (Qty)</label>
                <div class="flex rounded-lg border border-slate-300 overflow-hidden bg-white focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500">
                  <input
                    :value="item.qty ? item.qty.toLocaleString('id-ID') : ''"
                    @input="onItemQtyChange(idx, $event)"
                    :disabled="isLocked"
                    type="text"
                    inputmode="numeric"
                    placeholder="0"
                    class="w-full px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 outline-none border-0 disabled:bg-slate-100"
                  />
                </div>
              </div>

              <!-- Harga Satuan -->
              <div :class="penangananList.length > 1 ? 'sm:col-span-3' : 'sm:col-span-3'">
                <label class="text-[11px] font-semibold text-slate-600 mb-1 block">Harga Satuan (Rp)</label>
                <div class="flex rounded-lg border border-slate-300 overflow-hidden bg-white focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500">
                  <input
                    :value="item.harga ? item.harga.toLocaleString('id-ID') : ''"
                    @input="onItemHargaChange(idx, $event)"
                    :disabled="isLocked"
                    type="text"
                    inputmode="numeric"
                    placeholder="0"
                    class="w-full px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 outline-none border-0 disabled:bg-slate-100"
                  />
                </div>
              </div>

              <!-- Tombol Hapus (jika lebih dari 1 item) -->
              <div v-if="penangananList.length > 1" class="sm:col-span-1 flex justify-end pb-0.5">
                <button
                  type="button"
                  @click="emit('remove-penanganan-item', idx)"
                  :disabled="isLocked"
                  class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors border border-transparent hover:border-red-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Hapus Biaya Ini"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Rincian hitungan per item -->
            <div v-if="(item.qty || 0) > 0 && (item.harga || 0) > 0" class="flex items-center justify-between pt-1.5 border-t border-slate-100 text-[11px]">
              <div class="flex items-center gap-1.5 text-slate-600">
                <span class="font-medium text-slate-700">{{ item.nama || 'Biaya #' + (idx + 1) }}:</span>
                <span class="font-mono text-slate-500">{{ item.qty || 0 }} × {{ formatRupiah(item.harga || 0) }}</span>
              </div>
              <span class="font-mono font-extrabold text-red-600">
                = {{ formatRupiah((item.qty || 0) * (item.harga || 0)) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Baris Tambah Lagi & Total Biaya Penanganan -->
        <div class="flex items-center justify-between pt-1 border-t border-slate-200/60">
          <button
            type="button"
            @click="emit('add-penanganan-item')"
            :disabled="isLocked"
            class="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span class="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center font-bold text-xs leading-none">+</span>
            <span>Tambah Biaya Penanganan</span>
          </button>

          <div v-if="priceBreakdown.biaya_penanganan_total > 0" class="flex items-center gap-2 text-xs">
            <span class="text-slate-600 font-medium">Total:</span>
            <span class="font-mono font-extrabold text-red-600 text-sm">
              = {{ formatRupiah(priceBreakdown.biaya_penanganan_total) }}
            </span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SectionHeader from '@shared/components/SectionHeader.vue'
import { formatRupiah } from '@shared/utils/formatters'
import type { UkuranBuku, JenisKertas, JenisFinishing } from '@shared/types'

const props = defineProps<{
  form: any
  priceBreakdown: any
  tarifBW: number
  tarifFC: number
  ukuranOptions: Array<{ value: string; label: string }>
  kertasOptions: Array<{ value: string; label: string; sub: string }>
  finishingOptions: Array<{ value: string; label: string; sub: string }>
  isLocked?: boolean
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
  (e: 'add-penanganan-item'): void
  (e: 'remove-penanganan-item', index: number): void
  (e: 'update-penanganan-item', index: number, field: 'nama' | 'qty' | 'harga', value: any): void
  (e: 'input-penanganan-nama', event: Event): void
  (e: 'input-penanganan-qty', event: Event): void
  (e: 'input-penanganan-harga', event: Event): void
  (e: 'request-unlock'): void
}>()

const penangananList = computed(() => {
  if (Array.isArray(props.form.penanganan_items) && props.form.penanganan_items.length > 0) {
    return props.form.penanganan_items
  }
  return [{
    nama: props.form.penanganan_nama || '',
    qty: props.form.penanganan_qty || 0,
    harga: props.form.penanganan_harga || 0,
    total: (props.form.penanganan_qty || 0) * (props.form.penanganan_harga || 0),
  }]
})

function onItemNamaChange(idx: number, e: Event) {
  const target = e.target as HTMLInputElement
  emit('update-penanganan-item', idx, 'nama', target.value)
  if (idx === 0) emit('input-penanganan-nama', e)
}

function onItemQtyChange(idx: number, e: Event) {
  const target = e.target as HTMLInputElement
  const raw = target.value.replace(/\D/g, '')
  const num = raw ? parseInt(raw, 10) : 0
  emit('update-penanganan-item', idx, 'qty', num)
  target.value = num ? num.toLocaleString('id-ID') : ''
  if (idx === 0) emit('input-penanganan-qty', e)
}

function onItemHargaChange(idx: number, e: Event) {
  const target = e.target as HTMLInputElement
  const raw = target.value.replace(/\D/g, '')
  const num = raw ? parseInt(raw, 10) : 0
  emit('update-penanganan-item', idx, 'harga', num)
  target.value = num ? num.toLocaleString('id-ID') : ''
  if (idx === 0) emit('input-penanganan-harga', e)
}

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
