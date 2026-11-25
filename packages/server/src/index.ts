import { Hono } from 'hono'
import { cors } from 'hono/cors'
import postgres from 'postgres'
import { DATABASE_URL, bunSql, sqlStorage } from './db'

// Modular Service Handlers
import {
  handleGetOrders,
  handleCreateOrder,
  handleUpdateOrder,
  handleUpdateOrderStatus,
  handleDeleteOrder,
  handleGetOrderLogs,
} from './services/orderService'

import {
  handleGetKasMasuk,
  handleCreateKasMasuk,
  handleVerifyKasMasuk,
  handleRejectKasMasuk,
  handleUpdateKasMasuk,
  handleDeleteKasMasuk,
  handleGetKasKeluar,
  handleCreateKasKeluar,
  handleUpdateKasKeluar,
  handleDeleteKasKeluar,
} from './services/kasService'

import {
  handleGetClients,
  handleGetFinanceBundle,
} from './services/financeService'

import { handleAiChat } from './services/aiService'
import {
  handleGetCompanySettings,
  handleUpdateCompanySettings,
} from './services/settingsService'

const app = new Hono()

app.use('*', cors())

app.onError((err, c) => {
  console.error('Unhandled Server Error:', err)
  const msg = err?.message || 'Internal Server Error'
  if (/EMAXPOOLSREACHED|max pools count reached/i.test(msg)) {
    return c.json(
      {
        success: false,
        error: 'Koneksi database Sumobase sedang penuh sementara (EMAXPOOLSREACHED). Silakan coba ulang beberapa detik lagi.',
      },
      503
    )
  }
  return c.json({ success: false, error: msg }, 500)
})

function isPoolHandshakeError(err: any): boolean {
  const msg = String(err?.message || err || '')
  return /EMAXPOOLSREACHED|max pools count reached|max client connections|MaxClientsInSessionMode|CONNECT_TIMEOUT|ECONNREFUSED/i.test(msg)
}

function createWorkerDb(dbUrl: string): postgres.Sql {
  return postgres(dbUrl, {
    prepare: false,    // Wajib false untuk PgBouncer / Supavisor transaction pooler
    max: 1,            // Tepat 1 koneksi per-request agar tidak membebani limit pool Supavisor
    max_pipeline: 1,   // WAJIB >= 1: di postgres.js, max_pipeline: 0 menonaktifkan onexecute() pada sql.begin()
    fetch_types: false,// Hemat 1 query pg_catalog.pg_type pada setiap koneksi baru
    idle_timeout: 5,
    connect_timeout: 10,
  } as postgres.Options<{}>)
}

// Isolasi koneksi database per-request secara lazy + auto-retry aman saat handshake pooler penuh (EMAXPOOLSREACHED)
async function runWithDbRetry<T>(c: any, fn: () => Promise<T>): Promise<T> {
  if (bunSql) {
    return await fn()
  }

  const dbUrl = (c.env as any)?.DATABASE_URL || DATABASE_URL
  const backoffs = [350, 800, 1500]
  let lastErr: any

  for (let attempt = 0; attempt <= backoffs.length; attempt++) {
    let db: postgres.Sql | null = null
    const getDb = () => {
      if (!db) {
        db = createWorkerDb(dbUrl)
      }
      return db
    }

    try {
      return await sqlStorage.run(getDb, fn)
    } catch (err: any) {
      lastErr = err
      if (attempt < backoffs.length && isPoolHandshakeError(err)) {
        const delay = backoffs[attempt] + Math.floor(Math.random() * 200)
        console.warn(`[DB Handshake Retry ${attempt + 1}/${backoffs.length}] ${err?.message || err} -> retry in ${delay}ms`)
        await new Promise((r) => setTimeout(r, delay))
        continue
      }
      throw err
    } finally {
      if (db) {
        try {
          await (db as postgres.Sql).end({ timeout: 2 })
        } catch (e) {
          console.warn('Gagal menutup koneksi db worker:', e)
        }
      }
    }
  }

  throw lastErr
}

