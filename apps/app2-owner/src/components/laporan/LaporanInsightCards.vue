<template>
  <div class="p-[8px] py-4 sm:p-[15px] sm:py-5 lg:p-[20px] bg-slate-50/50">
    <div class="flex md:grid md:grid-cols-3 gap-3.5 overflow-x-auto scrollbar-none snap-x snap-mandatory py-0.5">

      <!-- Card 1: Rasio DP vs Pelunasan -->
      <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs w-[82vw] sm:w-[320px] md:w-auto max-w-[340px] md:max-w-none shrink-0 snap-start flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-slate-600">Struktur Pembayaran</span>
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono">Masuk</span>
          </div>
          <div class="space-y-2">
            <div>
              <div class="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Pelunasan</span>
                <span class="font-mono text-emerald-600">{{ formatRupiah(jenisBreakdown.pelunasan) }}</span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div class="bg-emerald-500 h-2 rounded-full" :style="{ width: `${jenisBreakdown.pelunasanPct}%` }"></div>
              </div>
            </div>
            <div>
              <div class="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Uang Muka (DP)</span>
                <span class="font-mono text-blue-600">{{ formatRupiah(jenisBreakdown.dp) }}</span>
              </div>
              <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div class="bg-blue-500 h-2 rounded-full" :style="{ width: `${jenisBreakdown.dpPct}%` }"></div>
              </div>
            </div>
          </div>
        </div>
        <p class="text-[11px] text-slate-400 mt-3 pt-2.5 border-t border-slate-100">
          {{ jenisBreakdown.pelunasanPct }}% kas masuk berasal dari pelunasan final pesanan.
        </p>
      </div>

      <!-- Card 2: Pengeluaran Terbesar -->
      <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs w-[82vw] sm:w-[320px] md:w-auto max-w-[340px] md:max-w-none shrink-0 snap-start flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-slate-600">Beban Terbesar</span>
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 font-mono">Top Cost</span>
          </div>
          <div class="mt-1">
            <h4 class="text-base font-bold text-slate-900">{{ topCategory.label }}</h4>
            <p class="text-xl font-black font-mono text-rose-600 mt-0.5">{{ formatRupiah(topCategory.nominal) }}</p>
            <p class="text-[11px] text-slate-500 font-medium mt-1">
              Menyerap <span class="font-bold text-slate-800">{{ topCategory.percentage }}%</span> dari total pengeluaran bulan ini.
            </p>
          </div>
        </div>
        <p class="text-[11px] text-slate-400 mt-3 pt-2.5 border-t border-slate-100">
          Pastikan efisiensi dan pencatatan stok terjaga.
        </p>
      </div>

      <!-- Card 3: Status Efisiensi & Cashflow -->
      <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs w-[82vw] sm:w-[320px] md:w-auto max-w-[340px] md:max-w-none shrink-0 snap-start flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-slate-600">Kesehatan Arus Kas</span>
            <span
              class="text-[10px] font-bold px-1.5 py-0.5 rounded-md font-mono"
              :class="labaBersih >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'"
            >
              {{ labaBersih >= 0 ? 'SURPLUS' : 'DEFISIT' }}
            </span>
          </div>
          <div class="mt-1">
            <h4 class="text-base font-bold" :class="labaBersih >= 0 ? 'text-emerald-700' : 'text-rose-700'">
              {{ labaBersih >= 0 ? 'Cash Flow Sehat' : 'Defisit Terdeteksi' }}
            </h4>
            <p class="text-xl font-black font-mono mt-0.5" :class="labaBersih >= 0 ? 'text-emerald-600' : 'text-rose-600'">
              {{ formatRupiah(Math.abs(labaBersih)) }}
            </p>
            <p class="text-[11px] text-slate-500 font-medium mt-1">
              Margin laba bersih tercatat sebesar <span class="font-bold text-slate-800">{{ profitMargin }}%</span>.
            </p>
          </div>
        </div>
        <p class="text-[11px] text-slate-400 mt-3 pt-2.5 border-t border-slate-100">
          Dihitung dari total masuk verified dikurangi kas keluar.
        </p>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { formatRupiah } from '@shared/utils/formatters'

defineProps<{
  jenisBreakdown: {
    dp: number
    pelunasan: number
    dpPct: number
    pelunasanPct: number
  }
  topCategory: {
    label: string
    nominal: number
    percentage: string
  }
  labaBersih: number
  profitMargin: string
}>()
</script>
