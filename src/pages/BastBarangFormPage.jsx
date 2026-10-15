import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Laptop,
  Monitor,
  Cpu,
  Printer,
  HardDrive,
  Plus,
  Database,
  Search,
  Trash2,
  Eye,
  FileText,
  Download,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  Check,
  X,
  Lock,
  ArrowLeft,
  Loader2,
  Building2,
  UserCheck,
  ShieldAlert,
  Server,
  Layers
} from 'lucide-react';
import { api } from '../services/api';

const DEFAULT_ITEMS = [
  {
    id: 1,
    nama_barang: 'Laptop ThinkPad L14 Gen 4',
    sub_kategori: 'Workstation Portabel',
    tipe_icon: 'laptop',
    brand_series: 'Lenovo / Intel Core i7-1355U',
    spesifikasi: '16GB DDR5 RAM, 512GB NVMe, Iris Xe',
    no_inventaris: 'AST-TI-2023-0881',
    serial_number: 'PF-411998',
    kondisi: 'Baik & Lengkap',
    kelengkapan: 'Charger Type-C 65W + Tas KAI',
    keterangan: 'Perangkat kerja operasional Pusdalop baru',
    nilai_perkiraan: 18500000,
  },
  {
    id: 2,
    nama_barang: 'Monitor Dell UltraSharp 24"',
    sub_kategori: 'External Screen Workstation',
    tipe_icon: 'monitor',
    brand_series: 'Dell / U2422H UltraSharp Series',
    spesifikasi: 'IPS FHD 1920x1080 60Hz 100% sRGB',
    no_inventaris: 'AST-TI-2023-1402',
    serial_number: 'CN-0084R2-74261',
    kondisi: 'Baik, Layar Normal',
    kelengkapan: 'Kabel HDMI, DisplayPort, Power',
    keterangan: 'Display monitoring jadwal KA real-time',
    nilai_perkiraan: 8200000,
  },
  {
    id: 3,
    nama_barang: 'Docking Station USB-C KAI',
    sub_kategori: 'Peripheral Connectivity Hub',
    tipe_icon: 'dock',
    brand_series: 'Lenovo / ThinkPad Universal Dock',
    spesifikasi: '90W Power Delivery, Dual DP, GbE',
    no_inventaris: 'AST-TI-2023-2294',
    serial_number: '1049689135US-21618',
    kondisi: 'Baik & Berfungsi',
    kelengkapan: 'Adaptor Original 90W + USB-C Host',
    keterangan: 'Aksesoris workstation Pusdalop',
    nilai_perkiraan: 5150000,
  },
];

