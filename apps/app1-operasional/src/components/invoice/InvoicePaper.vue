<template>
  <div class="invoice-paper-wrapper w-max min-w-[720px] max-w-[840px] mx-auto px-4 sm:px-6 print:min-w-0 print:max-w-full print:w-full print:p-0 print:m-0">
    <div
      id="invoice-paper"
      class="bg-white shadow-xl rounded-[24px] sm:rounded-[28px] border border-slate-100 p-8 sm:p-12 md:p-14 relative overflow-hidden text-slate-800 print:shadow-none print:border-none print:rounded-none print:!p-[14mm_16mm] print:max-w-full print:w-full print:m-0 print:bg-white print:overflow-visible print:break-inside-avoid"
    >
      <!-- Background Fluid Organic Shapes (Hidden during print) -->
      <div class="no-print absolute -top-16 -right-16 pointer-events-none w-96 h-96 rounded-full bg-gradient-to-bl from-red-100/60 via-rose-50/30 to-transparent blur-2xl z-0 select-none"></div>
      <div class="no-print absolute -bottom-20 -right-20 pointer-events-none w-96 h-96 rounded-full bg-gradient-to-tl from-red-100/50 via-rose-50/30 to-transparent blur-3xl z-0 select-none"></div>

      <!-- TOP HEADER: Logo & Metadata -->
      <div class="relative z-10 flex justify-between items-start gap-6 pb-8 border-b border-slate-100/90">
        <!-- Left: Logo -->
        <div class="flex items-center gap-3.5">
          <KbmLogo size="lg" variant="full" :subtitle="company.alamat || 'Digital & Offset Book Printing'" />
        </div>

        <!-- Right: Invoice Metadata -->
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
            <span class="w-24 text-right font-mono font-medium text-slate-700 whitespace-nowrap">
              {{ formatRupiah(item.rate) }}
            </span>
            <span class="w-20 text-center font-mono font-medium text-slate-800 whitespace-nowrap">
              {{ item.qty }} pcs
            </span>
            <span class="w-28 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
              {{ formatRupiah(item.amount) }}
            </span>
            <span class="w-6 text-right text-slate-300 no-print flex justify-end">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </span>
          </div>
        </div>

        <!-- Specification seal -->
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

      <!-- TOTALS & CALCULATION -->
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
        <div class="col-span-7 space-y-4">
          <div>
            <h4 class="text-xs font-extrabold text-slate-900 mb-0.5">Notes & comments</h4>
            <p class="text-[11px] text-slate-500 leading-relaxed">
              {{ order.catatan || company.default_notes }}
            </p>
          </div>

          <div>
            <h4 class="text-xs font-extrabold text-slate-900 mb-0.5">Terms & conditions</h4>
            <p class="text-[11px] text-slate-500 leading-relaxed">
              {{ company.terms_conditions }}
            </p>
          </div>

          <div class="flex items-center gap-3.5 pt-2">
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

        <div class="col-span-5 text-right text-xs text-slate-600 font-medium space-y-1">
          <p class="text-red-700 font-bold text-sm leading-tight">{{ company.email }}</p>
          <p class="font-mono text-slate-800 font-bold whitespace-nowrap">{{ company.no_telp }}</p>
          <p class="text-slate-400 text-[10px] whitespace-nowrap">{{ company.website }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import KbmLogo from '@shared/components/KbmLogo.vue'
import { formatRupiah, formatTanggal } from '@shared/utils/formatters'
import type { Order } from '@shared/types'
import type { CompanyProfile } from '@shared/stores/companyStore'
import type { InvoiceItem } from '../../composables/useInvoiceData'

defineProps<{
  order: Order
  company: CompanyProfile
  nomorInvoice: string
  totalMasuk: number
  sisaTagihan: number
  invoiceItems: InvoiceItem[]
}>()
</script>
