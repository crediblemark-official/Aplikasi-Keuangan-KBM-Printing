<template>
  <div class="w-full min-h-full bg-white fade-in">
    <!-- Header Section (Exact h-14) -->
    <PageHeader>
      <template #title>
        <div class="min-w-0">
          <h1 class="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-none truncate">
            <span class="hidden md:inline">Buku Kas &amp; Mutasi Keuangan</span>
            <span class="md:hidden">Buku Kas</span>
          </h1>
        </div>
      </template>
      <template #actions>
        <!-- Periode Selector -->
        <!-- Export Excel Button -->
        <BaseButton
          @click="exportExcel"
          :loading="isExporting"
          size="sm"
          variant="secondary"
          title="Export (.xlsx)"
          class="px-2 sm:px-3 shrink-0"
        >
          <template #icon>
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </template>
          <span class="hidden md:inline">Export (.xlsx)</span>
          <span class="hidden sm:inline md:hidden">Export</span>
        </BaseButton>

        <!-- Refresh Button -->
        <button
          type="button"
          @click="loadData(true)"
          :disabled="isLoading"
          class="h-8 px-2 sm:px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-2xs shrink-0 cursor-pointer disabled:opacity-50"
          title="Segarkan Data Buku Kas"
        >
          <svg class="w-3.5 h-3.5" :class="{ 'animate-spin': isLoading }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span class="hidden sm:inline">Refresh</span>
        </button>

        <!-- Input Kas Masuk Button -->
        <button
          @click="showKasMasukModal = true"
          type="button"
          class="h-8 px-2.5 sm:px-3 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span class="hidden sm:inline">Kas Masuk</span>
          <span class="sm:hidden">Masuk</span>
        </button>

        <!-- Input Kas Keluar Button -->
        <button
          @click="showKasKeluarModal = true"
          type="button"
          class="h-8 px-2.5 sm:px-3 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-2xs transition-all inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
          </svg>
          <span class="hidden sm:inline">Kas Keluar</span>
          <span class="sm:hidden">Keluar</span>
        </button>
      </template>
    </PageHeader>

    <!-- Control Bar: Date Filter (Tanggal, Bulan, Tahun, Rentang) -->
    <div class="px-[8px] sm:px-[15px] lg:px-[20px] py-2.5 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
      <DateFilterBar v-model="dateFilter" initial-mode="MONTH" />
      <span class="text-xs text-slate-500 font-semibold font-mono shrink-0 text-center w-full sm:w-auto">
        Periode: <strong class="text-slate-800">{{ dateFilter.label || selectedPeriode }}</strong>
      </span>
    </div>

    <!-- Summary Metrics Strip -->
    <MetricStrip :items="summaryMetrics" />

    <!-- Rekapitulasi per Sumber Kas (Full-bleed) -->
    <div class="border-b border-slate-200 bg-white">
      <div class="px-[8px] sm:px-[15px] lg:px-[20px] py-2.5 border-b border-slate-100 bg-slate-50/40 flex items-center justify-between">
        <h3 class="text-slate-900 font-bold text-xs sm:text-sm">Rekapitulasi Saldo Kas per Akun</h3>
        <span class="text-[11px] font-semibold text-slate-500 font-mono">Periode: {{ dateFilter.label || selectedPeriode }}</span>
      </div>
      <TableScrollWrapper>
        <table class="data-table w-full min-w-[500px]">
          <thead>
            <tr class="whitespace-nowrap">
              <th>Akun / Sumber Kas</th>
              <th class="text-right">Total Masuk (Debit)</th>
              <th class="text-right">Total Keluar (Kredit)</th>
              <th class="text-right">Saldo Bersih</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sumber in sumberRekapData" :key="sumber.label">
              <td class="font-medium text-slate-900">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full" :class="sumber.dotColor"></span>
                  <span>{{ sumber.label }}</span>
                </div>
              </td>
              <td class="text-right font-semibold text-emerald-600">{{ formatRupiah(sumber.masuk) }}</td>
              <td class="text-right font-semibold text-rose-600">{{ formatRupiah(sumber.keluar) }}</td>
              <td class="text-right font-extrabold" :class="sumber.saldo >= 0 ? 'text-emerald-600' : 'text-rose-600'">
                {{ formatRupiah(Math.abs(sumber.saldo)) }}
                <span class="text-xs ml-0.5">{{ sumber.saldo >= 0 ? '(+)' : '(-)' }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </TableScrollWrapper>
    </div>

    <!-- Mutasi Kas Detail (Full-bleed) -->
    <div class="bg-white">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-[8px] sm:px-[15px] lg:px-[20px] py-2.5 border-b border-slate-100 bg-slate-50/40">
        <div class="flex items-center gap-2">
          <h3 class="text-slate-900 font-bold text-xs sm:text-sm">Jurnal Mutasi Buku Kas</h3>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/80 text-slate-700">
            {{ filteredMutasi.length }} Transaksi
          </span>
        </div>

        <div class="flex items-center gap-2 w-full sm:w-auto overflow-x-auto scrollbar-none py-0.5 justify-between sm:justify-end">
          <!-- Filter Tabs Tipe -->
          <div class="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-lg overflow-x-auto scrollbar-none flex-nowrap shrink-0 max-w-full">
            <button
              v-for="tab in mutasiTabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              class="px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap"
              :class="activeTab === tab.id ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'"
            >
              <span>{{ tab.label }}</span>
            </button>
          </div>

          <!-- Search Input -->
          <div class="w-36 sm:w-48 shrink-0">
            <SearchInput v-model="searchQuery" placeholder="Cari keterangan..." />
          </div>
        </div>
      </div>

      <TableScrollWrapper>
        <table class="data-table w-full min-w-[760px]">
          <thead>
            <tr class="whitespace-nowrap">
              <th>Tanggal</th>
              <th>Tipe</th>
              <th>Kategori / Jenis</th>
              <th>Keterangan / Rincian</th>
              <th>Sumber Kas</th>
              <th class="text-right">Debit (Masuk)</th>
              <th class="text-right">Kredit (Keluar)</th>
              <th class="text-center">Bukti / Nota</th>
              <th class="text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <TableStateRow
              :colspan="9"
              :loading="isLoading"
              :is-empty="filteredMutasi.length === 0"
              empty-text="Belum ada mutasi kas tercatat pada periode ini"
            />
            <tr v-for="row in filteredMutasi" :key="row.id" class="hover:bg-slate-50/70">
              <td class="font-mono text-xs font-semibold text-slate-600 whitespace-nowrap">
                {{ formatTanggal(row.tanggal) }}
              </td>
              <td class="whitespace-nowrap">
                <span
                  v-if="row.tipe === 'MASUK'"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
                >
                  <span>⬇ Kas Masuk</span>
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200"
                >
                  <span>⬆ Kas Keluar</span>
                </span>
              </td>
              <td class="whitespace-nowrap font-medium text-slate-700 text-xs">
                {{ row.kategori }}
              </td>
              <td class="max-w-[260px]">
                <p class="truncate text-slate-900 font-medium text-xs" :title="row.keterangan">
                  {{ row.keterangan }}
                </p>
              </td>
              <td class="whitespace-nowrap text-slate-600 font-medium text-xs">
                {{ formatMetode(row.sumber_kas) }}
              </td>
              <td class="text-right font-mono font-semibold text-emerald-600 whitespace-nowrap">
                {{ row.tipe === 'MASUK' ? formatRupiah(row.nominal) : '-' }}
              </td>
              <td class="text-right font-mono font-semibold text-rose-600 whitespace-nowrap">
                {{ row.tipe === 'KELUAR' ? formatRupiah(row.nominal) : '-' }}
              </td>
              <td class="text-center whitespace-nowrap">
                <a
                  v-if="row.fileId"
                  :href="row.fileId.startsWith('http') ? row.fileId : `https://drive.google.com/file/d/${row.fileId}/view`"
                  target="_blank"
                  rel="noopener"
                  class="text-blue-600 hover:text-blue-800 text-xs font-semibold underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Lihat</span>
                </a>
                <span v-else class="text-slate-400 text-[11px] italic">-</span>
              </td>
              <td class="text-center whitespace-nowrap">
                <button
                  @click="openEditModal(row)"
                  type="button"
                  class="px-2 py-0.5 rounded text-slate-500 hover:text-amber-700 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-all inline-flex items-center gap-1 text-xs font-semibold cursor-pointer"
                  title="Edit Transaksi Mutasi"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </TableScrollWrapper>
    </div>

    <!-- MODAL 1: INPUT KAS MASUK (DEPOSIT / NON-ORDER) -->
    <BaseModal v-model="showKasMasukModal" title="Catat Kas Masuk (Buku Kas)">
      <form @submit.prevent="submitKasMasuk" class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="form-label">Tanggal Masuk *</label>
            <input v-model="kmForm.tanggal" type="date" class="form-input bg-white" required />
          </div>
          <div>
            <label class="form-label">Jenis Kas Masuk *</label>
            <select v-model="kmForm.jenis_pembayaran" class="form-input bg-white font-medium" required>
              <option value="DEPOSIT">💳 Deposit Saldo Penerbit</option>
              <option value="NON_ORDER">📦 Pendapatan Lain / Non-Order</option>
            </select>
          </div>
        </div>

        <!-- Nama Penerbit / Penyetor (Standar ComboboxInput KBM Printing) -->
        <div>
          <ComboboxInput
            v-model="kmForm.nama_penerbit"
            :label="kmForm.jenis_pembayaran === 'DEPOSIT' ? 'Nama Penerbit *' : 'Nama Sumber / Penyetor (Opsional)'"
            sublabel="Pelanggan / Klien"
            :placeholder="kmForm.jenis_pembayaran === 'DEPOSIT' ? 'Ketik atau pilih nama penerbit / klien...' : 'Contoh: Pengepul Kertas, Bpk. Hendra, dll.'"
            :options="penerbitOptions"
            add-label-prefix="Tambah Penerbit"
            :required="kmForm.jenis_pembayaran === 'DEPOSIT'"
          />
          <p v-if="kmForm.jenis_pembayaran === 'DEPOSIT'" class="text-[11px] text-slate-500 mt-1">
            Dana deposit akan masuk ke buku saldo penerbit untuk pemotongan biaya order berikutnya.
          </p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="form-label">Nominal (Rp) *</label>
            <input
              :value="kmForm.nominal ? kmForm.nominal.toLocaleString('id-ID') : ''"
              @input="onKmNominalInput"
              type="text"
              inputmode="numeric"
              placeholder="0"
              class="form-input font-mono font-bold text-slate-900 bg-white"
              required
            />
          </div>
          <div>
            <label class="form-label">Metode / Akun Bank *</label>
            <select v-model="kmForm.metode" class="form-input bg-white" required>
              <option value="BANK">🏦 Bank</option>
              <option value="KASIR_TUNAI">💵 Kasir Tunai</option>
              <option value="QRIS">📱 QRIS</option>
            </select>
          </div>
        </div>

        <div>
          <label class="form-label">Keterangan / Rincian</label>
          <textarea
            v-model="kmForm.keterangan"
            rows="2"
            placeholder="Contoh: Deposit untuk cetak 2 judul baru / Penjualan sisa afval kertas"
            class="form-input resize-none bg-white"
          ></textarea>
        </div>

        <div>
          <label class="form-label">Upload Bukti Transfer / Resi (Opsional)</label>
          <ImageUploader
            label="Pilih / Foto Bukti Transfer"
            sublabel="Otomatis dikompres sebelum upload"
            @change="handleKmPhotoChange"
          />
        </div>

        <div class="flex gap-3 pt-2">
          <BaseButton variant="secondary" type="button" @click="showKasMasukModal = false" class="flex-1">
            Batal
          </BaseButton>
          <BaseButton type="submit" :loading="isSubmittingKm" class="flex-1">
            Simpan Kas Masuk
          </BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- MODAL 2: INPUT KAS KELUAR -->
    <BaseModal v-model="showKasKeluarModal" title="Catat Kas Keluar Baru">
      <form @submit.prevent="submitKasKeluar" class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="form-label">Tanggal Keluar *</label>
            <input v-model="kkForm.tanggal" type="date" class="form-input bg-white" required />
          </div>
          <div>
            <label class="form-label">Kategori Pengeluaran *</label>
            <select v-model="kkForm.kategori" class="form-input bg-white font-medium" required>
              <option value="" disabled>Pilih Kategori</option>
              <option v-for="k in kategoriOptions" :key="k.value" :value="k.value">
                {{ k.label }}
              </option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="form-label">Nominal (Rp) *</label>
            <input
              :value="kkForm.nominal ? kkForm.nominal.toLocaleString('id-ID') : ''"
              @input="onKkNominalInput"
              type="text"
              inputmode="numeric"
              placeholder="0"
              class="form-input font-mono font-bold text-slate-900 bg-white"
              required
            />
          </div>
          <div>
            <label class="form-label">Sumber Kas / Akun *</label>
            <select v-model="kkForm.sumber_kas" class="form-input bg-white" required>
              <option value="KASIR_TUNAI">💵 Kasir Tunai</option>
              <option value="BANK">🏦 Bank</option>
              <option value="QRIS">📱 QRIS</option>
            </select>
          </div>
        </div>

        <div>
          <label class="form-label">Rincian Pengeluaran *</label>
          <textarea
            v-model="kkForm.rincian"
            rows="2"
            placeholder="Contoh: Beli kertas Bookpaper 72gr 2 rim / Token listrik workshop"
            class="form-input resize-none bg-white"
            required
          ></textarea>
        </div>

        <div>
          <label class="form-label">Upload Foto Nota / Kwitansi (Opsional)</label>
          <ImageUploader
            label="Pilih / Foto Nota"
            sublabel="Otomatis dikompres sebelum upload"
            @change="handleKkPhotoChange"
          />
        </div>

        <div class="flex gap-3 pt-2">
          <BaseButton variant="secondary" type="button" @click="showKasKeluarModal = false" class="flex-1">
            Batal
          </BaseButton>
          <BaseButton type="submit" :loading="isSubmittingKk" class="flex-1">
            Simpan Kas Keluar
          </BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- MODAL 3: EDIT MUTASI KAS (MASUK / KELUAR) -->
    <BaseModal v-model="showEditModal" :title="editForm.tipe === 'MASUK' ? 'Edit Kas Masuk' : 'Edit Kas Keluar'">
      <form @submit.prevent="submitEditMutasi" class="space-y-4">
        <!-- Info ID & Tipe -->
        <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
          <span class="text-slate-500 font-mono">ID: <strong class="text-slate-800">{{ editForm.id }}</strong></span>
          <span
            class="px-2 py-0.5 rounded text-[11px] font-bold"
            :class="editForm.tipe === 'MASUK' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'"
          >
            {{ editForm.tipe === 'MASUK' ? '⬇ Kas Masuk' : '⬆ Kas Keluar' }}
          </span>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="form-label">Tanggal Transaksi *</label>
            <input v-model="editForm.tanggal" type="date" class="form-input bg-white" required />
          </div>
          <div>
            <label class="form-label">Sumber Kas / Rekening *</label>
            <select v-model="editForm.sumber_kas" class="form-input bg-white font-medium" required>
              <option value="BANK">Bank</option>
              <option value="KASIR_TUNAI">Kasir Tunai</option>
              <option value="QRIS">QRIS</option>
            </select>
          </div>
        </div>

        <!-- Khusus Kas Masuk -->
        <template v-if="editForm.tipe === 'MASUK'">
          <div v-if="editForm.id_order" class="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
            <p class="font-bold">Pembayaran Order Cetak: {{ editForm.id_order }}</p>
            <p class="text-blue-700 text-[11px] mt-0.5">{{ editForm.nama_penerbit || '-' }}</p>
          </div>
          <div v-else-if="editForm.jenis_pembayaran === 'DEPOSIT'">
            <label class="form-label">Nama Penerbit (Deposit) *</label>
            <ComboboxInput
              v-model="editForm.nama_penerbit"
              :options="penerbitOptions"
              placeholder="Pilih nama penerbit..."
              required
            />
          </div>
        </template>

        <!-- Khusus Kas Keluar -->
        <template v-if="editForm.tipe === 'KELUAR'">
          <div>
            <label class="form-label">Kategori Pengeluaran *</label>
            <select v-model="editForm.kategori" class="form-input bg-white font-medium" required>
              <option v-for="k in kategoriOptions" :key="k.value" :value="k.value">{{ k.label }}</option>
            </select>
          </div>
        </template>

        <!-- Nominal -->
        <div>
          <label class="form-label">Nominal *</label>
          <div class="flex rounded-lg border border-slate-300 overflow-hidden focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100 bg-white transition-all shadow-2xs">
            <span class="inline-flex items-center px-3 bg-slate-100 border-r border-slate-200 text-xs font-mono font-bold text-slate-500 select-none">
              Rp
            </span>
            <input
              :value="editForm.nominal ? editForm.nominal.toLocaleString('id-ID') : ''"
              @input="onEditNominalInput"
              type="text"
              inputmode="numeric"
              class="w-full px-3 py-2 text-sm font-bold font-mono text-slate-900 outline-none border-0 bg-transparent"
              placeholder="0"
              required
            />
          </div>
        </div>

        <!-- Keterangan -->
        <div>
          <label class="form-label">Keterangan / Rincian Transaksi</label>
          <input
            v-model="editForm.keterangan"
            type="text"
            class="form-input bg-white"
            placeholder="Catatan rincian transaksi..."
          />
        </div>

        <!-- Action Buttons -->
        <div class="pt-3 flex items-center justify-between gap-2 border-t border-slate-100">
          <button
            @click="showDeleteMutasiConfirmModal = true"
            type="button"
            class="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200 cursor-pointer"
            :disabled="isSubmittingEdit"
          >
            Hapus Transaksi
          </button>
          <div class="flex items-center gap-2">
            <button
              @click="showEditModal = false"
              type="button"
              class="btn-secondary text-xs px-3 py-1.5"
              :disabled="isSubmittingEdit"
            >
              Batal
            </button>
            <button
              type="submit"
              class="btn-primary text-xs px-4 py-1.5"
              :disabled="isSubmittingEdit || !editForm.nominal"
            >
              {{ isSubmittingEdit ? 'Menyimpan...' : 'Simpan Perubahan' }}
            </button>
          </div>
        </div>
      </form>
    </BaseModal>

    <!-- Modern Styled Confirm Modal for Mutasi Deletion -->
    <ConfirmModal
      v-model="showDeleteMutasiConfirmModal"
      :title="editForm.tipe === 'MASUK' ? 'Batalkan Kas Masuk?' : 'Hapus Kas Keluar?'"
      :message="editForm.tipe === 'MASUK' ? `Yakin ingin membatalkan dan menghapus catatan Kas Masuk ID ${editForm.id}?` : `Yakin ingin menghapus catatan pengeluaran Kas Keluar ID ${editForm.id}?`"
      :detail="editForm.tipe === 'MASUK' ? 'Catatan mutasi kas ini akan dihapus dan sisa saldo buku kas akan otomatis disesuaikan.' : 'Catatan pengeluaran kas ini akan dihapus dan sisa saldo buku kas akan otomatis disesuaikan.'"
      :confirm-text="editForm.tipe === 'MASUK' ? 'Ya, Batalkan Kas Masuk' : 'Ya, Hapus Pengeluaran'"
      cancel-text="Kembali"
      type="danger"
      :loading="isSubmittingEdit"
      @confirm="executeDeleteMutasi"
    />

    <!-- Snackbar Toast (Success & Error support) -->
    <transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-2.5"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-300 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2.5"
    >
      <div
        v-if="snackbar"
        class="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-[10000] px-5 py-3 rounded-xl text-sm font-semibold shadow-xl flex items-center gap-2.5"
        :class="snackbarType === 'error' ? 'bg-rose-600 text-white shadow-rose-200' : 'bg-emerald-600 text-white shadow-emerald-200'"
      >
        <svg v-if="snackbarType === 'error'" class="w-4 h-4 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <svg v-else class="w-4 h-4 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>{{ snackbar }}</span>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@shared/components/PageHeader.vue'
import BaseButton from '@shared/components/BaseButton.vue'
import MetricStrip from '@shared/components/MetricStrip.vue'
import TableStateRow from '@shared/components/TableStateRow.vue'
import TableScrollWrapper from '@shared/components/TableScrollWrapper.vue'
import BaseModal from '@shared/components/BaseModal.vue'
import ConfirmModal from '@shared/components/ConfirmModal.vue'
import ImageUploader from '@shared/components/ImageUploader.vue'
import SearchInput from '@shared/components/SearchInput.vue'
import ComboboxInput, { type ComboboxOption } from '@shared/components/ComboboxInput.vue'
import DateFilterBar from '@shared/components/DateFilterBar.vue'
import { api } from '@shared/api/gasClient'
import { useAuthStore } from '../stores/auth'
import {
  formatRupiah,
  formatTanggal,
  formatMetode,
  formatKategori,
  getTodayISO,
  getCurrentPeriode,
  formatJenisPembayaran,
  isDateInFilterRange,
} from '@shared/utils/formatters'
import type { KasMasuk, KasKeluar, SumberKas, KategoriKasKeluar, Client, Order, DateFilterValue } from '@shared/types'

const route = useRoute()
const authStore = useAuthStore()

const isLoading = ref(false)
const isExporting = ref(false)
const snackbar = ref('')
const snackbarType = ref<'success' | 'error'>('success')
const selectedPeriode = ref(getCurrentPeriode())
const dateFilter = ref<DateFilterValue>({ mode: 'MONTH' })

function showToast(msg: string, type: 'success' | 'error' = 'success') {
  snackbar.value = msg
  snackbarType.value = type
  setTimeout(() => {
    if (snackbar.value === msg) snackbar.value = ''
  }, 4000)
}

// Data state
const kasMasukList = ref<KasMasuk[]>([])
const kasKeluarList = ref<KasKeluar[]>([])
const clientsList = ref<Client[]>([])
const ordersList = ref<Order[]>([])

// Filter state
const activeTab = ref<'SEMUA' | 'MASUK' | 'KELUAR' | 'DEPOSIT'>('SEMUA')
const searchQuery = ref('')

const mutasiTabs: Array<{ id: 'SEMUA' | 'MASUK' | 'KELUAR' | 'DEPOSIT'; label: string }> = [
  { id: 'SEMUA', label: 'Semua Mutasi' },
  { id: 'MASUK', label: 'Kas Masuk' },
  { id: 'KELUAR', label: 'Kas Keluar' },
  { id: 'DEPOSIT', label: 'Deposit Saldo' },
]

const kategoriOptions = [
  { value: 'BAHAN_BAKU', label: 'Bahan Baku Kertas' },
  { value: 'OPERASIONAL', label: 'Operasional / Listrik' },
  { value: 'GAJI', label: 'Gaji & Lembur' },
  { value: 'KONSUMSI', label: 'Konsumsi' },
  { value: 'LAIN_LAIN', label: 'Lain-lain' },
]

// Modal 1: Kas Masuk Form State
const showKasMasukModal = ref(false)
const isSubmittingKm = ref(false)
const kmPhotoBase64 = ref('')
const kmPhotoFilename = ref('')
const kmForm = ref({
  tanggal: getTodayISO(),
  jenis_pembayaran: 'DEPOSIT' as 'DEPOSIT' | 'NON_ORDER',
  nama_penerbit: '',
  nominal: 0,
  metode: 'BANK' as SumberKas,
  keterangan: '',
})

// Modal 2: Kas Keluar Form State
const showKasKeluarModal = ref(false)
const isSubmittingKk = ref(false)
const kkPhotoBase64 = ref('')
const kkPhotoFilename = ref('')
const kkForm = ref({
  tanggal: getTodayISO(),
  kategori: '' as KategoriKasKeluar,
  rincian: '',
  nominal: 0,
  sumber_kas: 'KASIR_TUNAI' as SumberKas,
})

// Modal 3: Edit Mutasi Form State
const showEditModal = ref(false)
const showDeleteMutasiConfirmModal = ref(false)
const isSubmittingEdit = ref(false)
const editForm = ref({
  id: '',
  tipe: 'MASUK' as 'MASUK' | 'KELUAR',
  tanggal: '',
  nominal: 0,
  sumber_kas: 'BANK' as SumberKas,
  kategori: '',
  keterangan: '',
  id_order: '',
  nama_penerbit: '',
  jenis_pembayaran: '',
})

// Publisher combobox options (matches App 1 ComboboxInput standard)
const penerbitOptions = computed<ComboboxOption[]>(() => {
  const seen = new Set<string>()
  const list: ComboboxOption[] = []

  // 1. Dari master clients
  clientsList.value.forEach((c) => {
    const name = c.nama_penerbit?.trim()
    if (!name) return
    const key = name.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    const subParts = [c.kontak, c.alamat].filter(Boolean)
    list.push({
      label: name,
      value: name,
      sub: subParts.length > 0 ? subParts.join(' • ') : 'Klien Terdaftar',
      extra: c,
    })
  })

  // 2. Dari database order
  ordersList.value.forEach((o) => {
    const name = o.nama_penerbit?.trim()
    if (!name) return
    const key = name.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    list.push({
      label: name,
      value: name,
      sub: o.id_order ? `Order ${o.id_order}` : undefined,
      extra: o,
    })
  })

  // 3. Dari transaksi kas masuk sebelumnya
  kasMasukList.value.forEach((k) => {
    const name = k.nama_penerbit?.trim()
    if (!name) return
    const key = name.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    list.push({
      label: name,
      value: name,
      sub: 'Riwayat Transaksi',
      extra: k,
    })
  })

  return list.sort((a, b) => a.label.localeCompare(b.label))
})

// Filter kas masuk by active date filter (excluding non-cash settlements like SALDO_DEPOSIT)
const filteredKasMasukByPeriode = computed(() =>
  kasMasukList.value.filter((k) => {
    if (!k.tanggal) return false
    return isDateInFilterRange(k.tanggal, dateFilter.value)
  })
)

const filteredKasKeluarByPeriode = computed(() =>
  kasKeluarList.value.filter((k) => {
    if (!k.tanggal) return false
    return isDateInFilterRange(k.tanggal, dateFilter.value)
  })
)

// Summary metrics calculations
const totalMasuk = computed(() =>
  filteredKasMasukByPeriode.value
    .filter((k) => k.status_verifikasi === 'VERIFIED' && k.metode !== 'SALDO_DEPOSIT')
    .reduce((s, k) => s + k.nominal, 0)
)
const totalKeluar = computed(() => filteredKasKeluarByPeriode.value.reduce((s, k) => s + k.nominal, 0))
const saldoKas = computed(() => totalMasuk.value - totalKeluar.value)

// Perhitungan saldo deposit mengendap per penerbit
const depositSummary = computed(() => {
  const map = new Map<string, { masuk: number; keluar: number }>()

  // Top-up deposit masuk
  kasMasukList.value.forEach((k) => {
    if (k.jenis_pembayaran === 'DEPOSIT' && (k as any).status_verifikasi === 'VERIFIED') {
      const name = (k.nama_penerbit || 'Penerbit Lain').trim().toLowerCase()
      const curr = map.get(name) || { masuk: 0, keluar: 0 }
      curr.masuk += k.nominal
      map.set(name, curr)
    }
  })

  // Pemakaian deposit untuk bayar order
  kasMasukList.value.forEach((k) => {
    if (k.metode === 'SALDO_DEPOSIT' && (k as any).status_verifikasi === 'VERIFIED') {
      const order = ordersList.value.find((o) => o.id_order === k.id_order)
      const name = (k.nama_penerbit || order?.nama_penerbit || 'Penerbit Lain').trim().toLowerCase()
      const curr = map.get(name) || { masuk: 0, keluar: 0 }
      curr.keluar += k.nominal
      map.set(name, curr)
    }
  })

  let totalMengendap = 0
  let activeCount = 0
  map.forEach((val) => {
    const sisa = Math.max(0, val.masuk - val.keluar)
    if (sisa > 0) {
      totalMengendap += sisa
      activeCount++
    }
  })

  return { totalMengendap, activeCount }
})

const summaryMetrics = computed(() => [
  {
    label: 'Total Kas Masuk (Riil)',
    value: formatRupiah(totalMasuk.value),
    valueClass: 'text-emerald-600',
    minWidth: 'min-w-[150px]',
  },
  {
    label: 'Total Kas Keluar',
    value: formatRupiah(totalKeluar.value),
    valueClass: 'text-rose-600',
    minWidth: 'min-w-[150px]',
  },
  {
    label: 'Surplus / Defisit Kas',
    value: formatRupiah(Math.abs(saldoKas.value)),
    valueClass: saldoKas.value >= 0 ? 'text-emerald-600' : 'text-rose-600',
    sub: saldoKas.value >= 0 ? '+ Surplus Saldo' : '- Defisit Saldo',
    subClass: saldoKas.value >= 0 ? 'text-emerald-600' : 'text-rose-600',
    subDot: saldoKas.value >= 0 ? 'bg-emerald-500' : 'bg-rose-500',
    minWidth: 'min-w-[150px]',
  },
  {
    label: 'Deposit Mengendap',
    value: formatRupiah(depositSummary.value.totalMengendap),
    valueClass: 'text-emerald-700',
    sub: `${depositSummary.value.activeCount} Penerbit Aktif`,
    subClass: 'text-emerald-600',
    subDot: 'bg-emerald-500',
    minWidth: 'min-w-[160px]',
  },
])

// Rekap Saldo Kas per Akun
const sumberList = ['KASIR_TUNAI', 'BANK', 'QRIS']
const sumberConfig: Record<string, { label: string; dotColor: string }> = {
  KASIR_TUNAI: { label: 'Kasir Tunai', dotColor: 'bg-emerald-500' },
  BANK: { label: 'Bank', dotColor: 'bg-blue-500' },
  QRIS: { label: 'QRIS', dotColor: 'bg-purple-500' },
}

const sumberRekapData = computed(() =>
  sumberList.map((s) => {
    const cfg = sumberConfig[s] || { label: s, dotColor: 'bg-slate-400' }
    const matchSumber = (val: string) => s === 'BANK' ? (val || '').toUpperCase().includes('BANK') : val === s
    const masuk = filteredKasMasukByPeriode.value
      .filter((k) => matchSumber(k.metode) && k.status_verifikasi === 'VERIFIED')
      .reduce((sum, k) => sum + k.nominal, 0)
    const keluar = filteredKasKeluarByPeriode.value
      .filter((k) => matchSumber(k.sumber_kas))
      .reduce((sum, k) => sum + k.nominal, 0)
    return { label: cfg.label, dotColor: cfg.dotColor, masuk, keluar, saldo: masuk - keluar }
  })
)

// Mutasi Row Interface
interface MutasiRow {
  id: string
  tanggal: string
  tipe: 'MASUK' | 'KELUAR'
  kategori: string
  keterangan: string
  sumber_kas: string
  nominal: number
  fileId?: string
  raw?: KasMasuk | KasKeluar
}

function formatKmKeterangan(k: KasMasuk): string {
  if (k.jenis_pembayaran === 'DEPOSIT') {
    return `[DEPOSIT] ${k.nama_penerbit || 'Penerbit'}${k.keterangan ? ' — ' + k.keterangan : ''}`
  }
  if (k.jenis_pembayaran === 'NON_ORDER') {
    return `[NON-ORDER] ${k.keterangan || k.nama_penerbit || 'Pendapatan Lain'}`
  }
  const orderStr = k.id_order ? `(${k.id_order})` : ''
  const penerbitStr = k.nama_penerbit ? `${k.nama_penerbit} ${orderStr}`.trim() : k.id_order ?? k.keterangan ?? ''
  return `${formatJenisPembayaran(k.jenis_pembayaran)} — ${penerbitStr}`
}

const allMutasi = computed<MutasiRow[]>(() => {
  const list: MutasiRow[] = []

  // Verified Kas Masuk (exclude non-cash SALDO_DEPOSIT from cash register mutasi)
  filteredKasMasukByPeriode.value
    .filter((k) => k.status_verifikasi === 'VERIFIED' && k.metode !== 'SALDO_DEPOSIT')
    .forEach((k) => {
      list.push({
        id: k.id_kas_masuk,
        tanggal: k.tanggal,
        tipe: 'MASUK',
        kategori: formatJenisPembayaran(k.jenis_pembayaran),
        keterangan: formatKmKeterangan(k),
        sumber_kas: k.metode,
        nominal: k.nominal,
        fileId: k.file_id_bukti,
        raw: k,
      })
    })

  // Kas Keluar
  filteredKasKeluarByPeriode.value.forEach((k) => {
    list.push({
      id: k.id_kas_keluar,
      tanggal: k.tanggal,
      tipe: 'KELUAR',
      kategori: formatKategori(k.kategori),
      keterangan: k.rincian,
      sumber_kas: k.sumber_kas,
      nominal: k.nominal,
      fileId: k.file_id_nota,
      raw: k,
    })
  })

  return list.sort((a, b) => b.tanggal.localeCompare(a.tanggal))
})

const filteredMutasi = computed(() => {
  return allMutasi.value.filter((m) => {
    if (activeTab.value === 'MASUK' && m.tipe !== 'MASUK') return false
    if (activeTab.value === 'KELUAR' && m.tipe !== 'KELUAR') return false
    if (activeTab.value === 'DEPOSIT' && !m.kategori.toLowerCase().includes('deposit')) return false
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase()
      return (
        m.keterangan.toLowerCase().includes(q) ||
        m.kategori.toLowerCase().includes(q) ||
        formatMetode(m.sumber_kas).toLowerCase().includes(q)
      )
    }
    return true
  })
})

