<template>
  <div class="date-filter-bar flex items-center gap-1.5 flex-nowrap overflow-x-auto no-scrollbar scrollbar-none py-0.5 max-w-full text-xs">
    <!-- Preset Pills -->
    <button
      v-for="p in presetList"
      :key="p.mode"
      type="button"
      @click="onSelectMode(p.mode)"
      class="filter-pill shrink-0 cursor-pointer !h-7 !px-2.5 !text-xs"
      :class="activeMode === p.mode ? 'active' : ''"
    >
      <span>{{ p.label }}</span>
    </button>

    <!-- Active Filter Sub-Control (Bulan / Tahun / Rentang Tanggal) -->
    <!-- Mode Bulan -->
    <div
      v-if="activeMode === 'MONTH'"
      class="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-full px-2.5 h-7 text-xs shadow-2xs shrink-0 animate-in fade-in duration-150"
    >
      <input
        type="month"
        :value="selectedMonth"
        @change="onMonthChange"
        class="text-xs font-mono font-medium text-slate-800 bg-transparent border-0 outline-none p-0 cursor-pointer"
      />
      <button
        type="button"
        @click="resetFilter"
        title="Reset filter"
        class="p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
      >
        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Mode Tahun -->
    <div
      v-else-if="activeMode === 'YEAR'"
      class="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-full px-2.5 h-7 text-xs shadow-2xs shrink-0 animate-in fade-in duration-150"
    >
      <select
        :value="selectedYear"
        @change="onYearChange"
        class="text-xs font-mono font-medium text-slate-800 bg-transparent border-0 outline-none p-0 cursor-pointer pr-1"
      >
        <option v-for="y in availableYears" :key="y" :value="String(y)">{{ y }}</option>
      </select>
      <button
        type="button"
        @click="resetFilter"
        title="Reset filter"
        class="p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
      >
        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Mode Rentang Tanggal -->
    <div
      v-else-if="activeMode === 'RANGE'"
      class="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-full px-2.5 h-7 text-xs shadow-2xs shrink-0 animate-in fade-in duration-150"
    >
      <input
        type="date"
        :value="rangeStart"
        @change="onRangeStartChange"
        class="text-[11px] font-mono font-medium text-slate-800 bg-transparent border-0 outline-none p-0 cursor-pointer w-[98px]"
      />
      <span class="text-slate-400 text-[10px] font-medium">–</span>
      <input
        type="date"
        :value="rangeEnd"
        @change="onRangeEndChange"
        class="text-[11px] font-mono font-medium text-slate-800 bg-transparent border-0 outline-none p-0 cursor-pointer w-[98px]"
      />
      <button
        type="button"
        @click="resetFilter"
        title="Reset filter"
        class="p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
      >
        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { DateFilterMode, DateFilterValue } from '../types'
import {
  getTodayISO,
  getCurrentPeriode,
  getMonthDateRange,
  getYearDateRange,
  formatTanggal,
} from '../utils/formatters'

const props = withDefaults(
  defineProps<{
    modelValue?: DateFilterValue
    initialMode?: DateFilterMode
    compact?: boolean
  }>(),
  {
    initialMode: 'ALL',
    compact: false,
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: DateFilterValue): void
  (e: 'change', val: DateFilterValue): void
}>()

const activeMode = ref<DateFilterMode>(props.modelValue?.mode ?? props.initialMode)
const customDate = ref<string>(getTodayISO())
const selectedMonth = ref<string>(getCurrentPeriode())
const selectedYear = ref<string>(String(new Date().getFullYear()))

// Default range: 1st of month to today
const rangeStart = ref<string>(`${getCurrentPeriode()}-01`)
const rangeEnd = ref<string>(getTodayISO())

// Generate list of selectable years (e.g. 2024 to currentYear + 2)
const availableYears = computed(() => {
  const current = new Date().getFullYear()
  const years: number[] = []
  for (let y = current - 2; y <= current + 2; y++) {
    years.push(y)
  }
  return years
})

const presetList = computed<Array<{ mode: DateFilterMode; label: string }>>(() => [
  { mode: 'ALL', label: 'Semua' },
  { mode: 'TODAY', label: 'Hari Ini' },
  { mode: 'MONTH', label: 'Bulan' },
  { mode: 'YEAR', label: 'Tahun' },
  { mode: 'RANGE', label: 'Rentang' },
])

