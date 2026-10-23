import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
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
  Filter,
  DollarSign,
  Scale,
  Database,
  Printer,
  Eye,
  Check
} from 'lucide-react';
import { api, fallbackDocuments } from '../services/api';

export default function PenghapusanListPage({ user }) {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sapFilter, setSapFilter] = useState('all');
  const [wilayahFilter, setWilayahFilter] = useState('all');
  const [actionNotice, setActionNotice] = useState(null);

  const showToast = (msg) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Sample initial records for DSP-03 matching KAI SAP FI-AA Standards
  const samplePenghapusanDocs = [
    {
      id: 301,
      number: 'FR-PH/TI/DAOP1/10-2026/0031',
      ref_ba: 'BA-PMS/TI/DAOP1/10-2026/0014',
      type: 'dsp03',
      form_code: 'FR.SM/TI/013.001',
      tanggal: '2026-10-22',
      pelaksana: {
        nama: 'Ahmad Fauzi Setiawan, S.T.',
        nipp: '54892',
        jabatan: 'Koordinator Tim Eksekusi TI',
        unit_kerja: 'Unit TI DAOP 1 Jakarta'
      },
      lokasi: 'Gudang Logistik & Server Room Juanda Lt. 3, Jakarta Pusat',
      wilayah: 'DAOP 1 Jakarta',
      klasifikasi: 'Dimusnahkan (Scrap Afval)',
      nilai_buku_total: 'Rp 0 (Scrap Nilai Penuh Disusutkan)',
      sap_posting_status: 'Terhapus SAP FI-AA',
      sap_posting_code: 'doc_posted',
      items: [
        {
          id: 1,
          nama: 'Server Dell PowerEdge R740 2U',
          spesifikasi: 'Xeon Silver 4210R / 64GB DDR4 / Dual PSU',
          jumlah: 1,
          satuan: 'Unit',
          serialNumber: 'SN-98214-KAI-SRV',
          noInventarisSap: 'AST-TI-2018-0941',
          lokasiTerakhir: 'Rack 04 - Server Farm Juanda',
          statusSap: 'Scrap (Nilai Buku Rp 0)',
        },
        {
          id: 2,
          nama: 'Cisco Catalyst 3850 48-Port PoE',
          spesifikasi: 'Switch Layer 3 Distribusi Stasiun Gambir',
          jumlah: 1,
          satuan: 'Unit',
          serialNumber: 'MAC-7721-CC-081',
          noInventarisSap: 'AST-TI-2019-1102',
          lokasiTerakhir: 'Wiring Closet Lt. 2 DAOP 1',
          statusSap: 'Hapus Buku Aktiva',
        },
        {
          id: 3,
          nama: 'Harddisk Enterprise SAS 1.2TB 10K',
          spesifikasi: 'Penyimpanan Storage SAN Ticketing (x4 Modul)',
          jumlah: 4,
          satuan: 'Pcs',
          serialNumber: 'HD-SAS-KAI-8082-SET',
          noInventarisSap: 'AST-TI-2020-0054',
          lokasiTerakhir: 'Storage Shelf Alpha-3 Juanda',
          statusSap: 'Terhapus SAP FI-AA',
        }
      ],
      saksiList: [
        { nama: 'Slamet Riyadi', nipp: '49201', role: 'Audit SPI', signed: true },
        { nama: 'Tri Wahyuni, S.T.', nipp: '55120', role: 'Keuangan', signed: true },
        { nama: 'Agus Supriyatna', nipp: '61099', role: 'Pengamanan Polsuksa', signed: true }
      ],
      vpSigned: true,
      vpSignedAt: '2026-10-22 14:30 WIB',
      status: 'approved',
      status_label: 'Disahkan Penuh & Terhapus SAP',
    },
    {
      id: 302,
      number: 'FR-PH/TI/DAOP6/10-2026/0032',
      ref_ba: 'BA-PMS/TI/DAOP6/10-2026/0015',
      type: 'dsp03',
      form_code: 'FR.SM/TI/013.001',
      tanggal: '2026-10-23',
      pelaksana: {
        nama: 'Dimas Arya Pratama',
        nipp: '56210',
        jabatan: 'Junior Manager TI Daop 6',
        unit_kerja: 'Unit TI Daop 6 Yogyakarta'
      },
      lokasi: 'Gudang Logistik Stasiun Tugu Yogyakarta',
      wilayah: 'DAOP 6 Yogyakarta',
      klasifikasi: 'Tidak Layak / Rusak Berat',
      nilai_buku_total: 'Rp 14.800.000 (Nilai Sisa Buku)',
      sap_posting_status: 'Menunggu Disposisi VP Keuangan',
      sap_posting_code: 'pending_sap',
      items: [
        {
          id: 1,
          nama: 'PC Workstation Loket Stasiun Lempuyangan (HP ProDesk)',
          spesifikasi: 'Intel Core i5-7500 / 8GB / 500GB HDD',
          jumlah: 6,
          satuan: 'Unit',
          serialNumber: 'SN-HP-PD-77218',
          noInventarisSap: 'AST-TI-2016-0811',
          lokasiTerakhir: 'Gudang Daop 6 Tugu',
          statusSap: 'Scrap (Nilai Buku Rp 0)',
        },
        {
          id: 2,
          nama: 'Monitor LCD 19" Lenovo ThinkVision',
          spesifikasi: 'Panel TN 1440x900 VGA/DVI',
          jumlah: 6,
          satuan: 'Unit',
          serialNumber: 'SN-MON-OLD-BATCH',
          noInventarisSap: 'AST-TI-2014-0322',
          lokasiTerakhir: 'Gudang Daop 6 Tugu',
          statusSap: 'Hapus Buku Aktiva',
        }
      ],
      saksiList: [
        { nama: 'Mayor Haryanto', nipp: '40112', role: 'Pengamanan Daop 6', signed: true },
        { nama: 'Wahyu Hidayat', nipp: '61204', role: 'Keuangan Daop 6', signed: false }
      ],
      vpSigned: false,
      vpSignedAt: null,
      status: 'pending',
      status_label: 'Menunggu Otorisasi VP TI & Keuangan',
    },
    {
      id: 303,
      number: 'FR-PH/TI/PUSAT/10-2026/0033',
      ref_ba: 'BA-PMS/TI/PUSAT/10-2026/0016',
      type: 'dsp03',
      form_code: 'FR.SM/TI/013.001',
      tanggal: '2026-10-24',
      pelaksana: {
        nama: user?.name || 'Ahmad Fauzi Setiawan, S.T.',
        nipp: user?.nip || '54892',
        jabatan: user?.roleLabel || 'Pranata Komputer Madya TI',
        unit_kerja: user?.location || 'Unit Kantor Pusat Bandung'
      },
      lokasi: 'Data Center Juanda Jakarta Pusat Lt. 3',
      wilayah: 'Kantor Pusat Bandung / Juanda',
      klasifikasi: 'Dimusnahkan (Scrap Afval)',
      nilai_buku_total: 'Rp 0 (Kadaluarsa Siklus 10 Tahun)',
      sap_posting_status: 'Draf Rekonsiliasi SAP',
      sap_posting_code: 'draft',
      items: [
        {
          id: 1,
          nama: 'Magnetic Tape Cartridge LTO-5 Data Keuangan KAI',
          spesifikasi: 'Media Pita Magnetik Tape Backup 1.5TB',
          jumlah: 24,
          satuan: 'Pcs',
          serialNumber: 'TAPE-LTO-BATCH-15',
          noInventarisSap: 'AST-TAPE-2015-001',
          lokasiTerakhir: 'Data Center Juanda',
          statusSap: 'Scrap (Nilai Buku Rp 0)',
        }
      ],
      saksiList: [
        { nama: 'Agus Triono', nipp: '43992', role: 'Pengamanan Juanda', signed: false },
        { nama: 'Ratna Sari Dewi', nipp: '72319', role: 'Tata Kelola TI', signed: false }
      ],
      vpSigned: false,
      vpSignedAt: null,
      status: 'draft',
      status_label: 'Draf (Belum Difinalisasi)',
    }
  ];

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const res = await api.getDocuments({ type: 'dsp03' }).catch(() => null);
      if (res && res.data && res.data.length > 0) {
        const mapped = res.data.map(d => ({
          ...d,
          type: 'dsp03',
          form_code: 'FR.SM/TI/013.001',
          number: d.number || d.nomor || `FR-PH/TI/000${d.id}`,
          ref_ba: d.data?.nomor_dsp02 || d.data?.ref_ba || 'BA-PMS/TI/DAOP1/10-2026/0014',
          tanggal: d.data?.tanggal || d.created_at?.split('T')[0] || '2026-10-23',
          pelaksana: {
            nama: d.data?.nama_pelaksana || d.requester?.name || 'Petugas TI',
            nipp: d.data?.nipp_pelaksana || d.requester?.nip || '54892',
            jabatan: d.data?.jabatan_pelaksana || 'Pranata Komputer Madya TI',
            unit_kerja: d.data?.unit_kerja || d.requester?.unit_kerja || 'DAOP 1 Jakarta'
          },
          lokasi: d.data?.lokasi || 'Gudang Logistik Server TI',
          wilayah: d.data?.wilayah || 'DAOP 1 Jakarta',
          klasifikasi: d.data?.status_kondisi || 'Dimusnahkan',
          nilai_buku_total: d.data?.nilai_buku ? `Rp ${Number(d.data.nilai_buku).toLocaleString('id-ID')}` : 'Rp 0 (Scrap Nilai Buku Nol)',
          sap_posting_status: d.status === 'approved' ? 'Terhapus SAP FI-AA' : d.status === 'pending' ? 'Menunggu Validasi SAP' : 'Draf Rekonsiliasi',
          items: d.items || d.data?.items || [],
          status_label: d.status === 'approved' ? 'Disahkan Penuh & Terhapus SAP' : d.status === 'pending' ? 'Menunggu Disposisi VP' : 'Draf Formulir',
          vpSigned: d.status === 'approved',
        }));
        setDocuments(mapped);
      } else {
        const localSaved = localStorage.getItem('sipakai_dsp03_docs');
        if (localSaved) {
          try {
            const parsed = JSON.parse(localSaved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setDocuments(parsed);
              return;
            }
          } catch (e) {}
        }
        setDocuments(samplePenghapusanDocs);
      }
    } catch (e) {
      setDocuments(samplePenghapusanDocs);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleDelete = (docId) => {
    if (window.confirm(`Yakin ingin menghapus dokumen Penghapusan #${docId}?`)) {
      const updated = documents.filter(d => d.id !== docId);
      setDocuments(updated);
      localStorage.setItem('sipakai_dsp03_docs', JSON.stringify(updated));
      showToast('Dokumen Formulir Penghapusan Aset berhasil dihapus.');
    }
  };

  // Filter documents
  const filteredDocs = documents.filter((doc) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      doc.number?.toLowerCase().includes(q) ||
      doc.ref_ba?.toLowerCase().includes(q) ||
      doc.lokasi?.toLowerCase().includes(q) ||
      doc.wilayah?.toLowerCase().includes(q) ||
      doc.pelaksana?.nama?.toLowerCase().includes(q) ||
      doc.items?.some((it) => it.nama?.toLowerCase().includes(q) || it.noInventarisSap?.toLowerCase().includes(q) || it.serialNumber?.toLowerCase().includes(q));

    const status = (doc.status || '').toLowerCase();
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'approved' && (status === 'approved' || status === 'signed' || status === 'selesai')) ||
      (statusFilter === 'pending' && (status === 'pending' || status === 'in_review' || status.includes('menunggu'))) ||
      (statusFilter === 'draft' && (status === 'draft' || status === 'draf'));

    const sapStatus = (doc.sap_posting_status || '').toLowerCase();
    const matchSap =
      sapFilter === 'all' ||
      (sapFilter === 'terhapus' && sapStatus.includes('terhapus')) ||
      (sapFilter === 'pending' && sapStatus.includes('menunggu')) ||
      (sapFilter === 'draft' && sapStatus.includes('draf'));

    const matchWilayah = wilayahFilter === 'all' || doc.wilayah?.toLowerCase().includes(wilayahFilter.toLowerCase());

    return matchSearch && matchStatus && matchSap && matchWilayah;
  });

  // Calculate statistics
  const totalCount = documents.length;
  const approvedCount = documents.filter(d => ['approved', 'signed', 'selesai'].includes((d.status || '').toLowerCase())).length;
  const pendingCount = documents.filter(d => ['pending', 'in_review'].includes((d.status || '').toLowerCase())).length;
  const draftCount = documents.filter(d => ['draft', 'draf'].includes((d.status || '').toLowerCase())).length;
  const totalItemsCount = documents.reduce((sum, d) => sum + (d.items?.length || 0), 0);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20 select-none">
      {/* Toast Alert */}
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

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#003580] via-[#092653] to-[#0a192f] rounded-2xl p-6 md:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-10">
          <FileSpreadsheet className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-orange-400 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
              MODUL DSP-03 KAI TI &bull; DE-REGISTRASI AKTIVA TETAP SAP
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Penghapusan Aset TI (DSP-03)
            </h1>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
              Formulir resmi de-registrasi aktiva tetap, pemutihan nomor inventaris SAP FI-AA, dan penutupan nilai buku aset TI yang telah selesai dimusnahkan secara fisik pada Berita Acara (DSP-02).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/berita-acara-pemusnahan')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 transition-all flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-orange-300" />
              <span>Lihat Berita Acara (DSP-02)</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/penghapusan/create')}
              className="px-5 py-2.5 bg-[#f05a22] hover:bg-[#d94e1b] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 transform active:scale-95"
            >
              <FilePlus className="w-4 h-4" />
              <span>Buat Formulir Penghapusan Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-blue-50 text-[#003580] flex items-center justify-center shrink-0 border border-blue-100">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Dokumen DSP-03</p>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">{totalCount}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">{totalItemsCount} nomor inventaris SAP</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Terhapus SAP FI-AA</p>
            <h3 className="text-xl font-black text-emerald-900 mt-0.5">{approvedCount}</h3>
            <p className="text-[10px] text-emerald-600 mt-0.5">Asset Write-Off Selesai</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Menunggu Disposisi</p>
            <h3 className="text-xl font-black text-amber-900 mt-0.5">{pendingCount}</h3>
            <p className="text-[10px] text-amber-600 mt-0.5">Otorisasi VP IT / Keuangan</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Draf Rekonsiliasi</p>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">{draftCount}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Dalam penyusunan tim</p>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari No. Formulir, No. SAP, No. BA rujukan, lokasi, pelaksana..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#003580] focus:bg-white transition-all"
          />
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-md font-bold transition-all ${statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Semua ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('approved')}
              className={`px-3 py-1 rounded-md font-bold transition-all ${statusFilter === 'approved' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Sah SAP ({approvedCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1 rounded-md font-bold transition-all ${statusFilter === 'pending' ? 'bg-white text-amber-800 shadow-2xs' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Menunggu ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('draft')}
              className={`px-3 py-1 rounded-md font-bold transition-all ${statusFilter === 'draft' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Draf ({draftCount})
            </button>
          </div>

          {/* SAP Filter */}
          <select
            value={sapFilter}
            onChange={(e) => setSapFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#003580]"
          >
            <option value="all">Semua Status SAP</option>
            <option value="terhapus">Terhapus SAP FI-AA</option>
            <option value="pending">Menunggu Disposisi SAP</option>
            <option value="draft">Draf Rekonsiliasi</option>
          </select>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={loadDocuments}
            disabled={isLoading}
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 transition-colors"
            title="Segarkan data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#003580]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Document List Cards */}
      <div className="space-y-3.5">
        {filteredDocs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Tidak ada Dokumen Penghapusan yang cocok</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Tidak ditemukan data formulir Penghapusan Aset TI (DSP-03) sesuai filter pencarian yang Anda tentukan.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setStatusFilter('all'); setSapFilter('all'); }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Reset Filter
              </button>
              <button
                type="button"
                onClick={() => navigate('/penghapusan/create')}
                className="px-4 py-2 bg-[#f05a22] hover:bg-[#d94e1b] text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                Buat Formulir Baru
              </button>
            </div>
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const isApproved = doc.status === 'approved';
            const isPending = doc.status === 'pending';
            const isDraft = doc.status === 'draft';

            return (
              <div
                key={doc.id}
                className="bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5 group"
              >
                {/* Left Section: Info & Number */}
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-50 text-amber-800 border border-amber-200">
                      DSP-03 &bull; PENGHAPUSAN AKTIVA TETAP
                    </span>

                    <span className="text-xs font-bold text-slate-800 font-mono tracking-tight">
                      {doc.number}
                    </span>

                    {/* Status SAP Badge */}
                    {isApproved && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        {doc.sap_posting_status || 'Terhapus SAP FI-AA'}
                      </span>
                    )}
                    {isPending && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-600" />
                        {doc.status_label || 'Menunggu Disposisi'}
                      </span>
                    )}
                    {isDraft && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        <Edit3 className="w-3 h-3 text-slate-500" />
                        {doc.status_label || 'Draf'}
                      </span>
                    )}

                    <span className="text-[11px] text-slate-400 font-medium ml-auto lg:ml-0">
                      Dasar DSP-02: <span className="font-semibold text-slate-600">{doc.ref_ba}</span>
                    </span>
                  </div>

                  {/* Execution Details & Location */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1 text-xs">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Tanggal: {doc.tanggal}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate" title={doc.lokasi}>{doc.lokasi}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600">
                      <Scale className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate">
                        {doc.klasifikasi || 'Dimusnahkan (Scrap)'}
                      </span>
                    </div>
                  </div>

                  {/* Personil & Items Summary */}
                  <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-700">Pelaksana:</span>
                      <span className="text-slate-900 font-medium">{doc.pelaksana?.nama || 'Petugas TI'}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-700">Nilai Buku:</span>
                      <span className="text-slate-900 font-semibold">{doc.nilai_buku_total || 'Rp 0'}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-700">TTE VP IT:</span>
                      {doc.vpSigned ? (
                        <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200 font-bold">
                          KAI Pass BSrE ✓
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 font-bold">
                          Menunggu TTE
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 ml-auto">
                      <span className="font-bold text-slate-800">Total Aset Dihapus:</span>
                      <span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-extrabold rounded-md border border-rose-200">
                        {doc.items?.length || 1} Item Aset SAP
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex flex-row lg:flex-col items-center justify-end gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <button
                    type="button"
                    onClick={() => navigate(`/penghapusan/${doc.id}`)}
                    className="flex-1 lg:flex-none w-full px-4 py-2 bg-[#003580] hover:bg-[#092653] text-white rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-sky-300" />
                    <span>Lihat Lembar A4</span>
                  </button>

                  <div className="flex items-center gap-1.5 w-full">
                    {isDraft && (
                      <button
                        type="button"
                        onClick={() => navigate(`/penghapusan/${doc.id}/edit`)}
                        className="flex-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                        title="Edit Draf"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => navigate(`/penghapusan/${doc.id}?print=true`)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold transition-colors"
                      title="Cetak Formulir Penghapusan"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    {isDraft && (
                      <button
                        type="button"
                        onClick={() => handleDelete(doc.id)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-semibold transition-colors"
                        title="Hapus Dokumen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
