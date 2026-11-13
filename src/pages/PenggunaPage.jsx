import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { PlusCircle, Pencil, Search, UserX, UserCheck, CheckCircle2, AlertCircle } from 'lucide-react'
import { api } from '../services/api'
import TablePagination, { Avatar } from '../components/TablePagination'
import UserFormModal, { ROLE_LABEL, inputCls } from '../components/UserFormModal'
import MasterImportActions from '../components/MasterImportActions'

const PER_PAGE = 7

export default function PenggunaPage({ user }) {
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [dq, setDq] = useState('')
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState(null) // null | 'new' | user
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const t = setTimeout(() => { setDq(q); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [q])

  const toast = useCallback((m) => {
    setMsg(m)
    setTimeout(() => setMsg(''), 4000)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const params = { page, per_page: PER_PAGE }
    if (dq) params.q = dq
    try {
      const res = await api.getUsers(params)
      setRows(res.data)
      setMeta(res)
    } catch (err) {
      toast(err.message)
    } finally {
      setLoading(false)
    }
  }, [page, dq, toast])

  useEffect(() => {
    load()
  }, [load])

  if (user && user.role !== 'super_admin') return <Navigate to="/" replace />

  const toggleActive = async (u) => {
    if (u.is_active && !window.confirm(`Nonaktifkan ${u.name}? Semua sesi login-nya akan berakhir.`)) return
    try {
      if (u.is_active) await api.deactivateUser(u.id)
      else await api.updateUser(u.id, { is_active: true })
      toast(u.is_active ? 'Pengguna dinonaktifkan.' : 'Pengguna diaktifkan kembali.')
      load()
    } catch (err) {
      toast(err.message)
    }
  }

  const th = 'px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-center'

  return (
    <div>
      {msg && <div className="fixed top-4 right-4 z-[60] px-4 py-2.5 bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-lg">{msg}</div>}

      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-md">
          <h1 className="text-3xl font-extrabold text-[#0b2046] tracking-tight">Manajemen Pengguna</h1>
          <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
            Pusat kendali dan administrasi untuk memantau, menambah, memperbarui, serta mencabut hak akses pengguna (user)
            pada Aplikasi SIPAKAI secara terpusat dan terstandarisasi.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <MasterImportActions
            module="users"
            label="Data User"
            onImported={() => {
              toast('Import data pengguna berhasil diproses.')
              load()
            }}
          />
          <button
            type="button"
            onClick={() => setModal('new')}
            className="flex items-center gap-2 px-5 py-3 text-xs font-semibold text-white bg-[#ff5a00] hover:bg-[#e65100] rounded-lg shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" /> Tambah Pengguna
          </button>
        </div>
      </div>

      {/* Panel Import Data Master & Operasional (Jabatan, Master Aset, Buku Tamu) */}
      <div className="mt-5 p-4 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xs font-bold text-[#0b2046] uppercase tracking-wider">
            Pusat Import Data Master & Operasional (CSV / XLSX / JSON)
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Unduh template resmi atau unggah file import untuk Master Jabatan, Master Aset SAP, dan Buku Tamu.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <span className="text-[11px] font-bold text-slate-700 mr-1">Master Jabatan:</span>
            <MasterImportActions
              module="positions"
              label="Master Jabatan"
              compact
              onImported={() => toast('Data Master Jabatan berhasil diimport.')}
            />
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <span className="text-[11px] font-bold text-slate-700 mr-1">Master Aset:</span>
            <MasterImportActions
              module="assets"
              label="Master Aset"
              compact
              onImported={() => toast('Data Master Aset berhasil diimport.')}
            />
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <span className="text-[11px] font-bold text-slate-700 mr-1">Buku Tamu:</span>
            <MasterImportActions
              module="visitors"
              label="Buku Tamu"
              compact
              onImported={() => toast('Data Buku Tamu berhasil diimport.')}
            />
          </div>
        </div>
      </div>

      <div className="relative mt-6 w-72">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input className={`${inputCls} pl-9`} placeholder="Cari nama, NIP, atau unit kerja…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="mt-3 bg-[#eef3fb] rounded-xl overflow-hidden shadow-xs">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className={`${th} w-12 text-center`}>No</th>
              <th className={`${th} text-left pl-6`}>Nama Pengguna</th>
              <th className={th}>NIP</th>
              <th className={th}>Jabatan</th>
              <th className={th}>Unit Kerja / Daop</th>
              <th className={th}>Status TTE</th>
              <th className={th}>Status Akun</th>
              <th className={th}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 && (
              <tr><td colSpan={8} className="bg-white py-16 text-center text-slate-400">Memuat data pengguna…</td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={8} className="bg-white py-16 text-center text-slate-400">Tidak ada pengguna ditemukan.</td></tr>
            )}
            {rows.map((u, i) => {
              const userJabatan = u.jabatan || u.jabatan_relasi?.nama || ROLE_LABEL[u.role] || u.role
              const hasTte = u.has_signature || Boolean(u.signature_path)

              return (
                <tr key={u.id} className="bg-white h-[84px] border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="text-center text-slate-400 font-medium">{(meta?.from ?? 1) + i}</td>
                  
                  {/* Nama Pengguna */}
                  <td className="pl-6 pr-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name || u.nama} id={u.id} />
                      <div>
                        <p className="font-bold text-slate-800 text-[12px] leading-snug">{u.name || u.nama}</p>
                        <p className="text-[10px] text-slate-400 capitalize">{ROLE_LABEL[u.role] || u.role}</p>
                      </div>
                    </div>
                  </td>

                  {/* NIP */}
                  <td className="text-center font-bold text-slate-800 text-[12px]">{u.nip}</td>

                  {/* Jabatan */}
                  <td className="text-center font-semibold text-slate-800 text-[12px] px-3">
                    <span>{userJabatan}</span>
                    {u.is_approver_position && (
                      <span className="block text-[9px] text-[#0b2046] font-bold bg-blue-50 border border-blue-200 rounded px-1.5 py-0.2 mt-0.5 max-w-fit mx-auto">
                        Pejabat Approver
                      </span>
                    )}
                  </td>

                  {/* Unit Kerja / Daop */}
                  <td className="text-center text-slate-700 font-medium text-[11px] px-3">
                    {u.unit_kerja || '–'}
                  </td>

                  {/* Status TTE (Tanda Tangan Elektronik) */}
                  <td className="text-center px-3">
                    {hasTte ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Tersedia
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold bg-slate-100 text-slate-500 rounded-full">
                        <AlertCircle className="w-3 h-3 text-slate-400" />
                        Belum Pasang
                      </span>
                    )}
                  </td>

                  {/* Status Akun */}
                  <td className="text-center px-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-full ${
                      u.is_active 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {u.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>

                  {/* Aksi */}
                  <td className="text-center pr-4">
                    <div className="flex items-center justify-center gap-1.5">
                      <button 
                        type="button" 
                        title="Edit Pengguna" 
                        onClick={() => setModal(u)} 
                        className="w-[28px] h-[28px] flex items-center justify-center bg-[#ff5a00] hover:bg-[#e65100] text-white rounded-md transition-colors shadow-xs"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {u.id !== user?.id && (
                        <button
                          type="button"
                          title={u.is_active ? 'Nonaktifkan Pengguna' : 'Aktifkan Pengguna'}
                          onClick={() => toggleActive(u)}
                          className={`w-[28px] h-[28px] flex items-center justify-center rounded-md transition-colors shadow-xs ${
                            u.is_active 
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200' 
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200'
                          }`}
                        >
                          {u.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <TablePagination meta={meta} label="Pengguna Terdaftar" onPage={setPage} />
      </div>

      {modal && (
        <UserFormModal
          user={modal === 'new' ? null : modal}
          currentUserId={user?.id}
          onClose={() => setModal(null)}
          onSaved={(m) => { setModal(null); toast(m); load() }}
        />
      )}
    </div>
  )
}
