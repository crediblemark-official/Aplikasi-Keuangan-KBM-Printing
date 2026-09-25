/**
 * ============================================================
 * KBM PERCETAKAN — Google Apps Script API Engine
 * ============================================================
 * Deploy sebagai Web App:
 * 1. Buka script.google.com
 * 2. Paste kode ini
 * 3. Deploy > New deployment > Web App
 * 4. Execute as: Me | Who has access: Anyone
 * 5. Copy URL ke gasClient.ts (CONFIG.GAS_URL)
 *
 * Setup Google Sheets:
 * - Buat Spreadsheet baru
 * - Ganti SPREADSHEET_ID di bawah
 * - Sheet tabs: Orders, Kas_Masuk, Kas_Keluar, Clients
 * ============================================================
 */

// ---- KONFIGURASI ----
const SPREADSHEET_ID = '1Q3cmSsYGOncEjWE7SZMiMjHGjkT0OrE3-7MKdNzEjhA';
const DRIVE_FOLDER_ID = '1ZOov_iTND9DFNYbR7U5iBt5fMNCQEifS'; // Google Drive Root Folder
const DRIVE_FOLDER_NAME = 'KBM Printing';

// Sheet names
const SHEET_ORDERS = 'Orders';
const SHEET_KAS_MASUK = 'Kas_Masuk';
const SHEET_KAS_KELUAR = 'Kas_Keluar';
const SHEET_CLIENTS = 'Clients';

// ---- CORS HEADERS ----
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---- ROUTING UTAMA ----
function doGet(e) {
  try {
    const action = e.parameter.action;
    if (!action) {
      return jsonResponse({ success: false, error: 'Action parameter diperlukan' });
    }

    const handlers = {
      'ping': () => ({ success: true, message: 'pong', timestamp: Date.now() }),
      'getOrders': () => handleGetOrders(e.parameter),
      'getKasMasuk': () => handleGetKasMasuk(e.parameter),
      'getKasKeluar': () => handleGetKasKeluar(e.parameter),
      'getClients': () => handleGetClients(e.parameter),
      'getSummaryReport': () => handleGetSummaryReport(e.parameter),
    };

    if (handlers[action]) {
      return jsonResponse(handlers[action]());
    }
    return jsonResponse({ success: false, error: 'Aksi tidak dikenal: ' + action });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

function doPost(e) {
  try {
    let action;
    let body = {};

    if (e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
      action = body.action || e.parameter.action;
    } else {
      action = e.parameter.action;
    }

    const handlers = {
      'ping': () => ({ success: true, message: 'pong', timestamp: Date.now() }),
      'getOrders': () => handleGetOrders(e.parameter),
      'createOrder': () => handleCreateOrder(body),
      'updateOrder': () => handleUpdateOrder(body),
      'deleteOrder': () => handleDeleteOrder(body),
      'updateOrderStatus': () => handleUpdateOrderStatus(body),
      'createKasMasuk': () => handleCreateKasMasuk(body),
      'verifyKasMasuk': () => handleVerifyKasMasuk(body),
      'updateKasMasuk': () => handleUpdateKasMasuk(body),
      'deleteKasMasuk': () => handleDeleteKasMasuk(body),
      'attachBuktiKasMasuk': () => handleAttachBuktiKasMasuk(body),
      'createKasKeluar': () => handleCreateKasKeluar(body),
      'updateKasKeluar': () => handleUpdateKasKeluar(body),
      'deleteKasKeluar': () => handleDeleteKasKeluar(body),
      'savePDFtoDrive': () => handleSavePDFtoDrive(body),
      'uploadFile': () => handleUploadFile(body),
      'resetData': () => handleResetData(body),
    };

    if (!handlers[action]) {
      return jsonResponse({ success: false, error: 'Aksi tidak dikenal: ' + action });
    }

    return jsonResponse(handlers[action]());
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

// ---- CACHING SERVICE HELPERS (Hemat Kuota Eksekusi GAS) ------
const CACHE_TTL_SECONDS = 120; // 2 menit

function getScriptCache(key) {
  try {
    const raw = CacheService.getScriptCache().get(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    Logger.log('Cache read notice: ' + e);
  }
  return null;
}

function putScriptCache(key, data, ttlSeconds = CACHE_TTL_SECONDS) {
  try {
    const str = JSON.stringify(data);
    // Limit per item di CacheService adalah 100KB
    if (str.length < 100000) {
      CacheService.getScriptCache().put(key, str, ttlSeconds);
    }
  } catch (e) {
    Logger.log('Cache put notice: ' + e);
  }
}

function invalidateCache(keys) {
  try {
    const cache = CacheService.getScriptCache();
    let allKeys = Array.isArray(keys) ? keys.slice() : [keys];
    // Selalu invalidasi cache laporan summary agar tidak basi setelah mutasi data
    const summaryPeriods = getScriptCache('__summary_periods');
    if (Array.isArray(summaryPeriods) && summaryPeriods.length) {
      allKeys = allKeys.concat(summaryPeriods.map(p => 'summary_report_' + p));
    }
    cache.removeAll(allKeys);
  } catch (e) {
    Logger.log('Cache invalidate notice: ' + e);
  }
}

function invalidateAllCaches() {
  invalidateCache([
    'orders_all',
    'kas_masuk_all',
    'dashboard_summary',
    'clients_all',
    'kas_keluar_all'
  ]);
}

/**
 * Trigger otomatis saat pengguna mengedit sel di Google Spreadsheet secara manual.
 * Otomatis membersihkan cache agar data terbaru langsung tampil di Web App tanpa delay.
 */
function onEdit(e) {
  invalidateAllCaches();
}

// ---- HELPERS (SINGLETON SPREADSHEET INSTANCE) ----
let _cachedSpreadsheet = null;

function getSpreadsheet() {
  if (!_cachedSpreadsheet) {
    _cachedSpreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  return _cachedSpreadsheet;
}

function getSheet(name) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    initSheetHeaders(sheet, name);
  }
  return sheet;
}

function initSheetHeaders(sheet, name) {
  const headers = {
    [SHEET_ORDERS]: ['id_order','tanggal','nama_penerbit','judul_penulis','judul_buku','nama_penulis','jml_pcs','ukuran','ukuran_custom','kertas','cetak_bw','cetak_fc','finishing','total_harga','status_order','catatan','alamat_penerbit','kontak_penerbit','packing_dus_tipe','packing_dus_qty','biaya_packing','kertas_bw','kertas_fc','link_bukti'],
    [SHEET_KAS_MASUK]: ['id_kas_masuk','tanggal','id_order','jenis_pembayaran','nominal','metode','diinput_oleh','status_verifikasi','file_id_bukti','nama_penerbit','keterangan'],
    [SHEET_KAS_KELUAR]: ['id_kas_keluar','tanggal','kategori','rincian','nominal','sumber_kas','diinput_oleh','file_id_nota'],
    [SHEET_CLIENTS]: ['nama_penerbit','kontak','alamat'],
  };
  if (headers[name]) {
    sheet.appendRow(headers[name]);
    sheet.getRange(1, 1, 1, headers[name].length).setFontWeight('bold');
  }
}

/**
 * Memastikan kolom baru otomatis ditambahkan ke header sheet tanpa merusak baris yang sudah ada
 */
function ensureOrderHeaders(sheet) {
  const lastCol = sheet.getLastColumn();
  if (lastCol === 0) {
    initSheetHeaders(sheet, SHEET_ORDERS);
    return;
  }
  const currentHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const required = [
    'judul_buku', 'nama_penulis', 'alamat_penerbit', 'kontak_penerbit',
    'packing_dus_tipe', 'packing_dus_qty', 'biaya_packing', 'kertas_bw', 'kertas_fc',
    'link_bukti'
  ];
  const toAdd = required.filter(h => !currentHeaders.includes(h));
  if (toAdd.length > 0) {
    sheet.getRange(1, lastCol + 1, 1, toAdd.length).setValues([toAdd]).setFontWeight('bold');
  }
}

function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row =>
    headers.reduce((obj, h, i) => { obj[h] = row[i]; return obj; }, {})
  );
}

// Nama kolom ID per sheet (untuk generateId unik)
const ID_COLUMN_BY_PREFIX = { ORD: 'id_order', KM: 'id_kas_masuk', KK: 'id_kas_keluar' };

function generateId(prefix, sheet) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const now = new Date();
    const yyyymm = Utilities.formatDate(now, 'Asia/Jakarta', 'yyyyMM');
    // Ambil seq dari nilai ID maksimum yang sudah ada (prefix+bulan sama), bukan jumlah baris —
    // supaya ID tidak duplikat setelah baris dihapus/dibuat ulang.
    let maxSeq = 0;
    const data = sheet.getDataRange().getValues();
    if (data.length > 1) {
      const headers = data[0];
      const idCol = headers.indexOf(ID_COLUMN_BY_PREFIX[prefix] || 'id_order');
      if (idCol !== -1) {
        const idPrefix = `${prefix}-${yyyymm}-`;
        for (let i = 1; i < data.length; i++) {
          const id = String(data[i][idCol] || '').trim();
          if (!id.startsWith(idPrefix)) continue;
          const seqNum = parseInt(id.slice(idPrefix.length), 10);
          if (!isNaN(seqNum) && seqNum > maxSeq) maxSeq = seqNum;
        }
      }
    }
    const seq = String(maxSeq + 1).padStart(3, '0');
    return `${prefix}-${yyyymm}-${seq}`;
  } finally {
    lock.releaseLock();
  }
}

