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
          <BaseButton variant="secondary" @click="router.push(`/order/edit/${orderId}`)" size="sm">
            <template #icon>
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </template>
            Edit Order
          </BaseButton>
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
              :disabled="isUpdatingStatus || order.status_order === 'BATAL'"
              class="group inline-flex items-center cursor-pointer transition-transform active:scale-95 disabled:opacity-60"
              :title="order.status_order === 'PROSES' ? 'Klik untuk tandai SELESAI' : order.status_order === 'BATAL' ? 'Order dibatalkan — tidak dapat diubah status' : 'Klik untuk kembalikan ke PROSES'"
            >
              <StatusBadge
                :status="order.status_order"
                size="xs"
                :loading="isUpdatingStatus"
              />
            </button>
            <StatusBadge :status="sisaTagihan === 0 ? 'LUNAS' : totalMasuk > 0 ? 'DP' : 'BELUM_BAYAR'" :verification="getVerificationStatus(kasMasukList)" size="xs" />
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
            <div v-if="order.catatan" class="mt-2 text-xs text-amber-800 bg-amber-50/90 border border-amber-200/80 rounded px-3 py-1.5 flex items-start gap-1.5">
              <span class="font-bold text-amber-900 shrink-0">Catatan:</span>
              <span>{{ order.catatan }}</span>
            </div>
          </div>

          <!-- Bottom Row: Clean Total Price Strip -->
          <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span class="text-xs text-slate-500 font-medium">Total Nilai Pekerjaan</span>
            <span class="text-xl sm:text-2xl font-black text-red-600 font-mono tracking-tight">
              {{ formatRupiah(order.total_harga) }}
            </span>
          </div>
        </div>

        <!-- Banner Khusus Order Batal (Modern & Refined Card) -->
        <div
          v-if="order.status_order === 'BATAL'"
          class="m-4 sm:m-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-rose-50/70 via-white to-slate-50/50 border border-rose-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div class="flex items-start gap-3.5">
            <div class="w-10 h-10 rounded-xl bg-rose-100/80 text-rose-600 border border-rose-200/60 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h4 class="text-sm font-bold text-slate-900 tracking-tight">Status Pesanan: BATAL</h4>
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200/60">
                  Tidak Diproduksi
                </span>
              </div>
              <p class="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
                Pesanan ini telah dibatalkan dan dihentikan dari antrean produksi. Anda dapat memulihkannya kembali ke proses pengerjaan atau menghapus data order secara permanen dari sistem.
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2.5 shrink-0 self-start md:self-center">
            <button
              type="button"
              @click="restoreOrder"
              :disabled="isUpdatingStatus"
              class="h-9 px-3.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 rounded-xl transition-all cursor-pointer shadow-2xs hover:shadow-xs inline-flex items-center gap-1.5 disabled:opacity-60"
              title="Kembalikan status order ke PROSES"
            >
              <svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Pulihkan ke Proses</span>
            </button>
            <button
              type="button"
              @click="showDeleteModal = true"
              :disabled="isDeleting"
              class="h-9 px-4 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl transition-all cursor-pointer shadow-xs shadow-rose-600/25 inline-flex items-center gap-1.5 disabled:opacity-60"
              title="Hapus data order secara permanen dari sistem"
            >
              <svg class="w-3.5 h-3.5 text-rose-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Hapus Permanen</span>
            </button>
          </div>
        </div>

        <!-- 2. TWO-COLUMN / FULL-EDGE SPLIT (Left: Specs & History, Right: Payment) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 border-b border-slate-200">

          <!-- LEFT COLUMN: Spesifikasi Cetak & Riwayat Kas Masuk (col-span-7) -->
          <div class="lg:col-span-7 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col">

            <!-- Spesifikasi Cetak Header (Line 0: h-9 = 36px) -->
            <SectionHeader title="Spesifikasi Cetak">
              <template #actions>
                <span class="text-xs font-mono font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                  {{ order.jml_pcs }} pcs
                </span>
              </template>
            </SectionHeader>

            <!-- Spesifikasi Cetak Grid (Mobile: 2 cols x 3 rows pas; Desktop: 3 cols x 2 rows, lg:h-[48px]) -->
            <div class="grid grid-cols-2 sm:grid-cols-3 bg-slate-200 gap-px border-b border-slate-200">
              <div v-for="spec in specList" :key="spec.label" class="px-4 py-2 lg:h-[48px] bg-white flex flex-col justify-center">
                <p class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider leading-none">{{ spec.label }}</p>
                <p class="text-xs text-slate-800 font-bold mt-1 font-mono leading-tight truncate" :title="spec.value">{{ spec.value }}</p>
              </div>
            </div>

            <!-- Row 3: Riwayat Kas Masuk Header (Line 3: h-10 = 40px) -->
            <div class="h-10 px-[8px] sm:px-[15px] lg:px-4 bg-slate-50/75 border-b border-slate-200 flex items-center justify-between">
              <span class="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Riwayat Kas Masuk
              </span>
              <button
                @click="router.push(`/payment/new/${orderId}`)"
                type="button"
                :disabled="isLunas || order.status_order === 'BATAL'"
                class="text-xs font-bold transition-colors"
                :class="(isLunas || order.status_order === 'BATAL') ? 'text-slate-300 cursor-not-allowed pointer-events-none' : 'text-red-600 hover:text-red-700 cursor-pointer'"
                :title="order.status_order === 'BATAL' ? 'Order dibatalkan' : isLunas ? 'Pesanan sudah lunas' : '+ Catat Bayar'"
              >
                + Catat Bayar
              </button>
            </div>

            <!-- Row 4: Empty State or Payment Items List (Line 4: lg:h-[60px] or dynamic) -->
            <div v-if="kasMasukList.length === 0" class="px-4 py-3.5 lg:h-[60px] flex items-center justify-center text-center text-slate-400 text-xs bg-white font-medium">
              Belum ada catatan pembayaran masuk
            </div>
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
                      v-if="km.file_id_bukti || km.link_bukti"
                      :href="km.link_bukti || (km.file_id_bukti && km.file_id_bukti.startsWith('http') ? km.file_id_bukti : `https://drive.google.com/file/d/${km.file_id_bukti}/view`)"
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

          <!-- RIGHT COLUMN: Status Pembayaran & Quick Actions (col-span-5) -->
          <div class="lg:col-span-5 bg-white flex flex-col">
            <!-- Line 0: Header (h-9 = 36px) -->
            <SectionHeader title="Status Pembayaran">
              <template #actions>
                <StatusBadge :status="sisaTagihan === 0 ? 'LUNAS' : totalMasuk > 0 ? 'DP' : 'BELUM_BAYAR'" :verification="getVerificationStatus(kasMasukList)" size="xs" />
              </template>
            </SectionHeader>

            <!-- Line 1: Total Nilai Order (lg:h-[48px]) -->
            <div class="px-4 sm:px-6 py-2 lg:h-[48px] flex justify-between items-center border-b border-slate-200 bg-white">
              <span class="text-slate-600 font-medium text-xs">Total Nilai Order</span>
              <span class="font-bold text-slate-900 font-mono text-xs">{{ formatRupiah(order.total_harga) }}</span>
            </div>

            <!-- Line 2: Total Terbayar (lg:h-[48px]) -->
            <div class="px-4 sm:px-6 py-2 lg:h-[48px] flex justify-between items-center border-b border-slate-200 bg-white">
              <div class="flex flex-col">
                <span class="text-slate-600 font-medium text-xs">Total Terbayar</span>
                <span v-if="totalPending > 0" class="text-[10px] text-amber-700 font-medium">Menunggu Owner: {{ formatRupiah(totalPending) }}</span>
              </div>
              <span class="font-bold text-emerald-600 font-mono text-xs">{{ formatRupiah(totalMasuk) }}</span>
            </div>

            <!-- Line 3: Sisa Tagihan (h-10 = 40px) -->
            <div class="px-4 sm:px-6 h-10 flex justify-between items-center bg-slate-50 border-b border-slate-200">
              <span class="text-slate-900 font-bold text-xs">Sisa Tagihan</span>
              <span class="font-mono font-black text-sm sm:text-base" :class="sisaTagihan > 0 ? 'text-red-600' : 'text-emerald-600'">
                {{ formatRupiah(sisaTagihan) }}
              </span>
            </div>

            <!-- Line 4: Desktop Action Buttons (lg:h-[60px]) -->
            <div class="hidden lg:flex px-4 sm:px-6 h-[60px] items-center gap-2.5 bg-slate-50/30">
              <button
                @click="router.push(`/payment/new/${orderId}`)"
                :disabled="isLunas || order.status_order === 'BATAL'"
                class="btn-primary flex-1 h-9 text-xs font-bold justify-center"
                :class="(isLunas || order.status_order === 'BATAL') ? '!bg-slate-100 !text-slate-400 !border-slate-200 !cursor-not-allowed !shadow-none pointer-events-none' : 'cursor-pointer'"
                :title="order.status_order === 'BATAL' ? 'Order dibatalkan' : isLunas ? 'Pesanan sudah lunas' : '+ Catat Bayar'"
              >
                + Catat Bayar
              </button>
              <button
                @click="kirimWA"
                type="button"
                class="btn-primary flex-1 h-9 text-xs font-bold justify-center !bg-[#25D366] hover:!bg-[#20bd5a] text-white cursor-pointer flex items-center gap-1.5"
              >
                <svg class="w-4 h-4 fill-current shrink-0" viewBox="0 0 16 16">
                  <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.655.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.596-6.592 6.596m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.016-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.707 1.916.81 2.049c.098.133 1.39 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
                </svg>
                <span>Kirim WA</span>
              </button>
              <button
                @click="router.push(`/invoice/${orderId}`)"
                class="btn-secondary h-9 text-xs font-bold px-3.5 cursor-pointer"
              >
                Faktur
              </button>
            </div>

            <!-- Subtle, discreet Cancel button at bottom (tidak mencolok) -->
            <div v-if="order.status_order !== 'BATAL'" class="px-4 sm:px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <span class="text-xs text-slate-400">Pesanan keliru atau ingin dibatalkan?</span>
              <button
                type="button"
                @click="showCancelModal = true"
                class="px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 hover:border-rose-200 transition-all cursor-pointer"
              >
                Batalkan Pesanan
              </button>
            </div>
          </div>

        </div>

      </div>
    </ion-content>

    <!-- Mobile Fixed Bottom Actions (Full Edge) -->
    <div v-if="order"
         class="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 py-3 bg-white/95 backdrop-blur-md border-t border-slate-200 flex gap-2.5">
      <template v-if="order.status_order === 'BATAL'">
        <button
          type="button"
          @click="restoreOrder"
          :disabled="isUpdatingStatus"
          class="btn-secondary flex-1 h-10.5 justify-center text-xs font-bold rounded-lg cursor-pointer"
        >
          Pulihkan
        </button>
        <button
          type="button"
          @click="showDeleteModal = true"
          :disabled="isDeleting"
          class="flex-1 h-10.5 justify-center text-xs font-bold rounded-lg text-white bg-rose-600 hover:bg-rose-700 cursor-pointer flex items-center justify-center gap-2 shadow-xs"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Hapus Permanen
        </button>
      </template>
      <template v-else>
        <button
          @click="router.push(`/payment/new/${orderId}`)"
          :disabled="isLunas"
          class="btn-secondary flex-1 h-10.5 justify-center text-xs font-bold rounded-lg"
          :class="isLunas ? '!bg-slate-100 !text-slate-400 !border-slate-200 !cursor-not-allowed pointer-events-none' : 'cursor-pointer'"
          :title="isLunas ? 'Pesanan sudah lunas' : 'Catat Bayar'"
        >
          Catat Bayar
        </button>
        <button
          @click="kirimWA"
          type="button"
          class="btn-primary flex-1 h-10.5 justify-center !bg-[#25D366] hover:!bg-[#20bd5a] text-white text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-2"
        >
          <svg class="w-4 h-4 fill-current shrink-0" viewBox="0 0 16 16">
            <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.655.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.596-6.592 6.596m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.016-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.707 1.916.81 2.049c.098.133 1.39 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
          </svg>
          <span>Kirim WA</span>
        </button>
      </template>
    </div>

    <!-- Confirm Modal: Batalkan Order -->
    <ConfirmModal
      v-model="showCancelModal"
      title="Batalkan Pesanan Ini?"
      type="warning"
      confirm-text="Ya, Batalkan"
      cancel-text="Kembali"
      :loading="isCanceling"
      @confirm="handleConfirmCancel"
    >
      <div class="space-y-3 text-left">
        <!-- Order Summary Card -->
        <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ID Pesanan</span>
            <span class="font-mono text-xs font-bold text-slate-800">{{ order?.id_order }}</span>
          </div>
          <div class="text-right">
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Penerbit</span>
            <span class="text-xs font-semibold text-slate-700 truncate max-w-[160px] inline-block">{{ order?.nama_penerbit }}</span>
          </div>
        </div>

        <p class="text-xs text-slate-500 text-center leading-relaxed px-1">
          Pesanan ini akan ditandai <strong class="text-amber-700 font-bold">BATAL</strong> dan dihentikan dari seluruh proses produksi.
        </p>

        <!-- Warning info if payments exist -->
        <div v-if="kasMasukList.length > 0" class="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-2.5">
          <svg class="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div class="text-xs text-amber-900 leading-relaxed">
            <span class="font-bold">Perhatian:</span> Order ini telah mencatat kas masuk sebesar <span class="font-mono font-bold text-amber-950">{{ formatRupiah(totalMasuk) }}</span>.
          </div>
        </div>
      </div>
    </ConfirmModal>

    <!-- Confirm Modal: Hapus Permanen Order (Setelah Batal) -->
    <ConfirmModal
      v-model="showDeleteModal"
      title="Hapus Order Permanen?"
      type="danger"
      confirm-text="Ya, Hapus Permanen"
      cancel-text="Batal"
      :loading="isDeleting"
      @confirm="handleConfirmDelete"
    >
      <div class="space-y-3 text-left">
        <!-- Order Summary Card -->
        <div class="p-3 rounded-xl bg-rose-50/60 border border-rose-200/80 flex items-center justify-between">
          <div>
            <span class="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">ID Pesanan</span>
            <span class="font-mono text-xs font-bold text-rose-950">{{ order?.id_order }}</span>
          </div>
          <div class="text-right">
            <span class="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">Total Tagihan</span>
            <span class="font-mono text-xs font-bold text-rose-700">{{ formatRupiah(order?.total_harga || 0) }}</span>
          </div>
        </div>

        <p class="text-xs text-slate-500 text-center leading-relaxed px-1">
          Data pesanan <strong class="text-slate-800 font-semibold">{{ order?.nama_penerbit }}</strong> akan dihapus permanen dari sistem dan Google Sheets. Tindakan ini <strong class="text-rose-600 font-semibold">tidak dapat dibatalkan</strong>.
        </p>
      </div>
    </ConfirmModal>

    <!-- Toast Notification -->
    <ion-toast
      :is-open="toastOpen"
      :message="toastMsg"
      :duration="3000"
      position="top"
      :color="toastColor"
      @didDismiss="toastOpen = false"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  IonPage, IonHeader, IonContent, IonSpinner, IonToast, useIonRouter, onIonViewWillEnter,
} from '@ionic/vue'
import PageHeader from '@shared/components/PageHeader.vue'
import SectionHeader from '@shared/components/SectionHeader.vue'
import ConfirmModal from '@shared/components/ConfirmModal.vue'
import { useOrderStore } from '../stores/orders'
import StatusBadge from '@shared/components/StatusBadge.vue'
import BaseButton from '@shared/components/BaseButton.vue'
import { api } from '@shared/api/gasClient'
import type { KasMasuk } from '@shared/types'
import { formatRupiah, formatTanggal, formatMetode, formatFinishing, formatKertas, formatKertasOrder, getVerificationStatus } from '@shared/utils/formatters'

