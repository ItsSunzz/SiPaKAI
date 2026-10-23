import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  KeyRound,
  FilePlus,
  Search,
  RefreshCw,
  Download,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  PenTool,
  ShieldCheck,
  ArrowRight,
  Edit3,
  Trash2,
  Lock,
  UserCheck,
  Building2,
  Calendar,
  ExternalLink,
  Shield,
  Layers,
  Filter
} from 'lucide-react';
import { api, fallbackDocuments } from '../services/api';

export default function BastAplikasiListPage({ user }) {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [businessAreaFilter, setBusinessAreaFilter] = useState('all');
  const [actionNotice, setActionNotice] = useState(null);

  const showToast = (msg) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Sample initial records matching the FR.SM/TI/011.002/10-2020 format
  const sampleAplikasiDocs = [
    {
      id: 201,
      number: 'FR.SM/TI/011.002/10-2026/0012',
      ref_number: 'REF/TI-KAI/X/2026/088',
      type: 'ho02',
      business_area: 'BA-0100',
      category_label: 'BAST User Aplikasi SAP S/4HANA & Sirsak',
      date: '18 Okt 2026',
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
        { aplikasi: 'SAP S/4HANA (FICO & MM)', username: 'wahyu.hidayat', password_masked: '••••••••••••' },
        { aplikasi: 'SirSAK Mobile Daop 6', username: 'wh_daop6', password_masked: '••••••••••••' },
        { aplikasi: 'Cisco AnyConnect VPN Dinas', username: 'vpn_61204', password_masked: '••••••••••••' }
      ],
      keperluan: 'Akses otorisasi persetujuan transaksi anggaran operasional dan mutasi inventaris stasiun Daop 6 Yogyakarta.',
      masa_aktif: {
        mulai: '2026-10-18',
        selesai: '2027-10-18'
      },
      status: 'approved',
      status_label: 'Disahkan Penuh (Sah)',
      can_sign: false,
    },
    {
      id: 202,
      number: 'FR.SM/TI/011.002/10-2026/0013',
      ref_number: 'REF/TI-KAI/X/2026/094',
      type: 'ho02',
      business_area: 'BA-0200',
      category_label: 'BAST Akun e-Office & Portal TI',
      date: '20 Okt 2026',
      penyerah: {
        nama: 'Ahmad Fauzi Setiawan',
        nipp: '54892',
        jabatan: 'Spv Operasional Infrastruktur TI',
        tempat_kedudukan: 'Kantor Pusat Bandung',
        personal_area: 'PA-0100 Bandung'
      },
      penerima: {
        nama: 'Ratna Sari Dewi',
        nipp: '72319',
        jabatan: 'Staff Administrasi Operasional',
        tempat_kedudukan: 'Daop 1 Jakarta Gambir',
        personal_area: 'PA-0101 Gambir',
        owner_responsible: 'Kepala Stasiun Gambir',
        custodian: 'Unit TI Daop 1 Jakarta'
      },
      accounts: [
        { aplikasi: 'e-Office Surat Dinas KAI', username: 'ratna.dewi', password_masked: '••••••••••••' },
        { aplikasi: 'Portal Single Sign-On (SSO)', username: '72319_kai', password_masked: '••••••••••••' }
      ],
      keperluan: 'Penerimaan disposisi dinas harian dan administrasi surat keluar kantor stasiun Gambir.',
      masa_aktif: {
        mulai: '2026-10-20',
        selesai: '2027-04-20'
      },
      status: 'pending',
      status_label: 'Menunggu Tanda Tangan Penerima',
      can_sign: true,
    },
    {
      id: 203,
      number: 'FR.SM/TI/011.002/10-2026/0014',
      ref_number: 'REF/TI-KAI/X/2026/102',
      type: 'ho02',
      business_area: 'BA-0800',
      category_label: 'BAST Kredensial Sirsak Stasiun Pasar Turi',
      date: '22 Okt 2026',
      penyerah: {
        nama: 'Dimas Arya Pratama',
        nipp: '56210',
        jabatan: 'Staff Administrator Sistem TI',
        tempat_kedudukan: 'Unit TI Daop 8 Surabaya',
        personal_area: 'PA-0800 Surabaya'
      },
      penerima: {
        nama: 'Budi Santoso',
        nipp: '68901',
        jabatan: 'Pengatur Perjalanan Kereta Api (PPKA)',
        tempat_kedudukan: 'Stasiun Surabaya Pasarturi',
        personal_area: 'PA-0802 Pasarturi',
        owner_responsible: 'Manajer Operasi Daop 8',
        custodian: 'Unit TI Daop 8 Surabaya'
      },
      accounts: [
        { aplikasi: 'SirSAK Dispatcher V3', username: 'ppka_sbi_budi', password_masked: '••••••••••••' }
      ],
      keperluan: 'Monitoring persinyalan dan verifikasi jadwal kedatangan kereta di Stasiun Surabaya Pasarturi.',
      masa_aktif: {
        mulai: '2026-10-22',
        selesai: '2027-10-22'
      },
      status: 'draft',
      status_label: 'Draf (Belum Dikirim)',
      can_sign: false,
    }
  ];

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const res = await api.getDocuments({ type: 'ho02' }).catch(() => null);
      if (res && res.data && res.data.length > 0) {
        // filter or map documents
        const mapped = res.data.map(d => ({
          ...d,
          type: 'ho02',
          ref_number: d.data?.ref_number || `REF/${d.id}`,
          business_area: d.data?.business_area || 'BA-0100',
          penyerah: d.data?.penyerah || {},
          penerima: d.data?.penerima || {},
          accounts: d.data?.accounts || [{ aplikasi: 'User Aplikasi KAI', username: d.data?.username || 'user' }],
          masa_aktif: d.data?.masa_aktif || {},
        }));
        setDocuments(mapped);
      } else {
        setDocuments(sampleAplikasiDocs);
      }
    } catch (e) {
      setDocuments(sampleAplikasiDocs);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  // Filter documents
  const filteredDocs = documents.filter((doc) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      doc.number?.toLowerCase().includes(q) ||
      doc.ref_number?.toLowerCase().includes(q) ||
      doc.business_area?.toLowerCase().includes(q) ||
      doc.penyerah?.nama?.toLowerCase().includes(q) ||
      doc.penerima?.nama?.toLowerCase().includes(q) ||
      doc.penerima?.nipp?.toLowerCase().includes(q) ||
      doc.accounts?.some((a) => a.aplikasi?.toLowerCase().includes(q) || a.username?.toLowerCase().includes(q));

    const status = (doc.status || '').toLowerCase();
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'approved' && (status === 'approved' || status === 'signed' || status === 'selesai')) ||
      (statusFilter === 'pending' && (status === 'pending' || status === 'in_review' || status.includes('menunggu'))) ||
      (statusFilter === 'draft' && (status === 'draft' || status === 'draf'));

    const matchBa =
      businessAreaFilter === 'all' || doc.business_area === businessAreaFilter;

    return matchSearch && matchStatus && matchBa;
  });

  // Calculate statistics
  const totalCount = documents.length;
  const approvedCount = documents.filter(d => ['approved', 'signed', 'selesai'].includes((d.status || '').toLowerCase())).length;
  const pendingCount = documents.filter(d => ['pending', 'in_review'].includes((d.status || '').toLowerCase())).length;
  const draftCount = documents.filter(d => ['draft', 'draf'].includes((d.status || '').toLowerCase())).length;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20 select-none">
      {/* Top Banner / Toast */}
      {actionNotice && (
        <div className="fixed top-5 right-5 z-50 p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs font-semibold">{actionNotice}</span>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-emerald-700 hover:text-emerald-950 ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Page */}
      <div className="bg-gradient-to-r from-[#003580] via-[#092653] to-[#0a192f] rounded-2xl p-6 md:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-10">
          <KeyRound className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-orange-400 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
              MODUL HO-02 SISTEM INFORMASI KAI
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Berita Acara Serah Terima User Aplikasi
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Formulir Standar <strong className="text-white">FR.SM/TI/011.002/10-2020</strong>: Penyerahan kredensial, username, password, dan otorisasi hak akses sistem informasi PT Kereta Api Indonesia (Persero) secara sah, terenkripsi, dan akuntabel.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/bast-aplikasi/create')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#EE7623] hover:bg-[#d96515] text-white text-xs font-bold shadow-lg shadow-orange-950/20 transition-all hover:scale-102 active:scale-98 cursor-pointer"
            >
              <FilePlus className="w-4 h-4" />
              <span>+ Buat BAST User Aplikasi</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Dokumen</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">{totalCount}</h3>
            <span className="text-[10px] text-slate-400">Arsip BAST HO-02</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#003580] flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Disahkan (Sah)</p>
            <h3 className="text-2xl font-black text-emerald-700 mt-0.5">{approvedCount}</h3>
            <span className="text-[10px] text-emerald-600">Hak akses resmi aktif</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Menunggu TTD</p>
            <h3 className="text-2xl font-black text-amber-600 mt-0.5">{pendingCount}</h3>
            <span className="text-[10px] text-amber-700">Tanda tangan penerima</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Draf Pengajuan</p>
            <h3 className="text-2xl font-black text-slate-700 mt-0.5">{draftCount}</h3>
            <span className="text-[10px] text-slate-400">Belum ditandatangani</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <Edit3 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan No. Dokumen, No. Ref, Nama Pegawai, NIPP, atau Aplikasi..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-[#003580] focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#003580]"
            >
              <option value="all">Semua Status</option>
              <option value="approved">Disahkan Penuh (Sah)</option>
              <option value="pending">Menunggu TTD Penerima</option>
              <option value="draft">Draf Pengajuan</option>
            </select>

            <select
              value={businessAreaFilter}
              onChange={(e) => setBusinessAreaFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#003580]"
            >
              <option value="all">Semua Business Area</option>
              <option value="BA-0100">BA-0100 (Kantor Pusat)</option>
              <option value="BA-0200">BA-0200 (Daop 1 Jakarta)</option>
              <option value="BA-0600">BA-0600 (Daop 6 Yogyakarta)</option>
              <option value="BA-0800">BA-0800 (Daop 8 Surabaya)</option>
            </select>

            <button
              type="button"
              onClick={loadDocuments}
              className="px-3 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#003580]" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Daftar Berita Acara Serah Terima User Aplikasi ({filteredDocs.length})
            </h2>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 rounded uppercase">
            RAHASIA • SI-PAKAI
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                <th className="py-3 px-4 w-12 text-center">NO</th>
                <th className="py-3 px-4 min-w-[200px]">NO. DOKUMEN & REF</th>
                <th className="py-3 px-4 min-w-[130px]">BUSINESS AREA</th>
                <th className="py-3 px-4 min-w-[180px]">YANG MENYERAHKAN</th>
                <th className="py-3 px-4 min-w-[180px]">KEPADA (PENERIMA)</th>
                <th className="py-3 px-4 min-w-[200px]">APLIKASI & USERNAME</th>
                <th className="py-3 px-4 min-w-[140px]">MASA AKTIF</th>
                <th className="py-3 px-4 min-w-[130px]">STATUS</th>
                <th className="py-3 px-4 min-w-[140px] text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <KeyRound className="w-10 h-10 mx-auto text-slate-300 mb-2 opacity-50" />
                    <p className="font-semibold text-slate-600">Tidak ada data BAST User Aplikasi yang sesuai.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Gunakan tombol di atas untuk membuat formulir serah terima baru.</p>
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc, idx) => {
                  const status = (doc.status || '').toLowerCase();
                  const isApproved = status === 'approved' || status === 'signed' || status === 'selesai';
                  const isPending = status === 'pending' || status === 'in_review';
                  const isDraft = status === 'draft' || status === 'draf';

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* 1. No */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        {String(idx + 1).padStart(2, '0')}
                      </td>

                      {/* 2. Number & Ref */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900 leading-tight">
                          {doc.number}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Ref: <span className="text-blue-700 font-semibold">{doc.ref_number || '-'}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Tgl: {doc.date}
                        </div>
                      </td>

                      {/* 3. Business Area */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] font-bold bg-slate-100 border border-slate-200 text-slate-800 px-2 py-0.5 rounded">
                          {doc.business_area || 'BA-0100'}
                        </span>
                      </td>

                      {/* 4. Yang Menyerahkan */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 leading-tight">
                          {doc.penyerah?.nama || 'Petugas TI'}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                          NIPP: {doc.penyerah?.nipp || '-'}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[160px]">
                          {doc.penyerah?.jabatan || '-'}
                        </div>
                      </td>

                      {/* 5. Kepada / Penerima */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 leading-tight">
                          {doc.penerima?.nama || '-'}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                          NIPP/ID: {doc.penerima?.nipp || '-'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {doc.penerima?.tempat_kedudukan || '-'}
                        </div>
                      </td>

                      {/* 6. Akun Aplikasi */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {(doc.accounts || []).slice(0, 2).map((acc, aIdx) => (
                            <div key={aIdx} className="flex items-center gap-1.5 text-[11px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#EE7623]"></span>
                              <span className="font-semibold text-slate-800 truncate max-w-[120px]">{acc.aplikasi}</span>
                              <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1 rounded">@{acc.username}</span>
                            </div>
                          ))}
                          {(doc.accounts || []).length > 2 && (
                            <span className="text-[10px] font-bold text-blue-600 block">
                              +{(doc.accounts || []).length - 2} aplikasi lainnya
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 7. Masa Aktif */}
                      <td className="py-3.5 px-4">
                        <div className="text-[11px] font-medium text-slate-700">
                          {doc.masa_aktif?.mulai ? (
                            <>
                              <span>{doc.masa_aktif.mulai}</span>
                              <span className="text-slate-400 block text-[10px]">s/d {doc.masa_aktif.selesai}</span>
                            </>
                          ) : (
                            <span className="text-slate-400">Permanen / Dinas</span>
                          )}
                        </div>
                      </td>

                      {/* 8. Status */}
                      <td className="py-3.5 px-4">
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            Disahkan (Sah)
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            Menunggu TTD
                          </span>
                        )}
                        {isDraft && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            Draf Pengajuan
                          </span>
                        )}
                      </td>

                      {/* 9. Aksi */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Pratinjau / Lembar Resmi PDF */}
                          <button
                            type="button"
                            onClick={() => navigate(`/bast-aplikasi/${doc.id}`)}
                            className="p-1.5 text-[#003580] hover:bg-blue-50 rounded-lg transition-colors"
                            title="Pratinjau Lembar Resmi FR.SM/TI/011.002/10-2020"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {/* Tanda Tangan jika pending */}
                          {isPending && (
                            <button
                              type="button"
                              onClick={() => navigate(`/bast-aplikasi/${doc.id}`)}
                              className="px-2 py-1 text-[10px] font-bold bg-[#EE7623] hover:bg-[#d96515] text-white rounded-md shadow-2xs transition-colors flex items-center gap-1"
                              title="Tandatangani sebagai Penerima"
                            >
                              <PenTool className="w-3 h-3" />
                              <span>TTD</span>
                            </button>
                          )}

                          {/* Edit jika draft */}
                          {isDraft && (
                            <button
                              type="button"
                              onClick={() => navigate(`/bast-aplikasi/${doc.id}/edit`)}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Edit Draf"
                            >
                              <Edit3 className="w-4 h-4" />
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
    </div>
  );
}