// Input number formatters
function onKmNominalInput(e: Event) {
  const input = e.target as HTMLInputElement
  const clean = input.value.replace(/\D/g, '')
  const num = parseInt(clean, 10) || 0
  kmForm.value.nominal = num
  input.value = num ? num.toLocaleString('id-ID') : ''
}

function onKkNominalInput(e: Event) {
  const input = e.target as HTMLInputElement
  const clean = input.value.replace(/\D/g, '')
  const num = parseInt(clean, 10) || 0
  kkForm.value.nominal = num
  input.value = num ? num.toLocaleString('id-ID') : ''
}

function handleKmPhotoChange(uploadData: { base64: string; filename: string } | null) {
  if (uploadData) {
    kmPhotoBase64.value = uploadData.base64
    kmPhotoFilename.value = uploadData.filename
  } else {
    kmPhotoBase64.value = ''
    kmPhotoFilename.value = ''
  }
}

function handleKkPhotoChange(uploadData: { base64: string; filename: string } | null) {
  if (uploadData) {
    kkPhotoBase64.value = uploadData.base64
    kkPhotoFilename.value = uploadData.filename
  } else {
    kkPhotoBase64.value = ''
    kkPhotoFilename.value = ''
  }
}

// Submissions
async function submitKasMasuk() {
  if (!kmForm.value.nominal || kmForm.value.nominal <= 0) {
    showToast('Nominal harus lebih besar dari 0', 'error')
    return
  }
  if (kmForm.value.jenis_pembayaran === 'DEPOSIT' && !kmForm.value.nama_penerbit.trim()) {
    showToast('Nama Penerbit / Klien wajib diisi untuk Deposit Saldo', 'error')
    return
  }

  isSubmittingKm.value = true
  try {
    const res = await api.createKasMasuk({
      id_order: null,
      jenis_pembayaran: kmForm.value.jenis_pembayaran,
      nominal: kmForm.value.nominal,
      metode: kmForm.value.metode,
      diinput_oleh: authStore.nama || 'OWNER',
      status_verifikasi: 'VERIFIED',
      nama_penerbit: kmForm.value.nama_penerbit?.trim(),
      tanggal: kmForm.value.tanggal,
      keterangan: kmForm.value.keterangan?.trim(),
      foto_base64: kmPhotoBase64.value || undefined,
      foto_filename: kmPhotoFilename.value || undefined,
    })

    if (res.success) {
      showKasMasukModal.value = false
      showToast(`Kas Masuk ${formatRupiah(kmForm.value.nominal)} berhasil dicatat!`, 'success')
      kmForm.value = {
        tanggal: getTodayISO(),
        jenis_pembayaran: 'DEPOSIT',
        nama_penerbit: '',
        nominal: 0,
        metode: 'BANK',
        keterangan: '',
      }
      kmPhotoBase64.value = ''
      kmPhotoFilename.value = ''
      await loadData()
    } else {
      showToast('Gagal menyimpan kas masuk: ' + (res.error || 'Terjadi kesalahan'), 'error')
    }
  } catch (err: any) {
    console.error('Submit kas masuk error:', err)
    showToast(err?.message || 'Terjadi kesalahan jaringan saat menyimpan kas masuk.', 'error')
  } finally {
    isSubmittingKm.value = false
  }
}

