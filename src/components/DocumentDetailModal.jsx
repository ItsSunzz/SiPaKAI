import { useState, useEffect } from 'react'
import { X, FileDown, CheckCircle, Clock, AlertCircle, FileText, CheckSquare } from 'lucide-react'
import { api, fallbackDocuments } from '../services/api'

export default function DocumentDetailModal({ docId, onClose, onReview, user }) {
  const [doc, setDoc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadDetail() {
      try {
        setLoading(true)
        const res = await api.getDocument(docId)
        setDoc(res?.document || res)
      } catch (err) {
        // Fallback for dummy documents
        const found = fallbackDocuments.find(d => d.id === docId)
        if (found) {
          setDoc({
            ...found,
            items: [
              {
                id_aset: found.inventory_code,
                nama_aset: found.category_label,
                alasan_pemusnahan: 'Penyusutan nilai buku dan keausan operasional',
              }
            ],
            approvals: [
              { step: 1, approver: { name: 'Ahmad Fauzi (Asmen TI)' }, action: 'APPROVED', note: 'Kondisi fisik telah dicek di lokasi' },
              { step: 2, approver: { name: 'Bambang Suryo (Manager TI)' }, action: 'PENDING', note: 'Menunggu otorisasi disposal' },
            ]
          })
          setError(null)
        } else {
          setError(err.message || 'Gagal mengambil rincian dokumen.')
        }
      } finally {
        setLoading(false)
      }
    }
    if (docId) loadDetail()
  }, [docId])

  if (!docId) return null

  const handleDownloadPdf = () => {
    const pdfUrl = api.getDocumentPdfUrl(docId)
    window.open(pdfUrl, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0a192f] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-orange-400" />
            <div>
              <h3 className="text-sm font-bold tracking-tight">Rincian Dokumen Resmi</h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {doc?.number || `Dokumen #${docId}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto text-xs flex-1">
          {loading && (
            <div className="py-12 text-center text-slate-500 font-medium">
              Memuat data dokumen dari server...
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {doc && (
            <>
              {/* Meta Grid */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 font-medium block">Nomor Dokumen:</span>
                  <span className="font-bold text-slate-900 font-mono text-sm">{doc.number}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block">Status Disposisi:</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    {doc.status.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block">Pemohon (Requester):</span>
                  <span className="font-bold text-slate-800">
                    {doc.requester?.name || doc.requester?.nama || 'Pemohon'} ({typeof doc.requester?.jabatan === 'object' ? doc.requester?.jabatan?.nama : (doc.requester?.jabatan || '-')})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block">Pejabat Otorisator:</span>
                  <span className="font-bold text-slate-800">
                    {doc.current_approver?.name || '-'}
                  </span>
                </div>
              </div>

              {/* Items List Table */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2">Daftar Aset Terlampir</h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">No / ID Aset</th>
                        <th className="p-2.5">Nama Perangkat</th>
                        <th className="p-2.5">Keterangan / Alasan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(doc.items || []).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5 font-mono text-slate-700">
                            {item.id_aset || item.no_inventaris || `#${idx + 1}`}
                          </td>
                          <td className="p-2.5 font-medium text-slate-900">
                            {item.nama_aset || item.nama_barang}
                          </td>
                          <td className="p-2.5 text-slate-500">
                            {item.alasan_pemusnahan || item.keterangan || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Approval Timeline */}
              {doc.approvals && doc.approvals.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">Riwayat Alur Persetujuan</h4>
                  <div className="space-y-2 border-l-2 border-slate-200 pl-4 ml-1">
                    {doc.approvals.map((appr, i) => (
                      <div key={i} className="relative">
                        <span className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-blue-600 ring-4 ring-white"></span>
                        <div className="font-bold text-slate-800">
                          Step {appr.step}: {appr.approver?.name}
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          Tindakan: <span className="font-semibold text-slate-700">{appr.action}</span>
                          {appr.note && ` — Catatan: "${appr.note}"`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-100 transition-colors"
          >
            Tutup
          </button>
          <div className="flex items-center gap-2.5">
            {onReview && doc?.status === 'in_review' && (!user || user.role === 'admin' || user.role === 'super_admin') && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReview(doc);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#d9531e] hover:bg-[#b84214] text-white font-semibold transition-colors shadow-xs"
              >
                <CheckSquare className="w-4 h-4" />
                <span>Beri Disposisi (Setujui / Tolak)</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold transition-colors shadow-xs"
            >
              <FileDown className="w-4 h-4" />
              <span>Unduh Berita Acara PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