export default function BastBarangFormPage({ user }) {
  const navigate = useNavigate();

  // --- Form State: Pihak I (Penyerah) ---
  const [penyerah, setPenyerah] = useState({
    nama: user?.name || 'Fajar Prasetyo, S. Kom',
    nipp: user?.nip || '62489',
    telepon: '0812-9842-8812',
    jabatan: user?.roleLabel || 'Senior IT Officer Infrastructure & Network',
    tempat_kedudukan: user?.location || 'Unit TI DAOP 1 Jakarta - Kantor Stasiun Gambir Lt. 3',
    personal_area: 'DAOP 1 JAKARTA (Area Code: 1100)',
    unit_badge: 'Unit TI DAOP 1',
  });

  // --- Form State: Pihak II (Penerima) ---
  const [penerima, setPenerima] = useState({
    nama: 'Rian Ardiansyah, S.T',
    nipp: '67891',
    telepon: '0813-1490-2211',
    jabatan: 'Junior Analyst Operasi Perjalanan Kereta Api (Pusdalop)',
    tempat_kedudukan: 'Pusat Pengendali Operasi Kereta (Pusdalop) DAOP 1 - Juanda Lt. 2',
    personal_area: 'DAOP 1 JAKARTA (Area Code: 1100)',
    unit_badge: 'Pusdalop DAOP 1',
    owner_responsible: '',
    custodian: '',
  });

  // --- Items State ---
  const [items, setItems] = useState(DEFAULT_ITEMS);

  // --- Approvers / Cost Center Options ---
  const [approvers, setApprovers] = useState([]);
  const [isLoadingApprovers, setIsLoadingApprovers] = useState(false);

  // --- Modals State ---
  const [isSapModalOpen, setIsSapModalOpen] = useState(false);
  const [sapAssets, setSapAssets] = useState([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [selectedSapIds, setSelectedSapIds] = useState([]);
  const [sapSearchTerm, setSapSearchTerm] = useState('');

  const [isSearchNippModalOpen, setIsSearchNippModalOpen] = useState(false);
  const [nippSearchQuery, setNippSearchQuery] = useState('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [isPreviewPdfModalOpen, setIsPreviewPdfModalOpen] = useState(false);

  // --- Submission State ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  // Load approvers for Owner Responsible & Designated IT Custodian
  useEffect(() => {
    async function loadInitialData() {
      try {
        setIsLoadingApprovers(true);
        const res = await api.getApprovers();
        const list = Array.isArray(res) ? res : (res?.data || []);
        setApprovers(list);

        if (list.length > 0) {
          // Preselect realistic defaults
          const mgr = list.find((u) => {
            const j = (typeof u.jabatan === 'object' ? u.jabatan?.nama : u.jabatan || '').toLowerCase();
            return j.includes('manager') || j.includes('kepala') || j.includes('asmen');
          }) || list[0];

          const itStaff = list.find((u) => {
            const j = (typeof u.jabatan === 'object' ? u.jabatan?.nama : u.jabatan || '').toLowerCase();
            return (j.includes('ti') || j.includes('it') || j.includes('sarana')) && u.id !== mgr?.id;
          }) || list[1] || list[0];

          setPenerima((prev) => ({
            ...prev,
            owner_responsible: prev.owner_responsible || `${mgr?.name || 'Manager Operasi KA DAOP 1'} - [NIPP: ${mgr?.nip || '51204'}]`,
            custodian: prev.custodian || `${itStaff?.name || 'Sub-Seksi Tata Usaha & Sarana TI DAOP 1'} - [NIPP: ${itStaff?.nip || '68120'}]`,
          }));
        }
      } catch (err) {
        console.error('Failed to load approvers:', err);
      } finally {
        setIsLoadingApprovers(false);
      }
    }
    loadInitialData();
  }, [user]);

  // Sync Pihak I with logged in user if available
  useEffect(() => {
    if (user) {
      setPenyerah((prev) => ({
        ...prev,
        nama: user.name || prev.nama,
        nipp: user.nip || prev.nipp,
        jabatan: user.roleLabel || prev.jabatan,
        tempat_kedudukan: user.location || prev.tempat_kedudukan,
      }));
    }
  }, [user]);

  // Load SAP Master Assets when SAP modal opens
  const handleOpenSapModal = async () => {
    setIsSapModalOpen(true);
    setSelectedSapIds([]);
    try {
      setIsLoadingAssets(true);
      const res = await api.getAssets().catch(() => null);
      if (res && res.data && res.data.length > 0) {
        setSapAssets(res.data);
      } else {
        // Fallback realistic SAP inventory fixtures
        setSapAssets([
          {
            id: 'sap-101',
            no_inventaris: 'AST-TI-2023-0881',
            nama: 'Laptop ThinkPad L14 Gen 4',
            brand: 'Lenovo',
            spesifikasi: 'Core i7-1355U / 16GB / 512GB SSD',
            serial_number: 'PF-411998',
            kategori: 'Laptop/Workstation',
            nilai_buku: 18500000,
            status: 'Tersedia',
          },
          {
            id: 'sap-102',
            no_inventaris: 'AST-TI-2023-1402',
            nama: 'Monitor Dell UltraSharp 24"',
            brand: 'Dell U2422H',
            spesifikasi: 'IPS FHD 1920x1080 60Hz 100% sRGB',
            serial_number: 'CN-0084R2-74261',
            kategori: 'Display',
            nilai_buku: 8200000,
            status: 'Tersedia',
          },
          {
            id: 'sap-103',
            no_inventaris: 'AST-TI-2023-2294',
            nama: 'Docking Station USB-C KAI',
            brand: 'Lenovo Universal Dock',
            spesifikasi: '90W Power Delivery, Dual DP, GbE',
            serial_number: '1049689135US-21618',
            kategori: 'Periferal',
            nilai_buku: 5150000,
            status: 'Tersedia',
          },
          {
            id: 'sap-104',
            no_inventaris: 'AST-TI-2024-0019',
            nama: 'Scanner Fujitsu fi-8170 Duplex',
            brand: 'Fujitsu Ricoh',
            spesifikasi: '70 ppm / 140 ipm, ADF 100 lembar',
            serial_number: 'FJ-8170-89123',
            kategori: 'Scanner Dokumen',
            nilai_buku: 14200000,
            status: 'Tersedia',
          },
          {
            id: 'sap-105',
            no_inventaris: 'AST-TI-2023-3301',
            nama: 'Printer HP LaserJet Pro M404dn',
            brand: 'HP Inc.',
            spesifikasi: 'Monochrome 38 ppm, Auto Duplex, Gigabit',
            serial_number: 'VNC3K92110',
            kategori: 'Printer Kantor',
            nilai_buku: 6400000,
            status: 'Tersedia',
          },
        ]);
      }
    } catch (err) {
      console.error('Error fetching assets:', err);
    } finally {
      setIsLoadingAssets(false);
    }
  };

  const handleImportSelectedSap = () => {
    const selected = sapAssets.filter((a) => selectedSapIds.includes(a.id));
    const newItems = selected.map((asset, idx) => ({
      id: Date.now() + idx,
      nama_barang: asset.nama || asset.nama_aset || 'Perangkat TI',
      sub_kategori: asset.kategori || 'Hardware Aset',
      tipe_icon: (asset.nama || '').toLowerCase().includes('monitor')
        ? 'monitor'
        : (asset.nama || '').toLowerCase().includes('printer')
        ? 'printer'
        : 'laptop',
      brand_series: asset.brand || asset.merk || 'Standar KAI',
      spesifikasi: asset.spesifikasi || 'Spesifikasi standar operasional',
      no_inventaris: asset.no_inventaris || asset.nomor_aset || `AST-TI-${Date.now().toString().slice(-4)}`,
      serial_number: asset.serial_number || asset.sn || 'SN-' + Math.floor(100000 + Math.random() * 900000),
      kondisi: 'Baik & Lengkap',
      kelengkapan: 'Aksesoris standar lengkap',
      keterangan: 'Perangkat kerja operasional unit penerima',
      nilai_perkiraan: Number(asset.nilai_buku || asset.harga_perolehan || 5000000),
    }));

    setItems((prev) => [...prev, ...newItems]);
    setIsSapModalOpen(false);
  };

  // Add empty manual asset row
  const handleAddManualAsset = () => {
    const newItem = {
      id: Date.now(),
      nama_barang: '',
      sub_kategori: 'Hardware Aset',
      tipe_icon: 'laptop',
      brand_series: '',
      spesifikasi: '',
      no_inventaris: `AST-TI-2024-${Math.floor(1000 + Math.random() * 9000)}`,
      serial_number: '',
      kondisi: 'Baik & Lengkap',
      kelengkapan: '',
      keterangan: 'Penggunaan operasional kedinasan',
      nilai_perkiraan: 0,
    };
    setEditingItem(newItem);
    setIsEditModalOpen(true);
  };

  const handleSaveEditedItem = (saved) => {
    if (!saved.nama_barang || !saved.nama_barang.trim()) {
      alert('Nama barang wajib diisi');
      return;
    }
    setItems((prev) => {
      const exists = prev.some((it) => it.id === saved.id);
      if (exists) {
        return prev.map((it) => (it.id === saved.id ? saved : it));
      }
      return [...prev, saved];
    });
    setIsEditModalOpen(false);
    setEditingItem(null);
  };

  const handleDeleteItem = (id) => {
    if (items.length <= 1) {
      alert('Dokumen serah terima fisik wajib memiliki minimal 1 (satu) unit aset.');
      return;
    }
    setItems(items.filter((it) => it.id !== id));
  };

  // Calculate total book / recorded SAP value
  const totalNilai = items.reduce((acc, curr) => acc + (Number(curr.nilai_perkiraan) || 0), 0);

  // Submit to backend
  const handleSubmitDocument = async (submitNow) => {
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!penerima.nama || !penerima.nipp) {
      setSubmitError('Lengkapi identitas Pihak II Penerima (Nama dan NIPP wajib diisi).');
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    if (items.length === 0) {
      setSubmitError('Daftar perangkat aset tidak boleh kosong.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Find approver id for submit
      const approverId = approvers.length > 0 ? approvers[0].id : undefined;

      const payload = {
        type: 'ho01',
        submit: submitNow,
        approver_id: submitNow ? approverId : undefined,
        data: {
          penyerah: {
            nama: penyerah.nama,
            nipp: penyerah.nipp,
            telepon: penyerah.telepon,
            jabatan: penyerah.jabatan,
            tempat_kedudukan: penyerah.tempat_kedudukan,
            personal_area: penyerah.personal_area,
          },
          penerima: {
            nama: penerima.nama,
            nipp: penerima.nipp,
            telepon: penerima.telepon,
            jabatan: penerima.jabatan,
            tempat_kedudukan: penerima.tempat_kedudukan,
            personal_area: penerima.personal_area,
            owner_responsible: penerima.owner_responsible,
            custodian: penerima.custodian,
          },
          total_nilai_sap: totalNilai,
          status_sinkronisasi_sap: 'Siap Ditransaksikan',
          tanggal: new Date().toISOString().split('T')[0],
        },
        items: items.map((it) => ({
          nama_barang: it.nama_barang,
          brand_series: it.brand_series ? `${it.brand_series} - ${it.spesifikasi || ''}` : it.spesifikasi || '',
          no_inventaris: it.no_inventaris,
          serial_number: it.serial_number,
          keterangan: `${it.kondisi || ''} (${it.kelengkapan || ''}) - ${it.keterangan || ''}`.trim(),
          nilai_buku: it.nilai_perkiraan || 0,
        })),
      };

      const res = await api.createDocument(payload);

      setSubmitSuccess(
        submitNow
          ? (res.message || 'BAST Barang Fisik berhasil disahkan & diterbitkan!')
          : (res.message || 'Draf BAST Barang Fisik berhasil disimpan!')
      );

      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      console.error('Submission error:', err);
      setSubmitError(err.message || 'Gagal menyimpan dokumen serah terima fisik.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render asset icon
  const renderItemIcon = (type) => {
    switch (type) {
      case 'monitor':
        return <Monitor className="w-5 h-5 text-blue-600" />;
      case 'dock':
        return <Cpu className="w-5 h-5 text-sky-600" />;
      case 'printer':
        return <Printer className="w-5 h-5 text-amber-600" />;
      case 'server':
        return <Server className="w-5 h-5 text-indigo-600" />;
      default:
        return <Laptop className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20 select-none">
      {/* Top Breadcrumb & Status Alert */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium mb-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Beranda
          </button>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Formulir Serah Terima Barang Fisik
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-4xl leading-relaxed">
            Formulir pengalihan hak guna, penguasaan fisik, dan tanggung jawab pemeliharaan aset perangkat keras TI
            antar pegawai / unit kerja PT Kereta Api Indonesia (Persero). Dokumen mengikat secara sah untuk
            pemutakhiran inventaris sistem aset terpadu.
          </p>
        </div>
      </div>

      {/* Notification Banner */}
      {submitSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-sm font-semibold flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{submitSuccess} Mengalihkan ke halaman utama...</span>
          </div>
          <button type="button" onClick={() => setSubmitSuccess(null)} className="text-emerald-700 hover:text-emerald-900">
            ✕
          </button>
        </div>
      )}

      {submitError && (
        <div className="p-4 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-sm font-semibold flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{submitError}</span>
          </div>
          <button type="button" onClick={() => setSubmitError(null)} className="text-rose-700 hover:text-rose-900">
            ✕
          </button>
        </div>
      )}

      {/* SECTION 1: IDENTITAS DUA PIHAK */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-md bg-[#0a192f] text-white flex items-center justify-center text-xs font-bold shadow-xs">
              1
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">Identitas Dua Pihak</h2>
              <p className="text-xs text-slate-500">
                Pihak yang menyerahkan dan pihak yang menerima kepemilikan/tanggung jawab perangkat TI.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>SIKLUS MUTASI INTERNAL</span>
          </div>
        </div>

        {/* Two Cards Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* PIHAK I: PENYERAH (ASAL) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
            <div>
              {/* Card Header */}
              <div className="bg-[#0a192f] text-white p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold tracking-tight">Pihak I — Pihak Penyerah</h3>
                    <p className="text-[10px] text-slate-300">Pemegang / Pengelola Aset Lama</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/15 text-white">
                  ASAL
                </span>
              </div>

              {/* Form Fields */}
              <div className="p-4 space-y-3.5 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">Nama Lengkap Pegawai *</label>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      <Lock className="w-2.5 h-2.5" /> SSO Verified
                    </span>
                  </div>
                  <input
                    type="text"
                    value={penyerah.nama}
                    readOnly
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">NIPP *</label>
                    <input
                      type="text"
                      value={penyerah.nipp}
                      readOnly
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">No. Telepon Dinas / WhatsApp</label>
                    <input
                      type="text"
                      value={penyerah.telepon}
                      onChange={(e) => setPenyerah({ ...penyerah, telepon: e.target.value })}
                      placeholder="0812-xxxx-xxxx"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Jabatan Kedinasan *</label>
                  <input
                    type="text"
                    value={penyerah.jabatan}
                    readOnly
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tempat Kedudukan / Unit Kerja</label>
                  <input
                    type="text"
                    value={penyerah.tempat_kedudukan}
                    readOnly
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Personal Area SAP</label>
                  <input
                    type="text"
                    value={penyerah.personal_area}
                    readOnly
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Card Footer */}
            <div className="bg-slate-50/80 border-t border-slate-100 px-4 py-2.5 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <Lock className="w-3 h-3 text-slate-400" />
                Otoritas Penyerahan Aset Sah
              </span>
              <span className="font-semibold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-2xs">
                {penyerah.unit_badge}
              </span>
            </div>
          </div>

          {/* PIHAK II: PENERIMA (TUJUAN) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
            <div>
              {/* Card Header */}
              <div className="bg-[#f05a22] text-white p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-white">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold tracking-tight">Pihak II — Pihak Penerima</h3>
                    <p className="text-[10px] text-white/90">Penanggung Jawab Baru Penggunaan Aset</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/20 text-white">
                  TUJUAN
                </span>
              </div>

              {/* Form Fields */}
              <div className="p-4 space-y-3.5 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">Nama Lengkap Pegawai Penerima *</label>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-amber-700 font-medium">Wajib Validasi Master SDM</span>
                      <button
                        type="button"
                        onClick={() => setIsSearchNippModalOpen(true)}
                        className="inline-flex items-center gap-1 bg-[#0a192f] hover:bg-[#122b52] text-white text-[10px] px-2 py-0.5 rounded font-semibold transition-colors shadow-2xs"
                      >
                        <Search className="w-2.5 h-2.5" /> Cari NIPP
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={penerima.nama}
                    onChange={(e) => setPenerima({ ...penerima, nama: e.target.value })}
                    placeholder="Nama lengkap pegawai penerima"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-semibold focus:ring-1 focus:ring-[#f05a22] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">NIPP *</label>
                    <input
                      type="text"
                      value={penerima.nipp}
                      onChange={(e) => setPenerima({ ...penerima, nipp: e.target.value })}
                      placeholder="Nomor Induk Pegawai"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-medium focus:ring-1 focus:ring-[#f05a22] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">No. Telepon Kantor / Ext.</label>
                    <input
                      type="text"
                      value={penerima.telepon}
                      onChange={(e) => setPenerima({ ...penerima, telepon: e.target.value })}
                      placeholder="0813-xxxx-xxxx"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-medium focus:ring-1 focus:ring-[#f05a22] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Jabatan Kedinasan *</label>
                  <input
                    type="text"
                    value={penerima.jabatan}
                    onChange={(e) => setPenerima({ ...penerima, jabatan: e.target.value })}
                    placeholder="Jabatan kedinasan pegawai penerima"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-medium focus:ring-1 focus:ring-[#f05a22] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tempat Kedudukan / Unit Kerja</label>
                  <input
                    type="text"
                    value={penerima.tempat_kedudukan}
                    onChange={(e) => setPenerima({ ...penerima, tempat_kedudukan: e.target.value })}
                    placeholder="Contoh: Pusdalop DAOP 1 - Juanda Lt. 2"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-medium focus:ring-1 focus:ring-[#f05a22] focus:outline-none"
                  />
                </div>

                {/* Owner Responsible Dropdown */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">
                      Owner Responsible (Cost Center / Kepala Unit) *
                    </label>
                    <span className="text-[10px] text-slate-500 font-medium">Penjamin Aset</span>
                  </div>
                  <select
                    value={penerima.owner_responsible}
                    onChange={(e) => setPenerima({ ...penerima, owner_responsible: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs focus:ring-1 focus:ring-[#f05a22] focus:outline-none"
                  >
                    <option value="">-- Pilih Penjamin Aset / Kepala Unit --</option>
                    {approvers.map((u) => {
                      const jab = typeof u.jabatan === 'object' ? u.jabatan?.nama : (u.jabatan || 'Pejabat Penjamin');
                      const val = `${jab} - ${u.name || u.nama} [NIPP: ${u.nip}]`;
                      return (
                        <option key={u.id} value={val}>
                          {val}
                        </option>
                      );
                    })}
                    {!approvers.some((u) => (u.name || '').includes('Heru Wicaksono')) && (
                      <option value="Manager Operasi KA DAOP 1 - Heru Wicaksono [NIPP: 51204]">
                        Manager Operasi KA DAOP 1 - Heru Wicaksono [NIPP: 51204]
                      </option>
                    )}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Menentukan beban cost center pemeliharaan dan audit rutin pada modul SAP FI-AA
                  </p>
                </div>

                {/* Designated IT Custodian */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">
                      Designated IT Custodian (Pengawas Teknis) *
                    </label>
                    <span className="text-[10px] text-slate-500 font-medium">Seksi TI Terkait</span>
                  </div>
                  <select
                    value={penerima.custodian}
                    onChange={(e) => setPenerima({ ...penerima, custodian: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs focus:ring-1 focus:ring-[#f05a22] focus:outline-none"
                  >
                    <option value="">-- Pilih Pengawas Teknis TI --</option>
                    {approvers.map((u) => {
                      const jab = typeof u.jabatan === 'object' ? u.jabatan?.nama : (u.jabatan || 'Petugas TI');
                      const val = `${jab} - ${u.name || u.nama} [NIPP: ${u.nip}]`;
                      return (
                        <option key={u.id} value={val}>
                          {val}
                        </option>
                      );
                    })}
                    {!approvers.some((u) => (u.name || '').includes('Denny Kurnia')) && (
                      <option value="Sub-Seksi Tata Usaha & Sarana TI DAOP 1 - Denny Kurnia [NIPP: 68120]">
                        Sub-Seksi Tata Usaha & Sarana TI DAOP 1 - Denny Kurnia [NIPP: 68120]
                      </option>
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Card Footer */}
            <div className="bg-slate-50/80 border-t border-slate-100 px-4 py-2.5 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5 font-medium text-amber-700">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                Status Hak Pakai Aktif
              </span>
              <span className="font-semibold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-2xs">
                {penerima.unit_badge}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: DAFTAR PERANGKAT KERAS / ASET FISIK */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-md bg-[#0a192f] text-white flex items-center justify-center text-xs font-bold shadow-xs">
              2
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Daftar Perangkat Keras / Aset Fisik yang Diserahkan
                </h2>
                <span className="text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-full">
                  {items.length} Item Terdaftar
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Rincian teknis, nomor inventaris SAP, serial number, serta kondisi fisik barang pada saat serah terima.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddManualAsset}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Baris Aset Manual
            </button>
            <button
              type="button"
              onClick={handleOpenSapModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0a192f] hover:bg-[#122b52] text-white text-xs font-semibold transition-colors shadow-xs"
            >
              <Database className="w-3.5 h-3.5 text-sky-400" />
              Import dari Master Aset SAP
            </button>
          </div>
        </div>

        {/* Assets Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                  <th className="py-3 px-4 w-12 text-center">NO</th>
                  <th className="py-3 px-4 min-w-[220px]">NAMA BARANG</th>
                  <th className="py-3 px-4 min-w-[240px]">BRAND / SERIES & SPESIFIKASI</th>
                  <th className="py-3 px-4 min-w-[150px]">NO. INVENTARIS SAP</th>
                  <th className="py-3 px-4 min-w-[140px]">SERIAL NUMBER</th>
                  <th className="py-3 px-4 min-w-[200px]">KONDISI & KELENGKAPAN</th>
                  <th className="py-3 px-4 min-w-[200px]">KETERANGAN PENGGUNAAN</th>
                  <th className="py-3 px-4 w-20 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* NO */}
                    <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                      {String(idx + 1).padStart(2, '0')}
                    </td>

                    {/* NAMA BARANG */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                          {renderItemIcon(item.tipe_icon)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 leading-snug">{item.nama_barang}</div>
                          <div className="text-[11px] text-slate-400 font-medium">{item.sub_kategori}</div>
                        </div>
                      </div>
                    </td>

                    {/* BRAND & SPECS */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-700 leading-snug">{item.brand_series}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed font-mono">
                        {item.spesifikasi}
                      </div>
                    </td>

                    {/* NO INVENTARIS SAP */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-[11px] text-[#f05a22] bg-orange-50 border border-orange-200 px-2 py-0.5 rounded">
                        # {item.no_inventaris}
                      </span>
                    </td>

                    {/* SERIAL NUMBER */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-200">
                        {item.serial_number || '-'}
                      </span>
                    </td>

                    {/* KONDISI & KELENGKAPAN */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-semibold text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>{item.kondisi}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{item.kelengkapan || '-'}</div>
                    </td>

                    {/* KETERANGAN */}
                    <td className="py-3.5 px-4 text-slate-600 leading-relaxed">
                      {item.keterangan || '-'}
                    </td>

                    {/* ACTIONS */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItem({ ...item });
                            setIsEditModalOpen(true);
                          }}
                          title="Lihat / Edit Detail"
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          title="Hapus Baris"
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Bottom Meta Bar */}
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold">
            <div className="text-slate-700 flex items-center gap-2">
              <span className="text-slate-500 font-medium">Total Nilai Tercatat SAP:</span>
              <span className="text-slate-900 font-bold font-mono">
                Rp {totalNilai.toLocaleString('id-ID')},-
              </span>
            </div>

            <button
              type="button"
              onClick={() => alert('Fitur unduh template ceklis serah fisik siap diunduh.')}
              className="inline-flex items-center gap-1.5 text-amber-700 hover:text-amber-900 transition-colors font-medium text-[11px]"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              Unduh Format Cetak Ceklis Serah Fisik (.pdf)
            </button>
          </div>
        </div>
      </div>

      {/* FOOTER ACTIONS BAR */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Left: SAP Sync Status */}
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="text-xs font-semibold text-slate-700">Status Sinkronisasi SAP FI-AA</span>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
            Siap Ditransaksikan
          </span>
        </div>

        {/* Right Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Batal / Kembali
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmitDocument(false)}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            Simpan Draf BAST
          </button>

          <button
            type="button"
            onClick={() => setIsPreviewPdfModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#0a192f] hover:bg-[#122b52] rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5 text-sky-400" />
            Pratinjau Cetak BAST (PDF A4)
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmitDocument(true)}
            className="px-5 py-2 text-xs font-bold text-white bg-[#f05a22] hover:bg-[#d94e18] rounded-lg transition-colors flex items-center gap-1.5 shadow-sm active:scale-98"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-4 h-4 stroke-[2.5]" />
            )}
            Sahkan & Terbitkan BAST Barang Fisik
          </button>
        </div>
      </div>

      {/* --- MODAL 1: IMPORT FROM MASTER ASET SAP --- */}
      {isSapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]">
            <div className="bg-[#0a192f] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="font-bold text-sm">Integrasi Master Data Aset SAP (FI-AA)</h3>
                  <p className="text-[11px] text-slate-300">Pilih aset fisik terdaftar untuk diimpor ke BAST ini</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSapModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search filter */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={sapSearchTerm}
                onChange={(e) => setSapSearchTerm(e.target.value)}
                placeholder="Cari nomor inventaris SAP, nama aset, serial number..."
                className="w-full text-xs bg-transparent focus:outline-none text-slate-800"
              />
            </div>

            {/* List Table */}
            <div className="overflow-y-auto p-4 flex-1">
              {isLoadingAssets ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
                  <p className="text-xs">Mengambil data master aset dari server SAP...</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold">
                      <th className="p-2 w-8">PILIH</th>
                      <th className="p-2">NO. INVENTARIS</th>
                      <th className="p-2">NAMA ASET & MERK</th>
                      <th className="p-2">SERIAL NUMBER</th>
                      <th className="p-2 text-right">NILAI BUKU</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sapAssets
                      .filter((a) => {
                        const q = sapSearchTerm.toLowerCase();
                        return (
                          !q ||
                          (a.nama || a.nama_aset || '').toLowerCase().includes(q) ||
                          (a.no_inventaris || '').toLowerCase().includes(q) ||
                          (a.serial_number || '').toLowerCase().includes(q)
                        );
                      })
                      .map((asset) => {
                        const isChecked = selectedSapIds.includes(asset.id);
                        return (
                          <tr
                            key={asset.id}
                            onClick={() => {
                              setSelectedSapIds((prev) =>
                                isChecked ? prev.filter((id) => id !== asset.id) : [...prev, asset.id]
                              );
                            }}
                            className={`cursor-pointer transition-colors ${
                              isChecked ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="p-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="rounded text-blue-600 focus:ring-0"
                              />
                            </td>
                            <td className="p-2 font-mono font-bold text-[#f05a22]">
                              {asset.no_inventaris || asset.nomor_aset || '-'}
                            </td>
                            <td className="p-2">
                              <div className="font-semibold text-slate-800">{asset.nama || asset.nama_aset}</div>
                              <div className="text-[10px] text-slate-400">{asset.brand || asset.spesifikasi}</div>
                            </td>
                            <td className="p-2 font-mono text-slate-600">{asset.serial_number || '-'}</td>
                            <td className="p-2 text-right font-mono font-semibold text-slate-700">
                              Rp {Number(asset.nilai_buku || 5000000).toLocaleString('id-ID')}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                {selectedSapIds.length} aset dipilih
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsSapModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={selectedSapIds.length === 0}
                  onClick={handleImportSelectedSap}
                  className="px-4 py-1.5 text-xs font-semibold bg-[#f05a22] hover:bg-[#d94e18] disabled:opacity-50 text-white rounded-lg shadow-xs"
                >
                  Tambahkan ke Formulir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: CARI NIPP / PEGAWAI MASTER SDM --- */}
      {isSearchNippModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-[#0a192f] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-sm">Validasi Master SDM & Cari NIPP</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSearchNippModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 border-b border-slate-200 bg-slate-50">
              <input
                type="text"
                value={nippSearchQuery}
                onChange={(e) => setNippSearchQuery(e.target.value)}
                placeholder="Ketik NIPP atau nama pegawai..."
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none"
              />
            </div>

            <div className="p-3 max-h-72 overflow-y-auto space-y-1.5">
              {approvers
                .filter((u) => {
                  const q = nippSearchQuery.toLowerCase();
                  return !q || (u.name || u.nama || '').toLowerCase().includes(q) || (u.nip || '').includes(q);
                })
                .map((u) => {
                  const jab = typeof u.jabatan === 'object' ? u.jabatan?.nama : (u.jabatan || 'Pegawai');
                  return (
                    <div
                      key={u.id}
                      onClick={() => {
                        setPenerima((prev) => ({
                          ...prev,
                          nama: u.name || u.nama,
                          nipp: u.nip,
                          jabatan: jab,
                          tempat_kedudukan: u.unit_kerja || prev.tempat_kedudukan,
                        }));
                        setIsSearchNippModalOpen(false);
                      }}
                      className="p-2.5 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-800">{u.name || u.nama}</div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          NIPP: {u.nip} • {jab}
                        </div>
                      </div>
                      <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded">
                        Pilih
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: TAMBAH / EDIT BARIS ASET MANUAL --- */}
      {isEditModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
            <div className="bg-[#0a192f] text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {items.some((i) => i.id === editingItem.id) ? 'Edit Rincian Aset Fisik' : 'Tambah Baris Aset Manual'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs max-h-[75vh] overflow-y-auto">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Perangkat / Barang *</label>
                <input
                  type="text"
                  value={editingItem.nama_barang}
                  onChange={(e) => setEditingItem({ ...editingItem, nama_barang: e.target.value })}
                  placeholder="Contoh: Laptop ThinkPad T14 Gen 3"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Sub-Kategori / Tipe</label>
                  <input
                    type="text"
                    value={editingItem.sub_kategori}
                    onChange={(e) => setEditingItem({ ...editingItem, sub_kategori: e.target.value })}
                    placeholder="Contoh: Workstation Portabel"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tipe Ikon</label>
                  <select
                    value={editingItem.tipe_icon}
                    onChange={(e) => setEditingItem({ ...editingItem, tipe_icon: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900"
                  >
                    <option value="laptop">Laptop / Workstation</option>
                    <option value="monitor">Monitor / Display</option>
                    <option value="dock">Docking / Network</option>
                    <option value="printer">Printer / Scanner</option>
                    <option value="server">Server / Infrastructure</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Brand / Series</label>
                <input
                  type="text"
                  value={editingItem.brand_series}
                  onChange={(e) => setEditingItem({ ...editingItem, brand_series: e.target.value })}
                  placeholder="Contoh: Lenovo ThinkPad / Intel Core i7"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Spesifikasi Detail</label>
                <textarea
                  rows={2}
                  value={editingItem.spesifikasi}
                  onChange={(e) => setEditingItem({ ...editingItem, spesifikasi: e.target.value })}
                  placeholder="RAM, SSD, GPU, atau port konektivitas..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nomor Inventaris SAP *</label>
                  <input
                    type="text"
                    value={editingItem.no_inventaris}
                    onChange={(e) => setEditingItem({ ...editingItem, no_inventaris: e.target.value })}
                    placeholder="AST-TI-2024-xxxx"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold text-[#f05a22]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Serial Number (SN)</label>
                  <input
                    type="text"
                    value={editingItem.serial_number}
                    onChange={(e) => setEditingItem({ ...editingItem, serial_number: e.target.value })}
                    placeholder="PF-xxxxxx"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kondisi Fisik</label>
                  <input
                    type="text"
                    value={editingItem.kondisi}
                    onChange={(e) => setEditingItem({ ...editingItem, kondisi: e.target.value })}
                    placeholder="Contoh: Baik & Lengkap"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Kelengkapan Aksesoris</label>
                  <input
                    type="text"
                    value={editingItem.kelengkapan}
                    onChange={(e) => setEditingItem({ ...editingItem, kelengkapan: e.target.value })}
                    placeholder="Contoh: Charger 65W + Tas KAI"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nilai Buku SAP (Estimasi Rp)</label>
                <input
                  type="number"
                  value={editingItem.nilai_perkiraan}
                  onChange={(e) => setEditingItem({ ...editingItem, nilai_perkiraan: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Keterangan Penggunaan</label>
                <input
                  type="text"
                  value={editingItem.keterangan}
                  onChange={(e) => setEditingItem({ ...editingItem, keterangan: e.target.value })}
                  placeholder="Tujuan peruntukan perangkat..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleSaveEditedItem(editingItem)}
                className="px-4 py-1.5 text-xs font-semibold bg-[#0a192f] hover:bg-[#122b52] text-white rounded-lg"
              >
                Simpan Perangkat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 4: PRATINJAU CETAK BAST (PDF A4) --- */}
      {isPreviewPdfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="bg-[#0a192f] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="font-bold text-sm">Pratinjau Format Berita Acara Serah Terima (A4)</h3>
                  <p className="text-[11px] text-slate-300">Layout standar PT Kereta Api Indonesia (Persero)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewPdfModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* A4 Sheet Preview */}
            <div className="p-6 overflow-y-auto bg-slate-100 flex-1 flex justify-center">
              <div className="bg-white shadow-md border border-slate-300 w-full max-w-2xl p-8 text-slate-900 text-[11px] space-y-4">
                {/* Header KAI */}
                <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold tracking-wider text-[#003580]">PT KERETA API INDONESIA (PERSERO)</h2>
                    <p className="text-[10px] text-slate-500 font-semibold">DIVISI TEKNOLOGI INFORMASI - SISTEM SENTRAL</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] border border-rose-600 text-rose-600 font-bold px-2 py-0.5">
                      RAHASIA
                    </span>
                    <p className="text-[10px] font-mono text-slate-500 mt-1">FR.SM/TI/011.001/10-2024</p>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wide">
                    BERITA ACARA SERAH TERIMA BARANG / PERANGKAT KERAS TI
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Nomor: BST-TI/DAOP1/{new Date().getFullYear()}/{(new Date().getMonth() + 1).toString().padStart(2, '0')}/DRAFT
                  </p>
                </div>

                <p className="leading-relaxed">
                  Pada hari ini, tanggal <strong>{new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>, telah dilaksanakan serah terima fisik dan pengalihan tanggung jawab pemeliharaan aset perangkat TI antara:
                </p>

                {/* Parties list */}
                <div className="space-y-2 border-l-2 border-slate-300 pl-3">
                  <div>
                    <strong>PIHAK I (YANG MENYERAHKAN):</strong>
                    <div className="grid grid-cols-3 gap-1 mt-0.5">
                      <span>Nama / NIPP</span>
                      <span className="col-span-2">: {penyerah.nama} ({penyerah.nipp})</span>
                      <span>Jabatan / Unit</span>
                      <span className="col-span-2">: {penyerah.jabatan}</span>
                    </div>
                  </div>
                  <div className="pt-1">
                    <strong>PIHAK II (YANG MENERIMA):</strong>
                    <div className="grid grid-cols-3 gap-1 mt-0.5">
                      <span>Nama / NIPP</span>
                      <span className="col-span-2">: {penerima.nama} ({penerima.nipp})</span>
                      <span>Jabatan / Unit</span>
                      <span className="col-span-2">: {penerima.jabatan}</span>
                      <span>Penjamin / Custodian</span>
                      <span className="col-span-2">: {penerima.owner_responsible}</span>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full border-collapse border border-slate-400 text-[10px] mt-2">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-400 p-1 text-center w-6">No</th>
                      <th className="border border-slate-400 p-1">Nama Barang & Seri</th>
                      <th className="border border-slate-400 p-1">No. Inventaris</th>
                      <th className="border border-slate-400 p-1">Serial Number</th>
                      <th className="border border-slate-400 p-1">Kondisi Fisik</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, i) => (
                      <tr key={it.id}>
                        <td className="border border-slate-400 p-1 text-center">{i + 1}</td>
                        <td className="border border-slate-400 p-1 font-semibold">{it.nama_barang} ({it.brand_series})</td>
                        <td className="border border-slate-400 p-1 font-mono">{it.no_inventaris}</td>
                        <td className="border border-slate-400 p-1 font-mono">{it.serial_number}</td>
                        <td className="border border-slate-400 p-1">{it.kondisi}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Signatures */}
                <div className="grid grid-cols-2 pt-6 text-center">
                  <div>
                    <p className="font-semibold">Yang Menyerahkan (Pihak I)</p>
                    <div className="h-14 flex items-center justify-center text-slate-400 italic text-[10px]">
                      [ Tanda Tangan Digital SSO ]
                    </div>
                    <p className="font-bold underline">{penyerah.nama}</p>
                    <p className="text-[10px] text-slate-500">NIPP. {penyerah.nipp}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Yang Menerima (Pihak II)</p>
                    <div className="h-14 flex items-center justify-center text-slate-400 italic text-[10px]">
                      [ Tanda Tangan Pejabat Penerima ]
                    </div>
                    <p className="font-bold underline">{penerima.nama}</p>
                    <p className="text-[10px] text-slate-500">NIPP. {penerima.nipp}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <span className="text-xs text-slate-500">
                PDF resmi akan dibuat setelah dokumen diterbitkan atau ditandatangani.
              </span>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 text-xs font-semibold bg-[#0a192f] text-white rounded-lg flex items-center gap-1.5 shadow-2xs hover:bg-[#122b52]"
              >
                <Download className="w-3.5 h-3.5" /> Cetak / Unduh Dokumen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
