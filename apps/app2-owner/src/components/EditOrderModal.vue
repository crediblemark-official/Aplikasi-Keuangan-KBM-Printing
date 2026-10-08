<template>
  <BaseModal
    :model-value="modelValue"
    @update:model-value="val => emit('update:modelValue', val)"
    :title="`Edit Order: ${order?.id_order || ''}`"
  >
    <form @submit.prevent="submitEditOrder" class="space-y-4">
      <!-- Info Header -->
      <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
        <div>
          <span class="text-slate-500 font-mono">ID Order:</span>
          <strong class="ml-1 text-slate-800 font-mono text-sm">{{ form.id_order }}</strong>
        </div>
        <div>
          <span class="text-slate-500 font-medium">Sudah Dibayar:</span>
          <strong class="ml-1 font-mono text-emerald-700 font-bold">{{ formatRupiah(totalMasukVerified) }}</strong>
        </div>
      </div>

      <!-- Nama Penerbit & Judul Buku -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="form-label">Nama Penerbit *</label>
          <input
            v-model="form.nama_penerbit"
            type="text"
            placeholder="Penerbit..."
            class="form-input bg-white"
            required
          />
        </div>
        <div>
          <label class="form-label">Status Order *</label>
          <select
            v-model="form.status_order"
            class="form-input bg-white font-medium"
            required
          >
            <option value="PROSES">🔄 PROSES</option>
            <option value="SELESAI">✅ SELESAI</option>
            <option value="BATAL">❌ BATAL</option>
          </select>
        </div>
      </div>

      <!-- Judul Buku / Penulis -->
      <div>
        <label class="form-label">Judul Buku / Penulis *</label>
        <input
          v-model="form.judul_penulis"
          type="text"
          placeholder="Judul Buku / Nama Penulis..."
          class="form-input bg-white"
          required
        />
      </div>

      <!-- Kuantitas Cetak & Ukuran -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label class="form-label">Jumlah Cetak (Pcs) *</label>
          <input
            v-model.number="form.jml_pcs"
            type="number"
            min="1"
            class="form-input bg-white font-mono font-bold"
            required
          />
        </div>
        <div>
          <label class="form-label">Ukuran Buku *</label>
          <select
            v-model="form.ukuran"
            class="form-input bg-white"
            required
          >
            <option value="A5">A5 (14.8 x 21 cm)</option>
            <option value="B5">B5 (17.6 x 25 cm)</option>
            <option value="A4">A4 (21 x 29.7 cm)</option>
            <option value="A6">A6 (10.5 x 14.8 cm)</option>
            <option value="UNESCO">UNESCO (15.5 x 23 cm)</option>
            <option value="CUSTOM">Custom</option>
          </select>
        </div>
        <div>
          <label class="form-label">Bahan Kertas Isi</label>
          <input
            v-model="form.kertas"
            type="text"
            placeholder="BP 57 / BP 72 / HVS 70"
            class="form-input bg-white"
          />
        </div>
      </div>

      <!-- Total Tagihan / Harga -->
      <div>
        <div class="flex items-center justify-between mb-1">
          <label class="form-label !mb-0">Total Tagihan Order (Rp) *</label>
          <span v-if="totalMasukVerified > 0" class="text-[11px] font-mono text-slate-500">
            Min: <strong class="text-slate-700">{{ formatRupiah(totalMasukVerified) }}</strong> (sudah masuk)
          </span>
        </div>
        <CurrencyInput
          v-model="form.total_harga"
          prefix="Rp"
          :input-class="isPriceLowerThanPaid ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-100 text-rose-900' : 'border-slate-300 focus:border-red-500 text-slate-900'"
          required
        />
        <p v-if="isPriceLowerThanPaid" class="mt-1.5 text-xs text-rose-600 font-semibold flex items-center gap-1">
          <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Total harga tidak boleh lebih kecil dari pembayaran yang sudah diterima ({{ formatRupiah(totalMasukVerified) }}).</span>
        </p>
      </div>

      <!-- Catatan -->
      <div>
        <label class="form-label">Catatan Order</label>
        <textarea
          v-model="form.catatan"
          rows="2"
          placeholder="Catatan pengerjaan atau detail khusus..."
          class="form-input bg-white resize-none"
        ></textarea>
      </div>

      <!-- Action Buttons -->
      <div class="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
        <button
          @click="emit('update:modelValue', false)"
          type="button"
          class="btn-secondary text-xs px-3 py-1.5"
          :disabled="isSubmitting"
        >
          Batal
        </button>
        <button
          type="submit"
          class="btn-primary text-xs px-4 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="isSubmitting || !form.total_harga || isPriceLowerThanPaid"
        >
          {{ isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan Order' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseModal from '@shared/components/BaseModal.vue'
import CurrencyInput from '@shared/components/CurrencyInput.vue'
import { api } from '@shared/api/gasClient'
import { formatRupiah } from '@shared/utils/formatters'
import type { Order, KasMasuk } from '@shared/types'

const props = defineProps<{
  modelValue: boolean
  order: Order | null
  kasMasukList: KasMasuk[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'success'): void
  (e: 'toast', msg: string, type?: 'success' | 'error'): void
}>()

const isSubmitting = ref(false)

const form = ref({
  id_order: '',
  nama_penerbit: '',
  judul_penulis: '',
  jml_pcs: 100,
  ukuran: 'A5',
  kertas: '',
  total_harga: 0,
  status_order: 'PROSES' as 'PROSES' | 'SELESAI' | 'BATAL',
  catatan: '',
})

// Hitung total kas masuk terverifikasi untuk order ini
const totalMasukVerified = computed(() => {
  if (!props.order?.id_order) return 0
  return props.kasMasukList
    .filter(
      (k) =>
        k.id_order === props.order?.id_order &&
        (k as any).status_verifikasi !== 'BATAL'
    )
    .reduce((sum, k) => sum + (Number(k.nominal) || 0), 0)
})

const isPriceLowerThanPaid = computed(() => {
  return form.value.total_harga < totalMasukVerified.value
})

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen && props.order) {
      form.value = {
        id_order: props.order.id_order,
        nama_penerbit: props.order.nama_penerbit || '',
        judul_penulis: props.order.judul_penulis || '',
        jml_pcs: Number(props.order.jml_pcs) || 100,
        ukuran: props.order.ukuran || 'A5',
        kertas: props.order.kertas || '',
        total_harga: Number(props.order.total_harga) || 0,
        status_order: (props.order.status_order || 'PROSES') as any,
        catatan: props.order.catatan || '',
      }
    }
  }
)

async function submitEditOrder() {
  if (isSubmitting.value) return
  if (!form.value.id_order) return
  if (isPriceLowerThanPaid.value) {
    emit('toast', `Total tagihan tidak boleh lebih kecil dari uang yang sudah diterima (${formatRupiah(totalMasukVerified.value)})`, 'error')
    return
  }

  isSubmitting.value = true
  try {
    const res = await api.updateOrder({
      id_order: form.value.id_order,
      nama_penerbit: form.value.nama_penerbit,
      judul_penulis: form.value.judul_penulis,
      jml_pcs: form.value.jml_pcs,
      ukuran: form.value.ukuran as any,
      kertas: form.value.kertas as any,
      total_harga: form.value.total_harga,
      status_order: form.value.status_order,
      catatan: form.value.catatan,
    })

    if (!res.success) {
      emit('toast', res.error || 'Gagal memperbarui data order', 'error')
      return
    }

    emit('update:modelValue', false)
    emit('toast', `Data Order ${form.value.id_order} berhasil diperbarui!`, 'success')
    emit('success')
  } catch (err: any) {
    emit('toast', err?.message || 'Terjadi kesalahan jaringan saat menyimpan perubahan order', 'error')
  } finally {
    isSubmitting.value = false
  }
}
</script>