// ---- DRIVE HELPERS ----
let _folderCache = {};

function getOrCreateFolder(path) {
  if (_folderCache[path]) {
    return _folderCache[path];
  }
  let folder;
  try {
    folder = (typeof DRIVE_FOLDER_ID !== 'undefined' && DRIVE_FOLDER_ID)
      ? DriveApp.getFolderById(DRIVE_FOLDER_ID)
      : DriveApp.getRootFolder();
  } catch (e) {
    folder = DriveApp.getRootFolder();
  }
  const parts = path.split('/').filter(Boolean);
  for (const part of parts) {
    if (typeof DRIVE_FOLDER_ID !== 'undefined' && DRIVE_FOLDER_ID && part === DRIVE_FOLDER_NAME) continue;
    const it = folder.getFoldersByName(part);
    if (it.hasNext()) {
      folder = it.next();
    } else {
      folder = folder.createFolder(part);
    }
  }
  _folderCache[path] = folder;
  return folder;
}

function saveBase64ToDrive(base64, filename, folderPath) {
  if (!base64) return null;
  try {
    const bytes = Utilities.base64Decode(base64);
    const blob = Utilities.newBlob(bytes, 'image/jpeg', filename);
    const folder = getOrCreateFolder(folderPath);
    const file = folder.createFile(blob);
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (shareErr) {
      Logger.log('Set sharing notice (ignored): ' + shareErr);
    }
    return file.getId();
  } catch (e) {
    Logger.log('Drive save error: ' + e);
    return null;
  }
}

function getYearMonthPath() {
  return '';
}

