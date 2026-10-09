import { sql } from '../db'
import { generateId } from './idGenerator'

// ---- KAS MASUK ----

export async function handleGetKasMasuk(params: Record<string, string> = {}) {
  const id_order = params.id_order && params.id_order !== 'undefined' ? params.id_order.trim() : ''
  const status = params.status && params.status !== 'all' ? params.status.trim() : ''

  let query = sql`SELECT * FROM kas_masuk`
  if (id_order && status) {
    query = sql`SELECT * FROM kas_masuk WHERE id_order = ${id_order} AND status_verifikasi = ${status} ORDER BY tanggal DESC, id_kas_masuk DESC;`
  } else if (id_order) {
    query = sql`SELECT * FROM kas_masuk WHERE id_order = ${id_order} ORDER BY tanggal DESC, id_kas_masuk DESC;`
  } else if (status) {
    query = sql`SELECT * FROM kas_masuk WHERE status_verifikasi = ${status} ORDER BY tanggal DESC, id_kas_masuk DESC;`
  } else {
    query = sql`SELECT * FROM kas_masuk ORDER BY tanggal DESC, id_kas_masuk DESC;`
  }

  const rows = await query
  const data = rows.map((k: any) => ({
    ...k,
    nominal: Number(k.nominal) || 0,
    tanggal: typeof k.tanggal === 'string' ? k.tanggal.substring(0, 10) : new Date(k.tanggal).toISOString().substring(0, 10),
  }))

  return { success: true, data }
}

export async function handleCreateKasMasuk(body: any) {
  return await sql.begin(async (tx) => {
    let nama_penerbit = body.nama_penerbit || ''

    // Validasi eksistensi order bila id_order disertakan
    if (body.id_order && String(body.id_order).trim()) {
      const targetOrderId = String(body.id_order).trim()
      const [ord] = await tx`SELECT id_order, nama_penerbit FROM orders WHERE id_order = ${targetOrderId} LIMIT 1;`
      if (!ord) {
        return { success: false, error: `Order tujuan '${targetOrderId}' tidak ditemukan` }
      }
      if (!nama_penerbit) nama_penerbit = ord.nama_penerbit
    }

    const id_kas_masuk = await generateId('KM', tx)
    const tanggal = body.tanggal
      ? String(body.tanggal).trim().substring(0, 10)
      : new Date().toISOString().substring(0, 10)

    const status_verifikasi = body.status_verifikasi || (body.diinput_oleh === 'OWNER' ? 'VERIFIED' : 'PENDING')

    await tx`
      INSERT INTO kas_masuk (
        id_kas_masuk, tanggal, id_order, nama_penerbit, jenis_pembayaran,
        nominal, metode, diinput_oleh, status_verifikasi, file_id_bukti, link_bukti, keterangan
      ) VALUES (
        ${id_kas_masuk}, ${tanggal}, ${body.id_order && String(body.id_order).trim() ? String(body.id_order).trim() : null}, ${nama_penerbit},
        ${body.jenis_pembayaran || 'DP'}, ${Number(body.nominal) || 0}, ${body.metode || 'BANK'},
        ${body.diinput_oleh || 'KASIR'}, ${status_verifikasi}, ${body.file_id_bukti || ''},
        ${body.link_bukti || ''}, ${body.keterangan || ''}
      );
    `

    return { success: true, data: { id_kas_masuk } }
  })
}

export async function handleVerifyKasMasuk(body: any) {
  const { id_kas_masuk } = body
  if (!id_kas_masuk) return { success: false, error: 'id_kas_masuk wajib diisi' }

  await sql`
    UPDATE kas_masuk
    SET status_verifikasi = 'VERIFIED',
        updated_at = NOW()
    WHERE id_kas_masuk = ${id_kas_masuk};
  `
  return { success: true, data: { id_kas_masuk } }
}

