<template>
  <aside
    class="desktop-sidebar hidden lg:flex flex-col bg-white border-r border-slate-200 h-screen sticky top-0 flex-shrink-0 z-30 select-none transition-all duration-300 ease-in-out"
    :class="isCollapsed ? 'is-collapsed w-[56px]' : 'w-64'"
    :style="{ width: isCollapsed ? '56px' : '256px' }"
  >
    <!-- Brand Header (h-14, aligns with PageHeader) -->
    <div
      class="h-14 border-b border-slate-200 flex items-center flex-shrink-0 bg-white transition-all overflow-hidden"
      :class="isCollapsed ? 'px-1 justify-center' : 'px-3.5 justify-between gap-1.5'"
    >
      <!-- Expanded Brand Header -->
      <template v-if="!isCollapsed">
        <div class="flex items-center gap-2.5 min-w-0 flex-1">
          <slot name="brand-icon">
            <KbmLogo size="sm" variant="icon" />
          </slot>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5 min-w-0">
              <p class="text-slate-900 font-bold text-xs tracking-tight leading-tight truncate">{{ brandTitle }}</p>
              <span v-if="brandBadge" class="flex-shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-50 text-red-600 border border-red-100 font-mono">{{ brandBadge }}</span>
            </div>
            <p class="text-[10px] font-semibold text-slate-400 leading-none mt-0.5 truncate">{{ brandSubtitle }}</p>
          </div>
        </div>
        <!-- Collapse Button in Header -->
        <button
          type="button"
          @click="toggleCollapse"
          title="Ciutkan Sidebar (Collapse)"
          class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer flex-shrink-0"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </template>

      <!-- Collapsed Brand Header (Click logo or expand icon) -->
      <template v-else>
        <button
          type="button"
          @click="toggleCollapse"
          title="Klik untuk Perluas Sidebar"
          class="group relative w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-100 active:bg-slate-200 transition-all cursor-pointer"
        >
          <slot name="brand-icon">
            <KbmLogo size="sm" variant="icon" />
          </slot>
          <div class="absolute inset-0 rounded-xl bg-slate-900/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity shadow-xs">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      </template>
    </div>

    <!-- Navigation Menu -->
    <nav
      class="flex-1 py-3 overflow-y-auto transition-all"
      :class="isCollapsed ? 'px-1.5 flex flex-col items-center' : 'px-3 space-y-1.5'"
    >
      <button
        v-for="item in navItems"
        :key="item.path"
        type="button"
        @click="emit('navigate', item.path)"
        :title="isCollapsed ? (item.label + (item.badge ? ` (${item.badge})` : '')) : undefined"
        class="flex items-center rounded-xl text-xs transition-all cursor-pointer group relative"
        :class="[
          isCollapsed ? 'w-10 h-10 justify-center p-0' : 'w-full gap-3 px-3 py-2 text-left',
          isActive(item.path)
            ? 'bg-red-50 text-red-600 font-semibold'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
        ]"
        :style="{ marginBottom: '6px', flexShrink: 0 }"
      >
        <!-- Icon Container -->
        <div
          class="rounded-xl flex items-center justify-center flex-shrink-0 transition-all relative"
          :class="[
            isCollapsed ? 'w-10 h-10' : 'w-8 h-8',
            isActive(item.path)
              ? 'bg-red-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200/70 group-hover:text-slate-700'
          ]"
        >
          <slot name="item-icon" :item="item">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </slot>

          <!-- Collapsed Mini Badge Counter / Dot -->
          <span
            v-if="isCollapsed && item.badge !== undefined && item.badge !== null && item.badge !== 0"
            class="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold font-mono flex items-center justify-center ring-2 ring-white shadow-2xs"
            :class="isActive(item.path) ? 'bg-slate-900 text-white' : 'bg-red-600 text-white'"
          >
            {{ typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge }}
          </span>
        </div>

        <!-- Expanded Label & Badge -->
        <template v-if="!isCollapsed">
          <span class="truncate flex-1">{{ item.label }}</span>

          <span
            v-if="item.badge !== undefined && item.badge !== null && item.badge !== 0"
            class="px-1.5 py-0.5 rounded-full text-[10px] font-bold font-mono transition-colors"
            :class="isActive(item.path)
              ? 'bg-red-600 text-white'
              : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'"
          >
            {{ item.badge }}
          </span>
        </template>
      </button>
    </nav>

    <!-- Bottom Collapse Toggle Bar -->
    <div
      class="border-t border-slate-100 transition-all flex items-center flex-shrink-0"
      :class="isCollapsed ? 'py-2 justify-center' : 'px-3 py-2 justify-between'"
    >
      <span v-if="!isCollapsed" class="text-[11px] font-medium text-slate-400">Tampilan Menu</span>
      <button
        type="button"
        @click="toggleCollapse"
        :title="isCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'"
        class="inline-flex items-center gap-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer"
        :class="isCollapsed ? 'w-9 h-8 justify-center p-0' : 'px-2 py-1.5'"
      >
        <svg
          class="w-4 h-4 transition-transform duration-300"
          :class="{ 'rotate-180': isCollapsed }"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
        <span v-if="!isCollapsed" class="text-[11px]">Ciutkan</span>
      </button>
    </div>

    <!-- Footer: User Profile Bar & Quick Logout -->
    <SidebarUserFooter
      :name="userName"
      :role-text="userRole"
      :collapsed="isCollapsed"
      @logout="emit('logout')"
    />
  </aside>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import KbmLogo from './KbmLogo.vue'
import SidebarUserFooter from './SidebarUserFooter.vue'

export interface SidebarNavItem {
  id: string
  label: string
  path: string
  badge?: string | number
}

const props = withDefaults(
  defineProps<{
    brandTitle: string
    brandSubtitle: string
    brandBadge: string
    navItems: SidebarNavItem[]
    currentPath: string
    userName?: string
    userRole?: string
  }>(),
  {
    userName: 'User',
    userRole: 'Aktif',
  }
)

const emit = defineEmits<{
  (e: 'navigate', path: string): void
  (e: 'logout'): void
}>()

const isCollapsed = ref(false)

onMounted(() => {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('kbm_sidebar_collapsed')
      if (saved !== null) {
        isCollapsed.value = saved === 'true'
      }
    }
  } catch {}
})

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('kbm_sidebar_collapsed', String(isCollapsed.value))
    }
  } catch {}
}

function isActive(itemPath: string): boolean {
  if (itemPath === '/home' || itemPath === '/dashboard/summary') {
    return (
      props.currentPath === itemPath ||
      props.currentPath === '/' ||
      props.currentPath === '/dashboard' ||
      props.currentPath === '/dashboard/'
    )
  }
  if (itemPath === '/order/list') {
    return (
      props.currentPath === '/order/list' ||
      (props.currentPath.startsWith('/order/') && props.currentPath !== '/order/new') ||
      props.currentPath.startsWith('/invoice/')
    )
  }
  return props.currentPath.startsWith(itemPath)
}
</script>
