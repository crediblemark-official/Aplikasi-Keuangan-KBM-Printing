<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <PageHeader
        :title="isEditMode ? 'Edit Order Cetak' : 'Order Cetak Baru'"
        :subtitle="isEditMode ? `ID Order: ${editOrderId}` : ''"
        :show-back="true"
        back-label="Daftar Order"
        @back="router.push('/order/list')"
      >
        <template #actions>
          <div v-if="isEditMode" class="flex items-center gap-2">
            <span class="font-mono text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
              {{ editOrderId }}
            </span>
          </div>
          <button
            v-else
            type="button"
            @click="resetForm"
            class="btn-secondary h-8 text-xs font-semibold px-2.5 rounded-md cursor-pointer text-slate-500 hover:text-slate-800"
          >
            Reset Form
          </button>
        </template>
      </PageHeader>
    </ion-header>

    <ion-content :fullscreen="true">
      <form @submit.prevent="submitOrder" class="w-full min-h-full pb-28 lg:pb-12 bg-white">
        <div class="grid grid-cols-1 lg:grid-cols-12 border-b border-slate-200">

          <!-- Left Column (lg:col-span-7 border-b lg:border-b-0 lg:border-r border-slate-200) -->
          <div class="lg:col-span-7 border-b lg:border-b-0 lg:border-r border-slate-200">
            <!-- 1. Identitas Penerbit & Judul -->
            <div class="border-b border-slate-200 bg-white">
              <SectionHeader title="1. Identitas Penerbit & Buku" />
              <div class="p-[8px] sm:p-[15px] lg:p-[20px] bg-white space-y-4">
                <!-- 1. Nama Penerbit -->
                <ComboboxInput
                  v-model="form.nama_penerbit"
                  label="Nama Penerbit *"
                  sublabel="Pelanggan / Klien"
                  placeholder="Ketik atau pilih nama penerbit / klien..."
                  :options="clientOptions"
                  add-label-prefix="Tambah Penerbit"
                  required
                  @select="onClientSelect"
                  @add="onClientAdd"
                />

                <!-- 2. Judul Buku & 3. Nama Penulis -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ComboboxInput
                    v-model="form.judul_buku"
                    label="Judul Buku *"
                    sublabel="Naskah"
                    placeholder="Contoh: Manajemen Keuangan Modern"
                    :options="bookTitleOptions"
                    add-label-prefix="Gunakan Judul"
                    required
                    @select="onBookSelect"
                    @add="onBookAdd"
                  />
                  <ComboboxInput
                    v-model="form.nama_penulis"
                    label="Nama Penulis"
                    sublabel="Pengarang"
                    placeholder="Contoh: Dr. Rasyiqi"
                    :options="authorOptions"
                    add-label-prefix="Gunakan Penulis"
                    @add="onAuthorAdd"
                  />
                </div>

                <!-- 4. Alamat & 5. Kontak Klien -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                  <ComboboxInput
                    v-model="form.alamat_penerbit"
                    label="Alamat Penerbit / Ekspedisi"
                    sublabel="Faktur & Kirim"
                    placeholder="Contoh: Jl. Kaliurang Km 5, Sleman"
                    :options="addressOptions"
                    add-label-prefix="Gunakan Alamat"
                    @add="onAddressAdd"
                  />
                  <ComboboxInput
                    v-model="form.kontak_penerbit"
                    type="tel"
                    label="No. Kontak / WhatsApp"
                    sublabel="Klien"
                    placeholder="Contoh: 08123456789"
                    :options="contactOptions"
                    add-label-prefix="Gunakan No. Kontak"
                    @add="onContactAdd"
                  />
                </div>
              </div>
            </div>

            <!-- 2. Spesifikasi Teknis Cetak -->
            <div class="bg-white">
              <SectionHeader title="2. Spesifikasi Teknis Cetak" />
              <div class="p-[8px] sm:p-[15px] lg:p-[20px] bg-white space-y-4">
                <!-- Jml (pcs) & Ukuran -->
                <div class="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div class="sm:col-span-5">
                    <div class="flex items-center justify-between mb-1.5">
                      <label class="form-label mb-0">Jml (pcs) *</label>
                      <span v-if="priceBreakdown.diskon_finishing_persen > 0" class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        Diskon Finishing {{ priceBreakdown.diskon_finishing_persen }}%
                      </span>
                    </div>
                    <div class="flex rounded-lg border border-slate-300 overflow-hidden focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500 bg-white shadow-2xs">
                      <input
                        :value="form.jml_pcs ? form.jml_pcs.toLocaleString('id-ID') : ''"
                        type="text"
                        inputmode="numeric"
                        placeholder="100"
                        class="w-full px-3 py-1.5 font-mono font-bold text-base text-slate-800 outline-none border-0 bg-transparent"
                        required
                        @input="onJmlPcsInput"
                      />
                      <span class="inline-flex items-center px-3 bg-slate-100 border-l border-slate-200 text-xs font-bold text-slate-500 select-none">
                        pcs
                      </span>
                    </div>
                  </div>

                  <div class="sm:col-span-7">
                    <div class="flex items-center justify-between mb-1.5">
                      <label class="form-label mb-0">Ukuran Buku *</label>
                      <button
                        v-if="form.ukuran === 'CUSTOM'"
                        type="button"
                        class="text-[11px] font-semibold text-red-600 hover:text-red-800 cursor-pointer flex items-center gap-1"
                        @click="setUkuran('A5')"
                      >
                        ← Kembali ke Standar
                      </button>
                    </div>

                    <!-- Mode Pilihan Standar -->
                    <div v-if="form.ukuran !== 'CUSTOM'" class="flex flex-wrap items-center gap-1.5">
                      <button
                        v-for="u in ukuranOptions"
                        :key="u.value"
                        type="button"
                        class="btn-chip"
                        :class="{ active: form.ukuran === u.value }"
                        @click="setUkuran(u.value as UkuranBuku)"
                      >
                        {{ u.label }}
                      </button>
                    </div>

                    <!-- Mode Custom: Tab lainnya sembunyi, diganti input text -->
                    <div v-else class="flex items-center gap-2 max-w-sm">
                      <div class="relative flex-1 flex rounded-lg border border-red-400 bg-white overflow-hidden shadow-2xs focus-within:ring-2 focus-within:ring-red-500">
                        <span class="inline-flex items-center px-2.5 bg-red-50 border-r border-red-200 text-xs font-bold text-red-700 select-none">
                          Custom
                        </span>
                        <input
                          v-model="form.ukuran_custom"
                          placeholder="Misal: 14 x 20 cm / Novel Saku"
                          class="flex-1 px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                          required
                          autofocus
                        />
                      </div>
                      <button
                        type="button"
                        class="btn-chip text-slate-500 hover:text-slate-700 h-8"
                        title="Batal custom & kembali ke pilihan standar"
                        @click="setUkuran('A5')"
                      >
                        ✕ Batal
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Jenis Kertas -->
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                      <label class="form-label mb-0">Jenis Kertas</label>
                      <span class="text-[10px] text-slate-400 font-normal">Pricelist KBM</span>
                    </div>
                    <!-- Toggle 2 Jenis Kertas jika ada BW & FC -->
                    <button
                      type="button"
                      @click="toggleKertasDual"
                      class="text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-all cursor-pointer flex items-center gap-1"
                      :class="!form.is_kertas_sama ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'"
                    >
                      <span>{{ form.is_kertas_sama ? '+ 2 Jenis Kertas (Beda BW/Warna)' : '✓ 2 Jenis Kertas Aktif' }}</span>
                    </button>
                  </div>

                  <!-- Mode 1: Kertas Sama untuk Seluruh Buku -->
                  <div v-if="form.is_kertas_sama" class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div
                      v-for="k in kertasOptions"
                      :key="k.value"
                      @click="setKertas(k.value as JenisKertas)"
                      class="option-card cursor-pointer p-2.5"
                      :class="{ selected: form.kertas === k.value }"
                    >
                      <div class="w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs flex-shrink-0"
                           :class="form.kertas === k.value ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'">
                        {{ form.kertas === k.value ? '✓' : '•' }}
                      </div>
                      <div class="min-w-0">
                        <p class="text-slate-900 text-xs font-bold truncate">{{ k.label }}</p>
                        <p class="text-slate-500 text-[10px] truncate">{{ k.sub }}</p>
                      </div>
                    </div>
                  </div>

                  <!-- Mode 2: Pemisahan Kertas BW & Kertas Warna (FC) -->
                  <div v-else class="space-y-3 p-3 rounded-xl bg-amber-50/60 border border-amber-200">
                    <div>
                      <div class="flex items-center justify-between mb-1.5">
                        <span class="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <span class="w-2 h-2 rounded-full bg-slate-900"></span>
                          Kertas Isi BW (Halaman Teks Hitam Putih)
                        </span>
                        <span class="text-[10px] text-slate-600 font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-amber-200">
                          Tarif: Rp {{ tarifBW }}/hal
                        </span>
                      </div>
                      <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        <div
                          v-for="k in kertasOptions"
                          :key="'bw-' + k.value"
                          @click="setKertasBW(k.value as JenisKertas)"
                          class="option-card cursor-pointer p-2 text-xs"
                          :class="{ selected: form.kertas_bw === k.value }"
                        >
                          <p class="font-bold truncate text-xs">{{ k.label }}</p>
                          <p class="text-[9px] text-slate-500 truncate">{{ k.sub }}</p>
                        </div>
                      </div>
                    </div>

                    <div class="pt-2 border-t border-amber-200/60">
                      <div class="flex items-center justify-between mb-1.5">
                        <span class="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <span class="w-2 h-2 rounded-full bg-red-600"></span>
                          Kertas Isi Warna / FC (Halaman Foto / Full Color)
                        </span>
                        <span class="text-[10px] text-slate-600 font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-amber-200">
                          Tarif: Rp {{ tarifFC }}/hal
                        </span>
                      </div>
                      <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        <div
                          v-for="k in kertasOptions"
                          :key="'fc-' + k.value"
                          @click="setKertasFC(k.value as JenisKertas)"
                          class="option-card cursor-pointer p-2 text-xs"
                          :class="{ selected: form.kertas_fc === k.value }"
                        >
                          <p class="font-bold truncate text-xs">{{ k.label }}</p>
                          <p class="text-[9px] text-slate-500 truncate">{{ k.sub }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Cetak BW & Cetak FC -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div class="flex items-center justify-between mb-1.5">
                      <label class="form-label mb-0">Cetak BW (Halaman)</label>
                      <span class="text-[10px] text-red-700 font-mono font-bold bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                        Rp {{ tarifBW }}/hal
                      </span>
                    </div>
                    <div class="flex rounded-lg border border-slate-300 overflow-hidden focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500 bg-white shadow-2xs">
                      <input
                        :value="form.cetak_bw ? form.cetak_bw.toLocaleString('id-ID') : (form.cetak_bw === 0 ? '0' : '')"
                        type="text"
                        inputmode="numeric"
                        placeholder="0"
                        class="w-full px-3 py-1.5 font-mono text-sm text-slate-800 outline-none border-0 bg-transparent"
                        @input="onCetakBWInput"
                      />
                      <span class="inline-flex items-center px-2.5 bg-slate-100 border-l border-slate-200 text-xs font-semibold text-slate-500 select-none">
                        hal
                      </span>
                    </div>
                  </div>

                  <div>
                    <div class="flex items-center justify-between mb-1.5">
                      <label class="form-label mb-0">Cetak FC (Halaman)</label>
                      <span class="text-[10px] text-red-700 font-mono font-bold bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                        Rp {{ tarifFC }}/hal
                      </span>
                    </div>
                    <div class="flex rounded-lg border border-slate-300 overflow-hidden focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500 bg-white shadow-2xs">
                      <input
                        :value="form.cetak_fc ? form.cetak_fc.toLocaleString('id-ID') : (form.cetak_fc === 0 ? '0' : '')"
                        type="text"
                        inputmode="numeric"
                        placeholder="0"
                        class="w-full px-3 py-1.5 font-mono text-sm text-slate-800 outline-none border-0 bg-transparent"
                        @input="onCetakFCInput"
                      />
                      <span class="inline-flex items-center px-2.5 bg-slate-100 border-l border-slate-200 text-xs font-semibold text-slate-500 select-none">
                        hal
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Finishing Buku -->
                <div>
                  <div class="flex items-center justify-between mb-1.5">
                    <label class="form-label mb-0">Finishing Buku</label>
                    <span class="text-[10px] text-slate-400 font-normal">Pilih opsi pengerjaan cover & jilid</span>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    <div
                      v-for="f in finishingOptions"
                      :key="f.value"
                      @click="toggleFinishing(f.value as JenisFinishing)"
                      class="option-card cursor-pointer p-2.5"
                      :class="{ selected: form.finishing.includes(f.value as JenisFinishing) }"
                    >
                      <div class="w-5 h-5 rounded flex items-center justify-center font-bold text-xs flex-shrink-0 transition-colors"
                           :class="form.finishing.includes(f.value as JenisFinishing) ? 'bg-red-600 text-white' : 'border border-slate-300 bg-white text-transparent'">
                        ✓
                      </div>
                      <div class="min-w-0">
                        <p class="text-slate-900 text-xs font-semibold truncate">{{ f.label }}</p>
                        <p class="text-slate-500 text-[10px] truncate">{{ f.sub }}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Packing Kardus / Dus Pengiriman -->
                <div class="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                  <div class="flex items-center justify-between">
                    <label class="form-label mb-0 flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <span>📦</span>
                      <span>Packing Kardus / Dus Pengiriman</span>
                    </label>
                    <span v-if="form.packing_dus_qty > 0 && form.packing_dus_tipe" class="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded font-mono">
                      + {{ formatRupiah(priceBreakdown.biaya_packing_total) }}
                    </span>
                  </div>

                  <!-- Tipe Dus Options -->
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div
                      @click="setPackingTipe(null)"
                      class="option-card cursor-pointer p-2.5"
                      :class="{ selected: !form.packing_dus_tipe }"
                    >
                      <div
                        class="w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs flex-shrink-0"
                        :class="!form.packing_dus_tipe ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-400'"
                      >
                        {{ !form.packing_dus_tipe ? '✓' : '•' }}
                      </div>
                      <div class="min-w-0">
                        <p class="text-slate-900 text-xs font-bold truncate">Tanpa Dus</p>
                        <p class="text-slate-500 text-[10px] truncate">Packing Standar (Rp 0)</p>
                      </div>
                    </div>

                    <div
                      @click="setPackingTipe('DUS_KECIL')"
                      class="option-card cursor-pointer p-2.5"
                      :class="{ selected: form.packing_dus_tipe === 'DUS_KECIL' }"
                    >
                      <div
                        class="w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs flex-shrink-0"
                        :class="form.packing_dus_tipe === 'DUS_KECIL' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-400'"
                      >
                        {{ form.packing_dus_tipe === 'DUS_KECIL' ? '✓' : '•' }}
                      </div>
                      <div class="min-w-0">
                        <p class="text-slate-900 text-xs font-bold truncate">Dus Kecil</p>
                        <p class="text-red-700 text-[10px] font-semibold truncate">Rp 5.000 / dus</p>
                      </div>
                    </div>

                    <div
                      @click="setPackingTipe('DUS_BESAR')"
                      class="option-card cursor-pointer p-2.5"
                      :class="{ selected: form.packing_dus_tipe === 'DUS_BESAR' }"
                    >
                      <div
                        class="w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs flex-shrink-0"
                        :class="form.packing_dus_tipe === 'DUS_BESAR' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-400'"
                      >
                        {{ form.packing_dus_tipe === 'DUS_BESAR' ? '✓' : '•' }}
                      </div>
                      <div class="min-w-0">
                        <p class="text-slate-900 text-xs font-bold truncate">Dus Besar</p>
                        <p class="text-red-700 text-[10px] font-semibold truncate">Rp 10.000 / dus</p>
                      </div>
                    </div>
                  </div>

                  <!-- Input Kuantitas Dus -->
                  <div v-if="form.packing_dus_tipe" class="flex items-center gap-3 pt-2 border-t border-slate-200/60">
                    <label class="text-xs font-semibold text-slate-700 shrink-0">Kuantitas Dus Dibutuhkan:</label>
                    <div class="flex rounded-lg border border-slate-300 overflow-hidden bg-white max-w-[130px] focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500">
                      <input
                        :value="form.packing_dus_qty ? form.packing_dus_qty.toLocaleString('id-ID') : ''"
                        type="text"
                        inputmode="numeric"
                        placeholder="Contoh: 20"
                        class="w-full px-2.5 py-1 text-xs font-mono font-bold text-slate-800 outline-none border-0"
                        @input="onPackingDusQtyInput"
                      />
                      <span class="inline-flex items-center px-2 bg-slate-100 text-[10px] font-bold text-slate-500 border-l border-slate-200">
                        dus
                      </span>
                    </div>
                    <span class="text-xs text-slate-600 font-mono font-bold">
                      = {{ formatRupiah(priceBreakdown.biaya_packing_total) }}
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <!-- Right Column (lg:col-span-5) -->
          <div class="lg:col-span-5">
            <div class="bg-white lg:sticky lg:top-0 z-10 lg:max-h-[calc(100vh-56px)] lg:overflow-y-auto">
              <SectionHeader title="3. Biaya & Pembayaran">
                <template #actions>
                  <button
                    type="button"
                    @click="applyPricelistCalculation"
                    class="text-xs font-semibold text-red-600 hover:text-red-800 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 hover:bg-red-100 transition-colors cursor-pointer border border-red-200"
                    title="Hitung ulang otomatis berdasarkan pricelist resmi"
                  >
                    ⚡ Hitung Ulang
                  </button>
                </template>
              </SectionHeader>

              <div class="p-[8px] sm:p-[15px] lg:p-[20px] bg-white space-y-4">
                <!-- Harga Input -->
                <div>
                  <div class="flex items-center justify-between mb-1.5">
                    <label class="form-label mb-0">Harga (Total Tagihan Rp) *</label>
                    <span v-if="isCustomPrice" class="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-semibold">
                      Manual
                    </span>
                    <span v-else class="text-[10px] text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200 font-semibold">
                      Otomatis (Pricelist)
                    </span>
                  </div>
                  <div class="flex rounded-lg border border-slate-300 overflow-hidden focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500 bg-white shadow-2xs">
                    <span class="inline-flex items-center px-3 bg-slate-100 border-r border-slate-200 text-slate-600 font-mono font-bold text-sm sm:text-base select-none">
                      Rp
                    </span>
                    <input
                      :value="form.total_harga ? form.total_harga.toLocaleString('id-ID') : ''"
                      type="text"
                      inputmode="numeric"
                      placeholder="0"
                      class="w-full px-3 py-2 text-xl sm:text-2xl font-black text-red-600 font-mono tracking-tight outline-none border-0 bg-transparent"
                      required
                      @input="onTotalHargaInput"
                    />
                  </div>
                  <p class="font-mono font-bold text-emerald-700 text-xs mt-1">
                    {{ formatRupiah(form.total_harga || 0) }}
                  </p>
                </div>

                <!-- Rincian Biaya Box -->
                <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                  <p class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Rincian Estimasi</p>
                  <div class="flex justify-between text-slate-600">
                    <span>Harga per Buku:</span>
                    <span class="font-mono font-bold text-slate-900">{{ formatRupiah(priceBreakdown.harga_per_pcs) }} / pcs</span>
                  </div>
                  <div class="flex justify-between text-slate-600">
                    <span>Biaya Cetak Isi (BW + FC):</span>
                    <span class="font-mono text-slate-800">{{ formatRupiah(priceBreakdown.biaya_cetak_bw_per_pcs + priceBreakdown.biaya_cetak_fc_per_pcs) }} / pcs</span>
                  </div>
                  <div class="flex justify-between text-slate-600">
                    <span>Biaya Finishing:</span>
                    <span class="font-mono text-slate-800">
                      {{ formatRupiah(priceBreakdown.biaya_finishing_per_pcs) }} / pcs
                      <span v-if="priceBreakdown.diskon_finishing_persen > 0" class="text-[10px] text-emerald-600 font-bold">(-{{ priceBreakdown.diskon_finishing_persen }}%)</span>
                    </span>
                  </div>
                  <div class="pt-2 border-t border-slate-200 flex justify-between items-center">
                    <span class="font-semibold text-slate-700">Total Oplah ({{ form.jml_pcs || 0 }} pcs):</span>
                    <span class="font-mono font-extrabold text-red-600 text-sm">{{ formatRupiah(priceBreakdown.total_harga) }}</span>
                  </div>
                </div>

                <!-- Catatan Order -->
                <div>
                  <label class="form-label">Catatan Order (opsional)</label>
                  <textarea
                    v-model="form.catatan"
                    rows="3"
                    placeholder="Instruksi khusus, deadline, nomor SPK, pengiriman, dll..."
                    class="form-input resize-none text-xs"
                  ></textarea>
                </div>

                <!-- Desktop Submit Button -->
                <div class="hidden lg:block pt-3 border-t border-slate-100">
                  <button
                    type="submit"
                    :disabled="orderStore.isLoading || !isFormValid"
                    class="btn-primary w-full h-11 justify-center text-sm font-bold shadow-2xs"
                  >
                    <span v-if="orderStore.isLoading" class="flex items-center justify-center gap-2">
                      <ion-spinner name="crescent" class="w-4 h-4"></ion-spinner>
                      <span>{{ isEditMode ? 'Menyimpan Perubahan...' : 'Menyimpan Order...' }}</span>
                    </span>
                    <span v-else class="flex items-center justify-center gap-2">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{{ isEditMode ? 'Simpan Perubahan Order' : 'Simpan Order & Buat Invoice' }}</span>
                    </span>
                  </button>
                </div>

              </div>
            </div>
          </div>

        </div>
      </form>
    </ion-content>

    <!-- Mobile Sticky Bottom Bar -->
    <div class="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-[8px] sm:px-[15px] py-3 bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center justify-between gap-3 shadow-lg">
      <div class="min-w-0">
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Biaya</p>
        <p class="font-mono font-black text-red-600 text-base sm:text-lg truncate">{{ formatRupiah(form.total_harga || 0) }}</p>
      </div>
      <button
        type="button"
        @click="submitOrder"
        :disabled="orderStore.isLoading || !isFormValid"
        class="btn-primary h-11 px-5 justify-center text-xs sm:text-sm font-bold flex-shrink-0 shadow-2xs"
      >
        <span v-if="orderStore.isLoading" class="flex items-center justify-center gap-2">
          <ion-spinner name="crescent" class="w-4 h-4"></ion-spinner>
          <span>Menyimpan...</span>
        </span>
        <span v-else class="flex items-center justify-center gap-2">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>{{ isEditMode ? 'Simpan Perubahan' : 'Simpan Order' }}</span>
        </span>
      </button>
    </div>

    <!-- Error Toast -->
    <ion-toast
      :is-open="toastOpen"
      :message="toastMsg"
      :duration="3000"
      position="top"
      color="danger"
      @didDismiss="toastOpen = false"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  IonPage, IonHeader, IonContent, IonSpinner, IonToast, useIonRouter, onIonViewWillEnter,
} from '@ionic/vue'
import PageHeader from '@shared/components/PageHeader.vue'
import SectionHeader from '@shared/components/SectionHeader.vue'
import ComboboxInput, { type ComboboxOption } from '@shared/components/ComboboxInput.vue'
import { useOrderStore } from '../stores/orders'
import { formatRupiah } from '@shared/utils/formatters'
import {
  calculateOrderPriceDetailed,
  getTarifBWPerHalaman,
  getTarifFCPerHalaman,
} from '@shared/utils/pricelist'
import { api } from '@shared/api/gasClient'
import type { UkuranBuku, JenisKertas, JenisFinishing } from '@shared/types'

