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
const DRIVE_FOLDER_NAME = 'Percetakan_System_Drive';
const PIN_KASIR = '1234'; // Ganti sesuai kebutuhan
const PASSWORD_OWNER = 'kbm2026'; // Ganti dengan password kuat

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

// ---- MAIN ROUTER ----
function doGet(e) {
  return route(e);
}

function doPost(e) {
  return route(e);
}

function route(e) {
  try {
    let action, body = {};

    if (e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
      action = body.action || e.parameter.action;
    } else {
      action = e.parameter.action;
    }

    const handlers = {
      'ping': () => ({ success: true, message: 'pong', timestamp: Date.now() }),
      'validatePin': () => handleValidatePin(body),
      'validatePassword': () => handleValidatePassword(body),
      'getOrders': () => handleGetOrders(e.parameter),
      'createOrder': () => handleCreateOrder(body),
      'updateOrderStatus': () => handleUpdateOrderStatus(body),
      'getKasMasuk': () => handleGetKasMasuk(e.parameter),
      'createKasMasuk': () => handleCreateKasMasuk(body),
      'verifyKasMasuk': () => handleVerifyKasMasuk(body),
      'attachBuktiKasMasuk': () => handleAttachBuktiKasMasuk(body),
      'getKasKeluar': () => handleGetKasKeluar(e.parameter),
      'createKasKeluar': () => handleCreateKasKeluar(body),
      'getSummaryReport': () => handleGetSummaryReport(e.parameter),
      'savePDFtoDrive': () => handleSavePDFtoDrive(body),
      'getClients': () => handleGetClients(),
      'resetData': () => handleResetData(body),
    };

    if (!action || !handlers[action]) {
      return jsonResponse({ success: false, error: 'Action tidak dikenal: ' + action });
    }

    return jsonResponse(handlers[action]());
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

// ---- AUTH ----
function handleValidatePin(body) {
  if (body.pin === PIN_KASIR) {
    return { success: true, data: { role: 'KASIR', nama: 'Kasir KBM' } };
  }
  return { success: false, error: 'PIN salah' };
}

function handleValidatePassword(body) {
  if (body.password === PASSWORD_OWNER) {
    return { success: true, data: { role: 'OWNER', nama: 'Owner KBM' } };
  }
  return { success: false, error: 'Password salah' };
}

// ---- CACHING SERVICE HELPERS (Hemat Kuota Eksekusi GAS) ----
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
    if (Array.isArray(keys)) {
      cache.removeAll(keys);
    } else {
      cache.remove(keys);
    }
  } catch (e) {
    Logger.log('Cache invalidate notice: ' + e);
  }
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
    [SHEET_ORDERS]: ['id_order','tanggal','nama_penerbit','judul_penulis','judul_buku','nama_penulis','jml_pcs','ukuran','ukuran_custom','kertas','cetak_bw','cetak_fc','finishing','total_harga','status_order','catatan','alamat_penerbit','kontak_penerbit'],
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
  const required = ['judul_buku', 'nama_penulis', 'alamat_penerbit', 'kontak_penerbit'];
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

function generateId(prefix, sheet) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const now = new Date();
    const yyyymm = Utilities.formatDate(now, 'Asia/Jakarta', 'yyyyMM');
    const rows = sheet.getLastRow() - 1; // minus header
    const seq = String(rows + 1).padStart(3, '0');
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
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  return `${DRIVE_FOLDER_NAME}/${yyyy}/${mm}`;
}

