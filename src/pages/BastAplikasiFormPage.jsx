import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Search,
  KeyRound,
  Plus,
  Trash2,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Building2,
  UserCheck,
  PenTool,
  Calendar,
  Eraser,
  Lock,
  Eye,
  EyeOff,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Download,
  X,
  FileCheck,
  Save,
  Check,
  Clock
} from 'lucide-react';
import { api } from '../services/api';
import KaiLogo from '../components/KaiLogo';

// Preset aplikasi KAI untuk percepat input
const KAI_APP_PRESETS = [
  'SAP S/4HANA Finance (FI/CO)',
  'SAP Materials Management (MM)',
  'SirSAK Dispatcher & Perjalanan KA',
  'e-Office Surat Dinas KAI',
  'Cisco AnyConnect VPN Dinas',
  'Portal Single Sign-On (SSO)',
  'Aplikasi Ticketing & RTS',
  'Sistem Monitoring Logistik Stasiun'
];

export default function BastAplikasiFormPage({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  // --- Master Pegawai & NIPP Auto-Suggest ---
  const [apiUsers, setApiUsers] = useState([]);
  const [isSearchNippModalOpen, setIsSearchNippModalOpen] = useState(false);
  const [nippSearchQuery, setNippSearchQuery] = useState('');

  useEffect(() => {
    async function loadPegawai() {
      try {
        const res = await api.getApprovers('all=1').catch(() => null);
        const list = Array.isArray(res) ? res : (res?.data || []);
        setApiUsers(list);
      } catch (err) {}
    }
    loadPegawai();
  }, []);

  const allPegawai = useMemo(() => {
    return apiUsers.map((u) => {
      const nip = u.nip || `KAI-${u.id}`;
      return {
        id: u.id,
        nipp: nip,
        nama: u.name || u.nama || 'Pegawai KAI',
        jabatan: typeof u.jabatan === 'object' ? u.jabatan?.nama : (u.jabatan || 'Staff'),
        tempat_kedudukan: u.unit_kerja || 'Unit Kantor Pusat Bandung',
        personal_area: u.unit_kerja || 'PA-0100 Bandung',
        unit: u.unit_kerja || 'Unit Sistem Informasi TI'
      };
    });
  }, [apiUsers]);

  const handleSelectPegawaiPenerima = (pegawai) => {
    setPenerima((prev) => ({
      ...prev,
      tipe_identitas: 'pegawai',
      nama: pegawai.nama,
      nipp: pegawai.nipp,
      jabatan: pegawai.jabatan,
      tempat_kedudukan: pegawai.tempat_kedudukan,
      personal_area: pegawai.personal_area || pegawai.unit || prev.personal_area,
    }));
    setIsSearchNippModalOpen(false);
    setNippSearchQuery('');
  };


  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Modal Pratinjau Lembar Fisik A4 (FR.SM/TI/011.002/10-2020) - Backend DomPDF
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewPdfBlobUrl, setPreviewPdfBlobUrl] = useState(null);
  const [isLoadingPreviewPdf, setIsLoadingPreviewPdf] = useState(false);
  const [previewPdfError, setPreviewPdfError] = useState(null);

  const handleOpenPreviewPdf = async () => {
    setIsPreviewOpen(true);
    setIsLoadingPreviewPdf(true);
    setPreviewPdfError(null);
    if (previewPdfBlobUrl) {
      URL.revokeObjectURL(previewPdfBlobUrl);
      setPreviewPdfBlobUrl(null);
    }

    try {
      const payload = {
        type: 'ho02',
        data: {
          ...docMeta,
          penyerah,
          penerima,
          keperluan,
          masa_aktif_mulai: masaAktif.mulai,
          masa_aktif_sampai: masaAktif.sampai || masaAktif.selesai,
          masa_aktif: {
            mulai: masaAktif.mulai,
            sampai: masaAktif.sampai || masaAktif.selesai,
            selesai: masaAktif.selesai || masaAktif.sampai,
          },
        },
        items: accounts.map((acc) => ({
          nama_aplikasi: acc.nama_aplikasi,
          username: acc.username,
          password: acc.password || null,
        })),
      };

      const blob = await api.previewPdf(payload);
      const url = URL.createObjectURL(blob);
      setPreviewPdfBlobUrl(url);
    } catch (err) {
      console.error('Gagal memuat pratinjau PDF:', err);
      setPreviewPdfError(err.message || 'Gagal menghasilkan pratinjau PDF dari server.');
    } finally {
      setIsLoadingPreviewPdf(false);
    }
  };

  const handleClosePreviewPdf = () => {
    setIsPreviewOpen(false);
    if (previewPdfBlobUrl) {
      URL.revokeObjectURL(previewPdfBlobUrl);
      setPreviewPdfBlobUrl(null);
    }
  };

  // --- Form State ---
  // 1. Metadata Dokumen & Referensi
  const [docMeta, setDocMeta] = useState({
    no_dokumen: 'FR.SM/TI/011.002/10-2020',
    tanggal_terbit: '12 Oktober 2020',
    versi: '02-2020',
    halaman: '1 dari 2',
    no_ref: `REF/TI-KAI/${new Date().getMonth() + 1}/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`,
    tanggal_ref: new Date().toISOString().split('T')[0],
    business_area: 'BA-0100',
    hari_pelaksanaan: 'Kamis',
    tanggal_pelaksanaan: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
  });

  // 2. Pihak Penyerah (Yang Menyerahkan - auto dari user login)
  const [penyerah, setPenyerah] = useState({
    nama: user?.name || user?.nama || '',
    nipp: user?.nip || '',
    jabatan: user?.roleLabel || user?.jabatan || 'Spv Operasional Infrastruktur TI',
    tempat_kedudukan: user?.location || user?.unit_kerja || 'Unit Kantor Pusat Bandung',
    personal_area: user?.location || user?.unit_kerja || 'PA-0100 Bandung'
  });

  useEffect(() => {
    if (user && !id) {
      setPenyerah((prev) => ({
        ...prev,
        nama: user.name || user.nama || prev.nama,
        nipp: user.nip || prev.nipp,
        jabatan: user.roleLabel || user.jabatan || prev.jabatan,
        tempat_kedudukan: user.location || user.unit_kerja || prev.tempat_kedudukan,
        personal_area: user.location || user.unit_kerja || prev.personal_area,
      }));
    }
  }, [user, id]);

  // 3. User Aplikasi yang Diserahkan (Tabel Akun)
  const [accounts, setAccounts] = useState([
    {
      id: 1,
      nama_aplikasi: 'SAP S/4HANA Finance (FI/CO)',
      username: 'user.sap',
      password: '',
      show_password: false
    }
  ]);

  // 4. Kepada (Pihak Penerima / Yang Menerima)
  const [penerima, setPenerima] = useState({
    tipe_identitas: 'pegawai', // 'pegawai' (NIPP) | 'eksternal' (KTP/Pasport)
    nama: '',
    nipp: '',
    jabatan: '',
    tempat_kedudukan: '',
    personal_area: '',
    owner_responsible: 'Vice President Information Technology',
    custodian: 'Unit Operasional Sistem TI'
  });

  // 5. Keperluan
  const [keperluan, setKeperluan] = useState(
    'Dipergunakan sebagai sarana kerja operasional kedinasan dalam menjalankan tugas dan tanggung jawab sesuai fungsi jabatan.'
  );

  // 6. Masa Aktif User
  const [masaAktif, setMasaAktif] = useState({
    mulai: new Date().toISOString().split('T')[0],
    sampai: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    selesai: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  // 7. Pengesahan & PIN Validasi Tanda Tangan Pembuat
  const [signaturePin, setSignaturePin] = useState('123456');
  const [agreementConfirmed, setAgreementConfirmed] = useState(true);

  // Canvas TTD Pembuat
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);
  const [signatureMode, setSignatureMode] = useState('profile'); // 'profile' | 'draw'

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Generate random secure password for accounts
  const generateRandomPassword = (idx) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const updated = [...accounts];
    updated[idx].password = pwd;
    updated[idx].show_password = true;
    setAccounts(updated);
  };

  const handleAddAccount = () => {
    setAccounts([
      ...accounts,
      {
        id: Date.now(),
        nama_aplikasi: '',
        username: '',
        password: '',
        show_password: false
      }
    ]);
  };

  const handleRemoveAccount = (index) => {
    if (accounts.length <= 1) {
      alert('Minimal harus ada 1 akun user aplikasi yang diserahterimakan.');
      return;
    }
    setAccounts(accounts.filter((_, i) => i !== index));
  };

  const handleAccountChange = (index, field, value) => {
    const updated = [...accounts];
    updated[index][field] = value;
    setAccounts(updated);
  };

  // Canvas Drawing Handlers
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

  // Submit Handler (Direct validation & sign off)
  const handleSubmitForm = async (asDraft = false) => {
    // Basic validation
    if (!penerima.nama.trim()) {
      setErrorMessage('Harap isi Nama Pihak Penerima (Kepada).');
      return;
    }
    if (!penerima.nipp.trim()) {
      setErrorMessage('Harap isi NIPP atau No Identitas Pihak Penerima.');
      return;
    }
    if (!penerima.tempat_kedudukan.trim()) {
      setErrorMessage('Harap isi Tempat Kedudukan Pihak Penerima.');
      return;
    }
    if (accounts.some(a => !a.nama_aplikasi.trim() || !a.username.trim())) {
      setErrorMessage('Pastikan semua baris akun memiliki Nama Aplikasi dan Username.');
      return;
    }
    if (!asDraft && !signaturePin.trim()) {
      setErrorMessage('Harap masukkan PIN Otorisasi Tanda Tangan Digital.');
      return;
    }

    setErrorMessage(null);
    if (asDraft) setIsSavingDraft(true);
    else setIsSubmitting(true);

    try {
      const payload = {
        type: 'ho02',
        title: `BAST User Aplikasi - ${penerima.nama}`,
        status: asDraft ? 'draft' : 'pending',
        submit: !asDraft,
        approver_nip: penerima.nipp || penerima.nipp_identitas,
        signature_pin: !asDraft ? signaturePin.trim() : null,
        items: accounts.map(a => ({
          nama_aplikasi: a.nama_aplikasi,
          username: a.username,
          password: a.password || 'TemporaryPassword123!',
        })),
        data: {
          no_dokumen: docMeta.no_dokumen,
          tanggal_terbit: docMeta.tanggal_terbit,
          versi: docMeta.versi,
          ref_number: docMeta.no_ref,
          tanggal_ref: docMeta.tanggal_ref,
          business_area: docMeta.business_area,
          hari_pelaksanaan: docMeta.hari_pelaksanaan,
          tanggal_pelaksanaan: docMeta.tanggal_pelaksanaan,
          penyerah,
          penerima: {
            ...penerima,
            nipp_identitas: penerima.nipp_identitas || penerima.nipp,
            nipp: penerima.nipp || penerima.nipp_identitas,
            jabatan_instansi: penerima.jabatan_instansi || penerima.jabatan,
            jabatan: penerima.jabatan || penerima.jabatan_instansi,
          },
          accounts,
          keperluan,
          masa_aktif_mulai: masaAktif.mulai,
          masa_aktif_sampai: masaAktif.sampai || masaAktif.selesai,
          masa_aktif_selesai: masaAktif.selesai || masaAktif.sampai,
          masa_aktif: {
            mulai: masaAktif.mulai,
            sampai: masaAktif.sampai || masaAktif.selesai,
            selesai: masaAktif.selesai || masaAktif.sampai,
          },
          submitted_at: new Date().toISOString(),
          is_signed_penyerah: !asDraft,
          signature_pin: signaturePin
        }
      };

      const res = await api.createDocument(payload);
      showToast(asDraft ? 'Draf BAST User Aplikasi berhasil disimpan.' : 'BAST User Aplikasi berhasil disahkan dan dikirim ke pihak penerima.');
      setTimeout(() => {
        navigate('/bast-aplikasi');
      }, 1200);
    } catch (err) {
      console.error('Submit BAST User error:', err);
      const detailError = err.errors 
        ? Object.values(err.errors).flat().join(' | ') 
        : (err.message || 'Gagal menyimpan dokumen BAST.');
      setErrorMessage(detailError);
    } finally {
      setIsSavingDraft(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-28 select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
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
              Formulir BAST User Aplikasi (HO-02)
            </h1>
            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-[#EE7623] border border-orange-200">
              FR.SM/TI/011.002/10-2020
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Formulir Berita Acara Serah Terima Hak Akses dan Kredensial User Aplikasi Sistem Informasi KAI.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenPreviewPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-colors"
          >
            <FileText className="w-4 h-4 text-sky-600" />
            <span>Pratinjau PDF</span>
          </button>

          <button
            type="button"
            onClick={() => handleSubmitForm(true)}
            disabled={isSavingDraft || isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-colors disabled:opacity-50"
          >
            {isSavingDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-amber-600" />}
            <span>Simpan Draf</span>
          </button>

          <button
            type="button"
            onClick={() => handleSubmitForm(false)}
            disabled={isSubmitting || isSavingDraft}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#003580] hover:bg-[#092653] text-white text-xs font-bold shadow-md shadow-blue-950/20 transition-all hover:scale-102 active:scale-98 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4 text-orange-400" />}
            <span>Sahkan & Terbitkan BAST</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button type="button" onClick={() => setErrorMessage(null)} className="text-rose-700 hover:text-rose-950">
            ✕
          </button>
        </div>
      )}

      {/* Form Card */}
      <div className="space-y-6">
        {/* BAGIAN 1: KOP & METADATA DOKUMEN RESMI */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="bg-[#0a192f] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <FileCheck className="w-4 h-4 text-sky-400" />
              </div>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Bagian I: Identitas & Nomor Referensi Formulir
                </h2>
                <p className="text-[11px] text-slate-400">
                  Format Berita Acara Tata Kelola TI PT Kereta Api Indonesia (Persero)
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-600/30 text-rose-300 border border-rose-500/40 uppercase tracking-widest">
              RAHASIA
            </span>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            {/* No. Ref */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                No. Referensi (No. Ref) *
              </label>
              <input
                type="text"
                value={docMeta.no_ref}
                onChange={(e) => setDocMeta({ ...docMeta, no_ref: e.target.value })}
                placeholder="misal: REF/TI-KAI/X/2026/088"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-xs focus:bg-white focus:ring-2 focus:ring-[#003580] outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Sesuai penomoran unit TI pengirim</span>
            </div>

            {/* Tanggal Ref */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Tanggal Dokumen *
              </label>
              <input
                type="date"
                value={docMeta.tanggal_ref}
                onChange={(e) => setDocMeta({ ...docMeta, tanggal_ref: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-[#003580] outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Tanggal terbitnya berkas serah terima</span>
            </div>

            {/* Business Area */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Business Area (KAI) *
              </label>
              <select
                value={docMeta.business_area}
                onChange={(e) => setDocMeta({ ...docMeta, business_area: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-[#003580] outline-none"
              >
                <option value="BA-0100">BA-0100 (Kantor Pusat Bandung)</option>
                <option value="BA-0200">BA-0200 (Daop 1 Jakarta)</option>
                <option value="BA-0300">BA-0300 (Daop 2 Bandung)</option>
                <option value="BA-0400">BA-0400 (Daop 3 Cirebon)</option>
                <option value="BA-0500">BA-0500 (Daop 4 Semarang)</option>
                <option value="BA-0600">BA-0600 (Daop 6 Yogyakarta)</option>
                <option value="BA-0700">BA-0700 (Daop 7 Madiun)</option>
                <option value="BA-0800">BA-0800 (Daop 8 Surabaya)</option>
                <option value="BA-0900">BA-0900 (Daop 9 Jember)</option>
                <option value="BA-1000">BA-1000 (Divre I Sumatera Utara)</option>
                <option value="BA-2000">BA-2000 (Divre II Sumatera Barat)</option>
                <option value="BA-3000">BA-3000 (Divre III Palembang)</option>
                <option value="BA-4000">BA-4000 (Divre IV Tanjungkarang)</option>
              </select>
              <span className="text-[10px] text-slate-400 mt-1 block">Wilayah kedudukan aset/user aplikasi</span>
            </div>
          </div>
        </div>

        {/* BAGIAN 2: PIHAK PENYERAH (YANG MENYERAHKAN) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="bg-[#003580] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider">
                  Bagian II: Pihak Penyerah (Yang Menyerahkan)
                </h2>
                <p className="text-[11px] text-blue-100">
                  Petugas Unit TI yang membuat dan menyerahkan kredensial akun
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-900/50 text-blue-200 uppercase">
              PIHAK I
            </span>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Nama Penyerah */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Nama Lengkap *
              </label>
              <input
                type="text"
                value={penyerah.nama}
                onChange={(e) => setPenyerah({ ...penyerah, nama: e.target.value })}
                placeholder="misal: Ahmad Fauzi Setiawan"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-[#003580] outline-none"
              />
            </div>

            {/* NIPP Penyerah */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                NIPP (Nomor Induk Pegawai PT KAI) *
              </label>
              <input
                type="text"
                value={penyerah.nipp}
                onChange={(e) => setPenyerah({ ...penyerah, nipp: e.target.value })}
                placeholder="misal: 54892"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-xs focus:bg-white focus:ring-2 focus:ring-[#003580] outline-none"
              />
            </div>

            {/* Jabatan Penyerah */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Jabatan Kedinasan *
              </label>
              <input
                type="text"
                value={penyerah.jabatan}
                onChange={(e) => setPenyerah({ ...penyerah, jabatan: e.target.value })}
                placeholder="misal: Spv Operasional Infrastruktur TI"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-[#003580] outline-none"
              />
            </div>

            {/* Tempat Kedudukan */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Tempat Kedudukan *
              </label>
              <input
                type="text"
                value={penyerah.tempat_kedudukan}
                onChange={(e) => setPenyerah({ ...penyerah, tempat_kedudukan: e.target.value })}
                placeholder="misal: Unit Kantor Pusat Bandung"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-[#003580] outline-none"
              />
            </div>

            {/* Personal Area */}
            <div className="md:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">
                Personal Area *
              </label>
              <input
                type="text"
                value={penyerah.personal_area}
                onChange={(e) => setPenyerah({ ...penyerah, personal_area: e.target.value })}
                placeholder="misal: PA-0100 Kantor Pusat Bandung"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-[#003580] outline-none"
              />
            </div>
          </div>
        </div>

        {/* BAGIAN 3: USER APLIKASI YANG DISERAHKAN (TABEL AKUN) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="bg-[#EE7623] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <KeyRound className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider">
                  Bagian III: Daftar User Aplikasi yang Diserahkan
                </h2>
                <p className="text-[11px] text-orange-100">
                  "Menyerahkan user aplikasi sebagai berikut: Nama Aplikasi, Username, & Password"
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddAccount}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-[#EE7623] hover:bg-orange-50 text-xs font-bold shadow-2xs transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Tambah Baris Akun</span>
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* Quick App Preset Tags */}
            <div className="bg-orange-50/60 border border-orange-200 rounded-xl p-3">
              <span className="text-[10px] font-bold text-orange-950 uppercase tracking-wider block mb-1.5">
                Pilih Cepat Nama Aplikasi Standar KAI:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {KAI_APP_PRESETS.map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => {
                      // Apply to last account row or append
                      const updated = [...accounts];
                      const lastIdx = updated.length - 1;
                      if (!updated[lastIdx].nama_aplikasi) {
                        updated[lastIdx].nama_aplikasi = preset;
                      } else {
                        updated.push({
                          id: Date.now(),
                          nama_aplikasi: preset,
                          username: '',
                          password: '',
                          show_password: false
                        });
                      }
                      setAccounts(updated);
                    }}
                    className="text-[10px] font-semibold bg-white border border-orange-200 text-orange-900 hover:border-orange-500 hover:text-orange-950 px-2.5 py-1 rounded-md transition-all shadow-2xs"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Table of Accounts */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3 w-12 text-center">NO</th>
                    <th className="py-2.5 px-4 min-w-[240px]">NAMA APLIKASI *</th>
                    <th className="py-2.5 px-4 min-w-[180px]">USERNAME *</th>
                    <th className="py-2.5 px-4 min-w-[220px]">PASSWORD SEMENTARA *</th>
                    <th className="py-2.5 px-3 w-16 text-center">HAPUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {accounts.map((acc, idx) => (
                    <tr key={acc.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={acc.nama_aplikasi}
                          onChange={(e) => handleAccountChange(idx, 'nama_aplikasi', e.target.value)}
                          placeholder="misal: SAP S/4HANA (FI/CO)"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-[#EE7623] outline-none"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={acc.username}
                          onChange={(e) => handleAccountChange(idx, 'username', e.target.value)}
                          placeholder="misal: wahyu.hidayat"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-mono font-bold text-blue-900 focus:ring-1 focus:ring-[#EE7623] outline-none"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <div className="relative flex-1">
                            <input
                              type={acc.show_password ? 'text' : 'password'}
                              value={acc.password}
                              onChange={(e) => handleAccountChange(idx, 'password', e.target.value)}
                              placeholder="Masukkan password awal"
                              className="w-full pl-3 pr-8 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-mono text-slate-900 focus:ring-1 focus:ring-[#EE7623] outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleAccountChange(idx, 'show_password', !acc.show_password)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                              title={acc.show_password ? 'Sembunyikan' : 'Lihat'}
                            >
                              {acc.show_password ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => generateRandomPassword(idx)}
                            className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-600"
                            title="Generate Password Kuat"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveAccount(idx)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                          title="Hapus Baris"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-400 italic">
              * Password yang diserahkan bersifat rahasia. Penerima diwajibkan mengubah password pada saat login pertama kali.
            </p>
          </div>
        </div>

        {/* BAGIAN 4: PIHAK PENERIMA (KEPADA) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="bg-[#003580] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider">
                  Bagian IV: Kepada (Pihak Penerima)
                </h2>
                <p className="text-[11px] text-blue-100">
                  Pegawai atau mitra yang menerima hak akses dan bertanggung jawab atas penggunaan akun
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {penerima.tipe_identitas === 'pegawai' && (
                <button
                  type="button"
                  onClick={() => setIsSearchNippModalOpen(true)}
                  className="inline-flex items-center gap-1 bg-white hover:bg-slate-100 text-[#0b2046] text-[11px] px-2.5 py-1 rounded-md font-bold transition-all shadow-xs active:scale-95"
                >
                  <Search className="w-3 h-3 stroke-[2.5]" />
                  Cari berdasarkan NIPP
                </button>
              )}
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-900/50 text-blue-200 uppercase">
                PIHAK II
              </span>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Nama Penerima */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Nama Lengkap Penerima *
              </label>
              <input
                type="text"
                value={penerima.nama}
                onChange={(e) => setPenerima({ ...penerima, nama: e.target.value })}
                placeholder="misal: Wahyu Hidayat, S.T."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-[#003580] outline-none"
              />
            </div>

            {/* NIPP / No Identitas */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">
                  NIPP / No Identitas *
                </label>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-semibold">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="tipe_id"
                      checked={penerima.tipe_identitas === 'pegawai'}
                      onChange={() => setPenerima({ ...penerima, tipe_identitas: 'pegawai' })}
                    />
                    NIPP (KAI)
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="tipe_id"
                      checked={penerima.tipe_identitas === 'eksternal'}
                      onChange={() => setPenerima({ ...penerima, tipe_identitas: 'eksternal' })}
                    />
                    KTP / Paspor
                  </label>
                </div>
              </div>
              <input
                type="text"
                list="penerima-user-nipp-suggestions"
                value={penerima.nipp}
                onChange={(e) => {
                  const val = e.target.value;
                  if (penerima.tipe_identitas === 'pegawai') {
                    const found = allPegawai.find(
                      (p) => p.nipp && p.nipp.toLowerCase() === val.trim().toLowerCase()
                    );
                    if (found) {
                      setPenerima((prev) => ({
                        ...prev,
                        nipp: found.nipp,
                        nama: found.nama,
                        jabatan: found.jabatan,
                        tempat_kedudukan: found.tempat_kedudukan,
                        personal_area: found.personal_area || found.unit || prev.personal_area,
                      }));
                    } else {
                      setPenerima({ ...penerima, nipp: val });
                    }
                  } else {
                    setPenerima({ ...penerima, nipp: val });
                  }
                }}
                placeholder={penerima.tipe_identitas === 'pegawai' ? 'Ketik NIPP (misal: 61204)...' : 'misal: 3273210987650001 (KTP) / A1234567 (Paspor)'}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-xs focus:bg-white focus:ring-2 focus:ring-[#003580] outline-none"
              />
              {penerima.tipe_identitas === 'pegawai' && (
                <datalist id="penerima-user-nipp-suggestions">
                  {allPegawai.map((p) => (
                    <option key={p.id || p.nipp} value={p.nipp}>
                      {p.nama} - {p.jabatan}
                    </option>
                  ))}
                </datalist>
              )}
              <span className="text-[10px] text-slate-400 mt-1 block">
                *No Identitas = No KTP (untuk WNI) atau No Paspor (untuk WNA)
              </span>
            </div>

            {/* Jabatan / Instansi */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Jabatan / Instansi *
              </label>
              <input
                type="text"
                value={penerima.jabatan}
                onChange={(e) => setPenerima({ ...penerima, jabatan: e.target.value })}
                placeholder="misal: Junior Manager Keuangan & Aset Daop 6"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-[#003580] outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                *Nipp & Jabatan diisi khusus untuk pegawai PT Kereta Api Indonesia (Persero)
              </span>
            </div>

            {/* Tempat Kedudukan */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Tempat Kedudukan *
              </label>
              <input
                type="text"
                value={penerima.tempat_kedudukan}
                onChange={(e) => setPenerima({ ...penerima, tempat_kedudukan: e.target.value })}
                placeholder="misal: Daop 6 Yogyakarta"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-[#003580] outline-none"
              />
            </div>

            {/* Personal Area */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Personal Area *
              </label>
              <input
                type="text"
                value={penerima.personal_area}
                onChange={(e) => setPenerima({ ...penerima, personal_area: e.target.value })}
                placeholder="misal: PA-0600 Daop 6 Yogyakarta"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-[#003580] outline-none"
              />
            </div>

            {/* Owner Responsible */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Owner Responsible *
              </label>
              <input
                type="text"
                value={penerima.owner_responsible}
                onChange={(e) => setPenerima({ ...penerima, owner_responsible: e.target.value })}
                placeholder="misal: Vice President Information Technology"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-[#003580] outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Pemilik proses bisnis aplikasi yang bertanggung jawab</span>
            </div>

            {/* Custodian */}
            <div className="md:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">
                Custodian (Wali Sistem / Pengelola TI) *
              </label>
              <input
                type="text"
                value={penerima.custodian}
                onChange={(e) => setPenerima({ ...penerima, custodian: e.target.value })}
                placeholder="misal: Unit TI Daop 6 Yogyakarta"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-[#003580] outline-none"
              />
            </div>
          </div>
        </div>

        {/* BAGIAN 5: KEPERLUAN & MASA AKTIF USER */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="bg-[#0a192f] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-sky-400" />
              </div>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Bagian V: Keperluan & Masa Aktif User
                </h2>
                <p className="text-[11px] text-slate-400">
                  Tujuan penggunaan hak akses dan masa berlaku akun aplikasi
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4 text-xs">
            {/* Keperluan */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Keperluan Akses Aplikasi *
              </label>
              <textarea
                rows={3}
                value={keperluan}
                onChange={(e) => setKeperluan(e.target.value)}
                placeholder="Jelaskan secara rinci tujuan pemberian user aplikasi..."
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs leading-relaxed focus:bg-white focus:ring-2 focus:ring-[#003580] outline-none"
              />
            </div>

            {/* Masa Aktif */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Masa Aktif: Mulai Tanggal *
                </label>
                <input
                  type="date"
                  value={masaAktif.mulai}
                  onChange={(e) => setMasaAktif({ ...masaAktif, mulai: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-[#003580] outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  s/d Tanggal (Kedaluwarsa) *
                </label>
                <input
                  type="date"
                  value={masaAktif.selesai}
                  onChange={(e) => setMasaAktif({ ...masaAktif, selesai: e.target.value, sampai: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-[#003580] outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* BAGIAN 6: KETENTUAN RESMI KAI & OTORISASI TANDA TANGAN */}
        <div className="bg-white rounded-2xl border-2 border-orange-200 shadow-2xs overflow-hidden">
          <div className="bg-[#003580] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#EE7623] flex items-center justify-center">
                <PenTool className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider">
                  Bagian VI: Ketentuan Resmi & Tanda Tangan Digital Pihak Penyerah
                </h2>
                <p className="text-[11px] text-blue-100">
                  Persetujuan ketentuan tata kelola dan pengesahan digital dokumen
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500 text-white uppercase">
              PENGESAHAN DOKUMEN
            </span>
          </div>

          <div className="p-6 space-y-6 text-xs">
            {/* Klausul Legal Standar KAI */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-orange-600" />
                Ketentuan & Tanggung Jawab Pemegang User Aplikasi:
              </h3>
              <ol className="list-decimal list-outside pl-4 space-y-2 text-slate-700 text-[11px] leading-relaxed">
                <li>
                  Untuk dipergunakan sebagai alat kerja mengakses aplikasi sesuai dengan tugas dan tanggung jawabnya. Pemegang user aplikasi bertanggung jawab penuh terhadap semua transaksi yang dilakukannya dan tidak memberitahukan kepada orang lain <em>username</em> dan <em>password</em> aplikasi yang dimiliki.
                </li>
                <li>
                  <em>Username</em> akan otomatis dinonaktifkan setelah masa aktif user berakhir. PT Kereta Api Indonesia (Persero) berhak mencabut hak penggunaan aplikasi secara sepihak jika terjadi penyalahgunaan user aplikasi.
                </li>
                <li>
                  Apabila dikemudian hari terbukti Pemegang user aplikasi melakukan pelanggaran, maka Pemegang user aplikasi bersedia menerima sanksi dari PT Kereta Api Indonesia (Persero) dan/atau pihak lain yang berwenang sesuai ketentuan perundang-undangan yang berlaku.
                </li>
              </ol>
            </div>

            {/* Mode Tanda Tangan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Kolom 1: PIN Otorisasi */}
              <div className="space-y-3 bg-blue-50/60 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-[#003580] font-bold">
                  <Lock className="w-4 h-4" />
                  <span>PIN Otorisasi Tanda Tangan Digital *</span>
                </div>
                <input
                  type="password"
                  maxLength={6}
                  value={signaturePin}
                  onChange={(e) => setSignaturePin(e.target.value)}
                  placeholder="Masukkan 6-digit PIN"
                  className="w-full px-3.5 py-2.5 bg-white border border-blue-300 rounded-lg text-slate-900 font-mono text-sm tracking-widest font-bold focus:ring-2 focus:ring-[#003580] outline-none"
                />
                <p className="text-[10px] text-blue-900/80 leading-normal">
                  PIN digunakan untuk membubuhkan stempel digital kriptografis resmi PT Kereta Api Indonesia (Persero) pada dokumen BAST ini.
                </p>
              </div>

              {/* Kolom 2: Canvas / Signature */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Goreskan Tanda Tangan Pihak Penyerah:</span>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-[10px] font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1"
                  >
                    <Eraser className="w-3 h-3" /> Bersihkan
                  </button>
                </div>

                <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 relative overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={120}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-28 cursor-crosshair block"
                  />
                  {!hasDrawnSignature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-[11px]">
                      Goreskan tanda tangan Anda di area ini
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <span className="font-semibold text-slate-700">{penyerah.nama}</span>
                  <span className="text-[10px] text-slate-400 block">NIPP. {penyerah.nipp}</span>
                </div>
              </div>
            </div>

            {/* Checkbox Persetujuan */}
            <label className="flex items-start gap-2.5 cursor-pointer pt-2 select-none">
              <input
                type="checkbox"
                checked={agreementConfirmed}
                onChange={(e) => setAgreementConfirmed(e.target.checked)}
                className="mt-0.5 rounded text-[#003580] focus:ring-0"
              />
              <span className="text-[11px] text-slate-600 leading-snug">
                Saya menyatakan dengan sebenarnya bahwa rincian user aplikasi yang diserahkan telah diverifikasi dan siap diserahkan kepada pihak penerima sesuai prosedur TI KAI yang berlaku.
              </span>
            </label>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handleOpenPreviewPdf}
                className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors"
              >
                Pratinjau Lembar Fisik
              </button>

              <button
                type="button"
                onClick={() => handleSubmitForm(false)}
                disabled={isSubmitting || isSavingDraft || !agreementConfirmed}
                className="px-7 py-2.5 rounded-xl bg-[#EE7623] hover:bg-[#d96515] text-white text-xs font-bold shadow-md shadow-orange-950/20 transition-all hover:scale-102 active:scale-98 disabled:opacity-50"
              >
                {isSubmitting ? 'Memproses Dokumen...' : 'Sahkan & Terbitkan BAST User Aplikasi'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL PRATINJAU LEMBAR FISIK A4 (PERSIS FORMAT FORMULIR KAI) */}
            {/* Modal Pratinjau Dokumen Backend DomPDF */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full overflow-hidden border border-slate-200 flex flex-col h-[90vh]">
            <div className="bg-[#0b2046] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="font-bold text-sm">Pratinjau PDF Formulir BAST User Aplikasi (HO-02)</h3>
                  <p className="text-[11px] text-slate-300">Format standar resmi KAI langsung dari template DomPDF backend</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {previewPdfBlobUrl && (
                  <a
                    href={previewPdfBlobUrl}
                    download="BAST-User-Aplikasi-Draft.pdf"
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
                  <Loader2 className="w-8 h-8 text-[#EE7623] animate-spin" />
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
                  title="Pratinjau PDF BAST User Aplikasi"
                  className="w-full h-full rounded-lg border border-slate-300 shadow-sm bg-white"
                />
              ) : null}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
              <span>* Pratinjau dihasilkan langsung menggunakan engine DomPDF backend template ho02.blade.php.</span>
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

      {/* MODAL: CARI PENERIMA BERDASARKAN NIPP */}
      {isSearchNippModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-[#0b2046] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-emerald-400" />
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
                placeholder="Ketik NIPP atau nama pegawai..."
                className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#003580]"
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
                    className="p-3 rounded-lg border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer flex items-center justify-between transition-colors group"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-[#003580]">
                        {p.nama}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                        NIPP: <span className="font-mono font-bold text-slate-700">{p.nipp}</span> • {p.jabatan}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {p.tempat_kedudukan}
                      </div>
                    </div>
                    <span className="text-[11px] bg-blue-100 group-hover:bg-[#003580] text-[#003580] group-hover:text-white font-bold px-2.5 py-1 rounded-md transition-colors shadow-2xs">
                      Pilih
                    </span>
                  </div>
                ))}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
              <button
                type="button"
                onClick={() => setIsSearchNippModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
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
