import { ref } from 'vue'

export function useToast(defaultDuration = 4000) {
  const toastMessage = ref('')
  const toastType = ref<'success' | 'error' | 'info'>('success')
  let timer: ReturnType<typeof setTimeout> | null = null

  function showToast(msg: string, type: 'success' | 'error' | 'info' = 'success', duration = defaultDuration) {
    if (timer) clearTimeout(timer)
    toastMessage.value = msg
    toastType.value = type
    timer = setTimeout(() => {
      toastMessage.value = ''
    }, duration)
  }

  function clearToast() {
    if (timer) clearTimeout(timer)
    toastMessage.value = ''
  }

  return {
    toastMessage,
    toastType,
    showToast,
    clearToast,
  }
}
