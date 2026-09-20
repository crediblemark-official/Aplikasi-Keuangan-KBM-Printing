<template>
  <div class="filter-tabs-container flex items-center gap-1.5 flex-nowrap overflow-x-auto scrollbar-none py-1 max-w-full">
    <button
      v-for="tab in tabs"
      :key="String(getTabValue(tab))"
      type="button"
      @click="selectTab(getTabValue(tab))"
      class="filter-pill flex-shrink-0 gap-1.5 whitespace-nowrap"
      :class="[
        isActive(getTabValue(tab)) ? activeClass : '',
        tab.disabled ? 'opacity-50 cursor-not-allowed' : ''
      ]"
      :disabled="tab.disabled"
    >
      <span>{{ tab.label }}</span>
      <span
        v-if="tab.count !== undefined"
        class="px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none"
        :class="isActive(getTabValue(tab)) ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'"
      >
        {{ tab.count }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface FilterTabItem {
  label: string
  value?: string | number
  id?: string | number
  count?: number
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    modelValue: string | number
    tabs: FilterTabItem[]
    variant?: 'primary' | 'dark' | 'emerald'
  }>(),
  {
    variant: 'primary',
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
  (e: 'change', value: string | number): void
}>()

function getTabValue(tab: FilterTabItem): string | number {
  return tab.value !== undefined ? tab.value : (tab.id !== undefined ? tab.id : '')
}

function isActive(val: string | number) {
  return props.modelValue === val
}

const activeClass = computed(() => {
  if (props.variant === 'dark') return 'active-dark'
  if (props.variant === 'emerald') return 'active-emerald'
  return 'active'
})

function selectTab(val: string | number) {
  emit('update:modelValue', val)
  emit('change', val)
}
</script>
