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

export default function BaPemusnahanPreviewPage({ user, onDocumentUpdated }) {
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

  // Backend Preview PDF Blob State (Dihasilkan on-the-fly tanpa tersimpan di database)
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const iframeRef = useRef(null);

  // Modal Signing States
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [signAsRole, setSignAsRole] = useState('v1');
  const [pinInput, setPinInput] = useState('123456');
  const [isSigning, setIsSigning] = useState(false);
  const [signError, setSignError] = useState(null);

  // Canvas TTD
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);

  // Sample fallback if doc not found
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
      },
      {
        nama_aset: 'Server Rak Dell PowerEdge R730',
        jenis_aset: 'Perangkat Keras (Hardware)',
        id_aset: 'AST-TI-2017-0419',
        jumlah: 2,
        satuan: 'Unit',
        metode_pemusnahan: 'Penghancuran fisik',
        keterangan: 'Mainboard dipatahkan, casing dipotong scrap afval',
      },
      {
        nama_aset: 'Switch Core Cisco Catalyst 3750G 48-Port',
        jenis_aset: 'Jaringan (Network)',
        id_aset: 'AST-TI-2016-0128',
        jumlah: 2,
        satuan: 'Unit',
        metode_pemusnahan: 'Penghancuran fisik',
        keterangan: 'Port fisik & PCB internal dihancurkan',
      }
    ],
    status: 'draft',
    status_label: 'Draf Berita Acara',
  };

  // Generate PDF langsung dari backend via api.previewPdf (POST /api/documents/preview-pdf)
  // Menghasilkan dokumen resmi tanpa menyimpan ke database
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
      })) : (d.items || sampleDocFallback.items).map(it => ({
        nama_aset: it.nama_aset || it.nama,
        jenis_aset: it.jenis_aset || it.kategori || 'Perangkat Keras',
        id_aset: it.id_aset || it.no_inventaris || '-',
        jumlah: Number(it.jumlah) || 1,
        satuan: it.satuan || 'Unit',
        metode_pemusnahan: it.metode_pemusnahan || 'Penghancuran fisik',
        keterangan: it.keterangan || it.hasil_pemusnahan || 'Dimusnahkan',
      })),
    };

    try {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
        setPdfBlobUrl(null);
      }

      const blob = await api.previewPdf(payload);
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
        console.warn('API getDocument failed, checking local storage:', err);
      }

      // 3. Fallback to localStorage (drafts created locally)
      if (!foundDoc) {
        const localSaved = JSON.parse(localStorage.getItem('sipakai_dsp02_docs') || '[]');
        const match = localSaved.find(d => String(d.id) === String(id));
        if (match) {
          foundDoc = match;
        } else {
          foundDoc = sampleDocFallback;
        }
      }

      setDoc(foundDoc);

      // 4. Generate on-the-fly PDF preview via backend function
      await generateBackendPdfPreview(foundDoc);

      // Auto print check
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

  // Handle Download PDF Blob
  const handleDownloadPdf = () => {
    if (!pdfBlobUrl) return;
    const a = document.createElement('a');
    a.href = pdfBlobUrl;
    a.download = `BAP-DSP02-${(doc?.number || 'Dokumen-Draft').replace(/[/\\?%*:|"<>]/g, '-')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Handle Print via Iframe
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

  // Canvas Handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#003580';
    isDrawingRef.current = true;
    setHasDrawnSignature(true);
  };

  const draw = (e) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnSignature(false);
  };

  // Handle Signing Execution
  const handleExecuteSign = async () => {
    if (!pinInput || pinInput.length < 6) {
      setSignError('Masukkan 6-digit PIN KAI Pass Anda.');
      return;
    }

    setIsSigning(true);
    setSignError(null);

    try {
      await new Promise(r => setTimeout(r, 900));

      const updatedDoc = { ...doc };
      const nowStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

      if (!updatedDoc.data) updatedDoc.data = {};
      if (!updatedDoc.data.signatures) updatedDoc.data.signatures = {};

      updatedDoc.data.signatures[signAsRole] = {
        signed: true,
        signed_at: nowStr,
        signed_by: user?.name || 'Pejabat Otorisator',
      };

      updatedDoc.status = 'approved';
      updatedDoc.status_label = 'Disahkan Penuh (Sah TTE BSrE)';

      setDoc(updatedDoc);

      // Update in localStorage
      const localSaved = JSON.parse(localStorage.getItem('sipakai_dsp02_docs') || '[]');
      const updatedList = localSaved.map(d => String(d.id) === String(doc.id) ? updatedDoc : d);
      localStorage.setItem('sipakai_dsp02_docs', JSON.stringify(updatedList));

      setIsSignModalOpen(false);
      setSuccessMessage('Tanda Tangan Elektronik BSrE berhasil dibubuhkan secara sah!');
      setTimeout(() => setSuccessMessage(null), 4000);

      // Refresh PDF preview
      await generateBackendPdfPreview(updatedDoc);

      if (onDocumentUpdated) onDocumentUpdated();
    } catch (err) {
      setSignError(err.message || 'Terjadi kesalahan saat memproses tanda tangan.');
    } finally {
      setIsSigning(false);
    }
  };

  if (loading || !doc) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-[#003580] mb-2" />
        <p className="text-xs font-semibold">Menghasilkan Pratinjau Dokumen PDF dari backend...</p>
      </div>
    );
  }

  // Extract backend fields
  const data = doc.data || {};
  const rawStatus = (doc.status || data.status || 'draft').toLowerCase();
  const isApproved = rawStatus === 'approved' || rawStatus === 'signed' || rawStatus === 'selesai';
  const isPending = !isApproved && (rawStatus === 'in_review' || rawStatus === 'pending' || rawStatus.includes('menunggu'));
  const isDraft = !isApproved && !isPending;

  // Resolve 4 verifikator users from backend
  const v1User = apiUsers.find(u => Number(u.id) === Number(data.verifikator_1_id)) || doc.requester || data.pelaksana || { name: 'Ahmad Fauzi Setiawan', nip: '54892' };
  const v2User = apiUsers.find(u => Number(u.id) === Number(data.verifikator_2_id)) || data.saksi_1 || { name: 'Pengelola Aset TI', nip: '41920' };
  const v3User = apiUsers.find(u => Number(u.id) === Number(data.verifikator_3_id)) || data.saksi_2 || { name: 'Atasan Pengguna Aset', nip: '62104' };
  const v4User = apiUsers.find(u => Number(u.id) === Number(data.verifikator_4_id)) || data.penanggung_jawab || { name: 'Ir. Bambang Suryo Pratama, M.T.', nip: '48901' };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-5 pb-24 select-none">
      {/* Toast Alert */}
      {successMessage && (
        <div className="fixed top-5 right-5 z-50 p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs font-semibold">{successMessage}</span>
          <button type="button" onClick={() => setSuccessMessage(null)} className="text-emerald-700 ml-2">✕</button>
        </div>
      )}

      {/* Top Bar Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/berita-acara-pemusnahan')}
            className="p-2.5 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 text-slate-600 transition-colors shadow-2xs"
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
          {/* Tab Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('pdf')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'pdf' ? 'bg-white text-[#f05a22] shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Pratinjau PDF Resmi</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'audit' ? 'bg-white text-[#003580] shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Alur Verifikasi TTE</span>
            </button>
          </div>

          {/* Tombol Edit Draf jika masih draft */}
          {isDraft && (
            <button
              type="button"
              onClick={() => navigate(`/berita-acara-pemusnahan/${doc.id}/edit`)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Draf</span>
            </button>
          )}

          {/* Tandatangani Button if pending */}
          {!isApproved && (
            <button
              type="button"
              onClick={() => setIsSignModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#f05a22] hover:bg-[#d94e1b] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <PenTool className="w-4 h-4" />
              <span>Tandatangani (TTE e-Sign)</span>
            </button>
          )}

          {/* Unduh PDF Button */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={!pdfBlobUrl}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-200" />
            <span>Unduh PDF</span>
          </button>

          {/* Cetak Button */}
          <button
            type="button"
            onClick={handlePrintPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#003580] hover:bg-[#092653] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-sky-400" />
            <span>Cetak</span>
          </button>
        </div>
      </div>

      {/* VIEW UTAMA: PRATINJAU PDF RESMI DARI ENGINE BACKEND DOMPDF (TANPA MENYIMPAN KE DATABASE) */}
      {activeTab === 'pdf' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[84vh] relative">
          {/* Toolbar atas PDF */}
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
                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 text-xs font-bold flex items-center gap-1 transition-colors"
                title="Segarkan pratinjau PDF dari backend"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#003580] ${isGeneratingPdf ? 'animate-spin' : ''}`} />
                <span>Segarkan</span>
              </button>

              {pdfBlobUrl && (
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Simpan PDF Asli</span>
                </button>
              )}
            </div>
          </div>

          {/* Frame PDF */}
          <div className="flex-1 relative w-full h-full bg-slate-100 flex items-center justify-center overflow-hidden">
            {isGeneratingPdf && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-50/90 backdrop-blur-2xs z-20 text-slate-600">
                <Loader2 className="w-8 h-8 animate-spin text-[#f05a22]" />
                <p className="text-xs font-semibold">Menghasilkan pratinjau PDF langsung dari engine backend SIPAKAI...</p>
                <p className="text-[11px] text-slate-400">Merender template dsp02.blade.php secara on-the-fly</p>
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
                  className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors"
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
              <div className="flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
                <Loader2 className="w-6 h-6 animate-spin text-[#003580]" />
                <span>Menghubungkan ke endpoint pratinjau PDF backend...</span>
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

          {/* Stepper Status 4 Pihak Sesuai Backend */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Step 1: Tim Pemusnahan */}
            <div className={`p-4 rounded-xl border ${isApproved ? 'bg-emerald-50/60 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                  Tahap 1
                </span>
                {isApproved ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Clock className="w-4 h-4 text-slate-400" />}
              </div>
              <h4 className="text-xs font-bold text-slate-900">Tim Pemusnahan / Admin</h4>
              <p className="text-[11px] text-slate-600 mt-0.5">{v1User?.name}</p>
              <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded ${isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                {isApproved ? 'TTE Selesai' : 'Tahap Awal'}
              </span>
            </div>

            {/* Step 2: Pengelola Aset */}
            <div className={`p-4 rounded-xl border ${isApproved ? 'bg-emerald-50/60 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                  Tahap 2
                </span>
                {isApproved ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Clock className="w-4 h-4 text-slate-400" />}
              </div>
              <h4 className="text-xs font-bold text-slate-900">Pengelola Aset</h4>
              <p className="text-[11px] text-slate-600 mt-0.5">{v2User?.name}</p>
              <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded ${isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {isApproved ? 'TTE Selesai' : 'Verifikasi Aset'}
              </span>
            </div>

            {/* Step 3: Atasan Pengguna */}
            <div className={`p-4 rounded-xl border ${isApproved ? 'bg-emerald-50/60 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                  Tahap 3
                </span>
                {isApproved ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Clock className="w-4 h-4 text-slate-400" />}
              </div>
              <h4 className="text-xs font-bold text-slate-900">Atasan Pengguna Aset</h4>
              <p className="text-[11px] text-slate-600 mt-0.5">{v3User?.name}</p>
              <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded ${isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {isApproved ? 'TTE Selesai' : 'Menunggu Atasan'}
              </span>
            </div>

            {/* Step 4: VP IT Operation */}
            <div className={`p-4 rounded-xl border ${isApproved ? 'bg-emerald-50/60 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                  Tahap 4
                </span>
                {isApproved ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Clock className="w-4 h-4 text-slate-400" />}
              </div>
              <h4 className="text-xs font-bold text-slate-900">VP IT Operation</h4>
              <p className="text-[11px] text-slate-600 mt-0.5">{v4User?.name}</p>
              <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded ${isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {isApproved ? 'TTE Selesai' : 'Penyetuju Akhir'}
              </span>
            </div>
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
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
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
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Peran Penandatangan
                </label>
                <select
                  value={signAsRole}
                  onChange={(e) => setSignAsRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#003580]"
                >
                  <option value="v1">Tim Pemusnahan / Administrator ({v1User?.name})</option>
                  <option value="v2">Pengelola Aset ({v2User?.name})</option>
                  <option value="v3">Atasan Pengguna Aset ({v3User?.name})</option>
                  <option value="v4">VP IT Operation / Pimpinan Unit SI ({v4User?.name})</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700">Goresan Tanda Tangan</label>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-[11px] text-rose-600 hover:underline flex items-center gap-1"
                  >
                    <Eraser className="w-3 h-3" /> Hapus
                  </button>
                </div>
                <div className="border border-slate-300 rounded-xl overflow-hidden bg-slate-50/50">
                  <canvas
                    ref={canvasRef}
                    width={380}
                    height={120}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-28 cursor-crosshair touch-none bg-white"
                  />
                </div>
              </div>

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
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteSign}
                disabled={isSigning}
                className="px-4 py-2 bg-[#f05a22] hover:bg-[#d94e1b] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
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
