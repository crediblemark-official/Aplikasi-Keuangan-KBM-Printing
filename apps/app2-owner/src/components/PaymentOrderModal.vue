<template>
  <BaseModal
    :model-value="modelValue"
    @update:model-value="val => emit('update:modelValue', val)"
    title="Catat Pembayaran Order Cetak"
  >
    <form @submit.prevent="submitPayment" class="space-y-4">
      <!-- Tanggal & Jenis Bayar -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="form-label">Tanggal Bayar *</label>
          <input
            v-model="paymentForm.tanggal"
            type="date"
            class="form-input bg-white"
            required
          />
        </div>
        <div>
          <label class="form-label">Jenis Pembayaran *</label>
          <select
            v-model="paymentForm.jenis_pembayaran"
            class="form-input bg-white font-medium"
            required
          >
            <option value="DP">Uang Muka (DP)</option>
            <option value="PELUNASAN">Pelunasan Tagihan</option>
          </select>
        </div>
      </div>

      <!-- Pilih Order Cetak (Wajib) -->
      <div>
        <label class="form-label">Pilih Transaksi / Order Cetak *</label>
        <select
          v-model="paymentForm.id_order"
          class="form-input bg-white font-medium"
          required
        >
          <option value="" disabled>-- Pilih Order yang akan dibayar --</option>
          <option
            v-for="ord in availableOrders"
            :key="ord.order.id_order"
            :value="ord.order.id_order"
          >
            {{ ord.order.id_order }} — {{ ord.order.nama_penerbit }} — {{ ord.order.judul_penulis }} (Sisa: {{ formatRupiah(ord.sisa_tagihan) }})
          </option>
        </select>
      </div>

      <!-- Ringkasan Order Terpilih -->
      <div
        v-if="selectedOrder"
        class="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs"
      >
        <div class="flex justify-between items-start">
          <div>
            <span class="text-slate-500">Judul Buku:</span>
            <span class="font-bold text-slate-900 ml-1.5">{{ selectedOrder.judul_penulis }}</span>
          </div>
          <span class="font-mono text-slate-500 font-semibold">{{ selectedOrder.id_order }}</span>
        </div>
        <div class="flex justify-between items-center text-slate-600">
          <span>Total Tagihan: <strong class="text-slate-900">{{ formatRupiah(selectedOrder.total_harga) }}</strong></span>
          <span>Sisa Tagihan: <strong class="text-rose-600 font-bold">{{ formatRupiah(selectedOrderSisa) }}</strong></span>
        </div>
        <div class="pt-1.5 flex gap-2 border-t border-slate-200/80">
          <button
            v-if="selectedOrderSisa > 0"
            type="button"
            @click="paymentForm.nominal = selectedOrderSisa"
            class="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 transition-colors cursor-pointer border border-emerald-200"
          >
            Isi Lunas ({{ formatRupiah(selectedOrderSisa) }})
          </button>
          <button
            type="button"
            @click="paymentForm.nominal = Math.round(selectedOrder.total_harga * 0.5)"
            class="px-2.5 py-1 rounded bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition-colors cursor-pointer border border-blue-200"
          >
            Isi DP 50% ({{ formatRupiah(Math.round(selectedOrder.total_harga * 0.5)) }})
          </button>
        </div>
      </div>

      <!-- Peringatan Pembayaran Ganda / DP / Pelunasan -->
      <div
        v-if="paymentForm.jenis_pembayaran === 'PELUNASAN' && existingPelunasanPayments.length > 0"
        class="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-1 text-xs text-amber-900 shadow-2xs"
      >
        <div class="flex items-center gap-1.5 font-bold text-amber-800">
          <svg class="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Perhatian: Order Ini Sudah Memiliki Riwayat Pelunasan!</span>
        </div>
        <p class="text-[11px] text-amber-700 leading-relaxed">
          Order ini sebelumnya sudah memiliki pembayaran pelunasan:
          <strong>{{ existingPelunasanPayments.map(p => formatRupiah(p.nominal) + ' (' + formatTanggal(p.tanggal) + ')').join(', ') }}</strong>.
          Pastikan Anda tidak memasukkan data pelunasan yang sama dua kali.
        </p>
      </div>

      <div
        v-else-if="paymentForm.jenis_pembayaran === 'DP' && existingDpPayments.length > 0"
        class="p-2.5 bg-blue-50 border border-blue-200 rounded-xl space-y-0.5 text-xs text-blue-900"
      >
        <div class="flex items-center gap-1.5 font-bold text-blue-800">
          <svg class="w-4 h-4 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Info: Order ini sudah pernah membayar DP</span>
        </div>
        <p class="text-[11px] text-blue-700">
          Sudah ada DP tercatat sebesar <strong>{{ existingDpPayments.map(p => formatRupiah(p.nominal)).join(', ') }}</strong>. Jika pembayaran ini untuk menyelesaikan sisa tagihan, disarankan memilih <strong>Pelunasan</strong>.
        </p>
      </div>

      <!-- Nama Penerbit (Read-only / Locked) -->
      <div>
        <label class="form-label flex items-center justify-between">
          <span>Nama Penerbit / Klien *</span>
          <span class="text-[11px] text-slate-400 font-normal flex items-center gap-1">
            <svg class="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Terkunci sesuai data order
          </span>
        </label>
        <input
          :value="paymentForm.nama_penerbit"
          type="text"
          readonly
          placeholder="Pilih order di atas terlebih dahulu"
          class="form-input bg-slate-100 text-slate-600 font-medium cursor-not-allowed select-none"
          required
        />
      </div>

      <!-- Nominal & Metode -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="form-label !mb-0">Nominal Bayar *</label>
            <span v-if="selectedOrder" class="text-[11px] font-mono text-slate-500">
              Maks: <strong class="text-slate-700">{{ formatRupiah(selectedOrderSisa) }}</strong>
            </span>
          </div>
          <CurrencyInput
            v-model="paymentForm.nominal"
            prefix="Rp"
            :input-class="isNominalExceedsSisa ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-100 text-rose-900' : 'border-slate-300 focus:border-red-500 text-slate-900'"
            required
          />
          <p v-if="isNominalExceedsSisa" class="mt-1.5 text-xs text-rose-600 font-semibold flex items-center gap-1">
            <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Nominal melebihi sisa tagihan! Maksimal: {{ formatRupiah(selectedOrderSisa) }}</span>
          </p>
        </div>
        <div>
          <label class="form-label">Metode Pembayaran *</label>
          <select v-model="paymentForm.metode" class="form-input bg-white" required>
            <option value="BANK">🏦 Bank</option>
            <option value="KASIR_TUNAI">💵 Kasir Tunai</option>
            <option value="QRIS">📱 QRIS</option>
          </select>
        </div>
      </div>

      <!-- Catatan -->
      <div>
        <label class="form-label">Catatan / Rincian Pembayaran</label>
        <textarea
          v-model="paymentForm.keterangan"
          rows="2"
          placeholder="Contoh: Pembayaran DP 50% via transfer m-banking"
          class="form-input resize-none bg-white"
        ></textarea>
      </div>

      <!-- Upload Bukti Transfer -->
      <div>
        <label class="form-label">Upload Bukti Transfer / Resi (Opsional)</label>
        <ImageUploader
          label="Pilih / Foto Bukti Transfer"
          sublabel="Otomatis dikompres sebelum upload"
          @change="handlePhotoChange"
        />
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-3 pt-2">
        <BaseButton
          variant="secondary"
          type="button"
          @click="emit('update:modelValue', false)"
          class="flex-1"
        >
          Batal
        </BaseButton>
        <BaseButton
          type="submit"
          :loading="isSubmittingPayment"
          :disabled="isSubmittingPayment || !paymentForm.id_order || paymentForm.nominal <= 0 || isNominalExceedsSisa"
          class="flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isSubmittingPayment ? 'Menyimpan Pembayaran...' : 'Simpan Pembayaran Order' }}
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseModal from '@shared/components/BaseModal.vue'
import BaseButton from '@shared/components/BaseButton.vue'
import ImageUploader from '@shared/components/ImageUploader.vue'
import CurrencyInput from '@shared/components/CurrencyInput.vue'
import { api } from '@shared/api/gasClient'
import { useAuthStore } from '../stores/auth'
import { formatRupiah, formatTanggal, getTodayISO } from '@shared/utils/formatters'
import type { Order, KasMasuk } from '@shared/types'