const orderStore = useOrderStore()
const router = useIonRouter()
const route = useRoute()

const isEditMode = computed(() => Boolean(route.params.id || route.query.edit))
const editOrderId = computed(() => String(route.params.id || route.query.edit || ''))

const toastOpen = ref(false)
const toastMsg = ref('')
const clients = ref<{ nama_penerbit: string; kontak?: string; alamat?: string }[]>([])
const isCustomPrice = ref(false)

// Custom items added during current session
const customClients = ref<{ nama_penerbit: string; kontak?: string; alamat?: string }[]>([])
const customTitles = ref<string[]>([])
const customAuthors = ref<string[]>([])
const customAddresses = ref<string[]>([])
const customContacts = ref<string[]>([])

// 1. Client Options
const clientOptions = computed<ComboboxOption[]>(() => {
  const all = [...customClients.value, ...clients.value]
  const seen = new Set<string>()
  const list: ComboboxOption[] = []
  for (const c of all) {
    const key = c.nama_penerbit.trim().toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    list.push({
      label: c.nama_penerbit,
      value: c.nama_penerbit,
      sub: [c.kontak, c.alamat].filter(Boolean).join(' • '),
      extra: c,
    })
  }
  return list
})

function onClientSelect(opt: ComboboxOption) {
  const c = opt.extra
  if (c?.alamat && !form.value.alamat_penerbit) form.value.alamat_penerbit = String(c.alamat)
  if (c?.kontak && !form.value.kontak_penerbit) form.value.kontak_penerbit = String(c.kontak)
}

