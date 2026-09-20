<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <PageHeader
        title="Detail Order"
        :show-back="true"
        back-label="Daftar Order"
        @back="router.push('/order/list')"
      >
        <template #actions>
          <BaseButton variant="secondary" @click="router.push(`/invoice/${orderId}`)" size="sm">
            <template #icon>
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </template>
            Faktur & Cetak
          </BaseButton>
        </template>
      </PageHeader>
    </ion-header>

    <ion-content :fullscreen="true">
      <!-- Loading State -->
      <div v-if="isLoading && !order" class="flex flex-col items-center justify-center py-20 gap-3">
        <ion-spinner name="crescent" class="w-8 h-8 text-red-600"></ion-spinner>
        <p class="text-xs text-slate-400 font-medium">Memuat detail order...</p>
      </div>

      <!-- Not Found / Error State -->
      <div v-else-if="!order" class="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div class="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 class="text-sm font-bold text-slate-800">Order Tidak Ditemukan</h3>
        <p class="text-xs text-slate-500 mt-1 max-w-xs">
          Order <span class="font-mono font-semibold text-slate-700">{{ orderId }}</span> tidak ditemukan dalam sistem.
        </p>
        <div class="flex items-center gap-2 mt-4">
          <button @click="loadData" class="btn-secondary h-8.5 px-3.5 text-xs font-bold cursor-pointer">
            Muat Ulang
          </button>
          <button @click="router.push('/order/list')" class="btn-primary h-8.5 px-3.5 text-xs font-bold cursor-pointer">
            Ke Daftar Order
          </button>
        </div>
      </div>

      <div v-else class="w-full min-h-full pb-28 lg:pb-12 bg-white">

        <!-- 1. ORDER HEADER SUMMARY (Full Edge, border-b) -->
        <div class="w-full px-4 sm:px-6 py-4 border-b border-slate-200 bg-white space-y-2.5">
          <!-- Top Row: Badges & Date -->
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-mono text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded">
              {{ order.id_order }}
            </span>
            <button
              type="button"
              @click="toggleOrderStatus"
              :disabled="isUpdatingStatus"
              class="group inline-flex items-center cursor-pointer transition-transform active:scale-95 disabled:opacity-60"
              :title="order.status_order === 'PROSES' ? 'Klik untuk tandai SELESAI' : 'Klik untuk kembalikan ke PROSES'"
            >
              <StatusBadge
                :status="order.status_order"
                size="xs"
                :loading="isUpdatingStatus"
              />
            </button>
            <StatusBadge :status="sisaTagihan === 0 ? 'LUNAS' : totalMasuk > 0 ? 'DP' : 'BELUM_BAYAR'" size="xs" />
            <span class="text-[11px] text-slate-400 font-medium ml-auto font-mono">
              {{ formatTanggal(order.tanggal) }}
            </span>
          </div>

          <!-- Middle Row: Publisher & Title -->
          <div>
            <h2 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
              {{ order.nama_penerbit }}
            </h2>
            <p class="text-xs text-slate-500 font-medium mt-0.5">
              Buku: <strong class="text-slate-800">{{ order.judul_buku || order.judul_penulis }}</strong>
              <span v-if="order.nama_penulis" class="text-slate-400"> / {{ order.nama_penulis }}</span>
            </p>
          </div>

          <!-- Bottom Row: Clean Total Price Strip -->
          <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span class="text-xs text-slate-500 font-medium">Total Nilai Pekerjaan</span>
            <span class="text-xl sm:text-2xl font-black text-red-600 font-mono tracking-tight">
              {{ formatRupiah(order.total_harga) }}
            </span>
          </div>
        </div>

        <!-- 2. TWO-COLUMN / FULL-EDGE SPLIT (Left: Specs & History, Right: Payment) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 border-b border-slate-200">

          <!-- LEFT COLUMN: Spesifikasi Cetak & Riwayat Kas Masuk (col-span-7) -->
          <div class="lg:col-span-7 border-b lg:border-b-0 lg:border-r border-slate-200">

            <!-- Spesifikasi Cetak -->
            <div class="border-b border-slate-200">
              <SectionHeader title="Spesifikasi Cetak">
                <template #actions>
                  <span class="text-xs font-mono font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                    {{ order.jml_pcs }} pcs
                  </span>
                </template>
              </SectionHeader>
              <div class="grid grid-cols-2 sm:grid-cols-3 bg-slate-200 gap-px">
                <div v-for="spec in specList" :key="spec.label" class="px-4 py-2.5 bg-white">
                  <p class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{{ spec.label }}</p>
                  <p class="text-xs text-slate-800 font-bold mt-0.5 font-mono">{{ spec.value }}</p>
                </div>
              </div>
            </div>

            <!-- Catatan Order (if exists) -->
            <div v-if="order.catatan" class="border-b border-slate-200">
              <SectionHeader title="Catatan Order" />
              <div class="px-4 py-3 text-xs text-slate-700 leading-relaxed bg-amber-50/30">
                {{ order.catatan }}
              </div>
            </div>

            <!-- Riwayat Kas Masuk -->
            <div>
              <SectionHeader title="Riwayat Kas Masuk">
                <template #actions>
                  <button
                    @click="router.push(`/payment/new/${orderId}`)"
                    type="button"
                    class="text-xs text-red-600 hover:text-red-700 font-bold cursor-pointer"
                  >
                    + Catat Bayar
                  </button>
                </template>
              </SectionHeader>

              <!-- Empty State -->
              <div v-if="kasMasukList.length === 0" class="px-4 py-6 text-center text-slate-400 text-xs bg-white font-medium">
                Belum ada catatan pembayaran masuk
              </div>

              <!-- Kas Masuk Items List -->
              <div v-else class="divide-y divide-slate-200 bg-white">
                <div
                  v-for="km in kasMasukList"
                  :key="km.id_kas_masuk"
                  class="px-4 sm:px-6 py-2.5 flex items-center justify-between hover:bg-slate-50/60 transition-colors"
                >
                  <div class="space-y-0.5">
                    <p class="text-slate-900 text-xs font-bold font-mono">{{ formatRupiah(km.nominal) }}</p>
                    <p class="text-slate-500 text-[11px]">{{ km.jenis_pembayaran }} • {{ formatMetode(km.metode) }}</p>
                  </div>
                  <div class="text-right flex flex-col items-end gap-1">
                    <div class="flex items-center gap-2">
                      <a
                        v-if="km.file_id_bukti"
                        :href="`https://drive.google.com/file/d/${km.file_id_bukti}/view`"
                        target="_blank"
                        rel="noopener"
                        class="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/80 px-2 py-0.5 rounded transition-colors cursor-pointer"
                        title="Buka bukti pembayaran di Google Drive"
                      >
                        <span>Lihat Bukti</span>
                        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                      <span v-else class="text-slate-400 text-[10px] italic">Tanpa bukti</span>
                      <StatusBadge :status="km.status_verifikasi" size="xs" />
                    </div>
                    <p class="text-slate-400 text-[10px] font-mono">{{ formatTanggal(km.tanggal) }}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- RIGHT COLUMN: Status Pembayaran & Quick Actions (col-span-5) -->
          <div class="lg:col-span-5 bg-white">
            <div class="lg:sticky lg:top-0 z-10">
              <SectionHeader title="Status Pembayaran">
                <template #actions>
                  <StatusBadge :status="sisaTagihan === 0 ? 'LUNAS' : totalMasuk > 0 ? 'DP' : 'BELUM_BAYAR'" size="xs" />
                </template>
              </SectionHeader>

              <!-- Financial Rows (Divided by clean lines) -->
              <div class="divide-y divide-slate-200 text-xs">
                <div class="px-4 sm:px-6 py-3 flex justify-between items-center">
                  <span class="text-slate-600 font-medium">Total Nilai Order</span>
                  <span class="font-bold text-slate-900 font-mono">{{ formatRupiah(order.total_harga) }}</span>
                </div>
                <div class="px-4 sm:px-6 py-3 flex justify-between items-center">
                  <span class="text-slate-600 font-medium">Total Terbayar</span>
                  <span class="font-bold text-emerald-600 font-mono">{{ formatRupiah(totalMasuk) }}</span>
                </div>
                <div v-if="totalPending > 0" class="px-4 sm:px-6 py-2.5 flex justify-between items-center bg-amber-50/60 text-amber-800 text-[11px]">
                  <span>Menunggu Rekonsiliasi Owner</span>
                  <span class="font-bold font-mono">{{ formatRupiah(totalPending) }}</span>
                </div>
                <div class="px-4 sm:px-6 py-3.5 flex justify-between items-center bg-slate-50">
                  <span class="text-slate-900 font-bold">Sisa Tagihan</span>
                  <span class="font-mono font-black text-base" :class="sisaTagihan > 0 ? 'text-red-600' : 'text-emerald-600'">
                    {{ formatRupiah(sisaTagihan) }}
                  </span>
                </div>
              </div>

              <!-- Desktop Action Buttons -->
              <div class="hidden lg:flex px-4 sm:px-6 py-3.5 border-t border-slate-200 gap-2.5 bg-slate-50/30">
                <button
                  @click="router.push(`/payment/new/${orderId}`)"
                  class="btn-primary flex-1 h-9.5 text-xs font-bold justify-center cursor-pointer"
                >
                  + Catat Bayar
                </button>
                <button
                  @click="kirimWA"
                  type="button"
                  class="btn-primary flex-1 h-9.5 text-xs font-bold justify-center !bg-[#25D366] hover:!bg-[#20bd5a] text-white cursor-pointer flex items-center gap-1.5"
                >
                  <svg class="w-4 h-4 fill-current shrink-0" viewBox="0 0 16 16">
                    <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.655.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.596-6.592 6.596m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.016-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.707 1.916.81 2.049c.098.133 1.39 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
                  </svg>
                  <span>Kirim WA</span>
                </button>
                <button
                  @click="router.push(`/invoice/${orderId}`)"
                  class="btn-secondary h-9.5 text-xs font-bold px-3.5 cursor-pointer"
                >
                  Faktur
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </ion-content>

    <!-- Mobile Fixed Bottom Actions (Full Edge) -->
    <div v-if="order"
         class="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 py-3 bg-white/95 backdrop-blur-md border-t border-slate-200 flex gap-3">
      <button
        @click="router.push(`/payment/new/${orderId}`)"
        class="btn-secondary flex-1 h-10.5 justify-center text-xs font-bold rounded-lg cursor-pointer"
      >
        Catat Bayar
      </button>
      <button
        @click="kirimWA"
        type="button"
        class="btn-primary flex-1 h-10.5 justify-center !bg-[#25D366] hover:!bg-[#20bd5a] text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-2"
      >
        <svg class="w-4 h-4 fill-current shrink-0" viewBox="0 0 16 16">
          <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.655.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.596-6.592 6.596m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.016-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.707 1.916.81 2.049c.098.133 1.39 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
        </svg>
        <span>Kirim Invoice WA</span>
      </button>
    </div>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  IonPage, IonHeader, IonContent, IonSpinner, useIonRouter, onIonViewWillEnter,
} from '@ionic/vue'
import PageHeader from '@shared/components/PageHeader.vue'
import SectionHeader from '@shared/components/SectionHeader.vue'
import { useOrderStore } from '../stores/orders'
import StatusBadge from '@shared/components/StatusBadge.vue'
import BaseButton from '@shared/components/BaseButton.vue'
import { api } from '@shared/api/gasClient'
import type { KasMasuk } from '@shared/types'
import { formatRupiah, formatTanggal, formatMetode, formatFinishing, formatKertas, formatKertasOrder } from '@shared/utils/formatters'

