import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Lock
} from 'lucide-react';
import { api } from '../services/api';

export default function PemusnahanFormPage({ user }) {
  const navigate = useNavigate();
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
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  // Fetch approvers from backend
  useEffect(() => {
    const fetchApprovers = async () => {
      try {
        setIsLoadingApprovers(true);
        const res = await api.getApprovers();
        const list = Array.isArray(res) ? res : (res.data || []);
        setApprovers(list);

        // Smart auto-selection for the 3 roles based on hierarchy
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
      } catch (err) {
        console.error('Failed to load approvers:', err);
      } finally {
        setIsLoadingApprovers(false);
      }
    };
    fetchApprovers();
  }, [user]);

  const getApproverDetail = (id) => {
    if (!id) return null;
    const appr = approvers.find(u => String(u.id) === String(id));
    if (!appr) return null;
    const jab = typeof appr.jabatan === 'object' ? appr.jabatan?.nama : (appr.jabatan || 'Pejabat Otorisator');
    return {
      id: appr.id,
      name: appr.name || appr.nama,
      nip: appr.nip,
      jabatan: jab,
      unit_kerja: appr.unit_kerja || 'Unit Kantor Pusat',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(appr.name || appr.nama)}&background=0b2046&color=fff`,
    };
  };

  const handleAddAsset = () => {
    setAssets([...assets, { id: Date.now(), nama: '', jenis: '', sn: '', alasan: '' }]);
  };

  const handleRemoveAsset = (id) => {
    if (assets.length <= 1) {
      alert('Dokumen harus memiliki minimal 1 aset.');
      return;
    }
    setAssets(assets.filter(a => a.id !== id));
  };

  const handleSubmit = async (submitNow) => {
    setSubmitError(null);
    setSubmitSuccess(null);

    // Validate assets
    const validAssets = assets.filter(a => a.nama && a.nama.trim() !== '');
    if (validAssets.length === 0) {
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

    setIsSubmitting(true);

    try {
      const v1Num = verifikator1 ? Number(verifikator1) : null;
      const v2Num = verifikator2 ? Number(verifikator2) : null;
      const v3Num = verifikator3 ? Number(verifikator3) : null;

      // Build chain array
      const chain = [v1Num, v2Num, v3Num].filter(Boolean);

      const payload = {
        type: 'dsp01',
        submit: submitNow,
        approver_id: submitNow ? v1Num : undefined,
        data: {
          tanggal_permohonan: new Date().toISOString().split('T')[0],
          nama_pemohon: user?.name,
          nip_pemohon: user?.nip,
          unit_kerja: user?.location || 'Unit Kantor Pusat',
          nomor_referensi: reference || undefined,
          verifikator_1_id: v1Num,
          verifikator_2_id: v2Num,
          verifikator_3_id: v3Num,
          approval_chain: chain,
        },
        items: validAssets.map((a, idx) => ({
          nama_aset: a.nama.trim(),
          jenis_aset: a.jenis ? (a.jenis.includes('Jaringan') ? 'Jaringan' : a.jenis.includes('Lisensi') ? 'Informasi' : 'Fisik') : 'Fisik',
          id_aset: a.sn?.trim() || `AST-KAI-${Date.now().toString().slice(-4)}-${idx + 1}`,
          alasan_pemusnahan: a.alasan?.trim() || 'Kerusakan fatal & melewati batas usia pemakaian teknis',
        })),
      };

      const res = await api.createDocument(payload);
      setSubmitSuccess(res.message || 'Permohonan pemusnahan aset berhasil disimpan dan dialirkan ke verifikator!');

      setTimeout(() => {
        navigate('/pemusnahan');
      }, 1500);
    } catch (err) {
      setSubmitError(err.message || 'Terjadi kesalahan saat memproses permohonan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

  const hasDuplicateVerifiers = (verifikator1 && verifikator2 && verifikator1 === verifikator2) ||
    (verifikator1 && verifikator3 && verifikator1 === verifikator3) ||
    (verifikator2 && verifikator3 && verifikator2 === verifikator3);

  const v1Data = getApproverDetail(verifikator1);
  const v2Data = getApproverDetail(verifikator2);
  const v3Data = getApproverDetail(verifikator3);

  return (
    <div className="w-full max-w-[1050px] mx-auto pb-12">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0b2046] tracking-tight mb-1">
            Formulir Permohonan Pemusnahan Aset
          </h1>
          <p className="text-sm text-slate-500">
            Formulir ini digunakan oleh unit kerja untuk mengajukan permohonan disposisi/pemusnahan aset TI PT Kereta Api Indonesia (Persero).
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
      <div className="bg-[#f4f7fa] border border-[#e2e8f0] rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4 mb-6 shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-600 animate-pulse"></span>
          <span className="text-sm font-bold text-[#0b2046]">Mode Aktif: Formulir Permohonan Pemusnahan Aset TI [DSP - 01]</span>
        </div>
        <div className="px-2.5 py-1 bg-blue-100 text-[#0b2046] text-xs font-extrabold rounded tracking-wide w-fit">
          TAHAP PERMOHONAN BERJENJANG
        </div>
        <div className="md:ml-auto flex items-center gap-2 text-xs text-slate-600">
          <Info className="w-4 h-4 text-[#f05a22] shrink-0" />
          <span>Pengajuan akan melewati 3 tingkat verifikasi sebelum disahkan menjadi Berita Acara [DSP-02].</span>
        </div>
      </div>

      {/* Notifications */}
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
                {user?.name} — {user?.nip}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Jabatan: {user?.roleLabel || 'Staff Pengusul'}</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Unit Kerja Pengusul</label>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700">
                <Building className="w-4 h-4 text-slate-400" />
                {user?.location || 'Unit Kantor Pusat'}
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
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Contoh: ND.TI/PUSAT/X/2026/0122 — Permohonan Afkir Server & Switch"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#f05a22]"
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
              onClick={handleAddAsset}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-[#f05a22] border border-orange-200 hover:bg-orange-100 text-xs font-bold rounded-lg transition-colors"
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
                        value={asset.nama} 
                        onChange={(e) => {
                          const newAssets = [...assets];
                          newAssets[index].nama = e.target.value;
                          setAssets(newAssets);
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-[#f05a22] font-semibold text-slate-800"
                        placeholder="Contoh: Server HP ProLiant DL380"
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <select 
                        value={asset.jenis} 
                        onChange={(e) => {
                          const newAssets = [...assets];
                          newAssets[index].jenis = e.target.value;
                          setAssets(newAssets);
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-[#f05a22] text-slate-700"
                      >
                        <option value="Fisik (Hardware)">Fisik (Hardware)</option>
                        <option value="Jaringan (Network)">Jaringan (Network)</option>
                        <option value="Lisensi/Software">Informasi / Lisensi</option>
                      </select>
                    </td>
                    <td className="px-5 py-3.5">
                      <input 
                        type="text" 
                        value={asset.sn} 
                        onChange={(e) => {
                          const newAssets = [...assets];
                          newAssets[index].sn = e.target.value;
                          setAssets(newAssets);
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:border-[#f05a22]"
                        placeholder="SN-12345 / AST-KAI-01"
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <input 
                        type="text" 
                        value={asset.alasan} 
                        onChange={(e) => {
                          const newAssets = [...assets];
                          newAssets[index].alasan = e.target.value;
                          setAssets(newAssets);
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-[#f05a22]"
                        placeholder="Penyebab kerusakan / depresiasi..."
                      />
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button 
                        type="button"
                        onClick={() => handleRemoveAsset(asset.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
                <span>Bagian 3: Alur Persetujuan (Approval Routing)</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                  3 Tingkat Verifikasi
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Silakan pilih ketiga pejabat verifikator berjenjang yang akan memproses disposisi dokumen ini.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Daftar Pejabat Otorisator KAI</span>
            </div>
          </div>

          {hasDuplicateVerifiers && (
            <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span><strong>Catatan:</strong> Terdapat pejabat yang sama dipilih pada lebih dari satu jenjang verifikasi. Disarankan memilih pejabat yang berbeda untuk menjaga independensi alur otorisasi.</span>
            </div>
          )}

          <div className="p-6">
            {/* Diagram Alur Persetujuan Sekuensial */}
            <div className="mb-6 p-4.5 bg-gradient-to-r from-orange-50/60 via-blue-50/50 to-emerald-50/60 rounded-xl border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-[#0b2046]" />
                  <span className="text-xs font-bold text-[#0b2046] uppercase tracking-wider">
                    Diagram Alur Persetujuan Berjenjang (Sekuensial)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-700 bg-white/90 px-2.5 py-1 rounded border border-slate-200 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Wajib Berurutan: Tahap 1 ➔ Tahap 2 ➔ Tahap 3</span>
                </div>
              </div>

              {/* Stepper Pipeline */}
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
                  <div className="font-bold text-xs text-slate-900">Verifikasi Atasan Langsung</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Memeriksa fisik aset & kewajaran permohonan di unit kerja.
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
                  <div className="font-bold text-xs text-slate-900">Validasi Teknis Pengelola TI</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Uji sanitasi storage, kelayakan degaussing & tag SAP.
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
                  <div className="font-bold text-xs text-slate-900">Penyetuju Akhir (Head of Unit)</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Pengesahan Berita Acara & penandatanganan digital terpusat.
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
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-orange-100 text-orange-800">
                        Atasan Langsung
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
                        value={verifikator1}
                        onChange={(e) => setVerifikator1(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#f05a22]"
                      >
                        <option value="">-- Pilih Pejabat --</option>
                        {approvers.map((appr) => {
                          const jName = typeof appr.jabatan === 'object' ? appr.jabatan?.nama : (appr.jabatan || 'Pejabat');
                          return (
                            <option key={appr.id} value={appr.id}>
                              {appr.name || appr.nama} — {jName} ({appr.unit_kerja})
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
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-900">
                        Pengelola Aset TI
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
                        value={verifikator2}
                        onChange={(e) => setVerifikator2(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#0b2046]"
                      >
                        <option value="">-- Pilih Pejabat --</option>
                        {approvers.map((appr) => {
                          const jName = typeof appr.jabatan === 'object' ? appr.jabatan?.nama : (appr.jabatan || 'Pejabat');
                          return (
                            <option key={appr.id} value={appr.id}>
                              {appr.name || appr.nama} — {jName} ({appr.unit_kerja})
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
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800">
                        Penyetuju Akhir
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
                        value={verifikator3}
                        onChange={(e) => setVerifikator3(e.target.value)}
                        className="w-full p-2.5 bg-white border border-emerald-300 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      >
                        <option value="">-- Pilih Pejabat --</option>
                        {approvers.map((appr) => {
                          const jName = typeof appr.jabatan === 'object' ? appr.jabatan?.nama : (appr.jabatan || 'Pejabat');
                          return (
                            <option key={appr.id} value={appr.id}>
                              {appr.name || appr.nama} — {jName} ({appr.unit_kerja})
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
                  Verifikator 2 hanya dapat menindaklanjuti berkas setelah Verifikator 1 menyetujui, dan Verifikator 3 setelah Verifikator 2 menyetujui. Apabila terdapat penolakan di salah satu tahap, pengajuan langsung gugur.
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
            disabled={isSubmitting}
            onClick={() => navigate('/pemusnahan')}
            className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 text-xs font-semibold rounded-lg transition-colors flex-1 md:flex-none"
          >
            Batal
          </button>
          <button 
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit(false)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex-1 md:flex-none disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-slate-500" />
            <span>Simpan Draf</span>
          </button>
          <button 
            type="button"
            disabled={isSubmitting}
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
                <span>Kirim Permohonan</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