export async function handleUpdateKasMasuk(body: any) {
  const { id_kas_masuk } = body
  if (!id_kas_masuk) return { success: false, error: 'id_kas_masuk wajib diisi' }

  // Validasi order tujuan jika id_order diperbarui dan tidak kosong
  if (body.id_order !== undefined && body.id_order !== null && String(body.id_order).trim() !== '') {
    const targetOrderId = String(body.id_order).trim()
    const exists = await sql`SELECT 1 FROM orders WHERE id_order = ${targetOrderId} LIMIT 1;`
    if (!exists.length) {
      return { success: false, error: `Order tujuan '${targetOrderId}' tidak ditemukan` }
    }
  }

  await sql`
    UPDATE kas_masuk SET
      tanggal = COALESCE(${body.tanggal ? String(body.tanggal).substring(0, 10) : null}, tanggal),
      nominal = COALESCE(${body.nominal ? Number(body.nominal) : null}, nominal),
      metode = COALESCE(${body.metode}, metode),
      keterangan = COALESCE(${body.keterangan}, keterangan),
      nama_penerbit = COALESCE(${body.nama_penerbit}, nama_penerbit),
      id_order = ${body.id_order !== undefined ? (body.id_order && String(body.id_order).trim() ? String(body.id_order).trim() : null) : sql`id_order`},
      jenis_pembayaran = COALESCE(${body.jenis_pembayaran}, jenis_pembayaran),
      status_verifikasi = COALESCE(${body.status_verifikasi}, status_verifikasi),
      updated_at = NOW()
    WHERE id_kas_masuk = ${id_kas_masuk};
  `
  return { success: true, message: 'Kas masuk berhasil diperbarui' }
}

export async function handleDeleteKasMasuk(body: any) {
  const { id_kas_masuk } = body
  if (!id_kas_masuk) return { success: false, error: 'id_kas_masuk wajib diisi' }

  await sql`UPDATE kas_masuk SET status_verifikasi = 'BATAL', updated_at = NOW() WHERE id_kas_masuk = ${id_kas_masuk};`
  return { success: true, message: 'Kas masuk berhasil dibatalkan' }
}

// ---- KAS KELUAR ----

export async function handleGetKasKeluar() {
  const rows = await sql`SELECT * FROM kas_keluar ORDER BY tanggal DESC, id_kas_keluar DESC;`
  const data = rows.map((k: any) => ({
    ...k,
    nominal: Number(k.nominal) || 0,
    tanggal: typeof k.tanggal === 'string' ? k.tanggal.substring(0, 10) : new Date(k.tanggal).toISOString().substring(0, 10),
  }))
  return { success: true, data }
}

export async function handleCreateKasKeluar(body: any) {
  return await sql.begin(async (tx) => {
    const id_kas_keluar = await generateId('KK', tx)
    const tanggal = body.tanggal
      ? String(body.tanggal).trim().substring(0, 10)
      : new Date().toISOString().substring(0, 10)

    await tx`
      INSERT INTO kas_keluar (
        id_kas_keluar, tanggal, kategori, rincian, nominal, sumber_kas,
        diinput_oleh, file_id_nota, link_nota
      ) VALUES (
        ${id_kas_keluar}, ${tanggal}, ${body.kategori || 'OPERASIONAL'}, ${body.rincian || ''},
        ${Number(body.nominal) || 0}, ${body.sumber_kas || 'BANK'}, ${body.diinput_oleh || 'KASIR'},
        ${body.file_id_nota || ''}, ${body.link_nota || ''}
      );
    `
    return { success: true, data: { id_kas_keluar } }
  })
}

export async function handleUpdateKasKeluar(body: any) {
  const { id_kas_keluar } = body
  if (!id_kas_keluar) return { success: false, error: 'id_kas_keluar wajib diisi' }
  await sql`
    UPDATE kas_keluar SET
      tanggal = COALESCE(${body.tanggal ? String(body.tanggal).substring(0, 10) : null}, tanggal),
      kategori = COALESCE(${body.kategori}, kategori),
      rincian = COALESCE(${body.rincian}, rincian),
      nominal = COALESCE(${body.nominal ? Number(body.nominal) : null}, nominal),
      sumber_kas = COALESCE(${body.sumber_kas}, sumber_kas),
      updated_at = NOW()
    WHERE id_kas_keluar = ${id_kas_keluar};
  `
  return { success: true, message: 'Kas keluar berhasil diperbarui' }
}

export async function handleDeleteKasKeluar(body: any) {
  const { id_kas_keluar } = body
  if (!id_kas_keluar) return { success: false, error: 'id_kas_keluar wajib diisi' }
  await sql`DELETE FROM kas_keluar WHERE id_kas_keluar = ${id_kas_keluar};`
  return { success: true, message: 'Kas keluar berhasil dihapus' }
}
