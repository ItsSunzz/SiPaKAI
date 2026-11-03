import { useState } from 'react'
import { FileText, Eye, CheckSquare, Search, RefreshCw } from 'lucide-react'

export default function ApprovalTable({
  documents,
  isLoading,
  onRefresh,
  onReviewDocument,
  onViewDocument,
}) {
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredDocs = documents.filter((doc) => {
    const matchesFilter =
      activeFilter === 'all'
        ? true
        : activeFilter === 'pemusnahan'
        ? doc.category_type === 'pemusnahan'
        : doc.category_type === 'bast'

    const matchesSearch =
      !searchQuery ||
      doc.number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.inventory_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.requester_name?.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesFilter && matchesSearch
  })

  const countPemusnahan = documents.filter((d) => d.category_type === 'pemusnahan').length
  const countBast = documents.filter((d) => d.category_type === 'bast').length

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-5 mb-7 shadow-xs">
      {/* Table Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-800 tracking-tight">
                Daftar Menunggu Persetujuan
              </h3>
              <span className="px-2 py-0.5 text-[11px] font-bold bg-[#843c0c] text-white rounded-full">
                {documents.length} Berkas Menunggu
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Memerlukan disposisi digital dan validasi e-Sign dari Pimpinan / VP IT Operation
            </p>
          </div>
        </div>

        {/* Search & Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari no / aset..."
              className="pl-8 pr-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 w-36 lg:w-44"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                activeFilter === 'all'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Semua ({documents.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('pemusnahan')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                activeFilter === 'pemusnahan'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Pemusnahan ({countPemusnahan})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('bast')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                activeFilter === 'bast'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              BAST ({countBast})
            </button>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            title="Muat ulang dari server"
            disabled={isLoading}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3">No & ID Dokumen</th>
              <th className="py-3 px-3">Jenis Berkas</th>
              <th className="py-3 px-3">Pengaju & Unit Kerja</th>
              <th className="py-3 px-3">Tanggal & Nilai Buku</th>
              <th className="py-3 px-3">Status Disposisi</th>
              <th className="py-3 px-3 text-right">Aksi Pengesahan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  <span className="inline-flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Memuat antrean disposisi dari server...
                  </span>
                </td>
              </tr>
            ) : filteredDocs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  Tidak ada dokumen dalam antrean persetujuan.
                </td>
              </tr>
            ) : (
              filteredDocs.map((doc) => {
                const isPemusnahan = doc.category_type === 'pemusnahan'
                return (
                  <tr
                    key={doc.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-800 text-[13px]">
                        {doc.number}
                      </div>
                      <div className="text-slate-400 font-mono text-[11px] mt-0.5">
                        {doc.inventory_code}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            isPemusnahan ? 'bg-rose-500' : 'bg-blue-600'
                          }`}
                        ></span>
                        <span className="font-semibold text-slate-700">
                          {doc.category_label}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-800">
                        {doc.requester_name}
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        {doc.requester_unit}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="text-slate-600 font-medium">
                        {doc.date}
                      </div>
                      <div className="font-bold text-slate-900 text-[12px] mt-0.5">
                        {doc.book_value}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        {doc.status_label || 'Menunggu Disposisi VP'}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onReviewDocument(doc)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#96380c] hover:bg-[#802f0a] text-white text-xs font-semibold shadow-xs transition-colors"
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>Review & Setujui</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onViewDocument(doc)}
                          aria-label="Lihat detail berkas"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
