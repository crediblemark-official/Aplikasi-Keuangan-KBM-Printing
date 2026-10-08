<template>
  <TableScrollWrapper>
    <div class="p-3.5 sm:p-4 bg-amber-50/60 border-b border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div>
        <h4 class="text-xs sm:text-sm font-bold text-amber-950 flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-amber-500"></span>
          Daftar Kas Masuk Tanpa Order (Tercatat di Buku Kas)
        </h4>
        <p class="text-[11px] sm:text-xs text-amber-800 mt-0.5">
          Transaksi uang masuk di bawah ini berstatus terverifikasi dan masuk ke saldo Buku Kas, namun nomor order referensinya tidak ada di sheet Orders.
        </p>
      </div>
      <div class="sm:text-right shrink-0">
        <span class="text-[11px] font-semibold text-slate-500 block">Total Nominal:</span>
        <span class="text-base font-black font-mono text-amber-800">{{ formatRupiah(totalNominal) }}</span>
      </div>
    </div>
    <table class="data-table w-full min-w-[1000px]">
      <thead>
        <tr class="whitespace-nowrap bg-slate-50 text-slate-600 text-xs">
          <th class="py-2.5 px-3 text-left">ID Kas Masuk</th>
          <th class="py-2.5 px-3 text-left">Tanggal</th>
          <th class="py-2.5 px-3 text-left">Nomor Order Terkait</th>
          <th class="py-2.5 px-3 text-left">Nama Penerbit</th>
          <th class="py-2.5 px-3 text-left">Jenis Bayar</th>
          <th class="py-2.5 px-3 text-left">Metode Kas</th>
          <th class="py-2.5 px-3 text-right">Nominal Masuk</th>
          <th class="py-2.5 px-3 text-center">Status Verifikasi</th>
          <th class="py-2.5 px-3 text-left">Keterangan</th>
          <th class="py-2.5 px-3 text-center">Bukti Resi</th>
          <th class="py-2.5 px-3 text-center">Tindakan</th>
        </tr>
      </thead>
      <tbody>
        <TableStateRow
          :colspan="11"
          :loading="isLoading"
          :is-empty="items.length === 0"
          empty-text="Tidak ada data kas masuk tanpa order pada periode ini"
        />
        <tr
          v-for="item in items"
          :key="item.id"
          class="hover:bg-amber-50/30 transition-colors"
        >
          <td class="font-mono font-bold text-xs text-slate-800 px-3 py-3 whitespace-nowrap">{{ item.id }}</td>
          <td class="whitespace-nowrap text-xs text-slate-700 px-3 py-3">{{ formatTanggal(item.tanggal) }}</td>
          <td class="px-3 py-3 whitespace-nowrap">
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
              <span>{{ item.id_order || 'Tanpa ID Order' }}</span>
              <span class="text-[10px] text-rose-500 font-sans font-medium">(Tidak Ada di Order)</span>
            </span>
          </td>
          <td class="font-medium text-xs text-slate-900 px-3 py-3 whitespace-nowrap">{{ item.nama_penerbit }}</td>
          <td class="text-xs text-slate-700 px-3 py-3 whitespace-nowrap">{{ item.jenis_pembayaran }}</td>
          <td class="text-xs text-slate-700 px-3 py-3 whitespace-nowrap">{{ formatMetode(item.metode) }}</td>
          <td class="text-right font-mono font-bold text-xs text-emerald-600 px-3 py-3 whitespace-nowrap">
            {{ formatRupiah(item.nominal) }}
          </td>
          <td class="text-center px-3 py-3 whitespace-nowrap">
            <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {{ item.status_verifikasi }}
            </span>
          </td>
          <td class="text-xs text-slate-600 max-w-[260px] truncate px-3 py-3" :title="item.keterangan">
            {{ item.keterangan || '-' }}
          </td>
          <td class="text-center px-3 py-3 whitespace-nowrap">
            <a
              v-if="item.fileId"
              :href="`https://drive.google.com/file/d/${item.fileId}/view`"
              target="_blank"
              rel="noopener"
              class="text-blue-600 hover:text-blue-800 font-bold underline text-xs"
            >
              Lihat
            </a>
            <span v-else class="text-slate-300 text-xs italic">-</span>
          </td>
          <td class="text-center px-3 py-3 whitespace-nowrap">
            <button
              @click="router.push('/dashboard/buku-kas')"
              type="button"
              class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1"
            >
              <span>Buku Kas</span>
              <svg class="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </TableScrollWrapper>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import TableScrollWrapper from '@shared/components/TableScrollWrapper.vue'
import TableStateRow from '@shared/components/TableStateRow.vue'
import { formatRupiah, formatTanggal, formatMetode } from '@shared/utils/formatters'

defineProps<{
  items: any[]
  totalNominal: number
  isLoading: boolean
}>()

const router = useRouter()
</script>
