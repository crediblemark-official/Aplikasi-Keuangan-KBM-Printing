import postgres from 'postgres'

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://uljXeZ7ydt6kZE7jI.jkt1_006:780907edbcbbf3e4992f6a87@pgsql-dbas-jkt1-006.sumobase.my.id:6432/db6bf622c3d786cef0'

const GAS_URL =
  process.env.VITE_BACKUP_GAS_URL ||
  'https://script.google.com/macros/s/AKfycbwGVC-HCtsQygsRgrAUSlF4V-IpU5pCHEojxO02tUWLMGq-Dz1CQHtVmV4MnNPzJYcFOA/exec'

export async function syncFromSheetsToPgsql(customGasUrl?: string, customDbUrl?: string) {
  const gasUrl = customGasUrl || GAS_URL
  const dbUrl = customDbUrl || DATABASE_URL

  console.log('🔄 Memulai sinkronisasi Google Sheets -> PostgreSQL...')
  console.log(`📡 GAS Endpoint: ${gasUrl}`)

  const sql = postgres(dbUrl, {
    prepare: false,
    max: 5,
    idle_timeout: 10,
  })

  try {
    // 1. Tarik seluruh data dari Google Apps Script
    console.log('📥 Menarik data dari Google Sheets...')
    const [ordersRes, kmRes, kkRes, clientsRes] = await Promise.all([
      fetch(`${gasUrl}?action=getOrders`).then((r) => r.json()),
      fetch(`${gasUrl}?action=getKasMasuk`).then((r) => r.json()),
      fetch(`${gasUrl}?action=getKasKeluar`).then((r) => r.json()),
      fetch(`${gasUrl}?action=getClients`).then((r) => r.json()),
    ])

    const orders = ordersRes.data || []
    const kasMasuk = kmRes.data || []
    const kasKeluar = kkRes.data || []
    const clients = clientsRes.data || []

    console.log(`📊 Diterima dari Sheets: ${orders.length} orders, ${kasMasuk.length} kas masuk, ${kasKeluar.length} kas keluar, ${clients.length} clients.`)

    let ordersUpserted = 0
    let kmUpserted = 0
    let kkUpserted = 0
    let clientsUpserted = 0

    // 2. Upsert Clients
    for (const c of clients) {
      if (!c.nama_penerbit) continue
      await sql`
        INSERT INTO clients (nama_penerbit, kontak, alamat)
        VALUES (${String(c.nama_penerbit).trim()}, ${c.kontak || ''}, ${c.alamat || ''})
        ON CONFLICT (nama_penerbit) DO UPDATE SET
          kontak = COALESCE(NULLIF(EXCLUDED.kontak, ''), clients.kontak),
          alamat = COALESCE(NULLIF(EXCLUDED.alamat, ''), clients.alamat),
          updated_at = NOW();
      `
      clientsUpserted++
    }

    // 3. Upsert Orders
    for (const o of orders) {
      if (!o.id_order) continue
      const tanggal = o.tanggal ? String(o.tanggal).substring(0, 10) : new Date().toISOString().substring(0, 10)
      const finishingJson = JSON.stringify(Array.isArray(o.finishing) ? o.finishing : (typeof o.finishing === 'string' ? (o.finishing.startsWith('[') ? JSON.parse(o.finishing) : [o.finishing]) : []))

      await sql`
        INSERT INTO orders (
          id_order, tanggal, nama_penerbit, judul_penulis, judul_buku, nama_penulis,
          jml_pcs, ukuran, ukuran_custom, kertas, kertas_bw, kertas_fc,
          cetak_bw, cetak_fc, finishing, packing_dus_tipe, packing_dus_qty,
          biaya_packing, total_harga, status_order, catatan, alamat_penerbit,
          kontak_penerbit, link_bukti, skema_harga
        ) VALUES (
          ${o.id_order}, ${tanggal}, ${o.nama_penerbit || ''}, ${o.judul_penulis || ''},
          ${o.judul_buku || ''}, ${o.nama_penulis || ''}, ${Number(o.jml_pcs) || 0},
          ${o.ukuran || ''}, ${o.ukuran_custom || ''}, ${o.kertas || ''},
          ${o.kertas_bw || ''}, ${o.kertas_fc || ''}, ${Number(o.cetak_bw) || 0},
          ${Number(o.cetak_fc) || 0}, ${finishingJson}::jsonb, ${o.packing_dus_tipe || ''},
          ${Number(o.packing_dus_qty) || 0}, ${Number(o.biaya_packing) || 0}, ${Number(o.total_harga) || 0},
          ${o.status_order || 'Menunggu'}, ${o.catatan || ''}, ${o.alamat_penerbit || ''},
          ${o.kontak_penerbit || ''}, ${o.link_bukti || ''}, ${o.skema_harga || 'reguler'}
        )
        ON CONFLICT (id_order) DO UPDATE SET
          status_order = CASE
            WHEN orders.status_order = 'BATAL' AND EXCLUDED.status_order != 'BATAL' THEN orders.status_order
            ELSE COALESCE(NULLIF(EXCLUDED.status_order, ''), orders.status_order)
          END,
          total_harga = CASE WHEN EXCLUDED.total_harga > 0 THEN EXCLUDED.total_harga ELSE orders.total_harga END,
          catatan = COALESCE(NULLIF(EXCLUDED.catatan, ''), orders.catatan),
          link_bukti = COALESCE(NULLIF(EXCLUDED.link_bukti, ''), orders.link_bukti),
          updated_at = NOW();
      `
      ordersUpserted++
    }

    // 4. Upsert Kas Masuk
    for (const km of kasMasuk) {
      if (!km.id_kas_masuk) continue
      const tanggal = km.tanggal ? String(km.tanggal).substring(0, 10) : new Date().toISOString().substring(0, 10)
      let orderRef = km.id_order && String(km.id_order).trim() ? String(km.id_order).trim() : null
      if (orderRef) {
        const [ord] = await sql`SELECT 1 FROM orders WHERE id_order = ${orderRef} LIMIT 1;`
        if (!ord) orderRef = null
      }

      await sql`
        INSERT INTO kas_masuk (
          id_kas_masuk, tanggal, jenis_pembayaran, nama_penerbit, id_order,
          nominal, metode, keterangan, diinput_oleh, link_bukti, file_id_bukti, status_verifikasi
        ) VALUES (
          ${km.id_kas_masuk}, ${tanggal}, ${km.jenis_pembayaran || ''}, ${km.nama_penerbit || ''},
          ${orderRef}, ${Number(km.nominal) || 0}, ${km.metode || 'Transfer'},
          ${km.keterangan || ''}, ${km.diinput_oleh || 'Kasir'}, ${km.link_bukti || ''},
          ${km.file_id_bukti || ''}, ${km.status_verifikasi || 'Belum Verifikasi'}
        )
        ON CONFLICT (id_kas_masuk) DO UPDATE SET
          nominal = CASE WHEN EXCLUDED.nominal > 0 THEN EXCLUDED.nominal ELSE kas_masuk.nominal END,
          status_verifikasi = CASE
            WHEN kas_masuk.status_verifikasi IN ('VERIFIED', 'BATAL') AND EXCLUDED.status_verifikasi NOT IN ('VERIFIED', 'BATAL') THEN kas_masuk.status_verifikasi
            ELSE COALESCE(NULLIF(EXCLUDED.status_verifikasi, ''), kas_masuk.status_verifikasi)
          END,
          link_bukti = COALESCE(NULLIF(EXCLUDED.link_bukti, ''), kas_masuk.link_bukti),
          updated_at = NOW();
      `
      kmUpserted++
    }

    // 5. Upsert Kas Keluar
    for (const kk of kasKeluar) {
      if (!kk.id_kas_keluar) continue
      const tanggal = kk.tanggal ? String(kk.tanggal).substring(0, 10) : new Date().toISOString().substring(0, 10)

      await sql`
        INSERT INTO kas_keluar (
          id_kas_keluar, tanggal, kategori, rincian, nominal, sumber_kas,
          diinput_oleh, link_nota, file_id_nota
        ) VALUES (
          ${kk.id_kas_keluar}, ${tanggal}, ${kk.kategori || ''}, ${kk.rincian || ''},
          ${Number(kk.nominal) || 0}, ${kk.sumber_kas || 'Kas Operasional'},
          ${kk.diinput_oleh || 'Kasir'}, ${kk.link_nota || ''}, ${kk.file_id_nota || ''}
        )
        ON CONFLICT (id_kas_keluar) DO UPDATE SET
          nominal = CASE WHEN EXCLUDED.nominal > 0 THEN EXCLUDED.nominal ELSE kas_keluar.nominal END,
          kategori = COALESCE(NULLIF(EXCLUDED.kategori, ''), kas_keluar.kategori),
          rincian = COALESCE(NULLIF(EXCLUDED.rincian, ''), kas_keluar.rincian),
          updated_at = NOW();
      `
      kkUpserted++
    }

    console.log(`✅ Sukses sinkronisasi ke PostgreSQL:`)
    console.log(`   - ${ordersUpserted} Orders`)
    console.log(`   - ${kmUpserted} Kas Masuk`)
    console.log(`   - ${kkUpserted} Kas Keluar`)
    console.log(`   - ${clientsUpserted} Clients`)

    return {
      success: true,
      data: {
        orders: ordersUpserted,
        kas_masuk: kmUpserted,
        kas_keluar: kkUpserted,
        clients: clientsUpserted,
      },
    }
  } catch (err: any) {
    console.error('❌ Gagal sinkronisasi:', err)
    return { success: false, error: err?.message || String(err) }
  } finally {
    await sql.end()
  }
}

// Jika dijalankan langsung via CLI:
if (import.meta.main) {
  syncFromSheetsToPgsql()
    .then((res) => {
      if (!res.success) process.exit(1)
    })
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}
