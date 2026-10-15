import { useState } from 'react'
import {
  LayoutDashboard,
  Trash2,
  FileCheck2,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react'

export default function Sidebar({ activeMenu, onSelectMenu, currentRole }) {
  const [openPemusnahan, setOpenPemusnahan] = useState(false)
  const [openBast, setOpenBast] = useState(false)

  return (
    <aside className="w-64 bg-[#0a192f] text-slate-300 min-h-screen flex flex-col justify-between shrink-0 select-none border-r border-slate-800">
      <div>
        {/* Brand Header */}
        <div className="p-5 flex items-center gap-3 border-b border-slate-800/80">
          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center p-1 shadow-sm">
            <svg viewBox="0 0 100 60" className="w-8 h-8">
              <path d="M10 45 L35 15 L50 15 L25 45 Z" fill="#003580" />
              <path d="M35 45 L60 15 L75 15 L50 45 Z" fill="#EE7623" />
              <path d="M60 45 L85 15 L95 15 L70 45 Z" fill="#003580" />
            </svg>
          </div>
          <div>
            <h1 className="text-white text-base font-bold tracking-tight leading-none">
              KAI TI ASET
            </h1>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Sistem Sentral</p>
          </div>
        </div>

        {/* Navigation List */}
        <div className="px-4 py-5">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-3 mb-2">
            Menu Navigasi
          </p>

          <nav className="space-y-1">
            <button
              type="button"
              onClick={() => onSelectMenu('beranda')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeMenu === 'beranda'
                  ? 'bg-[#d9531e] text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Beranda</span>
            </button>

            {/* Menu Pemusnahan & Penghapusan */}
            <div>
              <button
                type="button"
                onClick={() => setOpenPemusnahan(!openPemusnahan)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeMenu.startsWith('dsp')
                    ? 'bg-[#f05a22] text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="w-4 h-4" />
                  <span>Pemusnahan & Penghapusan</span>
                </div>
                {openPemusnahan ? (
                  <ChevronDown className="w-4 h-4 text-white/80" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {openPemusnahan && (
                <div className="pl-6 pr-2 py-1.5 space-y-1 text-xs">
                  <button
                    type="button"
                    onClick={() => onSelectMenu('dsp01')}
                    className={`w-full flex items-center gap-2 text-left py-1.5 px-2.5 rounded-md transition-colors ${
                      activeMenu === 'dsp01'
                        ? 'text-white font-semibold bg-slate-800/80'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${activeMenu === 'dsp01' ? 'bg-[#f05a22]' : 'bg-slate-500'}`}></span>
                    Permohonan Pemusnahan
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectMenu('dsp02')}
                    className={`w-full flex items-center gap-2 text-left py-1.5 px-2.5 rounded-md transition-colors ${
                      activeMenu === 'dsp02'
                        ? 'text-white font-semibold bg-slate-800/80'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${activeMenu === 'dsp02' ? 'bg-[#f05a22]' : 'bg-slate-500'}`}></span>
                    Berita Acara Pemusnahan
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectMenu('dsp03')}
                    className={`w-full flex items-center gap-2 text-left py-1.5 px-2.5 rounded-md transition-colors ${
                      activeMenu === 'dsp03'
                        ? 'text-white font-semibold bg-slate-800/80'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${activeMenu === 'dsp03' ? 'bg-[#f05a22]' : 'bg-slate-500'}`}></span>
                    Penghapusan Aset TI
                  </button>
                </div>
              )}
            </div>

            {/* Menu BAST */}
            <div>
              <button
                type="button"
                onClick={() => setOpenBast(!openBast)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeMenu.startsWith('ho') || activeMenu.includes('bast')
                    ? 'bg-[#f05a22] text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileCheck2 className="w-4 h-4" />
                  <span>Serah Terima (BAST)</span>
                </div>
                {openBast || activeMenu.startsWith('ho') || activeMenu.includes('bast') ? (
                  <ChevronDown className="w-4 h-4 text-white/80" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {(openBast || activeMenu.startsWith('ho') || activeMenu.includes('bast')) && (
                <div className="pl-6 pr-2 py-1.5 space-y-1 text-xs">
                  <button
                    type="button"
                    onClick={() => onSelectMenu('ho01')}
                    className={`w-full flex items-center gap-2 text-left py-1.5 px-2.5 rounded-md transition-colors ${
                      activeMenu === 'ho01' || activeMenu === 'bast-barang'
                        ? 'text-white font-semibold bg-slate-800/80'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${activeMenu === 'ho01' || activeMenu === 'bast-barang' ? 'bg-[#f05a22]' : 'bg-slate-500'}`}></span>
                    BAST Barang/Fisik
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectMenu('ho02')}
                    className={`w-full flex items-center gap-2 text-left py-1.5 px-2.5 rounded-md transition-colors ${
                      activeMenu === 'ho02'
                        ? 'text-white font-semibold bg-slate-800/80'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${activeMenu === 'ho02' ? 'bg-[#f05a22]' : 'bg-slate-500'}`}></span>
                    BAST User/Aplikasi
                  </button>
                </div>
              )}
            </div>

            {/* Pengaturan */}
            <button
              type="button"
              onClick={() => onSelectMenu('pengaturan')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeMenu === 'pengaturan'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Pengaturan</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Bottom Footer Section */}
      <div className="p-4 border-t border-slate-800/80">
        <button
          type="button"
          onClick={() => alert('Sesi keluar. Silakan login kembali.')}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-400 hover:text-rose-400 hover:bg-slate-800/40 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar Sistem</span>
        </button>

        <div className="mt-4 pt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/40">
          <span>v2.4.0-daop</span>
          <span>KAI TI © 2024</span>
        </div>
      </div>
    </aside>
  )
}
