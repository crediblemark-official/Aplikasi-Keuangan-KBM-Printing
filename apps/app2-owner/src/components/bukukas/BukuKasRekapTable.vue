<template>
  <div class="border-b border-slate-200 bg-white">
    <div
      class="px-[8px] sm:px-[15px] lg:px-[20px] py-2.5 border-b border-slate-100 bg-slate-50/40 flex items-center justify-between"
    >
      <h3 class="text-slate-900 font-bold text-xs sm:text-sm">Rekapitulasi Saldo Kas per Akun</h3>
      <span class="text-[11px] font-semibold text-slate-500 font-mono">
        Periode: {{ periodeLabel }}
      </span>
    </div>
    <TableScrollWrapper>
      <table class="data-table w-full min-w-[500px]">
        <thead>
          <tr class="whitespace-nowrap">
            <th>Akun / Sumber Kas</th>
            <th class="text-right">Total Masuk (Debit)</th>
            <th class="text-right">Total Keluar (Kredit)</th>
            <th class="text-right">Saldo Bersih</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="sumber in items" :key="sumber.label">
            <td class="font-medium text-slate-900">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full" :class="sumber.dotColor"></span>
                <span>{{ sumber.label }}</span>
              </div>
            </td>
            <td class="text-right font-semibold text-emerald-600">{{ formatRupiah(sumber.masuk) }}</td>
            <td class="text-right font-semibold text-rose-600">{{ formatRupiah(sumber.keluar) }}</td>
            <td class="text-right font-extrabold" :class="sumber.saldo >= 0 ? 'text-emerald-600' : 'text-rose-600'">
              {{ formatRupiah(Math.abs(sumber.saldo)) }}
              <span class="text-xs ml-0.5">{{ sumber.saldo >= 0 ? '(+)' : '(-)' }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </TableScrollWrapper>
  </div>
</template>

<script setup lang="ts">
import TableScrollWrapper from '@shared/components/TableScrollWrapper.vue'
import { formatRupiah } from '@shared/utils/formatters'

defineProps<{
  items: Array<{
    label: string
    dotColor: string
    masuk: number
    keluar: number
    saldo: number
  }>
  periodeLabel: string
}>()
</script>
