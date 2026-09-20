<template>
  <nav class="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-transparent select-none pointer-events-none">
    <div class="relative w-full pointer-events-auto">

      <!-- Background Mound SVG for Center Notch Curve -->
      <div v-if="centerItem" class="absolute -top-[17px] left-1/2 -translate-x-1/2 w-[84px] h-[18px] pointer-events-none z-10">
        <svg viewBox="0 0 84 18" class="w-full h-full drop-shadow-[0_-2px_6px_rgba(220,38,38,0.3)]" fill="none">
          <!-- Background fill that connects seamlessly with brand red navbar -->
          <path
            d="M 0 18 C 16 18, 22 1, 42 1 C 62 1, 68 18, 84 18 Z"
            fill="#dc2626"
          />
          <!-- Top subtle border line -->
          <path
            d="M 0 18 C 16 18, 22 1, 42 1 C 62 1, 68 18, 84 18"
            stroke="#b91c1c"
            stroke-width="1.2"
            stroke-linecap="round"
          />
        </svg>
      </div>

      <!-- Main Navigation Bar Container -->
      <div
        class="relative bg-red-600 border-t border-red-500/80 px-2 sm:px-4 py-1.5 shadow-[0_-6px_25px_rgba(220,38,38,0.35)] flex items-center justify-between"
        style="padding-bottom: max(env(safe-area-inset-bottom, 0px), 6px);"
      >

        <!-- Left Items Wing -->
        <div class="flex-1 flex items-center justify-around">
          <button
            v-for="item in leftItems"
            :key="item.id"
            @click="handleItemClick(item)"
            type="button"
            class="flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer group focus:outline-none"
            :class="isItemActive(item) ? 'text-white font-bold' : 'text-red-100 hover:text-white'"
          >
            <div
              class="relative w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-all"
              :class="isItemActive(item)
                ? 'bg-white text-red-600 shadow-md ring-2 ring-white/30'
                : 'text-white/80 group-hover:text-white group-hover:bg-white/15'"
            >
              <slot name="icon" :item="item" :is-active="isItemActive(item)">
                <component :is="renderDefaultIcon(item.id)" class="w-4 h-4" />
              </slot>
              <!-- Notification Badge -->
              <span
                v-if="item.badge"
                class="absolute -top-1 -right-1 px-1 min-w-[15px] h-[15px] rounded-full bg-slate-900 text-white text-[9px] font-extrabold flex items-center justify-center ring-2 ring-red-600"
              >
                {{ item.badge }}
              </span>
            </div>
            <span
              v-if="item.label"
              class="mt-0.5 text-[9px] sm:text-[10px] text-center leading-tight truncate max-w-[56px] text-white"
              :class="isItemActive(item) ? 'font-bold opacity-100' : 'font-medium opacity-90 group-hover:opacity-100'"
            >
              {{ item.label }}
            </span>
          </button>
        </div>

        <!-- Center Raised Action Button -->
        <div v-if="centerItem" class="relative shrink-0 mx-2 z-20 flex flex-col items-center">
          <button
            @click="handleItemClick(centerItem)"
            type="button"
            class="relative -top-4 w-12 h-12 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center bg-white text-red-600 shadow-xl shadow-red-900/35 transition-all active:scale-95 cursor-pointer focus:outline-none ring-4 ring-red-600"
            :class="[
              isItemActive(centerItem)
                ? 'bg-red-50 text-red-700 ring-white'
                : 'hover:bg-red-50 active:bg-red-100'
            ]"
            :title="centerItem.label || 'Aksi Utama'"
          >
            <slot name="center-icon" :item="centerItem">
              <!-- Default Plus (+) Icon -->
              <svg class="w-6 h-6 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </slot>
          </button>
          <span
            v-if="centerItem.label"
            class="-mt-3.5 text-[9px] sm:text-[10px] font-bold text-center leading-tight truncate max-w-[62px] text-white"
          >
            {{ centerItem.label }}
          </span>
        </div>

        <!-- Right Items Wing -->
        <div class="flex-1 flex items-center justify-around">
          <button
            v-for="item in rightItems"
            :key="item.id"
            @click="handleItemClick(item)"
            type="button"
            class="flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer group focus:outline-none"
            :class="isItemActive(item) ? 'text-white font-bold' : 'text-red-100 hover:text-white'"
          >
            <div
              class="relative w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-all"
              :class="isItemActive(item)
                ? 'bg-white text-red-600 shadow-md ring-2 ring-white/30'
                : 'text-white/80 group-hover:text-white group-hover:bg-white/15'"
            >
              <slot name="icon" :item="item" :is-active="isItemActive(item)">
                <component :is="renderDefaultIcon(item.id)" class="w-4 h-4" />
              </slot>
              <!-- Notification Badge -->
              <span
                v-if="item.badge"
                class="absolute -top-1 -right-1 px-1 min-w-[15px] h-[15px] rounded-full bg-slate-900 text-white text-[9px] font-extrabold flex items-center justify-center ring-2 ring-red-600"
              >
                {{ item.badge }}
              </span>
            </div>
            <span
              v-if="item.label"
              class="mt-0.5 text-[9px] sm:text-[10px] text-center leading-tight truncate max-w-[56px] text-white"
              :class="isItemActive(item) ? 'font-bold opacity-100' : 'font-medium opacity-90 group-hover:opacity-100'"
            >
              {{ item.label }}
            </span>
          </button>
        </div>

      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { h } from 'vue'

