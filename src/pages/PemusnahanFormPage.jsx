import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  Calendar, 
  User, 
  Building, 
  FileText, 
  Trash2, 
  Plus, 
  Info, 
  Save, 
  Send, 
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Check,
  Loader2,
  Users,
  ArrowRight,
  GitBranch,
  Lock,
  Clock,
  RotateCcw,
  XCircle,
  Edit3
} from 'lucide-react';
import { api } from '../services/api';

const REVISION_CATEGORY_OPTIONS = [
  'Perbaikan Nomor Seri / ID Aset SAP',
  'Penyesuaian Spesifikasi & Alasan Teknis Kerusakan',
  'Pembaruan Nomor Referensi Nota Dinas',
  'Penambahan / Pengurangan Item Perangkat',
  'Penyesuaian Pejabat Verifikator',
];

export default function PemusnahanFormPage({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = Boolean(id);
  const isRevisiRoute = location.pathname.endsWith('/revisi');

  const [isLoadingDoc, setIsLoadingDoc] = useState(isEditMode);
  const [isLockedNonDraft, setIsLockedNonDraft] = useState(false);
  const [existingDoc, setExistingDoc] = useState(null);
  const [docStatus, setDocStatus] = useState('');

  // Revision form state
  const [revisionNote, setRevisionNote] = useState('');
  const [selectedChanges, setSelectedChanges] = useState([]);

  const [assets, setAssets] = useState([
    { id: 1, nama: 'Server Dell PowerEdge R740', jenis: 'Fisik (Hardware)', sn: 'SN-98214-KAI-SRV', alasan: 'Kerusakan fatal motherboard & melewati batas usia depresiasi 5 tahun' },
    { id: 2, nama: 'Cisco Catalyst 3850 48-Port PoE', jenis: 'Jaringan (Network)', sn: 'MAC-7721-CC-081', alasan: 'Port modul korsleting sambaran petir, tidak dapat direparasi' }
  ]);
  const [reference, setReference] = useState('');

  // Approvers state for the 3-tier approval chain
  const [approvers, setApprovers] = useState([]);
  const [isLoadingApprovers, setIsLoadingApprovers] = useState(true);
  const [verifikator1, setVerifikator1] = useState('');
  const [verifikator2, setVerifikator2] = useState('');
  const [verifikator3, setVerifikator3] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  const isRevisionMode = isEditMode && (isRevisiRoute || docStatus === 'rejected' || docStatus === 'ditolak');

  // Fetch all approvers from backend (all=1 ensures complete list of officials)
  useEffect(() => {
    const fetchApprovers = async () => {
      try {
        setIsLoadingApprovers(true);
        const res = await api.getApprovers('all=1').catch(() => api.getApprovers());
        const list = Array.isArray(res) ? res : (res?.data || []);
        setApprovers(list);

        // Smart auto-selection for the 3 roles based on hierarchy (only in create mode)
        if (!isEditMode) {
          const asmen = list.find(u => {
            const jab = (typeof u.jabatan === 'object' ? u.jabatan?.nama || u.jabatan?.kode : u.jabatan || '').toUpperCase();
            return jab.includes('ASMEN') || jab.includes('ASISTEN');
          });
          const manager = list.find(u => {
            const jab = (typeof u.jabatan === 'object' ? u.jabatan?.nama || u.jabatan?.kode : u.jabatan || '').toUpperCase();
            return jab.includes('MANAGER') && (!asmen || u.id !== asmen.id);
          });
          const vpOrKdaop = list.find(u => {
            const jab = (typeof u.jabatan === 'object' ? u.jabatan?.nama || u.jabatan?.kode : u.jabatan || '').toUpperCase();
            return (jab.includes('VP') || jab.includes('KDAOP') || jab.includes('PRESIDENT')) &&
              (!asmen || u.id !== asmen.id) && (!manager || u.id !== manager.id);
          });

          const v1 = asmen?.id || list[0]?.id || '';
          const v2 = manager?.id || list.find(u => u.id !== v1)?.id || list[1]?.id || '';
          const v3 = vpOrKdaop?.id || list.find(u => u.id !== v1 && u.id !== v2)?.id || list[2]?.id || '';

          if (v1) setVerifikator1(String(v1));
          if (v2) setVerifikator2(String(v2));
          if (v3) setVerifikator3(String(v3));
        }
      } catch (err) {
        console.error('Failed to load approvers:', err);
      } finally {
        setIsLoadingApprovers(false);
      }
    };
    fetchApprovers();
  }, [user, isEditMode]);

  // Load draft or rejected document when in Edit / Revision Mode
  useEffect(() => {
    if (!id) return;
    async function loadDraftDoc() {
      setIsLoadingDoc(true);
      try {
        const res = await api.getDocument(id);
        const doc = res?.document || res?.data || res;
        if (doc) {
          setExistingDoc(doc);
          const d = doc.data || {};
          const status = (doc.status || '').toLowerCase();
          setDocStatus(status);

          // Lock only if document is neither draft nor rejected (unless explicitly opened via /revisi for testing)
          if (status && status !== 'draft' && status !== 'draf' && status !== 'rejected' && status !== 'ditolak' && !isRevisiRoute) {
            setIsLockedNonDraft(true);
          } else {
            setIsLockedNonDraft(false);
          }

          if (d.nomor_referensi || doc.nomor || doc.number) {
            setReference(d.nomor_referensi || doc.nomor || doc.number || '');
          }

          // Restore chosen verifiers from doc.data, approval_chain, approvals, or localStorage backup
          let localSavedEntry = null;
          try {
            const storedMap = JSON.parse(localStorage.getItem('sipakai_dsp01_approvers') || '{}');
            localSavedEntry = storedMap[String(doc.id)] || (doc.number ? storedMap[String(doc.number)] : null) || (doc.nomor ? storedMap[String(doc.nomor)] : null);
          } catch (e) {}

          const chainArr = Array.isArray(d.approval_chain) && d.approval_chain.length > 0
            ? d.approval_chain
            : (Array.isArray(localSavedEntry?.approval_chain) ? localSavedEntry.approval_chain : []);
          const docApprovals = doc.approvals || doc.persetujuan || [];

          const resolvedV1 = d.verifikator_1_id || d.verifikator_1?.id || chainArr[0] || localSavedEntry?.verifikator_1_id || localSavedEntry?.v1?.id || docApprovals.find(a => Number(a.step) === 1)?.approver_id || doc.approver_id || doc.penyetuju_id;
          const resolvedV2 = d.verifikator_2_id || d.verifikator_2?.id || chainArr[1] || localSavedEntry?.verifikator_2_id || localSavedEntry?.v2?.id || docApprovals.find(a => Number(a.step) === 2)?.approver_id;
          const resolvedV3 = d.verifikator_3_id || d.verifikator_3?.id || chainArr[2] || localSavedEntry?.verifikator_3_id || localSavedEntry?.v3?.id || docApprovals.find(a => Number(a.step) === 3)?.approver_id;

          if (resolvedV1) setVerifikator1(String(resolvedV1));
          if (resolvedV2) setVerifikator2(String(resolvedV2));
          if (resolvedV3) setVerifikator3(String(resolvedV3));

          if (d.catatan_revisi) {
            setRevisionNote(d.catatan_revisi);
          }
          if (Array.isArray(d.kategori_revisi)) {
            setSelectedChanges(d.kategori_revisi);
          }

          const docItems = doc.items || d.items;
          if (Array.isArray(docItems) && docItems.length > 0) {
            setAssets(docItems.map((it, idx) => ({
              id: it.id || idx + 1,
              nama: it.nama_aset || it.nama || '',
              jenis: it.jenis_aset ? (it.jenis_aset === 'Jaringan' ? 'Jaringan (Network)' : it.jenis_aset === 'Informasi' ? 'Lisensi/Software' : 'Fisik (Hardware)') : (it.jenis || 'Fisik (Hardware)'),
              sn: it.id_aset || it.sn || it.serial_number || '',
              alasan: it.alasan_pemusnahan || it.alasan || ''
            })));
          }
        }
      } catch (err) {
        console.error('Failed to load document for edit/revision:', err);
        setSubmitError('Gagal memuat dokumen: ' + (err.message || 'Dokumen tidak ditemukan'));
      } finally {
        setIsLoadingDoc(false);
      }
    }
    loadDraftDoc();
  }, [id, isRevisiRoute]);

  const getApproverDetail = (id) => {
    if (!id) return null;
    const appr = approvers.find(u => String(u.id) === String(id));
    if (!appr) return null;
    const displayName = appr.name || appr.nama || 'Pejabat Otorisator';
    const jab = (typeof appr.jabatan === 'object' ? appr.jabatan?.nama : appr.jabatan) || appr.jabatan_relasi?.nama || 'Pejabat Otorisator';
    return {
      id: appr.id,
      name: displayName,
      nip: appr.nip || '-',
      jabatan: jab,
      unit_kerja: appr.unit_kerja || 'Unit Kantor Pusat',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0b2046&color=fff`,
    };
  };

  // Extract rejection details from existingDoc
  const approvalHistory = existingDoc?.approvals || existingDoc?.persetujuan || [];
  const rejectedApproval = approvalHistory.find(a => (a.action === 'REJECTED' || a.aksi === 'rejected'));
  const rejectionReason = rejectedApproval?.catatan || rejectedApproval?.note || existingDoc?.data?.catatan_penolakan || 'Mohon periksa kembali kelengkapan nomor seri aset, spesifikasi perangkat, serta kesesuaian nomor referensi Nota Dinas pendukung.';
  const rejectedBy = rejectedApproval?.approver?.nama || rejectedApproval?.approver?.name || 'Pejabat Verifikator Otorisator';
  const rejectedByJabatan = (typeof rejectedApproval?.approver?.jabatan === 'object' ? rejectedApproval?.approver?.jabatan?.nama : rejectedApproval?.approver?.jabatan) || '';
  const rejectedStep = rejectedApproval?.step || 1;
  const rejectedDateRaw = rejectedApproval?.acted_at || existingDoc?.updated_at;
  const rejectedDateDisplay = rejectedDateRaw
    ? new Date(rejectedDateRaw).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  const toggleRevisionCategory = (categoryLabel) => {
    setSelectedChanges(prev =>
      prev.includes(categoryLabel)
        ? prev.filter(c => c !== categoryLabel)
        : [...prev, categoryLabel]
    );
  };

  const handleAddAsset = () => {
    setAssets([...assets, { id: Date.now(), nama: '', jenis: 'Fisik (Hardware)', sn: '', alasan: '' }]);
  };

  const handleRemoveAsset = (id) => {
    if (assets.length <= 1) {
      alert('Dokumen harus memiliki minimal 1 aset.');
      return;
    }
    setAssets(assets.filter(a => a.id !== id));
  };

  const hasDuplicateVerifiers = (verifikator1 && verifikator2 && verifikator1 === verifikator2) ||
    (verifikator1 && verifikator3 && verifikator1 === verifikator3) ||
    (verifikator2 && verifikator3 && verifikator2 === verifikator3);

  const v1Data = getApproverDetail(verifikator1);
  const v2Data = getApproverDetail(verifikator2);
  const v3Data = getApproverDetail(verifikator3);

  const handleSubmit = async (submitNow) => {
    setSubmitError(null);
    setSubmitSuccess(null);

    // Validate revision note when submitting a rejected document revision
    if (isRevisionMode && submitNow && !revisionNote.trim()) {
      setSubmitError('Harap isi Catatan Tindak Lanjut Revisi pada bagian Evaluasi & Revisi untuk menjelaskan perbaikan yang telah dilakukan sebelum mengajukan ulang permohonan.');
      window.scrollTo({ top: 150, behavior: 'smooth' });
      const revInput = document.getElementById('input-catatan-revisi');
      if (revInput) revInput.focus();
      return;
    }

    // Validate assets
    const validAssets = assets.filter(a => a.nama && a.nama.trim() !== '');
    if (submitNow && validAssets.length === 0) {
      setSubmitError('Harap isi minimal 1 data perangkat aset pada Bagian 2.');
      window.scrollTo({ top: 300, behavior: 'smooth' });
      return;
    }

    if (submitNow && !verifikator1) {
      setSubmitError('Pilih minimal Verifikator 1 untuk mengajukan dokumen permohonan.');
      window.scrollTo({ top: 600, behavior: 'smooth' });
      return;
    }

    if (submitNow && hasDuplicateVerifiers) {
      setSubmitError('Setiap tahap verifikasi wajib dipercayakan kepada pejabat yang berbeda demi prinsip tata kelola pemisahan tugas (Segregation of Duties).');
      window.scrollTo({ top: 600, behavior: 'smooth' });
      return;
    }

    if (submitNow) {
      setIsSubmitting(true);
    } else {
      setIsSavingDraft(true);
    }

    try {
      const v1Num = verifikator1 ? Number(verifikator1) : null;
      const v2Num = verifikator2 ? Number(verifikator2) : null;
      const v3Num = verifikator3 ? Number(verifikator3) : null;

      // Build sequential approval chain array matching requester's choices
      const chain = [v1Num, v2Num, v3Num].filter(Boolean);

      const itemsToSave = (validAssets.length > 0 ? validAssets : assets).map((a, idx) => ({
        nama_aset: (a.nama || '').trim(),
        jenis_aset: a.jenis ? (a.jenis.includes('Jaringan') ? 'Jaringan' : a.jenis.includes('Lisensi') ? 'Informasi' : 'Fisik') : 'Fisik',
        id_aset: a.sn?.trim() || `AST-KAI-${Date.now().toString().slice(-4)}-${idx + 1}`,
        alasan_pemusnahan: a.alasan?.trim() || 'Kerusakan fatal & melewati batas usia pemakaian teknis',
      }));

      const nextRevisiCount = (Number(existingDoc?.data?.revisi_ke) || 0) + 1;
      const revisionMetadata = (isRevisionMode || existingDoc?.data?.is_revised)
        ? {
            is_revised: true,
            revisi_ke: isRevisionMode && submitNow ? nextRevisiCount : (Number(existingDoc?.data?.revisi_ke) || 1),
            catatan_revisi: revisionNote.trim() || existingDoc?.data?.catatan_revisi || undefined,
            kategori_revisi: selectedChanges.length > 0 ? selectedChanges : (existingDoc?.data?.kategori_revisi || undefined),
            revised_at: new Date().toISOString(),
            catatan_penolakan_sebelumnya: rejectionReason || undefined,
            riwayat_revisi: [
              ...(Array.isArray(existingDoc?.data?.riwayat_revisi) ? existingDoc.data.riwayat_revisi : []),
              ...(submitNow && isRevisionMode
                ? [{
                    revisi_ke: nextRevisiCount,
                    tanggal: new Date().toISOString(),
                    oleh: user?.name || existingDoc?.data?.nama_pemohon || 'Pemohon',
                    catatan_penolakan: rejectionReason,
                    catatan_revisi: revisionNote.trim(),
                    kategori_revisi: selectedChanges,
                  }]
                : []),
            ],
          }
        : {};

      const v1Snapshot = v1Data ? { id: v1Num, name: v1Data.name, nama: v1Data.name, nip: v1Data.nip, jabatan: v1Data.jabatan, unit_kerja: v1Data.unit_kerja } : null;
      const v2Snapshot = v2Data ? { id: v2Num, name: v2Data.name, nama: v2Data.name, nip: v2Data.nip, jabatan: v2Data.jabatan, unit_kerja: v2Data.unit_kerja } : null;
      const v3Snapshot = v3Data ? { id: v3Num, name: v3Data.name, nama: v3Data.name, nip: v3Data.nip, jabatan: v3Data.jabatan, unit_kerja: v3Data.unit_kerja } : null;

      const payload = {
        type: 'dsp01',
        submit: submitNow,
        status: submitNow ? 'in_review' : 'draft',
        approver_id: submitNow ? v1Num : (v1Num || undefined),
        note: isRevisionMode && revisionNote.trim()
          ? `Revisi Permohonan (#${nextRevisiCount}): ${revisionNote.trim()}`
          : undefined,
        data: {
          tanggal_permohonan: existingDoc?.data?.tanggal_permohonan || new Date().toISOString().split('T')[0],
          nama_pemohon: existingDoc?.data?.nama_pemohon || user?.name,
          nip_pemohon: existingDoc?.data?.nip_pemohon || user?.nip,
          unit_kerja: existingDoc?.data?.unit_kerja || user?.location || 'Unit Kantor Pusat',
          nomor_referensi: reference || undefined,
          verifikator_1_id: v1Num,
          verifikator_2_id: v2Num,
          verifikator_3_id: v3Num,
          verifikator_1_nama: v1Data?.name || undefined,
          verifikator_1_jabatan: v1Data?.jabatan || undefined,
          verifikator_1_nip: v1Data?.nip || undefined,
          verifikator_1_unit: v1Data?.unit_kerja || undefined,
          verifikator_2_nama: v2Data?.name || undefined,
          verifikator_2_jabatan: v2Data?.jabatan || undefined,
          verifikator_2_nip: v2Data?.nip || undefined,
          verifikator_2_unit: v2Data?.unit_kerja || undefined,
          verifikator_3_nama: v3Data?.name || undefined,
          verifikator_3_jabatan: v3Data?.jabatan || undefined,
          verifikator_3_nip: v3Data?.nip || undefined,
          verifikator_3_unit: v3Data?.unit_kerja || undefined,
          verifikator_1: v1Snapshot || undefined,
          verifikator_2: v2Snapshot || undefined,
          verifikator_3: v3Snapshot || undefined,
          approval_chain: chain,
          ...revisionMetadata,
        },
        items: itemsToSave,
      };

      let resDoc = null;
      if (isEditMode) {
        try {
          resDoc = await api.updateDocument(id, payload);
          if (submitNow && v1Num) {
            const subRes = await api.submitDocument(id, {
              approver_id: v1Num,
              note: isRevisionMode
                ? `Revisi Permohonan (#${nextRevisiCount}): ${revisionNote.trim()}`
                : 'Mengajukan permohonan pemusnahan aset TI (DSP-01).',
            }).catch(() => null);
            if (subRes) resDoc = subRes;
          }
        } catch (updateErr) {
          if (isRevisionMode) {
            // Fallback jika backend mengunci dokumen berstatus rejected dari update langsung:
            // buat dokumen pengajuan revisi baru yang merujuk ke dokumen yang ditolak
            resDoc = await api.createDocument({
              ...payload,
              data: {
                ...payload.data,
                revisi_dari_id: id,
                revisi_dari_nomor: existingDoc?.number || existingDoc?.nomor,
              },
            });
          } else {
            throw updateErr;
          }
        }
      } else {
        resDoc = await api.createDocument(payload);
      }
      try {
        window.dispatchEvent(new Event('sipakai:notification_refresh'));
      } catch (e) {}

      const createdDocId = resDoc?.document?.id || resDoc?.id || id;
      const createdDocNumber = resDoc?.document?.number || resDoc?.document?.nomor || resDoc?.number || existingDoc?.number || existingDoc?.nomor;

      // Simpan pilihan verifikator pemohon ke localStorage agar Alur Persetujuan Berjenjang selalu sinkron
      try {
        const storedMap = JSON.parse(localStorage.getItem('sipakai_dsp01_approvers') || '{}');
        const entry = {
          verifikator_1_id: v1Num,
          verifikator_2_id: v2Num,
          verifikator_3_id: v3Num,
          approval_chain: chain,
          v1: v1Snapshot,
          v2: v2Snapshot,
          v3: v3Snapshot,
          updated_at: new Date().toISOString(),
        };
        if (createdDocId) storedMap[String(createdDocId)] = entry;
        if (id) storedMap[String(id)] = entry;
        if (createdDocNumber) storedMap[String(createdDocNumber)] = entry;
        localStorage.setItem('sipakai_dsp01_approvers', JSON.stringify(storedMap));
      } catch (e) {}

      if (!submitNow) {
        setDraftSavedAt(new Date());
        setSubmitSuccess(
          isRevisionMode
            ? 'Draf perbaikan revisi permohonan pemusnahan aset (DSP-01) berhasil disimpan.'
            : 'Draf permohonan pemusnahan aset (DSP-01) berhasil disimpan.'
        );
        setTimeout(() => {
          navigate(createdDocId ? `/pemusnahan/${createdDocId}` : '/pemusnahan');
        }, 1200);
      } else {
        setSubmitSuccess(
          isRevisionMode
            ? 'Revisi permohonan pemusnahan aset berhasil disimpan dan diajukan kembali ke Verifikator Tahap 1!'
            : isEditMode
            ? 'Permohonan pemusnahan aset berhasil diperbarui dan dialirkan ke verifikator!'
            : 'Permohonan pemusnahan aset berhasil disimpan dan dialirkan ke verifikator!'
        );
        setTimeout(() => {
          navigate(createdDocId ? `/pemusnahan/${createdDocId}` : '/pemusnahan');
        }, 1500);
      }
    } catch (err) {
      setSubmitError(err.message || 'Terjadi kesalahan saat memproses permohonan.');
    } finally {
      setIsSubmitting(false);
      setIsSavingDraft(false);
    }
  };

  const today = existingDoc?.data?.tanggal_permohonan
    ? new Date(existingDoc.data.tanggal_permohonan).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

  if (isLoadingDoc) {
    return (
      <div className="w-full max-w-[1050px] mx-auto py-24 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-[#f05a22]" />
        <span className="text-sm font-semibold">
          {isRevisiRoute ? 'Memuat formulir revisi permohonan pemusnahan...' : 'Memuat formulir draf permohonan pemusnahan...'}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1050px] mx-auto pb-12">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {isRevisionMode && (
              <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 border border-rose-200 rounded-md text-xs font-extrabold uppercase tracking-wide flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                Formulir Revisi Permohonan Ditolak
              </span>
            )}
            {existingDoc && (existingDoc.number || existingDoc.nomor) && (
              <span className="px-2.5 py-0.5 bg-slate-100 text-[#0b2046] border border-slate-200 rounded-md text-xs font-mono font-bold">
                {existingDoc.number || existingDoc.nomor}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-extrabold text-[#0b2046] tracking-tight mb-1">
            {isRevisionMode
              ? 'Formulir Revisi Permohonan Pemusnahan Aset'
              : isEditMode
              ? 'Edit Formulir Permohonan Pemusnahan Aset'
              : 'Formulir Permohonan Pemusnahan Aset'}
          </h1>
          <p className="text-sm text-slate-500">
            {isRevisionMode
              ? 'Perbaiki rincian perangkat, alasan teknis, atau dokumen pendukung sesuai catatan evaluasi verifikator untuk diajukan kembali.'
              : 'Formulir ini digunakan oleh unit kerja untuk mengajukan permohonan disposisi/pemusnahan aset TI PT Kereta Api Indonesia (Persero).'}
          </p>
        </div>
        <button
          onClick={() => navigate('/pemusnahan')}
          className="self-start md:self-auto px-4 py-2 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors"
        >
          ← Kembali ke Daftar
        </button>
      </div>

      {/* Info Banner */}
      <div className={`border rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4 mb-6 shadow-xs ${
        isRevisionMode ? 'bg-rose-50/70 border-rose-200' : 'bg-[#f4f7fa] border-[#e2e8f0]'
      }`}>
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${isRevisionMode ? 'bg-rose-600' : 'bg-orange-600'}`}></span>
          <span className="text-sm font-bold text-[#0b2046]">
            Mode Aktif: {isRevisionMode
              ? 'Formulir Revisi Permohonan Pemusnahan Aset TI [DSP - 01]'
              : isEditMode
              ? 'Sunting Draf Permohonan Pemusnahan Aset TI [DSP - 01]'
              : 'Formulir Permohonan Pemusnahan Aset TI [DSP - 01]'}
          </span>
        </div>
        <div className={`px-2.5 py-1 text-xs font-extrabold rounded tracking-wide w-fit ${
          isRevisionMode
            ? 'bg-rose-600 text-white'
            : 'bg-blue-100 text-[#0b2046]'
        }`}>
          {isRevisionMode
            ? `REVISI KE-${(Number(existingDoc?.data?.revisi_ke) || 0) + 1}`
            : isEditMode
            ? 'MODE SUNTING DRAF'
            : 'TAHAP PERMOHONAN BERJENJANG'}
        </div>
        <div className="md:ml-auto flex items-center gap-2 text-xs text-slate-600">
          <Info className="w-4 h-4 text-[#f05a22] shrink-0" />
          <span>
            {isRevisionMode
              ? 'Setelah direvisi, permohonan akan diajukan ulang mulai dari Verifikator Tahap 1.'
              : 'Pengajuan akan melewati 3 tingkat verifikasi sebelum disahkan menjadi Berita Acara [DSP-02].'}
          </span>
        </div>
      </div>

      {/* Alert if document is locked non-draft and not rejected */}
      {isLockedNonDraft && (
        <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-300 text-amber-900 rounded-xl flex items-center justify-between gap-3 text-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Dokumen Sedang Diproses / Telah Disetujui</span>
              <p className="text-xs text-amber-800 mt-0.5">Dokumen ini sedang berada dalam alur verifikasi atau telah disahkan, sehingga tidak dapat disunting kembali.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/pemusnahan/${id}`)}
            className="px-3.5 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 shrink-0 transition-colors"
          >
            Lihat Status
          </button>
        </div>
      )}

      {/* Notifications */}
      {draftSavedAt && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Draf terakhir berhasil disimpan pada: <strong>{draftSavedAt.toLocaleTimeString('id-ID')}</strong>. Anda dapat keluar dan melanjutkan pengisian kapan saja.</span>
          </div>
        </div>
      )}

      {submitError && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-3 text-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-medium">{submitError}</span>
        </div>
      )}

      {submitSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 text-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{submitSuccess}</span>
        </div>
      )}

      <div className="space-y-8">
        {/* === BAGIAN KHUSUS REVISI: EVALUASI PENOLAKAN & CATATAN REVISI PEMOHON === */}
        {isRevisionMode && (
          <section className="bg-white border-2 border-rose-200 rounded-xl overflow-hidden shadow-xs animate-in fade-in">
            <div className="border-l-4 border-rose-600 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-rose-50/60 border-b border-rose-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-rose-950">
                    Evaluasi Penolakan &amp; Formulir Tindak Lanjut Revisi
                  </h2>
                  <p className="text-xs text-rose-700">
                    Tinjau alasan penolakan dari pejabat otorisator di bawah ini dan tuliskan rincian perbaikan yang Anda lakukan.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-rose-100 text-rose-800 text-xs font-extrabold rounded-full border border-rose-300 flex items-center gap-1.5 self-start sm:self-auto">
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                Ditolak pada Tahap {rejectedStep}
              </span>
            </div>

            <div className="p-6 space-y-6">
              {/* 1. Kotak Informasi Alasan Penolakan dari Verifikator */}
              <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-200/80 pb-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Catatan Resmi Pejabat Penolak (Tahap {rejectedStep}):</span>
                  </div>
                  <div className="text-[11px] text-rose-800 font-medium">
                    Oleh: <strong>{rejectedBy}{rejectedByJabatan ? ` (${rejectedByJabatan})` : ''}</strong>
                    {rejectedDateDisplay ? ` • ${rejectedDateDisplay}` : ''}
                  </div>
                </div>
                <blockquote className="text-xs text-rose-950 font-semibold italic bg-white/90 p-3.5 rounded-lg border border-rose-200 leading-relaxed">
                  &ldquo;{rejectionReason}&rdquo;
                </blockquote>
              </div>

              {/* 2. Pilihan Aspek Perubahan yang Direvisi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Bagian / Aspek yang Diperbaiki pada Revisi Ini <span className="text-slate-400 font-normal">(Pilih satu atau lebih)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {REVISION_CATEGORY_OPTIONS.map((opt) => {
                    const isSelected = selectedChanges.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleRevisionCategory(opt)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-[#0b2046] text-white border-[#0b2046] shadow-2xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Plus className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Input Catatan Tindak Lanjut Revisi Pemohon */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="input-catatan-revisi" className="block text-xs font-bold text-slate-800">
                    Catatan Tindak Lanjut / Ringkasan Perbaikan Revisi <span className="text-rose-600">* (Wajib diisi)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setRevisionNote(
                        'Telah dilakukan perbaikan rincian nomor seri/ID aset, penyesuaian alasan teknis pemusnahan, serta kelengkapan nomor referensi Nota Dinas sesuai arahan verifikator.'
                      )
                    }
                    className="text-[11px] font-bold text-[#f05a22] hover:underline cursor-pointer"
                  >
                    + Isi Contoh Catatan Revisi
                  </button>
                </div>
                <textarea
                  id="input-catatan-revisi"
                  rows={3}
                  value={revisionNote}
                  onChange={(e) => setRevisionNote(e.target.value)}
                  placeholder="Jelaskan perbaikan yang telah Anda lakukan pada formulir permohonan ini (contoh: Memperbaiki Serial Number Server Dell dan melampirkan Nomor Referensi Nota Dinas terbaru)..."
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs text-slate-800 bg-white focus:outline-none focus:border-[#f05a22] focus:ring-2 focus:ring-orange-100"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Catatan revisi ini akan dilampirkan pada riwayat dokumen agar Verifikator mengetahui tindak lanjut koreksi yang telah dilakukan.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Bagian 1: Header & Identitas */}
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="border-l-4 border-[#f05a22] px-6 py-4 flex justify-between items-center bg-white border-b border-slate-100">
            <h2 className="text-base font-bold text-[#0b2046]">Bagian 1: Informasi Header & Identitas Pemohon</h2>
            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded border border-blue-100 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Data SSO Terautentikasi
            </span>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Tanggal Pengajuan</label>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700">
                <Calendar className="w-4 h-4 text-slate-400" />
                {today}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Otomatis sinkron dengan server NTP KAI</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Nama & NIP Pemohon</label>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-[#0b2046]">
                <User className="w-4 h-4 text-slate-400" />
                {existingDoc?.data?.nama_pemohon || user?.name} — {existingDoc?.data?.nip_pemohon || user?.nip}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Jabatan: {user?.roleLabel || 'Staff Pengusul'}</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Unit Kerja Pengusul</label>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700">
                <Building className="w-4 h-4 text-slate-400" />
                {existingDoc?.data?.unit_kerja || user?.location || 'Unit Kantor Pusat'}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Aset tercatat dalam buku inventaris unit terkait</p>
            </div>

            <div className="col-span-1 md:col-span-3 mt-1">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Nomor Referensi Nota Dinas Pendukung / Kajian Teknis <span className="text-slate-400 font-normal float-right">(Opsional)</span>
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={reference}
                  disabled={isLockedNonDraft}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Contoh: ND.TI/PUSAT/X/2026/0122 — Permohonan Afkir Server & Switch"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#f05a22] disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Sertakan nomor arsip digital e-Office KAI untuk validasi cepat oleh verifikator aset.</p>
            </div>
          </div>
        </section>

        {/* Bagian 2: Daftar Aset */}
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="border-l-4 border-[#0b2046] px-6 py-4 flex justify-between items-center bg-white border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-[#0b2046]">Bagian 2: Rincian Daftar Aset yang Diusulkan</h2>
              <p className="text-xs text-slate-500 mt-0.5">Daftar perangkat TI yang direncanakan untuk dimusnahkan/scrap.</p>
            </div>
            <button 
              type="button"
              disabled={isLockedNonDraft}
              onClick={handleAddAsset}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-[#f05a22] border border-orange-200 hover:bg-orange-100 text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> Tambah Aset
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3 w-12 text-center">No</th>
                  <th className="px-5 py-3">Nama Perangkat / Aset</th>
                  <th className="px-5 py-3 w-48">Kategori / Jenis</th>
                  <th className="px-5 py-3 w-48">No. Seri / ID Aset</th>
                  <th className="px-5 py-3">Alasan Teknis Pemusnahan</th>
                  <th className="px-5 py-3 w-16 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assets.map((asset, index) => (
                  <tr key={asset.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 text-center font-bold text-slate-500">
                      {index + 1}
                    </td>
                    <td className="px-5 py-3.5">
                      <input 
                        type="text" 
                        disabled={isLockedNonDraft}
                        value={asset.nama} 
                        onChange={(e) => {
                          const newAssets = [...assets];
                          newAssets[index].nama = e.target.value;
                          setAssets(newAssets);
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-[#f05a22] font-semibold text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                        placeholder="Contoh: Server HP ProLiant DL380"
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <select 
                        disabled={isLockedNonDraft}
                        value={asset.jenis} 
                        onChange={(e) => {
                          const newAssets = [...assets];
                          newAssets[index].jenis = e.target.value;
                          setAssets(newAssets);
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-[#f05a22] text-slate-700 disabled:bg-slate-100 disabled:text-slate-500"
                      >
                        <option value="Fisik (Hardware)">Fisik (Hardware)</option>
                        <option value="Jaringan (Network)">Jaringan (Network)</option>
                        <option value="Lisensi/Software">Informasi / Lisensi</option>
                      </select>
                    </td>
                    <td className="px-5 py-3.5">
                      <input 
                        type="text" 
                        disabled={isLockedNonDraft}
                        value={asset.sn} 
                        onChange={(e) => {
                          const newAssets = [...assets];
                          newAssets[index].sn = e.target.value;
                          setAssets(newAssets);
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:border-[#f05a22] disabled:bg-slate-100 disabled:text-slate-500"
                        placeholder="SN-12345 / AST-KAI-01"
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <input 
                        type="text" 
                        disabled={isLockedNonDraft}
                        value={asset.alasan} 
                        onChange={(e) => {
                          const newAssets = [...assets];
                          newAssets[index].alasan = e.target.value;
                          setAssets(newAssets);
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-[#f05a22] disabled:bg-slate-100 disabled:text-slate-500"
                        placeholder="Penyebab kerusakan / depresiasi..."
                      />
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button 
                        type="button"
                        disabled={isLockedNonDraft}
                        onClick={() => handleRemoveAsset(asset.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30"
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
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-400" />
              <span>Total aset yang diusulkan: <strong>{assets.length} item</strong></span>
            </div>
            <span className="text-[11px] text-slate-400">Pastikan nomor seri/ID aset sesuai dengan barcode label fisik.</span>
          </div>
        </section>

        {/* Bagian 3: Alur Persetujuan (Approval Routing) - Memilih Ketiga Verifikator */}
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="border-l-4 border-emerald-600 px-6 py-4 bg-white border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#0b2046] flex items-center gap-2">
                <span>Bagian 3: Alur Persetujuan Berjenjang (Sesuai Pilihan Pemohon)</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                  3 Tingkat Verifikasi
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Silakan pilih ketiga pejabat verifikator berjenjang yang akan memproses disposisi dokumen ini secara berurutan.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Daftar Pejabat Otorisator KAI ({approvers.length} Pejabat)</span>
            </div>
          </div>

          {hasDuplicateVerifiers && (
            <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span><strong>Catatan:</strong> Terdapat pejabat yang sama dipilih pada lebih dari satu jenjang verifikasi. Disarankan memilih pejabat yang berbeda untuk menjaga independensi alur otorisasi.</span>
            </div>
          )}

          <div className="p-6">
            {/* Diagram Alur Persetujuan Sekuensial (Dinamis sesuai Pilihan Pemohon) */}
            <div className="mb-6 p-4.5 bg-gradient-to-r from-orange-50/60 via-blue-50/50 to-emerald-50/60 rounded-xl border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-[#0b2046]" />
                  <span className="text-xs font-bold text-[#0b2046] uppercase tracking-wider">
                    Diagram Alur Persetujuan Berjenjang (Sekuensial Sesuai Pilihan Pemohon)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-700 bg-white/90 px-2.5 py-1 rounded border border-slate-200 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Wajib Berurutan: Tahap 1 ➔ Tahap 2 ➔ Tahap 3</span>
                </div>
              </div>

              {/* Stepper Pipeline Dinamis */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative">
                {/* Step 1 Node */}
                <div className={`p-3.5 rounded-xl border transition-all ${
                  verifikator1 ? 'bg-white border-orange-300 shadow-xs ring-1 ring-orange-200' : 'bg-white/70 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-orange-100 text-orange-800">
                      Tahap 1 • Giliran Pertama
                    </span>
                    <span className="text-[10px] font-bold text-orange-600">Urutan #1</span>
                  </div>
                  <div className="font-bold text-xs text-slate-900 truncate">
                    {v1Data ? v1Data.name : 'Verifikasi Atasan Langsung'}
                  </div>
                  <div className="text-[11px] font-semibold text-orange-700 mt-0.5 truncate">
                    {v1Data ? `${v1Data.jabatan} (${v1Data.unit_kerja})` : 'Belum dipilih oleh pemohon'}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {v1Data
                      ? `NIP: ${v1Data.nip} • Pemeriksaan fisik aset & kewajaran usulan`
                      : 'Memeriksa fisik aset & kewajaran permohonan di unit kerja.'}
                  </p>
                </div>

                {/* Step 2 Node */}
                <div className={`p-3.5 rounded-xl border transition-all ${
                  verifikator2 ? 'bg-white border-blue-300 shadow-xs ring-1 ring-blue-200' : 'bg-white/70 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                      Tahap 2 • Setelah Tahap 1 OK
                    </span>
                    <span className="text-[10px] font-bold text-blue-700">Urutan #2</span>
                  </div>
                  <div className="font-bold text-xs text-slate-900 truncate">
                    {v2Data ? v2Data.name : 'Validasi Teknis Pengelola TI'}
                  </div>
                  <div className="text-[11px] font-semibold text-blue-700 mt-0.5 truncate">
                    {v2Data ? `${v2Data.jabatan} (${v2Data.unit_kerja})` : 'Belum dipilih oleh pemohon'}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {v2Data
                      ? `NIP: ${v2Data.nip} • Uji sanitasi storage, degaussing & tag SAP`
                      : 'Uji sanitasi storage, kelayakan degaussing & tag SAP.'}
                  </p>
                </div>

                {/* Step 3 Node */}
                <div className={`p-3.5 rounded-xl border transition-all ${
                  verifikator3 ? 'bg-white border-emerald-300 shadow-xs ring-1 ring-emerald-200' : 'bg-white/70 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Tahap 3 • Otorisasi Final
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700">Urutan #3</span>
                  </div>
                  <div className="font-bold text-xs text-slate-900 truncate">
                    {v3Data ? v3Data.name : 'Penyetuju Akhir (Head of Unit)'}
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-700 mt-0.5 truncate">
                    {v3Data ? `${v3Data.jabatan} (${v3Data.unit_kerja})` : 'Belum dipilih oleh pemohon'}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {v3Data
                      ? `NIP: ${v3Data.nip} • Pengesahan akhir & tanda tangan digital`
                      : 'Pengesahan Berita Acara & penandatanganan digital terpusat.'}
                  </p>
                </div>
              </div>
            </div>

            {isLoadingApprovers ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
                <span className="text-xs">Memuat daftar pejabat otorisator...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                {/* 1. Verifikator 1 */}
                <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:border-orange-300 transition-all shadow-2xs">
                  <div>
                    {/* Header Card */}
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#f05a22] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          1
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">Verifikator 1</h4>
                          <span className="text-[10px] text-orange-600 font-semibold block">Pemeriksaan Awal</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-orange-100 text-orange-800 truncate max-w-[120px]">
                        {v1Data?.jabatan || 'Atasan Langsung'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 mb-3">
                      Memeriksa kewajaran usulan penghapusan dan kondisi riil aset di unit pemohon.
                    </p>

                    {/* Selector */}
                    <div className="mb-4">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                        Pilih Pejabat Verifikator 1 <span className="text-rose-500">*</span>
                      </label>
                      <select
                        disabled={isLockedNonDraft}
                        value={verifikator1}
                        onChange={(e) => setVerifikator1(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#f05a22] disabled:bg-slate-100 disabled:text-slate-500"
                      >
                        <option value="">-- Pilih Pejabat --</option>
                        {approvers.map((appr) => {
                          const displayName = appr.name || appr.nama || 'Pejabat';
                          const jName = (typeof appr.jabatan === 'object' ? appr.jabatan?.nama : appr.jabatan) || appr.jabatan_relasi?.nama || 'Pejabat';
                          return (
                            <option key={appr.id} value={appr.id}>
                              {displayName} — {jName} ({appr.unit_kerja || 'Unit Kerja'})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  {/* Profile Summary Card */}
                  {v1Data ? (
                    <div className="bg-white p-3.5 rounded-lg border border-slate-200 flex items-center gap-3">
                      <img 
                        src={v1Data.avatar} 
                        alt={v1Data.name} 
                        className="w-10 h-10 rounded-full border border-slate-200 shrink-0" 
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-slate-900 truncate">{v1Data.name}</div>
                        <div className="text-[11px] text-slate-500 truncate">NIP: {v1Data.nip}</div>
                        <div className="text-[10px] font-semibold text-[#f05a22] mt-0.5 truncate">
                          {v1Data.jabatan} • {v1Data.unit_kerja}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-100/70 p-3 rounded-lg border border-dashed border-slate-300 text-center text-[11px] text-slate-400">
                      Belum ada verifikator dipilih
                    </div>
                  )}
                </div>

                {/* 2. Verifikator 2 */}
                <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:border-blue-400 transition-all shadow-2xs">
                  <div>
                    {/* Header Card */}
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#0b2046] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          2
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">Verifikator 2</h4>
                          <span className="text-[10px] text-blue-700 font-semibold block">Validasi Teknis</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-900 truncate max-w-[120px]">
                        {v2Data?.jabatan || 'Pengelola Aset TI'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 mb-3">
                      Memvalidasi aspek teknis, sanitasi data/media simpan, dan kelayakan degaussing.
                    </p>

                    {/* Selector */}
                    <div className="mb-4">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                        Pilih Pejabat Verifikator 2 <span className="text-rose-500">*</span>
                      </label>
                      <select
                        disabled={isLockedNonDraft}
                        value={verifikator2}
                        onChange={(e) => setVerifikator2(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#0b2046] disabled:bg-slate-100 disabled:text-slate-500"
                      >
                        <option value="">-- Pilih Pejabat --</option>
                        {approvers.map((appr) => {
                          const displayName = appr.name || appr.nama || 'Pejabat';
                          const jName = (typeof appr.jabatan === 'object' ? appr.jabatan?.nama : appr.jabatan) || appr.jabatan_relasi?.nama || 'Pejabat';
                          return (
                            <option key={appr.id} value={appr.id}>
                              {displayName} — {jName} ({appr.unit_kerja || 'Unit Kerja'})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  {/* Profile Summary Card */}
                  {v2Data ? (
                    <div className="bg-white p-3.5 rounded-lg border border-slate-200 flex items-center gap-3">
                      <img 
                        src={v2Data.avatar} 
                        alt={v2Data.name} 
                        className="w-10 h-10 rounded-full border border-slate-200 shrink-0" 
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-slate-900 truncate">{v2Data.name}</div>
                        <div className="text-[11px] text-slate-500 truncate">NIP: {v2Data.nip}</div>
                        <div className="text-[10px] font-semibold text-blue-700 mt-0.5 truncate">
                          {v2Data.jabatan} • {v2Data.unit_kerja}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-100/70 p-3 rounded-lg border border-dashed border-slate-300 text-center text-[11px] text-slate-400">
                      Belum ada verifikator dipilih
                    </div>
                  )}
                </div>

                {/* 3. Verifikator 3 / Penyetuju Akhir */}
                <div className="bg-emerald-50/40 border border-emerald-200 rounded-xl p-5 flex flex-col justify-between hover:border-emerald-400 transition-all shadow-2xs">
                  <div>
                    {/* Header Card */}
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-emerald-200">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          3
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-tight">Verifikator 3</h4>
                          <span className="text-[10px] text-emerald-700 font-semibold block">Otorisasi Akhir</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800 truncate max-w-[120px]">
                        {v3Data?.jabatan || 'Penyetuju Akhir'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 mb-3">
                      Otorisasi final Berita Acara dan pengesahan tanda tangan digital terpusat.
                    </p>

                    {/* Selector */}
                    <div className="mb-4">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                        Pilih Pejabat Penyetuju Akhir <span className="text-rose-500">*</span>
                      </label>
                      <select
                        disabled={isLockedNonDraft}
                        value={verifikator3}
                        onChange={(e) => setVerifikator3(e.target.value)}
                        className="w-full p-2.5 bg-white border border-emerald-300 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-600 disabled:bg-slate-100 disabled:text-slate-500"
                      >
                        <option value="">-- Pilih Pejabat --</option>
                        {approvers.map((appr) => {
                          const displayName = appr.name || appr.nama || 'Pejabat';
                          const jName = (typeof appr.jabatan === 'object' ? appr.jabatan?.nama : appr.jabatan) || appr.jabatan_relasi?.nama || 'Pejabat';
                          return (
                            <option key={appr.id} value={appr.id}>
                              {displayName} — {jName} ({appr.unit_kerja || 'Unit Kerja'})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  {/* Profile Summary Card */}
                  {v3Data ? (
                    <div className="bg-white p-3.5 rounded-lg border border-emerald-200 flex items-center gap-3">
                      <img 
                        src={v3Data.avatar} 
                        alt={v3Data.name} 
                        className="w-10 h-10 rounded-full border border-emerald-200 shrink-0" 
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-slate-900 truncate">{v3Data.name}</div>
                        <div className="text-[11px] text-slate-500 truncate">NIP: {v3Data.nip}</div>
                        <div className="text-[10px] font-semibold text-emerald-700 mt-0.5 truncate">
                          {v3Data.jabatan} • {v3Data.unit_kerja}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-100/70 p-3 rounded-lg border border-dashed border-slate-300 text-center text-[11px] text-slate-400">
                      Belum ada verifikator dipilih
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800">Prinsip Alur Sekuensial Berjenjang:</span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Verifikator 2 hanya dapat menindaklanjuti berkas setelah Verifikator 1 menyetujui, dan Verifikator 3 setelah Verifikator 2 menyetujui. Apabila terdapat penolakan di salah satu tahap, pemohon dapat melakukan revisi melalui Formulir Revisi.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 shrink-0 bg-white px-2.5 py-1 rounded border border-slate-200">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Proteksi Sekuensial Terkunci</span>
            </div>
          </div>
        </section>

      </div>

      {/* Action Bar */}
      <div className="mt-8 bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm sticky bottom-4 z-10">
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-[#f05a22]" />
          </div>
          <span>Dokumen ini mengikat secara hukum di bawah tata kelola aset BUMN PT Kereta Api Indonesia (Persero).</span>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            type="button"
            disabled={isSubmitting || isSavingDraft}
            onClick={() => navigate('/pemusnahan')}
            className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 text-xs font-semibold rounded-lg transition-colors flex-1 md:flex-none"
          >
            Batal
          </button>
          <button 
            type="button"
            disabled={isSubmitting || isSavingDraft || isLockedNonDraft}
            onClick={() => handleSubmit(false)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex-1 md:flex-none disabled:opacity-50"
          >
            {isSavingDraft ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-slate-500" />
                <span>{isRevisionMode ? 'Simpan Draf Revisi' : 'Simpan Draf'}</span>
              </>
            )}
          </button>
          <button 
            type="button"
            id="btn-submit-permohonan"
            disabled={isSubmitting || isSavingDraft || isLockedNonDraft}
            onClick={() => handleSubmit(true)}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#f05a22] hover:bg-[#d94a18] text-white text-xs font-bold rounded-lg transition-colors flex-1 md:flex-none shadow-sm shadow-[#f05a22]/30 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>
                  {isRevisionMode
                    ? 'Kirim Ulang Revisi Permohonan'
                    : isEditMode
                    ? 'Simpan & Ajukan Permohonan'
                    : 'Kirim Permohonan'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
