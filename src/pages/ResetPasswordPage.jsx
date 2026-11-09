
import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  LockKeyhole,
  ShieldCheck,
  Eye,
  EyeOff,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
  Train,
} from 'lucide-react'

import { api } from '../services/api'
import Header from '../components/Header'

export default function ResetPasswordPage({ onBackToLogin }) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const token = searchParams.get('token') || ''
  const email = searchParams.get('email') || ''

  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleBack = () => {
    if (onBackToLogin) {
      onBackToLogin()
    } else {
      navigate('/')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setMessage('')
    setError('')

    if (password.length < 8) {
      setError('Password minimal harus 8 karakter.')
      return
    }

    if (password !== passwordConfirmation) {
      setError('Konfirmasi password tidak sama.')
      return
    }

    setLoading(true)

    try {
      const response = await api.resetPassword({
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      })

      setMessage(
        response.message || 'Password berhasil diperbarui. Silakan login kembali.'
      )

      setPassword('')
      setPasswordConfirmation('')
    } catch (err) {
      setError(
        Object.values(err.errors || {}).flat()[0] ||
        err.message ||
        'Gagal mereset password.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-[100svh] min-h-0 flex flex-col overflow-hidden bg-[#f3f5f9] font-sans">

      {/* TOPBAR */}
      <Header />

      {/* MAIN */}
      <main className="flex-1 min-h-0 flex items-center justify-center overflow-y-auto p-4 sm:p-5">

        <div className="w-full max-w-5xl min-h-[440px] overflow-hidden rounded-2xl lg:rounded-[26px] bg-white shadow-xl shadow-slate-300/40 grid grid-cols-1 md:grid-cols-2">

          {/* PANEL KIRI */}
          <section className="relative hidden md:flex flex-col justify-between overflow-hidden bg-[#0b2046] p-8 lg:p-10">

            {/* DEKORASI */}
            <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full border-[45px] border-white/[0.06]" />

            <div className="absolute -bottom-36 -left-28 h-96 w-96 rounded-full border-[55px] border-[#f05a22]/15" />

            <div className="absolute right-10 bottom-20 h-52 w-52 rounded-full bg-[#f05a22]/10 blur-3xl" />

            <div className="absolute inset-0 bg-gradient-to-br from-[#0b2046] via-transparent to-[#071633]/80" />

            <div className="relative z-10 flex items-center gap-3">
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
            <div className="relative z-10 my-8">
              <span className="inline-flex rounded-md bg-[#f05a22] px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-white">
                Keamanan Akun
              </span>

              <h2 className="mt-5 text-3xl lg:text-4xl font-extrabold leading-tight text-white">
                Perbarui
                <span className="block text-[#ff895b]">
                  Kata Sandi Anda
                </span>
              </h2>

              <p className="mt-5 max-w-md text-sm leading-7 text-blue-100/90">
                Buat kata sandi baru untuk menjaga keamanan akun dan
                melanjutkan penggunaan layanan administrasi SIPAKAI.
              </p>

              <div className="mt-7 flex items-center gap-3 rounded-xl border border-white/15 bg-white/[0.07] p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <ShieldCheck size={21} className="text-[#ff895b]" />
                </div>

                <div>
                  <p className="text-xs font-semibold text-white">
                    Perlindungan Akun
                  </p>

                  <p className="mt-1 text-[10px] leading-4 text-blue-200">
                    Gunakan kata sandi yang kuat dan mudah Anda ingat
                  </p>
                </div>
              </div>
            </div>

            {/* FOOTER PANEL */}
            <div className="relative z-10 border-t border-white/15 pt-4">
              <p className="text-[10px] leading-5 text-blue-100/70">
                Sistem Informasi Pengelolaan Administrasi dan Dokumentasi KAI
              </p>
            </div>
          </section>

          {/* PANEL KANAN */}
          <section className="flex min-h-[440px] flex-col justify-center bg-white px-6 py-9 sm:px-10 lg:px-12">

            <div className="mx-auto w-full max-w-md">

              {/* KEMBALI */}
              <button
                type="button"
                onClick={handleBack}
                className="mb-7 flex w-fit items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-[#f05a22]"
              >
                <ArrowLeft size={16} />
                Kembali ke Login
              </button>

              {/* JUDUL */}
              <div className="mb-6">
                <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#f05a22]">
                  Pengaturan Akun
                </p>

                <h1 className="mt-2 text-2xl lg:text-3xl font-extrabold tracking-tight text-[#0b2046]">
                  Reset Password
                </h1>

                <p className="mt-3 text-xs sm:text-sm leading-6 text-slate-500">
                  Buat kata sandi baru untuk akun SIPAKAI Anda.
                </p>

                {email && (
                  <p className="mt-2 text-xs font-semibold text-[#0b2046]">
                    {email}
                  </p>
                )}
              </div>

              {/* LINK TIDAK VALID */}
              {(!token || !email) ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <div className="flex items-start gap-3 text-red-700">
                    <AlertCircle size={19} className="mt-0.5 shrink-0" />

                    <div>
                      <p className="text-sm font-bold">
                        Link reset tidak valid
                      </p>

                      <p className="mt-1 text-xs leading-5">
                        Link reset password tidak lengkap atau tidak valid.
                        Silakan minta tautan reset password yang baru.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>

                  {/* PASSWORD BARU */}
                  <div className="mb-4">
                    <label
                      htmlFor="password"
                      className="mb-2 block text-[11px] font-bold tracking-wide text-slate-700"
                    >
                      PASSWORD BARU
                      <span className="ml-1 text-[#f05a22]">*</span>
                    </label>

                    <div className="relative">
                      <LockKeyhole
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimal 8 karakter"
                        autoComplete="new-password"
                        minLength={8}
                        required
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#f05a22] focus:bg-white focus:ring-4 focus:ring-orange-100"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-[#0b2046]"
                      >
                        {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                      </button>
                    </div>
                  </div>

                  {/* KONFIRMASI PASSWORD */}
                  <div className="mb-4">
                    <label
                      htmlFor="password_confirmation"
                      className="mb-2 block text-[11px] font-bold tracking-wide text-slate-700"
                    >
                      KONFIRMASI PASSWORD
                      <span className="ml-1 text-[#f05a22]">*</span>
                    </label>

                    <div className="relative">
                      <ShieldCheck
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        id="password_confirmation"
                        type={showConfirmation ? 'text' : 'password'}
                        value={passwordConfirmation}
                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                        placeholder="Ulangi password baru"
                        autoComplete="new-password"
                        minLength={8}
                        required
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#f05a22] focus:bg-white focus:ring-4 focus:ring-orange-100"
                      />

                      <button
                        type="button"
                        onClick={() => setShowConfirmation(!showConfirmation)}
                        aria-label={showConfirmation ? 'Sembunyikan konfirmasi password' : 'Tampilkan konfirmasi password'}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-[#0b2046]"
                      >
                        {showConfirmation ? <EyeOff size={19} /> : <Eye size={19} />}
                      </button>
                    </div>
                  </div>

                  {/* INFO PASSWORD */}
                  <p className="mb-5 text-[10px] leading-5 text-slate-400">
                    Pastikan password baru minimal terdiri dari 8 karakter
                    dan kedua kolom password sama.
                  </p>

                  {/* PESAN SUKSES */}
                  {message && (
                    <div
                      role="status"
                      className="mb-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs leading-5 text-emerald-700"
                    >
                      <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                      <span>{message}</span>
                    </div>
                  )}

                  {/* PESAN ERROR */}
                  {error && (
                    <div
                      role="alert"
                      className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs leading-5 text-red-700"
                    >
                      <AlertCircle size={18} className="mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* TOMBOL */}
                  <button
                    type="submit"
                    disabled={loading || !!message}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#f05a22] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:-translate-y-0.5 hover:bg-[#d94a18] hover:shadow-orange-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <LoaderCircle size={18} className="animate-spin" />
                        Memproses...
                      </>
                    ) : message ? (
                      <>
                        Password Berhasil Diperbarui
                        <CheckCircle2 size={18} />
                      </>
                    ) : (
                      <>
                        Simpan Password Baru
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>

                </form>
              )}

              {/* KEMBALI LOGIN */}
              {message && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="mt-4 w-full rounded-xl border border-[#0b2046] bg-white py-3 text-xs font-bold text-[#0b2046] transition hover:bg-blue-50"
                >
                  Kembali ke Login
                </button>
              )}

              {!message && (
                <p className="mt-5 text-center text-[10px] leading-5 text-slate-400">
                  SIPAKAI · Sistem Informasi Pengelolaan Administrasi dan Dokumentasi KAI
                </p>
              )}

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