export interface BottomNavItem {
  id: string
  label?: string
  path?: string
  icon?: string
  badge?: number | string
  onClick?: () => void
}

const props = withDefaults(
  defineProps<{
    leftItems: BottomNavItem[]
    rightItems: BottomNavItem[]
    centerItem?: BottomNavItem
    currentPath?: string
  }>(),
  {
    leftItems: () => [],
    rightItems: () => [],
  }
)

const emit = defineEmits<{
  (e: 'navigate', path: string): void
  (e: 'select', item: BottomNavItem): void
}>()

function isItemActive(item: BottomNavItem): boolean {
  if (!props.currentPath || !item.path) return false
  if (item.path === '/dashboard/summary') {
    return (
      props.currentPath === '/dashboard/summary' ||
      props.currentPath === '/dashboard' ||
      props.currentPath === '/dashboard/'
    )
  }
  return props.currentPath === item.path || props.currentPath.startsWith(item.path + '/')
}

function handleItemClick(item: BottomNavItem) {
  if (item.onClick) {
    item.onClick()
  } else if (item.path) {
    emit('navigate', item.path)
  }
  emit('select', item)
}

function renderDefaultIcon(id: string) {
  return {
    render() {
      // 1. Dashboard / Summary
      if (id === 'summary' || id === 'dashboard' || id === 'home') {
        return h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [
          h('path', {
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            'stroke-width': '2',
            d: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
          }),
        ])
      }
      // 2. Transaksi
      if (id === 'transaksi' || id === 'orders' || id === 'order-list') {
        return h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [
          h('path', {
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            'stroke-width': '2',
            d: 'M3 10h18M3 14h18m-9-4v8m-7 4h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
          }),
        ])
      }
      // 3. Laporan
      if (id === 'laporan' || id === 'reports') {
        return h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [
          h('path', {
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            'stroke-width': '2',
            d: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
          }),
        ])
      }
      // 4. Kas Keluar
      if (id === 'kas-keluar') {
        return h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [
          h('path', {
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            'stroke-width': '2',
            d: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
          }),
        ])
      }
      // 5. Verifikasi
      if (id === 'verifikasi') {
        return h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [
          h('path', {
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            'stroke-width': '2',
            d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
          }),
        ])
      }
      // 6. Piutang
      if (id === 'piutang') {
        return h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [
          h('path', {
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            'stroke-width': '2',
            d: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
          }),
        ])
      }
      // 7. Sync Log
      if (id === 'sync-log') {
        return h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [
          h('path', {
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            'stroke-width': '2',
            d: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
          }),
        ])
      }
      // Default: Document / Square
      return h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [
        h('path', {
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          'stroke-width': '2',
          d: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
        }),
      ])
    },
  }
}
</script>
