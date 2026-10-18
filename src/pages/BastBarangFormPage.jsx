import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Laptop,
  Monitor,
  Plus,
  Database,
  Search,
  Trash2,
  Eye,
  FileText,
  Download,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  Check,
  X,
  Lock,
  ArrowLeft,
  Loader2,
  Building2,
  UserCheck,
  PenTool,
  Calendar,
  Eraser,
  KeyRound,
  Send,
  Info
} from 'lucide-react';
import { api } from '../services/api';

// Master pegawai KAI lengkap dengan user_id untuk penandatangan kedua
const MASTER_PEGAWAI = [
  {
    id: 25,
    nipp: 'P002',
    nama: 'Andi Wijaya',
    jabatan: 'Staff',
    tempat_kedudukan: 'Yogyakarta',
    personal_area: 'PA02',
    unit: 'Unit Teknologi Informasi'
  },
  {
    id: 12,
    nipp: 'P001',
    nama: 'Budi Santoso',
    jabatan: 'Manager',
    tempat_kedudukan: 'Yogyakarta',
    personal_area: 'PA01',
    unit: 'Unit Teknologi Informasi'
  },
  {
    id: 18,
    nipp: '67891',
    nama: 'Rian Ardiansyah, S.T',
    jabatan: 'Junior Analyst Operasi Perjalanan KA',
    tempat_kedudukan: 'Daop 6 Yogyakarta',
    personal_area: 'PA02',
    unit: 'Pusat Pengendalian Operasi KA (Pusdalop)'
  },
  {
    id: 21,
    nipp: '51204',
    nama: 'Heru Wicaksono, M.T',
    jabatan: 'Senior Manager Sistem Informasi',
    tempat_kedudukan: 'Daop 6 Yogyakarta',
    personal_area: 'PA01',
    unit: 'Divisi Teknologi Informasi'
  },
  {
    id: 22,
    nipp: '68120',
    nama: 'Denny Kurnia, S.Kom',
    jabatan: 'Officer Infrastruktur & Jaringan TI',
    tempat_kedudukan: 'Daop 6 Yogyakarta',
    personal_area: 'PA02',
    unit: 'Unit Teknologi Informasi'
  },
  {
    id: 23,
    nipp: '49201',
    nama: 'Siti Rahmawati, S.E',
    jabatan: 'Supervisor Pengelolaan Aset & Keuangan',
    tempat_kedudukan: 'Daop 6 Yogyakarta',
    personal_area: 'PA02',
    unit: 'Unit Keuangan'
  },
  {
    id: 24,
    nipp: '54109',
    nama: 'Dimas Prasetyo, S.Kom',
    jabatan: 'Senior Specialist Cloud & Data Center',
    tempat_kedudukan: 'Daop 6 Yogyakarta',
    personal_area: 'PA01',
    unit: 'Unit Teknologi Informasi'
  }
];

const DEFAULT_ITEMS = [
  {
    id: 1,
    nama_barang: 'Laptop Dell',
    brand_series: 'Latitude 5440',
    no_inventaris: 'INV-001',
    serial_number: 'SN-001',
    keterangan: 'Kondisi baik',
  },
];

