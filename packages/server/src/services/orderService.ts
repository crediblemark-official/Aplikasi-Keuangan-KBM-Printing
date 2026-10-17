import { sql } from '../db'
import { generateId } from './idGenerator'

export async function handleGetOrders(params: Record<string, string> = {}) {
  const status = params.status && params.status !== 'all' ? params.status.trim() : ''
  const search = params.search ? params.search.trim().toLowerCase() : ''
  const id_order = params.id_order ? params.id_order.trim() : ''

  let query = sql`SELECT * FROM orders`

  if (id_order) {
    query = sql`SELECT * FROM orders WHERE id_order = ${id_order} LIMIT 1;`
  } else if (status && search) {
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
  const tanggal = (order.tanggal && String(order.tanggal).trim())
    ? String(order.tanggal).trim().substring(0, 10)
    : new Date().toISOString().substring(0, 10)

  const combinedJudulPenulis = order.judul_penulis || (order.nama_penulis ? `${order.judul_buku} / ${order.nama_penulis}` : order.judul_buku || '')
  const finishingJson = JSON.stringify(Array.isArray(order.finishing) ? order.finishing : [])

  return await sql.begin(async (tx) => {
    const id_order = await generateId('ORD', tx)

    await tx`
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
      await tx`
        INSERT INTO clients (nama_penerbit, kontak, alamat)
        VALUES (${order.nama_penerbit.trim()}, ${order.kontak_penerbit || ''}, ${order.alamat_penerbit || ''})
        ON CONFLICT (nama_penerbit) DO UPDATE
        SET kontak = COALESCE(NULLIF(EXCLUDED.kontak, ''), clients.kontak),
            alamat = COALESCE(NULLIF(EXCLUDED.alamat, ''), clients.alamat),
            updated_at = NOW();
      `
    }

    // Insert initial order log
    const actor = body.actor || body.diinput_oleh || 'Tim Operasional'
    const totalFmt = (Number(order.total_harga) || 0).toLocaleString('id-ID')
    await tx`
      INSERT INTO order_logs (id_order, action, actor, keterangan, changes)
      VALUES (
        ${id_order}, 'CREATE', ${actor},
        ${`Pesanan dibuat (Oplah: ${Number(order.jml_pcs) || 0} pcs, Nilai: Rp ${totalFmt})`},
        '[]'::jsonb
      );
    `

    const seq = id_order.split('-')[2]
    const now = new Date()
    const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
    const nomor_invoice = `INV-${yyyymm}-${seq}`

    return { success: true, data: { id_order, nomor_invoice } }
  })
}

export async function handleGetOrderLogs(params: Record<string, string> = {}) {
  const id_order = params.id_order ? params.id_order.trim() : ''
  if (!id_order) {
    return { success: false, error: 'id_order wajib diisi' }
  }

  const rows = await sql`
    SELECT id, id_order, action, actor, keterangan, changes, created_at
    FROM order_logs
    WHERE id_order = ${id_order}
    ORDER BY created_at DESC, id DESC;
  `

  const data = rows.map((r: any) => ({
    ...r,
    changes: Array.isArray(r.changes) ? r.changes : (typeof r.changes === 'string' ? JSON.parse(r.changes || '[]') : []),
    created_at: typeof r.created_at === 'string' ? r.created_at : new Date(r.created_at).toISOString(),
  }))

  return { success: true, data }
}

export async function handleUpdateOrder(body: any) {
  const order = body.order || body
  const id_order = order.id_order
  if (!id_order) return { success: false, error: 'id_order wajib diisi' }
  const actor = body.actor || body.diubah_oleh || body.diinput_oleh || 'Tim Operasional'

  return await sql.begin(async (tx) => {
    const existingRows = await tx`SELECT * FROM orders WHERE id_order = ${id_order} LIMIT 1;`
    if (existingRows.length === 0) {
      return { success: false, error: `Order ${id_order} tidak ditemukan` }
    }
    const oldOrder = existingRows[0]

    const combinedJudulPenulis = order.judul_penulis || (order.nama_penulis ? `${order.judul_buku} / ${order.nama_penulis}` : order.judul_buku || '')
    const finishingJson = JSON.stringify(Array.isArray(order.finishing) ? order.finishing : [])

    await tx`
      UPDATE orders SET
        nama_penerbit = COALESCE(${order.nama_penerbit ?? null}, nama_penerbit),
        judul_penulis = ${combinedJudulPenulis},
        judul_buku = COALESCE(${order.judul_buku ?? null}, judul_buku),
        nama_penulis = COALESCE(${order.nama_penulis ?? null}, nama_penulis),
        jml_pcs = COALESCE(${order.jml_pcs !== undefined && order.jml_pcs !== null ? Number(order.jml_pcs) : null}, jml_pcs),
        ukuran = COALESCE(${order.ukuran ?? null}, ukuran),
        ukuran_custom = COALESCE(${order.ukuran_custom ?? null}, ukuran_custom),
        kertas = COALESCE(${order.kertas ?? null}, kertas),
        kertas_bw = COALESCE(${order.kertas_bw ?? null}, kertas_bw),
        kertas_fc = COALESCE(${order.kertas_fc ?? null}, kertas_fc),
        cetak_bw = COALESCE(${order.cetak_bw !== undefined && order.cetak_bw !== null ? Number(order.cetak_bw) : null}, cetak_bw),
        cetak_fc = COALESCE(${order.cetak_fc !== undefined && order.cetak_fc !== null ? Number(order.cetak_fc) : null}, cetak_fc),
        finishing = ${finishingJson}::jsonb,
        packing_dus_tipe = COALESCE(${order.packing_dus_tipe ?? null}, packing_dus_tipe),
        packing_dus_qty = COALESCE(${order.packing_dus_qty !== undefined && order.packing_dus_qty !== null ? Number(order.packing_dus_qty) : null}, packing_dus_qty),
        biaya_packing = COALESCE(${order.biaya_packing !== undefined && order.biaya_packing !== null ? Number(order.biaya_packing) : null}, biaya_packing),
        total_harga = COALESCE(${order.total_harga !== undefined && order.total_harga !== null ? Number(order.total_harga) : null}, total_harga),
        skema_harga = COALESCE(${order.skema_harga ?? null}, skema_harga),
        status_order = COALESCE(${order.status_order ?? null}, status_order),
        catatan = COALESCE(${order.catatan ?? null}, catatan),
        alamat_penerbit = COALESCE(${order.alamat_penerbit ?? null}, alamat_penerbit),
        kontak_penerbit = COALESCE(${order.kontak_penerbit ?? null}, kontak_penerbit),
        link_bukti = COALESCE(${order.link_bukti ?? null}, link_bukti),
        updated_at = NOW()
      WHERE id_order = ${id_order};
    `

    // Hitung perubahan spesifikasi & harga
    const changes: Array<{ field: string; field_label: string; old_val: string; new_val: string }> = []

    const oldTotal = Number(oldOrder.total_harga) || 0
    const newTotal = order.total_harga !== undefined && order.total_harga !== null ? Number(order.total_harga) : oldTotal
    if (oldTotal !== newTotal) {
      changes.push({
        field: 'total_harga',
        field_label: 'Total Nilai Order',
        old_val: `Rp ${oldTotal.toLocaleString('id-ID')}`,
        new_val: `Rp ${newTotal.toLocaleString('id-ID')}`,
      })
    }

    const oldPcs = Number(oldOrder.jml_pcs) || 0
    const newPcs = order.jml_pcs !== undefined && order.jml_pcs !== null ? Number(order.jml_pcs) : oldPcs
    if (oldPcs !== newPcs) {
      changes.push({
        field: 'jml_pcs',
        field_label: 'Jumlah Oplah',
        old_val: `${oldPcs} pcs`,
        new_val: `${newPcs} pcs`,
      })
    }

    const oldBw = Number(oldOrder.cetak_bw) || 0
    const newBw = order.cetak_bw !== undefined && order.cetak_bw !== null ? Number(order.cetak_bw) : oldBw
    if (oldBw !== newBw) {
      changes.push({
        field: 'cetak_bw',
        field_label: 'Halaman BW',
        old_val: `${oldBw} hal`,
        new_val: `${newBw} hal`,
      })
    }

    const oldFc = Number(oldOrder.cetak_fc) || 0
    const newFc = order.cetak_fc !== undefined && order.cetak_fc !== null ? Number(order.cetak_fc) : oldFc
    if (oldFc !== newFc) {
      changes.push({
        field: 'cetak_fc',
        field_label: 'Halaman FC',
        old_val: `${oldFc} hal`,
        new_val: `${newFc} hal`,
      })
    }

    const oldUkuran = oldOrder.ukuran_custom || oldOrder.ukuran || ''
    const newUkuran = order.ukuran_custom || order.ukuran || ''
    if (newUkuran && oldUkuran !== newUkuran) {
      changes.push({
        field: 'ukuran',
        field_label: 'Ukuran Buku',
        old_val: oldUkuran || '-',
        new_val: newUkuran,
      })
    }

    const oldKertas = oldOrder.kertas || ''
    const newKertas = order.kertas || ''
    if (newKertas && oldKertas !== newKertas) {
      changes.push({
        field: 'kertas',
        field_label: 'Jenis Kertas',
        old_val: oldKertas || '-',
        new_val: newKertas,
      })
    }

    const oldFinishingArr = Array.isArray(oldOrder.finishing) ? oldOrder.finishing : (typeof oldOrder.finishing === 'string' ? JSON.parse(oldOrder.finishing || '[]') : [])
    const newFinishingArr = Array.isArray(order.finishing) ? order.finishing : []
    const oldFinishingStr = [...oldFinishingArr].sort().join(', ')
    const newFinishingStr = [...newFinishingArr].sort().join(', ')
    if (order.finishing !== undefined && oldFinishingStr !== newFinishingStr) {
      changes.push({
        field: 'finishing',
        field_label: 'Finishing Jilid',
        old_val: oldFinishingStr || '-',
        new_val: newFinishingStr || '-',
      })
    }

    if (order.judul_buku && order.judul_buku !== oldOrder.judul_buku) {
      changes.push({
        field: 'judul_buku',
        field_label: 'Judul Buku',
        old_val: oldOrder.judul_buku || '-',
        new_val: order.judul_buku,
      })
    }

    if (order.nama_penerbit && order.nama_penerbit !== oldOrder.nama_penerbit) {
      changes.push({
        field: 'nama_penerbit',
        field_label: 'Penerbit',
        old_val: oldOrder.nama_penerbit || '-',
        new_val: order.nama_penerbit,
      })
    }

    if (order.skema_harga && order.skema_harga !== oldOrder.skema_harga) {
      changes.push({
        field: 'skema_harga',
        field_label: 'Skema Harga',
        old_val: oldOrder.skema_harga || 'NORMAL',
        new_val: order.skema_harga,
      })
    }

    if (order.catatan !== undefined && (order.catatan || '') !== (oldOrder.catatan || '')) {
      changes.push({
        field: 'catatan',
        field_label: 'Catatan',
        old_val: oldOrder.catatan || '-',
        new_val: order.catatan || '-',
      })
    }

    if (changes.length > 0) {
      const summaryItems = changes.map((c) => `${c.field_label}: ${c.old_val} → ${c.new_val}`)
      const keterangan = summaryItems.join('; ')
      await tx`
        INSERT INTO order_logs (id_order, action, actor, keterangan, changes)
        VALUES (${id_order}, 'UPDATE', ${actor}, ${keterangan}, ${JSON.stringify(changes)}::jsonb);
      `
    }

    return { success: true, data: { id_order, changes_count: changes.length } }
  })
}

export async function handleUpdateOrderStatus(body: any) {
  const { id_order, status } = body
  if (!id_order || !status) return { success: false, error: 'id_order dan status wajib diisi' }
  const actor = body.actor || body.diubah_oleh || body.diinput_oleh || 'Tim Operasional'

  return await sql.begin(async (tx) => {
    const existing = await tx`SELECT status_order FROM orders WHERE id_order = ${id_order} LIMIT 1;`
    const oldStatus = existing[0]?.status_order || 'PROSES'

    await tx`UPDATE orders SET status_order = ${status}, updated_at = NOW() WHERE id_order = ${id_order};`

    if (oldStatus !== status) {
      const action = status === 'BATAL' ? 'CANCEL' : (oldStatus === 'BATAL' ? 'RESTORE' : 'STATUS_CHANGE')
      const keterangan = status === 'BATAL'
        ? 'Pesanan dibatalkan'
        : oldStatus === 'BATAL'
        ? `Pesanan dipulihkan kembali ke status ${status}`
        : `Status pesanan diubah dari ${oldStatus} menjadi ${status}`

      const changes = [{
        field: 'status_order',
        field_label: 'Status Order',
        old_val: oldStatus,
        new_val: status,
      }]

      await tx`
        INSERT INTO order_logs (id_order, action, actor, keterangan, changes)
        VALUES (${id_order}, ${action}, ${actor}, ${keterangan}, ${JSON.stringify(changes)}::jsonb);
      `
    }

    return { success: true, data: { id_order, status } }
  })
}

export async function handleDeleteOrder(body: any) {
  const { id_order, permanent } = body
  if (!id_order) return { success: false, error: 'id_order wajib diisi' }
  const actor = body.actor || body.diubah_oleh || 'Tim Operasional'

  if (permanent === true) {
    try {
      return await sql.begin(async (tx) => {
        const payments = await tx`
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

        // 1. Jika ada pembayaran yang dialihkan ke DEPOSIT penerbit, lepaskan relasi id_order agar saldo deposit tetap tersimpan
        await tx`UPDATE kas_masuk SET id_order = NULL WHERE id_order = ${id_order} AND jenis_pembayaran = 'DEPOSIT';`

        // 2. Hapus transaksi kas masuk terkait order ini (yang berstatus BATAL / non-deposit)
        await tx`DELETE FROM kas_masuk WHERE id_order = ${id_order};`

        // 3. Hapus transaksi kas keluar refund terkait order ini (jika ada)
        await tx`DELETE FROM kas_keluar WHERE kategori = 'REFUND' AND rincian LIKE ${`%${id_order}%`};`

        // 4. Hapus data order secara permanen (order_logs otomatis terhapus via CASCADE)
        await tx`DELETE FROM orders WHERE id_order = ${id_order};`
        return { success: true, data: { id_order, permanent: true } }
      })
    } catch (err: any) {
      console.error(`Gagal menghapus order permanen ${id_order}:`, err)
      return { success: false, error: err?.message || 'Gagal menghapus order permanen dari database' }
    }
  } else {
    try {
      return await sql.begin(async (tx) => {
        await tx`UPDATE orders SET status_order = 'BATAL', updated_at = NOW() WHERE id_order = ${id_order};`
        await tx`
          INSERT INTO order_logs (id_order, action, actor, keterangan, changes)
          VALUES (${id_order}, 'CANCEL', ${actor}, 'Pesanan dibatalkan', ${JSON.stringify([{
            field: 'status_order',
            field_label: 'Status Order',
            old_val: 'PROSES',
            new_val: 'BATAL',
          }])}::jsonb);
        `
        return { success: true, data: { id_order, permanent: false } }
      })
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal membatalkan order' }
    }
  }
}
