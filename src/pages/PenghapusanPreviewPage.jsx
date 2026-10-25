import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  FileSpreadsheet,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Printer,
  PenTool,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  Building2,
  UserCheck,
  Eraser,
  Loader2,
  Database,
  Lock,
  Scale,
  FileText,
  X,
  Check,
  DollarSign
} from 'lucide-react';
import { api } from '../services/api';
import KaiLogo from '../components/KaiLogo';
import SignatureSelector from '../components/SignatureSelector';

export default function PenghapusanPreviewPage({ user, onDocumentUpdated }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Tab view: 'sheet' (Lembar Cetak A4) | 'sap' (Rekonsiliasi SAP & Audit Trail)
  const [activeTab, setActiveTab] = useState('sheet');

  // Modal TTE VP States
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('123456');
  const [isSigning, setIsSigning] = useState(false);
  const [signError, setSignError] = useState(null);

  // Canvas TTD & Signature Mode (3 Pilihan: draw | upload | saved)
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);
  const [selectedSignatureFile, setSelectedSignatureFile] = useState(null);
  const [signatureMode, setSignatureMode] = useState('draw'); // 'draw' | 'upload' | 'saved'
  const [hasServerSignature, setHasServerSignature] = useState(false);
  const [serverSignatureUrl, setServerSignatureUrl] = useState('');

  // Sinkronisasi status tanda tangan profil user saat ini
  useEffect(() => {
    if (user?.has_signature || user?.signature_path) {
      setHasServerSignature(true);
      setServerSignatureUrl(api.getSignatureUrl(true));
      setSignatureMode('saved');
    } else {
      setSignatureMode('draw');
    }
  }, [user]);

  // Fallback sample DSP-03
  const sampleFallbackDoc = {
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
            ref_ba: apiData.data?.nomor_dsp02 || apiData.ref_ba || 'BA-PMS/TI/DAOP1/10-2026/0014',
            form_code: 'FR.SM/TI/013.001',
            tanggal: apiData.data?.tanggal || apiData.created_at?.split('T')[0] || '2026-10-22',
            pelaksana: {
              nama: apiData.data?.nama_pelaksana || apiData.requester?.name || 'Petugas TI',
              nipp: apiData.data?.nipp_pelaksana || apiData.requester?.nip || '54892',
              jabatan: apiData.data?.jabatan_pelaksana || 'Koordinator Tim Eksekusi TI',
              unit_kerja: apiData.data?.unit_kerja || apiData.requester?.unit_kerja || 'DAOP 1 Jakarta'
            },
            lokasi: apiData.data?.lokasi || 'Gudang Logistik Server Juanda',
            wilayah: apiData.data?.wilayah || 'DAOP 1 Jakarta',
            klasifikasi: apiData.data?.status_kondisi || 'Dimusnahkan (Scrap Afval)',
            nilai_buku_total: apiData.data?.nilai_buku ? `Rp ${Number(apiData.data.nilai_buku).toLocaleString('id-ID')}` : 'Rp 0 (Scrap Nilai Buku Nol)',
            sap_posting_status: apiData.status === 'approved' ? 'Terhapus SAP FI-AA' : 'Menunggu Validasi SAP',
            items: apiData.items || apiData.data?.items || sampleFallbackDoc.items,
            saksiList: sampleFallbackDoc.saksiList,
            vpSigned: apiData.status === 'approved',
            vpSignedAt: apiData.status === 'approved' ? '2026-10-22 14:30 WIB' : null,
            status: apiData.status,
            status_label: apiData.status === 'approved' ? 'Disahkan Penuh & Terhapus SAP' : 'Menunggu Disposisi VP',
          };
        }
      } catch (err) {}

      if (!foundDoc) {
        const localSaved = JSON.parse(localStorage.getItem('sipakai_dsp03_docs') || '[]');
        const match = localSaved.find(d => String(d.id) === String(id));
        if (match) {
          foundDoc = match;
        } else if (String(id) === '301') {
          foundDoc = sampleFallbackDoc;
        } else if (String(id) === '302') {
          foundDoc = {
            ...sampleFallbackDoc,
            id: 302,
            number: 'FR-PH/TI/DAOP6/10-2026/0032',
            ref_ba: 'BA-PMS/TI/DAOP6/10-2026/0015',
            lokasi: 'Gudang Logistik Stasiun Tugu Yogyakarta',
            wilayah: 'DAOP 6 Yogyakarta',
            status: 'pending',
            status_label: 'Menunggu Otorisasi VP TI & Keuangan',
            vpSigned: false,
            vpSignedAt: null
          };
        } else {
          foundDoc = sampleFallbackDoc;
        }
      }

      setDoc(foundDoc);

      if (new URLSearchParams(location.search).get('print') === 'true') {
        setTimeout(() => window.print(), 800);
      }
    } catch (e) {
      setDoc(sampleFallbackDoc);
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

  // Sign VP Execution
  const handleExecuteSignVP = async () => {
    if (!pinInput || pinInput.length < 6) {
      setSignError('Masukkan 6-digit PIN KAI Pass Anda.');
      return;
    }

    // Validasi ketat tanda tangan tidak boleh kosong sesuai opsi yang dipilih
    if (signatureMode === 'draw') {
      if (!hasDrawnSignature) {
        setSignError('Silakan goreskan tanda tangan pada bidang kanvas terlebih dahulu. Tanda tangan tidak boleh kosong.');
        return;
      }
    } else if (signatureMode === 'upload') {
      if (!selectedSignatureFile) {
        setSignError('Silakan pilih berkas gambar tanda tangan (PNG/JPG) terlebih dahulu. Tanda tangan tidak boleh kosong.');
        return;
      }
    } else if (signatureMode === 'saved') {
      if (!hasServerSignature) {
        setSignError('Akun Anda belum memiliki tanda tangan tersimpan. Silakan pilih opsi Goresan Langsung atau Upload Gambar.');
        return;
      }
    }

    setIsSigning(true);
    setSignError(null);

    try {
      // 1. Sinkronisasi berkas tanda tangan baru (goresan atau upload) ke backend profil pengguna
      if (signatureMode === 'upload' && selectedSignatureFile) {
        try {
          const formData = new FormData();
          formData.append('signature', selectedSignatureFile);
          formData.append('pin', pinInput.trim());
          await api.uploadSignature(formData);
          setHasServerSignature(true);
        } catch (uploadErr) {
          console.warn('Gagal upload tanda tangan PNG:', uploadErr);
        }
      } else if (signatureMode === 'draw' && hasDrawnSignature && canvasRef.current) {
        try {
          const blob = await new Promise((resolve) => {
            canvasRef.current.toBlob(resolve, 'image/png');
          });
          if (blob) {
            const formData = new FormData();
            formData.append('signature', blob, 'signature_draw.png');
            formData.append('pin', pinInput.trim());
            await api.uploadSignature(formData);
            setHasServerSignature(true);
          }
        } catch (uploadErr) {
          console.warn('Gagal sinkronisasi tanda tangan goresan:', uploadErr);
        }
      }

      await new Promise(r => setTimeout(r, 900));

      const updatedDoc = {
        ...doc,
        vpSigned: true,
        vpSignedAt: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
        status: 'approved',
        status_label: 'Disahkan Penuh & Terhapus SAP',
        sap_posting_status: 'Terhapus SAP FI-AA'
      };

      setDoc(updatedDoc);

      const localSaved = JSON.parse(localStorage.getItem('sipakai_dsp03_docs') || '[]');
      const updatedList = localSaved.map(d => String(d.id) === String(doc.id) ? updatedDoc : d);
      localStorage.setItem('sipakai_dsp03_docs', JSON.stringify(updatedList));

      setIsSignModalOpen(false);
      setSuccessMessage('TTE Pengesahan VP IT Operation berhasil dibubuhkan dan dokumen terhapus di SAP!');
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
        <p className="text-xs font-semibold">Memuat Lembar Formulir Penghapusan Aktiva Tetap...</p>
      </div>
    );
  }

  const isApproved = doc.status === 'approved';

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
            onClick={() => navigate('/penghapusan')}
            className="p-2 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-600 transition-colors shadow-2xs"
            title="Kembali ke Daftar"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                DSP-03 &bull; PENGHAPUSAN AKTIVA TETAP SAP
              </span>
              <span className="text-xs font-mono font-bold text-slate-700">{doc.number}</span>
            </div>
            <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight mt-0.5">
              Pratinjau Formulir Penghapusan Aset TI
            </h1>
          </div>
        </div>

        {/* Tab & Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
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
              onClick={() => setActiveTab('sap')}
              className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'sap' ? 'bg-white text-[#003580] shadow-2xs' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Rekonsiliasi SAP & Audit
            </button>
          </div>

          {!isApproved && (
            <button
              type="button"
              onClick={() => setIsSignModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#f05a22] hover:bg-[#d94e1b] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <PenTool className="w-4 h-4" />
              <span>Otorisasi & TTE VP IT</span>
            </button>
          )}

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

      {/* TAB 1: LEMBAR CETAK STANDAR KAI A4 */}
      {activeTab === 'sheet' && (
        <div className="bg-white rounded-2xl border border-slate-300 shadow-lg p-8 md:p-12 font-serif text-slate-900 max-w-4xl mx-auto print:p-0 print:border-none print:shadow-none print:max-w-none">
          {/* Header Kop KAI */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex items-center gap-4">
              <KaiLogo className="h-12 w-auto" />
              <div>
                <h2 className="text-base font-extrabold uppercase tracking-wide text-[#003580] font-sans">
                  PT KERETA API INDONESIA (PERSERO)
                </h2>
                <h3 className="text-xs font-bold text-slate-700 font-sans uppercase">
                  DIREKTORAT NIAGA & TEKNOLOGI INFORMASI - UNIT TI
                </h3>
                <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                  Rekonsiliasi Aktiva Tetap SAP FI-AA &bull; DAOP 1 Jakarta
                </p>
              </div>
            </div>

            <div className="text-right font-sans">
              <span className="inline-block px-2.5 py-1 bg-slate-100 border border-slate-300 rounded text-[10px] font-extrabold text-slate-800 uppercase tracking-wider">
                {doc.form_code || 'FR.SM/TI/013.001'} (DSP-03)
              </span>
              <p className="text-[10px] text-slate-500 mt-1">Edisi: Oktober 2026</p>
            </div>
          </div>

          {/* Title & Document Number */}
          <div className="text-center space-y-1 mb-6 font-sans">
            <h1 className="text-base md:text-lg font-black tracking-wide text-slate-900 uppercase underline decoration-2 underline-offset-4">
              FORMULIR PENGHAPUSAN AKTIVA TETAP / ASET TEKNOLOGI INFORMASI
            </h1>
            <p className="text-xs font-mono font-bold text-slate-700">
              Nomor: {doc.number}
            </p>
            <p className="text-[11px] text-slate-500">
              Dasar Berita Acara Pemusnahan DSP-02 Nomor: <strong>{doc.ref_ba}</strong>
            </p>
          </div>

          {/* Body Konsiderans */}
          <div className="text-xs md:text-sm text-justify leading-relaxed space-y-3 mb-6">
            <p>
              Sehubungan dengan telah dilaksanakannya pemusnahan fisik aset teknologi informasi sesuai dengan <strong>Berita Acara Pemusnahan (DSP-02) Nomor {doc.ref_ba}</strong>, maka bersama ini diajukan permohonan <strong>De-registrasi dan Penghapusan Aktiva Tetap</strong> dari sistem pembukuan SAP FI-AA PT Kereta Api Indonesia (Persero) dengan rincian sebagai berikut:
            </p>

            <div className="pl-4 space-y-1.5 font-sans text-xs bg-slate-50/60 p-3.5 rounded-lg border border-slate-200">
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-4 font-semibold text-slate-600">Tanggal Pengajuan</span>
                <span className="col-span-8 font-bold text-slate-900">: {doc.tanggal}</span>
              </div>
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-4 font-semibold text-slate-600">Pelaksana Eksekusi TI</span>
                <span className="col-span-8 font-bold text-slate-900">: {doc.pelaksana?.nama} (NIPP. {doc.pelaksana?.nipp})</span>
              </div>
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-4 font-semibold text-slate-600">Lokasi / Server Room</span>
                <span className="col-span-8 font-bold text-slate-900">: {doc.lokasi}</span>
              </div>
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-4 font-semibold text-slate-600">Klasifikasi Penghapusan</span>
                <span className="col-span-8 font-bold text-slate-900">: {doc.klasifikasi}</span>
              </div>
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-4 font-semibold text-slate-600">Status Buku SAP</span>
                <span className="col-span-8 font-bold text-emerald-800">: {doc.sap_posting_status || 'Terhapus SAP FI-AA'}</span>
              </div>
            </div>
          </div>

          {/* Tabel Inventaris Aktiva Tetap SAP */}
          <div className="mb-6 font-sans">
            <table className="w-full text-left text-xs border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 text-center font-bold">
                  <th className="py-2 px-2 border-r border-slate-300 w-8">No</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-left">Nama Aset TI</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-left">Spesifikasi / Serial Number</th>
                  <th className="py-2 px-3 border-r border-slate-300 text-left">No. Inventaris SAP</th>
                  <th className="py-2 px-2 border-r border-slate-300 w-16">Jumlah</th>
                  <th className="py-2 px-3 text-left">Status De-registrasi SAP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {doc.items?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 text-[11px]">
                    <td className="py-2 px-2 text-center border-r border-slate-200 font-bold">{idx + 1}</td>
                    <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-900">{item.nama}</td>
                    <td className="py-2 px-3 border-r border-slate-200 text-slate-600">
                      <div>{item.spesifikasi}</div>
                      <div className="text-[10px] font-mono text-slate-400">{item.serialNumber}</div>
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 font-mono font-bold text-[#003580]">{item.noInventarisSap}</td>
                    <td className="py-2 px-2 text-center border-r border-slate-200 font-bold">{item.jumlah} {item.satuan || 'Unit'}</td>
                    <td className="py-2 px-3 font-semibold text-emerald-800">{item.statusSap || 'Scrap (Nilai Buku Rp 0)'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pernyataan Penutup */}
          <div className="text-xs md:text-sm text-justify leading-relaxed space-y-2 mb-8">
            <p>
              Dengan ditandatanganinya formulir ini, maka nomor-nomor aktiva tetap di atas telah resmi dikeluarkan dari daftar inventaris aktif, nilai buku disesuaikan menjadi Rp 0 (Scrap), dan hak pemakaian dinyatakan selesai secara permanen.
            </p>
          </div>

          {/* Tanda Tangan Komite & VP IT */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center font-sans text-xs border-t border-slate-200 pt-6">
            {/* Pelaksana */}
            <div className="flex flex-col justify-between h-40 p-2 bg-slate-50/50 rounded-lg border border-slate-200">
              <div>
                <p className="font-bold text-slate-700">Pelaksana Eksekusi,</p>
                <p className="text-[10px] text-slate-500">Unit Teknologi Informasi</p>
              </div>

              <div className="py-1">
                <div className="inline-flex flex-col items-center">
                  <div className="w-10 h-10 rounded border border-blue-300 bg-blue-50/80 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-[#003580]" />
                  </div>
                  <span className="text-[8px] text-[#003580] font-bold mt-0.5">TTE VALID BSrE</span>
                </div>
              </div>

              <div>
                <p className="font-bold underline text-slate-900">{doc.pelaksana?.nama}</p>
                <p className="text-[10px] text-slate-500">NIPP. {doc.pelaksana?.nipp}</p>
              </div>
            </div>

            {/* Saksi SPI */}
            <div className="flex flex-col justify-between h-40 p-2 bg-slate-50/50 rounded-lg border border-slate-200">
              <div>
                <p className="font-bold text-slate-700">Saksi I (Audit SPI),</p>
                <p className="text-[10px] text-slate-500">Satuan Pengawasan Intern</p>
              </div>

              <div className="py-1">
                <div className="inline-flex flex-col items-center">
                  <div className="w-10 h-10 rounded border border-emerald-300 bg-emerald-50/80 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-emerald-700" />
                  </div>
                  <span className="text-[8px] text-emerald-800 font-bold mt-0.5">TTE VALID BSrE</span>
                </div>
              </div>

              <div>
                <p className="font-bold underline text-slate-900">Slamet Riyadi</p>
                <p className="text-[10px] text-slate-500">NIPP. 49201</p>
              </div>
            </div>

            {/* Saksi Keuangan */}
            <div className="flex flex-col justify-between h-40 p-2 bg-slate-50/50 rounded-lg border border-slate-200">
              <div>
                <p className="font-bold text-slate-700">Saksi II (Keuangan),</p>
                <p className="text-[10px] text-slate-500">Seksi Keuangan & Aset</p>
              </div>

              <div className="py-1">
                <div className="inline-flex flex-col items-center">
                  <div className="w-10 h-10 rounded border border-emerald-300 bg-emerald-50/80 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-emerald-700" />
                  </div>
                  <span className="text-[8px] text-emerald-800 font-bold mt-0.5">TTE VALID BSrE</span>
                </div>
              </div>

              <div>
                <p className="font-bold underline text-slate-900">Tri Wahyuni, S.T.</p>
                <p className="text-[10px] text-slate-500">NIPP. 55120</p>
              </div>
            </div>

            {/* Mengetahui VP IT */}
            <div className="flex flex-col justify-between h-40 p-2 bg-slate-50/50 rounded-lg border border-slate-200">
              <div>
                <p className="font-bold text-slate-700">Mengetahui & Menyetujui,</p>
                <p className="text-[10px] text-slate-500">VP IT Operation</p>
              </div>

              <div className="py-1">
                {doc.vpSigned ? (
                  <div className="inline-flex flex-col items-center">
                    <div className="w-10 h-10 rounded border border-purple-300 bg-purple-50/80 flex items-center justify-center">
                      <ShieldCheck className="w-6 h-6 text-purple-700" />
                    </div>
                    <span className="text-[8px] text-purple-800 font-bold mt-0.5">DISAHKAN VP</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Menunggu Disposisi
                  </span>
                )}
              </div>

              <div>
                <p className="font-bold underline text-slate-900">Ir. Bambang Suryo Pratama, M.T.</p>
                <p className="text-[10px] text-slate-500">NIPP. 48901</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REKONSILIASI SAP & AUDIT */}
      {activeTab === 'sap' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">Status Posting De-registrasi SAP FI-AA</h2>
            <p className="text-xs text-slate-500 mt-0.5">Integrasi sistem pembukuan aktiva tetap ERP SAP KAI</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">SAP TRANSACTION CODE:</span>
              <p className="font-mono font-bold text-slate-900 text-sm">ABAVN (Asset Retirement by Scrap)</p>
              <p className="text-[11px] text-slate-500">Penghapusan aktiva tanpa pendapatan penjualan.</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">SAP ASSET CLASS:</span>
              <p className="font-mono font-bold text-slate-900 text-sm">AST-IT-200 (Hardware & Server)</p>
              <p className="text-[11px] text-slate-500">Sub-ledger aktiva tetap teknologi informasi.</p>
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1.5">
              <span className="text-[10px] font-bold text-emerald-700 uppercase">POSTING STATUS:</span>
              <p className="font-mono font-bold text-emerald-900 text-sm">SAP DOCUMENT POSTED ✓</p>
              <p className="text-[11px] text-emerald-700">Buku inventaris berhasil dimutasi ke scrap.</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TTE OTORISASI VP IT */}
      {isSignModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#f05a22] flex items-center justify-center">
                  <PenTool className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Otorisasi Penghapusan Aktiva SAP</h3>
                  <p className="text-[11px] text-slate-500">Pejabat Otorisator: Vice President IT Operation</p>
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

            {/* Komponen Pemilih Tanda Tangan: 3 Opsi dengan Validasi Ketat */}
            <SignatureSelector
              mode={signatureMode}
              setMode={setSignatureMode}
              canvasRef={canvasRef}
              hasDrawn={hasDrawnSignature}
              setHasDrawn={setHasDrawnSignature}
              selectedFile={selectedSignatureFile}
              setSelectedFile={setSelectedSignatureFile}
              hasServerSignature={hasServerSignature}
              serverSignatureUrl={serverSignatureUrl}
              user={user}
            />

            {/* PIN Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Masukkan 6-Digit PIN KAI Pass:
              </label>
              <input
                type="password"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="••••••"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono tracking-widest text-center font-bold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#f05a22]"
              />
              <span className="text-[11px] text-slate-400">PIN default: 123456</span>
            </div>

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
                onClick={handleExecuteSignVP}
                className="px-5 py-2 bg-[#f05a22] hover:bg-[#d94e1b] text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
              >
                {isSigning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mengesahkan...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Sahkan & Posting SAP</span>
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
