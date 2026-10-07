<template>
  <BaseModal
    :model-value="modelValue"
    @update:model-value="val => emit('update:modelValue', val)"
    :title="`Edit Pembayaran (${editPaymentForm.jenis_pembayaran === 'DP' ? 'Uang Muka DP' : 'Pelunasan'})`"
  >
    <form @submit.prevent="submitEditPayment" class="space-y-4">
      <!-- Info Order Terkait -->
      <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
        <div class="flex items-center justify-between">
          <span class="text-slate-500 font-mono">
            Order: <strong class="text-slate-800">{{ editPaymentForm.id_order }}</strong>
          </span>
          <span class="font-mono text-slate-500">
            ID Kas: <strong class="text-slate-800">{{ editPaymentForm.id_kas_masuk }}</strong>
          </span>
        </div>
        <p class="font-bold text-slate-900 truncate">{{ editPaymentForm.judul }}</p>
        <p class="text-slate-600 font-semibold">
          {{ editPaymentForm.nama_penerbit }} • Total Tagihan: {{ formatRupiah(editPaymentForm.total_harga) }}
        </p>
      </div>

      <!-- Tanggal & Metode Bayar -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="form-label">Tanggal Bayar *</label>
          <input
            v-model="editPaymentForm.tanggal"
            type="date"
            class="form-input bg-white"
            required
          />
        </div>
        <div>
          <label class="form-label">Metode Pembayaran *</label>
          <select
            v-model="editPaymentForm.metode"
            class="form-input bg-white font-medium"
            required
          >
            <option value="BANK">🏦 Bank</option>
            <option value="KASIR_TUNAI">💵 Kasir Tunai</option>
            <option value="QRIS">📱 QRIS</option>
            <option value="SALDO_DEPOSIT">💳 Saldo Deposit</option>
          </select>
        </div>
      </div>

      <!-- Nominal -->
      <div>
        <div class="flex items-center justify-between mb-1">
          <label class="form-label !mb-0">Nominal Bayar *</label>
          <span class="text-[11px] font-mono text-slate-500">
            Maks Sisa: <strong class="text-slate-700">{{ formatRupiah(editPaymentFormMaxAllowed) }}</strong>
          </span>
        </div>
        <div
          class="flex rounded-lg border overflow-hidden focus-within:ring-2 bg-white transition-all shadow-2xs"
          :class="isEditNominalExceedsMax ? 'border-rose-400 focus-within:border-rose-500 focus-within:ring-rose-100' : 'border-slate-300 focus-within:border-red-500 focus-within:ring-red-100'"
        >
          <span class="inline-flex items-center px-3 bg-slate-100 border-r border-slate-200 text-xs font-mono font-bold text-slate-500 select-none">
            Rp
          </span>
          <input
            :value="editPaymentForm.nominal ? editPaymentForm.nominal.toLocaleString('id-ID') : ''"
            @input="onEditPaymentNominalInput"
            type="text"
            inputmode="numeric"
            placeholder="0"
            class="w-full px-3 py-2 text-sm font-bold font-mono text-slate-900 outline-none border-0 bg-transparent"
            required
          />
        </div>
        <p v-if="isEditNominalExceedsMax" class="mt-1.5 text-xs text-rose-600 font-semibold flex items-center gap-1">
          <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Nominal melebihi sisa tagihan! Maksimal: {{ formatRupiah(editPaymentFormMaxAllowed) }}</span>
        </p>
      </div>

      <!-- Catatan -->
      <div>
        <label class="form-label">Catatan / Keterangan Pembayaran</label>
        <input
          v-model="editPaymentForm.keterangan"
          type="text"
          placeholder="Catatan rincian pembayaran..."
          class="form-input bg-white"
        />
      </div>

      <!-- Action Buttons -->
      <div class="pt-3 flex items-center justify-between gap-2 border-t border-slate-100">
        <button
          @click="showDeleteConfirm = true"
          type="button"
          class="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200 cursor-pointer"
          :disabled="isSubmitting"
        >
          Batalkan Pembayaran Ini
        </button>
        <div class="flex items-center gap-2">
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
            :disabled="isSubmitting || !editPaymentForm.nominal || isEditNominalExceedsMax"
          >
            {{ isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan' }}
          </button>
        </div>
      </div>
    </form>
  </BaseModal>

  <!-- Modern Styled Confirm Modal for Cancel/Delete Payment -->
  <ConfirmModal
    v-model="showDeleteConfirm"
    title="Batalkan Pembayaran Order?"
    :message="`Yakin ingin membatalkan/menghapus pembayaran ${editPaymentForm.id_kas_masuk}?`"
    detail="Data kas dan sisa piutang order cetak ini akan otomatis disesuaikan dan dihitung ulang."
    confirm-text="Ya, Batalkan Pembayaran"
    cancel-text="Kembali"
    type="danger"
    :loading="isSubmitting"
    @confirm="executeDeletePayment()"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseModal from '@shared/components/BaseModal.vue'
import ConfirmModal from '@shared/components/ConfirmModal.vue'
import { api } from '@shared/api/gasClient'
import { formatRupiah, getTodayISO } from '@shared/utils/formatters'
import type { KasMasuk, Order } from '@shared/types'

export interface OrderTxRow {
  id: string
  jenis_pembayaran: string
  tanggal: string
  nominal: number
  metode: string
  keterangan?: string
}

interface EditPaymentFormData {
  id_kas_masuk: string
  id_order: string
  judul: string
  nama_penerbit: string
  total_harga: number
  jenis_pembayaran: string
  tanggal: string
  nominal: number
  metode: string
  keterangan: string
}

const props = defineProps<{
  modelValue: boolean
  tx: OrderTxRow | null
  order: Order | null
  kasMasukList: KasMasuk[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'success'): void
  (e: 'toast', msg: string, type?: 'success' | 'error'): void
}>()

const isSubmitting = ref(false)
const showDeleteConfirm = ref(false)

const editPaymentForm = ref<EditPaymentFormData>({
  id_kas_masuk: '',
  id_order: '',
  judul: '',
  nama_penerbit: '',
  total_harga: 0,
  jenis_pembayaran: 'DP',
  tanggal: getTodayISO(),
  nominal: 0,
  metode: 'BANK',
  keterangan: '',
})

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen && props.tx && props.order) {
      editPaymentForm.value = {
        id_kas_masuk: props.tx.id,
        id_order: props.order.id_order,
        judul: props.order.judul_penulis,
        nama_penerbit: props.order.nama_penerbit,
        total_harga: props.order.total_harga,
        jenis_pembayaran: props.tx.jenis_pembayaran,
        tanggal: props.tx.tanggal ? props.tx.tanggal.split('T')[0] : getTodayISO(),
        nominal: props.tx.nominal,
        metode: props.tx.metode,
        keterangan: props.tx.keterangan || '',
      }
    }
  }
)

