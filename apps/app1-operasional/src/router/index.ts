import { createRouter, createWebHistory } from '@ionic/vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/home' },
  { path: '/login', redirect: '/home' },
  {
    path: '/home',
    name: 'Home',
    component: () => import('../views/HomeView.vue'),
  },
  {
    path: '/order/new',
    name: 'NewOrder',
    component: () => import('../views/NewOrderView.vue'),
  },
  {
    path: '/order/list',
    name: 'OrderList',
    component: () => import('../views/OrderListView.vue'),
  },
  {
    path: '/order/:id',
    name: 'OrderDetail',
    component: () => import('../views/OrderDetailView.vue'),
  },
  {
    path: '/order/edit/:id',
    name: 'EditOrder',
    component: () => import('../views/NewOrderView.vue'),
  },
  {
    path: '/payment/new/:orderId?',
    name: 'NewPayment',
    component: () => import('../views/NewPaymentView.vue'),
  },
  {
    path: '/invoice/:orderId',
    name: 'Invoice',
    component: () => import('../views/InvoiceView.vue'),
  },
  {
    path: '/klien',
    name: 'ClientList',
    component: () => import('../views/ClientListView.vue'),
  },
  {
    path: '/sync-log',
    name: 'SyncLog',
    component: () => import('../views/SyncLogView.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/home',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
