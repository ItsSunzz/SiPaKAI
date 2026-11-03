import React, { useState, useEffect } from 'react';
import { 
  User, 
  ShieldCheck, 
  Key, 
  Upload, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  PenTool, 
  Lock,
  Building,
  Check,
  Info
} from 'lucide-react';
import { api } from '../services/api';

export default function PengaturanPage({ user, onProfileUpdated }) {
  const [currentUser, setCurrentUser] = useState(user || null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Signature States
  const [signaturePreview, setSignaturePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [hasServerSignature, setHasServerSignature] = useState(false);
  const [serverSignatureUrl, setServerSignatureUrl] = useState(null);

  // PIN States
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');

  // Status Alerts
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // PIN Test verification state
  const [testPin, setTestPin] = useState('');
  const [testPinResult, setTestPinResult] = useState(null);

  // Load user profile & signature
  const loadProfile = async (bustCache = false) => {
    setIsLoading(true);
    try {
      const res = await api.getMe();
      if (res?.user) {
        setCurrentUser(res.user);
        if (res.user.has_signature || res.user.signature_path) {
          setHasServerSignature(true);
          setServerSignatureUrl(api.getSignatureUrl(bustCache));
        } else {
          setHasServerSignature(false);
          setServerSignatureUrl(null);
        }
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Handle file select
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      const validExts = ['png', 'jpg', 'jpeg', 'webp'];
      const validMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/x-png', 'image/webp'];

      if (!validExts.includes(ext) && !validMimes.includes(file.type)) {
        setErrorMsg('Format file harus berupa gambar PNG, JPG, atau JPEG.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Ukuran file maksimal 5 MB.');
        return;
      }
      setSelectedFile(file);
      setErrorMsg(null);

      const reader = new FileReader();
      reader.onload = (event) => {
        setSignaturePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Signature & PIN
  const handleSaveSignatureAndPin = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (pin && pin !== pinConfirm) {
      setErrorMsg('Konfirmasi PIN tidak cocok dengan PIN yang dimasukkan.');
      return;
    }

    if (pin && (pin.length < 4 || pin.length > 8 || !/^\d+$/.test(pin))) {
      setErrorMsg('PIN harus berupa 4 sampai 8 digit angka.');
      return;
    }

    if (!selectedFile && !pin) {
      setErrorMsg('Silakan pilih file tanda tangan PNG baru atau masukkan PIN baru untuk disimpan.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('signature', selectedFile);
      }
      if (pin) {
        formData.append('pin', pin);
      }

      const res = await api.uploadSignature(formData);
      setSuccessMsg(res?.message || 'Pengaturan tanda tangan digital dan PIN berhasil disimpan!');

      setSelectedFile(null);
      setSignaturePreview(null);
      setPin('');
      setPinConfirm('');
      
      // Reset input file element
      const fileInput = document.getElementById('input-file-settings-signature');
      if (fileInput) fileInput.value = '';

      // Reload profile dengan cache busting
      await loadProfile(true);
      if (onProfileUpdated) onProfileUpdated();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan pengaturan tanda tangan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete signature from profile
  const handleDeleteSignature = async () => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus tanda tangan digital tersimpan? Dokumen selanjutnya akan menggunakan stempel digital default KAI.')) {
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await api.deleteSignature();
      setHasServerSignature(false);
      setServerSignatureUrl(null);
      setSuccessMsg('Tanda tangan digital berhasil dihapus dari profil.');
      await loadProfile(true);
      if (onProfileUpdated) onProfileUpdated();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menghapus tanda tangan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Test PIN via server verification
  const handleTestPinVerification = async () => {
    setTestPinResult(null);
    if (!testPin.trim()) {
      setTestPinResult({ valid: false, message: 'Masukkan PIN terlebih dahulu untuk diuji.' });
      return;
    }

    try {
      const res = await api.verifyPin(testPin.trim());
      setTestPinResult({ valid: res.valid, message: res.message });
    } catch (err) {
      setTestPinResult({ valid: false, message: err.message || 'Gagal memverifikasi PIN.' });
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-5xl mx-auto py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-[#f05a22]" />
        <span className="text-sm font-semibold">Memuat pengaturan profil dan tanda tangan...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-16">
      {/* 1. Header Page Title */}
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <nav className="text-xs text-slate-400 mb-1 flex items-center gap-1.5 font-medium">
            <span>Beranda</span>
            <span>/</span>
            <span className="text-slate-600 font-bold">Pengaturan Akun & e-Sign</span>
          </nav>
          <h1 className="text-2xl font-black text-[#0b2046] tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-[#f05a22]" />
            Pengaturan Tanda Tangan Digital (e-Sign) & PIN
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Unggah tanda tangan resmi Anda satu kali di sini. Saat memverifikasi dokumen di kemudian hari, Anda cukup memasukkan PIN autentikasi tanpa perlu mengunggah ulang.
          </p>
        </div>
      </div>

      {/* 2. Feedback Alerts */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 text-xs font-semibold animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="ml-auto font-bold text-emerald-600">✕</button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-3 text-xs font-semibold animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="ml-auto font-bold text-rose-600">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Informasi Akun Pejabat (4 Kolom) */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-[#0b2046] text-white flex items-center justify-center font-black text-base shadow-sm">
                {currentUser?.nama?.slice(0, 2).toUpperCase() || currentUser?.name?.slice(0, 2).toUpperCase() || 'KAI'}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-extrabold text-[#0b2046] truncate">
                  {currentUser?.nama || currentUser?.name || 'Pejabat Verifikator'}
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  NIP: {currentUser?.nip || '-'}
                </p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-orange-100 text-[#f05a22]">
                  {currentUser?.role || 'Verifikator'}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Jabatan Kedinasan</span>
                <span className="font-semibold text-slate-800">
                  {currentUser?.jabatan?.nama || currentUser?.jabatan?.name || currentUser?.jabatan || 'Asisten Manager TI'}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Unit Kerja / Daop</span>
                <span className="font-semibold text-slate-800">
                  {currentUser?.unit_kerja || 'Unit Kantor Pusat'}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Status Sertifikasi Digital</span>
                <div className="mt-1 flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-[11px] font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Terotentikasi SSO KAI</span>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Info Box */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4.5 text-xs text-blue-900 space-y-2">
            <h4 className="font-bold flex items-center gap-1.5 text-xs text-blue-950">
              <Info className="w-4 h-4 text-blue-600" />
              SOP Tanda Tangan Sekali Unggah
            </h4>
            <p className="text-[11px] text-blue-800/90 leading-relaxed">
              Setelah tanda tangan tersimpan di akun Anda, sistem akan secara otomatis menempelkan tanda tangan resmi ini ke setiap berkas disposisi yang Anda setujui. Anda hanya perlu mengonfirmasi PIN verifikasi.
            </p>
          </div>
        </div>

        {/* Kolom Kanan: Pengaturan File Tanda Tangan & PIN (8 Kolom) */}
        <div className="lg:col-span-8 space-y-6">
          <form onSubmit={handleSaveSignatureAndPin} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="border-l-4 border-[#f05a22] px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#0b2046] uppercase tracking-wider flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-[#f05a22]" />
                  Kelola Tanda Tangan Resmi (PNG Transparan)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Pratinjau, unggah berkas tanda tangan baru, dan atur PIN pengesahan dokumen
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                hasServerSignature 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {hasServerSignature ? '✓ Tanda Tangan Aktif' : 'Belum Ada Tanda Tangan'}
              </span>
            </div>

            <div className="p-6 space-y-6">
              {/* Bagian 1: Pratinjau Tanda Tangan Saat Ini */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Pratinjau Tanda Tangan Digital Tersimpan:
                </label>

                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 flex flex-col sm:flex-row items-center gap-6">
                  {/* Visualizer Box dengan background kotak transparan (checkerboard) */}
                  <div className="w-56 h-32 rounded-xl border border-slate-300 bg-white flex items-center justify-center p-3 shadow-inner relative overflow-hidden shrink-0"
                    style={{
                      backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)',
                      backgroundSize: '12px 12px'
                    }}
                  >
                    {signaturePreview ? (
                      <img src={signaturePreview} alt="Signature New Preview" className="max-h-full max-w-full object-contain" />
                    ) : hasServerSignature && serverSignatureUrl ? (
                      <img 
                        src={serverSignatureUrl} 
                        alt="Signature Server" 
                        className="max-h-full max-w-full object-contain" 
                        onError={(e) => { 
                          console.warn('Signature image failed to render'); 
                        }} 
                      />
                    ) : (
                      <div className="text-center p-2">
                        <PenTool className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                        <span className="text-[10px] text-slate-400 font-medium block">Belum ada file tanda tangan tersimpan</span>
                      </div>
                    )}

                    {signaturePreview && (
                      <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-[#f05a22] text-white">
                        Baru
                      </span>
                    )}
                  </div>

                  <div className="flex-1 space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">
                        {hasServerSignature ? 'Tanda Tangan Terdaftar Resmi' : 'Menggunakan Stempel Digital Default'}
                      </span>
                      {hasServerSignature && (
                        <span className="text-emerald-600 font-extrabold flex items-center gap-1 text-[11px]">
                          <Check className="w-3.5 h-3.5" /> Aktif
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {hasServerSignature
                        ? 'Tanda tangan di atas akan dibubuhkan otomatis pada lembar Berita Acara Pemusnahan [DSP-02] setiap kali Anda menyetujui berkas menggunakan PIN Anda.'
                        : 'Saat ini akun Anda belum mengunggah file tanda tangan PNG transparan. Silakan unggah tanda tangan basah hasil scan Anda di bawah ini.'}
                    </p>
                    {hasServerSignature && (
                      <button
                        type="button"
                        onClick={handleDeleteSignature}
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:underline pt-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus & Reset Tanda Tangan</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Bagian 2: Unggah Berkas Baru */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-[#f05a22]" />
                  <span>Unggah File Tanda Tangan Baru (PNG Transparan):</span>
                </label>

                <div className="space-y-2">
                  <input
                    type="file"
                    id="input-file-settings-signature"
                    accept="image/png,image/jpeg"
                    onChange={handleFileChange}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-orange-50 file:text-[#f05a22] hover:file:bg-orange-100 cursor-pointer border border-slate-300 rounded-xl p-1 bg-white"
                  />
                  <p className="text-[11px] text-slate-400">
                    💡 <strong>Tips:</strong> Disarankan menggunakan file <strong>.PNG transparan</strong> (latar belakang tembus pandang) agar tampilan tanda tangan pada lembar berita acara menyatu sempurna dan profesional.
                  </p>
                </div>
              </div>

              {/* Bagian 3: Pengaturan PIN Keamanan Otorisasi */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-[#f05a22]" />
                    <span>PIN Keamanan Autentikasi e-Sign:</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mb-3">
                    PIN ini akan diminta setiap kali Anda menyetujui dokumen untuk mencegah penyalahgunaan wewenang tanda tangan. (PIN bawaan default pengujian: <strong className="font-mono text-slate-800">123456</strong> atau password akun).
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="pin-input" className="block text-[11px] font-bold text-slate-700 mb-1">
                      Atur PIN Baru (4–8 Digit Angka):
                    </label>
                    <input
                      id="pin-input"
                      type="password"
                      maxLength={8}
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      placeholder="Masukkan PIN baru"
                      className="w-full text-xs font-mono font-bold tracking-wider py-2 px-3 rounded-xl border border-slate-300 focus:border-[#f05a22] focus:ring-1 focus:ring-orange-100"
                    />
                  </div>

                  <div>
                    <label htmlFor="pin-confirm-input" className="block text-[11px] font-bold text-slate-700 mb-1">
                      Konfirmasi Ulang PIN Baru:
                    </label>
                    <input
                      id="pin-confirm-input"
                      type="password"
                      maxLength={8}
                      value={pinConfirm}
                      onChange={(e) => setPinConfirm(e.target.value)}
                      placeholder="Ketik ulang PIN baru"
                      className="w-full text-xs font-mono font-bold tracking-wider py-2 px-3 rounded-xl border border-slate-300 focus:border-[#f05a22] focus:ring-1 focus:ring-orange-100"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  id="btn-save-signature-settings"
                  disabled={isSubmitting || (!selectedFile && !pin)}
                  className="px-6 py-2.5 rounded-xl text-white font-bold text-xs bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Menyimpan Pengaturan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Simpan Tanda Tangan & PIN</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Kotak Pengujian PIN Cepat (Testing Simulator) */}
          <section className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-[#f05a22]" />
              <h4 className="text-xs font-bold text-slate-800">Uji Coba Validasi PIN Cepat</h4>
            </div>
            <p className="text-[11px] text-slate-500">
              Ketikkan PIN Anda di sini untuk memverifikasi kesiapan PIN sebelum melakukan otorisasi dokumen riil:
            </p>

            <div className="flex items-center gap-3">
              <input
                type="password"
                maxLength={8}
                value={testPin}
                onChange={(e) => setTestPin(e.target.value)}
                placeholder="Coba ketik 123456"
                className="max-w-xs text-xs font-mono font-bold py-2 px-3 rounded-xl border border-slate-300 bg-white"
              />
              <button
                type="button"
                onClick={handleTestPinVerification}
                className="px-4 py-2 text-xs font-bold text-[#0b2046] bg-white border border-slate-300 hover:bg-slate-100 rounded-xl"
              >
                Verifikasi PIN
              </button>
            </div>

            {testPinResult && (
              <div className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                testPinResult.valid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                <span>{testPinResult.message}</span>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
