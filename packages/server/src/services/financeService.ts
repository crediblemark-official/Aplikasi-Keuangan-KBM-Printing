import { sql } from '../db'
import { handleGetOrders } from './orderService'
import { handleGetKasMasuk, handleGetKasKeluar } from './kasService'

export async function handleGetClients() {
  const rows = await sql`SELECT * FROM clients ORDER BY nama_penerbit ASC;`
  return { success: true, data: rows }
}

export async function handleGetFinanceBundle(params: Record<string, string> = {}) {
  const [ordersRes, kmRes, kkRes, clientsRes] = await Promise.all([
    handleGetOrders(params),
    handleGetKasMasuk(params),
    handleGetKasKeluar(),
    handleGetClients(),
  ])

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
