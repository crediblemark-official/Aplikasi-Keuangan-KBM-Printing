<template>
  <div class="space-y-2">
    <!-- Preview -->
    <div v-if="previewUrl" class="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
      <img :src="previewUrl" alt="Preview Foto" class="w-full max-h-48 object-cover rounded-xl" />
      <button
        type="button"
        @click="clearPhoto"
        title="Hapus foto"
        class="absolute top-2 right-2 w-7 h-7 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-full flex items-center justify-center text-white text-xs shadow-md transition-colors cursor-pointer"
      >
        ✕
      </button>
    </div>

    <!-- Upload Placeholder Box -->
    <label
      v-else
      class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 hover:border-red-400 bg-slate-50/50 cursor-pointer active:bg-red-50/50 transition-colors"
      :class="compact ? 'h-20 py-2' : 'h-28'"
    >
      <div
        class="rounded-xl bg-white shadow-2xs border border-slate-200 text-slate-500 flex items-center justify-center"
        :class="compact ? 'w-7 h-7 mb-1' : 'w-9 h-9 mb-1.5'"
      >
        <svg :class="compact ? 'w-4 h-4' : 'w-5 h-5'" class="text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <span class="text-slate-600 text-xs font-semibold">{{ label }}</span>
      <span v-if="sublabel" class="text-slate-400 text-[10px] mt-0.5">{{ sublabel }}</span>
      <input
        type="file"
        accept="image/*"
        class="hidden"
        @change="handlePhotoChange"
        ref="photoInput"
      />
    </label>

    <!-- Loading Indicator -->
    <div v-if="isCompressing" class="flex items-center gap-2 text-slate-500 text-xs py-1">
      <div class="w-3.5 h-3.5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      <span>Mengkompresi foto...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { compressImage } from '../utils/imageCompress'

interface ImageUploadData {
  base64: string
  filename: string
  sizeKB?: number
}

const props = withDefaults(
  defineProps<{
    label?: string
    sublabel?: string
    maxDimension?: number
    quality?: number
    compact?: boolean
  }>(),
  {
    label: 'Pilih / Ambil Foto Struk',
    sublabel: 'Kamera, Galeri, atau File (otomatis dikompres)',
    maxDimension: 1000,
    quality: 0.8,
    compact: false,
  }
)

const emit = defineEmits<{
  (e: 'change', data: ImageUploadData | null): void
}>()

const previewUrl = ref('')
const isCompressing = ref(false)
const photoInput = ref<HTMLInputElement>()

async function handlePhotoChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  isCompressing.value = true
  try {
    const compressed = await compressImage(file, props.maxDimension, props.quality)
    previewUrl.value = `data:image/jpeg;base64,${compressed.base64}`
    emit('change', {
      base64: compressed.base64,
      filename: file.name || compressed.filename,
      sizeKB: compressed.sizeKB,
    })
  } catch (e) {
    console.error('Kompresi gambar gagal:', e)
  } finally {
    isCompressing.value = false
  }
}

function clearPhoto() {
  previewUrl.value = ''
  if (photoInput.value) photoInput.value.value = ''
  emit('change', null)
}

defineExpose({
  clear: clearPhoto,
})
</script>
