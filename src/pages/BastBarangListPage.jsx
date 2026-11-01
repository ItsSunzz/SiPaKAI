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
  Clock, 
  AlertCircle,
  PenTool,
  ShieldCheck,
  ArrowRight,
  Edit3,
  FileEdit
} from 'lucide-react';
import { api, fallbackDocuments } from '../services/api';

export default function BastBarangListPage({ user }) {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [unitFilter, setUnitFilter] = useState('all');
  const [actionNotice, setActionNotice] = useState(null);

  const isAdminOrSuper = !user || user.role === 'admin' || user.role === 'super_admin';

  const showToast = (msg) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Sample default data matching screenshot structure when backend has few/no records
  const sampleBastDocuments = [
    {
      id: 5,
      number: 'BAST/0005/X/2026',
      type: 'ho01',
      category_label: 'Serah Terima Laptop & Monitor Kantor',
      inventory_code: 'AST-KAI-10',
      nama_barang: 'Laptop Dell Latitude 5440 & Monitor Dell 24"',
      date: '18 Okt 2026',
      penyerah_name: 'Dimas Arya Pratama',
      penyerah_unit: 'Unit Teknologi Informasi',
      penerima_name: 'Budi Santoso',
      penerima_unit: 'Daop 6 Yogyakarta',
      status: 'approved',
      status_label: 'Disetujui Penuh (Sah)',
      can_sign: false,
    },
    {
      id: 4,
      number: 'BAST/0004/X/2026',
      type: 'ho01',
      category_label: 'Serah Terima PC Workstation',
      inventory_code: 'AST-KAI-9',
      nama_barang: 'HP Z2 Mini Workstation G9',
      date: '18 Okt 2026',
      penyerah_name: 'Dimas Arya Pratama',
      penyerah_unit: 'Unit Teknologi Informasi',
      penerima_name: 'Ahmad Fauzi',
      penerima_unit: 'Daop 1 Jakarta',
      status: 'in_review',
      status_label: 'Menunggu Tanda Tangan (Penerima)',
      can_sign: true,
    },
    {
      id: 3,
      number: 'BAST/0003/X/2026',
      type: 'ho01',
      category_label: 'Serah Terima Switch Cisco Catalyst',
      inventory_code: 'AST-KAI-8',
      nama_barang: 'Cisco Catalyst 2960X-48TD-L',
      date: '18 Okt 2026',
      penyerah_name: 'Dimas Arya Pratama',
      penyerah_unit: 'Unit Jaringan TI Pusat',
      penerima_name: 'Ezar Athilla',
      penerima_unit: 'Unit TI Gambir & Senen',
      status: 'in_review',
      status_label: 'Menunggu Tanda Tangan (Penerima)',
      can_sign: true,
    },
    {
      id: 2,
      number: 'BAST/0002/X/2026',
      type: 'ho01',
      category_label: 'Serah Terima Printer Barcode Zebra',
      inventory_code: 'AST-KAI-7',
      nama_barang: 'Zebra ZD230 Thermal Transfer',
      date: '17 Okt 2026',
      penyerah_name: 'Rian Hidayat',
      penyerah_unit: 'Unit TI Senen & Jatinegara',
      penerima_name: 'Dimas Arya Pratama',
      penerima_unit: 'Unit TI Stasiun Senen',
      status: 'in_review',
      status_label: 'Menunggu Tanda Tangan (Penerima)',
      can_sign: true,
    },
    {
      id: 1,
      number: 'BAST/0001/X/2026',
      type: 'ho01',
      category_label: 'Serah Terima Scanner Dokumen Fujitsu',
      inventory_code: 'AST-KAI-6',
      nama_barang: 'Fujitsu fi-7160 High Speed Scanner',
      date: '16 Okt 2026',
      penyerah_name: 'Dimas Arya Pratama',
      penyerah_unit: 'Unit TI Kantor Pusat',
      penerima_name: 'Siti Rahmawati',
      penerima_unit: 'Unit Keuangan DAOP 1',
      status: 'in_review',
      status_label: 'Menunggu Tanda Tangan (Penerima)',
      can_sign: false,
    },
  ];

  const fetchDocs = async () => {
    setIsLoading(true);
    try {
      // 1. Try to fetch documents filtered by type ho01
      let fetchedList = [];
      const res = await api.getDocuments({ type: 'ho01' }).catch(() => null);
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        fetchedList = res.data;
      } else {
        // Fallback: check general documents list for ho01
        const allRes = await api.getDocuments().catch(() => null);
        if (allRes?.data && Array.isArray(allRes.data)) {
          fetchedList = allRes.data.filter(d => d.type === 'ho01' || d.category_type === 'bast');
        }
      }

      if (fetchedList.length > 0) {
        const mapped = fetchedList.map((doc, idx) => {
          const rawDoc = doc;
          const docData = doc.data || {};
          const penyerah = docData.penyerah || {};
          const penerima = docData.penerima || {};

          // Items summary
          let itemsLabel = '';
          if (Array.isArray(doc.items) && doc.items.length > 0) {
            const first = doc.items[0];
            const name = first.nama_barang || first.name || 'Perangkat TI';
            const brand = first.brand_series ? ` ${first.brand_series}` : '';
            itemsLabel = `${name}${brand}${doc.items.length > 1 ? ` (+${doc.items.length - 1} item lainnya)` : ''}`;
          } else if (doc.items && typeof doc.items === 'object') {
            itemsLabel = 'Perangkat TI / Inventaris BAST';
          } else {
            itemsLabel = doc.category_label || doc.inventory_code || 'Serah Terima Aset TI';
          }

          // Status label
          let statusText = 'Menunggu Tanda Tangan';
          if (doc.status === 'approved' || doc.second_party_signed) {
            statusText = 'Disetujui Penuh (Sah)';
          } else if (doc.status === 'rejected') {
            statusText = 'Ditolak / Batal';
          } else if (doc.status === 'draft') {
            statusText = 'Draf Pengajuan';
          }

          // Check if user is the pending signer (second party)
          const isUserPenyerah = user?.id && Number(doc.penyerah_user_id) === Number(user.id);
          const isUserCreator = user?.id && Number(doc.created_by) === Number(user.id);
          const canSign = (doc.status === 'in_review' || !doc.status) && (isAdminOrSuper || isUserPenyerah || !isUserCreator);

          return {
            ...rawDoc,
            id: doc.id,
            number: doc.number || doc.nomor || `BAST/000${doc.id || idx + 1}/X/2026`,
            inventory_code: doc.items?.[0]?.no_inventaris || docData.no_inventaris || doc.inventory_code || `AST-KAI-${doc.id}`,
            type: 'ho01',
            category_label: itemsLabel,
            nama_barang: itemsLabel,
            date: docData.tanggal_serah_terima 
              ? new Date(docData.tanggal_serah_terima).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
              : new Date(doc.submitted_at || doc.created_at || Date.now()).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
            penyerah_name: penyerah.nama || doc.requester_name || doc.requester?.name || 'Petugas TI',
            penyerah_unit: penyerah.nama_unit || docData.nama_unit || docData.wilayah || doc.requester_unit || 'Unit TI',
            penerima_name: penerima.nama || 'Penerima Barang',
            penerima_unit: penerima.nama_unit || docData.wilayah || 'Daop 6 Yogyakarta',
            status: doc.second_party_signed ? 'approved' : (doc.status || 'in_review'),
            status_label: statusText,
            can_sign: canSign,
          };
        });

        setDocuments(mapped);
      } else {
        setDocuments([]);
      }
    } catch (err) {
      console.error('Gagal memuat dokumen BAST HO-01 dari backend:', err);
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
      doc.penyerah_name?.toLowerCase().includes(q) ||
      doc.penerima_name?.toLowerCase().includes(q) ||
      doc.nama_barang?.toLowerCase().includes(q) ||
      doc.category_label?.toLowerCase().includes(q);

    const matchStatus = statusFilter === 'all' || 
      doc.status === statusFilter || 
      (statusFilter === 'draft' && (doc.status === 'draft' || doc.status === 'draf'));
    const matchUnit = unitFilter === 'all' || 
      doc.penyerah_unit?.toLowerCase().includes(unitFilter.toLowerCase()) ||
      doc.penerima_unit?.toLowerCase().includes(unitFilter.toLowerCase());

    return matchQuery && matchStatus && matchUnit;
  });

  // Calculate dynamic metrics
  const totalCount = documents.length;
  const pendingCount = documents.filter(d => d.status === 'in_review').length;
  const approvedCount = documents.filter(d => d.status === 'approved').length;
  const rejectedCount = documents.filter(d => d.status === 'rejected').length;
  const draftCount = documents.filter(d => d.status === 'draft' || d.status === 'draf').length;

  const handleOpenDetail = (doc) => {
    navigate(`/bast-barang/${doc.id}`);
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
            Berita Acara Serah Terima (BAST) Barang
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-md border border-blue-200">
              HO-01: SERAH TERIMA & MUTASI TI
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola berkas Berita Acara Serah Terima Barang, validasi tanda tangan dua belah pihak secara digital, dan pantau status mutasi aset TI PT Kereta Api Indonesia (Persero).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={fetchDocs}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
          <button 
            type="button"
            onClick={() => alert('Fitur Ekspor XLS/PDF Berita Acara Serah Terima sedang disiapkan.')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-emerald-200 text-emerald-700 rounded-lg text-sm font-semibold hover:bg-emerald-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Ekspor Data</span>
          </button>
          <button 
            type="button"
            id="btn-buat-bast-baru"
            onClick={() => navigate('/bast-barang/create')}
            className="flex items-center gap-2 px-4 py-2 bg-[#f05a22] hover:bg-[#d94a18] text-white rounded-lg text-sm font-bold transition-colors shadow-sm shadow-[#f05a22]/20 cursor-pointer"
          >
            <FilePlus className="w-4 h-4" />
            <span>Buat Pengajuan Baru</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Dokumen */}
        <div 
          onClick={() => setStatusFilter('all')}
          className={`bg-white p-5 rounded-xl border transition-all cursor-pointer shadow-xs ${
            statusFilter === 'all' ? 'border-[#0b2046] ring-1 ring-[#0b2046]/30' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">TOTAL DOKUMEN</p>
            <FileText className="w-5 h-5 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-[#0b2046]">{totalCount}</h3>
            <span className="text-xs text-slate-500 font-medium">Berkas Dokumen</span>
          </div>
        </div>

        {/* Menunggu Persetujuan / Tanda Tangan */}
        <div 
          onClick={() => setStatusFilter('in_review')}
          className={`bg-white p-5 rounded-xl border transition-all cursor-pointer shadow-xs ${
            statusFilter === 'in_review' ? 'border-orange-500 ring-1 ring-orange-500/30' : 'border-orange-200 hover:border-orange-300'
          }`}
        >
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-orange-700 uppercase tracking-wider">MENUNGGU PERSETUJUAN</p>
            <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-orange-600" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-orange-600">{pendingCount}</h3>
            <span className="text-xs text-orange-700/80 font-medium">Perlu Disposisi</span>
          </div>
        </div>

        {/* Disetujui / Selesai */}
        <div 
          onClick={() => setStatusFilter('approved')}
          className={`bg-white p-5 rounded-xl border transition-all cursor-pointer shadow-xs ${
            statusFilter === 'approved' ? 'border-emerald-500 ring-1 ring-emerald-500/30' : 'border-emerald-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">DISETUJUI / SELESAI</p>
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-emerald-600">{approvedCount}</h3>
            <span className="text-xs text-emerald-700/80 font-medium">Disetujui Penuh</span>
          </div>
        </div>

        {/* Ditolak / Revisi */}
        <div 
          onClick={() => setStatusFilter('rejected')}
          className={`bg-white p-5 rounded-xl border transition-all cursor-pointer shadow-xs ${
            statusFilter === 'rejected' ? 'border-rose-500 ring-1 ring-rose-500/30' : 'border-rose-200 hover:border-rose-300'
          }`}
        >
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">DITOLAK / REVISI</p>
            <XCircle className="w-5 h-5 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-rose-600">{rejectedCount}</h3>
            <span className="text-xs text-rose-700/80 font-medium">Dokumen Ditolak</span>
          </div>
        </div>
      </div>

      {/* Role Notice for Pending Action */}
      {pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <CheckSquare className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                Akses Otorisator Aktif: Terdapat {pendingCount} Berkas Menunggu Disposisi / Tanda Tangan Anda
              </h4>
              <p className="text-[11px] text-amber-800/80 mt-0.5">
                Sebagai {user?.roleLabel || user?.role || 'Pejabat Penandatangan'}, Anda dapat meninjau rincian dokumen dan memberikan pengesahan e-Sign dengan PIN resmi.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 text-[11px] font-bold rounded bg-amber-200/80 text-amber-900 shrink-0">
            Disposisi e-Sign
          </span>
        </div>
      )}

      {/* Notice for Drafts */}
      {draftCount > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <FileEdit className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">
                Tersimpan {draftCount} Dokumen Draf BAST
              </h4>
              <p className="text-[11px] text-slate-500">
                Draf belum ditandatangani. Pihak penyerah dapat mengedit atau melanjutkan pengesahan kapan saja.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'draft' ? 'all' : 'draft')}
            className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
              statusFilter === 'draft'
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            {statusFilter === 'draft' ? 'Tampilkan Semua' : 'Filter Draf'}
          </button>
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
            <option value="rejected">Ditolak / Revisi</option>
          </select>

          <select 
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none focus:border-[#f05a22]"
          >
            <option value="all">Semua Wilayah / Unit</option>
            <option value="Unit Teknologi Informasi">Unit Teknologi Informasi</option>
            <option value="Daop 6">Daop 6 Yogyakarta</option>
            <option value="Daop 1">DAOP 1 Jakarta</option>
            <option value="Senen">Unit TI Senen & Gambir</option>
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
                    <span>Memuat daftar berkas BAST barang...</span>
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
                const isPending = doc.status === 'in_review';
                const isApproved = doc.status === 'approved';
                const isRejected = doc.status === 'rejected';

                return (
                  <tr key={doc.id || idx} className="hover:bg-slate-50/70 transition-colors">
                    {/* NO */}
                    <td className="px-5 py-3.5 text-center text-slate-400 font-medium">
                      {idx + 1}
                    </td>

                    {/* NO. DOKUMEN DISPOSISI */}
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-[#0b2046] font-mono text-xs">{doc.number}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Klasifikasi: Aset Operasional</div>
                    </td>

                    {/* TIPE FORMULIR */}
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded border border-slate-200">
                        HO-01: Serah Terima
                      </span>
                    </td>

                    {/* OBJEK & PERANGKAT TI */}
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-800 max-w-[220px] truncate" title={doc.nama_barang || doc.category_label}>
                        {doc.nama_barang || doc.category_label}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Tag: {doc.inventory_code || `AST-KAI-${doc.id}`}
                      </div>
                    </td>

                    {/* TANGGAL */}
                    <td className="px-5 py-3.5 text-slate-600 font-medium">
                      {doc.date}
                    </td>

                    {/* PEMOHON & UNIT */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#0b2046] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                          {(doc.penyerah_name || 'DI').substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate">{doc.penyerah_name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{doc.penyerah_unit || 'Staff / Pegawai'}</div>
                        </div>
                      </div>
                    </td>

                    {/* STATUS */}
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border inline-flex items-center gap-1.5
                        ${isDraft ? 'bg-slate-100 text-slate-700 border-slate-300' :
                          isPending ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                          isApproved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                          isRejected ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-slate-50 text-slate-700 border-slate-200'}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          isDraft ? 'bg-slate-500' :
                          isPending ? 'bg-orange-500 animate-pulse' : 
                          isApproved ? 'bg-emerald-500' : 
                          isRejected ? 'bg-rose-500' : 'bg-slate-400'
                        }`}></span>
                        <span>{isDraft ? 'Draf Pengajuan' : (doc.status_label || (isApproved ? 'Disetujui Penuh (Sah)' : 'Tahap 1: Verifikasi Atasan'))}</span>
                      </span>
                    </td>

                    {/* AKSI */}
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {isDraft ? (
                          <>
                            <button
                              type="button"
                              id={`btn-edit-${doc.id || idx}`}
                              onClick={() => navigate(`/bast-barang/${doc.id}/edit`)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer bg-amber-500 hover:bg-amber-600 text-white"
                              title="Edit dan Lanjutkan Pengisian Draf"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit Draf</span>
                            </button>
                            <button
                              type="button"
                              id={`btn-view-${doc.id || idx}`}
                              onClick={() => handleOpenDetail(doc)}
                              className="inline-flex items-center p-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer"
                              title="Lihat Pratinjau Draf"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            id={`btn-view-${doc.id || idx}`}
                            onClick={() => handleOpenDetail(doc)}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer ${
                              doc.can_sign && isPending
                                ? 'bg-[#f05a22] hover:bg-[#d94a18] text-white shadow-[#f05a22]/20'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                            }`}
                            title={doc.can_sign && isPending ? 'Buka Telaah & Tanda Tangan Dokumen' : 'Buka Rincian Dokumen BAST'}
                          >
                            {doc.can_sign && isPending ? (
                              <>
                                <CheckSquare className="w-3.5 h-3.5" />
                                <span>Review & Tanda Tangan</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                                <span>Lihat Dokumen</span>
                              </>
                            )}
                          </button>
                        )}
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
