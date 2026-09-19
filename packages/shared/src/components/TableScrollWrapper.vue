<template>
  <div class="w-full relative">
    <!-- Top Horizontal Scrollbar (Garis scroll di atas) -->
    <div
      v-show="hasOverflow"
      ref="topScrollRef"
      class="top-scrollbar border-b border-slate-200 bg-slate-50/80"
      @scroll="onTopScroll"
    >
      <div :style="{ width: contentWidth + 'px', height: '1px' }"></div>
    </div>

    <!-- Table Container (Horizontal scroll, bottom scrollbar hidden if hideBottomScroll) -->
    <div
      ref="bottomScrollRef"
      class="overflow-x-auto border-b border-slate-200"
      :class="{ 'scrollbar-none': hideBottomScroll }"
      @scroll="onBottomScroll"
    >
      <div ref="contentRef" class="w-fit min-w-full">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

const props = withDefaults(
  defineProps<{
    hideBottomScroll?: boolean
  }>(),
  {
    hideBottomScroll: true,
  }
)

const topScrollRef = ref<HTMLDivElement | null>(null)
const bottomScrollRef = ref<HTMLDivElement | null>(null)
const contentRef = ref<HTMLDivElement | null>(null)

const contentWidth = ref(1000)
const hasOverflow = ref(false)

let isSyncingTop = false
let isSyncingBottom = false
let resizeObserver: ResizeObserver | null = null

function onTopScroll() {
  if (isSyncingTop) {
    isSyncingTop = false
    return
  }
  isSyncingBottom = true
  if (bottomScrollRef.value && topScrollRef.value) {
    bottomScrollRef.value.scrollLeft = topScrollRef.value.scrollLeft
  }
}

function onBottomScroll() {
  if (isSyncingBottom) {
    isSyncingBottom = false
    return
  }
  isSyncingTop = true
  if (topScrollRef.value && bottomScrollRef.value) {
    topScrollRef.value.scrollLeft = bottomScrollRef.value.scrollLeft
  }
}

function checkWidth() {
  if (!bottomScrollRef.value) return
  const scrollW = bottomScrollRef.value.scrollWidth
  const clientW = bottomScrollRef.value.clientWidth
  contentWidth.value = scrollW
  hasOverflow.value = scrollW > clientW
  if (topScrollRef.value) {
    topScrollRef.value.scrollLeft = bottomScrollRef.value.scrollLeft
  }
}

onMounted(() => {
  nextTick(() => {
    checkWidth()
    if (bottomScrollRef.value && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        checkWidth()
      })
      resizeObserver.observe(bottomScrollRef.value)
      if (contentRef.value) {
        resizeObserver.observe(contentRef.value)
      }
    }
  })
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})

defineExpose({
  checkWidth,
})
</script>