function extractDriveFileId(val) {
  if (!val) return '';
  const str = String(val).trim();
  const match = str.match(/\/d\/([a-zA-Z0-9_-]+)/) || str.match(/id=([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  return str;
}

// ---- ORDERS ----
function handleGetOrders(params) {
  params = params || {};
  const status = (params.status && params.status !== 'undefined' && params.status !== 'null' && params.status !== 'all') ? String(params.status).trim() : '';
  const search = (params.search && params.search !== 'undefined' && params.search !== 'null') ? String(params.search).trim() : '';
  const nocache = params.nocache === 'true' || params.nocache === true || params.force === 'true';

  const isDefaultQuery = !status && !search && !nocache;
  if (isDefaultQuery) {
    const cached = getScriptCache('orders_all');
    if (cached) return { success: true, data: cached, _cached: true };
  }

  const sheet = getSheet(SHEET_ORDERS);
  let data = sheetToObjects(sheet);

  if (status) {
    data = data.filter(o => o.status_order === status);
  }
  if (search) {
    const q = search.toLowerCase();
    data = data.filter(o =>
      String(o.nama_penerbit || '').toLowerCase().includes(q) ||
      String(o.judul_penulis || '').toLowerCase().includes(q) ||
      String(o.id_order || '').toLowerCase().includes(q)
    );
  }

  // Parse finishing JSON & support separated book fields
  data = data.map(o => ({
    ...o,
    finishing: parseFinishingSafely(o.finishing),
    jml_pcs: Number(o.jml_pcs) || 0,
    cetak_bw: Number(o.cetak_bw) || 0,
    cetak_fc: Number(o.cetak_fc) || 0,
    packing_dus_qty: Number(o.packing_dus_qty) || 0,
    biaya_packing: Number(o.biaya_packing) || 0,
    packing_dus_tipe: o.packing_dus_tipe || null,
    kertas_bw: o.kertas_bw || o.kertas || '',
    kertas_fc: o.kertas_fc || o.kertas || '',
    total_harga: Number(o.total_harga) || 0,
    judul_buku: o.judul_buku || (o.judul_penulis ? String(o.judul_penulis).split(' / ')[0] : ''),
    nama_penulis: o.nama_penulis || (o.judul_penulis && String(o.judul_penulis).includes(' / ') ? String(o.judul_penulis).split(' / ').slice(1).join(' / ') : ''),
    alamat_penerbit: o.alamat_penerbit || '',
    kontak_penerbit: o.kontak_penerbit || '',
    link_bukti: o.link_bukti || '',
    tanggal: o.tanggal instanceof Date
      ? Utilities.formatDate(o.tanggal, 'Asia/Jakarta', 'yyyy-MM-dd')
      : String(o.tanggal),
  }));

  // Sort by date desc
  data.sort((a, b) => b.tanggal.localeCompare(a.tanggal));

  if (isDefaultQuery) {
    putScriptCache('orders_all', data);
  }

  return { success: true, data };
}

function handleCreateOrder(body) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sheet = getSheet(SHEET_ORDERS);
    ensureOrderHeaders(sheet);

    const order = body.order || {};
    const id_order = generateId('ORD', sheet);
    const tanggal = (order.tanggal && String(order.tanggal).trim())
      ? String(order.tanggal).trim().substring(0, 10)
      : Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd');

    const combinedJudulPenulis = order.judul_penulis || (order.nama_penulis ? `${order.judul_buku} / ${order.nama_penulis}` : order.judul_buku || '');

    // Map according to actual sheet headers dynamically
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const rowData = headers.map(h => {
      switch(h) {
        case 'id_order': return id_order;
        case 'tanggal': return tanggal;
        case 'nama_penerbit': return order.nama_penerbit || '';
        case 'judul_penulis': return combinedJudulPenulis;
        case 'judul_buku': return order.judul_buku || '';
        case 'nama_penulis': return order.nama_penulis || '';
        case 'jml_pcs': return Number(order.jml_pcs) || 0;
        case 'ukuran': return order.ukuran || '';
        case 'ukuran_custom': return order.ukuran_custom || '';
        case 'kertas': return order.kertas || '';
        case 'kertas_bw': return order.kertas_bw || order.kertas || '';
        case 'kertas_fc': return order.kertas_fc || order.kertas || '';
        case 'cetak_bw': return Number(order.cetak_bw) || 0;
        case 'cetak_fc': return Number(order.cetak_fc) || 0;
        case 'finishing': return JSON.stringify(order.finishing || []);
        case 'packing_dus_tipe': return order.packing_dus_tipe || '';
        case 'packing_dus_qty': return Number(order.packing_dus_qty) || 0;
        case 'biaya_packing': return Number(order.biaya_packing) || 0;
        case 'total_harga': return Number(order.total_harga) || 0;
        case 'status_order': return 'PROSES';
        case 'catatan': return order.catatan || '';
        case 'alamat_penerbit': return order.alamat_penerbit || '';
        case 'kontak_penerbit': return order.kontak_penerbit || '';
        case 'link_bukti': return order.link_bukti || '';
        default: return order[h] || '';
      }
    });

    sheet.appendRow(rowData);

    // Tambah / perbarui client jika ada info baru
    addClientIfNew(order.nama_penerbit, order.kontak_penerbit, order.alamat_penerbit);
    SpreadsheetApp.flush();

    // Invalidate caches
    invalidateCache(['orders_all', 'clients_all']);

    // Generate invoice number
    const now = new Date();
    const yyyymm = Utilities.formatDate(now, 'Asia/Jakarta', 'yyyyMM');
    const seq = id_order.split('-')[2];
    const nomor_invoice = `INV-${yyyymm}-${seq}`;

    return { success: true, data: { id_order, nomor_invoice } };
  } finally {
    lock.releaseLock();
  }
}

function handleUpdateOrderStatus(body) {
  const sheet = getSheet(SHEET_ORDERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf('id_order');
  const statusCol = headers.indexOf('status_order');
  if (idCol === -1) return { success: false, error: 'Kolom id_order tidak ditemukan' };
  if (statusCol === -1) return { success: false, error: 'Kolom status_order tidak ditemukan' };

  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] === body.id_order) {
      sheet.getRange(i + 1, statusCol + 1).setValue(body.status);
      SpreadsheetApp.flush();
      invalidateCache(['orders_all']);
      return { success: true };
    }
  }
  return { success: false, error: 'Order tidak ditemukan' };
}