async function submitKasKeluar() {
  if (!kkForm.value.nominal || kkForm.value.nominal <= 0) {
    showToast('Nominal harus lebih besar dari 0', 'error')
    return
  }
  if (!kkForm.value.kategori) {
    showToast('Pilih kategori pengeluaran terlebih dahulu', 'error')
    return
  }
  if (!kkForm.value.rincian.trim()) {
    showToast('Rincian pengeluaran wajib diisi', 'error')
    return
  }

  isSubmittingKk.value = true
  try {
    const res = await api.createKasKeluar({
      tanggal: kkForm.value.tanggal,
      kategori: kkForm.value.kategori,
      rincian: kkForm.value.rincian.trim(),
      nominal: kkForm.value.nominal,
      sumber_kas: kkForm.value.sumber_kas,
      diinput_oleh: authStore.nama || 'OWNER',
      foto_base64: kkPhotoBase64.value || undefined,
      foto_filename: kkPhotoFilename.value || undefined,
    })

    if (res.success) {
      showKasKeluarModal.value = false
      showToast(`Kas Keluar ${formatRupiah(kkForm.value.nominal)} berhasil disimpan!`, 'success')
      kkForm.value = {
        tanggal: getTodayISO(),
        kategori: '' as KategoriKasKeluar,
        rincian: '',
        nominal: 0,
        sumber_kas: 'KASIR_TUNAI',
      }
      kkPhotoBase64.value = ''
      kkPhotoFilename.value = ''
      await loadData()
    } else {
      showToast('Gagal menyimpan kas keluar: ' + (res.error || 'Terjadi kesalahan'), 'error')
    }
  } catch (err: any) {
    console.error('Submit kas keluar error:', err)
    showToast(err?.message || 'Terjadi kesalahan jaringan saat menyimpan kas keluar.', 'error')
  } finally {
    isSubmittingKk.value = false
  }
}

