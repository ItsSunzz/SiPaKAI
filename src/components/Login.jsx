import React, { useState } from 'react';
import { HelpCircle, IdCard, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Train } from 'lucide-react';
import { api } from '../services/api';
import heroImg from '../assets/hero.png'; // Assuming hero.png is the image in the screenshot

export default function Login({ onLoginSuccess, onGuestBook }) {
  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const res = await api.login(nip, password);
      onLoginSuccess(res.user, res.token);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login gagal. Periksa kembali NIPP dan kata sandi Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="w-full bg-white px-8 py-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#0b2046] rounded-xl flex items-center justify-center text-white shrink-0">
            <Train className="w-7 h-7" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-bold text-[#0b2046] text-lg leading-tight">PT Kereta Api Indonesia (Persero)</h1>
            <p className="text-slate-500 text-sm">Sistem Manajemen Aset & Fasilitas TI</p>
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm text-slate-500">
          <button className="flex items-center gap-2 hover:text-[#0b2046] transition-colors">
            <HelpCircle className="w-4 h-4" /> Bantuan
          </button>
          <span className="w-px h-4 bg-slate-300"></span>
          <button className="hover:text-[#0b2046] transition-colors">
            Tentang Sistem
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex flex-col md:flex-row w-full max-w-[1100px] overflow-hidden min-h-[600px]">
          
          {/* Left Column - Image & Banner */}
          <div className="hidden md:flex md:w-1/2 relative bg-slate-200">
            {/* The actual image from the screenshot shows a train station */}
            <img 
              src={heroImg} 
              alt="Kereta Cepat Whoosh" 
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1541427468627-a89a96e5ca1d?q=80&w=2070&auto=format&fit=crop';
              }}
            />
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b2046]/90 via-[#0b2046]/40 to-transparent"></div>
            
            {/* Overlay Content */}
            <div className="absolute bottom-0 left-0 w-full p-10 flex flex-col gap-3">
              <span className="bg-[#f05a22] text-white text-[10px] font-bold tracking-wider px-3 py-1 rounded-sm w-fit uppercase">
                Enterprise Asset Platform
              </span>
              <h2 className="text-white text-3xl font-bold leading-tight">
                Digitalisasi Sarana & Infrastruktur TI Terintegrasi
              </h2>
              <p className="text-slate-200 text-sm mt-1 leading-relaxed">
                Mendukung keandalan data, pemeliharaan aset, dan efisiensi operasional perkeretaapian nasional.
              </p>
            </div>
          </div>

          {/* Right Column - Login Form */}
          <div className="w-full md:w-1/2 p-10 lg:p-14 flex flex-col justify-center bg-white">
            <h2 className="text-3xl font-bold text-[#0b2046] mb-2">Masuk ke Sistem</h2>
            <p className="text-slate-500 text-sm mb-10 leading-relaxed">
              Silakan masukkan NIPP dan kata sandi Anda untuk melanjutkan ke dashboard manajemen aset TI.
            </p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 flex items-center">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="flex flex-col gap-6">
              {/* NIPP Input */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-[#0b2046] uppercase tracking-wide">
                  Username / NIPP <span className="text-[#f05a22]">*</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-slate-400">
                    <IdCard className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    placeholder="Masukkan NIPP atau Email KAI (cth. 52489)"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f05a22]/20 focus:border-[#f05a22] transition-all text-sm placeholder-slate-400"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 ml-1">Nomor Induk Pegawai Perusahaan resmi terdaftar di HCIS KAI</p>
              </div>

              {/* Password Input */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-[#0b2046] uppercase tracking-wide">
                    Kata Sandi <span className="text-[#f05a22]">*</span>
                  </label>
                  <a href="#" className="text-xs font-semibold text-[#0b2046] hover:text-[#f05a22] transition-colors">
                    Lupa Kata Sandi?
                  </a>
                </div>
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi akun anda"
                    className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f05a22]/20 focus:border-[#f05a22] transition-all text-sm placeholder-slate-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Options Row */}
              <div className="flex items-center justify-between mt-1 mb-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#f05a22] focus:ring-[#f05a22]"
                  />
                  <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">Ingat Saya</span>
                </label>
                
                <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-md border border-emerald-100">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-[11px] font-bold tracking-wide">SSO / BSrE Protected</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col gap-3 mt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#f05a22] hover:bg-[#d94a18] text-white font-semibold py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isLoading ? 'Memproses...' : 'Masuk ke Sistem'}
                  {!isLoading && <ArrowRight className="w-4 h-4" />}
                </button>
                
                <button
                  type="button"
                  onClick={onGuestBook}
                  className="w-full bg-[#0b2046] hover:bg-[#071633] text-white font-semibold py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center"
                >
                  Buku Tamu
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#0b2046] text-white py-4 text-center text-xs font-light">
        © 2025 PT Kereta Api Indonesia (Persero). Seluruh hak cipta dilindungi undang-undang.
      </footer>
    </div>
  );
}