const route = useRoute()
const router = useIonRouter()
const orderStore = useOrderStore()

const orderId = computed(() => ((route.params.id as string) || '').trim())
const order = computed(() => orderStore.orders.find((o) => (o.id_order || '').trim() === orderId.value))
const kasMasukList = ref<KasMasuk[]>([])
const isLoading = ref(true)
const isUpdatingStatus = ref(false)

async function toggleOrderStatus() {
  if (!order.value || isUpdatingStatus.value) return
  const nextStatus = order.value.status_order === 'PROSES' ? 'SELESAI' : 'PROSES'
  isUpdatingStatus.value = true
  try {
    await orderStore.updateOrderStatus(order.value.id_order, nextStatus)
  } finally {
    isUpdatingStatus.value = false
  }
}

const totalMasuk = computed(() =>
  kasMasukList.value
    .filter((k) => (k as any).status_verifikasi !== 'BATAL')
    .reduce((s, k) => s + k.nominal, 0),
)
const totalVerified = computed(() =>
  kasMasukList.value
    .filter((k) => k.status_verifikasi === 'VERIFIED')
    .reduce((s, k) => s + k.nominal, 0),
)
const totalPending = computed(() =>
  kasMasukList.value
    .filter((k) => k.status_verifikasi === 'PENDING')
    .reduce((s, k) => s + k.nominal, 0),
)
const sisaTagihan = computed(() =>
  Math.max(0, (order.value?.total_harga ?? 0) - totalMasuk.value),
)

