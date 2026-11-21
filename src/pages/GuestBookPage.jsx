import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, CalendarDays, CheckCircle2, Clock3, Eraser, LoaderCircle,
  LockKeyhole, RefreshCw, Save, Search, ShieldCheck, ClipboardList,
  LogOut, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { api, getToken } from '../services/api'
import Header from '../components/Header'
import MasterImportActions from '../components/MasterImportActions'

const today = () => {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}
const emptyDraft = () => ({
  visit_date: today(), name: '', institution: '', purpose: '', host_name: '', phone: '',
})
const formatDate = (value) => {
  if (!value) return '—'
  const d = new Date(`${String(value).slice(0, 10)}T00:00:00`)
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
}
const formatTime = (value) => value ? String(value).slice(0, 5) : '—'
const maskPhone = (value) => {
  if (!value) return '—'
  const phone = String(value).replace(/\s/g, '')
  if (phone.length <= 7) return `${phone.slice(0, 2)}XXXXX`
  return `${phone.slice(0, 3)}XXXXX${phone.slice(-2)}`
}
const errorText = (error) => {
  const errors = error?.errors
  return errors ? Object.values(errors).flat().join(' ') : error?.message || 'Terjadi kesalahan. Silakan coba lagi.'
}
const getList = (result) => {
  const payload = result?.data && !Array.isArray(result.data) && result.data.data ? result.data : result
  return {
    rows: Array.isArray(payload?.data) ? payload.data : Array.isArray(payload?.visitors) ? payload.visitors : Array.isArray(payload) ? payload : [],
    total: Number(payload?.total ?? 0),
    lastPage: Math.max(1, Number(payload?.last_page ?? 1)),
  }
}

