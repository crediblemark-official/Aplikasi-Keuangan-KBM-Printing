<template>
  <BaseModal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Catat Kas Masuk (Buku Kas)"
  >
    <form @submit.prevent="submitKasMasuk" class="space-y-4">
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="form-label">Tanggal Masuk *</label>
          <input v-model="form.tanggal" type="date" class="form-input bg-white" required />
        </div>
        <div>
          <label class="form-label">Jenis Kas Masuk *</label>
          <select v-model="form.jenis_pembayaran" class="form-input bg-white font-medium" required>
            <option value="DEPOSIT">💳 Deposit Saldo Penerbit</option>
            <option value="NON_ORDER">📦 Pendapatan Lain / Non-Order</option>
          </select>
        </div>
      </div>

      <!-- Nama Penerbit / Penyetor (Standar ComboboxInput KBM Printing) -->
      <div>
        <ComboboxInput
          v-model="form.nama_penerbit"
          :label="form.jenis_pembayaran === 'DEPOSIT' ? 'Nama Penerbit *' : 'Nama Sumber / Penyetor (Opsional)'"
          sublabel="Pelanggan / Klien"
          :placeholder="form.jenis_pembayaran === 'DEPOSIT' ? 'Ketik atau pilih nama penerbit / klien...' : 'Contoh: Pengepul Kertas, Bpk. Hendra, dll.'"
          :options="penerbitOptions"
          add-label-prefix="Tambah Penerbit"
          :required="form.jenis_pembayaran === 'DEPOSIT'"
        />
        <p v-if="form.jenis_pembayaran === 'DEPOSIT'" class="text-[11px] text-slate-500 mt-1">
          Dana deposit akan masuk ke buku saldo penerbit untuk pemotongan biaya order berikutnya.
        </p>
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
          <label class="form-label">Metode / Akun Bank *</label>
          <select v-model="form.metode" class="form-input bg-white" required>
            <option value="BANK">🏦 Bank</option>
            <option value="KASIR_TUNAI">💵 Kasir Tunai</option>
            <option value="QRIS">📱 QRIS</option>
          </select>
        </div>
      </div>

      <div>
        <label class="form-label">Keterangan / Rincian</label>
        <textarea
          v-model="form.keterangan"
          rows="2"
          placeholder="Contoh: Deposit untuk cetak 2 judul baru / Penjualan sisa afval kertas"
          class="form-input resize-none bg-white"
        ></textarea>
      </div>

      <div>
        <label class="form-label">Upload Bukti Transfer / Resi (Opsional)</label>
        <ImageUploader
          label="Pilih / Foto Bukti Transfer"
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
          Simpan Kas Masuk
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from '@shared/components/BaseModal.vue'
import BaseButton from '@shared/components/BaseButton.vue'
import ComboboxInput from '@shared/components/ComboboxInput.vue'
import ImageUploader from '@shared/components/ImageUploader.vue'
import CurrencyInput from '@shared/components/CurrencyInput.vue'
import { api } from '@shared/api/gasClient'
import { useAuthStore } from '../stores/auth'
import { formatRupiah, getTodayISO } from '@shared/utils/formatters'
import type { ComboboxOption } from '@shared/components/ComboboxInput.vue'
import type { SumberKas } from '@shared/types'

const props = defineProps<{
  modelValue: boolean
  penerbitOptions: ComboboxOption[]
}>()

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
  jenis_pembayaran: 'DEPOSIT' as 'DEPOSIT' | 'NON_ORDER',
  nama_penerbit: '',
  nominal: 0,
  metode: 'BANK' as SumberKas,
  keterangan: '',
})

function resetForm() {
  form.value = {
    tanggal: getTodayISO(),
    jenis_pembayaran: 'DEPOSIT',
    nama_penerbit: '',
    nominal: 0,
    metode: 'BANK',
    keterangan: '',
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

async function submitKasMasuk() {
  if (!form.value.nominal || form.value.nominal <= 0) {
    emit('error', 'Nominal harus lebih besar dari 0')
    return
  }
  if (form.value.jenis_pembayaran === 'DEPOSIT' && !form.value.nama_penerbit.trim()) {
    emit('error', 'Nama Penerbit / Klien wajib diisi untuk Deposit Saldo')
    return
  }

  isSubmitting.value = true
  try {
    const res = await api.createKasMasuk({
      id_order: null,
      jenis_pembayaran: form.value.jenis_pembayaran,
      nominal: form.value.nominal,
      metode: form.value.metode,
      diinput_oleh: authStore.nama || 'OWNER',
      status_verifikasi: 'VERIFIED',
      nama_penerbit: form.value.nama_penerbit?.trim(),
      tanggal: form.value.tanggal,
      keterangan: form.value.keterangan?.trim(),
      foto_base64: photoBase64.value || undefined,
      foto_filename: photoFilename.value || undefined,
    })

    if (res.success) {
      emit('update:modelValue', false)
      emit('success', `Kas Masuk ${formatRupiah(form.value.nominal)} berhasil dicatat!`)
      resetForm()
    } else {
      emit('error', 'Gagal menyimpan kas masuk: ' + (res.error || 'Terjadi kesalahan'))
    }
  } catch (err: any) {
    console.error('Submit kas masuk error:', err)
    emit('error', err?.message || 'Terjadi kesalahan jaringan saat menyimpan kas masuk.')
  } finally {
    isSubmitting.value = false
  }
}
</script>