const specList = computed(() => {
  if (!order.value) return []
  const list = [
    { label: 'Jumlah Oplah', value: `${order.value.jml_pcs} pcs` },
    { label: 'Ukuran Buku', value: order.value.ukuran_custom || order.value.ukuran },
    { label: 'Jenis Kertas', value: formatKertasOrder(order.value) },
    { label: 'Halaman BW', value: `${order.value.cetak_bw} hal` },
    { label: 'Halaman FC', value: `${order.value.cetak_fc} hal` },
    { label: 'Finishing Jilid', value: formatFinishing(order.value.finishing) || '-' },
  ]
  if (order.value.packing_dus_tipe || (order.value.biaya_packing && order.value.biaya_packing > 0)) {
    const boxName = order.value.packing_dus_tipe === 'DUS_BESAR' ? 'Dus Besar' : 'Dus Kecil'
    const qty = order.value.packing_dus_qty || 1
    const cost = order.value.biaya_packing ? ` (${formatRupiah(order.value.biaya_packing)})` : ''
    list.push({ label: 'Packing Dus', value: `${qty}x ${boxName}${cost}` })
  }
  return list
})

function kirimWA() {
  router.push(`/invoice/${orderId.value}`)
}

async function loadData() {
  if (!orderId.value) {
    isLoading.value = false
    return
  }

  isLoading.value = true
  try {
    if (!order.value) {
      await orderStore.ensureOrderLoaded(orderId.value)
    }
    const res = await api.getKasMasuk({ id_order: orderId.value })
    if (res.success && res.data) kasMasukList.value = res.data
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})

onIonViewWillEnter(() => {
  if (!order.value) {
    loadData()
  }
})
</script>