export default function GuestBookPage({ onBackToLogin }) {
  const navigate = useNavigate()
  const [draft, setDraft] = useState(emptyDraft)
  const [signature, setSignature] = useState('')
  const [signatureKey, setSignatureKey] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [receipt, setReceipt] = useState(null)

  const [isOfficer, setIsOfficer] = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [rows, setRows] = useState([])
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [historyDate, setHistoryDate] = useState(today())
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [loadingRows, setLoadingRows] = useState(false)
  const [rowsError, setRowsError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [checkingOut, setCheckingOut] = useState(null)
  const [checkoutMessage, setCheckoutMessage] = useState('')

  useEffect(() => {
    let active = true
    const check = async () => {
      if (!getToken()) { setIsOfficer(false); setCheckingAccess(false); return }
      try {
        const result = await api.getMe()
        const user = result?.user ?? result?.data?.user ?? result?.data ?? result
        const role = String(user?.role?.name ?? user?.role ?? '').toLowerCase()
        if (active) setIsOfficer(['admin', 'super_admin'].includes(role))
      } catch { if (active) setIsOfficer(false) }
      finally { if (active) setCheckingAccess(false) }
    }
    check()
    return () => { active = false }
  }, [])

  const loadRows = useCallback(async (signal) => {
    setLoadingRows(true)
    setRowsError('')
    try {
      // Endpoint publik hanya mengirim data aman untuk daftar hari ini.
      // Riwayat tanggal lain hanya diambil untuk admin.
      const result = isOfficer
        ? await api.getVisitors({ page, per_page: 10, from: historyDate, to: historyDate, ...(search ? { q: search } : {}) })
        : await api.getPublicDailyVisitors()
      if (signal?.cancelled) return
      const parsed = getList(result)
      setRows(parsed.rows)
      setTotal(parsed.total || parsed.rows.length)
      setLastPage(parsed.lastPage)
    } catch (err) {
      if (signal?.cancelled) return
      setRows([])
      setRowsError(errorText(err))
    } finally {
      if (!signal?.cancelled) setLoadingRows(false)
    }
  }, [isOfficer, page, historyDate, search])

  useEffect(() => {
    const signal = { cancelled: false }
    loadRows(signal)
    return () => { signal.cancelled = true }
  }, [loadRows, refreshKey])

  const resetDraft = () => {
    setDraft(emptyDraft())
    setSignature('')
    setSignatureKey((v) => v + 1)
    setError('')
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setReceipt(null)
    if (!signature) { setError('Mohon isi tanda tangan pengunjung terlebih dahulu.'); return }
    setSaving(true)
    try {
      const response = await api.createVisitor({ ...draft, time_in: undefined, visitor_signature: signature })
      const visitor = response?.visitor ?? response?.data?.visitor ?? response?.data ?? response
      const id = visitor?.id
      const card = visitor?.visitor_card_no ?? response?.visitor_card_no ?? '—'
      const token = response?.checkout_token ?? visitor?.checkout_token
      if (id && token) localStorage.setItem(`sipakai_checkout_${id}`, token)
      setReceipt({ card, name: draft.name, date: draft.visit_date, time: visitor?.time_in })
      setNotice('Data kunjungan berhasil disimpan.')
      resetDraft()
      setRefreshKey((v) => v + 1)
    } catch (err) { setError(errorText(err)) }
    finally { setSaving(false) }
  }

  const handleCheckout = async (row) => {
    const token = localStorage.getItem(`sipakai_checkout_${row.id}`)
    if (!token) {
      setCheckoutMessage('Checkout hanya dapat dilakukan dari perangkat/browser yang digunakan saat check-in. Nomor visitor saja tidak cukup untuk checkout.')
      return
    }
    setCheckingOut(row.id)
    setCheckoutMessage('')
    try {
      await api.checkoutVisitor(row.id, token)
      localStorage.removeItem(`sipakai_checkout_${row.id}`)
      setCheckoutMessage(`Checkout ${row.name} berhasil dicatat.`)
      setRefreshKey((v) => v + 1)
    } catch (err) { setCheckoutMessage(errorText(err)) }
    finally { setCheckingOut(null) }
  }

  return (
    <div className="min-h-screen bg-[#eef2f6] font-sans text-slate-800">
      <Header />
      <main className="mx-auto max-w-[1680px] px-3 py-5 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={onBackToLogin || (() => navigate('/'))} className="inline-flex items-center gap-2 border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            <ArrowLeft size={15} /> Kembali
          </button>
          <div className="text-xs font-semibold text-slate-500"><ShieldCheck size={14} className="mr-1 inline text-emerald-600" /> SIPAKAI · Buku Tamu Digital</div>
        </div>

        <section className="border border-slate-500 bg-white p-3 shadow-sm sm:p-5">
          <div className="grid border border-slate-500 md:grid-cols-[190px_1fr_310px]">
            <div className="flex flex-col items-center justify-center gap-1 border-b border-slate-500 p-3 md:border-b-0 md:border-r">
              <div className="text-5xl font-black italic tracking-[-.1em] text-[#777aa8]">KAI</div>
              <div className="border-2 border-emerald-300 px-7 py-1 text-lg font-medium text-emerald-500">UMUM</div>
            </div>
            <div className="flex flex-col items-center justify-center border-b border-slate-500 p-4 text-center md:border-b-0 md:border-r">
              <div className="text-xs font-bold uppercase text-slate-600">PT Kereta Api Indonesia (Persero)</div>
              <div className="text-xs font-bold uppercase text-slate-600">Sistem Informasi</div>
              <h1 className="mt-4 text-base font-extrabold tracking-wide text-slate-700">BUKU TAMU</h1>
            </div>
            <div className="grid grid-cols-[90px_1fr] text-xs">
              {[
                ['Nomor', 'FR.SM/TI/014.001/10-2020'],
                ['Tanggal', formatDate(today())],
                ['Versi', '003-2020'],
                ['Halaman', '1 dari 1'],
              ].map(([a, b]) => <div key={a} className="contents">
                <div className="border-b border-r border-slate-300 px-2 py-2 text-slate-600">{a}</div>
                <div className="border-b border-slate-300 px-2 py-2 text-slate-700">{b}</div>
              </div>)}
            </div>
          </div>

          <div className="my-4 grid max-w-[460px] grid-cols-[130px_1fr] border border-slate-400 text-xs">
            <div className="border-b border-r border-slate-300 px-2 py-1.5">No. Ref</div><div className="border-b border-slate-300 px-2 py-1.5">: Otomatis</div>
            <div className="border-b border-r border-slate-300 px-2 py-1.5">Tanggal</div><div className="border-b border-slate-300 px-2 py-1.5">: {formatDate(today())}</div>
            <div className="border-r border-slate-300 px-2 py-1.5">Business Area</div><div className="px-2 py-1.5">: Umum</div>
          </div>

          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-700">FORM INPUT DATA PENGUNJUNG</h2>
            <span className="text-[11px] text-slate-500">Kolom bertanda * wajib diisi</span>
          </div>
          {error && <div role="alert" className="mb-3 border border-red-300 bg-red-50 p-3 text-xs text-red-700">{error}</div>}
          {notice && <div role="status" className="mb-3 border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-800"><CheckCircle2 className="mr-1 inline" size={15} />{notice}</div>}
          {receipt && <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border border-blue-300 bg-blue-50 p-3 text-xs">
            <div><b>Nomor visitor:</b> <strong className="text-base text-blue-900">{receipt.card}</strong> · {receipt.name} · {formatDate(receipt.date)} {formatTime(receipt.time)}</div>
            <button type="button" onClick={() => navigator.clipboard?.writeText(receipt.card)} className="border border-blue-300 bg-white px-3 py-2 font-bold text-blue-800">Salin nomor</button>
          </div>}

          <form onSubmit={handleSave}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] border-collapse text-center text-[11px]">
                <thead>
                  <tr className="bg-[#d2d2d2] text-black">
                    {['NO', 'NAMA', 'INSTANSI', 'KEPERLUAN', 'PERSONIL YG DITUJU', 'NO HP', 'NO VISITOR', 'MASUK · JAM', 'MASUK · TTD'].map((label) =>
                      <th key={label} className="border border-slate-700 px-2 py-2 font-bold">{label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr className="align-top">
                    <td className="border border-slate-700 p-2 font-bold">+</td>
                    <td className="border border-slate-700 p-1"><input required maxLength={150} value={draft.name} onChange={e => setDraft(p => ({ ...p, name: e.target.value }))} placeholder="Nama lengkap" className={inputClass} /></td>
                    <td className="border border-slate-700 p-1"><input maxLength={200} value={draft.institution} onChange={e => setDraft(p => ({ ...p, institution: e.target.value }))} placeholder="Asal instansi" className={inputClass} /></td>
                    <td className="border border-slate-700 p-1"><textarea required maxLength={500} rows={3} value={draft.purpose} onChange={e => setDraft(p => ({ ...p, purpose: e.target.value }))} placeholder="Keperluan / alasan berkunjung" className={inputClass} /></td>
                    <td className="border border-slate-700 p-1"><input required maxLength={150} value={draft.host_name} onChange={e => setDraft(p => ({ ...p, host_name: e.target.value }))} placeholder="Nama personil KAI" className={inputClass} /></td>
                    <td className="border border-slate-700 p-1"><input type="tel" maxLength={30} value={draft.phone} onChange={e => setDraft(p => ({ ...p, phone: e.target.value }))} placeholder="Nomor HP" className={inputClass} /></td>
                    <td className="border border-slate-700 p-2 text-slate-500">Dibuat otomatis</td>
                    <td className="border border-slate-700 p-2 text-slate-500">Otomatis saat simpan</td>
                    <td className="min-w-[180px] border border-slate-700 p-2"><SignaturePad key={signatureKey} onChange={setSignature} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] text-slate-500">Tanda tangan yang diminta hanya tanda tangan pengunjung. TTD petugas/satpam tidak diinput di formulir ini.</p>
              <div className="flex gap-2">
                <button type="button" onClick={resetDraft} disabled={saving} className="inline-flex items-center gap-2 border border-slate-400 bg-white px-4 py-2.5 text-xs font-bold hover:bg-slate-50"><Eraser size={15} /> Bersihkan</button>
                <button type="submit" disabled={saving} className="inline-flex items-center gap-2 border border-[#17345d] bg-[#17345d] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#244b7c] disabled:opacity-50">{saving ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />}{saving ? 'Menyimpan...' : 'Simpan Data'}</button>
              </div>
            </div>
          </form>
        </section>

        <section className="mt-5 border border-slate-400 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-400 bg-[#e5e5e5] px-4 py-3">
            <div><h2 className="flex items-center gap-2 text-sm font-bold text-slate-800"><ClipboardList size={17} /> {isOfficer ? 'DAFTAR KUNJUNGAN / RIWAYAT' : 'DAFTAR TAMU HARI INI'}</h2>
              <p className="mt-1 text-[11px] text-slate-600">{isOfficer ? 'Admin dapat memilih tanggal untuk melihat riwayat.' : `Daftar kunjungan tanggal ${formatDate(today())}.`}</p></div>
            <div className="flex flex-wrap items-center gap-2">
              {isOfficer && <label className="flex items-center gap-2 border border-slate-400 bg-white px-2 py-2 text-xs"><CalendarDays size={14} /><input type="date" value={historyDate} onChange={e => { setHistoryDate(e.target.value); setPage(1) }} /></label>}
              {isOfficer && <form onSubmit={e => { e.preventDefault(); setSearch(searchInput.trim()); setPage(1) }} className="flex border border-slate-400 bg-white">
                <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Cari nama / visitor" className="w-36 px-2 py-2 text-xs outline-none" />
                <button className="border-l border-slate-300 px-2" aria-label="Cari"><Search size={14} /></button>
              </form>}
              <button type="button" onClick={() => setRefreshKey(v => v + 1)} disabled={loadingRows} className="border border-slate-400 bg-white p-2 hover:bg-slate-50" title="Muat ulang"><RefreshCw size={15} className={loadingRows ? 'animate-spin' : ''} /></button>
            </div>
          </div>
          {checkoutMessage && <div role="status" className="border-b border-blue-200 bg-blue-50 px-4 py-2 text-xs text-blue-800">{checkoutMessage}</div>}
          {rowsError && <div role="alert" className="m-3 border border-red-300 bg-red-50 p-3 text-xs text-red-700">{rowsError}</div>}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] border-collapse text-left text-xs">
              <thead className="bg-[#d2d2d2] text-center text-[10px] font-bold text-black">
                <tr>{['NO', 'NAMA', 'INSTANSI', 'KEPERLUAN', 'PERSONIL DITUJU', 'NO HP', 'NO VISITOR', 'JAM MASUK', 'JAM KELUAR', 'AKSI'].map(x => <th key={x} className="border border-slate-500 px-2 py-2">{x}</th>)}</tr>
              </thead>
              <tbody>
                {loadingRows ? <tr><td colSpan={10} className="border border-slate-400 p-8 text-center"><LoaderCircle className="mx-auto animate-spin" size={18} />Memuat data...</td></tr>
                : rows.length === 0 ? <tr><td colSpan={10} className="border border-slate-400 p-8 text-center text-slate-500">Belum ada tamu yang mengisi pada tanggal ini.</td></tr>
                : rows.map((row, i) => {
                  const ownToken = typeof window !== 'undefined' && localStorage.getItem(`sipakai_checkout_${row.id}`)
                  const isCheckedOut = Boolean(row.time_out)
                  return <tr key={row.id} className="align-top hover:bg-slate-50">
                    <td className="border border-slate-400 p-2 text-center font-bold">{(page - 1) * 10 + i + 1}</td>
                    <td className="border border-slate-400 p-2 font-semibold">{row.name}</td>
                    <td className="border border-slate-400 p-2">{row.institution || '—'}</td>
                    <td className="border border-slate-400 p-2">{row.purpose}</td>
                    <td className="border border-slate-400 p-2">{row.host_name}</td>
                    <td className="border border-slate-400 p-2 text-center">{maskPhone(row.phone)}</td>
                    <td className="border border-slate-400 p-2 text-center">{row.visitor_card_no || '—'}</td>
                    <td className="border border-slate-400 p-2 text-center">{formatTime(row.time_in)}</td>
                    <td className="border border-slate-400 p-2 text-center">{formatTime(row.time_out)}</td>
                    <td className="border border-slate-400 p-2 text-center">
                      {isCheckedOut ? <span className="font-bold text-emerald-700">Selesai</span>
                        : ownToken ? <button type="button" disabled={checkingOut === row.id} onClick={() => handleCheckout(row)} className="inline-flex items-center gap-1 border border-emerald-700 bg-emerald-600 px-2 py-1.5 font-bold text-white disabled:opacity-50">{checkingOut === row.id ? <LoaderCircle size={12} className="animate-spin" /> : <LogOut size={12} />} Checkout</button>
                        : <span className="text-amber-700">Di lokasi</span>}
                    </td>
                  </tr>
                })}
              </tbody>
            </table>
          </div>
          {isOfficer && <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-400 px-4 py-3 text-xs text-slate-600">
            <span>{total} data · Halaman {page} dari {lastPage}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1 || loadingRows} onClick={() => setPage(p => p - 1)} className="inline-flex items-center gap-1 border border-slate-400 px-3 py-2 disabled:opacity-40"><ChevronLeft size={14} /> Sebelumnya</button>
              <button disabled={page >= lastPage || loadingRows} onClick={() => setPage(p => p + 1)} className="inline-flex items-center gap-1 border border-slate-400 px-3 py-2 disabled:opacity-40">Berikutnya <ChevronRight size={14} /></button>
            </div>
          </div>}
        </section>
        {checkingAccess && <p className="mt-3 text-center text-xs text-slate-500"><LoaderCircle size={13} className="mr-1 inline animate-spin" /> Memeriksa akses admin...</p>}
        <footer className="py-5 text-center text-[10px] text-slate-500">© {new Date().getFullYear()} PT Kereta Api Indonesia (Persero) · SIPAKAI</footer>
      </main>
    </div>
  )
}

