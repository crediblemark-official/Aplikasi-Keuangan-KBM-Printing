<template>
  <div class="w-full min-h-full bg-white fade-in">

    <!-- Header Section (Exact h-14) -->
    <PageHeader title="Kas Keluar">
      <template #actions>
        <BaseButton @click="showModal = true" size="sm">
          <template #icon>
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </template>
          Input Kas Keluar
        </BaseButton>
      </template>
    </PageHeader>

    <!-- Summary Metrics Strip -->
    <MetricStrip :items="summaryMetrics" />

    <!-- Filter Bar: Capsule Pill Buttons (Airbnb / Google Maps style) -->
    <div class="px-[8px] sm:px-[15px] lg:px-[20px] py-2.5 border-b border-slate-200 bg-white flex items-center gap-2 overflow-x-auto scrollbar-none">
      <!-- Kategori Pills -->
      <button
        @click="filterKategori = ''"
        type="button"
        class="filter-pill"
        :class="{ 'active-dark': filterKategori === '' }"
      >
        Semua
      </button>
      <button
        v-for="k in kategoriOptions"
        :key="k.value"
        @click="filterKategori = (filterKategori === k.value ? '' : k.value)"
        type="button"
        class="filter-pill"
        :class="{ active: filterKategori === k.value }"
      >
        {{ k.shortLabel || k.label }}
      </button>

      <span class="h-4 w-px bg-slate-200 mx-1 flex-shrink-0"></span>

      <!-- Sumber Kas Pills -->
      <button
        v-for="s in sumberOptions"
        :key="s.value"
        @click="filterSumber = (filterSumber === s.value ? '' : s.value)"
        type="button"
        class="filter-pill"
        :class="{ 'active-emerald': filterSumber === s.value }"
      >
        {{ s.label }}
      </button>
    </div>

    <!-- Table with Top Horizontal Scrollbar -->
    <TableScrollWrapper>
      <table class="data-table w-full min-w-[780px]">
        <thead>
          <tr class="whitespace-nowrap">
            <th>Tanggal</th>
            <th>Kategori</th>
            <th>Rincian</th>
            <th>Sumber Kas</th>
            <th class="text-right">Nominal</th>
            <th>Diinput</th>
            <th>Nota</th>
          </tr>
        </thead>
        <tbody>
          <TableStateRow
            :colspan="7"
            :loading="isLoading"
            :is-empty="filteredData.length === 0"
            empty-text="Belum ada data pengeluaran kas"
          />
          <tr v-for="item in filteredData" :key="item.id_kas_keluar">
            <td class="font-mono text-xs font-semibold text-slate-600">{{ formatTanggal(item.tanggal) }}</td>
            <td>
              <span class="chip font-medium">{{ formatKategori(item.kategori) }}</span>
            </td>
            <td class="max-w-xs">
              <p class="truncate text-slate-900 font-medium" :title="item.rincian">{{ item.rincian }}</p>
            </td>
            <td class="text-slate-700 font-medium">{{ formatMetode(item.sumber_kas) }}</td>
            <td class="text-right text-rose-600 font-bold">
              - {{ formatRupiah(item.nominal) }}
            </td>
            <td class="text-slate-500 text-xs">{{ item.diinput_oleh }}</td>
            <td>
              <a v-if="item.file_id_nota || item.link_nota"
                 :href="item.link_nota || (item.file_id_nota && item.file_id_nota.startsWith('http') ? item.file_id_nota : `https://drive.google.com/file/d/${item.file_id_nota}/view`)"
                 target="_blank" rel="noopener"
                 class="text-blue-600 hover:text-blue-800 text-xs font-semibold underline inline-flex items-center gap-1">
                <span>Lihat Nota</span>
              </a>
              <span v-else class="text-slate-400 text-[11px] italic">Tanpa nota</span>
            </td>
          </tr>
        </tbody>
      </table>
    </TableScrollWrapper>

    <!-- Bottom Sheet Input Kas Keluar -->
    <BaseModal v-model="showModal" title="Input Kas Keluar Baru">
      <form @submit.prevent="submitKasKeluar" class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="form-label">Tanggal *</label>
            <input v-model="form.tanggal" type="date" class="form-input bg-white" required />
          </div>
          <div>
            <label class="form-label">Nominal (Rp) *</label>
            <input
              :value="form.nominal ? form.nominal.toLocaleString('id-ID') : ''"
              type="text"
              inputmode="numeric"
              placeholder="0"
              class="form-input font-bold text-rose-600 bg-white"
              required
              @input="onNominalInput"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="form-label">Kategori *</label>
            <select v-model="form.kategori" class="form-input bg-white" required>
              <option value="">-- Pilih --</option>
              <option v-for="k in kategoriOptions" :key="k.value" :value="k.value">{{ k.label }}</option>
            </select>
          </div>
          <div>
            <label class="form-label">Sumber Kas *</label>
            <select v-model="form.sumber_kas" class="form-input bg-white" required>
              <option value="KASIR_TUNAI">Tunai</option>
              <option value="BANK">Bank</option>
              <option value="QRIS">QRIS</option>
            </select>
          </div>
        </div>

        <div>
          <label class="form-label">Rincian / Catatan *</label>
          <textarea v-model="form.rincian" rows="2"
                    placeholder="Contoh: Pembelian Kertas Bookpaper 57.5g 50 rim"
                    class="form-input resize-none bg-white" required></textarea>
        </div>

        <!-- Upload Nota -->
        <div>
          <label class="form-label">Upload Foto Nota/Struk</label>
          <ImageUploader
            label="Pilih / Ambil Foto Nota"
            sublabel="Otomatis dikompres sebelum upload"
            @change="handlePhotoChange"
          />
        </div>

        <div class="flex gap-3 pt-2">
          <BaseButton variant="secondary" @click="showModal = false" class="flex-1">
            Batal
          </BaseButton>
          <BaseButton type="submit" :loading="isSubmitting" class="flex-1">
            Simpan
          </BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageHeader from '@shared/components/PageHeader.vue'