export default function BastBarangFormPage({ user }) {
  const navigate = useNavigate();

  // --- 1. Field Data: Informasi Serah Terima ---
  const [generalData, setGeneralData] = useState({
    tanggal_serah_terima: '2026-10-18',
    tempat_serah_terima: 'Daop 6 Yogyakarta',
    nama_unit: 'Unit Teknologi Informasi',
    wilayah: 'Daop 6 Yogyakarta',
  });

  // --- 2. Field Data: Penyerah ---
  const [penyerah, setPenyerah] = useState({
    nama: user?.name || 'Budi Santoso',
    nipp: user?.nip || 'P001',
    jabatan: user?.roleLabel || 'Manager',
    tempat_kedudukan: user?.location || 'Yogyakarta',
    personal_area: 'PA01',
  });

  // --- 3. Field Data: Penerima ---
  const [penerima, setPenerima] = useState({
    nama: 'Andi Wijaya',
    nipp: 'P002',
    jabatan: 'Staff',
    tempat_kedudukan: 'Yogyakarta',
    personal_area: 'PA02',
  });

  // --- 4. Penandatangan Kedua (penyerah_user_id) ---
  const [penyerahUserId, setPenyerahUserId] = useState(25);

  // --- 5. Catatan Tambahan (note) ---
  const [note, setNote] = useState('Mohon ditandatangani pihak penyerah');

  // --- 6. PIN Tanda Tangan Pembuat (signature_pin) ---
  const [signaturePin, setSignaturePin] = useState('123456');

  // --- 7. Daftar Barang (items) ---
  const [items, setItems] = useState(DEFAULT_ITEMS);

  // --- User list from API / Master ---
  const [apiUsers, setApiUsers] = useState([]);

  // --- Modals State ---
  const [isSapModalOpen, setIsSapModalOpen] = useState(false);
  const [sapAssets, setSapAssets] = useState([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [selectedSapIds, setSelectedSapIds] = useState([]);
  const [sapSearchTerm, setSapSearchTerm] = useState('');

  const [isSearchNippModalOpen, setIsSearchNippModalOpen] = useState(false);
  const [nippSearchQuery, setNippSearchQuery] = useState('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [isPreviewPdfModalOpen, setIsPreviewPdfModalOpen] = useState(false);

  // --- Tanda Tangan Langsung (Direct Signature Modal) ---
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [signatureMode, setSignatureMode] = useState('draw'); // 'draw' | 'saved'
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);
  const [hasServerSignature, setHasServerSignature] = useState(false);
  const [serverSignatureUrl, setServerSignatureUrl] = useState(null);
  const [isAgreementChecked, setIsAgreementChecked] = useState(true);
  const [signatureError, setSignatureError] = useState(null);

  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);

  // --- Submission State ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  // Load registered users and user signature
  useEffect(() => {
    async function loadInitialData() {
      try {
        const res = await api.getApprovers().catch(() => null);
        const list = Array.isArray(res) ? res : (res?.data || []);
        setApiUsers(list);

        // Check user profile for registered signature
        try {
          const me = await api.getMe();
          if (me?.user?.has_signature || me?.user?.signature_path) {
            setHasServerSignature(true);
            setServerSignatureUrl(api.getSignatureUrl());
          }
        } catch {
          if (user?.has_signature) {
            setHasServerSignature(true);
            setServerSignatureUrl(api.getSignatureUrl());
          }
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    }
    loadInitialData();
  }, [user]);

  // Combined master list of searchable pegawai
  const allPegawai = useMemo(() => {
    const list = [...MASTER_PEGAWAI];
    apiUsers.forEach((u) => {
      const nip = u.nip || `KAI-${u.id}`;
      if (!list.some((p) => p.nipp === nip || Number(p.id) === Number(u.id))) {
        list.push({
          id: u.id,
          nipp: nip,
          nama: u.name || u.nama || 'Pegawai KAI',
          jabatan: typeof u.jabatan === 'object' ? u.jabatan?.nama : (u.jabatan || 'Staff'),
          tempat_kedudukan: u.unit_kerja || 'Daop 6 Yogyakarta',
          personal_area: 'PA02',
          unit: u.unit_kerja || 'Unit Teknologi Informasi'
        });
      }
    });
    return list;
  }, [apiUsers]);

  // Handle Select Pegawai from NIPP Search
  const handleSelectPegawaiPenerima = (pegawai) => {
    setPenerima({
      nama: pegawai.nama,
      nipp: pegawai.nipp,
      jabatan: pegawai.jabatan,
      tempat_kedudukan: pegawai.tempat_kedudukan,
      personal_area: pegawai.personal_area || 'PA02',
    });
    // Set penandatangan kedua ke user id pegawai ini jika ada
    if (pegawai.id) {
      setPenyerahUserId(Number(pegawai.id));
    }
    setIsSearchNippModalOpen(false);
    setNippSearchQuery('');
  };

  // Canvas Signature Handlers
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
    if (isSignatureModalOpen && signatureMode === 'draw') {
      setTimeout(() => initCanvas(), 50);
    }
  }, [isSignatureModalOpen, signatureMode]);

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
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
    setSignatureError(null);
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

  // Load SAP Master Assets
  const handleOpenSapModal = async () => {
    setIsSapModalOpen(true);
    setSelectedSapIds([]);
    try {
      setIsLoadingAssets(true);
      const res = await api.getAssets().catch(() => null);
      if (res && res.data && res.data.length > 0) {
        setSapAssets(res.data);
      } else {
        setSapAssets([
          {
            id: 'sap-101',
            no_inventaris: 'INV-001',
            nama: 'Laptop Dell',
            brand: 'Latitude 5440',
            serial_number: 'SN-001',
            keterangan: 'Kondisi baik',
          },
          {
            id: 'sap-102',
            no_inventaris: 'INV-002',
            nama: 'Monitor Dell 24"',
            brand: 'UltraSharp U2422H',
            serial_number: 'SN-002',
            keterangan: 'Layar jernih normal',
          },
          {
            id: 'sap-103',
            no_inventaris: 'INV-003',
            nama: 'Docking Station Type-C',
            brand: 'Dell WD19S',
            serial_number: 'SN-003',
            keterangan: 'Aksesoris operasional lengkap',
          },
        ]);
      }
    } catch (err) {
      console.error('Error fetching assets:', err);
    } finally {
      setIsLoadingAssets(false);
    }
  };

  const handleImportSelectedSap = () => {
    const selected = sapAssets.filter((a) => selectedSapIds.includes(a.id));
    const newItems = selected.map((asset, idx) => ({
      id: Date.now() + idx,
      nama_barang: asset.nama || asset.nama_aset || 'Laptop Dell',
      brand_series: asset.brand || asset.merk || 'Latitude 5440',
      no_inventaris: asset.no_inventaris || asset.nomor_aset || `INV-00${items.length + idx + 1}`,
      serial_number: asset.serial_number || asset.sn || `SN-00${items.length + idx + 1}`,
      keterangan: asset.keterangan || 'Kondisi baik',
    }));

    setItems((prev) => [...prev, ...newItems]);
    setIsSapModalOpen(false);
  };

  // Add empty manual asset row
  const handleAddManualAsset = () => {
    const newItem = {
      id: Date.now(),
      nama_barang: '',
      brand_series: '',
      no_inventaris: `INV-00${items.length + 1}`,
      serial_number: '',
      keterangan: 'Kondisi baik',
    };
    setEditingItem(newItem);
    setIsEditModalOpen(true);
  };

  const handleSaveEditedItem = (saved) => {
    if (!saved.nama_barang || !saved.nama_barang.trim()) {
      alert('Nama barang wajib diisi');
      return;
    }
    if (!saved.no_inventaris || !saved.no_inventaris.trim()) {
      alert('Nomor inventaris wajib diisi');
      return;
    }
    setItems((prev) => {
      const exists = prev.some((it) => it.id === saved.id);
      if (exists) {
        return prev.map((it) => (it.id === saved.id ? saved : it));
      }
      return [...prev, saved];
    });
    setIsEditModalOpen(false);
    setEditingItem(null);
  };

  const handleDeleteItem = (id) => {
    if (items.length <= 1) {
      alert('Dokumen BAST Barang wajib memiliki minimal 1 (satu) item barang.');
      return;
    }
    setItems(items.filter((it) => it.id !== id));
  };

  // Validate form prior to submit or draft
  const validateForm = () => {
    if (!generalData.tanggal_serah_terima || !generalData.tempat_serah_terima || !generalData.nama_unit || !generalData.wilayah) {
      setSubmitError('Informasi umum serah terima (Tanggal, Tempat, Nama Unit, Wilayah) wajib lengkap.');
      return false;
    }

    if (!penyerah.nama || !penyerah.nipp || !penyerah.jabatan || !penyerah.tempat_kedudukan || !penyerah.personal_area) {
      setSubmitError('Data Pihak I Penyerah wajib diisi lengkap.');
      return false;
    }

    if (!penerima.nama || !penerima.nipp || !penerima.jabatan || !penerima.tempat_kedudukan || !penerima.personal_area) {
      setSubmitError('Data Pihak II Penerima wajib diisi lengkap.');
      return false;
    }

    if (items.length === 0) {
      setSubmitError('Daftar barang serah terima (items) minimal 1 item.');
      return false;
    }

    return true;
  };

  // Triggered when user clicks "Sahkan & Tanda Tangani Langsung"
  const handleOpenSignatureModal = () => {
    setSubmitError(null);
    setSubmitSuccess(null);
    if (!validateForm()) return;
    setIsSignatureModalOpen(true);
  };

  // Execute Submission
  const handleSubmitDocument = async (submitNow) => {
    if (!validateForm()) return;

    if (submitNow) {
      if (!signaturePin || !signaturePin.trim()) {
        setSignatureError('PIN tanda tangan pembuat (signature_pin) wajib diisi.');
        return;
      }
      if (signatureMode === 'draw' && !hasDrawnSignature) {
        setSignatureError('Harap bubuhkan tanda tangan pada kotak tanda tangan digital.');
        return;
      }
      if (!isAgreementChecked) {
        setSignatureError('Harap centang konfirmasi pernyataan keabsahan serah terima.');
        return;
      }
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSignatureError(null);

    try {
      // Struktur payload sesuai format spesifikasi BAST Barang (tanpa approval)
      let payload = {
        type: 'ho01',
        data: {
          tanggal_serah_terima: generalData.tanggal_serah_terima,
          tempat_serah_terima: generalData.tempat_serah_terima,
          nama_unit: generalData.nama_unit,
          wilayah: generalData.wilayah,
          penyerah: {
            nama: penyerah.nama,
            nipp: penyerah.nipp,
            jabatan: penyerah.jabatan,
            tempat_kedudukan: penyerah.tempat_kedudukan,
            personal_area: penyerah.personal_area,
          },
          penerima: {
            nama: penerima.nama,
            nipp: penerima.nipp,
            jabatan: penerima.jabatan,
            tempat_kedudukan: penerima.tempat_kedudukan,
            personal_area: penerima.personal_area,
            owner_responsible: penerima.nama,
            custodian: generalData.nama_unit,
          },
        },
        items: items.map((it) => ({
          nama_barang: it.nama_barang,
          brand_series: it.brand_series || null,
          no_inventaris: it.no_inventaris,
          serial_number: it.serial_number || null,
          keterangan: it.keterangan || null,
        })),
        submit: submitNow,
      };

      if (submitNow) {
        const secondPartyId = Number(penyerahUserId) || 25;
        payload.penyerah_user_id = secondPartyId;
        // approver_id dikirim otomatis sesuai penyerah_user_id agar lolos validasi backend Laravel
        payload.approver_id = secondPartyId;
        payload.signature_pin = String(signaturePin).trim();
        if (note && note.trim()) {
          payload.note = note.trim();
        }
      } else {
        // Pada saat simpan draft, kirim juga default jika backend mewajibkan
        payload.approver_id = Number(penyerahUserId) || 25;
      }

      console.log('Mengirim Request BAST Barang (HO-01):', payload);
      const res = await api.createDocument(payload);

      setIsSignatureModalOpen(false);
      setSubmitSuccess(
        submitNow
          ? (res?.message || 'BAST Barang berhasil ditandatangani pembuat dan diteruskan ke pihak penandatangan kedua!')
          : (res?.message || 'Draf BAST Barang berhasil disimpan!')
      );

      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      console.error('Submission error:', err);
      const msg = err.message || 'Gagal menyimpan dokumen serah terima barang.';
      setSubmitError(msg);
      if (isSignatureModalOpen) {
        setSignatureError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-24 select-none">
      {/* Top Header */}
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
              Formulir BAST Serah Terima Barang (HO-01)
            </h1>
            <span className="text-[11px] font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              ALUR DUA PIHAK (TANPA APPROVAL)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-4xl leading-relaxed">
            Berita Acara Serah Terima Barang / Perangkat Keras TI antar pegawai PT Kereta Api Indonesia (Persero).
            Dokumen langsung ditandatangani oleh pembuat dan diteruskan langsung ke pihak penandatangan kedua tanpa alur approval bertingkat.
          </p>
        </div>
      </div>

      {/* Notification Banner */}
      {submitSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-sm font-semibold flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{submitSuccess} Mengalihkan ke halaman utama...</span>
          </div>
          <button type="button" onClick={() => setSubmitSuccess(null)} className="text-emerald-700 hover:text-emerald-900">
            ✕
          </button>
        </div>
      )}

      {submitError && (
        <div className="p-4 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-sm font-semibold flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{submitError}</span>
          </div>
          <button type="button" onClick={() => setSubmitError(null)} className="text-rose-700 hover:text-rose-900">
            ✕
          </button>
        </div>
      )}

      {/* SECTION 1: INFORMASI SERAH TERIMA */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="bg-[#0a192f] text-white p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold tracking-tight">1. Informasi Serah Terima</h2>
              <p className="text-[10px] text-slate-300">Waktu, tempat, unit kerja, dan wilayah kedinasan</p>
            </div>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/15 text-white">
            DATA BAST
          </span>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Tanggal Serah Terima *
            </label>
            <input
              type="date"
              value={generalData.tanggal_serah_terima}
              onChange={(e) => setGeneralData({ ...generalData, tanggal_serah_terima: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-semibold focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Tempat Serah Terima *
            </label>
            <input
              type="text"
              value={generalData.tempat_serah_terima}
              onChange={(e) => setGeneralData({ ...generalData, tempat_serah_terima: e.target.value })}
              placeholder="Contoh: Daop 6 Yogyakarta"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Nama Unit Pengelola *
            </label>
            <input
              type="text"
              value={generalData.nama_unit}
              onChange={(e) => setGeneralData({ ...generalData, nama_unit: e.target.value })}
              placeholder="Contoh: Unit Teknologi Informasi"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Wilayah Kedinasan *
            </label>
            <input
              type="text"
              value={generalData.wilayah}
              onChange={(e) => setGeneralData({ ...generalData, wilayah: e.target.value })}
              placeholder="Contoh: Daop 6 Yogyakarta"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: IDENTITAS DUA PIHAK (PENYERAH & PENERIMA) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-md bg-[#0a192f] text-white flex items-center justify-center text-xs font-bold shadow-xs">
              2
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">Identitas Dua Pihak</h2>
              <p className="text-xs text-slate-500">
                Pihak yang menyerahkan dan pihak penerima yang bertanggung jawab langsung atas barang.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#f05a22] bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>LANGSUNG ANTAR PIHAK</span>
          </div>
        </div>

        {/* Two Cards Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* PIHAK I: PENYERAH */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
            <div>
              <div className="bg-[#0a192f] text-white p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold tracking-tight">Pihak I — Pihak Penyerah</h3>
                    <p className="text-[10px] text-slate-300">Pengelola / Pemegang Barang</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/15 text-white">
                  PENYERAH
                </span>
              </div>

              <div className="p-4 space-y-3.5 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">Nama Lengkap Penyerah *</label>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      <Lock className="w-2.5 h-2.5" /> Terverifikasi SSO
                    </span>
                  </div>
                  <input
                    type="text"
                    value={penyerah.nama}
                    onChange={(e) => setPenyerah({ ...penyerah, nama: e.target.value })}
                    placeholder="Budi Santoso"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">NIPP *</label>
                    <input
                      type="text"
                      value={penyerah.nipp}
                      onChange={(e) => setPenyerah({ ...penyerah, nipp: e.target.value })}
                      placeholder="P001"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Jabatan *</label>
                    <input
                      type="text"
                      value={penyerah.jabatan}
                      onChange={(e) => setPenyerah({ ...penyerah, jabatan: e.target.value })}
                      placeholder="Manager"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Tempat Kedudukan *</label>
                    <input
                      type="text"
                      value={penyerah.tempat_kedudukan}
                      onChange={(e) => setPenyerah({ ...penyerah, tempat_kedudukan: e.target.value })}
                      placeholder="Yogyakarta"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Personal Area *</label>
                    <input
                      type="text"
                      value={penyerah.personal_area}
                      onChange={(e) => setPenyerah({ ...penyerah, personal_area: e.target.value })}
                      placeholder="PA01"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono font-semibold focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50/80 border-t border-slate-100 px-4 py-2.5 flex items-center justify-between text-[11px] text-slate-500">
              <span className="font-medium text-slate-600">Pihak I Pembuat BAST</span>
              <span className="font-semibold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-2xs font-mono">
                {penyerah.personal_area}
              </span>
            </div>
          </div>

          {/* PIHAK II: PENERIMA */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
            <div>
              <div className="bg-[#f05a22] text-white p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-white">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold tracking-tight">Pihak II — Pihak Penerima</h3>
                    <p className="text-[10px] text-white/90">Penanggung Jawab Langsung Barang</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSearchNippModalOpen(true)}
                    className="inline-flex items-center gap-1 bg-white hover:bg-slate-100 text-[#f05a22] text-[11px] px-2.5 py-1 rounded-md font-bold transition-all shadow-xs active:scale-95"
                  >
                    <Search className="w-3 h-3 stroke-[2.5]" />
                    Cari berdasarkan NIPP
                  </button>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/20 text-white">
                    PENERIMA
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-3.5 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">Nama Lengkap Penerima *</label>
                    <span className="text-[10px] text-slate-400">Pilih dari NIPP atau ketik langsung</span>
                  </div>
                  <input
                    type="text"
                    value={penerima.nama}
                    onChange={(e) => setPenerima({ ...penerima, nama: e.target.value })}
                    placeholder="Andi Wijaya"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-semibold focus:ring-1 focus:ring-[#f05a22] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">NIPP Penerima *</label>
                    <input
                      type="text"
                      value={penerima.nipp}
                      onChange={(e) => setPenerima({ ...penerima, nipp: e.target.value })}
                      placeholder="P002"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:ring-1 focus:ring-[#f05a22] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Jabatan Penerima *</label>
                    <input
                      type="text"
                      value={penerima.jabatan}
                      onChange={(e) => setPenerima({ ...penerima, jabatan: e.target.value })}
                      placeholder="Staff"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-medium focus:ring-1 focus:ring-[#f05a22] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Tempat Kedudukan *</label>
                    <input
                      type="text"
                      value={penerima.tempat_kedudukan}
                      onChange={(e) => setPenerima({ ...penerima, tempat_kedudukan: e.target.value })}
                      placeholder="Yogyakarta"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-medium focus:ring-1 focus:ring-[#f05a22] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Personal Area *</label>
                    <input
                      type="text"
                      value={penerima.personal_area}
                      onChange={(e) => setPenerima({ ...penerima, personal_area: e.target.value })}
                      placeholder="PA02"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono font-semibold focus:ring-1 focus:ring-[#f05a22] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Target Penandatangan Kedua Selector */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="font-semibold text-slate-700 block mb-1">
                    Akun Pihak Penandatangan Kedua (`penyerah_user_id`) *
                  </label>
                  <select
                    value={penyerahUserId}
                    onChange={(e) => setPenyerahUserId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-medium text-xs focus:ring-1 focus:ring-[#f05a22] focus:outline-none"
                  >
                    {allPegawai.map((p) => (
                      <option key={p.id || p.nipp} value={p.id || 25}>
                        {p.nama} [NIPP: {p.nipp}] — ID Akun: #{p.id || 25}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Pihak ini yang akan menerima dokumen dan melakukan tanda tangan kedua via endpoint <code>/api/documents/{'{id}'}/sign</code>.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50/80 border-t border-slate-100 px-4 py-2.5 flex items-center justify-between text-[11px] text-slate-500">
              <span className="font-medium text-amber-700">Penandatangan Kedua Aktif</span>
              <span className="font-semibold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-2xs font-mono">
                ID: #{penyerahUserId}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: DAFTAR BARANG YANG DISERAHKAN (items) */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-md bg-[#0a192f] text-white flex items-center justify-center text-xs font-bold shadow-xs">
              3
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Daftar Barang (items)
                </h2>
                <span className="text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-full">
                  {items.length} Item
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Nama barang, brand/series, no_inventaris, serial_number, dan keterangan kondisi fisik.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddManualAsset}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Baris Barang
            </button>
            <button
              type="button"
              onClick={handleOpenSapModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0a192f] hover:bg-[#122b52] text-white text-xs font-semibold transition-colors shadow-xs"
            >
              <Database className="w-3.5 h-3.5 text-sky-400" />
              Pilih dari Inventaris SAP
            </button>
          </div>
        </div>

        {/* Table of Items */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                  <th className="py-3 px-4 w-12 text-center">NO</th>
                  <th className="py-3 px-4 min-w-[200px]">NAMA BARANG</th>
                  <th className="py-3 px-4 min-w-[180px]">BRAND / SERIES</th>
                  <th className="py-3 px-4 min-w-[150px]">NO. INVENTARIS</th>
                  <th className="py-3 px-4 min-w-[140px]">SERIAL NUMBER</th>
                  <th className="py-3 px-4 min-w-[200px]">KETERANGAN</th>
                  <th className="py-3 px-4 w-20 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                      {String(idx + 1).padStart(2, '0')}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 text-blue-600">
                          <Laptop className="w-4 h-4" />
                        </div>
                        <div className="font-bold text-slate-900 leading-snug">
                          {item.nama_barang || 'Barang Baru'}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-700">{item.brand_series || '-'}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center font-mono font-bold text-[11px] text-[#f05a22] bg-orange-50 border border-orange-200 px-2 py-0.5 rounded">
                        #{item.no_inventaris}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-200">
                        {item.serial_number || '-'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-600 font-medium">
                        {item.keterangan || '-'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItem({ ...item });
                            setIsEditModalOpen(true);
                          }}
                          title="Edit Rincian"
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          title="Hapus Baris"
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION 4: CATATAN TAMBAHAN (note) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-6 h-6 rounded-md bg-[#0a192f] text-white flex items-center justify-center text-xs font-bold shadow-xs">
            4
          </span>
          <h2 className="text-sm font-bold text-slate-900">Catatan Dokumen (`note`)</h2>
        </div>

        <div className="text-xs">
          <label className="font-semibold text-slate-700 block mb-1">
            Catatan Tambahan (Maksimal 1000 Karakter)
          </label>
          <input
            type="text"
            value={note}
            maxLength={1000}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Contoh: Mohon ditandatangani pihak penyerah"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          <p className="text-[10px] text-slate-400 mt-1">
            Catatan pesan pengantar untuk pihak penandatangan kedua.
          </p>
        </div>
      </div>

      {/* FOOTER ACTIONS BAR */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
          <Info className="w-4 h-4 text-blue-600" />
          <span>Status setelah tanda tangan pembuat: <strong className="text-blue-700 font-bold">in_review</strong> (menunggu tanda tangan pihak kedua, tanpa approval).</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmitDocument(false)}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            Simpan Draf (submit: false)
          </button>

          <button
            type="button"
            onClick={() => setIsPreviewPdfModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#0a192f] hover:bg-[#122b52] rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5 text-sky-400" />
            Pratinjau Format Cetak (PDF)
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleOpenSignatureModal}
            className="px-5 py-2 text-xs font-bold text-white bg-[#f05a22] hover:bg-[#d94e18] rounded-lg transition-all flex items-center gap-1.5 shadow-sm active:scale-98"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <PenTool className="w-4 h-4 stroke-[2.5]" />
            )}
            Sahkan & Tanda Tangani Langsung
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* --- MODAL 1: TANDA TANGAN LANGSUNG PEMBUAT (SIGNATURE MODAL) --- */}
      {/* ========================================================================= */}
      {isSignatureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="bg-[#0a192f] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#f05a22] flex items-center justify-center text-white">
                  <PenTool className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Tanda Tangan Langsung Pembuat BAST</h3>
                  <p className="text-[11px] text-slate-300">Langsung mengesahkan dan mengirim ke pihak penandatangan kedua</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSignatureModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Summary Pill */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between items-center text-slate-500 font-medium">
                  <span>Tanggal Serah Terima:</span>
                  <span className="text-slate-800 font-bold">{generalData.tanggal_serah_terima}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 font-medium">
                  <span>Pihak Penyerah:</span>
                  <span className="text-slate-800 font-bold">{penyerah.nama} ({penyerah.nipp})</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 font-medium">
                  <span>Pihak Penerima:</span>
                  <span className="text-slate-800 font-bold">{penerima.nama} ({penerima.nipp})</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 font-medium">
                  <span>Pihak Penandatangan Kedua:</span>
                  <span className="text-[#f05a22] font-bold">User ID #{penyerahUserId}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 font-medium pt-1 border-t border-slate-200">
                  <span>Jumlah Barang Diserahkan:</span>
                  <span className="text-slate-900 font-bold">{items.length} Unit Item</span>
                </div>
              </div>

              {/* PIN Tanda Tangan Pembuat (signature_pin) */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  <label className="font-bold text-slate-800 block">
                    PIN Tanda Tangan Pembuat (`signature_pin`) *
                  </label>
                </div>
                <input
                  type="password"
                  value={signaturePin}
                  onChange={(e) => setSignaturePin(e.target.value)}
                  placeholder="Masukkan PIN tanda tangan (contoh: 123456)"
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-slate-900 font-mono tracking-widest font-bold focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
                <p className="text-[10px] text-amber-800 leading-tight">
                  Wajib diisi saat <code>submit=true</code> untuk memvalidasi tanda tangan digital resmi pembuat BAST.
                </p>
              </div>

              {/* Canvas / Tanda Tangan */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 block">
                    Goreskan Tanda Tangan Digital Anda *
                  </label>
                  {hasServerSignature && (
                    <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-semibold">
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
                        onClick={() => setSignatureMode('saved')}
                        className={`px-2 py-0.5 rounded-md transition-all ${
                          signatureMode === 'saved'
                            ? 'bg-white text-[#f05a22] shadow-2xs font-bold'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Tanda Tangan Tersimpan
                      </button>
                    </div>
                  )}
                </div>

                {signatureMode === 'draw' ? (
                  <div>
                    <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-white transition-colors overflow-hidden group">
                      <canvas
                        ref={canvasRef}
                        width={520}
                        height={160}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-40 cursor-crosshair touch-none"
                      />
                      {!hasDrawnSignature && (
                        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 gap-1.5">
                          <PenTool className="w-5 h-5 text-slate-300 group-hover:scale-110 transition-transform" />
                          <span className="text-[11px] font-medium">
                            Goreskan tanda tangan digital di area ini menggunakan mouse atau layar sentuh
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-1.5">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {hasDrawnSignature ? '✓ Tanda tangan siap dibubuhkan' : 'Wajib menggambar tanda tangan'}
                      </span>
                      <button
                        type="button"
                        onClick={handleClearSignature}
                        className="inline-flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-800 font-semibold py-0.5 px-2 rounded hover:bg-rose-50 transition-colors"
                      >
                        <Eraser className="w-3 h-3" />
                        Hapus / Ulangi
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col items-center justify-center min-h-36">
                    {serverSignatureUrl ? (
                      <div className="text-center space-y-2">
                        <img
                          src={serverSignatureUrl}
                          alt="Tanda Tangan Tersimpan"
                          className="h-24 max-w-full object-contain mx-auto"
                        />
                        <p className="text-[11px] text-emerald-700 font-semibold">
                          ✓ Menggunakan Tanda Tangan Resmi Profil Pegawai
                        </p>
                      </div>
                    ) : (
                      <p className="text-slate-400">Tidak ada tanda tangan tersimpan di profil akun Anda.</p>
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
                  Saya menyatakan dengan sesungguhnya bahwa Berita Acara Serah Terima Barang ini telah dibuat dengan benar, dan saya menandatangani serta mengirimkan dokumen ini langsung ke pihak penandatangan kedua.
                </span>
              </label>

              {/* Error Message inside modal */}
              {signatureError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{signatureError}</span>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsSignatureModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={isSubmitting || (signatureMode === 'draw' && !hasDrawnSignature) || !signaturePin}
                onClick={() => handleSubmitDocument(true)}
                className="px-5 py-2 text-xs font-bold text-white bg-[#f05a22] hover:bg-[#d94e18] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all flex items-center gap-2 shadow-sm"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Tanda Tangani & Kirim ke Pihak Kedua
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* --- MODAL 2: CARI BERDASARKAN NIPP (NIPP SELECTION MODAL) --- */}
      {/* ========================================================================= */}
      {isSearchNippModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-[#0a192f] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-[#f05a22]" />
                <div>
                  <h3 className="font-bold text-sm">Pilih Pihak Penerima Berdasarkan NIPP</h3>
                  <p className="text-[10px] text-slate-300">Pencarian pegawai master SDM PT KAI</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSearchNippModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={nippSearchQuery}
                onChange={(e) => setNippSearchQuery(e.target.value)}
                placeholder="Ketik NIPP (contoh: P002) atau nama pegawai..."
                className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#f05a22]"
              />
            </div>

            <div className="p-3 max-h-80 overflow-y-auto space-y-1.5">
              {allPegawai
                .filter((p) => {
                  const q = nippSearchQuery.toLowerCase();
                  return (
                    !q ||
                    p.nama.toLowerCase().includes(q) ||
                    p.nipp.toLowerCase().includes(q) ||
                    (p.jabatan || '').toLowerCase().includes(q)
                  );
                })
                .map((p) => (
                  <div
                    key={p.nipp}
                    onClick={() => handleSelectPegawaiPenerima(p)}
                    className="p-3 rounded-lg border border-slate-200/80 hover:border-orange-300 hover:bg-orange-50/50 cursor-pointer flex items-center justify-between transition-colors group"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-[#f05a22]">
                        {p.nama}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                        NIPP: <span className="font-mono font-bold text-slate-700">{p.nipp}</span> • {p.jabatan}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {p.tempat_kedudukan} • User ID: #{p.id || 25}
                      </div>
                    </div>
                    <span className="text-[11px] bg-orange-100 group-hover:bg-[#f05a22] text-[#f05a22] group-hover:text-white font-bold px-2.5 py-1 rounded-md transition-colors shadow-2xs">
                      Pilih
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* --- MODAL 3: TAMBAH / EDIT BARIS BARANG MANUAL --- */}
      {/* ========================================================================= */}
      {isEditModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-[#0a192f] text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {items.some((i) => i.id === editingItem.id) ? 'Edit Rincian Barang' : 'Tambah Baris Barang'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3.5 text-xs max-h-[75vh] overflow-y-auto">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Barang *</label>
                <input
                  type="text"
                  value={editingItem.nama_barang}
                  onChange={(e) => setEditingItem({ ...editingItem, nama_barang: e.target.value })}
                  placeholder="Contoh: Laptop Dell"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Brand / Series</label>
                <input
                  type="text"
                  value={editingItem.brand_series || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, brand_series: e.target.value })}
                  placeholder="Contoh: Latitude 5440"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nomor Inventaris *</label>
                  <input
                    type="text"
                    value={editingItem.no_inventaris}
                    onChange={(e) => setEditingItem({ ...editingItem, no_inventaris: e.target.value })}
                    placeholder="Contoh: INV-001"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold text-[#f05a22]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Serial Number (SN)</label>
                  <input
                    type="text"
                    value={editingItem.serial_number || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, serial_number: e.target.value })}
                    placeholder="Contoh: SN-001"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Keterangan Barang</label>
                <input
                  type="text"
                  value={editingItem.keterangan || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, keterangan: e.target.value })}
                  placeholder="Contoh: Kondisi baik"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleSaveEditedItem(editingItem)}
                className="px-4 py-1.5 text-xs font-semibold bg-[#0a192f] hover:bg-[#122b52] text-white rounded-lg"
              >
                Simpan Barang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* --- MODAL 4: PILIH DARI MASTER INVENTARIS SAP --- */}
      {/* ========================================================================= */}
      {isSapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]">
            <div className="bg-[#0a192f] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="font-bold text-sm">Pilih Aset dari Master Inventaris SAP</h3>
                  <p className="text-[11px] text-slate-300">Aset yang dipilih akan dimasukkan ke dalam daftar BAST</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSapModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={sapSearchTerm}
                onChange={(e) => setSapSearchTerm(e.target.value)}
                placeholder="Cari nomor inventaris atau nama perangkat..."
                className="w-full text-xs bg-transparent focus:outline-none text-slate-800"
              />
            </div>

            <div className="overflow-y-auto p-4 flex-1">
              {isLoadingAssets ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
                  <p className="text-xs">Mengambil data dari server SAP...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sapAssets
                    .filter((a) => {
                      const q = sapSearchTerm.toLowerCase();
                      return (
                        !q ||
                        (a.nama || a.nama_aset || '').toLowerCase().includes(q) ||
                        (a.no_inventaris || '').toLowerCase().includes(q)
                      );
                    })
                    .map((asset) => {
                      const isChecked = selectedSapIds.includes(asset.id);
                      return (
                        <div
                          key={asset.id}
                          onClick={() => {
                            setSelectedSapIds((prev) =>
                              isChecked ? prev.filter((id) => id !== asset.id) : [...prev, asset.id]
                            );
                          }}
                          className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition-colors ${
                            isChecked ? 'border-blue-500 bg-blue-50/60' : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="rounded text-blue-600"
                            />
                            <div>
                              <div className="text-xs font-bold text-slate-900">{asset.nama || asset.nama_aset}</div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                Brand/Series: {asset.brand || 'Standar KAI'} • SN: {asset.serial_number || '-'}
                              </div>
                            </div>
                          </div>
                          <span className="font-mono text-xs font-bold text-[#f05a22]">
                            #{asset.no_inventaris || asset.nomor_aset}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                {selectedSapIds.length} item dipilih
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsSapModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={selectedSapIds.length === 0}
                  onClick={handleImportSelectedSap}
                  className="px-4 py-1.5 text-xs font-semibold bg-[#f05a22] hover:bg-[#d94e18] disabled:opacity-50 text-white rounded-lg shadow-xs"
                >
                  Tambahkan ke Formulir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* --- MODAL 5: PRATINJAU FORMAT CETAK BAST (PDF A4) --- */}
      {/* ========================================================================= */}
      {isPreviewPdfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="bg-[#0a192f] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="font-bold text-sm">Pratinjau Berita Acara Serah Terima Barang Fisik (A4)</h3>
                  <p className="text-[11px] text-slate-300">Format standar PT Kereta Api Indonesia (Persero)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewPdfModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto bg-slate-100 flex-1 flex justify-center">
              <div className="bg-white shadow-md border border-slate-300 w-full max-w-2xl p-8 text-slate-900 text-[11px] space-y-4">
                <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold tracking-wider text-[#003580]">PT KERETA API INDONESIA (PERSERO)</h2>
                    <p className="text-[10px] text-slate-500 font-semibold">{generalData.nama_unit.toUpperCase()} - {generalData.wilayah.toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] border border-rose-600 text-rose-600 font-bold px-2 py-0.5">
                      RESMI
                    </span>
                    <p className="text-[10px] font-mono text-slate-500 mt-1">FR.BAST/HO-01/{new Date().getFullYear()}</p>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wide">
                    BERITA ACARA SERAH TERIMA BARANG
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Nomor: BAST-HO01/{generalData.wilayah.replace(/\s+/g, '')}/{new Date().getFullYear()}/DRAFT
                  </p>
                </div>

                <p className="leading-relaxed">
                  Pada hari ini, tanggal <strong>{new Date(generalData.tanggal_serah_terima).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>, bertempat di <strong>{generalData.tempat_serah_terima}</strong>, telah dilaksanakan serah terima fisik barang antar pihak di bawah ini:
                </p>

                <div className="space-y-2.5 border-l-2 border-slate-300 pl-3">
                  <div>
                    <strong>PIHAK I (YANG MENYERAHKAN):</strong>
                    <div className="grid grid-cols-3 gap-1 mt-0.5">
                      <span>Nama / NIPP</span>
                      <span className="col-span-2">: {penyerah.nama} ({penyerah.nipp})</span>
                      <span>Jabatan / Unit</span>
                      <span className="col-span-2">: {penyerah.jabatan}</span>
                      <span>Tempat Kedudukan</span>
                      <span className="col-span-2">: {penyerah.tempat_kedudukan} ({penyerah.personal_area})</span>
                    </div>
                  </div>
                  <div className="pt-1">
                    <strong>PIHAK II (YANG MENERIMA):</strong>
                    <div className="grid grid-cols-3 gap-1 mt-0.5">
                      <span>Nama / NIPP</span>
                      <span className="col-span-2">: {penerima.nama} ({penerima.nipp})</span>
                      <span>Jabatan / Unit</span>
                      <span className="col-span-2">: {penerima.jabatan}</span>
                      <span>Tempat Kedudukan</span>
                      <span className="col-span-2">: {penerima.tempat_kedudukan} ({penerima.personal_area})</span>
                    </div>
                  </div>
                </div>

                <table className="w-full border-collapse border border-slate-400 text-[10px] mt-2">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-400 p-1 text-center w-6">No</th>
                      <th className="border border-slate-400 p-1">Nama Barang</th>
                      <th className="border border-slate-400 p-1">Brand / Series</th>
                      <th className="border border-slate-400 p-1">No. Inventaris</th>
                      <th className="border border-slate-400 p-1">Serial Number</th>
                      <th className="border border-slate-400 p-1">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, i) => (
                      <tr key={it.id || i}>
                        <td className="border border-slate-400 p-1 text-center">{i + 1}</td>
                        <td className="border border-slate-400 p-1 font-semibold">{it.nama_barang}</td>
                        <td className="border border-slate-400 p-1">{it.brand_series || '-'}</td>
                        <td className="border border-slate-400 p-1 font-mono">{it.no_inventaris}</td>
                        <td className="border border-slate-400 p-1 font-mono">{it.serial_number || '-'}</td>
                        <td className="border border-slate-400 p-1">{it.keterangan || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Signatures of the two parties (no approval column) */}
                <div className="grid grid-cols-2 pt-6 text-center">
                  <div>
                    <p className="font-semibold">Yang Menyerahkan (Pihak I)</p>
                    <div className="h-16 flex items-center justify-center text-slate-400 italic text-[10px]">
                      [ Tanda Tangan Digital Pembuat ]
                    </div>
                    <p className="font-bold underline">{penyerah.nama}</p>
                    <p className="text-[10px] text-slate-500">NIPP. {penyerah.nipp}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Yang Menerima (Pihak II)</p>
                    <div className="h-16 flex items-center justify-center text-slate-400 italic text-[10px]">
                      [ Menunggu Tanda Tangan Pihak Kedua ]
                    </div>
                    <p className="font-bold underline">{penerima.nama}</p>
                    <p className="text-[10px] text-slate-500">NIPP. {penerima.nipp}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <span className="text-xs text-slate-500">
                Alur BAST dua pihak: Pembuat menandatangani langsung dan mengirim ke Pihak Kedua (User #{penyerahUserId}).
              </span>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 text-xs font-semibold bg-[#0a192f] text-white rounded-lg flex items-center gap-1.5 shadow-2xs hover:bg-[#122b52]"
              >
                <Download className="w-3.5 h-3.5" /> Cetak Dokumen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