const route = useRoute()
const router = useIonRouter()
const orderStore = useOrderStore()

const orderId = computed(() => ((route.params.id as string) || '').trim())
const order = computed(() => orderStore.orders.find((o) => (o.id_order || '').trim() === orderId.value))
const kasMasukList = ref<KasMasuk[]>([])
const isLoading = ref(true)
const isUpdatingStatus = ref(false)

const showCancelModal = ref(false)
const showDeleteModal = ref(false)
const isCanceling = ref(false)
const isDeleting = ref(false)

const toastOpen = ref(false)
const toastMsg = ref('')
const toastColor = ref('success')

function showToast(msg: string, color: 'success' | 'warning' | 'danger' = 'success') {
  toastMsg.value = msg
  toastColor.value = color
  toastOpen.value = true
}

async function handleConfirmCancel() {
  if (!order.value || isCanceling.value) return
  isCanceling.value = true
  try {
    const res = await orderStore.updateOrderStatus(order.value.id_order, 'BATAL')
    if (res?.success) {
      showCancelModal.value = false
      showToast(`Order ${order.value.id_order} berhasil dibatalkan.`, 'warning')
    } else {
      showToast(res?.error || 'Gagal membatalkan order', 'danger')
    }
  } catch (err: any) {
    showToast(err?.message || 'Terjadi kesalahan saat membatalkan order', 'danger')
  } finally {
    isCanceling.value = false
  }
}

