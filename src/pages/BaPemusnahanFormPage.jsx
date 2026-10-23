import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FileCheck2,
  Plus,
  Trash2,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Building2,
  UserCheck,
  Calendar,
  Lock,
  ShieldCheck,
  Sparkles,
  Save,
  Check,
  Clock,
  Hammer,
  HardDrive,
  Flame,
  Scissors,
  Upload,
  Image as ImageIcon,
  Search,
  X,
  ExternalLink,
  Shield
} from 'lucide-react';
import { api } from '../services/api';
import KaiLogo from '../components/KaiLogo';

// Preset metode pemusnahan KAI
const METODE_OPTIONS = [
  {
    id: 'shredding',
    label: 'Penghancuran Fisik & Shredder (Physical Shredding & Crushing)',
    desc: 'Penghancuran mekanis menggunakan shredder industri & mesin press hidrolik hingga komponen terfragmentasi total.'
  },
  {
    id: 'degaussing',
    label: 'Degaussing Magnetik & Sanitasi Media Penyimpanan',
    desc: 'Demagnetisasi medan magnetik skala tinggi (minimal 10.000 Gauss) untuk memastikan data sensitif terhapus permanen.'
  },
  {
    id: 'dismantling',
    label: 'Scrap Dismantling & Pemotongan Logam (Cutting)',
    desc: 'Pembongkaran rangka rak, casing server, dan pemotongan sasis logam menjadi scrap besi afval.'
  },
  {
    id: 'incineration',
    label: 'Pembakaran Terkendali (High-Temperature Incineration)',
    desc: 'Pemusnahan material non-logam tertentu melalui pembakar suhu tinggi sesuai regulasi lingkungan.'
  }
];

