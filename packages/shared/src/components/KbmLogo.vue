<template>
  <div class="inline-flex items-center gap-2.5 select-none" :class="{ 'flex-col text-center': variant === 'stacked' }">
    <!-- Brand Icon (Printer in Red Squircle with inline CSS gradient - 100% router/SPA safe) -->
    <div
      class="relative flex items-center justify-center flex-shrink-0 rounded-2xl shadow-sm transition-transform text-white overflow-hidden"
      :style="{
        width: `${iconSize}px`,
        height: `${iconSize}px`,
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #991b1b 100%)',
        boxShadow: '0 4px 12px -1px rgba(220, 38, 38, 0.35)',
      }"
    >
      <!-- Crisp White Printer Vector -->
      <svg
        :width="Math.round(iconSize * 0.6)"
        :height="Math.round(iconSize * 0.6)"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="w-[60%] h-[60%]"
      >
        <!-- Top Paper Feed Sheet with Fold -->
        <path
          d="M6 9V3.5C6 3.22386 6.22386 3 6.5 3H14.5L18 6.5V9H6Z"
          fill="#fee2e2"
        />
        <path
          d="M14.5 3V6.5H18"
          stroke="#dc2626"
          stroke-width="1"
          stroke-linecap="round"
          stroke-linejoin="round"
          fill="#fca5a5"
        />

        <!-- Main Printer Body -->
        <path
          d="M3 9C2.44772 9 2 9.44772 2 10V15C2 15.5523 2.44772 16 3 16H6V14.5C6 14.2239 6.22386 14 6.5 14H17.5C17.7761 14 18 14.2239 18 14.5V16H21C21.5523 16 22 15.5523 22 15V10C22 9.44772 21.5523 9 21 9H3Z"
          fill="white"
        />

        <!-- Power Status Dot -->
        <circle cx="19" cy="11.5" r="0.9" fill="#dc2626" />

        <!-- Bottom Paper Tray / Printed Output -->
        <rect
          x="6"
          y="13.5"
          width="12"
          height="7.5"
          rx="1"
          fill="white"
          stroke="#fee2e2"
          stroke-width="0.8"
        />
        <!-- Printed Text Lines -->
        <line x1="8.5" y1="16" x2="15.5" y2="16" stroke="#dc2626" stroke-width="1.4" stroke-linecap="round" />
        <line x1="8.5" y1="18.5" x2="13" y2="18.5" stroke="#dc2626" stroke-width="1.4" stroke-linecap="round" />
      </svg>
    </div>

    <!-- Typography: "KBM" (shown if variant !== 'icon') -->
    <div v-if="variant !== 'icon'" class="min-w-0" :class="{ 'mt-2.5': variant === 'stacked' }">
      <div class="flex items-center leading-none">
        <span class="font-black tracking-tight text-slate-900" :style="{ fontSize: `${fontSizeTitle}px` }">
          KBM
        </span>
      </div>
      <p
        v-if="subtitle"
        class="text-slate-400 font-semibold tracking-wide uppercase mt-1 leading-none"
        :style="{ fontSize: `${fontSizeSubtitle}px` }"
      >
        {{ subtitle }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    size?: 'sm' | 'md' | 'lg' | 'xl'
    variant?: 'icon' | 'full' | 'stacked'
    subtitle?: string
  }>(),
  {
    size: 'md',
    variant: 'full',
    subtitle: '',
  }
)

const iconSize = computed(() => {
  switch (props.size) {
    case 'sm': return 30
    case 'md': return 38
    case 'lg': return 50
    case 'xl': return 68
    default: return 38
  }
})

const fontSizeTitle = computed(() => {
  switch (props.size) {
    case 'sm': return 14
    case 'md': return 17
    case 'lg': return 22
    case 'xl': return 28
    default: return 17
  }
})

const fontSizeSubtitle = computed(() => {
  switch (props.size) {
    case 'sm': return 8
    case 'md': return 9
    case 'lg': return 10
    case 'xl': return 12
    default: return 9
  }
})
</script>
