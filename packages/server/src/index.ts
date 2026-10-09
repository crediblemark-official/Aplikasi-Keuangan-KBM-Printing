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
} from './services/orderService'

import {
  handleGetKasMasuk,
  handleCreateKasMasuk,
  handleVerifyKasMasuk,
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

import { handleSyncBackupToSheets, handleSyncFromSheets } from './services/backupService'
import { handleAiChat } from './services/aiService'
import {
  handleGetCompanySettings,
  handleUpdateCompanySettings,
} from './services/settingsService'

const app = new Hono()

app.use('*', cors())

app.onError((err, c) => {
  console.error('Unhandled Server Error:', err)
  return c.json({ success: false, error: err.message || 'Internal Server Error' }, 500)
})

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

// Unified Router for both REST and GAS query-based compatibility
async function dispatchAction(action: string, params: any, body: any, env?: any) {
  switch (action) {
    case 'ping':
      return { success: true, message: 'pong', timestamp: Date.now() }
    case 'aiChat':
      return handleAiChat(body, env)
    case 'syncBackup':
    case 'syncBackupToSheets':
      return handleSyncBackupToSheets(env?.VITE_BACKUP_GAS_URL)
    case 'syncFromSheets':
      return handleSyncFromSheets(env?.VITE_BACKUP_GAS_URL)
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
app.post('/api/sync/sheets', async (c) => c.json(await handleSyncFromSheets((c.env as any)?.VITE_BACKUP_GAS_URL)))
app.post('/api/ai/chat', async (c) => {
  let body: any = {}
  try {
    body = await c.req.json()
  } catch {}
  return c.json(await handleAiChat(body, c.env))
})
app.get('/api/settings/company', async (c) => c.json(await handleGetCompanySettings()))
app.post('/api/settings/company', async (c) => c.json(await handleUpdateCompanySettings(await c.req.json())))

const PORT = Number(process.env.PORT) || 3001

console.log(`🚀 KBM PostgreSQL API Server running on http://localhost:${PORT}`)

export default {
  port: PORT,
  fetch: app.fetch,
  async scheduled(event: any, env: any, ctx: any) {
    const dbUrl = env?.DATABASE_URL || DATABASE_URL
    if (!dbUrl) return
    const db = postgres(dbUrl, {
      prepare: false,
      max: 5,
      idle_timeout: 1,
      connect_timeout: 15,
    })
    ctx.waitUntil(
      sqlStorage.run(db, async () => {
        try {
          console.log('⏰ Running automatic Cloudflare cron sync from Google Sheets...')
          await handleSyncFromSheets(env?.VITE_BACKUP_GAS_URL)
        } catch (e) {
          console.error('❌ Cron sync failed:', e)
        } finally {
          try {
            await db.end({ timeout: 1 })
          } catch {}
        }
      })
    )
  },
}
