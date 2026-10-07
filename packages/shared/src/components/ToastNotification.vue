<template>
  <transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 translate-y-2.5 scale-95"
    enter-to-class="opacity-100 translate-y-0 scale-100"
    leave-active-class="transition-all duration-300 ease-in"
    leave-from-class="opacity-100 translate-y-0 scale-100"
    leave-to-class="opacity-0 translate-y-2.5 scale-95"
  >
    <div
      v-if="message"
      class="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-[10000] px-5 py-3 rounded-xl text-sm font-semibold shadow-xl flex items-center gap-2.5 max-w-[90vw] pointer-events-auto select-none"
      :class="type === 'error' ? 'bg-rose-600 text-white shadow-rose-600/30' : 'bg-emerald-600 text-white shadow-emerald-600/30'"
      role="alert"
    >
      <!-- Success Icon -->
      <svg
        v-if="type === 'success'"
        class="w-4 h-4 text-emerald-100 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
      <!-- Error Icon -->
      <svg
        v-else-if="type === 'error'"
        class="w-4 h-4 text-rose-100 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>

      <span class="truncate">{{ message }}</span>

      <!-- Close button (optional) -->
      <button
        type="button"
        @click="$emit('close')"
        class="ml-1 text-white/80 hover:text-white transition-opacity cursor-pointer"
        title="Tutup Notifikasi"
      >
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </transition>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    message: string
    type?: 'success' | 'error' | 'info'
  }>(),
  {
    type: 'success',
  },
)

defineEmits<{
  (e: 'close'): void
}>()
</script>