const editPaymentFormMaxAllowed = computed(() => {
  if (!editPaymentForm.value.id_order) return Infinity
  const otherPayments = props.kasMasukList.filter(
    (k) => k.id_order === editPaymentForm.value.id_order &&
           k.id_kas_masuk !== editPaymentForm.value.id_kas_masuk &&
           (k as any).status_verifikasi !== 'BATAL'
  )
  const otherTotal = otherPayments.reduce((s, k) => s + k.nominal, 0)
  return Math.max(0, editPaymentForm.value.total_harga - otherTotal)
})

const isEditNominalExceedsMax = computed(() => {
  if (!editPaymentForm.value.id_order) return false
  return editPaymentForm.value.nominal > editPaymentFormMaxAllowed.value
})

function onEditPaymentNominalInput(e: Event) {
  const input = e.target as HTMLInputElement
  const clean = input.value.replace(/\D/g, '')
  const num = parseInt(clean, 10) || 0
  editPaymentForm.value.nominal = num
}

async function submitEditPayment() {
  if (isSubmitting.value) return
  if (!editPaymentForm.value.id_kas_masuk || editPaymentForm.value.nominal <= 0) return
  if (isEditNominalExceedsMax.value) {
    emit('toast', `Nominal melebihi sisa tagihan maksimal (${formatRupiah(editPaymentFormMaxAllowed.value)})`, 'error')
    return
  }

  isSubmitting.value = true
  try {
    const res = await api.updateKasMasuk({
      id_kas_masuk: editPaymentForm.value.id_kas_masuk,
      tanggal: editPaymentForm.value.tanggal,
      nominal: editPaymentForm.value.nominal,
      metode: editPaymentForm.value.metode,
      keterangan: editPaymentForm.value.keterangan,
    })
    if (!res.success) {
      emit('toast', res.error || 'Gagal memperbarui pembayaran', 'error')
      return
    }
    emit('update:modelValue', false)
    emit('toast', 'Pembayaran order berhasil diperbarui!', 'success')
    emit('success')
  } catch (err: any) {
    emit('toast', err?.message || 'Terjadi kesalahan jaringan saat memperbarui pembayaran', 'error')
  } finally {
    isSubmitting.value = false
  }
}

async function executeDeletePayment() {
  if (!editPaymentForm.value.id_kas_masuk) return

  isSubmitting.value = true
  try {
    const res = await api.deleteKasMasuk(editPaymentForm.value.id_kas_masuk)
    if (!res.success) {
      emit('toast', res.error || 'Gagal membatalkan pembayaran', 'error')
      return
    }
    showDeleteConfirm.value = false
    emit('update:modelValue', false)
    emit('toast', 'Pembayaran order berhasil dibatalkan!', 'success')
    emit('success')
  } catch (err: any) {
    emit('toast', err?.message || 'Terjadi kesalahan jaringan saat membatalkan pembayaran', 'error')
  } finally {
    isSubmitting.value = false
  }
}
</script>
