<template>
  <div class="w-full min-h-full bg-white fade-in">
    <!-- Standard Shared Header -->
    <PageHeader
      title="Log Sinkronisasi"
      :show-back="showBack"
      @back="$emit('back')"
    >
      <template #actions>
        <!-- Search Input in Header (Tablet & Desktop only) -->
        <div class="hidden sm:block sm:w-48 lg:w-56">
          <SearchInput
            v-model="searchQuery"
            placeholder="Cari ID / transaksi..."
          />
        </div>

        <!-- Sync All / Stop Action Button -->
        <BaseButton
          v-if="!syncStore.isSyncingAll"
          @click="syncStore.syncAllPending()"
          size="sm"
        >
          <template #icon>
            <svg
              class="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </template>
          <span class="hidden sm:inline">Sinkronkan</span>
          <span class="sm:hidden">Sinkron</span>
        </BaseButton>

        <!-- Stop Sync Button (jika sedang sinkron / stuck) -->
        <button
          v-else
          @click="syncStore.stopSync()"
          class="h-8 text-xs font-semibold inline-flex items-center gap-1.5 px-3 rounded-md cursor-pointer bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors"
          title="Hentikan proses sinkronisasi yang sedang berjalan"
        >
          <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Hentikan</span>
        </button>

        <!-- Refresh / Check Health Button -->
        <button
          @click="syncStore.checkServerHealth()"
          class="btn-secondary h-8 text-xs font-semibold inline-flex items-center gap-1.5 px-2.5 rounded-md cursor-pointer"
          title="Cek Latensi & Koneksi GAS"
        >
          <svg
            :class="['w-3.5 h-3.5', { 'animate-spin': syncStore.isCheckingHealth }]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span class="hidden md:inline">Cek Server</span>
        </button>

        <!-- Clear Failed Logs Button -->
        <button
          v-if="syncStore.failedCount > 0"
          @click="syncStore.clearFailedLogs()"
          class="btn-secondary h-8 text-xs font-semibold inline-flex items-center gap-1 px-2.5 rounded-md cursor-pointer text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
          title="Bersihkan semua log gagal"
        >
          <svg class="w-3.5 h-3.5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span class="hidden md:inline">Hapus Gagal ({{ syncStore.failedCount }})</span>
          <span class="md:hidden">Hapus Gagal</span>
        </button>

        <!-- Clear Synced Logs Button -->
        <button
          v-if="syncStore.syncedCount > 0"
          @click="syncStore.clearSuccessfulLogs()"
          class="btn-secondary h-8 text-xs font-semibold inline-flex items-center gap-1.5 px-2.5 rounded-md cursor-pointer text-slate-500 hover:text-slate-800"
          title="Bersihkan riwayat yang sudah berhasil tersinkron"
        >
          <span class="hidden md:inline">Bersihkan Sukses</span>
          <span class="md:hidden">Bersihkan</span>
        </button>
      </template>
    </PageHeader>

    <!-- Mobile Search Bar (Full Width on Mobile) -->
    <div class="sm:hidden px-[8px] sm:px-[15px] py-2 border-b border-slate-200 bg-white">
      <SearchInput
        v-model="searchQuery"
        placeholder="Cari ID / transaksi..."
      />
    </div>

    <!-- Summary Metrics Strip -->
    <MetricStrip :items="summaryMetrics" />

    <!-- Shared Filter Bar -->
    <div class="px-[8px] sm:px-[15px] lg:px-[20px] py-2 border-b border-slate-200 bg-white">
      <FilterTabs v-model="selectedFilter" :tabs="filterTabs" />
    </div>

    <!-- Full-bleed Table with Top Horizontal Scrollbar -->
    <TableScrollWrapper>
      <table class="data-table w-full min-w-[850px]">
        <thead>
          <tr class="whitespace-nowrap">
            <th>ID Transaksi</th>
            <th>Waktu Catat</th>
            <th>Entitas</th>
            <th>Rincian Transaksi</th>
            <th class="text-right">Nominal</th>
            <th class="text-center">Status</th>
            <th class="text-center">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <!-- Standard Shared TableStateRow -->
          <TableStateRow
            :colspan="7"
            :loading="syncStore.isSyncingAll"
            :is-empty="filteredLogs.length === 0"
            loading-text="Sedang menyinkronkan data..."
            empty-text="Tidak ada data riwayat sinkronisasi untuk ditampilkan"
          />

          <!-- Data Rows -->
          <tr
            v-for="item in filteredLogs"
            :key="item.id"
            class="hover:bg-slate-50/80 transition-colors"
          >
            <!-- ID Transaksi -->
            <td class="font-mono text-xs font-semibold text-slate-600 whitespace-nowrap">
              {{ item.id }}
            </td>

            <!-- Waktu Catat -->
            <td class="text-xs text-slate-500 font-medium whitespace-nowrap">
              {{ formatWaktu(item.created_at) }}
            </td>

            <!-- Entitas Chip -->
            <td>
              <span class="chip font-medium" :class="getEntityChipClass(item.entity_type)">
                {{ getEntityLabel(item.entity_type) }}
              </span>
            </td>

            <!-- Rincian Transaksi -->
            <td>
              <p class="text-slate-900 font-bold text-xs">{{ item.title }}</p>
              <p v-if="item.subtitle" class="text-xs text-slate-400 font-mono mt-0.5">{{ item.subtitle }}</p>
              <!-- Error alert if failed -->
              <div
                v-if="item.error_message"
                class="mt-1 p-1 rounded-md bg-rose-50 border border-rose-100 text-rose-700 text-[10px] flex items-center gap-1.5"
              >
                <svg class="w-3 h-3 flex-shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="truncate">{{ item.error_message }}</span>
              </div>
            </td>

            <!-- Nominal -->
            <td class="text-right font-bold text-slate-800 font-mono text-xs whitespace-nowrap">
              {{ item.nominal ? formatRupiah(item.nominal) : '-' }}
            </td>

            <!-- Status Badge (standard shared component) -->
            <td class="text-center whitespace-nowrap">
              <StatusBadge
                :status="item.status"
                :label="item.status === 'PENDING' ? 'Antrean' : undefined"
              />
            </td>

            <!-- Aksi Buttons -->
            <td class="text-center whitespace-nowrap">
              <div class="flex items-center justify-center gap-1.5">
                <!-- Retry/Sync Button -->
                <BaseButton
                  v-if="item.status !== 'SYNCED'"
                  @click="syncStore.retrySync(item.id)"
                  :disabled="item.status === 'SYNCING'"
                  size="xs"
                >
                  Sinkron
                </BaseButton>

                <!-- Payload Detail Button -->
                <button
                  @click="viewPayload(item)"
                  class="btn-secondary h-6 px-2 text-[10px] font-bold text-slate-600 rounded cursor-pointer"
                  title="Lihat Data JSON Mentah"
                >
                  JSON
                </button>

                <!-- Remove Log Button -->
                <button
                  @click="syncStore.removeLog(item.id)"
                  type="button"
                  class="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Hapus baris log ini"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </TableScrollWrapper>

    <!-- Modal View Payload Detail (Standard BaseModal) -->
    <BaseModal
      v-model="showPayloadModal"
      :title="`Detail Payload JSON: ${selectedLog?.id || ''}`"
    >
      <div v-if="selectedLog" class="space-y-4">
        <!-- Metadata summary -->
        <div class="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
          <div>
            <span class="text-slate-400">Action:</span>
            <span class="font-mono font-bold text-slate-800 ml-1.5">{{ selectedLog.action }}</span>
          </div>
          <div>
            <span class="text-slate-400">Entity:</span>
            <span class="font-bold text-slate-800 ml-1.5">{{ selectedLog.entity_type }}</span>
          </div>
          <div>
            <span class="text-slate-400">Status:</span>
            <span class="font-bold ml-1.5" :class="selectedLog.status === 'FAILED' ? 'text-rose-600' : 'text-emerald-600'">
              {{ selectedLog.status }}
            </span>
          </div>
          <div>
            <span class="text-slate-400">Waktu:</span>
            <span class="text-slate-700 ml-1.5">{{ formatWaktu(selectedLog.created_at) }}</span>
          </div>
        </div>

        <!-- Raw JSON block -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-xs font-bold text-slate-600">Raw JSON Payload</span>
            <button
              @click="copyPayload(selectedLog.payload)"
              type="button"
              class="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
            >
              {{ copiedPayload ? 'Tersalin!' : 'Salin JSON' }}
            </button>
          </div>
          <pre class="p-3 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono overflow-auto max-h-72 leading-relaxed border border-slate-700">{{ JSON.stringify(selectedLog.payload, null, 2) }}</pre>
        </div>

        <!-- Error message if available -->
        <div v-if="selectedLog.error_message" class="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
          <p class="font-bold mb-1">Pesan Error:</p>
          <p class="font-mono">{{ selectedLog.error_message }}</p>
        </div>
      </div>

      <template #footer>
        <BaseButton variant="secondary" @click="showPayloadModal = false" class="w-full">
          Tutup
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageHeader from './PageHeader.vue'
import MetricStrip from './MetricStrip.vue'
import type { MetricItem } from './MetricStrip.vue'
import FilterTabs from './FilterTabs.vue'
import type { FilterTabItem } from './FilterTabs.vue'
import SearchInput from './SearchInput.vue'
import TableScrollWrapper from './TableScrollWrapper.vue'
import TableStateRow from './TableStateRow.vue'
import StatusBadge from './StatusBadge.vue'
import BaseButton from './BaseButton.vue'
import BaseModal from './BaseModal.vue'
import { useSyncStore } from '../stores/syncStore'
import type { SyncLogItem, SyncStatus, SyncEntityType } from '../types/sync'
import { formatRupiah } from '../utils/formatters'

