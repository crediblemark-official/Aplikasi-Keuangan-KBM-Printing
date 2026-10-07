<template>
  <div ref="wrapperRef" class="w-full relative">
    <!-- Top Horizontal Scrollbar (Garis scroll di atas - Sticky) -->
    <div
      v-show="hasOverflow"
      ref="topScrollRef"
      class="top-scrollbar border-b border-slate-200 bg-slate-100"
      :class="sticky ? 'sticky z-20 shadow-xs' : ''"
      :style="stickyStyle"
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
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

const props = withDefaults(
  defineProps<{
    hideBottomScroll?: boolean
    sticky?: boolean
    stickyTop?: number | string
  }>(),
  {
    hideBottomScroll: true,
    sticky: true,
    stickyTop: undefined,
  }
)

const wrapperRef = ref<HTMLDivElement | null>(null)
const topScrollRef = ref<HTMLDivElement | null>(null)
const bottomScrollRef = ref<HTMLDivElement | null>(null)
const contentRef = ref<HTMLDivElement | null>(null)

const contentWidth = ref(1000)
const hasOverflow = ref(false)
const autoStickyTop = ref<number>(0)

let isSyncingTop = false
let isSyncingBottom = false
let resizeObserver: ResizeObserver | null = null
let stickyElTarget: HTMLElement | null = null
let stickyObserver: ResizeObserver | null = null

function updateStickyOffset() {
  if (props.stickyTop !== undefined || !props.sticky) return
  if (!wrapperRef.value) return

  // 1. Cari elemen sticky di sibling sebelumnya
  let found: HTMLElement | null = null
  let el = wrapperRef.value.previousElementSibling as HTMLElement | null
  while (el) {
    if (window.getComputedStyle(el).position === 'sticky') {
      found = el
      break
    }
    el = el.previousElementSibling as HTMLElement | null
  }

  // 2. Jika tidak ada di sibling langsung, cari di container terdekat yang memiliki elemen sticky top: 0
  if (!found) {
    const container = wrapperRef.value.closest('.fade-in, main, [id="owner-app"]')
    if (container) {
      const stickyEls = container.querySelectorAll<HTMLElement>('.sticky')
      for (const sEl of stickyEls) {
        const style = window.getComputedStyle(sEl)
        if (style.position === 'sticky' && (parseInt(style.top, 10) === 0 || style.top === '0px')) {
          if (sEl.compareDocumentPosition(wrapperRef.value) & Node.DOCUMENT_POSITION_FOLLOWING) {
            found = sEl
            break
          }
        }
      }
    }
  }

  if (found) {
    if (stickyElTarget !== found) {
      stickyObserver?.disconnect()
      stickyElTarget = found
      if (typeof ResizeObserver !== 'undefined') {
        stickyObserver = new ResizeObserver(() => {
          if (stickyElTarget) {
            autoStickyTop.value = stickyElTarget.offsetHeight
          }
        })
        stickyObserver.observe(stickyElTarget)
      }
    }
    autoStickyTop.value = found.offsetHeight
  } else {
    autoStickyTop.value = 0
  }
}

const stickyStyle = computed(() => {
  if (!props.sticky) return {}
  const topVal = props.stickyTop !== undefined
    ? (typeof props.stickyTop === 'number' ? `${props.stickyTop}px` : props.stickyTop)
    : `${autoStickyTop.value}px`
  return { top: topVal }
})

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

function onWindowResize() {
  updateStickyOffset()
  checkWidth()
}

onMounted(() => {
  nextTick(() => {
    checkWidth()
    updateStickyOffset()
    window.addEventListener('resize', onWindowResize)
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
  window.removeEventListener('resize', onWindowResize)
  resizeObserver?.disconnect()
  stickyObserver?.disconnect()
})

defineExpose({
  checkWidth,
  updateStickyOffset,
})
</script>
