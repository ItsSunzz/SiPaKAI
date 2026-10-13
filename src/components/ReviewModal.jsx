import React, { useState, useEffect } from 'react'
import { 
  X, 
  CheckCircle, 
  XCircle, 
  ArrowRightLeft, 
  FileText, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  FileDown, 
  Clock, 
  Building, 
  User, 
  Layers,
  CheckSquare,
  Lock
} from 'lucide-react'
import { api, fallbackDocuments } from '../services/api'

export default function ReviewModal({ doc, onClose, onAction, isSubmitting, user }) {
  const [actionType, setActionType] = useState('approve')
  const [notes, setNotes] = useState('')
  const [approvers, setApprovers] = useState([])
  const [nextApproverId, setNextApproverId] = useState('')

  const [docDetail, setDocDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)

  // Fetch full details of the document and approvers
  useEffect(() => {
    async function loadData() {
      if (!doc?.id) return;
      
      // Load approvers for forwarding
      try {
        const aRes = await api.getApprovers();
        const aList = Array.isArray(aRes) ? aRes : (aRes?.data || []);
        setApprovers(aList);
        if (aList.length > 0) setNextApproverId(String(aList[0].id));
      } catch (e) {
        console.error('Failed to load approvers:', e);
      }

      // Load full document data
      try {
        setLoadingDetail(true);
        const res = await api.getDocument(doc.id);
        const fetched = res?.document || res;
        if (fetched) {
          setDocDetail(fetched);
        } else {
          setDocDetail(doc);
        }
      } catch (err) {
        // Fallback for dummy documents
        const found = fallbackDocuments.find(d => d.id === doc.id);
        if (found) {
          setDocDetail({
            ...found,
            items: [
              {
                id_aset: found.inventory_code || '104-KAI-SRV-2018',
                nama_aset: found.category_label || 'Pemusnahan Aset TI (Scrap)',
                alasan_pemusnahan: 'Kerusakan fatal sistem operasi & depresiasi penuh',
              }
            ],
            approvals: [
              { step: 1, approver: { name: 'Ahmad Fauzi Setiawan (Asmen TI)' }, action: 'APPROVED', note: 'Pemeriksaan fisik telah selesai di server room' },
              { step: 2, approver: { name: 'Bambang Suryo Pratama (Manager TI)' }, action: 'PENDING', note: 'Menunggu otorisasi disposal & sanitasi media' },
            ]
          });
        } else {
          setDocDetail(doc);
        }
      } finally {
        setLoadingDetail(false);
      }
    }
    loadData();
  }, [doc]);

  if (!doc) return null;

  const activeDoc = docDetail || doc;
  const isPending = activeDoc.status === 'in_review';
  const isApproved = activeDoc.status === 'approved';
  const isRejected = activeDoc.status === 'rejected';

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (actionType === 'reject' && !notes.trim()) {
      setErrorMessage('Catatan wajib diisi saat menolak dokumen agar pemohon mengetahui alasan penolakan.');
      return;
    }

    if (onAction) {
      onAction(activeDoc.id, actionType, notes, actionType === 'forward' ? Number(nextApproverId) : null);
    }
  };

  const handleDownloadPdf = () => {
    const pdfUrl = api.getDocumentPdfUrl(activeDoc.id);
    window.open(pdfUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0a192f] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-600/30 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight">
                  {isPending ? 'Review & Disposisi Dokumen Pemusnahan' : 'Pratinjau Dokumen Pemusnahan'}
                </h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  isPending ? 'bg-orange-500/30 text-orange-300 border border-orange-400/40' :
                  isApproved ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/40' :
                  'bg-rose-500/30 text-rose-300 border border-rose-400/40'
                }`}>
                  {activeDoc.status_label || activeDoc.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                No: {activeDoc.number || activeDoc.nomor || `DOK-${activeDoc.id}`}
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold">{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Informasi Header Dokumen */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Building className="w-4 h-4 text-[#0b2046]" />
              Informasi Pemohon & Klasifikasi Dokumen
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-slate-400 block text-[11px] font-medium">Jenis Formulir:</span>
                <span className="font-bold text-slate-900 mt-0.5 block">
                  {activeDoc.category_label || (activeDoc.type === 'dsp01' ? 'Permohonan Pemusnahan' : 'Berita Acara')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-medium">Pemohon (Requester):</span>
                <span className="font-bold text-slate-900 mt-0.5 block">
                  {activeDoc.requester_name || activeDoc.requester?.name || activeDoc.requester?.nama || 'Petugas TI'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  NIP: {activeDoc.requester?.nip || activeDoc.requester_nip || '62489'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-medium">Unit Kerja Pengusul:</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {typeof activeDoc.requester?.jabatan === 'object' ? activeDoc.requester?.jabatan?.nama : (activeDoc.requester?.jabatan || activeDoc.requester_unit || 'DAOP 1 Jakarta')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-medium">Estimasi Nilai Buku:</span>
                <span className="font-bold text-[#0b2046] text-sm mt-0.5 block">
                  {activeDoc.book_value || (activeDoc.data?.nilai_buku ? `Rp ${Number(activeDoc.data.nilai_buku).toLocaleString('id-ID')}` : 'Rp 148.500.000')}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Daftar Aset yang Diusulkan */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#f05a22]" />
              Daftar Aset / Perangkat TI Terlampir
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="p-2.5 w-10 text-center">No</th>
                    <th className="p-2.5">ID / No. Inventaris (SAP)</th>
                    <th className="p-2.5">Nama Perangkat & Spesifikasi</th>
                    <th className="p-2.5">Alasan Teknis Pemusnahan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeDoc.items && activeDoc.items.length > 0 ? (
                    activeDoc.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="p-2.5 text-center text-slate-400 font-medium">{idx + 1}</td>
                        <td className="p-2.5 font-mono text-slate-700 font-semibold">
                          {item.id_aset || item.no_inventaris || `#${idx + 1}`}
                        </td>
                        <td className="p-2.5 font-bold text-slate-800">
                          {item.nama_aset || item.nama_barang || activeDoc.category_label}
                        </td>
                        <td className="p-2.5 text-slate-600">
                          {item.alasan_pemusnahan || item.keterangan || 'Kerusakan fatal perangkat keras operasional'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="p-2.5 text-center text-slate-400 font-medium">1</td>
                      <td className="p-2.5 font-mono text-slate-700 font-semibold">
                        {activeDoc.inventory_code || '104-KAI-SRV-2018'}
                      </td>
                      <td className="p-2.5 font-bold text-slate-800">
                        {activeDoc.category_label || 'Server Dell PowerEdge R740'}
                      </td>
                      <td className="p-2.5 text-slate-600">
                        Kerusakan fatal motherboard & melewati batas usia depresiasi teknis 5 tahun
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Riwayat Alur Persetujuan Sekuensial Berjenjang */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Alur Persetujuan Berjenjang (Sekuensial 1 ➔ 2 ➔ 3)
              </h4>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                Wajib Berurutan
              </span>
            </div>

            {(() => {
              const approvalHistory = activeDoc.approvals || activeDoc.persetujuan || [];
              const chain = activeDoc.data?.approval_chain || [
                activeDoc.data?.verifikator_1_id,
                activeDoc.data?.verifikator_2_id,
                activeDoc.data?.verifikator_3_id,
              ].filter(Boolean);

              let currentActiveStep = 1;
              if (Array.isArray(chain) && chain.length > 0 && activeDoc.penyetuju_id) {
                const idx = chain.findIndex(id => Number(id) === Number(activeDoc.penyetuju_id));
                if (idx !== -1) currentActiveStep = idx + 1;
              } else {
                const pendingRecord = approvalHistory.find(a => (a.aksi === 'pending' || a.action === 'PENDING'));
                if (pendingRecord) currentActiveStep = pendingRecord.step || 1;
              }

              const sequentialSteps = [
                {
                  step: 1,
                  title: 'Tahap 1: Verifikasi Atasan Langsung',
                  role: 'Atasan Langsung Unit Pemohon',
                  desc: 'Pemeriksaan awal fisik aset & kewajaran permohonan',
                },
                {
                  step: 2,
                  title: 'Tahap 2: Validasi Teknis TI',
                  role: 'Pengelola Aset TI',
                  desc: 'Sanitasi media storage, kelayakan degaussing & tag SAP',
                },
                {
                  step: 3,
                  title: 'Tahap 3: Penyetuju Akhir',
                  role: 'Penyetuju Akhir (Head of Unit)',
                  desc: 'Pengesahan Berita Acara & tanda tangan digital terpusat',
                },
              ];

              return (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 space-y-3.5">
                  {sequentialSteps.map((s) => {
                    const existingAppr = approvalHistory.find(a => a.step === s.step);
                    const isStepApproved = existingAppr && (existingAppr.action === 'APPROVED' || existingAppr.aksi === 'approved');
                    const isStepRejected = existingAppr && (existingAppr.action === 'REJECTED' || existingAppr.aksi === 'rejected');
                    const isStepCurrentActive = isPending && s.step === currentActiveStep;
                    const isStepLocked = isPending && s.step > currentActiveStep;

                    // Nama approver yang tercatat atau fallback
                    let approverNameDisplay = existingAppr?.approver?.name || existingAppr?.approver?.nama;
                    if (!approverNameDisplay) {
                      if (isStepCurrentActive) {
                        approverNameDisplay = activeDoc.current_approver?.nama || activeDoc.currentApprover?.nama || activeDoc.penyetuju?.nama;
                      }
                      if (!approverNameDisplay) {
                        approverNameDisplay = s.step === 1 ? 'Ahmad Fauzi Setiawan (Asmen TI)' :
                          s.step === 2 ? 'Bambang Suryo Pratama (Manager TI)' : 'Dra. Siti Rahmawati, M.M.';
                      }
                    }

                    return (
                      <div 
                        key={s.step} 
                        className={`p-3 rounded-xl border transition-all flex items-start gap-3 ${
                          isStepApproved ? 'bg-emerald-50/50 border-emerald-200' :
                          isStepRejected ? 'bg-rose-50/50 border-rose-200' :
                          isStepCurrentActive ? 'bg-white border-blue-400 shadow-sm ring-1 ring-blue-300' :
                          'bg-slate-100/60 border-slate-200 opacity-75'
                        }`}
                      >
                        {/* Circle Indicator */}
                        <div className="mt-0.5 shrink-0">
                          {isStepApproved ? (
                            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                              <CheckCircle className="w-4 h-4" />
                            </div>
                          ) : isStepRejected ? (
                            <div className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center">
                              <XCircle className="w-4 h-4" />
                            </div>
                          ) : isStepCurrentActive ? (
                            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs animate-pulse">
                              {s.step}
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center">
                              <Lock className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>

                        {/* Text info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900">{s.title}</span>
                              <span className="text-[10px] text-slate-500 font-medium">({s.role})</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 self-start sm:self-auto ${
                              isStepApproved ? 'bg-emerald-100 text-emerald-800' :
                              isStepRejected ? 'bg-rose-100 text-rose-800' :
                              isStepCurrentActive ? 'bg-blue-100 text-blue-900' :
                              'bg-slate-200 text-slate-600'
                            }`}>
                              {isStepApproved ? '✓ Disetujui' :
                               isStepRejected ? '✕ Ditolak' :
                               isStepCurrentActive ? 'Sedang Menunggu Tindakan (Giliran Aktif)' :
                               'Terkunci (Menunggu Tahap Sebelumnya)'}
                            </span>
                          </div>

                          <div className="text-[11px] font-semibold text-slate-800 mt-1">
                            Pejabat: {approverNameDisplay}
                          </div>

                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {existingAppr?.catatan || existingAppr?.note
                              ? `Catatan: "${existingAppr.catatan || existingAppr.note}"`
                              : s.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Section 4: Panel Tindakan Persetujuan */}
          {isPending ? (() => {
            const isAdminOrSuper = !user || user.role === 'admin' || user.role === 'super_admin';
            const isCurrentApprover = user?.id && activeDoc.penyetuju_id && Number(user.id) === Number(activeDoc.penyetuju_id);
            const canTakeAction = isAdminOrSuper || isCurrentApprover;

            if (!canTakeAction) {
              const currentApproverObj = activeDoc.current_approver || activeDoc.currentApprover || activeDoc.penyetuju;
              const approverName = currentApproverObj?.nama || currentApproverObj?.name || 'Verifikator Tahap Terkait';
              return (
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4.5 flex items-start gap-3">
                  <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-900">
                      Tindakan Persetujuan Terkunci (Menunggu Giliran)
                    </h4>
                    <p className="text-[11px] text-amber-800/90 mt-1">
                      Dokumen ini saat ini sedang dalam proses verifikasi berjenjang oleh <strong>{approverName}</strong>. Sesuai tata kelola sekuensial PT KAI, Anda baru dapat memberikan disposisi setelah tahapan sebelumnya memberikan persetujuan resmi.
                    </p>
                  </div>
                </div>
              );
            }

            return (
              <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4.5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-amber-200/80">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4.5 h-4.5 text-[#f05a22]" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                      Tindakan Disposisi Dokumen (Otorisasi Otorisator)
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded">
                    Giliran Anda Menindaklanjuti
                  </span>
                </div>

                {/* Action Buttons Choice */}
                <div>
                  <label className="block font-bold text-slate-700 mb-2">
                    Pilih Keputusan Disposisi:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setActionType('approve')}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border font-bold transition-all text-center ${
                        actionType === 'approve'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-400/50'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <CheckCircle className={`w-5 h-5 mb-1 ${actionType === 'approve' ? 'text-white' : 'text-emerald-600'}`} />
                      <span>Setujui (Approve)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActionType('reject')}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border font-bold transition-all text-center ${
                        actionType === 'reject'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs ring-2 ring-rose-400/50'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <XCircle className={`w-5 h-5 mb-1 ${actionType === 'reject' ? 'text-white' : 'text-rose-600'}`} />
                      <span>Tolak (Reject)</span>
                    </button>
                  </div>
                </div>

                {/* Notes Input */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Catatan / Disposisi Tambahan {actionType === 'reject' && <span className="text-rose-600">* (Wajib diisi saat menolak)</span>}
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={actionType === 'reject' ? 'Jelaskan alasan penolakan dan instruksi perbaikan untuk pemohon...' : 'Masukkan catatan pertimbangan atau arahan teknis disposisi...'}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 bg-white focus:ring-1 focus:ring-[#f05a22]"
                  />
                </div>

                {/* E-sign indicator */}
                <div className="flex items-center gap-2 text-[11px] text-slate-600 bg-white border border-slate-200 p-2.5 rounded-lg">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Otorisasi ini otomatis mengesahkan dan membubuhkan tanda tangan digital (e-Sign seal) akun Anda ke dalam berkas resmi.
                  </span>
                </div>
              </div>
            );
          })() : isApproved ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-emerald-800">
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-xs">Dokumen Telah Disetujui Penuh</h4>
                  <p className="text-[11px] text-emerald-700/80">Dokumen telah selesai melalui seluruh jenjang verifikasi dan sah secara hukum.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs transition-colors shrink-0"
              >
                <FileDown className="w-4 h-4" />
                <span>Unduh Berita Acara PDF</span>
              </button>
            </div>
          ) : (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800">
              <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <h4 className="font-bold text-xs">Dokumen Ditolak / Memerlukan Revisi</h4>
                <p className="text-[11px] text-rose-700/80">Permohonan pemusnahan ini telah ditolak oleh pejabat otorisator.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 font-semibold hover:bg-slate-100 transition-colors text-xs"
          >
            Tutup
          </button>

          <div className="flex items-center gap-2.5">
            {/* Download PDF button if document is approved */}
            {isApproved && (
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold transition-colors shadow-xs text-xs"
              >
                <FileDown className="w-4 h-4" />
                <span>Unduh Berita Acara PDF</span>
              </button>
            )}

            {/* Confirm Action Button if pending and authorized */}
            {isPending && (() => {
              const isAdminOrSuper = !user || user.role === 'admin' || user.role === 'super_admin';
              const isCurrentApprover = user?.id && activeDoc.penyetuju_id && Number(user.id) === Number(activeDoc.penyetuju_id);
              const canTakeAction = isAdminOrSuper || isCurrentApprover;
              if (!canTakeAction) return null;

              return (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg text-white font-bold transition-all shadow-xs text-xs ${
                    actionType === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span>{isSubmitting ? 'Menyimpan...' : actionType === 'approve' ? 'Setujui Dokumen' : 'Tolak Dokumen'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}
