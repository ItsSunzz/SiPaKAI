import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FileCheck2,
  Plus,
  Trash2,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Building2,
  UserCheck,
  Calendar,
  Lock,
  ShieldCheck,
  Sparkles,
  Save,
  Check,
  Clock,
  Hammer,
  HardDrive,
  Flame,
  Scissors,
  Search,
  X,
  ExternalLink,
  Shield,
  Download,
  Eye
} from 'lucide-react';
import { api } from '../services/api';
import KaiLogo from '../components/KaiLogo';

// Preset metode pemusnahan KAI
const METODE_OPTIONS = [
  {
    id: 'Penghancuran fisik',
    label: 'Penghancuran Fisik & Shredder (Physical Shredding & Crushing)',
    desc: 'Penghancuran mekanis menggunakan shredder industri & mesin press hidrolik hingga komponen terfragmentasi total.'
  },
  {
    id: 'Degaussing magnetik',
    label: 'Degaussing Magnetik & Sanitasi Media Penyimpanan',
    desc: 'Demagnetisasi medan magnetik skala tinggi (minimal 10.000 Gauss) untuk memastikan data sensitif terhapus permanen.'
  },
  {
    id: 'Scrap dismantling',
    label: 'Scrap Dismantling & Pemotongan Logam (Cutting)',
    desc: 'Pembongkaran rangka rak, casing server, dan pemotongan sasis logam menjadi scrap besi afval.'
  },
  {
    id: 'Pembakaran terkendali',
    label: 'Pembakaran Terkendali (High-Temperature Incineration)',
    desc: 'Pemusnahan material non-logam tertentu melalui pembakar suhu tinggi sesuai regulasi lingkungan.'
  }
];

