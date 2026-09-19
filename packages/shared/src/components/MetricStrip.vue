<template>
  <div
    class="metric-strip flex items-stretch overflow-x-auto scrollbar-none border-b border-slate-200 bg-white divide-x divide-slate-200"
    :class="containerClass"
  >
    <div
      v-for="(item, idx) in items"
      :key="item.label"
      class="flex-shrink-0 sm:min-w-0 sm:flex-1 py-2.5 px-3 sm:py-3 sm:px-[15px] lg:px-[20px] text-center hover:bg-slate-50/50 transition-colors"
      :class="[
        idx === 0 ? 'pl-[8px]' : '',
        idx === items.length - 1 ? 'pr-[8px]' : '',
        item.minWidth || 'min-w-[130px]'
      ]"
    >
      <p class="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 whitespace-nowrap">
        {{ item.label }}
      </p>
      <p
        class="text-sm sm:text-base font-extrabold leading-tight font-mono whitespace-nowrap"
        :class="item.valueClass || 'text-slate-900'"
      >
        {{ item.value }}
        <span v-if="item.unit" class="text-xs font-semibold text-slate-400 ml-1 font-sans">
          {{ item.unit }}
        </span>
      </p>
      <p
        v-if="item.sub"
        class="text-[10px] sm:text-[11px] mt-0.5 font-semibold whitespace-nowrap flex items-center justify-center gap-1.5"
        :class="item.subClass || 'text-slate-400'"
      >
        <span
          v-if="item.subDot"
          class="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0"
          :class="item.subDot"
        ></span>
        {{ item.sub }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface MetricItem {
  label: string
  value: string | number
  unit?: string
  valueClass?: string
  sub?: string
  subClass?: string
  subDot?: string
  minWidth?: string
}

defineProps<{
  items: MetricItem[]
  containerClass?: string
}>()
</script>
