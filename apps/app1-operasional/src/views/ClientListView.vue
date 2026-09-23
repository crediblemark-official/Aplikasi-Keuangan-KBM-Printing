<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <PageHeader
        title="Daftar Penerbit & Klien"
        :show-back="true"
        back-label="Beranda"
        @back="router.push('/home')"
      >
        <template #actions>
          <div class="flex items-center gap-2">
            <BaseButton
              variant="secondary"
              size="sm"
              @click="refreshData"
              :loading="isLoading"
              title="Muat ulang data"
            >
              <template #icon>
                <svg class="w-3.5 h-3.5 text-slate-600" :class="{ 'animate-spin': isLoading }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </template>
              <span class="hidden sm:inline">Refresh</span>
            </BaseButton>

            <BaseButton
              variant="primary"
              size="sm"
              @click="openAddClientModal"
            >
              <template #icon>
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M12 4v16m8-8H4" />
                </svg>
              </template>
              <span>Tambah Klien</span>
            </BaseButton>
          </div>
        </template>
      </PageHeader>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="w-full min-h-full bg-white pb-24 lg:pb-8">

        <!-- Metric Strip Component -->
        <MetricStrip :items="metrics" />

        <!-- Toolbar 1: Full-Width Search Bar -->
        <div class="w-full px-[8px] sm:px-[15px] lg:px-[20px] py-2.5 border-b border-slate-200 bg-white">
          <SearchInput
            v-model="search"
            placeholder="Cari nama penerbit, kontak WhatsApp, kota / alamat..."
          />
        </div>

        <!-- Horizontal Filter Tabs -->
        <div class="px-[8px] sm:px-[15px] lg:px-[20px] py-1.5 border-b border-slate-200 bg-white">
          <FilterTabs v-model="activeFilter" :tabs="filterTabs" />
        </div>

        <!-- Order Data Table (Always rendered, identical to OrderListView) -->
        <TableScrollWrapper>
          <table class="data-table w-full min-w-[850px]">
            <thead>
              <tr class="whitespace-nowrap">
                <th>Penerbit / Klien</th>
                <th>Kontak & WhatsApp</th>
                <th>Alamat Pengiriman</th>
                <th class="text-center">Total Order</th>
                <th class="text-right">Total Omset</th>
                <th class="text-right">Saldo Deposit</th>
                <th class="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <TableStateRow
                :colspan="7"
                :loading="isLoading"
                :is-empty="filteredClients.length === 0"
                empty-text="Tidak ada penerbit atau klien ditemukan"
                loading-text="Memuat daftar klien..."
              />
              <tr
                v-for="c in filteredClients"
                :key="c.nama_penerbit"
                class="hover:bg-slate-50/80 transition-colors"
              >
                <!-- Nama Penerbit -->
                <td>
                  <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-lg bg-red-50 border border-red-200/80 text-red-600 font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs select-none">
                      {{ getInitials(c.nama_penerbit) }}
                    </div>
                    <div class="min-w-0">
                      <p class="font-bold text-xs text-slate-900 truncate">{{ c.nama_penerbit }}</p>
                      <p v-if="c.lastOrderDate" class="text-[11px] text-slate-400 mt-0.5">
                        Order terakhir: {{ safeFormatTanggal(c.lastOrderDate) }}
                      </p>
                      <p v-else class="text-[11px] text-slate-400 mt-0.5">
                        Belum ada order
                      </p>
                    </div>
                  </div>
                </td>

                <!-- Kontak WhatsApp -->
                <td class="whitespace-nowrap">
                  <a
                    v-if="c.kontak"
                    :href="getWhatsAppUrl(c)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition-colors"
                    title="Klik untuk chat WhatsApp"
                  >
                    <svg class="w-3.5 h-3.5 fill-emerald-600 shrink-0" viewBox="0 0 24 24">
                      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm5.78 14.07c-.24.67-1.39 1.29-1.92 1.37-.51.08-1.16.11-3.32-.78-2.65-1.1-4.35-3.8-4.48-3.98-.13-.18-1.07-1.42-1.07-2.71 0-1.29.68-1.92.92-2.18.24-.26.53-.33.71-.33.18 0 .35.01.5.02.16.01.38-.06.59.45.22.53.75 1.83.82 1.96.07.13.11.29.02.47-.09.18-.13.29-.26.44-.13.15-.28.34-.4.45-.13.13-.27.27-.12.53.15.26.68 1.12 1.46 1.81 1 .89 1.84 1.17 2.1 1.3.26.13.42.11.57-.07.16-.18.66-.77.84-1.03.18-.26.35-.22.59-.13.24.09 1.54.73 1.8 1.03.26.3.26.44.2.71z"/>
                    </svg>
                    <span class="font-mono">{{ formatPhone(c.kontak) }}</span>
                  </a>
                  <span v-else class="text-slate-400 text-xs">-</span>
                </td>

                <!-- Alamat -->
                <td class="max-w-[220px]">
                  <div v-if="c.alamat" class="flex items-center gap-1.5 text-xs text-slate-600 truncate" :title="c.alamat">
                    <svg class="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span class="truncate">{{ c.alamat }}</span>
                  </div>
                  <span v-else class="text-slate-400 text-xs">-</span>
                </td>

                <!-- Total Order -->
                <td class="text-center whitespace-nowrap">
                  <span
                    v-if="c.orderCount > 0"
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100"
                  >
                    {{ c.orderCount }}x Order
                  </span>
                  <span v-else class="text-slate-400 text-xs">-</span>
                </td>

                <!-- Total Omset -->
                <td class="text-right font-extrabold font-mono text-xs text-red-600 whitespace-nowrap">
                  {{ safeFormatRupiah(c.totalOmset) }}
                </td>

                <!-- Saldo Deposit -->
                <td class="text-right whitespace-nowrap font-mono text-xs">
                  <span
                    v-if="c.depositBalance > 0"
                    class="inline-flex items-center px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
                  >
                    {{ safeFormatRupiah(c.depositBalance) }}
                  </span>
                  <span v-else class="text-slate-400">Rp 0</span>
                </td>

                <!-- Aksi -->
                <td class="text-center whitespace-nowrap">
                  <div class="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      @click="createNewOrder(c)"
                      class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 active:bg-red-200 transition-all cursor-pointer hover:shadow-xs"
                      title="Buat Order Baru untuk penerbit ini"
                    >
                      <svg class="w-3.5 h-3.5 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Order</span>
                    </button>
                    <button
                      type="button"
                      @click="viewOrders(c)"
                      :disabled="c.orderCount === 0"
                      class="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      title="Lihat riwayat pesanan penerbit ini"
                    >
                      Detail →
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </TableScrollWrapper>

      </div>
    </ion-content>

    <!-- Modal Tambah Klien Baru -->
    <BaseModal
      v-model="showAddModal"
      title="Tambah Penerbit / Klien Baru"
      subtitle="Data penerbit otomatis tersimpan dan siap digunakan untuk order baru"
      max-width="max-w-lg"
    >
      <form @submit.prevent="submitAddClient" class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">
            Nama Penerbit / Klien <span class="text-red-500">*</span>
          </label>
          <input
            v-model="newClientForm.nama_penerbit"
            type="text"
            required
            placeholder="Contoh: Penerbit Bintang Media"
            class="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-medium"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">
            Nomor WhatsApp / HP
          </label>
          <input
            v-model="newClientForm.kontak"
            type="tel"
            placeholder="Contoh: 081234567890"
            class="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-mono"
          />
          <p class="text-[11px] text-slate-400 mt-1">Dapat digunakan untuk chat WhatsApp langsung.</p>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">
            Alamat Pengiriman
          </label>
          <textarea
            v-model="newClientForm.alamat"
            rows="3"
            placeholder="Contoh: Jl. Diponegoro No. 45, Sumenep, Madura..."
            class="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          ></textarea>
        </div>

        <div class="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
          <BaseButton
            type="button"
            variant="secondary"
            size="sm"
            @click="showAddModal = false"
          >
            Batal
          </BaseButton>
          <BaseButton
            type="submit"
            variant="primary"
            size="sm"
            :loading="isSaving"
          >
            Simpan Penerbit
          </BaseButton>
        </div>
      </form>
    </BaseModal>

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
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { IonPage, IonHeader, IonContent, useIonRouter } from '@ionic/vue'
import PageHeader from '@shared/components/PageHeader.vue'
import MetricStrip from '@shared/components/MetricStrip.vue'
import type { MetricItem } from '@shared/components/MetricStrip.vue'
import FilterTabs from '@shared/components/FilterTabs.vue'
import SearchInput from '@shared/components/SearchInput.vue'
import BaseButton from '@shared/components/BaseButton.vue'
import BaseModal from '@shared/components/BaseModal.vue'
import TableScrollWrapper from '@shared/components/TableScrollWrapper.vue'
import TableStateRow from '@shared/components/TableStateRow.vue'
import MobileBottomNav from '@shared/components/MobileBottomNav.vue'
import type { BottomNavItem } from '@shared/components/MobileBottomNav.vue'
import { useOrderStore } from '../stores/orders'
import { useSyncStore } from '@shared/stores/syncStore'
import { api } from '@shared/api/gasClient'
import type { Client } from '@shared/types'
import { formatRupiah, formatTanggal } from '@shared/utils/formatters'

