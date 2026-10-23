import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCheck2,
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
  Flame,
  Hammer,
  HardDrive,
  Scissors,
  Check,
  Eye,
  Printer
} from 'lucide-react';
import { api, fallbackDocuments } from '../services/api';

export default function BaPemusnahanListPage({ user }) {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [metodeFilter, setMetodeFilter] = useState('all');
  const [lokasiFilter, setLokasiFilter] = useState('all');
  const [actionNotice, setActionNotice] = useState(null);

  const showToast = (msg) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Sample initial records for DSP-02 matching KAI Standard Format
  const sampleBaDocs = [
    {
      id: 101,
      number: 'BA-PMS/TI/DAOP1/10-2026/0014',
      ref_number: 'PMH/0001/X/2026',
      type: 'dsp02',
      form_code: 'FR.SM/TI/012.001',
      tanggal_pelaksanaan: '2026-10-21',
      hari_pelaksanaan: 'Rabu',
      waktu_pelaksanaan: '10:30 WIB',
      lokasi: 'Workshop TI Balai Yasa Manggarai',
      wilayah: 'DAOP 1 Jakarta',
      metode_pemusnahan: 'Shredding & Degaussing',
      metode_code: 'shredding',
      keterangan_metode: 'Penghancuran fisik shredder & sanitasi magnetik media penyimpanan (HDD/SSD)',
      pelaksana: {
        nama: 'Ahmad Fauzi Setiawan',
        nipp: '54892',
        jabatan: 'Spv Operasional Infrastruktur TI',
        unit_kerja: 'Unit TI DAOP 1 Jakarta',
        signed: true,
        signed_at: '2026-10-21 11:15'
      },
      saksi_1: {
        nama: 'Kapten (Purn) Sudirman',
        nipp: '41920',
        jabatan: 'Kepala Pengamanan & Polsuska Daop 1',
        unit_kerja: 'Unit Pengamanan Daop 1',
        signed: true,
        signed_at: '2026-10-21 11:20'
      },
      saksi_2: {
        nama: 'Dyah Retno Wulandari, S.E.',
        nipp: '62104',
        jabatan: 'Auditor Madya Pengawasan Intern (SPI)',
        unit_kerja: 'Satuan Pengawasan Intern KAI',
        signed: true,
        signed_at: '2026-10-21 11:30'
      },
      penanggung_jawab: {
        nama: 'Ir. Bambang Suryo Pratama, M.T.',
        nipp: '48901',
        jabatan: 'Vice President IT Operation',
        unit_kerja: 'Kantor Pusat KAI Bandung',
        signed: true,
        signed_at: '2026-10-21 13:45'
      },
      items: [
        {
          id: 1,
          nama_aset: 'Hard Disk Enterprise SAS 600GB (15k RPM)',
          no_inventaris: 'AST-TI-2018-0912',
          serial_number: 'SN-WD-8812901-KAI',
          jumlah: 8,
          satuan: 'Unit',
          kategori: 'Penyimpanan (Storage)',
          kondisi_awal: 'Bad Sector Berat & Melewati Siklus Hidup',
          hasil_pemusnahan: 'Degaussed Magnetik & Piringan Hancur Terpotong',
        },
        {
          id: 2,
          nama_aset: 'Server Rak Dell PowerEdge R730',
          no_inventaris: 'AST-TI-2017-0419',
          serial_number: 'SN-DELL-R730-9921',
          jumlah: 2,
          satuan: 'Unit',
          kategori: 'Perangkat Keras (Hardware)',
          kondisi_awal: 'Mainboard terbakar & Usia Teknis 8 Tahun',
          hasil_pemusnahan: 'Mainboard dipatahkan, Casing dipotong scrap',
        },
        {
          id: 3,
          nama_aset: 'Switch Core Cisco Catalyst 3750G 48-Port',
          no_inventaris: 'AST-TI-2016-0128',
          serial_number: 'SN-CISCO-CAT-48102',
          jumlah: 2,
          satuan: 'Unit',
          kategori: 'Jaringan (Network)',
          kondisi_awal: 'Korsleting petir, modul port mati total',
          hasil_pemusnahan: 'Port fisik & PCB internal dihancurkan',
        }
      ],
      total_items: 12,
      sanitasi_data_selesai: true,
      status: 'approved',
      status_label: 'Disahkan Penuh (Sah TTE BSrE)',
      foto_sebelum: true,
      foto_proses: true,
      foto_sesudah: true,
      can_sign: false,
    },
    {
      id: 102,
      number: 'BA-PMS/TI/DAOP6/10-2026/0015',
      ref_number: 'PMH/0004/X/2026',
      type: 'dsp02',
      form_code: 'FR.SM/TI/012.001',
      tanggal_pelaksanaan: '2026-10-23',
      hari_pelaksanaan: 'Jumat',
      waktu_pelaksanaan: '09:00 WIB',
      lokasi: 'Gudang Logistik Stasiun Tugu Yogyakarta',
      wilayah: 'DAOP 6 Yogyakarta',
      metode_pemusnahan: 'Physical Crushing & Scrap Dismantling',
      metode_code: 'crushing',
      keterangan_metode: 'Penghancuran mekanis menggunakan mesin press hidrolik dan pembongkaran scrap',
      pelaksana: {
        nama: 'Dimas Arya Pratama',
        nipp: '56210',
        jabatan: 'Junior Manager TI Daop 6',
        unit_kerja: 'Unit TI Daop 6 Yogyakarta',
        signed: true,
        signed_at: '2026-10-23 09:40'
      },
      saksi_1: {
        nama: 'Mayor (Mar) Haryanto',
        nipp: '40112',
        jabatan: 'Manager Pengamanan Daop 6',
        unit_kerja: 'Unit Pengamanan Daop 6 Yogyakarta',
        signed: true,
        signed_at: '2026-10-23 09:50'
      },
      saksi_2: {
        nama: 'Wahyu Hidayat, S.T.',
        nipp: '61204',
        jabatan: 'Junior Manager Akuntansi & Aset',
        unit_kerja: 'Unit Keuangan Daop 6 Yogyakarta',
        signed: false,
        signed_at: null
      },
      penanggung_jawab: {
        nama: 'Ir. Bambang Suryo Pratama, M.T.',
        nipp: '48901',
        jabatan: 'Vice President IT Operation',
        unit_kerja: 'Kantor Pusat KAI Bandung',
        signed: false,
        signed_at: null
      },
      items: [
        {
          id: 1,
          nama_aset: 'PC Workstation Loket Stasiun Lempuyangan (HP ProDesk)',
          no_inventaris: 'AST-TI-2016-0811',
          serial_number: 'SN-HP-PD-77218',
          jumlah: 6,
          satuan: 'Unit',
          kategori: 'Perangkat Keras (Hardware)',
          kondisi_awal: 'Kerusakan PSU & Motherboard korosi',
          hasil_pemusnahan: 'Motherboard dipatahkan & Casing logam hancur tertekan',
        },
        {
          id: 2,
          nama_aset: 'Monitor Tabung CRT & LCD Lama 15"',
          no_inventaris: 'AST-TI-2014-0322',
          serial_number: 'SN-MON-OLD-BATCH',
          jumlah: 6,
          satuan: 'Unit',
          kategori: 'Periferal',
          kondisi_awal: 'Layar buram & panel pecah',
          hasil_pemusnahan: 'Komponen internal terpisah untuk penanganan limbah B3',
        }
      ],
      total_items: 12,
      sanitasi_data_selesai: true,
      status: 'pending',
      status_label: 'Menunggu TTE Saksi 2 & VP TI',
      foto_sebelum: true,
      foto_proses: true,
      foto_sesudah: true,
      can_sign: true,
    },
    {
      id: 103,
      number: 'BA-PMS/TI/PUSAT/10-2026/0016',
      ref_number: 'PMH/0009/X/2026',
      type: 'dsp02',
      form_code: 'FR.SM/TI/012.001',
      tanggal_pelaksanaan: '2026-10-24',
      hari_pelaksanaan: 'Sabtu',
      waktu_pelaksanaan: '14:00 WIB',
      lokasi: 'Data Center Juanda Jakarta Pusat',
      wilayah: 'Kantor Pusat Bandung / Juanda',
      metode_pemusnahan: 'Degaussing Magnetik Skala Tinggi',
      metode_code: 'degaussing',
      keterangan_metode: 'Sanitasi demagnetisasi media pita magnetic tape backup & SAN Storage LTO',
      pelaksana: {
        nama: user?.name || 'Ahmad Fauzi Setiawan',
        nipp: user?.nip || '54892',
        jabatan: user?.roleLabel || 'Spv Operasional Infrastruktur TI',
        unit_kerja: user?.location || 'Unit Kantor Pusat',
        signed: false,
        signed_at: null
      },
      saksi_1: {
        nama: 'Agus Triono',
        nipp: '43992',
        jabatan: 'Spv Pengamanan Stasiun Juanda',
        unit_kerja: 'Polsuska Daop 1',
        signed: false,
        signed_at: null
      },
      saksi_2: {
        nama: 'Ratna Sari Dewi',
        nipp: '72319',
        jabatan: 'Staff Tata Kelola & Kepatuhan TI',
        unit_kerja: 'Divisi Tata Kelola TI',
        signed: false,
        signed_at: null
      },
      penanggung_jawab: {
        nama: 'Ir. Bambang Suryo Pratama, M.T.',
        nipp: '48901',
        jabatan: 'Vice President IT Operation',
        unit_kerja: 'Kantor Pusat KAI Bandung',
        signed: false,
        signed_at: null
      },
      items: [
        {
          id: 1,
          nama_aset: 'Magnetic Tape Cartridge LTO-5 Data Keuangan',
          no_inventaris: 'AST-TAPE-2015-001',
          serial_number: 'TAPE-LTO-BATCH-15',
          jumlah: 24,
          satuan: 'Roll/Pcs',
          kategori: 'Media Penyimpanan',
          kondisi_awal: 'Kadaluarsa retensi data 10 tahun',
          hasil_pemusnahan: 'Degaussing 10.000 Gauss & pita dipotong shredder',
        }
      ],
      total_items: 24,
      sanitasi_data_selesai: true,
      status: 'draft',
      status_label: 'Draf (Menunggu Jadwal Eksekusi)',
      foto_sebelum: true,
      foto_proses: false,
      foto_sesudah: false,
      can_sign: false,
    }
  ];

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const res = await api.getDocuments({ type: 'dsp02' }).catch(() => null);
      if (res && res.data && res.data.length > 0) {
        const mapped = res.data.map(d => ({
          ...d,
          type: 'dsp02',
          ref_number: d.data?.nomor_dsp01 || d.data?.ref_number || `PMH/REF-${d.id}`,
          form_code: 'FR.SM/TI/012.001',
          tanggal_pelaksanaan: d.data?.tanggal_pelaksanaan || d.created_at?.split('T')[0] || '2026-10-23',
          hari_pelaksanaan: d.data?.hari_pelaksanaan || 'Jumat',
          waktu_pelaksanaan: d.data?.waktu_pelaksanaan || '10:00 WIB',
          lokasi: d.data?.lokasi || 'Workshop Balai Yasa Manggarai',
          wilayah: d.data?.wilayah || 'DAOP 1 Jakarta',
          metode_pemusnahan: d.data?.metode_pemusnahan || 'Shredding & Degaussing',
          pelaksana: d.data?.pelaksana || { nama: d.requester?.name || 'Petugas TI', nipp: d.requester?.nip || '54892' },
          saksi_1: d.data?.saksi_1 || { nama: 'Petugas Pengamanan Polsuska' },
          saksi_2: d.data?.saksi_2 || { nama: 'Petugas Pengawasan Intern' },
          penanggung_jawab: d.data?.penanggung_jawab || { nama: 'VP IT Operation' },
          items: d.items || d.data?.items || [],
          total_items: (d.items || d.data?.items || []).reduce((acc, it) => acc + (Number(it.jumlah) || 1), 0) || 1,
          status_label: d.status === 'approved' ? 'Disahkan Penuh (Sah)' : d.status === 'pending' ? 'Menunggu TTE Saksi' : 'Draf Berita Acara',
        }));
        setDocuments(mapped);
      } else {
        // Check localStorage for saved DSP-02 documents
        const localSaved = localStorage.getItem('sipakai_dsp02_docs');
        if (localSaved) {
          try {
            const parsed = JSON.parse(localSaved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setDocuments(parsed);
              return;
            }
          } catch (e) {}
        }
        setDocuments(sampleBaDocs);
      }
    } catch (e) {
      setDocuments(sampleBaDocs);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleDelete = (docId) => {
    if (window.confirm(`Yakin ingin menghapus dokumen Berita Acara #${docId}?`)) {
      const updated = documents.filter(d => d.id !== docId);
      setDocuments(updated);
      localStorage.setItem('sipakai_dsp02_docs', JSON.stringify(updated));
      showToast('Dokumen Berita Acara berhasil dihapus dari sistem.');
    }
  };

  // Filter documents
  const filteredDocs = documents.filter((doc) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      doc.number?.toLowerCase().includes(q) ||
      doc.ref_number?.toLowerCase().includes(q) ||
      doc.lokasi?.toLowerCase().includes(q) ||
      doc.wilayah?.toLowerCase().includes(q) ||
      doc.pelaksana?.nama?.toLowerCase().includes(q) ||
      doc.saksi_1?.nama?.toLowerCase().includes(q) ||
      doc.saksi_2?.nama?.toLowerCase().includes(q) ||
      doc.items?.some((it) => it.nama_aset?.toLowerCase().includes(q) || it.serial_number?.toLowerCase().includes(q));

    const status = (doc.status || '').toLowerCase();
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'approved' && (status === 'approved' || status === 'signed' || status === 'selesai')) ||
      (statusFilter === 'pending' && (status === 'pending' || status === 'in_review' || status.includes('menunggu'))) ||
      (statusFilter === 'draft' && (status === 'draft' || status === 'draf'));

    const metode = (doc.metode_pemusnahan || '').toLowerCase();
    const matchMetode =
      metodeFilter === 'all' ||
      (metodeFilter === 'shredding' && (metode.includes('shred') || metode.includes('hancur'))) ||
      (metodeFilter === 'degaussing' && (metode.includes('degauss') || metode.includes('sanitasi'))) ||
      (metodeFilter === 'crushing' && (metode.includes('crush') || metode.includes('press'))) ||
      (metodeFilter === 'dismantling' && (metode.includes('dismantle') || metode.includes('potong') || metode.includes('scrap')));

    const matchLokasi = lokasiFilter === 'all' || doc.wilayah?.toLowerCase().includes(lokasiFilter.toLowerCase());

    return matchSearch && matchStatus && matchMetode && matchLokasi;
  });

  // Calculate statistics
  const totalCount = documents.length;
  const approvedCount = documents.filter(d => ['approved', 'signed', 'selesai'].includes((d.status || '').toLowerCase())).length;
  const pendingCount = documents.filter(d => ['pending', 'in_review'].includes((d.status || '').toLowerCase())).length;
  const draftCount = documents.filter(d => ['draft', 'draf'].includes((d.status || '').toLowerCase())).length;
  const totalAssetsDestroyed = documents.reduce((sum, d) => sum + (d.total_items || 0), 0);

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
          <FileCheck2 className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-orange-400 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
              MODUL DSP-02 KAI TI &bull; SOP PEMUSNAHAN FISIK
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Berita Acara Pemusnahan Aset TI (DSP-02)
            </h1>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
              Pencatatan resmi bukti eksekusi fisik pemusnahan aset teknologi informasi, sanitasi data permanen, dan verifikasi tanda tangan para saksi keamanan serta pengawasan intern PT Kereta Api Indonesia (Persero).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/pemusnahan')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 transition-all flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-orange-300" />
              <span>Lihat Permohonan (DSP-01)</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/berita-acara-pemusnahan/create')}
              className="px-5 py-2.5 bg-[#f05a22] hover:bg-[#d94e1b] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 transform active:scale-95"
            >
              <FilePlus className="w-4 h-4" />
              <span>Buat Berita Acara Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-blue-50 text-[#003580] flex items-center justify-center shrink-0 border border-blue-100">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Dokumen BA</p>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">{totalCount}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">{totalAssetsDestroyed} unit aset dieksekusi</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Disahkan (Sah)</p>
            <h3 className="text-xl font-black text-emerald-900 mt-0.5">{approvedCount}</h3>
            <p className="text-[10px] text-emerald-600 mt-0.5">TTE Lengkap 4 Pihak</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Menunggu TTE</p>
            <h3 className="text-xl font-black text-amber-900 mt-0.5">{pendingCount}</h3>
            <p className="text-[10px] text-amber-600 mt-0.5">Verifikasi Saksi/VP</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Draf Pelaksanaan</p>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">{draftCount}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Belum difinalisasi</p>
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
            placeholder="Cari No. BA, No. Rujukan DSP-01, lokasi, pelaksana, saksi..."
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
              Sah ({approvedCount})
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

          {/* Metode Filter */}
          <select
            value={metodeFilter}
            onChange={(e) => setMetodeFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#003580]"
          >
            <option value="all">Semua Metode Pemusnahan</option>
            <option value="shredding">Shredding (Penghancuran Fisik)</option>
            <option value="degaussing">Degaussing Magnetik Storage</option>
            <option value="crushing">Crushing / Mesin Press</option>
            <option value="dismantling">Scrap Dismantling & Cutting</option>
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
              <FileCheck2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Tidak ada Berita Acara yang cocok</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Tidak ditemukan data dokumen Berita Acara Pemusnahan (DSP-02) sesuai filter pencarian yang Anda tentukan.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setStatusFilter('all'); setMetodeFilter('all'); }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Reset Filter
              </button>
              <button
                type="button"
                onClick={() => navigate('/berita-acara-pemusnahan/create')}
                className="px-4 py-2 bg-[#f05a22] hover:bg-[#d94e1b] text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                Buat Berita Acara Baru
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
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-orange-50 text-orange-700 border border-orange-200">
                      DSP-02 &bull; BERITA ACARA
                    </span>

                    <span className="text-xs font-bold text-slate-800 font-mono tracking-tight">
                      {doc.number}
                    </span>

                    {/* Status Badge */}
                    {isApproved && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        {doc.status_label || 'Disahkan Penuh'}
                      </span>
                    )}
                    {isPending && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-600" />
                        {doc.status_label || 'Menunggu Saksi / VP'}
                      </span>
                    )}
                    {isDraft && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        <Edit3 className="w-3 h-3 text-slate-500" />
                        {doc.status_label || 'Draf'}
                      </span>
                    )}

                    <span className="text-[11px] text-slate-400 font-medium ml-auto lg:ml-0">
                      Dasar DSP-01: <span className="font-semibold text-slate-600">{doc.ref_number}</span>
                    </span>
                  </div>

                  {/* Execution Details & Location */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1 text-xs">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{doc.hari_pelaksanaan}, {doc.tanggal_pelaksanaan} ({doc.waktu_pelaksanaan})</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate" title={doc.lokasi}>{doc.lokasi}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600">
                      <Hammer className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate" title={doc.metode_pemusnahan}>
                        {doc.metode_pemusnahan}
                      </span>
                    </div>
                  </div>

                  {/* Committee & Witnesses */}
                  <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-700">Pelaksana:</span>
                      <span className="text-slate-900 font-medium">{doc.pelaksana?.nama || 'Petugas TI'}</span>
                      {doc.pelaksana?.signed && (
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">TTE ✓</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-700">Saksi 1 (Pam):</span>
                      <span className="text-slate-900 font-medium">{doc.saksi_1?.nama || 'Polsuska'}</span>
                      {doc.saksi_1?.signed ? (
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">TTE ✓</span>
                      ) : (
                        <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">Menunggu</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-700">Saksi 2 (Audit):</span>
                      <span className="text-slate-900 font-medium">{doc.saksi_2?.nama || 'SPI/Keuangan'}</span>
                      {doc.saksi_2?.signed ? (
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">TTE ✓</span>
                      ) : (
                        <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">Menunggu</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 ml-auto">
                      <span className="font-bold text-slate-800">Total Dimusnahkan:</span>
                      <span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-extrabold rounded-md border border-rose-200">
                        {doc.total_items || (doc.items ? doc.items.length : 1)} Unit Barang
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex flex-row lg:flex-col items-center justify-end gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <button
                    type="button"
                    onClick={() => navigate(`/berita-acara-pemusnahan/${doc.id}`)}
                    className="flex-1 lg:flex-none w-full px-4 py-2 bg-[#003580] hover:bg-[#092653] text-white rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-sky-300" />
                    <span>Lihat Lembar A4</span>
                  </button>

                  <div className="flex items-center gap-1.5 w-full">
                    {isDraft && (
                      <button
                        type="button"
                        onClick={() => navigate(`/berita-acara-pemusnahan/${doc.id}/edit`)}
                        className="flex-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                        title="Edit Draf"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => navigate(`/berita-acara-pemusnahan/${doc.id}?print=true`)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold transition-colors"
                      title="Cetak Berita Acara"
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
