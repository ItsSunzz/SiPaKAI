
import { useState } from 'react'
import { api } from '../services/api'

export default function RegisterPage({ onBackToLogin }) {
  const [form, setForm] = useState({
    nip: '',
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
    ['nip', 'NIPP'],
    ['name', 'Nama lengkap'],
    ['jabatan', 'Jabatan'],
    ['unit_kerja', 'Unit kerja'],
    ['password', 'Kata sandi'],
    ['password_confirmation', 'Konfirmasi kata sandi'],
  ]

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <section className="bg-white w-full max-w-lg rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-[#0b2046]">
          Daftar Akun Pemohon
        </h1>
        <p className="text-sm text-slate-500 mt-2 mb-6">
          Lengkapi data berikut untuk membuat akun SIPAKAI.
        </p>

        {message && (
          <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
            {message}
          </p>
        )}
        {error && (
          <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(([name, label]) => {
            const isPassword = name === 'password' ||
              name === 'password_confirmation'

            return (
              <div key={name}>
                <label htmlFor={name} className="block text-sm font-medium text-slate-700 mb-1">
                  {label}
                </label>
                <input
                  id={name}
                  name={name}
                  type={isPassword ? 'password' : 'text'}
                  value={form[name]}
                  onChange={handleChange}
                  minLength={isPassword ? 8 : undefined}
                  autoComplete={name === 'password'
                    ? 'new-password'
                    : name === 'password_confirmation'
                    ? 'new-password'
                    : 'off'}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-[#f05a22] focus:ring-2 focus:ring-orange-100"
                />
              </div>
            )
          })}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#f05a22] py-3 font-semibold text-white hover:bg-[#d94a18] disabled:opacity-60"
          >
            {loading ? 'Mendaftarkan...' : 'Daftar Akun'}
          </button>
        </form>

        <button
          type="button"
          onClick={onBackToLogin}
          className="mt-4 w-full text-sm font-medium text-[#0b2046] hover:underline"
        >
          Kembali ke Login
        </button>
      </section>
    </main>
  )
}
