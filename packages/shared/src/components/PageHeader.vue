<template>
  <header class="app-header h-14 w-full flex items-center justify-between px-[8px] sm:px-[15px] lg:px-[20px] bg-white border-b border-slate-200">
    <!-- Left side: Leading / Back + Title -->
    <div class="flex items-center gap-2 sm:gap-2.5 min-w-0">
      <slot name="leading">
        <button
          v-if="showBack"
          type="button"
          @click="onBack"
          class="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 flex items-center justify-center transition-all active:scale-95 cursor-pointer border border-slate-200 shrink-0"
          :title="backLabel ? `Kembali ke ${backLabel}` : 'Kembali'"
          aria-label="Kembali"
        >
          <svg class="w-4 h-4 text-slate-700 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <!-- Mobile KBM brand logo when on root pages -->
        <div v-else-if="showLogo" class="lg:hidden flex-shrink-0 flex items-center">
          <KbmLogo size="sm" variant="icon" />
        </div>
      </slot>

      <slot name="title">
        <div class="min-w-0">
          <h1 class="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-none truncate">
            {{ title }}
          </h1>
          <p v-if="subtitle" class="text-[11px] text-slate-400 font-normal truncate mt-0.5 leading-none">
            {{ subtitle }}
          </p>
        </div>
      </slot>
    </div>

    <!-- Right side: Actions slot -->
    <div v-if="$slots.actions" class="flex items-center gap-2 flex-shrink-0">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup lang="ts">
import KbmLogo from './KbmLogo.vue'

const props = withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    showBack?: boolean
    backLabel?: string
    showLogo?: boolean
  }>(),
  {
    title: '',
    subtitle: '',
    showBack: false,
    backLabel: '',
    showLogo: true,
  }
)

const emit = defineEmits<{
  (e: 'back'): void
}>()

function onBack() {
  emit('back')
}
</script>
