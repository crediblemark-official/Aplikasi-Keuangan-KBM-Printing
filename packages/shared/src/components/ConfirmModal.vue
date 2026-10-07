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
        class="confirm-modal-overlay fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
        @click.self="handleCancel"
      >
        <transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-3"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-3"
        >
          <div
            v-if="modelValue"
            class="confirm-modal-card w-full max-w-[420px] bg-white rounded-2xl shadow-2xl border border-slate-100/80 p-6 flex flex-col items-center relative text-center"
          >
            <!-- Close Button (Top Right) -->
            <button
              type="button"
              @click="handleCancel"
              class="confirm-modal-close-btn absolute top-3.5 right-3.5 w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex items-center justify-center cursor-pointer"
              title="Tutup"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <!-- Modern Icon Badge with Soft Glow -->
            <div
              class="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shrink-0 transition-transform"
              :class="{
                'bg-rose-50 text-rose-600 ring-6 ring-rose-50/60 border border-rose-200/80': type === 'danger',
                'bg-amber-50 text-amber-600 ring-6 ring-amber-50/60 border border-amber-200/80': type === 'warning',
                'bg-blue-50 text-blue-600 ring-6 ring-blue-50/60 border border-blue-200/80': type === 'info',
              }"
            >
              <!-- Danger Icon (Trash) -->
              <svg v-if="type === 'danger'" class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <!-- Warning Icon (Alert Triangle) -->
              <svg v-else-if="type === 'warning'" class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <!-- Info Icon -->
              <svg v-else class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <!-- Title -->
            <h3 class="text-lg font-bold text-slate-900 tracking-tight leading-snug mb-2">
              {{ title }}
            </h3>

            <!-- Message / Slot Content -->
            <div class="w-full text-slate-600 text-xs sm:text-sm leading-relaxed mb-4">
              <slot>
                {{ message }}
              </slot>
            </div>

            <!-- Optional Notice / Details Box (If provided as prop) -->
            <div
              v-if="detail"
              class="w-full text-left p-3 rounded-xl text-xs mb-4 flex items-start gap-2.5 transition-all"
              :class="{
                'bg-rose-50/80 text-rose-800 border border-rose-200/70': type === 'danger',
                'bg-amber-50/80 text-amber-800 border border-amber-200/70': type === 'warning',
                'bg-blue-50/80 text-blue-800 border border-blue-200/70': type === 'info',
              }"
            >
              <svg class="w-4 h-4 shrink-0 mt-0.5 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div class="leading-relaxed font-medium flex-1">{{ detail }}</div>
            </div>

            <!-- Actions Footer -->
            <div class="w-full grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                @click="handleCancel"
                :disabled="loading"
                class="btn-modal-cancel"
              >
                {{ cancelText }}
              </button>
              <button
                type="button"
                @click="handleConfirm"
                :disabled="loading"
                class="btn-modal-confirm"
                :class="type"
              >
                <svg v-if="loading" class="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
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

<style scoped>
.confirm-modal-card {
  box-shadow: 0 20px 40px -15px rgba(15, 23, 42, 0.2), 0 0 0 1px rgba(15, 23, 42, 0.05);
}

.btn-modal-cancel {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  height: 42px !important;
  padding: 0 16px !important;
  border-radius: 10px !important;
  font-size: 0.8125rem !important; /* 13px */
  font-weight: 600 !important;
  color: #475569 !important; /* slate-600 */
  background: #f8fafc !important; /* slate-50 */
  border: 1px solid #e2e8f0 !important; /* slate-200 */
  cursor: pointer !important;
  transition: all 0.15s ease !important;
}

.btn-modal-cancel:hover {
  background: #f1f5f9 !important; /* slate-100 */
  border-color: #cbd5e1 !important;
  color: #1e293b !important;
}

.btn-modal-cancel:active {
  transform: scale(0.98) !important;
}

.btn-modal-cancel:disabled {
  opacity: 0.5 !important;
  cursor: not-allowed !important;
}

.btn-modal-confirm {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;
  height: 42px !important;
  padding: 0 16px !important;
  border-radius: 10px !important;
  font-size: 0.8125rem !important; /* 13px */
  font-weight: 600 !important;
  color: #ffffff !important;
  border: none !important;
  cursor: pointer !important;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.btn-modal-confirm.danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3) !important;
}
.btn-modal-confirm.danger:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%) !important;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4) !important;
  transform: translateY(-1px) !important;
}

.btn-modal-confirm.warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
  box-shadow: 0 2px 8px rgba(217, 119, 6, 0.3) !important;
}
.btn-modal-confirm.warning:hover {
  background: linear-gradient(135deg, #d97706 0%, #b45309 100%) !important;
  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.4) !important;
  transform: translateY(-1px) !important;
}

.btn-modal-confirm.info {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3) !important;
}
.btn-modal-confirm.info:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) !important;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4) !important;
  transform: translateY(-1px) !important;
}

.btn-modal-confirm:active {
  transform: scale(0.98) !important;
}

.btn-modal-confirm:disabled {
  opacity: 0.6 !important;
  cursor: not-allowed !important;
  transform: none !important;
}
</style>
