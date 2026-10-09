import { sql } from '../db'

export interface CompanySettingsPayload {
  nama?: string
  badan_usaha?: string
  alamat?: string
  kota_kodepos?: string
  negara?: string
  tax_number?: string
  bank_name?: string
  no_rekening?: string
  atas_nama?: string
  email?: string
  no_telp?: string
  website?: string
  terms_conditions?: string
  default_notes?: string
}

export async function handleGetCompanySettings() {
  try {
    const rows = await sql`
      SELECT nama, badan_usaha, alamat, kota_kodepos, negara,
             tax_number, bank_name, no_rekening, atas_nama,
             email, no_telp, website, terms_conditions, default_notes
      FROM company_settings
      WHERE id = 'default'
      LIMIT 1
    `
    if (rows.length > 0) {
      return { success: true, data: rows[0] }
    }
    return { success: true, data: null }
  } catch (err: any) {
    console.error('Error fetching company settings:', err)
    return { success: false, error: err?.message || 'Gagal mengambil pengaturan perusahaan' }
  }
}

export async function handleUpdateCompanySettings(payload: CompanySettingsPayload) {
  try {
    const rows = await sql`
      INSERT INTO company_settings (
        id, nama, badan_usaha, alamat, kota_kodepos, negara,
        tax_number, bank_name, no_rekening, atas_nama,
        email, no_telp, website, terms_conditions, default_notes, updated_at
      )
      VALUES (
        'default',
        ${payload.nama ?? 'KBM Printing'},
        ${payload.badan_usaha ?? 'Corporation'},
        ${payload.alamat ?? 'Jl. Percetakan KBM No. 8'},
        ${payload.kota_kodepos ?? '55281 Sleman, D.I. Yogyakarta'},
        ${payload.negara ?? 'Indonesia'},
        ${payload.tax_number ?? '94-1234567'},
        ${payload.bank_name ?? 'BCA'},
        ${payload.no_rekening ?? '123-456-7890'},
        ${payload.atas_nama ?? 'KBM Printing'},
        ${payload.email ?? 'accounting@kbmprinting.com'},
        ${payload.no_telp ?? '+62 812-3456-7890'},
        ${payload.website ?? 'www.kbmprinting.com'},
        ${payload.terms_conditions ?? ''},
        ${payload.default_notes ?? ''},
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        nama = COALESCE(EXCLUDED.nama, company_settings.nama),
        badan_usaha = COALESCE(EXCLUDED.badan_usaha, company_settings.badan_usaha),
        alamat = COALESCE(EXCLUDED.alamat, company_settings.alamat),
        kota_kodepos = COALESCE(EXCLUDED.kota_kodepos, company_settings.kota_kodepos),
        negara = COALESCE(EXCLUDED.negara, company_settings.negara),
        tax_number = COALESCE(EXCLUDED.tax_number, company_settings.tax_number),
        bank_name = COALESCE(EXCLUDED.bank_name, company_settings.bank_name),
        no_rekening = COALESCE(EXCLUDED.no_rekening, company_settings.no_rekening),
        atas_nama = COALESCE(EXCLUDED.atas_nama, company_settings.atas_nama),
        email = COALESCE(EXCLUDED.email, company_settings.email),
        no_telp = COALESCE(EXCLUDED.no_telp, company_settings.no_telp),
        website = COALESCE(EXCLUDED.website, company_settings.website),
        terms_conditions = COALESCE(EXCLUDED.terms_conditions, company_settings.terms_conditions),
        default_notes = COALESCE(EXCLUDED.default_notes, company_settings.default_notes),
        updated_at = NOW()
      RETURNING *
    `
    return {
      success: true,
      data: rows[0],
      message: 'Pengaturan perusahaan berhasil disimpan ke PostgreSQL',
    }
  } catch (err: any) {
    console.error('Error updating company settings:', err)
    return { success: false, error: err?.message || 'Gagal menyimpan pengaturan perusahaan' }
  }
}