async function restoreOrder() {
  if (!order.value || isUpdatingStatus.value) return
  isUpdatingStatus.value = true
  try {
    const res = await orderStore.updateOrderStatus(order.value.id_order, 'PROSES')
    if (res?.success) {
      showToast(`Order ${order.value.id_order} berhasil dipulihkan ke status PROSES.`, 'success')
    } else {
      showToast(res?.error || 'Gagal memulihkan status order', 'danger')
    }
  } catch (err: any) {
    showToast(err?.message || 'Terjadi kesalahan saat memulihkan order', 'danger')
  } finally {
    isUpdatingStatus.value = false
  }
}

async function handleConfirmDelete() {
  if (!order.value || isDeleting.value) return
  if (totalMasuk.value > 0) {
    showToast(`Tidak dapat menghapus order permanen karena memiliki catatan uang masuk sebesar ${formatRupiah(totalMasuk.value)}. Batalkan dulu transaksi kasnya di Buku Kas.`, 'danger')
    showDeleteModal.value = false
    return
  }
  isDeleting.value = true
  const idToDelete = order.value.id_order
  try {
    const res = await orderStore.deleteOrder(idToDelete, true)
    if (res?.success) {
      showDeleteModal.value = false
      showToast(`Order ${idToDelete} berhasil dihapus permanen.`, 'success')
      setTimeout(() => {
        router.push('/order/list')
      }, 500)
    } else {
      showToast(res?.error || 'Gagal menghapus order', 'danger')
    }
  } catch (err: any) {
    showToast(err?.message || 'Terjadi kesalahan saat menghapus order', 'danger')
  } finally {
    isDeleting.value = false
  }
}