function handleUpdateOrder(body) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sheet = getSheet(SHEET_ORDERS);
    ensureOrderHeaders(sheet);
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: false, error: 'Data order kosong' };

    const headers = data[0];
    const idCol = headers.indexOf('id_order');
    if (idCol === -1) return { success: false, error: 'Kolom id_order tidak ditemukan' };

    const order = body.order || body;
    const id_order = order.id_order;
    if (!id_order) return { success: false, error: 'id_order wajib diisi' };

    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idCol]).trim() === String(id_order).trim()) {
        rowIndex = i + 1; // 1-indexed
        break;
      }
    }

    if (rowIndex === -1) {
      return { success: false, error: 'Order dengan ID ' + id_order + ' tidak ditemukan' };
    }

    const combinedJudulPenulis = order.judul_penulis || (order.nama_penulis ? `${order.judul_buku} / ${order.nama_penulis}` : order.judul_buku || '');

    // Update each column present in headers
    headers.forEach((h, colIdx) => {
      let val = null;
      let shouldUpdate = true;
      switch (h) {
        case 'id_order':
          shouldUpdate = false; // pertahankan id order asli
          break;
        case 'tanggal':
          if (order.tanggal !== undefined && String(order.tanggal).trim()) {
            val = String(order.tanggal).trim().substring(0, 10);
          } else {
            shouldUpdate = false;
          }
          break;
        case 'nama_penerbit':
          if (order.nama_penerbit !== undefined) val = order.nama_penerbit;
          else shouldUpdate = false;
          break;
        case 'judul_penulis':
          val = combinedJudulPenulis;
          break;
        case 'judul_buku':
          if (order.judul_buku !== undefined) val = order.judul_buku;
          else shouldUpdate = false;
          break;
        case 'nama_penulis':
          if (order.nama_penulis !== undefined) val = order.nama_penulis;
          else shouldUpdate = false;
          break;
        case 'jml_pcs':
          if (order.jml_pcs !== undefined) val = Number(order.jml_pcs) || 0;
          else shouldUpdate = false;
          break;
        case 'ukuran':
          if (order.ukuran !== undefined) val = order.ukuran;
          else shouldUpdate = false;
          break;
        case 'ukuran_custom':
          if (order.ukuran_custom !== undefined) val = order.ukuran_custom;
          else shouldUpdate = false;
          break;
        case 'kertas':
          if (order.kertas !== undefined) val = order.kertas;
          else shouldUpdate = false;
          break;
        case 'kertas_bw':
          if (order.kertas_bw !== undefined) val = order.kertas_bw;
          else shouldUpdate = false;
          break;
        case 'kertas_fc':
          if (order.kertas_fc !== undefined) val = order.kertas_fc;
          else shouldUpdate = false;
          break;
        case 'cetak_bw':
          if (order.cetak_bw !== undefined) val = Number(order.cetak_bw) || 0;
          else shouldUpdate = false;
          break;
        case 'cetak_fc':
          if (order.cetak_fc !== undefined) val = Number(order.cetak_fc) || 0;
          else shouldUpdate = false;
          break;
        case 'finishing':
          if (order.finishing !== undefined) val = JSON.stringify(order.finishing || []);
          else shouldUpdate = false;
          break;
        case 'packing_dus_tipe':
          if (order.packing_dus_tipe !== undefined) val = order.packing_dus_tipe || '';
          else shouldUpdate = false;
          break;
        case 'packing_dus_qty':
          if (order.packing_dus_qty !== undefined) val = Number(order.packing_dus_qty) || 0;
          else shouldUpdate = false;
          break;
        case 'biaya_packing':
          if (order.biaya_packing !== undefined) val = Number(order.biaya_packing) || 0;
          else shouldUpdate = false;
          break;
        case 'total_harga':
          if (order.total_harga !== undefined) val = Number(order.total_harga) || 0;
          else shouldUpdate = false;
          break;
        case 'status_order':
          if (order.status_order !== undefined) val = order.status_order;
          else shouldUpdate = false;
          break;
        case 'catatan':
          if (order.catatan !== undefined) val = order.catatan;
          else shouldUpdate = false;
          break;
        case 'alamat_penerbit':
          if (order.alamat_penerbit !== undefined) val = order.alamat_penerbit;
          else shouldUpdate = false;
          break;
        case 'kontak_penerbit':
          if (order.kontak_penerbit !== undefined) val = order.kontak_penerbit;
          else shouldUpdate = false;
          break;
        case 'link_bukti':
          if (order.link_bukti !== undefined) val = order.link_bukti;
          else shouldUpdate = false;
          break;
        default:
          if (order[h] !== undefined) val = order[h];
          else shouldUpdate = false;
          break;
      }

      if (shouldUpdate && val !== null) {
        sheet.getRange(rowIndex, colIdx + 1).setValue(val);
      }
    });

    SpreadsheetApp.flush();
    invalidateCache(['orders_all', 'kas_masuk_all', 'dashboard_summary']);

    // Recheck status bayar jika total_harga diubah
    try {
      checkAndUpdateOrderStatus(id_order);
    } catch(e) {}

    return { success: true, data: { id_order } };
  } finally {
    lock.releaseLock();
  }
}

function handleDeleteOrder(body) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sheet = getSheet(SHEET_ORDERS);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idCol = headers.indexOf('id_order');
    const statusCol = headers.indexOf('status_order');
    if (idCol === -1) throw new Error('Kolom id_order tidak ditemukan di sheet order');
    if (statusCol === -1) throw new Error('Kolom status_order tidak ditemukan di sheet order');

    const id_order = body.id_order;
    if (!id_order) return { success: false, error: 'id_order wajib diisi' };

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idCol]).trim() === String(id_order).trim()) {
        sheet.getRange(i + 1, statusCol + 1).setValue('BATAL');
        SpreadsheetApp.flush();
        invalidateCache(['orders_all', 'kas_masuk_all', 'dashboard_summary']);
        return { success: true, data: { id_order } };
      }
    }
    return { success: false, error: 'Order tidak ditemukan' };
  } finally {
    lock.releaseLock();
  }
}

// ---- KAS MASUK ----
function handleGetKasMasuk(params) {
  params = params || {};
  const idOrder = (params.id_order && params.id_order !== 'undefined' && params.id_order !== 'null') ? String(params.id_order).trim() : '';
  const status = (params.status && params.status !== 'undefined' && params.status !== 'null' && params.status !== 'all') ? String(params.status).trim() : '';
  const nocache = params.nocache === 'true' || params.nocache === true || params.force === 'true';

  const isDefaultQuery = !idOrder && !status && !nocache;
  if (isDefaultQuery) {
    const cached = getScriptCache('kas_masuk_all');
    if (cached) return { success: true, data: cached, _cached: true };
  }

  const sheet = getSheet(SHEET_KAS_MASUK);
  let data = sheetToObjects(sheet);

  if (idOrder) {
    data = data.filter(k => k.id_order === idOrder);
  }
  if (status) {
    data = data.filter(k => k.status_verifikasi === status);
  }

  data = data.map(k => ({
    ...k,
    file_id_bukti: extractDriveFileId(k.file_id_bukti),
    link_bukti: k.file_id_bukti ? (String(k.file_id_bukti).startsWith('http') ? k.file_id_bukti : `https://drive.google.com/file/d/${k.file_id_bukti}/view`) : '',
    nominal: Number(k.nominal),
    tanggal: k.tanggal instanceof Date
      ? Utilities.formatDate(k.tanggal, 'Asia/Jakarta', 'yyyy-MM-dd')
      : String(k.tanggal),
  }));

  data.sort((a, b) => b.tanggal.localeCompare(a.tanggal));

  if (isDefaultQuery) {
    putScriptCache('kas_masuk_all', data);
  }

  return { success: true, data };
}

