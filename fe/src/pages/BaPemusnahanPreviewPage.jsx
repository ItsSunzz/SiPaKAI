import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  FileCheck2,
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
  FileText,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { api, fallbackDocuments } from '../services/api';
import SignatureSelector from '../components/SignatureSelector';

export default function BaPemusnahanPreviewPage({ user, onDocumentUpdated }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [doc, setDoc] = useState(null);
  const [apiUsers, setApiUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [activeTab, setActiveTab] = useState('pdf');

  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const iframeRef = useRef(null);

  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [notesInput, setNotesInput] = useState('Disetujui dan diverifikasi sesuai fisik barang.');
  const [pinInput, setPinInput] = useState('123456');
  const [isSigning, setIsSigning] = useState(false);
  const [signError, setSignError] = useState(null);

  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);
  const [selectedSignatureFile, setSelectedSignatureFile] = useState(null);
  const [signatureMode, setSignatureMode] = useState('draw');
  const [hasServerSignature, setHasServerSignature] = useState(false);
  const [serverSignatureUrl, setServerSignatureUrl] = useState('');

  useEffect(() => {
    if (user?.has_signature || user?.signature_path) {
      setHasServerSignature(true);
      setServerSignatureUrl(api.getSignatureUrl(true));
      setSignatureMode('saved');
    } else {
      setSignatureMode('draw');
    }
  }, [user]);

  const sampleDocFallback = {
    id: 101,
    number: 'BA-PMS/TI/DAOP1/10-2026/0014',
    type: 'dsp02',
    data: {
      nomor_referensi: 'PMH/0001/X/2026',
      business_area: 'DAOP 1 Jakarta',
      tanggal_pelaksanaan: '2026-10-21',
      waktu_pelaksanaan: '10:30',
      lokasi: 'Workshop TI Balai Yasa Manggarai',
      konfirmasi_backup: true,
      verifikator_1_id: null,
      verifikator_2_id: null,
      verifikator_3_id: null,
      verifikator_4_id: null,
    },
    items: [
      {
        nama_aset: 'Hard Disk Enterprise SAS 600GB (15k RPM)',
        jenis_aset: 'Penyimpanan (Storage)',
        id_aset: 'AST-TI-2018-0912',
        jumlah: 8,
        satuan: 'Unit',
        metode_pemusnahan: 'Degaussing magnetik',
        keterangan: 'Degaussed magnetik & piringan hancur shredder',
      }
    ],
    status: 'draft',
    status_label: 'Draf Berita Acara',
  };

  const generateBackendPdfPreview = async (documentData) => {
    setIsGeneratingPdf(true);
    setPdfError(null);

    const d = documentData.data || {};
    const payload = {
      type: 'dsp02',
      data: {
        nomor_referensi: d.nomor_referensi || d.nomor_dsp01 || documentData.ref_number || documentData.number || 'PMH/0001/X/2026',
        business_area: d.business_area || documentData.wilayah || documentData.requester?.unit_kerja || 'Kantor Pusat Bandung',
        tanggal_pelaksanaan: d.tanggal_pelaksanaan || documentData.tanggal_pelaksanaan || new Date().toISOString().split('T')[0],
        waktu_pelaksanaan: d.waktu_pelaksanaan || documentData.waktu_pelaksanaan || '10:00',
        lokasi: d.lokasi || documentData.lokasi || 'Workshop TI Balai Yasa Manggarai',
        konfirmasi_backup: d.konfirmasi_backup ?? true,
        verifikator_1_id: d.verifikator_1_id ? Number(d.verifikator_1_id) : null,
        verifikator_2_id: d.verifikator_2_id ? Number(d.verifikator_2_id) : null,
        verifikator_3_id: d.verifikator_3_id ? Number(d.verifikator_3_id) : null,
        verifikator_4_id: d.verifikator_4_id ? Number(d.verifikator_4_id) : null,
      },
      items: (documentData.items && documentData.items.length > 0) ? documentData.items.map(it => ({
        nama_aset: it.nama_aset || it.nama,
        jenis_aset: it.jenis_aset || it.kategori || 'Perangkat Keras',
        id_aset: it.id_aset || it.no_inventaris || '-',
        jumlah: Number(it.jumlah) || 1,
        satuan: it.satuan || 'Unit',
        metode_pemusnahan: it.metode_pemusnahan || 'Penghancuran fisik',
        keterangan: it.keterangan || it.hasil_pemusnahan || 'Dimusnahkan',
      })) : sampleDocFallback.items,
    };

    try {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
        setPdfBlobUrl(null);
      }

      let blob = null;
      if (documentData?.id && !isNaN(Number(documentData.id))) {
        try {
          blob = await api.getDocumentPdfBlob(documentData.id);
        } catch (fetchErr) {
          console.warn('Gagal memuat PDF dokumen tersimpan:', fetchErr);
        }
      }

      if (!blob) {
        blob = await api.previewPdf(payload);
      }

      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
    } catch (err) {
      console.error('Gagal menghasilkan pratinjau PDF:', err);
      setPdfError(err.message || 'Gagal menghasilkan pratinjau PDF dari backend.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      let usersList = [];
      try {
        const uRes = await api.getApprovers('all=1').catch(() => null);
        usersList = Array.isArray(uRes) ? uRes : (uRes?.data || []);
        setApiUsers(usersList);
      } catch (err) {
        console.warn('Failed to load users list:', err);
      }

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

      if (!foundDoc) {
        const localSaved = JSON.parse(localStorage.getItem('sipakai_dsp02_docs') || '[]');
        const match = localSaved.find(d => String(d.id) === String(id));
        foundDoc = match || sampleDocFallback;
      }

      setDoc(foundDoc);
      await generateBackendPdfPreview(foundDoc);

      if (new URLSearchParams(location.search).get('print') === 'true') {
        setTimeout(() => handlePrintPdf(), 800);
      }
    } catch (e) {
      setDoc(sampleDocFallback);
      await generateBackendPdfPreview(sampleDocFallback);
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
  }, [id, location.search]);

  const handleDownloadPdf = () => {
    if (!pdfBlobUrl) return;
    const a = document.createElement('a');
    a.href = pdfBlobUrl;
    a.download = `BAP-DSP02-${(doc?.number || 'Dokumen-Draft').replace(/[/\\?%*:|"<>]/g, '-')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrintPdf = () => {
    if (iframeRef.current) {
      try {
        iframeRef.current.contentWindow.print();
      } catch (e) {
        window.print();
      }
    } else {
      window.print();
    }
  };

  const handleExecuteSign = async () => {
    if (!pinInput || pinInput.length < 6) {
      setSignError('Masukkan 6-digit PIN KAI Pass Anda.');
      return;
    }

    if (signatureMode === 'draw' && !hasDrawnSignature) {
      setSignError('Silakan goreskan tanda tangan pada bidang kanvas terlebih dahulu.');
      return;
    } else if (signatureMode === 'upload' && !selectedSignatureFile) {
      setSignError('Silakan pilih berkas gambar tanda tangan.');
      return;
    } else if (signatureMode === 'saved' && !hasServerSignature) {
      setSignError('Akun Anda belum memiliki tanda tangan tersimpan.');
      return;
    }

    setIsSigning(true);
    setSignError(null);

    try {
      if (signatureMode === 'draw' && hasDrawnSignature && canvasRef.current) {
        const blob = await new Promise((resolve) => {
          canvasRef.current.toBlob(resolve, 'image/png');
        });
        if (blob) {
          const formData = new FormData();
          formData.append('signature', blob, 'signature_draw.png');
          formData.append('signature_type', 'basah');
          formData.append('pin', pinInput.trim());
          await api.uploadSignature(formData);
          setHasServerSignature(true);
          setServerSignatureUrl(api.getSignatureUrl(true));
        }
      } else if (signatureMode === 'upload' && selectedSignatureFile) {
        const formData = new FormData();
        formData.append('signature', selectedSignatureFile);
        formData.append('signature_type', 'basah');
        formData.append('pin', pinInput.trim());
        await api.uploadSignature(formData);
        setHasServerSignature(true);
        setServerSignatureUrl(api.getSignatureUrl(true));
      }

      const res = await api.actionDocument(doc.id, {
        action: 'approve',
        notes: notesInput.trim() || 'Disetujui dan ditandatangani secara elektronik (BSrE).',
        pin: pinInput.trim(),
        next_approver_id: null,
      });

      setIsSignModalOpen(false);
      setSuccessMessage(res?.message || 'Tanda Tangan Elektronik berhasil dibubuhkan!');
      setTimeout(() => setSuccessMessage(null), 5000);

      await loadData();
      if (onDocumentUpdated) onDocumentUpdated();
    } catch (err) {
      console.error('Gagal memproses tanda tangan:', err);
      setSignError(err.message || 'Validasi tanda tangan gagal.');
    } finally {
      setIsSigning(false);
    }
  };

  // LOADING AWAL DENGAN ANIMASI KERETA MELINTAS
  if (loading || !doc) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500 gap-4 select-none">
        <div className="relative w-40 h-16 flex items-center justify-center overflow-hidden bg-orange-50/50 rounded-2xl border border-orange-200/60 shadow-inner">
          <div className="animate-train-pass flex flex-col items-center text-[#f05a22]">
            <svg className="w-12 h-8" viewBox="0 0 100 64" fill="currentColor">
              <path d="M12 14 C12 14 30 12 55 12 C75 12 85 22 92 34 C95 40 92 48 84 48 L16 48 C12 48 12 44 12 40 Z" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M56 18 C56 18 72 20 80 34 C82 38 78 42 74 42 L56 42 Z" fill="currentColor" opacity="0.7"/>
              <path d="M6 54 L94 54" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
              <line x1="22" y1="50" x2="26" y2="58" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
              <line x1="42" y1="50" x2="46" y2="58" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
              <line x1="62" y1="50" x2="66" y2="58" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
              <line x1="82" y1="50" x2="86" y2="58" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
        <p className="text-xs font-bold text-slate-700 tracking-wide">
          Menyiapkan Perjalanan Dokumen &amp; Pratinjau PDF...
        </p>
      </div>
    );
  }

  const data = doc.data || {};
  const rawStatus = (doc.status || data.status || 'draft').toLowerCase();
  const isApproved = rawStatus === 'approved' || rawStatus === 'signed' || rawStatus === 'selesai';
  const isPending = !isApproved && (rawStatus === 'in_review' || rawStatus === 'pending' || rawStatus.includes('menunggu'));
  const isDraft = !isApproved && !isPending;

  const v1User = apiUsers.find(u => Number(u.id) === Number(data.verifikator_1_id)) || doc.requester || data.pelaksana || { name: 'Ahmad Fauzi Setiawan', nip: '54892' };
  const v2User = apiUsers.find(u => Number(u.id) === Number(data.verifikator_2_id)) || data.saksi_1 || { name: 'Pengelola Aset TI', nip: '41920' };
  const v3User = apiUsers.find(u => Number(u.id) === Number(data.verifikator_3_id)) || data.saksi_2 || { name: 'Atasan Pengguna Aset', nip: '62104' };
  const v4User = apiUsers.find(u => Number(u.id) === Number(data.verifikator_4_id)) || data.penanggung_jawab || { name: 'Ir. Bambang Suryo Pratama, M.T.', nip: '48901' };

  const currentApproverId = doc.current_approver_id || doc.penyetuju_id;
  const isCurrentApprover = Boolean(user?.id && currentApproverId && Number(user.id) === Number(currentApproverId));
  const canAct = isPending && isCurrentApprover;

  const chain = doc.data?.approval_chain || [
    doc.data?.verifikator_1_id,
    doc.data?.verifikator_2_id,
    doc.data?.verifikator_3_id,
    doc.data?.verifikator_4_id,
  ].filter(Boolean);

  const currentStepIndex = chain.findIndex(id => Number(id) === Number(currentApproverId));
  const currentStepNumber = currentStepIndex !== -1 ? currentStepIndex + 1 : 1;
  const currentApproverUser = apiUsers.find(u => Number(u.id) === Number(currentApproverId));
  const approvalsList = doc.approvals || doc.persetujuan || [];

  const getStepStatus = (vUser, stepIdx) => {
    if (!vUser?.id) return { isSigned: false, isCurrent: false, label: 'Belum Ditentukan' };
    const isSigned = isApproved || approvalsList.some(a => 
      Number(a.approver_id || a.user_id) === Number(vUser.id) && 
      (a.action === 'approved' || a.action === 'APPROVED' || a.aksi === 'approved')
    );
    if (isSigned) return { isSigned: true, isCurrent: false, label: 'TTE Selesai (Sah)' };
    if (isPending && Number(currentApproverId) === Number(vUser.id)) {
      return { isSigned: false, isCurrent: true, label: isCurrentApprover ? 'Giliran Anda (Aktif)' : 'Sedang Diproses' };
    }
    return { isSigned: false, isCurrent: false, label: 'Antrean Tahap ' + (stepIdx + 1) };
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-5 pb-24 select-none">
      {successMessage && (
        <div className="fixed top-5 right-5 z-50 p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs font-semibold">{successMessage}</span>
          <button type="button" onClick={() => setSuccessMessage(null)} className="text-emerald-700 ml-2 cursor-pointer">✕</button>
        </div>
      )}

      {/* Top Bar Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/berita-acara-pemusnahan')}
            className="p-2.5 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 text-slate-600 transition-colors shadow-2xs cursor-pointer"
            title="Kembali ke Daftar"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-[#003580]/10 text-[#003580] border border-[#003580]/20 font-mono">
                DSP-02 &bull; PRATINJAU RESMI PDF
              </span>
              <span className="text-xs font-mono font-bold text-slate-700">#{doc.number}</span>
              {isDraft && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                  Draf (Pratinjau Langsung dari Backend)
                </span>
              )}
              {isApproved && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  Disetujui Penuh (Sah)
                </span>
              )}
            </div>
            <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight mt-1">
              Pratinjau Berita Acara Pemusnahan Aset TI
            </h1>
          </div>
        </div>

        {/* Tab & Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('pdf')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'pdf' ? 'bg-white text-[#f05a22] shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Pratinjau PDF Resmi</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'audit' ? 'bg-white text-[#003580] shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Alur Verifikasi TTE</span>
            </button>
          </div>

          {isDraft && (
            <button
              type="button"
              onClick={() => navigate(`/berita-acara-pemusnahan/${doc.id}/edit`)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Draf</span>
            </button>
          )}

          {isPending && canAct && (
            <button
              type="button"
              onClick={() => setIsSignModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#f05a22] hover:bg-[#d94e1b] text-white text-xs font-bold rounded-xl shadow-xs transition-colors animate-pulse cursor-pointer"
            >
              <PenTool className="w-4 h-4" />
              <span>Tandatangani Tahap {currentStepNumber} (TTE e-Sign)</span>
            </button>
          )}

          {isPending && !canAct && (
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50/80 border border-amber-200 text-amber-800 text-xs font-bold rounded-xl">
              <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
              <span>Menunggu TTE: {currentApproverUser?.name ? `${currentApproverUser.name} (Tahap ${currentStepNumber})` : `Tahap ${currentStepNumber}`}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={!pdfBlobUrl}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-200" />
            <span>Unduh PDF</span>
          </button>

          <button
            type="button"
            onClick={handlePrintPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#003580] hover:bg-[#092653] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-sky-400" />
            <span>Cetak</span>
          </button>
        </div>
      </div>

      {/* VIEW UTAMA: PRATINJAU PDF RESMI */}
      {activeTab === 'pdf' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[84vh] relative">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap justify-between items-center text-xs font-semibold text-slate-700 shrink-0 gap-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-orange-100/70 text-[#f05a22]">
                <FileText className="w-4 h-4" />
              </span>
              <div>
                <span className="font-bold text-slate-900">
                  Pratinjau Dokumen PDF Resmi Backend (DSP-02)
                </span>
                <span className="hidden sm:inline-block ml-2 px-2 py-0.5 rounded bg-blue-50 text-[#003580] text-[10px] font-bold border border-blue-200">
                  Engine DomPDF Backend &bull; Draf Tanpa Tersimpan di Database
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => generateBackendPdfPreview(doc)}
                disabled={isGeneratingPdf}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#003580] ${isGeneratingPdf ? 'animate-spin' : ''}`} />
                <span>Segarkan</span>
              </button>

              {pdfBlobUrl && (
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Simpan PDF Asli</span>
                </button>
              )}
            </div>
          </div>

          {/* Frame PDF DENGAN LOADING ANIMASI KERETA MELINTAS */}
          <div className="flex-1 relative w-full h-full bg-slate-100 flex items-center justify-center overflow-hidden">
            {isGeneratingPdf && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-50/95 backdrop-blur-2xs z-20 text-slate-700">
                <div className="relative w-44 h-16 flex items-center justify-center overflow-hidden bg-orange-50/70 rounded-2xl border border-orange-200 shadow-sm">
                  <div className="animate-train-pass flex flex-col items-center text-[#f05a22]">
                    <svg className="w-12 h-8" viewBox="0 0 100 64" fill="currentColor">
                      <path d="M12 14 C12 14 30 12 55 12 C75 12 85 22 92 34 C95 40 92 48 84 48 L16 48 C12 48 12 44 12 40 Z" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M56 18 C56 18 72 20 80 34 C82 38 78 42 74 42 L56 42 Z" fill="currentColor" opacity="0.7"/>
                      <path d="M6 54 L94 54" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
                      <line x1="22" y1="50" x2="26" y2="58" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                      <line x1="42" y1="50" x2="46" y2="58" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                      <line x1="62" y1="50" x2="66" y2="58" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                      <line x1="82" y1="50" x2="86" y2="58" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs font-bold text-slate-800">
                    Merender Dokumen PDF Kereta Api (DSP-02)...
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Menghasilkan lembar resmi dsp02.blade.php secara on-the-fly dari backend
                  </p>
                </div>
              </div>
            )}

            {pdfError ? (
              <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl max-w-md text-center space-y-3 m-4">
                <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
                <h3 className="text-sm font-bold text-rose-900">Gagal Memuat Pratinjau PDF Backend</h3>
                <p className="text-xs text-rose-700">{pdfError}</p>
                <button
                  type="button"
                  onClick={() => generateBackendPdfPreview(doc)}
                  className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer"
                >
                  Coba Muat Ulang
                </button>
              </div>
            ) : pdfBlobUrl ? (
              <iframe
                ref={iframeRef}
                src={pdfBlobUrl}
                title="Pratinjau PDF Berita Acara Backend"
                className="w-full h-full border-0 bg-white"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 text-slate-500 text-xs">
                <div className="relative w-36 h-14 flex items-center justify-center overflow-hidden bg-blue-50/60 rounded-xl border border-blue-200">
                  <div className="animate-train-pass flex flex-col items-center text-[#003580]">
                    <svg className="w-10 h-7" viewBox="0 0 100 64" fill="currentColor">
                      <path d="M12 14 C12 14 30 12 55 12 C75 12 85 22 92 34 C95 40 92 48 84 48 L16 48 C12 48 12 44 12 40 Z" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M56 18 C56 18 72 20 80 34 C82 38 78 42 74 42 L56 42 Z" fill="currentColor" opacity="0.7"/>
                      <path d="M6 54 L94 54" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
                      <line x1="22" y1="50" x2="26" y2="58" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                      <line x1="42" y1="50" x2="46" y2="58" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                      <line x1="62" y1="50" x2="66" y2="58" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                      <line x1="82" y1="50" x2="86" y2="58" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
                <span>Menghubungkan ke layanan render PDF backend...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW KEDUA: ALUR VERIFIKASI TTE 4 PIHAK */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">Alur Verifikasi TTE &amp; Riwayat Pengesahan 4 Pihak</h2>
            <p className="text-xs text-slate-500 mt-0.5">Audit log integritas dokumen Berita Acara Pemusnahan Aset TI (DSP-02)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {(() => {
              const s1 = getStepStatus(v1User, 0);
              const s2 = getStepStatus(v2User, 1);
              const s3 = getStepStatus(v3User, 2);
              const s4 = getStepStatus(v4User, 3);

              return (
                <>
                  <div className={`p-4 rounded-xl border transition-all ${
                    s1.isSigned ? 'bg-emerald-50/70 border-emerald-300' :
                    s1.isCurrent ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/40 shadow-xs' :
                    'bg-slate-50/70 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-mono">
                        Tahap 1
                      </span>
                      {s1.isSigned ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Clock className={`w-4 h-4 ${s1.isCurrent ? 'text-amber-600 animate-spin' : 'text-slate-400'}`} />}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">Tim Pemusnahan / Admin</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 truncate">{v1User?.name}</p>
                    <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded ${
                      s1.isSigned ? 'bg-emerald-100 text-emerald-800' :
                      s1.isCurrent ? 'bg-amber-100 text-amber-800 animate-pulse' :
                      'bg-slate-200 text-slate-600'
                    }`}>
                      {s1.label}
                    </span>
                  </div>

                  <div className={`p-4 rounded-xl border transition-all ${
                    s2.isSigned ? 'bg-emerald-50/70 border-emerald-300' :
                    s2.isCurrent ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/40 shadow-xs' :
                    'bg-slate-50/70 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-mono">
                        Tahap 2
                      </span>
                      {s2.isSigned ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Clock className={`w-4 h-4 ${s2.isCurrent ? 'text-amber-600 animate-spin' : 'text-slate-400'}`} />}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">Pengelola Aset</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 truncate">{v2User?.name}</p>
                    <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded ${
                      s2.isSigned ? 'bg-emerald-100 text-emerald-800' :
                      s2.isCurrent ? 'bg-amber-100 text-amber-800 animate-pulse' :
                      'bg-slate-200 text-slate-600'
                    }`}>
                      {s2.label}
                    </span>
                  </div>

                  <div className={`p-4 rounded-xl border transition-all ${
                    s3.isSigned ? 'bg-emerald-50/70 border-emerald-300' :
                    s3.isCurrent ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/40 shadow-xs' :
                    'bg-slate-50/70 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-mono">
                        Tahap 3
                      </span>
                      {s3.isSigned ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Clock className={`w-4 h-4 ${s3.isCurrent ? 'text-amber-600 animate-spin' : 'text-slate-400'}`} />}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">Atasan Pengguna Aset</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 truncate">{v3User?.name}</p>
                    <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded ${
                      s3.isSigned ? 'bg-emerald-100 text-emerald-800' :
                      s3.isCurrent ? 'bg-amber-100 text-amber-800 animate-pulse' :
                      'bg-slate-200 text-slate-600'
                    }`}>
                      {s3.label}
                    </span>
                  </div>

                  <div className={`p-4 rounded-xl border transition-all ${
                    s4.isSigned ? 'bg-emerald-50/70 border-emerald-300' :
                    s4.isCurrent ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/40 shadow-xs' :
                    'bg-slate-50/70 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-mono">
                        Tahap 4
                      </span>
                      {s4.isSigned ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Clock className={`w-4 h-4 ${s4.isCurrent ? 'text-amber-600 animate-spin' : 'text-slate-400'}`} />}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">VP IT Operation</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 truncate">{v4User?.name}</p>
                    <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded ${
                      s4.isSigned ? 'bg-emerald-100 text-emerald-800' :
                      s4.isCurrent ? 'bg-amber-100 text-amber-800 animate-pulse' :
                      'bg-slate-200 text-slate-600'
                    }`}>
                      {s4.label}
                    </span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Modal Tandatangani (TTE e-Sign) */}
      {isSignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <PenTool className="w-5 h-5 text-[#f05a22]" />
                <h3 className="font-bold text-sm text-slate-900">Tanda Tangan Elektronik (TTE)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSignModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {signError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                {signError}
              </div>
            )}

            <div className="space-y-3">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-[#003580] text-white font-mono">
                    Tahap {currentStepNumber} dari {chain.length || 4}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                    Giliran Anda Aktif
                  </span>
                </div>
                <div className="font-bold text-slate-900 mt-1">{user?.name}</div>
                <div className="text-[11px] text-slate-600">
                  NIP: {user?.nip || '-'} &bull; {typeof user?.jabatan === 'object' ? user?.jabatan?.nama : (user?.jabatan || 'Pejabat Otorisator')}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Telaah Disposisi
                </label>
                <input
                  type="text"
                  placeholder="Catatan verifikasi..."
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#003580]"
                />
              </div>

              <SignatureSelector
                mode={signatureMode}
                setMode={setSignatureMode}
                canvasRef={canvasRef}
                hasDrawn={hasDrawnSignature}
                setHasDrawn={setHasDrawnSignature}
                selectedFile={selectedSignatureFile}
                setSelectedFile={setSelectedSignatureFile}
                hasServerSignature={hasServerSignature}
                serverSignatureUrl={serverSignatureUrl}
                user={user}
              />

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  PIN Otorisasi KAI Pass (6-Digit)
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold tracking-widest text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#003580]"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsSignModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteSign}
                disabled={isSigning}
                className="px-4 py-2 bg-[#f05a22] hover:bg-[#d94e1b] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {isSigning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Bubuhkan TTE Sah</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}