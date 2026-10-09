import { sql } from '../db'
import { generateId } from './idGenerator'

export async function handleGetOrders(params: Record<string, string> = {}) {
  const status = params.status && params.status !== 'all' ? params.status.trim() : ''
  const search = params.search ? params.search.trim().toLowerCase() : ''

  let query = sql`SELECT * FROM orders`

  if (status && search) {
    const searchPattern = `%${search}%`
    query = sql`SELECT * FROM orders WHERE status_order = ${status} AND (LOWER(nama_penerbit) LIKE ${searchPattern} OR LOWER(judul_penulis) LIKE ${searchPattern} OR LOWER(id_order) LIKE ${searchPattern}) ORDER BY tanggal DESC, id_order DESC;`
  } else if (status) {
    query = sql`SELECT * FROM orders WHERE status_order = ${status} ORDER BY tanggal DESC, id_order DESC;`
  } else if (search) {
    const searchPattern = `%${search}%`
    query = sql`SELECT * FROM orders WHERE (LOWER(nama_penerbit) LIKE ${searchPattern} OR LOWER(judul_penulis) LIKE ${searchPattern} OR LOWER(id_order) LIKE ${searchPattern}) ORDER BY tanggal DESC, id_order DESC;`
  } else {
    query = sql`SELECT * FROM orders ORDER BY tanggal DESC, id_order DESC;`
  }

  const rows = await query
  const data = rows.map((o: any) => ({
    ...o,
    jml_pcs: Number(o.jml_pcs) || 0,
    cetak_bw: Number(o.cetak_bw) || 0,
    cetak_fc: Number(o.cetak_fc) || 0,
    packing_dus_qty: Number(o.packing_dus_qty) || 0,
    biaya_packing: Number(o.biaya_packing) || 0,
    total_harga: Number(o.total_harga) || 0,
    tanggal: typeof o.tanggal === 'string' ? o.tanggal.substring(0, 10) : new Date(o.tanggal).toISOString().substring(0, 10),
    finishing: Array.isArray(o.finishing) ? o.finishing : (typeof o.finishing === 'string' ? JSON.parse(o.finishing || '[]') : []),
  }))

  return { success: true, data }
}

export async function handleCreateOrder(body: any) {
  const order = body.order || body
  const id_order = await generateId('ORD')
  const tanggal = (order.tanggal && String(order.tanggal).trim())
    ? String(order.tanggal).trim().substring(0, 10)
    : new Date().toISOString().substring(0, 10)

  const combinedJudulPenulis = order.judul_penulis || (order.nama_penulis ? `${order.judul_buku} / ${order.nama_penulis}` : order.judul_buku || '')
  const finishingJson = JSON.stringify(Array.isArray(order.finishing) ? order.finishing : [])

  await sql`
    INSERT INTO orders (
      id_order, tanggal, nama_penerbit, judul_penulis, judul_buku, nama_penulis,
      jml_pcs, ukuran, ukuran_custom, kertas, kertas_bw, kertas_fc,
      cetak_bw, cetak_fc, finishing, packing_dus_tipe, packing_dus_qty,
      biaya_packing, total_harga, status_order, catatan, alamat_penerbit, kontak_penerbit, link_bukti, skema_harga
    ) VALUES (
      ${id_order}, ${tanggal}, ${order.nama_penerbit || ''}, ${combinedJudulPenulis},
      ${order.judul_buku || ''}, ${order.nama_penulis || ''}, ${Number(order.jml_pcs) || 0},
      ${order.ukuran || ''}, ${order.ukuran_custom || ''}, ${order.kertas || ''},
      ${order.kertas_bw || ''}, ${order.kertas_fc || ''}, ${Number(order.cetak_bw) || 0},
      ${Number(order.cetak_fc) || 0}, ${finishingJson}::jsonb, ${order.packing_dus_tipe || ''},
      ${Number(order.packing_dus_qty) || 0}, ${Number(order.biaya_packing) || 0},
      ${Number(order.total_harga) || 0}, ${'PROSES'}, ${order.catatan || ''},
      ${order.alamat_penerbit || ''}, ${order.kontak_penerbit || ''}, ${order.link_bukti || ''},
      ${order.skema_harga || 'NORMAL'}
    );
  `

  if (order.nama_penerbit && order.nama_penerbit.trim()) {
    await sql`
      INSERT INTO clients (nama_penerbit, kontak, alamat)
      VALUES (${order.nama_penerbit.trim()}, ${order.kontak_penerbit || ''}, ${order.alamat_penerbit || ''})
      ON CONFLICT (nama_penerbit) DO UPDATE
      SET kontak = COALESCE(NULLIF(EXCLUDED.kontak, ''), clients.kontak),
          alamat = COALESCE(NULLIF(EXCLUDED.alamat, ''), clients.alamat);
    `
  }

  const seq = id_order.split('-')[2]
  const now = new Date()
  const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
  const nomor_invoice = `INV-${yyyymm}-${seq}`

  return { success: true, data: { id_order, nomor_invoice } }
}

