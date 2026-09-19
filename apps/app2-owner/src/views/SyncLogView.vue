<template>
  <div class="w-full min-h-full bg-white fade-in">

    <!-- Standard Shared Header -->
    <PageHeader title="Log Sinkronisasi">
      <template #actions>
        <!-- Search Input in Header (same as PiutangView) -->
        <div class="w-36 sm:w-56">
          <SearchInput
            v-model="searchQuery"
            placeholder="Cari ID / transaksi..."
          />
        </div>

        <!-- Sync All Action Button -->
        <BaseButton
          @click="syncStore.syncAllPending()"
          :disabled="syncStore.isSyncingAll"
          size="sm"
        >
          <template #icon>
            <svg
              :class="['w-3.5 h-3.5', { 'animate-spin': syncStore.isSyncingAll }]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </template>
          <span class="hidden sm:inline">{{ syncStore.isSyncingAll ? 'Menyinkronkan...' : 'Sinkronkan' }}</span>
          <span class="sm:hidden">Sinkron</span>
        </BaseButton>

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

        <!-- Clear Synced Logs Button -->
        <button
          v-if="syncStore.syncedCount > 0"
          @click="syncStore.clearSuccessfulLogs()"
          class="btn-secondary h-8 text-xs font-semibold inline-flex items-center gap-1.5 px-2.5 rounded-md cursor-pointer text-slate-500 hover:text-slate-800"
          title="Bersihkan riwayat yang sudah berhasil tersinkron"
        >
          <span class="hidden md:inline">Bersihkan</span>
        </button>
      </template>
    </PageHeader>

    <!-- Summary Metrics Strip (same as SummaryView, KasKeluarView, PiutangView) -->
    <MetricStrip :items="summaryMetrics" />

    <!-- Shared Filter Bar (same as VerifikasiView and PiutangView) -->
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
              <!-- Error message alert if failed -->
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
      title="Rincian Payload Transaksi"
      :subtitle="selectedPayloadItem ? `${selectedPayloadItem.action} • ${selectedPayloadItem.id}` : ''"
    >
      <div class="space-y-3">
        <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
          <div class="flex justify-between">
            <span class="text-slate-500">Judul:</span>
            <span class="font-bold text-slate-800">{{ selectedPayloadItem?.title }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Entitas:</span>
            <span class="font-semibold text-slate-700">{{ selectedPayloadItem?.entity_type }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Status Terakhir:</span>
            <span class="font-semibold text-slate-700">{{ selectedPayloadItem?.status }}</span>
          </div>
          <div v-if="selectedPayloadItem?.error_message" class="flex justify-between text-rose-600">
            <span>Pesan Kesalahan:</span>
            <span class="font-medium">{{ selectedPayloadItem?.error_message }}</span>
          </div>
        </div>

        <div>
          <label class="text-xs font-semibold text-slate-600 mb-1 block">Payload Data (JSON):</label>
          <div class="rounded-xl bg-slate-950 p-3 max-h-72 overflow-y-auto text-[11px] text-emerald-400 font-mono leading-relaxed select-text">
            <pre>{{ selectedPayloadItem ? JSON.stringify(selectedPayloadItem.payload, null, 2) : '' }}</pre>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <BaseButton
            variant="secondary"
            @click="showPayloadModal = false"
            size="sm"
          >
            Tutup
          </BaseButton>
        </div>
      </template>
    </BaseModal>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageHeader from '@shared/components/PageHeader.vue'
import MetricStrip from '@shared/components/MetricStrip.vue'
import type { MetricItem } from '@shared/components/MetricStrip.vue'
import FilterTabs from '@shared/components/FilterTabs.vue'
import SearchInput from '@shared/components/SearchInput.vue'
import TableScrollWrapper from '@shared/components/TableScrollWrapper.vue'
import TableStateRow from '@shared/components/TableStateRow.vue'
import StatusBadge from '@shared/components/StatusBadge.vue'
import BaseButton from '@shared/components/BaseButton.vue'
import BaseModal from '@shared/components/BaseModal.vue'
import { useSyncStore } from '@shared/stores/syncStore'
import type { SyncLogItem, SyncStatus, SyncEntityType } from '@shared/types/sync'
import { formatRupiah } from '@shared/utils/formatters'

const syncStore = useSyncStore()

const selectedFilter = ref('all')
const searchQuery = ref('')
const selectedPayloadItem = ref<SyncLogItem | null>(null)
const showPayloadModal = ref(false)

const summaryMetrics = computed<MetricItem[]>(() => [
  {
    label: 'Persentase Sinkron',
    value: `${syncStore.syncPercentage}%`,
    valueClass: syncStore.isAllSynced ? 'text-emerald-600' : 'text-amber-600',
    sub: syncStore.isAllSynced ? 'Semua Data Aman' : `${syncStore.pendingCount + syncStore.failedCount} Data Tertunda`,
    subDot: syncStore.isAllSynced ? 'bg-emerald-500' : 'bg-amber-500',
  },
  {
    label: 'Koneksi Server',
    value: syncStore.isOnline && syncStore.gasLatencyMs !== null ? `${syncStore.gasLatencyMs} ms` : (syncStore.isOnline ? 'Online' : 'Offline'),
    valueClass: syncStore.isOnline ? 'text-emerald-600' : 'text-rose-600',
    sub: syncStore.isOnline ? 'Google Apps Script Terhubung' : 'Gagal Menghubungi Server',
    subDot: syncStore.isOnline ? 'bg-emerald-500' : 'bg-rose-500',
  },
  {
    label: 'Antrean Tertunda',
    value: `${syncStore.pendingCount}`,
    valueClass: syncStore.pendingCount > 0 ? 'text-amber-600' : 'text-slate-800',
    sub: 'Menunggu Pengiriman ke GAS',
    subDot: syncStore.pendingCount > 0 ? 'bg-amber-500' : undefined,
  },
  {
    label: 'Berhasil Tersinkron',
    value: `${syncStore.syncedCount}`,
    valueClass: 'text-emerald-600',
    sub: 'Tercatat di Google Sheets',
    subDot: 'bg-emerald-500',
  },
  {
    label: 'Gagal / Perlu Ulang',
    value: `${syncStore.failedCount}`,
    valueClass: syncStore.failedCount > 0 ? 'text-rose-600' : 'text-slate-800',
    sub: syncStore.failedCount > 0 ? 'Klik Sinkron untuk Kirim Ulang' : 'Tidak Ada Kendala',
    subDot: syncStore.failedCount > 0 ? 'bg-rose-500' : undefined,
  },
])

const filterTabs = computed(() => [
  { value: 'all', id: 'all', label: 'Semua', count: syncStore.logs.length },
  { value: 'PENDING', id: 'PENDING', label: 'Antrean', count: syncStore.pendingCount },
  { value: 'FAILED', id: 'FAILED', label: 'Gagal', count: syncStore.failedCount },
  { value: 'SYNCED', id: 'SYNCED', label: 'Tersinkron', count: syncStore.syncedCount },
])

const filteredLogs = computed(() => {
  let list = syncStore.logs

  if (selectedFilter.value !== 'all') {
    list = list.filter((l) => l.status === selectedFilter.value)
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(
      (l) =>
        l.id.toLowerCase().includes(q) ||
        l.title.toLowerCase().includes(q) ||
        (l.subtitle && l.subtitle.toLowerCase().includes(q)) ||
        l.entity_type.toLowerCase().includes(q)
    )
  }

  return list
})

function formatWaktu(iso: string) {
  if (!iso) return '-'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const tgl = d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const jam = d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  return `${tgl} ${jam}`
}

function getEntityLabel(type: SyncEntityType): string {
  switch (type) {
    case 'ORDER':
      return 'Order Baru'
    case 'KAS_MASUK':
      return 'Kas Masuk'
    case 'KAS_KELUAR':
      return 'Kas Keluar'
    case 'STATUS_ORDER':
      return 'Status Order'
    case 'VERIFIKASI':
      return 'Verifikasi'
    default:
      return type
  }
}

function getEntityChipClass(type: SyncEntityType): string {
  switch (type) {
    case 'ORDER':
      return 'text-blue-700 bg-blue-50 border-blue-200'
    case 'KAS_MASUK':
      return 'text-emerald-700 bg-emerald-50 border-emerald-200'
    case 'KAS_KELUAR':
      return 'text-rose-700 bg-rose-50 border-rose-200'
    case 'STATUS_ORDER':
      return 'text-purple-700 bg-purple-50 border-purple-200'
    case 'VERIFIKASI':
      return 'text-amber-700 bg-amber-50 border-amber-200'
    default:
      return 'text-slate-700 bg-slate-50 border-slate-200'
  }
}

function viewPayload(item: SyncLogItem) {
  selectedPayloadItem.value = item
  showPayloadModal.value = true
}

onMounted(() => {
  syncStore.checkServerHealth()
})
</script>
