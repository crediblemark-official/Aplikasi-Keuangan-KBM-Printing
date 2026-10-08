import { handleGetOrders } from './orderService'
import { handleGetKasMasuk, handleGetKasKeluar } from './kasService'
import { handleGetClients } from './financeService'

export async function handleSyncBackupToSheets(customGasUrl?: string) {
  try {
    const [ordersRes, kmRes, kkRes, clientsRes] = await Promise.all([
      handleGetOrders(),
      handleGetKasMasuk(),
      handleGetKasKeluar(),
      handleGetClients(),
    ])

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
