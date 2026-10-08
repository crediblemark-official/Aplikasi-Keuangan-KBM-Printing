<template>
  <div class="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-slate-200 bg-white lg:bg-slate-50/30">
    <div class="lg:sticky lg:top-0 z-10">
      <!-- Order Header Summary -->
      <div class="p-3.5 sm:p-4 space-y-2 bg-white">
        <div class="flex items-center gap-2 flex-wrap">
          <span
            class="px-2 py-0.5 rounded text-xs font-bold font-mono bg-slate-100 border border-slate-200 text-slate-700">
            {{ order.id_order }}
          </span>
          <span
            class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
            :class="[
              sisaTagihan === 0
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                : totalTerbayar > 0
                  ? 'bg-amber-50 text-amber-700 border border-amber-300'
                  : 'bg-rose-50 text-rose-700 border border-rose-300'
            ]"
          >
            {{ sisaTagihan === 0 ? 'Lunas' : totalTerbayar > 0 ? 'DP Masuk' : 'Belum Bayar' }}
          </span>
        </div>
        <div>
          <h2 class="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug">
            {{ order.nama_penerbit }}
          </h2>
          <p class="text-xs text-slate-500 font-medium mt-0.5">
            Buku: <strong class="text-slate-800">{{ order.judul_buku || order.judul_penulis }}</strong>
          </p>
        </div>
      </div>

      <!-- Financial Metrics Tiles (Crisp 1px grid divider) -->
      <div class="grid grid-cols-3 bg-slate-200 gap-px border-t border-b border-slate-200 text-center">
        <div class="bg-white p-2.5">
          <p class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total Nilai</p>
          <p class="text-xs sm:text-sm font-bold font-mono text-slate-900 mt-0.5">
            {{ formatRupiah(order.total_harga) }}
          </p>
        </div>
        <div class="bg-white p-2.5">
          <p class="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">Sudah Masuk</p>
          <p class="text-xs sm:text-sm font-bold font-mono text-emerald-600 mt-0.5">
            {{ formatRupiah(totalTerbayar) }}
          </p>
        </div>
        <div class="bg-white p-2.5">
          <p class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Sisa Tagihan</p>
          <p
            class="text-xs sm:text-sm font-bold font-mono mt-0.5"
            :class="sisaTagihan === 0 ? 'text-emerald-600' : 'text-red-600'"
          >
            {{ formatRupiah(sisaTagihan) }}
          </p>
        </div>
      </div>

      <!-- Desktop Guidance Note -->
      <div class="hidden lg:block p-4 text-xs text-slate-500 leading-relaxed space-y-2">
        <p class="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Petunjuk Pembayaran</p>
        <ul class="list-disc list-inside space-y-1 text-slate-500 text-xs">
          <li>
            Pilih jenis pembayaran: <strong class="text-slate-700">Uang Muka (DP)</strong> atau
            <strong class="text-slate-700">Pelunasan</strong>.
          </li>
          <li>Gunakan pilihan cepat nominal (50%, 100%, sisa tagihan) untuk mengisi cepat.</li>
          <li>Pilih metode pembayaran (Saldo Deposit, Tunai, Bank, atau QRIS).</li>
          <li>
            <strong class="text-slate-700">Potong Deposit:</strong> Otomatis aktif jika penerbit memiliki
            saldo deposit dari Buku Kas.
          </li>
          <li>Unggah foto struk atau bukti transfer jika ada untuk verifikasi.</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatRupiah } from '@shared/utils/formatters'
import type { Order } from '@shared/types'

defineProps<{
  order: Order
  totalTerbayar: number
  sisaTagihan: number
}>()
</script>