function onEditNominalInput(e: Event) {
  const input = e.target as HTMLInputElement
  const clean = input.value.replace(/\D/g, '')
  const num = parseInt(clean, 10) || 0
  editForm.value.nominal = num
}

function openEditModal(row: MutasiRow) {
  const raw = row.raw as any
  editForm.value = {
    id: row.id,
    tipe: row.tipe,
    tanggal: row.tanggal ? row.tanggal.split('T')[0] : getTodayISO(),
    nominal: row.nominal,
    sumber_kas: (row.sumber_kas as SumberKas) || 'BANK',
    kategori: raw?.kategori || '',
    keterangan: raw?.rincian || raw?.keterangan || '',
    id_order: raw?.id_order || '',
    nama_penerbit: raw?.nama_penerbit || '',
    jenis_pembayaran: raw?.jenis_pembayaran || '',
  }
  showEditModal.value = true
}

async function submitEditMutasi() {
  if (!editForm.value.id || editForm.value.nominal <= 0) return
  isSubmittingEdit.value = true
  try {
    if (editForm.value.tipe === 'MASUK') {
      const res = await api.updateKasMasuk({
        id_kas_masuk: editForm.value.id,
        tanggal: editForm.value.tanggal,
        nominal: editForm.value.nominal,
        metode: editForm.value.sumber_kas,
        keterangan: editForm.value.keterangan,
        nama_penerbit: editForm.value.nama_penerbit,
      })
      if (!res.success) {
        showToast(res.error || 'Gagal memperbarui Kas Masuk', 'error')
        return
      }
    } else {
      const res = await api.updateKasKeluar({
        id_kas_keluar: editForm.value.id,
        tanggal: editForm.value.tanggal,
        nominal: editForm.value.nominal,
        kategori: editForm.value.kategori,
        sumber_kas: editForm.value.sumber_kas,
        rincian: editForm.value.keterangan,
      })
      if (!res.success) {
        showToast(res.error || 'Gagal memperbarui Kas Keluar', 'error')
        return
      }
    }
    showEditModal.value = false
    showToast('Data mutasi kas berhasil diperbarui!', 'success')
    await loadData()
  } catch (err: any) {
    showToast(err?.message || 'Terjadi kesalahan saat menyimpan perubahan', 'error')
  } finally {
    isSubmittingEdit.value = false
  }
}

