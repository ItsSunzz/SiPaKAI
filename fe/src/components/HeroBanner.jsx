import { ShieldCheck, MapPin, CheckCircle2 } from 'lucide-react'

export default function HeroBanner({ user }) {
  return (
    <article className="relative overflow-hidden bg-gradient-to-r from-[#0c2240] via-[#0e2950] to-[#123160] text-white rounded-2xl p-7 mb-7 shadow-sm border border-slate-700/50">
      {/* Background Graphic Lines (Railway Track Abstract Lines) */}
      <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-15 pointer-events-none">
        <svg viewBox="0 0 400 200" className="w-full h-full object-cover">
          <line x1="50" y1="180" x2="380" y2="20" stroke="white" strokeWidth="4" />
          <line x1="90" y1="190" x2="420" y2="30" stroke="white" strokeWidth="4" />
          <line x1="80" y1="150" x2="110" y2="175" stroke="white" strokeWidth="3" />
          <line x1="140" y1="120" x2="170" y2="145" stroke="white" strokeWidth="3" />
          <line x1="200" y1="90" x2="230" y2="115" stroke="white" strokeWidth="3" />
          <line x1="260" y1="60" x2="290" y2="85" stroke="white" strokeWidth="3" />
          <line x1="320" y1="30" x2="350" y2="55" stroke="white" strokeWidth="3" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Content */}
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold tracking-wide rounded-md bg-[#ea580c] text-white shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
              PT KERETA API INDONESIA (PERSERO)
            </span>
            <span className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-blue-900/80 text-blue-200 border border-blue-700/50">
              Sistem Sentral Aset TI
            </span>
          </div>

          <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight mb-2">
            Selamat Datang,{' '}
            <span className="text-white font-black">{user.name}!</span>
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed mb-5 font-normal">
            Kelola siklus hidup perangkat TI, permohonan disposisi aktiva, serah terima fasilitas
            (BAST), hingga kontrol akses fisik visitor terpadu seluruh Daop/Divre.
          </p>

          {/* Badges Info */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-200">
            <span className="flex items-center gap-1.5 bg-black/20 backdrop-blur-xs px-3 py-1.5 rounded-full border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Hak Akses: {user.roleLabel}</span>
            </span>

            <span className="flex items-center gap-1.5 bg-black/20 backdrop-blur-xs px-3 py-1.5 rounded-full border border-white/10">
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              <span>{user.location}</span>
            </span>

            <span className="flex items-center gap-1.5 bg-black/20 backdrop-blur-xs px-3 py-1.5 rounded-full border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-emerald-300 font-semibold">SAP S/4HANA: Live Sync</span>
            </span>
          </div>
        </div>

        {/* Right User Badge Card */}
        <div className="shrink-0 bg-blue-950/70 border border-blue-500/30 rounded-xl p-3.5 flex items-center gap-3.5 shadow-sm max-w-xs">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-12 h-12 rounded-lg object-cover border border-white/20 shrink-0"
          />
          <div>
            <p className="text-sm font-bold text-white leading-snug">{user.name}</p>
            <p className="text-[11px] text-slate-300 font-mono mt-0.5">
              NIP: {user.nip} // {user.department}
            </p>
            <span className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-600/50">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Otorisator Level 1
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}
