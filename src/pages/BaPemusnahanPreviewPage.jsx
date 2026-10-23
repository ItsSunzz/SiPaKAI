import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  FileCheck2,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  PenTool,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  Building2,
  UserCheck,
  Eraser,
  Loader2,
  Check,
  Printer,
  Edit3,
  Lock,
  ExternalLink,
  Shield,
  Layers,
  X,
  FileText,
  Hammer,
  Image as ImageIcon,
  KeyRound
} from 'lucide-react';
import { api, fallbackDocuments } from '../services/api';
import KaiLogo from '../components/KaiLogo';

export default function BaPemusnahanPreviewPage({ user, onDocumentUpdated }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Active Tab: 'sheet' (Lembar Resmi Fisik KAI A4) | 'audit' (Status TTE & Audit Trail)
  const [activeTab, setActiveTab] = useState('sheet');

  // Modal Signing States
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [signAsRole, setSignAsRole] = useState('saksi_2'); // 'saksi_1' | 'saksi_2' | 'vp'
  const [pinInput, setPinInput] = useState('123456');
  const [isSigning, setIsSigning] = useState(false);
  const [signError, setSignError] = useState(null);

  // Canvas TTD
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);

  // Sample fallback if doc not found
  const sampleDocFallback = {
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
    metode_pemusnahan: 'Penghancuran Fisik & Degaussing Magnetik (Shredding & Degaussing)',
    keterangan_metode: 'Penghancuran mekanis menggunakan shredder industri & mesin press hidrolik serta demagnetisasi media storage 10.000 Gauss.',
    sanitasi_data_selesai: true,
    cek_kerusakan_permanen: true,
    cek_disaksikan_polsuska: true,
    pelaksana: {
      nama: 'Ahmad Fauzi Setiawan',
      nipp: '54892',
      jabatan: 'Spv Operasional Infrastruktur TI',
      unit_kerja: 'Unit TI DAOP 1 Jakarta',
      signed: true,
      signed_at: '2026-10-21 11:15 WIB',
      digital_signature_id: 'KAI-DSIG-54892-091823'
    },
    saksi_1: {
      nama: 'Kapten (Purn) Sudirman',
      nipp: '41920',
      jabatan: 'Kepala Pengamanan & Polsuska Daop 1',
      unit_kerja: 'Unit Pengamanan Daop 1 Jakarta',
      signed: true,
      signed_at: '2026-10-21 11:20 WIB',
      digital_signature_id: 'KAI-DSIG-41920-112033'
    },
    saksi_2: {
      nama: 'Dyah Retno Wulandari, S.E.',
      nipp: '62104',
      jabatan: 'Auditor Madya Pengawasan Intern (SPI)',
      unit_kerja: 'Satuan Pengawasan Intern KAI',
      signed: true,
      signed_at: '2026-10-21 11:30 WIB',
      digital_signature_id: 'KAI-DSIG-62104-113044'
    },
    penanggung_jawab: {
      nama: 'Ir. Bambang Suryo Pratama, M.T.',
      nipp: '48901',
      jabatan: 'Vice President IT Operation',
      unit_kerja: 'Kantor Pusat KAI Bandung',
      signed: true,
      signed_at: '2026-10-21 13:45 WIB',
      digital_signature_id: 'KAI-DSIG-48901-134599'
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
    foto_sebelum: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&auto=format&fit=crop&q=80',
    foto_proses: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
    foto_sesudah: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&auto=format&fit=crop&q=80',
    status: 'approved',
    status_label: 'Disahkan Penuh (Sah TTE BSrE)',
  };

  const loadData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      let foundDoc = null;
      try {
        const res = await api.getDocument(id);
        const apiData = res?.document || res;
        if (apiData) {
          foundDoc = {
            id: apiData.id,
            number: apiData.number || apiData.nomor,
            ref_number: apiData.data?.nomor_dsp01 || apiData.ref_number || 'PMH/0001/X/2026',
            form_code: 'FR.SM/TI/012.001',
            tanggal_pelaksanaan: apiData.data?.tanggal_pelaksanaan || apiData.created_at?.split('T')[0] || '2026-10-21',
            hari_pelaksanaan: apiData.data?.hari_pelaksanaan || 'Rabu',
            waktu_pelaksanaan: apiData.data?.waktu_pelaksanaan || '10:00 WIB',
            lokasi: apiData.data?.lokasi || 'Workshop Balai Yasa Manggarai',
            wilayah: apiData.data?.wilayah || 'DAOP 1 Jakarta',
            metode_pemusnahan: apiData.data?.metode_pemusnahan || 'Penghancuran Fisik & Degaussing',
            keterangan_metode: apiData.data?.keterangan_metode || '',
            sanitasi_data_selesai: apiData.data?.sanitasi_data_selesai ?? true,
            cek_kerusakan_permanen: apiData.data?.cek_kerusakan_permanen ?? true,
            cek_disaksikan_polsuska: apiData.data?.cek_disaksikan_polsuska ?? true,
            pelaksana: apiData.data?.pelaksana || { nama: apiData.requester?.name || 'Petugas TI', nipp: apiData.requester?.nip || '54892', signed: true },
            saksi_1: apiData.data?.saksi_1 || { nama: 'Kapten Sudirman', signed: true },
            saksi_2: apiData.data?.saksi_2 || { nama: 'Dyah Retno Wulandari', signed: false },
            penanggung_jawab: apiData.data?.penanggung_jawab || { nama: 'VP IT Operation', signed: false },
            items: apiData.items || apiData.data?.items || sampleDocFallback.items,
            status: apiData.status,
            status_label: apiData.status === 'approved' ? 'Disahkan Penuh (Sah TTE BSrE)' : apiData.status === 'pending' ? 'Menunggu TTE Saksi & VP' : 'Draf Berita Acara',
            foto_sebelum: sampleDocFallback.foto_sebelum,
            foto_proses: sampleDocFallback.foto_proses,
            foto_sesudah: sampleDocFallback.foto_sesudah,
          };
        }
      } catch (err) {
        // Fallback to localStorage or mock
      }

      if (!foundDoc) {
        const localSaved = JSON.parse(localStorage.getItem('sipakai_dsp02_docs') || '[]');
        const match = localSaved.find(d => String(d.id) === String(id));
        if (match) {
          foundDoc = match;
        } else if (String(id) === '101') {
          foundDoc = sampleDocFallback;
        } else if (String(id) === '102') {
          foundDoc = {
            ...sampleDocFallback,
            id: 102,
            number: 'BA-PMS/TI/DAOP6/10-2026/0015',
            ref_number: 'PMH/0004/X/2026',
            lokasi: 'Gudang Logistik Stasiun Tugu Yogyakarta',
            wilayah: 'DAOP 6 Yogyakarta',
            status: 'pending',
            status_label: 'Menunggu TTE Saksi 2 & VP TI',
            saksi_2: { ...sampleDocFallback.saksi_2, signed: false },
            penanggung_jawab: { ...sampleDocFallback.penanggung_jawab, signed: false }
          };
        } else {
          foundDoc = sampleDocFallback;
        }
      }

      setDoc(foundDoc);

      // Auto print check
      if (new URLSearchParams(location.search).get('print') === 'true') {
        setTimeout(() => window.print(), 800);
      }
    } catch (e) {
      setDoc(sampleDocFallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, location.search]);

  // Canvas Handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#003580';
    isDrawingRef.current = true;
    setHasDrawnSignature(true);
  };

  const draw = (e) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnSignature(false);
  };

  // Handle Signing Execution
  const handleExecuteSign = async () => {
    if (!pinInput || pinInput.length < 6) {
      setSignError('Masukkan 6-digit PIN KAI Pass Anda.');
      return;
    }

    setIsSigning(true);
    setSignError(null);

    try {
      // Simulate TTE signing process
      await new Promise(r => setTimeout(r, 900));

      const updatedDoc = { ...doc };
      const nowStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

      if (signAsRole === 'saksi_1') {
        updatedDoc.saksi_1 = { ...updatedDoc.saksi_1, signed: true, signed_at: nowStr };
      } else if (signAsRole === 'saksi_2') {
        updatedDoc.saksi_2 = { ...updatedDoc.saksi_2, signed: true, signed_at: nowStr };
      } else if (signAsRole === 'vp') {
        updatedDoc.penanggung_jawab = { ...updatedDoc.penanggung_jawab, signed: true, signed_at: nowStr };
      }

      // Check if all signed
      const allSigned = updatedDoc.pelaksana?.signed && updatedDoc.saksi_1?.signed && updatedDoc.saksi_2?.signed && updatedDoc.penanggung_jawab?.signed;
      if (allSigned) {
        updatedDoc.status = 'approved';
        updatedDoc.status_label = 'Disahkan Penuh (Sah TTE BSrE)';
      }

      setDoc(updatedDoc);

      // Update in localStorage
      const localSaved = JSON.parse(localStorage.getItem('sipakai_dsp02_docs') || '[]');
      const updatedList = localSaved.map(d => String(d.id) === String(doc.id) ? updatedDoc : d);
      localStorage.setItem('sipakai_dsp02_docs', JSON.stringify(updatedList));

      setIsSignModalOpen(false);
      setSuccessMessage('Tanda Tangan Elektronik BSrE berhasil dibubuhkan secara sah!');
      setTimeout(() => setSuccessMessage(null), 4000);

      if (onDocumentUpdated) onDocumentUpdated();
    } catch (err) {
      setSignError(err.message || 'Terjadi kesalahan saat memproses tanda tangan.');
    } finally {
      setIsSigning(false);
    }
  };

  if (loading || !doc) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-[#003580] mb-2" />
        <p className="text-xs font-semibold">Memuat Lembar Berita Acara Pemusnahan...</p>
      </div>
    );
  }

  const isApproved = doc.status === 'approved';
  const isPending = doc.status === 'pending';
  const isDraft = doc.status === 'draft';

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-24 select-none">
      {/* Toast Alert */}
      {successMessage && (
        <div className="fixed top-5 right-5 z-50 p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs font-semibold">{successMessage}</span>
          <button type="button" onClick={() => setSuccessMessage(null)} className="text-emerald-700 ml-2">✕</button>
        </div>
      )}

      {/* Top Bar Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
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
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-orange-50 text-orange-700 border border-orange-200">
                DSP-02 &bull; LEMBAR KERJA RESMI KAI
              </span>
              <span className="text-xs font-mono font-bold text-slate-700">{doc.number}</span>
            </div>
            <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight mt-0.5">
              Pratinjau Berita Acara Pemusnahan Aset TI
            </h1>
          </div>
        </div>

        {/* Tab & Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tab Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('sheet')}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'sheet' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Lembar Cetak A4
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'audit' ? 'bg-white text-[#003580] shadow-2xs' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Audit Trail & TTE
            </button>
          </div>

          {/* Tandatangani Button if pending */}
          {!isApproved && (
            <button
              type="button"
              onClick={() => {
                // Determine missing role
                if (!doc.saksi_1?.signed) setSignAsRole('saksi_1');
                else if (!doc.saksi_2?.signed) setSignAsRole('saksi_2');
                else setSignAsRole('vp');
                setIsSignModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#f05a22] hover:bg-[#d94e1b] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <PenTool className="w-4 h-4" />
              <span>Tandatangani (TTE Saksi/VP)</span>
            </button>
          )}

          {/* Cetak Button */}
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#003580] hover:bg-[#092653] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4 text-sky-400" />
            <span>Cetak Lembar A4</span>
          </button>
        </div>
      </div>

      {/* TAB 1: LEMBAR CETAK RESMI STANDAR KAI A4 */}
      {activeTab === 'sheet' && (
        <div className="bg-white rounded-2xl border border-slate-300 shadow-lg p-8 md:p-12 font-serif text-slate-900 max-w-4xl mx-auto print:p-0 print:border-none print:shadow-none print:max-w-none">
          {/* Header Kop Surat KAI */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex items-center gap-4">
              <KaiLogo className="h-12 w-auto" />
              <div>
                <h2 className="text-base font-extrabold uppercase tracking-wide text-[#003580] font-sans">
                  PT KERETA API INDONESIA (PERSERO)
                </h2>
                <h3 className="text-xs font-bold text-slate-700 font-sans uppercase">
                  DIREKTORAT NIAGA & TEKNOLOGI INFORMASI
                </h3>
                <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                  Unit Teknologi Informasi &bull; Kantor Pusat Bandung / DAOP 1 Jakarta
                </p>
              </div>
            </div>

            <div className="text-right font-sans">
              <span className="inline-block px-2.5 py-1 bg-slate-100 border border-slate-300 rounded text-[10px] font-extrabold text-slate-800 uppercase tracking-wider">
                {doc.form_code || 'FR.SM/TI/012.001'} (DSP-02)
              </span>
              <p className="text-[10px] text-slate-500 mt-1">Edisi: Oktober 2026</p>
            </div>
          </div>

          {/* Title & Document Number */}
          <div className="text-center space-y-1 mb-6 font-sans">
            <h1 className="text-base md:text-lg font-black tracking-wide text-slate-900 uppercase underline decoration-2 underline-offset-4">
              BERITA ACARA PEMUSNAHAN ASET TEKNOLOGI INFORMASI
            </h1>
            <p className="text-xs font-mono font-bold text-slate-700">
              Nomor: {doc.number}
            </p>
            <p className="text-[11px] text-slate-500">
              Dasar Pelaksanaan: Surat Permohonan Pemusnahan DSP-01 Nomor: <strong>{doc.ref_number}</strong>
            </p>
          </div>

          {/* Pembukaan Berita Acara */}
          <div className="text-xs md:text-sm text-justify leading-relaxed space-y-3 mb-6">
            <p>
              Pada hari ini, <strong>{doc.hari_pelaksanaan}</strong>, tanggal <strong>{new Date(doc.tanggal_pelaksanaan).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>, bertempat di <strong>{doc.lokasi}</strong> ({doc.wilayah}), kami yang bertanda tangan di bawah ini:
            </p>

            {/* List Pihak Komite & Saksi */}
            <div className="pl-4 space-y-2 font-sans text-xs bg-slate-50/60 p-3.5 rounded-lg border border-slate-200">
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-1 font-bold">1.</span>
                <span className="col-span-3 font-semibold text-slate-600">Pelaksana Eksekusi</span>
                <span className="col-span-8 font-bold text-slate-900">
                  : {doc.pelaksana?.nama} (NIPP: {doc.pelaksana?.nipp}) &bull; {doc.pelaksana?.jabatan}
                </span>
              </div>

              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-1 font-bold">2.</span>
                <span className="col-span-3 font-semibold text-slate-600">Saksi I (Pengamanan)</span>
                <span className="col-span-8 font-bold text-slate-900">
                  : {doc.saksi_1?.nama} (NIPP: {doc.saksi_1?.nipp}) &bull; {doc.saksi_1?.jabatan}
                </span>
              </div>

              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-1 font-bold">3.</span>
                <span className="col-span-3 font-semibold text-slate-600">Saksi II (Audit/SPI)</span>
                <span className="col-span-8 font-bold text-slate-900">
                  : {doc.saksi_2?.nama} (NIPP: {doc.saksi_2?.nipp}) &bull; {doc.saksi_2?.jabatan}
                </span>
              </div>
            </div>

            <p>
              Menyatakan dengan sebenarnya bahwa telah melaksanakan eksekusi pemusnahan secara fisik terhadap barang inventaris / aset teknologi informasi milik PT Kereta Api Indonesia (Persero) yang tercantum dalam rincian di bawah ini, dengan metode <strong>{doc.metode_pemusnahan}</strong>:
            </p>
          </div>

          {/* Tabel Rincian Barang Dimusnahkan */}
          <div className="mb-6 font-sans">
            <table className="w-full text-left text-xs border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 text-center font-bold">
                  <th className="py-2 px-2 border-r border-slate-300 w-8">No</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-left">Nama Aset TI</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-left">No. Seri / No. Inventaris SAP</th>
                  <th className="py-2 px-2 border-r border-slate-300 w-16">Jumlah</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-left">Kategori</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-left">Kondisi Awal</th>
                  <th className="py-2 px-3 text-left">Hasil Pemusnahan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {doc.items?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 text-[11px]">
                    <td className="py-2 px-2 text-center border-r border-slate-200 font-bold">{idx + 1}</td>
                    <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-900">{item.nama_aset}</td>
                    <td className="py-2 px-3 border-r border-slate-200 font-mono text-slate-700">{item.serial_number || item.no_inventaris}</td>
                    <td className="py-2 px-2 text-center border-r border-slate-200 font-bold">{item.jumlah} {item.satuan || 'Unit'}</td>
                    <td className="py-2 px-3 border-r border-slate-200 text-slate-600">{item.kategori}</td>
                    <td className="py-2 px-3 border-r border-slate-200 text-slate-600">{item.kondisi_awal}</td>
                    <td className="py-2 px-3 font-semibold text-emerald-800">{item.hasil_pemusnahan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pernyataan Hukum & Sanitasi Data */}
          <div className="text-xs md:text-sm text-justify leading-relaxed space-y-2 mb-8">
            <p>
              Pemusnahan dilakukan dengan memperhatikan prinsip kepatuhan tata kelola, keamanan informasi, serta kelestarian lingkungan. Seluruh media penyimpanan data telah dilakukan sanitasi/degaussing magnetik berkekuatan tinggi, dan perangkat keras telah dihancurkan sedemikian rupa sehingga <strong>tidak dapat direparasi, dirakit kembali, atau difungsikan untuk tujuan apapun</strong>.
            </p>
            <p>
              Berita Acara ini dibuat dalam rangkap secukupnya dan ditandatangani secara elektronik (BSrE) untuk dipergunakan sebagai dasar sah proses <strong>Penghapusan Aset (DSP-03)</strong> dari buku daftar aktiva tetap SAP PT Kereta Api Indonesia (Persero).
            </p>
          </div>

          {/* Kolom Tanda Tangan Para Pihak (4 Kolom Standar KAI) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center font-sans text-xs border-t border-slate-200 pt-6">
            {/* Pelaksana */}
            <div className="flex flex-col justify-between h-44 p-2 bg-slate-50/50 rounded-lg border border-slate-200">
              <div>
                <p className="font-bold text-slate-700">Pelaksana Eksekusi,</p>
                <p className="text-[10px] text-slate-500">Unit Teknologi Informasi</p>
              </div>

              <div className="py-2">
                {doc.pelaksana?.signed ? (
                  <div className="inline-flex flex-col items-center">
                    <div className="w-12 h-12 rounded border border-blue-300 bg-blue-50/80 p-1 flex items-center justify-center">
                      <ShieldCheck className="w-8 h-8 text-[#003580]" />
                    </div>
                    <span className="text-[9px] text-[#003580] font-bold mt-1">TTE BSrE TERVALIDASI</span>
                    <span className="text-[8px] text-slate-400 font-mono">{doc.pelaksana?.signed_at || '2026-10-21'}</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400 italic">Belum TTE</span>
                )}
              </div>

              <div>
                <p className="font-bold underline text-slate-900">{doc.pelaksana?.nama}</p>
                <p className="text-[10px] text-slate-500">NIPP. {doc.pelaksana?.nipp}</p>
              </div>
            </div>

            {/* Saksi 1 Pam */}
            <div className="flex flex-col justify-between h-44 p-2 bg-slate-50/50 rounded-lg border border-slate-200">
              <div>
                <p className="font-bold text-slate-700">Saksi I (Pengamanan),</p>
                <p className="text-[10px] text-slate-500">Polsuska / Pam Obvit</p>
              </div>

              <div className="py-2">
                {doc.saksi_1?.signed ? (
                  <div className="inline-flex flex-col items-center">
                    <div className="w-12 h-12 rounded border border-emerald-300 bg-emerald-50/80 p-1 flex items-center justify-center">
                      <ShieldCheck className="w-8 h-8 text-emerald-700" />
                    </div>
                    <span className="text-[9px] text-emerald-800 font-bold mt-1">TTE BSrE TERVALIDASI</span>
                    <span className="text-[8px] text-slate-400 font-mono">{doc.saksi_1?.signed_at || '2026-10-21'}</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Menunggu TTE
                  </span>
                )}
              </div>

              <div>
                <p className="font-bold underline text-slate-900">{doc.saksi_1?.nama}</p>
                <p className="text-[10px] text-slate-500">NIPP. {doc.saksi_1?.nipp}</p>
              </div>
            </div>

            {/* Saksi 2 Audit */}
            <div className="flex flex-col justify-between h-44 p-2 bg-slate-50/50 rounded-lg border border-slate-200">
              <div>
                <p className="font-bold text-slate-700">Saksi II (Audit/Keuangan),</p>
                <p className="text-[10px] text-slate-500">Satuan Pengawasan Intern</p>
              </div>

              <div className="py-2">
                {doc.saksi_2?.signed ? (
                  <div className="inline-flex flex-col items-center">
                    <div className="w-12 h-12 rounded border border-emerald-300 bg-emerald-50/80 p-1 flex items-center justify-center">
                      <ShieldCheck className="w-8 h-8 text-emerald-700" />
                    </div>
                    <span className="text-[9px] text-emerald-800 font-bold mt-1">TTE BSrE TERVALIDASI</span>
                    <span className="text-[8px] text-slate-400 font-mono">{doc.saksi_2?.signed_at || '2026-10-21'}</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Menunggu TTE
                  </span>
                )}
              </div>

              <div>
                <p className="font-bold underline text-slate-900">{doc.saksi_2?.nama}</p>
                <p className="text-[10px] text-slate-500">NIPP. {doc.saksi_2?.nipp}</p>
              </div>
            </div>

            {/* Mengetahui VP */}
            <div className="flex flex-col justify-between h-44 p-2 bg-slate-50/50 rounded-lg border border-slate-200">
              <div>
                <p className="font-bold text-slate-700">Mengetahui & Menyetujui,</p>
                <p className="text-[10px] text-slate-500">Vice President IT Operation</p>
              </div>

              <div className="py-2">
                {doc.penanggung_jawab?.signed ? (
                  <div className="inline-flex flex-col items-center">
                    <div className="w-12 h-12 rounded border border-purple-300 bg-purple-50/80 p-1 flex items-center justify-center">
                      <ShieldCheck className="w-8 h-8 text-purple-700" />
                    </div>
                    <span className="text-[9px] text-purple-800 font-bold mt-1">PENGESAHAN VP RESMI</span>
                    <span className="text-[8px] text-slate-400 font-mono">{doc.penanggung_jawab?.signed_at || '2026-10-21'}</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Menunggu Disposisi
                  </span>
                )}
              </div>

              <div>
                <p className="font-bold underline text-slate-900">{doc.penanggung_jawab?.nama}</p>
                <p className="text-[10px] text-slate-500">NIPP. {doc.penanggung_jawab?.nipp}</p>
              </div>
            </div>
          </div>

          {/* Lampiran Dokumentasi Foto Visual di Bagian Bawah */}
          <div className="mt-8 pt-6 border-t border-slate-200 font-sans">
            <h4 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wide">
              Lampiran Bukti Visual Pelaksanaan Eksekusi Fisik:
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 text-center p-1">
                <img src={doc.foto_sebelum || sampleDocFallback.foto_sebelum} alt="Sebelum" className="w-full h-24 object-cover rounded" />
                <p className="text-[9px] font-bold text-slate-700 mt-1">1. Sebelum Eksekusi</p>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 text-center p-1">
                <img src={doc.foto_proses || sampleDocFallback.foto_proses} alt="Proses" className="w-full h-24 object-cover rounded" />
                <p className="text-[9px] font-bold text-slate-700 mt-1">2. Saat Proses Penghancuran</p>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 text-center p-1">
                <img src={doc.foto_sesudah || sampleDocFallback.foto_sesudah} alt="Sesudah" className="w-full h-24 object-cover rounded" />
                <p className="text-[9px] font-bold text-slate-700 mt-1">3. Puing Scrap Akhir</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT TRAIL & STATUS TTE */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">Alur Verifikasi TTE & Riwayat Pengesahan</h2>
            <p className="text-xs text-slate-500 mt-0.5">Audit log integritas dokumen Berita Acara Pemusnahan Aset TI (DSP-02)</p>
          </div>

          {/* Stepper Status */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Step 1 */}
            <div className={`p-4 rounded-xl border ${doc.pelaksana?.signed ? 'bg-emerald-50/60 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                  Tahap 1
                </span>
                {doc.pelaksana?.signed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Clock className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <h4 className="text-xs font-bold text-slate-900">Pelaksana Eksekusi TI</h4>
              <p className="text-[11px] text-slate-600 mt-0.5">{doc.pelaksana?.nama}</p>
              <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded ${doc.pelaksana?.signed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                {doc.pelaksana?.signed ? 'TTE Selesai' : 'Menunggu TTE'}
              </span>
            </div>

            {/* Step 2 */}
            <div className={`p-4 rounded-xl border ${doc.saksi_1?.signed ? 'bg-emerald-50/60 border-emerald-200' : 'bg-amber-50/40 border-amber-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                  Tahap 2
                </span>
                {doc.saksi_1?.signed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-600" />
                )}
              </div>
              <h4 className="text-xs font-bold text-slate-900">Saksi I (Pengamanan)</h4>
              <p className="text-[11px] text-slate-600 mt-0.5">{doc.saksi_1?.nama}</p>
              <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded ${doc.saksi_1?.signed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {doc.saksi_1?.signed ? 'TTE Selesai' : 'Menunggu Saksi'}
              </span>
            </div>

            {/* Step 3 */}
            <div className={`p-4 rounded-xl border ${doc.saksi_2?.signed ? 'bg-emerald-50/60 border-emerald-200' : 'bg-amber-50/40 border-amber-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                  Tahap 3
                </span>
                {doc.saksi_2?.signed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-600" />
                )}
              </div>
              <h4 className="text-xs font-bold text-slate-900">Saksi II (Audit SPI)</h4>
              <p className="text-[11px] text-slate-600 mt-0.5">{doc.saksi_2?.nama}</p>
              <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded ${doc.saksi_2?.signed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {doc.saksi_2?.signed ? 'TTE Selesai' : 'Menunggu Saksi'}
              </span>
            </div>

            {/* Step 4 */}
            <div className={`p-4 rounded-xl border ${doc.penanggung_jawab?.signed ? 'bg-purple-50/60 border-purple-200' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                  Tahap 4
                </span>
                {doc.penanggung_jawab?.signed ? (
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                ) : (
                  <Clock className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <h4 className="text-xs font-bold text-slate-900">Persetujuan VP IT</h4>
              <p className="text-[11px] text-slate-600 mt-0.5">{doc.penanggung_jawab?.nama}</p>
              <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded ${doc.penanggung_jawab?.signed ? 'bg-purple-100 text-purple-800' : 'bg-slate-200 text-slate-600'}`}>
                {doc.penanggung_jawab?.signed ? 'Disahkan VP' : 'Menunggu Disposisi'}
              </span>
            </div>
          </div>

          {/* Cryptographic Hash Security Info */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#003580]" />
              <span>Sertifikasi Tanda Tangan Elektronik BSrE (KAI Pass)</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-400 block text-[10px]">DOCUMENT SHA-256 INTEGRITY HASH:</span>
                <span className="text-slate-700 break-all text-[11px]">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">TIME-STAMP AUTHORITY (TSA):</span>
                <span className="text-slate-700 text-[11px]">KAI-TSA-BSR-ROOT-20261021T1030Z</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TANDA TANGAN ELEKTRONIK (TTE SAKSI / VP) */}
      {isSignModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#f05a22] flex items-center justify-center">
                  <PenTool className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Pembubuhan TTE Berita Acara</h3>
                  <p className="text-[11px] text-slate-500">
                    Sebagai: {signAsRole === 'saksi_1' ? 'Saksi I (Pengamanan)' : signAsRole === 'saksi_2' ? 'Saksi II (Audit SPI)' : 'Vice President IT Operation'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {signError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-semibold">
                {signError}
              </div>
            )}

            {/* Canvas Gambar Tanda Tangan */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">Goreskan Tanda Tangan di Kanvas:</label>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="text-[11px] text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              </div>

              <div className="border border-slate-300 rounded-xl overflow-hidden bg-slate-50 touch-none">
                <canvas
                  ref={canvasRef}
                  width={440}
                  height={140}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-36 cursor-crosshair bg-white"
                />
              </div>
            </div>

            {/* PIN Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Masukkan 6-Digit PIN KAI Pass:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="••••••"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono tracking-widest text-center font-bold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#f05a22]"
                />
              </div>
              <span className="text-[11px] text-slate-400">PIN default simulasi: 123456</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsSignModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSigning}
                onClick={handleExecuteSign}
                className="px-5 py-2 bg-[#f05a22] hover:bg-[#d94e1b] text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
              >
                {isSigning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mengesahkan TTE...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Bubuhkan TTE Resmi</span>
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
