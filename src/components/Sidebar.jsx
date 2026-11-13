import { useState } from 'react'
import {
  LayoutGrid,
  FileX2,
  Handshake,
  User,
  History,
  BookUser,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react'

const PEMUSNAHAN_ITEMS = [
  { id: 'dsp01', label: 'Permohonan Pemusnahan' },
  { id: 'dsp02', label: 'Berita Acara Pemusnahan' },
  { id: 'dsp03', label: 'Penghapusan Aset TI' },
]
const BAST_ITEMS = [
  { id: 'ho01', label: 'BAST Barang (HO-01)' },
  { id: 'ho02', label: 'BAST User Aplikasi (HO-02)' },
]

export default function Sidebar({ activeMenu, onSelectMenu, onLogout, currentRole }) {
  const [openPemusnahan, setOpenPemusnahan] = useState(activeMenu.startsWith('dsp'))
  const [openBast, setOpenBast] = useState(activeMenu.startsWith('ho'))

  const item = (active) =>
    `w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-medium transition-colors ${
      active ? 'bg-[#a8390a] text-white' : 'text-slate-200 hover:bg-white/10'
    }`

  const Leaf = ({ id, icon: Icon, label }) => (
    <button type="button" onClick={() => onSelectMenu(id)} className={item(activeMenu === id)}>
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  )

  const Group = ({ icon: Icon, label, open, setOpen, items, activePrefix }) => (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`${item(false)} justify-between ${activeMenu.startsWith(activePrefix) ? 'text-white' : ''}`}
      >
        <span className="flex items-center gap-3">
          <Icon className="w-4 h-4" />
          <span>{label}</span>
        </span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="ml-7 mt-1 space-y-0.5 border-l border-white/10 pl-3">
          {items.map((it) => (
            <button
              key={it.id}
              type="button"
              onClick={() => onSelectMenu(it.id)}
              className={`w-full text-left text-[12px] px-2 py-1.5 rounded ${
                activeMenu === it.id ? 'text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <aside className="w-[220px] bg-[#0b2046] text-slate-200 min-h-screen flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Brand */}
        <div className="px-5 py-4 flex items-center gap-2.5 border-b border-white/10">
          <span className="text-2xl font-black italic tracking-tighter text-white leading-none">KAI</span>
          <div className="leading-tight">
            <p className="text-white text-[11px] font-bold">KAI TI ASET</p>
            <p className="text-slate-400 text-[10px]">Sistem Sentral</p>
          </div>
        </div>

        <div className="px-3 py-5">
          <p className="text-[9px] uppercase font-semibold text-slate-400 tracking-wider px-3 mb-3">Menu Navigasi</p>
          <nav className="space-y-1">
            <Leaf id="beranda" icon={LayoutGrid} label="Beranda" />
            <Group
              icon={FileX2}
              label="Pemusnahan & Penghapusan"
              open={openPemusnahan}
              setOpen={setOpenPemusnahan}
              items={PEMUSNAHAN_ITEMS}
              activePrefix="dsp"
            />
            <Group
              icon={Handshake}
              label="Serah Terima (BAST)"
              open={openBast}
              setOpen={setOpenBast}
              items={BAST_ITEMS}
              activePrefix="ho"
            />
            {currentRole === 'super_admin' && (
              <>
                <Leaf id="pengguna" icon={User} label="Manajemen Pengguna" />
                <Leaf id="laporan-buku-tamu" icon={BookUser} label="Laporan Buku Tamu" />
                <Leaf id="log-aktivitas" icon={History} label="Log Aktivitas" />
              </>
            )}
            <Leaf id="pengaturan" icon={Settings} label="Pengaturan" />
          </nav>
        </div>
      </div>

      <div className="px-5 py-4">
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-2 text-[12px] text-slate-300 hover:text-rose-300 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Keluar Sistem
        </button>
        <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500">
          <span>v2.4.0-daop</span>
          <span>KAI TI © 2024</span>
        </div>
      </div>
    </aside>
  )
}