function onClientAdd(val: string) {
  if (!customClients.value.some((c) => c.nama_penerbit.toLowerCase() === val.toLowerCase())) {
    customClients.value.unshift({ nama_penerbit: val })
  }
}

// 2. Book Title Options
const bookTitleOptions = computed<ComboboxOption[]>(() => {
  const seen = new Set<string>()
  const list: ComboboxOption[] = []

  // Prioritize books matching current client
  const curClient = form.value.nama_penerbit.trim().toLowerCase()
  const sortedOrders = [...orderStore.orders].sort((a, b) => {
    const aMatch = curClient && a.nama_penerbit.trim().toLowerCase() === curClient ? -1 : 1
    const bMatch = curClient && b.nama_penerbit.trim().toLowerCase() === curClient ? -1 : 1
    return aMatch - bMatch
  })

  for (const o of sortedOrders) {
    const title = (o.judul_buku || o.judul_penulis?.split('/')[0] || '').trim()
    const key = title.toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    const author = o.nama_penulis || o.judul_penulis?.split('/')[1]?.trim() || ''
    list.push({
      label: title,
      value: title,
      sub: author ? `Penulis: ${author}` : o.nama_penerbit,
      extra: { title, author, order: o },
    })
  }

  for (const t of customTitles.value) {
    const key = t.trim().toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    list.unshift({ label: t, value: t })
  }

  return list
})

