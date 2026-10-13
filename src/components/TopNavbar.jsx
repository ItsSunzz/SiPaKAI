import { Bell, LogOut } from 'lucide-react'

export default function TopNavbar({ currentRole, onLogout, user }) {
  return (
    <header className="bg-white border-b border-slate-200 px-8 py-3.5 flex items-center justify-between sticky top-0 z-20">
      {/* Title & Central Badge */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Dashboard IT Asset
            </h2>
            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded">
              CENTRAL
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Portal Manajemen Aset & Fasilitas TI
          </p>
        </div>
      </div>

      {/* Right User Bar */}
      <div className="flex items-center gap-5">
        {/* Notification Bell */}
        <button
          type="button"
          aria-label="Notifikasi"
          className="relative p-2 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute 0 top-1 right-1 w-4 h-4 bg-orange-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            4
          </span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="text-right">
            <div className="text-sm font-bold text-slate-900 leading-tight">
              {user?.name}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              {user?.roleLabel}
            </div>
          </div>
          <img
            src={user?.avatar}
            alt={user?.name}
            className="w-10 h-10 rounded-full border border-slate-200 object-cover"
          />
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={onLogout}
          aria-label="Logout"
          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}
