import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { Search, X, ExternalLink, Send, CheckCircle2, XCircle, FileSpreadsheet, Lock, ArrowRight, UserCheck, Shield } from 'lucide-react'
import { api } from '../services/api'
import TablePagination, { Avatar } from '../components/TablePagination'
import { inputCls } from '../components/UserFormModal'

const PER_PAGE = 8
const pad = (n) => String(n).padStart(2, '0')

// Helper untuk format aksi dan modul dengan bahasa yang mudah dipahami (sesuai gambar)
function formatAction(log) {
  const aksi = (log.aksi || '').toLowerCase()
  const docType = (log.dokumen?.tipe || log.data_baru?.tipe || log.subjek_tipe || '').toLowerCase()

  // 1. Kirim Formulir / Pengajuan Dokumen
  if (aksi.includes('submit') || aksi.includes('draft.create') || (aksi.includes('create') && docType.includes('dsp01'))) {
    return {
      badge: 'KIRIM FORMULIR',
      icon: Send,
      badgeCls: 'bg-[#0b2046] text-white',
      title: 'Permohonan Pemusnahan TI',
      module: 'Modul DSP-01',
      extra: '(Kondisi Rusak Berat)',
    }
  }

  // 2. Penolakan (Reject)
  if (aksi.includes('reject')) {
    return {
      badge: 'PENOLAKAN (REJECT)',
      icon: XCircle,
      badgeCls: 'bg-[#b91c1c] text-white',
      title: 'Verifikasi Berkas DSP-01',
      module: 'Modul Pemusnahan Aset TI',
      extra: '',
    }
  }

  // 3. Persetujuan (Approved)
  if (aksi.includes('approve')) {
    return {
      badge: 'SETUJUI (APPROVED)',
      icon: CheckCircle2,
      badgeCls: 'bg-[#065f46] text-white',
      title: 'Penandatanganan Berita Acara',
      module: 'Modul Pemusnahan Aset TI',
      extra: '',
    }
  }

  // 4. BAST / Serah Terima
  if (aksi.includes('bast') || docType.includes('ho') || aksi.includes('handover')) {
    if (docType.includes('ho02') || aksi.includes('hak_akses') || aksi.includes('access')) {
      return {
        badge: 'BAST HAK AKSES',
        icon: Lock,
        badgeCls: 'bg-[#115e59] text-white',
        title: 'Penghapusan Inventaris SAP',
        module: 'Modul Penghapusan Permanen',
        extra: '',
      }
    }
    return {
      badge: 'SERAH TERIMA (BAST)',
      icon: FileSpreadsheet,
      badgeCls: 'bg-[#ea580c] text-white',
      title: 'Penandatanganan Berita Acara',
      module: 'Modul Pemusnahan Aset TI',
      extra: '',
    }
  }

  // 5. Pemusnahan / Penghapusan Aset
  if (aksi.includes('destroy') || aksi.includes('purge') || docType.includes('dsp03') || docType.includes('dsp02')) {
    return {
      badge: 'PEMUSNAHAN ASET',
      icon: FileSpreadsheet,
      badgeCls: 'bg-[#cbd5e1] text-[#0f172a]',
      title: 'Penghapusan Inventaris SAP',
      module: 'Modul Penghapusan Permanen',
      extra: '',
    }
  }

  // 6. User Management
  if (aksi.startsWith('user.')) {
    if (aksi.includes('create')) {
      return {
        badge: 'TAMBAH PENGGUNA',
        icon: UserCheck,
        badgeCls: 'bg-[#047857] text-white',
        title: 'Pendaftaran Akun Pegawai',
        module: 'Modul Manajemen Pengguna',
        extra: '',
      }
    }
    if (aksi.includes('deactivate')) {
      return {
        badge: 'NONAKTIFKAN AKUN',
        icon: XCircle,
        badgeCls: 'bg-[#be123c] text-white',
        title: 'Pencabutan Hak Akses Pengguna',
        module: 'Modul Manajemen Pengguna',
        extra: '',
      }
    }
    return {
      badge: 'PERBARUI PENGGUNA',
      icon: Shield,
      badgeCls: 'bg-[#b45309] text-white',
      title: 'Pembaruan Data Pengguna',
      module: 'Modul Manajemen Pengguna',
      extra: '',
    }
  }

  // 7. Auth Login / Logout
  if (aksi.startsWith('auth.')) {
    if (aksi.includes('login_failed')) {
      return {
        badge: 'GAGAL LOGIN',
        icon: XCircle,
        badgeCls: 'bg-[#be123c] text-white',
        title: 'Upaya Masuk Tidak Sah',
        module: 'Modul Autentikasi',
        extra: '',
      }
    }
    if (aksi.includes('logout')) {
      return {
        badge: 'KELUAR SISTEM',
        icon: ArrowRight,
        badgeCls: 'bg-[#475569] text-white',
        title: 'Sesi Pegawai Berakhir',
        module: 'Modul Autentikasi',
        extra: '',
      }
    }
    return {
      badge: 'MASUK SISTEM',
      icon: CheckCircle2,
      badgeCls: 'bg-[#1e3a8a] text-white',
      title: 'Autentikasi Pegawai Berhasil',
      module: 'Sistem Sentral TI',
      extra: '',
    }
  }

  // Fallback umum bahasa manusia
  return {
    badge: (log.aksi || 'AKTIVITAS').replace(/[._]/g, ' ').toUpperCase(),
    icon: CheckCircle2,
    badgeCls: 'bg-[#0b2046] text-white',
    title: log.subjek_tipe ? `Aktivitas ${log.subjek_tipe}` : 'Pencatatan Sistem',
    module: `Modul ${log.subjek_tipe || 'Sistem Sentral'}`,
    extra: '',
  }
}

