<template>
  <div class="h-9 px-[8px] sm:px-[15px] lg:px-4 bg-slate-50/75 border-b border-slate-200 flex items-center justify-between">
    <div class="flex items-center gap-2 min-w-0">
      <slot name="icon" />
      <span class="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">
        {{ title }}
      </span>
      <slot name="badge" />
    </div>
    <div v-if="$slots.actions" class="flex items-center gap-1.5 flex-shrink-0">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>
