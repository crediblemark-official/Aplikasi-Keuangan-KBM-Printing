<template>
  <ion-page>
    <ion-header class="ion-no-border no-print">
      <PageHeader
        :show-back="true"
        back-label="Detail Order"
        @back="orderId ? router.push(`/order/${orderId}`) : router.push('/order/list')"
      >

        <template #title>
          <div class="flex items-center gap-2 min-w-0">
            <span class="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0"></span>
            <span class="text-xs sm:text-sm font-bold text-slate-900 font-mono tracking-tight truncate">{{ nomorInvoice || 'Faktur Penjualan' }}</span>
            <span
              v-if="order"
              class="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0"
              :class="sisaTagihan === 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : totalMasuk > 0 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-rose-50 text-rose-700 border border-rose-200'"
            >
              {{ sisaTagihan === 0 ? 'LUNAS' : totalMasuk > 0 ? 'DP MASUK' : 'BELUM BAYAR' }}
            </span>
          </div>
        </template>

        <template #actions>
          <div v-if="order" class="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <!-- Setting Button: Icon only on mobile, with text on desktop -->
            <button
              @click="openSettingModal"
              class="btn-secondary !h-8.5 sm:!h-9 !w-8.5 sm:!w-auto !p-0 sm:!px-3 !rounded-xl !text-xs !font-bold inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-xs active:scale-95 transition-all"
              title="Edit Profil Percetakan & Rekening"
            >
              <svg class="w-4 h-4 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span class="hidden sm:inline">Info Invoice</span>
            </button>

            <!-- Export PDF Button: Icon only on mobile, with text on desktop -->
            <button
              @click="printInvoice"
              :disabled="isPrinting"
              class="btn-secondary !h-8.5 sm:!h-9 !w-8.5 sm:!w-auto !p-0 sm:!px-3.5 !rounded-xl !text-xs !font-bold inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-xs active:scale-95 transition-all"
              title="Export PDF Faktur"
            >
              <ion-spinner v-if="isPrinting" name="crescent" class="w-3.5 h-3.5 text-red-600"></ion-spinner>
              <template v-else>
                <svg class="w-4 h-4 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span class="hidden sm:inline">Export PDF</span>
              </template>
            </button>

            <!-- WhatsApp Button: Icon only on mobile, with text on desktop -->
            <button
              @click="sendWhatsApp"
              :disabled="isSendingWA"
              class="btn-primary !h-8.5 sm:!h-9 !w-8.5 sm:!w-auto !p-0 sm:!px-3.5 !rounded-xl !text-xs !font-bold inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-xs active:scale-95 transition-all"
              title="Kirim Faktur via WhatsApp"
            >
              <ion-spinner v-if="isSendingWA" name="crescent" class="w-3.5 h-3.5 text-white"></ion-spinner>
              <template v-else>
                <svg class="w-4 h-4 text-white shrink-0 fill-current" viewBox="0 0 16 16">
                  <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.655.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.596-6.592 6.596m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.016-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.707 1.916.81 2.049c.098.133 1.39 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
                </svg>
                <span class="hidden sm:inline">Kirim WhatsApp</span>
              </template>
            </button>
          </div>
        </template>
      </PageHeader>
    </ion-header>

    <ion-content :fullscreen="true">
      <!-- Loading State -->
      <div v-if="isLoading && !order" class="flex flex-col items-center justify-center py-20 gap-3">
        <ion-spinner name="crescent" class="w-8 h-8 text-indigo-600"></ion-spinner>
        <p class="text-xs text-slate-400 font-medium">Memuat data faktur / invoice...</p>
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

      <div v-else class="invoice-outer-container w-full min-h-full py-3 sm:py-6 pb-32 lg:pb-12 bg-slate-100/90 overflow-x-auto print:bg-white print:p-0 print:m-0 print:w-full print:min-h-0">

        <!-- MODERN INVOICE PAPER (Horizontal scrollable with authentic full preview) -->
        <div class="invoice-paper-wrapper w-max min-w-[720px] max-w-[840px] mx-auto px-4 sm:px-6 print:min-w-0 print:max-w-full print:w-full print:p-0 print:m-0">
          <div
            id="invoice-paper"
            class="bg-white shadow-xl rounded-[24px] sm:rounded-[28px] border border-slate-100 p-8 sm:p-12 md:p-14 relative overflow-hidden text-slate-800 print:shadow-none print:border-none print:rounded-none print:!p-[14mm_16mm] print:max-w-full print:w-full print:m-0 print:bg-white print:overflow-visible print:break-inside-avoid"
          >
            <!-- Background Fluid Organic Shapes (Hidden during print to prevent raster blur) -->
            <div class="no-print absolute -top-16 -right-16 pointer-events-none w-96 h-96 rounded-full bg-gradient-to-bl from-red-100/60 via-rose-50/30 to-transparent blur-2xl z-0 select-none"></div>
            <div class="no-print absolute -bottom-20 -right-20 pointer-events-none w-96 h-96 rounded-full bg-gradient-to-tl from-red-100/50 via-rose-50/30 to-transparent blur-3xl z-0 select-none"></div>

            <!-- TOP HEADER: Logo (Left) & Metadata (Right) -->
            <div class="relative z-10 flex justify-between items-start gap-6 pb-8 border-b border-slate-100/90">
              <!-- Left: KBM Official Brand Logo -->
              <div class="flex items-center gap-3.5">
                <KbmLogo size="lg" variant="full" :subtitle="company.alamat || 'Digital & Offset Book Printing'" />
              </div>

              <!-- Right: Aligned Metadata in Rich Red Accent -->
              <div class="text-right w-auto text-xs font-mono space-y-1 shrink-0">
                <div class="flex justify-end gap-2.5 items-center whitespace-nowrap">
                  <span class="font-extrabold uppercase tracking-wider text-red-700 text-xs">INVOICE</span>
                  <span class="font-black text-red-700 text-sm sm:text-base tracking-tight">{{ nomorInvoice }}</span>
                  <span
                    class="ml-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider font-sans"
                    :class="sisaTagihan === 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' : totalMasuk > 0 ? 'bg-amber-50 text-amber-700 border border-amber-300' : 'bg-rose-50 text-rose-700 border border-rose-300'"
                  >
                    {{ sisaTagihan === 0 ? 'LUNAS' : totalMasuk > 0 ? 'DP' : 'BELUM BAYAR' }}
                  </span>
                </div>
                <div class="flex justify-end gap-3 text-slate-500 whitespace-nowrap">
                  <span class="uppercase tracking-wide font-semibold text-slate-500 text-[11px]">ISSUED</span>
                  <span class="font-bold text-slate-800 text-[11px]">{{ formatTanggal(order.tanggal) }}</span>
                </div>
                <div class="flex justify-end gap-3 text-slate-500 whitespace-nowrap">
                  <span class="uppercase tracking-wide font-semibold text-slate-500 text-[11px]">DELIVERY DATE</span>
                  <span class="font-bold text-slate-800 text-[11px]">{{ formatTanggal(order.tanggal) }}</span>
                </div>
                <div class="flex justify-end gap-3 text-slate-500 whitespace-nowrap">
                  <span class="uppercase tracking-wide font-semibold text-slate-500 text-[11px]">DUE DATE</span>
                  <span class="font-bold text-slate-800 text-[11px]">{{ formatTanggal(order.tanggal) }}</span>
                </div>
              </div>
            </div>

            <!-- TO / FROM TWO-COLUMN ROW -->
            <div class="relative z-10 grid grid-cols-2 gap-8 py-6 text-xs">
              <!-- Left: To (Customer) -->
              <div>
                <p class="text-slate-400 font-medium mb-1.5 uppercase tracking-wider text-[10px]">To</p>
                <h3 class="text-sm sm:text-base font-extrabold text-slate-900">
                  {{ order.nama_penerbit }}
                </h3>
                <div class="mt-1.5 text-slate-600 space-y-0.5 leading-relaxed">
                  <p class="font-bold text-slate-800">
                    Buku: {{ order.judul_buku || order.judul_penulis }}
                  </p>
                  <p v-if="order.nama_penulis" class="text-slate-500">
                    Penulis: {{ order.nama_penulis }}
                  </p>
                  <p>{{ order.alamat_penerbit || 'Yogyakarta, Indonesia' }}</p>
                  <p v-if="order.kontak_penerbit" class="text-slate-500 font-mono text-[11px]">
                    Kontak: {{ order.kontak_penerbit }}
                  </p>
                  <p class="text-[11px] text-slate-400 font-mono mt-1">
                    Tax number: ID{{ (order.id_order || '001').replace(/[^0-9]/g, '').padEnd(9, '0') }}
                  </p>
                </div>
              </div>

              <!-- Right: From (Vendor) -->
              <div class="text-right">
                <p class="text-slate-400 font-medium mb-1.5 uppercase tracking-wider text-[10px]">From</p>
                <h3 class="text-sm sm:text-base font-extrabold text-red-700">
                  {{ company.nama }} {{ company.badan_usaha }}
                </h3>
                <div class="mt-1.5 text-slate-600 space-y-0.5 leading-relaxed">
                  <p>{{ company.alamat }}</p>
                  <p>{{ company.kota_kodepos }}</p>
                  <p>{{ company.negara }}</p>
                  <p class="text-[11px] text-slate-400 font-mono mt-1">
                    Tax number: {{ company.tax_number }}
                  </p>
                </div>
              </div>
            </div>

            <!-- ITEM TABLE WITH ROUNDED CAPSULE HEADER -->
            <div class="relative z-10 mt-2">
              <!-- Header Capsule Pill -->
              <div class="bg-gradient-to-r from-red-700 via-red-600 to-rose-600 text-white rounded-xl px-5 sm:px-6 py-2.5 flex items-center justify-between text-xs font-bold tracking-wide shadow-sm">
                <span class="flex-1 min-w-0">Description</span>
                <span class="w-24 text-right">Price</span>
                <span class="w-20 text-center">Quantity</span>
                <span class="w-28 text-right">Total</span>
                <span class="w-6 text-right opacity-0 no-print">#</span>
              </div>

              <!-- Items List -->
              <div class="divide-y divide-slate-100 px-2 sm:px-3 text-xs">
                <div
                  v-for="item in invoiceItems"
                  :key="item.sl"
                  class="py-3.5 flex items-center justify-between gap-2 hover:bg-slate-50/60 transition-colors rounded-lg px-2 sm:px-3"
                >
                  <div class="flex-1 min-w-0 pr-4">
                    <p class="font-bold text-slate-900 text-xs sm:text-sm">
                      {{ item.title }}
                    </p>
                    <p class="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      {{ item.desc }}
                    </p>
                  </div>
                  <span class="w-24 text-right font-mono font-medium text-slate-700">
                    {{ formatRupiah(item.rate) }}
                  </span>
                  <span class="w-20 text-center font-mono font-medium text-slate-800">
                    {{ item.qty }} pcs
                  </span>
                  <span class="w-28 text-right font-mono font-bold text-slate-900">
                    {{ formatRupiah(item.amount) }}
                  </span>
                  <!-- Action dots icon like reference -->
                  <span class="w-6 text-right text-slate-300 no-print flex justify-end">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </span>
                </div>
              </div>

              <!-- Refined specification guarantee seal -->
              <div class="mt-3 py-2 px-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70 flex items-center justify-between text-[11px] text-slate-600 gap-2">
                <div class="flex items-center gap-2 min-w-0">
                  <svg class="w-4 h-4 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="font-medium text-slate-700 leading-snug">Kualitas cetakan dijamin rapi sesuai standar buku penerbit KBM Printing</span>
                </div>
                <span class="font-mono text-[10px] text-slate-400 font-bold tracking-wider uppercase shrink-0">QC PASSED</span>
              </div>
            </div>

            <!-- TOTALS & CALCULATION (Right aligned) -->
            <div class="relative z-10 flex justify-end mt-6">
              <div class="w-64 space-y-1.5 text-xs">
                <div class="flex justify-between items-center py-0.5">
                  <span class="font-bold text-slate-600">Subtotal</span>
                  <span class="font-mono font-bold text-slate-900">{{ formatRupiah(order.total_harga) }}</span>
                </div>
                <div class="border-t border-slate-100 pt-1.5 flex justify-between items-center">
                  <span class="font-extrabold text-xs sm:text-sm text-red-700">Amount due</span>
                  <span class="font-mono font-black text-base sm:text-lg text-slate-900">{{ formatRupiah(order.total_harga) }}</span>
                </div>

                <!-- DP & Sisa Tagihan if partial payment -->
                <div v-if="totalMasuk > 0" class="pt-1.5 border-t border-slate-100 space-y-1">
                  <div class="flex justify-between items-center text-emerald-700 font-medium">
                    <span>{{ sisaTagihan === 0 ? 'Sudah Dibayar (Lunas)' : 'Sudah Dibayar (DP)' }}</span>
                    <span class="font-mono font-bold">- {{ formatRupiah(totalMasuk) }}</span>
                  </div>
                  <div v-if="sisaTagihan > 0" class="flex justify-between items-center text-rose-600 font-bold">
                    <span>Sisa Tagihan</span>
                    <span class="font-mono text-sm font-black">{{ formatRupiah(sisaTagihan) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- BOTTOM SECTION: Notes, Terms, QR Code, and Bank Info -->
            <div class="relative z-10 mt-12 pt-8 border-t border-slate-100 grid grid-cols-12 gap-8 items-end">
              <!-- Left: Notes, Terms & QR Info (col-span-7) -->
              <div class="col-span-7 space-y-4">
                <!-- Notes & comments -->
                <div>
                  <h4 class="text-xs font-extrabold text-slate-900 mb-0.5">
                    Notes & comments
                  </h4>
                  <p class="text-[11px] text-slate-500 leading-relaxed">
                    {{ order.catatan || company.default_notes }}
                  </p>
                </div>

                <!-- Terms & conditions -->
                <div>
                  <h4 class="text-xs font-extrabold text-slate-900 mb-0.5">
                    Terms & conditions
                  </h4>
                  <p class="text-[11px] text-slate-500 leading-relaxed">
                    {{ company.terms_conditions }}
                  </p>
                </div>

                <!-- QR Code & Bank Reference -->
                <div class="flex items-center gap-3.5 pt-2">
                  <!-- Modern QR Code SVG -->
                  <div class="w-14 h-14 rounded-xl border border-slate-200 bg-slate-50 p-1 flex-shrink-0 flex items-center justify-center">
                    <svg class="w-full h-full text-slate-800" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14 2h2v4h-2v-4zm-4-4h4v2h-4v-2zm2 4h-2v2h2v-2zm4-2h2v2h-2v-2zm-4 4h2v2h-2v-2z" />
                    </svg>
                  </div>
                  <div class="text-[11px] text-slate-600 font-mono space-y-0.5">
                    <p><span class="text-slate-400 font-sans">No. Rekening :</span> <span class="font-bold text-slate-800">{{ company.bank_name }} {{ company.no_rekening }}</span></p>
                    <p><span class="text-slate-400 font-sans">A.N. Rekening :</span> <span class="font-semibold text-slate-800 font-sans">{{ company.atas_nama }}</span></p>
                    <p><span class="text-slate-400 font-sans">Bank ref :</span> {{ nomorInvoice }}</p>
                  </div>
                </div>
              </div>

              <!-- Right: Contact & Support (col-span-5) -->
              <div class="col-span-5 text-right text-xs text-slate-600 font-medium space-y-1">
                <p class="text-red-700 font-bold text-sm leading-tight">{{ company.email }}</p>
                <p class="font-mono text-slate-800 font-bold whitespace-nowrap">{{ company.no_telp }}</p>
                <p class="text-slate-400 text-[10px] whitespace-nowrap">{{ company.website }}</p>
              </div>
            </div>

          </div>
        </div>

        <!-- SETTING DRAWER (Edit Profil Faktur & Rekening) -->
        <teleport to="body">
          <div
            v-if="isSettingModalOpen"
            class="fixed inset-0 z-[9999] flex justify-end no-print"
            @keydown.esc="isSettingModalOpen = false"
          >
            <!-- Backdrop Overlay with Tailwind Transition -->
            <transition
              enter-active-class="transition-opacity duration-300 ease-out"
              enter-from-class="opacity-0"
              enter-to-class="opacity-100"
              leave-active-class="transition-opacity duration-200 ease-in"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0"
              appear
            >
              <div
                class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
                @click="isSettingModalOpen = false"
              ></div>
            </transition>

            <!-- Drawer Side Panel (Right Slide-Over with Tailwind Transition) -->
            <transition
              enter-active-class="transition-transform duration-300 ease-out"
              enter-from-class="translate-x-full"
              enter-to-class="translate-x-0"
              leave-active-class="transition-transform duration-200 ease-in"
              leave-from-class="translate-x-0"
              leave-to-class="translate-x-full"
              appear
            >
              <div
                class="relative z-10 w-full max-w-lg sm:max-w-xl h-full bg-white shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden"
              >
                <!-- Drawer Header -->
                <div class="px-5 sm:px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-indigo-50 text-[#4338ca] flex items-center justify-center shadow-xs">
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 class="text-sm sm:text-base font-bold text-slate-800">Pengaturan Info Faktur & Rekening</h3>
                      <p class="text-[11px] text-slate-500">Sesuaikan profil percetakan, nomor rekening, dan ketentuan invoice.</p>
                    </div>
                  </div>
                  <button
                    @click="isSettingModalOpen = false"
                    type="button"
                    class="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <!-- Drawer Body (Scrollable Form) -->
                <div class="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
                  <!-- Profil Percetakan -->
                  <div class="space-y-3">
                    <p class="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-2">
                      <span class="w-1.5 h-1.5 rounded-full bg-[#4338ca]"></span>
                      <span>1. Profil Vendor / Percetakan (From)</span>
                    </p>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label class="form-label mb-1">Nama Percetakan</label>
                        <input v-model="editForm.nama" class="form-input text-xs" placeholder="KBM Printing" />
                      </div>
                      <div>
                        <label class="form-label mb-1">Badan Usaha / Tipe</label>
                        <input v-model="editForm.badan_usaha" class="form-input text-xs" placeholder="Corporation / CV" />
                      </div>
                      <div class="sm:col-span-2">
                        <label class="form-label mb-1">Alamat Workshop</label>
                        <input v-model="editForm.alamat" class="form-input text-xs" placeholder="Jl. Percetakan No. 8" />
                      </div>
                      <div>
                        <label class="form-label mb-1">Kota & Kode Pos</label>
                        <input v-model="editForm.kota_kodepos" class="form-input text-xs" placeholder="55281 Sleman, D.I. Yogyakarta" />
                      </div>
                      <div>
                        <label class="form-label mb-1">Tax Number / NPWP</label>
                        <input v-model="editForm.tax_number" class="form-input text-xs" placeholder="94-1234567" />
                      </div>
                    </div>
                  </div>

                  <!-- Data Rekening Bank -->
                  <div class="space-y-3 pt-2">
                    <p class="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-2">
                      <span class="w-1.5 h-1.5 rounded-full bg-[#4338ca]"></span>
                      <span>2. Data Rekening Bank Pembayaran</span>
                    </p>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label class="form-label mb-1">Nama Bank</label>
                        <input v-model="editForm.bank_name" class="form-input text-xs" placeholder="BCA / Mandiri / BRI" />
                      </div>
                      <div>
                        <label class="form-label mb-1">Nomor Rekening</label>
                        <input v-model="editForm.no_rekening" class="form-input text-xs font-mono" placeholder="123-456-7890" />
                      </div>
                      <div>
                        <label class="form-label mb-1">Atas Nama Rekening</label>
                        <input v-model="editForm.atas_nama" class="form-input text-xs" placeholder="KBM Printing" />
                      </div>
                    </div>
                  </div>

                  <!-- Kontak & Support -->
                  <div class="space-y-3 pt-2">
                    <p class="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-2">
                      <span class="w-1.5 h-1.5 rounded-full bg-[#4338ca]"></span>
                      <span>3. Kontak & Layanan Klien</span>
                    </p>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label class="form-label mb-1">Email</label>
                        <input v-model="editForm.email" class="form-input text-xs" placeholder="accounting@kbmprinting.com" />
                      </div>
                      <div>
                        <label class="form-label mb-1">No. WhatsApp / Telp</label>
                        <input v-model="editForm.no_telp" class="form-input text-xs font-mono" placeholder="+62 812-3456-7890" />
                      </div>
                      <div>
                        <label class="form-label mb-1">Website</label>
                        <input v-model="editForm.website" class="form-input text-xs" placeholder="www.kbmprinting.com" />
                      </div>
                    </div>
                  </div>

                  <!-- Ketentuan & Catatan -->
                  <div class="space-y-3 pt-2">
                    <p class="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-2">
                      <span class="w-1.5 h-1.5 rounded-full bg-[#4338ca]"></span>
                      <span>4. Ketentuan & Catatan Standar</span>
                    </p>
                    <div class="space-y-3">
                      <div>
                        <label class="form-label mb-1">Terms & Conditions</label>
                        <textarea v-model="editForm.terms_conditions" rows="3" class="form-input text-xs resize-none"></textarea>
                      </div>
                      <div>
                        <label class="form-label mb-1">Default Notes (jika order tidak ada catatan)</label>
                        <input v-model="editForm.default_notes" class="form-input text-xs" />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Drawer Footer (Fixed Bottom) -->
                <div class="px-5 sm:px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
                  <button @click="resetSettings" type="button" class="btn-ghost text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer">
                    Reset ke Bawaan
                  </button>
                  <div class="flex items-center gap-2.5">
                    <button @click="isSettingModalOpen = false" type="button" class="btn-secondary h-9 px-4 text-xs font-bold cursor-pointer">
                      Batal
                    </button>
                    <button @click="saveSettings" type="button" class="btn-primary h-9 px-5 text-xs font-bold !bg-[#4338ca] hover:!bg-[#3730a3] cursor-pointer shadow-sm">
                      Simpan Perubahan
                    </button>
                  </div>
                </div>
              </div>
            </transition>
          </div>
        </teleport>

      </div>
    </ion-content>

    <!-- Fixed Action Buttons (Mobile only) -->
    <div v-if="order"
         class="fixed bottom-0 left-0 right-0 z-50 px-4 py-3 bg-white/95 backdrop-blur-md border-t border-slate-200 lg:hidden no-print">
      <div class="grid grid-cols-2 gap-3">
        <button @click="printInvoice"
                :disabled="isPrinting"
                class="btn-secondary h-11 justify-center text-xs font-bold rounded-xl">
          <span v-if="isPrinting">
            <ion-spinner name="crescent" class="w-4 h-4 text-indigo-600"></ion-spinner>
          </span>
          <span v-else class="flex items-center justify-center gap-2">
            <svg class="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Export PDF</span>
          </span>
        </button>
        <button @click="sendWhatsApp"
                :disabled="isSendingWA"
                class="btn-primary h-11 justify-center text-xs font-bold rounded-xl !bg-[#4f46e5]">
          <span v-if="isSendingWA">
            <ion-spinner name="crescent" class="w-4 h-4"></ion-spinner>
          </span>
          <span v-else class="flex items-center justify-center gap-2">
            <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <span>WhatsApp</span>
          </span>
        </button>
      </div>
    </div>

    <ion-toast :is-open="toastOpen" :message="toastMsg"
               :duration="3000" position="top"
               :color="toastColor" @didDismiss="toastOpen = false" />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  IonPage, IonHeader, IonContent, IonSpinner, IonToast, useIonRouter, onIonViewWillEnter,
} from '@ionic/vue'
import PageHeader from '@shared/components/PageHeader.vue'
import KbmLogo from '@shared/components/KbmLogo.vue'
import { useOrderStore } from '../stores/orders'
import { useCompanyStore, type CompanyProfile } from '@shared/stores/companyStore'
import { api } from '@shared/api/gasClient'
import type { KasMasuk } from '@shared/types'
import { formatRupiah, formatTanggal, formatFinishing, formatKertas, formatKertasOrder } from '@shared/utils/formatters'
import { calculateOrderPriceDetailed } from '@shared/utils/pricelist'

const route = useRoute()
const router = useIonRouter()
const orderStore = useOrderStore()
const companyStore = useCompanyStore()

const company = computed(() => companyStore.profile)
const isSettingModalOpen = ref(false)
const zoomMode = ref(false)
const editForm = ref<CompanyProfile>({ ...companyStore.profile })

function openSettingModal() {
  editForm.value = { ...companyStore.profile }
  isSettingModalOpen.value = true
}

function saveSettings() {
  companyStore.updateProfile(editForm.value)
  isSettingModalOpen.value = false
  toastMsg.value = 'Pengaturan info invoice & rekening berhasil disimpan!'
  toastColor.value = 'success'
  toastOpen.value = true
}

function resetSettings() {
  companyStore.resetProfile()
  editForm.value = { ...companyStore.profile }
  toastMsg.value = 'Pengaturan info invoice dikembalikan ke bawaan.'
  toastColor.value = 'warning'
  toastOpen.value = true
}

const orderId = computed(() => ((route.params.orderId as string) || '').trim())
const order = computed(() => orderStore.orders.find((o) => (o.id_order || '').trim() === orderId.value))
const kasMasukList = ref<KasMasuk[]>([])
const isLoading = ref(true)
const loadError = ref<string | null>(null)
const isPrinting = ref(false)
const isSendingWA = ref(false)
const toastOpen = ref(false)
const toastMsg = ref('')
const toastColor = ref('success')

const nomorInvoice = computed(() => {
  const now = new Date()
  const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
  const seq = orderId.value ? (orderId.value.split('-')[2] ?? '001') : '001'
  return `INV-${yyyymm}-${seq}`
})

const totalMasuk = computed(() =>
  kasMasukList.value
    .filter((k) => (k as any).status_verifikasi !== 'BATAL')
    .reduce((s, k) => s + k.nominal, 0),
)
const sisaTagihan = computed(() =>
  Math.max(0, (order.value?.total_harga ?? 0) - totalMasuk.value),
)

// Dynamic Table Breakdown (Cetak Isi + Finishing + Packing)
const invoiceItems = computed(() => {
  if (!order.value) return []
  const o = order.value
  const detailed = calculateOrderPriceDetailed({
    jml_pcs: o.jml_pcs || 1,
    ukuran: o.ukuran,
    kertas: o.kertas,
    kertas_bw: o.kertas_bw,
    kertas_fc: o.kertas_fc,
    cetak_bw: o.cetak_bw || 0,
    cetak_fc: o.cetak_fc || 0,
    finishing: o.finishing || [],
    packing_dus_tipe: o.packing_dus_tipe,
    packing_dus_qty: o.packing_dus_qty,
  })

  const paperLabel = formatKertasOrder(o)
  const isPricelist = Math.abs(detailed.total_harga - o.total_harga) <= 50
  const items: Array<{
    sl: number
    title: string
    desc: string
    qty: number
    rate: number
    amount: number
  }> = []

  if (isPricelist && detailed.biaya_finishing_per_pcs > 0 && (detailed.biaya_cetak_bw_per_pcs + detailed.biaya_cetak_fc_per_pcs) > 0) {
    const cetakUnit = detailed.biaya_cetak_bw_per_pcs + detailed.biaya_cetak_fc_per_pcs
    const finishingUnit = detailed.biaya_finishing_per_pcs
    items.push(
      {
        sl: 1,
        title: `Cetak Isi Buku: "${o.judul_buku || o.judul_penulis}"`,
        desc: `Ukuran ${o.ukuran_custom || o.ukuran} • Kertas ${paperLabel} • ${o.cetak_bw || 0} hal BW + ${o.cetak_fc || 0} hal FC`,
        qty: o.jml_pcs,
        rate: cetakUnit,
        amount: cetakUnit * o.jml_pcs,
      },
      {
        sl: 2,
        title: `Finishing & Jilid Buku`,
        desc: `${formatFinishing(o.finishing)} (Cover, laminasi, jilid lem & perapihan)`,
        qty: o.jml_pcs,
        rate: finishingUnit,
        amount: finishingUnit * o.jml_pcs,
      },
    )
  } else {
    // Single comprehensive line item for production
    const boxCost = o.biaya_packing || (detailed.biaya_packing_total || 0)
    const productionTotal = Math.max(0, o.total_harga - boxCost)
    const unitRate = Math.round(productionTotal / (o.jml_pcs || 1))
    items.push({
      sl: 1,
      title: `Produksi Cetak Buku: "${o.judul_buku || o.judul_penulis}"`,
      desc: `Ukuran ${o.ukuran_custom || o.ukuran} • Kertas ${paperLabel} • ${o.cetak_bw || 0} hal BW + ${o.cetak_fc || 0} hal FC • Finishing: ${formatFinishing(o.finishing)}`,
      qty: o.jml_pcs,
      rate: unitRate,
      amount: productionTotal,
    })
  }

  // If there is box packing, add row item
  if (o.packing_dus_tipe && o.packing_dus_qty && o.packing_dus_qty > 0) {
    const boxName = o.packing_dus_tipe === 'DUS_BESAR' ? 'Dus Besar' : 'Dus Kecil'
    const boxRate = o.packing_dus_tipe === 'DUS_BESAR' ? 10000 : 5000
    const boxAmount = o.biaya_packing || (o.packing_dus_qty * boxRate)
    items.push({
      sl: items.length + 1,
      title: `Packing Pengiriman: ${boxName}`,
      desc: `Kardus packing standar koli ekspedisi KBM Printing (${o.packing_dus_qty} dus)`,
      qty: o.packing_dus_qty,
      rate: boxRate,
      amount: boxAmount,
    })
  }

  return items
})

const emptyRowCount = computed(() => Math.max(1, 5 - invoiceItems.value.length))

function printInvoice() {
  isPrinting.value = true
  const originalTitle = document.title
  const invoiceNum = nomorInvoice.value || 'INVOICE'
  const customerName = order.value?.nama_penerbit ? `_${order.value.nama_penerbit.replace(/[^a-zA-Z0-9_-]/g, '_')}` : ''
  document.title = `${invoiceNum}${customerName}`

  setTimeout(() => {
    window.print()
    setTimeout(() => {
      document.title = originalTitle
      isPrinting.value = false
    }, 1000)
  }, 250)
}

async function sendWhatsApp() {
  if (!order.value) return
  isSendingWA.value = true

  try {
    const o = order.value
    const paperStr = formatKertasOrder(o)
    const packingStr = (o.packing_dus_tipe && o.packing_dus_qty)
      ? `\n📦 *Packing:* ${o.packing_dus_qty}x ${o.packing_dus_tipe === 'DUS_BESAR' ? 'Dus Besar' : 'Dus Kecil'}`
      : ''
    const message = encodeURIComponent(
      `Halo! Berikut invoice untuk pesanan Anda:\n\n` +
      `📋 *${nomorInvoice.value}*\n` +
      `🏢 ${o.nama_penerbit}\n` +
      `📚 ${o.judul_penulis}\n` +
      `📄 Kertas: ${paperStr}` +
      packingStr + `\n` +
      `💰 *Total: ${formatRupiah(o.total_harga)}*\n` +
      `💳 Sisa Tagihan: ${formatRupiah(sisaTagihan.value)}\n\n` +
      `Terima kasih telah mempercayakan percetakan kepada ${company.value.nama} 🙏`,
    )
    window.open(`https://wa.me/?text=${message}`, '_blank')
  } finally {
    isSendingWA.value = false
  }
}

async function loadData() {
  if (!orderId.value) {
    isLoading.value = false
    return
  }

  isLoading.value = true
  loadError.value = null

  try {
    if (!order.value) {
      await orderStore.ensureOrderLoaded(orderId.value)
    }

    const res = await api.getKasMasuk({ id_order: orderId.value })
    if (res.success && res.data) {
      kasMasukList.value = res.data
    }
  } catch (err: any) {
    loadError.value = err?.message || 'Gagal memuat detail invoice'
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