function onBookSelect(opt: ComboboxOption) {
  const extra = opt.extra
  if (extra?.author && !form.value.nama_penulis) {
    form.value.nama_penulis = extra.author
  }
}

function onBookAdd(val: string) {
  if (!customTitles.value.includes(val)) {
    customTitles.value.unshift(val)
  }
}

// 3. Author Options
const authorOptions = computed<ComboboxOption[]>(() => {
  const seen = new Set<string>()
  const list: ComboboxOption[] = []

  for (const a of customAuthors.value) {
    const key = a.trim().toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    list.push({ label: a, value: a })
  }

  for (const o of orderStore.orders) {
    const author = (o.nama_penulis || o.judul_penulis?.split('/')[1] || '').trim()
    const key = author.toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    list.push({
      label: author,
      value: author,
      sub: o.nama_penerbit ? `Penerbit: ${o.nama_penerbit}` : '',
    })
  }

  return list
})

function onAuthorAdd(val: string) {
  if (!customAuthors.value.includes(val)) {
    customAuthors.value.unshift(val)
  }
}

// 4. Address Options
const addressOptions = computed<ComboboxOption[]>(() => {
  const seen = new Set<string>()
  const list: ComboboxOption[] = []

  for (const addr of customAddresses.value) {
    const key = addr.trim().toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    list.push({ label: addr, value: addr })
  }

  for (const c of [...customClients.value, ...clients.value]) {
    if (!c.alamat) continue
    const key = c.alamat.trim().toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    list.push({
      label: c.alamat.trim(),
      value: c.alamat.trim(),
      sub: c.nama_penerbit,
    })
  }

  for (const o of orderStore.orders) {
    if (!o.alamat_penerbit) continue
    const key = o.alamat_penerbit.trim().toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    list.push({
      label: o.alamat_penerbit.trim(),
      value: o.alamat_penerbit.trim(),
      sub: o.nama_penerbit,
    })
  }

  return list
})