withDefaults(
  defineProps<{
    showBack?: boolean
  }>(),
  {
    showBack: false,
  },
)

defineEmits<{
  (e: 'back'): void
}>()

const syncStore = useSyncStore()

const selectedFilter = ref('all')
const searchQuery = ref('')

const filterTabs = computed<FilterTabItem[]>(() => [
  { id: 'all', label: 'Semua', count: syncStore.logs.length },
  { id: 'FAILED', label: 'Gagal', count: syncStore.failedCount },
  { id: 'PENDING', label: 'Antrean', count: syncStore.pendingCount },
  { id: 'SYNCED', label: 'Tersinkron', count: syncStore.syncedCount },
])

const summaryMetrics = computed<MetricItem[]>(() => [
  {
    label: 'Status Jaringan',
    value: syncStore.isOnline ? 'Online' : 'Offline',
    valueClass: syncStore.isOnline ? 'text-emerald-600' : 'text-rose-600',
    caption: syncStore.isOnline ? 'Terhubung' : 'Terputus',
  },
  {
    label: 'Koneksi Server',
    value: syncStore.gasLatencyMs !== null ? 'OK' : syncStore.isOnline ? 'Pending' : 'Offline',
    valueClass: syncStore.gasLatencyMs !== null ? 'text-emerald-600' : 'text-slate-600',
    caption: syncStore.gasLatencyMs !== null ? `${syncStore.gasLatencyMs}ms` : 'Latensi GAS',
  },
  {
    label: 'Perlu Sinkron',
    value: String(syncStore.pendingCount + syncStore.failedCount),
    valueClass: (syncStore.pendingCount + syncStore.failedCount) > 0 ? 'text-amber-600' : 'text-slate-600',
    caption: `${syncStore.failedCount} Gagal, ${syncStore.pendingCount} Antrean`,
  },
  {
    label: 'Berhasil',
    value: String(syncStore.syncedCount),
    valueClass: 'text-emerald-600',
    caption: 'Tersimpan di Cloud',
  },
])

