import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  RefreshCw, 
  Flame, 
  Monitor, 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Check, 
  Lock, 
  ShieldCheck, 
  AlertTriangle,
  Scale,
  ArrowLeft,
  X
} from 'lucide-react';
import { api } from '../services/api';

export default function PenghapusanFormPage({ user }) {
  const navigate = useNavigate();

  // 1. Form Header States
  const [tanggal, setTanggal] = useState('2025-10-30');
  const [namaPelaksana, setNamaPelaksana] = useState(user?.name || 'Fajar Prasetyo, S.Kom');
  const [nippPelaksana, setNippPelaksana] = useState(user?.nip || '62489');
  const [jabatanPelaksana, setJabatanPelaksana] = useState('Pranata Komputer Madya / Koordinator Tim Eksekusi TI');
  const [lokasiEksekusi, setLokasiEksekusi] = useState('Gudang Logistik & Server Room DAOP 1 Jakarta, Stasiun Juanda Lt. 3, Jl. Ir. H. Juanda No. 1');

  // 2. Klasifikasi Kondisi (Dimusnahkan vs Tidak Layak/Rusak)
  const [kondisi, setKondisi] = useState('Dimusnahkan'); // 'Dimusnahkan' | 'Tidak Layak-Rusak'

  // 3. Rincian Barang
  const [items, setItems] = useState([
    {
      id: 1,
      nama: 'Server Dell PowerEdge R740 2U',
      spesifikasi: 'Xeon Silver 4210R / 64GB DDR4 / Dual PSU',
      jumlah: '1',
      satuan: 'Unit',
      serialNumber: 'SN-98214-KAI-SRV',
      noInventarisSap: 'AST-TI-2018-0941',
      lokasiTerakhir: 'Rack 04 - Server Farm Juanda',
      statusSap: 'Scrap (Nilai Buku Rp 0)',
      statusSapType: 'scrap'
    },
    {
      id: 2,
      nama: 'Cisco Catalyst 3850 48-Port PoE',
      spesifikasi: 'Switch Layer 3 Distribusi Stasiun Gambir',
      jumlah: '1',
      satuan: 'Unit',
      serialNumber: 'MAC-7721-CC-081',
      noInventarisSap: 'AST-TI-2019-1102',
      lokasiTerakhir: 'Wiring Closet Lt. 2 DAOP 1',
      statusSap: 'Hapus Buku Aktiva',
      statusSapType: 'hapus_buku'
    },
    {
      id: 3,
      nama: 'Harddisk Enterprise SAS 1.2TB 10K',
      spesifikasi: 'Penyimpanan Storage SAN Ticketing (x4 Modul)',
      jumlah: '4',
      satuan: 'Pcs',
      serialNumber: 'HD-SAS-KAI-8082-SET',
      noInventarisSap: 'AST-TI-2020-0054',
      lokasiTerakhir: 'Storage Shelf Alpha-3 Juanda',
      statusSap: 'Terhapus SAP FI-AA',
      statusSapType: 'terhapus'
    }
  ]);

  // Modal / Add item states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    nama: '',
    spesifikasi: '',
    jumlah: '1',
    satuan: 'Unit',
    serialNumber: '',
    noInventarisSap: '',
    lokasiTerakhir: '',
    statusSap: 'Scrap (Nilai Buku Rp 0)',
    statusSapType: 'scrap'
  });

  // 4. Saksi Kehadiran
  const [saksiList, setSaksiList] = useState([
    {
      id: 1,
      kategori: 'SAKSI I (AUDIT SPI)',
      nama: 'Slamet Riyadi',
      nipp: '49201',
      jabatan: 'Pengawas Internal / Auditor SPI KAI',
      absensi: '09:14 WIB',
      isHadir: true,
      tteStatus: 'TTE Valid'
    },
    {
      id: 2,
      kategori: 'SAKSI II (KEUANGAN)',
      nama: 'Tri Wahyuni, S.T',
      nipp: '55120',
      jabatan: 'Staff Seksi Keuangan & Aset DAOP 1',
      absensi: '09:20 WIB',
      isHadir: true,
      tteStatus: 'TTE Valid'
    },
    {
      id: 3,
      kategori: 'SAKSI III (PENGAMANAN)',
      nama: 'Agus Supriyatna',
      nipp: '61099',
      jabatan: 'Petugas Pengamanan / Polsuksa DAOP 1',
      absensi: '09:18 WIB',
      isHadir: true,
      tteStatus: 'TTE Valid'
    }
  ]);

  // 5. Otorisasi BSrE / TTE States
  const [vpSigned, setVpSigned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Sync SSO handler
  const handleSyncSSO = () => {
    if (user) {
      setNamaPelaksana(user.name);
      setNippPelaksana(user.nip);
      setJabatanPelaksana(user.roleLabel || 'Pranata Komputer Madya / Koordinator Tim Eksekusi TI');
    }
    setFeedbackMsg('Data personil berhasil disinkronkan dengan SSO KAI');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Item management
  const handleRemoveItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleAddItem = () => {
    if (!newItem.nama) return;
    setItems([
      ...items,
      {
        ...newItem,
        id: Date.now()
      }
    ]);
    setIsAddModalOpen(false);
    setNewItem({
      nama: '',
      spesifikasi: '',
      jumlah: '1',
      satuan: 'Unit',
      serialNumber: '',
      noInventarisSap: '',
      lokasiTerakhir: '',
      statusSap: 'Scrap (Nilai Buku Rp 0)',
      statusSapType: 'scrap'
    });
  };

  const handleImportDSP02 = () => {
    const localSaved = JSON.parse(localStorage.getItem('sipakai_dsp02_docs') || '[]');
    let imported = [];
    if (localSaved.length > 0 && localSaved[0].items && localSaved[0].items.length > 0) {
      imported = localSaved[0].items.map((it, idx) => ({
        id: Date.now() + idx + 1,
        nama: it.nama_aset || 'Aset TI Terkait',
        spesifikasi: it.kategori || 'Perangkat Keras TI',
        jumlah: String(it.jumlah || 1),
        satuan: it.satuan || 'Unit',
        serialNumber: it.serial_number || it.sn || `SN-${idx + 101}`,
        noInventarisSap: it.no_inventaris || it.id_aset || `AST-TI-2018-091${idx}`,
        lokasiTerakhir: localSaved[0].lokasi || 'Workshop Balai Yasa Manggarai',
        statusSap: 'Scrap (Nilai Buku Rp 0)',
        statusSapType: 'scrap'
      }));
    } else {
      imported = [
        {
          id: Date.now() + 1,
          nama: 'Hard Disk Enterprise SAS 600GB (15k RPM)',
          spesifikasi: 'Storage SAS Server Farm Juanda',
          jumlah: '8',
          satuan: 'Unit',
          serialNumber: 'SN-WD-8812901-KAI',
          noInventarisSap: 'AST-TI-2018-0912',
          lokasiTerakhir: 'Workshop TI Balai Yasa Manggarai',
          statusSap: 'Scrap (Nilai Buku Rp 0)',
          statusSapType: 'scrap'
        },
        {
          id: Date.now() + 2,
          nama: 'Switch HP ProCurve 2520G 24-PoE',
          spesifikasi: 'Core Switch Sub-Stasiun Manggarai',
          jumlah: '2',
          satuan: 'Unit',
          serialNumber: 'SN-HP-9982-MGR',
          noInventarisSap: 'AST-TI-2017-0419',
          lokasiTerakhir: 'Ruang Server Manggarai Lt. 2',
          statusSap: 'Scrap (Nilai Buku Rp 0)',
          statusSapType: 'scrap'
        }
      ];
    }
    setItems([...items, ...imported]);
    setFeedbackMsg(`${imported.length} item berhasil diimpor dari dokumen Berita Acara Pemusnahan (DSP-02)`);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // TTE Sign VP Simulation
  const handleSignVP = () => {
    setVpSigned(true);
    setFeedbackMsg('TTE BSrE (KAI Pass) berhasil dibubuhkan oleh VP IT Operation');
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Submit / Finalize
  const handleSubmitForm = async (isDraft = false) => {
    setIsSubmitting(true);
    try {
      const payload = {
        type: 'dsp03',
        submit: !isDraft,
        data: {
          tanggal,
          nama_pelaksana: namaPelaksana,
          nipp_pelaksana: nippPelaksana,
          jabatan_pelaksana: jabatanPelaksana,
          lokasi: lokasiEksekusi,
          status_kondisi: kondisi === 'Dimusnahkan' ? 'Dimusnahkan' : 'Tidak Layak-Rusak',
          saksi: saksiList.map(s => `${s.nama} (${s.nipp})`).join(', ')
        },
        items: items.map(it => ({
          nama_barang: it.nama,
          jumlah: parseInt(it.jumlah, 10) || 1,
          serial_nomor: it.serialNumber,
          no_inventaris: it.noInventarisSap,
          lokasi_aset: it.lokasiTerakhir,
          keterangan: it.spesifikasi
        }))
      };

      // Save to localStorage as persistent record
      const currentSaved = JSON.parse(localStorage.getItem('sipakai_dsp03_docs') || '[]');
      const newDocRecord = {
        id: Date.now(),
        number: `FR-PH/TI/DAOP1/10-2026/00${Math.floor(30 + Math.random() * 60)}`,
        ref_ba: 'BA-PMS/TI/DAOP1/10-2026/0014',
        type: 'dsp03',
        form_code: 'FR.SM/TI/013.001',
        tanggal,
        pelaksana: {
          nama: namaPelaksana,
          nipp: nippPelaksana,
          jabatan: jabatanPelaksana,
          unit_kerja: user?.location || 'DAOP 1 Jakarta'
        },
        lokasi: lokasiEksekusi,
        wilayah: 'DAOP 1 Jakarta',
        klasifikasi: kondisi,
        nilai_buku_total: 'Rp 0 (Scrap Nilai Penuh Disusutkan)',
        sap_posting_status: isDraft ? 'Draf Rekonsiliasi' : 'Menunggu Validasi SAP',
        status: isDraft ? 'draft' : 'pending',
        status_label: isDraft ? 'Draf Formulir' : 'Menunggu Otorisasi VP IT',
        items,
        saksiList,
        vpSigned
      };
      localStorage.setItem('sipakai_dsp03_docs', JSON.stringify([newDocRecord, ...currentSaved]));

      setFeedbackMsg(isDraft ? 'Draf Formulir Penghapusan Aset TI tersimpan.' : 'Formulir Penghapusan Aset TI [DSP-03] berhasil difinalisasi dan dicatat!');
      setTimeout(() => {
        navigate('/penghapusan');
      }, 1200);
    } catch (err) {
      alert('Gagal menyimpan dokumen: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[1240px] mx-auto pb-16 space-y-6">
      {/* Toast Notification */}
      {feedbackMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#0b2046] text-white px-4 py-3 rounded-lg shadow-xl text-xs font-medium flex items-center gap-2 border border-blue-400/30 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/penghapusan')}
            className="p-2 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-600 transition-colors shadow-2xs"
            title="Kembali ke Daftar Penghapusan"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#0b2046] tracking-tight">Formulir Penghapusan Aset TI</h1>
            <p className="text-xs text-slate-500 mt-0.5">Formulir resmi de-registrasi aktiva tetap dari registrasi TI SAP (DSP-03)</p>
          </div>
        </div>
        <p className="text-sm text-slate-500 mt-2 max-w-4xl leading-relaxed">
          Formulir pencatatan akhir penghapusan aset TI dari buku inventaris aset tetap perusahaan yang membutuhkan validasi kondisi fisik/logis serta kehadiran saksi-saksi resmi unit pengawas internal dan keuangan.
        </p>
      </div>

      {/* SECTION 1: Informasi Pelaksana Eksekusi */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-[#0b2046] text-white flex items-center justify-center font-bold text-xs">
              1
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0b2046]">Informasi Pelaksana Eksekusi</h2>
              <p className="text-xs text-slate-400">Data personil TI yang bertanggung jawab atas penatausahaan dan pemutakhiran data</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSyncSSO}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0b2046] hover:bg-[#15326c] text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sinkronkan SSO KAI
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Hari & Tanggal Pelaksanaan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Hari & Tanggal Pelaksanaan <span className="text-[#f05a22]">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-lg text-sm text-[#0b2046] font-medium focus:bg-white focus:outline-none focus:border-[#f05a22] transition-colors"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Terverifikasi otomatis sesuai timestamp server</p>
          </div>

          {/* Nama Pelaksana Teknis */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Nama Pelaksana Teknis <span className="text-[#f05a22]">*</span>
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={namaPelaksana}
                onChange={(e) => setNamaPelaksana(e.target.value)}
                className="w-full pl-3.5 pr-24 py-2.5 bg-slate-50/70 border border-slate-200 rounded-lg text-sm text-[#0b2046] font-bold focus:bg-white focus:outline-none focus:border-[#f05a22] transition-colors"
              />
              <span className="absolute right-2 px-2 py-0.5 bg-[#0b2046] text-white text-[10px] font-mono font-semibold rounded">
                NIPP : {nippPelaksana}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Unit Pelaksana Teknis TI DAOP 1</p>
          </div>

          {/* Jabatan Fungsional */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Jabatan Fungsional <span className="text-[#f05a22]">*</span>
            </label>
            <input
              type="text"
              value={jabatanPelaksana}
              onChange={(e) => setJabatanPelaksana(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-lg text-sm text-slate-700 focus:bg-white focus:outline-none focus:border-[#f05a22] transition-colors"
            />
            <p className="text-[11px] text-slate-400 mt-1">Sesuai Surat Tugas No. ST/TI-DAOP1/2025/10</p>
          </div>

          {/* Lokasi Titik Eksekusi Fisik */}
          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Lokasi Titik Eksekusi Fisik & Penyimpanan Terakhir <span className="text-[#f05a22]">*</span>
            </label>
            <div className="relative flex items-center">
              <MapPin className="w-4 h-4 text-[#f05a22] absolute left-3.5" />
              <input
                type="text"
                value={lokasiEksekusi}
                onChange={(e) => setLokasiEksekusi(e.target.value)}
                className="w-full pl-10 pr-32 py-2.5 bg-slate-50/70 border border-slate-200 rounded-lg text-sm text-slate-700 focus:bg-white focus:outline-none focus:border-[#f05a22] transition-colors"
              />
              <span className="absolute right-3 px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-medium rounded">
                Zona Keamanan A1
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Klasifikasi & Kondisi Penghapusan Aset */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded bg-[#0b2046] text-white flex items-center justify-center font-bold text-xs">
            2
          </div>
          <div>
            <h2 className="text-base font-bold text-[#0b2046]">Klasifikasi & Kondisi Penghapusan Aset</h2>
            <p className="text-xs text-slate-400">Pilih dasar faktual penghapusan fisik dan akuntansi aktiva tetap</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
          {/* Card 1: Dimusnahkan */}
          <div
            onClick={() => setKondisi('Dimusnahkan')}
            className={`rounded-xl p-5 border-2 transition-all cursor-pointer relative ${
              kondisi === 'Dimusnahkan'
                ? 'border-[#f05a22] bg-orange-50/15 shadow-sm'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#f05a22] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0b2046]">Dimusnahkan</h3>
                  <span className="text-[10px] font-black text-[#f05a22] tracking-wider uppercase">
                    METODE: PENGHANCURAN FISIK & SANITASI
                  </span>
                </div>
              </div>
              <div>
                {kondisi === 'Dimusnahkan' ? (
                  <div className="w-5 h-5 rounded-full bg-[#f05a22] text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-300"></div>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-600 mt-3 leading-relaxed">
              Perangkat keras atau media penyimpanan telah dihancurkan (shredding/degaussing) secara permanen sesuai dengan Berita Acara Pemusnahan (DSP-02) dan tidak dapat direparasi maupun difungsikan kembali.
            </p>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded font-mono font-medium">
                SAP Status: <strong className="text-slate-800">DECOMM_SCRAP</strong>
              </span>
              <span className="text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                BA Terlampir Valid
              </span>
            </div>
          </div>

          {/* Card 2: Tidak Layak / Rusak Berat */}
          <div
            onClick={() => setKondisi('Tidak Layak-Rusak')}
            className={`rounded-xl p-5 border-2 transition-all cursor-pointer relative ${
              kondisi === 'Tidak Layak-Rusak'
                ? 'border-[#0b2046] bg-slate-50/70 shadow-sm'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center shrink-0">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0b2046]">Tidak Layak / Rusak Berat</h3>
                  <span className="text-[10px] font-black text-slate-500 tracking-wider uppercase">
                    METODE: DE-REGISTRASI NON-DESTRUKTIF
                  </span>
                </div>
              </div>
              <div>
                {kondisi === 'Tidak Layak-Rusak' ? (
                  <div className="w-5 h-5 rounded-full bg-[#0b2046] text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-300"></div>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-600 mt-3 leading-relaxed">
              Perangkat mengalami kerusakan fatal (Total Loss &gt; 80%), usang (obsolete teknologi &gt; 7 tahun), atau secara kalkulasi biaya teknis tidak layak untuk diperbaiki kembali menurut hasil uji lab TI KAI.
            </p>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded font-mono font-medium">
                SAP Status: <strong className="text-slate-800">OBSOLETE_WRITE_OFF</strong>
              </span>
              <span className="text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded">
                Rekomendasi Teknis
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Rincian Barang yang Dihapuskan */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-[#0b2046] text-white flex items-center justify-center font-bold text-xs">
              3
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0b2046]">Rincian Barang yang Dihapuskan</h2>
              <p className="text-xs text-slate-400">Daftar item perangkat TI resmi yang dicatat keluar dari Aktiva Tetap DAOP 1</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-[#0b2046] text-white text-xs font-semibold rounded-md">
              {items.length} Aset Terdaftar
            </span>
            <span className="px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-md">
              Total Nilai Buku: Rp 0,-
            </span>
          </div>
        </div>

        {/* Tabel Barang */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8fafc] text-slate-500 uppercase font-bold border-b border-slate-200 text-[11px]">
              <tr>
                <th className="py-3.5 px-4 text-center w-12">NO</th>
                <th className="py-3.5 px-5">NAMA BARANG & SPESIFIKASI</th>
                <th className="py-3.5 px-4 text-center w-24">JUMLAH</th>
                <th className="py-3.5 px-4">SERIAL NUMBER</th>
                <th className="py-3.5 px-4">NO. INVENTARIS SAP</th>
                <th className="py-3.5 px-4">LOKASI TERAKHIR</th>
                <th className="py-3.5 px-4 text-center">STATUS AKHIR SAP</th>
                <th className="py-3.5 px-4 text-center w-14">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 px-4 text-center font-medium text-slate-500">
                    {String(idx + 1).padStart(2, '0')}
                  </td>
                  <td className="py-4 px-5">
                    <p className="font-bold text-[#0b2046] text-sm leading-tight">{item.nama}</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">{item.spesifikasi}</p>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <p className="font-bold text-[#0b2046] text-sm">{item.jumlah}</p>
                    <span className="text-[10px] text-slate-400 uppercase font-medium">{item.satuan}</span>
                  </td>
                  <td className="py-4 px-4 font-mono text-[11px] text-slate-700">
                    {item.serialNumber}
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-bold font-mono text-[#f05a22] text-xs">
                      {item.noInventarisSap}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-slate-600 text-xs">
                    {item.lokasiTerakhir}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {item.statusSapType === 'terhapus' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {item.statusSap}
                      </span>
                    ) : item.statusSapType === 'hapus_buku' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[11px] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        {item.statusSap}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[11px] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        {item.statusSap}
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Hapus baris"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Belum ada barang yang ditambahkan. Silakan klik "Tambah Baris Barang" atau "Impor Data [DSP-02]".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Buttons Tabel */}
        <div className="p-4 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-[#0b2046] hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-[#f05a22]" />
              Tambah Baris Barang
            </button>
            <button
              type="button"
              onClick={handleImportDSP02}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-[#0b2046] hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              Impor Data [DSP-02]
            </button>
          </div>
          <button
            type="button"
            onClick={() => alert('Fitur ekspor spreadsheet telah disiapkan.')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Export Tabel (.xlsx)
          </button>
        </div>
      </section>

      {/* SECTION 4: Daftar Saksi Kehadiran & Pengesahan Berlapis (TTE BSrE) */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded bg-[#0b2046] text-white flex items-center justify-center font-bold text-xs">
            4
          </div>
          <div>
            <h2 className="text-base font-bold text-[#0b2046]">
              Daftar Saksi Kehadiran & Pengesahan Berlapis (TTE BSrE)
            </h2>
            <p className="text-xs text-slate-400">
              Sesuai Peraturan Direksi KAI tentang Tata Kelola Pemusnahan dan Penghapusan Aktiva TI
            </p>
          </div>
        </div>

        {/* Sub-Seksi 4.A: Saksi Pelaksanaan Lapangan */}
        <div className="space-y-3 pt-1">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Sub-Seksi 4.A: Saksi Pelaksanaan Lapangan
              </h3>
              <p className="text-[11px] text-slate-400">
                Daftar pegawai resmi lintas unit yang menyaksikan proses pembukuan dan fisik secara langsung
              </p>
            </div>
            <button
              type="button"
              onClick={() => alert('Fitur tambah saksi tambahan aktif.')}
              className="flex items-center gap-1 px-3 py-1 bg-[#0b2046] hover:bg-[#15326c] text-white rounded text-xs font-medium transition-colors"
            >
              <Plus className="w-3 h-3" />
              Tambah Saksi
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {saksiList.map((saksi) => (
              <div key={saksi.id} className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-[#f05a22] tracking-wider uppercase">
                    {saksi.kategori}
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                    Hadir ✓
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-[#0b2046] text-sm">{saksi.nama}</h4>
                  <p className="text-slate-400 text-xs mt-0.5">NIPP: {saksi.nipp}</p>
                  <p className="text-slate-600 text-[11px] mt-1">{saksi.jabatan}</p>
                </div>
                <div className="pt-2 border-t border-slate-200/80 flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">Absensi: {saksi.absensi}</span>
                  <span className="font-bold text-slate-700">{saksi.tteStatus}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sub-Seksi 4.B: Blok Pengesahan Digital Resmi */}
        <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center border-t border-slate-100 pt-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Sub-Seksi 4.B: Blok Pengesahan Digital Resmi (BSrE & Badan Siber Sandi Negara)
            </h3>
            <span className="text-xs text-slate-400 font-medium">Level Otorisasi: 3 Tingkat</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Pelaksana */}
            <div className="bg-slate-50/60 border border-slate-200 rounded-xl p-5 flex flex-col items-center text-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4">
                1. DILAKUKAN OLEH (PELAKSANA)
              </span>
              
              {/* QR Code Container BSrE */}
              <div className="w-24 h-24 bg-white border border-slate-300 rounded-lg p-2 shadow-xs flex items-center justify-center relative">
                <div className="w-full h-full bg-slate-900 rounded p-1 flex flex-col justify-between items-center text-[8px] text-white">
                  <div className="w-full flex justify-between">
                    <span className="w-2.5 h-2.5 bg-white rounded-xs"></span>
                    <span className="w-2.5 h-2.5 bg-white rounded-xs"></span>
                  </div>
                  <div className="text-[9px] font-black text-blue-300 tracking-tighter">BSrE</div>
                  <div className="w-full flex justify-between">
                    <span className="w-2.5 h-2.5 bg-white rounded-xs"></span>
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                  </div>
                </div>
              </div>

              <h4 className="font-bold text-[#0b2046] text-sm mt-4">{namaPelaksana}</h4>
              <p className="text-slate-400 text-xs mt-0.5">NIPP : {nippPelaksana}</p>
              <p className="text-slate-600 text-xs mt-1">Pranata Komputer Madya</p>
              
              <div className="mt-4 pt-2 w-full border-t border-slate-200/80">
                <span className="text-emerald-600 text-xs font-semibold flex items-center justify-center gap-1">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  Ditandatangani Digital (30 Okt 2025)
                </span>
              </div>
            </div>

            {/* 2. Atasan Langsung */}
            <div className="bg-slate-50/60 border border-slate-200 rounded-xl p-5 flex flex-col items-center text-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4">
                2. DISETUJUI OLEH (ATASAN LANGSUNG)
              </span>

              {/* QR Code Container BSrE */}
              <div className="w-24 h-24 bg-white border border-slate-300 rounded-lg p-2 shadow-xs flex items-center justify-center relative">
                <div className="w-full h-full bg-slate-900 rounded p-1 flex flex-col justify-between items-center text-[8px] text-white">
                  <div className="w-full flex justify-between">
                    <span className="w-2.5 h-2.5 bg-white rounded-xs"></span>
                    <span className="w-2.5 h-2.5 bg-white rounded-xs"></span>
                  </div>
                  <div className="text-[9px] font-black text-blue-300 tracking-tighter">BSrE</div>
                  <div className="w-full flex justify-between">
                    <span className="w-2.5 h-2.5 bg-white rounded-xs"></span>
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                  </div>
                </div>
              </div>

              <h4 className="font-bold text-[#0b2046] text-sm mt-4">Hermawan Susilo, M.T</h4>
              <p className="text-slate-400 text-xs mt-0.5">NIPP : 57430</p>
              <p className="text-slate-600 text-xs mt-1">Senior Manager Fasilitas TI DAOP 1</p>

              <div className="mt-4 pt-2 w-full border-t border-slate-200/80">
                <span className="text-emerald-600 text-xs font-semibold flex items-center justify-center gap-1">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  Ditandatangani Digital (30 Okt 2025)
                </span>
              </div>
            </div>

            {/* 3. Mengetahui Pimpinan Unit TI (VP) */}
            <div className="border-2 border-orange-200 bg-orange-50/15 rounded-xl overflow-hidden flex flex-col shadow-xs">
              <div className="bg-[#f05a22] text-white py-2 px-4 text-center">
                <span className="text-[11px] font-black uppercase tracking-wider">
                  3. MENGETAHUI (PIMPINAN UNIT TI)
                </span>
              </div>

              <div className="p-5 flex-1 flex flex-col items-center text-center justify-between">
                {!vpSigned ? (
                  <div className="w-full bg-white border border-orange-200 rounded-lg p-3 my-2 flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-orange-100 text-[#f05a22] flex items-center justify-center mb-1">
                      <Lock className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-[#0b2046]">Menunggu Validasi VP</span>
                    <span className="text-[10px] text-slate-400">Token OTP Terkirim ke HP</span>
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-white border border-slate-300 rounded-lg p-2 shadow-xs flex items-center justify-center relative my-1">
                    <div className="w-full h-full bg-slate-900 rounded p-1 flex flex-col justify-between items-center text-[8px] text-white">
                      <div className="w-full flex justify-between">
                        <span className="w-2.5 h-2.5 bg-white rounded-xs"></span>
                        <span className="w-2.5 h-2.5 bg-white rounded-xs"></span>
                      </div>
                      <div className="text-[9px] font-black text-blue-300 tracking-tighter">BSrE</div>
                      <div className="w-full flex justify-between">
                        <span className="w-2.5 h-2.5 bg-white rounded-xs"></span>
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-bold text-[#0b2046] text-sm mt-2">Budi Santoso, M.Kom</h4>
                  <p className="text-slate-400 text-xs mt-0.5">NIPP : 58492</p>
                  <p className="text-slate-600 text-xs mt-1">Vice President IT Operation KAI</p>
                </div>

                <div className="w-full pt-3 mt-3 border-t border-orange-100">
                  {!vpSigned ? (
                    <button
                      type="button"
                      onClick={handleSignVP}
                      className="w-full py-2 px-3 bg-[#a03810] hover:bg-[#852c0a] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Bubuhkan TTE BSrE (KAI Pass)
                    </button>
                  ) : (
                    <span className="text-emerald-600 text-xs font-semibold flex items-center justify-center gap-1">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      Ditandatangani Digital (30 Okt 2025)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM: Legal Compliance Banner & Actions */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-5">
        {/* Legal Text */}
        <div className="flex items-start gap-3.5 max-w-2xl">
          <div className="w-9 h-9 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-[#f05a22] shrink-0 mt-0.5">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#0b2046]">Kepatuhan Hukum & Pertanggungjawaban Aktiva Tetap</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
              Dokumen Formulir Penghapusan Aset TI [DSP-03] merupakan dasar sah penghapusan nomor inventaris aktiva tetap PT Kereta Api Indonesia (Persero) pada modul SAP S/4HANA Finance &amp; Asset Accounting (FI-AA). Penghapusan berstatus permanen dan mengikat secara hukum perseroan.
            </p>
          </div>
        </div>

        {/* Buttons Group */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full lg:w-auto">
          <button
            type="button"
            onClick={() => navigate('/pemusnahan')}
            className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            Batal / Kembali
          </button>
          <button
            type="button"
            onClick={() => alert('Pratinjau A4 dokumen DSP-03 siap dicetak.')}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            Pratinjau A4 (PDF)
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmitForm(true)}
            className="w-full sm:w-auto px-4 py-2.5 bg-[#0b2046] hover:bg-[#15326c] text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs"
          >
            Simpan Draf Akhir
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmitForm(false)}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#f05a22] hover:bg-[#d94a18] text-white rounded-lg text-xs font-bold transition-colors shadow-sm whitespace-nowrap"
          >
            Finalisasi & Catat Penghapusan [DSP-03]
          </button>
        </div>
      </div>

      {/* FOOTER METADATA */}
      <div className="text-center text-[11px] text-slate-400 space-y-1 pt-2">
        <p>Sistem Informasi Aset TI KAI (SIA-TI) • Modul Penghapusan Aktiva v2.4 &nbsp;|&nbsp; HASH: 8F2A-89BD-47EE-KAI-DAOP1</p>
        <p>© 2025 PT Kereta Api Indonesia (Persero). Seluruh hak cipta dilindungi undang-undang.</p>
      </div>

      {/* MODAL TAMBAH BARIS BARANG */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-[#0b2046]">Tambah Rincian Aset yang Dihapuskan</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Barang *</label>
                <input
                  type="text"
                  placeholder="Contoh: Cisco Switch Catalyst 2960"
                  value={newItem.nama}
                  onChange={(e) => setNewItem({ ...newItem, nama: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Spesifikasi Teknis</label>
                <input
                  type="text"
                  placeholder="Contoh: 24-Port 10/100/1000 Gigabit Ethernet"
                  value={newItem.spesifikasi}
                  onChange={(e) => setNewItem({ ...newItem, spesifikasi: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jumlah</label>
                  <input
                    type="number"
                    value={newItem.jumlah}
                    onChange={(e) => setNewItem({ ...newItem, jumlah: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Satuan</label>
                  <input
                    type="text"
                    value={newItem.satuan}
                    onChange={(e) => setNewItem({ ...newItem, satuan: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Serial Number</label>
                  <input
                    type="text"
                    placeholder="SN-XXXXX"
                    value={newItem.serialNumber}
                    onChange={(e) => setNewItem({ ...newItem, serialNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. Inventaris SAP</label>
                  <input
                    type="text"
                    placeholder="AST-TI-202X-XXXX"
                    value={newItem.noInventarisSap}
                    onChange={(e) => setNewItem({ ...newItem, noInventarisSap: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono text-[#f05a22]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Lokasi Terakhir</label>
                <input
                  type="text"
                  placeholder="Contoh: Server Room DAOP 1"
                  value={newItem.lokasiTerakhir}
                  onChange={(e) => setNewItem({ ...newItem, lokasiTerakhir: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status Akhir SAP</label>
                <select
                  value={newItem.statusSap}
                  onChange={(e) => {
                    const val = e.target.value;
                    let type = 'scrap';
                    if (val.includes('Hapus Buku')) type = 'hapus_buku';
                    if (val.includes('Terhapus')) type = 'terhapus';
                    setNewItem({ ...newItem, statusSap: val, statusSapType: type });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="Scrap (Nilai Buku Rp 0)">Scrap (Nilai Buku Rp 0)</option>
                  <option value="Hapus Buku Aktiva">Hapus Buku Aktiva</option>
                  <option value="Terhapus SAP FI-AA">Terhapus SAP FI-AA</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-4 py-2 bg-[#f05a22] hover:bg-[#d94a18] text-white rounded-lg text-xs font-bold"
              >
                Simpan Baris
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
