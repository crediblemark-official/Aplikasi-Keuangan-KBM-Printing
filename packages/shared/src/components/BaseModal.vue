<template>
  <teleport to="body">
    <transition name="sheet">
      <div v-if="modelValue" class="sheet-overlay" @click.self="handleClose">
        <div class="bottom-sheet" :class="maxWidth">
          <!-- Drag Handle -->
          <div class="bottom-sheet-handle"></div>

          <!-- Header -->
          <div class="bottom-sheet-header">
            <div>
              <h3 class="text-slate-900 font-bold text-base leading-tight">{{ title }}</h3>
              <p v-if="subtitle" class="text-xs text-slate-500 mt-0.5">{{ subtitle }}</p>
            </div>
            <div class="flex items-center gap-2">
              <slot name="header-actions" />
              <button
                v-if="showClose"
                type="button"
                @click="handleClose"
                class="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center text-sm transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          <!-- Body -->
          <div class="bottom-sheet-body">
            <slot />
          </div>

          <!-- Optional Footer -->
          <div v-if="$slots.footer" class="px-5 pb-5 pt-2 border-t border-slate-100">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    subtitle?: string
    maxWidth?: string
    showClose?: boolean
  }>(),
  {
    subtitle: '',
    maxWidth: 'max-w-xl',
    showClose: true,
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
}>()

function handleClose() {
  emit('update:modelValue', false)
  emit('close')
}
</script>
