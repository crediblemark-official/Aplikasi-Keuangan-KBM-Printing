<template>
  <div class="bg-white">
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-[8px] sm:px-[15px] lg:px-[20px] py-2.5 border-b border-slate-100 bg-slate-50/40"
    >
      <div class="flex items-center gap-2">
        <h3 class="text-slate-900 font-bold text-xs sm:text-sm">Jurnal Mutasi Buku Kas</h3>
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/80 text-slate-700">
          {{ filteredCount }} Transaksi
        </span>
      </div>

      <div
        class="flex items-center gap-2 w-full sm:w-auto overflow-x-auto scrollbar-none py-0.5 justify-between sm:justify-end"
      >
        <!-- Filter Tabs Tipe -->
        <div
          class="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-lg overflow-x-auto scrollbar-none flex-nowrap shrink-0 max-w-full"
        >
          <button
            v-for="tab in mutasiTabs"
            :key="tab.id"
            @click="$emit('update:activeTab', tab.id as any)"
            class="px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap"
            :class="activeTab === tab.id
              ? 'bg-white text-slate-900 shadow-2xs font-bold'
              : 'text-slate-600 hover:text-slate-900'"
          >
            <span>{{ tab.label }}</span>
          </button>
        </div>

        <!-- Search Input -->
        <div class="w-36 sm:w-48 shrink-0">
          <SearchInput
            :model-value="searchQuery"
            @update:model-value="$emit('update:searchQuery', $event)"
            placeholder="Cari keterangan..."
          />
        </div>
      </div>
    </div>

    <TableScrollWrapper>
      <table class="data-table w-full min-w-[760px]">
        <thead>
          <tr class="whitespace-nowrap">
            <th>Tanggal</th>
            <th>Tipe</th>
            <th>Kategori / Jenis</th>
            <th>Keterangan / Rincian</th>
            <th>Sumber Kas</th>
            <th class="text-right">Debit (Masuk)</th>
            <th class="text-right">Kredit (Keluar)</th>
            <th class="text-center">Bukti / Nota</th>
            <th class="text-center">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <TableStateRow
            :colspan="9"
            :loading="isLoading"
            :is-empty="items.length === 0"
            empty-text="Belum ada mutasi kas tercatat pada periode ini"
          />
          <tr v-for="row in items" :key="row.id" class="hover:bg-slate-50/70">
            <td class="font-mono text-xs font-semibold text-slate-600 whitespace-nowrap">
              {{ formatTanggal(row.tanggal) }}
            </td>
            <td class="whitespace-nowrap">
              <span
                v-if="row.tipe === 'MASUK'"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
              >
                <span>⬇ Kas Masuk</span>
              </span>
              <span
                v-else
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200"
              >
                <span>⬆ Kas Keluar</span>
              </span>
            </td>
            <td class="whitespace-nowrap font-medium text-slate-700 text-xs">
              {{ row.kategori }}
            </td>
            <td class="max-w-[260px]">
              <p class="truncate text-slate-900 font-medium text-xs" :title="row.keterangan">
                {{ row.keterangan }}
              </p>
            </td>
            <td class="whitespace-nowrap text-slate-600 font-medium text-xs">
              {{ formatMetode(row.sumber_kas) }}
            </td>
            <td class="text-right font-mono font-semibold text-emerald-600 whitespace-nowrap">
              {{ row.tipe === 'MASUK' ? formatRupiah(row.nominal) : '-' }}
            </td>
            <td class="text-right font-mono font-semibold text-rose-600 whitespace-nowrap">
              {{ row.tipe === 'KELUAR' ? formatRupiah(row.nominal) : '-' }}
            </td>
            <td class="text-center whitespace-nowrap">
              <a
                v-if="row.fileId"
                :href="getDriveFileUrl(row.fileId)"
                target="_blank"
                rel="noopener"
                class="text-blue-600 hover:text-blue-800 text-xs font-semibold underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Lihat</span>
              </a>
              <span v-else class="text-slate-400 text-[11px] italic">-</span>
            </td>
            <td class="text-center whitespace-nowrap">
              <button
                @click="$emit('edit:row', row)"
                type="button"
                class="px-2 py-0.5 rounded text-slate-500 hover:text-amber-700 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-all inline-flex items-center gap-1 text-xs font-semibold cursor-pointer"
                title="Edit Transaksi Mutasi"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Edit</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </TableScrollWrapper>

    <!-- Load More Mutasi Kas Section -->
    <div
      v-if="hasMoreMutasi"
      class="px-4 py-3.5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs"
    >
      <div class="flex items-center gap-2 text-xs text-slate-600 font-medium">
        <span>
          Menampilkan <strong>{{ items.length }}</strong> dari total
          <strong>{{ filteredCount }}</strong> transaksi kas
        </span>
        <span class="text-slate-300">|</span>
        <span class="text-slate-500 font-mono">
          Tersisa {{ filteredCount - items.length }} lagi
        </span>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <button
          type="button"
          @click="$emit('load-more')"
          class="h-8 px-4 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-2xs hover:border-slate-400 active:scale-97 transition-all inline-flex items-center gap-1.5 cursor-pointer"
        >
          <svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
          </svg>
          <span>Muat Lebih Banyak (+{{ nextMutasiBatchCount }})</span>
        </button>

        <button
          v-if="filteredCount - items.length > mutasiPageSize"
          type="button"
          @click="$emit('show-all')"
          class="h-8 px-3 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-all cursor-pointer"
        >
          Tampilkan Semua ({{ filteredCount }})
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import TableScrollWrapper from '@shared/components/TableScrollWrapper.vue'
import TableStateRow from '@shared/components/TableStateRow.vue'
import SearchInput from '@shared/components/SearchInput.vue'
import { formatTanggal, formatMetode, formatRupiah } from '@shared/utils/formatters'
import type { MutasiRow } from '../../composables/useBukuKasData'

defineProps<{
  items: MutasiRow[]
  filteredCount: number
  activeTab: 'SEMUA' | 'MASUK' | 'KELUAR' | 'DEPOSIT'
  mutasiTabs: Array<{ id: string; label: string }>
  searchQuery: string
  isLoading: boolean
  hasMoreMutasi: boolean
  nextMutasiBatchCount: number
  mutasiPageSize: number
}>()

defineEmits<{
  (e: 'update:activeTab', tab: 'SEMUA' | 'MASUK' | 'KELUAR' | 'DEPOSIT'): void
  (e: 'update:searchQuery', q: string): void
  (e: 'edit:row', row: MutasiRow): void
  (e: 'load-more'): void
  (e: 'show-all'): void
}>()

function getDriveFileUrl(fileId: string): string {
  if (fileId.startsWith('http')) return fileId
  return `https://drive.google.com/file/d/${fileId}/view`
}
</script>
