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
  Laptop,
  Calendar,
  Building2,
  UserCheck,
  Eraser,
  Loader2,
  Check,
  Info,
  MapPin,
  FileCheck,
  Edit3,
  FileEdit,
  Upload,
  Image,
  FileImage
} from 'lucide-react';
import { api, fallbackDocuments } from '../services/api';

export default function BastPreviewPage({ user, onDocumentUpdated }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Active view tab: 'detail' | 'pdf'
  const [activeTab, setActiveTab] = useState('detail');
  const [isIframeLoading, setIsIframeLoading] = useState(true);

  // Second Party Signing Form State
  const [pinInput, setPinInput] = useState('');
  const [isAgreementChecked, setIsAgreementChecked] = useState(true);
  const [isSigning, setIsSigning] = useState(false);
  const [signError, setSignError] = useState(null);

  // Signature Pad State: 'saved' | 'draw' | 'upload'
  const [signatureMode, setSignatureMode] = useState('saved');
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);
  const [hasServerSignature, setHasServerSignature] = useState(false);
  const [serverSignatureUrl, setServerSignatureUrl] = useState(null);
  const [selectedSignatureFile, setSelectedSignatureFile] = useState(null);
  const [signatureFilePreview, setSignatureFilePreview] = useState(null);

  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);

  // Helper normalisasi respons API
  const normalizeDoc = (raw) => {
    if (!raw) return null;
    if (raw.document) return raw.document;
    if (raw.data && (raw.data.id || raw.data.number || raw.data.status)) {
      return {
        ...raw.data,
        data: raw.data.data || raw.data,
      };
    }
    return raw;
  };

  // Load document
  const fetchDoc = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setErrorMessage(null);
      const res = await api.getDocument(id);
      const fetched = normalizeDoc(res);
      if (fetched) {
        setDoc((prev) => ({
          ...(prev || {}),
          ...fetched,
          // Pertahankan status approved jika sebelumnya sudah berhasil ditandatangani
          status: prev?.second_party_signed ? 'approved' : fetched.status,
        }));
      } else {
        throw new Error('Dokumen tidak ditemukan.');
      }
    } catch (e) {
      console.warn('Backend fetch failed, checking fallback:', e);
      const found = fallbackDocuments.find((d) => String(d.id) === String(id));
      if (found) {
        setDoc({
          ...found,
          data: {
            tanggal_serah_terima: '2026-10-18',
            tempat_serah_terima: 'Daop 6 Yogyakarta',
            nama_unit: 'Unit Teknologi Informasi',
            wilayah: 'Daop 6 Yogyakarta',
            penyerah: {
              nama: 'Budi Santoso',
              nipp: 'P001',
              jabatan: 'Manager',
              tempat_kedudukan: 'Yogyakarta',
              personal_area: 'PA01',
            },
            penerima: {
              nama: 'Andi Wijaya',
              nipp: 'P002',
              jabatan: 'Staff',
              tempat_kedudukan: 'Yogyakarta',
              personal_area: 'PA02',
              owner_responsible: 'Andi Wijaya',
              custodian: 'Unit Teknologi Informasi',
            },
          },
          items: [
            {
              nama_barang: 'Laptop Dell',
              brand_series: 'Latitude 5440',
              no_inventaris: 'INV-001',
              serial_number: 'SN-001',
              keterangan: 'Kondisi baik',
            },
          ],
          note: 'Mohon ditandatangani pihak penyerah/penerima',
        });
      } else {
        setErrorMessage(e.message || 'Gagal memuat dokumen BAST.');
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDoc(true);
    }
  }, [id]);

  // Load user signature profile
  useEffect(() => {
    async function loadUserSignature() {
      try {
        const me = await api.getMe();
        if (me?.user?.has_signature || me?.user?.signature_path) {
          setHasServerSignature(true);
          setServerSignatureUrl(api.getSignatureUrl());
          setSignatureMode('saved');
        } else {
          setSignatureMode('draw');
        }
      } catch {
        if (user?.has_signature) {
          setHasServerSignature(true);
          setServerSignatureUrl(api.getSignatureUrl());
          setSignatureMode('saved');
        } else {
          setSignatureMode('draw');
        }
      }
    }
    loadUserSignature();
  }, [user]);

  // Canvas Handlers
  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0a192f';
    ctx.lineWidth = 2.5;
  };

  useEffect(() => {
    if (signatureMode === 'draw') {
      setTimeout(() => initCanvas(), 60);
    }
  }, [signatureMode]);

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    isDrawingRef.current = true;
    setHasDrawnSignature(true);
    setSignError(null);
  };

  const draw = (e) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnSignature(false);
  };

  const handleSignatureFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setSignError('File harus berupa gambar (PNG, JPG, JPEG, WEBP).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setSignError('Ukuran file tanda tangan maksimal 2 MB.');
      return;
    }
    setSelectedSignatureFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setSignatureFilePreview(reader.result);
      setSignError(null);
    };
    reader.readAsDataURL(file);
  };

  // Eksekusi Tanda Tangan Pihak Kedua dengan Validasi PIN
  const handleSignSecondParty = async (e) => {
    e.preventDefault();
    setSignError(null);
    setSuccessMessage(null);

    if (!pinInput || !pinInput.trim()) {
      setSignError('PIN otorisasi tanda tangan digital wajib dimasukkan.');
      return;
    }

    if (pinInput.trim().length < 4) {
      setSignError('PIN otorisasi minimal terdiri dari 4 sampai 6 digit angka.');
      return;
    }

    if (!isAgreementChecked) {
      setSignError('Harap centang persetujuan penerimaan fisik barang.');
      return;
    }

    setIsSigning(true);
    try {
      // 0. Sinkronisasi TTD (Upload PNG atau Hasil Canvas) ke Backend Profile User
      if (signatureMode === 'upload') {
        if (!selectedSignatureFile && !hasServerSignature) {
          setSignError('Silakan pilih file tanda tangan PNG / gambar terlebih dahulu.');
          setIsSigning(false);
          return;
        }
        if (selectedSignatureFile) {
          try {
            const formData = new FormData();
            formData.append('signature', selectedSignatureFile);
            formData.append('pin', pinInput.trim());
            await api.uploadSignature(formData);
            setHasServerSignature(true);
          } catch (uploadErr) {
            console.warn('Gagal upload tanda tangan PNG:', uploadErr);
          }
        }
      } else if (signatureMode === 'draw') {
        if (!hasDrawnSignature && !hasServerSignature) {
          setSignError('Silakan goreskan tanda tangan pada bidang canvas.');
          setIsSigning(false);
          return;
        }
        if (hasDrawnSignature && canvasRef.current) {
          try {
            const blob = await new Promise((resolve) => {
              canvasRef.current.toBlob(resolve, 'image/png');
            });
            if (blob) {
              const formData = new FormData();
              formData.append('signature', blob, 'signature.png');
              formData.append('pin', pinInput.trim());
              await api.uploadSignature(formData);
              setHasServerSignature(true);
            }
          } catch (uploadErr) {
            console.warn('Gagal sinkronisasi tanda tangan goresan:', uploadErr);
          }
        }
      }

      let res;
      // 1. Coba endpoint spesifik BAST sign: POST /api/documents/{id}/sign
      try {
        res = await api.signDocument(doc.id, pinInput.trim());
      } catch (signErr) {
        console.warn('POST /documents/:id/sign gagal, mencoba fallback /action:', signErr);
        // 2. Fallback jika backend menggunakan workflow action: POST /api/documents/{id}/action
        res = await api.actionDocument(doc.id, {
          action: 'approve',
          pin: pinInput.trim(),
          notes: 'Disahkan oleh pihak penerima.',
        });
      }

      // Update state LOKAL SECARA LANGSUNG (optimistic update agar tampilan langsung terupdate instan)
      setDoc((prev) => {
        const updatedDoc = normalizeDoc(res) || {};
        return {
          ...prev,
          ...updatedDoc,
          status: 'approved',
          status_label: 'Disahkan & Ditandatangani Lengkap',
          second_party_signed: true,
          penerima_signed_at: new Date().toISOString(),
          data: {
            ...(prev?.data || {}),
            ...(updatedDoc.data || {}),
            penerima_signed_at: new Date().toISOString(),
          },
        };
      });

      setSuccessMessage(
        res?.message ||
        'Tanda tangan pihak kedua berhasil divalidasi dengan PIN dan BAST Barang telah resmi disahkan!'
      );

      // Refresh data dari server di background tanpa mengganggu tampilan
      fetchDoc(false);

      if (onDocumentUpdated) onDocumentUpdated();
    } catch (err) {
      console.error('Signing error:', err);
      setSignError(
        err.message ||
        'Gagal melakukan tanda tangan. Pastikan PIN benar dan akun Anda adalah pihak penandatangan yang dituju.'
      );
    } finally {
      setIsSigning(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!doc?.id) return;
    const pdfUrl = api.getDocumentPdfUrl(doc.id, false);
    window.open(pdfUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-[#f05a22]" />
        <span className="text-sm font-semibold">Memuat dokumen BAST Barang...</span>
      </div>
    );
  }

  if (errorMessage || !doc) {
    return (
      <div className="w-full max-w-2xl mx-auto py-16 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Dokumen BAST Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500">{errorMessage || 'Dokumen tidak ditemukan atau akses terbatas.'}</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0a192f] text-white rounded-lg text-xs font-semibold hover:bg-[#122b52] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </button>
      </div>
    );
  }

  // Normalisasi status pengecekan (case-insensitive & multi-field)
  const rawStatus = (
    doc.status ||
    doc.data?.status ||
    doc.status_label ||
    ''
  ).toLowerCase();

  const isApproved =
    rawStatus === 'approved' ||
    rawStatus === 'selesai' ||
    rawStatus === 'signed' ||
    rawStatus === 'disahkan' ||
    Boolean(doc.second_party_signed) ||
    Boolean(doc.penerima_signed_at);

  const isPendingSecondSign =
    !isApproved &&
    (rawStatus === 'in_review' ||
      rawStatus === 'pending' ||
      rawStatus.includes('menunggu'));

  const isDraft = !isApproved && !isPendingSecondSign && (rawStatus === 'draft' || rawStatus === 'draf');

  // Extract structured data
  const data = doc.data || {};
  const penyerah = data.penyerah || {
    nama: doc.requester_name || 'Ahmad Fauzi Setiawan',
    nipp: '100003',
    jabatan: 'Asisten Manager',
    tempat_kedudukan: 'Unit Kantor Pusat',
    personal_area: 'PA01',
  };
  const penerima = data.penerima || {
    nama: 'Bambang Suryo Pratama',
    nipp: '100001',
    jabatan: 'Manager',
    tempat_kedudukan: 'Unit Kantor Pusat',
    personal_area: 'PA02',
  };
  const items = doc.items && doc.items.length > 0 ? doc.items : [
    {
      nama_barang: 'Laptop Dell',
      brand_series: 'Latitude 5440',
      no_inventaris: doc.inventory_code || 'INV-001',
      serial_number: 'SN-001',
      keterangan: 'Kondisi baik',
    },
  ];

  const pdfUrl = api.getDocumentPdfUrl(doc.id);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-24 select-none">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium mb-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Beranda
          </button>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Berita Acara Serah Terima Barang (HO-01)
            </h1>
            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              #{doc.number || `BST-${doc.id}`}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pengalihan penguasaan fisik dan tanggung jawab barang inventaris TI antar pegawai PT Kereta Api Indonesia (Persero).
          </p>
        </div>

        {/* Action Buttons & Tabs */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('detail')}
              className={`px-3 py-1.5 rounded-md transition-all ${activeTab === 'detail'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
                }`}
            >
              Rincian & Tanda Tangan
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pdf')}
              className={`px-3 py-1.5 rounded-md transition-all ${activeTab === 'pdf'
                  ? 'bg-white text-[#f05a22] shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
                }`}
            >
              Pratinjau PDF A4
            </button>
          </div>

          {isDraft && (
            <button
              type="button"
              id="btn-top-edit-draft"
              onClick={() => navigate(`/bast-barang/${id}/edit`)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-2xs cursor-pointer active:scale-98"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Draf</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#0a192f] hover:bg-[#122b52] rounded-lg transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Unduh PDF</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-sm font-semibold flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button type="button" onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            ✕
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {activeTab === 'pdf' ? (
        /* PDF Sheet View */
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col h-[80vh] relative">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs font-semibold text-slate-600 shrink-0">
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#f05a22]" />
              Pratinjau Dokumen Resmi Standar KAI (A4)
            </span>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="text-[#f05a22] hover:underline flex items-center gap-1 font-bold cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Buka / Simpan File PDF Asli
            </button>
          </div>
          <div className="flex-1 relative w-full h-full bg-slate-100 flex items-center justify-center">
            {isIframeLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-50 z-10 text-slate-500">
                <Loader2 className="w-7 h-7 animate-spin text-[#f05a22]" />
                <span className="text-xs font-medium">Memuat pratinjau lembar PDF resmi KAI...</span>
              </div>
            )}
            {pdfUrl ? (
              <iframe
                src={pdfUrl}
                title="BAST PDF Sheet"
                onLoad={() => setIsIframeLoading(false)}
                className="w-full h-full border-0 bg-white"
              />
            ) : (
              <div className="text-xs text-slate-500">Memuat URL dokumen...</div>
            )}
          </div>
        </div>
      ) : (
        /* Document Details & Two-Party Signatures View */
        <div className="space-y-6">
          {/* Status Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {isApproved ? (
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-xs">
                  <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                </div>
              ) : isPendingSecondSign ? (
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
                  <span className="text-xs font-semibold text-slate-500">Status Dokumen:</span>
                  {isApproved && (
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      ✓ Disahkan & Ditandatangani Lengkap
                    </span>
                  )}
                  {isPendingSecondSign && (
                    <span className="text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                      Menunggu Tanda Tangan Pihak Kedua
                    </span>
                  )}
                  {isDraft && (
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-300 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                      Draf (Belum Disahkan)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  {isApproved
                    ? 'Kedua belah pihak telah menandatangani BAST ini. Mutasi aset fisik sah tercatat dalam sistem terpadu.'
                    : isDraft
                    ? 'Dokumen ini masih berstatus draf awal dan belum ditandatangani. Pihak penyerah dapat mengedit atau melanjutkan pengesahan.'
                    : 'Dokumen telah ditandatangani oleh Pembuat BAST dan saat ini menunggu pengesahan tanda tangan pihak penerima.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono font-medium text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Tanggal: {data.tanggal_serah_terima || doc.date || '2026-10-18'}</span>
            </div>
          </div>

          {/* TWO-PARTY SIGNATURE STATUS (BUKAN BERANTAI / TANPA APPROVAL TAHAPAN) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Status Penandatanganan Dokumen BAST (Dua Pihak)
                </h2>
                <p className="text-xs text-slate-500">
                  Berita acara serah terima bersifat bilateral langsung antara penyerah dan penerima tanpa alur persetujuan bertingkat.
                </p>
              </div>
              <span className="text-[11px] font-bold text-[#f05a22] bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
                ALUR DUA PIHAK RESMI
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* PIHAK I: PENYERAH (PEMBUAT) */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="bg-[#0a192f] text-white p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold tracking-tight">Pihak I — Pihak Penyerah</h3>
                        <p className="text-[10px] text-slate-300">Pembuat Dokumen BAST</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      isDraft
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {isDraft ? 'DRAF (BELUM TTD)' : '✓ DITANDATANGANI'}
                    </span>
                  </div>

                  <div className="p-4 space-y-2.5 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-500">Nama Lengkap:</span>
                      <span className="font-bold text-slate-900">{penyerah.nama}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-500">NIPP:</span>
                      <span className="font-mono font-bold text-slate-800">{penyerah.nipp}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-500">Jabatan:</span>
                      <span className="font-medium text-slate-800">{penyerah.jabatan}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-500">Tempat Kedudukan:</span>
                      <span className="font-medium text-slate-800">{penyerah.tempat_kedudukan}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500">Personal Area:</span>
                      <span className="font-mono font-semibold text-slate-800">{penyerah.personal_area}</span>
                    </div>
                  </div>
                </div>

                <div className={`${isDraft ? 'bg-amber-50/70 border-amber-100 text-amber-800' : 'bg-emerald-50/70 border-emerald-100 text-emerald-800'} border-t px-4 py-2.5 flex items-center justify-between text-[11px]`}>
                  <span className="flex items-center gap-1.5 font-semibold">
                    {isDraft ? (
                      <>
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Menunggu Tanda Tangan Pembuat
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Tanda Tangan Digital Terverifikasi
                      </>
                    )}
                  </span>
                  <span className={`font-mono text-[10px] ${isDraft ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'} px-2 py-0.5 rounded`}>
                    {isDraft ? 'Draf Pengajuan' : 'Sah Pembuat'}
                  </span>
                </div>
              </div>

              {/* PIHAK II: PENERIMA (PENANDATANGAN KEDUA) */}
              <div className={`bg-white rounded-xl border shadow-xs overflow-hidden flex flex-col justify-between transition-colors ${isApproved ? 'border-emerald-300 ring-1 ring-emerald-300' : 'border-slate-200'}`}>
                <div>
                  <div className={`${isApproved ? 'bg-emerald-700' : 'bg-[#f05a22]'} text-white p-3.5 flex items-center justify-between transition-colors`}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-white">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold tracking-tight">Pihak II — Pihak Penerima</h3>
                        <p className="text-[10px] text-white/90">Penandatangan Kedua</p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${isApproved
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white/25 text-white'
                        }`}
                    >
                      {isApproved ? '✓ DITANDATANGANI (SAH)' : 'MENUNGGU PENGESAHAN'}
                    </span>
                  </div>

                  <div className="p-4 space-y-2.5 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-500">Nama Lengkap:</span>
                      <span className="font-bold text-slate-900">{penerima.nama}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-500">NIPP:</span>
                      <span className="font-mono font-bold text-slate-800">{penerima.nipp}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-500">Jabatan:</span>
                      <span className="font-medium text-slate-800">{penerima.jabatan}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                      <span className="text-slate-500">Tempat Kedudukan:</span>
                      <span className="font-medium text-slate-800">{penerima.tempat_kedudukan}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500">Personal Area:</span>
                      <span className="font-mono font-semibold text-slate-800">{penerima.personal_area}</span>
                    </div>
                  </div>
                </div>

                <div
                  className={`border-t px-4 py-2.5 flex items-center justify-between text-[11px] ${isApproved
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                      : 'bg-amber-50/70 border-amber-100 text-amber-800'
                    }`}
                >
                  <span className="flex items-center gap-1.5 font-semibold">
                    {isApproved ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Tanda Tangan Pihak Kedua Sah & Terverifikasi
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Menunggu Validasi PIN & Tanda Tangan
                      </>
                    )}
                  </span>
                  <span
                    className={`font-mono text-[10px] px-2 py-0.5 rounded ${isApproved ? 'bg-emerald-200 text-emerald-900 font-bold' : 'bg-amber-100 text-amber-800'
                      }`}
                  >
                    {isApproved ? 'Selesai' : 'Pending Sign'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* DOKUMEN TELAH SELESAI DISAHKAN BANNER (HANYA MUNCUL KETIKA APPROVED) */}
          {isApproved && (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                  <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-950">
                    Berita Acara Serah Terima Barang Telah Sah & Selesai
                  </h3>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Dokumen ini telah selesai ditandatangani secara digital oleh kedua belah pihak dengan validasi PIN resmi. Pengalihan tanggung jawab fisik aset telah mengikat dan tercatat resmi dalam sistem.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-2xs"
                >
                  <Download className="w-4 h-4" />
                  Unduh Dokumen PDF Resmi
                </button>
              </div>
            </div>
          )}

          {/* DOKUMEN BERSTATUS DRAF BANNER */}
          {isDraft && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center text-white shrink-0 shadow-xs">
                  <FileEdit className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-amber-950">
                      Dokumen Berita Acara Masih Berstatus Draf
                    </h3>
                    <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                      Draf Aktif
                    </span>
                  </div>
                  <p className="text-xs text-amber-900/80 mt-1 max-w-2xl leading-relaxed">
                    Dokumen ini belum dibubuhi tanda tangan digital dan belum sah secara operasional. Pihak penyerah (pembuat) dapat mengedit rincian barang, merubah unit / pihak penerima, atau langsung menandatangani formulir ini.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  id="btn-edit-draft-bast"
                  onClick={() => navigate(`/bast-barang/${id}/edit`)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#f05a22] hover:bg-[#d94a18] rounded-xl transition-all shadow-xs cursor-pointer active:scale-98"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit & Lanjutkan Draf
                </button>
              </div>
            </div>
          )}

          {/* ACTION PANEL: TANDA TANGAN PIHAK KEDUA DENGAN KONFIRMASI PIN (HANYA JIKA BELUM APPROVED) */}
          {isPendingSecondSign && (
            <div className="bg-white rounded-2xl border-2 border-orange-300 shadow-md overflow-hidden animate-in fade-in">
              <div className="bg-[#0a192f] text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#f05a22] flex items-center justify-center text-white">
                    <PenTool className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Pengesahan & Tanda Tangan Pihak Kedua</h3>
                    <p className="text-[11px] text-slate-300">
                      Konfirmasi penerimaan barang fisik dengan validasi PIN digital resmi
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-[#f05a22] px-2.5 py-0.5 rounded text-white uppercase tracking-wider">
                  AKSI PENGESAHAN
                </span>
              </div>

              <form onSubmit={handleSignSecondParty} className="p-5 space-y-4 text-xs">
                {/* Input PIN Validasi */}
                <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-amber-600" />
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
                      className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-lg text-slate-900 font-mono text-sm tracking-widest font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-amber-800 leading-snug">
                    PIN digunakan untuk memvalidasi keabsahan tanda tangan digital Anda dan mengunci dokumen BAST menjadi sah secara hukum.
                  </p>
                </div>

                {/* Signature View / Drawing */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 block">
                      Tanda Tangan Digital Anda
                    </label>
                    <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-semibold">
                      {hasServerSignature && (
                        <button
                          type="button"
                          onClick={() => setSignatureMode('saved')}
                          className={`px-2 py-0.5 rounded-md transition-all ${
                            signatureMode === 'saved'
                              ? 'bg-white text-[#f05a22] shadow-2xs font-bold'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Tanda Tangan Akun
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSignatureMode('draw')}
                        className={`px-2 py-0.5 rounded-md transition-all ${
                          signatureMode === 'draw'
                            ? 'bg-white text-slate-900 shadow-2xs font-bold'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Goreskan Langsung
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignatureMode('upload')}
                        className={`px-2 py-0.5 rounded-md transition-all ${
                          signatureMode === 'upload'
                            ? 'bg-white text-[#f05a22] shadow-2xs font-bold'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Unggah File PNG
                      </button>
                    </div>
                  </div>

                  {signatureMode === 'saved' && hasServerSignature && (
                    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex items-center justify-center h-28">
                      <div className="text-center">
                        <img
                          src={serverSignatureUrl}
                          alt="Signature Profile"
                          className="h-20 max-w-full object-contain mx-auto"
                        />
                        <p className="text-[10px] text-emerald-700 font-semibold mt-1">
                          ✓ Tanda tangan digital resmi profil akun Anda siap dibubuhkan
                        </p>
                      </div>
                    </div>
                  )}

                  {signatureMode === 'draw' && (
                    <div>
                      <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-white transition-colors overflow-hidden group">
                        <canvas
                          ref={canvasRef}
                          width={600}
                          height={140}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                          className="w-full h-32 cursor-crosshair touch-none"
                        />
                        {!hasDrawnSignature && (
                          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 gap-1">
                            <PenTool className="w-4 h-4 text-slate-300" />
                            <span className="text-[11px] font-medium">
                              Goreskan tanda tangan digital di kotak ini
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[10px] text-slate-400">
                          {hasDrawnSignature ? '✓ Tanda tangan tergores' : 'Goreskan tanda tangan'}
                        </span>
                        <button
                          type="button"
                          onClick={handleClearSignature}
                          className="inline-flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-800 font-semibold py-0.5 px-2 rounded hover:bg-rose-50"
                        >
                          <Eraser className="w-3 h-3" />
                          Hapus / Ulangi
                        </button>
                      </div>
                    </div>
                  )}

                  {signatureMode === 'upload' && (
                    <div>
                      {signatureFilePreview ? (
                        <div className="border-2 border-emerald-300 bg-emerald-50/40 rounded-xl p-3 flex flex-col items-center justify-center">
                          <img
                            src={signatureFilePreview}
                            alt="Preview TTD"
                            className="max-h-24 max-w-full object-contain mx-auto bg-white/70 p-2 rounded border border-emerald-200"
                          />
                          <div className="flex items-center justify-between w-full mt-2 pt-2 border-t border-emerald-200">
                            <span className="text-[10px] text-emerald-800 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {selectedSignatureFile?.name || 'File TTD siap digunakan'}
                            </span>
                            <label className="text-[10px] text-blue-600 hover:underline cursor-pointer font-semibold">
                              Ganti Gambar
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={handleSignatureFileChange}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <label className="border-2 border-dashed border-slate-300 hover:border-[#f05a22] rounded-xl p-4 bg-slate-50 hover:bg-orange-50/20 transition-all flex flex-col items-center justify-center cursor-pointer text-center group">
                          <Upload className="w-6 h-6 text-slate-400 group-hover:text-[#f05a22] transition-colors mb-1" />
                          <span className="text-xs font-semibold text-slate-700 group-hover:text-[#f05a22]">
                            Klik untuk unggah file TTD (PNG / Gambar)
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            Format PNG transparan disarankan (Maksimal 2MB)
                          </span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={handleSignatureFileChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  )}
                </div>

                {/* Agreement Checkbox */}
                <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isAgreementChecked}
                    onChange={(e) => setIsAgreementChecked(e.target.checked)}
                    className="mt-0.5 rounded text-[#f05a22] focus:ring-0"
                  />
                  <span className="text-[11px] text-slate-600 leading-snug">
                    Saya menyatakan telah menerima fisik perangkat barang sesuai spesifikasi, nomor inventaris, dan kondisi yang tercantum dalam berita acara ini.
                  </span>
                </label>

                {/* Error Banner */}
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
                    disabled={isSigning || !pinInput.trim()}
                    className="px-6 py-2.5 text-xs font-bold text-white bg-[#f05a22] hover:bg-[#d94e18] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all flex items-center gap-2 shadow-sm active:scale-98"
                  >
                    {isSigning ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    )}
                    Validasi PIN & Tandatangani Dokumen BAST
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* INFORMASI SERAH TERIMA */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Informasi Serah Terima BAST
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Tanggal Serah Terima</span>
                <span className="font-semibold text-slate-800">
                  {data.tanggal_serah_terima || doc.date || '2026-10-18'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Tempat Serah Terima</span>
                <span className="font-semibold text-slate-800">
                  {data.tempat_serah_terima || 'Daop 6 Yogyakarta'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Unit Pengelola</span>
                <span className="font-semibold text-slate-800">
                  {data.nama_unit || 'Unit Teknologi Informasi'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Wilayah Kedinasan</span>
                <span className="font-semibold text-slate-800">
                  {data.wilayah || 'Daop 6 Yogyakarta'}
                </span>
              </div>
            </div>
          </div>

          {/* DAFTAR BARANG YANG DISERAHKAN (items) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-800">
                  Daftar Barang yang Diserah-terimakan ({items.length} Item)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                Aset Fisik KAI
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/70 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                    <th className="py-2.5 px-4 w-12 text-center">NO</th>
                    <th className="py-2.5 px-4 min-w-[200px]">NAMA BARANG</th>
                    <th className="py-2.5 px-4 min-w-[180px]">BRAND / SERIES</th>
                    <th className="py-2.5 px-4 min-w-[150px]">NO. INVENTARIS</th>
                    <th className="py-2.5 px-4 min-w-[140px]">SERIAL NUMBER</th>
                    <th className="py-2.5 px-4 min-w-[200px]">KETERANGAN KONDISI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((it, idx) => (
                    <tr key={it.id || idx} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 text-center font-bold text-slate-400">
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {it.nama_barang || it.nama || 'Barang Fisik'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {it.brand_series || it.brand || '-'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[#f05a22]">
                        #{it.no_inventaris || it.id_aset || '-'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {it.serial_number || '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {it.keterangan || it.alasan_pemusnahan || 'Kondisi baik'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CATATAN PENGANTAR (note) */}
          {(doc.note || data.note) && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-1">
              <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider block">
                Catatan Pengantar BAST
              </span>
              <p className="text-slate-800 font-medium italic">
                "{doc.note || data.note}"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