interface PaymentFormData {
  tanggal: string
  jenis_pembayaran: 'DP' | 'PELUNASAN'
  id_order: string
  nama_penerbit: string
  nominal: number
  metode: string
  keterangan: string
}

const props = defineProps<{
  modelValue: boolean
  ordersList: Order[]
  kasMasukList: KasMasuk[]
  initialData?: Partial<PaymentFormData> | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'success'): void
  (e: 'toast', msg: string, type?: 'success' | 'error'): void
}>()

const authStore = useAuthStore()
const isSubmittingPayment = ref(false)
const photoBase64 = ref('')
const photoFilename = ref('')

const paymentForm = ref<PaymentFormData>({
  tanggal: getTodayISO(),
  jenis_pembayaran: 'DP',
  id_order: '',
  nama_penerbit: '',
  nominal: 0,
  metode: 'BANK',
  keterangan: '',
})

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      if (props.initialData) {
        paymentForm.value = {
          tanggal: props.initialData.tanggal || getTodayISO(),
          jenis_pembayaran: props.initialData.jenis_pembayaran || 'DP',
          id_order: props.initialData.id_order || '',
          nama_penerbit: props.initialData.nama_penerbit || '',
          nominal: props.initialData.nominal || 0,
          metode: props.initialData.metode || 'BANK',
          keterangan: props.initialData.keterangan || '',
        }
      } else {
        paymentForm.value = {
          tanggal: getTodayISO(),
          jenis_pembayaran: 'DP',
          id_order: '',
          nama_penerbit: '',
          nominal: 0,
          metode: 'BANK',
          keterangan: '',
        }
      }
      photoBase64.value = ''
      photoFilename.value = ''
    }
  }
)

