<template>
  <div class="px-[8px] py-4 sm:px-[15px] sm:py-5 lg:px-[20px] border-b border-slate-200 bg-white">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
      <div>
        <h3 class="text-slate-900 font-bold text-sm sm:text-base tracking-tight">Tren Arus Kas & Margin Keuntungan</h3>
        <p class="text-xs text-slate-500 font-medium">Perbandingan pergerakan Kas Masuk, Kas Keluar, dan Laba Bersih bulanan</p>
      </div>
      <div class="flex items-center gap-3.5 text-xs font-semibold flex-wrap">
        <span class="flex items-center gap-1.5 text-slate-700">
          <span class="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block"></span>Kas Masuk
        </span>
        <span class="flex items-center gap-1.5 text-slate-700">
          <span class="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block"></span>Kas Keluar
        </span>
        <span class="flex items-center gap-1.5 text-slate-700">
          <span class="w-3 h-0.5 bg-indigo-600 inline-block"></span>Laba Bersih
        </span>
      </div>
    </div>
    <div class="h-64 sm:h-72 w-full">
      <canvas ref="canvasRef"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement>()

defineExpose({
  canvasRef,
})
</script>