import BaseButton from '@shared/components/BaseButton.vue'
import MetricStrip from '@shared/components/MetricStrip.vue'
import TableStateRow from '@shared/components/TableStateRow.vue'
import TableScrollWrapper from '@shared/components/TableScrollWrapper.vue'
import BaseModal from '@shared/components/BaseModal.vue'
import ImageUploader from '@shared/components/ImageUploader.vue'
import { api } from '@shared/api/gasClient'
import { useAuthStore } from '../stores/auth'
import { formatRupiah, formatTanggal, formatMetode, formatKategori, getTodayISO, getCurrentPeriode } from '@shared/utils/formatters'
import type { KasKeluar, KategoriKasKeluar, SumberKas } from '@shared/types'

const authStore = useAuthStore()
const data = ref<KasKeluar[]>([])
const isLoading = ref(false)
const isSubmitting = ref(false)
const showModal = ref(false)
const filterKategori = ref('')
const filterSumber = ref('')
const photoBase64 = ref('')
const photoFilename = ref('')

const kategoriOptions = [
  { value: 'BAHAN_BAKU', label: 'Bahan Baku Kertas', shortLabel: 'Bahan Baku' },
  { value: 'OPERASIONAL', label: 'Operasional / Listrik', shortLabel: 'Operasional' },
  { value: 'GAJI', label: 'Gaji & Lembur', shortLabel: 'Gaji' },
  { value: 'KONSUMSI', label: 'Konsumsi', shortLabel: 'Konsumsi' },
  { value: 'LAIN_LAIN', label: 'Lain-lain', shortLabel: 'Lain-lain' },
]

const sumberOptions = [
  { value: 'KASIR_TUNAI', label: 'Tunai' },
  { value: 'BANK', label: 'Bank' },
  { value: 'QRIS', label: 'QRIS' },
]

const form = ref({
  tanggal: getTodayISO(),
  kategori: '' as KategoriKasKeluar,
  rincian: '',
  nominal: 0,
  sumber_kas: 'KASIR_TUNAI' as SumberKas,
})

const filteredData = computed(() => {
  return data.value.filter((d) => {
    if (filterKategori.value && d.kategori !== filterKategori.value) return false
    if (filterSumber.value && d.sumber_kas !== filterSumber.value) return false
    return true
  })
})

// 4 Stats Computeds (Overall metrics)
const totalSemuaKeluar = computed(() => data.value.reduce((s, d) => s + (Number(d.nominal) || 0), 0))

const totalBulanIni = computed(() => {
  const curMonth = getCurrentPeriode()
  return data.value
    .filter((d) => d.tanggal && String(d.tanggal).startsWith(curMonth))
    .reduce((s, d) => s + (Number(d.nominal) || 0), 0)
})

const totalHariIni = computed(() => {
  const today = getTodayISO()
  return data.value
    .filter((d) => d.tanggal && String(d.tanggal).startsWith(today))
    .reduce((s, d) => s + (Number(d.nominal) || 0), 0)
})

const totalKasirTunai = computed(() => {
  return data.value
    .filter((d) => d.sumber_kas === 'KASIR_TUNAI')
    .reduce((s, d) => s + (Number(d.nominal) || 0), 0)
})

const summaryMetrics = computed(() => [
  { label: 'Total Keluar', value: formatRupiah(totalSemuaKeluar.value), valueClass: 'text-rose-600' },
  { label: 'Bulan Ini', value: formatRupiah(totalBulanIni.value) },
  { label: 'Hari Ini', value: formatRupiah(totalHariIni.value) },
  { label: 'Kasir Tunai', value: formatRupiah(totalKasirTunai.value), valueClass: 'text-amber-600' },
])

function onNominalInput(e: Event) {
  const target = e.target as HTMLInputElement
  const raw = target.value.replace(/\D/g, '')
  const num = raw ? parseInt(raw, 10) : 0
  form.value.nominal = num
  target.value = num ? num.toLocaleString('id-ID') : ''
}

function handlePhotoChange(uploadData: { base64: string; filename: string } | null) {
  if (uploadData) {
    photoBase64.value = uploadData.base64
    photoFilename.value = uploadData.filename
  } else {
    photoBase64.value = ''
    photoFilename.value = ''
  }
}

async function submitKasKeluar() {
  isSubmitting.value = true
  try {
    const res = await api.createKasKeluar({
      tanggal: form.value.tanggal,
      kategori: form.value.kategori,
      rincian: form.value.rincian,
      nominal: form.value.nominal,
      sumber_kas: form.value.sumber_kas,
      diinput_oleh: authStore.nama ?? 'OWNER',
      foto_base64: photoBase64.value || undefined,
      foto_filename: photoFilename.value || undefined,
    })
    if (res.success) {
      showModal.value = false
      photoBase64.value = ''
      photoFilename.value = ''
      form.value = { tanggal: getTodayISO(), kategori: '' as any, rincian: '', nominal: 0, sumber_kas: 'KASIR_TUNAI' }
      await loadData()
    }
  } finally {
    isSubmitting.value = false
  }
}

async function loadData() {
  isLoading.value = true
  try {
    const res = await api.getKasKeluar()
    if (res.success && res.data) data.value = res.data
  } finally {
    isLoading.value = false
  }
}

onMounted(loadData)
</script>
