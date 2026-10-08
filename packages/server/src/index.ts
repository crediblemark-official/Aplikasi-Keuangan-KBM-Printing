import { Hono } from 'hono'
import { cors } from 'hono/cors'
import postgres from 'postgres'
import { DATABASE_URL, bunSql, sqlStorage, sql } from './db'

const app = new Hono()

app.use('*', cors())

// Isolasi koneksi database per-request untuk Cloudflare Workers
app.use('*', async (c, next) => {
  if (bunSql) {
    return await next()
  }

  const dbUrl = (c.env as any)?.DATABASE_URL || DATABASE_URL
  const db = postgres(dbUrl, {
    prepare: false,
    max: 5,
    idle_timeout: 1,
    connect_timeout: 15,
  })

  try {
    await sqlStorage.run(db, async () => {
      await next()
    })
  } finally {
    try {
      await db.end({ timeout: 1 })
    } catch {}
  }
})

// Helper generate ID sequence
async function generateId(prefix: 'ORD' | 'KM' | 'KK'): Promise<string> {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const period = `${yyyy}${mm}`
  const pattern = `${prefix}-${period}-%`

  let rows: { id: string }[] = []
  if (prefix === 'ORD') {
    rows = await sql`SELECT id_order as id FROM orders WHERE id_order LIKE ${pattern} ORDER BY id_order DESC LIMIT 1;`
  } else if (prefix === 'KM') {
    rows = await sql`SELECT id_kas_masuk as id FROM kas_masuk WHERE id_kas_masuk LIKE ${pattern} ORDER BY id_kas_masuk DESC LIMIT 1;`
  } else {
    rows = await sql`SELECT id_kas_keluar as id FROM kas_keluar WHERE id_kas_keluar LIKE ${pattern} ORDER BY id_kas_keluar DESC LIMIT 1;`
  }

  let nextSeq = 1
  if (rows.length > 0 && rows[0].id) {
    const parts = rows[0].id.split('-')
    const lastNum = parseInt(parts[2], 10)
    if (!isNaN(lastNum)) nextSeq = lastNum + 1
  }

  return `${prefix}-${period}-${String(nextSeq).padStart(3, '0')}`
}

// ---- SERVICE LOGIC ----

