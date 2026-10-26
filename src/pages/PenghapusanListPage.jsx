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
  Eye,
  Clock,
  AlertCircle,
  FileDown,
  X,
  Loader2,
  Trash2,
  Edit3,
  Building2,
  UserCheck,
  Calendar,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';

export default function PenghapusanListPage({ user }) {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [unitFilter, setUnitFilter] = useState('all');
  const [actionNotice, setActionNotice] = useState(null);

  // PDF Preview Modal State
  const [isPreviewPdfModalOpen, setIsPreviewPdfModalOpen] = useState(false);
  const [previewPdfBlobUrl, setPreviewPdfBlobUrl] = useState(null);
  const [isLoadingPreviewPdf, setIsLoadingPreviewPdf] = useState(false);
  const [previewPdfError, setPreviewPdfError] = useState(null);
  const [previewDocTitle, setPreviewDocTitle] = useState('');

  const showToast = (msg) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const fetchDocs = async () => {
    setIsLoading(true);
    try {
      const res = await api.getDocuments({ type: 'dsp03' }).catch(() => null);
      let list = [];

      const rawDocs = Array.isArray(res) ? res : (res?.data || []);

      if (rawDocs.length > 0) {
        list = rawDocs.map((doc) => {
          const rawDoc = doc;
          const chain = doc.data?.approval_chain || [
            doc.data?.verifikator_1_id,
            doc.data?.verifikator_2_id,
          ].filter(Boolean);

          let currentStepNumber = 1;
          if (Array.isArray(chain) && chain.length > 0 && doc.penyetuju_id) {
            const idx = chain.findIndex(id => Number(id) === Number(doc.penyetuju_id));
            if (idx !== -1) {
              currentStepNumber = idx + 1;
            }
          } else if (Array.isArray(doc.persetujuan) && doc.persetujuan.length > 0) {
            const pendingStep = doc.persetujuan.find(p => p.aksi === 'pending' || p.action === 'PENDING');
            if (pendingStep) {
              currentStepNumber = pendingStep.step || 1;
            }
          }

          const currentApproverObj = doc.current_approver || doc.currentApprover || doc.penyetuju;
          const approverName = currentApproverObj?.nama || currentApproverObj?.name || '';
          const shortApprover = approverName ? approverName.split(' ')[0] : '';

          let stepLabel = 'Menunggu Verifikasi';
          if (currentStepNumber === 1) {
            stepLabel = `Tahap 1: Disetujui${shortApprover ? ` (${shortApprover})` : ''}`;
          } else if (currentStepNumber === 2) {
            stepLabel = `Tahap 2: Mengetahui${shortApprover ? ` (${shortApprover})` : ''}`;
          }

          const itemsArr = doc.items || doc.data?.items || [];
          const firstItem = itemsArr[0];
          const assetName = firstItem?.nama_barang || firstItem?.nama_aset || doc.data?.nama_barang || 'Aset TI Terkait';
          const totalQty = itemsArr.reduce((acc, it) => acc + (Number(it.jumlah) || 1), 0) || (itemsArr.length || 1);

          const saksiDisplay = doc.data?.saksi
            ? (Array.isArray(doc.data.saksi) ? doc.data.saksi.join(', ') : String(doc.data.saksi))
            : '-';

          return {
            ...rawDoc,
            id: doc.id,
            number: doc.number || doc.nomor || (doc.status === 'draft' ? `DRAF-000${doc.id}` : `FR-PH/TI/000${doc.id}/2026`),
            ref_number: doc.data?.nomor_referensi || doc.data?.ref_ba || '-',
            inventory_code: firstItem?.no_inventaris || firstItem?.id_aset || '-',
            type: 'dsp03',
            category_label: itemsArr.length > 1 ? `${assetName} (+${itemsArr.length - 1} item lainnya)` : assetName,
            total_items: totalQty,
            nama_pelaksana: doc.data?.nama_pelaksana || doc.requester?.name || doc.requester?.nama || 'Petugas Pelaksana TI',
            nipp_pelaksana: doc.data?.nipp_pelaksana || doc.requester?.nip || '-',
            jabatan_pelaksana: doc.data?.jabatan_pelaksana || (typeof doc.requester?.jabatan === 'object' ? doc.requester?.jabatan?.nama : doc.requester?.jabatan) || 'Pelaksana TI',
            lokasi: doc.data?.lokasi || doc.requester?.unit_kerja || 'Kantor Pusat Bandung',
            status_kondisi: doc.data?.status_kondisi || 'Dimusnahkan',
            saksi: saksiDisplay,
            date: new Date(doc.data?.tanggal || doc.submitted_at || doc.created_at || Date.now()).toLocaleDateString('id-ID', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            }),
            raw_date: doc.data?.tanggal || doc.submitted_at || doc.created_at,
            status: doc.status || 'in_review',
            penyetuju_id: doc.penyetuju_id,
            current_step: currentStepNumber,
            current_approver_name: approverName,
            status_label: doc.status === 'approved' ? 'Disetujui Penuh (Sah)' :
              doc.status === 'rejected' ? 'Ditolak / Revisi' :
              doc.status === 'draft' ? 'Draf Formulir' : stepLabel,
          };
        });
      }

      setDocuments(list);
    } catch {
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleDeleteDraft = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Apakah Anda yakin ingin menghapus draf formulir penghapusan ini?')) return;
    try {
      await api.deleteDocument(id);
      showToast('Draf formulir berhasil dihapus.');
      fetchDocs();
    } catch (err) {
      alert(err.message || 'Gagal menghapus draf.');
    }
  };

  // Filtered documents
  const filteredDocuments = documents.filter((doc) => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery = !q ||
      doc.number?.toLowerCase().includes(q) ||
      doc.ref_number?.toLowerCase().includes(q) ||
      doc.inventory_code?.toLowerCase().includes(q) ||
      doc.nama_pelaksana?.toLowerCase().includes(q) ||
      doc.category_label?.toLowerCase().includes(q) ||
      doc.lokasi?.toLowerCase().includes(q);

    const matchStatus = statusFilter === 'all' ||
      (statusFilter === 'in_review' && (doc.status === 'in_review' || doc.status === 'pending')) ||
      (statusFilter === 'approved' && (doc.status === 'approved' || doc.status === 'signed')) ||
      (statusFilter === 'draft' && (doc.status === 'draft' || doc.status === 'rejected')) ||
      doc.status === statusFilter;

    const matchUnit = unitFilter === 'all' || doc.lokasi?.toLowerCase().includes(unitFilter.toLowerCase());

    return matchQuery && matchStatus && matchUnit;
  });

  // Dynamic metrics
  const totalCount = documents.length;
  const pendingCount = documents.filter(d => d.status === 'in_review' || d.status === 'pending').length;
  const approvedCount = documents.filter(d => d.status === 'approved' || d.status === 'signed').length;
  const draftCount = documents.filter(d => d.status === 'draft' || d.status === 'rejected').length;

  const handleOpenReview = (doc) => {
    navigate(`/penghapusan/${doc.id}`);
  };

  // Preview PDF directly from List
  const handleQuickPreviewPdf = async (doc) => {
    setPreviewDocTitle(doc.number || 'Formulir Penghapusan Aset TI');
    setIsPreviewPdfModalOpen(true);
    setIsLoadingPreviewPdf(true);
    setPreviewPdfError(null);

    if (previewPdfBlobUrl) {
      URL.revokeObjectURL(previewPdfBlobUrl);
      setPreviewPdfBlobUrl(null);
    }

    try {
      let blob = null;
      if (doc.id && !isNaN(Number(doc.id))) {
        try {
          blob = await api.getDocumentPdfBlob(doc.id);
        } catch {
          blob = null;
        }
      }

      if (!blob) {
        const payload = {
          type: 'dsp03',
          data: {
            nomor_referensi: doc.ref_number || doc.number,
            tanggal: doc.raw_date ? new Date(doc.raw_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            nama_pelaksana: doc.nama_pelaksana || 'Petugas TI',
            nipp_pelaksana: doc.nipp_pelaksana || '-',
            jabatan_pelaksana: doc.jabatan_pelaksana || 'Pelaksana TI',
            lokasi: doc.lokasi || 'Kantor Pusat Bandung',
            status_kondisi: doc.status_kondisi || 'Dimusnahkan',
            saksi: doc.saksi || '',
            verifikator_1_id: doc.data?.verifikator_1_id || null,
            verifikator_2_id: doc.data?.verifikator_2_id || null,
          },
          items: (doc.items && doc.items.length > 0) ? doc.items.map(it => ({
            nama_barang: it.nama_barang || it.nama_aset || doc.category_label,
            jumlah: Number(it.jumlah) || 1,
            serial_nomor: it.serial_nomor || it.serialNumber || '-',
            no_inventaris: it.no_inventaris || it.id_aset || '-',
            lokasi_aset: it.lokasi_aset || doc.lokasi,
            keterangan: it.keterangan || '-',
          })) : [
            {
              nama_barang: doc.category_label || 'Aset TI Operasional',
              jumlah: doc.total_items || 1,
              serial_nomor: '-',
              no_inventaris: doc.inventory_code || '-',
              lokasi_aset: doc.lokasi,
              keterangan: 'Penghapusan inventaris aktiva',
            }
          ],
        };

        blob = await api.previewPdf(payload);
      }

      const url = URL.createObjectURL(blob);
      setPreviewPdfBlobUrl(url);
    } catch (err) {
      console.error('Gagal pratinjau PDF:', err);
      setPreviewPdfError(err.message || 'Gagal menghasilkan pratinjau PDF dari server.');
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
            Penghapusan Aset Teknologi Informasi
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-md border border-blue-200">
              DSP-03 &bull; FR.SM/TI/015.007/10-2020
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola formulir pencatatan de-registrasi dan penghapusan aset TI dari buku aktiva tetap PT Kereta Api Indonesia (Persero).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={fetchDocs}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
          <button 
            type="button"
            onClick={() => alert('Fitur Ekspor XLS/PDF sedang disiapkan')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-emerald-200 text-emerald-700 rounded-lg text-sm font-semibold hover:bg-emerald-50 transition-colors shadow-2xs"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Ekspor Data</span>
          </button>
          <button 
            type="button"
            onClick={() => navigate('/penghapusan/create')}
            className="flex items-center gap-2 px-4 py-2 bg-[#f05a22] hover:bg-[#d94a18] text-white rounded-lg text-sm font-bold transition-colors shadow-sm shadow-[#f05a22]/20"
          >
            <FilePlus className="w-4 h-4" />
            <span>Buat Formulir Baru</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <span className="text-xs text-slate-500 font-medium">Formulir DSP-03</span>
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
            <span className="text-xs text-orange-700/80 font-medium">Perlu Otorisasi</span>
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
            <span className="text-xs text-emerald-700/80 font-medium">Sah &amp; De-registrasi</span>
          </div>
        </div>

        {/* Draft / Rejected */}
        <div 
          onClick={() => setStatusFilter('draft')}
          className={`bg-white p-5 rounded-xl border transition-all cursor-pointer shadow-xs ${
            statusFilter === 'draft' ? 'border-slate-500 ring-1 ring-slate-500/30' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Draf Formulir</p>
            <FileText className="w-5 h-5 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-slate-700">{draftCount}</h3>
            <span className="text-xs text-slate-500 font-medium">Belum Diajukan</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 shadow-2xs">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Cari nomor dokumen, no ref, pelaksana, aset..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0b2046]/20 focus:border-[#0b2046] transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {/* Status Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                statusFilter === 'all' ? 'bg-white text-[#0b2046] font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('in_review')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                statusFilter === 'in_review' ? 'bg-white text-orange-600 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Menunggu ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('approved')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                statusFilter === 'approved' ? 'bg-white text-emerald-600 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Disetujui ({approvedCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('draft')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                statusFilter === 'draft' ? 'bg-white text-slate-800 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Draf ({draftCount})
            </button>
          </div>
        </div>
      </div>

      {/* Document List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
            <Loader2 className="w-8 h-8 text-[#0b2046] animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">Memuat data Formulir Penghapusan Aset TI...</p>
            <p className="text-xs text-slate-400 mt-1">Mengambil data dokumen resmi dari server</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Tidak ada formulir penghapusan ditemukan</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all'
                ? 'Coba sesuaikan kata kunci pencarian atau filter status dokumen Anda.'
                : 'Belum ada formulir penghapusan aset TI (DSP-03) yang diajukan. Mulai buat formulir baru.'}
            </p>
            <button
              type="button"
              onClick={() => navigate('/penghapusan/create')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#0b2046] hover:bg-[#142e5d] text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <FilePlus className="w-3.5 h-3.5" />
              <span>Buat Formulir Sekarang</span>
            </button>
          </div>
        ) : (
          filteredDocuments.map((doc) => {
            const isApproved = doc.status === 'approved' || doc.status === 'signed';
            const isPending = doc.status === 'in_review' || doc.status === 'pending';
            const isDraft = doc.status === 'draft';
            const isRejected = doc.status === 'rejected';

            return (
              <div 
                key={doc.id}
                onClick={() => handleOpenReview(doc)}
                className="bg-white rounded-xl border border-slate-200 hover:border-blue-400 transition-all p-5 shadow-xs hover:shadow-md cursor-pointer group"
              >
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  {/* Left: Info Dokumen */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="px-2.5 py-0.5 bg-blue-50 text-[#0b2046] font-bold text-xs rounded-md border border-blue-200">
                        DSP-03
                      </span>
                      <h3 className="font-bold text-base text-[#0b2046] group-hover:text-blue-700 transition-colors flex items-center gap-2">
                        {doc.number}
                      </h3>
                      {doc.ref_number && doc.ref_number !== '-' && (
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          Ref: {doc.ref_number}
                        </span>
                      )}
                      <span className="text-xs text-slate-400">&bull;</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {doc.date}
                      </span>
                    </div>

                    {/* Metadata details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-600 pt-1">
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          Pelaksana: <strong className="text-slate-800">{doc.nama_pelaksana}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          Lokasi: <strong className="text-slate-800">{doc.lokasi}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          Kondisi: <strong className={doc.status_kondisi === 'Dimusnahkan' ? 'text-rose-700' : 'text-amber-700'}>{doc.status_kondisi}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          Aset: <strong className="text-slate-800">{doc.category_label}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Status Badge & Actions */}
                  <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                    <div>
                      {isApproved && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{doc.status_label}</span>
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-xs font-bold">
                          <Clock className="w-3.5 h-3.5 text-orange-600" />
                          <span>{doc.status_label}</span>
                        </span>
                      )}
                      {isDraft && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 border border-slate-300 rounded-full text-xs font-semibold">
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span>Draf Formulir</span>
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-semibold">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Ditolak</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Quick Preview Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickPreviewPdf(doc);
                        }}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        title="Pratinjau PDF Resmi"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                        <span className="hidden sm:inline">Pratinjau PDF</span>
                      </button>

                      {isDraft ? (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/penghapusan/${doc.id}/edit`);
                            }}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                            title="Edit Draf Formulir"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteDraft(doc.id, e)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus Draf"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenReview(doc)}
                          className="px-3.5 py-1.5 bg-[#0b2046] hover:bg-[#15336c] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Detail &amp; TTE</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick PDF Preview Modal */}
      {isPreviewPdfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-5xl h-[88vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#0b2046] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Pratinjau Dokumen Resmi PDF (DSP-03)</span>
                </h3>
                <p className="text-xs text-slate-300 font-mono mt-0.5">{previewDocTitle}</p>
              </div>
              <div className="flex items-center gap-2">
                {previewPdfBlobUrl && (
                  <a
                    href={previewPdfBlobUrl}
                    download={`Formulir_Penghapusan_Aset_${previewDocTitle || 'DSP-03'}.pdf`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>Unduh PDF</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={handleClosePreviewPdf}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 bg-slate-100 relative">
              {isLoadingPreviewPdf && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-10">
                  <Loader2 className="w-8 h-8 text-[#0b2046] animate-spin mb-3" />
                  <p className="text-sm font-bold text-slate-800">Menghasilkan Dokumen PDF dari Server...</p>
                  <p className="text-xs text-slate-500 mt-1">Sistem merender template resmi FR.SM/TI/015.007/10-2020</p>
                </div>
              )}

              {previewPdfError ? (
                <div className="p-8 text-center max-w-md mx-auto my-12 bg-white rounded-xl border border-rose-200 shadow-sm">
                  <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
                  <h4 className="font-bold text-sm text-slate-800">Gagal Memuat PDF</h4>
                  <p className="text-xs text-slate-500 mt-1">{previewPdfError}</p>
                  <button
                    type="button"
                    onClick={handleClosePreviewPdf}
                    className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg"
                  >
                    Tutup
                  </button>
                </div>
              ) : previewPdfBlobUrl ? (
                <iframe
                  src={previewPdfBlobUrl}
                  title="PDF Preview"
                  className="w-full h-full border-none"
                />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
