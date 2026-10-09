<template>
  <TableScrollWrapper>
    <table class="data-table w-full min-w-[1900px]">
      <thead>
        <!-- Baris 1: Group Headers -->
        <tr class="whitespace-nowrap">
          <th colspan="7" class="text-center font-bold text-xs border-b border-slate-300 py-2.5 text-slate-700 bg-slate-100">Info Order</th>
          <th colspan="4" class="text-center font-bold text-xs border-b border-amber-300 border-l-2 border-amber-400 py-2.5 text-amber-900 bg-amber-100">Uang Muka (DP)</th>
          <th colspan="4" class="text-center font-bold text-xs border-b border-emerald-300 border-l-2 border-emerald-400 py-2.5 text-emerald-900 bg-emerald-100">Pelunasan</th>
          <th colspan="4" class="text-center font-bold text-xs border-b border-sky-300 border-l-2 border-sky-400 py-2.5 text-sky-950 bg-sky-100">Ringkasan Tagihan</th>
        </tr>
        <!-- Baris 2: Kolom Detail -->
        <tr class="whitespace-nowrap">
          <th class="bg-slate-50 text-slate-600">ID Order</th>
          <th class="bg-slate-50 text-slate-600">Penerbit</th>
          <th class="bg-slate-50 text-slate-600">
            <div class="inline-flex items-center gap-1.5">
              <span>Judul</span>
              <button
                type="button"
                @click="toggleAllJudul"
                class="text-[10px] font-normal text-slate-500 hover:text-red-700 bg-slate-100 hover:bg-slate-200/80 px-1.5 py-0.5 rounded transition-all cursor-pointer select-none"
                :title="isAllJudulExpanded ? 'Ciutkan semua judul' : 'Lihat semua judul lengkap'"
              >
                {{ isAllJudulExpanded ? '▲ Ciutkan' : '▼ Lihat Semua' }}
              </button>
            </div>
          </th>
          <th class="text-right bg-slate-50 text-slate-600">Qty</th>
          <th class="bg-slate-50 text-slate-600">Ukuran</th>
          <th class="bg-slate-50 text-slate-600">Kertas</th>
          <th class="text-right bg-slate-50 text-slate-600">Total Tagihan</th>
          <th class="border-l-2 border-amber-400 bg-amber-50 text-amber-800">Tgl DP</th>
          <th class="text-right bg-amber-50 text-amber-800">Nominal DP</th>
          <th class="bg-amber-50 text-amber-800">Metode DP</th>
          <th class="text-center bg-amber-50 text-amber-800">Bukti DP</th>
          <th class="border-l-2 border-emerald-400 bg-emerald-50 text-emerald-800">Tgl Pelunasan</th>
          <th class="text-right bg-emerald-50 text-emerald-800">Nominal Pelunasan</th>
          <th class="bg-emerald-50 text-emerald-800">Metode Pelunasan</th>
          <th class="text-center bg-emerald-50 text-emerald-800">Bukti Pelunasan</th>
          <th class="text-right border-l-2 border-sky-400 bg-sky-50 text-sky-800">Sudah Masuk</th>
          <th class="text-right bg-sky-50 text-sky-800">Sisa Piutang</th>
          <th class="text-center bg-sky-50 text-sky-800">Status Bayar</th>
          <th class="text-center bg-sky-50 text-sky-800">Aksi</th>
        </tr>
      </thead>
      <tbody>
        <TableStateRow
          :colspan="19"
          :loading="isLoading"
          :is-empty="rows.length === 0"
          empty-text="Tidak ada data transaksi order pada filter ini"
        />

        <tr
          v-for="row in rows"
          :key="row.order.id_order"
          class="group/row hover:bg-slate-50/70 transition-colors"
        >
          <!-- 1. ID Order -->
          <td class="font-mono text-xs font-semibold text-slate-700 whitespace-nowrap align-top py-3">
            <div class="inline-flex items-center gap-1.5">
              <span>{{ row.order.id_order }}</span>
              <span
                v-if="row.has_pending"
                class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"
                title="Ada transfer kasir yang menunggu verifikasi"
              ></span>
            </div>
          </td>

          <!-- 2. Penerbit -->
          <td
            class="font-bold text-slate-900 align-top py-3 transition-all"
            :class="expandedPenerbit[row.order.id_order] ? 'min-w-[180px] max-w-[280px]' : 'max-w-[150px]'"
            :title="row.order.nama_penerbit"
          >
            <div
              @click="togglePenerbit(row.order.id_order)"
              class="cursor-pointer group select-text rounded p-1 -m-1 hover:bg-slate-100 transition-colors"
              title="Klik untuk melihat / menciutkan penerbit"
            >
              <p :class="expandedPenerbit[row.order.id_order] ? 'whitespace-normal break-words leading-snug' : 'truncate'">
                {{ row.order.nama_penerbit }}
              </p>
            </div>
          </td>

          <!-- 3. Judul -->
          <td
            class="align-top py-3 transition-all"
            :class="expandedJudul[row.order.id_order] ? 'min-w-[260px] max-w-[420px]' : 'max-w-[200px]'"
          >
            <div
              @click="toggleJudul(row.order.id_order)"
              class="cursor-pointer group select-text rounded p-1.5 -m-1 transition-all hover:bg-red-50/70 border border-transparent hover:border-red-200"
              :title="expandedJudul[row.order.id_order] ? 'Klik untuk menciutkan judul' : 'Klik untuk melihat teks judul lengkap'"
            >
              <div class="flex items-start justify-between gap-1">
                <p
                  class="font-semibold text-xs text-slate-800 transition-colors group-hover:text-red-700"
                  :class="expandedJudul[row.order.id_order] ? 'whitespace-normal break-words leading-relaxed' : 'truncate'"
                >
                  {{ row.order.judul_penulis }}
                </p>
                <span
                  class="text-[10px] text-slate-400 group-hover:text-red-600 shrink-0 font-mono transition-transform mt-0.5"
                  :class="expandedJudul[row.order.id_order] ? 'rotate-180 text-red-600 font-bold' : ''"
                >
                  ▼
                </span>
              </div>
              <div v-if="expandedJudul[row.order.id_order]" class="mt-1 flex items-center justify-between border-t border-red-100 pt-1">
                <span class="text-[9px] text-red-600 font-semibold">Teks Lengkap</span>
                <span class="text-[9px] text-slate-400 group-hover:text-red-600 font-medium">▲ Klik untuk Ciutkan</span>
              </div>
            </div>
          </td>

          <!-- 4. Qty -->
          <td class="text-right align-top py-3 whitespace-nowrap font-mono font-bold text-slate-900 text-xs">
            {{ row.order.jml_pcs }}
          </td>

          <!-- 5. Ukuran -->
          <td class="align-top py-3 whitespace-nowrap text-xs text-slate-700">
            {{ row.order.ukuran_custom || row.order.ukuran }}
          </td>

          <!-- 6. Kertas -->
          <td class="align-top py-3 text-xs text-slate-600 whitespace-nowrap">
            {{ formatKertasOrder(row.order) }}
          </td>

          <!-- 7. Total Tagihan -->
          <td class="text-right font-mono font-bold whitespace-nowrap align-top py-3" :class="row.order.status_order === 'BATAL' ? 'line-through text-slate-400' : 'text-slate-900'">
            {{ formatRupiah(row.order.total_harga) }}
          </td>

          <!-- Tgl DP -->
          <td class="align-top py-3 whitespace-nowrap text-xs text-slate-700 border-l-2 border-amber-300 bg-amber-50/40 group-hover/row:bg-amber-100/70 transition-colors">
            <template v-for="tx in row.dpPayments" :key="tx.id">
              <div>{{ formatTanggal(tx.tanggal) }}</div>
            </template>
            <span v-if="row.dpPayments.length === 0" class="text-slate-300 italic">—</span>
          </td>

          <!-- Nominal DP -->
          <td
            class="text-right align-top py-3 whitespace-nowrap text-xs font-mono font-bold bg-amber-50/40 group-hover/row:bg-amber-100/70 transition-colors"
            :class="row.dpPending ? 'text-amber-700' : 'text-slate-900'"
          >
            <template v-for="tx in row.dpPayments" :key="tx.id">
              <div>{{ formatRupiah(tx.nominal) }}</div>
            </template>
            <span v-if="row.dpPayments.length === 0" class="text-slate-300 font-normal italic">—</span>
          </td>

          <!-- Metode DP -->
          <td class="align-top py-3 whitespace-nowrap text-xs text-slate-700 bg-amber-50/40 group-hover/row:bg-amber-100/70 transition-colors">
            <template v-for="tx in row.dpPayments" :key="tx.id">
              <div>{{ formatMetode(tx.metode) }}</div>
            </template>
            <span v-if="row.dpPayments.length === 0" class="text-slate-300 italic">—</span>
          </td>

          <!-- Bukti/Status DP -->
          <td class="text-center align-top py-3 text-xs bg-amber-50/40 group-hover/row:bg-amber-100/70 transition-colors">
            <template v-for="tx in row.dpPayments" :key="tx.id">
              <div class="flex items-center justify-center gap-1">
                <a
                  v-if="tx.fileId"
                  :href="`https://drive.google.com/file/d/${tx.fileId}/view`"
                  target="_blank"
                  rel="noopener"
                  class="text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                >
                  Resi
                </a>
                <button
                  v-if="tx.status_verifikasi === 'PENDING'"
                  @click.stop="$emit('verify-tx', tx)"
                  :disabled="verifyingId === tx.id"
                  type="button"
                  class="px-1.5 py-0.5 font-bold rounded bg-amber-500 hover:bg-amber-600 text-white cursor-pointer transition-colors"
                >
                  {{ verifyingId === tx.id ? '...' : 'Verif' }}
                </button>
                <span v-else class="text-emerald-600 font-bold" title="Terverifikasi">✓</span>

                <!-- Tombol Edit Pembayaran DP -->
                <button
                  @click.stop="$emit('edit-payment', tx, row.order)"
                  type="button"
                  class="px-1.5 py-0.5 rounded text-[10px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                  title="Edit Data Transaksi DP"
                >
                  <svg class="w-3 h-3 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit</span>
                </button>
              </div>
            </template>
            <span v-if="row.dpPayments.length === 0" class="text-slate-300 italic">—</span>
          </td>

          <!-- Tgl Pelunasan -->
          <td class="align-top py-3 whitespace-nowrap text-xs text-slate-700 border-l-2 border-emerald-300 bg-emerald-50/40 group-hover/row:bg-emerald-100/70 transition-colors">
            <template v-for="tx in row.pelunasanPayments" :key="tx.id">
              <div>{{ formatTanggal(tx.tanggal) }}</div>
            </template>
            <span v-if="row.pelunasanPayments.length === 0" class="text-slate-300 italic">—</span>
          </td>

          <!-- Nominal Pelunasan -->
          <td
            class="text-right align-top py-3 whitespace-nowrap text-xs font-mono font-bold bg-emerald-50/40 group-hover/row:bg-emerald-100/70 transition-colors"
            :class="row.pelunasanPending ? 'text-amber-700' : 'text-slate-900'"
          >
            <template v-for="tx in row.pelunasanPayments" :key="tx.id">
              <div>{{ formatRupiah(tx.nominal) }}</div>
            </template>
            <span v-if="row.pelunasanPayments.length === 0" class="text-slate-300 font-normal italic">—</span>
          </td>

          <!-- Metode Pelunasan -->
          <td class="align-top py-3 whitespace-nowrap text-xs text-slate-700 bg-emerald-50/40 group-hover/row:bg-emerald-100/70 transition-colors">
            <template v-for="tx in row.pelunasanPayments" :key="tx.id">
              <div>{{ formatMetode(tx.metode) }}</div>
            </template>
            <span v-if="row.pelunasanPayments.length === 0" class="text-slate-300 italic">—</span>
          </td>

          <!-- Bukti/Status Pelunasan -->
          <td class="text-center align-top py-3 text-xs bg-emerald-50/40 group-hover/row:bg-emerald-100/70 transition-colors">
            <template v-for="tx in row.pelunasanPayments" :key="tx.id">
              <div class="flex items-center justify-center gap-1">
                <a
                  v-if="tx.fileId"
                  :href="`https://drive.google.com/file/d/${tx.fileId}/view`"
                  target="_blank"
                  rel="noopener"
                  class="text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                >
                  Resi
                </a>
                <button
                  v-if="tx.status_verifikasi === 'PENDING'"
                  @click.stop="$emit('verify-tx', tx)"
                  :disabled="verifyingId === tx.id"
                  type="button"
                  class="px-1.5 py-0.5 font-bold rounded bg-amber-500 hover:bg-amber-600 text-white cursor-pointer transition-colors"
                >
                  {{ verifyingId === tx.id ? '...' : 'Verif' }}
                </button>
                <span v-else class="text-emerald-600 font-bold" title="Terverifikasi">✓</span>

                <!-- Tombol Edit Pembayaran Pelunasan -->
                <button
                  @click.stop="$emit('edit-payment', tx, row.order)"
                  type="button"
                  class="px-1.5 py-0.5 rounded text-[10px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                  title="Edit Data Transaksi Pelunasan"
                >
                  <svg class="w-3 h-3 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit</span>
                </button>
              </div>
            </template>
            <span v-if="row.pelunasanPayments.length === 0" class="text-slate-300 italic">—</span>
          </td>

          <!-- Sudah Masuk -->
          <td class="text-right font-mono font-semibold text-emerald-700 whitespace-nowrap align-top py-3 border-l-2 border-sky-300 bg-sky-50/30 group-hover/row:bg-sky-100/60 transition-colors">
            <div class="inline-flex items-center gap-1.5 justify-end">
              <span>{{ formatRupiah(row.total_masuk ?? row.total_masuk_verified) }}</span>
              <span
                v-if="row.has_pending"
                class="text-[10px] text-amber-700 font-bold bg-amber-100 px-1 rounded border border-amber-300"
                title="Ada transaksi kasir menunggu approval"
              >
                Wait
              </span>
            </div>
            <div
              v-if="row.total_masuk_verified > row.order.total_harga"
              class="text-[10px] font-bold text-emerald-600 mt-0.5"
              title="Pembayaran melebihi total tagihan faktur"
            >
              +{{ formatRupiah(row.total_masuk_verified - row.order.total_harga) }} (Lebih)
            </div>
          </td>

          <!-- Sisa Piutang -->
          <td class="text-right font-extrabold whitespace-nowrap align-top py-3 bg-sky-50/30 group-hover/row:bg-sky-100/60 transition-colors"
              :class="row.order.status_order === 'BATAL' ? 'text-slate-400 font-normal text-xs' : row.sisa_tagihan > 0 ? 'text-rose-600' : 'text-emerald-600'">
            {{ row.order.status_order === 'BATAL' ? 'Rp 0 (Batal)' : formatRupiah(row.sisa_tagihan) }}
          </td>

          <!-- Status Bayar Badge -->
          <td class="text-center whitespace-nowrap align-top py-3 bg-sky-50/30 group-hover/row:bg-sky-100/60 transition-colors">
            <StatusBadge :status="row.status_bayar" :verification="row.order.status_order === 'BATAL' ? '' : getVerificationStatus(row.payments)" />
          </td>

          <!-- Aksi -->
          <td class="text-center whitespace-nowrap align-middle py-3 px-3 bg-sky-50/30 group-hover/row:bg-sky-100/60 transition-colors">
            <div class="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
              <!-- Tombol Bayar jika ada sisa tagihan & bukan BATAL -->
              <button
                v-if="row.order.status_order !== 'BATAL' && row.sisa_tagihan > 0"
                @click.stop="$emit('bayar-order', row)"
                type="button"
                class="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs hover:shadow-xs whitespace-nowrap"
                title="Catat pembayaran piutang baru"
              >
                <svg class="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
                </svg>
                <span>+ Bayar</span>
              </button>
              <button
                v-else-if="row.order.status_order === 'BATAL' && (row.total_masuk ?? row.total_masuk_verified) > 0"
                @click.stop="$emit('refund-order', row)"
                type="button"
                class="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs hover:shadow-xs whitespace-nowrap"
                title="Penyelesaian dana order batal: Catat Refund Kas Keluar atau Alihkan ke Saldo Deposit"
              >
                <span>🔄 Refund / Deposit</span>
              </button>
              <span
                v-else-if="row.order.status_order === 'BATAL'"
                class="text-xs text-slate-400 font-mono px-1 select-none"
              >
                —
              </span>
              <span
                v-else
                class="px-2 py-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg font-bold inline-flex items-center gap-1 whitespace-nowrap"
              >
                ✓ Lunas
              </span>

              <!-- Tombol Edit Order (Data Faktur & Spek) - Hanya untuk order aktif (bukan BATAL) -->
              <button
                v-if="row.order.status_order !== 'BATAL'"
                @click.stop="$emit('edit-order', row.order)"
                type="button"
                class="px-2.5 py-1 text-xs font-bold rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs hover:shadow-xs whitespace-nowrap"
                title="Edit Data Order (Judul, Harga, Spek, Status)"
              >
                <svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Edit Order</span>
              </button>

              <!-- Tombol Edit Kas jika ada pembayaran -->
              <button
                v-if="row.payments.length > 0"
                @click.stop="$emit('select-edit-payment', row)"
                type="button"
                class="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs hover:shadow-xs whitespace-nowrap"
                :title="`Edit Data Pembayaran (${row.payments.length} transaksi)`"
              >
                <svg class="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Edit Kas</span>
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </TableScrollWrapper>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TableScrollWrapper from '@shared/components/TableScrollWrapper.vue'
import TableStateRow from '@shared/components/TableStateRow.vue'
import StatusBadge from '@shared/components/StatusBadge.vue'
import {
  formatRupiah,
  formatTanggal,
  formatMetode,
  formatKertasOrder,
  getVerificationStatus,
} from '@shared/utils/formatters'
import type { Order, PiutangRow } from '@shared/types'
import type { EnrichedPiutangRow, OrderTxRow } from '../../composables/useTransaksiFilter'

const props = defineProps<{
  rows: EnrichedPiutangRow[]
  isLoading: boolean
  verifyingId: string | null
}>()

defineEmits<{
  (e: 'verify-tx', tx: OrderTxRow): void
  (e: 'edit-payment', tx: OrderTxRow, order: Order): void
  (e: 'edit-order', order: Order): void
  (e: 'bayar-order', row: PiutangRow): void
  (e: 'refund-order', row: EnrichedPiutangRow): void
  (e: 'select-edit-payment', row: EnrichedPiutangRow): void
}>()

const expandedJudul = ref<Record<string, boolean>>({})
const expandedPenerbit = ref<Record<string, boolean>>({})
const isAllJudulExpanded = ref(false)

function toggleJudul(id: string) {
  expandedJudul.value[id] = !expandedJudul.value[id]
}

function togglePenerbit(id: string) {
  expandedPenerbit.value[id] = !expandedPenerbit.value[id]
}

function toggleAllJudul() {
  isAllJudulExpanded.value = !isAllJudulExpanded.value
  for (const row of props.rows) {
    expandedJudul.value[row.order.id_order] = isAllJudulExpanded.value
  }
}
</script>