// ---- ORDERS ----
function handleGetOrders(params) {
  params = params || {};
  const isDefaultQuery = (!params.status || params.status === '') && (!params.search || params.search === '');
  if (isDefaultQuery) {
    const cached = getScriptCache('orders_all');
    if (cached) return { success: true, data: cached, _cached: true };
  }

  const sheet = getSheet(SHEET_ORDERS);
  let data = sheetToObjects(sheet);

  if (params.status) {
    data = data.filter(o => o.status_order === params.status);
  }
  if (params.search) {
    const q = params.search.toLowerCase();
    data = data.filter(o =>
      String(o.nama_penerbit).toLowerCase().includes(q) ||
      String(o.judul_penulis).toLowerCase().includes(q) ||
      String(o.id_order).toLowerCase().includes(q)
    );
  }

  // Parse finishing JSON & support separated book fields
  data = data.map(o => ({
    ...o,
    finishing: tryParseJSON(o.finishing, []),
    jml_pcs: Number(o.jml_pcs),
    cetak_bw: Number(o.cetak_bw),
    cetak_fc: Number(o.cetak_fc),
    total_harga: Number(o.total_harga),
    judul_buku: o.judul_buku || (o.judul_penulis ? String(o.judul_penulis).split(' / ')[0] : ''),
    nama_penulis: o.nama_penulis || (o.judul_penulis && String(o.judul_penulis).includes(' / ') ? String(o.judul_penulis).split(' / ').slice(1).join(' / ') : ''),
    alamat_penerbit: o.alamat_penerbit || '',
    kontak_penerbit: o.kontak_penerbit || '',
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

    const id_order = generateId('ORD', sheet);
    const tanggal = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd');

    const order = body.order;
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
        case 'cetak_bw': return Number(order.cetak_bw) || 0;
        case 'cetak_fc': return Number(order.cetak_fc) || 0;
        case 'finishing': return JSON.stringify(order.finishing || []);
        case 'total_harga': return Number(order.total_harga) || 0;
        case 'status_order': return 'PROSES';
        case 'catatan': return order.catatan || '';
        case 'alamat_penerbit': return order.alamat_penerbit || '';
        case 'kontak_penerbit': return order.kontak_penerbit || '';
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

// ---- KAS MASUK ----
function handleGetKasMasuk(params) {
  params = params || {};
  const isDefaultQuery = (!params.id_order || params.id_order === '') && (!params.status || params.status === '');
  if (isDefaultQuery) {
    const cached = getScriptCache('kas_masuk_all');
    if (cached) return { success: true, data: cached, _cached: true };
  }

  const sheet = getSheet(SHEET_KAS_MASUK);
  let data = sheetToObjects(sheet);

  if (params.id_order) {
    data = data.filter(k => k.id_order === params.id_order);
  }
  if (params.status) {
    data = data.filter(k => k.status_verifikasi === params.status);
  }

  data = data.map(k => ({
    ...k,
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
    const path = `${getYearMonthPath()}/Bukti_Kas_Masuk`;
    fileId = saveBase64ToDrive(body.foto_base64, body.foto_filename || `bukti_${Date.now()}.jpg`, path);
  }

  // 2. Kunci skrip hanya selama pencatatan ID sequence dan penulisan baris sheet
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sheet = getSheet(SHEET_KAS_MASUK);
    const id = generateId('KM', sheet);
    const tanggal = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd');

    // Get nama_penerbit dari order
    let nama_penerbit = '';
    if (body.id_order) {
      const orderSheet = getSheet(SHEET_ORDERS);
      const orders = sheetToObjects(orderSheet);
      const order = orders.find(o => o.id_order === body.id_order);
      if (order) nama_penerbit = order.nama_penerbit;
    }

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
        case 'status_verifikasi': return 'PENDING';
        case 'file_id_bukti': return fileId || '';
        case 'nama_penerbit': return nama_penerbit;
        case 'keterangan': return body.keterangan || '';
        default: return body[h] || '';
      }
    });

    sheet.appendRow(rowData);
    SpreadsheetApp.flush();
    invalidateCache(['kas_masuk_all']);

    return { success: true, data: { id_kas_masuk: id, file_id_bukti: fileId } };
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

  if (totalMasuk >= Number(order.total_harga)) {
    handleUpdateOrderStatus({ id_order, status: 'SELESAI' });
  }
}

// ---- KAS KELUAR ----
function handleGetKasKeluar(params) {
  params = params || {};
  const cacheKey = 'kas_keluar_' + (params.periode || 'all');
  const cached = getScriptCache(cacheKey);
  if (cached) return { success: true, data: cached, _cached: true };

  const sheet = getSheet(SHEET_KAS_KELUAR);
  let data = sheetToObjects(sheet);

  if (params.periode) {
    data = data.filter(k => {
      const tgl = k.tanggal instanceof Date
        ? Utilities.formatDate(k.tanggal, 'Asia/Jakarta', 'yyyy-MM')
        : String(k.tanggal).substring(0, 7);
      return tgl === params.periode;
    });
  }

  data = data.map(k => ({
    ...k,
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
    const path = `${getYearMonthPath()}/Nota_Kas_Keluar`;
    fileId = saveBase64ToDrive(body.foto_base64, body.foto_filename || `nota_${Date.now()}.jpg`, path);
  }

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
        case 'file_id_nota': return fileId || '';
        default: return body[h] || '';
      }
    });

    sheet.appendRow(rowData);
    SpreadsheetApp.flush();
    invalidateCache(['kas_keluar_all']);

    return { success: true, data: { id_kas_keluar: id, file_id_nota: fileId } };
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
    bank_bca: kmBulanIni.filter(k => k.metode === 'BANK_BCA').reduce((s, k) => s + k.nominal, 0),
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
    const path = `${DRIVE_FOLDER_NAME}/Generated_Invoices/${new Date().getFullYear()}/${String(new Date().getMonth()+1).padStart(2,'0')}`;
    const folder = getOrCreateFolder(path);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return { success: true, data: { file_id: file.getId(), drive_url: file.getUrl() } };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// ---- CLIENTS ----
function handleGetClients() {
  const cached = getScriptCache('clients_all');
  if (cached) return { success: true, data: cached, _cached: true };

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

/**
 * Jalankan fungsi ini satu kali di Google Apps Script Editor untuk inisialisasi semua sheet & folder Drive otomatis:
 */
function setupDatabase() {
  const sheets = [SHEET_ORDERS, SHEET_KAS_MASUK, SHEET_KAS_KELUAR, SHEET_CLIENTS];
  sheets.forEach(name => {
    getSheet(name);
  });
  getOrCreateFolder(DRIVE_FOLDER_NAME);
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
    const pin = String(body.pin || '').trim();
    const conf = String(body.confirmation || '').trim().toUpperCase();
    const isAuthorized = (pin === PIN_KASIR) || (pin === PASSWORD_OWNER) || (conf === 'RESET');

    if (!isAuthorized) {
      return { success: false, error: 'Otorisasi gagal. Masukkan PIN yang valid atau ketik RESET.' };
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
  const folder = getOrCreateFolder(`${DRIVE_FOLDER_NAME}/test`);
  Logger.log('✅ Folder sistem siap: ' + folder.getName());
}

