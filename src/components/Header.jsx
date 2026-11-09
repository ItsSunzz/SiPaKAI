
export default function Header() {
  return (
    <header className="h-[68px] shrink-0 bg-white border-b border-slate-200 px-5 sm:px-8">
      <div className="mx-auto h-full max-w-7xl flex items-center justify-between gap-4">
        <div>
          <h1 className="text-sm sm:text-base font-extrabold text-[#0b2046]">
            PT Kereta Api Indonesia (Persero)
          </h1>
          <p className="hidden sm:block text-[11px] text-slate-500">
            SIPAKAI · Sistem Informasi Pengelolaan Administrasi dan Dokumentasi KAI
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="h-2 w-2 rounded-full bg-[#f05a22]" />
          Sistem Informasi Internal
        </div>
      </div>
    </header>
  )
}
