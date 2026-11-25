import { sql } from '../db'
import { handleGetOrders } from './orderService'
import { handleGetKasMasuk, handleGetKasKeluar } from './kasService'

export async function handleGetClients() {
  const rows = await sql`SELECT * FROM clients ORDER BY nama_penerbit ASC;`
  return { success: true, data: rows }
}

export async function handleGetFinanceBundle(params: Record<string, string> = {}) {
  // Eksekusi sekuensial di atas 1 koneksi per-request (max: 1, max_pipeline: 0)
  // untuk menghindari deadlock pipelining di Supavisor transaction mode.
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
