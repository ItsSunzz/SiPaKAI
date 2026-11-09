
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Header from './Header'
import {
  IdCard,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Train,
  UserRoundPlus,
  BookUser,
} from 'lucide-react'
import { api } from '../services/api'

export default function Login({ onLoginSuccess, onGuestBook, onRegister }) {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const res = await api.login(identifier, password)
      onLoginSuccess(res.user, res.token)
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Login gagal. Periksa kembali Email/NIPP dan kata sandi Anda.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-[100svh] min-h-0 flex flex-col overflow-hidden bg-[#f3f5f9] font-sans">

      <Header />

      {/* MAIN */}
      <main className="flex-1 min-h-0 flex items-center justify-center p-3 sm:p-4 lg:p-5">
        <div className="w-full max-w-6xl h-full max-h-[760px] min-h-0 bg-white rounded-2xl lg:rounded-[26px] overflow-hidden shadow-xl shadow-slate-300/40 grid grid-cols-1 md:grid-cols-2">

          {/* PANEL KIRI */}
          <section className="relative hidden md:flex min-h-0 overflow-hidden bg-[#0b2046]">

            <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full border-[45px] border-white/[0.06]" />

            <div className="absolute -bottom-36 -left-28 h-96 w-96 rounded-full border-[55px] border-[#f05a22]/15" />

            <div className="absolute right-20 bottom-32 h-52 w-52 rounded-full bg-[#f05a22]/10 blur-3xl" />

            <div className="absolute inset-0 bg-gradient-to-br from-[#0b2046] via-transparent to-[#071633]/80" />

            <div className="relative z-10 flex h-full w-full flex-col justify-between p-7 lg:p-9 xl:p-11">

              {/* BRAND */}
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f05a22] text-white shadow-lg">
                  <Train size={25} />
                </div>

                <div>
                  <h2 className="text-xl font-extrabold tracking-wide text-white">
                    SIPAKAI
                  </h2>

                  <p className="mt-1 text-[9px] leading-4 tracking-[1.3px] text-blue-100">
                    SISTEM INFORMASI PENGELOLAAN
                  </p>

                  <p className="text-[9px] leading-4 tracking-[1.3px] text-blue-100">
                    ADMINISTRASI DAN DOKUMENTASI KAI
                  </p>
                </div>
              </div>

              {/* INTRO */}
              <div className="my-5 max-w-lg">
                <span className="inline-flex rounded-md bg-[#f05a22] px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-white">
                  Sistem Administrasi Terintegrasi
                </span>

                <h2 className="mt-5 text-3xl lg:text-4xl xl:text-[42px] font-extrabold leading-[1.15] text-white">
                  Digitalisasi
                  <br />
                  Administrasi
                  <span className="block text-[#ff895b]">
                    dalam Satu Sistem
                  </span>
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-blue-100/90">
                  Mengintegrasikan pengajuan, verifikasi, persetujuan,
                  pengelolaan aset, dokumentasi, dan pengarsipan
                  untuk mendukung proses administrasi KAI.
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {['Administrasi', 'Approval', 'Dokumentasi', 'Arsip'].map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[10px] font-medium text-white backdrop-blur-sm"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* FOOTER PANEL */}
              <div className="border-t border-white/15 pt-4">
                <p className="text-[10px] leading-5 text-blue-100/70">
                  Sistem Informasi Pengelolaan Administrasi dan Dokumentasi KAI
                </p>
              </div>
            </div>
          </section>

          {/* PANEL KANAN */}
          <section className="flex min-h-0 flex-col justify-center overflow-y-auto bg-white px-6 py-6 sm:px-9 lg:px-9 xl:px-14">

            <div className="mx-auto w-full max-w-md">

              {/* TITLE */}
              <div className="mb-5">
                <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#f05a22]">
                  Selamat Datang
                </p>

                <h2 className="mt-2 text-2xl lg:text-3xl font-extrabold tracking-tight text-[#0b2046]">
                  Masuk ke Sistem
                </h2>

                <p className="mt-2 text-xs sm:text-sm leading-6 text-slate-500">
                  Masukkan Email/NIPP dan kata sandi untuk mengakses layanan SIPAKAI.
                </p>
              </div>

              {/* ERROR */}
              {error && (
                <div
                  role="alert"
                  className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700"
                >
                  {error}
                </div>
              )}

              {/* FORM LOGIN */}
              <form onSubmit={handleLogin} className="flex flex-col gap-4">

                <div>
                  <label className="mb-2 block text-[11px] font-bold tracking-wide text-slate-700">
                    EMAIL / NIPP
                    <span className="ml-1 text-[#f05a22]">*</span>
                  </label>

                  <div className="relative">
                    <IdCard
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Masukkan email atau NIPP Anda"
                      autoComplete="username"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#f05a22] focus:bg-white focus:ring-4 focus:ring-orange-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-bold tracking-wide text-slate-700">
                    KATA SANDI
                    <span className="ml-1 text-[#f05a22]">*</span>
                  </label>

                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi"
                      autoComplete="current-password"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#f05a22] focus:bg-white focus:ring-4 focus:ring-orange-100"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0b2046]"
                    >
                      {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                    </button>
                  </div>
                </div>

                {/* LUPA PASSWORD */}
                <div className="flex justify-end -mt-1">
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Lupa Password?
                  </button>
                </div>

                {/* TOMBOL LOGIN */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-[#f05a22] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:-translate-y-0.5 hover:bg-[#d94a18] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? 'Memproses...' : 'Masuk ke Sistem'}
                  {!isLoading && <ArrowRight size={18} />}
                </button>
              </form>

              {/* DIVIDER */}
              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />

                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Akses lainnya
                </span>

                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {/* BUKU TAMU */}
              <button
                type="button"
                onClick={onGuestBook}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#0b2046] bg-white px-4 py-3 text-sm font-bold text-[#0b2046] transition hover:bg-blue-50"
              >
                <BookUser size={18} />
                Buku Tamu
              </button>

              {/* REGISTER */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-1 text-xs sm:text-sm">
                <span className="text-slate-500">
                  Belum memiliki akun?
                </span>

                <button
                  type="button"
                  onClick={onRegister}
                  className="inline-flex items-center gap-1 font-bold text-[#f05a22] transition hover:text-[#d94a18]"
                >
                  <UserRoundPlus size={15} />
                  Daftar Akun Pemohon
                </button>
              </div>

            </div>
          </section>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="h-[32px] shrink-0 flex items-center justify-center bg-[#0b2046] px-3 text-center text-[9px] text-blue-100/80">
        © 2026 PT Kereta Api Indonesia (Persero). Seluruh hak cipta dilindungi undang-undang.
      </footer>
    </div>
  )
}
