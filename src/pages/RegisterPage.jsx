import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  UserRound,
  BriefcaseBusiness,
  Building2,
  LockKeyhole,
  IdCard,
  ShieldCheck,
  Train,
  CheckCircle2,
  LoaderCircle,
  Mail,
} from 'lucide-react'
import { api } from '../services/api'
import Header from '../components/Header'

export default function RegisterPage({ onBackToLogin }) {
  const [form, setForm] = useState({
    nip: '',
    email: '',
    name: '',
    jabatan: '',
    unit_kerja: '',
    password: '',
    password_confirmation: '',
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    try {
      await api.register(form)

      setMessage('Pendaftaran berhasil. Silakan masuk menggunakan akun yang dibuat.')

      setForm({
        nip: '',
        email: '',
        name: '',
        jabatan: '',
        unit_kerja: '',
        password: '',
        password_confirmation: '',
      })
    } catch (err) {
      setError(
        Object.values(err.errors || {}).flat()[0] ||
        err.message ||
        'Pendaftaran gagal.'
      )
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    {
      name: 'nip',
      label: 'NIPP',
      placeholder: 'Masukkan NIPP',
      icon: IdCard,
      type: 'text',
      autoComplete: 'off',
    },
    {
      name: 'email',
      label: 'Email',
      placeholder: 'Masukkan alamat email',
      icon: Mail,
      type: 'email',
      autoComplete: 'email',
    },
    {
      name: 'name',
      label: 'Nama Lengkap',
      placeholder: 'Masukkan nama lengkap',
      icon: UserRound,
      type: 'text',
      autoComplete: 'name',
    },
    {
      name: 'jabatan',
      label: 'Jabatan',
      placeholder: 'Masukkan jabatan',
      icon: BriefcaseBusiness,
      type: 'text',
      autoComplete: 'organization-title',
    },
    {
      name: 'unit_kerja',
      label: 'Unit Kerja',
      placeholder: 'Masukkan unit kerja',
      icon: Building2,
      type: 'text',
      autoComplete: 'organization',
    },
    {
      name: 'password',
      label: 'Kata Sandi',
      placeholder: 'Minimal 8 karakter',
      icon: LockKeyhole,
      type: 'password',
      autoComplete: 'new-password',
    },
    {
      name: 'password_confirmation',
      label: 'Konfirmasi Kata Sandi',
      placeholder: 'Ulangi kata sandi',
      icon: ShieldCheck,
      type: 'password',
      autoComplete: 'new-password',
    },
  ]

  return (
    <div className="min-h-[100svh] h-[100svh] flex flex-col overflow-hidden bg-[#f3f5f9] font-sans">

      {/* TOPBAR */}
      <Header />

      {/* MAIN */}
      <main className="flex-1 min-h-0 flex items-center justify-center p-3 sm:p-4 lg:p-5">
        <div className="w-full max-w-6xl h-full max-h-[760px] min-h-0 bg-white rounded-2xl lg:rounded-[26px] overflow-hidden shadow-xl shadow-slate-300/40 grid grid-cols-1 md:grid-cols-2">

          {/* PANEL KIRI */}
          <section className="relative hidden md:flex min-h-0 overflow-hidden bg-[#0b2046]">

            {/* DEKORASI LINGKARAN */}
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
                <span className="inline-flex items-center gap-2 rounded-md bg-[#f05a22] px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-white">
                  <ShieldCheck size={13} />
                  Registrasi Pengguna
                </span>

                <h2 className="mt-5 text-3xl lg:text-4xl xl:text-[42px] font-extrabold leading-[1.15] text-white">
                  Satu Sistem,
                  <span className="block text-[#ff895b]">
                    Administrasi Terintegrasi
                  </span>
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-blue-100/90">
                  Platform digital untuk mengelola pengajuan administrasi,
                  verifikasi, persetujuan, dokumentasi, hingga pengarsipan
                  dalam satu sistem.
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

              {/* INFORMASI PANEL */}
              <div className="border-t border-white/15 pt-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                    <CheckCircle2 size={21} className="text-[#ff895b]" />
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-white">
                      Administrasi lebih terintegrasi
                    </p>
                    <p className="mt-1 text-[10px] text-blue-200">
                      Pengajuan, persetujuan, dan arsip dalam satu platform
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* PANEL KANAN */}
          <section className="flex min-h-0 flex-col justify-center overflow-y-auto bg-white px-5 py-4 sm:px-8 lg:px-9 xl:px-12">

            <div className="mx-auto w-full max-w-md">

              {/* KEMBALI */}
              <button
                type="button"
                onClick={onBackToLogin}
                className="mb-4 flex w-fit items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-[#f05a22]"
              >
                <ArrowLeft size={16} />
                Kembali ke Login
              </button>

              {/* TITLE */}
              <div className="mb-5">
                <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#f05a22]">
                  Buat Akun Baru
                </p>

                <h2 className="mt-1.5 text-2xl lg:text-3xl font-extrabold tracking-tight text-[#0b2046]">
                  Daftar Akun Pemohon
                </h2>

                <p className="mt-2 text-xs sm:text-sm leading-6 text-slate-500">
                  Lengkapi informasi berikut untuk membuat akun SIPAKAI.
                </p>
              </div>

              {/* PESAN SUKSES */}
              {message && (
                <div
                  role="status"
                  className="mb-3 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700"
                >
                  <CheckCircle2 size={17} className="shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              {/* PESAN ERROR */}
              {error && (
                <div
                  role="alert"
                  className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700"
                >
                  {error}
                </div>
              )}

              {/* FORM */}
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">

                  {fields.map((field) => {
                    const Icon = field.icon

                    return (
                      <div
                        key={field.name}
                        className={`min-w-0 ${field.name === 'unit_kerja' ? 'sm:col-span-2' : ''}`}
                      >
                        <label
                          htmlFor={field.name}
                          className="mb-1.5 block text-[11px] font-bold text-slate-700"
                        >
                          {field.label}
                        </label>

                        <div className="relative">
                          <Icon
                            size={16}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                          />

                          <input
                            id={field.name}
                            name={field.name}
                            type={field.type}
                            value={form[field.name]}
                            onChange={handleChange}
                            placeholder={field.placeholder}
                            minLength={field.type === 'password' ? 8 : undefined}
                            autoComplete={field.autoComplete}
                            required
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-xs sm:text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#f05a22] focus:bg-white focus:ring-4 focus:ring-orange-100"
                          />
                        </div>
                      </div>
                    )
                  })}

                </div>

                {/* TOMBOL DAFTAR */}
                <div className="mt-5">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#f05a22] py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:-translate-y-0.5 hover:bg-[#d94a18] hover:shadow-orange-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <LoaderCircle size={18} className="animate-spin" />
                        Mendaftarkan...
                      </>
                    ) : (
                      <>
                        Daftar Akun
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              </form>

              <p className="mt-4 text-center text-[10px] leading-5 text-slate-400">
                Akun ini digunakan untuk mengakses layanan administrasi SIPAKAI.
              </p>
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