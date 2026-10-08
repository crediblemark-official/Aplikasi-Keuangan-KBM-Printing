<template>
  <div>
    <!-- Floating Action Button (FAB) di Pojok Kanan Bawah -->
    <button
      @click="isOpen = true"
      type="button"
      class="fixed bottom-6 right-6 z-40 group flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-red-600 text-white font-bold text-xs shadow-lg shadow-purple-600/30 hover:shadow-xl hover:shadow-purple-600/40 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border border-white/20 select-none"
      title="Buka KBM Business AI Advisor (Gemini & Ollama Cloud)"
    >
      <div class="relative flex items-center justify-center">
        <span class="absolute inline-flex h-full w-full rounded-full bg-white opacity-40 animate-ping"></span>
        <svg class="w-4 h-4 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <span class="tracking-wide">AI Advisor</span>
      <span class="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] bg-white/20 font-mono text-purple-100">
        {{ currentProviderLabel }}
      </span>
    </button>

    <!-- Modal Dialog AI Advisor -->
    <Teleport to="body">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200 animate-fade-in"
      >
        <div
          class="relative w-full sm:max-w-2xl bg-white sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] h-[85vh] border border-slate-200 overflow-hidden"
        >
          <!-- Header Modal -->
          <div class="px-4 py-3 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white shrink-0 border-b border-indigo-900/50">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-500/30 shrink-0">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h3 class="font-bold text-sm text-white tracking-tight">KBM Business AI Advisor</h3>
                    <span
                      class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold border"
                      :class="isGeminiActive
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'"
                    >
                      <span
                        class="w-1.5 h-1.5 rounded-full animate-pulse"
                        :class="isGeminiActive ? 'bg-blue-400' : 'bg-emerald-400'"
                      ></span>
                      {{ isGeminiActive ? 'Gemini Auto-Rotate' : 'Ollama Cloud' }}
                    </span>
                  </div>
                  <p class="text-[11px] text-slate-300 mt-0.5">
                    Executive Financial Intelligence & Business Strategy (Read-Only)
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-1.5">
                <button
                  @click="clearChat"
                  type="button"
                  class="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  title="Bersihkan percakapan"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <button
                  @click="isOpen = false"
                  type="button"
                  class="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  title="Tutup AI Advisor"
                >
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Model Switcher Bar -->
            <div class="mt-2.5 pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <div class="flex items-center gap-1.5 text-slate-300">
                <span>Model AI:</span>
                <select
                  v-model="selectedModel"
                  class="bg-slate-900 text-purple-200 border border-purple-500/40 rounded-lg px-2 py-0.5 text-[11px] font-medium outline-none focus:border-purple-400 cursor-pointer max-w-[260px] truncate"
                >
                  <optgroup label="🔄 Google Gemini Free Pool (Auto-Rotate)">
                    <option v-for="m in geminiModels" :key="m.id" :value="m.id">
                      {{ m.name }}
                    </option>
                  </optgroup>
                  <optgroup label="☁️ Ollama Cloud Free Credits">
                    <option v-for="m in ollamaModels" :key="m.id" :value="m.id">
                      {{ m.name }}
                    </option>
                  </optgroup>
                </select>
              </div>
              <div class="flex items-center gap-1.5 text-[10px] text-purple-300/80">
                <span v-if="selectedModel === 'auto'" class="text-emerald-300 font-bold">
                  ✨ Auto-Rotate Aktif (1.000+ RPD)
                </span>
                <span v-else>
                  ⚡ 0 Kuota Worker
                </span>
                <span>•</span>
                <span>100% Free Tier</span>
              </div>
            </div>
          </div>

          <!-- Quick Insight Chips (Prompt Cepat Siap Pakai) -->
          <div class="p-2.5 bg-slate-50 border-b border-slate-200 overflow-x-auto shrink-0 flex items-center gap-1.5 no-scrollbar">
            <button
              v-for="chip in quickChips"
              :key="chip.label"
              @click="askQuickQuestion(chip.prompt)"
              type="button"
              class="shrink-0 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 text-slate-700 transition-all cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
            >
              <span>{{ chip.icon }}</span>
              <span>{{ chip.label }}</span>
            </button>
          </div>

          <!-- Chat Conversation Body -->
          <div ref="chatContainer" class="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
            <!-- Welcome Banner jika chat masih awal -->
            <div v-if="messages.length === 1" class="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-100 text-xs text-indigo-950 space-y-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 font-bold text-indigo-900">
                  <span>👋 Selamat Datang di KBM Business AI Advisor!</span>
                </div>
                <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-200/60 text-indigo-900 font-bold">
                  {{ selectedModelLabel }}
                </span>
              </div>
              <p class="text-slate-600 leading-relaxed">
                Asisten ini terhubung dengan <strong>{{ isGeminiActive ? 'Google Gemini' : 'Ollama Cloud' }}</strong> dengan fitur <strong>Auto-Rotate</strong> cerdas. Setiap pertanyaan otomatis menyertakan metrik riil omzet, kas masuk, kas keluar, dan sisa piutang KBM Printing.
              </p>
              <div class="pt-1 flex flex-wrap gap-1.5 text-[11px]">
                <span class="px-2 py-0.5 rounded bg-white font-medium text-slate-700 border border-indigo-100">
                  🔄 Auto-Rotate Model Anti Limit
                </span>
                <span class="px-2 py-0.5 rounded bg-white font-medium text-slate-700 border border-indigo-100">
                  🔒 Read-Only Aman (Tanpa mutasi data)
                </span>
                <span class="px-2 py-0.5 rounded bg-white font-medium text-slate-700 border border-indigo-100">
                  📊 Live Financial Data Injection
                </span>
              </div>
            </div>

            <!-- Pesan Chat -->
            <div
              v-for="(msg, idx) in messages"
              :key="idx"
              class="flex flex-col gap-1"
              :class="msg.role === 'user' ? 'items-end' : 'items-start'"
            >
              <div class="flex items-center gap-1.5 text-[10px] text-slate-400 px-1 font-medium">
                <span v-if="msg.role === 'assistant'">🤖 KBM AI Advisor</span>
                <span v-else>👤 Anda</span>
                <span v-if="msg.model" class="text-purple-600 font-mono">
                  ({{ msg.model }}<span v-if="msg.rotated" class="text-emerald-600 font-bold ml-1">🔄 auto-rotated</span>)
                </span>
                <span>•</span>
                <span>{{ msg.time }}</span>
              </div>

              <div
                class="max-w-[92%] sm:max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-2xs"
                :class="msg.role === 'user'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white font-medium rounded-tr-xs'
                  : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs'"
              >
                <!-- Render Jawaban Markdown-Friendly -->
                <div v-if="msg.role === 'assistant'" class="prose-ai space-y-2" v-html="formatMarkdown(msg.content)"></div>
                <div v-else class="whitespace-pre-wrap">{{ msg.content }}</div>
              </div>
            </div>

            <!-- Loading Indicator saat memproses -->
            <div v-if="isLoading" class="flex items-start gap-2 animate-pulse">
              <div class="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 text-xs font-bold">
                AI
              </div>
              <div class="bg-white border border-slate-200 rounded-2xl rounded-tl-xs px-4 py-3 text-xs text-slate-600 shadow-2xs flex items-center gap-2.5">
                <span class="w-2.5 h-2.5 rounded-full bg-purple-600 animate-ping"></span>
                <span>Menganalisis data via <strong>{{ isGeminiActive ? 'Gemini' : 'Ollama' }}</strong> ({{ selectedModel }})...</span>
              </div>
            </div>
          </div>

          <!-- Footer Chat Input -->
          <div class="p-3 bg-white border-t border-slate-200 shrink-0 space-y-2">
            <form @submit.prevent="sendMessage" class="flex items-center gap-2">
              <input
                ref="inputRef"
                v-model="inputQuery"
                type="text"
                placeholder="Tanyakan insight, misal: 'Berapa persen rasio piutang terhadap omzet bulan ini?'"
                class="form-input flex-1 bg-slate-50 text-xs py-2.5 px-3.5 rounded-xl border-slate-300 focus:bg-white transition-all outline-none"
                :disabled="isLoading"
              />
              <button
                type="submit"
                class="h-9 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-red-600 hover:from-indigo-700 hover:to-red-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                :disabled="isLoading || !inputQuery.trim()"
              >
                <span>Kirim</span>
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </form>
            <div class="flex items-center justify-between text-[10px] text-slate-400 px-1">
              <span>💡 Auto-Rotate otomatis mengalihkan request jika suatu model mencapai batas RPM.</span>
              <span>Tekan Enter ↵ untuk mengirim</span>
            </div>
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
    content: `Halo Pak/Bu Owner! Saya **KBM AI Advisor** dengan fitur **Auto-Rotate Model** (${selectedModel.value === 'auto' ? 'Gemini Free Pool' : selectedModel.value}).
    
Saya siap menganalisis kinerja finansial, piutang tertunggak, efisiensi bahan baku kertas, dan strategi bisnis percetakan berdasarkan data riil terkini.
    
Silakan pilih prompt cepat di atas atau ketik pertanyaan langsung!`,
    time: getNowTime(),
    model: selectedModel.value === 'auto' ? 'Auto-Rotate' : selectedModel.value,
  },
])

function clearChat() {
  messages.value = [
    {
      role: 'assistant',
      content: `Percakapan telah dibersihkan. Silakan ajukan pertanyaan insight baru!`,
      time: getNowTime(),
      model: selectedModel.value === 'auto' ? 'Auto-Rotate' : selectedModel.value,
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

    if (res.success && res.data?.message) {
      messages.value.push({
        role: 'assistant',
        content: res.data.message,
        time: getNowTime(),
        model: res.data.model || selectedModel.value,
        rotated: (res.data as any).rotated,
      })
    } else {
      console.warn('AI Service error, menggunakan fallback lokal:', res.error)
      const fallbackMsg = generateLocalFallback(query, financeStore)
      messages.value.push({
        role: 'assistant',
        content: `${fallbackMsg}\n\n*(Catatan: Mode analitik darurat lokal aktif karena: ${res.error || 'Timeout'})*`,
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
  line-height: 1.6;
}
.animate-fade-in {
  animation: fadeIn 0.15s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}
</style>
