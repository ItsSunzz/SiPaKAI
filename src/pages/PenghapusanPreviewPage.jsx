import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  FileText,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  PenTool,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  Building2,
  UserCheck,
  Eraser,
  Loader2,
  Check,
  Printer,
  Edit3,
  Lock,
  ExternalLink,
  Shield,
  Layers,
  X,
  RefreshCw,
  XCircle,
  FileDown
} from 'lucide-react';
import { api } from '../services/api';
import SignatureSelector from '../components/SignatureSelector';

export default function PenghapusanPreviewPage({ user, onDocumentUpdated }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [doc, setDoc] = useState(null);
  const [apiUsers, setApiUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Active Tab: 'pdf' (Pratinjau PDF Asli dari Backend) | 'audit' (Alur Verifikasi TTE)
  const [activeTab, setActiveTab] = useState('pdf');

  // Backend Preview PDF Blob State
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const iframeRef = useRef(null);

  // Modal Signing States
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [notesInput, setNotesInput] = useState('Disetujui dan diverifikasi sesuai fisik barang.');
  const [pinInput, setPinInput] = useState('123456');
  const [isSigning, setIsSigning] = useState(false);
  const [signError, setSignError] = useState(null);

  // Modal Reject States
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Canvas TTD & Signature Mode (3 Pilihan: draw | upload | saved)
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);
  const [selectedSignatureFile, setSelectedSignatureFile] = useState(null);
  const [signatureMode, setSignatureMode] = useState('draw'); // 'draw' | 'upload' | 'saved'
  const [hasServerSignature, setHasServerSignature] = useState(false);
  const [serverSignatureUrl, setServerSignatureUrl] = useState('');

  // Sinkronisasi status tanda tangan profil user saat ini
  useEffect(() => {
    if (user?.has_signature || user?.signature_path) {
      setHasServerSignature(true);
      setServerSignatureUrl(api.getSignatureUrl(true));
      setSignatureMode('saved');
    } else {
      setSignatureMode('draw');
    }
  }, [user]);

  // Generate on-the-fly PDF Preview via backend API
  const generateBackendPdfPreview = async (documentData) => {
    setIsGeneratingPdf(true);
    setPdfError(null);

    const d = documentData.data || {};
    const payload = {
      type: 'dsp03',
      data: {
        nomor_referensi: d.nomor_referensi || d.ref_ba || documentData.ref_number || 'BA-PMS/TI/DAOP1/10-2026/0014',
        tanggal: d.tanggal || documentData.tanggal || new Date().toISOString().split('T')[0],
        lokasi: d.lokasi || documentData.lokasi || 'Kantor Pusat Bandung',
        nama_pelaksana: d.nama_pelaksana || documentData.nama_pelaksana || 'Petugas TI',
        nipp_pelaksana: d.nipp_pelaksana || documentData.nipp_pelaksana || '-',
        jabatan_pelaksana: d.jabatan_pelaksana || documentData.jabatan_pelaksana || 'Pelaksana TI',
        status_kondisi: d.status_kondisi || documentData.status_kondisi || 'Dimusnahkan',
        saksi: Array.isArray(d.saksi) ? d.saksi.join(', ') : (d.saksi || documentData.saksi || ''),
        verifikator_1_id: d.verifikator_1_id ? Number(d.verifikator_1_id) : null,
        verifikator_2_id: d.verifikator_2_id ? Number(d.verifikator_2_id) : null,
      },
      items: (documentData.items && documentData.items.length > 0) ? documentData.items.map(it => ({
        nama_barang: it.nama_barang || it.nama_aset || 'Aset TI',
        jumlah: Number(it.jumlah) || 1,
        serial_nomor: it.serial_nomor || '-',
        no_inventaris: it.no_inventaris || '-',
        lokasi_aset: it.lokasi_aset || d.lokasi || '-',
        keterangan: it.keterangan || '-',
      })) : (d.items || []).map(it => ({
        nama_barang: it.nama_barang || it.nama_aset || 'Aset TI',
        jumlah: Number(it.jumlah) || 1,
        serial_nomor: it.serial_nomor || '-',
        no_inventaris: it.no_inventaris || '-',
        lokasi_aset: it.lokasi_aset || d.lokasi || '-',
        keterangan: it.keterangan || '-',
      })),
    };

    try {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
        setPdfBlobUrl(null);
      }

      let blob = null;
      // Jika dokumen sudah ada di database, ambil PDF resmi langsung dari endpoint GET /documents/{id}/pdf
      // agar seluruh stempel TTE yang sudah disetujui otomatis tertempel di file PDF
      if (documentData?.id && !isNaN(Number(documentData.id))) {
        try {
          blob = await api.getDocumentPdfBlob(documentData.id);
        } catch (fetchErr) {
          console.warn('Gagal memuat PDF dokumen tersimpan, mencoba endpoint draf preview-pdf:', fetchErr);
        }
      }

      if (!blob) {
        blob = await api.previewPdf(payload);
      }

      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
    } catch (err) {
      console.error('Gagal menghasilkan pratinjau PDF dari backend:', err);
      setPdfError(err.message || 'Gagal menghasilkan pratinjau PDF dari backend.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      // 1. Load users for resolving approvers
      let usersList = [];
      try {
        const uRes = await api.getApprovers('all=1').catch(() => null);
        usersList = Array.isArray(uRes) ? uRes : (uRes?.data || []);
        setApiUsers(usersList);
      } catch (err) {
        console.warn('Failed to load users list:', err);
      }

      // 2. Fetch document from backend
      let foundDoc = null;
      try {
        const res = await api.getDocument(id);
        const apiData = res?.document || res;
        if (apiData && (apiData.id || apiData.number)) {
          foundDoc = apiData;
        }
      } catch (err) {
        console.warn('API getDocument failed:', err);
      }

      if (foundDoc) {
        setDoc(foundDoc);
        await generateBackendPdfPreview(foundDoc);
      } else {
        setErrorMessage('Dokumen Penghapusan Aset TI tidak ditemukan di sistem.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Gagal memuat data dokumen');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [id]);

  // Clean print handler
  const handlePrintDocument = () => {
    if (iframeRef.current) {
      try {
        iframeRef.current.contentWindow.print();
      } catch {
        window.print();
      }
    } else {
      window.print();
    }
  };

  // Sign / Approve Action
  const handleApproveAction = async (e) => {
    e.preventDefault();
    setSignError(null);

    // Strict validation
    if (signatureMode === 'draw' && !hasDrawnSignature) {
      setSignError('Harap bubuhkan goresan tanda tangan Anda pada kanvas terlebih dahulu.');
      return;
    }
    if (signatureMode === 'upload' && !selectedSignatureFile) {
      setSignError('Harap pilih berkas gambar tanda tangan (PNG/JPG) Anda.');
      return;
    }
    if (signatureMode === 'saved' && !hasServerSignature) {
      setSignError('Akun Anda belum memiliki tanda tangan tersimpan. Pilih tab Goresan atau Unggah.');
      return;
    }

    if (!pinInput || pinInput.length < 4) {
      setSignError('PIN KAI Pass minimal 4 digit.');
      return;
    }

    setIsSigning(true);
    try {
      // 1. Simpan tanda tangan baru jika user memilih goresan kanvas atau upload berkas
      if (signatureMode === 'draw' && canvasRef.current) {
        const dataUrl = canvasRef.current.toDataURL('image/png');
        const resBlob = await fetch(dataUrl);
        const blob = await resBlob.blob();
        const formData = new FormData();
        formData.append('signature', blob, 'signature.png');
        await api.uploadSignature(formData);
      } else if (signatureMode === 'upload' && selectedSignatureFile) {
        const formData = new FormData();
        formData.append('signature', selectedSignatureFile);
        await api.uploadSignature(formData);
      }

      // 2. Eksekusi pengesahan: jika masih draft, submit dokumen; jika sedang in_review, approve persetujuan
      if (isDraft) {
        const v1Id = d.verifikator_1_id || doc?.data?.verifikator_1_id;
        await api.submitDocument(id, {
          approver_id: Number(v1Id),
          note: notesInput || 'Mengajukan formulir penghapusan aset TI.',
        });
        setSuccessMessage('Formulir berhasil disahkan oleh pelaksana dan diajukan ke Verifikator I!');
      } else {
        const res = await api.actionDocument(id, {
          action: 'approve',
          notes: notesInput || 'Disetujui dan disahkan secara digital via TTE KAI Pass.',
          pin: pinInput,
        });
        setSuccessMessage(res.message || 'Persetujuan dan tanda tangan elektronik berhasil dibubuhkan!');
      }

      setIsSignModalOpen(false);

      if (onDocumentUpdated) onDocumentUpdated();
      await loadData();
    } catch (err) {
      console.error('Sign error:', err);
      setSignError(err.message || 'Gagal memproses pengesahan tanda tangan.');
    } finally {
      setIsSigning(false);
    }
  };

  // Reject Action
  const handleRejectAction = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      alert('Alasan penolakan / revisi wajib diisi.');
      return;
    }

    setIsRejecting(true);
    try {
      const res = await api.actionDocument(id, {
        action: 'reject',
        notes: rejectReason,
      });
      setSuccessMessage(res.message || 'Dokumen berhasil ditolak / dikembalikan untuk revisi.');
      setIsRejectModalOpen(false);

      if (onDocumentUpdated) onDocumentUpdated();
      await loadData();
    } catch (err) {
      alert(err.message || 'Gagal menolak dokumen.');
    } finally {
      setIsRejecting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto py-20 text-center">
        <Loader2 className="w-10 h-10 text-[#0b2046] animate-spin mx-auto mb-4" />
        <h3 className="text-base font-bold text-slate-800">Memuat Formulir Penghapusan Aset TI...</h3>
        <p className="text-xs text-slate-500 mt-1">Mengambil dokumen resmi dan memverifikasi sertifikat TTE</p>
      </div>
    );
  }

  if (errorMessage && !doc) {
    return (
      <div className="w-full max-w-3xl mx-auto py-16 px-4">
        <div className="bg-white p-8 rounded-2xl border border-rose-200 text-center shadow-sm">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-800">Gagal Membuka Dokumen</h2>
          <p className="text-sm text-slate-600 mt-2">{errorMessage}</p>
          <button
            type="button"
            onClick={() => navigate('/penghapusan')}
            className="mt-6 px-5 py-2.5 bg-[#0b2046] text-white text-xs font-bold rounded-xl"
          >
            Kembali ke Daftar Formulir
          </button>
        </div>
      </div>
    );
  }

  const d = doc?.data || {};
  const docNumber = doc?.number || doc?.nomor || `FR-PH/TI/000${doc?.id}/2026`;
  const refNumber = d.nomor_referensi || d.ref_ba || '-';
  const docDate = d.tanggal || doc?.submitted_at || doc?.created_at;
  const formattedDate = docDate
    ? new Date(docDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    : '-';

  const isApproved = doc?.status === 'approved' || doc?.status === 'signed';
  const isDraft = doc?.status === 'draft';
  const isRejected = doc?.status === 'rejected';

  // Check if current user is the pending approver
  const currentPendingApproverId = doc?.penyetuju_id;
  const isCurrentApprover = Boolean(
    user && currentPendingApproverId && Number(user.id) === Number(currentPendingApproverId)
  );
  const canApprove = isCurrentApprover || (user?.role === 'super_admin' && !isApproved && !isDraft);

  // Status Approver Steps
  const v1User = apiUsers.find(u => Number(u.id) === Number(d.verifikator_1_id));
  const v2User = apiUsers.find(u => Number(u.id) === Number(d.verifikator_2_id));

  // Determine current step index
  const approvalChain = [d.verifikator_1_id, d.verifikator_2_id].filter(Boolean);
  let currentStepIdx = 0;
  if (currentPendingApproverId && approvalChain.length > 0) {
    const idx = approvalChain.findIndex(aid => Number(aid) === Number(currentPendingApproverId));
    if (idx !== -1) currentStepIdx = idx;
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20">
      {/* Toast Alert */}
      {successMessage && (
        <div className="fixed top-5 right-5 z-50 p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2.5 shadow-xl animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="ml-3 text-emerald-600 hover:text-emerald-900"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Info Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={() => navigate('/penghapusan')}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-600 transition-colors shadow-2xs mt-1"
            title="Kembali ke Daftar Formulir"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 font-bold text-xs rounded border border-blue-200">
                DSP-03 &bull; FR.SM/TI/015.007/10-2020
              </span>
              <span className="text-xs text-slate-400">Versi: 02-2020</span>
              {isApproved && (
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Sah &amp; Disetujui Penuh</span>
                </span>
              )}
              {!isApproved && !isDraft && (
                <span className="px-2.5 py-0.5 bg-orange-50 text-orange-700 font-bold text-xs rounded-full border border-orange-200 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Dalam Proses Verifikasi</span>
                </span>
              )}
              {isDraft && (
                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-full border border-slate-300 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Draf Formulir</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-[#0b2046] mt-1.5 flex items-center gap-3">
              {docNumber}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
              <span>No. Ref: <strong className="text-slate-700">{refNumber}</strong></span>
              <span>&bull;</span>
              <span>Tanggal: <strong className="text-slate-700">{formattedDate}</strong></span>
              <span>&bull;</span>
              <span>Pelaksana: <strong className="text-slate-700">{d.nama_pelaksana || doc?.requester?.name || 'Petugas TI'}</strong></span>
              <span>&bull;</span>
              <span>Lokasi: <strong className="text-slate-700">{d.lokasi || '-'}</strong></span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
          <button
            type="button"
            onClick={loadData}
            disabled={isGeneratingPdf}
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl transition-colors shadow-2xs"
            title="Segarkan Dokumen"
          >
            <RefreshCw className={`w-4 h-4 ${isGeneratingPdf ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handlePrintDocument}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors shadow-2xs"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Cetak Dokumen</span>
          </button>

          {pdfBlobUrl && (
            <a
              href={pdfBlobUrl}
              download={`Formulir_Penghapusan_Aset_TI_${docNumber}.pdf`}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
            >
              <Download className="w-4 h-4" />
              <span>Unduh PDF Resmi</span>
            </a>
          )}

          {isDraft && (
            <>
              <button
                type="button"
                onClick={() => navigate(`/penghapusan/${doc.id}/edit`)}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
              >
                <Edit3 className="w-4 h-4" />
                <span>Ubah Draf</span>
              </button>
              <button
                type="button"
                onClick={() => setIsSignModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#f05a22] hover:bg-[#d94a18] text-white rounded-xl text-xs font-bold transition-colors shadow-sm shadow-[#f05a22]/30"
              >
                <ShieldCheck className="w-4 h-4 text-white" />
                <span>Tanda Tangani &amp; Ajukan</span>
              </button>
            </>
          )}

          {canApprove && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold transition-colors shadow-2xs"
              >
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Tolak / Revisi</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSignModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#f05a22] hover:bg-[#d94a18] text-white rounded-xl text-xs font-bold transition-colors shadow-sm shadow-[#f05a22]/30"
              >
                <ShieldCheck className="w-4 h-4 text-white" />
                <span>Beri Persetujuan &amp; TTE</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs View */}
      <div className="flex border-b border-slate-200 bg-white px-6 pt-3 rounded-t-2xl shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab('pdf')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold transition-all ${
            activeTab === 'pdf'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Pratinjau Dokumen PDF Resmi (DSP-03)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold transition-all ${
            activeTab === 'audit'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Alur Verifikasi TTE &amp; Saksi</span>
        </button>
      </div>

      {/* TAB 1: PDF VIEWER */}
      {activeTab === 'pdf' && (
        <div className="bg-white rounded-b-2xl border-x border-b border-slate-200 p-6 shadow-xs">
          <div className="w-full h-[850px] bg-slate-100 rounded-xl border border-slate-200 overflow-hidden relative">
            {isGeneratingPdf && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-2xs flex flex-col items-center justify-center z-10">
                <Loader2 className="w-8 h-8 text-[#0b2046] animate-spin mb-3" />
                <p className="text-sm font-bold text-slate-800">Menghasilkan Dokumen PDF dari Server...</p>
                <p className="text-xs text-slate-500 mt-1">Mengintegrasikan stempel tanda tangan resmi dan metadata dokumen</p>
              </div>
            )}

            {pdfError ? (
              <div className="p-8 text-center max-w-md mx-auto my-20 bg-white rounded-2xl border border-rose-200 shadow-sm">
                <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
                <h4 className="font-bold text-base text-slate-800">Gagal Merender PDF</h4>
                <p className="text-xs text-slate-500 mt-2">{pdfError}</p>
                <button
                  type="button"
                  onClick={() => generateBackendPdfPreview(doc)}
                  className="mt-5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                >
                  Coba Muat Ulang
                </button>
              </div>
            ) : pdfBlobUrl ? (
              <iframe
                ref={iframeRef}
                src={pdfBlobUrl}
                title="Pratinjau PDF DSP-03"
                className="w-full h-full border-none"
              />
            ) : null}
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT & ALUR VERIFIKASI */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-b-2xl border-x border-b border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-[#0b2046]">Daftar Penandatangan Dokumen DSP-03</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Alur penandatanganan berantai dari pelaksana, verifikator penyetuju, pejabat yang mengetahui, hingga saksi
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Pelaksana (Dilakukan) */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Dilakukan</span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[11px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Pelaksana</span>
                </span>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#0b2046]">{d.nama_pelaksana || 'Petugas Pelaksana TI'}</h4>
                <p className="text-xs text-slate-500 font-mono">NIPP: {d.nipp_pelaksana || '-'}</p>
                <p className="text-xs text-slate-600">{d.jabatan_pelaksana || 'Pelaksana TI'}</p>
              </div>
              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                <span>Lokasi: {d.lokasi || '-'}</span>
              </div>
            </div>

            {/* 2. Verifikator 1 (Disetujui) */}
            <div className={`p-5 rounded-2xl border space-y-3 ${
              isApproved || currentStepIdx > 0
                ? 'border-emerald-200 bg-emerald-50/30'
                : 'border-slate-200 bg-slate-50/60'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Disetujui</span>
                {isApproved || currentStepIdx > 0 ? (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[11px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Disetujui</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-800 border border-orange-200 rounded text-[11px] font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Menunggu</span>
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#0b2046]">
                  {v1User ? (v1User.nama || v1User.name) : 'Pejabat Penyetuju (Verifikator I)'}
                </h4>
                <p className="text-xs text-slate-500 font-mono">NIPP: {v1User?.nip || '-'}</p>
                <p className="text-xs text-slate-600">
                  {v1User ? (typeof v1User.jabatan === 'object' ? v1User.jabatan?.nama : (v1User.jabatan || 'Penyetuju')) : 'Verifikator I'}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                <span>Tahap 1 Verifikasi TTE</span>
              </div>
            </div>

            {/* 3. Verifikator 2 (Mengetahui) */}
            <div className={`p-5 rounded-2xl border space-y-3 ${
              isApproved
                ? 'border-emerald-200 bg-emerald-50/30'
                : 'border-slate-200 bg-slate-50/60'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Mengetahui</span>
                {isApproved ? (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[11px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Mengetahui</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-300 rounded text-[11px] font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>Tahap 2</span>
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#0b2046]">
                  {v2User ? (v2User.nama || v2User.name) : 'Pejabat Mengetahui (Verifikator II)'}
                </h4>
                <p className="text-xs text-slate-500 font-mono">NIPP: {v2User?.nip || '-'}</p>
                <p className="text-xs text-slate-600">
                  {v2User ? (typeof v2User.jabatan === 'object' ? v2User.jabatan?.nama : (v2User.jabatan || 'Pimpinan Unit')) : 'Verifikator II'}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                <span>Tahap 2 Pengesahan Akhir</span>
              </div>
            </div>
          </div>

          {/* Saksi Box */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span>Saksi - Saksi Penghapusan Aset</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {Array.isArray(d.saksi)
                ? d.saksi.join(', ')
                : (d.saksi || 'Belum ada data saksi tercatat.')}
            </p>
          </div>
        </div>
      )}

      {/* MODAL TTE PERSARATAN PENGESAHAN */}
      {isSignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 max-h-[90vh]">
            <div className="px-6 py-4 bg-[#0b2046] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Pengesahan TTE Formulir Penghapusan Aset TI</span>
                </h3>
                <p className="text-xs text-slate-300 font-mono mt-0.5">{docNumber}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsSignModalOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApproveAction} className="p-6 overflow-y-auto space-y-4 flex-1">
              {signError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{signError}</span>
                </div>
              )}

              {/* Signature Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Bentuk Tanda Tangan Elektronik <span className="text-rose-500">*</span>
                </label>
                <SignatureSelector
                  mode={signatureMode}
                  setMode={setSignatureMode}
                  signatureMode={signatureMode}
                  setSignatureMode={setSignatureMode}
                  canvasRef={canvasRef}
                  hasDrawn={hasDrawnSignature}
                  setHasDrawn={setHasDrawnSignature}
                  hasDrawnSignature={hasDrawnSignature}
                  setHasDrawnSignature={setHasDrawnSignature}
                  selectedFile={selectedSignatureFile}
                  setSelectedFile={setSelectedSignatureFile}
                  selectedSignatureFile={selectedSignatureFile}
                  setSelectedSignatureFile={setSelectedSignatureFile}
                  hasServerSignature={hasServerSignature}
                  serverSignatureUrl={serverSignatureUrl}
                  user={user}
                />
              </div>

              {/* PIN KAI Pass */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  PIN Otorisasi KAI Pass <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    maxLength={8}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="Masukkan 6 digit PIN KAI Pass"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 tracking-widest font-mono"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Default PIN simulasi: 123456</p>
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Verifikasi / Disposisi
                </label>
                <textarea
                  rows={2}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Catatan persetujuan..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsSignModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSigning}
                  className="px-5 py-2.5 bg-[#f05a22] hover:bg-[#d94a18] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm shadow-[#f05a22]/30"
                >
                  {isSigning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mengesahkan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Sahkan &amp; Tandatangani</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REJECT */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-rose-700 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                <span>Tolak / Kembalikan Formulir Penghapusan</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRejectAction} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alasan Penolakan / Catatan Revisi <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Jelaskan alasan penolakan atau bagian yang harus direvisi oleh pelaksana..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
                  required
                />
              </div>

              <div className="pt-2 flex items-center gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isRejecting}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2"
                >
                  {isRejecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      <span>Kirim Penolakan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
