import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface CompanyProfile {
  nama: string
  badan_usaha: string
  alamat: string
  kota_kodepos: string
  negara: string
  tax_number: string
  bank_name: string
  no_rekening: string
  atas_nama: string
  email: string
  no_telp: string
  website: string
  terms_conditions: string
  default_notes: string
}

export const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  nama: 'KBM Printing',
  badan_usaha: 'Corporation',
  alamat: 'Jl. Percetakan KBM No. 8',
  kota_kodepos: '55281 Sleman, D.I. Yogyakarta',
  negara: 'Indonesia',
  tax_number: '94-1234567',
  bank_name: 'BCA',
  no_rekening: '123-456-7890',
  atas_nama: 'KBM Printing',
  email: 'accounting@kbmprinting.com',
  no_telp: '+62 812-3456-7890',
  website: 'www.kbmprinting.com',
  terms_conditions: 'DP minimal 50% sebelum proses cetak & penjilidan. Pelunasan dilakukan saat buku siap dikirim.',
  default_notes: 'Kualitas cetakan dijamin rapi sesuai standar buku penerbit KBM Printing.',
}

const STORAGE_KEY = 'kbm_company_profile_v1'

function loadProfileFromStorage(): CompanyProfile {
  if (typeof window === 'undefined') return { ...DEFAULT_COMPANY_PROFILE }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_COMPANY_PROFILE }
    return { ...DEFAULT_COMPANY_PROFILE, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_COMPANY_PROFILE }
  }
}

export const useCompanyStore = defineStore('company', () => {
  const profile = ref<CompanyProfile>(loadProfileFromStorage())

  function updateProfile(patch: Partial<CompanyProfile>) {
    profile.value = { ...profile.value, ...patch }
    saveToStorage()
  }

  function resetProfile() {
    profile.value = { ...DEFAULT_COMPANY_PROFILE }
    saveToStorage()
  }

  function saveToStorage() {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile.value))
    } catch (err) {
      console.error('Failed to save company profile to localStorage:', err)
    }
  }

  return {
    profile,
    updateProfile,
    resetProfile,
  }
})