async function handleGetOrders(params: Record<string, string> = {}) {
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

async function handleCreateOrder(body: any) {
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

async function handleUpdateOrder(body: any) {
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

async function handleUpdateOrderStatus(body: any) {
  const { id_order, status } = body
  if (!id_order || !status) return { success: false, error: 'id_order dan status wajib diisi' }

  await sql`UPDATE orders SET status_order = ${status}, updated_at = NOW() WHERE id_order = ${id_order};`
  return { success: true, data: { id_order, status } }
}

async function handleDeleteOrder(body: any) {
  const { id_order, permanent } = body
  if (!id_order) return { success: false, error: 'id_order wajib diisi' }

  if (permanent === true) {
    // PROTEKSI INTEGRITAS KEUANGAN: Cek apakah ada mutasi kas masuk yang terkait
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

    await sql`DELETE FROM orders WHERE id_order = ${id_order};`
    return { success: true, data: { id_order, permanent: true } }
  } else {
    // Soft cancel
    await sql`UPDATE orders SET status_order = 'BATAL', updated_at = NOW() WHERE id_order = ${id_order};`
    return { success: true, data: { id_order, permanent: false } }
  }
}

// ---- KAS MASUK ----

async function handleGetKasMasuk(params: Record<string, string> = {}) {
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

async function handleCreateKasMasuk(body: any) {
  const id_kas_masuk = await generateId('KM')
  const tanggal = body.tanggal
    ? String(body.tanggal).trim().substring(0, 10)
    : new Date().toISOString().substring(0, 10)

  let nama_penerbit = body.nama_penerbit || ''
  if (body.id_order && !nama_penerbit) {
    const [ord] = await sql`SELECT nama_penerbit FROM orders WHERE id_order = ${body.id_order} LIMIT 1;`
    if (ord) nama_penerbit = ord.nama_penerbit
  }

  const status_verifikasi = body.status_verifikasi || (body.diinput_oleh === 'OWNER' ? 'VERIFIED' : 'PENDING')

  await sql`
    INSERT INTO kas_masuk (
      id_kas_masuk, tanggal, id_order, nama_penerbit, jenis_pembayaran,
      nominal, metode, diinput_oleh, status_verifikasi, file_id_bukti, link_bukti, keterangan
    ) VALUES (
      ${id_kas_masuk}, ${tanggal}, ${body.id_order || null}, ${nama_penerbit},
      ${body.jenis_pembayaran || 'DP'}, ${Number(body.nominal) || 0}, ${body.metode || 'BANK'},
      ${body.diinput_oleh || 'KASIR'}, ${status_verifikasi}, ${body.file_id_bukti || ''},
      ${body.link_bukti || ''}, ${body.keterangan || ''}
    );
  `

  return { success: true, data: { id_kas_masuk } }
}

async function handleVerifyKasMasuk(body: any) {
  const { id_kas_masuk, verified_by } = body
  if (!id_kas_masuk) return { success: false, error: 'id_kas_masuk wajib diisi' }

  await sql`
    UPDATE kas_masuk
    SET status_verifikasi = 'VERIFIED',
        updated_at = NOW()
    WHERE id_kas_masuk = ${id_kas_masuk};
  `
  return { success: true, data: { id_kas_masuk } }
}

async function handleUpdateKasMasuk(body: any) {
  const { id_kas_masuk } = body
  if (!id_kas_masuk) return { success: false, error: 'id_kas_masuk wajib diisi' }

  await sql`
    UPDATE kas_masuk SET
      tanggal = COALESCE(${body.tanggal ? String(body.tanggal).substring(0, 10) : null}, tanggal),
      nominal = COALESCE(${body.nominal ? Number(body.nominal) : null}, nominal),
      metode = COALESCE(${body.metode}, metode),
      keterangan = COALESCE(${body.keterangan}, keterangan),
      nama_penerbit = COALESCE(${body.nama_penerbit}, nama_penerbit),
      jenis_pembayaran = COALESCE(${body.jenis_pembayaran}, jenis_pembayaran),
      status_verifikasi = COALESCE(${body.status_verifikasi}, status_verifikasi),
      updated_at = NOW()
    WHERE id_kas_masuk = ${id_kas_masuk};
  `
  return { success: true, message: 'Kas masuk berhasil diperbarui' }
}

async function handleDeleteKasMasuk(body: any) {
  const { id_kas_masuk } = body
  if (!id_kas_masuk) return { success: false, error: 'id_kas_masuk wajib diisi' }

  await sql`UPDATE kas_masuk SET status_verifikasi = 'BATAL', updated_at = NOW() WHERE id_kas_masuk = ${id_kas_masuk};`
  return { success: true, message: 'Kas masuk berhasil dibatalkan' }
}

// ---- KAS KELUAR ----

async function handleGetKasKeluar() {
  const rows = await sql`SELECT * FROM kas_keluar ORDER BY tanggal DESC, id_kas_keluar DESC;`
  const data = rows.map((k: any) => ({
    ...k,
    nominal: Number(k.nominal) || 0,
    tanggal: typeof k.tanggal === 'string' ? k.tanggal.substring(0, 10) : new Date(k.tanggal).toISOString().substring(0, 10),
  }))
  return { success: true, data }
}

async function handleCreateKasKeluar(body: any) {
  const id_kas_keluar = await generateId('KK')
  const tanggal = body.tanggal
    ? String(body.tanggal).trim().substring(0, 10)
    : new Date().toISOString().substring(0, 10)

  await sql`
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
}

async function handleUpdateKasKeluar(body: any) {
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

async function handleDeleteKasKeluar(body: any) {
  const { id_kas_keluar } = body
  if (!id_kas_keluar) return { success: false, error: 'id_kas_keluar wajib diisi' }
  await sql`DELETE FROM kas_keluar WHERE id_kas_keluar = ${id_kas_keluar};`
  return { success: true, message: 'Kas keluar berhasil dihapus' }
}

// ---- CLIENTS ----

async function handleGetClients() {
  const rows = await sql`SELECT * FROM clients ORDER BY nama_penerbit ASC;`
  return { success: true, data: rows }
}

// ---- FINANCE BUNDLE ----

async function handleGetFinanceBundle(params: Record<string, string> = {}) {
  const ordersRes = await handleGetOrders(params)
  const kmRes = await handleGetKasMasuk(params)
  const kkRes = await handleGetKasKeluar()
  const clientsRes = await handleGetClients()

  return {
    success: true,
    data: {
      orders: ordersRes.data || [],
      kas_masuk: kmRes.data || [],
      kas_keluar: kkRes.data || [],
      clients: clientsRes.data || [],
    },
  }
}

// Backup seluruh data PostgreSQL ke Google Sheets secara manual
async function handleSyncBackupToSheets(customGasUrl?: string) {
  try {
    const ordersRes = await handleGetOrders()
    const kmRes = await handleGetKasMasuk()
    const kkRes = await handleGetKasKeluar()
    const clientsRes = await handleGetClients()

    const gasUrl = customGasUrl || process.env.VITE_BACKUP_GAS_URL
    if (!gasUrl) {
      return { success: false, error: 'Variabel lingkungan VITE_BACKUP_GAS_URL belum dikonfigurasi' }
    }

    const payload = {
      action: 'syncBackup',
      orders: ordersRes.data || [],
      kas_masuk: kmRes.data || [],
      kas_keluar: kkRes.data || [],
      clients: clientsRes.data || [],
    }

    const res = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow',
    })

    const json = await res.json()
    if (!json.success && json.error?.includes('syncBackup')) {
      return {
        success: false,
        error: 'Google Apps Script belum di-deploy ulang. Silakan buka script.google.com, salin isi file gas/Code.gs terbaru, dan Deploy versi baru.',
      }
    }
    return json
  } catch (err: any) {
    return { success: false, error: 'Gagal menghubungi Google Apps Script: ' + (err?.message || err) }
  }
}

// Unified Router for both REST and GAS query-based compatibility
async function dispatchAction(action: string, params: any, body: any, env?: any) {
  switch (action) {
    case 'ping':
      return { success: true, message: 'pong', timestamp: Date.now() }
    case 'syncBackup':
    case 'syncBackupToSheets':
      return handleSyncBackupToSheets(env?.VITE_BACKUP_GAS_URL)
    case 'getFinanceBundle':
      return handleGetFinanceBundle(params)
    case 'getOrders':
      return handleGetOrders(params)
    case 'createOrder':
      return handleCreateOrder(body)
    case 'updateOrder':
      return handleUpdateOrder(body)
    case 'updateOrderStatus':
      return handleUpdateOrderStatus(body)
    case 'deleteOrder':
      return handleDeleteOrder(body)
    case 'getKasMasuk':
      return handleGetKasMasuk(params)
    case 'createKasMasuk':
      return handleCreateKasMasuk(body)
    case 'verifyKasMasuk':
      return handleVerifyKasMasuk(body)
    case 'updateKasMasuk':
      return handleUpdateKasMasuk(body)
    case 'deleteKasMasuk':
      return handleDeleteKasMasuk(body)
    case 'getKasKeluar':
      return handleGetKasKeluar()
    case 'createKasKeluar':
      return handleCreateKasKeluar(body)
    case 'updateKasKeluar':
      return handleUpdateKasKeluar(body)
    case 'deleteKasKeluar':
      return handleDeleteKasKeluar(body)
    case 'getClients':
      return handleGetClients()
    default:
      return { success: false, error: `Action '${action}' tidak dikenal` }
  }
}

// Route handlers
app.get('/api', async (c) => {
  const query = c.req.query()
  const action = query.action || 'ping'
  const result = await dispatchAction(action, query, {}, c.env)
  return c.json(result)
})

app.post('/api', async (c) => {
  const query = c.req.query()
  let body: any = {}
  try {
    body = await c.req.json()
  } catch {
    body = {}
  }
  const action = body.action || query.action || 'ping'
  const result = await dispatchAction(action, query, body, c.env)
  return c.json(result)
})

// REST endpoints
app.get('/api/ping', (c) => c.json({ success: true, message: 'pong', timestamp: Date.now() }))
app.get('/api/finance/bundle', async (c) => c.json(await handleGetFinanceBundle(c.req.query())))
app.get('/api/clients', async (c) => c.json(await handleGetClients()))
app.get('/api/orders', async (c) => c.json(await handleGetOrders(c.req.query())))
app.post('/api/orders', async (c) => c.json(await handleCreateOrder(await c.req.json())))
app.put('/api/orders', async (c) => c.json(await handleUpdateOrder(await c.req.json())))
app.delete('/api/orders', async (c) => c.json(await handleDeleteOrder(await c.req.json())))
app.get('/api/kas-masuk', async (c) => c.json(await handleGetKasMasuk(c.req.query())))
app.post('/api/kas-masuk', async (c) => c.json(await handleCreateKasMasuk(await c.req.json())))
app.get('/api/kas-keluar', async (c) => c.json(await handleGetKasKeluar()))
app.post('/api/kas-keluar', async (c) => c.json(await handleCreateKasKeluar(await c.req.json())))
app.post('/api/backup/sheets', async (c) => c.json(await handleSyncBackupToSheets((c.env as any)?.VITE_BACKUP_GAS_URL)))

const PORT = Number(process.env.PORT) || 3001

console.log(`🚀 KBM PostgreSQL API Server running on http://localhost:${PORT}`)

export default {
  port: PORT,
  fetch: app.fetch,
}
