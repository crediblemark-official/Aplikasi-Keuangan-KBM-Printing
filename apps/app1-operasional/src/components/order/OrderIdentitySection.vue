<template>
  <div class="border-b border-slate-200 bg-white">
    <SectionHeader title="1. Identitas Penerbit & Buku" />
    <div class="p-[8px] sm:p-[15px] lg:p-[20px] bg-white space-y-4">
      <!-- 1. Nama Penerbit & Tanggal Order -->
      <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
        <div class="sm:col-span-8">
          <ComboboxInput
            v-model="form.nama_penerbit"
            label="Nama Penerbit *"
            sublabel="Pelanggan / Klien"
            placeholder="Ketik atau pilih nama penerbit / klien..."
            :options="clientOptions"
            add-label-prefix="Tambah Penerbit"
            required
            @select="onClientSelect"
            @add="onClientAdd"
          >
            <template #label-extra>
              <label
                class="inline-flex items-center gap-1.5 cursor-pointer select-none text-[11px] px-2 py-0.5 rounded-full border transition-all"
                :class="form.skema_harga === 'LANGGANAN'
                  ? 'bg-amber-500 text-white border-amber-600 font-bold shadow-2xs'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 font-medium'"
                title="Centang jika penerbit/klien ini mendapatkan tarif khusus Langganan"
              >
                <input
                  type="checkbox"
                  :checked="form.skema_harga === 'LANGGANAN'"
                  @change="onToggleLangganan(($event.target as HTMLInputElement).checked)"
                  class="w-3.5 h-3.5 rounded border-slate-300 text-amber-600 focus:ring-0 cursor-pointer accent-amber-600"
                />
                <span>⭐ Langganan</span>
              </label>
            </template>
          </ComboboxInput>
        </div>
        <div class="sm:col-span-4">
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <label class="form-label mb-0 text-xs font-bold text-slate-700">Tanggal Order *</label>
              <span class="text-[10px] text-slate-400 font-medium">WIB</span>
            </div>
            <input
              v-model="form.tanggal"
              type="date"
              required
              class="w-full h-9.5 px-3 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none bg-white transition-colors"
            />
          </div>
        </div>
      </div>

      <!-- 2. Judul Buku & 3. Nama Penulis -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ComboboxInput
          v-model="form.judul_buku"
          label="Judul Buku *"
          sublabel="Naskah"
          placeholder="Contoh: Manajemen Keuangan Modern"
          :options="bookTitleOptions"
          add-label-prefix="Gunakan Judul"
          required
          @select="onBookSelect"
          @add="onBookAdd"
        />
        <ComboboxInput
          v-model="form.nama_penulis"
          label="Nama Penulis"
          sublabel="Pengarang"
          placeholder="Contoh: Dr. Rasyiqi"
          :options="authorOptions"
          add-label-prefix="Gunakan Penulis"
          @add="onAuthorAdd"
        />
      </div>

      <!-- 4. Alamat & 5. Kontak Klien -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
        <ComboboxInput
          v-model="form.alamat_penerbit"
          label="Alamat Penerbit / Ekspedisi"
          sublabel="Faktur & Kirim"
          placeholder="Contoh: Jl. Kaliurang Km 5, Sleman"
          :options="addressOptions"
          add-label-prefix="Gunakan Alamat"
          @add="onAddressAdd"
        />
        <ComboboxInput
          v-model="form.kontak_penerbit"
          type="tel"
          label="No. Kontak / WhatsApp"
          sublabel="Klien"
          placeholder="Contoh: 08123456789"
          :options="contactOptions"
          add-label-prefix="Gunakan No. Kontak"
          @add="onContactAdd"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SectionHeader from '@shared/components/SectionHeader.vue'
import ComboboxInput, { type ComboboxOption } from '@shared/components/ComboboxInput.vue'

defineProps<{
  form: any
  clientOptions: ComboboxOption[]
  bookTitleOptions: ComboboxOption[]
  authorOptions: ComboboxOption[]
  addressOptions: ComboboxOption[]
  contactOptions: ComboboxOption[]
}>()

const emit = defineEmits<{
  (e: 'client-select', opt: ComboboxOption): void
  (e: 'client-add', val: string): void
  (e: 'book-select', opt: ComboboxOption): void
  (e: 'book-add', val: string): void
  (e: 'author-add', val: string): void
  (e: 'address-add', val: string): void
  (e: 'contact-add', val: string): void
  (e: 'toggle-langganan', isLangganan: boolean): void
}>()

function onClientSelect(opt: ComboboxOption) { emit('client-select', opt) }
function onClientAdd(val: string) { emit('client-add', val) }
function onBookSelect(opt: ComboboxOption) { emit('book-select', opt) }
function onBookAdd(val: string) { emit('book-add', val) }
function onAuthorAdd(val: string) { emit('author-add', val) }
function onAddressAdd(val: string) { emit('address-add', val) }
function onContactAdd(val: string) { emit('contact-add', val) }
function onToggleLangganan(isLangganan: boolean) { emit('toggle-langganan', isLangganan) }
</script>
