import { AsyncLocalStorage } from 'node:async_hooks'
import postgres from 'postgres'

export const DATABASE_URL = process.env.DATABASE_URL || ''

export const sqlStorage = new AsyncLocalStorage<() => postgres.Sql>()

// Local Bun environment: Gunakan pool persisten
export const bunSql: postgres.Sql | null =
  typeof Bun !== 'undefined' && DATABASE_URL
    ? postgres(DATABASE_URL, {
        prepare: false,
        max: 10,
        max_pipeline: 0,
        fetch_types: false,
        idle_timeout: 30,
      })
    : null

// Universal SQL proxy: otomatis memilih koneksi per-request di Cloudflare Workers
// atau pool persisten saat dijalankan di Bun.
export const sql = new Proxy((() => {}) as any, {
  apply(_target, thisArg, args) {
    const getWorkerDb = sqlStorage.getStore()
    const current = getWorkerDb ? getWorkerDb() : bunSql
    if (!current) throw new Error('No active database connection. Pastikan DATABASE_URL telah diset.')
    return Reflect.apply(current as any, thisArg, args)
  },
  get(_target, prop) {
    const getWorkerDb = sqlStorage.getStore()
    const current = getWorkerDb ? getWorkerDb() : bunSql
    if (!current) throw new Error('No active database connection. Pastikan DATABASE_URL telah diset.')
    return Reflect.get(current as any, prop)
  },
}) as postgres.Sql
