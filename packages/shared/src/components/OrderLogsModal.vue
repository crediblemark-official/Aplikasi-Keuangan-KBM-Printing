<template>
  <BaseModal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Riwayat & Log Perubahan Order"
    :subtitle="`${idOrder}${orderPublisher ? ' • ' + orderPublisher : ''}${orderTitle ? ' — ' + orderTitle : ''}`"
    max-width="max-w-2xl"
  >
    <template #header-actions>
      <button
        type="button"
        @click="fetchLogs"
        :disabled="isLoading"
        class="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
        title="Segarkan Log"
      >
        <svg class="w-4 h-4" :class="{ 'animate-spin': isLoading }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </template>

    <div class="py-2">
      <!-- Loading State -->
      <div v-if="isLoading" class="py-12 flex flex-col items-center justify-center gap-2.5 text-slate-400">
        <div class="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        <span class="text-xs font-medium">Memuat riwayat perubahan...</span>
      </div>

      <!-- Empty State -->
      <div v-else-if="logs.length === 0" class="py-12 text-center text-slate-400 text-xs">
        <div class="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p class="font-medium text-slate-600">Belum Ada Riwayat Perubahan</p>
        <p class="text-[11px] text-slate-400 mt-0.5">Order ini belum pernah diubah sejak dibuat.</p>
      </div>

      <!-- Log Timeline -->
      <div v-else class="space-y-4">
        <div
          v-for="log in logs"
          :key="log.id"
          class="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all flex items-start gap-3 text-xs"
        >
          <!-- Action Icon -->
          <div
            class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
            :class="{
              'bg-emerald-50 text-emerald-600 border border-emerald-200': log.action === 'CREATE',
              'bg-blue-50 text-blue-600 border border-blue-200': log.action === 'UPDATE',
              'bg-amber-50 text-amber-600 border border-amber-200': log.action === 'STATUS_CHANGE',
              'bg-rose-50 text-rose-600 border border-rose-200': log.action === 'CANCEL',
              'bg-purple-50 text-purple-600 border border-purple-200': log.action === 'RESTORE',
            }"
          >
            <svg v-if="log.action === 'CREATE'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <svg v-else-if="log.action === 'UPDATE'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <svg v-else-if="log.action === 'CANCEL'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <svg v-else-if="log.action === 'RESTORE'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <!-- Body -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="font-bold text-slate-800">{{ getLogActionLabel(log.action) }}</span>
                <span class="text-[11px] text-slate-600 font-medium bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                  {{ log.actor }}
                </span>
              </div>
              <span class="text-[11px] text-slate-400 font-mono">
                {{ formatDatetime(log.created_at) }}
              </span>
            </div>

            <p class="text-xs text-slate-600 mt-1 leading-relaxed">
              {{ log.keterangan }}
            </p>

            <!-- Detailed Changes -->
            <div v-if="log.changes && log.changes.length > 0" class="mt-2.5 space-y-1.5">
              <div
                v-for="(change, cIdx) in log.changes"
                :key="cIdx"
                class="text-[11px] bg-slate-50 border border-slate-200/80 rounded-lg p-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-700"
              >
                <span class="font-semibold text-slate-600">{{ change.field_label }}:</span>
                <div class="flex items-center gap-1.5 flex-wrap font-mono">
                  <span class="line-through text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200/60">{{ change.old_val }}</span>
                  <span class="text-slate-400 font-bold">→</span>
                  <span class="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">{{ change.new_val }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from './BaseModal.vue'
import { api } from '../api/gasClient'
import type { OrderLog } from '../types'
import { formatDatetime } from '../utils/formatters'

const props = defineProps<{
  modelValue: boolean
  idOrder: string
  orderTitle?: string
  orderPublisher?: string
}>()

defineEmits<{
  (e: 'update:modelValue', val: boolean): void
}>()

const logs = ref<OrderLog[]>([])
const isLoading = ref(false)

function getLogActionLabel(action: string) {
  switch (action) {
    case 'CREATE': return 'Pesanan Dibuat'
    case 'UPDATE': return 'Perubahan Order'
    case 'STATUS_CHANGE': return 'Perubahan Status'
    case 'CANCEL': return 'Pesanan Dibatalkan'
    case 'RESTORE': return 'Pesanan Dipulihkan'
    default: return 'Aktivitas Order'
  }
}

async function fetchLogs() {
  if (!props.idOrder) return
  isLoading.value = true
  try {
    const res = await api.getOrderLogs(props.idOrder)
    if (res.success && res.data) {
      logs.value = res.data
    } else {
      logs.value = []
    }
  } catch (e) {
    console.warn('Gagal memuat log order:', e)
    logs.value = []
  } finally {
    isLoading.value = false
  }
}

watch(
  () => props.modelValue,
  (val) => {
    if (val && props.idOrder) {
      fetchLogs()
    }
  },
  { immediate: true }
)
</script>
