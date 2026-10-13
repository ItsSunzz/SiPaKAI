import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
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
  Lock,
  Calendar,
  AlertTriangle,
  RefreshCw,
  HardDrive,
  Check,
  GitBranch,
  Key,
  Upload,
  Image as ImageIcon,
  PenTool,
  X
} from 'lucide-react';
import { api, fallbackDocuments } from '../services/api';

export default function PemusnahanReviewPage({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [doc, setDoc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Form decision states
  const [actionType, setActionType] = useState('approve');
  const [notes, setNotes] = useState('');
  const [approvers, setApprovers] = useState([]);
  const [nextApproverId, setNextApproverId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal PIN Validasi e-Sign states
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('123456');
  const [pinError, setPinError] = useState(null);

  // Status tanda tangan di profil user
  const [hasUserSignature, setHasUserSignature] = useState(user?.has_signature || false);

  // Load document and approvers
  const loadDocumentData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // 1. Fetch document detail
      let docData = null;
      try {
        const res = await api.getDocument(id);
        docData = res?.document || res;
      } catch (err) {
        // Fallback search in fallbackDocuments
        const found = fallbackDocuments.find(d => String(d.id) === String(id));
        if (found) {
          docData = {
            ...found,
            items: [
              {
                id_aset: found.inventory_code || '104-KAI-SRV-2018',
                nama_aset: found.category_label || 'Server Dell PowerEdge R740',
                jenis_aset: 'Fisik (Hardware)',
                alasan_pemusnahan: 'Kerusakan fatal motherboard & melewati batas usia depresiasi 5 tahun',
              },
              {
                id_aset: 'MAC-7721-CC-081',
                nama_aset: 'Cisco Catalyst 3850 48-Port PoE',
                jenis_aset: 'Jaringan (Network)',
                alasan_pemusnahan: 'Port modul korsleting sambaran petir, tidak dapat direparasi',
              }
            ],
            approvals: [
              { 
                step: 1, 
                approver: { name: 'Ahmad Fauzi Setiawan', nama: 'Ahmad Fauzi Setiawan', jabatan: 'Asisten Manager TI' }, 
                action: 'APPROVED', 
                aksi: 'approved',
                catatan: 'Kondisi fisik telah dicek langsung di server farm Juanda.', 
                acted_at: '2026-10-12 08:30' 
              },
              { 
                step: 2, 
                approver: { name: 'Bambang Suryo Pratama', nama: 'Bambang Suryo Pratama', jabatan: 'Manager TI' }, 
                action: 'PENDING', 
                aksi: 'pending',
                catatan: null 
              },
            ]
          };
        } else {
          throw err;
        }
      }

      setDoc(docData);

      // 2. Fetch approvers for forwarding
      try {
        const aRes = await api.getApprovers();
        const aList = Array.isArray(aRes) ? aRes : (aRes?.data || []);
        setApprovers(aList);
        if (aList.length > 0) {
          setNextApproverId(String(aList[0].id));
        }
        // 3. Fetch profil verifikator untuk cek status tanda tangan tersimpan
        try {
          const meRes = await api.getMe();
          if (meRes?.user) {
            setHasUserSignature(Boolean(meRes.user.has_signature || meRes.user.signature_path));
          }
        } catch (meErr) {
          // Fallback ke user prop
          if (user?.has_signature) setHasUserSignature(true);
        }
      } catch (e) {
        console.error('Failed to load approvers:', e);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Gagal memuat rincian dokumen.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadDocumentData();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-[#f05a22]" />
        <span className="text-sm font-semibold">Memuat rincian dokumen pemusnahan...</span>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="w-full max-w-3xl mx-auto py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Dokumen Tidak Ditemukan</h2>
        <p className="text-sm text-slate-500">
          Berkas pemusnahan dengan ID #{id} tidak ditemukan di sistem atau Anda tidak memiliki hak akses.
        </p>
        <button
          onClick={() => navigate('/pemusnahan')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Pemusnahan</span>
        </button>
      </div>
    );
  }

  const isPending = doc.status === 'in_review';
  const isApproved = doc.status === 'approved';
  const isRejected = doc.status === 'rejected';

  // Role check
  const isAdminOrSuper = !user || user.role === 'admin' || user.role === 'super_admin';
  const isCurrentApprover = user?.id && doc.penyetuju_id && Number(user.id) === Number(doc.penyetuju_id);
  const canTakeAction = isPending && (isAdminOrSuper || isCurrentApprover);

  // Sequential Step Calculation
  const approvalHistory = doc.approvals || doc.persetujuan || [];
  const chain = doc.data?.approval_chain || [
    doc.data?.verifikator_1_id,
    doc.data?.verifikator_2_id,
    doc.data?.verifikator_3_id,
  ].filter(Boolean);

  let currentActiveStep = 1;
  if (isApproved) {
    currentActiveStep = 4; // Seluruh 3 tahapan selesai disetujui
  } else if (isPending) {
    // Ambil step dari record pending aktif di database
    const pendingRecord = approvalHistory.find(a => (a.aksi === 'pending' || a.action === 'PENDING'));
    if (pendingRecord && pendingRecord.step) {
      currentActiveStep = Number(pendingRecord.step);
    } else if (Array.isArray(chain) && chain.length > 0 && doc.penyetuju_id) {
      const idx = chain.findIndex(cid => Number(cid) === Number(doc.penyetuju_id));
      if (idx !== -1) currentActiveStep = idx + 1;
    }
  } else if (isRejected) {
    const rejectedRecord = approvalHistory.find(a => (a.aksi === 'rejected' || a.action === 'REJECTED'));
    if (rejectedRecord && rejectedRecord.step) {
      currentActiveStep = Number(rejectedRecord.step);
    }
  }

  const sequentialSteps = [
    {
      step: 1,
      title: 'Tahap 1: Verifikasi Atasan Langsung',
      role: 'Atasan Langsung Unit Pemohon',
      desc: 'Pemeriksaan fisik aset & kewajaran permohonan di unit asal.',
      targetUserId: doc.data?.verifikator_1_id || (Array.isArray(chain) ? chain[0] : 3),
      defaultName: 'Ahmad Fauzi Setiawan',
      defaultRole: 'Asisten Manager TI',
    },
    {
      step: 2,
      title: 'Tahap 2: Validasi Teknis Pengelola TI',
      role: 'Pengelola Aset TI',
      desc: 'Sanitasi media storage, kelayakan degaussing & tag SAP.',
      targetUserId: doc.data?.verifikator_2_id || (Array.isArray(chain) ? chain[1] : 1),
      defaultName: 'Bambang Suryo Pratama',
      defaultRole: 'Manager TI',
    },
    {
      step: 3,
      title: 'Tahap 3: Penyetuju Akhir (Head of Unit)',
      role: 'Penyetuju Akhir / Head of Unit',
      desc: 'Pengesahan Berita Acara & penandatanganan digital terpusat.',
      targetUserId: doc.data?.verifikator_3_id || (Array.isArray(chain) ? chain[2] : 5),
      defaultName: 'Raden Dwi Cahyono',
      defaultRole: 'Vice President',
    },
  ];

  // Helper resolusi nama pejabat yang presisi per tahapan
  const getApproverDisplayForStep = (s) => {
    // 1. Jika sudah disetujui atau ditolak, tampilkan penandatangan
    const historyItem = approvalHistory.find(a => Number(a.step) === s.step);
    if (historyItem && historyItem.aksi !== 'pending' && historyItem.action !== 'PENDING') {
      const actorName = historyItem.approver?.nama || historyItem.approver?.name;
      const actorJabatan = historyItem.approver?.jabatan?.nama || historyItem.approver?.jabatan?.name || historyItem.approver?.jabatan || '';
      if (actorName) {
        return actorJabatan ? `${actorName} (${actorJabatan})` : actorName;
      }
    }

    // 2. Ambil dari master approvers list berdasarkan targetUserId yang dipilih pemohon
    if (s.targetUserId && Array.isArray(approvers) && approvers.length > 0) {
      const foundUser = approvers.find(u => Number(u.id) === Number(s.targetUserId));
      if (foundUser) {
        const uName = foundUser.nama || foundUser.name;
        const uJab = foundUser.jabatan?.nama || foundUser.jabatan?.name || foundUser.jabatan || '';
        return uJab ? `${uName} (${uJab})` : uName;
      }
    }

    // 3. Fallback nama pejabat resmi
    return `${s.defaultName} (${s.defaultRole})`;
  };

  const currentApproverObj = doc.current_approver || doc.currentApprover || doc.penyetuju;
  const currentApproverName = currentApproverObj?.nama || currentApproverObj?.name || 'Pejabat Verifikator';

  // Buka modal otorisasi e-Sign dengan input PIN
  const handleOpenApproveModal = () => {
    setErrorMessage(null);
    setPinError(null);
    setPinInput('123456'); // Default PIN KAI
    setIsPinModalOpen(true);
  };

  // Konfirmasi persetujuan dengan verifikasi PIN e-Sign
  const handleConfirmApproveWithPin = async () => {
    setPinError(null);
    if (!pinInput.trim()) {
      setPinError('PIN tanda tangan digital wajib dimasukkan untuk otorisasi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.actionDocument(doc.id, {
        action: 'approve',
        notes: notes.trim(),
        pin: pinInput.trim(),
        next_approver_id: null,
      });

      setIsPinModalOpen(false);
      setSuccessMessage(res?.message || 'Dokumen berhasil disetujui dan dialirkan ke tahapan selanjutnya!');
      
      // Reload document data
      setTimeout(() => {
        loadDocumentData();
      }, 1000);
    } catch (err) {
      setPinError(err.message || 'Validasi PIN gagal atau terjadi kesalahan pada otorisasi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit penolakan dokumen secara langsung
  const handleRejectDocument = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!notes.trim()) {
      setErrorMessage('Catatan telaah wajib diisi saat menolak dokumen agar pemohon mengetahui alasan koreksi.');
      const notesEl = document.getElementById('disposisi-notes-input');
      if (notesEl) notesEl.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.actionDocument(doc.id, {
        action: 'reject',
        notes: notes.trim(),
        next_approver_id: null,
      });

      setSuccessMessage(res?.message || 'Dokumen berhasil ditolak dengan catatan resmi.');
      setTimeout(() => {
        loadDocumentData();
      }, 1000);
    } catch (err) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat memproses penolakan.');
    } finally {
      setIsSubmitting(false);
    }
  };



  const handleDownloadPdf = () => {
    const pdfUrl = api.getDocumentPdfUrl(doc.id);
    window.open(pdfUrl, '_blank');
  };

  return (
    <div className="w-full max-w-7xl mx-auto pb-16 space-y-6">
      {/* 1. Header Navigation & Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link to="/" className="hover:text-blue-600 transition-colors">Beranda</Link>
            <span>/</span>
            <Link to="/pemusnahan" className="hover:text-blue-600 transition-colors">Pemusnahan & Penghapusan Aset</Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold font-mono">
              {doc.number || doc.nomor || `DOK-${doc.id}`}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0b2046] tracking-tight">
            Telaah & Disposisi Permohonan Pemusnahan Aset TI
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Formulir telaah teknis Permohonan Pemusnahan Aset [DSP - 01] PT Kereta Api Indonesia (Persero)
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={() => navigate('/pemusnahan')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Daftar</span>
          </button>

          {(isApproved || isPending) && (
            <button
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
            >
              <FileDown className="w-4 h-4" />
              <span>{isApproved ? 'Unduh Formulir Permohonan PDF' : 'Unduh Draft PDF'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Notifications Banner */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-3 text-xs font-medium animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="ml-auto font-bold text-rose-600">✕</button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 text-xs font-semibold animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="ml-auto font-bold text-emerald-600">✕</button>
        </div>
      )}

      {/* 3. Status Bar Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#f05a22]">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-extrabold text-[#0b2046]">
                {doc.number || doc.nomor || `DOK-${doc.id}`}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                DSP-01: Permohonan
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
              <span>Diajukan pada: <strong>{new Date(doc.submitted_at || doc.created_at || Date.now()).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</strong></span>
              <span>•</span>
              <span>Oleh: <strong>{doc.requester_name || doc.requester?.name || 'Petugas TI'}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Status Dokumen Saat Ini</span>
            <span className="text-xs font-bold text-slate-800">
              {isApproved ? 'Telah Disetujui Penuh & Sah' : isRejected ? 'Ditolak / Perlu Revisi' : `Sedang di ${sequentialSteps[currentActiveStep - 1]?.title}`}
            </span>
          </div>

          <span className={`px-3 py-1.5 rounded-full text-xs font-bold border inline-flex items-center gap-2 ${
            isPending ? 'bg-orange-50 text-orange-700 border-orange-200' :
            isApproved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
            'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              isPending ? 'bg-orange-500 animate-pulse' :
              isApproved ? 'bg-emerald-500' : 'bg-rose-500'
            }`}></span>
            <span>{doc.status_label || (isPending ? `Tahap ${currentActiveStep}: Menunggu Disposisi` : isApproved ? 'Selesai Disetujui' : 'Ditolak')}</span>
          </span>
        </div>
      </div>

      {/* 4. Main Split Layout: 8 Kolom (Dokumen & Aset) + 4 Kolom (Alur & Tindakan) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* === KOLOM KIRI (7/12 atau 8/12): DOKUMEN & RINCIAN ASET === */}
        <div className="lg:col-span-8 space-y-6">
          {/* Bagian 1: Identitas Pemohon & Klasifikasi */}
          <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="border-l-4 border-[#0b2046] px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0b2046] uppercase tracking-wider flex items-center gap-2">
                <Building className="w-4 h-4 text-[#f05a22]" />
                Informasi Pemohon & Unit Kerja
              </h3>
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded border border-blue-100 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Terverifikasi SSO KAI
              </span>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pemohon (Requester)</label>
                  <div className="font-extrabold text-slate-900 text-sm mt-0.5">
                    {doc.requester_name || doc.requester?.name || 'Petugas Pengusul'}
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    NIP: {doc.requester_nip || doc.requester?.nip || '100001'}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Unit Kerja & Wilayah</label>
                  <div className="font-semibold text-slate-800 text-xs mt-0.5">
                    {doc.requester_unit || (typeof doc.requester?.jabatan === 'object' ? doc.requester?.jabatan?.nama : doc.requester?.jabatan) || 'Unit Kantor Pusat'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Lokasi: {doc.data?.unit_kerja || doc.requester?.unit_kerja || 'DAOP 1 Jakarta'}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Estimasi Nilai Buku Tercatat</label>
                  <div className="font-extrabold text-[#0b2046] text-base mt-0.5">
                    {doc.book_value || (doc.data?.nilai_buku ? `Rp ${Number(doc.data.nilai_buku).toLocaleString('id-ID')}` : 'Rp 148.500.000')}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Terhitung depresiasi buku aktiva SAP
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Nomor Referensi Nota Dinas</label>
                  <div className="font-mono text-xs font-semibold text-slate-700 mt-0.5 bg-slate-50 p-2 rounded-lg border border-slate-200">
                    {doc.data?.nomor_referensi || 'ND.TI/PUSAT/X/2026/0122 — Permohonan Afkir Server & Switch'}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Bagian 2: Daftar Perangkat Aset TI Terlampir */}
          <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="border-l-4 border-[#f05a22] px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0b2046] uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#f05a22]" />
                Rincian Aset / Perangkat TI yang Diusulkan
              </h3>
              <span className="px-2.5 py-0.5 bg-orange-50 text-orange-800 text-[10px] font-bold rounded border border-orange-100">
                {doc.items?.length || 2} Item Terlampir
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 w-10 text-center">No</th>
                    <th className="py-3 px-4">Tag SAP / Serial Number</th>
                    <th className="py-3 px-4">Nama Perangkat & Spesifikasi</th>
                    <th className="py-3 px-4">Klasifikasi</th>
                    <th className="py-3 px-4">Alasan Teknis Pemusnahan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {doc.items && doc.items.length > 0 ? (
                    doc.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                          {item.id_aset || item.no_inventaris || `AST-KAI-${idx + 1}`}
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-[#0b2046]">
                          {item.nama_aset || item.nama_barang || doc.category_label}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded">
                            {item.jenis_aset || 'Fisik'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {item.alasan_pemusnahan || item.keterangan || 'Kerusakan fatal sistem & melewati batas usia pemakaian'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-3.5 px-4 text-center text-slate-400 font-bold">1</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {doc.inventory_code || '104-KAI-SRV-2018'}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-[#0b2046]">
                        {doc.category_label || 'Server Dell PowerEdge R740'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded">Fisik</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        Kerusakan fatal motherboard & melewati batas usia depresiasi teknis 5 tahun
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
              <span className="text-[11px]">Seluruh item telah diverifikasi fisik dan dicocokkan dengan basis data SAP Asset Management KAI.</span>
              <span className="text-[11px] font-bold text-slate-700">Kondisi: Rusak Total / Scrap</span>
            </div>
          </section>

          {/* Bagian 3: Protokol Sanitasi Media & Keamanan Informasi TI */}
          <section className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0b2046] uppercase tracking-wider">
              <HardDrive className="w-4 h-4 text-blue-600" />
              <span>Protokol Keamanan Informasi & Sanitasi Media Penyimpanan</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Sesuai dengan Kebijakan Tata Kelola Keamanan TI PT Kereta Api Indonesia (Persero), seluruh media penyimpanan (Harddisk, SSD, Flash Memory) pada perangkat yang dimusnahkan <strong>wajib melalui prosedur degaussing magnetik atau zero-fill sanitization</strong> untuk mencegah kebocoran data rahasia perusahaan sebelum dilakukan penghapusan fisik.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-semibold text-slate-700">
              <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> Degaussing Disetujui
              </span>
              <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> Pencabutan Label Barcode Fisik
              </span>
              <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> Sinkronisasi Status Aktiva SAP
              </span>
            </div>
          </section>
        </div>

        {/* === KOLOM KANAN (4/12 atau 5/12): STICKY WORKFLOW & ACTION PANEL === */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
          {/* Card 1: Alur Persetujuan Berjenjang (Sekuensial 1 ➔ 2 ➔ 3) */}
          <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="border-l-4 border-emerald-600 px-5 py-3.5 bg-white border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#0b2046] uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                Alur Persetujuan Berjenjang
              </h3>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                Wajib Berurutan
              </span>
            </div>

            <div className="p-5 space-y-3">
              {sequentialSteps.map((s) => {
                const existingAppr = approvalHistory.find(a => Number(a.step) === s.step);
                const isStepApproved = isApproved || (existingAppr && (existingAppr.action === 'APPROVED' || existingAppr.aksi === 'approved'));
                const isStepRejected = existingAppr && (existingAppr.action === 'REJECTED' || existingAppr.aksi === 'rejected');
                const isStepCurrentActive = isPending && s.step === currentActiveStep;
                const isStepLocked = !isApproved && s.step > currentActiveStep;

                const approverNameDisplay = getApproverDisplayForStep(s);

                return (
                  <div 
                    key={s.step}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isStepApproved ? 'bg-emerald-50/50 border-emerald-200' :
                      isStepRejected ? 'bg-rose-50/50 border-rose-200' :
                      isStepCurrentActive ? 'bg-white border-blue-400 shadow-xs ring-2 ring-blue-100' :
                      'bg-slate-50/80 border-slate-200 opacity-70'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 shrink-0">
                        {isStepApproved ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                            <CheckCircle className="w-3.5 h-3.5" />
                          </div>
                        ) : isStepRejected ? (
                          <div className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center">
                            <XCircle className="w-3.5 h-3.5" />
                          </div>
                        ) : isStepCurrentActive ? (
                          <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] animate-pulse">
                            {s.step}
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center">
                            <Lock className="w-3 h-3" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs text-slate-900">{s.title}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase shrink-0 ${
                            isStepApproved ? 'bg-emerald-100 text-emerald-800' :
                            isStepRejected ? 'bg-rose-100 text-rose-800' :
                            isStepCurrentActive ? 'bg-blue-100 text-blue-900' :
                            'bg-slate-200 text-slate-600'
                          }`}>
                            {isStepApproved ? 'Disetujui' :
                             isStepRejected ? 'Ditolak' :
                             isStepCurrentActive ? 'Giliran Aktif' :
                             'Terkunci'}
                          </span>
                        </div>

                        <div className="text-[11px] font-semibold text-slate-800 mt-1 truncate">
                          {approverNameDisplay}
                        </div>

                        <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                          {existingAppr?.catatan || existingAppr?.note
                            ? `"${existingAppr.catatan || existingAppr.note}"`
                            : s.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Card 2: Panel Tindakan Otorisasi / Disposisi */}
          <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="border-l-4 border-[#f05a22] px-5 py-3.5 bg-white border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#0b2046] uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-[#f05a22]" />
                Otorisasi Keputusan Disposisi
              </h3>
              <span className="text-[10px] font-bold text-orange-800 bg-orange-100 px-2 py-0.5 rounded">
                e-Sign Ready
              </span>
            </div>

            <div className="p-5">
              {isPending ? (
                canTakeAction ? (
                  <div className="space-y-4">
                    {/* Notes Textarea */}
                    <div>
                      <label htmlFor="disposisi-notes-input" className="block text-xs font-bold text-slate-700 mb-1">
                        Catatan Telaah Disposisi <span className="text-slate-400 font-normal">(Wajib jika menolak)</span>
                      </label>
                      <textarea
                        id="disposisi-notes-input"
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Tuliskan arahan disposisi, instruksi teknis, atau catatan pertimbangan..."
                        className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 bg-white focus:ring-1 focus:ring-[#f05a22]"
                      />
                    </div>

                    {/* E-sign Seal Badge & Link Pengaturan */}
                    <div className={`p-3.5 border rounded-xl space-y-2 transition-all ${
                      hasUserSignature 
                        ? 'bg-emerald-50/70 border-emerald-200' 
                        : 'bg-amber-50/70 border-amber-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                          <ShieldCheck className={`w-4 h-4 shrink-0 ${hasUserSignature ? 'text-emerald-600' : 'text-amber-600'}`} />
                          <span>
                            {hasUserSignature 
                              ? `e-Sign Terdaftar: ${user?.name || 'Pejabat Verifikator'}`
                              : `e-Sign Pejabat: ${user?.name || 'Pejabat Verifikator'}`}
                          </span>
                        </div>
                        <Link
                          to="/pengaturan"
                          className="text-[11px] font-bold text-[#f05a22] hover:text-[#d44813] hover:underline flex items-center gap-1"
                        >
                          <PenTool className="w-3.5 h-3.5" />
                          <span>{hasUserSignature ? 'Kelola di Pengaturan' : 'Unggah di Pengaturan'}</span>
                        </Link>
                      </div>
                      <p className={`text-[10px] leading-relaxed ${hasUserSignature ? 'text-emerald-800/90' : 'text-amber-800/90'}`}>
                        {hasUserSignature 
                          ? '✓ Tanda tangan digital resmi Anda telah aktif di profil. Anda tidak perlu mengunggah ulang berkas gambar saat menyetujui, cukup tuliskan PIN otorisasi.'
                          : 'ℹ️ Belum ada berkas tanda tangan PNG di profil Anda. Anda dapat mengunggahnya terlebih dahulu di menu Pengaturan, atau lanjutkan untuk memakai stempel digital resmi KAI.'}
                      </p>
                    </div>

                    {/* Direct Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {/* Tombol Setujui Langsung (Membuka Validasi PIN) */}
                      <button
                        type="button"
                        id="btn-action-approve"
                        onClick={handleOpenApproveModal}
                        disabled={isSubmitting}
                        className={`py-3 px-4 rounded-xl text-white font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all shadow-sm bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] ${
                          isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-xs">
                          {isSubmitting ? (
                            <RefreshCw className="w-4 h-4 animate-spin text-white" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-white" />
                          )}
                          <span>Setujui Dokumen</span>
                        </div>
                        <span className="text-[10px] font-normal text-emerald-100">
                          Validasi PIN & bubuhkan e-Sign
                        </span>
                      </button>

                      {/* Tombol Tolak Langsung */}
                      <button
                        type="button"
                        id="btn-action-reject"
                        onClick={handleRejectDocument}
                        disabled={isSubmitting}
                        className={`py-3 px-4 rounded-xl text-white font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all shadow-sm bg-rose-600 hover:bg-rose-700 active:scale-[0.98] ${
                          isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-xs">
                          {isSubmitting ? (
                            <RefreshCw className="w-4 h-4 animate-spin text-white" />
                          ) : (
                            <XCircle className="w-4 h-4 text-white" />
                          )}
                          <span>Tolak Dokumen</span>
                        </div>
                        <span className="text-[10px] font-normal text-rose-100">
                          Hentikan & kembalikan ke pemohon
                        </span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-900">
                        Otorisasi Terkunci (Menunggu Giliran)
                      </h4>
                      <p className="text-[11px] text-amber-800/90 mt-1 leading-relaxed">
                        Dokumen ini saat ini sedang dalam proses review pada <strong>{sequentialSteps[currentActiveStep - 1]?.title} oleh {currentApproverName}</strong>. Anda baru dapat mengambil keputusan setelah tahapan tersebut selesai disetujui.
                      </p>
                    </div>
                  </div>
                )
              ) : isApproved ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 text-emerald-900">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Dokumen Disetujui Penuh & Sah</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Seluruh 3 jenjang verifikasi telah selesai dilaksanakan. Dokumen Permohonan Pemusnahan Aset [DSP-01] telah resmi disetujui dan ditandatangani secara digital.
                  </p>
                  <button
                    onClick={handleDownloadPdf}
                    className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>Unduh Formulir Permohonan PDF</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-rose-900">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Dokumen Ditolak / Berhenti</span>
                  </div>
                  <p className="text-[11px] text-rose-800 leading-relaxed">
                    Pengajuan pemusnahan aset ini telah ditolak oleh pejabat otorisator. Pemohon dipersilakan melakukan revisi usulan baru.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* === MODAL 1: VALIDASI PIN OTORISASI E-SIGN === */}
      {/* === MODAL AUTENTIKASI PIN OTORISASI E-SIGN === */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#0b2046] text-white p-4.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-[#f05a22] flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold leading-tight">Otorisasi Tanda Tangan Digital</h3>
                  <p className="text-[11px] text-slate-300">Autentikasi PIN & pembubuhan e-Sign KAI</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPinModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4">
              {/* User Identity Card */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#0b2046] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {user?.name?.slice(0, 2).toUpperCase() || 'OT'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">{user?.name || 'Pejabat Otorisator'}</h4>
                    <p className="text-[10px] text-slate-500">NIP: {user?.nip || '-'} • {user?.roleLabel || 'Verifikator'}</p>
                  </div>
                </div>
                <Link
                  to="/pengaturan"
                  target="_blank"
                  className="text-[10px] font-bold text-[#f05a22] hover:underline flex items-center gap-1 shrink-0"
                >
                  <PenTool className="w-3 h-3" />
                  Pengaturan
                </Link>
              </div>

              {/* Status Tanda Tangan Profile */}
              {hasUserSignature ? (
                <div className="flex items-center gap-3 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                  <div className="w-20 h-11 bg-white border border-emerald-200 rounded-lg flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-xs">
                    <img 
                      src={api.getSignatureUrl()} 
                      alt="Tanda Tangan Aktif" 
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                  <div className="text-[11px] text-emerald-900 leading-tight">
                    <span className="font-bold">Tanda Tangan Tersimpan:</span> File tanda tangan resmi Anda siap dibubuhkan otomatis dengan validasi PIN di bawah ini.
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-600 leading-tight">
                    <span className="font-bold text-slate-800">Stempel Digital Resmi:</span> Dokumen akan dibubuhi stempel sah KAI. Anda juga dapat mengunggah tanda tangan PNG di Pengaturan.
                  </div>
                  <Link
                    to="/pengaturan"
                    target="_blank"
                    className="text-[10px] font-bold text-[#f05a22] hover:underline shrink-0"
                  >
                    Unggah TTD ↗
                  </Link>
                </div>
              )}

              {/* Input PIN Form */}
              <div>
                <label htmlFor="modal-pin-input" className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-[#f05a22]" />
                  <span>Ketik PIN Otorisasi Digital:</span>
                </label>
                <input
                  id="modal-pin-input"
                  type="password"
                  maxLength={10}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Ketik PIN otorisasi (default: 123456)"
                  className="w-full text-center tracking-widest text-base font-mono font-bold py-2.5 px-3 rounded-xl border border-slate-300 focus:border-[#f05a22] focus:ring-2 focus:ring-orange-100 outline-none"
                  autoFocus
                />
                <p className="text-[10px] text-slate-400 mt-1.5 leading-snug">
                  🔒 PIN memverifikasi bahwa pengesahan dilakukan oleh pejabat yang berwenang. (PIN default demo: <strong className="text-slate-600 font-mono">123456</strong> atau password akun).
                </p>
              </div>

              {/* Error Alert */}
              {pinError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsPinModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                id="btn-confirm-approve-pin"
                onClick={handleConfirmApproveWithPin}
                disabled={isSubmitting || !pinInput.trim()}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Memvalidasi...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Sahkan & Bubuhkan e-Sign</span>
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
