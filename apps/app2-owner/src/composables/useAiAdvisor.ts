import { formatRupiah } from '@shared/utils/formatters'
import type { useFinanceStore } from '../stores/finance'

export const geminiModels = [
  { id: 'auto', name: 'Auto-Rotate (Rekomendasi)' },
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite' },
  { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite' },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite' },
  { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash' },
  { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash' },
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash' },
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash' },
  { id: 'gemma-4-31b-it', name: 'Gemma 4 31B IT' },
]

export const ollamaModels = [
  { id: 'gemma4:31b', name: 'Ollama: gemma4:31b' },
  { id: 'gpt-oss:120b', name: 'Ollama: gpt-oss:120b' },
  { id: 'gpt-oss:20b', name: 'Ollama: gpt-oss:20b' },
  { id: 'nemotron-3-nano:30b', name: 'Ollama: nemotron-3-nano:30b' },
  { id: 'nemotron-3-super', name: 'Ollama: nemotron-3-super' },
  { id: 'nemotron-3-ultra', name: 'Ollama: nemotron-3-ultra' },
]

export const quickChips = [
  { icon: '📊', label: 'Ringkasan Finansial', prompt: 'Berikan ringkasan eksekutif kesehatan keuangan dan laba bersih saat ini.' },
  { icon: '⚠️', label: 'Analisis Piutang', prompt: 'Siapa penerbit dengan sisa piutang terbesar dan berapa total piutang yang belum tertagih?' },
  { icon: '👥', label: 'Top 5 Penerbit', prompt: 'Siapa 5 penerbit dengan kontribusi omzet terbesar dan berapa jumlah order mereka?' },
  { icon: '📦', label: 'Audit Biaya Bahan', prompt: 'Berapa total kas keluar untuk bahan baku kertas dan efisiensinya terhadap kas masuk?' },
  { icon: '💡', label: 'Saran Strategi', prompt: 'Apa rekomendasi strategis terbaik untuk meningkatkan perputaran kas dan margin keuntungan KBM?' },
]

export function formatInline(text: string): string {
  if (!text) return ''
  let s = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Code inline: `code`
  s = s.replace(/`([^`]+)`/g, '<code class="bg-slate-100 text-indigo-700 px-1 py-0.5 rounded font-mono text-[12px]">$1</code>')

  // Bold + Italic: ***text***
  s = s.replace(/\*\*\*(.*?)\*\*\*/g, '<strong class="font-bold text-slate-900"><em class="italic">$1</em></strong>')

  // Bold: **text** or __text__
  s = s.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>')
  s = s.replace(/__(.*?)__/g, '<strong class="font-semibold text-slate-900">$1</strong>')

  // Italic with parens like (*bulk buy*) or *(Contoh: ...)*
  s = s.replace(/\*\(([^\)]+)\)\*/g, '(<em class="italic text-slate-700">$1</em>)')
  s = s.replace(/\(\*([^\)]+)\*\)/g, '(<em class="italic text-slate-700">$1</em>)')

  // Italic: *text* (word boundary or surrounded by whitespace/punctuation)
  s = s.replace(/(^|[^\*])\*([^\*\s][^\*]*?[^\*\s]|\S)\*([^\*]|$)/g, '$1<em class="italic text-slate-700">$2</em>$3')
  s = s.replace(/_([^_]+)_/g, '<em class="italic text-slate-700">$1</em>')

  // Clean up any accidental leftover lone asterisks
  s = s.replace(/(^|\s)\*+(\s|$)/g, ' ')

  return s.trim()
}

export function formatMarkdown(text: string): string {
  if (!text) return ''

  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const output: string[] = []
  let inList: 'ul' | 'ol' | null = null
  let inCodeBlock = false
  let codeBuffer: string[] = []

  function closeList() {
    if (inList) {
      output.push(inList === 'ul' ? '</ul>' : '</ol>')
      inList = null
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const trimmed = rawLine.trim()

    // Code blocks
    if (trimmed.startsWith('```')) {
      closeList()
      if (inCodeBlock) {
        output.push(
          `<pre class="bg-slate-900 text-slate-100 p-3 rounded-lg text-xs font-mono overflow-x-auto my-2"><code>${codeBuffer.join('\n')}</code></pre>`
        )
        codeBuffer = []
        inCodeBlock = false
      } else {
        inCodeBlock = true
      }
      continue
    }

    if (inCodeBlock) {
      codeBuffer.push(
        rawLine
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
      )
      continue
    }

    // Blank line closes lists
    if (!trimmed) {
      closeList()
      continue
    }

    // Horizontal rule
    if (/^(\-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      closeList()
      output.push('<hr class="my-2 border-slate-200" />')
      continue
    }

    // Headings
    if (trimmed.startsWith('#### ')) {
      closeList()
      output.push(`<h5 class="font-bold text-slate-900 text-xs mt-2.5 mb-1">${formatInline(trimmed.slice(5))}</h5>`)
      continue
    }
    if (trimmed.startsWith('### ')) {
      closeList()
      output.push(`<h4 class="font-bold text-slate-900 text-[13px] mt-2.5 mb-1">${formatInline(trimmed.slice(4))}</h4>`)
      continue
    }
    if (trimmed.startsWith('## ')) {
      closeList()
      output.push(`<h3 class="font-bold text-slate-900 text-sm mt-3 mb-1.5">${formatInline(trimmed.slice(3))}</h3>`)
      continue
    }
    if (trimmed.startsWith('# ')) {
      closeList()
      output.push(`<h2 class="font-bold text-slate-900 text-sm mt-3 mb-1.5">${formatInline(trimmed.slice(2))}</h2>`)
      continue
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      closeList()
      output.push(
        `<blockquote class="border-l-2 border-indigo-500 pl-3 py-1 my-1.5 text-slate-600 italic bg-indigo-50/40 rounded-r">${formatInline(trimmed.slice(2))}</blockquote>`
      )
      continue
    }

    // Bullet items: * item, - item, • item, + item
    const bulletMatch = rawLine.match(/^(\s*)[\*\-•\+]\s+(.*)$/)
    if (bulletMatch) {
      if (inList !== 'ul') {
        closeList()
        output.push('<ul class="my-1 space-y-1 pl-1">')
        inList = 'ul'
      }
      const isSub = bulletMatch[1].length >= 2
      output.push(
        `<li class="flex items-start gap-2 ${isSub ? 'pl-4 text-slate-700' : 'text-slate-800'}"><span class="text-indigo-600 font-bold shrink-0 leading-relaxed select-none">•</span><div class="flex-1">${formatInline(bulletMatch[2])}</div></li>`
      )
      continue
    }

    // Numbered items: 1. item, 1 . item, 1) item
    const numMatch = rawLine.match(/^(\s*)(\d+)\s*[\.\)]\s+(.*)$/)
    if (numMatch) {
      if (inList !== 'ol') {
        closeList()
        output.push('<ol class="my-1.5 space-y-1 pl-1">')
        inList = 'ol'
      }
      const isSub = numMatch[1].length >= 2
      output.push(
        `<li class="flex items-start gap-2 ${isSub ? 'pl-4' : ''} text-slate-800"><span class="font-bold text-slate-700 font-mono shrink-0 leading-relaxed select-none">${numMatch[2]}.</span><div class="flex-1">${formatInline(numMatch[3])}</div></li>`
      )
      continue
    }

    // Regular paragraph
    closeList()
    output.push(`<p class="my-1 text-slate-800 leading-relaxed">${formatInline(trimmed)}</p>`)
  }

  closeList()
  return output.join('\n')
}