function handleCreateKasMasuk(body) {
  // 1. Upload ke Google Drive DI LUAR lock agar worker lain tidak tertahan antre
  let fileId = null;
  if (body.foto_base64) {
    const path = 'Bukti_Kas_Masuk';
    fileId = saveBase64ToDrive(body.foto_base64, body.foto_filename || `bukti_${Date.now()}.jpg`, path);
  }
  const driveUrl = fileId ? `https://drive.google.com/file/d/${fileId}/view` : '';

  // 2. Kunci skrip hanya selama pencatatan ID sequence dan penulisan baris sheet
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sheet = getSheet(SHEET_KAS_MASUK);
    const id = generateId('KM', sheet);
    const tanggal = body.tanggal || Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd');

    // Get nama_penerbit dari body atau dari order
    let nama_penerbit = body.nama_penerbit || '';
    if (body.id_order && !nama_penerbit) {
      const orderSheet = getSheet(SHEET_ORDERS);
      const orders = sheetToObjects(orderSheet);
      const order = orders.find(o => o.id_order === body.id_order);
      if (order) nama_penerbit = order.nama_penerbit;
    }

    const status_verifikasi = body.status_verifikasi || (body.diinput_oleh === 'OWNER' ? 'VERIFIED' : 'PENDING');

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const rowData = headers.map(h => {
      switch(h) {
        case 'id_kas_masuk': return id;
        case 'tanggal': return tanggal;
        case 'id_order': return body.id_order || '';
        case 'jenis_pembayaran': return body.jenis_pembayaran;
        case 'nominal': return Number(body.nominal) || 0;
        case 'metode': return body.metode;
        case 'diinput_oleh': return body.diinput_oleh;
        case 'status_verifikasi': return status_verifikasi;
        case 'file_id_bukti': return driveUrl || fileId || '';
        case 'nama_penerbit': return nama_penerbit;
        case 'keterangan': return body.keterangan || '';
        default: return body[h] || '';
      }
    });

    sheet.appendRow(rowData);
    SpreadsheetApp.flush();
    invalidateCache(['kas_masuk_all']);

    // Sinkronkan link bukti bayar ke tabel Orders jika terkait order
    if (body.id_order && driveUrl) {
      try {
        const orderSheet = getSheet(SHEET_ORDERS);
        ensureOrderHeaders(orderSheet);
        const orderData = orderSheet.getDataRange().getValues();
        if (orderData.length > 1) {
          const oHeaders = orderData[0];
          const oIdCol = oHeaders.indexOf('id_order');
          const oBuktiCol = oHeaders.indexOf('link_bukti');
          if (oIdCol !== -1 && oBuktiCol !== -1) {
            for (let i = 1; i < orderData.length; i++) {
              if (String(orderData[i][oIdCol]).trim() === String(body.id_order).trim()) {
                orderSheet.getRange(i + 1, oBuktiCol + 1).setValue(driveUrl);
                invalidateCache(['orders_all']);
                break;
              }
            }
          }
        }
      } catch (e) {
        Logger.log('Update order link_bukti notice: ' + e);
      }
    }

    return { success: true, data: { id_kas_masuk: id, file_id_bukti: fileId, link_bukti: driveUrl } };
  } finally {
    lock.releaseLock();
  }
}

function handleVerifyKasMasuk(body) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sheet = getSheet(SHEET_KAS_MASUK);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idCol = headers.indexOf('id_kas_masuk');
    const statusCol = headers.indexOf('status_verifikasi');

    for (let i = 1; i < data.length; i++) {
      if (data[i][idCol] === body.id_kas_masuk) {
        sheet.getRange(i + 1, statusCol + 1).setValue('VERIFIED');
        SpreadsheetApp.flush();

        // Check apakah order sudah lunas → update status order
        checkAndUpdateOrderStatus(data[i][headers.indexOf('id_order')]);
        invalidateCache(['kas_masuk_all', 'orders_all']);

        return { success: true };
      }
    }
    return { success: false, error: 'Data tidak ditemukan' };
  } finally {
    lock.releaseLock();
  }
}

function handleAttachBuktiKasMasuk(body) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sheet = getSheet(SHEET_KAS_MASUK);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idCol = headers.indexOf('id_kas_masuk');
    const fileCol = headers.indexOf('file_id_bukti');

    if (idCol === -1 || fileCol === -1) {
      return { success: false, error: 'Kolom tidak ditemukan di sheet' };
    }

    for (let i = 1; i < data.length; i++) {
      if (data[i][idCol] === body.id_kas_masuk) {
        sheet.getRange(i + 1, fileCol + 1).setValue(body.file_id_bukti || '');
        SpreadsheetApp.flush();
        invalidateCache(['kas_masuk_all']);
        return { success: true, message: 'Bukti berhasil dihubungkan ke ' + body.id_kas_masuk };
      }
    }
    return { success: false, error: 'ID Kas Masuk tidak ditemukan' };
  } finally {
    lock.releaseLock();
  }
}

function handleUpdateKasMasuk(body) {
  if (!body.id_kas_masuk) {
    return { success: false, error: 'id_kas_masuk wajib disertakan' };
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sheet = getSheet(SHEET_KAS_MASUK);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idCol = headers.indexOf('id_kas_masuk');
    if (idCol === -1) return { success: false, error: 'Kolom id_kas_masuk tidak ditemukan' };

    for (let i = 1; i < data.length; i++) {
      if (data[i][idCol] === body.id_kas_masuk) {
        const orderIdCol = headers.indexOf('id_order');
        const currentOrderId = data[i][orderIdCol] || body.id_order;

        headers.forEach((h, colIdx) => {
          if (h === 'id_kas_masuk' || h === 'diinput_oleh') return;
          if (body[h] !== undefined) {
            let val = body[h];
            if (h === 'nominal') val = Number(val) || 0;
            sheet.getRange(i + 1, colIdx + 1).setValue(val);
          }
        });

        SpreadsheetApp.flush();
        if (currentOrderId) {
          checkAndUpdateOrderStatus(currentOrderId);
        }
        invalidateCache(['kas_masuk_all', 'orders_all']);
        return { success: true, message: 'Kas Masuk berhasil diperbarui' };
      }
    }
    return { success: false, error: 'ID Kas Masuk tidak ditemukan' };
  } finally {
    lock.releaseLock();
  }
}