function onAddressAdd(val: string) {
  if (!customAddresses.value.includes(val)) {
    customAddresses.value.unshift(val)
  }
}

// 5. Contact Options
const contactOptions = computed<ComboboxOption[]>(() => {
  const seen = new Set<string>()
  const list: ComboboxOption[] = []

  for (const phone of customContacts.value) {
    const raw = String(phone || '').trim()
    const key = raw.toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    list.push({ label: raw, value: raw })
  }

  for (const c of [...customClients.value, ...clients.value]) {
    if (!c.kontak) continue
    const raw = String(c.kontak || '').trim()
    const key = raw.toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    list.push({
      label: raw,
      value: raw,
      sub: c.nama_penerbit ? String(c.nama_penerbit) : undefined,
    })
  }

  for (const o of orderStore.orders) {
    if (!o.kontak_penerbit) continue
    const raw = String(o.kontak_penerbit || '').trim()
    const key = raw.toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    list.push({
      label: raw,
      value: raw,
      sub: o.nama_penerbit ? String(o.nama_penerbit) : undefined,
    })
  }

  return list
})

function onContactAdd(val: string) {
  if (!customContacts.value.includes(val)) {
    customContacts.value.unshift(val)
  }
}

// Ukuran Options
const ukuranOptions = [
  { value: 'A5', label: 'A5 / Unesco' },
  { value: 'B5', label: 'B5' },
  { value: 'A4', label: 'A4' },
  { value: 'A6', label: 'A6' },
  { value: 'CUSTOM', label: 'Custom' },
]