// Unified Router for both REST and GAS query-based compatibility
async function dispatchAction(action: string, params: any, body: any, env?: any) {
  switch (action) {
    case 'ping':
      return { success: true, message: 'pong', timestamp: Date.now() }
    case 'aiChat':
      return handleAiChat(body, env)
    case 'getFinanceBundle':
      return handleGetFinanceBundle(params)
    case 'getOrders':
      return handleGetOrders(params)
    case 'getOrderLogs':
      return handleGetOrderLogs(params)
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
    case 'rejectKasMasuk':
      return handleRejectKasMasuk(body)
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
    case 'getCompanySettings':
      return handleGetCompanySettings()
    case 'updateCompanySettings':
      return handleUpdateCompanySettings(body)
    default:
      return { success: false, error: `Action '${action}' tidak dikenal` }
  }
}

// Universal query/body action handlers (GAS client compatibility)
app.get('/api', async (c) => {
  const query = c.req.query()
  const action = query.action || 'ping'
  const result = await runWithDbRetry(c, () => dispatchAction(action, query, {}, c.env))
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
  const result = await runWithDbRetry(c, () => dispatchAction(action, query, body, c.env))
  return c.json(result)
})

// REST endpoints
app.get('/api/ping', (c) => c.json({ success: true, message: 'pong', timestamp: Date.now() }))
app.get('/api/finance/bundle', async (c) => c.json(await runWithDbRetry(c, () => handleGetFinanceBundle(c.req.query()))))
app.get('/api/clients', async (c) => c.json(await runWithDbRetry(c, () => handleGetClients())))
app.get('/api/orders', async (c) => c.json(await runWithDbRetry(c, () => handleGetOrders(c.req.query()))))
app.get('/api/orders/:id/logs', async (c) => c.json(await runWithDbRetry(c, () => handleGetOrderLogs({ id_order: c.req.param('id') }))))
app.get('/api/order-logs', async (c) => c.json(await runWithDbRetry(c, () => handleGetOrderLogs(c.req.query()))))
app.post('/api/orders', async (c) => {
  const body = await c.req.json()
  return c.json(await runWithDbRetry(c, () => handleCreateOrder(body)))
})
app.put('/api/orders', async (c) => {
  const body = await c.req.json()
  return c.json(await runWithDbRetry(c, () => handleUpdateOrder(body)))
})
app.delete('/api/orders', async (c) => {
  const body = await c.req.json()
  return c.json(await runWithDbRetry(c, () => handleDeleteOrder(body)))
})
app.get('/api/kas-masuk', async (c) => c.json(await runWithDbRetry(c, () => handleGetKasMasuk(c.req.query()))))
app.post('/api/kas-masuk', async (c) => {
  const body = await c.req.json()
  return c.json(await runWithDbRetry(c, () => handleCreateKasMasuk(body)))
})
app.get('/api/kas-keluar', async (c) => c.json(await runWithDbRetry(c, () => handleGetKasKeluar())))
app.post('/api/kas-keluar', async (c) => {
  const body = await c.req.json()
  return c.json(await runWithDbRetry(c, () => handleCreateKasKeluar(body)))
})
app.post('/api/ai/chat', async (c) => {
  let body: any = {}
  try {
    body = await c.req.json()
  } catch {}
  return c.json(await handleAiChat(body, c.env))
})
app.get('/api/settings/company', async (c) => c.json(await runWithDbRetry(c, () => handleGetCompanySettings())))
app.post('/api/settings/company', async (c) => {
  const body = await c.req.json()
  return c.json(await runWithDbRetry(c, () => handleUpdateCompanySettings(body)))
})

const PORT = Number(process.env.PORT) || 3001

console.log(`🚀 KBM PostgreSQL API Server running on http://localhost:${PORT}`)

export default {
  port: PORT,
  fetch: app.fetch,
}