export function buildLiveSystemPrompt(financeStore: ReturnType<typeof useFinanceStore>): string {
  const orders = financeStore.ordersList || []
  const kasMasuk = financeStore.kasMasukList || []
  const kasKeluar = financeStore.kasKeluarList || []

  const ordersNonBatal = orders.filter((o) => o.status_order !== 'BATAL')
  const totalOmzet = ordersNonBatal.reduce((sum, o) => sum + (Number(o.total_harga) || 0), 0)

  const kmNonBatal = kasMasuk.filter((k) => (k as any).status_verifikasi !== 'BATAL')
  const totalMasukVerified = kmNonBatal
    .filter((k) => (k as any).status_verifikasi === 'VERIFIED')
    .reduce((sum, k) => sum + (Number(k.nominal) || 0), 0)
  const totalMasukPending = kmNonBatal
    .filter((k) => (k as any).status_verifikasi === 'PENDING')
    .reduce((sum, k) => sum + (Number(k.nominal) || 0), 0)

  const totalKeluar = kasKeluar.reduce((sum, k) => sum + (Number(k.nominal) || 0), 0)
  const biayaBahan = kasKeluar
    .filter((k) => k.kategori === 'BAHAN_BAKU')
    .reduce((sum, k) => sum + (Number(k.nominal) || 0), 0)
  const biayaOps = kasKeluar
    .filter((k) => k.kategori === 'OPERASIONAL')
    .reduce((sum, k) => sum + (Number(k.nominal) || 0), 0)
  const biayaGaji = kasKeluar
    .filter((k) => k.kategori === 'GAJI')
    .reduce((sum, k) => sum + (Number(k.nominal) || 0), 0)

  const labaBersihKas = totalMasukVerified - totalKeluar
  const totalPiutang = Math.max(0, totalOmzet - totalMasukVerified)
  const marginLaba = totalMasukVerified > 0 ? ((labaBersihKas / totalMasukVerified) * 100).toFixed(1) : '0'

  // Top Publishers
  const publisherMap: Record<string, { omzet: number; orderCount: number; paid: number }> = {}
  for (const o of ordersNonBatal) {
    const pub = o.nama_penerbit || 'Tanpa Penerbit'
    if (!publisherMap[pub]) publisherMap[pub] = { omzet: 0, orderCount: 0, paid: 0 }
    publisherMap[pub].omzet += Number(o.total_harga) || 0
    publisherMap[pub].orderCount += 1
  }

  for (const k of kmNonBatal) {
    const pub = k.nama_penerbit || 'Tanpa Penerbit'
    if (publisherMap[pub] && (k as any).status_verifikasi === 'VERIFIED') {
      publisherMap[pub].paid += Number(k.nominal) || 0
    }
  }

  const topPublishers = Object.entries(publisherMap)
    .sort((a, b) => b[1].omzet - a[1].omzet)
    .slice(0, 5)

  const piutangList = Object.entries(publisherMap)
    .map(([pub, val]) => ({
      pub,
      piutang: Math.max(0, val.omzet - val.paid),
      omzet: val.omzet,
    }))
    .filter((p) => p.piutang > 0)
    .sort((a, b) => b.piutang - a.piutang)
    .slice(0, 5)

  return `Kamu adalah KBM AI Executive Advisor, asisten bisnis & penasihat keuangan senior untuk pemilik (Owner) percetakan buku "KBM Printing".
Tugasmu: Memberikan analisis finansial, audit operasional, strategi bisnis percetakan, dan prioritas penagihan piutang secara cerdas, objektif, profesional, dan ringkas dalam Bahasa Indonesia.

ATURAN MUTLAK:
1. Statusmu adalah READ-ONLY (Penasihat). Jangan pernah mengeksekusi perubahan data atau menjanjikan mutasi database.
2. Jawab dengan format Markdown yang rapi (gunakan bolding untuk angka rupiah, bullet points, dan rekomendasi tindakan bernomor).
3. Gunakan angka riil dari ringkasan data finansial perusahaan di bawah ini sebagai acuan:

=== DATA FINANSIAL AKTUAL KBM PRINTING HARI INI ===
- Total Omzet Pesanan: ${formatRupiah(totalOmzet)} (${ordersNonBatal.length} judul buku aktif)
- Total Kas Masuk Terverifikasi: ${formatRupiah(totalMasukVerified)}
- Total Kas Masuk Menunggu Approval/Pending: ${formatRupiah(totalMasukPending)}
- Total Kas Keluar: ${formatRupiah(totalKeluar)}
  * Biaya Bahan Baku (Kertas/Cover): ${formatRupiah(biayaBahan)}
  * Biaya Operasional / Workshop / Listrik: ${formatRupiah(biayaOps)}
  * Biaya Gaji / Upah Tim: ${formatRupiah(biayaGaji)}
- Laba Bersih Kas (Cash Profit): ${formatRupiah(labaBersihKas)} (Margin Kas: ${marginLaba}%)
- Total Sisa Piutang Berjalan: ${formatRupiah(totalPiutang)}

Top 5 Mitra Penerbit & Kontribusi Omzet:
${topPublishers.map(([pub, d], i) => `${i + 1}. ${pub}: Omzet ${formatRupiah(d.omzet)}, Piutang ${formatRupiah(Math.max(0, d.omzet - d.paid))}`).join('\n')}

Daftar Sisa Piutang Tertinggi yang Perlu Ditagih:
${piutangList.length ? piutangList.map((p, i) => `${i + 1}. ${p.pub}: ${formatRupiah(p.piutang)}`).join('\n') : '(Tidak ada piutang tertunggak)'}
===================================================

Berikan jawaban yang taktis, tajam, dan langsung memberikan nilai tambah bagi Owner dalam mengelola arus kas dan pertumbuhan percetakan KBM.`
}