// Kertas Options based on PDF Pricelist
const kertasOptions = [
  { value: 'BP_57', label: 'BP 57', sub: 'Bookpaper 57g' },
  { value: 'BP_72', label: 'BP 72', sub: 'Bookpaper 72g' },
  { value: 'HVS_70', label: 'HVS 70', sub: 'HVS 70g Putih' },
  { value: 'HVS_80', label: 'HVS 80', sub: 'HVS 80g Putih' },
  { value: 'BOOKPAPER_55G', label: 'BP 55', sub: 'Bookpaper 55g' },
  { value: 'ART_PAPER_120G', label: 'Art Paper', sub: 'Art Paper 120g' },
  { value: 'ART_CARTON_210G', label: 'Art Carton', sub: 'Art Carton 210g' },
  { value: 'LAIN_LAIN', label: 'Lain-lain', sub: 'Khusus' },
]

// Finishing Options based on PDF Pricelist (Opsi pengerjaan buku)
const finishingOptions = [
  { value: 'SOFT_COVER', label: 'Soft Cover', sub: 'Cover + Lam + Binding + Shrink' },
  { value: 'HARD_COVER', label: 'Hard Cover', sub: 'Cover + Lam + Binding + Shrink + Pita' },
  { value: 'BINDING_POTONG', label: 'Binding + Potong', sub: 'Jilid lem & potong rapi' },
  { value: 'LAMINASI_DOFF', label: 'Laminasi Doff', sub: 'Doff lembut' },
  { value: 'LAMINASI_GLOSSY', label: 'Laminasi Glossy', sub: 'Glossy kilap' },
  { value: 'SHRINK_WRAP', label: 'Shrink Wrap', sub: 'Plastik segel' },
]

// EXACT FIELDS WITH SEPARATE JUDUL BUKU & NAMA PENULIS
const form = ref({
  nama_penerbit: '',
  judul_buku: '',
  nama_penulis: '',
  alamat_penerbit: '',
  kontak_penerbit: '',
  jml_pcs: 100,
  ukuran: 'A5' as UkuranBuku,
  ukuran_custom: '',
  kertas: 'BP_57' as JenisKertas,
  kertas_bw: 'BP_57' as JenisKertas,
  kertas_fc: 'HVS_80' as JenisKertas,
  is_kertas_sama: true,
  packing_dus_tipe: null as 'DUS_KECIL' | 'DUS_BESAR' | null,
  packing_dus_qty: 0,
  cetak_bw: 150,
  cetak_fc: 0,
  finishing: ['SOFT_COVER'] as JenisFinishing[],
  total_harga: 0,
  catatan: '',
})

// Real-time Breakdown Calculation
const priceBreakdown = computed(() => {
  return calculateOrderPriceDetailed({
    jml_pcs: form.value.jml_pcs || 0,
    ukuran: form.value.ukuran,
    kertas: form.value.kertas,
    kertas_bw: form.value.is_kertas_sama ? form.value.kertas : form.value.kertas_bw,
    kertas_fc: form.value.is_kertas_sama ? form.value.kertas : form.value.kertas_fc,
    cetak_bw: form.value.cetak_bw || 0,
    cetak_fc: form.value.cetak_fc || 0,
    finishing: form.value.finishing,
    packing_dus_tipe: form.value.packing_dus_tipe,
    packing_dus_qty: form.value.packing_dus_qty,
  })
})

const tarifBW = computed(() => {
  const k = form.value.is_kertas_sama ? form.value.kertas : (form.value.kertas_bw || form.value.kertas)
  return getTarifBWPerHalaman(form.value.ukuran, k)
})

const tarifFC = computed(() => {
  const k = form.value.is_kertas_sama ? form.value.kertas : (form.value.kertas_fc || form.value.kertas)
  return getTarifFCPerHalaman(form.value.ukuran, k)
})

const isFormValid = computed(() =>
  String(form.value.nama_penerbit || '').trim() !== '' &&
  String(form.value.judul_buku || '').trim() !== '' &&
  Number(form.value.jml_pcs) > 0 &&
  Number(form.value.total_harga) > 0,
)

