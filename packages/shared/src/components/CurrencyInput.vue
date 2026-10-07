<template>
  <div class="relative w-full">
    <span
      v-if="prefix"
      class="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 select-none pointer-events-none"
    >
      {{ prefix }}
    </span>
    <input
      :id="id"
      type="text"
      inputmode="numeric"
      :value="formattedValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :class="[
        'form-input w-full font-mono font-bold bg-white transition-all',
        prefix ? 'pl-8' : '',
        inputClass,
      ]"
      @input="handleInput"
      @blur="$emit('blur', $event)"
      @focus="$emit('focus', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: number | null | undefined
    placeholder?: string
    disabled?: boolean
    required?: boolean
    prefix?: string
    inputClass?: string
    id?: string
  }>(),
  {
    placeholder: '0',
    disabled: false,
    required: false,
    prefix: '',
    inputClass: '',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: number): void
  (e: 'blur', event: FocusEvent): void
  (e: 'focus', event: FocusEvent): void
}>()

const formattedValue = computed(() => {
  if (props.modelValue === null || props.modelValue === undefined || props.modelValue === 0) {
    return ''
  }
  return Number(props.modelValue).toLocaleString('id-ID')
})

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  const raw = target.value.replace(/\D/g, '')
  const num = raw ? parseInt(raw, 10) : 0
  emit('update:modelValue', num)
  target.value = num ? num.toLocaleString('id-ID') : ''
}
</script>
