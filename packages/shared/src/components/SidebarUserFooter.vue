<template>
  <div class="p-3 border-t border-slate-200 bg-white flex-shrink-0 relative">
    <div
      class="flex items-center justify-between gap-2.5 p-2 rounded-xl bg-white border border-slate-200 shadow-2xs relative overflow-hidden transition-all select-none"
      :class="{ 'ring-2 ring-indigo-500/50 bg-indigo-50/20': isPressing }"
    >
      <!-- Click & Long Press Zone (Avatar + User Info) -->
      <div
        class="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
        @pointerdown="startLongPress"
        @pointerup="cancelLongPress"
        @pointerleave="cancelLongPress"
        @pointercancel="cancelLongPress"
        title="Tahan 1.5 detik untuk Pengaturan Reset Data"
      >
        <div class="relative flex-shrink-0">
          <div
            class="w-8 h-8 rounded-lg text-white font-bold flex items-center justify-center text-xs shadow-2xs transition-transform"
            :class="[
              avatarBg || 'bg-gradient-to-tr from-red-600 to-rose-600',
              isPressing ? 'scale-95 ring-2 ring-rose-400' : ''
            ]"
          >
            {{ userInitial }}
          </div>
          <span
            class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white transition-colors"
            :class="syncStore.isOnline ? 'bg-emerald-500' : 'bg-rose-500'"
            :title="syncStore.isOnline ? 'Online' : 'Offline'"
          ></span>
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-bold text-slate-800 truncate leading-tight">
            {{ name }}
          </p>
          <p class="text-[10px] font-semibold text-slate-400 leading-none mt-0.5">{{ roleText }}</p>
        </div>
      </div>

      <!-- Long Press Progress Bar (Secret trigger indicator) -->
      <div
        v-if="isPressing"
        class="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-red-500 via-rose-600 to-amber-500 transition-all pointer-events-none"
        :style="{ width: pressProgress + '%' }"
      ></div>

      <!-- Logout Button (Normal click) -->
      <button
        type="button"
        @click="emit('logout')"
        title="Keluar / Logout"
        class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:bg-rose-100 transition-colors cursor-pointer flex-shrink-0 relative z-10"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      </button>
    </div>

    <!-- SECRET RESET DATA MODAL -->
    <BaseModal
      v-model="showResetModal"
      title="⚙️ Pengaturan Reset Data (Maintenance)"
      subtitle="Fitur Khusus Pengosongan Database"
      max-width="max-w-lg"
    >
      <div class="space-y-4 py-1 text-slate-700 text-xs">
        <!-- Warning Alert -->
        <div class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
          <div class="flex items-center gap-2 font-bold text-rose-900 text-xs sm:text-sm">
            <svg class="w-4 h-4 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Tindakan Pengosongan Database</span>
          </div>
          <p class="text-[11px] leading-relaxed text-rose-700">
            Fitur ini akan mengosongkan data transaksi terpilih di spreadsheet Google Sheets. Header kolom tetap aman. Data yang terhapus tidak dapat dikembalikan.
          </p>
        </div>

        <!-- Target Data Checkboxes -->
        <div class="space-y-2">
          <p class="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
            Pilih Data yang Akan Dikosongkan:
          </p>
          <div class="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <label class="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" v-model="resetOptions.orders" class="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer" />
              <div>
                <span class="font-bold text-slate-800">Tabel Orders (Pesanan Cetak)</span>
                <p class="text-[10px] text-slate-500 leading-tight">Menghapus seluruh antrean order dan data faktur</p>
              </div>
            </label>

            <label class="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" v-model="resetOptions.kas_masuk" class="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer" />
              <div>
                <span class="font-bold text-slate-800">Tabel Kas Masuk (Pembayaran & DP)</span>
                <p class="text-[10px] text-slate-500 leading-tight">Menghapus seluruh histori setoran uang kasir & pelanggan</p>
              </div>
            </label>

            <label class="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" v-model="resetOptions.kas_keluar" class="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer" />
              <div>
                <span class="font-bold text-slate-800">Tabel Kas Keluar (Pengeluaran Toko)</span>
                <p class="text-[10px] text-slate-500 leading-tight">Menghapus seluruh catatan biaya operasional & bahan baku</p>
              </div>
            </label>

            <label class="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" v-model="resetOptions.clients" class="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer" />
              <div>
                <span class="font-bold text-slate-800">Tabel Clients (Buku Kontak Penerbit)</span>
                <p class="text-[10px] text-slate-500 leading-tight">Opsional: Kosongkan riwayat klien & alamat tersimpan</p>
              </div>
            </label>

            <label class="flex items-start gap-2.5 cursor-pointer border-t border-slate-200/80 pt-2">
              <input type="checkbox" v-model="resetOptions.cache" class="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer" />
              <div>
                <span class="font-bold text-indigo-900">Bersihkan Cache Lokal Browser</span>
                <p class="text-[10px] text-slate-500 leading-tight">Mengosongkan cache order sessionStorage di browser</p>
              </div>
            </label>
          </div>
        </div>

        <!-- Security Confirmation Input -->
        <div class="space-y-1.5 pt-1">
          <label class="block font-bold text-slate-700 text-xs">
            Konfirmasi Keamanan:
          </label>
          <p class="text-[11px] text-slate-500">
            Ketik kata <strong class="text-rose-600 font-mono">RESET</strong> atau masukkan PIN Kasir / Password Owner:
          </p>
          <input
            v-model="confirmInput"
            type="text"
            placeholder="Ketik RESET atau masukkan PIN..."
            class="form-input text-xs py-2 w-full font-mono uppercase font-bold tracking-wider"
            :disabled="isSubmitting"
          />
        </div>

        <!-- Error Feedback -->
        <div v-if="errorMessage" class="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {{ errorMessage }}
        </div>

        <!-- Success Feedback -->
        <div v-if="successMessage" class="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          {{ successMessage }}
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-end gap-2.5">
          <button
            type="button"
            @click="showResetModal = false"
            :disabled="isSubmitting"
            class="btn-secondary h-9 px-4 text-xs font-bold cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            @click="executeReset"
            :disabled="isSubmitting || !isFormValid"
            class="btn-primary h-9 px-4 text-xs font-bold !bg-rose-600 hover:!bg-rose-700 text-white cursor-pointer shadow-md shadow-rose-600/20 disabled:opacity-50"
          >
            <span v-if="isSubmitting" class="flex items-center gap-1.5">
              <span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Mereset Data...</span>
            </span>
            <span v-else class="flex items-center gap-1.5">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Kosongkan Data Terpilih</span>
            </span>
          </button>
        </div>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseModal from './BaseModal.vue'