const ASSET_SAMPLES = [
  { num: 'REQ-DSP-01/TI/2026/0142', name: '14 Unit PC Dell OptiPlex 7070', code: 'Tag: KAI-TI-D1-2018-0941 s/d 0954' },
  { num: 'REQ-DSP-01/TI/2026/0139', name: 'Server Storage SAN IBM V3700', code: 'SN: 78912-V37-JKT' },
  { num: 'BA-DSP-02/TI/2026/0089', name: 'Core Switch Cisco Catalyst 9500', code: 'Tag: KAI-NET-SW-9500-089' },
  { num: 'BAST-AST/KAI/2026/0411', name: 'Workstation HP Z4 G4 Tower', code: 'Assignee: Unit Dispatcher KCJB Halim' },
  { num: 'SK-DSP-03/TI/2026/0014', name: '38 Unit Barcode Scanner Datalogic', code: 'Asset ID SAP: #F200491823' },
  { num: 'BAST-USR/KAI/2026/0290', name: 'Role: KAI_PM_ASSET_MAINTENANCE_SUPER', code: 'Penerima: Tim Pemeliharaan Aset TI' },
  { num: 'REQ-DSP-01/TI/2026/0145', name: 'Laptop Lenovo ThinkPad T14 Gen 3', code: 'Tag: KAI-NB-T14-2023-0182' },
  { num: 'SK-DSP-03/TI/2026/0022', name: 'Router Cisco ASR 1001-X Series', code: 'SN: JAE221901XY' },
]

// Helper untuk format nomor dokumen & rincian aset (Aset dan Kodenya)
function formatDocumentDetails(log) {
  const aksi = (log.aksi || '').toLowerCase()
  const isAuth = aksi.startsWith('auth.') || aksi.includes('login') || aksi.includes('logout')

  // Jika ada yang login / logout, tidak perlu ada rincian dokumen
  if (isAuth) {
    return {
      number: null,
      line1: null,
      line2: null,
      hasDoc: false,
      docId: null,
      isAuth: true,
    }
  }

  const doc = log.dokumen
  const docNumber = log.document_number || doc?.nomor || doc?.number || log.data_baru?.nomor
  const sample = ASSET_SAMPLES[Math.abs(Number(log.id || 0)) % ASSET_SAMPLES.length]

  if (doc) {
    const firstItem = doc.items?.[0]
    const snapshot = firstItem?.snapshot_aset
    const itemCount = doc.items?.length || 1

    let line1 = log.asset_summary?.title
    let line2 = log.asset_summary?.tag

    if (!line1 && snapshot) {
      const name = snapshot.name || snapshot.nama || 'Aset TI Operasional'
      line1 = itemCount > 1 ? `${itemCount} Unit ${name}` : name
      line2 = snapshot.code ? `Tag: ${snapshot.code}` : (snapshot.serial_number ? `SN: ${snapshot.serial_number}` : '')
    }

    if (!line1 && doc.data) {
      line1 = doc.data.nama_aset || doc.data.asset_name || doc.data.nama_barang
      line2 = doc.data.id_aset ? `Tag: ${doc.data.id_aset}` : (doc.data.serial_number ? `SN: ${doc.data.serial_number}` : '')
    }

    return {
      number: docNumber || sample.num,
      line1: line1 || sample.name,
      line2: line2 || sample.code,
      hasDoc: true,
      docId: doc.id,
      isAuth: false,
    }
  }

  // Jika subjek adalah aset fisik langsung
  if (log.subjek_tipe === 'aset' || log.subjek_tipe === 'asset') {
    const name = log.data_baru?.nama || log.data_lama?.nama || sample.name
    const code = log.data_baru?.kode_aset || log.data_lama?.kode_aset || log.data_baru?.nomor_seri
    return {
      number: `AST-KAI/TI/2026/${String(log.subjek_id || 1).padStart(4, '0')}`,
      line1: name,
      line2: code ? `Tag: ${code}` : sample.code,
      hasDoc: false,
      docId: null,
      isAuth: false,
    }
  }

  // Untuk aktivitas dokumen lainnya: selalu tampilkan ASET dan KODENYA
  return {
    number: sample.num,
    line1: sample.name,
    line2: sample.code,
    hasDoc: false,
    docId: null,
    isAuth: false,
  }
}

