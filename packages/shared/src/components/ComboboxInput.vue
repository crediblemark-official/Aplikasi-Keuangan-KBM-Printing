<template>
  <div ref="rootRef" class="relative w-full">
    <div v-if="label || sublabel" class="flex items-center justify-between mb-1.5">
      <label v-if="label" class="form-label mb-0">{{ label }}</label>
      <span v-if="sublabel" class="text-[10px] text-slate-400 font-normal">{{ sublabel }}</span>
    </div>

    <div class="relative flex items-center">
      <input
        ref="inputRef"
        :value="modelValue"
        :type="type"
        :placeholder="placeholder"
        :required="required"
        class="form-input text-sm pr-9"
        autocomplete="off"
        @input="onInput"
        @focus="openDropdown"
        @keydown.down.prevent="navigateDown"
        @keydown.up.prevent="navigateUp"
        @keydown.enter.prevent="selectHighlighted"
        @keydown.esc="closeDropdown"
      />

      <!-- Right Chevron Toggle Button -->
      <button
        type="button"
        class="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 cursor-pointer transition-transform"
        :class="{ 'rotate-180': isOpen }"
        tabindex="-1"
        @click="toggleDropdown"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>

    <!-- Dropdown Menu -->
    <div
      v-if="isOpen"
      class="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white rounded-xl shadow-xl border border-slate-200 z-50 divide-y divide-slate-100"
    >
      <!-- List Items -->
      <div v-if="filteredOptions.length > 0" class="py-1">
        <div
          v-for="(opt, idx) in filteredOptions"
          :key="opt.value + '-' + idx"
          class="px-3.5 py-2 hover:bg-red-50 cursor-pointer flex items-center justify-between group transition-colors"
          :class="{ 'bg-red-50/80': highlightedIndex === idx }"
          @click="selectOption(opt)"
        >
          <div class="min-w-0 pr-2">
            <p class="text-xs font-bold text-slate-800 group-hover:text-red-700 truncate">
              {{ opt.label }}
            </p>
            <p v-if="opt.sub" class="text-[10px] text-slate-400 truncate mt-0.5">
              {{ opt.sub }}
            </p>
          </div>
          <span class="text-[10px] font-semibold text-slate-400 group-hover:text-red-600 flex-shrink-0">
            Pilih ↵
          </span>
        </div>
      </div>

      <!-- Add New Option Button -->
      <div v-if="showAddOption" class="p-2 bg-slate-50 border-t border-slate-100">
        <button
          type="button"
          class="btn-dropdown-add"
          @click="confirmAddOption"
        >
          <span class="text-sm font-black leading-none">+</span>
          <span class="truncate">
            {{ addLabelPrefix }} "{{ trimmedQuery }}"
          </span>
        </button>
      </div>

      <!-- Empty state when no options exist and query is empty -->
      <div v-if="filteredOptions.length === 0 && !showAddOption" class="p-4 text-center text-xs text-slate-400">
        Belum ada pilihan tersimpan.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface ComboboxOption {
  label: string
  value?: string
  sub?: string
  extra?: any
}

const props = withDefaults(
  defineProps<{
    modelValue: string | number | null | undefined
    label?: string
    sublabel?: string
    placeholder?: string
    required?: boolean
    type?: string
    options: (string | number | ComboboxOption)[]
    addLabelPrefix?: string
  }>(),
  {
    type: 'text',
    addLabelPrefix: 'Tambah',
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
  (e: 'select', option: ComboboxOption): void
  (e: 'add', val: string): void
}>()

const rootRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const isOpen = ref(false)
const highlightedIndex = ref(-1)

const normalizedOptions = computed<ComboboxOption[]>(() => {
  return props.options.map((opt) => {
    if (typeof opt === 'string' || typeof opt === 'number') {
      const str = String(opt)
      return { label: str, value: str }
    }
    const label = String(opt.label ?? '')
    const value = String(opt.value ?? label)
    return {
      label,
      value,
      sub: opt.sub != null ? String(opt.sub) : undefined,
      extra: opt.extra,
    }
  })
})

const trimmedQuery = computed(() => (props.modelValue != null ? String(props.modelValue).trim() : ''))

const filteredOptions = computed(() => {
  const q = trimmedQuery.value.toLowerCase()
  if (!q) return normalizedOptions.value
  return normalizedOptions.value.filter((opt) => {
    return (
      opt.label.toLowerCase().includes(q) ||
      (opt.sub ? opt.sub.toLowerCase().includes(q) : false)
    )
  })
})

const showAddOption = computed(() => {
  const q = trimmedQuery.value
  if (!q) return false
  const exact = normalizedOptions.value.some(
    (opt) => (opt.value ?? opt.label).toLowerCase() === q.toLowerCase()
  )
  return !exact
})

function openDropdown() {
  isOpen.value = true
}

function closeDropdown() {
  isOpen.value = false
  highlightedIndex.value = -1
}

function toggleDropdown() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    inputRef.value?.focus()
  }
}

function onInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  emit('update:modelValue', val)
  isOpen.value = true
  highlightedIndex.value = -1
}

function selectOption(opt: ComboboxOption) {
  const chosen = opt.value ?? opt.label
  emit('update:modelValue', chosen)
  emit('select', opt)
  closeDropdown()
}

function confirmAddOption() {
  const val = trimmedQuery.value
  if (!val) return
  emit('update:modelValue', val)
  emit('add', val)
  closeDropdown()
}

function navigateDown() {
  if (!isOpen.value) {
    isOpen.value = true
    return
  }
  if (highlightedIndex.value < filteredOptions.value.length - 1) {
    highlightedIndex.value++
  }
}

function navigateUp() {
  if (highlightedIndex.value > 0) {
    highlightedIndex.value--
  }
}

function selectHighlighted() {
  if (highlightedIndex.value >= 0 && highlightedIndex.value < filteredOptions.value.length) {
    selectOption(filteredOptions.value[highlightedIndex.value])
  } else if (showAddOption.value) {
    confirmAddOption()
  }
}

function handleClickOutside(e: MouseEvent) {
  if (rootRef.value && !rootRef.value.contains(e.target as Node)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
