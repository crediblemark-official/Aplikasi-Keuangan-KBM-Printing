<template>
  <aside class="desktop-sidebar hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0 flex-shrink-0 z-30 select-none">
    <!-- Brand Header (h-14, aligns with PageHeader) -->
    <div class="h-14 px-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0 bg-white">
      <div class="flex items-center gap-2.5 min-w-0">
        <slot name="brand-icon">
          <KbmLogo size="sm" variant="icon" />
        </slot>
        <div class="min-w-0">
          <p class="text-slate-900 font-bold text-xs tracking-tight leading-tight">{{ brandTitle }}</p>
          <p class="text-[10px] font-semibold text-slate-400 leading-none mt-0.5">{{ brandSubtitle }}</p>
        </div>
      </div>
      <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 font-mono">{{ brandBadge }}</span>
    </div>

    <!-- Navigation Menu -->
    <nav class="flex-1 py-4 px-4 space-y-1.5 overflow-y-auto">

      <button
        v-for="item in navItems"
        :key="item.path"
        type="button"
        @click="emit('navigate', item.path)"
        class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer text-left group"
        :class="isActive(item.path)
          ? 'bg-red-50 text-red-600 font-semibold'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'"
      >
        <!-- Icon Container (w-8 h-8 rounded-xl) -->
        <div
          class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
          :class="isActive(item.path)
            ? 'bg-red-600 text-white shadow-xs'
            : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200/70 group-hover:text-slate-700'"
        >
          <slot name="item-icon" :item="item">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </slot>
        </div>

        <span class="truncate flex-1">{{ item.label }}</span>

        <!-- Optional Badge Count -->
        <span
          v-if="item.badge !== undefined && item.badge !== null && item.badge !== 0"
          class="px-1.5 py-0.5 rounded-full text-[10px] font-bold font-mono transition-colors"
          :class="isActive(item.path)
            ? 'bg-red-600 text-white'
            : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'"
        >
          {{ item.badge }}
        </span>
      </button>
    </nav>

    <!-- Footer: User Profile Bar & Quick Logout -->
    <SidebarUserFooter
      :name="userName"
      :role-text="userRole"
      @logout="emit('logout')"
    />
  </aside>
</template>

<script setup lang="ts">
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