interface ClientWithStats extends Client {
  orderCount: number
  totalOmset: number
  depositBalance: number
  lastOrderDate?: string
}

const route = useRoute()
const router = useIonRouter()
const orderStore = useOrderStore()
const syncStore = useSyncStore()

const search = ref('')
const activeFilter = ref('all')
const isLoading = ref(false)
const isSaving = ref(false)
const showAddModal = ref(false)

const fetchedClients = ref<Client[]>([])
const customClients = ref<Client[]>([])

const newClientForm = ref({
  nama_penerbit: '',
  kontak: '',
  alamat: '',
})

// Local storage caching for custom clients
const LOCAL_CLIENTS_KEY = 'kbm_custom_clients_v1'
function loadLocalClients() {
  try {
    const raw = localStorage.getItem(LOCAL_CLIENTS_KEY)
    if (raw) customClients.value = JSON.parse(raw)
  } catch {}
}

function saveLocalClients() {
  try {
    localStorage.setItem(LOCAL_CLIENTS_KEY, JSON.stringify(customClients.value))
  } catch {}
}

// Bottom nav items
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

function safeFormatTanggal(dateStr?: string): string {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return String(dateStr)
    return formatTanggal(dateStr)
  } catch {
    return String(dateStr)
  }
}

function safeFormatRupiah(val?: number): string {
  return formatRupiah(Number(val) || 0)
}

