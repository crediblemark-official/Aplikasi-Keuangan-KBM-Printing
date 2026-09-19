<template>
  <div class="relative flex items-center w-full">
    <span class="absolute left-2.5 pointer-events-none text-slate-400">
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </span>
    <input
      :value="modelValue"
      @input="handleInput"
      :placeholder="placeholder"
      class="w-full pl-8.5 pr-3 py-1.5 text-xs text-slate-800 bg-slate-50/50 hover:bg-slate-50/80 border border-slate-200 rounded-lg focus:outline-none focus:border-red-500 focus:bg-white transition-colors"
      :class="inputClass"
    />
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    inputClass?: string
  }>(),
  {
    placeholder: 'Cari...',
    inputClass: '',
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
  (e: 'input', val: string): void
}>()

function handleInput(event: Event) {
  const val = (event.target as HTMLInputElement).value
  emit('update:modelValue', val)
  emit('input', val)
}
</script>
