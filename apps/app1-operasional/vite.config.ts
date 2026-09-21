import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  base: './',
  plugins: [tailwindcss(), vue()],
  cacheDir: resolve(import.meta.dirname, '../../node_modules/.vite/app1-operasional'),
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
      '@shared': resolve(import.meta.dirname, '../../packages/shared/src'),
    },
  },
  server: {
    port: 5173,
  },
})