function handleDeleteKasMasuk(body) {
  if (!body.id_kas_masuk) return { success: false, error: 'id_kas_masuk wajib disertakan' };
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sheet = getSheet(SHEET_KAS_MASUK);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idCol = headers.indexOf('id_kas_masuk');
    const statusCol = headers.indexOf('status_verifikasi');

    for (let i = 1; i < data.length; i++) {
      if (data[i][idCol] === body.id_kas_masuk) {
        if (statusCol !== -1) {
          sheet.getRange(i + 1, statusCol + 1).setValue('BATAL');
        } else {
          sheet.deleteRow(i + 1);
        }
        SpreadsheetApp.flush();
        const orderId = data[i][headers.indexOf('id_order')];
        if (orderId) checkAndUpdateOrderStatus(orderId);
        invalidateCache(['kas_masuk_all', 'orders_all']);
        return { success: true, message: 'Kas Masuk berhasil dibatalkan' };
      }
    }
    return { success: false, error: 'Data tidak ditemukan' };
  } finally {
    lock.releaseLock();
  }
}

function checkAndUpdateOrderStatus(id_order) {
  if (!id_order) return;

  const orderSheet = getSheet(SHEET_ORDERS);
  const kmSheet = getSheet(SHEET_KAS_MASUK);
  const orders = sheetToObjects(orderSheet);
  const order = orders.find(o => o.id_order === id_order);
  if (!order) return;

  const allKM = sheetToObjects(kmSheet);
  const totalMasuk = allKM
    .filter(k => k.id_order === id_order && k.status_verifikasi === 'VERIFIED')
    .reduce((s, k) => s + Number(k.nominal), 0);

  const totalHarga = Number(order.total_harga) || 0;

  if (totalMasuk >= totalHarga) {
    // Lunas terverifikasi → order selesai (hanya naikkan; jangan ganggu order BATAL)
    if (order.status_order === 'PROSES') {
      handleUpdateOrderStatus({ id_order, status: 'SELESAI' });
    }
  } else if (order.status_order === 'SELESAI') {
    // Pembayaran dibatalkan/dikurangi → total turun di bawah tagihan, kembalikan ke PROSES
    handleUpdateOrderStatus({ id_order, status: 'PROSES' });
  }
}

// ---- KAS KELUAR ----
function handleGetKasKeluar(params) {
  params = params || {};
  const periode = (params.periode && params.periode !== 'undefined' && params.periode !== 'null' && params.periode !== 'all') ? String(params.periode).trim() : '';
  const cacheKey = 'kas_keluar_' + (periode || 'all');
  const cached = getScriptCache(cacheKey);
  if (cached) return { success: true, data: cached, _cached: true };

  const sheet = getSheet(SHEET_KAS_KELUAR);
  let data = sheetToObjects(sheet);

  if (periode) {
    data = data.filter(k => {
      const tgl = k.tanggal instanceof Date
        ? Utilities.formatDate(k.tanggal, 'Asia/Jakarta', 'yyyy-MM')
        : String(k.tanggal).substring(0, 7);
      return tgl === periode;
    });
  }

  data = data.map(k => ({
    ...k,
    file_id_nota: extractDriveFileId(k.file_id_nota),
    link_nota: k.file_id_nota ? (String(k.file_id_nota).startsWith('http') ? k.file_id_nota : `https://drive.google.com/file/d/${k.file_id_nota}/view`) : '',
    nominal: Number(k.nominal),
    tanggal: k.tanggal instanceof Date
      ? Utilities.formatDate(k.tanggal, 'Asia/Jakarta', 'yyyy-MM-dd')
      : String(k.tanggal),
  }));

  data.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  putScriptCache(cacheKey, data);
  return { success: true, data };
}

function handleCreateKasKeluar(body) {
  // 1. Upload ke Google Drive DI LUAR lock
  let fileId = null;
  if (body.foto_base64) {
    const path = 'Nota_Kas_Keluar';
    fileId = saveBase64ToDrive(body.foto_base64, body.foto_filename || `nota_${Date.now()}.jpg`, path);
  }
  const driveUrl = fileId ? `https://drive.google.com/file/d/${fileId}/view` : '';

  // 2. Kunci skrip hanya selama sequence & append
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sheet = getSheet(SHEET_KAS_KELUAR);
    const id = generateId('KK', sheet);

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const rowData = headers.map(h => {
      switch(h) {
        case 'id_kas_keluar': return id;
        case 'tanggal': return body.tanggal || Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd');
        case 'kategori': return body.kategori;
        case 'rincian': return body.rincian;
        case 'nominal': return Number(body.nominal) || 0;
        case 'sumber_kas': return body.sumber_kas;
        case 'diinput_oleh': return body.diinput_oleh;
        case 'file_id_nota': return driveUrl || fileId || '';
        default: return body[h] || '';
      }
    });

    sheet.appendRow(rowData);
    SpreadsheetApp.flush();
    invalidateCache(['kas_keluar_all']);

    return { success: true, data: { id_kas_keluar: id, file_id_nota: fileId, link_nota: driveUrl } };
  } finally {
    lock.releaseLock();
  }
}