// Format telephone for display (e.g. 0819-9510-0401)
function formatPhone(phone?: string): string {
  if (!phone) return '-'
  let cleaned = phone.replace(/[^\d+]/g, '')
  if (cleaned.startsWith('62')) cleaned = '0' + cleaned.slice(2)
  if (cleaned.startsWith('+62')) cleaned = '0' + cleaned.slice(3)
  if (!cleaned.startsWith('0') && cleaned.length >= 9) cleaned = '0' + cleaned
  if (cleaned.length >= 10) {
    return cleaned.replace(/(\d{4})(\d{4})(\d+)/, '$1-$2-$3')
  }
  return cleaned
}

// Clean phone for wa.me URL (628...)
function cleanPhoneNumber(phone?: string): string {
  if (!phone) return ''
  let cleaned = phone.replace(/[^\d+]/g, '')
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1)
  } else if (cleaned.startsWith('+62')) {
    cleaned = cleaned.slice(1)
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned
  }
  return cleaned
}

function getWhatsAppUrl(c: ClientWithStats): string {
  const phone = cleanPhoneNumber(c.kontak)
  const text = encodeURIComponent(`Halo ${c.nama_penerbit}, kami dari Percetakan KBM Printing...`)
  return `https://wa.me/${phone}?text=${text}`
}

function toSafeString(val: any): string {
  if (val === null || val === undefined) return ''
  return String(val).trim()
}

