<template>
  <BaseModal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="editForm.tipe === 'MASUK' ? 'Edit Kas Masuk' : 'Edit Kas Keluar'"
  >
    <form @submit.prevent="submitEditMutasi" class="space-y-4">
      <!-- Info ID & Tipe -->
      <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
        <span class="text-slate-500 font-mono">ID: <strong class="text-slate-800">{{ editForm.id }}</strong></span>
        <span
          class="px-2 py-0.5 rounded text-[11px] font-bold"
          :class="editForm.tipe === 'MASUK' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'"
        >
          {{ editForm.tipe === 'MASUK' ? '⬇ Kas Masuk' : '⬆ Kas Keluar' }}
        </span>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="form-label">Tanggal Transaksi *</label>
          <input v-model="editForm.tanggal" type="date" class="form-input bg-white" required />
        </div>
        <div>
          <label class="form-label">Sumber Kas / Rekening *</label>
          <select v-model="editForm.sumber_kas" class="form-input bg-white font-medium" required>
            <option value="BANK">Bank</option>
            <option value="KASIR_TUNAI">Kasir Tunai</option>
            <option value="QRIS">QRIS</option>
          </select>
        </div>
      </div>

      <!-- Khusus Kas Masuk -->
      <template v-if="editForm.tipe === 'MASUK'">
        <div v-if="editForm.id_order" class="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
          <p class="font-bold">Pembayaran Order Cetak: {{ editForm.id_order }}</p>
          <p class="text-blue-700 text-[11px] mt-0.5">{{ editForm.nama_penerbit || '-' }}</p>
        </div>
        <div v-else-if="editForm.jenis_pembayaran === 'DEPOSIT'">
          <label class="form-label">Nama Penerbit (Deposit) *</label>
          <ComboboxInput
            v-model="editForm.nama_penerbit"
            :options="penerbitOptions"
            placeholder="Pilih nama penerbit..."
            required
          />
        </div>
      </template>

      <!-- Khusus Kas Keluar -->
      <template v-if="editForm.tipe === 'KELUAR'">
        <div>
          <label class="form-label">Kategori Pengeluaran *</label>
          <select v-model="editForm.kategori" class="form-input bg-white font-medium" required>
            <option v-for="k in kategoriOptions" :key="k.value" :value="k.value">{{ k.label }}</option>
          </select>
        </div>
      </template>

      <!-- Nominal -->
      <div>
        <label class="form-label">Nominal *</label>
        <CurrencyInput
          v-model="editForm.nominal"
          prefix="Rp"
          required
        />
      </div>

      <!-- Keterangan -->
      <div>
        <label class="form-label">Keterangan / Rincian Transaksi</label>
        <input
          v-model="editForm.keterangan"
          type="text"
          class="form-input bg-white"
          placeholder="Catatan rincian transaksi..."
        />
      </div>

      <!-- Action Buttons -->
      <div class="pt-3 flex items-center justify-between gap-2 border-t border-slate-100">
        <button
          @click="showDeleteConfirmModal = true"
          type="button"
          class="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200 cursor-pointer"
          :disabled="isSubmitting"
        >
          Hapus Transaksi
        </button>
        <div class="flex items-center gap-2">
          <button
            @click="$emit('update:modelValue', false)"
            type="button"
            class="btn-secondary text-xs px-3 py-1.5"
            :disabled="isSubmitting"
          >
            Batal
          </button>
          <button
            type="submit"
            class="btn-primary text-xs px-4 py-1.5"
            :disabled="isSubmitting || !editForm.nominal"
          >
            {{ isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan' }}
          </button>
        </div>
      </div>
    </form>
  </BaseModal>

  <!-- Confirm Modal for Mutasi Deletion -->
  <ConfirmModal
    v-model="showDeleteConfirmModal"
    :title="editForm.tipe === 'MASUK' ? 'Batalkan Kas Masuk?' : 'Hapus Kas Keluar?'"
    :message="editForm.tipe === 'MASUK' ? `Yakin ingin membatalkan dan menghapus catatan Kas Masuk ID ${editForm.id}?` : `Yakin ingin menghapus catatan pengeluaran Kas Keluar ID ${editForm.id}?`"
    :detail="editForm.tipe === 'MASUK' ? 'Catatan mutasi kas ini akan dihapus dan sisa saldo buku kas akan otomatis disesuaikan.' : 'Catatan pengeluaran kas ini akan dihapus dan sisa saldo buku kas akan otomatis disesuaikan.'"
    :confirm-text="editForm.tipe === 'MASUK' ? 'Ya, Batalkan Kas Masuk' : 'Ya, Hapus Pengeluaran'"
    cancel-text="Kembali"
    type="danger"
    :loading="isSubmitting"
    @confirm="executeDeleteMutasi"
  />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from '@shared/components/BaseModal.vue'
import ConfirmModal from '@shared/components/ConfirmModal.vue'
import ComboboxInput from '@shared/components/ComboboxInput.vue'
import CurrencyInput from '@shared/components/CurrencyInput.vue'
import { api } from '@shared/api/gasClient'
import { getTodayISO } from '@shared/utils/formatters'
import type { ComboboxOption } from '@shared/components/ComboboxInput.vue'
import type { KasMasuk, KasKeluar, SumberKas } from '@shared/types'

export interface MutasiRowData {
  id: string
  tanggal: string
  tipe: 'MASUK' | 'KELUAR'
  kategori: string
  keterangan: string
  sumber_kas: string
  nominal: number
  fileId?: string
  raw?: KasMasuk | KasKeluar
}

const props = defineProps<{
  modelValue: boolean
  mutasi: MutasiRowData | null
  penerbitOptions: ComboboxOption[]
  kategoriOptions: { value: string; label: string }[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'success', message: string): void
  (e: 'error', message: string): void
}>()

const showDeleteConfirmModal = ref(false)
const isSubmitting = ref(false)

const editForm = ref({
  id: '',
  tipe: 'MASUK' as 'MASUK' | 'KELUAR',
  tanggal: '',
  nominal: 0,
  sumber_kas: 'BANK' as SumberKas,
  kategori: '',
  keterangan: '',
  id_order: '',
  nama_penerbit: '',
  jenis_pembayaran: '',
})

watch(
  () => [props.modelValue, props.mutasi] as const,
  ([open, mutasi]) => {
    if (open && mutasi) {
      const raw = mutasi.raw as any
      editForm.value = {
        id: mutasi.id,
        tipe: mutasi.tipe,
        tanggal: mutasi.tanggal ? mutasi.tanggal.split('T')[0] : getTodayISO(),
        nominal: mutasi.nominal,
        sumber_kas: (mutasi.sumber_kas as SumberKas) || 'BANK',
        kategori: raw?.kategori || '',
        keterangan: raw?.rincian || raw?.keterangan || '',
        id_order: raw?.id_order || '',
        nama_penerbit: raw?.nama_penerbit || '',
        jenis_pembayaran: raw?.jenis_pembayaran || '',
      }
    }
  },
  { immediate: true }
)



async function submitEditMutasi() {
  if (!editForm.value.id || editForm.value.nominal <= 0) return
  isSubmitting.value = true
  try {
    if (editForm.value.tipe === 'MASUK') {
      const res = await api.updateKasMasuk({
        id_kas_masuk: editForm.value.id,
        tanggal: editForm.value.tanggal,
        nominal: editForm.value.nominal,
        metode: editForm.value.sumber_kas,
        keterangan: editForm.value.keterangan,
        nama_penerbit: editForm.value.nama_penerbit,
      })
      if (!res.success) {
        emit('error', res.error || 'Gagal memperbarui Kas Masuk')
        return
      }
    } else {
      const res = await api.updateKasKeluar({
        id_kas_keluar: editForm.value.id,
        tanggal: editForm.value.tanggal,
        nominal: editForm.value.nominal,
        kategori: editForm.value.kategori,
        sumber_kas: editForm.value.sumber_kas,
        rincian: editForm.value.keterangan,
      })
      if (!res.success) {
        emit('error', res.error || 'Gagal memperbarui Kas Keluar')
        return
      }
    }
    emit('update:modelValue', false)
    emit('success', 'Data mutasi kas berhasil diperbarui!')
  } catch (err: any) {
    emit('error', err?.message || 'Terjadi kesalahan saat menyimpan perubahan')
  } finally {
    isSubmitting.value = false
  }
}

async function executeDeleteMutasi() {
  if (!editForm.value.id) return
  isSubmitting.value = true
  try {
    if (editForm.value.tipe === 'MASUK') {
      const res = await api.deleteKasMasuk(editForm.value.id)
      if (!res.success) {
        emit('error', res.error || 'Gagal membatalkan Kas Masuk')
        return
      }
    } else {
      const res = await api.deleteKasKeluar(editForm.value.id)
      if (!res.success) {
        emit('error', res.error || 'Gagal menghapus Kas Keluar')
        return
      }
    }
    showDeleteConfirmModal.value = false
    emit('update:modelValue', false)
    emit('success', 'Data mutasi kas berhasil dihapus!')
  } catch (err: any) {
    emit('error', err?.message || 'Terjadi kesalahan saat menghapus data')
  } finally {
    isSubmitting.value = false
  }
}
</script>
