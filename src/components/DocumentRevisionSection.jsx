import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  History,
  RotateCcw,
  FileText,
  ExternalLink,
  Send,
  X,
} from 'lucide-react';
import { api } from '../services/api';

export default function DocumentRevisionSection({
  doc,
  user,
  editRevisiPath = null,
  onRevised = null,
}) {
  const navigate = useNavigate();
  const [revisionInfo, setRevisionInfo] = useState(null);
  const [isLoadingRev, setIsLoadingRev] = useState(false);
  const [isQuickReviseOpen, setIsQuickReviseOpen] = useState(false);
  const [catatanRevisi, setCatatanRevisi] = useState('');
  const [isSubmittingRevise, setIsSubmittingRevise] = useState(false);

  const isRejected = String(doc?.status || '').toLowerCase() === 'rejected';
  const isOwner = Boolean(
    user && doc && (
      String(doc.user_id || doc.requester?.id || '') === String(user.id || '') ||
      user.role === 'super_admin'
    )
  );
  const canRevise = Boolean(doc?.can_revise !== undefined ? doc.can_revise : (isRejected && isOwner));
  const verificationSteps = Array.isArray(doc?.verification_steps) ? doc.verification_steps : [];
  const parentDoc = doc?.parent_document || null;

  useEffect(() => {
    if (!doc?.id || (!isRejected && !canRevise && (!doc?.revision_count || doc.revision_count <= 0))) {
      return;
    }
    let mounted = true;
    const fetchRevision = async () => {
      setIsLoadingRev(true);
      try {
        const res = await api.getDocumentRevision(doc.id);
        if (mounted) {
          setRevisionInfo(res?.data || res);
        }
      } catch {
        // Fallback if endpoint fails
      } finally {
        if (mounted) setIsLoadingRev(false);
      }
    };
    fetchRevision();
    return () => {
      mounted = false;
    };
  }, [doc?.id, isRejected, canRevise, doc?.revision_count]);

  const handleQuickReviseSubmit = async (e) => {
    e.preventDefault();
    if (!catatanRevisi.trim()) {
      alert('Mohon isi catatan perbaikan revisi.');
      return;
    }
    setIsSubmittingRevise(true);
    try {
      await api.reviseDocument(doc.id, {
        data: doc.data || {},
        items: doc.items || doc.data?.items || [],
        catatan_revisi: catatanRevisi.trim(),
      });
      setIsQuickReviseOpen(false);
      setCatatanRevisi('');
      if (onRevised) {
        onRevised();
      } else {
        window.location.reload();
      }
    } catch (err) {
      alert(err.message || 'Gagal mengirim revisi dokumen.');
    } finally {
      setIsSubmittingRevise(false);
    }
  };

  const rejection = revisionInfo?.rejection || (isRejected ? {
    note: doc?.rejection_note || doc?.data?.alasan_penolakan || 'Dokumen memerlukan perbaikan data.',
    approver_name: doc?.rejected_by_name || 'Verifikator',
    step: doc?.current_step || 1,
  } : null);

  const revisionHistory = Array.isArray(revisionInfo?.revision_history)
    ? revisionInfo.revision_history
    : Array.isArray(doc?.revision_history)
    ? doc.revision_history
    : [];

  if (!parentDoc && verificationSteps.length === 0 && !isRejected && !canRevise && revisionHistory.length === 0) {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto mb-5 space-y-4 print:hidden">
      {/* 1. Badge / Link Referensi Dokumen Induk (DSP-01) */}
      {parentDoc && (
        <div className="bg-blue-50/90 border border-blue-200 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0b2046] text-white flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                  Referensi Dokumen Induk (DSP-01)
                </span>
                <span className="text-xs font-extrabold text-[#0b2046] font-mono">
                  {parentDoc.number || parentDoc.no_dokumen || `ID #${parentDoc.id}`}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Pemohon: <strong className="text-slate-800">{parentDoc.nama_pemohon || parentDoc.requester_name || '-'}</strong>
                {parentDoc.tanggal_permohonan ? ` • Tanggal Permohonan: ${parentDoc.tanggal_permohonan}` : ''}
                {parentDoc.unit_kerja ? ` • Unit: ${parentDoc.unit_kerja}` : ''}
              </p>
            </div>
          </div>

          {parentDoc.id && (
            <button
              type="button"
              onClick={() => navigate(`/pemusnahan/${parentDoc.id}`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-blue-300 text-xs font-bold text-blue-800 hover:bg-blue-100 transition shadow-2xs"
            >
              <span>Lihat DSP-01</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* 2. Stepper / Timeline Progres Verifikasi (Multi-Verifikator) */}
      {verificationSteps.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Progres Tahapan Verifikasi ({verificationSteps.filter((s) => s.status === 'approved').length}/{verificationSteps.length})
            </h4>
            {doc?.status && (
              <span className="text-[11px] font-semibold text-slate-500">
                Status Saat Ini: <strong className="text-slate-800 uppercase">{doc.status_label || doc.status}</strong>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            {verificationSteps.map((stepObj, idx) => {
              const st = String(stepObj.status || 'waiting').toLowerCase();
              const isCurrent = Boolean(stepObj.is_current);
              const badgeStyles =
                st === 'approved'
                  ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900'
                  : st === 'rejected'
                  ? 'border-red-300 bg-red-50/80 text-red-900'
                  : isCurrent || st === 'pending'
                  ? 'border-amber-300 bg-amber-50/80 text-amber-900 ring-2 ring-amber-400/30'
                  : 'border-slate-200 bg-slate-50 text-slate-500';

              return (
                <div
                  key={stepObj.step || idx}
                  className={`rounded-xl border p-3 flex items-start gap-2.5 transition ${badgeStyles}`}
                >
                  <div className="mt-0.5 shrink-0">
                    {st === 'approved' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : st === 'rejected' ? (
                      <XCircle className="w-4 h-4 text-red-600" />
                    ) : isCurrent || st === 'pending' ? (
                      <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                    ) : (
                      <Clock className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-75">
                        Tahap {stepObj.step || idx + 1}
                      </span>
                      {isCurrent && (
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-900">
                          Aktif
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold truncate mt-0.5">{stepObj.label || `Verifikator ${idx + 1}`}</p>
                    <p className="text-[11px] truncate opacity-85 mt-0.5">
                      {stepObj.approver_name || 'Menunggu Penunjukan'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Banner Penolakan & Aksi Revisi Dokumen */}
      {(isRejected || canRevise) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-extrabold text-red-900">
                    Dokumen Ditolak — Perlu Revisi
                  </h4>
                  {rejection?.step && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-200 text-red-900">
                      Ditolak pada Tahap {rejection.step}
                    </span>
                  )}
                </div>
                <p className="text-xs text-red-800 mt-1 leading-relaxed">
                  <strong>Catatan Verifikator ({rejection?.approver_name || 'Pejabat Penilai'}):</strong>{' '}
                  &ldquo;{rejection?.note || doc?.rejection_note || 'Mohon perbaiki data dokumen sesuai ketentuan.'}&rdquo;
                </p>
                {isLoadingRev && (
                  <p className="text-[11px] text-red-600 mt-1">Memuat detail riwayat revisi...</p>
                )}
              </div>
            </div>

            {canRevise && (
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {editRevisiPath && (
                  <button
                    type="button"
                    onClick={() => navigate(editRevisiPath)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Revisi Dokumen (Edit Form)</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsQuickReviseOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-red-300 bg-white hover:bg-red-100 text-red-800 text-xs font-bold transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim Ulang Revisi</span>
                </button>
              </div>
            )}
          </div>

          {/* Riwayat Revisi Sebelumnya */}
          {revisionHistory.length > 0 && (
            <div className="mt-4 pt-3 border-t border-red-200/80">
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-red-900 mb-2">
                <History className="w-3.5 h-3.5" />
                <span>Riwayat Revisi Sebelumnya ({revisionHistory.length})</span>
              </div>
              <div className="space-y-1.5">
                {revisionHistory.map((rev, i) => (
                  <div
                    key={rev.id || i}
                    className="text-xs bg-white/80 border border-red-200/60 rounded-lg px-3 py-2 flex flex-wrap items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-bold text-slate-800">
                        Revisi #{rev.revision_number || i + 1}:
                      </span>{' '}
                      <span className="text-slate-700">
                        {rev.catatan_revisi || rev.note || rev.notes || 'Perbaikan data dokumen'}
                      </span>
                    </div>
                    {rev.created_at && (
                      <span className="text-[11px] text-slate-500">
                        {new Date(rev.created_at).toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Kirim Revisi Cepat */}
      {isQuickReviseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 bg-[#0b2046] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-extrabold">Ajukan Revisi Dokumen</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickReviseOpen(false)}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleQuickReviseSubmit} className="p-5 space-y-4">
              {rejection?.note && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
                  <strong>Alasan Penolakan:</strong> {rejection.note}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Catatan Perbaikan / Revisi <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={catatanRevisi}
                  onChange={(e) => setCatatanRevisi(e.target.value)}
                  placeholder="Jelaskan perbaikan yang telah dilakukan pada dokumen ini..."
                  required
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0b2046]"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Siklus persetujuan akan di-reset kembali mulai dari Verifikator 1.
                </p>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsQuickReviseOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRevise}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#f05a22] hover:bg-[#d94a18] text-white text-xs font-bold disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingRevise ? 'Mengirim Revisi...' : 'Kirim Hasil Revisi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