export default function BaPemusnahanFormPage({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Modal Import dari DSP-01
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [approvedDsp01List, setApprovedDsp01List] = useState([]);
  const [isLoadingDsp01, setIsLoadingDsp01] = useState(false);

  // --- Form State ---
  // 1. Informasi Berita Acara & Pelaksanaan
  const [formData, setFormData] = useState({
    number: `BA-PMS/TI/DAOP1/${new Date().getMonth() + 1}-${new Date().getFullYear()}/00${Math.floor(10 + Math.random() * 89)}`,
    ref_number: 'PMH/0001/X/2026',
    form_code: 'FR.SM/TI/012.001',
    tanggal_pelaksanaan: new Date().toISOString().split('T')[0],
    hari_pelaksanaan: 'Kamis',
    waktu_pelaksanaan: '10:00 WIB',
    lokasi: 'Workshop TI Balai Yasa Manggarai',
    wilayah: 'DAOP 1 Jakarta',
    metode_code: 'shredding',
    metode_pemusnahan: 'Penghancuran Fisik & Shredder (Physical Shredding & Crushing)',
    keterangan_metode: 'Penghancuran mekanis menggunakan shredder industri & mesin press hidrolik hingga komponen terfragmentasi total.',
    sanitasi_data_selesai: true,
    cek_kerusakan_permanen: true,
    cek_disaksikan_polsuska: true,
    signature_pin: '123456',
  });

  // 2. Komite & Saksi-Saksi
  const [pelaksana, setPelaksana] = useState({
    nama: user?.name || 'Ahmad Fauzi Setiawan',
    nipp: user?.nip || '54892',
    jabatan: user?.roleLabel || 'Spv Operasional Infrastruktur TI',
    unit_kerja: user?.location || 'Unit TI DAOP 1 Jakarta',
  });

  const [saksi1, setSaksi1] = useState({
    nama: 'Kapten (Purn) Sudirman',
    nipp: '41920',
    jabatan: 'Kepala Pengamanan & Polsuska Daop 1',
    unit_kerja: 'Unit Pengamanan Daop 1 Jakarta',
  });

  const [saksi2, setSaksi2] = useState({
    nama: 'Dyah Retno Wulandari, S.E.',
    nipp: '62104',
    jabatan: 'Auditor Madya Pengawasan Intern (SPI)',
    unit_kerja: 'Satuan Pengawasan Intern KAI',
  });

  const [penanggungJawab, setPenanggungJawab] = useState({
    nama: 'Ir. Bambang Suryo Pratama, M.T.',
    nipp: '48901',
    jabatan: 'Vice President IT Operation',
    unit_kerja: 'Kantor Pusat KAI Bandung',
  });

  // 3. Rincian Inventaris yang Dimusnahkan
  const [items, setItems] = useState([
    {
      id: 1,
      nama_aset: 'Hard Disk Enterprise SAS 600GB 15k RPM',
      no_inventaris: 'AST-TI-2018-0912',
      serial_number: 'SN-WD-8812901-KAI',
      jumlah: 4,
      satuan: 'Unit',
      kategori: 'Penyimpanan (Storage)',
      kondisi_awal: 'Bad Sector Berat & Usia > 5 Th',
      hasil_pemusnahan: 'Degaussed Magnetik & Piringan Hancur Shredder',
    },
    {
      id: 2,
      nama_aset: 'Server Rak Dell PowerEdge R730',
      no_inventaris: 'AST-TI-2017-0419',
      serial_number: 'SN-DELL-R730-9921',
      jumlah: 1,
      satuan: 'Unit',
      kategori: 'Perangkat Keras (Hardware)',
      kondisi_awal: 'Mainboard korsleting & komponen langka',
      hasil_pemusnahan: 'Mainboard dipatahkan, Casing dipotong scrap',
    }
  ]);

  // 4. Dokumentasi Foto
  const [fotoPreviews, setFotoPreviews] = useState({
    sebelum: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&auto=format&fit=crop&q=80',
    proses: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
    sesudah: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&auto=format&fit=crop&q=80',
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load existing document if edit mode
  useEffect(() => {
    if (!isEditMode) return;

    const loadDoc = async () => {
      setIsLoading(true);
      try {
        const res = await api.getDocument(id).catch(() => null);
        const docData = res?.document || res;
        if (docData) {
          setFormData({
            number: docData.number || docData.nomor,
            ref_number: docData.data?.nomor_dsp01 || docData.ref_number || 'PMH/0001/X/2026',
            form_code: 'FR.SM/TI/012.001',
            tanggal_pelaksanaan: docData.data?.tanggal_pelaksanaan || docData.created_at?.split('T')[0] || '',
            hari_pelaksanaan: docData.data?.hari_pelaksanaan || 'Kamis',
            waktu_pelaksanaan: docData.data?.waktu_pelaksanaan || '10:00 WIB',
            lokasi: docData.data?.lokasi || '',
            wilayah: docData.data?.wilayah || 'DAOP 1 Jakarta',
            metode_code: docData.data?.metode_code || 'shredding',
            metode_pemusnahan: docData.data?.metode_pemusnahan || 'Penghancuran Fisik',
            keterangan_metode: docData.data?.keterangan_metode || '',
            sanitasi_data_selesai: docData.data?.sanitasi_data_selesai ?? true,
            cek_kerusakan_permanen: docData.data?.cek_kerusakan_permanen ?? true,
            cek_disaksikan_polsuska: docData.data?.cek_disaksikan_polsuska ?? true,
            signature_pin: '123456',
          });

          if (docData.data?.pelaksana) setPelaksana(docData.data.pelaksana);
          if (docData.data?.saksi_1) setSaksi1(docData.data.saksi_1);
          if (docData.data?.saksi_2) setSaksi2(docData.data.saksi_2);
          if (docData.data?.penanggung_jawab) setPenanggungJawab(docData.data.penanggung_jawab);
          if (docData.items || docData.data?.items) {
            setItems(docData.items || docData.data.items);
          }
        }
      } catch (err) {
        setErrorMessage('Gagal memuat dokumen berita acara.');
      } finally {
        setIsLoading(false);
      }
    };

    loadDoc();
  }, [id, isEditMode]);

  // Load Approved DSP-01 Documents for Import
  const handleOpenImportModal = async () => {
    setIsImportModalOpen(true);
    setIsLoadingDsp01(true);
    try {
      const res = await api.getDocuments({ type: 'dsp01' }).catch(() => null);
      if (res?.data && res.data.length > 0) {
        setApprovedDsp01List(res.data);
      } else {
        // Fallback sample approved DSP-01
        setApprovedDsp01List([
          {
            id: 1,
            number: 'PMH/0001/X/2026',
            status: 'approved',
            requester_name: 'Fajar Prasetyo',
            requester_unit: 'Kepala Stasiun Gambir',
            date: '24 Okt 2025',
            items: [
              { nama_aset: 'Server Dell PowerEdge R740', id_aset: '104-KAI-SRV-2018', jumlah: 1, satuan: 'Unit', kategori: 'Hardware', alasan: 'Kerusakan fatal motherboard' },
              { nama_aset: 'Cisco Catalyst 3850 48-Port PoE', id_aset: 'MAC-7721-CC-081', jumlah: 2, satuan: 'Unit', kategori: 'Network', alasan: 'Port modul korsleting sambaran petir' }
            ]
          },
          {
            id: 2,
            number: 'PMH/0002/X/2026',
            status: 'approved',
            requester_name: 'Ezar Athilla',
            requester_unit: 'Spv Jaringan TI DAOP 1',
            date: '22 Okt 2025',
            items: [
              { nama_aset: 'Hard Disk SAS 600GB Server Juanda', id_aset: 'AST-HDD-2018-091', jumlah: 6, satuan: 'Unit', kategori: 'Storage', alasan: 'Bad sector masif' },
              { nama_aset: 'UPS Liebert GXT4 3000VA', id_aset: 'UPS-LIB-3000-09', jumlah: 1, satuan: 'Unit', kategori: 'Hardware', alasan: 'Baterai bocor & inverter rusak' }
            ]
          }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingDsp01(false);
    }
  };

  const handleSelectDsp01 = (dspDoc) => {
    setFormData(prev => ({
      ...prev,
      ref_number: dspDoc.number || `PMH/000${dspDoc.id}/X/2026`,
      wilayah: dspDoc.requester_unit || prev.wilayah
    }));

    if (dspDoc.items && dspDoc.items.length > 0) {
      const mappedItems = dspDoc.items.map((it, idx) => ({
        id: Date.now() + idx,
        nama_aset: it.nama_aset || it.nama || 'Aset TI Terkait',
        no_inventaris: it.id_aset || it.no_inventaris || `AST-KAI-${Date.now()}-${idx + 1}`,
        serial_number: it.sn || it.serial_number || `SN-${idx + 101}`,
        jumlah: it.jumlah || 1,
        satuan: it.satuan || 'Unit',
        kategori: it.kategori || it.jenis_aset || 'Hardware',
        kondisi_awal: it.alasan_pemusnahan || it.alasan || 'Rusak Berat & Habis Masa Teknis',
        hasil_pemusnahan: 'Hancur Total & Dipatahkan (Scrap Afval)',
      }));
      setItems(mappedItems);
    }

    setIsImportModalOpen(false);
    showToast(`Data aset berhasil diimpor dari Permohonan Pemusnahan ${dspDoc.number}`);
  };

  // Handle Item Changes
  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      {
        id: Date.now(),
        nama_aset: '',
        no_inventaris: '',
        serial_number: '',
        jumlah: 1,
        satuan: 'Unit',
        kategori: 'Perangkat Keras (Hardware)',
        kondisi_awal: 'Rusak total & tidak dapat diperbaiki',
        hasil_pemusnahan: 'Dihancurkan fisik (Scrap)',
      }
    ]);
  };

  const handleItemChange = (idx, field, val) => {
    setItems(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleRemoveItem = (idx) => {
    if (items.length <= 1) {
      alert('Minimal wajib ada 1 item aset yang dimusnahkan.');
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  // Handle Metode Selection
  const handleMetodeSelect = (metodeId) => {
    const selected = METODE_OPTIONS.find(m => m.id === metodeId);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        metode_code: selected.id,
        metode_pemusnahan: selected.label,
        keterangan_metode: selected.desc
      }));
    }
  };

  // Handle Submission
  const handleSubmit = async (submitNow = true) => {
    if (items.some(it => !it.nama_aset.trim())) {
      setErrorMessage('Mohon lengkapi nama semua aset yang dimusnahkan.');
      window.scrollTo({ top: 400, behavior: 'smooth' });
      return;
    }

    if (submitNow && !formData.signature_pin) {
      setErrorMessage('Masukkan PIN Otorisasi KAI Pass Anda untuk menandatangani Berita Acara.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload = {
      type: 'dsp02',
      submit: submitNow,
      status: submitNow ? 'pending' : 'draft',
      number: formData.number,
      data: {
        nomor_dsp01: formData.ref_number,
        form_code: formData.form_code,
        tanggal_pelaksanaan: formData.tanggal_pelaksanaan,
        hari_pelaksanaan: formData.hari_pelaksanaan,
        waktu_pelaksanaan: formData.waktu_pelaksanaan,
        lokasi: formData.lokasi,
        wilayah: formData.wilayah,
        metode_code: formData.metode_code,
        metode_pemusnahan: formData.metode_pemusnahan,
        keterangan_metode: formData.keterangan_metode,
        sanitasi_data_selesai: formData.sanitasi_data_selesai,
        cek_kerusakan_permanen: formData.cek_kerusakan_permanen,
        cek_disaksikan_polsuska: formData.cek_disaksikan_polsuska,
        pelaksana: {
          ...pelaksana,
          signed: submitNow,
          signed_at: submitNow ? new Date().toISOString() : null,
        },
        saksi_1: saksi1,
        saksi_2: saksi2,
        penanggung_jawab: penanggungJawab,
        items,
        foto_sebelum: true,
        foto_proses: true,
        foto_sesudah: true,
      },
      items: items.map(it => ({
        nama_aset: it.nama_aset,
        id_aset: it.no_inventaris || it.serial_number || 'INV-REF',
        serial_number: it.serial_number,
        jumlah: it.jumlah,
        satuan: it.satuan,
        kategori: it.kategori,
        kondisi: it.kondisi_awal,
        hasil_pemusnahan: it.hasil_pemusnahan,
      }))
    };

    try {
      let createdDoc = null;
      try {
        if (isEditMode) {
          createdDoc = await api.updateDocument(id, payload);
        } else {
          createdDoc = await api.createDocument(payload);
        }
      } catch (err) {
        // Fallback local save if API backend endpoint is simulated
        console.warn('API sync fallback to local storage:', err);
      }

      // Save to localStorage as persistent fallback
      const currentSaved = JSON.parse(localStorage.getItem('sipakai_dsp02_docs') || '[]');
      const newDocRecord = {
        id: isEditMode ? Number(id) : Date.now(),
        ...payload,
        status_label: submitNow ? 'Menunggu TTE Saksi & VP' : 'Draf Pelaksanaan',
        total_items: items.reduce((acc, it) => acc + (Number(it.jumlah) || 1), 0),
        hari_pelaksanaan: formData.hari_pelaksanaan,
        tanggal_pelaksanaan: formData.tanggal_pelaksanaan,
        waktu_pelaksanaan: formData.waktu_pelaksanaan,
        lokasi: formData.lokasi,
        wilayah: formData.wilayah,
        metode_pemusnahan: formData.metode_pemusnahan,
        pelaksana: payload.data.pelaksana,
        saksi_1: payload.data.saksi_1,
        saksi_2: payload.data.saksi_2,
        penanggung_jawab: payload.data.penanggung_jawab,
        can_sign: true,
      };

      const updatedList = isEditMode
        ? currentSaved.map(d => d.id === Number(id) ? newDocRecord : d)
        : [newDocRecord, ...currentSaved];

      localStorage.setItem('sipakai_dsp02_docs', JSON.stringify(updatedList));

      showToast(submitNow ? 'Berita Acara Pemusnahan berhasil diterbitkan dan diajukan ke Saksi!' : 'Draf Berita Acara berhasil disimpan.');

      setTimeout(() => {
        navigate(submitNow ? `/berita-acara-pemusnahan/${newDocRecord.id}` : '/berita-acara-pemusnahan');
      }, 1200);

    } catch (err) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat memproses Berita Acara.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-[#003580] mb-2" />
        <p className="text-xs font-semibold">Memuat data Berita Acara Pemusnahan...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-24 select-none">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/berita-acara-pemusnahan')}
            className="p-2 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-600 transition-colors shadow-2xs"
            title="Kembali ke Daftar"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-orange-50 text-orange-700 border border-orange-200 uppercase">
                FR.SM/TI/012.001 &bull; DSP-02
              </span>
              <span className="text-xs text-slate-400">&bull; Standar Pelaksanaan Fisik KAI</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              {isEditMode ? 'Edit Berita Acara Pemusnahan' : 'Formulir Berita Acara Pemusnahan (DSP-02)'}
            </h1>
          </div>
        </div>

        {/* Quick Import DSP-01 Button */}
        <button
          type="button"
          onClick={handleOpenImportModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-700 to-[#003580] hover:from-blue-800 hover:to-[#092653] text-white text-xs font-bold rounded-xl shadow-xs transition-all"
        >
          <Sparkles className="w-4 h-4 text-orange-400" />
          <span>Impor Data Permohonan (DSP-01)</span>
        </button>
      </div>

      {/* Error banner */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-xs font-semibold animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="flex-1">{errorMessage}</span>
          <button type="button" onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-800">✕</button>
        </div>
      )}

      {/* SECTION 1: Nomor Dokumen & Jadwal Pelaksanaan */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#003580] text-white flex items-center justify-center font-bold text-xs">
              1
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Dasar Pelaksanaan & Jadwal Eksekusi</h2>
              <p className="text-[11px] text-slate-500">Legalitas nomor dokumen dan waktu pelaksanaan pemusnahan di lapangan</p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-400 font-semibold">BAGIAN 01 / 06</span>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Nomor Berita Acara (BA-PMS) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#003580]"
              placeholder="BA-PMS/TI/DAOP1/10-2026/0014"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Nomor Rujukan Permohonan (DSP-01) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.ref_number}
              onChange={(e) => setFormData({ ...formData, ref_number: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#003580]"
              placeholder="PMH/0001/X/2026"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Hari Pelaksanaan <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.hari_pelaksanaan}
              onChange={(e) => setFormData({ ...formData, hari_pelaksanaan: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#003580]"
            >
              <option value="Senin">Senin</option>
              <option value="Selasa">Selasa</option>
              <option value="Rabu">Rabu</option>
              <option value="Kamis">Kamis</option>
              <option value="Jumat">Jumat</option>
              <option value="Sabtu">Sabtu</option>
              <option value="Minggu">Minggu</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Tanggal Pelaksanaan Pemusnahan <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={formData.tanggal_pelaksanaan}
              onChange={(e) => setFormData({ ...formData, tanggal_pelaksanaan: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#003580]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Waktu / Jam Eksekusi (WIB) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.waktu_pelaksanaan}
              onChange={(e) => setFormData({ ...formData, waktu_pelaksanaan: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#003580]"
              placeholder="10:00 WIB"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Wilayah / Daerah Operasi (Daop) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.wilayah}
              onChange={(e) => setFormData({ ...formData, wilayah: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#003580]"
              placeholder="DAOP 1 Jakarta"
            />
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Lokasi / Tempat Pemusnahan Fisik Dilaksanakan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.lokasi}
              onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#003580]"
              placeholder="Contoh: Workshop TI Balai Yasa Manggarai / Depo Sarana Stasiun Tugu"
              required
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: Metode Pemusnahan & Sanitasi Keamanan Data */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#f05a22] text-white flex items-center justify-center font-bold text-xs">
              2
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Metode Pemusnahan & Sanitasi Data Sensitif</h2>
              <p className="text-[11px] text-slate-500">Standar teknis eksekusi dan jaminan data perusahaan tidak dapat direkonstruksi</p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-400 font-semibold">BAGIAN 02 / 06</span>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2.5">
              Pilih Metode Pemusnahan Utama <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {METODE_OPTIONS.map((m) => {
                const isSelected = formData.metode_code === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => handleMetodeSelect(m.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#f05a22] bg-orange-50/40 ring-1 ring-[#f05a22]'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center ${isSelected ? 'border-[#f05a22] bg-[#f05a22]' : 'border-slate-300'}`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{m.label}</h4>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{m.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Catatan Teknis Prosedur Eksekusi
            </label>
            <textarea
              rows={2}
              value={formData.keterangan_metode}
              onChange={(e) => setFormData({ ...formData, keterangan_metode: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#003580]"
              placeholder="Rincian prosedur eksekusi keselamatan dan penanganan limbah elektronik B3..."
            />
          </div>

          {/* Compliance Checkboxes */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Pernyataan Kepatuhan Tata Kelola & Keamanan Informasi KAI</span>
            </h4>

            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 select-none">
              <input
                type="checkbox"
                checked={formData.sanitasi_data_selesai}
                onChange={(e) => setFormData({ ...formData, sanitasi_data_selesai: e.target.checked })}
                className="mt-0.5 rounded text-[#003580] focus:ring-[#003580]"
              />
              <span>
                <strong>Sanitasi Data Selesai:</strong> Seluruh media penyimpanan magnetik/elektronik (HDD, SSD, Flash, Tape) telah disanitasi atau dihancurkan fisiknya sehingga data dinas KAI tidak dapat dipulihkan.
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 select-none">
              <input
                type="checkbox"
                checked={formData.cek_kerusakan_permanen}
                onChange={(e) => setFormData({ ...formData, cek_kerusakan_permanen: e.target.checked })}
                className="mt-0.5 rounded text-[#003580] focus:ring-[#003580]"
              />
              <span>
                <strong>Kerusakan Permanen:</strong> Kondisi fisik aset dipastikan rusak total dan tidak dapat direparasi atau difungsikan kembali untuk keperluan apapun.
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 select-none">
              <input
                type="checkbox"
                checked={formData.cek_disaksikan_polsuska}
                onChange={(e) => setFormData({ ...formData, cek_disaksikan_polsuska: e.target.checked })}
                className="mt-0.5 rounded text-[#003580] focus:ring-[#003580]"
              />
              <span>
                <strong>Saksi Independen:</strong> Proses eksekusi disaksikan secara langsung di lokasi oleh perwakilan Pengamanan (Polsuska) dan Pengawasan Intern (SPI) / Keuangan.
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* SECTION 3: Komite Pemusnahan & Para Saksi */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#003580] text-white flex items-center justify-center font-bold text-xs">
              3
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Pihak Komite Pelaksana & Saksi-Saksi</h2>
              <p className="text-[11px] text-slate-500">Pihak yang bertanggung jawab atas eksekusi dan penandatanganan Berita Acara</p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-400 font-semibold">BAGIAN 03 / 06</span>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pihak 1: Pelaksana Eksekusi */}
          <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-100 space-y-3">
            <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
              <h4 className="text-xs font-bold text-[#003580] flex items-center gap-1.5">
                <UserCheck className="w-4 h-4" />
                <span>Pihak I &bull; Pelaksana Eksekusi TI</span>
              </h4>
              <span className="text-[10px] font-extrabold uppercase bg-blue-100 text-[#003580] px-2 py-0.5 rounded">
                Penanggung Jawab Teknis
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
              <input
                type="text"
                value={pelaksana.nama}
                onChange={(e) => setPelaksana({ ...pelaksana, nama: e.target.value })}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">NIPP / No. Pegawai</label>
                <input
                  type="text"
                  value={pelaksana.nipp}
                  onChange={(e) => setPelaksana({ ...pelaksana, nipp: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Jabatan Dinas</label>
                <input
                  type="text"
                  value={pelaksana.jabatan}
                  onChange={(e) => setPelaksana({ ...pelaksana, jabatan: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Unit Kerja / Kedudukan</label>
              <input
                type="text"
                value={pelaksana.unit_kerja}
                onChange={(e) => setPelaksana({ ...pelaksana, unit_kerja: e.target.value })}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Saksi 1: Pengamanan / Polsukka */}
          <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-100 space-y-3">
            <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
              <h4 className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                <span>Saksi I &bull; Pengamanan / Polsuska</span>
              </h4>
              <span className="text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                Saksi Keamanan
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
              <input
                type="text"
                value={saksi1.nama}
                onChange={(e) => setSaksi1({ ...saksi1, nama: e.target.value })}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">NIPP / NRP</label>
                <input
                  type="text"
                  value={saksi1.nipp}
                  onChange={(e) => setSaksi1({ ...saksi1, nipp: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Jabatan Dinas</label>
                <input
                  type="text"
                  value={saksi1.jabatan}
                  onChange={(e) => setSaksi1({ ...saksi1, jabatan: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Unit Kerja / Kedudukan</label>
              <input
                type="text"
                value={saksi1.unit_kerja}
                onChange={(e) => setSaksi1({ ...saksi1, unit_kerja: e.target.value })}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Saksi 2: Pengawasan Intern (SPI) / Keuangan */}
          <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-100 space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
              <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                <span>Saksi II &bull; Pengawasan Intern (SPI) / Keuangan</span>
              </h4>
              <span className="text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                Saksi Audit & Kepatuhan
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
              <input
                type="text"
                value={saksi2.nama}
                onChange={(e) => setSaksi2({ ...saksi2, nama: e.target.value })}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">NIPP</label>
                <input
                  type="text"
                  value={saksi2.nipp}
                  onChange={(e) => setSaksi2({ ...saksi2, nipp: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Jabatan Dinas</label>
                <input
                  type="text"
                  value={saksi2.jabatan}
                  onChange={(e) => setSaksi2({ ...saksi2, jabatan: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Unit Kerja / Kedudukan</label>
              <input
                type="text"
                value={saksi2.unit_kerja}
                onChange={(e) => setSaksi2({ ...saksi2, unit_kerja: e.target.value })}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Mengetahui: Vice President IT Operation */}
          <div className="bg-slate-100/70 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#003580]" />
                <span>Mengetahui &bull; Pimpinan / VP TI</span>
              </h4>
              <span className="text-[10px] font-extrabold uppercase bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                Pejabat Otorisator
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
              <input
                type="text"
                value={penanggungJawab.nama}
                onChange={(e) => setPenanggungJawab({ ...penanggungJawab, nama: e.target.value })}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">NIPP</label>
                <input
                  type="text"
                  value={penanggungJawab.nipp}
                  onChange={(e) => setPenanggungJawab({ ...penanggungJawab, nipp: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Jabatan Dinas</label>
                <input
                  type="text"
                  value={penanggungJawab.jabatan}
                  onChange={(e) => setPenanggungJawab({ ...penanggungJawab, jabatan: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Unit Kerja / Kedudukan</label>
              <input
                type="text"
                value={penanggungJawab.unit_kerja}
                onChange={(e) => setPenanggungJawab({ ...penanggungJawab, unit_kerja: e.target.value })}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: Daftar Rincian Barang yang Dimusnahkan */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#003580] text-white flex items-center justify-center font-bold text-xs">
              4
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Rincian Inventaris Barang yang Dimusnahkan</h2>
              <p className="text-[11px] text-slate-500">Tabel inventaris perangkat yang dieksekusi secara fisik di lapangan</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddItem}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f05a22] hover:bg-[#d94e1b] text-white rounded-lg text-xs font-bold transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Baris</span>
          </button>
        </div>

        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <th className="py-2.5 px-3 font-bold w-10">No</th>
                  <th className="py-2.5 px-3 font-bold min-w-[200px]">Nama Aset TI</th>
                  <th className="py-2.5 px-3 font-bold min-w-[150px]">No. Seri / No. Inventaris SAP</th>
                  <th className="py-2.5 px-3 font-bold w-24">Jumlah</th>
                  <th className="py-2.5 px-3 font-bold min-w-[140px]">Kategori</th>
                  <th className="py-2.5 px-3 font-bold min-w-[180px]">Kondisi Awal</th>
                  <th className="py-2.5 px-3 font-bold min-w-[180px]">Hasil Pemusnahan</th>
                  <th className="py-2.5 px-3 font-bold w-12 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        value={item.nama_aset}
                        onChange={(e) => handleItemChange(idx, 'nama_aset', e.target.value)}
                        placeholder="Contoh: Server HP ProLiant DL380"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-[#003580]"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        value={item.serial_number || item.no_inventaris}
                        onChange={(e) => {
                          handleItemChange(idx, 'serial_number', e.target.value);
                          handleItemChange(idx, 'no_inventaris', e.target.value);
                        }}
                        placeholder="SN-XXX / AST-XXX"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-[#003580]"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          value={item.jumlah}
                          onChange={(e) => handleItemChange(idx, 'jumlah', e.target.value)}
                          className="w-14 px-2 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-bold text-center"
                        />
                        <span className="text-[11px] text-slate-500 font-medium">Unit</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={item.kategori}
                        onChange={(e) => handleItemChange(idx, 'kategori', e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-medium"
                      >
                        <option value="Perangkat Keras (Hardware)">Hardware/Server</option>
                        <option value="Jaringan (Network)">Jaringan (Network)</option>
                        <option value="Penyimpanan (Storage)">Penyimpanan (Storage)</option>
                        <option value="Periferal">Periferal / Monitor</option>
                        <option value="Lain-lain">Lain-lain</option>
                      </select>
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        value={item.kondisi_awal}
                        onChange={(e) => handleItemChange(idx, 'kondisi_awal', e.target.value)}
                        placeholder="Rusak total / terbakar"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-700"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        value={item.hasil_pemusnahan}
                        onChange={(e) => handleItemChange(idx, 'hasil_pemusnahan', e.target.value)}
                        placeholder="Hancur shredder / degaussed"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-700 font-semibold text-emerald-800"
                      />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="Hapus baris"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Total Item Terdaftar: <strong>{items.length} Aset</strong></span>
            <span>Total Fisik Dieksekusi: <strong>{items.reduce((acc, it) => acc + (Number(it.jumlah) || 1), 0)} Unit</strong></span>
          </div>
        </div>
      </div>

      {/* SECTION 5: Dokumentasi Bukti Foto Pelaksanaan */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#003580] text-white flex items-center justify-center font-bold text-xs">
              5
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Dokumentasi Bukti Foto Pelaksanaan</h2>
              <p className="text-[11px] text-slate-500">Lampiran bukti visual sebelum, selama proses, dan sesudah pemusnahan</p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-400 font-semibold">BAGIAN 05 / 06</span>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Foto Sebelum */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">1. Foto Sebelum Pemusnahan</label>
            <div className="aspect-video w-full rounded-xl border border-slate-200 overflow-hidden bg-slate-100 relative group">
              <img
                src={fotoPreviews.sebelum}
                alt="Sebelum Pemusnahan"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-xs font-bold bg-black/60 px-3 py-1 rounded-full">Kondisi Utuh Rusak</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">Tampilan perangkat sebelum dieksekusi pemusnahan fisik.</p>
          </div>

          {/* Foto Proses */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">2. Foto Proses Eksekusi</label>
            <div className="aspect-video w-full rounded-xl border border-slate-200 overflow-hidden bg-slate-100 relative group">
              <img
                src={fotoPreviews.proses}
                alt="Proses Pemusnahan"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-xs font-bold bg-black/60 px-3 py-1 rounded-full">Saat Shredder / Mesin Press</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">Dokumentasi proses saat dihancurkan bersama saksi.</p>
          </div>

          {/* Foto Sesudah */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">3. Foto Setelah Pemusnahan</label>
            <div className="aspect-video w-full rounded-xl border border-slate-200 overflow-hidden bg-slate-100 relative group">
              <img
                src={fotoPreviews.sesudah}
                alt="Setelah Pemusnahan"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-xs font-bold bg-black/60 px-3 py-1 rounded-full">Puing Scrap / Hancur Total</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">Puing sisa scrap yang siap dimutasi ke logistik afval.</p>
          </div>
        </div>
      </div>

      {/* SECTION 6: Klausul Berita Acara & PIN TTE Pengesahan */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#003580] text-white flex items-center justify-center font-bold text-xs">
              6
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Pernyataan Hukum & Tanda Tangan Elektronik</h2>
              <p className="text-[11px] text-slate-500">Klausul formal dan pembubuhan TTE BSrE KAI Pass Pelaksana</p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-400 font-semibold">BAGIAN 06 / 06</span>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed font-serif">
            <p className="mb-2">
              <strong>KLAUSUL PERNYATAAN BERITA ACARA:</strong>
            </p>
            <p>
              "Pada hari ini, <strong>{formData.hari_pelaksanaan}</strong>, tanggal <strong>{formData.tanggal_pelaksanaan}</strong>, bertempat di <strong>{formData.lokasi}</strong>, telah dilakukan pemusnahan secara fisik terhadap barang inventaris/aset teknologi informasi PT Kereta Api Indonesia (Persero) sebagaimana tercantum dalam rincian Berita Acara ini. Pemusnahan dilakukan dengan metode <strong>{formData.metode_pemusnahan}</strong> yang menjamin bahwa seluruh data dinas dan komponen fisik tidak dapat direkonstruksi atau digunakan kembali."
            </p>
            <p className="mt-2">
              "Berita Acara ini dibuat dengan sebenarnya dalam rangkap secukupnya dan ditandatangani secara elektronik (BSrE KAI) untuk menjadi dasar hukum proses Penghapusan Aset (DSP-03) dari buku aktiva tetap SAP."
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-orange-50/50 border border-orange-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#f05a22] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">PIN TTE KAI Pass Pelaksana</h4>
                <p className="text-[11px] text-slate-500">Masukkan 6-digit PIN untuk membubuhkan tanda tangan elektronik resmi</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="password"
                maxLength={6}
                value={formData.signature_pin}
                onChange={(e) => setFormData({ ...formData, signature_pin: e.target.value })}
                className="w-32 px-3 py-2 bg-white border border-slate-300 rounded-lg text-center text-sm font-mono tracking-widest font-black focus:outline-hidden focus:ring-2 focus:ring-[#f05a22]"
                placeholder="••••••"
              />
              <span className="text-[11px] text-slate-400 font-semibold">(Default: 123456)</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/berita-acara-pemusnahan')}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              Batal
            </button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit(false)}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4 text-slate-400" />
                <span>Simpan Draf</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit(true)}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-[#f05a22] hover:bg-[#d94e1b] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menerbitkan Berita Acara...</span>
                  </>
                ) : (
                  <>
                    <FileCheck2 className="w-4 h-4" />
                    <span>Terbitkan & Ajukan ke Saksi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Import dari Permohonan Pemusnahan (DSP-01) */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#f05a22] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Pilih Dokumen Permohonan (DSP-01)</h3>
                  <p className="text-[11px] text-slate-500">Impor daftar aset yang telah disetujui untuk dimusnahkan</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoadingDsp01 ? (
              <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#003580]" />
                Memuat daftar permohonan pemusnahan...
              </div>
            ) : approvedDsp01List.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                Tidak ada dokumen permohonan DSP-01 yang tersedia.
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
                {approvedDsp01List.map((dsp) => (
                  <div
                    key={dsp.id}
                    onClick={() => handleSelectDsp01(dsp)}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-[#f05a22] hover:bg-orange-50/20 cursor-pointer transition-all flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#003580]">{dsp.number || `PMH/000${dsp.id}/X/2026`}</span>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.2 rounded font-bold border border-emerald-200">
                          Disetujui
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-semibold mt-1">
                        Pemohon: {dsp.requester_name} ({dsp.requester_unit})
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {dsp.items?.length || 2} Perangkat Aset TI siap dimusnahkan
                      </p>
                    </div>

                    <button
                      type="button"
                      className="px-3 py-1.5 bg-[#003580] text-white rounded-lg text-xs font-bold shrink-0 hover:bg-[#092653] transition-colors"
                    >
                      Pilih Dokumen
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
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
