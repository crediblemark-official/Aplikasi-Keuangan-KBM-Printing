import { sql } from '../db'

export async function generateId(prefix: 'ORD' | 'KM' | 'KK'): Promise<string> {
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
