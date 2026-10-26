import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Building2,
  UserCheck,
  Calendar,
  Layers,
  Save,
  Check,
  Search,
  X,
  Eye,
  FileDown,
  RefreshCw,
  Sparkles,
  ClipboardList,
  ShieldCheck,
  Lock,
  PenTool
} from 'lucide-react';
import { api } from '../services/api';
import SignatureSelector from '../components/SignatureSelector';

export default function PenghapusanFormPage({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Approver / Users list from backend
  const [apiUsers, setApiUsers] = useState([]);
  const [isLoadingApprovers, setIsLoadingApprovers] = useState(false);

  // Modal Import dari DSP-02
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [dsp02List, setDsp02List] = useState([]);
  const [isLoadingDsp02, setIsLoadingDsp02] = useState(false);

  // Modal PDF Preview
  const [isPreviewPdfModalOpen, setIsPreviewPdfModalOpen] = useState(false);
  const [previewPdfBlobUrl, setPreviewPdfBlobUrl] = useState(null);
  const [isLoadingPreviewPdf, setIsLoadingPreviewPdf] = useState(false);
  const [previewPdfError, setPreviewPdfError] = useState(null);

  // Modal TTE Pembuat / Pelaksana (Tanda tangan manual saat submit)
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [signNotes, setSignNotes] = useState('Mengajukan formulir penghapusan aset TI sesuai fisik barang.');
  const [pinInput, setPinInput] = useState('123456');
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

  // --- Form State ---
  // 1. Identitas Dokumen & Lokasi
  const [formData, setFormData] = useState({
    nomor_referensi: 'BA-PMS/TI/DAOP1/10-2026/0014',
    tanggal: new Date().toISOString().split('T')[0],
    lokasi: user?.location || 'Gudang Logistik & Server Room Juanda Lt. 3, Jakarta Pusat',
    nama_pelaksana: user?.name || '',
    nipp_pelaksana: user?.nip || '',
    jabatan_pelaksana: user?.roleLabel || 'Koordinator Tim Eksekusi TI',
    status_kondisi: 'Dimusnahkan', // 'Dimusnahkan' | 'Tidak Layak-Rusak'
  });

  // 2. Saksi-saksi
  const [saksi1, setSaksi1] = useState({
    nama: 'Slamet Riyadi',
    nipp: '49201',
    jabatan: 'Pengawas Internal / Auditor SPI'
  });
  const [saksi2, setSaksi2] = useState({
    nama: 'Tri Wahyuni, S.T',
    nipp: '55120',
    jabatan: 'Staff Seksi Keuangan & Aset'
  });

  // 3. Verifikator Pejabat
  const [verifikator1, setVerifikator1] = useState(''); // Disetujui (Tahap 1)
  const [verifikator2, setVerifikator2] = useState(''); // Mengetahui (Tahap 2)

  // 4. Items (Aset yang Dihapus)
  const [items, setItems] = useState([
    {
      id: 1,
      nama_barang: 'Server Dell PowerEdge R740 2U',
      jumlah: 1,
      serial_nomor: 'SN-98214-KAI-SRV',
      no_inventaris: 'AST-TI-2018-0941',
      lokasi_aset: 'Rack 04 - Server Farm Juanda',
      keterangan: 'Xeon Silver 4210R / 64GB DDR4 (Scrap Afval)'
    },
    {
      id: 2,
      nama_barang: 'Cisco Catalyst 3850 48-Port PoE',
      jumlah: 1,
      serial_nomor: 'MAC-7721-CC-081',
      no_inventaris: 'AST-TI-2019-1102',
      lokasi_aset: 'Wiring Closet Lt. 2 DAOP 1',
      keterangan: 'Switch Layer 3 Distribusi (Rusak Permanen)'
    }
  ]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load approvers
  useEffect(() => {
    const fetchApprovers = async () => {
      setIsLoadingApprovers(true);
      try {
        const res = await api.getApprovers('all=1');
        const list = Array.isArray(res) ? res : (res?.data || []);
        setApiUsers(list);

        if (list.length >= 2 && !verifikator1 && !verifikator2) {
          setVerifikator1(String(list[0].id));
          setVerifikator2(String(list[1].id));
        } else if (list.length === 1 && !verifikator1) {
          setVerifikator1(String(list[0].id));
        }
      } catch (err) {
        console.warn('Gagal memuat daftar approvers:', err);
      } finally {
        setIsLoadingApprovers(false);
      }
    };
    fetchApprovers();
  }, []);

  // Load document in edit mode
  useEffect(() => {
    if (!isEditMode) return;
    const loadDoc = async () => {
      setIsLoading(true);
      try {
        const res = await api.getDocument(id);
        const doc = res?.document || res;
        if (doc) {
          const d = doc.data || {};
          setFormData({
            nomor_referensi: d.nomor_referensi || d.ref_ba || '',
            tanggal: d.tanggal ? String(d.tanggal).split('T')[0] : new Date().toISOString().split('T')[0],
            lokasi: d.lokasi || '',
            nama_pelaksana: d.nama_pelaksana || doc.requester?.name || '',
            nipp_pelaksana: d.nipp_pelaksana || doc.requester?.nip || '',
            jabatan_pelaksana: d.jabatan_pelaksana || 'Pelaksana TI',
            status_kondisi: d.status_kondisi || 'Dimusnahkan',
          });

          if (d.verifikator_1_id) setVerifikator1(String(d.verifikator_1_id));
          if (d.verifikator_2_id) setVerifikator2(String(d.verifikator_2_id));

          // Parse saksi secara aman (mendukung string, array of strings, array of objects, maupun format lainnya)
          if (d.saksi) {
            let saksiItems = [];
            if (typeof d.saksi === 'string') {
              saksiItems = d.saksi.split(',').map(s => s.trim()).filter(Boolean);
            } else if (Array.isArray(d.saksi)) {
              saksiItems = d.saksi.map(s => typeof s === 'string' ? s.trim() : (s?.nama || '')).filter(Boolean);
            }

            if (saksiItems[0]) {
              const m1 = String(saksiItems[0]).replace(/^[0-9]+\.\s*/, '');
              const [nm, np] = m1.includes('(') ? m1.split('(') : [m1, ''];
              setSaksi1({
                nama: nm ? nm.trim() : m1,
                nipp: np ? np.replace(')', '').replace(/NIPP\s*/i, '').trim() : '',
                jabatan: 'Saksi I'
              });
            }
            if (saksiItems[1]) {
              const m2 = String(saksiItems[1]).replace(/^[0-9]+\.\s*/, '');
              const [nm, np] = m2.includes('(') ? m2.split('(') : [m2, ''];
              setSaksi2({
                nama: nm ? nm.trim() : m2,
                nipp: np ? np.replace(')', '').replace(/NIPP\s*/i, '').trim() : '',
                jabatan: 'Saksi II'
              });
            }
          }

          const itemsArr = doc.items || d.items || [];
          if (itemsArr.length > 0) {
            setItems(itemsArr.map((it, idx) => ({
              id: it.id || idx + 1,
              nama_barang: it.nama_barang || it.nama_aset || '',
              jumlah: Number(it.jumlah) || 1,
              serial_nomor: it.serial_nomor || '-',
              no_inventaris: it.no_inventaris || it.id_aset || '-',
              lokasi_aset: it.lokasi_aset || d.lokasi || '-',
              keterangan: it.keterangan || '-',
            })));
          }
        }
      } catch (err) {
        setErrorMessage('Gagal memuat dokumen: ' + (err.message || 'Terjadi kesalahan sistem'));
      } finally {
        setIsLoading(false);
      }
    };
    loadDoc();
  }, [id, isEditMode]);

  // Sync with SSO User
  const handleSyncSSO = () => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        nama_pelaksana: user.name || user.nama || prev.nama_pelaksana,
        nipp_pelaksana: user.nip || prev.nipp_pelaksana,
        jabatan_pelaksana: user.roleLabel || prev.jabatan_pelaksana,
        lokasi: user.location || prev.lokasi,
      }));
      showToast('Data personil berhasil disinkronkan dengan Akun Pengguna.');
    }
  };

  // Add Item
  const handleAddItem = () => {
    const newItem = {
      id: Date.now(),
      nama_barang: '',
      jumlah: 1,
      serial_nomor: '',
      no_inventaris: '',
      lokasi_aset: formData.lokasi || '',
      keterangan: '',
    };
    setItems([...items, newItem]);
  };

  // Remove Item
  const handleRemoveItem = (itemId) => {
    if (items.length <= 1) {
      alert('Dokumen minimal harus memiliki 1 rincian aset yang dihapus.');
      return;
    }
    setItems(items.filter(it => it.id !== itemId));
  };

  // Update Item field
  const handleItemChange = (itemId, field, value) => {
    setItems(items.map(it => it.id === itemId ? { ...it, [field]: value } : it));
  };

  // Import from DSP-02
  const handleOpenImportDsp02 = async () => {
    setIsImportModalOpen(true);
    setIsLoadingDsp02(true);
    try {
      const res = await api.getDocuments({ type: 'dsp02' }).catch(() => null);
      setDsp02List(res?.data || []);
    } catch (err) {
      console.warn('Gagal mengambil daftar DSP-02:', err);
    } finally {
      setIsLoadingDsp02(false);
    }
  };

  const handleSelectDsp02 = (doc) => {
    if (!doc) return;
    const d = doc.data || {};
    const importedRef = doc.number || doc.nomor || d.nomor_referensi || 'BA-PMS/TI/2026/001';
    const importedLokasi = d.lokasi || d.business_area || formData.lokasi;

    const rawItems = doc.items || d.items || [];
    let mappedItems = [];
    if (rawItems.length > 0) {
      mappedItems = rawItems.map((it, idx) => ({
        id: Date.now() + idx,
        nama_barang: it.nama_aset || it.nama_barang || 'Aset TI',
        jumlah: Number(it.jumlah) || 1,
        serial_nomor: it.serial_nomor || '-',
        no_inventaris: it.id_aset || it.no_inventaris || '-',
        lokasi_aset: importedLokasi,
        keterangan: it.keterangan || it.metode_pemusnahan || 'Aset dari Berita Acara Pemusnahan',
      }));
    }

    setFormData(prev => ({
      ...prev,
      nomor_referensi: importedRef,
      lokasi: importedLokasi,
      status_kondisi: 'Dimusnahkan',
    }));

    if (mappedItems.length > 0) {
      setItems(mappedItems);
    }

    setIsImportModalOpen(false);
    showToast(`Data berhasil diimpor dari ${importedRef}`);
  };

  // Build Payload
  const buildPayload = (isSubmit = true) => {
    const saksiString = [
      saksi1.nama ? `1. ${saksi1.nama}${saksi1.nipp ? ` (${saksi1.nipp})` : ''}` : '',
      saksi2.nama ? `2. ${saksi2.nama}${saksi2.nipp ? ` (${saksi2.nipp})` : ''}` : '',
    ].filter(Boolean).join(', ');

    return {
      type: 'dsp03',
      submit: isSubmit,
      approver_id: verifikator1 ? Number(verifikator1) : null,
      data: {
        nomor_referensi: formData.nomor_referensi || 'FR-PH/REF/001',
        tanggal: formData.tanggal,
        lokasi: formData.lokasi,
        nama_pelaksana: formData.nama_pelaksana,
        nipp_pelaksana: formData.nipp_pelaksana,
        jabatan_pelaksana: formData.jabatan_pelaksana,
        status_kondisi: formData.status_kondisi,
        saksi: saksiString,
        verifikator_1_id: verifikator1 ? Number(verifikator1) : null,
        verifikator_2_id: verifikator2 ? Number(verifikator2) : null,
      },
      items: items.map(it => ({
        nama_barang: it.nama_barang || 'Aset TI',
        jumlah: parseInt(it.jumlah, 10) || 1,
        serial_nomor: it.serial_nomor || '-',
        no_inventaris: it.no_inventaris || '-',
        lokasi_aset: it.lokasi_aset || formData.lokasi,
        keterangan: it.keterangan || '-',
      })),
    };
  };

  // Preview PDF on-the-fly
  const handlePreviewPdf = async () => {
    setIsPreviewPdfModalOpen(true);
    setIsLoadingPreviewPdf(true);
    setPreviewPdfError(null);

    if (previewPdfBlobUrl) {
      URL.revokeObjectURL(previewPdfBlobUrl);
      setPreviewPdfBlobUrl(null);
    }

    try {
      const payload = buildPayload(false);
      const blob = await api.previewPdf(payload);
      const url = URL.createObjectURL(blob);
      setPreviewPdfBlobUrl(url);
    } catch (err) {
      console.error('Gagal memuat pratinjau PDF:', err);
      setPreviewPdfError(err.message || 'Gagal menghasilkan pratinjau PDF dari server backend.');
    } finally {
      setIsLoadingPreviewPdf(false);
    }
  };

  const handleClosePreviewPdf = () => {
    setIsPreviewPdfModalOpen(false);
    if (previewPdfBlobUrl) {
      URL.revokeObjectURL(previewPdfBlobUrl);
      setPreviewPdfBlobUrl(null);
    }
  };

  // Validate form fields prior to action
  const validateForm = () => {
    if (!formData.nama_pelaksana || !formData.nipp_pelaksana) {
      alert('Nama dan NIPP personil pelaksana wajib diisi.');
      return false;
    }
    if (!formData.lokasi) {
      alert('Lokasi / Business Area wajib diisi.');
      return false;
    }
    if (items.some(it => !it.nama_barang.trim())) {
      alert('Semua baris aset wajib memiliki Nama Barang.');
      return false;
    }
    return true;
  };

  // 1. Simpan Draf (tanpa tanda tangan / TTE)
  const handleSaveDraft = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = buildPayload(false);
      let res;
      if (isEditMode) {
        res = await api.updateDocument(id, payload);
      } else {
        res = await api.createDocument(payload);
      }

      showToast('Draf Formulir Penghapusan Aset TI berhasil disimpan.');
      const docId = res?.document?.id || res?.id || id;
      setTimeout(() => {
        if (docId) {
          navigate(`/penghapusan/${docId}`);
        } else {
          navigate('/penghapusan');
        }
      }, 900);
    } catch (err) {
      console.error('Save draft error:', err);
      let errMsg = err.message || 'Gagal menyimpan draf';
      if (err.errors) errMsg += ': ' + Object.values(err.errors).flat().join(', ');
      setErrorMessage(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Buka modal pengesahan TTE sebelum submit dokumen
  const handleOpenSubmitModal = () => {
    if (!validateForm()) return;
    if (!verifikator1) {
      alert('Harap pilih Pejabat Penyetuju (Verifikator I) terlebih dahulu.');
      return;
    }
    if (!verifikator2) {
      if (!confirm('Pejabat Mengetahui (Verifikator II) belum dipilih. Apakah Anda yakin ingin melanjutkan?')) {
        return;
      }
    }
    setSignError(null);
    setIsSignModalOpen(true);
  };

  // 3. Eksekusi TTE Pembuat + Submit Berantai ke Backend
  const handleExecuteSignAndSubmit = async (e) => {
    e.preventDefault();
    setSignError(null);

    // Validasi tanda tangan ketat
    if (signatureMode === 'draw' && !hasDrawnSignature) {
      setSignError('Harap goreskan tanda tangan Anda pada kanvas terlebih dahulu.');
      return;
    }
    if (signatureMode === 'upload' && !selectedSignatureFile) {
      setSignError('Harap pilih berkas gambar tanda tangan Anda (PNG/JPG).');
      return;
    }
    if (signatureMode === 'saved' && !hasServerSignature) {
      setSignError('Akun Anda belum memiliki tanda tangan tersimpan. Pilih opsi Goresan atau Unggah.');
      return;
    }
    if (!pinInput || pinInput.length < 4) {
      setSignError('PIN KAI Pass minimal 4 digit.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Step A: Upload signature to user's profile if newly drawn or uploaded
      if (signatureMode === 'draw' && canvasRef.current) {
        const dataUrl = canvasRef.current.toDataURL('image/png');
        const resBlob = await fetch(dataUrl);
        const blob = await resBlob.blob();
        const formDataUpload = new FormData();
        formDataUpload.append('signature', blob, 'signature_pelaksana.png');
        formDataUpload.append('pin', pinInput);
        await api.uploadSignature(formDataUpload);
      } else if (signatureMode === 'upload' && selectedSignatureFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('signature', selectedSignatureFile);
        formDataUpload.append('pin', pinInput);
        await api.uploadSignature(formDataUpload);
      }

      // Step B: Simpan & Ajukan Dokumen ke Backend
      const payload = {
        ...buildPayload(true),
        note: signNotes || 'Mengajukan formulir penghapusan aset TI.',
        signature_pin: pinInput,
      };

      let finalDocId = id;

      if (isEditMode) {
        // 1. Simpan update data
        await api.updateDocument(id, payload);
        // 2. Submit dokumen agar status beralih dari draft ke in_review dan nomor dokumen dibuat
        await api.submitDocument(id, {
          approver_id: Number(verifikator1),
          note: signNotes,
        });
      } else {
        // 1. Buat dokumen dengan submit: true & approver_id
        const res = await api.createDocument(payload);
        finalDocId = res?.document?.id || res?.id;
        // 2. Jika dokumen masih draft di response (antisipasi controller store), submit secara eksplisit
        if (finalDocId && (res?.document?.status === 'draft' || res?.status === 'draft')) {
          await api.submitDocument(finalDocId, {
            approver_id: Number(verifikator1),
            note: signNotes,
          });
        }
      }

      setIsSignModalOpen(false);
      showToast('Formulir Penghapusan Aset TI berhasil disahkan dan diajukan ke Verifikator I!');

      setTimeout(() => {
        if (finalDocId) {
          navigate(`/penghapusan/${finalDocId}`);
        } else {
          navigate('/penghapusan');
        }
      }, 1000);
    } catch (err) {
      console.error('Submit error:', err);
      let errMsg = err.message || 'Gagal mengesahkan dan mengajukan dokumen';
      if (err.errors) errMsg += ': ' + Object.values(err.errors).flat().join(', ');
      setSignError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-5xl mx-auto py-16 text-center">
        <Loader2 className="w-8 h-8 text-[#0b2046] animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-700">Memuat Formulir Penghapusan...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-20">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2.5 shadow-xl animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/penghapusan')}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-slate-600 transition-colors shadow-2xs"
            title="Kembali ke Daftar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded border border-blue-200">
                DSP-03 &bull; FR.SM/TI/015.007/10-2020
              </span>
              <span className="text-xs text-slate-400">Versi: 02-2020</span>
            </div>
            <h1 className="text-2xl font-bold text-[#0b2046] mt-1">
              {isEditMode ? 'Edit Formulir Penghapusan Aset TI' : 'Formulir Penghapusan Aset Teknologi Informasi'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleOpenImportDsp02}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl text-xs font-bold border border-blue-200 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Impor dari DSP-02</span>
          </button>
          <button
            type="button"
            onClick={handlePreviewPdf}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-[#0b2046] hover:bg-[#142e5d] text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            <Eye className="w-4 h-4 text-emerald-400" />
            <span>Pratinjau PDF</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* SECTION 1: HEADER & IDENTITAS DOKUMEN */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm">
            1
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0b2046]">Identitas Dokumen &amp; Lokasi</h3>
            <p className="text-xs text-slate-500">Nomor referensi, tanggal pelaksanaan, dan business area</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              No. Referensi (DSP-02 / Dasar) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nomor_referensi}
              onChange={(e) => setFormData({ ...formData, nomor_referensi: e.target.value })}
              placeholder="Contoh: BA-PMS/TI/DAOP1/10-2026/0014"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">Sesuai kotak header No. Ref pada formulir fisik</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tanggal Pelaksanaan <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={formData.tanggal}
              onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">Tanggal penetapan formulir penghapusan</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Lokasi / Business Area <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.lokasi}
              onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
              placeholder="Contoh: DAOP 1 Jakarta / Juanda"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">Area kerja atau unit logistik penyimpanan</p>
          </div>
        </div>
      </div>

      {/* SECTION 2: PERSONIL PELAKSANA */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0b2046]">Personil Pelaksana Penghapusan Aset</h3>
              <p className="text-xs text-slate-500">Penanggung jawab teknis eksekusi penghapusan aktiva</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSyncSSO}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sinkronkan Akun Saya</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Personil Pelaksana <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nama_pelaksana}
              onChange={(e) => setFormData({ ...formData, nama_pelaksana: e.target.value })}
              placeholder="Nama lengkap pelaksana"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              NIPP Pelaksana <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nipp_pelaksana}
              onChange={(e) => setFormData({ ...formData, nipp_pelaksana: e.target.value })}
              placeholder="Nomor Induk Personil"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Jabatan / Fungsi <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.jabatan_pelaksana}
              onChange={(e) => setFormData({ ...formData, jabatan_pelaksana: e.target.value })}
              placeholder="Fungsi pelaksana penghapusan"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: PERNYATAAN STATUS ASET */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm">
            3
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0b2046]">Pernyataan Status Aset Teknologi Informasi</h3>
            <p className="text-xs text-slate-500">Pilih salah satu kondisi aset yang dinyatakan pada formulir</p>
          </div>
        </div>

        <div className="pt-1">
          <p className="text-xs font-semibold text-slate-700 mb-3">
            Menyatakan bahwa Aset Teknologi Informasi dinyatakan :
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label
              className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                formData.status_kondisi === 'Dimusnahkan'
                  ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
              }`}
            >
              <input
                type="radio"
                name="status_kondisi"
                value="Dimusnahkan"
                checked={formData.status_kondisi === 'Dimusnahkan'}
                onChange={() => setFormData({ ...formData, status_kondisi: 'Dimusnahkan' })}
                className="mt-0.5 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Dimusnahkan</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Aset telah dihancurkan secara fisik/logis melalui tahapan Berita Acara Pemusnahan (DSP-02)
                </span>
              </div>
            </label>

            <label
              className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                formData.status_kondisi === 'Tidak Layak-Rusak'
                  ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
              }`}
            >
              <input
                type="radio"
                name="status_kondisi"
                value="Tidak Layak-Rusak"
                checked={formData.status_kondisi === 'Tidak Layak-Rusak'}
                onChange={() => setFormData({ ...formData, status_kondisi: 'Tidak Layak-Rusak' })}
                className="mt-0.5 text-amber-600 focus:ring-amber-500"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Tidak Layak / Rusak</span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Aset mengalami kerusakan berat permanen, usang, atau tidak ekonomis untuk diperbaiki
                </span>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* SECTION 4: TABEL RINCIAN ASET */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm">
              4
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0b2046]">Rincian Aset yang Dihapus</h3>
              <p className="text-xs text-slate-500">Sesuai kolom tabel template resmi FR.SM/TI/015.007/10-2020</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddItem}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f05a22] hover:bg-[#d94a18] text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Baris Aset</span>
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b2046] text-white font-semibold">
              <tr>
                <th className="py-2.5 px-3 text-center w-12">No</th>
                <th className="py-2.5 px-3 min-w-[200px]">Nama Barang *</th>
                <th className="py-2.5 px-3 text-center w-20">Jumlah *</th>
                <th className="py-2.5 px-3 min-w-[140px]">Serial Nomor</th>
                <th className="py-2.5 px-3 min-w-[140px]">No. Inventaris</th>
                <th className="py-2.5 px-3 min-w-[150px]">Lokasi Aset</th>
                <th className="py-2.5 px-3 min-w-[160px]">Keterangan</th>
                <th className="py-2.5 px-3 text-center w-12">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {items.map((it, idx) => (
                <tr key={it.id || idx} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-3 text-center font-semibold text-slate-600">
                    {idx + 1}
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={it.nama_barang}
                      onChange={(e) => handleItemChange(it.id, 'nama_barang', e.target.value)}
                      placeholder="Nama aset yang dihapus..."
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      min="1"
                      value={it.jumlah}
                      onChange={(e) => handleItemChange(it.id, 'jumlah', e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-center font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={it.serial_nomor}
                      onChange={(e) => handleItemChange(it.id, 'serial_nomor', e.target.value)}
                      placeholder="SN-..."
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={it.no_inventaris}
                      onChange={(e) => handleItemChange(it.id, 'no_inventaris', e.target.value)}
                      placeholder="AST-..."
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={it.lokasi_aset}
                      onChange={(e) => handleItemChange(it.id, 'lokasi_aset', e.target.value)}
                      placeholder="Tempat keberadaan..."
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={it.keterangan}
                      onChange={(e) => handleItemChange(it.id, 'keterangan', e.target.value)}
                      placeholder="Keterangan lebih lanjut..."
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(it.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Hapus Baris"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 5: SAKSI-SAKSI */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm">
            5
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0b2046]">Saksi-Saksi Penghapusan Aset</h3>
            <p className="text-xs text-slate-500">
              Dilaksanakan dihadapan para saksi yang nama dan tanda tangannya tercantum dalam formulir
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Saksi 1 */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-blue-100 text-blue-800 flex items-center justify-center text-[10px] font-bold">1</span>
              <span>Saksi I (Audit / Pengawas Internal)</span>
            </h4>
            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Nama Saksi I</label>
                <input
                  type="text"
                  value={saksi1.nama}
                  onChange={(e) => setSaksi1({ ...saksi1, nama: e.target.value })}
                  placeholder="Nama saksi 1"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">NIPP Saksi I</label>
                  <input
                    type="text"
                    value={saksi1.nipp}
                    onChange={(e) => setSaksi1({ ...saksi1, nipp: e.target.value })}
                    placeholder="NIPP..."
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Jabatan / Fungsi</label>
                  <input
                    type="text"
                    value={saksi1.jabatan}
                    onChange={(e) => setSaksi1({ ...saksi1, jabatan: e.target.value })}
                    placeholder="Jabatan..."
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Saksi 2 */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-blue-100 text-blue-800 flex items-center justify-center text-[10px] font-bold">2</span>
              <span>Saksi II (Keuangan &amp; Aset)</span>
            </h4>
            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Nama Saksi II</label>
                <input
                  type="text"
                  value={saksi2.nama}
                  onChange={(e) => setSaksi2({ ...saksi2, nama: e.target.value })}
                  placeholder="Nama saksi 2"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">NIPP Saksi II</label>
                  <input
                    type="text"
                    value={saksi2.nipp}
                    onChange={(e) => setSaksi2({ ...saksi2, nipp: e.target.value })}
                    placeholder="NIPP..."
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Jabatan / Fungsi</label>
                  <input
                    type="text"
                    value={saksi2.jabatan}
                    onChange={(e) => setSaksi2({ ...saksi2, jabatan: e.target.value })}
                    placeholder="Jabatan..."
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 6: ALUR VERIFIKASI / PEJABAT PENANDATANGAN */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm">
            6
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0b2046]">Alur Pengesahan Pejabat (Approval Chain)</h3>
            <p className="text-xs text-slate-500">
              Sesuai kolom tanda tangan formulir: Dilakukan (Pelaksana), Disetujui (Verifikator 1), Mengetahui (Verifikator 2)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Verifikator 1 - Disetujui */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">1. Disetujui (Verifikator I) <span className="text-rose-500">*</span></span>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded border border-emerald-200">
                Tahap 1
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Pejabat yang berwenang memberikan persetujuan penghapusan aktiva
            </p>
            <select
              value={verifikator1}
              onChange={(e) => setVerifikator1(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">-- Pilih Pejabat Penyetuju --</option>
              {apiUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nama || u.name} - {u.nip || '-'} ({typeof u.jabatan === 'object' ? u.jabatan?.nama : (u.jabatan || u.role || 'Pejabat')})
                </option>
              ))}
            </select>
          </div>

          {/* Verifikator 2 - Mengetahui */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">2. Mengetahui (Verifikator II)</span>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded border border-blue-200">
                Tahap 2
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Pimpinan unit kerja / Head of Asset &amp; IT yang mengetahui penghapusan
            </p>
            <select
              value={verifikator2}
              onChange={(e) => setVerifikator2(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">-- Pilih Pejabat Mengetahui --</option>
              {apiUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nama || u.name} - {u.nip || '-'} ({typeof u.jabatan === 'object' ? u.jabatan?.nama : (u.jabatan || u.role || 'Pejabat')})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className="sticky bottom-4 z-40 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl flex flex-col sm:flex-row justify-between items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/penghapusan')}
          className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
        >
          Batal
        </button>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={handlePreviewPdf}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors border border-slate-200"
          >
            <Eye className="w-4 h-4 text-blue-600" />
            <span>Pratinjau PDF</span>
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSubmitting}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-colors shadow-2xs"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            ) : (
              <Save className="w-4 h-4 text-slate-500" />
            )}
            <span>Simpan Draf</span>
          </button>

          <button
            type="button"
            onClick={handleOpenSubmitModal}
            disabled={isSubmitting}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 bg-[#f05a22] hover:bg-[#d94a18] text-white rounded-xl text-xs font-bold transition-colors shadow-sm shadow-[#f05a22]/30"
          >
            <PenTool className="w-4 h-4" />
            <span>Tanda Tangani &amp; Ajukan</span>
          </button>
        </div>
      </div>

      {/* MODAL PENGESAHAN TTE PEMBUAT / PELAKSANA */}
      {isSignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 max-h-[90vh]">
            <div className="px-6 py-4 bg-[#0b2046] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Pengesahan TTE Pelaksana Penghapusan Aset</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Kolom &quot;Dilakukan&quot; &bull; {formData.nama_pelaksana} (NIPP: {formData.nipp_pelaksana})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSignModalOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteSignAndSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              {signError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{signError}</span>
                </div>
              )}

              {/* Signature Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Tanda Tangan Pelaksana (Dilakukan) <span className="text-rose-500">*</span>
                </label>
                <SignatureSelector
                  mode={signatureMode}
                  setMode={setSignatureMode}
                  signatureMode={signatureMode}
                  setSignatureMode={setSignatureMode}
                  canvasRef={canvasRef}
                  hasDrawn={hasDrawnSignature}
                  setHasDrawn={setHasDrawnSignature}
                  hasDrawnSignature={hasDrawnSignature}
                  setHasDrawnSignature={setHasDrawnSignature}
                  selectedFile={selectedSignatureFile}
                  setSelectedFile={setSelectedSignatureFile}
                  selectedSignatureFile={selectedSignatureFile}
                  setSelectedSignatureFile={setSelectedSignatureFile}
                  hasServerSignature={hasServerSignature}
                  serverSignatureUrl={serverSignatureUrl}
                  user={user}
                />
              </div>

              {/* PIN KAI Pass */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  PIN Otorisasi KAI Pass <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    maxLength={8}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="Masukkan 6 digit PIN KAI Pass"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 tracking-widest font-mono"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Default PIN simulasi: 123456</p>
              </div>

              {/* Catatan Pengajuan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Pengajuan
                </label>
                <textarea
                  rows={2}
                  value={signNotes}
                  onChange={(e) => setSignNotes(e.target.value)}
                  placeholder="Catatan pengajuan penghapusan aset..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsSignModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-[#f05a22] hover:bg-[#d94a18] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm shadow-[#f05a22]/30"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mengesahkan &amp; Mengajukan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Sahkan &amp; Ajukan Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL IMPORT DSP-02 */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 max-h-[85vh]">
            <div className="px-6 py-4 bg-[#0b2046] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Impor dari Berita Acara Pemusnahan (DSP-02)</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">Pilih dokumen berita acara pemusnahan yang mendasari penghapusan ini</p>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 flex-1 bg-slate-50">
              {isLoadingDsp02 ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-8 h-8 text-[#0b2046] animate-spin mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">Memuat berkas DSP-02...</p>
                </div>
              ) : dsp02List.length === 0 ? (
                <div className="py-12 text-center bg-white rounded-xl border border-slate-200 p-6">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">Belum ada dokumen DSP-02 ditemukan di sistem</p>
                </div>
              ) : (
                dsp02List.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => handleSelectDsp02(doc)}
                    className="p-4 bg-white hover:bg-blue-50/50 rounded-xl border border-slate-200 hover:border-blue-400 cursor-pointer transition-all shadow-2xs group"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded border border-blue-200">
                            DSP-02
                          </span>
                          <span className="font-bold text-xs text-[#0b2046] group-hover:text-blue-700">
                            {doc.number || `BA-PMS/TI/000${doc.id}/2026`}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 font-medium">
                          {doc.items?.[0]?.nama_aset || doc.data?.items?.[0]?.nama_aset || 'Pemusnahan Perangkat TI'}
                          {(doc.items?.length > 1 || doc.data?.items?.length > 1) && ' (+ aset lainnya)'}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Lokasi: {doc.data?.lokasi || doc.data?.business_area || 'Kantor Pusat Bandung'}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 bg-blue-600 text-white text-[11px] font-bold rounded-lg group-hover:bg-blue-700 transition-colors">
                        Pilih &amp; Salin
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL LIVE PDF PREVIEW */}
      {isPreviewPdfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-5xl h-[88vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-[#0b2046] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Pratinjau Formulir Penghapusan Aset TI (DSP-03)</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5 font-mono">FR.SM/TI/015.007/10-2020 &bull; Versi: 02-2020</p>
              </div>
              <div className="flex items-center gap-2">
                {previewPdfBlobUrl && (
                  <a
                    href={previewPdfBlobUrl}
                    download="Formulir_Penghapusan_Aset_TI_DSP03.pdf"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>Unduh PDF</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={handleClosePreviewPdf}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-100 relative">
              {isLoadingPreviewPdf && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-10">
                  <Loader2 className="w-8 h-8 text-[#0b2046] animate-spin mb-3" />
                  <p className="text-sm font-bold text-slate-800">Menghasilkan Dokumen PDF dari Backend...</p>
                  <p className="text-xs text-slate-500 mt-1">Template PDF resmi FR.SM/TI/015.007/10-2020</p>
                </div>
              )}

              {previewPdfError ? (
                <div className="p-8 text-center max-w-md mx-auto my-12 bg-white rounded-xl border border-rose-200 shadow-sm">
                  <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
                  <h4 className="font-bold text-sm text-slate-800">Gagal Memuat PDF</h4>
                  <p className="text-xs text-slate-500 mt-1">{previewPdfError}</p>
                  <button
                    type="button"
                    onClick={handleClosePreviewPdf}
                    className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg"
                  >
                    Tutup
                  </button>
                </div>
              ) : previewPdfBlobUrl ? (
                <iframe
                  src={previewPdfBlobUrl}
                  title="PDF Preview DSP-03"
                  className="w-full h-full border-none"
                />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