function setUkuran(u: UkuranBuku) {
  form.value.ukuran = u
  if (u !== 'CUSTOM') {
    form.value.ukuran_custom = ''
  }
  recalculatePriceAuto()
}

function setKertas(k: JenisKertas) {
  form.value.kertas = k
  form.value.kertas_bw = k
  recalculatePriceAuto()
}

function toggleKertasDual() {
  form.value.is_kertas_sama = !form.value.is_kertas_sama
  if (!form.value.is_kertas_sama) {
    form.value.kertas_bw = form.value.kertas
    if (!form.value.kertas_fc) form.value.kertas_fc = 'HVS_80'
  }
  recalculatePriceAuto()
}

function setKertasBW(k: JenisKertas) {
  form.value.kertas_bw = k
  recalculatePriceAuto()
}

function setKertasFC(k: JenisKertas) {
  form.value.kertas_fc = k
  recalculatePriceAuto()
}

function setPackingTipe(tipe: 'DUS_KECIL' | 'DUS_BESAR' | null) {
  form.value.packing_dus_tipe = tipe
  if (tipe && (!form.value.packing_dus_qty || form.value.packing_dus_qty <= 0)) {
    form.value.packing_dus_qty = Math.max(1, Math.ceil((form.value.jml_pcs || 100) / 100))
  } else if (!tipe) {
    form.value.packing_dus_qty = 0
  }
  recalculatePriceAuto()
}

function toggleFinishing(item: JenisFinishing) {
  const idx = form.value.finishing.indexOf(item)
  if (idx !== -1) {
    form.value.finishing.splice(idx, 1)
  } else {
    // Saling mengunci antara Soft Cover dan Hard Cover
    if (item === 'HARD_COVER') {
      const scIdx = form.value.finishing.indexOf('SOFT_COVER')
      if (scIdx !== -1) form.value.finishing.splice(scIdx, 1)
    } else if (item === 'SOFT_COVER') {
      const hcIdx = form.value.finishing.indexOf('HARD_COVER')
      if (hcIdx !== -1) form.value.finishing.splice(hcIdx, 1)
    }
    form.value.finishing.push(item)
  }
  recalculatePriceAuto()
}

function onJmlPcsInput(e: Event) {
  const target = e.target as HTMLInputElement
  const raw = target.value.replace(/\D/g, '')
  const num = raw ? parseInt(raw, 10) : 0
  form.value.jml_pcs = num
  target.value = num ? num.toLocaleString('id-ID') : ''
  recalculatePriceAuto()
}

function onCetakBWInput(e: Event) {
  const target = e.target as HTMLInputElement
  const raw = target.value.replace(/\D/g, '')
  const num = raw ? parseInt(raw, 10) : 0
  form.value.cetak_bw = num
  target.value = num ? num.toLocaleString('id-ID') : (raw === '0' ? '0' : '')
  recalculatePriceAuto()
}

function onCetakFCInput(e: Event) {
  const target = e.target as HTMLInputElement
  const raw = target.value.replace(/\D/g, '')
  const num = raw ? parseInt(raw, 10) : 0
  form.value.cetak_fc = num
  target.value = num ? num.toLocaleString('id-ID') : (raw === '0' ? '0' : '')
  recalculatePriceAuto()
}

function onPackingDusQtyInput(e: Event) {
  const target = e.target as HTMLInputElement
  const raw = target.value.replace(/\D/g, '')
  const num = raw ? parseInt(raw, 10) : 0
  form.value.packing_dus_qty = num
  target.value = num ? num.toLocaleString('id-ID') : ''
  recalculatePriceAuto()
}

function onTotalHargaInput(e: Event) {
  const target = e.target as HTMLInputElement
  const raw = target.value.replace(/\D/g, '')
  const num = raw ? parseInt(raw, 10) : 0
  form.value.total_harga = num
  target.value = num ? num.toLocaleString('id-ID') : ''
  isCustomPrice.value = true
}

function applyPricelistCalculation() {
  form.value.total_harga = priceBreakdown.value.total_harga
  isCustomPrice.value = false
}

function recalculatePriceAuto() {
  if (!isCustomPrice.value || form.value.total_harga === 0) {
    form.value.total_harga = priceBreakdown.value.total_harga
    isCustomPrice.value = false
  }
}

function resetForm() {
  form.value = {
    nama_penerbit: '',
    judul_buku: '',
    nama_penulis: '',
    alamat_penerbit: '',
    kontak_penerbit: '',
    jml_pcs: 100,
    ukuran: 'A5',
    ukuran_custom: '',
    kertas: 'BP_57',
    kertas_bw: 'BP_57',
    kertas_fc: 'HVS_80',
    is_kertas_sama: true,
    packing_dus_tipe: null,
    packing_dus_qty: 0,
    cetak_bw: 150,
    cetak_fc: 0,
    finishing: ['SOFT_COVER'],
    total_harga: 0,
    catatan: '',
  }
  isCustomPrice.value = false
  recalculatePriceAuto()
}