function handleUpdateKasKeluar(body) {
  if (!body.id_kas_keluar) {
    return { success: false, error: 'id_kas_keluar wajib disertakan' };
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sheet = getSheet(SHEET_KAS_KELUAR);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idCol = headers.indexOf('id_kas_keluar');
    if (idCol === -1) return { success: false, error: 'Kolom id_kas_keluar tidak ditemukan' };

    for (let i = 1; i < data.length; i++) {
      if (data[i][idCol] === body.id_kas_keluar) {
        headers.forEach((h, colIdx) => {
          if (h === 'id_kas_keluar' || h === 'diinput_oleh') return;
          if (body[h] !== undefined) {
            let val = body[h];
            if (h === 'nominal') val = Number(val) || 0;
            sheet.getRange(i + 1, colIdx + 1).setValue(val);
          }
        });

        SpreadsheetApp.flush();
        invalidateCache(['kas_keluar_all']);
        return { success: true, message: 'Kas Keluar berhasil diperbarui' };
      }
    }
    return { success: false, error: 'ID Kas Keluar tidak ditemukan' };
  } finally {
    lock.releaseLock();
  }
}

function handleDeleteKasKeluar(body) {
  if (!body.id_kas_keluar) return { success: false, error: 'id_kas_keluar wajib disertakan' };
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sheet = getSheet(SHEET_KAS_KELUAR);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idCol = headers.indexOf('id_kas_keluar');

    for (let i = 1; i < data.length; i++) {
      if (data[i][idCol] === body.id_kas_keluar) {
        sheet.deleteRow(i + 1);
        SpreadsheetApp.flush();
        invalidateCache(['kas_keluar_all']);
        return { success: true, message: 'Kas Keluar berhasil dihapus' };
      }
    }
    return { success: false, error: 'Data tidak ditemukan' };
  } finally {
    lock.releaseLock();
  }
}

// ---- SUMMARY REPORT ----
function handleGetSummaryReport(params) {
  params = params || {};
  const periode = params.periode || Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM');
  const cacheKey = 'summary_report_' + periode;
  const cached = getScriptCache(cacheKey);
  if (cached) return { success: true, data: cached, _cached: true };

  const kmSheet = getSheet(SHEET_KAS_MASUK);
  const kkSheet = getSheet(SHEET_KAS_KELUAR);
  const orderSheet = getSheet(SHEET_ORDERS);

  const allKM = sheetToObjects(kmSheet).map(k => ({
    ...k,
    nominal: Number(k.nominal),
    tanggal: k.tanggal instanceof Date ? Utilities.formatDate(k.tanggal, 'Asia/Jakarta', 'yyyy-MM') : String(k.tanggal).substring(0, 7),
  }));

  const allKK = sheetToObjects(kkSheet).map(k => ({
    ...k,
    nominal: Number(k.nominal),
    tanggal: k.tanggal instanceof Date ? Utilities.formatDate(k.tanggal, 'Asia/Jakarta', 'yyyy-MM') : String(k.tanggal).substring(0, 7),
  }));

  const allOrders = sheetToObjects(orderSheet).map(o => ({
    ...o,
    total_harga: Number(o.total_harga),
  }));

  // Kas Masuk bulan ini (verified)
  const kmBulanIni = allKM.filter(k => k.tanggal === periode && k.status_verifikasi === 'VERIFIED');
  const kas_masuk_bulan_ini = kmBulanIni.reduce((s, k) => s + k.nominal, 0);

  // Kas Keluar bulan ini
  const kkBulanIni = allKK.filter(k => k.tanggal === periode);
  const kas_keluar_bulan_ini = kkBulanIni.reduce((s, k) => s + k.nominal, 0);

  // Total Piutang (order PROSES, sisa belum terbayar)
  const verifiedKM = allKM.filter(k => k.status_verifikasi === 'VERIFIED');
  let total_piutang = 0;
  allOrders.filter(o => o.status_order === 'PROSES').forEach(order => {
    const masuk = verifiedKM
      .filter(k => k.id_order === order.id_order)
      .reduce((s, k) => s + k.nominal, 0);
    total_piutang += Math.max(0, order.total_harga - masuk);
  });

  // Kas per sumber (bulan ini, verified)
  const kas_per_sumber = {
    kasir_tunai: kmBulanIni.filter(k => k.metode === 'KASIR_TUNAI').reduce((s, k) => s + k.nominal, 0),
    bank: kmBulanIni.filter(k => String(k.metode).toUpperCase().indexOf('BANK') !== -1).reduce((s, k) => s + k.nominal, 0),
    qris: kmBulanIni.filter(k => k.metode === 'QRIS').reduce((s, k) => s + k.nominal, 0),
  };

  // Chart data: last 6 months
  const chart_data = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const bulan = Utilities.formatDate(d, 'Asia/Jakarta', 'yyyy-MM');
    const masuk = allKM
      .filter(k => k.tanggal === bulan && k.status_verifikasi === 'VERIFIED')
      .reduce((s, k) => s + k.nominal, 0);
    const keluar = allKK
      .filter(k => k.tanggal === bulan)
      .reduce((s, k) => s + k.nominal, 0);
    chart_data.push({ bulan, kas_masuk: masuk, kas_keluar: keluar });
  }

  const reportData = {
    kas_masuk_bulan_ini,
    kas_keluar_bulan_ini,
    estimasi_laba: kas_masuk_bulan_ini - kas_keluar_bulan_ini,
    total_piutang,
    kas_per_sumber,
    chart_data,
  };

  putScriptCache(cacheKey, reportData, 60); // 1 menit

  // Daftarkan periode agar invalidasi cache berikutnya ikut menghapus laporan periode ini
  try {
    const periods = getScriptCache('__summary_periods') || [];
    if (!periods.includes(periode)) {
      periods.push(periode);
      putScriptCache('__summary_periods', periods, CACHE_TTL_SECONDS);
    }
  } catch (e) {
    Logger.log('Summary periods notice: ' + e);
  }

  return {
    success: true,
    data: reportData,
  };
}

