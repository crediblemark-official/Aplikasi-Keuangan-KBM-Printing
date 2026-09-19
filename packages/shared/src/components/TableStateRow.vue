<template>
  <tr v-if="loading">
    <td :colspan="colspan" class="text-center py-8">
      <div class="flex items-center justify-center gap-2 text-red-600 font-medium text-xs">
        <div class="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        <span>{{ loadingText }}</span>
      </div>
    </td>
  </tr>
  <tr v-else-if="isEmpty">
    <td :colspan="colspan" class="text-center py-10 text-slate-400 font-medium text-xs">
      {{ emptyText }}
    </td>
  </tr>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    colspan: number
    loading?: boolean
    isEmpty?: boolean
    loadingText?: string
    emptyText?: string
  }>(),
  {
    loading: false,
    isEmpty: false,
    loadingText: 'Memuat data...',
    emptyText: 'Tidak ada data untuk ditampilkan',
  }
)
</script>