async function loadExistingOrder() {
  if (!editOrderId.value) return
  await orderStore.ensureOrderLoaded(editOrderId.value)
  const existing = orderStore.orders.find((o) => o.id_order.trim() === editOrderId.value.trim())
  if (existing) {
    const rawJudulPenulis = existing.judul_penulis || ''
    const parts = rawJudulPenulis.split(' / ')
    const derivedJudul = existing.judul_buku || parts[0]?.trim() || ''
    const derivedPenulis = existing.nama_penulis || (parts.length > 1 ? parts.slice(1).join(' / ').trim() : '')

    // Parsing finishing aman (Array, string JSON, atau nama finishing)
    let parsedFinishing: JenisFinishing[] = ['SOFT_COVER']
    if (Array.isArray(existing.finishing)) {
      parsedFinishing = [...existing.finishing]
    } else if (typeof existing.finishing === 'string') {
      const raw = (existing.finishing as string).trim()
      if (raw.startsWith('[') && raw.endsWith(']')) {
        try {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed) && parsed.length > 0) parsedFinishing = parsed
        } catch {}
      } else {
        const upper = raw.toUpperCase()
        if (upper.includes('HARD_COVER') || upper.includes('HARDCOVER')) {
          parsedFinishing = ['HARD_COVER']
        } else if (upper.includes('SOFT_COVER') || upper.includes('SOFTCOVER')) {
          parsedFinishing = ['SOFT_COVER']
        }
      }
    }

    form.value = {
      nama_penerbit: existing.nama_penerbit || '',
      judul_buku: derivedJudul,
      nama_penulis: derivedPenulis,
      alamat_penerbit: existing.alamat_penerbit || '',
      kontak_penerbit: existing.kontak_penerbit || '',
      jml_pcs: existing.jml_pcs || 100,
      ukuran: (existing.ukuran as UkuranBuku) || 'A5',
      ukuran_custom: existing.ukuran_custom || '',
      kertas: (existing.kertas as JenisKertas) || 'BP_57',
      kertas_bw: (existing.kertas_bw as JenisKertas) || (existing.kertas as JenisKertas) || 'BP_57',
      kertas_fc: (existing.kertas_fc as JenisKertas) || (existing.kertas as JenisKertas) || 'HVS_80',
      is_kertas_sama: !existing.kertas_fc || existing.kertas_bw === existing.kertas_fc,
      packing_dus_tipe: existing.packing_dus_tipe || null,
      packing_dus_qty: existing.packing_dus_qty || 0,
      cetak_bw: existing.cetak_bw || 0,
      cetak_fc: existing.cetak_fc || 0,
      finishing: parsedFinishing,
      total_harga: existing.total_harga || 0,
      catatan: existing.catatan || '',
    }
    isCustomPrice.value = true
  }
}

async function submitOrder() {
  if (!isFormValid.value) return

  const judulBuku = String(form.value.judul_buku || '').trim()
  const namaPenulis = String(form.value.nama_penulis || '').trim()
  const combinedJudulPenulis = namaPenulis ? `${judulBuku} / ${namaPenulis}` : judulBuku

  const orderPayload = {
    nama_penerbit: String(form.value.nama_penerbit || '').trim(),
    judul_penulis: combinedJudulPenulis,
    judul_buku: judulBuku,
    nama_penulis: namaPenulis,
    jml_pcs: Number(form.value.jml_pcs) || 1,
    ukuran: form.value.ukuran,
    ukuran_custom: form.value.ukuran_custom ? String(form.value.ukuran_custom).trim() : '',
    kertas: form.value.kertas_bw || form.value.kertas,
    kertas_bw: form.value.is_kertas_sama ? (form.value.kertas_bw || form.value.kertas) : form.value.kertas_bw,
    kertas_fc: form.value.is_kertas_sama ? (form.value.kertas_bw || form.value.kertas) : form.value.kertas_fc,
    packing_dus_tipe: form.value.packing_dus_tipe,
    packing_dus_qty: form.value.packing_dus_qty,
    biaya_packing: priceBreakdown.value.biaya_packing_total,
    cetak_bw: Number(form.value.cetak_bw) || 0,
    cetak_fc: Number(form.value.cetak_fc) || 0,
    finishing: form.value.finishing,
    total_harga: Number(form.value.total_harga) || 0,
    catatan: form.value.catatan ? String(form.value.catatan).trim() : '',
    alamat_penerbit: form.value.alamat_penerbit ? String(form.value.alamat_penerbit).trim() : '',
    kontak_penerbit: form.value.kontak_penerbit != null ? String(form.value.kontak_penerbit).trim() : '',
  }

  if (isEditMode.value) {
    const res = await orderStore.updateOrder({
      id_order: editOrderId.value,
      ...orderPayload,
    })

    if (res && res.success) {
      router.push(`/order/${editOrderId.value}`)
    } else {
      toastMsg.value = res?.error || orderStore.error || 'Gagal memperbarui order'
      toastOpen.value = true
    }
  } else {
    const result = await orderStore.createOrder(orderPayload)

    if (result && result.id_order) {
      router.push(`/invoice/${result.id_order.trim()}`)
    } else {
      toastMsg.value = orderStore.error ?? 'Gagal menyimpan order'
      toastOpen.value = true
    }
  }
}

async function initView() {
  recalculatePriceAuto()
  try {
    const res = await api.getClients()
    if (res.success && res.data) clients.value = res.data
  } catch (err) {
    console.warn('Failed to load client list:', err)
  }
  if (orderStore.orders.length === 0) {
    await orderStore.fetchOrders().catch((err) => console.warn('Failed to fetch orders:', err))
  }
  if (isEditMode.value) {
    await loadExistingOrder()
  } else if (route.query.penerbit) {
    const pubName = String(route.query.penerbit).trim()
    form.value.nama_penerbit = pubName
    const matched = [...customClients.value, ...clients.value].find(
      (c) => c.nama_penerbit.trim().toLowerCase() === pubName.toLowerCase()
    )
    if (matched) {
      if (matched.kontak && !form.value.kontak_penerbit) form.value.kontak_penerbit = matched.kontak
      if (matched.alamat && !form.value.alamat_penerbit) form.value.alamat_penerbit = matched.alamat
    }
  }
}

onMounted(async () => {
  await initView()
})

onIonViewWillEnter(async () => {
  if (isEditMode.value) {
    await loadExistingOrder()
  }
})

watch(
  () => editOrderId.value,
  async (newId) => {
    if (newId) {
      await loadExistingOrder()
    } else {
      resetForm()
    }
  }
)
</script>