const activeFilterLabel = computed(() => {
  switch (activeMode.value) {
    case 'ALL':
      return 'Semua Data'
    case 'TODAY':
      return `Hari Ini (${formatTanggal(customDate.value)})`
    case 'CUSTOM_DATE':
      return formatTanggal(customDate.value)
    case 'MONTH': {
      const [y, m] = selectedMonth.value.split('-')
      const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ]
      const mIdx = parseInt(m, 10) - 1
      return `${monthNames[mIdx] || m} ${y}`
    }
    case 'YEAR':
      return `Tahun ${selectedYear.value}`
    case 'RANGE':
      return `${formatTanggal(rangeStart.value)} – ${formatTanggal(rangeEnd.value)}`
    default:
      return ''
  }
})

function buildFilterValue(): DateFilterValue {
  switch (activeMode.value) {
    case 'ALL':
      return {
        mode: 'ALL',
        startDate: '',
        endDate: '',
        label: 'Semua Data',
      }
    case 'TODAY':
      return {
        mode: 'TODAY',
        startDate: getTodayISO(),
        endDate: getTodayISO(),
        label: `Hari Ini (${formatTanggal(getTodayISO())})`,
      }
    case 'CUSTOM_DATE':
      return {
        mode: 'CUSTOM_DATE',
        startDate: customDate.value,
        endDate: customDate.value,
        label: formatTanggal(customDate.value),
      }
    case 'MONTH': {
      const { startDate, endDate } = getMonthDateRange(selectedMonth.value)
      return {
        mode: 'MONTH',
        startDate,
        endDate,
        month: selectedMonth.value,
        label: activeFilterLabel.value,
      }
    }
    case 'YEAR': {
      const { startDate, endDate } = getYearDateRange(selectedYear.value)
      return {
        mode: 'YEAR',
        startDate,
        endDate,
        year: selectedYear.value,
        label: `Tahun ${selectedYear.value}`,
      }
    }
    case 'RANGE': {
      let start = rangeStart.value
      let end = rangeEnd.value
      if (start > end) {
        // Auto-swap if reversed
        const temp = start
        start = end
        end = temp
      }
      return {
        mode: 'RANGE',
        startDate: start,
        endDate: end,
        label: `${formatTanggal(start)} – ${formatTanggal(end)}`,
      }
    }
  }
}

function emitUpdate() {
  const val = buildFilterValue()
  emit('update:modelValue', val)
  emit('change', val)
}

function onSelectMode(mode: DateFilterMode) {
  activeMode.value = mode
  if (mode === 'TODAY') {
    customDate.value = getTodayISO()
  }
  emitUpdate()
}

function onCustomDateChange(e: Event) {
  const val = (e.target as HTMLInputElement).value
  if (val) {
    customDate.value = val
    activeMode.value = val === getTodayISO() ? 'TODAY' : 'CUSTOM_DATE'
    emitUpdate()
  }
}

function onMonthChange(e: Event) {
  const val = (e.target as HTMLInputElement).value
  if (val) {
    selectedMonth.value = val
    emitUpdate()
  }
}

function onYearChange(e: Event) {
  const val = (e.target as HTMLSelectElement).value
  if (val) {
    selectedYear.value = val
    emitUpdate()
  }
}

function onRangeStartChange(e: Event) {
  const val = (e.target as HTMLInputElement).value
  if (val) {
    rangeStart.value = val
    emitUpdate()
  }
}

function onRangeEndChange(e: Event) {
  const val = (e.target as HTMLInputElement).value
  if (val) {
    rangeEnd.value = val
    emitUpdate()
  }
}

function resetFilter() {
  activeMode.value = 'ALL'
  emitUpdate()
}

// Sync from external modelValue if provided
watch(
  () => props.modelValue,
  (newVal) => {
    if (!newVal) return
    if (newVal.mode && newVal.mode !== activeMode.value) {
      activeMode.value = newVal.mode
    }
    if (newVal.month) selectedMonth.value = newVal.month
    if (newVal.year) selectedYear.value = newVal.year
    if (newVal.startDate && newVal.endDate && newVal.mode === 'RANGE') {
      rangeStart.value = newVal.startDate
      rangeEnd.value = newVal.endDate
    }
  },
  { deep: true }
)

onMounted(() => {
  emitUpdate()
})
</script>