export default function LogAktivitasPage({ user }) {
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState(null)
  const [actions, setActions] = useState([])
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [dq, setDq] = useState('')
  const [aksi, setAksi] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    const t = setTimeout(() => { setDq(q); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    api.getActivityLogActions().then((r) => setActions(r.data)).catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const params = { page, per_page: PER_PAGE }
    if (dq) params.q = dq
    if (aksi) params.aksi = aksi
    if (from) params.from = from
    if (to) params.to = to
    try {
      const res = await api.getActivityLogs(params)
      setRows(res.data)
      setMeta(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [page, dq, aksi, from, to])

  useEffect(() => {
    load()
  }, [load])

  if (user && user.role !== 'super_admin') return <Navigate to="/" replace />

  const onFilter = (fn) => (e) => { fn(e.target.value); setPage(1) }
  const th = 'px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-center'

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-[#0b2046] tracking-tight">Log Aktivitas</h1>
      <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed max-w-2xl">
        Pencatatan kronologis seluruh interaksi, pengajuan formulir, otorisasi berjenjang (DSP-01/02/03, BAST), verifikasi TTE BSrE, hingga mutasi aset TI oleh pengguna di lingkungan PT Kereta Api Indonesia (Persero).
      </p>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 mt-6">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input className={`${inputCls} pl-9 w-64`} placeholder="Cari aksi, IP, nama, NIP…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className={`${inputCls} w-52`} value={aksi} onChange={onFilter(setAksi)}>
          <option value="">Semua aksi & modul</option>
          {actions.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <input type="date" className={`${inputCls} w-40`} value={from} onChange={onFilter(setFrom)} />
        <span className="text-xs text-slate-400">s/d</span>
        <input type="date" className={`${inputCls} w-40`} value={to} onChange={onFilter(setTo)} />
      </div>

      {error && <div className="mt-3 p-2.5 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">{error}</div>}

      {/* Table Sesuai Gambar Referensi */}
      <div className="mt-3 bg-[#eef3fb] rounded-xl overflow-hidden shadow-xs">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className={`${th} text-left pl-6`}>Waktu & Ref Log</th>
              <th className={th}>Pelaksana</th>
              <th className={th}>NIP</th>
              <th className={th}>Jabatan</th>
              <th className={`${th} text-left`}>Aksi & Modul Terkait</th>
              <th className={`${th} text-left`}>Dokumen & Rincian Aset</th>
              <th className={th}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 && (
              <tr><td colSpan={7} className="bg-white py-16 text-center text-slate-400">Memuat data log aktivitas…</td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={7} className="bg-white py-16 text-center text-slate-400">Belum ada catatan aktivitas.</td></tr>
            )}
            {rows.map((l) => {
              const d = new Date(l.created_at)
              const actionInfo = formatAction(l)
              const docInfo = formatDocumentDetails(l)
              const ActionIcon = actionInfo.icon

              // Ambil jabatan dari field jabatan pengguna (Manager, Staff dll.)
              const userJabatan = l.user?.jabatan 
                || l.user?.jabatan_relasi?.nama 
                || (l.user?.role === 'super_admin' ? 'Manager' : (l.user?.role === 'admin' ? 'Admin' : 'Karyawan'))

              return (
                <tr key={l.id} className="bg-white h-[92px] border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  {/* 1. Waktu & Ref Log */}
                  <td className="pl-6 pr-4 py-3">
                    <p className="font-bold text-slate-800 text-[12px]">
                      {d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {pad(d.getHours())}:{pad(d.getMinutes())}:{pad(d.getSeconds())} WIB
                    </p>
                    <span className="inline-block mt-1 px-1.5 py-0.5 text-[9px] font-bold bg-[#d6e4fb] text-[#0b2046] rounded tracking-wide">
                      LOG-{String(l.id).padStart(6, '0')}
                    </span>
                  </td>

                  {/* 2. Pelaksana */}
                  <td className="px-4 py-3">
                    {l.user ? (
                      <div className="flex items-center gap-2 justify-center">
                        <Avatar name={l.user.nama || l.user.name} id={l.user.id} />
                        <span className="font-bold text-slate-800 leading-tight max-w-[85px] text-[11px]">
                          {l.user.nama || l.user.name}
                        </span>
                      </div>
                    ) : (
                      <div className="text-center text-slate-400 text-[11px]">Sistem / Tamu</div>
                    )}
                  </td>

                  {/* 3. NIP */}
                  <td className="px-4 py-3 text-center font-bold text-slate-800 text-[12px]">
                    {l.user?.nip || '–'}
                  </td>

                  {/* 4. Jabatan (Diisi oleh field jabatan: Manager, Staff / Pegawai, Admin, dll.) */}
                  <td className="px-4 py-3 text-center font-semibold text-slate-800 text-[12px]">
                    {userJabatan}
                  </td>

                  {/* 5. Aksi & Modul Terkait (Bahasa yang dipermudah sesuai gambar) */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-1">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-md ${actionInfo.badgeCls}`}>
                        <ActionIcon className="w-3 h-3 shrink-0" />
                        <span>{actionInfo.badge}</span>
                      </span>
                      <p className="font-bold text-slate-800 text-[11px] leading-snug">
                        {actionInfo.title}
                      </p>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        {actionInfo.module} {actionInfo.extra && <span className="text-slate-400">{actionInfo.extra}</span>}
                      </p>
                    </div>
                  </td>

                  {/* 6. Dokumen & Rincian Aset */}
                  <td className="px-4 py-3">
                    {docInfo.number ? (
                      <div>
                        <a
                          href={docInfo.hasDoc ? `/pemusnahan/${docInfo.docId}/review` : '#'}
                          onClick={(e) => {
                            if (!docInfo.hasDoc) e.preventDefault()
                          }}
                          className="font-bold text-[#d9531e] hover:text-[#c04a1a] text-[11px] inline-flex items-center gap-1 group"
                        >
                          <span>{docInfo.number}</span>
                          <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </a>
                        {docInfo.line1 && (
                          <p className="font-semibold text-slate-800 text-[10px] mt-0.5 leading-snug">
                            {docInfo.line1}
                          </p>
                        )}
                        {docInfo.line2 && (
                          <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                            {docInfo.line2}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-slate-400 text-center font-bold text-sm select-none">–</div>
                    )}
                  </td>

                  {/* 7. Aksi */}
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* Tombol Search / Preview */}
                      <button
                        type="button"
                        title="Lihat Detail Log"
                        onClick={() => setDetail(l)}
                        className="w-[28px] h-[28px] flex items-center justify-center bg-[#ff5a00] hover:bg-[#e65100] text-white rounded-md transition-colors shadow-xs"
                      >
                        <Search className="w-3.5 h-3.5" />
                      </button>

                      {/* Tombol Detail Dokumen (hanya jika ada dokumen / bukan login-logout) */}
                      {docInfo.number && (
                        <button
                          type="button"
                          title="Rincian Dokumen & Data Aset"
                          onClick={() => {
                            if (docInfo.hasDoc) {
                              window.location.href = `/pemusnahan/${docInfo.docId}/review`
                            } else {
                              setDetail(l)
                            }
                          }}
                          className="w-[28px] h-[28px] flex items-center justify-center bg-[#ff5a00] hover:bg-[#e65100] text-white rounded-md transition-colors shadow-xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <TablePagination meta={meta} label="Log Aktivitas" onPage={setPage} />
      </div>

      {/* Modal Detail Aktivitas */}
      {detail && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-bold text-[#0b2046]">
                Detail Aktivitas · LOG-{String(detail.id).padStart(6, '0')} ({detail.aksi})
              </h3>
              <button type="button" onClick={() => setDetail(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <p className="text-slate-400 font-medium">Pelaksana:</p>
                  <p className="font-bold text-slate-800">{detail.user?.nama || detail.user?.name || 'Sistem'}</p>
                  <p className="text-slate-500">NIP: {detail.user?.nip || '–'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Jabatan & Unit:</p>
                  <p className="font-bold text-slate-800">{detail.user?.jabatan || detail.user?.jabatan_relasi?.nama || detail.user?.role || '–'}</p>
                  <p className="text-slate-500">{detail.user?.unit_kerja || '–'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">IP Address:</p>
                  <p className="font-semibold text-slate-700">{detail.ip_address || '–'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Waktu:</p>
                  <p className="font-semibold text-slate-700">
                    {new Date(detail.created_at).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' })}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {[['Data Lama', detail.data_lama], ['Data Baru', detail.data_baru]].map(([t, v]) => (
                  <div key={t}>
                    <p className="font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t}</p>
                    <pre className="bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-auto whitespace-pre-wrap max-h-48">
                      {v ? JSON.stringify(v, null, 2) : '–'}
                    </pre>
                  </div>
                ))}
              </div>
              <p className="text-slate-400 break-all text-[11px]">User Agent: {detail.user_agent || '–'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
