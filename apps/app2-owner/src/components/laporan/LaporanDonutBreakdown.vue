<template>
  <div class="grid grid-cols-1 lg:grid-cols-12 border-b border-slate-200">
    <!-- Kolom Kiri: Komposisi Pengeluaran Kas per Kategori -->
    <div class="lg:col-span-6 px-[8px] py-4 sm:px-[15px] sm:py-5 lg:px-[20px] border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-slate-900 font-bold text-sm sm:text-base tracking-tight">Komposisi Pengeluaran Kas</h3>
            <p class="text-xs text-slate-500 font-medium">Alokasi biaya berdasarkan kategori pengeluaran</p>
          </div>
          <span class="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200/60">
            Total: {{ formatRupiah(totalKeluar) }}
          </span>
        </div>

        <!-- Donut Chart -->
        <div class="h-44 sm:h-48 flex items-center justify-center my-2">
          <canvas v-show="totalKeluar > 0" ref="kategoriCanvasRef"></canvas>
          <div v-if="totalKeluar === 0" class="text-center text-slate-400 text-xs py-10">
            Belum ada data pengeluaran kas pada periode ini
          </div>
        </div>

        <!-- Category Breakdown Progress Bars -->
        <div class="space-y-2.5 mt-4 pt-4 border-t border-slate-100">
          <div v-for="item in kategoriBreakdown" :key="item.kategori" class="space-y-1">
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: item.color }"></span>
                <span class="font-semibold text-slate-800">{{ item.label }}</span>
              </div>
              <div class="flex items-center gap-2 font-mono">
                <span class="font-bold text-slate-700">{{ formatRupiah(item.nominal) }}</span>
                <span class="text-slate-400 text-[11px] w-11 text-right">({{ item.percentage }}%)</span>
              </div>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div class="h-1.5 rounded-full transition-all duration-500" :style="{ width: `${item.percentage}%`, backgroundColor: item.color }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Kolom Kanan: Distribusi Pemasukan Kas per Sumber -->
    <div class="lg:col-span-6 px-[8px] py-4 sm:px-[15px] sm:py-5 lg:px-[20px] flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-slate-900 font-bold text-sm sm:text-base tracking-tight">Distribusi Pemasukan per Sumber Kas</h3>
            <p class="text-xs text-slate-500 font-medium">Proporsi penerimaan Tunai, Bank, dan QRIS</p>
          </div>
          <span class="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/60">
            Total: {{ formatRupiah(totalMasuk) }}
          </span>
        </div>

        <!-- Donut Chart -->
        <div class="h-44 sm:h-48 flex items-center justify-center my-2">
          <canvas v-show="totalMasuk > 0" ref="sumberCanvasRef"></canvas>
          <div v-if="totalMasuk === 0" class="text-center text-slate-400 text-xs py-10">
            Belum ada data pemasukan kas verified pada periode ini
          </div>
        </div>

        <!-- Source Breakdown Progress Bars -->
        <div class="space-y-2.5 mt-4 pt-4 border-t border-slate-100">
          <div v-for="item in sumberBreakdown" :key="item.sumber" class="space-y-1">
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: item.color }"></span>
                <span class="font-semibold text-slate-800">{{ item.label }}</span>
              </div>
              <div class="flex items-center gap-2 font-mono">
                <span class="font-bold text-slate-700">{{ formatRupiah(item.nominal) }}</span>
                <span class="text-slate-400 text-[11px] w-11 text-right">({{ item.percentage }}%)</span>
              </div>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div class="h-1.5 rounded-full transition-all duration-500" :style="{ width: `${item.percentage}%`, backgroundColor: item.color }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { formatRupiah } from '@shared/utils/formatters'

defineProps<{
  totalKeluar: number
  totalMasuk: number
  kategoriBreakdown: Array<{
    kategori: string
    label: string
    nominal: number
    color: string
    percentage: string
  }>
  sumberBreakdown: Array<{
    sumber: string
    label: string
    nominal: number
    color: string
    percentage: string
  }>
}>()

const kategoriCanvasRef = ref<HTMLCanvasElement>()
const sumberCanvasRef = ref<HTMLCanvasElement>()

defineExpose({
  kategoriCanvasRef,
  sumberCanvasRef,
})
</script>
