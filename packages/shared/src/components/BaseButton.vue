<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center font-semibold transition-all active:scale-[0.98] select-none cursor-pointer"
    :class="[
      variantClasses,
      sizeClasses,
      disabled || loading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
    ]"
  >
    <svg
      v-if="loading"
      class="animate-spin -ml-0.5 mr-1.5 h-3.5 w-3.5 text-current"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <slot name="icon" v-else-if="$slots.icon" />
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'danger'
    size?: 'xs' | 'sm' | 'md' | 'lg'
    loading?: boolean
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
  }>(),
  {
    variant: 'primary',
    size: 'sm',
    loading: false,
    disabled: false,
    type: 'button',
  }
)

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'secondary':
      return 'btn-secondary'
    case 'danger':
      return 'btn-danger'
    case 'primary':
    default:
      return 'btn-primary'
  }
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'text-[11px] px-2.5 py-1 rounded-md gap-1'
    case 'md':
      return 'text-sm px-4 py-2 rounded-xl gap-2'
    case 'lg':
      return 'text-base px-5 py-2.5 rounded-xl gap-2.5'
    case 'sm':
    default:
      return 'text-xs px-3.5 py-1.5 rounded-lg gap-1.5'
  }
})
</script>
