import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', redirect: '/dashboard' },
  {
    path: '/dashboard',
    component: () => import('../views/DashboardLayout.vue'),
    children: [
      { path: '', redirect: '/dashboard/summary' },
      { path: 'summary', name: 'Summary', component: () => import('../views/SummaryView.vue') },
      { path: 'transaksi', name: 'Transaksi', component: () => import('../views/TransaksiView.vue') },
      { path: 'buku-kas', name: 'BukuKas', component: () => import('../views/BukuKasView.vue') },
      { path: 'laporan', name: 'Laporan', component: () => import('../views/LaporanView.vue') },
      { path: 'kas-keluar', redirect: '/dashboard/buku-kas' },
      { path: 'kas-masuk', redirect: { path: '/dashboard/buku-kas', query: { action: 'input-kas-masuk' } } },
      { path: 'verifikasi', name: 'Verifikasi', redirect: { path: '/dashboard/transaksi', query: { tab: 'verifikasi' } } },
      { path: 'piutang', name: 'Piutang', redirect: { path: '/dashboard/transaksi', query: { tab: 'piutang' } } },
      { path: 'sync-log', name: 'SyncLog', component: () => import('../views/SyncLogView.vue') },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard',
  },
]

const isElectron = typeof window !== 'undefined' && (
  window.location.protocol === 'file:' ||
  navigator.userAgent.toLowerCase().includes('electron') ||
  import.meta.env.VITE_APP_PLATFORM === 'electron'
)

const router = createRouter({
  history: isElectron ? createWebHashHistory() : createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
