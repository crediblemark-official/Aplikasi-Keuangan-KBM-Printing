<template>
  <aside
    class="desktop-sidebar hidden lg:flex flex-col bg-white border-r border-slate-200 h-screen sticky top-0 flex-shrink-0 z-30 select-none transition-[width] duration-200 ease-in-out"
    :class="isCollapsed ? 'w-[72px]' : 'w-64'"
  >
    <!-- Brand Header (h-14, aligns with PageHeader) -->
    <!-- Expanded Header -->
    <div
      v-if="!isCollapsed"
      class="h-14 px-3.5 border-b border-slate-200 flex items-center justify-between gap-1.5 flex-shrink-0 bg-white"
    >
      <div class="flex items-center gap-2.5 min-w-0">
        <slot name="brand-icon">
          <KbmLogo size="sm" variant="icon" />
        </slot>
        <div class="min-w-0">
          <p class="text-slate-900 font-bold text-xs tracking-tight leading-tight truncate">{{ brandTitle }}</p>
          <p class="text-[10px] font-semibold text-slate-400 leading-none mt-0.5 truncate">{{ brandSubtitle }}</p>
        </div>
      </div>
      <div class="flex items-center gap-1.5 flex-shrink-0">
        <span
          v-if="brandBadge"
          class="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 font-mono tracking-tight"
        >
          {{ brandBadge }}
        </span>
        <button
          type="button"
          @click="toggleCollapse"
          title="Ciutkan Sidebar"
          class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Collapsed Header -->
    <div
      v-else
      class="h-14 px-2 border-b border-slate-200 flex items-center justify-center flex-shrink-0 bg-white"
    >
      <button
        type="button"
        @click="toggleCollapse"
        title="Perluas Sidebar"
        class="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-red-50 text-slate-600 hover:text-red-600 transition-all cursor-pointer group relative"
      >
        <slot name="brand-icon">
          <KbmLogo size="sm" variant="icon" />
        </slot>
        <div class="absolute inset-0 bg-red-600/10 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
          <svg class="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </div>
      </button>
    </div>

    <!-- Navigation Menu -->
    <nav class="flex-1 py-4 space-y-1.5 overflow-y-auto" :class="isCollapsed ? 'px-2' : 'px-3.5'">
      <button
        v-for="item in navItems"
        :key="item.path"
        type="button"
        @click="emit('navigate', item.path)"
        class="w-full flex items-center rounded-xl text-xs transition-all cursor-pointer group relative"
        :class="[
          isCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2 text-left',
          isActive(item.path)
            ? 'bg-red-50 text-red-600 font-semibold'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
        ]"
        :title="isCollapsed ? item.label : undefined"
      >
        <!-- Icon Container (w-8 h-8 rounded-xl) -->
        <div
          class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all relative"
          :class="isActive(item.path)
            ? 'bg-red-600 text-white shadow-xs'
            : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200/70 group-hover:text-slate-700'"
        >
          <slot name="item-icon" :item="item">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </slot>

          <!-- Collapsed Badge Dot / Counter -->
          <span
            v-if="isCollapsed && item.badge !== undefined && item.badge !== null && item.badge !== 0"
            class="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[9px] font-bold font-mono flex items-center justify-center ring-2 ring-white"
          >
            {{ typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge }}
          </span>
        </div>

        <span v-if="!isCollapsed" class="truncate flex-1">{{ item.label }}</span>

        <!-- Expanded Badge Count -->
        <span
          v-if="!isCollapsed && item.badge !== undefined && item.badge !== null && item.badge !== 0"
          class="px-1.5 py-0.5 rounded-full text-[10px] font-bold font-mono transition-colors"
          :class="isActive(item.path)
            ? 'bg-red-600 text-white'
            : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'"
        >
          {{ item.badge }}
        </span>
      </button>
    </nav>

    <!-- Bottom Collapse / Expand Toggle Button -->
    <div class="px-2 pb-2 pt-1 border-t border-slate-100 flex-shrink-0">
      <button
        type="button"
        @click="toggleCollapse"
        :title="isCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'"
        class="w-full flex items-center rounded-xl text-xs font-medium text-slate-400 hover:text-slate-700 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer group"
        :class="isCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2'"
      >
        <div class="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600 transition-colors flex-shrink-0">
          <svg
            class="w-4 h-4 transition-transform duration-200"
            :class="{ 'rotate-180': isCollapsed }"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </div>
        <span v-if="!isCollapsed" class="truncate font-semibold text-[11px] text-slate-500 group-hover:text-slate-700">
          Ciutkan
        </span>
      </button>
    </div>

    <!-- Footer: User Profile Bar & Quick Logout -->
    <SidebarUserFooter
      :name="userName"
      :role-text="userRole"
      :is-collapsed="isCollapsed"
      @logout="emit('logout')"
    />
  </aside>
</template>

<script setup lang="ts">
import { ref } from 'vue'
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

if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  isCollapsed.value = localStorage.getItem('kbm_sidebar_collapsed') === 'true'
}

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
