<template>
  <Teleport to="body">
    <transition name="fade-lock">
      <div v-if="modelValue" class="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 select-none">
        
        <!-- Decorative Glow -->
        <div class="absolute inset-0 overflow-hidden pointer-events-none">
          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/15 rounded-full blur-3xl pointer-events-none"></div>
        </div>

        <!-- Lock Card -->
        <div class="relative w-full max-w-sm bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col items-center text-center animate-card">
          
          <!-- Brand / Logo -->
          <div class="mb-4">
            <KbmLogo size="md" variant="stacked" :subtitle="roleTitle || 'Sistem Percetakan Terproteksi'" />
          </div>

          <!-- Security Graphic with Pulsing Wave -->
          <div class="relative my-4 flex items-center justify-center">
            <!-- Pulsing Rings when waiting -->
            <div v-if="isPrompting" class="absolute w-24 h-24 rounded-full bg-red-500/20 animate-ping"></div>
            <div class="w-20 h-20 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-red-500/30 transition-transform active:scale-95 cursor-pointer"
                 @click="handleUnlock">
              <!-- Security Lock / Device Key Icon -->
              <svg class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" 
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>

          <!-- Title & Instructions -->
          <h2 class="text-slate-900 font-extrabold text-lg tracking-tight mb-1">
            Kunci Layar Android
          </h2>
          <p class="text-slate-500 text-xs leading-relaxed max-w-[260px] mb-5">
            Gunakan PIN, pola, atau sidik jari bawaan HP Anda untuk membuka aplikasi
          </p>

          <!-- Error Feedback -->
          <div v-if="errorMessage" class="w-full mb-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center justify-center gap-1.5 animate-shake">
            <svg class="w-4 h-4 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Primary Trigger Button -->
          <button type="button"
                  @click="handleUnlock"
                  :disabled="isPrompting"
                  class="w-full h-12 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-sm shadow-md shadow-red-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer">
            <span v-if="isPrompting" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
            <span>{{ isPrompting ? 'Menunggu Kunci Layar...' : 'Buka Kunci Layar Android' }}</span>
          </button>

          <!-- Footer version notice -->
          <p class="text-slate-400 text-[10px] mt-5">
            Proteksi Kunci Layar Bawaan Android &middot; KBM System
          </p>
        </div>

      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import KbmLogo from './KbmLogo.vue'
import { promptAndroidDeviceLock, checkDeviceLockRequirement } from '../utils/deviceLock'

const props = defineProps<{
  modelValue: boolean
  roleTitle?: string
  title?: string
  description?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'unlocked'): void
}>()

const isPrompting = ref(false)
const errorMessage = ref('')

async function handleUnlock() {
  if (isPrompting.value) return
  isPrompting.value = true
  errorMessage.value = ''

  try {
    const res = await promptAndroidDeviceLock({
      title: props.title || 'KBM Percetakan',
      description: props.description || 'Gunakan PIN, Pola, atau Sidik Jari untuk membuka aplikasi',
    })

    if (res.success) {
      emit('update:modelValue', false)
      emit('unlocked')
    } else {
      errorMessage.value = res.error || 'Verifikasi kunci layar dibatalkan'
    }
  } catch (err: any) {
    errorMessage.value = err?.message || 'Gagal mengakses kunci layar'
  } finally {
    isPrompting.value = false
  }
}

onMounted(async () => {
  // Cek apakah HP user memiliki kunci layar aktif
  const { shouldLock } = await checkDeviceLockRequirement()
  
  // Jika user TIDAK mengaktifkan kunci layar di Android (atau di web browser), langsung buka tanpa kunci
  if (!shouldLock) {
    emit('update:modelValue', false)
    emit('unlocked')
    return
  }

  // Jika HP memiliki kunci layar dan sedang terkunci, otomatis munculkan prompt kunci bawaan Android
  if (props.modelValue) {
    setTimeout(() => {
      if (props.modelValue) {
        handleUnlock()
      }
    }, 200)
  }
})
</script>

<style scoped>
.fade-lock-enter-active,
.fade-lock-leave-active {
  transition: opacity 0.25s ease;
}

.fade-lock-enter-from,
.fade-lock-leave-to {
  opacity: 0;
}

@keyframes cardPop {
  0% {
    opacity: 0;
    transform: scale(0.92) translateY(12px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.animate-card {
  animation: cardPop 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-6px); }
  40%, 80% { transform: translateX(6px); }
}

.animate-shake {
  animation: shake 0.4s ease-in-out;
}
</style>
