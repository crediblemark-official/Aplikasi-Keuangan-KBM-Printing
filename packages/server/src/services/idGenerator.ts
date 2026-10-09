import { sql } from '../db'

const LOCK_KEYS: Record<'ORD' | 'KM' | 'KK', number> = {
  ORD: 400101,
  KM: 400102,
  KK: 400103,
}

export async function generateId(
  prefix: 'ORD' | 'KM' | 'KK',
  client: any = sql
): Promise<string> {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const period = `${yyyy}${mm}`
  const pattern = `${prefix}-${period}-%`

  // Lock per-prefix selama transaksi aktif untuk mencegah race condition / ID duplikat
  try {
    const lockKey = LOCK_KEYS[prefix] || 400100
    await client`SELECT pg_advisory_xact_lock(${lockKey});`
  } catch (err) {
    // Fallback bila engine DB tidak mendukung advisory lock
    console.warn(`[generateId] Advisory lock skipped:`, err)
  }

  let rows: { id: string }[] = []
  if (prefix === 'ORD') {
    rows = await client`SELECT id_order as id FROM orders WHERE id_order LIKE ${pattern} ORDER BY id_order DESC LIMIT 1;`
  } else if (prefix === 'KM') {
    rows = await client`SELECT id_kas_masuk as id FROM kas_masuk WHERE id_kas_masuk LIKE ${pattern} ORDER BY id_kas_masuk DESC LIMIT 1;`
  } else {
    rows = await client`SELECT id_kas_keluar as id FROM kas_keluar WHERE id_kas_keluar LIKE ${pattern} ORDER BY id_kas_keluar DESC LIMIT 1;`
  }

  let nextSeq = 1
  if (rows.length > 0 && rows[0].id) {
    const parts = rows[0].id.split('-')
    const lastNum = parseInt(parts[2], 10)
    if (!isNaN(lastNum)) nextSeq = lastNum + 1
  }

  return `${prefix}-${period}-${String(nextSeq).padStart(3, '0')}`
}