export async function handleUpdateOrder(body: any) {
  const order = body.order || body
  const id_order = order.id_order
  if (!id_order) return { success: false, error: 'id_order wajib diisi' }

  const combinedJudulPenulis = order.judul_penulis || (order.nama_penulis ? `${order.judul_buku} / ${order.nama_penulis}` : order.judul_buku || '')
  const finishingJson = JSON.stringify(Array.isArray(order.finishing) ? order.finishing : [])

  await sql`
    UPDATE orders SET
      nama_penerbit = COALESCE(${order.nama_penerbit}, nama_penerbit),
      judul_penulis = ${combinedJudulPenulis},
      judul_buku = COALESCE(${order.judul_buku}, judul_buku),
      nama_penulis = COALESCE(${order.nama_penulis}, nama_penulis),
      jml_pcs = COALESCE(${Number(order.jml_pcs)}, jml_pcs),
      ukuran = COALESCE(${order.ukuran}, ukuran),
      ukuran_custom = COALESCE(${order.ukuran_custom}, ukuran_custom),
      kertas = COALESCE(${order.kertas}, kertas),
      kertas_bw = COALESCE(${order.kertas_bw}, kertas_bw),
      kertas_fc = COALESCE(${order.kertas_fc}, kertas_fc),
      cetak_bw = COALESCE(${Number(order.cetak_bw)}, cetak_bw),
      cetak_fc = COALESCE(${Number(order.cetak_fc)}, cetak_fc),
      finishing = ${finishingJson}::jsonb,
      packing_dus_tipe = COALESCE(${order.packing_dus_tipe}, packing_dus_tipe),
      packing_dus_qty = COALESCE(${Number(order.packing_dus_qty)}, packing_dus_qty),
      biaya_packing = COALESCE(${Number(order.biaya_packing)}, biaya_packing),
      total_harga = COALESCE(${Number(order.total_harga)}, total_harga),
      skema_harga = COALESCE(${order.skema_harga}, skema_harga),
      status_order = COALESCE(${order.status_order}, status_order),
      catatan = COALESCE(${order.catatan}, catatan),
      alamat_penerbit = COALESCE(${order.alamat_penerbit}, alamat_penerbit),
      kontak_penerbit = COALESCE(${order.kontak_penerbit}, kontak_penerbit),
      link_bukti = COALESCE(${order.link_bukti}, link_bukti),
      updated_at = NOW()
    WHERE id_order = ${id_order};
  `

  return { success: true, data: { id_order } }
}

export async function handleUpdateOrderStatus(body: any) {
  const { id_order, status } = body
  if (!id_order || !status) return { success: false, error: 'id_order dan status wajib diisi' }

  await sql`UPDATE orders SET status_order = ${status}, updated_at = NOW() WHERE id_order = ${id_order};`
  return { success: true, data: { id_order, status } }
}

export async function handleDeleteOrder(body: any) {
  const { id_order, permanent } = body
  if (!id_order) return { success: false, error: 'id_order wajib diisi' }

  if (permanent === true) {
    const payments = await sql`
      SELECT id_kas_masuk, nominal, status_verifikasi
      FROM kas_masuk
      WHERE id_order = ${id_order} AND status_verifikasi != 'BATAL';
    `
    if (payments.length > 0) {
      const totalNominal = payments.reduce((s: number, p: any) => s + Number(p.nominal), 0)
      return {
        success: false,
        error: `Order tidak dapat dihapus permanen karena memiliki ${payments.length} transaksi kas masuk senilai Rp ${totalNominal.toLocaleString('id-ID')}. Batalkan terlebih dahulu transaksi di Buku Kas.`,
      }
    }

    try {
      // 1. Jika ada pembayaran yang dialihkan ke DEPOSIT penerbit, lepaskan relasi id_order agar saldo deposit tetap tersimpan
      await sql`UPDATE kas_masuk SET id_order = NULL WHERE id_order = ${id_order} AND jenis_pembayaran = 'DEPOSIT';`

      // 2. Hapus transaksi kas masuk terkait order ini (yang berstatus BATAL / non-deposit)
      await sql`DELETE FROM kas_masuk WHERE id_order = ${id_order};`

      // 3. Hapus transaksi kas keluar refund terkait order ini (jika ada)
      await sql`DELETE FROM kas_keluar WHERE kategori = 'REFUND' AND rincian LIKE ${`%${id_order}%`};`

      // 4. Hapus data order secara permanen
      await sql`DELETE FROM orders WHERE id_order = ${id_order};`
      return { success: true, data: { id_order, permanent: true } }
    } catch (err: any) {
      console.error(`Gagal menghapus order permanen ${id_order}:`, err)
      return { success: false, error: err?.message || 'Gagal menghapus order permanen dari database' }
    }
  } else {
    try {
      await sql`UPDATE orders SET status_order = 'BATAL', updated_at = NOW() WHERE id_order = ${id_order};`
      return { success: true, data: { id_order, permanent: false } }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal membatalkan order' }
    }
  }
}
