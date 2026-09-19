import { createRouter, createWebHistory } from 'vue-router'
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
      { path: 'laporan', name: 'Laporan', component: () => import('../views/LaporanView.vue') },
      { path: 'kas-keluar', name: 'KasKeluar', component: () => import('../views/KasKeluarView.vue') },
      { path: 'verifikasi', name: 'Verifikasi', redirect: { path: '/dashboard/transaksi', query: { tab: 'verifikasi' } } },
      { path: 'piutang', name: 'Piutang', component: () => import('../views/PiutangView.vue') },
      { path: 'sync-log', name: 'SyncLog', component: () => import('../views/SyncLogView.vue') },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
