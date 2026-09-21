/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface Window {
  electronAPI?: {
    platform: string
    isElectron: boolean
    send: (channel: string, data: any) => void
    receive: (channel: string, func: (...args: any[]) => void) => void
  }
}
