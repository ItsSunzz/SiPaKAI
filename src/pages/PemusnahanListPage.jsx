import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FilePlus, 
  Search, 
  RefreshCw, 
  Download, 
  FileText, 
  CheckCircle, 
  XCircle, 
  CheckSquare, 
  Eye, 
  FileDown, 
  Clock, 
  AlertCircle,
  Filter,
  ShieldAlert,
  Edit3,
  RotateCcw
} from 'lucide-react';
import { api, fallbackDocuments } from '../services/api';
import ReviewModal from '../components/ReviewModal';
import DocumentDetailModal from '../components/DocumentDetailModal';

const formatJabatanText = (jabatan) => {
  if (!jabatan) return '';
  if (typeof jabatan === 'string') return jabatan;
  if (typeof jabatan === 'object') return jabatan.nama || jabatan.name || jabatan.kode || '';
  return String(jabatan);
};

export default function PemusnahanListPage({ user, onReviewDocument, onViewDocument }) {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [unitFilter, setUnitFilter] = useState('all');

  // Modal State
  const [selectedReviewDoc, setSelectedReviewDoc] = useState(null);
  const [selectedDetailDoc, setSelectedDetailDoc] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Check admin or super admin privilege
  const isAdminOrSuper = !user || user.role === 'admin' || user.role === 'super_admin';

  const showToast = (msg) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const fetchDocs = async () => {
    setIsLoading(true);
    try {
      const [res, approversRes] = await Promise.all([
        api.getDocuments({ type: 'dsp01' }),
        api.getApprovers('all=1').catch(() => api.getApprovers()).catch(() => []),
      ]);
      const approversList = Array.isArray(approversRes) ? approversRes : (approversRes?.data || []);

      let storedApproversMap = {};
      try {
        storedApproversMap = JSON.parse(localStorage.getItem('sipakai_dsp01_approvers') || '{}');
      } catch (e) {}

      if (res?.data) {
        const mapped = res.data.map(doc => {
          const rawDoc = doc.data || {};
          const docNum = doc.number || doc.nomor || `PMH/000${doc.id}/X/2026`;
          const localEntry =
            storedApproversMap[String(doc.id)] ||
            storedApproversMap[String(docNum)] ||
            (rawDoc.revisi_dari_id ? storedApproversMap[String(rawDoc.revisi_dari_id)] : null);

          // Hitung step approvals sesuai pilihan pemohon
          const approvalHistory = doc.approvals || doc.persetujuan || [];
          const chain = (Array.isArray(rawDoc.approval_chain) && rawDoc.approval_chain.length > 0)
            ? rawDoc.approval_chain
            : (Array.isArray(localEntry?.approval_chain) && localEntry.approval_chain.length > 0)
            ? localEntry.approval_chain
            : [
                rawDoc.verifikator_1_id || rawDoc.verifikator_1?.id || localEntry?.verifikator_1_id || localEntry?.v1?.id,
                rawDoc.verifikator_2_id || rawDoc.verifikator_2?.id || localEntry?.verifikator_2_id || localEntry?.v2?.id,
                rawDoc.verifikator_3_id || rawDoc.verifikator_3?.id || localEntry?.verifikator_3_id || localEntry?.v3?.id,
              ].filter(Boolean);

          let currentStepNumber = 1;
          const pendingApproval = approvalHistory.find(a => (a.aksi === 'pending' || a.action === 'PENDING'));
          const rejectedApproval = approvalHistory.find(a => (a.aksi === 'rejected' || a.action === 'REJECTED'));
          if (chain.length > 0 && doc.penyetuju_id) {
            const idx = chain.findIndex(cid => Number(cid) === Number(doc.penyetuju_id));
            if (idx !== -1) currentStepNumber = idx + 1;
          } else if (pendingApproval && pendingApproval.step) {
            currentStepNumber = Number(pendingApproval.step);
          } else if (rejectedApproval && rejectedApproval.step) {
            currentStepNumber = Number(rejectedApproval.step);
          }

          // Resolusi nama & jabatan pejabat verifikator sesuai pilihan pemohon pada tahap aktif
          const activeStepVerifierId =
            rawDoc[`verifikator_${currentStepNumber}_id`] ||
            rawDoc[`verifikator_${currentStepNumber}`]?.id ||
            localEntry?.[`verifikator_${currentStepNumber}_id`] ||
            localEntry?.[`v${currentStepNumber}`]?.id ||
            chain[currentStepNumber - 1] ||
            doc.penyetuju_id;

          const matchedApproverUser = activeStepVerifierId
            ? approversList.find(u => Number(u.id) === Number(activeStepVerifierId))
            : null;
          const localStepObj = rawDoc[`verifikator_${currentStepNumber}`] || localEntry?.[`v${currentStepNumber}`];

          const approverName =
            rawDoc[`verifikator_${currentStepNumber}_nama`] ||
            localStepObj?.name ||
            localStepObj?.nama ||
            matchedApproverUser?.nama ||
            matchedApproverUser?.name ||
            doc.current_approver?.nama ||
            doc.current_approver?.name ||
            doc.approver?.name ||
            doc.approver?.nama ||
            pendingApproval?.approver?.nama ||
            pendingApproval?.approver?.name ||
            '';

          const approverJabatan =
            rawDoc[`verifikator_${currentStepNumber}_jabatan`] ||
            formatJabatanText(localStepObj?.jabatan) ||
            formatJabatanText(matchedApproverUser?.jabatan) ||
            formatJabatanText(doc.current_approver?.jabatan) ||
            formatJabatanText(doc.approver?.jabatan) ||
            formatJabatanText(pendingApproval?.approver?.jabatan) ||
            '';

          const rawStatus = (doc.status || '').toLowerCase();
          const isDocDraft = rawStatus === 'draft' || rawStatus === 'draf';
          const isDocRejected = rawStatus === 'rejected' || rawStatus === 'ditolak';
          const normalizedStatus = isDocDraft ? 'draft' : isDocRejected ? 'rejected' : (doc.status || 'in_review');

          const rejectionNote = rejectedApproval?.catatan || rejectedApproval?.note || rawDoc.catatan_penolakan || '';

          let stepLabel = `Tahap ${currentStepNumber}: Menunggu Disposisi`;
          if (approverName) {
            stepLabel = `Tahap ${currentStepNumber}: ${approverName}${approverJabatan ? ` (${approverJabatan})` : ''}`;
          } else if (currentStepNumber === 1) {
            stepLabel = 'Tahap 1: Verifikasi Atasan Langsung';
          } else if (currentStepNumber === 2) {
            stepLabel = 'Tahap 2: Validasi Teknis Pengelola TI';
          } else if (currentStepNumber === 3) {
            stepLabel = 'Tahap 3: Penyetuju Akhir';
          }

          return {
            ...rawDoc,
            id: doc.id,
            number: docNum,
            inventory_code: doc.data?.id_aset || doc.data?.no_inventaris || `AST-KAI-${doc.id}`,
            type: doc.type || doc.tipe || 'dsp01',
            category_label: doc.type === 'dsp01' ? 'Permohonan Pemusnahan Aset TI' :
              doc.type === 'dsp02' ? 'Berita Acara Pemusnahan' : 'Penghapusan Aset TI',
            category_type: 'pemusnahan',
            requester_name: doc.requester?.name || doc.requester?.nama || doc.data?.nama_pemohon || 'Petugas TI',
            requester_unit: (typeof doc.requester?.jabatan === 'object' ? doc.requester?.jabatan?.nama : doc.requester?.jabatan) || doc.requester?.unit_kerja || doc.data?.unit_kerja || 'DAOP 1 Jakarta',
            requester_nip: doc.requester?.nip || doc.data?.nip_pemohon || '62489',
            date: new Date(doc.submitted_at || doc.created_at || Date.now()).toLocaleDateString('id-ID', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            }),
            book_value: doc.data?.nilai_buku
              ? `Rp ${Number(doc.data.nilai_buku).toLocaleString('id-ID')}`
              : 'Rp 148.500.000',
            status: normalizedStatus,
            penyetuju_id: doc.penyetuju_id || activeStepVerifierId,
            current_step: currentStepNumber,
            current_approver_name: approverName,
            rejection_note: rejectionNote,
            is_revised: Boolean(rawDoc.is_revised || rawDoc.catatan_revisi),
            revisi_ke: Number(rawDoc.revisi_ke) || 0,
            status_label: isDocDraft ? 'Draf Pengajuan' :
              doc.status === 'approved' ? 'Disetujui Penuh (Sah)' :
              isDocRejected ? 'Ditolak / Perlu Revisi' : stepLabel,
          };
        });
        setDocuments(mapped);
      } else {
        setDocuments([]);
      }
    } catch (err) {
      console.error('Gagal memuat dokumen DSP-01 dari backend:', err);
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  // Filtered documents
  const filteredDocuments = documents.filter((doc) => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery = !q ||
      doc.number?.toLowerCase().includes(q) ||
      doc.inventory_code?.toLowerCase().includes(q) ||
      doc.requester_name?.toLowerCase().includes(q) ||
      doc.category_label?.toLowerCase().includes(q) ||
      doc.current_approver_name?.toLowerCase().includes(q);

    const matchStatus = statusFilter === 'all' || 
      doc.status === statusFilter || 
      (statusFilter === 'draft' && (doc.status === 'draft' || doc.status === 'draf')) ||
      (statusFilter === 'in_review' && (doc.status === 'in_review' || doc.status === 'pending')) ||
      (statusFilter === 'rejected' && (doc.status === 'rejected' || doc.status === 'ditolak'));

    const matchUnit = unitFilter === 'all' || doc.requester_unit?.toLowerCase().includes(unitFilter.toLowerCase());

    return matchQuery && matchStatus && matchUnit;
  });

  // Calculate dynamic metrics
  const totalCount = documents.length;
  const draftCount = documents.filter(d => d.status === 'draft' || d.status === 'draf').length;
  const pendingCount = documents.filter(d => d.status === 'in_review' || d.status === 'pending').length;
  const approvedCount = documents.filter(d => d.status === 'approved').length;
  const rejectedCount = documents.filter(d => d.status === 'rejected' || d.status === 'ditolak').length;

  const handleOpenReview = (doc) => {
    navigate(`/pemusnahan/${doc.id}/review`);
  };

  const handleOpenDetail = (doc) => {
    navigate(`/pemusnahan/${doc.id}/review`);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
      {/* Toast Alert */}
      {actionNotice && (
        <div className="fixed top-5 right-5 z-50 p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2.5 shadow-xl animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
          <button 
            type="button" 
            onClick={() => setActionNotice(null)} 
            className="ml-2 text-emerald-600 hover:text-emerald-900"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0b2046] flex items-center gap-3">
            Pemusnahan & Penghapusan Aset
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-md border border-blue-200">
              AUDIT & COMPLIANCE TI
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitoring pengajuan permohonan pemusnahan aset TI berjenjang (DSP-01) PT Kereta Api Indonesia (Persero).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button 
            type="button" 
            onClick={fetchDocs} 
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <span>Segarkan</span>
          </button>

          <button 
            type="button" 
            onClick={() => navigate('/pemusnahan/create')}
            className="flex items-center gap-2 px-4 py-2 bg-[#f05a22] hover:bg-[#d94a18] text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            <FilePlus className="w-4 h-4" />
            <span>Buat Permohonan Baru [DSP-01]</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total */}
        <div 
          onClick={() => setStatusFilter('all')}
          className={`bg-white p-5 rounded-xl border transition-all cursor-pointer shadow-xs ${
            statusFilter === 'all' ? 'border-[#0b2046] ring-1 ring-[#0b2046]/30' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Dokumen</p>
            <FileText className="w-5 h-5 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-[#0b2046]">{totalCount}</h3>
            <span className="text-xs text-slate-500 font-medium">Berkas Dokumen</span>
          </div>
        </div>

        {/* Pending */}
        <div 
          onClick={() => setStatusFilter('in_review')}
          className={`bg-white p-5 rounded-xl border transition-all cursor-pointer shadow-xs ${
            statusFilter === 'in_review' ? 'border-orange-500 ring-1 ring-orange-500/30' : 'border-orange-200 hover:border-orange-300'
          }`}
        >
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-orange-700 uppercase tracking-wider">Menunggu Persetujuan</p>
            <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-orange-600" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-orange-600">{pendingCount}</h3>
            <span className="text-xs text-orange-700/80 font-medium">Perlu Disposisi</span>
          </div>
        </div>

        {/* Approved */}
        <div 
          onClick={() => setStatusFilter('approved')}
          className={`bg-white p-5 rounded-xl border transition-all cursor-pointer shadow-xs ${
            statusFilter === 'approved' ? 'border-emerald-500 ring-1 ring-emerald-500/30' : 'border-emerald-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Disetujui / Selesai</p>
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-emerald-600">{approvedCount}</h3>
            <span className="text-xs text-emerald-700/80 font-medium">Disetujui Penuh</span>
          </div>
        </div>

        {/* Rejected */}
        <div 
          onClick={() => setStatusFilter('rejected')}
          className={`bg-white p-5 rounded-xl border transition-all cursor-pointer shadow-xs ${
            statusFilter === 'rejected' ? 'border-rose-500 ring-1 ring-rose-500/30' : 'border-rose-200 hover:border-rose-300'
          }`}
        >
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">Ditolak / Revisi</p>
            <XCircle className="w-5 h-5 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-rose-600">{rejectedCount}</h3>
            <span className="text-xs text-rose-700/80 font-medium">Perlu Revisi</span>
          </div>
        </div>
      </div>

      {/* Notice for Rejected Documents Requiring Revision */}
      {rejectedCount > 0 && (
        <div className="bg-rose-50/90 border border-rose-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700 shrink-0">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-rose-900">
                Terdapat {rejectedCount} Dokumen Permohonan Pemusnahan (DSP-01) yang Ditolak &amp; Memerlukan Revisi
              </h4>
              <p className="text-[11px] text-rose-700 mt-0.5">
                Silakan buka <strong>Formulir Revisi</strong> pada dokumen yang ditolak untuk memperbaiki rincian aset atau referensi sesuai catatan verifikator dan mengajukannya kembali.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'rejected' ? 'all' : 'rejected')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer shrink-0 ${
              statusFilter === 'rejected'
                ? 'bg-rose-600 text-white border-rose-700'
                : 'bg-white hover:bg-rose-100 text-rose-900 border-rose-300'
            }`}
          >
            {statusFilter === 'rejected' ? 'Tampilkan Semua' : `Lihat Dokumen Ditolak (${rejectedCount})`}
          </button>
        </div>
      )}

      {/* Notice for Drafts */}
      {draftCount > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                Tersimpan {draftCount} Dokumen Draf Permohonan Pemusnahan (DSP-01)
              </h4>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Dokumen draf belum diajukan ke Verifikator. Anda dapat membuka dan melanjutkan penyuntingan kapan saja.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'draft' ? 'all' : 'draft')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer shrink-0 ${
              statusFilter === 'draft'
                ? 'bg-amber-600 text-white border-amber-700'
                : 'bg-white hover:bg-amber-100 text-amber-900 border-amber-300'
            }`}
          >
            {statusFilter === 'draft' ? 'Tampilkan Semua' : `Filter Draf (${draftCount})`}
          </button>
        </div>
      )}

      {/* Role Notice for Admin / Super Admin */}
      {isAdminOrSuper && pendingCount > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <CheckSquare className="w-4 h-4 text-blue-700" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-blue-900">
                Akses Otorisator Aktif: Terdapat {pendingCount} Berkas Menunggu Disposisi Anda
              </h4>
              <p className="text-[11px] text-blue-800/80 mt-0.5">
                Sebagai {user?.roleLabel || 'Pejabat Otorisator / Admin'}, Anda dapat meninjau rincian dokumen dan memberikan persetujuan atau penolakan dengan catatan resmi.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 text-[11px] font-bold rounded bg-blue-200/80 text-blue-900 shrink-0">
            Disposisi e-Sign
          </span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap gap-4 items-center shadow-xs">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari No. Dokumen, Kode Aset, atau Nama Pemohon..." 
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#f05a22]"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:border-[#f05a22]"
          >
            <option value="all">Semua Status Verifikasi</option>
            <option value="draft">Draf Pengajuan {draftCount > 0 ? `(${draftCount})` : ''}</option>
            <option value="in_review">Menunggu Persetujuan</option>
            <option value="approved">Disetujui Penuh</option>
            <option value="rejected">Ditolak / Revisi {rejectedCount > 0 ? `(${rejectedCount})` : ''}</option>
          </select>

          <select 
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:border-[#f05a22]"
          >
            <option value="all">Semua Wilayah / Unit</option>
            <option value="Kantor Pusat">Kantor Pusat</option>
            <option value="DAOP 1">DAOP 1 Jakarta</option>
            <option value="DAOP 2">DAOP 2 Bandung</option>
            <option value="DAOP 4">DAOP 4 Semarang</option>
            <option value="DAOP 6">DAOP 6 Yogyakarta</option>
            <option value="DAOP 8">DAOP 8 Surabaya</option>
          </select>
        </div>
        {(searchQuery || statusFilter !== 'all' || unitFilter !== 'all') && (
          <button 
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setUnitFilter('all');
            }}
            className="text-xs text-rose-600 hover:text-rose-800 font-bold ml-auto cursor-pointer"
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <th className="px-5 py-3.5 w-12 text-center">NO</th>
              <th className="px-5 py-3.5">NOMOR REGISTRASI</th>
              <th className="px-5 py-3.5">TIPE DOKUMEN</th>
              <th className="px-5 py-3.5">RINCIAN ASET</th>
              <th className="px-5 py-3.5">TANGGAL</th>
              <th className="px-5 py-3.5">PEMOHON & UNIT</th>
              <th className="px-5 py-3.5">STATUS</th>
              <th className="px-5 py-3.5 text-center">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Memuat daftar dokumen pemusnahan...</span>
                  </div>
                </td>
              </tr>
            ) : filteredDocuments.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                  <AlertCircle className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                  <span>Tidak ada dokumen yang sesuai dengan filter pencarian.</span>
                </td>
              </tr>
            ) : (
              filteredDocuments.map((doc, idx) => {
                const isDraft = doc.status === 'draft' || doc.status === 'draf';
                const isPending = !isDraft && (doc.status === 'in_review' || doc.status === 'pending');
                const isApproved = doc.status === 'approved';
                const isRejected = doc.status === 'rejected' || doc.status === 'ditolak';

                return (
                  <tr key={doc.id || idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 text-center text-slate-400 font-medium">
                      {idx + 1}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#0b2046] font-mono text-xs">{doc.number}</span>
                        {doc.is_revised && (
                          <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[9px] font-bold">
                            Revisi {doc.revisi_ke > 0 ? `#${doc.revisi_ke}` : ''}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Klasifikasi: Aset Operasional</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded border border-slate-200">
                        {doc.type === 'dsp01' ? 'DSP-01: Permohonan' : doc.type === 'dsp02' ? 'DSP-02: Berita Acara' : 'DSP-03: Penghapusan'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-800 max-w-[220px] truncate">
                        {doc.category_label || doc.inventory_code}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Tag: {doc.inventory_code}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 font-medium">
                      {doc.date}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#0b2046] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                          {(doc.requester_name || 'US').substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate">{doc.requester_name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{doc.requester_unit}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border inline-flex items-center gap-1.5
                        ${isDraft ? 'bg-amber-50 text-amber-800 border-amber-200' :
                          isPending ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                          isApproved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                          isRejected ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-slate-50 text-slate-700 border-slate-200'}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          isDraft ? 'bg-amber-500' :
                          isPending ? 'bg-orange-500 animate-pulse' : 
                          isApproved ? 'bg-emerald-500' : 
                          isRejected ? 'bg-rose-500' : 'bg-slate-400'
                        }`}></span>
                        <span>{doc.status_label}</span>
                      </span>
                      {isRejected && doc.rejection_note && (
                        <div className="text-[10px] text-rose-600 mt-1 max-w-[200px] truncate" title={`Catatan Penolakan: ${doc.rejection_note}`}>
                          Catatan: &ldquo;{doc.rejection_note}&rdquo;
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center">
                        {isDraft ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              id={`btn-edit-draft-${doc.id || idx}`}
                              onClick={() => navigate(`/pemusnahan/${doc.id}/edit`)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#f05a22] hover:bg-[#d94a18] text-white transition-all shadow-2xs cursor-pointer"
                              title="Edit dan lanjutkan pengajuan draf permohonan"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit Draf</span>
                            </button>
                            <button
                              type="button"
                              id={`btn-view-${doc.id || idx}`}
                              onClick={() => handleOpenReview(doc)}
                              className="inline-flex items-center p-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer"
                              title="Lihat Pratinjau Draf"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                            </button>
                          </div>
                        ) : isRejected ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              id={`btn-revisi-${doc.id || idx}`}
                              onClick={() => navigate(`/pemusnahan/${doc.id}/revisi`)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-2xs cursor-pointer"
                              title="Buka Formulir Revisi untuk memperbaiki dan mengajukan ulang permohonan yang ditolak"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Formulir Revisi</span>
                            </button>
                            <button
                              type="button"
                              id={`btn-view-rejected-${doc.id || idx}`}
                              onClick={() => handleOpenReview(doc)}
                              className="inline-flex items-center p-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer"
                              title="Lihat Rincian & Catatan Penolakan"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                            </button>
                          </div>
                        ) : (() => {
                          const canAct = isPending && (isAdminOrSuper || (user?.id && doc.penyetuju_id && Number(user.id) === Number(doc.penyetuju_id)));
                          return (
                            <button
                              type="button"
                              id={`btn-review-${doc.id || idx}`}
                              onClick={() => handleOpenReview(doc)}
                              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer ${
                                canAct
                                  ? 'bg-[#f05a22] hover:bg-[#d94a18] text-white shadow-[#f05a22]/20'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                              }`}
                              title={canAct ? 'Buka Telaah Dokumen & Otorisasi Persetujuan' : 'Buka Rincian Dokumen'}
                            >
                              {canAct ? (
                                <>
                                  <CheckSquare className="w-3.5 h-3.5" />
                                  <span>Review & Approval</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Lihat Dokumen</span>
                                </>
                              )}
                            </button>
                          );
                        })()}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