export default function BaPemusnahanFormPage({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Approver / Users list from backend
  const [apiUsers, setApiUsers] = useState([]);
  const [isLoadingApprovers, setIsLoadingApprovers] = useState(false);

  // Modal Import dari DSP-01
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [approvedDsp01List, setApprovedDsp01List] = useState([]);
  const [isLoadingDsp01, setIsLoadingDsp01] = useState(false);

  // Modal PDF Preview (like BAST module)
  const [isPreviewPdfModalOpen, setIsPreviewPdfModalOpen] = useState(false);
  const [previewPdfBlobUrl, setPreviewPdfBlobUrl] = useState(null);
  const [isLoadingPreviewPdf, setIsLoadingPreviewPdf] = useState(false);
  const [previewPdfError, setPreviewPdfError] = useState(null);

  // --- Form State ---
  // 1. Informasi Berita Acara & Header (sesuai backend DocumentSchema dsp02)
  const [formData, setFormData] = useState({
    number: `BA-PMS/TI/DAOP1/${new Date().getMonth() + 1}-${new Date().getFullYear()}/00${Math.floor(10 + Math.random() * 89)}`,
    nomor_referensi: 'PMH/0001/X/2026',
    business_area: user?.location || 'Kantor Pusat Bandung',
    tanggal_pelaksanaan: new Date().toISOString().split('T')[0],
    waktu_pelaksanaan: '10:00',
    lokasi: 'Workshop TI Balai Yasa Manggarai',
    konfirmasi_backup: true,
  });

  // 2. 4 Verifikator (sesuai backend DocumentSchema & dsp02.blade.php)
  const [verifikator1, setVerifikator1] = useState(''); // Tim Pemusnahan / Administrator
  const [verifikator2, setVerifikator2] = useState(''); // Pengelola Aset
  const [verifikator3, setVerifikator3] = useState(''); // Atasan Pengguna Aset
  const [verifikator4, setVerifikator4] = useState(''); // VP IT Operation / Pimpinan Unit SI

  // Helper to normalize jenis_aset to match backend DocumentSchema::JENIS_ASET ('Fisik,Jaringan,Informasi,Informasi HC,Informasi SC')
  const normalizeJenisAset = (val) => {
    if (!val) return 'Fisik';
    const str = String(val).toLowerCase();
    if (str.includes('jaringan') || str.includes('network')) return 'Jaringan';
    if (str.includes('hc') || str.includes('hardcopy')) return 'Informasi HC';
    if (str.includes('sc') || str.includes('softcopy')) return 'Informasi SC';
    if (str.includes('informasi') || str.includes('software') || str.includes('lisensi') || str.includes('aplikasi')) return 'Informasi';
    return 'Fisik';
  };

  const JENIS_ASET_OPTIONS = [
    { value: 'Fisik', label: 'Fisik (Server, Hardware, Komputer, Media)' },
    { value: 'Jaringan', label: 'Jaringan (Switch, Router, AP, Firewall)' },
    { value: 'Informasi', label: 'Informasi (Data Digital & Dokumen)' },
    { value: 'Informasi HC', label: 'Informasi HC (Hardcopy / Cetak Fisik)' },
    { value: 'Informasi SC', label: 'Informasi SC (Softcopy / Media Elektronik)' },
  ];

  // 3. Rincian Aset yang Dimusnahkan (items)
  const [items, setItems] = useState([
    {
      id: 1,
      nama_aset: 'Hard Disk Enterprise SAS 600GB 15k RPM',
      jenis_aset: 'Fisik',
      id_aset: 'AST-TI-2018-0912',
      jumlah: 4,
      satuan: 'Unit',
      metode_pemusnahan: 'Degaussing magnetik',
      keterangan: 'Piringan hancur shredder & demagnetisasi data selesai',
    },
    {
      id: 2,
      nama_aset: 'Server Rak Dell PowerEdge R730',
      jenis_aset: 'Fisik',
      id_aset: 'AST-TI-2017-0419',
      jumlah: 1,
      satuan: 'Unit',
      metode_pemusnahan: 'Penghancuran fisik',
      keterangan: 'Mainboard dipatahkan, casing dipotong scrap afval',
    }
  ]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load registered approvers from backend
  useEffect(() => {
    async function loadApprovers() {
      setIsLoadingApprovers(true);
      try {
        const res = await api.getApprovers('all=1').catch(() => null);
        const list = Array.isArray(res) ? res : (res?.data || []);
        setApiUsers(list);

        if (list.length > 0) {
          // Smart default assignment based on roles / positions
          const v1User = list.find(u => {
            const role = (u.role || '').toLowerCase();
            const jab = (typeof u.jabatan === 'object' ? u.jabatan?.nama : u.jabatan || '').toLowerCase();
            return role === 'admin' || jab.includes('admin') || jab.includes('pelaksana') || jab.includes('spv');
          }) || list[0];

          const v2User = list.find(u => {
            const jab = (typeof u.jabatan === 'object' ? u.jabatan?.nama : u.jabatan || '').toLowerCase();
            return (jab.includes('pengelola') || jab.includes('aset') || jab.includes('fasilitas')) && u.id !== v1User?.id;
          }) || list.find(u => u.id !== v1User?.id) || list[1] || list[0];

          const v3User = list.find(u => {
            const jab = (typeof u.jabatan === 'object' ? u.jabatan?.nama : u.jabatan || '').toLowerCase();
            return (jab.includes('manager') || jab.includes('atasan') || jab.includes('asmen')) &&
              u.id !== v1User?.id && u.id !== v2User?.id;
          }) || list.find(u => u.id !== v1User?.id && u.id !== v2User?.id) || list[2] || list[0];

          const v4User = list.find(u => {
            const jab = (typeof u.jabatan === 'object' ? u.jabatan?.nama : u.jabatan || '').toLowerCase();
            return (jab.includes('vp') || jab.includes('vice') || jab.includes('pimpinan') || jab.includes('kdaop')) &&
              u.id !== v1User?.id && u.id !== v2User?.id && u.id !== v3User?.id;
          }) || list.find(u => u.id !== v1User?.id && u.id !== v2User?.id && u.id !== v3User?.id) || list[3] || list[0];

          if (v1User && !verifikator1) setVerifikator1(String(v1User.id));
          if (v2User && !verifikator2) setVerifikator2(String(v2User.id));
          if (v3User && !verifikator3) setVerifikator3(String(v3User.id));
          if (v4User && !verifikator4) setVerifikator4(String(v4User.id));
        }
      } catch (err) {
        console.error('Failed to load approvers:', err);
      } finally {
        setIsLoadingApprovers(false);
      }
    }
    loadApprovers();
  }, [user]);

  // Load existing document if edit mode
  useEffect(() => {
    if (!isEditMode) return;

    const loadDoc = async () => {
      setIsLoading(true);
      try {
        const res = await api.getDocument(id).catch(() => null);
        const docData = res?.document || res;
        if (docData) {
          const d = docData.data || {};
          setFormData({
            number: docData.number || docData.nomor,
            nomor_referensi: d.nomor_referensi || d.nomor_dsp01 || docData.ref_number || 'PMH/0001/X/2026',
            business_area: d.business_area || d.wilayah || 'Kantor Pusat Bandung',
            tanggal_pelaksanaan: d.tanggal_pelaksanaan || docData.created_at?.split('T')[0] || '',
            waktu_pelaksanaan: d.waktu_pelaksanaan || '10:00',
            lokasi: d.lokasi || 'Workshop Balai Yasa Manggarai',
            konfirmasi_backup: d.konfirmasi_backup ?? true,
          });

          if (d.verifikator_1_id) setVerifikator1(String(d.verifikator_1_id));
          if (d.verifikator_2_id) setVerifikator2(String(d.verifikator_2_id));
          if (d.verifikator_3_id) setVerifikator3(String(d.verifikator_3_id));
          if (d.verifikator_4_id) setVerifikator4(String(d.verifikator_4_id));

          const rawItems = docData.items || d.items;
          if (Array.isArray(rawItems) && rawItems.length > 0) {
            setItems(rawItems.map((it, idx) => ({
              id: it.id || idx + 1,
              nama_aset: it.nama_aset || it.nama || '',
              jenis_aset: normalizeJenisAset(it.jenis_aset || it.kategori),
              id_aset: it.id_aset || it.no_inventaris || '',
              jumlah: it.jumlah || 1,
              satuan: it.satuan || 'Unit',
              metode_pemusnahan: it.metode_pemusnahan || 'Penghancuran fisik',
              keterangan: it.keterangan || it.hasil_pemusnahan || '',
            })));
          }
        }
      } catch (err) {
        setErrorMessage('Gagal memuat dokumen berita acara.');
      } finally {
        setIsLoading(false);
      }
    };

    loadDoc();
  }, [id, isEditMode]);

  // Load Approved DSP-01 Documents for Import
  const handleOpenImportModal = async () => {
    setIsImportModalOpen(true);
    setIsLoadingDsp01(true);
    try {
      const res = await api.getDocuments({ type: 'dsp01' }).catch(() => null);
      if (res?.data && res.data.length > 0) {
        setApprovedDsp01List(res.data);
      } else {
        // Fallback sample approved DSP-01
        setApprovedDsp01List([
          {
            id: 1,
            number: 'PMH/0001/X/2026',
            status: 'approved',
            requester_name: 'Fajar Prasetyo',
            requester_unit: 'Kepala Stasiun Gambir',
            date: '24 Okt 2025',
            items: [
              { nama_aset: 'Server Dell PowerEdge R740', id_aset: '104-KAI-SRV-2018', jumlah: 1, satuan: 'Unit', jenis_aset: 'Hardware', alasan: 'Kerusakan fatal motherboard' },
              { nama_aset: 'Cisco Catalyst 3850 48-Port PoE', id_aset: 'MAC-7721-CC-081', jumlah: 2, satuan: 'Unit', jenis_aset: 'Network', alasan: 'Port modul korsleting sambaran petir' }
            ]
          },
          {
            id: 2,
            number: 'PMH/0002/X/2026',
            status: 'approved',
            requester_name: 'Ezar Athilla',
            requester_unit: 'Spv Jaringan TI DAOP 1',
            date: '22 Okt 2025',
            items: [
              { nama_aset: 'Hard Disk SAS 600GB Server Juanda', id_aset: 'AST-HDD-2018-091', jumlah: 6, satuan: 'Unit', jenis_aset: 'Storage', alasan: 'Bad sector masif' },
              { nama_aset: 'UPS Liebert GXT4 3000VA', id_aset: 'UPS-LIB-3000-09', jumlah: 1, satuan: 'Unit', jenis_aset: 'Hardware', alasan: 'Baterai bocor & inverter rusak' }
            ]
          }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingDsp01(false);
    }
  };

  const handleSelectDsp01 = (dspDoc) => {
    setFormData(prev => ({
      ...prev,
      nomor_referensi: dspDoc.number || `PMH/000${dspDoc.id}/X/2026`,
      business_area: dspDoc.requester_unit || prev.business_area,
    }));

    if (dspDoc.items && dspDoc.items.length > 0) {
      const mappedItems = dspDoc.items.map((it, idx) => ({
        id: Date.now() + idx,
        nama_aset: it.nama_aset || it.nama || 'Aset TI Terkait',
        jenis_aset: normalizeJenisAset(it.jenis_aset || it.kategori || it.jenis),
        id_aset: it.id_aset || it.no_inventaris || `AST-KAI-${Date.now()}-${idx + 1}`,
        jumlah: it.jumlah || 1,
        satuan: it.satuan || 'Unit',
        metode_pemusnahan: 'Penghancuran fisik',
        keterangan: it.alasan_pemusnahan || it.alasan || 'Dimusnahkan sesuai persetujuan DSP-01',
      }));
      setItems(mappedItems);
    }

    setIsImportModalOpen(false);
    showToast(`Data aset berhasil diimpor dari Permohonan Pemusnahan ${dspDoc.number}`);
  };

  // Build Payload according to Backend Schema
  const buildPayload = (submitNow = true) => {
    const primaryApproverId = verifikator1
      ? Number(verifikator1)
      : (verifikator2 ? Number(verifikator2) : (verifikator3 ? Number(verifikator3) : (verifikator4 ? Number(verifikator4) : null)));

    return {
      type: 'dsp02',
      submit: submitNow,
      approver_id: submitNow ? primaryApproverId : undefined,
      status: submitNow ? 'pending' : 'draft',
      number: formData.number,
      data: {
        nomor_referensi: formData.nomor_referensi,
        business_area: formData.business_area,
        tanggal_pelaksanaan: formData.tanggal_pelaksanaan,
        waktu_pelaksanaan: formData.waktu_pelaksanaan,
        lokasi: formData.lokasi,
        konfirmasi_backup: Boolean(formData.konfirmasi_backup),
        verifikator_1_id: verifikator1 ? Number(verifikator1) : null,
        verifikator_2_id: verifikator2 ? Number(verifikator2) : null,
        verifikator_3_id: verifikator3 ? Number(verifikator3) : null,
        verifikator_4_id: verifikator4 ? Number(verifikator4) : null,
        approval_chain: [
          verifikator1 ? Number(verifikator1) : null,
          verifikator2 ? Number(verifikator2) : null,
          verifikator3 ? Number(verifikator3) : null,
          verifikator4 ? Number(verifikator4) : null,
        ].filter(Boolean),
      },
      items: items.map(it => ({
        nama_aset: it.nama_aset,
        jenis_aset: normalizeJenisAset(it.jenis_aset),
        id_aset: it.id_aset || '-',
        jumlah: Number(it.jumlah) || 1,
        satuan: it.satuan || 'Unit',
        metode_pemusnahan: it.metode_pemusnahan || 'Penghancuran fisik',
        keterangan: it.keterangan || 'Dimusnahkan',
      }))
    };
  };

  // Preview PDF Modal Handler (similar to BAST module)
  const handleOpenPreviewPdf = async () => {
    if (items.some(it => !it.nama_aset.trim())) {
      setErrorMessage('Mohon lengkapi nama semua aset yang dimusnahkan sebelum melakukan pratinjau.');
      return;
    }

    setIsPreviewPdfModalOpen(true);
    setIsLoadingPreviewPdf(true);
    setPreviewPdfError(null);

    if (previewPdfBlobUrl) {
      URL.revokeObjectURL(previewPdfBlobUrl);
      setPreviewPdfBlobUrl(null);
    }

    try {
      const payload = buildPayload(false);
      const blob = await api.previewPdf(payload);
      const url = URL.createObjectURL(blob);
      setPreviewPdfBlobUrl(url);
    } catch (err) {
      console.error('Gagal memuat pratinjau PDF:', err);
      setPreviewPdfError(err.message || 'Gagal menghasilkan pratinjau PDF dari server SIPAKAI.');
    } finally {
      setIsLoadingPreviewPdf(false);
    }
  };

  const handleClosePreviewPdf = () => {
    setIsPreviewPdfModalOpen(false);
    if (previewPdfBlobUrl) {
      URL.revokeObjectURL(previewPdfBlobUrl);
      setPreviewPdfBlobUrl(null);
    }
  };

  // Handle Item Changes
  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      {
        id: Date.now(),
        nama_aset: '',
        jenis_aset: 'Fisik',
        id_aset: '',
        jumlah: 1,
        satuan: 'Unit',
        metode_pemusnahan: 'Penghancuran fisik',
        keterangan: 'Pemusnahan fisik & sanitasi data',
      }
    ]);
  };

  const handleItemChange = (idx, field, val) => {
    setItems(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleRemoveItem = (idx) => {
    if (items.length <= 1) {
      alert('Minimal wajib ada 1 item aset yang dimusnahkan.');
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  // Handle Submission
  const handleSubmit = async (submitNow = true) => {
    if (items.some(it => !it.nama_aset.trim())) {
      setErrorMessage('Mohon lengkapi nama semua aset yang dimusnahkan.');
      window.scrollTo({ top: 300, behavior: 'smooth' });
      return;
    }

    if (!formData.tanggal_pelaksanaan) {
      setErrorMessage('Hari & Tanggal pelaksanaan wajib diisi.');
      return;
    }

    if (!formData.lokasi.trim()) {
      setErrorMessage('Lokasi / Unit Kerja pelaksanaan wajib diisi.');
      return;
    }

    if (submitNow && !verifikator1) {
      setErrorMessage('Pilih minimal Pejabat Verifikator Tahap 1 (Saksi Tim) sebelum mengajukan Berita Acara.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload = buildPayload(submitNow);

    try {
      let resDoc = null;
      if (isEditMode) {
        resDoc = await api.updateDocument(id, payload);
      } else {
        resDoc = await api.createDocument(payload);
      }

      const createdDocId = resDoc?.document?.id || resDoc?.id || id;

      showToast(submitNow ? 'Berita Acara Pemusnahan berhasil diterbitkan dan diajukan ke sistem!' : 'Draf Berita Acara berhasil disimpan di sistem.');

      setTimeout(() => {
        navigate(createdDocId ? `/berita-acara-pemusnahan/${createdDocId}` : '/berita-acara-pemusnahan');
      }, 1000);

    } catch (err) {
      console.error('Gagal memproses Berita Acara:', err);
      setErrorMessage(err.message || 'Terjadi kesalahan saat memproses Berita Acara ke server SIPAKAI.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getApproverDetail = (userId) => {
    if (!userId) return null;
    return apiUsers.find(u => String(u.id) === String(userId));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-[#003580] mb-2" />
        <p className="text-xs font-semibold">Memuat data Berita Acara Pemusnahan...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-28 select-none">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/berita-acara-pemusnahan')}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-colors shadow-2xs"
            title="Kembali ke Daftar"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-[#003580]/10 text-[#003580] text-xs font-bold border border-[#003580]/20 font-mono">
                DSP-02
              </span>
              <span className="text-xs text-slate-400 font-medium font-mono">
                FR.SM/TI/011.006/10-2020
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mt-1">
              {isEditMode ? 'Edit Berita Acara Pemusnahan Aset' : 'Buat Berita Acara Pemusnahan Aset TI'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenImportModal}
            className="px-4 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-2xs"
          >
            <Sparkles className="w-4 h-4 text-sky-600" />
            <span>Impor Data Permohonan (DSP-01)</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium flex items-center gap-3 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="flex-1">{errorMessage}</div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-800 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* SECTION 1: Informasi Dokumen & Pelaksanaan */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-[#003580]/10 text-[#003580] flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">1. Informasi Referensi &amp; Pelaksanaan Eksekusi</h2>
            <p className="text-xs text-slate-500">Nomor rujukan disposisi permohonan pemusnahan dan data lokasi fisik.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* No. Berita Acara */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Nomor Berita Acara (Otomatis)
            </label>
            <input
              type="text"
              value={formData.number}
              onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#003580]"
            />
          </div>

          {/* No. Referensi DSP-01 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                No. Referensi (DSP-01) <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleOpenImportModal}
                className="text-[11px] text-[#003580] font-bold hover:underline"
              >
                Pilih Berkas DSP-01
              </button>
            </div>
            <input
              type="text"
              placeholder="Contoh: PMH/0001/X/2026"
              value={formData.nomor_referensi}
              onChange={(e) => setFormData(prev => ({ ...prev, nomor_referensi: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#003580]"
            />
          </div>

          {/* Business Area */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Business Area / Unit Kerja <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Kantor Pusat Bandung / DAOP 1 Jakarta"
              value={formData.business_area}
              onChange={(e) => setFormData(prev => ({ ...prev, business_area: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#003580]"
            />
          </div>

          {/* Tanggal Pelaksanaan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Hari &amp; Tanggal Pelaksanaan <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={formData.tanggal_pelaksanaan}
                onChange={(e) => setFormData(prev => ({ ...prev, tanggal_pelaksanaan: e.target.value }))}
                className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#003580]"
              />
            </div>
          </div>

          {/* Waktu Pelaksanaan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Waktu / Jam Pelaksanaan <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="10:00"
                value={formData.waktu_pelaksanaan}
                onChange={(e) => setFormData(prev => ({ ...prev, waktu_pelaksanaan: e.target.value }))}
                className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#003580]"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Format jam 24 jam (JJ:MM)</span>
          </div>

          {/* Lokasi Fisik */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Lokasi / Workshop Pemusnahan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Workshop TI Balai Yasa Manggarai"
              value={formData.lokasi}
              onChange={(e) => setFormData(prev => ({ ...prev, lokasi: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#003580]"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: Klausul Wajib Konfirmasi Backup Data */}
      <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-5 shadow-2xs">
        <label className="flex items-start gap-3.5 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.konfirmasi_backup}
            onChange={(e) => setFormData(prev => ({ ...prev, konfirmasi_backup: e.target.checked }))}
            className="mt-1 w-4 h-4 text-[#f05a22] border-amber-300 rounded focus:ring-[#f05a22]"
          />
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-950 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              Klausul Sanitasi &amp; Konfirmasi Backup Data (SOP Resmi KAI)
            </span>
            <p className="text-xs text-amber-900/80 leading-relaxed">
              "Sebelumnya, telah dilakukan backup terhadap Informasi yang termuat pada aset dan lisensi yang terkait telah dipindahkan / dihapuskan."
            </p>
          </div>
        </label>
      </div>

      {/* SECTION 3: Rincian Aset yang Dimusnahkan */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#f05a22] flex items-center justify-center shrink-0">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">2. Rincian Objek &amp; Perangkat TI yang Dimusnahkan</h2>
              <p className="text-xs text-slate-500">Daftar item perangkat keras atau media penyimpanan data yang dieksekusi.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddItem}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Aset</span>
          </button>
        </div>

        {/* Table of Items */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap min-w-[850px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase text-slate-500 font-bold">
              <tr>
                <th className="px-3.5 py-3 w-10 text-center">No</th>
                <th className="px-3.5 py-3 min-w-[200px]">Nama Aset</th>
                <th className="px-3.5 py-3 min-w-[150px]">Jenis Aset</th>
                <th className="px-3.5 py-3 min-w-[130px]">ID / No. Inventaris</th>
                <th className="px-3.5 py-3 w-24">Jumlah</th>
                <th className="px-3.5 py-3 w-24">Satuan</th>
                <th className="px-3.5 py-3 min-w-[180px]">Metode Pemusnahan</th>
                <th className="px-3.5 py-3 min-w-[180px]">Keterangan Hasil</th>
                <th className="px-3.5 py-3 w-12 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((it, idx) => (
                <tr key={it.id || idx} className="hover:bg-slate-50/50">
                  <td className="px-3.5 py-2.5 text-center text-slate-400 font-bold">
                    {idx + 1}
                  </td>
                  <td className="px-3.5 py-2.5">
                    <input
                      type="text"
                      placeholder="Nama & tipe aset..."
                      value={it.nama_aset}
                      onChange={(e) => handleItemChange(idx, 'nama_aset', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-[#003580]"
                    />
                  </td>
                  <td className="px-3.5 py-2.5">
                    <select
                      value={normalizeJenisAset(it.jenis_aset)}
                      onChange={(e) => handleItemChange(idx, 'jenis_aset', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-[#003580]"
                    >
                      {JENIS_ASET_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3.5 py-2.5">
                    <input
                      type="text"
                      placeholder="AST-KAI-XXXX"
                      value={it.id_aset}
                      onChange={(e) => handleItemChange(idx, 'id_aset', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-[#003580]"
                    />
                  </td>
                  <td className="px-3.5 py-2.5">
                    <input
                      type="number"
                      min="1"
                      value={it.jumlah}
                      onChange={(e) => handleItemChange(idx, 'jumlah', Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-[#003580]"
                    />
                  </td>
                  <td className="px-3.5 py-2.5">
                    <input
                      type="text"
                      value={it.satuan}
                      onChange={(e) => handleItemChange(idx, 'satuan', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-[#003580]"
                    />
                  </td>
                  <td className="px-3.5 py-2.5">
                    <select
                      value={it.metode_pemusnahan}
                      onChange={(e) => handleItemChange(idx, 'metode_pemusnahan', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-[#003580]"
                    >
                      <option value="Penghancuran fisik">Penghancuran Fisik & Shredder</option>
                      <option value="Degaussing magnetik">Degaussing Magnetik</option>
                      <option value="Scrap dismantling">Scrap Dismantling & Cutting</option>
                      <option value="Pembakaran terkendali">Pembakaran Terkendali</option>
                    </select>
                  </td>
                  <td className="px-3.5 py-2.5">
                    <input
                      type="text"
                      placeholder="Contoh: Piringan hancur shredder"
                      value={it.keterangan}
                      onChange={(e) => handleItemChange(idx, 'keterangan', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-[#003580]"
                    />
                  </td>
                  <td className="px-3.5 py-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Hapus baris aset"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 4: Tim Verifikator & Para Pihak Penandatangan */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">3. Tim Otorisasi &amp; 4 Verifikator Pengesahan</h2>
            <p className="text-xs text-slate-500">Para saksi dan pejabat otorisator yang menandatangani Berita Acara secara elektronik (BSrE).</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 1. Tim Pemusnahan / Administrator */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#003580] text-white flex items-center justify-center text-[10px] font-bold">1</span>
                Administrator / Tim Pemusnahan
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100/70 text-blue-900">
                Pihak 1
              </span>
            </div>
            <select
              value={verifikator1}
              onChange={(e) => setVerifikator1(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#003580]"
            >
              <option value="">-- Pilih Tim Pemusnahan / Admin --</option>
              {apiUsers.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name || u.nama} ({u.nip || 'NIP -'}) &bull; {typeof u.jabatan === 'object' ? u.jabatan?.nama : (u.jabatan || 'Staf')}
                </option>
              ))}
            </select>
            {getApproverDetail(verifikator1) && (
              <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded-lg border border-slate-100 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#003580] text-white flex items-center justify-center font-bold text-[9px]">
                  {(getApproverDetail(verifikator1).name || 'U').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-slate-800">{getApproverDetail(verifikator1).name}</div>
                  <div className="text-[10px] text-slate-400">{getApproverDetail(verifikator1).unit_kerja || 'Unit Kerja TI'}</div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Pengelola Aset */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#003580] text-white flex items-center justify-center text-[10px] font-bold">2</span>
                Pengelola Aset
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100/70 text-blue-900">
                Pihak 2
              </span>
            </div>
            <select
              value={verifikator2}
              onChange={(e) => setVerifikator2(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#003580]"
            >
              <option value="">-- Pilih Pengelola Aset --</option>
              {apiUsers.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name || u.nama} ({u.nip || 'NIP -'}) &bull; {typeof u.jabatan === 'object' ? u.jabatan?.nama : (u.jabatan || 'Staf')}
                </option>
              ))}
            </select>
            {getApproverDetail(verifikator2) && (
              <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded-lg border border-slate-100 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#003580] text-white flex items-center justify-center font-bold text-[9px]">
                  {(getApproverDetail(verifikator2).name || 'U').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-slate-800">{getApproverDetail(verifikator2).name}</div>
                  <div className="text-[10px] text-slate-400">{getApproverDetail(verifikator2).unit_kerja || 'Unit Kerja TI'}</div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Atasan Pengguna Aset */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#003580] text-white flex items-center justify-center text-[10px] font-bold">3</span>
                Atasan Pengguna Aset
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                Pihak 3
              </span>
            </div>
            <select
              value={verifikator3}
              onChange={(e) => setVerifikator3(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#003580]"
            >
              <option value="">-- Pilih Atasan Pengguna Aset --</option>
              {apiUsers.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name || u.nama} ({u.nip || 'NIP -'}) &bull; {typeof u.jabatan === 'object' ? u.jabatan?.nama : (u.jabatan || 'Staf')}
                </option>
              ))}
            </select>
            {getApproverDetail(verifikator3) && (
              <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded-lg border border-slate-100 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#003580] text-white flex items-center justify-center font-bold text-[9px]">
                  {(getApproverDetail(verifikator3).name || 'U').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-slate-800">{getApproverDetail(verifikator3).name}</div>
                  <div className="text-[10px] text-slate-400">{getApproverDetail(verifikator3).unit_kerja || 'Unit Kerja TI'}</div>
                </div>
              </div>
            )}
          </div>

          {/* 4. VP IT Operation / Pimpinan Unit SI Daerah */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#003580] text-white flex items-center justify-center text-[10px] font-bold">4</span>
                VP IT Operation / Pimpinan Unit SI Daerah
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                Penyetuju Akhir
              </span>
            </div>
            <select
              value={verifikator4}
              onChange={(e) => setVerifikator4(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#003580]"
            >
              <option value="">-- Pilih VP IT Operation / Pimpinan SI --</option>
              {apiUsers.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name || u.nama} ({u.nip || 'NIP -'}) &bull; {typeof u.jabatan === 'object' ? u.jabatan?.nama : (u.jabatan || 'Staf')}
                </option>
              ))}
            </select>
            {getApproverDetail(verifikator4) && (
              <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded-lg border border-slate-100 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#003580] text-white flex items-center justify-center font-bold text-[9px]">
                  {(getApproverDetail(verifikator4).name || 'U').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-slate-800">{getApproverDetail(verifikator4).name}</div>
                  <div className="text-[10px] text-slate-400">{getApproverDetail(verifikator4).unit_kerja || 'Unit Kerja TI'}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 shadow-lg">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('/berita-acara-pemusnahan')}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Batal
          </button>

          <div className="flex items-center gap-3">
            {/* PRATINJAU PDF (seperti modul BAST) */}
            <button
              type="button"
              onClick={handleOpenPreviewPdf}
              className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-2xs"
            >
              <Eye className="w-4 h-4 text-sky-600" />
              <span>Pratinjau PDF</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4 text-slate-500" />
              <span>Simpan Draf</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-[#f05a22] hover:bg-[#d94e1b] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-[#f05a22]/20 transform active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <FileCheck2 className="w-4 h-4" />
                  <span>Terbitkan &amp; Ajukan Berita Acara</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: Import dari Permohonan DSP-01 */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Pilih Berkas Permohonan Pemusnahan (DSP-01)</h3>
                  <p className="text-[11px] text-slate-500">Hanya menampilkan berkas permohonan yang telah disetujui (Approved).</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {isLoadingDsp01 ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#003580]" />
                  <span className="text-xs font-semibold">Memuat dokumen DSP-01 yang telah disetujui...</span>
                </div>
              ) : approvedDsp01List.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Tidak ditemukan dokumen DSP-01 berstatus approved.
                </div>
              ) : (
                approvedDsp01List.map((dsp) => (
                  <div
                    key={dsp.id}
                    onClick={() => handleSelectDsp01(dsp)}
                    className="p-4 rounded-xl border border-slate-200 hover:border-[#003580] hover:bg-slate-50/70 transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-[#003580] group-hover:underline">
                        {dsp.number || `PMH/000${dsp.id}/X/2026`}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                        Disetujui Penuh
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex items-center justify-between">
                      <span>Pemohon: <strong>{dsp.requester_name || dsp.requester?.name || 'Petugas TI'}</strong></span>
                      <span className="text-slate-400">{dsp.date || dsp.requester_unit}</span>
                    </div>

                    {dsp.items && dsp.items.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                        {dsp.items.length} item aset &bull; {dsp.items.map(it => it.nama_aset || it.nama).join(', ')}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Pratinjau Dokumen Backend DomPDF (seperti modul BAST) */}
      {isPreviewPdfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full overflow-hidden border border-slate-200 flex flex-col h-[90vh]">
            <div className="bg-[#0a192f] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="font-bold text-sm">Pratinjau PDF Berita Acara Pemusnahan (DSP-02)</h3>
                  <p className="text-[11px] text-slate-300">Format resmi langsung dari template backend SIPAKAI</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {previewPdfBlobUrl && (
                  <a
                    href={previewPdfBlobUrl}
                    download={`BAP-DSP02-${formData.business_area.replace(/\s+/g, '_') || 'Draft'}.pdf`}
                    className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Unduh PDF
                  </a>
                )}
                <button
                  type="button"
                  onClick={handleClosePreviewPdf}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-100 p-2 sm:p-4 overflow-hidden flex items-center justify-center">
              {isLoadingPreviewPdf ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-500">
                  <Loader2 className="w-8 h-8 text-[#f05a22] animate-spin" />
                  <p className="text-xs font-medium">Menghasilkan pratinjau dokumen dari template backend...</p>
                </div>
              ) : previewPdfError ? (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-xl max-w-md text-center space-y-2">
                  <p className="text-sm font-semibold">Gagal memuat pratinjau PDF</p>
                  <p className="text-xs text-rose-600">{previewPdfError}</p>
                  <button
                    type="button"
                    onClick={handleOpenPreviewPdf}
                    className="mt-2 px-3 py-1.5 text-xs font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                  >
                    Coba Lagi
                  </button>
                </div>
              ) : previewPdfBlobUrl ? (
                <iframe
                  src={previewPdfBlobUrl}
                  title="Pratinjau PDF Berita Acara Pemusnahan"
                  className="w-full h-full rounded-lg border border-slate-300 shadow-sm bg-white"
                />
              ) : null}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
              <span>* Pratinjau dihasilkan langsung menggunakan engine DomPDF backend SIPAKAI.</span>
              <button
                type="button"
                onClick={handleClosePreviewPdf}
                className="px-4 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
