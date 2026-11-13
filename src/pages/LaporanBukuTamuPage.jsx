import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { Search, X, Download, Users, CalendarDays, CalendarRange, DoorOpen, RefreshCw, Eye } from 'lucide-react'
import { api } from '../services/api'
import TablePagination, { Avatar } from '../components/TablePagination'
import { inputCls } from '../components/UserFormModal'

const PER_PAGE = 8

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '–'
const fmtTime = (t) => (t ? String(t).slice(0, 5) : '–')

function StatCard({ label, value, icon: Icon, tone }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className={`text-2xl font-black mt-1 ${tone}`}>{value ?? 0}</p>
      </div>
      <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500">
        <Icon className="w-5 h-5" />
      </div>
    </div>
  )
}

function SignatureImg({ id, which, label }) {
  const [failed, setFailed] = useState(false)
  return (
    <div>
      <p className="font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</p>
      <div className="h-28 border border-slate-200 rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden">
        {failed ? (
          <span className="text-slate-400">Tidak tersedia</span>
        ) : (
          <img
            src={api.getVisitorSignatureUrl(id, which)}
            alt={label}
            className="max-h-full max-w-full object-contain"
            onError={() => setFailed(true)}
          />
        )}
      </div>
    </div>
  )
}

export default function LaporanBukuTamuPage({ user }) {
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState(null)
  const [stats, setStats] = useState(null)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [dq, setDq] = useState('')
  const [status, setStatus] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    const t = setTimeout(() => { setDq(q); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [q])

  const filterParams = useCallback(() => {
    const p = {}
    if (dq) p.q = dq
    if (from) p.from = from
    if (to) p.to = to
    if (status === 'inside') p.inside = 1
    return p
  }, [dq, from, to, status])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const f = filterParams()
      const statParams = {}
      if (from) statParams.from = from
      if (to) statParams.to = to
      const [res, st] = await Promise.all([
        api.getVisitors({ ...f, page, per_page: PER_PAGE }),
        api.getVisitorStats(statParams).catch(() => null),
      ])
      setRows(res.data || [])
      setMeta(res)
      if (st) setStats(st)
    } catch (err) {
      setError(err.message || 'Gagal memuat laporan buku tamu')
    } finally {
      setLoading(false)
    }
  }, [page, filterParams, from, to])

  useEffect(() => {
    load()
  }, [load])

  if (user && user.role !== 'super_admin') return <Navigate to="/" replace />

  const onFilter = (fn) => (e) => { fn(e.target.value); setPage(1) }

  const handleExport = async () => {
    setExporting(true)
    setError('')
    try {
      await api.exportVisitors(filterParams())
    } catch (err) {
      setError(err.message)
    } finally {
      setExporting(false)
    }
  }

  const th = 'px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-center'

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0b2046] tracking-tight">Laporan Buku Tamu</h1>
          <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed max-w-2xl">
            Rekapitulasi kunjungan tamu yang tercatat pada Buku Tamu Digital, lengkap dengan identitas tamu, keperluan,
            pihak yang dituju, serta jam masuk dan keluar di lingkungan PT Kereta Api Indonesia (Persero).
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={load}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Segarkan
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#ff5a00] hover:bg-[#e65100] rounded-lg disabled:opacity-60"
          >
            <Download className="w-3.5 h-3.5" /> {exporting ? 'Mengekspor…' : 'Ekspor CSV'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Kunjungan" value={stats?.total} icon={Users} tone="text-[#0b2046]" />
        <StatCard label="Hari Ini" value={stats?.today} icon={CalendarDays} tone="text-blue-700" />
        <StatCard label="Bulan Ini" value={stats?.this_month} icon={CalendarRange} tone="text-emerald-700" />
        <StatCard label="Masih di Dalam" value={stats?.inside} icon={DoorOpen} tone="text-amber-700" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            className={`${inputCls} pl-9 w-72`}
            placeholder="Cari nama, instansi, no. kartu, yang dituju…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select className={`${inputCls} w-44`} value={status} onChange={onFilter(setStatus)}>
          <option value="">Semua Status</option>
          <option value="inside">Masih di Dalam</option>
        </select>
        <input type="date" className={`${inputCls} w-40`} value={from} onChange={onFilter(setFrom)} />
        <span className="text-xs text-slate-400">s/d</span>
        <input type="date" className={`${inputCls} w-40`} value={to} onChange={onFilter(setTo)} />
      </div>

      {error && <div className="p-2.5 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">{error}</div>}

      <div className="bg-[#eef3fb] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className={`${th} w-12`}>No</th>
                <th className={`${th} text-left pl-4`}>Tanggal & No. Kartu</th>
                <th className={`${th} text-left`}>Nama Tamu</th>
                <th className={th}>Instansi</th>
                <th className={`${th} text-left`}>Keperluan</th>
                <th className={th}>Yang Dituju</th>
                <th className={th}>Masuk</th>
                <th className={th}>Keluar</th>
                <th className={th}>Status</th>
                <th className={th}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 && (
                <tr><td colSpan={10} className="bg-white py-16 text-center text-slate-400">Memuat laporan buku tamu…</td></tr>
              )}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={10} className="bg-white py-16 text-center text-slate-400">Belum ada data kunjungan tamu.</td></tr>
              )}
              {rows.map((v, i) => (
                <tr key={v.id} className="bg-white h-[76px] border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="text-center text-slate-400 font-medium">{(meta?.from ?? 1) + i}</td>
                  <td className="pl-4 pr-3 py-3">
                    <p className="font-bold text-slate-800 text-[12px]">{fmtDate(v.visit_date)}</p>
                    <span className="inline-block mt-1 px-1.5 py-0.5 text-[9px] font-bold bg-[#d6e4fb] text-[#0b2046] rounded">
                      {v.visitor_card_no}
                    </span>
                  </td>
                  <td className="px-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={v.name} id={v.id} />
                      <div>
                        <p className="font-bold text-slate-800 text-[11px] leading-tight">{v.name}</p>
                        <p className="text-[10px] text-slate-400">{v.phone || '–'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-center px-3 text-slate-700 font-medium text-[11px]">{v.institution || '–'}</td>
                  <td className="px-3 text-slate-700 text-[11px] max-w-[180px]">{v.purpose}</td>
                  <td className="text-center px-3 font-semibold text-slate-800 text-[11px]">{v.host_name}</td>
                  <td className="text-center font-bold text-slate-800">{fmtTime(v.time_in)}</td>
                  <td className="text-center font-bold text-slate-800">{fmtTime(v.time_out)}</td>
                  <td className="text-center px-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold border rounded-full ${
                        v.time_out
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${v.time_out ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {v.time_out ? 'Sudah Keluar' : 'Di Dalam'}
                    </span>
                  </td>
                  <td className="text-center pr-3">
                    <button
                      type="button"
                      title="Lihat detail kunjungan"
                      onClick={() => setDetail(v)}
                      className="w-[28px] h-[28px] inline-flex items-center justify-center bg-[#ff5a00] hover:bg-[#e65100] text-white rounded-md"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePagination meta={meta} label="Kunjungan Tamu" onPage={setPage} />
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-[#0b2046]">Detail Kunjungan Tamu</h3>
                <p className="text-[11px] text-slate-400">{detail.visitor_card_no}</p>
              </div>
              <button type="button" onClick={() => setDetail(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                {[
                  ['Nama Tamu', detail.name],
                  ['Instansi', detail.institution || '–'],
                  ['Telepon', detail.phone || '–'],
                  ['Tanggal Kunjungan', fmtDate(detail.visit_date)],
                  ['Keperluan', detail.purpose],
                  ['Yang Dituju', detail.host_name],
                  ['Jam Masuk', fmtTime(detail.time_in)],
                  ['Jam Keluar', detail.time_out ? fmtTime(detail.time_out) : 'Belum keluar'],
                ].map(([k, val]) => (
                  <div key={k}>
                    <p className="text-slate-400 font-medium">{k}</p>
                    <p className="font-bold text-slate-800">{val}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <SignatureImg id={detail.id} which="visitor" label="Tanda Tangan Tamu" />
                <SignatureImg id={detail.id} which="officer" label="Tanda Tangan Petugas" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

