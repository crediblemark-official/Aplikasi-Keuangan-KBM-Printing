<template>
  <button
    type="button"
    @click="$emit('click')"
    :class="[
      'sync-indicator-pill inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border shadow-2xs select-none',
      statusClass,
    ]"
    :title="tooltipText"
  >
    <!-- Status Dot with Pulse -->
    <span class="relative flex h-2 w-2">
      <span
        v-if="syncStore.pendingCount > 0 || syncStore.isSyncingAll"
        :class="['animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', pulseColor]"
      ></span>
      <span :class="['relative inline-flex rounded-full h-2 w-2', dotColor]"></span>
    </span>

    <!-- Status Label & Percentage -->
    <span class="truncate font-mono tracking-tight text-[11px]">
      <template v-if="!syncStore.isOnline">
        Offline ({{ syncStore.syncPercentage }}%)
      </template>
      <template v-else-if="syncStore.isSyncingAll">
        Sinkronisasi...
      </template>
      <template v-else-if="syncStore.failedCount > 0">
        {{ syncStore.failedCount }} Gagal ({{ syncStore.syncPercentage }}%)
      </template>
      <template v-else-if="syncStore.pendingCount > 0">
        {{ syncStore.pendingCount }} Menunggu ({{ syncStore.syncPercentage }}%)
      </template>
      <template v-else>
        {{ syncStore.syncPercentage }}% Tersinkron
      </template>
    </span>

    <!-- Refresh Icon / Spinner if syncing -->
    <svg
      v-if="syncStore.isSyncingAll"
      class="w-3 h-3 animate-spin text-red-600"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSyncStore } from '../stores/syncStore'

defineEmits<{
  (e: 'click'): void
}>()

const syncStore = useSyncStore()

const statusClass = computed(() => {
  if (!syncStore.isOnline) {
    return 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
  }
  if (syncStore.failedCount > 0) {
    return 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
  }
  if (syncStore.isSyncingAll || syncStore.pendingCount > 0) {
    return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
  }
  return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
})

const dotColor = computed(() => {
  if (!syncStore.isOnline || syncStore.failedCount > 0) return 'bg-rose-500'
  if (syncStore.isSyncingAll || syncStore.pendingCount > 0) return 'bg-amber-500'
  return 'bg-emerald-500'
})

const pulseColor = computed(() => {
  if (!syncStore.isOnline || syncStore.failedCount > 0) return 'bg-rose-400'
  if (syncStore.isSyncingAll || syncStore.pendingCount > 0) return 'bg-amber-400'
  return 'bg-emerald-400'
})

const tooltipText = computed(() => {
  if (!syncStore.isOnline) return 'Koneksi terputus. Klik untuk membuka Log Sinkronisasi.'
  if (syncStore.pendingCount > 0) return `${syncStore.pendingCount} data dalam antrean lokal. Klik untuk sinkronisasi.`
  return 'Semua data tersinkron sempurna dengan Google Sheets. Klik untuk rincian log.'
})
</script>