export function generateLocalFallback(query: string, financeStore: ReturnType<typeof useFinanceStore>): string {
  const q = query.toLowerCase()
  const orders = financeStore.ordersList || []
  const kasMasuk = financeStore.kasMasukList || []
  const kasKeluar = financeStore.kasKeluarList || []

  const ordersNonBatal = orders.filter((o) => o.status_order !== 'BATAL')
  const totalOmzet = ordersNonBatal.reduce((sum, o) => sum + (Number(o.total_harga) || 0), 0)
  const totalMasukVerified = kasMasuk
    .filter((k) => (k as any).status_verifikasi === 'VERIFIED')
    .reduce((sum, k) => sum + (Number(k.nominal) || 0), 0)
  const totalKeluar = kasKeluar.reduce((sum, k) => sum + (Number(k.nominal) || 0), 0)
  const totalPiutang = Math.max(0, totalOmzet - totalMasukVerified)
  const labaBersihKas = totalMasukVerified - totalKeluar

  if (q.includes('piutang') || q.includes('tagih')) {
    return `### ⚠️ Analisis Piutang (Fallback Lokal)\n\n* **Total Piutang Berjalan:** **${formatRupiah(totalPiutang)}**\n* **Total Omzet:** **${formatRupiah(totalOmzet)}**\n\nPrioritaskan penagihan piutang sebelum melanjutkan cetak volume besar berikutnya.`
  }

  return `### 📊 Ringkasan Finansial KBM Printing (Fallback Lokal)\n\n* **Total Omzet:** **${formatRupiah(totalOmzet)}**\n* **Kas Masuk Terverifikasi:** **${formatRupiah(totalMasukVerified)}**\n* **Kas Keluar:** **${formatRupiah(totalKeluar)}**\n* **Laba Bersih Kas:** **${formatRupiah(labaBersihKas)}**\n* **Sisa Piutang:** **${formatRupiah(totalPiutang)}**`
}