async function executeDeleteMutasi() {
  if (!editForm.value.id) return

  isSubmittingEdit.value = true
  try {
    if (editForm.value.tipe === 'MASUK') {
      const res = await api.deleteKasMasuk(editForm.value.id)
      if (!res.success) {
        showToast(res.error || 'Gagal membatalkan Kas Masuk', 'error')
        return
      }
    } else {
      const res = await api.deleteKasKeluar(editForm.value.id)
      if (!res.success) {
        showToast(res.error || 'Gagal menghapus Kas Keluar', 'error')
        return
      }
    }
    showDeleteMutasiConfirmModal.value = false
    showEditModal.value = false
    showToast('Data mutasi kas berhasil dihapus!', 'success')
    await loadData()
  } catch (err: any) {
    showToast(err?.message || 'Terjadi kesalahan saat menghapus data', 'error')
  } finally {
    isSubmittingEdit.value = false
  }
}

async function exportExcel() {
  isExporting.value = true
  try {
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()

    // Sheet 1: Mutasi Kas
    const mutasiData = allMutasi.value.map((m) => ({
      Tanggal: formatTanggal(m.tanggal),
      Tipe: m.tipe,
      Kategori: m.kategori,
      Keterangan: m.keterangan,
      'Sumber Kas': formatMetode(m.sumber_kas),
      'Debit (Masuk)': m.tipe === 'MASUK' ? m.nominal : 0,
      'Kredit (Keluar)': m.tipe === 'KELUAR' ? m.nominal : 0,
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mutasiData), 'Mutasi Kas')

    // Sheet 2: Rekap Akun
    const rekapData = sumberRekapData.value.map((s) => ({
      Akun: s.label,
      'Total Masuk': s.masuk,
      'Total Keluar': s.keluar,
      'Saldo Bersih': s.saldo,
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rekapData), 'Rekap Akun')

    const periodLabel = (dateFilter.value.label || selectedPeriode.value).replace(/[^a-zA-Z0-9_-]/g, '_')
    XLSX.writeFile(wb, `Buku_Kas_KBM_${periodLabel}.xlsx`)
  } finally {
    isExporting.value = false
  }
}

async function loadData(force = false) {
  isLoading.value = true
  try {
    const params = force ? { nocache: 'true' } : undefined
    const [kmRes, kkRes, clRes, ordRes] = await Promise.all([
      api.getKasMasuk(params),
      api.getKasKeluar(params),
      api.getClients(params).catch(() => ({ success: false, data: [] })),
      api.getOrders(params).catch(() => ({ success: false, data: [] })),
    ])

    if (kmRes.success && kmRes.data) kasMasukList.value = kmRes.data
    if (kkRes.success && kkRes.data) kasKeluarList.value = kkRes.data
    if (clRes.success && clRes.data) clientsList.value = clRes.data
    if (ordRes.success && ordRes.data) ordersList.value = ordRes.data
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData(true)
  if (route.query.action === 'input-kas-masuk') {
    showKasMasukModal.value = true
  } else if (route.query.action === 'input-kas-keluar') {
    showKasKeluarModal.value = true
  }
})
</script>
