<template>
  <div>
    <!-- Floating Action Button (FAB) di Pojok Kanan Bawah (Dinaikkan di mobile agar tidak menutupi bottom navigation) -->
    <button
      @click="isOpen = true"
      type="button"
      class="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] right-4 lg:bottom-6 lg:right-6 z-40 group flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-red-600 text-white font-bold text-xs shadow-lg shadow-purple-600/30 hover:shadow-xl hover:shadow-purple-600/40 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border border-white/20 select-none"
      title="Buka AI Advisor"
    >
      <div class="relative flex items-center justify-center">
        <span class="absolute inline-flex h-full w-full rounded-full bg-white opacity-40 animate-ping"></span>
        <svg class="w-4 h-4 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <span class="tracking-wide">AI Advisor</span>
    </button>

    <!-- Modal Dialog AI Advisor -->
    <Teleport to="body">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[60] flex items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200 animate-fade-in"
      >
        <div
          class="relative w-full h-[100dvh] sm:h-[85vh] sm:max-w-2xl bg-white rounded-none sm:rounded-2xl shadow-2xl flex flex-col border-0 sm:border border-slate-200 overflow-hidden"
        >
          <!-- Header Modal (Single Sleek Bar) -->
          <div
            class="px-3.5 py-2.5 sm:py-2 bg-slate-950 text-white shrink-0 border-b border-white/10 flex items-center justify-between gap-3"
            style="padding-top: max(env(safe-area-inset-top, 0px), 10px);"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 class="font-bold text-xs sm:text-sm text-white shrink-0 tracking-tight">AI Advisor</h3>
              <div class="h-3.5 w-px bg-white/20 shrink-0"></div>
              <select
                v-model="selectedModel"
                class="bg-slate-900 text-purple-200 border border-purple-500/30 hover:border-purple-400/60 rounded-md px-2 py-0.5 text-[11px] font-medium outline-none cursor-pointer max-w-[210px] sm:max-w-[260px] truncate"
              >
                <optgroup label="Google Gemini">
                  <option v-for="m in geminiModels" :key="m.id" :value="m.id">
                    {{ m.name }}
                  </option>
                </optgroup>
                <optgroup label="Ollama Cloud">
                  <option v-for="m in ollamaModels" :key="m.id" :value="m.id">
                    {{ m.name }}
                  </option>
                </optgroup>
              </select>
            </div>

            <div class="flex items-center gap-1 shrink-0">
              <button
                @click="clearChat"
                type="button"
                class="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                title="Bersihkan percakapan"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button
                @click="isOpen = false"
                type="button"
                class="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                title="Tutup AI Advisor"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Quick Insight Chips (Compact Strip) -->
          <div class="px-3 py-1.5 bg-slate-50 border-b border-slate-200 overflow-x-auto shrink-0 flex items-center gap-1.5 no-scrollbar">
            <button
              v-for="chip in quickChips"
              :key="chip.label"
              @click="askQuickQuestion(chip.prompt)"
              type="button"
              class="shrink-0 px-2 py-0.5 text-[11px] font-medium rounded-md bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 text-slate-600 transition-all cursor-pointer shadow-2xs inline-flex items-center gap-1"
            >
              <span class="text-xs">{{ chip.icon }}</span>
              <span>{{ chip.label }}</span>
            </button>
          </div>

          <!-- Chat Conversation Body -->
          <div ref="chatContainer" class="flex-1 p-3.5 overflow-y-auto space-y-3.5 bg-slate-50/50">
            <!-- Pesan Chat -->
            <div
              v-for="(msg, idx) in messages"
              :key="idx"
              class="flex flex-col gap-1"
              :class="msg.role === 'user' ? 'items-end' : 'items-start'"
            >
              <div class="flex items-center gap-1.5 text-[11px] text-slate-400 px-1 font-medium">
                <span v-if="msg.role === 'assistant'" class="font-semibold text-slate-600">KBM AI Advisor</span>
                <span v-else class="font-semibold text-slate-600">Anda</span>
                <span v-if="msg.model" class="text-slate-400 font-mono text-[10px]">
                  ({{ msg.model }})
                </span>
                <span>•</span>
                <span>{{ msg.time }}</span>
              </div>

              <div
                class="max-w-[92%] sm:max-w-[85%] rounded-2xl px-4 py-2.5 shadow-2xs text-[13.5px] leading-relaxed"
                :class="msg.role === 'user'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white font-medium rounded-tr-xs'
                  : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs'"
              >
                <!-- Render Jawaban Markdown-Friendly -->
                <div v-if="msg.role === 'assistant'" class="prose-ai" v-html="formatMarkdown(msg.content)"></div>
                <div v-else class="whitespace-pre-wrap leading-relaxed">{{ msg.content }}</div>
              </div>
            </div>

            <!-- Loading Indicator saat memproses -->
            <div v-if="isLoading" class="flex items-start gap-2 animate-pulse">
              <div class="w-6 h-6 rounded-md bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 text-xs font-bold">
                AI
              </div>
              <div class="bg-white border border-slate-200 rounded-2xl rounded-tl-xs px-3.5 py-2 text-xs text-slate-600 shadow-2xs flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-purple-600 animate-ping"></span>
                <span>Menganalisis data finansial KBM Printing...</span>
              </div>
            </div>
          </div>

          <!-- Footer Chat Input -->
          <div
            class="p-2.5 sm:p-3 bg-white border-t border-slate-200 shrink-0"
            style="padding-bottom: max(env(safe-area-inset-bottom, 0px), 10px);"
          >
            <form @submit.prevent="sendMessage" class="flex items-center gap-2">
              <input
                ref="inputRef"
                v-model="inputQuery"
                type="text"
                placeholder="Tanyakan analisis finansial atau piutang..."
                class="form-input flex-1 bg-slate-50 text-xs sm:text-[13px] py-2 px-3 rounded-xl border-slate-300 focus:bg-white transition-all outline-none"
                :disabled="isLoading"
              />
              <button
                type="submit"
                class="h-8.5 px-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-red-600 hover:from-indigo-700 hover:to-red-700 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                :disabled="isLoading || !inputQuery.trim()"
              >
                <span>Kirim</span>
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { useFinanceStore } from '../stores/finance'
import { api } from '@shared/api/gasClient'
import {
  geminiModels,
  ollamaModels,
  quickChips,
  formatMarkdown,
  buildLiveSystemPrompt,
  generateLocalFallback,
} from '../composables/useAiAdvisor'

