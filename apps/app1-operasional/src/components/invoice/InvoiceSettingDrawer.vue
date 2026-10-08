<template>
  <teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[9999] flex justify-end no-print"
      @keydown.esc="$emit('close')"
    >
      <!-- Backdrop Overlay -->
      <transition
        enter-active-class="transition-opacity duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
        appear
      >
        <div
          class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
          @click="$emit('close')"
        ></div>
      </transition>

      <!-- Drawer Side Panel -->
      <transition
        enter-active-class="transition-transform duration-300 ease-out"
        enter-from-class="translate-x-full"
        enter-to-class="translate-x-0"
        leave-active-class="transition-transform duration-200 ease-in"
        leave-from-class="translate-x-0"
        leave-to-class="translate-x-full"
        appear
      >
        <div
          class="relative z-10 w-full max-w-lg sm:max-w-xl h-full bg-white shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden"
        >
          <!-- Drawer Header -->
          <div class="px-5 sm:px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-indigo-50 text-[#4338ca] flex items-center justify-center shadow-xs">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 class="text-sm sm:text-base font-bold text-slate-800">Pengaturan Info Faktur & Rekening</h3>
                <p class="text-[11px] text-slate-500">Sesuaikan profil percetakan, nomor rekening, dan ketentuan invoice.</p>
              </div>
            </div>
            <button
              @click="$emit('close')"
              type="button"
              class="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 flex items-center justify-center transition-colors cursor-pointer"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Drawer Body (Scrollable Form) -->
          <div class="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
            <!-- Profil Percetakan -->
            <div class="space-y-3">
              <p class="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-[#4338ca]"></span>
                <span>1. Profil Vendor / Percetakan (From)</span>
              </p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="form-label mb-1">Nama Percetakan</label>
                  <input v-model="editForm.nama" class="form-input text-xs" placeholder="KBM Printing" />
                </div>
                <div>
                  <label class="form-label mb-1">Badan Usaha / Tipe</label>
                  <input v-model="editForm.badan_usaha" class="form-input text-xs" placeholder="Corporation / CV" />
                </div>
                <div class="sm:col-span-2">
                  <label class="form-label mb-1">Alamat Workshop</label>
                  <input v-model="editForm.alamat" class="form-input text-xs" placeholder="Jl. Percetakan No. 8" />
                </div>
                <div>
                  <label class="form-label mb-1">Kota & Kode Pos</label>
                  <input v-model="editForm.kota_kodepos" class="form-input text-xs" placeholder="55281 Sleman, D.I. Yogyakarta" />
                </div>
                <div>
                  <label class="form-label mb-1">Tax Number / NPWP</label>
                  <input v-model="editForm.tax_number" class="form-input text-xs" placeholder="94-1234567" />
                </div>
              </div>
            </div>

            <!-- Data Rekening Bank -->
            <div class="space-y-3 pt-2">
              <p class="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-[#4338ca]"></span>
                <span>2. Data Rekening Bank Pembayaran</span>
              </p>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="form-label mb-1">Nama Bank</label>
                  <input v-model="editForm.bank_name" class="form-input text-xs" placeholder="BCA / Mandiri / BRI" />
                </div>
                <div>
                  <label class="form-label mb-1">Nomor Rekening</label>
                  <input v-model="editForm.no_rekening" class="form-input text-xs font-mono" placeholder="123-456-7890" />
                </div>
                <div>
                  <label class="form-label mb-1">Atas Nama Rekening</label>
                  <input v-model="editForm.atas_nama" class="form-input text-xs" placeholder="KBM Printing" />
                </div>
              </div>
            </div>

            <!-- Kontak & Support -->
            <div class="space-y-3 pt-2">
              <p class="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-[#4338ca]"></span>
                <span>3. Kontak & Layanan Klien</span>
              </p>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="form-label mb-1">Email</label>
                  <input v-model="editForm.email" class="form-input text-xs" placeholder="accounting@kbmprinting.com" />
                </div>
                <div>
                  <label class="form-label mb-1">No. WhatsApp / Telp</label>
                  <input v-model="editForm.no_telp" class="form-input text-xs font-mono" placeholder="+62 812-3456-7890" />
                </div>
                <div>
                  <label class="form-label mb-1">Website</label>
                  <input v-model="editForm.website" class="form-input text-xs" placeholder="www.kbmprinting.com" />
                </div>
              </div>
            </div>

            <!-- Ketentuan & Catatan -->
            <div class="space-y-3 pt-2">
              <p class="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full bg-[#4338ca]"></span>
                <span>4. Ketentuan & Catatan Standar</span>
              </p>
              <div class="space-y-3">
                <div>
                  <label class="form-label mb-1">Terms & Conditions</label>
                  <textarea v-model="editForm.terms_conditions" rows="3" class="form-input text-xs resize-none"></textarea>
                </div>
                <div>
                  <label class="form-label mb-1">Default Notes (jika order tidak ada catatan)</label>
                  <input v-model="editForm.default_notes" class="form-input text-xs" />
                </div>
              </div>
            </div>
          </div>

          <!-- Drawer Footer -->
          <div class="px-5 sm:px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
            <button @click="$emit('reset')" type="button" class="btn-ghost text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer">
              Reset ke Bawaan
            </button>
            <div class="flex items-center gap-2.5">
              <button @click="$emit('close')" type="button" class="btn-secondary h-9 px-4 text-xs font-bold cursor-pointer">
                Batal
              </button>
              <button @click="$emit('save', editForm)" type="button" class="btn-primary h-9 px-5 text-xs font-bold !bg-[#4338ca] hover:!bg-[#3730a3] cursor-pointer shadow-sm">
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { CompanyProfile } from '@shared/stores/companyStore'

const props = defineProps<{
  isOpen: boolean
  initialProfile: CompanyProfile
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', profile: CompanyProfile): void
  (e: 'reset'): void
}>()

const editForm = ref<CompanyProfile>({ ...props.initialProfile })

watch(
  () => props.initialProfile,
  (val) => {
    editForm.value = { ...val }
  },
  { deep: true, immediate: true }
)
</script>