const availableOrders = computed(() => {
  return props.ordersList
    .map((order) => {
      const orderPayments = props.kasMasukList.filter(
        (k) => k.id_order === order.id_order && (k as any).status_verifikasi !== 'BATAL'
      )
      const paid = orderPayments.reduce((s, k) => s + k.nominal, 0)
      const sisa = Math.max(0, order.total_harga - paid)
      return { order, sisa_tagihan: sisa, total_bayar: paid }
    })
    .filter((item) => item.sisa_tagihan > 0)
    .sort((a, b) => b.order.id_order.localeCompare(a.order.id_order))
})

const selectedOrder = computed(() => {
  if (!paymentForm.value.id_order) return null
  return props.ordersList.find((o) => o.id_order === paymentForm.value.id_order) || null
})

const selectedOrderSisa = computed(() => {
  if (!selectedOrder.value) return 0
  const orderPayments = props.kasMasukList.filter(
    (k) => k.id_order === selectedOrder.value!.id_order && (k as any).status_verifikasi !== 'BATAL'
  )
  const paid = orderPayments.reduce((s, k) => s + k.nominal, 0)
  return Math.max(0, selectedOrder.value.total_harga - paid)
})

const existingPelunasanPayments = computed(() => {
  if (!selectedOrder.value) return []
  return props.kasMasukList.filter(
    (k) => k.id_order === selectedOrder.value!.id_order &&
           k.jenis_pembayaran === 'PELUNASAN' &&
           (k as any).status_verifikasi !== 'BATAL'
  )
})

const existingDpPayments = computed(() => {
  if (!selectedOrder.value) return []
  return props.kasMasukList.filter(
    (k) => k.id_order === selectedOrder.value!.id_order &&
           k.jenis_pembayaran === 'DP' &&
           (k as any).status_verifikasi !== 'BATAL'
  )
})

const isNominalExceedsSisa = computed(() => {
  if (!selectedOrder.value || !paymentForm.value.nominal) return false
  return paymentForm.value.nominal > selectedOrderSisa.value
})

watch(
  () => paymentForm.value.id_order,
  (newId) => {
    if (newId && selectedOrder.value) {
      paymentForm.value.nama_penerbit = selectedOrder.value.nama_penerbit
      if (paymentForm.value.jenis_pembayaran === 'PELUNASAN' && selectedOrderSisa.value > 0) {
        paymentForm.value.nominal = selectedOrderSisa.value
      } else if (paymentForm.value.jenis_pembayaran === 'DP' && !paymentForm.value.nominal) {
        paymentForm.value.nominal = Math.round(selectedOrder.value.total_harga * 0.5)
      }
    }
  }
)

watch(
  () => paymentForm.value.jenis_pembayaran,
  (newJenis) => {
    if (newJenis === 'PELUNASAN' && selectedOrder.value && selectedOrderSisa.value > 0) {
      paymentForm.value.nominal = selectedOrderSisa.value
    } else if (newJenis === 'DP' && selectedOrder.value) {
      paymentForm.value.nominal = Math.round(selectedOrder.value.total_harga * 0.5)
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

async function submitPayment() {
  if (isSubmittingPayment.value) return
  if (!paymentForm.value.id_order) {
    emit('toast', 'Silakan pilih Transaksi / Order Cetak terlebih dahulu', 'error')
    return
  }
  if (!paymentForm.value.nominal || paymentForm.value.nominal <= 0) {
    emit('toast', 'Nominal harus lebih besar dari 0', 'error')
    return
  }
  if (isNominalExceedsSisa.value) {
    emit('toast', `Nominal pembayaran melebihi sisa tagihan (${formatRupiah(selectedOrderSisa.value)})`, 'error')
    return
  }

  isSubmittingPayment.value = true
  try {
    const res = await api.createKasMasuk({
      id_order: paymentForm.value.id_order.trim(),
      jenis_pembayaran: paymentForm.value.jenis_pembayaran,
      nominal: paymentForm.value.nominal,
      metode: paymentForm.value.metode,
      diinput_oleh: authStore.nama || 'OWNER',
      status_verifikasi: 'VERIFIED',
      nama_penerbit: paymentForm.value.nama_penerbit?.trim(),
      tanggal: paymentForm.value.tanggal,
      keterangan: paymentForm.value.keterangan?.trim(),
      foto_base64: photoBase64.value || undefined,
      foto_filename: photoFilename.value || undefined,
    })

    if (res.success) {
      emit('update:modelValue', false)
      emit('toast', `Pembayaran Order ${formatRupiah(paymentForm.value.nominal)} berhasil dicatat!`, 'success')
      emit('success')
    } else {
      emit('toast', 'Gagal menyimpan pembayaran: ' + (res.error || 'Terjadi kesalahan'), 'error')
    }
  } catch (err: any) {
    console.error('Submit payment error:', err)
    emit('toast', err?.message || 'Terjadi kesalahan jaringan saat menyimpan pembayaran.', 'error')
  } finally {
    isSubmittingPayment.value = false
  }
}
</script>