// Deposit balances map per client
const depositBalances = computed(() => {
  const map = new Map<string, { masuk: number; keluar: number }>()

  orderStore.kasMasukList.forEach((k) => {
    if ((k as any).status_verifikasi !== 'VERIFIED') return
    const key = toSafeString(k.nama_penerbit).toLowerCase()
    if (!key) return

    const curr = map.get(key) || { masuk: 0, keluar: 0 }
    if (k.jenis_pembayaran === 'DEPOSIT') {
      curr.masuk += Number(k.nominal) || 0
    }
    if (k.metode === 'SALDO_DEPOSIT') {
      curr.keluar += Number(k.nominal) || 0
    }
    map.set(key, curr)
  })

  const result = new Map<string, number>()
  map.forEach((val, key) => {
    result.set(key, Math.max(0, val.masuk - val.keluar))
  })
  return result
})

// Unified list of clients enriched with order history & statistics
const allClientsWithStats = computed<ClientWithStats[]>(() => {
  const map = new Map<string, ClientWithStats>()

  // 1. Seed from backend clients
  for (const c of fetchedClients.value) {
    const name = toSafeString(c.nama_penerbit)
    const key = name.toLowerCase()
    if (!key) continue
    map.set(key, {
      nama_penerbit: name,
      kontak: toSafeString(c.kontak),
      alamat: toSafeString(c.alamat),
      orderCount: 0,
      totalOmset: 0,
      depositBalance: 0,
    })
  }

  // 2. Seed from custom local clients
  for (const c of customClients.value) {
    const name = toSafeString(c.nama_penerbit)
    const key = name.toLowerCase()
    if (!key) continue
    const existing = map.get(key)
    const kontak = toSafeString(c.kontak)
    const alamat = toSafeString(c.alamat)
    if (existing) {
      if (!existing.kontak && kontak) existing.kontak = kontak
      if (!existing.alamat && alamat) existing.alamat = alamat
    } else {
      map.set(key, {
        nama_penerbit: name,
        kontak,
        alamat,
        orderCount: 0,
        totalOmset: 0,
        depositBalance: 0,
      })
    }
  }

  // 3. Seed from existing orders (ensures 100% data discovery even without API)
  for (const o of orderStore.orders) {
    const name = toSafeString(o.nama_penerbit)
    const key = name.toLowerCase()
    if (!key) continue

    const kontak = toSafeString(o.kontak_penerbit)
    const alamat = toSafeString(o.alamat_penerbit)

    let client = map.get(key)
    if (!client) {
      client = {
        nama_penerbit: name,
        kontak,
        alamat,
        orderCount: 0,
        totalOmset: 0,
        depositBalance: 0,
      }
      map.set(key, client)
    } else {
      if (!client.kontak && kontak) client.kontak = kontak
      if (!client.alamat && alamat) client.alamat = alamat
    }

    // Order yang dibatalkan tetap memunculkan klien, tapi tidak dihitung sebagai omzet/statistik
    if (o.status_order !== 'BATAL') {
      client.orderCount++
      client.totalOmset += Number(o.total_harga) || 0
      if (!client.lastOrderDate || (o.tanggal && String(o.tanggal) > client.lastOrderDate)) {
        client.lastOrderDate = String(o.tanggal)
      }
    }
  }

  // 4. Attach deposit balance
  map.forEach((client, key) => {
    client.depositBalance = depositBalances.value.get(key) || 0
  })

  return Array.from(map.values())
})

// Filtered & Sorted Clients
const filteredClients = computed(() => {
  let list = allClientsWithStats.value

  // Filter Tabs
  if (activeFilter.value === 'active') {
    list = list.filter((c) => c.orderCount > 0)
  } else if (activeFilter.value === 'deposit') {
    list = list.filter((c) => c.depositBalance > 0)
  } else if (activeFilter.value === 'no_orders') {
    list = list.filter((c) => c.orderCount === 0)
  }

  // Text Search
  const q = (search.value || '').trim().toLowerCase()
  if (q) {
    list = list.filter(
      (c) =>
        (c.nama_penerbit || '').toLowerCase().includes(q) ||
        (c.kontak || '').toLowerCase().includes(q) ||
        (c.alamat || '').toLowerCase().includes(q)
    )
  }

  // Sorting: Prioritaskan yang memiliki order terbanyak, lalu alfabetis A-Z
  return [...list].sort((a, b) => {
    const diff = (b.orderCount || 0) - (a.orderCount || 0)
    if (diff !== 0) return diff
    return String(a.nama_penerbit || '').localeCompare(String(b.nama_penerbit || ''))
  })
})

