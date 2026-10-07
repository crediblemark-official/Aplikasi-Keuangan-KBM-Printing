<template>
  <BaseModal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Catat Kas Keluar Baru"
  >
    <form @submit.prevent="submitKasKeluar" class="space-y-4">
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="form-label">Tanggal Keluar *</label>
          <input v-model="form.tanggal" type="date" class="form-input bg-white" required />
        </div>
        <div>
          <label class="form-label">Kategori Pengeluaran *</label>
          <select v-model="form.kategori" class="form-input bg-white font-medium" required>
            <option value="" disabled>Pilih Kategori</option>
            <option v-for="k in kategoriOptions" :key="k.value" :value="k.value">
              {{ k.label }}
            </option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="form-label">Nominal (Rp) *</label>
          <CurrencyInput
            v-model="form.nominal"
            input-class="text-slate-900"
            required
          />
        </div>
        <div>
          <label class="form-label">Sumber Kas / Akun *</label>
          <select v-model="form.sumber_kas" class="form-input bg-white" required>
            <option value="KASIR_TUNAI">💵 Kasir Tunai</option>
            <option value="BANK">🏦 Bank</option>
            <option value="QRIS">📱 QRIS</option>
          </select>
        </div>
      </div>

      <div>
        <label class="form-label">Rincian Pengeluaran *</label>
        <textarea
          v-model="form.rincian"
          rows="2"
          placeholder="Contoh: Beli kertas Bookpaper 72gr 2 rim / Token listrik workshop"
          class="form-input resize-none bg-white"
          required
        ></textarea>
      </div>

      <div>
        <label class="form-label">Upload Foto Nota / Kwitansi (Opsional)</label>
        <ImageUploader
          label="Pilih / Foto Nota"
          sublabel="Otomatis dikompres sebelum upload"
          @change="handlePhotoChange"
        />
      </div>

      <div class="flex gap-3 pt-2">
        <BaseButton
          variant="secondary"
          type="button"
          @click="$emit('update:modelValue', false)"
          class="flex-1"
        >
          Batal
        </BaseButton>
        <BaseButton
          type="submit"
          :loading="isSubmitting"
          class="flex-1"
        >
          Simpan Kas Keluar
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from '@shared/components/BaseModal.vue'
import BaseButton from '@shared/components/BaseButton.vue'
import ImageUploader from '@shared/components/ImageUploader.vue'
import CurrencyInput from '@shared/components/CurrencyInput.vue'
import { KATEGORI_KAS_KELUAR_OPTIONS } from '@shared/constants'
import { api } from '@shared/api/gasClient'
import { useAuthStore } from '../stores/auth'
import { formatRupiah, getTodayISO } from '@shared/utils/formatters'
import type { KategoriKasKeluar, SumberKas } from '@shared/types'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    kategoriOptions?: { value: string; label: string }[]
  }>(),
  {
    kategoriOptions: () => KATEGORI_KAS_KELUAR_OPTIONS,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'success', message: string): void
  (e: 'error', message: string): void
}>()

const authStore = useAuthStore()

const isSubmitting = ref(false)
const photoBase64 = ref('')
const photoFilename = ref('')

const form = ref({
  tanggal: getTodayISO(),
  kategori: '' as KategoriKasKeluar,
  rincian: '',
  nominal: 0,
  sumber_kas: 'KASIR_TUNAI' as SumberKas,
})

function resetForm() {
  form.value = {
    tanggal: getTodayISO(),
    kategori: '' as KategoriKasKeluar,
    rincian: '',
    nominal: 0,
    sumber_kas: 'KASIR_TUNAI',
  }
  photoBase64.value = ''
  photoFilename.value = ''
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      resetForm()
    }
  }
)

function handlePhotoChange(uploadData: { base64: string; filename: string } | null) {
  if (uploadData) {
    photoBase64.value = uploadData.base64
    photoFilename.value = uploadData.filename
  } else {
    photoBase64.value = ''
    photoFilename.value = ''
  }
}

async function submitKasKeluar() {
  if (!form.value.nominal || form.value.nominal <= 0) {
    emit('error', 'Nominal harus lebih besar dari 0')
    return
  }
  if (!form.value.kategori) {
    emit('error', 'Pilih kategori pengeluaran terlebih dahulu')
    return
  }
  if (!form.value.rincian.trim()) {
    emit('error', 'Rincian pengeluaran wajib diisi')
    return
  }

  isSubmitting.value = true
  try {
    const res = await api.createKasKeluar({
      tanggal: form.value.tanggal,
      kategori: form.value.kategori,
      rincian: form.value.rincian.trim(),
      nominal: form.value.nominal,
      sumber_kas: form.value.sumber_kas,
      diinput_oleh: authStore.nama || 'OWNER',
      foto_base64: photoBase64.value || undefined,
      foto_filename: photoFilename.value || undefined,
    })

    if (res.success) {
      emit('update:modelValue', false)
      emit('success', `Kas Keluar ${formatRupiah(form.value.nominal)} berhasil disimpan!`)
      resetForm()
    } else {
      emit('error', 'Gagal menyimpan kas keluar: ' + (res.error || 'Terjadi kesalahan'))
    }
  } catch (err: any) {
    console.error('Submit kas keluar error:', err)
    emit('error', err?.message || 'Terjadi kesalahan jaringan saat menyimpan kas keluar.')
  } finally {
    isSubmitting.value = false
  }
}
</script>
