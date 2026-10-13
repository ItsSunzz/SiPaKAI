import { SlidersHorizontal, FileText, CheckCircle2, Shield } from 'lucide-react'

export default function RbacMatrix({ currentRole }) {
  const rolesInfo = [
    {
      id: 'admin',
      title: 'Admin',
      icon: SlidersHorizontal,
      desc: 'Master data perangkat, konfigurasi siklus hidup inventaris, sinkronisasi SAP, dan log audit pergerakan aset regional.',
    },
    {
      id: 'karyawan',
      title: 'Karyawan',
      icon: FileText,
      desc: 'Pembuatan draf permohonan disposisi, penerimaan serah terima BAST mandiri, dan pelaporan perangkat rusak dinas.',
    },
    {
      id: 'super_admin',
      title: 'Super Admin',
      icon: CheckCircle2,
      desc: 'Otorisasi final disposisi aktiva, e-Sign Berita Acara, eskalasi penghapusan buku finansial, dan pemantauan dasbor analitik.',
    },
  ]

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-5 mb-8 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200/80 mb-4 gap-2">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-slate-700" />
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">
            Matriks Hak Akses Terintegrasi (RBAC KAI TI)
          </h3>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Pedoman Kebijakan Cyber Security & ISO 27001
        </span>
      </div>

      {/* 3 Role Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {rolesInfo.map((item) => {
          const Icon = item.icon
          const isCurrent = currentRole === item.id
          return (
            <article
              key={item.id}
              className={`rounded-xl p-4.5 border transition-all ${
                isCurrent
                  ? 'bg-blue-50/40 border-blue-400/80 shadow-xs ring-1 ring-blue-400/50'
                  : 'bg-slate-50/50 border-slate-200/80'
              }`}
            >
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isCurrent
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200/70 text-slate-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                {item.desc}
              </p>
            </article>
          )
        })}
      </div>
    </section>
  )
}