// Metrics
const metrics = computed<MetricItem[]>(() => {
  const totalClients = allClientsWithStats.value.length
  const activeCount = allClientsWithStats.value.filter((c) => c.orderCount > 0).length
  const totalOrders = orderStore.orders.length
  const totalDeposit = Array.from(depositBalances.value.values()).reduce((sum, v) => sum + v, 0)

  return [
    {
      label: 'Total Penerbit',
      value: totalClients,
      unit: 'klien',
      minWidth: 'min-w-[130px]',
    },
    {
      label: 'Klien Aktif Cetak',
      value: activeCount,
      unit: 'klien',
      valueClass: 'text-blue-600',
      minWidth: 'min-w-[140px]',
    },
    {
      label: 'Total Order Masuk',
      value: totalOrders,
      unit: 'order',
      minWidth: 'min-w-[130px]',
    },
    {
      label: 'Saldo Deposit Mengendap',
      value: safeFormatRupiah(totalDeposit),
      valueClass: 'text-emerald-600',
      minWidth: 'min-w-[170px]',
    },
  ]
})

// Filter Tabs definition
const filterTabs = computed(() => [
  { value: 'all', label: 'Semua', count: allClientsWithStats.value.length },
  { value: 'active', label: 'Aktif Cetak', count: allClientsWithStats.value.filter((c) => c.orderCount > 0).length },
  { value: 'deposit', label: 'Ada Deposit', count: allClientsWithStats.value.filter((c) => c.depositBalance > 0).length },
  { value: 'no_orders', label: 'Belum Order', count: allClientsWithStats.value.filter((c) => c.orderCount === 0).length },
])

// Initials extractor
function getInitials(name?: string): string {
  if (!name) return 'K'
  const clean = String(name).trim()
  if (!clean) return 'K'
  const parts = clean.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'K'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return ((parts[0][0] || '') + (parts[parts.length - 1][0] || '')).toUpperCase() || 'K'
}

function createNewOrder(c: ClientWithStats) {
  router.push(`/order/new?penerbit=${encodeURIComponent(c.nama_penerbit)}`)
}

function viewOrders(c: ClientWithStats) {
  router.push(`/order/list?q=${encodeURIComponent(c.nama_penerbit)}`)
}

function openAddClientModal() {
  newClientForm.value = {
    nama_penerbit: '',
    kontak: '',
    alamat: '',
  }
  showAddModal.value = true
}

async function submitAddClient() {
  const name = newClientForm.value.nama_penerbit.trim()
  if (!name) return

  isSaving.value = true
  try {
    const newClient: Client = {
      nama_penerbit: name,
      kontak: newClientForm.value.kontak.trim(),
      alamat: newClientForm.value.alamat.trim(),
    }

    const idx = customClients.value.findIndex(
      (c) => c.nama_penerbit.trim().toLowerCase() === name.toLowerCase()
    )
    if (idx !== -1) {
      customClients.value[idx] = newClient
    } else {
      customClients.value.unshift(newClient)
    }

    saveLocalClients()
    showAddModal.value = false
  } finally {
    isSaving.value = false
  }
}

async function refreshData() {
  isLoading.value = true
  try {
    const [res] = await Promise.allSettled([
      api.getClients(),
      orderStore.fetchOrders(undefined, true),
      orderStore.fetchKasMasuk(true),
    ])
    if (res.status === 'fulfilled' && res.value.success && res.value.data) {
      fetchedClients.value = res.value.data
    }
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  loadLocalClients()
  if (orderStore.orders.length === 0) {
    orderStore.fetchOrders().catch(() => {})
  }
  if (orderStore.kasMasukList.length === 0) {
    orderStore.fetchKasMasuk().catch(() => {})
  }
  try {
    const res = await api.getClients()
    if (res.success && res.data) {
      fetchedClients.value = res.data
    }
  } catch (err) {
    console.warn('Failed to load client list from GAS:', err)
  }
})
</script>
