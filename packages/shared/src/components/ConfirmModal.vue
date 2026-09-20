<template>
  <teleport to="body">
    <transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
        @click.self="handleCancel"
      >
        <transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-2"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-2"
        >
          <div
            v-if="modelValue"
            class="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden text-center p-6 flex flex-col items-center animate-in fade-in zoom-in-95 duration-200"
          >
            <!-- Icon Badge -->
            <div
              class="w-14 h-14 rounded-2xl flex items-center justify-center mb-3.5 shrink-0 shadow-xs"
              :class="{
                'bg-rose-50 text-rose-600 border border-rose-200/80': type === 'danger',
                'bg-amber-50 text-amber-600 border border-amber-200/80': type === 'warning',
                'bg-blue-50 text-blue-600 border border-blue-200/80': type === 'info',
              }"
            >
              <svg v-if="type === 'danger'" class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <svg v-else-if="type === 'warning'" class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <svg v-else class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <!-- Title -->
            <h3 class="text-base sm:text-lg font-bold text-slate-900 mb-1.5 leading-snug">
              {{ title }}
            </h3>

            <!-- Message / Content -->
            <div class="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed max-w-sm">
              <slot>
                {{ message }}
              </slot>
            </div>

            <!-- Optional Notice / Details Box -->
            <div
              v-if="detail"
              class="w-full text-left p-3 rounded-xl text-xs mb-5 flex items-start gap-2.5 transition-all"
              :class="{
                'bg-rose-50/90 text-rose-700 border border-rose-200/80': type === 'danger',
                'bg-amber-50/90 text-amber-800 border border-amber-200/80': type === 'warning',
                'bg-blue-50/90 text-blue-700 border border-blue-200/80': type === 'info',
              }"
            >
              <svg class="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div class="leading-relaxed font-medium flex-1">{{ detail }}</div>
            </div>

            <!-- Actions Footer -->
            <div class="w-full flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                @click="handleCancel"
                :disabled="loading"
                class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 font-semibold text-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
              >
                {{ cancelText }}
              </button>
              <button
                type="button"
                @click="handleConfirm"
                :disabled="loading"
                class="flex-1 px-4 py-2.5 rounded-xl font-semibold text-xs text-white shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                :class="{
                  'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-rose-200': type === 'danger',
                  'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 shadow-amber-200': type === 'warning',
                  'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-blue-200': type === 'info',
                }"
              >
                <svg v-if="loading" class="animate-spin w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>{{ loading ? 'Memproses...' : confirmText }}</span>
              </button>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    message?: string
    detail?: string
    confirmText?: string
    cancelText?: string
    type?: 'danger' | 'warning' | 'info'
    loading?: boolean
  }>(),
  {
    message: '',
    detail: '',
    confirmText: 'Ya, Lanjutkan',
    cancelText: 'Batal',
    type: 'danger',
    loading: false,
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

function handleCancel() {
  emit('update:modelValue', false)
  emit('cancel')
}

function handleConfirm() {
  emit('confirm')
}
</script>