import { api } from '../api/gasClient'
import { useSyncStore } from '../stores/syncStore'

const syncStore = useSyncStore()

const props = withDefaults(
  defineProps<{
    name?: string
    roleText?: string
    avatarBg?: string
  }>(),
  {
    name: 'User',
    roleText: 'Aktif',
    avatarBg: '',
  }
)

const emit = defineEmits<{
  (e: 'logout'): void
}>()

const userInitial = computed(() => {
  const n = (props.name || 'User').trim()
  const parts = n.split(' ')
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return n.slice(0, 2).toUpperCase()
})

// Long Press & Reset Data State
const isPressing = ref(false)
const pressProgress = ref(0)
const showResetModal = ref(false)
let pressTimer: ReturnType<typeof setTimeout> | null = null
let progressInterval: ReturnType<typeof setInterval> | null = null
const HOLD_DURATION = 1500

const resetOptions = ref({
  orders: true,
  kas_masuk: true,
  kas_keluar: true,
  clients: false,
  cache: true,
})

const confirmInput = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const isFormValid = computed(() => {
  const hasTarget =
    resetOptions.value.orders ||
    resetOptions.value.kas_masuk ||
    resetOptions.value.kas_keluar ||
    resetOptions.value.clients ||
    resetOptions.value.cache
  return Boolean(hasTarget && confirmInput.value.trim().length > 0)
})

function startLongPress(e: PointerEvent) {
  if (e.button !== undefined && e.button !== 0) return
  isPressing.value = true
  pressProgress.value = 0

  const startTime = Date.now()
  progressInterval = setInterval(() => {
    const elapsed = Date.now() - startTime
    pressProgress.value = Math.min(100, Math.round((elapsed / HOLD_DURATION) * 100))
  }, 30)

  pressTimer = setTimeout(() => {
    cancelLongPress()
    navigator.vibrate?.([50, 50, 50])
    confirmInput.value = ''
    errorMessage.value = ''
    successMessage.value = ''
    showResetModal.value = true
  }, HOLD_DURATION)
}

function cancelLongPress() {
  isPressing.value = false
  pressProgress.value = 0
  if (pressTimer) {
    clearTimeout(pressTimer)
    pressTimer = null
  }
  if (progressInterval) {
    clearInterval(progressInterval)
    progressInterval = null
  }
}

async function executeReset() {
  if (!isFormValid.value || isSubmitting.value) return
  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const res = await api.resetData({
      confirmation: confirmInput.value.trim(),
      pin: confirmInput.value.trim(),
      reset_orders: resetOptions.value.orders,
      reset_kas_masuk: resetOptions.value.kas_masuk,
      reset_kas_keluar: resetOptions.value.kas_keluar,
      reset_clients: resetOptions.value.clients,
    })

    if (res.success) {
      if (resetOptions.value.cache) {
        try {
          sessionStorage.removeItem('kbm_cached_orders_v1')
        } catch {}
      }

      successMessage.value = `✅ ${res.message || 'Data berhasil dikosongkan!'}`

      setTimeout(() => {
        showResetModal.value = false
        window.location.reload()
      }, 1400)
    } else {
      errorMessage.value = res.error || 'Gagal mereset data. Periksa kata konfirmasi atau PIN Anda.'
    }
  } catch (err: any) {
    errorMessage.value = err.message || 'Terjadi kesalahan jaringan saat memproses reset data.'
  } finally {
    isSubmitting.value = false
  }
}
</script>