const financeStore = useFinanceStore()

const isOpen = ref(false)
const isLoading = ref(false)
const inputQuery = ref('')
const chatContainer = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)

const selectedModel = ref(localStorage.getItem('kbm_ai_model') || 'auto')

watch(selectedModel, (val) => {
  localStorage.setItem('kbm_ai_model', val)
})

const isGeminiActive = computed(() => {
  return (
    selectedModel.value === 'auto' ||
    selectedModel.value.startsWith('gemini') ||
    selectedModel.value.startsWith('gemma-4')
  )
})

const currentProviderLabel = computed(() => {
  if (selectedModel.value === 'auto') return 'Gemini Auto'
  if (isGeminiActive.value) return 'Gemini'
  return 'Ollama Cloud'
})

const selectedModelLabel = computed(() => {
  const all = [...geminiModels, ...ollamaModels]
  const found = all.find((m) => m.id === selectedModel.value)
  return found ? found.name : selectedModel.value
})

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  time: string
  model?: string
  rotated?: boolean
}

function getNowTime() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const messages = ref<ChatMessage[]>([
  {
    role: 'assistant',
    content: `Halo Pak/Bu! Saya siap menganalisis data finansial, ringkasan omzet, piutang mitra, dan biaya operasional KBM Printing.

Silakan pilih topik di atas atau ketik pertanyaan analisis Anda.`,
    time: getNowTime(),
  },
])

function clearChat() {
  messages.value = [
    {
      role: 'assistant',
      content: `Percakapan telah dibersihkan. Silakan ajukan pertanyaan analisis baru.`,
      time: getNowTime(),
    },
  ]
}

function scrollToBottom() {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}

watch(isOpen, async (open) => {
  if (open) {
    scrollToBottom()
    nextTick(() => inputRef.value?.focus())
    // Pastikan data store segar jika belum dimuat
    if (!financeStore.ordersList.length) {
      financeStore.loadFinanceData()
    }
  }
})

function askQuickQuestion(promptText: string) {
  inputQuery.value = promptText
  sendMessage()
}

async function sendMessage() {
  const query = inputQuery.value.trim()
  if (!query || isLoading.value) return

  messages.value.push({
    role: 'user',
    content: query,
    time: getNowTime(),
  })
  inputQuery.value = ''
  scrollToBottom()

  isLoading.value = true

  try {
    const systemPrompt = buildLiveSystemPrompt(financeStore)

    // Ambil histori percakapan maksimal 6 pesan terakhir untuk menghemat token
    const conversationHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
      { role: 'system', content: systemPrompt },
    ]

    const recentMessages = messages.value.slice(-6)
    for (const m of recentMessages) {
      conversationHistory.push({
        role: m.role,
        content: m.content,
      })
    }

    const res = await api.aiChat({
      messages: conversationHistory,
      model: selectedModel.value,
    })

    const aiMessage = res.data?.message || (res as any).message
    const aiModel = res.data?.model || (res as any).model || selectedModel.value
    const isRotated = (res.data as any)?.rotated || (res as any).rotated

    if (res.success && aiMessage) {
      messages.value.push({
        role: 'assistant',
        content: aiMessage,
        time: getNowTime(),
        model: aiModel,
        rotated: isRotated,
      })
    } else {
      console.warn('AI Service error, menggunakan fallback lokal:', res.error)
      const fallbackMsg = generateLocalFallback(query, financeStore)
      messages.value.push({
        role: 'assistant',
        content: `${fallbackMsg}\n\n*(Catatan: Mode analitik darurat lokal aktif karena: ${res.error || 'Respon AI tidak valid'})*`,
        time: getNowTime(),
        model: 'Local Engine',
      })
    }
  } catch (err: any) {
    console.error('AI Advisor Exception:', err)
    const fallbackMsg = generateLocalFallback(query, financeStore)
    messages.value.push({
      role: 'assistant',
      content: `${fallbackMsg}\n\n*(Catatan: Mode analitik darurat lokal aktif)*`,
      time: getNowTime(),
      model: 'Local Engine',
    })
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}
</script>

<style scoped>
.prose-ai {
  font-size: 13.5px;
  line-height: 1.55;
  color: #1e293b;
  letter-spacing: -0.01em;
}
:deep(.prose-ai p) {
  margin-top: 0.25rem;
  margin-bottom: 0.35rem;
}
:deep(.prose-ai p:first-child) {
  margin-top: 0;
}
:deep(.prose-ai p:last-child) {
  margin-bottom: 0;
}
:deep(.prose-ai ul),
:deep(.prose-ai ol) {
  margin-top: 0.25rem;
  margin-bottom: 0.35rem;
}
.animate-fade-in {
  animation: fadeIn 0.15s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}
</style>
