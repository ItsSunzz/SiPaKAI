import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Search, X, FileText, Filter, Printer, PenTool, RotateCcw,
} from 'lucide-react'
import { api } from '../services/api'
import TablePagination from '../components/TablePagination'
import { inputCls } from '../components/UserFormModal'
import DefaultOfficerSignatureModal from '../components/DefaultOfficerSignatureModal'

const PER_PAGE = 8
const BUSINESS_AREA = 'B060'
const FORM_NUMBER = 'FR.SM/TI/014.001/10-2020'
const FORM_DATE = '12 Oktober 2020'
const FORM_VERSION = '003-2020'
const LOGO_URL = '/images/kai_logo.png'

const getTodayDate = () => {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

const fmtDate = (value) => {
  if (!value) return '–'
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
}
const fmtTime = (value) => value ? String(value).slice(0, 5) : '–'
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

function Signature({ src, alt }) {
  const [failed, setFailed] = useState(false)

  useEffect(() => setFailed(false), [src])

  if (!src || failed) {
    return (
      <span className="block text-center text-[10px] text-slate-400">
        —
      </span>
    )
  }

  return (
    <div className="flex h-full w-full items-center justify-center">
      <img
        src={src}
        alt={alt}
        onError={() => setFailed(true)}
        className="block mx-auto max-h-12 max-w-[100px] object-contain object-center"
      />
    </div>
  )
}

// Kolom TTD Keluar memakai tanda tangan pengunjung yang sudah tersimpan saat check-in,
// dan hanya ditampilkan setelah checkout selesai. API saat ini belum menyimpan TTD checkout terpisah.
function makePrintHtml(visitors, filters, logoUrl, noRef) {
  const PAGE_ROWS = 8
  const chunks = []
  for (let i = 0; i < visitors.length; i += PAGE_ROWS) {
    chunks.push(visitors.slice(i, i + PAGE_ROWS))
  }
  if (!visitors.length) chunks.push([])
  const totalPages = chunks.length

  const pageHtml = (pageRows, pageIndex) => {
    const rows = Array.from({ length: PAGE_ROWS }, (_, rowIndex) => {
      const v = pageRows[rowIndex]
      const number = pageIndex * PAGE_ROWS + rowIndex + 1
      if (!v) return `<tr class="empty-row"><td class="no">${number}</td>${'<td></td>'.repeat(11)}</tr>`
      return `<tr>
        <td class="no">${number}</td><td>${esc(v.name || '')}</td><td>${esc(v.institution || '')}</td>
        <td>${esc(v.purpose || '')}</td><td>${esc(v.host_name || '')}</td><td>${esc(v.phone || '')}</td>
        <td>${esc(v.visitor_card_no || '')}</td><td class="center">${esc(fmtTime(v.time_in) === '–' ? '' : fmtTime(v.time_in))}</td>
        <td class="sign">${v.visitor_signature_url ? `<img src="${esc(v.visitor_signature_url)}" alt="TTD masuk">` : ''}</td>
        <td class="center">${esc(fmtTime(v.time_out) === '–' ? '' : fmtTime(v.time_out))}</td><td class="sign">${v.time_out && v.visitor_signature_url ? `<img src="${esc(v.visitor_signature_url)}" alt="TTD pengunjung keluar">` : ''}</td>
        <td class="sign">${v.officer_signature_url ? `<img src="${esc(v.officer_signature_url)}" alt="TTD petugas">` : (v.checkout_type === 'auto' ? '<small>Auto Checkout oleh Sistem</small>' : '')}</td>
      </tr>`
    }).join('')

    return `<section class="page ${pageIndex ? 'new-page' : ''}">
      <div class="form-head">
        <div class="logo-cell"><img class="logo" src="${esc(logoUrl)}" alt="Logo KAI"></div>
        <div class="identity-top"><div class="company">PT KERETA API INDONESIA (PERSERO)</div><div class="system">SISTEM INFORMASI</div></div>
        <div class="meta-row meta-1"><span>Nomor</span><b>${FORM_NUMBER}</b></div>
        <div class="meta-row meta-2"><span>Tanggal</span><b>${FORM_DATE}</b></div>
        <div class="umum-cell"><span class="umum">UMUM</span></div>
        <div class="identity-bottom"><div class="book">BUKU TAMU</div></div>
        <div class="meta-row meta-3"><span>Versi</span><b>${FORM_VERSION}</b></div>
        <div class="meta-row meta-4"><span>Halaman</span><b>${pageIndex + 1} dari ${totalPages}</b></div>
      </div>
      <table class="ref"><colgroup><col style="width:42%"><col style="width:58%"></colgroup><tbody><tr><td>No. Ref <span class="colon">:</span></td><td>${esc(noRef)}</td></tr><tr><td>Tanggal <span class="colon">:</span></td><td>${esc(fmtDate(filters.reportDate))}</td></tr><tr><td>Business Area <span class="colon">:</span></td><td>${BUSINESS_AREA}</td></tr></tbody></table>
      <table class="booktable"><colgroup>
        <col style="width:3.8%"><col style="width:16.23%"><col style="width:10.03%"><col style="width:11.86%"><col style="width:8.89%"><col style="width:7.52%"><col style="width:7.52%"><col style="width:6.32%"><col style="width:6.32%"><col style="width:6.32%"><col style="width:6.32%"><col style="width:8.88%">
      </colgroup><thead>
        <tr><th rowspan="2">NO</th><th rowspan="2">NAMA</th><th rowspan="2">INSTANSI</th><th rowspan="2">KEPERLUAN</th><th rowspan="2">PERSONIL<br>YG DITUJU</th><th rowspan="2">NO HP</th><th rowspan="2">NO<br>VISITOR</th><th colspan="2">MASUK</th><th colspan="2">KELUAR</th><th>PETUGAS/<br>SATPAM</th></tr>
        <tr><th>JAM</th><th>TTD</th><th>JAM</th><th>TTD</th><th>TTD</th></tr>
      </thead><tbody>${rows}</tbody></table>
    </section>`
  }

  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Formulir Buku Tamu KAI</title>
  <style>
    @page{size:A4 landscape;margin:20mm 15mm}
    *{box-sizing:border-box}
    html,body{margin:0;padding:0;font-family:Calibri,Arial,sans-serif;color:#111;font-size:8pt;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .page{width:100%;height:170mm;overflow:hidden;break-after:page;page-break-after:always}
    .page:last-child{break-after:auto;page-break-after:auto}
    .form-head{width:100%;height:30mm;display:grid;grid-template-columns:20% 46% 10.2% 23.8%;grid-template-rows:repeat(4,7.5mm);border:1px solid #333}
    .logo-cell{grid-column:1;grid-row:1 / span 2;display:flex;align-items:center;justify-content:center;border-right:1px solid #333;border-bottom:1px solid #333}
    .logo{width:32mm;height:11mm;max-width:calc(100% - 4mm);max-height:calc(100% - 4mm);object-fit:contain}
    .identity-top{grid-column:2;grid-row:1 / span 2;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;border-right:1px solid #333;border-bottom:1px solid #333;font-weight:bold}
    .company{font-size:11pt}.system{font-size:10pt;margin-top:1mm}
    .umum-cell{grid-column:1;grid-row:3 / span 2;display:flex;align-items:center;justify-content:center;border-right:1px solid #333}
    .umum{display:block;width:34mm;border:1mm solid #52c95e;color:#27a84a;text-align:center;font-size:15pt;font-weight:bold;padding:1mm 0}
    .identity-bottom{grid-column:2;grid-row:3 / span 2;display:flex;align-items:center;justify-content:center;text-align:center;border-right:1px solid #333;font-weight:bold}
    .book{font-size:11pt}
    .meta-row{grid-column:3 / span 2;display:grid;grid-template-columns:30% 70%;font-size:8.5pt;border-bottom:1px solid #555}
    .meta-row span,.meta-row b{display:flex;align-items:center;padding:1mm 2mm;font-weight:normal}
    .meta-row span{border-right:1px solid #555}
    .meta-1{grid-row:1}.meta-2{grid-row:2}.meta-3{grid-row:3}.meta-4{grid-row:4;border-bottom:0}
    .ref{width:76mm;height:auto;margin:4mm 0 5mm;border-collapse:collapse;table-layout:fixed;border:1px solid #777;font-size:9pt;color:#555}
    .ref td{height:5.5mm;padding:.7mm 1.5mm;border:1px solid #777;vertical-align:middle;font-weight:normal}
    .ref td:first-child{padding-right:2mm;border-right:0}
    .ref td:last-child{border-left:0}
    .ref .colon{float:right;margin-left:2mm}
    .booktable{width:100%;border-collapse:collapse;table-layout:fixed}
    .booktable th,.booktable td{border:1px solid #222;padding:1.1mm .7mm;overflow-wrap:anywhere;vertical-align:middle}
    .booktable thead th{background:#c9c9c9;text-align:center;font-size:8pt;line-height:1.12;height:8mm;font-weight:bold}
    .booktable thead tr:nth-child(2) th{height:6mm}
    .booktable tbody td{height:10mm;font-size:7.5pt}.booktable tbody tr:first-child td{height:18mm}
    .booktable .no{text-align:center;font-weight:bold}.center{text-align:center}.sign{text-align:center}
    .sign img{max-width:95%;max-height:11mm;object-fit:contain}
    .empty-row td{height:10mm}.empty-row:first-child td{height:18mm}
    .new-page{break-before:page;page-break-before:always}
    @media screen{body{padding:12mm;background:#ddd}.page{background:white;padding:0;max-width:267mm;margin:0 auto 10mm;box-shadow:0 1mm 5mm #999}}
  </style></head><body>
  ${chunks.map(pageHtml).join('')}
  <script>
    window.addEventListener('load',async()=>{
      await Promise.all([...document.images].map(img=>img.decode?.().catch(()=>null)));
      setTimeout(()=>{window.focus();window.print()},250);
    });
  </script></body></html>`
}

function FormHeader() {
  return (
    <div className="grid grid-cols-[20%_46%_10.2%_23.8%] grid-rows-[repeat(4,minmax(24px,1fr))] overflow-hidden border border-[#333] bg-white text-xs text-slate-700">
      <div className="col-start-1 row-span-2 flex items-center justify-center border-b border-r border-slate-700 p-2">
        <img src={LOGO_URL} alt="Logo PT Kereta Api Indonesia" className="h-8 max-w-[115px] object-contain" />
      </div>
      <div className="col-start-1 row-start-3 row-span-2 flex items-center justify-center border-r border-slate-700">
        <div className="w-[72%] border-[3px] border-[#52c95e] px-2 py-1 text-center text-lg font-bold text-[#27a84a]">UMUM</div>
      </div>
      <div className="col-start-2 row-span-2 flex flex-col items-center justify-center border-b border-r border-slate-700 p-2 text-center font-bold">
        <div className="text-sm">PT KERETA API INDONESIA (PERSERO)</div><div>SISTEM INFORMASI</div>
      </div>
      <div className="col-start-2 row-start-3 row-span-2 flex items-center justify-center border-r border-slate-700 font-bold">BUKU TAMU</div>
      {[[ 'Nomor', FORM_NUMBER ], [ 'Tanggal', FORM_DATE ], [ 'Versi', FORM_VERSION ], [ 'Halaman', '1 dari 1' ]].map(([label, value], index) => (
        <div key={label} className={`col-start-3 col-span-2 grid grid-cols-[30%_70%] border-b border-slate-500 ${index === 3 ? 'border-b-0' : ''}`} style={{ gridRow: index + 1 }}>
          <div className="flex items-center border-r border-slate-500 px-2">{label}</div><div className="flex items-center px-2">{value}</div>
        </div>
      ))}
    </div>
  )
}

function SignatureDetail({ id, which, label }) {
  const [failed, setFailed] = useState(false)
  return <div><p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><div className="flex h-32 items-center justify-center rounded-lg border border-slate-200 bg-white p-3">{failed ? <span className="text-sm text-slate-400">Tanda tangan belum tersedia</span> : <img src={api.getVisitorSignatureUrl(id, which)} alt={label} className="max-h-full max-w-full object-contain" onError={() => setFailed(true)} />}</div></div>
}

export default function LaporanBukuTamuPage({ user }) {
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [dq, setDq] = useState('')
  const [status, setStatus] = useState('')
  const [from, setFrom] = useState(getTodayDate())
  const [to, setTo] = useState(getTodayDate())
  const [loading, setLoading] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [error, setError] = useState('')
  const [detail, setDetail] = useState(null)
  const [showDefaultSignature, setShowDefaultSignature] = useState(false)

  const allowed = !user || ['admin', 'super_admin'].includes(user.role)

  useEffect(() => {
    const timer = setTimeout(() => { setDq(q); setPage(1) }, 350)
    return () => clearTimeout(timer)
  }, [q])

  const filterParams = useCallback(() => {
    const params = {}
    if (dq.trim()) params.q = dq.trim()
    if (from) params.from = from
    if (to) params.to = to
    if (status === 'inside') params.inside = 1
    if (status === 'pending') params.checkout_status = 'pending'
    if (status === 'confirmed') params.checkout_status = 'confirmed'
    if (status === 'auto') params.checkout_status = 'auto'
    return params
  }, [dq, from, to, status])

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const response = await api.getVisitors({ ...filterParams(), page, per_page: PER_PAGE })
      setRows(response.data || []); setMeta(response)
    } catch (err) {
      setError(err.message || 'Gagal memuat data buku tamu.'); setRows([]); setMeta(null)
    } finally { setLoading(false) }
  }, [page, filterParams])

  useEffect(() => { load() }, [load])

  if (!allowed) return <Navigate to="/" replace />

  const updateFilter = (setter) => (event) => { setter(event.target.value); setPage(1) }
  const resetFilters = () => {
    setQ('')
    setDq('')
    setStatus('')
    setFrom(getTodayDate())
    setTo(getTodayDate())
    setPage(1)
  }
  const handlePrint = async () => {
    setPrinting(true); setError('')
    const printWindow = window.open('', '_blank')
    if (!printWindow) { setError('Popup diblokir browser. Izinkan popup untuk SIPAKAI lalu coba lagi.'); setPrinting(false); return }
    printWindow.document.write('<!doctype html><title>Menyiapkan formulir…</title><p style="font-family:Arial;padding:24px">Menyiapkan formulir buku tamu…</p>')
    try {
      const params = filterParams()
      const first = await api.getVisitors({ ...params, page: 1, per_page: 100 })
      const all = [...(first.data || [])]
      const lastPage = Number(first.last_page || 1)
      for (let current = 2; current <= lastPage; current += 1) {
        const next = await api.getVisitors({ ...params, page: current, per_page: 100 })
        all.push(...(next.data || []))
      }
      const reference = await api.createVisitorReportReference(params)
      const noRef = reference.no_ref
      printWindow.document.open()
      printWindow.document.write(makePrintHtml(all, { reportDate: reference.report_date }, new URL(LOGO_URL, window.location.origin).href, noRef))
      printWindow.document.close()
    } catch (err) {
      printWindow.close()
      setError(err.message || 'Gagal menyiapkan formulir untuk dicetak.')
    } finally { setPrinting(false) }
  }

  const cell = 'border border-slate-700 px-2 py-3 align-middle text-center text-xs text-slate-700'
  const head = 'border border-slate-700 bg-[#c9c9c9] px-2 py-3 text-center text-[11px] font-bold uppercase leading-tight text-slate-900'

  return (
    <main className="mx-auto w-full max-w-[1700px] space-y-5 pb-8">
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.05)] transition-shadow duration-300 hover:shadow-[0_12px_36px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-orange-700">
              <FileText className="h-3.5 w-3.5" />
              SIPAKAI <span className="text-orange-300">/</span> Administrasi Kunjungan
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#10264b] sm:text-[28px]">Laporan Buku Tamu</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">Kelola data kunjungan dan cetak formulir buku tamu resmi KAI.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setShowDefaultSignature(true)}
              className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#10264b] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#10264b]/30 hover:bg-slate-50 hover:shadow-md active:translate-y-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100">
              <PenTool className="h-4 w-4 transition-transform duration-200 group-hover:rotate-[-12deg]" /> Pengaturan TTD Default
            </button>
            <button type="button" onClick={handlePrint} disabled={printing || loading}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#f15a24] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#df4e1c] hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-100">
              <Printer className="h-4 w-4" /> {printing ? 'Menyiapkan…' : 'Cetak / Simpan PDF'}
            </button>
          </div>
        </div>

        <div className="px-5 py-5 sm:px-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Filter data kunjungan</h2>
              <p className="mt-0.5 text-xs text-slate-500">Pilih kriteria untuk menyaring data pada pratinjau dan PDF.</p>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {meta?.total ?? 0} data ditemukan
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(240px,1.55fr)_minmax(180px,1fr)_minmax(160px,.85fr)_minmax(160px,.85fr)]">
            <label className="block min-w-0">
              <span className="mb-1.5 block text-xs font-semibold text-slate-600">Pencarian</span>
              <div className="group relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-700" />
                <input className={`${inputCls} w-full rounded-xl border-slate-200 py-2.5 pl-9 text-sm transition-all duration-200 hover:border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-50`}
                  placeholder="Nama, instansi, nomor visitor, personil…" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
            </label>
            <label className="block min-w-0">
              <span className="mb-1.5 block text-xs font-semibold text-slate-600">Status kunjungan</span>
              <select className={`${inputCls} w-full rounded-xl border-slate-200 py-2.5 text-sm transition-all duration-200 hover:border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-50`}
                value={status} onChange={updateFilter(setStatus)}>
                <option value="">Semua Status</option><option value="inside">Masih di Lokasi</option><option value="pending">Menunggu Checkout</option><option value="confirmed">Checkout Manual</option><option value="auto">Auto Checkout</option>
              </select>
            </label>
            <label className="block min-w-0">
              <span className="mb-1.5 block text-xs font-semibold text-slate-600">Dari tanggal</span>
              <input type="date" className={`${inputCls} w-full rounded-xl border-slate-200 py-2.5 text-sm transition-all duration-200 hover:border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-50`}
                value={from} max={to || undefined} onChange={updateFilter(setFrom)} />
            </label>
            <label className="block min-w-0">
              <span className="mb-1.5 block text-xs font-semibold text-slate-600">Sampai tanggal</span>
              <input type="date" className={`${inputCls} w-full rounded-xl border-slate-200 py-2.5 text-sm transition-all duration-200 hover:border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-50`}
                value={to} min={from || undefined} onChange={updateFilter(setTo)} />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <p className="inline-flex items-center gap-2 text-xs text-slate-500"><Filter className="h-3.5 w-3.5" /> Filter diterapkan ke pratinjau dan formulir PDF.</p>
            <button type="button" onClick={resetFilters}
              className="group inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-[#10264b] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100">
              <RotateCcw className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-rotate-45" /> Reset filter
            </button>
          </div>
        </div>
      </section>

      {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <section className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3"><div><h2 className="font-bold text-[#10264b]">Pratinjau Formulir Buku Tamu</h2><p className="text-xs text-slate-500">Susunan formulir mengikuti dokumen FR.SM/TI/014.001/10-2020.</p></div><span className="text-xs font-semibold text-slate-500">Business Area: {BUSINESS_AREA}</span></div>
        <div className="overflow-x-auto bg-slate-100 p-3 md:p-5">
          <div className="mx-auto min-w-[1050px] max-w-[1500px] border border-slate-700 bg-white p-4 shadow-sm md:p-6">
            <FormHeader />
            <table className="mt-4 w-[288px] table-fixed border-collapse text-[13px] text-slate-600">
              <colgroup><col style={{ width: '48%' }} /><col style={{ width: '52%' }} /></colgroup>
              <tbody>
                {[
                  ['No. Ref', 'Terbit saat PDF dibuat'],
                  ['Tanggal', fmtDate(new Date().toLocaleDateString('en-CA'))],
                  ['Business Area', BUSINESS_AREA],
                ].map(([label, value]) => (
                  <tr key={label}>
                    <td className="border border-r-0 border-[#888] px-2 py-1">
                      <div className="flex items-center justify-between gap-2">
                        <span>{label}</span>
                        <span>:</span>
                      </div>
                    </td>
                    <td className="border border-l-0 border-[#888] px-2 py-1">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[1050px] table-fixed border-collapse">
                <colgroup><col style={{width:'3.8%'}}/><col style={{width:'16.23%'}}/><col style={{width:'10.03%'}}/><col style={{width:'11.86%'}}/><col style={{width:'8.89%'}}/><col style={{width:'7.52%'}}/><col style={{width:'7.52%'}}/><col style={{width:'6.32%'}}/><col style={{width:'6.32%'}}/><col style={{width:'6.32%'}}/><col style={{width:'6.32%'}}/><col style={{width:'8.88%'}}/></colgroup>
                <thead><tr><th rowSpan={2} className={head}>NO</th><th rowSpan={2} className={head}>NAMA</th><th rowSpan={2} className={head}>INSTANSI</th><th rowSpan={2} className={head}>KEPERLUAN</th><th rowSpan={2} className={head}>PERSONIL<br/>YG DITUJU</th><th rowSpan={2} className={head}>NO HP</th><th rowSpan={2} className={head}>NO<br/>VISITOR</th><th colSpan={2} className={head}>MASUK</th><th colSpan={2} className={head}>KELUAR</th><th className={head}>PETUGAS/<br/>SATPAM</th></tr><tr><th className={head}>JAM</th><th className={head}>TTD</th><th className={head}>JAM</th><th className={head}>TTD</th><th className={head}>TTD</th></tr></thead>
                <tbody>
                  {loading && rows.length === 0 && <tr><td colSpan={12} className="border border-slate-700 px-4 py-10 text-center text-sm text-slate-500">Memuat data buku tamu…</td></tr>}
                  {!loading && rows.length === 0 && <tr><td colSpan={12} className="border border-slate-700 px-4 py-10 text-center text-sm text-slate-500">Belum ada data untuk filter yang dipilih.</td></tr>}
                  {rows.map((v, i) => <tr key={v.id}>
                    <td className={`${cell} font-bold`}><button type="button" onClick={() => setDetail(v)} className="underline decoration-dotted underline-offset-2 hover:text-orange-700" title="Lihat detail kunjungan">{(meta?.from ?? 1) + i}</button></td><td className={cell}>{v.name || '–'}</td><td className={cell}>{v.institution || '–'}</td><td className={cell}>{v.purpose || '–'}</td><td className={cell}>{v.host_name || '–'}</td><td className={cell}>{v.phone || '–'}</td><td className={cell}>{v.visitor_card_no || '–'}</td><td className={`${cell} font-semibold`}>{fmtTime(v.time_in)}</td><td className={cell}><Signature src={v.visitor_signature_url} alt="Tanda tangan masuk"/></td><td className={`${cell} font-semibold`}>{fmtTime(v.time_out)}</td><td className={cell}>{v.time_out ? <Signature src={v.visitor_signature_url} alt="Tanda tangan keluar"/> : <span className="text-[10px] text-slate-400">—</span>}</td><td className={cell}>{v.officer_signature_url ? <Signature src={v.officer_signature_url} alt="Tanda tangan petugas"/> : v.checkout_type === 'auto' ? <span className="text-[10px] font-semibold text-violet-700">Auto Checkout<br/>oleh Sistem</span> : <span className="text-[10px] text-slate-400">—</span>}</td>
                  </tr>)}
                </tbody>
              </table>
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-slate-500"><span>PT Kereta Api Indonesia (Persero) · Business Area {BUSINESS_AREA}</span><span>Pratinjau SIPAKAI</span></div>
          </div>
        </div>
        <div className="flex flex-col gap-2 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-slate-500">Menampilkan {rows.length} dari {meta?.total ?? 0} data pada halaman ini.</p><TablePagination meta={meta} label="Baris Buku Tamu" onPage={setPage}/></div>
      </section>

      {detail && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm md:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) setDetail(null) }}><section className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl"><header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4"><div><p className="text-xs font-bold uppercase tracking-wider text-orange-600">Detail Buku Tamu</p><h3 className="mt-1 text-xl font-extrabold text-[#10264b]">{detail.name || 'Tamu'}</h3><p className="mt-1 text-sm text-slate-500">No. Visitor: {detail.visitor_card_no || '–'}</p></div><button type="button" onClick={() => setDetail(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Tutup"><X className="h-5 w-5"/></button></header><div className="space-y-5 p-5"><div className="grid grid-cols-1 gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">{[['Nama Tamu',detail.name],['Instansi',detail.institution],['No. HP',detail.phone],['Tanggal',fmtDate(detail.visit_date)],['Keperluan',detail.purpose],['Personil Dituju',detail.host_name],['Jam Masuk',fmtTime(detail.time_in)],['Jam Keluar',fmtTime(detail.time_out)],['Status',detail.checkout_type === 'auto' ? 'Auto Checkout oleh Sistem' : detail.time_out ? 'Checkout Manual' : 'Belum Checkout']].map(([label,value]) => <div key={label}><p className="text-xs font-bold uppercase text-slate-400">{label}</p><p className="mt-1 text-sm font-semibold text-slate-800">{value || '–'}</p></div>)}</div><div className="grid grid-cols-1 gap-4 md:grid-cols-2"><SignatureDetail id={detail.id} which="visitor" label="Tanda Tangan Pengunjung / Masuk"/><SignatureDetail id={detail.id} which="officer" label="Tanda Tangan Petugas / Satpam"/></div>{detail.checkout_type === 'auto' && <p className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-800">Kunjungan ini ditutup otomatis oleh sistem.</p>}</div><footer className="flex justify-end border-t border-slate-100 px-5 py-4"><button type="button" onClick={() => setDetail(null)} className="rounded-lg bg-[#10264b] px-5 py-2.5 text-sm font-bold text-white">Tutup</button></footer></section></div>}
      <DefaultOfficerSignatureModal
        isOpen={showDefaultSignature}
        onClose={() => setShowDefaultSignature(false)}
        onSaved={() => setError('')}
      />
    </main>
  )
}
