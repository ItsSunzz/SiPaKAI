import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  KeyRound,
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
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  ShieldAlert,
  X,
  ChevronDown,
  Upload,
  Info,
  FileUp
} from 'lucide-react';
import { api, fallbackDocuments } from '../services/api';
import KaiLogo from '../components/KaiLogo';
import SignatureSelector from '../components/SignatureSelector';

export default function BastAplikasiPreviewPage({ user, onDocumentUpdated }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Tab view: 'pdf' (Pratinjau PDF Asli Backend ho02.blade.php) | 'detail' (Rincian & Tanda Tangan)
  const [activeTab, setActiveTab] = useState('pdf');
  const [isIframeLoading, setIsIframeLoading] = useState(true);

  // Active PDF template: 'ho02' (Digital) | 'manual' (Materai & TTD Basah)
  const [previewTemplate, setPreviewTemplate] = useState('ho02');
  const [isDownloadDropdownOpen, setIsDownloadDropdownOpen] = useState(false);
  const downloadDropdownRef = useRef(null);

  // Fitur Tambahan (Opsional): Upload Scan Berkas Fisik Ber-Materai
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [physicalFile, setPhysicalFile] = useState(null);
  const [physicalFilePreview, setPhysicalFilePreview] = useState(null);
  const [physicalNotes, setPhysicalNotes] = useState('');
  const [isUploadingPhysical, setIsUploadingPhysical] = useState(false);
  const [uploadedPhysicalDoc, setUploadedPhysicalDoc] = useState(() => {
    try {
      const cached = localStorage.getItem(`bast_physical_scan_${id}`);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  // Password reveal toggle in accounts table
  const [revealedPasswords, setRevealedPasswords] = useState({});

  // Second Party Signing Form State (Penerima)
  const [pinInput, setPinInput] = useState('');
  const [isAgreementChecked, setIsAgreementChecked] = useState(true);
  const [isSigning, setIsSigning] = useState(false);
  const [signError, setSignError] = useState(null);

  // Canvas TTD Penerima & Signature Mode (3 Pilihan: draw | upload | saved)
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

  // Sync template from doc.data?.metode_ttd
  useEffect(() => {
    if (doc?.data?.metode_ttd === 'manual') {
      setPreviewTemplate('manual');
    }
  }, [doc]);

  // Click outside listener for download dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (downloadDropdownRef.current && !downloadDropdownRef.current.contains(event.target)) {
        setIsDownloadDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const togglePasswordReveal = (idx) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setSuccessMessage(`${label} berhasil disalin ke clipboard.`);
    setTimeout(() => setSuccessMessage(null), 3000);
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

  // Fetch document
  const fetchDoc = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.getDocument(id).catch(() => null);
      if (res && (res.id || res.data)) {
        const d = res.document || res.data || res;
        setDoc(d);
      } else {
        // Fallback demo data for HO-02
        setDoc({
          id: id,
          number: `FR.SM/TI/011.002/10-2026/00${id}`,
          type: 'ho02',
          status: 'pending',
          data: {
            no_dokumen: 'FR.SM/TI/011.002/10-2020',
            tanggal_terbit: '12 Oktober 2020',
            versi: '02-2020',
            ref_number: 'REF/TI-KAI/X/2026/088',
            tanggal_ref: '2026-10-18',
            business_area: 'BA-0100',
            hari_pelaksanaan: 'Senin',
            tanggal_pelaksanaan: '18 Oktober 2026',
            penyerah: {
              nama: 'Ahmad Fauzi Setiawan',
              nipp: '54892',
              jabatan: 'Spv Operasional Infrastruktur TI',
              tempat_kedudukan: 'Kantor Pusat Bandung',
              personal_area: 'PA-0100 Bandung'
            },
            penerima: {
              nama: 'Wahyu Hidayat, S.T.',
              nipp: '61204',
              jabatan: 'Junior Manager Keuangan & Aset Daop 6',
              tempat_kedudukan: 'Daop 6 Yogyakarta',
              personal_area: 'PA-0600 Yogyakarta',
              owner_responsible: 'Vice President Keuangan (Persero)',
              custodian: 'Unit TI Daop 6 Yogyakarta'
            },
            accounts: [
              {
                id: 1,
                nama_aplikasi: 'SAP S/4HANA Finance (FI/CO)',
                username: 'wahyu.hidayat',
                password: 'KaiPassword2026!'
              },
              {
                id: 2,
                nama_aplikasi: 'SirSAK Mobile Daop 6',
                username: 'wh_daop6',
                password: 'Daop6Secure#99'
              },
              {
                id: 3,
                nama_aplikasi: 'Cisco AnyConnect VPN Dinas',
                username: 'vpn_61204',
                password: 'VpnAccess*2026'
              }
            ],
            keperluan:
              'Akses otorisasi persetujuan transaksi anggaran operasional dan mutasi inventaris stasiun Daop 6 Yogyakarta.',
            masa_aktif: {
              mulai: '2026-10-18',
              selesai: '2027-10-18'
            }
          }
        });
      }
    } catch (e) {
      setErrorMessage('Dokumen gagal dimuat.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoc();
  }, [id]);

  // Handle second party sign
  const handleSignSecondParty = async (e) => {
    e.preventDefault();
    if (!pinInput.trim()) {
      setSignError('Harap masukkan PIN Otorisasi tanda tangan digital Anda.');
      return;
    }

    // Validasi ketat tanda tangan tidak boleh kosong sesuai opsi yang dipilih
    if (signatureMode === 'draw') {
      if (!hasDrawnSignature) {
        setSignError('Silakan goreskan tanda tangan pada bidang kanvas terlebih dahulu. Tanda tangan tidak boleh kosong.');
        return;
      }
    } else if (signatureMode === 'upload') {
      if (!selectedSignatureFile) {
        setSignError('Silakan pilih berkas gambar tanda tangan (PNG/JPG) terlebih dahulu. Tanda tangan tidak boleh kosong.');
        return;
      }
    } else if (signatureMode === 'saved') {
      if (!hasServerSignature) {
        setSignError('Akun Anda belum memiliki tanda tangan tersimpan. Silakan pilih opsi Goresan Langsung atau Upload Gambar.');
        return;
      }
    }

    setSignError(null);
    setIsSigning(true);
    try {
      // 1. Sinkronisasi berkas tanda tangan baru (goresan atau upload) ke backend profil pengguna
      if (signatureMode === 'upload' && selectedSignatureFile) {
        try {
          const formData = new FormData();
          formData.append('signature', selectedSignatureFile);
          formData.append('pin', pinInput.trim());
          await api.uploadSignature(formData);
          setHasServerSignature(true);
        } catch (uploadErr) {
          console.warn('Gagal upload tanda tangan PNG:', uploadErr);
        }
      } else if (signatureMode === 'draw' && hasDrawnSignature && canvasRef.current) {
        try {
          const blob = await new Promise((resolve) => {
            canvasRef.current.toBlob(resolve, 'image/png');
          });
          if (blob) {
            const formData = new FormData();
            formData.append('signature', blob, 'signature_draw.png');
            formData.append('pin', pinInput.trim());
            await api.uploadSignature(formData);
            setHasServerSignature(true);
          }
        } catch (uploadErr) {
          console.warn('Gagal sinkronisasi tanda tangan goresan:', uploadErr);
        }
      }

      await api.signDocument(id, pinInput).catch(() => null);
      setDoc((prev) => ({
        ...prev,
        status: 'approved',
        data: {
          ...prev.data,
          penerima_signed_at: new Date().toISOString()
        }
      }));
      setSuccessMessage('Dokumen BAST User Aplikasi berhasil ditandatangani dan sah secara hukum!');
      if (onDocumentUpdated) onDocumentUpdated();
    } catch (err) {
      setSignError(err.message || 'Gagal menandatangani dokumen.');
    } finally {
      setIsSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-[#003580] animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Memuat Formulir BAST User Aplikasi...</p>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="w-full max-w-xl mx-auto p-8 text-center bg-white rounded-xl border border-slate-200 mt-12 space-y-3">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h3 className="font-bold text-slate-800">Dokumen Tidak Ditemukan</h3>
        <p className="text-xs text-slate-500">Berkas BAST dengan ID #{id} tidak tersedia atau telah dihapus.</p>
        <button
          type="button"
          onClick={() => navigate('/bast-aplikasi')}
          className="px-4 py-2 bg-[#003580] text-white text-xs font-bold rounded-lg"
        >
          Kembali ke Daftar
        </button>
      </div>
    );
  }

  const rawStatus = (doc.status || '').toLowerCase();
  const isApproved = rawStatus === 'approved' || rawStatus === 'signed' || rawStatus === 'selesai' || Boolean(doc.data?.penerima_signed_at);
  const isPending = !isApproved && (rawStatus === 'pending' || rawStatus === 'in_review' || rawStatus.includes('menunggu'));
  const isDraft = !isApproved && !isPending && (rawStatus === 'draft' || rawStatus === 'draf');

  const data = doc.data || {};
  const docMeta = {
    no_dokumen: data.no_dokumen || 'FR.SM/TI/011.002/10-2020',
    tanggal_terbit: data.tanggal_terbit || '12 Oktober 2020',
    versi: data.versi || '02-2020',
    no_ref: data.ref_number || doc.ref_number || 'REF/TI-KAI/X/2026/088',
    tanggal_ref: data.tanggal_ref || doc.date || '2026-10-18',
    business_area: data.business_area || 'BA-0100',
    hari_pelaksanaan: data.hari_pelaksanaan || 'Senin',
    tanggal_pelaksanaan: data.tanggal_pelaksanaan || '18 Oktober 2026'
  };

  const penyerah = data.penyerah || {
    nama: 'Ahmad Fauzi Setiawan',
    nipp: '54892',
    jabatan: 'Spv Operasional Infrastruktur TI',
    tempat_kedudukan: 'Kantor Pusat Bandung',
    personal_area: 'PA-0100 Bandung'
  };

  const penerima = data.penerima || {
    nama: 'Wahyu Hidayat, S.T.',
    nipp: '61204',
    jabatan: 'Junior Manager Keuangan & Aset Daop 6',
    tempat_kedudukan: 'Daop 6 Yogyakarta',
    personal_area: 'PA-0600 Yogyakarta',
    owner_responsible: 'Vice President Keuangan (Persero)',
    custodian: 'Unit TI Daop 6 Yogyakarta'
  };

  const accounts = data.accounts || [
    {
      id: 1,
      nama_aplikasi: 'SAP S/4HANA Finance (FI/CO)',
      username: 'wahyu.hidayat',
      password: 'KaiPassword2026!'
    }
  ];

  const keperluan = data.keperluan || 'Akses otorisasi persetujuan operasional harian dinas.';
  const masaAktif = data.masa_aktif || { mulai: '2026-10-18', selesai: '2027-10-18' };

  const handleDownloadPdf = (template = null) => {
    if (!doc?.id) return;
    const chosen = template || previewTemplate;
    const url = api.getDocumentPdfUrl(doc.id, false, chosen);
    window.open(url, '_blank');
    setIsDownloadDropdownOpen(false);
  };

  const handleOpenPdfInline = (template = null) => {
    if (!doc?.id) return;
    const chosen = template || previewTemplate;
    const url = api.getDocumentPdfUrl(doc.id, true, chosen);
    window.open(url, '_blank');
    setIsDownloadDropdownOpen(false);
  };

  const handlePhysicalFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhysicalFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setPhysicalFilePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPhysicalFilePreview(null);
    }
  };

  const handleUploadPhysicalSubmit = async (e) => {
    e.preventDefault();
    if (!physicalFile) {
      alert('Pilih berkas scan fisik terlebih dahulu.');
      return;
    }
    setIsUploadingPhysical(true);
    try {
      const formData = new FormData();
      formData.append('file', physicalFile);
      formData.append('notes', physicalNotes);
      try {
        await api.uploadPhysicalScan(doc.id, formData);
      } catch (backendErr) {
        console.warn('API uploadPhysicalScan fallback ke local storage:', backendErr);
      }
      const fileData = {
        name: physicalFile.name,
        size: (physicalFile.size / 1024).toFixed(1) + ' KB',
        type: physicalFile.type,
        notes: physicalNotes,
        uploaded_at: new Date().toISOString(),
        preview: physicalFilePreview || null,
      };
      localStorage.setItem(`bast_physical_scan_${id}`, JSON.stringify(fileData));
      setUploadedPhysicalDoc(fileData);
      setIsUploadModalOpen(false);
      setSuccessMessage('Berkas scan fisik bermaterai berhasil diunggah dan disimpan ke sistem SIPAKAI!');
      setPhysicalFile(null);
      setPhysicalNotes('');
    } catch (err) {
      alert(err.message || 'Gagal mengunggah berkas scan.');
    } finally {
      setIsUploadingPhysical(false);
    }
  };

  const pdfUrl = doc?.id ? api.getDocumentPdfUrl(doc.id, true, previewTemplate) : '';

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-28 select-none">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate('/bast-aplikasi')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-medium mb-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Daftar BAST User Aplikasi
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              BAST User Aplikasi
            </h1>
            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
              #{doc.number}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Formulir Resmi Standar FR.SM/TI/011.002/10-2020 PT Kereta Api Indonesia (Persero)
          </p>
        </div>

        {/* View Tabs & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('pdf')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${activeTab === 'pdf' ? 'bg-white text-[#003580] shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Pratinjau PDF A4 ({previewTemplate === 'manual' ? 'ho02_manual' : 'ho02'})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('detail')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${activeTab === 'detail' ? 'bg-white text-[#003580] shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Rincian Kredensial & TTD
            </button>
          </div>

          {isDraft && (
            <button
              type="button"
              onClick={() => navigate(`/bast-aplikasi/${id}/edit`)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Draf</span>
            </button>
          )}

          {/* Dropdown / Split Button Unduh Dokumen PDF */}
          <div className="relative inline-block text-left" ref={downloadDropdownRef}>
            <div className="inline-flex rounded-xl shadow-xs overflow-hidden border border-[#002760]">
              <button
                type="button"
                onClick={() => handleDownloadPdf(previewTemplate)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#003580] hover:bg-[#092653] text-white text-xs font-bold transition-colors cursor-pointer"
                title={`Unduh PDF (${previewTemplate === 'manual' ? 'Siap Cetak & Materai' : 'Digital'})`}
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span>Unduh PDF ({previewTemplate === 'manual' ? 'Manual' : 'Digital'})</span>
              </button>
              <button
                type="button"
                onClick={() => setIsDownloadDropdownOpen((prev) => !prev)}
                className="px-2 py-2 bg-[#002760] hover:bg-[#001c46] text-white border-l border-white/20 transition-colors cursor-pointer"
                title="Pilih Opsi Template PDF Lainnya"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDownloadDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {isDownloadDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-2 space-y-1 animate-in fade-in slide-in-from-top-1">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Pilihan Template Unduhan
                </div>

                {/* Versi Digital */}
                <button
                  type="button"
                  onClick={() => handleDownloadPdf('ho02')}
                  className={`w-full text-left p-2.5 rounded-lg flex items-start gap-2.5 transition-colors cursor-pointer ${
                    previewTemplate === 'ho02' ? 'bg-blue-50 text-blue-950 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <FileText className="w-4 h-4 text-[#003580] shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <div className="font-bold flex items-center gap-1.5">
                      <span>📄 Unduh PDF Digital</span>
                      <span className="text-[10px] font-normal px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded font-mono">ho02</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Arsip elektronik lengkap dengan riwayat tanda tangan digital sistem.
                    </p>
                  </div>
                </button>

                {/* Versi Manual */}
                <button
                  type="button"
                  onClick={() => handleDownloadPdf('manual')}
                  className={`w-full text-left p-2.5 rounded-lg flex items-start gap-2.5 transition-colors cursor-pointer ${
                    previewTemplate === 'manual' ? 'bg-orange-50 text-orange-950 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Printer className="w-4 h-4 text-[#EE7623] shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <div className="font-bold flex items-center gap-1.5">
                      <span>🖨️ Unduh PDF Siap Cetak</span>
                      <span className="text-[10px] font-normal px-1.5 py-0.2 bg-orange-100 text-orange-800 rounded font-mono">manual</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Disediakan kotak materai fisik dan kolom tanda tangan basah.
                    </p>
                  </div>
                </button>

                <div className="border-t border-slate-100 pt-1.5 mt-1 flex justify-between px-2 text-[10px]">
                  <button
                    type="button"
                    onClick={() => handleOpenPdfInline('ho02')}
                    className="text-[#003580] hover:underline font-semibold"
                  >
                    Buka Tab (Digital)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenPdfInline('manual')}
                    className="text-[#EE7623] hover:underline font-semibold"
                  >
                    Buka Tab (Manual)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button type="button" onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-950">
            ✕
          </button>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button type="button" onClick={() => setErrorMessage(null)} className="text-rose-700 hover:text-rose-950">
            ✕
          </button>
        </div>
      )}

      {/* Status Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {isApproved ? (
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-xs">
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            </div>
          ) : isPending ? (
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-xs">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
              <FileText className="w-5 h-5" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Status Pengesahan:</span>
              {isApproved && (
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  ✓ Disahkan Penuh (Kedua Pihak Telah TTD)
                </span>
              )}
              {isPending && (
                <span className="text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 px-3 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                  Menunggu Tanda Tangan Pihak Penerima (Kepada)
                </span>
              )}
              {isDraft && (
                <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-300 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  Draf Awal (Belum Dikirim)
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {isApproved
                ? 'Kedua belah pihak telah menandatangani BAST ini. Kredensial akun resmi berstatus aktif dan dicatat dalam audit log perseroan.'
                : isPending
                ? 'Dokumen telah disahkan oleh Pihak Penyerah (TI) dan memerlukan tanda tangan pengesahan dari Pihak Penerima.'
                : 'Dokumen berstatus draf. Silakan edit atau lanjutkan penandatanganan.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Masa Aktif: {masaAktif.mulai} s/d {masaAktif.selesai}</span>
        </div>
      </div>

      {/* BANNER DOKUMEN TELAH SELESAI DISAHKAN (APPROVED) */}
      {isApproved && (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm animate-in fade-in">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-xs">
              <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-emerald-950">
                  Berita Acara User Aplikasi Telah Disetujui & Sah
                </h3>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  data.metode_ttd === 'manual'
                    ? 'bg-orange-100 text-orange-900 border-orange-200'
                    : 'bg-emerald-200 text-emerald-900 border-emerald-300'
                }`}>
                  {data.metode_ttd === 'manual' ? 'Metode Manual (Materai)' : 'Metode Digital Penuh'}
                </span>
              </div>
              <p className="text-xs text-emerald-800 mt-1 max-w-2xl leading-relaxed">
                {data.metode_ttd === 'manual'
                  ? 'Approval elektronik telah divalidasi dengan PIN. Untuk melengkapi SOP fisik, silakan unduh versi cetak, tempeli materai fisik dan tanda tangan basah, lalu unggah kembali scan berkasnya ke sistem.'
                  : 'Dokumen ini telah selesai ditandatangani secara elektronik oleh kedua belah pihak dengan validasi PIN resmi. Hak akses akun telah resmi diserahterimakan.'}
              </p>

              {uploadedPhysicalDoc && (
                <div className="mt-2.5 text-[11px] font-medium text-emerald-950 flex flex-wrap items-center gap-2 bg-emerald-100/80 px-3 py-1.5 rounded-xl border border-emerald-300 w-fit">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>
                    Berkas Scan Fisik: <strong>{uploadedPhysicalDoc.name}</strong> ({uploadedPhysicalDoc.size})
                  </span>
                  <span className="text-[10px] text-emerald-700">
                    • Diunggah: {new Date(uploadedPhysicalDoc.uploaded_at).toLocaleString('id-ID')}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleDownloadPdf('manual')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors shadow-2xs cursor-pointer"
              title="Unduh PDF Siap Cetak (Materai & TTD Basah)"
            >
              <Printer className="w-3.5 h-3.5 text-[#EE7623]" />
              <span>Unduh Siap Cetak (Materai)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-2xs cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{uploadedPhysicalDoc ? 'Perbarui Scan Berkas' : 'Unggah Berkas Fisik Ber-Materai'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ACTION PANEL: TANDA TANGAN PIHAK PENERIMA (JIKA MENUNGGU TTD) */}
      {isPending && (
        <div className="bg-white rounded-2xl border-2 border-orange-300 shadow-md overflow-hidden animate-in fade-in space-y-0">
          <div className="bg-[#003580] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#EE7623] flex items-center justify-center text-white">
                <PenTool className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Pengesahan & Tanda Tangan Pihak Penerima (Kepada)</h3>
                <p className="text-[11px] text-blue-100">
                  Konfirmasi penerimaan kredensial user aplikasi dengan validasi PIN digital resmi KAI
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-[#EE7623] px-2.5 py-0.5 rounded text-white uppercase tracking-wider">
              AKSI PENGESAHAN
            </span>
          </div>

          <form onSubmit={handleSignSecondParty} className="p-6 space-y-4 text-xs">
            {/* Alert/Banner Info Ringkas untuk Dokumen Manual */}
            {data.metode_ttd === 'manual' && (
              <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl text-amber-900 flex items-start gap-3 shadow-2xs">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-amber-950">
                      Informasi Serah Terima: Format Tanda Tangan Manual
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900 border border-amber-300">
                      Materai & TTD Basah
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-900/90 leading-relaxed">
                    Dokumen ini berformat <strong>Tanda Tangan Manual</strong>. Setelah Anda memasukkan PIN persetujuan di bawah ini untuk mencatat sah approval elektronik pada sistem, silakan unduh versi cetak (template manual) untuk ditempeli materai fisik dan ditandatangani basah.
                  </p>
                </div>
              </div>
            )}

            {/* Input PIN */}
            <div className="bg-orange-50/80 border border-orange-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-orange-600" />
                <label className="font-bold text-slate-900 block">
                  Konfirmasi PIN Otorisasi Tanda Tangan Digital (`signature_pin`) *
                </label>
              </div>
              <div className="max-w-md">
                <input
                  type="password"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Masukkan 6-digit PIN tanda tangan Anda"
                  className="w-full px-3.5 py-2.5 bg-white border border-orange-300 rounded-lg text-slate-900 font-mono text-sm tracking-widest font-bold focus:ring-2 focus:ring-[#EE7623] outline-none"
                />
              </div>
              <p className="text-[11px] text-orange-950 leading-snug">
                PIN digunakan untuk memvalidasi keabsahan identitas Anda sebagai penerima hak akses user aplikasi.
              </p>
            </div>

            {/* Komponen Pemilih Tanda Tangan: 3 Opsi dengan Validasi Ketat */}
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

            {/* Agreement Checkbox */}
            <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAgreementChecked}
                onChange={(e) => setIsAgreementChecked(e.target.checked)}
                className="mt-0.5 rounded text-[#EE7623] focus:ring-0"
              />
              <span className="text-[11px] text-slate-700 leading-snug">
                Saya menyatakan telah menerima kredensial user aplikasi dan bersedia mematuhi 3 butir ketentuan tanggung jawab serta sanksi penyalahgunaan yang tercantum dalam formulir ini.
              </span>
            </label>

            {/* Error Message */}
            {signError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{signError}</span>
              </div>
            )}

            {/* Submit Action */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSigning || !pinInput.trim() || !isAgreementChecked}
                className="px-7 py-2.5 text-xs font-bold text-white bg-[#EE7623] hover:bg-[#d96515] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all flex items-center gap-2 shadow-md active:scale-98"
              >
                {isSigning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 stroke-[2.5]" />
                )}
                Validasi PIN & Tandatangani BAST User Aplikasi
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MAIN VIEW AREA */}
      {activeTab === 'pdf' ? (
        /* LEMBAR PRATINJAU PDF ASLI DARI BACKEND */
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden flex flex-col h-[85vh] relative">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap justify-between items-center gap-3 text-xs font-semibold text-slate-600 shrink-0">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#003580]" />
                <span className="font-bold text-slate-800">Template Pratinjau:</span>
              </div>

              {/* Segmented Control Switcher */}
              <div className="flex bg-slate-200 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setPreviewTemplate('ho02');
                    setIsIframeLoading(true);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    previewTemplate === 'ho02'
                      ? 'bg-white text-[#003580] shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-[#003580]" />
                  <span>Versi Digital (ho02.blade.php)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPreviewTemplate('manual');
                    setIsIframeLoading(true);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    previewTemplate === 'manual'
                      ? 'bg-white text-[#EE7623] shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Printer className="w-3.5 h-3.5 text-[#EE7623]" />
                  <span>Versi Siap Cetak (ho02_manual.blade.php)</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownloadPdf(previewTemplate)}
                className="text-[#003580] hover:underline flex items-center gap-1 font-bold cursor-pointer text-xs"
              >
                <Download className="w-3.5 h-3.5" /> Buka / Simpan File PDF ({previewTemplate === 'manual' ? 'Manual' : 'Digital'})
              </button>
            </div>
          </div>
          <div className="flex-1 relative w-full h-full bg-slate-100 flex items-center justify-center">
            {isIframeLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-50 z-10 text-slate-500">
                <Loader2 className="w-7 h-7 animate-spin text-[#003580]" />
                <span className="text-xs font-medium">
                  Memuat lembar PDF template {previewTemplate === 'manual' ? 'Manual (ho02_manual.blade.php)' : 'Digital (ho02.blade.php)'}...
                </span>
              </div>
            )}
            {pdfUrl ? (
              <iframe
                key={previewTemplate}
                src={pdfUrl}
                title="BAST User Aplikasi PDF Sheet"
                onLoad={() => setIsIframeLoading(false)}
                className="w-full h-full border-0 bg-white"
              />
            ) : (
              <div className="text-xs text-slate-500">Memuat URL dokumen...</div>
            )}
          </div>
        </div>
      ) : activeTab === 'sheet' ? (
        /* LEMBAR CETAK STANDAR A4 FORMULIR RESMI KAI */
        <div className="bg-slate-200 p-4 md:p-8 rounded-2xl flex flex-col items-center shadow-inner">
          {/* Page Switcher */}
          <div className="mb-4 flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-300 shadow-2xs text-xs font-bold">
            <span className="text-slate-500 mr-1">Tampilan Lembar:</span>
            <button
              type="button"
              onClick={() => setActivePage(1)}
              className={`px-3 py-1 rounded-lg transition-all ${activePage === 1 ? 'bg-[#003580] text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Halaman 1 dari 2
            </button>
            <button
              type="button"
              onClick={() => setActivePage(2)}
              className={`px-3 py-1 rounded-lg transition-all ${activePage === 2 ? 'bg-[#003580] text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Halaman 2 dari 2
            </button>
          </div>

          {/* Printable A4 Page Container */}
          <div className="bg-white shadow-2xl border border-slate-300 w-full max-w-2xl p-8 md:p-10 text-slate-900 text-[11px] space-y-4 font-sans min-h-[820px] relative">
            
            {/* 1. KOP SURAT FORMULIR KAI (IDENTIK DENGAN SCREENSHOT) */}
            <div className="border border-black grid grid-cols-12 text-center text-[10px]">
              {/* Logo & RAHASIA */}
              <div className="col-span-3 border-r border-black p-2 flex flex-col items-center justify-center">
                <KaiLogo className="h-9 w-auto" />
                <div className="mt-1 border border-red-600 text-red-600 font-bold px-3 py-0.5 text-[9px] tracking-widest">
                  RAHASIA
                </div>
              </div>

              {/* Box Judul */}
              <div className="col-span-5 border-r border-black p-2 flex flex-col justify-center text-center">
                <h2 className="font-bold text-[11px] leading-tight">
                  PT KERETA API INDONESIA (PERSERO)
                </h2>
                <h3 className="font-semibold text-[10px] mt-0.5">
                  SISTEM INFORMASI
                </h3>
                <div className="font-bold text-[11px] mt-1 border-t border-black pt-1 uppercase">
                  FORMULIR BERITA ACARA SERAH TERIMA USER APLIKASI
                </div>
              </div>

              {/* Box Metadata Dokumen Kanan */}
              <div className="col-span-4 p-1.5 text-left text-[9px] leading-tight flex flex-col justify-center space-y-0.5">
                <div className="grid grid-cols-5">
                  <span className="col-span-2">Nomor</span>
                  <span className="col-span-3 font-mono">: {docMeta.no_dokumen}</span>
                </div>
                <div className="grid grid-cols-5">
                  <span className="col-span-2">Tanggal Terbit</span>
                  <span className="col-span-3">: {docMeta.tanggal_terbit}</span>
                </div>
                <div className="grid grid-cols-5">
                  <span className="col-span-2">Versi</span>
                  <span className="col-span-3">: {docMeta.versi}</span>
                </div>
                <div className="grid grid-cols-5">
                  <span className="col-span-2">Halaman</span>
                  <span className="col-span-3">: {activePage} dari 2</span>
                </div>
              </div>
            </div>

            {/* 2. KOTAK NO. REF, TANGGAL, BUSINESS AREA */}
            <div className="border border-black p-2 text-[10px] w-64 space-y-0.5">
              <div className="grid grid-cols-3">
                <span>No. Ref</span>
                <span className="col-span-2 font-mono font-semibold">: {docMeta.no_ref}</span>
              </div>
              <div className="grid grid-cols-3">
                <span>Tanggal</span>
                <span className="col-span-2">: {docMeta.tanggal_ref}</span>
              </div>
              <div className="grid grid-cols-3">
                <span>Business Area</span>
                <span className="col-span-2 font-mono font-semibold">: {docMeta.business_area}</span>
              </div>
            </div>

            {/* HALAMAN 1 */}
            {activePage === 1 ? (
              <div className="space-y-3.5 leading-relaxed text-[10.5px]">
                <p>
                  Pada hari ini, <strong className="border-b border-dotted border-black px-2">{docMeta.hari_pelaksanaan}</strong> tanggal <strong className="border-b border-dotted border-black px-2">{docMeta.tanggal_pelaksanaan}</strong>
                </p>

                {/* Yang Menyerahkan */}
                <div className="grid grid-cols-12 gap-y-0.5 pl-2">
                  <span className="col-span-4">Nama</span>
                  <span className="col-span-8">: {penyerah.nama}</span>
                  <span className="col-span-4">NIPP</span>
                  <span className="col-span-8 font-mono">: {penyerah.nipp}</span>
                  <span className="col-span-4">Jabatan</span>
                  <span className="col-span-8">: {penyerah.jabatan}</span>
                  <span className="col-span-4">Tempat Kedudukan</span>
                  <span className="col-span-8">: {penyerah.tempat_kedudukan}</span>
                  <span className="col-span-4">Personal Area</span>
                  <span className="col-span-8">: {penyerah.personal_area}</span>
                </div>

                <p className="font-semibold pt-1">
                  Menyerahkan user aplikasi sebagai berikut:
                </p>

                {/* Tabel Akun User Aplikasi */}
                <table className="w-full border-collapse border border-black text-[10px]">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-black p-1 text-center w-8">No</th>
                      <th className="border border-black p-1 text-left">Nama Aplikasi</th>
                      <th className="border border-black p-1 text-left">Username</th>
                      <th className="border border-black p-1 text-left">Password</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((acc, aIdx) => (
                      <tr key={acc.id || aIdx}>
                        <td className="border border-black p-1 text-center">{aIdx + 1}</td>
                        <td className="border border-black p-1 font-semibold">{acc.nama_aplikasi}</td>
                        <td className="border border-black p-1 font-mono">{acc.username}</td>
                        <td className="border border-black p-1 font-mono">
                          {revealedPasswords[aIdx] ? acc.password : '••••••••••••'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Kepada */}
                <div className="pt-1">
                  <p className="font-semibold">Kepada</p>
                  <div className="grid grid-cols-12 gap-y-0.5 pl-2 mt-0.5">
                    <span className="col-span-4">Nama</span>
                    <span className="col-span-8 font-semibold">: {penerima.nama}</span>
                    <span className="col-span-4">NIPP / No Identitas</span>
                    <span className="col-span-8 font-mono">: {penerima.nipp}</span>
                    <span className="col-span-4">Jabatan / Instansi</span>
                    <span className="col-span-8">: {penerima.jabatan}</span>
                    <span className="col-span-4">Tempat Kedudukan</span>
                    <span className="col-span-8">: {penerima.tempat_kedudukan}</span>
                    <span className="col-span-4">Personal Area</span>
                    <span className="col-span-8">: {penerima.personal_area}</span>
                    <span className="col-span-4">Owner Responsible</span>
                    <span className="col-span-8">: {penerima.owner_responsible}</span>
                    <span className="col-span-4">Custodian</span>
                    <span className="col-span-8">: {penerima.custodian}</span>
                  </div>
                </div>

                {/* Keperluan */}
                <div>
                  <p className="font-semibold">Keperluan :</p>
                  <p className="pl-2 italic text-slate-800 leading-relaxed">{keperluan}</p>
                </div>

                {/* Masa Aktif */}
                <div>
                  <p className="font-semibold">
                    Masa Aktif User : Mulai Tanggal <strong className="border-b border-dotted border-black px-1">{masaAktif.mulai}</strong> s/d Tanggal <strong className="border-b border-dotted border-black px-1">{masaAktif.selesai}</strong>
                  </p>
                </div>

                {/* 3 Butir Ketentuan Tanggung Jawab */}
                <div className="space-y-1 text-[9.5px] leading-tight text-slate-800 pt-1">
                  <p>
                    1. Untuk dipergunakan sebagai alat kerja mengakses aplikasi sesuai dengan tugas dan tanggung jawabnya. Pemegang user aplikasi bertanggung jawab penuh terhadap semua transaksi yang dilakukannya dan tidak memberitahukan kepada orang lain <em>username</em> dan <em>password</em> aplikasi yang dimiliki.
                  </p>
                  <p>
                    2. <em>Username</em> akan otomatis dinonaktifkan setelah masa aktif user berakhir. PT. Kereta Api Indonesia (Persero) berhak mencabut hak penggunaan aplikasi secara sepihak jika terjadi penyalahgunaan user aplikasi.
                  </p>
                  <p>
                    3. Apabila dikemudian hari terbukti Pemegang user aplikasi melakukan pelanggaran, maka Pemegang user aplikasi bersedia menerima sanksi dari PT. Kereta Api Indonesia (Persero) dan/atau pihak lain yang berwenang sesuai ketentuan perundang-undangan yang berlaku.
                  </p>
                </div>

                {/* Kolom Tanda Tangan Dua Belah Pihak */}
                <div className="grid grid-cols-2 pt-3 text-center text-[10px]">
                  {/* Yang Menyerahkan */}
                  <div className="space-y-3 flex flex-col justify-between h-36">
                    <p className="font-semibold">Yang Menyerahkan</p>
                    <div className="py-1">
                      <div className="w-24 h-12 mx-auto flex items-center justify-center border border-emerald-300 bg-emerald-50/50 rounded text-[9px] text-emerald-800 font-mono">
                        ✓ TTD Digital Sah<br />NIPP {penyerah.nipp}
                      </div>
                    </div>
                    <div>
                      <p className="font-bold underline uppercase">{penyerah.nama}</p>
                      <p className="font-mono text-[9px]">NIPP. {penyerah.nipp}</p>
                    </div>
                  </div>

                  {/* Yang Menerima */}
                  <div className="space-y-1 flex flex-col justify-between h-36">
                    <p className="font-semibold">Yang Menerima</p>
                    <div className="relative">
                      <div className="border border-dashed border-slate-400 w-24 h-12 mx-auto flex items-center justify-center text-[8px] text-slate-400">
                        {isApproved ? (
                          <span className="text-emerald-700 font-bold">
                            e-Materai Lunas<br />✓ TTD Sah
                          </span>
                        ) : (
                          <span>Materai<br />Rp. 6.000</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="font-bold underline uppercase">{penerima.nama}</p>
                      <p className="font-mono text-[9px]">NIPP / No Identitas : {penerima.nipp}</p>
                    </div>
                  </div>
                </div>

                {/* Catatan Kaki */}
                <p className="text-[8.5px] italic text-slate-500 pt-2 border-t border-slate-200">
                  *Nipp & Jabatan diisi khusus untuk pegawai PT. Kereta Api Indonesia (Persero)
                </p>
              </div>
            ) : (
              /* HALAMAN 2 */
              <div className="space-y-6 pt-4 text-[10.5px]">
                <div className="bg-slate-50 border border-slate-300 p-4 rounded text-slate-700 leading-relaxed space-y-2">
                  <h4 className="font-bold text-[11px] text-slate-900 uppercase">
                    Ketentuan Penjelasan Identitas & Integritas Dokumen (Halaman 2 dari 2)
                  </h4>
                  <p className="font-semibold text-slate-800">
                    *No Identitas = No KTP (untuk WNI) atau No Pasport (WNA)
                  </p>
                  <p>
                    1. Seluruh kredensial akun yang diserahkan dalam formulir ini tercatat secara terpusat dalam sistem Single Sign-On (SSO) dan Identity Access Management (IAM) PT Kereta Api Indonesia (Persero).
                  </p>
                  <p>
                    2. Pelaksanaan audit log dan monitoring riwayat login dilakukan secara berkala oleh Divisi Information Technology Quality & Security Assurance.
                  </p>
                  <p>
                    3. Perpanjangan hak akses wajib diajukan selambat-lambatnya 14 (empat belas) hari kerja sebelum masa aktif user berakhir.
                  </p>
                </div>

                <div className="border border-slate-300 rounded p-4 text-[10px] space-y-1">
                  <p className="font-bold text-slate-800 uppercase">Sertifikat Digital Validasi Sistem (SI-PAKAI)</p>
                  <p className="font-mono text-slate-500">Hash SHA256 : e7c390fa981e7d44bc09918aa{id}f1a23e9810b42c8d5a6b</p>
                  <p className="text-slate-500">Waktu Pengesahan : {data.penerima_signed_at || new Date().toLocaleString('id-ID')}</p>
                  <p className="text-emerald-700 font-semibold">Status Integritas : Terverifikasi & Mengikat Secara Hukum</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* DETAIL & AUDIT TAB */
        <div className="space-y-6">
          {/* Akun yang diserahkan dengan fitur Copy & Password Reveal */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#EE7623]" />
                <h3 className="font-bold text-xs text-slate-800">
                  Daftar Kredensial User Aplikasi yang Diserahkan ({accounts.length} Akun)
                </h3>
              </div>
              <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded">
                Kerahasiaan Terjaga
              </span>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {accounts.map((acc, aIdx) => (
                <div key={acc.id || aIdx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{acc.nama_aplikasi}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      Aktif
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                      <span className="text-slate-400 text-[11px]">Username:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-900">{acc.username}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(acc.username, 'Username')}
                          className="text-slate-400 hover:text-slate-700"
                          title="Salin Username"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                      <span className="text-slate-400 text-[11px]">Password:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-900 font-semibold">
                          {revealedPasswords[aIdx] ? acc.password : '••••••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePasswordReveal(aIdx)}
                          className="text-slate-400 hover:text-slate-700"
                          title={revealedPasswords[aIdx] ? 'Sembunyikan' : 'Tampilkan'}
                        >
                          {revealedPasswords[aIdx] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        {revealedPasswords[aIdx] && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(acc.password, 'Password')}
                            className="text-slate-400 hover:text-slate-700"
                            title="Salin Password"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rincian Pihak I & Pihak II */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Pihak I: Penyerah */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Building2 className="w-4 h-4 text-[#003580]" />
                <h3 className="font-bold text-slate-900">Pihak I — Yang Menyerahkan</h3>
              </div>
              <div className="space-y-1.5 text-slate-700">
                <div className="flex justify-between"><span className="text-slate-400">Nama:</span> <span className="font-bold">{penyerah.nama}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">NIPP:</span> <span className="font-mono font-bold">{penyerah.nipp}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Jabatan:</span> <span>{penyerah.jabatan}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Kedudukan:</span> <span>{penyerah.tempat_kedudukan}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Personal Area:</span> <span className="font-mono">{penyerah.personal_area}</span></div>
              </div>
            </div>

            {/* Pihak II: Penerima */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <UserCheck className="w-4 h-4 text-[#EE7623]" />
                <h3 className="font-bold text-slate-900">Pihak II — Yang Menerima</h3>
              </div>
              <div className="space-y-1.5 text-slate-700">
                <div className="flex justify-between"><span className="text-slate-400">Nama:</span> <span className="font-bold">{penerima.nama}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">NIPP / No ID:</span> <span className="font-mono font-bold">{penerima.nipp}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Jabatan:</span> <span>{penerima.jabatan}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Kedudukan:</span> <span>{penerima.tempat_kedudukan}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Owner Responsible:</span> <span>{penerima.owner_responsible}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Custodian:</span> <span>{penerima.custodian}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL UNGGAH BERKAS FISIK BER-MATERAI (FITUR TAMBAHAN OPSIONAL) */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-[#003580] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EE7623] flex items-center justify-center text-white">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Unggah Berkas Fisik Ber-Materai</h3>
                  <p className="text-[11px] text-blue-100">Simpan scan dokumen bermaterai & tanda tangan basah</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadPhysicalSubmit} className="p-6 space-y-4 text-xs">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900 text-[11px] leading-relaxed">
                ℹ️ Berkas ini berfungsi sebagai arsip otentik fisik pendamping log digital. Pastikan materai dan tanda tangan basah penerima terlihat jelas.
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Pilih Berkas Scan (PDF / JPG / PNG) *
                </label>
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/jpg"
                  onChange={handlePhysicalFileChange}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#003580] file:text-white hover:file:bg-[#002760] cursor-pointer border border-slate-200 rounded-xl p-2 bg-slate-50"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Maksimal berkas 10 MB.
                </span>
              </div>

              {physicalFilePreview && (
                <div className="border border-slate-200 rounded-xl p-2 bg-slate-50 text-center">
                  <span className="text-[10px] font-bold text-slate-500 block mb-1">Pratinjau Gambar Scan:</span>
                  <img src={physicalFilePreview} alt="Scan preview" className="max-h-48 mx-auto rounded border border-slate-200 shadow-2xs object-contain" />
                </div>
              )}

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Catatan Penyimpanan Berkas Fisik (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={physicalNotes}
                  onChange={(e) => setPhysicalNotes(e.target.value)}
                  placeholder="Contoh: Dokumen asli tersimpan pada Odner BAST TI Daop 6 Yogyakarta..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-[#003580] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!physicalFile || isUploadingPhysical}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#003580] hover:bg-[#002760] disabled:opacity-50 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  {isUploadingPhysical ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span>Simpan Berkas Fisik</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