// ---- PDF TO DRIVE ----
function handleSavePDFtoDrive(body) {
  try {
    const bytes = Utilities.base64Decode(body.pdf_base64);
    const blob = Utilities.newBlob(bytes, 'application/pdf', `${body.nomor_invoice}.pdf`);
    const path = 'Invoices';
    const folder = getOrCreateFolder(path);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return { success: true, data: { file_id: file.getId(), drive_url: file.getUrl() } };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// ---- UPLOAD FILE UMUM ----
function handleUploadFile(body) {
  try {
    const base64 = body.file_base64 || body.foto_base64 || body.base64;
    if (!base64) return { success: false, error: 'Data file base64 tidak boleh kosong' };
    const filename = body.filename || body.foto_filename || `file_${Date.now()}.jpg`;
    const folderPath = body.folder_path || 'Uploads';
    const fileId = saveBase64ToDrive(base64, filename, folderPath);
    if (!fileId) return { success: false, error: 'Gagal menyimpan file ke Google Drive' };
    return {
      success: true,
      data: {
        file_id: fileId,
        url: `https://drive.google.com/file/d/${fileId}/view`,
        filename: filename,
      }
    };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// ---- CLIENTS ----
function handleGetClients(params) {
  params = params || {};
  const nocache = params.nocache === 'true' || params.nocache === true || params.force === 'true';
  if (!nocache) {
    const cached = getScriptCache('clients_all');
    if (cached) return { success: true, data: cached, _cached: true };
  }

  const sheet = getSheet(SHEET_CLIENTS);
  const data = sheetToObjects(sheet);
  putScriptCache('clients_all', data, 300); // 5 menit
  return { success: true, data };
}

function addClientIfNew(nama_penerbit, kontak, alamat) {
  if (!nama_penerbit) return;
  const sheet = getSheet(SHEET_CLIENTS);
  const data = sheetToObjects(sheet);
  const exists = data.find(c => String(c.nama_penerbit).trim().toLowerCase() === String(nama_penerbit).trim().toLowerCase());
  if (!exists) {
    sheet.appendRow([nama_penerbit, kontak || '', alamat || '']);
  } else if ((!exists.kontak && kontak) || (!exists.alamat && alamat)) {
    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    const nameIdx = headers.indexOf('nama_penerbit');
    const kontakIdx = headers.indexOf('kontak');
    const alamatIdx = headers.indexOf('alamat');
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][nameIdx]).trim().toLowerCase() === String(nama_penerbit).trim().toLowerCase()) {
        if (kontak && kontakIdx >= 0 && !rows[i][kontakIdx]) {
          sheet.getRange(i + 1, kontakIdx + 1).setValue(kontak);
        }
        if (alamat && alamatIdx >= 0 && !rows[i][alamatIdx]) {
          sheet.getRange(i + 1, alamatIdx + 1).setValue(alamat);
        }
        break;
      }
    }
  }
}

// ---- UTILS ----
function tryParseJSON(str, fallback) {
  try { return JSON.parse(str); }
  catch (e) { return fallback; }
}

function parseFinishingSafely(val) {
  if (Array.isArray(val)) return val;
  if (!val) return ['SOFT_COVER'];
  if (typeof val === 'string') {
    val = val.trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      try {
        const arr = JSON.parse(val);
        if (Array.isArray(arr) && arr.length > 0) return arr;
      } catch (e) {}
    }
    const upper = val.toUpperCase().replace(/\s+/g, '_');
    if (upper.includes('HARD_COVER') || upper.includes('HARDCOVER')) return ['HARD_COVER'];
    if (upper.includes('SOFT_COVER') || upper.includes('SOFTCOVER')) return ['SOFT_COVER'];
    if (upper.length > 0) return [upper];
  }
  return ['SOFT_COVER'];
}

/**
 * Jalankan fungsi ini satu kali di Google Apps Script Editor untuk inisialisasi semua sheet & folder Drive otomatis:
 */
function setupDatabase() {
  const sheets = [SHEET_ORDERS, SHEET_KAS_MASUK, SHEET_KAS_KELUAR, SHEET_CLIENTS];
  sheets.forEach(name => {
    getSheet(name);
  });
  getOrCreateFolder('Bukti_Kas_Masuk');
  getOrCreateFolder('Nota_Kas_Keluar');
  getOrCreateFolder('Invoices');
  Logger.log('Setup selesai! Seluruh sheet tab & folder Google Drive berhasil diinisialisasi.');
}

// ---- RESET & MAINTENANCE ----
function clearSheetData(sheetName) {
  const sheet = getSheet(sheetName);
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
}

function handleResetData(body) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const conf = String(body.confirmation || body.pin || '').trim().toUpperCase();
    const isAuthorized = (conf === 'RESET');

    if (!isAuthorized) {
      return { success: false, error: 'Otorisasi gagal. Masukkan konfirmasi: RESET.' };
    }

    const resetOrders = body.reset_orders !== false;
    const resetKasMasuk = body.reset_kas_masuk !== false;
    const resetKasKeluar = body.reset_kas_keluar !== false;
    const resetClients = body.reset_clients === true;

    const cleared = [];

    if (resetOrders) {
      clearSheetData(SHEET_ORDERS);
      cleared.push('Orders');
    }
    if (resetKasMasuk) {
      clearSheetData(SHEET_KAS_MASUK);
      cleared.push('Kas Masuk');
    }
    if (resetKasKeluar) {
      clearSheetData(SHEET_KAS_KELUAR);
      cleared.push('Kas Keluar');
    }
    if (resetClients) {
      clearSheetData(SHEET_CLIENTS);
      cleared.push('Clients');
    }

    invalidateCache(['orders_all', 'kas_masuk_all', 'kas_keluar_all', 'clients_all']);

    return {
      success: true,
      message: cleared.length > 0
        ? `Berhasil mereset data: ${cleared.join(', ')}`
        : 'Tidak ada tabel data yang dipilih untuk direset',
      data: { cleared }
    };
  } catch (err) {
    return { success: false, error: 'Gagal mereset data: ' + err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Jalankan fungsi ini 1x di editor Apps Script (script.google.com)
 * untuk memberikan izin akses Google Drive (DriveApp):
 * 1. Pilih fungsi 'testDrivePermission' pada dropdown di toolbar atas
 * 2. Klik tombol 'Jalankan' (Run)
 * 3. Klik 'Tinjau Izin' (Review Permissions) -> Pilih Akun Google -> Lanjutan (Advanced) -> Buka KBM Percetakan (tidak aman) -> Izinkan (Allow)
 * 4. Deploy ulang Web App: Deploy > Manage deployments > Edit > New version > Deploy
 */
function testDrivePermission() {
  const root = DriveApp.getRootFolder();
  Logger.log('✅ DriveApp berhasil diotorisasi! Nama root: ' + root.getName());
  const folder = getOrCreateFolder('test');
  Logger.log('✅ Folder sistem siap: ' + folder.getName());
}

