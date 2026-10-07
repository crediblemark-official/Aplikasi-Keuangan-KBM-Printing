<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <SyncLogTable
        :show-back="true"
        @back="router.canGoBack() ? router.back() : router.push('/home')"
      />
    </ion-content>

    <!-- Bottom Navigation Bar (Mobile only) -->
    <MobileBottomNav
      :left-items="mobileLeftItems"
      :center-item="mobileCenterItem"
      :right-items="mobileRightItems"
      :current-path="route.path"
      @navigate="navigate"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { IonPage, IonContent, useIonRouter } from '@ionic/vue'
import SyncLogTable from '@shared/components/SyncLogTable.vue'
import MobileBottomNav from '@shared/components/MobileBottomNav.vue'
import type { BottomNavItem } from '@shared/components/MobileBottomNav.vue'
import { useSyncStore } from '@shared/stores/syncStore'
import { useOrderStore } from '../stores/orders'

const route = useRoute()
const router = useIonRouter()
const syncStore = useSyncStore()
const orderStore = useOrderStore()

const mobileLeftItems = computed<BottomNavItem[]>(() => [
  { id: 'home', path: '/home', label: 'Beranda' },
  { id: 'order-list', path: '/order/list', label: 'Pesanan', badge: orderStore.orders.length || undefined },
])

const mobileCenterItem: BottomNavItem = {
  id: 'new-order',
  path: '/order/new',
  label: 'Order Baru',
}

const mobileRightItems = computed<BottomNavItem[]>(() => [
  { id: 'klien', path: '/klien', label: 'Klien' },
  {
    id: 'sync-log',
    path: '/sync-log',
    label: 'Log Sync',
    badge: (syncStore.pendingCount + syncStore.failedCount) > 0 ? (syncStore.pendingCount + syncStore.failedCount) : undefined,
  },
])

function navigate(path: string) {
  router.push(path)
}
</script>
