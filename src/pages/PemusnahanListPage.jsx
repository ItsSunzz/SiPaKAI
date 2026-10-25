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
  ShieldAlert
} from 'lucide-react';
import { api, fallbackDocuments } from '../services/api';
import ReviewModal from '../components/ReviewModal';
import DocumentDetailModal from '../components/DocumentDetailModal';

export default function PemusnahanListPage({ user, onReviewDocument, onViewDocument }) {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [unitFilter, setUnitFilter] = useState('all');

  // Internal modal states if parent handlers are not provided
  const [localReviewDoc, setLocalReviewDoc] = useState(null);
  const [localDetailDocId, setLocalDetailDocId] = useState(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);

  const isAdminOrSuper = !user || user.role === 'admin' || user.role === 'super_admin';

  const showToast = (msg) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const fetchDocs = async () => {
    setIsLoading(true);
    try {
      const res = await api.getDocuments({ type: 'dsp01' }).catch(() => null);
      if (res?.data && res.data.length > 0) {
        const mapped = res.data.map((doc) => {
          const rawDoc = doc;
          const chain = doc.data?.approval_chain || [
            doc.data?.verifikator_1_id,
            doc.data?.verifikator_2_id,
            doc.data?.verifikator_3_id,
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

          let stepLabel = 'Menunggu Persetujuan';
          if (currentStepNumber === 1) {
            stepLabel = `Tahap 1: Verifikasi Atasan${shortApprover ? ` (${shortApprover})` : ''}`;
          } else if (currentStepNumber === 2) {
            stepLabel = `Tahap 2: Validasi Teknis TI${shortApprover ? ` (${shortApprover})` : ''}`;
          } else if (currentStepNumber === 3) {
            stepLabel = `Tahap 3: Penyetuju Akhir${shortApprover ? ` (${shortApprover})` : ''}`;
          }

          return {
            ...rawDoc,
            id: doc.id,
            number: doc.number || doc.nomor || `PMH/000${doc.id}/X/2026`,
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
            status: doc.status || 'in_review',
            penyetuju_id: doc.penyetuju_id,
            current_step: currentStepNumber,
            current_approver_name: approverName,
            status_label: doc.status === 'approved' ? 'Disetujui Penuh (Sah)' :
              doc.status === 'rejected' ? 'Ditolak / Berhenti' : stepLabel,
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
      doc.category_label?.toLowerCase().includes(q);

    const matchStatus = statusFilter === 'all' || doc.status === statusFilter;
    const matchUnit = unitFilter === 'all' || doc.requester_unit?.toLowerCase().includes(unitFilter.toLowerCase());

    return matchQuery && matchStatus && matchUnit;
  });

  // Calculate dynamic metrics
  const totalCount = documents.length;
  const pendingCount = documents.filter(d => d.status === 'in_review').length;
  const approvedCount = documents.filter(d => d.status === 'approved').length;
  const rejectedCount = documents.filter(d => d.status === 'rejected').length;

  const handleOpenReview = (doc) => {
    navigate(`/pemusnahan/${doc.id}/review`);
  };

  const handleOpenDetail = (doc) => {
    navigate(`/pemusnahan/${doc.id}/review`);
  };

  const handleLocalAction = async (docId, action, notes, nextApproverId) => {
    setIsSubmittingAction(true);
    try {
      const res = await api.actionDocument(docId, {
        action,
        notes,
        next_approver_id: nextApproverId,
      }).catch(() => null);

      setLocalReviewDoc(null);
      showToast(res?.message || (action === 'approve' ? 'Dokumen pemusnahan berhasil disetujui.' : 'Dokumen berhasil ditolak.'));
      fetchDocs();
    } catch (err) {
      showToast(err.message || 'Terjadi kesalahan saat memproses disposisi.');
    } finally {
      setIsSubmittingAction(false);
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
            Pemusnahan & Penghapusan Aset
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-md border border-blue-200">
              AUDIT & COMPLIANCE TI
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola permohonan disposisi, verifikasi bertingkat, dan pengesahan Berita Acara pemusnahan aset TI PT Kereta Api Indonesia (Persero).
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
            onClick={() => navigate('/pemusnahan/create')}
            className="flex items-center gap-2 px-4 py-2 bg-[#f05a22] hover:bg-[#d94a18] text-white rounded-lg text-sm font-bold transition-colors shadow-sm shadow-[#f05a22]/20"
          >
            <FilePlus className="w-4 h-4" />
            <span>Buat Pengajuan Baru</span>
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
            <span className="text-xs text-rose-700/80 font-medium">Dokumen Ditolak</span>
          </div>
        </div>
      </div>

      {/* Role Notice for Admin / Super Admin */}
      {isAdminOrSuper && pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <CheckSquare className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                Akses Otorisator Aktif: Terdapat {pendingCount} Berkas Menunggu Disposisi Anda
              </h4>
              <p className="text-[11px] text-amber-800/80 mt-0.5">
                Sebagai {user?.roleLabel || 'Pejabat Otorisator / Admin'}, Anda dapat meninjau rincian dokumen dan memberikan persetujuan atau penolakan dengan catatan resmi.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 text-[11px] font-bold rounded bg-amber-200/80 text-amber-900 shrink-0">
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
            <option value="in_review">Menunggu Persetujuan</option>
            <option value="approved">Disetujui Penuh</option>
            <option value="rejected">Ditolak / Revisi</option>
          </select>

          <select 
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:border-[#f05a22]"
          >
            <option value="all">Semua Wilayah / Unit</option>
            <option value="Kantor Pusat">Kantor Pusat</option>
            <option value="DAOP 1">DAOP 1 Jakarta</option>
            <option value="Senen">Stasiun Senen & Gambir</option>
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
            className="text-xs text-[#f05a22] font-semibold hover:underline ml-auto"
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-xs">
        <table className="w-full text-left text-xs whitespace-nowrap min-w-[900px]">
          <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase text-slate-500 font-bold tracking-wider">
            <tr>
              <th className="px-5 py-3.5 w-12 text-center">NO</th>
              <th className="px-5 py-3.5">NO. DOKUMEN DISPOSISI</th>
              <th className="px-5 py-3.5">TIPE FORMULIR</th>
              <th className="px-5 py-3.5">OBJEK & PERANGKAT TI</th>
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
                  <div className="flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-[#f05a22]" />
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
                const isPending = doc.status === 'in_review';
                const isApproved = doc.status === 'approved';
                const isRejected = doc.status === 'rejected';

                return (
                  <tr key={doc.id || idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 text-center text-slate-400 font-medium">
                      {idx + 1}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-[#0b2046] font-mono text-xs">{doc.number}</div>
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
                        ${isPending ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                          isApproved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                          isRejected ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-slate-50 text-slate-700 border-slate-200'}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          isPending ? 'bg-orange-500 animate-pulse' : 
                          isApproved ? 'bg-emerald-500' : 
                          isRejected ? 'bg-rose-500' : 'bg-slate-400'
                        }`}></span>
                        <span>{doc.status_label}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center">
                        {(() => {
                          const canAct = isPending && (isAdminOrSuper || (user?.id && doc.penyetuju_id && Number(user.id) === Number(doc.penyetuju_id)));
                          return (
                            <button
                              type="button"
                              id={`btn-review-${doc.id || idx}`}
                              onClick={() => handleOpenReview(doc)}
                              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs ${
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
