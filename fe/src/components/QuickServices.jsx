import {
  FileText,
  FileCheck,
  ShoppingCart,
  Package,
  KeyRound,
  ArrowRight,
  LayoutGrid,
} from 'lucide-react'

export default function QuickServices({ onOpenModule }) {
  const modules = [
    {
      id: 'dsp01',
      title: 'Permohonan Pemusnahan',
      badge: 'Pemusnahan',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: FileText,
      iconColor: 'bg-rose-50 text-rose-600 border border-rose-100',
      desc: 'Pengajuan pemusnahan perangkat rusak total atau habis depresiasi buku Daop.',
    },
    {
      id: 'dsp02',
      title: 'Berita Acara Pemusnahan',
      badge: 'Berita Acara',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: FileCheck,
      iconColor: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      desc: 'Pencatatan resmi bukti eksekusi fisik pemusnahan aset bersama saksi-saksi.',
    },
    {
      id: 'dsp03',
      title: 'Formulir Penghapusan Aset',
      badge: 'Penghapusan Buku',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: ShoppingCart,
      iconColor: 'bg-amber-50 text-amber-600 border border-amber-100',
      desc: 'Form resmi de-registrasi dan penghapusan aktiva tetap dari registrasi TI SAP.',
    },
    {
      id: 'ho01',
      title: 'BAST Barang',
      badge: 'Fisik Hardware',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Package,
      iconColor: 'bg-blue-50 text-blue-600 border border-blue-100',
      desc: 'Berita Acara Serah Terima logistik PC, Laptop, Server, dan Periferal Stasiun.',
    },
    {
      id: 'ho02',
      title: 'BAST User Aplikasi',
      badge: 'Akses Akun',
      badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      icon: KeyRound,
      iconColor: 'bg-cyan-50 text-cyan-600 border border-cyan-100',
      desc: 'Serah terima kredensial akun, lisensi SAP, hak VPN, dan e-Office dinas.',
    },
  ]

  return (
    <section className="mb-7">
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-orange-600" />
          <h3 className="text-base font-bold text-slate-800 tracking-tight">
            Layanan Pintas & Modul Aset
          </h3>
        </div>
        <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
          Menampilkan 5 Modul Aktif
        </span>
      </div>

      {/* Grid of 5 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {modules.map((m) => {
          const Icon = m.icon
          return (
            <article
              key={m.id}
              className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${m.iconColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${m.badgeColor}`}
                  >
                    {m.badge}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-800 leading-snug group-hover:text-orange-600 transition-colors">
                  {m.title}
                </h4>

                <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                  {m.desc}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onOpenModule(m.id)}
                className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors"
              >
                <span>Buka Formulir</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </article>
          )
        })}
      </div>
    </section>
  )
}
