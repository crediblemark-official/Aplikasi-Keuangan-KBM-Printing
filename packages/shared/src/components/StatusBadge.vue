<template>
  <span
    class="inline-flex items-center gap-1 font-semibold rounded-full tracking-tight transition-all"
    :class="badgeClasses"
  >
    <!-- Actual network loading / syncing spinner -->
    <svg
      v-if="isLoading"
      class="animate-spin flex-shrink-0 text-current"
      :class="spinnerSizeClass"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="3.5"
      ></circle>
      <path
        class="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>

    <!-- Pulsing Radar Dot untuk status PROSES (menandakan order sedang aktif dikerjakan) -->
    <span
      v-else-if="isPulsing"
      class="relative flex h-2 w-2 flex-shrink-0 items-center justify-center"
    >
      <span
        class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
        :class="dotClass"
      ></span>
      <span
        class="relative inline-flex rounded-full h-1.5 w-1.5"
        :class="dotClass"
      ></span>
    </span>

    <!-- Static Dot Indicator untuk status selesai / lunas / lainnya -->
    <span
      v-else-if="showDot"
      class="w-1.5 h-1.5 rounded-full flex-shrink-0"
      :class="dotClass"
    ></span>

    <span class="truncate">
      {{ displayLabel }}<template v-if="verificationSuffix">
        <span :class="verificationAccentClass"> {{ verificationGlyph }} {{ verificationSuffix }}</span>
      </template>
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    status?: string
    size?: 'xs' | 'sm' | 'md'
    showDot?: boolean
    label?: string
    loading?: boolean
    verification?: string
  }>(),
  {
    status: '',
    size: 'xs',
    showDot: true,
    label: '',
    loading: false,
    verification: '',
  }
)

const normalizedStatus = computed(() => (props.status || '').toUpperCase().trim())

const normalizedVerification = computed(() => (props.verification || '').toUpperCase().trim())

// Status verifikasi pembayaran (dimensi "sudut pandang owner") yang ditambahkan ke badge
// status pembayaran utama (dimensi "sudut pandang operasional").
const verificationSuffix = computed(() => {
  const v = normalizedVerification.value
  if (v === 'VERIFIED') return 'Terverifikasi'
  if (v === 'PENDING' || v === 'MENUNGGU_VERIFIKASI') return 'Menunggu Verifikasi'
  if (v === 'BATAL') return 'Dibatalkan'
  return ''
})

const verificationGlyph = computed(() => {
  const v = normalizedVerification.value
  if (v === 'VERIFIED') return '✓'
  if (v === 'PENDING' || v === 'MENUNGGU_VERIFIKASI') return '⏳'
  if (v === 'BATAL') return '✕'
  return ''
})

const verificationAccentClass = computed(() => {
  const v = normalizedVerification.value
  if (v === 'VERIFIED') return 'text-emerald-600'
  if (v === 'PENDING' || v === 'MENUNGGU_VERIFIKASI') return 'text-amber-600'
  if (v === 'BATAL') return 'text-rose-600'
  return ''
})

const isLoading = computed(() => {
  if (props.loading) return true
  const s = normalizedStatus.value
  return ['SYNCING', 'LOADING'].includes(s)
})

const isPulsing = computed(() => {
  if (!props.showDot) return false
  const s = normalizedStatus.value
  return ['PROSES', 'SEDANG_PROSES', 'IN_PROGRESS'].includes(s)
})

const spinnerSizeClass = computed(() => {
  if (props.size === 'xs') return 'w-2.5 h-2.5'
  if (props.size === 'sm') return 'w-3 h-3'
  return 'w-3.5 h-3.5'
})

const displayLabel = computed(() => {
  if (props.label) return props.label
  const s = normalizedStatus.value
  if (s === 'MENUNGGU_VERIFIKASI' || s === 'PENDING') return 'Menunggu Verifikasi'
  if (s === 'VERIFIED') return 'Terverifikasi'
  if (s === 'BELUM_BAYAR') return 'Belum Bayar'
  if (s === 'KURANG' || s === 'KURANG_BAYAR') return 'DP Masuk'
  if (s === 'DP') return 'DP Masuk'
  if (s === 'LUNAS') return 'Lunas'
  if (s === 'SYNCED') return 'Tersinkron'
  if (s === 'SYNCING') return 'Sinkronisasi'
  if (s === 'FAILED') return 'Gagal'
  return props.status || '-'
})

const badgeClasses = computed(() => {
  const s = normalizedStatus.value
  const sizeCls =
    props.size === 'xs'
      ? 'text-[10px] px-2 py-0.5'
      : props.size === 'sm'
      ? 'text-xs px-2.5 py-0.5'
      : 'text-xs px-3 py-1'

  // Success / Lunas / Selesai / Verified / Synced
  if (['SELESAI', 'LUNAS', 'VERIFIED', 'SYNCED'].includes(s)) {
    return `${sizeCls} bg-emerald-50 text-emerald-700 border border-emerald-200/80`
  }

  // Info / In-Flight Sync
  if (['SYNCING'].includes(s)) {
    return `${sizeCls} bg-blue-50 text-blue-700 border border-blue-200/80`
  }

  // Warning / In progress / DP / Menunggu verifikasi / Pending
  if (['PROSES', 'DP', 'KURANG', 'MENUNGGU_VERIFIKASI', 'PENDING'].includes(s)) {
    return `${sizeCls} bg-amber-50 text-amber-700 border border-amber-200/80`
  }

  // Cancelled / Rejected / Belum / Failed
  if (['BATAL', 'DITOLAK', 'BELUM_BAYAR', 'FAILED'].includes(s)) {
    return `${sizeCls} bg-rose-50 text-rose-700 border border-rose-200/80`
  }

  // Default slate
  return `${sizeCls} bg-slate-100 text-slate-700 border border-slate-200`
})

const dotClass = computed(() => {
  const s = normalizedStatus.value
  const v = normalizedVerification.value
  // Dimensi verifikasi lebih informatif untuk titik penanda saat disediakan
  if (['PENDING', 'MENUNGGU_VERIFIKASI'].includes(v)) return 'bg-amber-500'
  if (v === 'VERIFIED') return 'bg-emerald-500'
  if (v === 'BATAL') return 'bg-rose-500'
  if (['SELESAI', 'LUNAS', 'VERIFIED', 'SYNCED'].includes(s)) return 'bg-emerald-500'
  if (['SYNCING'].includes(s)) return 'bg-blue-500'
  if (['PROSES', 'DP', 'KURANG', 'MENUNGGU_VERIFIKASI', 'PENDING'].includes(s)) return 'bg-amber-500'
  if (['BATAL', 'DITOLAK', 'BELUM_BAYAR', 'FAILED'].includes(s)) return 'bg-rose-500'
  return 'bg-slate-400'
})
</script>
