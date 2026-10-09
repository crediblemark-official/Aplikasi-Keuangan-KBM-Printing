<template>
  <BaseModal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="`Penyelesaian Dana Order Batal — ${order?.id_order || ''}`"
  >
    <div class="space-y-4">
      <!-- Order Summary Card -->
      <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded">
              {{ order?.id_order }}
            </span>
            <span class="font-bold text-slate-900 text-sm">
              {{ order?.nama_penerbit }}
            </span>
          </div>
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
            Order Batal
          </span>
        </div>

        <p class="text-xs text-slate-600 truncate" :title="order?.judul_penulis">
          Buku: <strong class="text-slate-800">{{ order?.judul_buku || order?.judul_penulis || '-' }}</strong>
        </p>

        <div class="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
          <span class="text-slate-500 font-medium">Total Uang Masuk yang Tercatat:</span>
          <span class="font-mono font-black text-amber-600 text-sm">
            {{ formatRupiah(totalMasuk) }}
          </span>
        </div>
      </div>

      <!-- Action Mode Tabs (Modern Segmented Bar) -->
      <div class="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200/80 gap-1">
        <button
          type="button"
          @click="activeTab = 'REFUND'"
          class="h-9.5 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-2 cursor-pointer select-none"
          :class="activeTab === 'REFUND'
            ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-bold'
            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 font-medium'"
        >
          <div
            class="w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors"
            :class="activeTab === 'REFUND' ? 'bg-rose-100 text-rose-600' : 'text-slate-400'"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
          </div>
          <span class="whitespace-nowrap">Refund Kas Keluar</span>
        </button>

        <button
          type="button"
          @click="activeTab = 'DEPOSIT'"
          class="h-9.5 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-2 cursor-pointer select-none"
          :class="activeTab === 'DEPOSIT'
            ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-bold'
            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 font-medium'"
        >
          <div
            class="w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors"
            :class="activeTab === 'DEPOSIT' ? 'bg-emerald-100 text-emerald-600' : 'text-slate-400'"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <span class="whitespace-nowrap">Alihkan ke Deposit</span>
        </button>
      </div>

      <!-- TAB 1: FORM CATAT REFUND (KAS KELUAR) -->
      <form v-if="activeTab === 'REFUND'" @submit.prevent="handleRefundSubmit" class="space-y-3.5">
        <div class="p-2.5 bg-rose-50/70 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1">
          <p class="font-semibold flex items-center gap-1.5">
            <svg class="w-4 h-4 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Uang Dikembalikan ke Klien</span>
          </p>
          <p class="text-[11px] text-rose-700 leading-relaxed">
            Sistem akan otomatis mencatat transaksi <strong>Kas Keluar</strong> sebesar nominal di bawah. Saldo kas perusahaan akan berkurang dan pembukuan kas kembali seimbang.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="form-label">Tanggal Refund *</label>
            <input v-model="refundForm.tanggal" type="date" class="form-input bg-white" required />
          </div>
          <div>
            <label class="form-label">Sumber Kas Pengembalian *</label>
            <select v-model="refundForm.sumber_kas" class="form-input bg-white" required>
              <option value="BANK">🏦 Bank Transfer</option>
              <option value="KASIR_TUNAI">💵 Kasir Tunai</option>
              <option value="QRIS">📱 QRIS</option>
            </select>
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="form-label !mb-0">Nominal Pengembalian Dana *</label>
            <span class="text-[11px] font-mono text-slate-500">
              Maks: <strong class="text-slate-700">{{ formatRupiah(totalMasuk) }}</strong>
            </span>
          </div>
          <CurrencyInput
            v-model="refundForm.nominal"
            prefix="Rp"
            input-class="text-slate-900 font-mono font-bold"
            required
          />
        </div>

        <div>
          <label class="form-label">Rincian / Keterangan Refund *</label>
          <textarea
            v-model="refundForm.rincian"
            rows="2"
            class="form-input resize-none bg-white"
            placeholder="Contoh: Refund DP order ORD-xxx via transfer BCA penerbit"
            required
          ></textarea>
        </div>

        <div>
          <label class="form-label">Bukti Transfer Pengembalian (Opsional)</label>
          <ImageUploader
            label="Pilih Bukti Transfer Refund"
            sublabel="Otomatis dikompres sebelum upload"
            @change="handlePhotoChange"
          />
        </div>

        <div class="flex gap-2.5 pt-2">
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
            :disabled="isSubmitting || refundForm.nominal <= 0"
            class="flex-1 !bg-rose-600 hover:!bg-rose-700 text-white font-bold"
          >
            {{ isSubmitting ? 'Menyimpan...' : 'Catat Kas Keluar' }}
          </BaseButton>
        </div>
      </form>

      <!-- TAB 2: ALIRKAN KE SALDO DEPOSIT PENERBIT -->
      <div v-else class="space-y-3.5">
        <div class="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
          <p class="font-semibold flex items-center gap-1.5">
            <svg class="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Simpan Sebagai Saldo Deposit Penerbit</span>
          </p>
          <p class="text-[11px] text-emerald-700 leading-relaxed">
            Uang sebesar <strong>{{ formatRupiah(totalMasuk) }}</strong> tidak ditarik dari kas, melainkan dialihkan menjadi <strong>Saldo Deposit</strong> atas nama penerbit <strong>{{ order?.nama_penerbit }}</strong> untuk memotong order buku berikutnya.
          </p>
        </div>

        <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
          <div class="flex justify-between items-center">
            <span class="text-slate-500">Penerbit Tujuan:</span>
            <span class="font-bold text-slate-800">{{ order?.nama_penerbit }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-500">Nominal Deposit yang Dialihkan:</span>
            <span class="font-mono font-bold text-emerald-700 text-sm">{{ formatRupiah(totalMasuk) }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-500">Status Pembukuan Kas:</span>
            <span class="font-semibold text-slate-700">Tetap berada di rekening kas perusahaan</span>
          </div>
        </div>

        <div class="flex gap-2.5 pt-2">
          <BaseButton
            variant="secondary"
            type="button"
            @click="$emit('update:modelValue', false)"
            class="flex-1"
          >
            Batal
          </BaseButton>
          <BaseButton
            type="button"
            :loading="isSubmitting"
            :disabled="isSubmitting || totalMasuk <= 0"
            @click="handleConvertDeposit"
            class="flex-1 !bg-emerald-600 hover:!bg-emerald-700 text-white font-bold"
          >
            {{ isSubmitting ? 'Memproses...' : 'Alihkan ke Deposit' }}
          </BaseButton>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'
import CurrencyInput from './CurrencyInput.vue'
import ImageUploader from './ImageUploader.vue'
import { api } from '../api/gasClient'
import { formatRupiah, getTodayISO } from '../utils/formatters'
import type { Order, KasMasuk, SumberKas } from '../types'

const props = defineProps<{
  modelValue: boolean
  order: Order | null
  totalMasuk: number
  payments?: KasMasuk[]
  currentUser?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'success', msg?: string): void
  (e: 'toast', msg: string, type?: any): void
}>()

const activeTab = ref<'REFUND' | 'DEPOSIT'>('REFUND')
const isSubmitting = ref(false)
const photoBase64 = ref('')
const photoFilename = ref('')

const refundForm = ref({
  tanggal: getTodayISO(),
  sumber_kas: 'BANK' as SumberKas,
  nominal: 0,
  rincian: '',
})

function initForm() {
  activeTab.value = 'REFUND'
  photoBase64.value = ''
  photoFilename.value = ''
  refundForm.value = {
    tanggal: getTodayISO(),
    sumber_kas: (props.payments?.[0]?.metode as SumberKas) || 'BANK',
    nominal: props.totalMasuk || 0,
    rincian: `Refund pengembalian dana pembatalan order ${props.order?.id_order || ''} (${props.order?.nama_penerbit || ''})`.trim(),
  }
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      initForm()
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

// 1. Submit Kas Keluar (Refund)
async function handleRefundSubmit() {
  if (refundForm.value.nominal <= 0) {
    emit('toast', 'Nominal refund harus lebih dari 0', 'error')
    return
  }

  isSubmitting.value = true
  try {
    const res = await api.createKasKeluar({
      tanggal: refundForm.value.tanggal,
      kategori: 'REFUND',
      rincian: refundForm.value.rincian.trim(),
      nominal: refundForm.value.nominal,
      sumber_kas: refundForm.value.sumber_kas,
      diinput_oleh: props.currentUser || 'OWNER',
      foto_base64: photoBase64.value || undefined,
      foto_filename: photoFilename.value || undefined,
    })

    if (!res.success) {
      emit('toast', res.error || 'Gagal mencatat kas keluar refund', 'error')
      return
    }

    // 2. Batalkan transaksi kas masuk terkait order ini agar tidak lagi menggantung pada order
    if (props.payments && props.payments.length > 0) {
      for (const payment of props.payments) {
        if ((payment as any).status_verifikasi !== 'BATAL') {
          await api.deleteKasMasuk(payment.id_kas_masuk)
          ;(payment as any).status_verifikasi = 'BATAL'
        }
      }
    }

    emit('update:modelValue', false)
    emit('toast', `Pengembalian dana (refund) sebesar ${formatRupiah(refundForm.value.nominal)} berhasil dicatat di Kas Keluar.`, 'success')
    emit('success', `Refund ${formatRupiah(refundForm.value.nominal)} dicatat`)
  } catch (err: any) {
    emit('toast', err?.message || 'Terjadi kesalahan saat memproses refund', 'error')
  } finally {
    isSubmitting.value = false
  }
}

// 2. Convert to Publisher Deposit
async function handleConvertDeposit() {
  if (!props.payments || props.payments.length === 0) {
    emit('toast', 'Tidak ditemukan data transaksi pembayaran untuk dialihkan', 'error')
    return
  }

  isSubmitting.value = true
  try {
    // Alihkan semua transaksi pembayaran kas masuk order ini menjadi jenis DEPOSIT
    for (const payment of props.payments) {
      if ((payment as any).status_verifikasi !== 'BATAL') {
        await api.updateKasMasuk({
          id_kas_masuk: payment.id_kas_masuk,
          jenis_pembayaran: 'DEPOSIT',
          keterangan: `Saldo deposit dialihkan dari pembatalan order ${props.order?.id_order || ''}. ${payment.keterangan || ''}`.trim(),
        })
        ;(payment as any).jenis_pembayaran = 'DEPOSIT'
      }
    }

    emit('update:modelValue', false)
    emit('toast', `Dana sebesar ${formatRupiah(props.totalMasuk)} berhasil dialihkan ke Saldo Deposit Penerbit ${props.order?.nama_penerbit}.`, 'success')
    emit('success', `Dialihkan ke deposit ${formatRupiah(props.totalMasuk)}`)
  } catch (err: any) {
    emit('toast', err?.message || 'Terjadi kesalahan saat mengalihkan deposit', 'error')
  } finally {
    isSubmitting.value = false
  }
}
</script>