function SignaturePad({ onChange }) {
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const last = useRef(null)
  const getPoint = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: (e.clientX - rect.left) * e.currentTarget.width / rect.width, y: (e.clientY - rect.top) * e.currentTarget.height / rect.height }
  }
  const start = (e) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture?.(e.pointerId)
    const p = getPoint(e), ctx = e.currentTarget.getContext('2d')
    ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2); ctx.fillStyle = '#172f55'; ctx.fill()
    last.current = p; drawing.current = true
  }
  const move = (e) => {
    if (!drawing.current || !last.current) return
    e.preventDefault()
    const p = getPoint(e), ctx = e.currentTarget.getContext('2d')
    ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y); ctx.lineTo(p.x, p.y)
    ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#172f55'; ctx.stroke()
    last.current = p
  }
  const stop = (e) => {
    if (!drawing.current) return
    drawing.current = false; last.current = null
    onChange(e.currentTarget.toDataURL('image/png'))
  }
  const clear = () => {
    const c = canvasRef.current
    if (c) c.getContext('2d').clearRect(0, 0, c.width, c.height)
    onChange('')
  }
  return <div className="min-w-[160px]">
    <canvas ref={canvasRef} width={500} height={180} onPointerDown={start} onPointerMove={move} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop} className="h-[78px] w-full touch-none border border-dashed border-slate-400 bg-white" aria-label="Tanda tangan pengunjung" />
    <button type="button" onClick={clear} className="mt-1 text-[10px] font-semibold text-red-700 underline">Hapus TTD</button>
  </div>
}

const inputClass = 'w-full min-w-[110px] border border-slate-300 bg-white p-2 text-[11px] outline-none focus:border-blue-700'