async function toggleOrderStatus() {
  if (!order.value || isUpdatingStatus.value) return
  if (order.value.status_order === 'BATAL') return
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
const isLunas = computed(() => Boolean(order.value && sisaTagihan.value === 0))

const specList = computed(() => {
  if (!order.value) return []
  let finishingVal = formatFinishing(order.value.finishing) || '-'
  if (order.value.packing_dus_tipe || (order.value.biaya_packing && order.value.biaya_packing > 0)) {
    const boxName = order.value.packing_dus_tipe === 'DUS_BESAR' ? 'Dus Bsr' : 'Dus Kcl'
    const qty = order.value.packing_dus_qty || 1
    finishingVal += ` • ${qty}x ${boxName}`
  }

  return [
    { label: 'Jumlah Oplah', value: `${order.value.jml_pcs} pcs` },
    { label: 'Ukuran Buku', value: order.value.ukuran_custom || order.value.ukuran },
    { label: 'Jenis Kertas', value: formatKertasOrder(order.value) },
    { label: 'Halaman BW', value: `${order.value.cetak_bw} hal` },
    { label: 'Halaman FC', value: `${order.value.cetak_fc} hal` },
    { label: order.value.packing_dus_tipe ? 'Finishing & Packing' : 'Finishing Jilid', value: finishingVal },
  ]
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
    if (res.success && res.data) {
      kasMasukList.value = res.data
      orderStore.mergeKasMasuk(res.data)
    }
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})

onIonViewWillEnter(() => {
  loadData()
})
</script>