const filteredLogs = computed<SyncLogItem[]>(() => {
  let list = syncStore.logs

  if (selectedFilter.value !== 'all') {
    list = list.filter((l) => l.status === selectedFilter.value as SyncStatus)
  }

  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter((l) =>
      l.id.toLowerCase().includes(q) ||
      l.title.toLowerCase().includes(q) ||
      (l.subtitle && l.subtitle.toLowerCase().includes(q)) ||
      l.entity_type.toLowerCase().includes(q)
    )
  }

  return list
})

const showPayloadModal = ref(false)
const selectedLog = ref<SyncLogItem | null>(null)
const copiedPayload = ref(false)

function viewPayload(item: SyncLogItem) {
  selectedLog.value = item
  copiedPayload.value = false
  showPayloadModal.value = true
}

async function copyPayload(payload: any) {
  try {
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
    copiedPayload.value = true
    setTimeout(() => { copiedPayload.value = false }, 2000)
  } catch {}
}

function getEntityChipClass(type: SyncEntityType): string {
  switch (type) {
    case 'ORDER': return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'KAS_MASUK': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'KAS_KELUAR': return 'bg-rose-50 text-rose-700 border-rose-200'
    case 'STATUS_ORDER': return 'bg-purple-50 text-purple-700 border-purple-200'
    case 'VERIFIKASI': return 'bg-amber-50 text-amber-700 border-amber-200'
    default: return 'bg-slate-100 text-slate-600 border-slate-200'
  }
}

function getEntityLabel(type: SyncEntityType): string {
  switch (type) {
    case 'ORDER': return 'Order'
    case 'KAS_MASUK': return 'Kas Masuk'
    case 'KAS_KELUAR': return 'Kas Keluar'
    case 'STATUS_ORDER': return 'Status Order'
    case 'VERIFIKASI': return 'Verifikasi'
    default: return type
  }
}

function formatWaktu(dateStr: string): string {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

onMounted(() => {
  syncStore.checkServerHealth()
})
</script>
