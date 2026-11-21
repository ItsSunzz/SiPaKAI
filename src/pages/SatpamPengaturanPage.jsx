
import { useEffect, useRef, useState } from 'react'
import {
  UserRound,
  LockKeyhole,
  PenLine,
  Upload,
  Save,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  Eraser,
  Pencil,
  Image as ImageIcon,
} from 'lucide-react'
import { api } from '../services/api'

const initialPassword = {
  current_password: '',
  password: '',
  password_confirmation: '',
}

export default function SatpamPengaturanPage({ user, onProfileUpdated }) {
  const canvasRef = useRef(null)
  const fileRef = useRef(null)
  const drawingRef = useRef(false)
  const lastPointRef = useRef(null)

  const [activeTab, setActiveTab] = useState('profil')
  const [signatureMode, setSignatureMode] = useState('digital')

  const [profile, setProfile] = useState({
    nama: user?.nama || user?.name || '',
    nip: user?.nip || '',
    email: user?.email || '',
    unit_kerja: user?.unit_kerja || user?.location || '',
  })

  const [password, setPassword] = useState(initialPassword)
  const [signatureFile, setSignatureFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [hasDrawing, setHasDrawing] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [signatureVersion, setSignatureVersion] = useState(0)

  const notify = (text = '', isError = false) => {
    setMessage(isError ? '' : text)
    setError(isError ? text : '')
  }

  // Siapkan canvas ketika tab tanda tangan dibuka
  useEffect(() => {
    if (activeTab !== 'ttd') return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const ratio = window.devicePixelRatio || 1

    canvas.width = Math.round(rect.width * ratio)
    canvas.height = Math.round(220 * ratio)

    const ctx = canvas.getContext('2d')
    ctx.scale(ratio, ratio)
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#172554'
  }, [activeTab, signatureMode])

  const getPoint = (event) => {
    const rect = canvasRef.current.getBoundingClientRect()

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }

  const startDrawing = (event) => {
    if (signatureMode !== 'digital') return

    const canvas = canvasRef.current
    if (!canvas) return

    drawingRef.current = true
    canvas.setPointerCapture(event.pointerId)

    const point = getPoint(event)
    lastPointRef.current = point

    const ctx = canvas.getContext('2d')
    ctx.beginPath()
    ctx.moveTo(point.x, point.y)
  }

  const draw = (event) => {
    if (!drawingRef.current) return

    const point = getPoint(event)
    const ctx = canvasRef.current.getContext('2d')

    ctx.beginPath()
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()

    lastPointRef.current = point
    setHasDrawing(true)
  }

  const stopDrawing = () => {
    drawingRef.current = false
    lastPointRef.current = null
  }

  const clearDrawing = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    setHasDrawing(false)
  }

  const handleProfileSave = async (event) => {
    event.preventDefault()
    setLoading(true)
    notify()

    try {
      await api.updateProfile({
        nama: profile.nama,
        email: profile.email,
        unit_kerja: profile.unit_kerja,
      })

      notify('Profil berhasil diperbarui.')
      onProfileUpdated?.()
    } catch (err) {
      notify(err.message || 'Gagal memperbarui profil.', true)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      notify('Gunakan file PNG atau JPG.', true)
      event.target.value = ''
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      notify('Ukuran gambar maksimal 2 MB.', true)
      event.target.value = ''
      return
    }

    setSignatureFile(file)
    setPreview(URL.createObjectURL(file))
    notify()
  }

  const handleSignatureSave = async () => {
    setLoading(true)
    notify()

    try {
      let file = signatureFile

      if (signatureMode === 'digital') {
        if (!hasDrawing) {
          notify('Buat tanda tangan terlebih dahulu.', true)
          return
        }

        const blob = await new Promise((resolve) => {
          canvasRef.current.toBlob(resolve, 'image/png')
        })

        if (!blob) {
          throw new Error('Gagal membuat gambar tanda tangan.')
        }

        file = new File([blob], 'tanda-tangan-satpam.png', {
          type: 'image/png',
        })
      }

      if (!file) {
        notify('Silakan pilih gambar tanda tangan.', true)
        return
      }

      const formData = new FormData()
      formData.append('signature', file)

      await api.uploadSignature(formData)

      setSignatureFile(null)
      setPreview('')
      setHasDrawing(false)
      setSignatureVersion(Date.now())
      notify('Tanda tangan berhasil disimpan.')
    } catch (err) {
      notify(err.message || 'Gagal menyimpan tanda tangan.', true)
    } finally {
      setLoading(false)
    }
  }
  
  const handlePasswordSave = async (event) => {
    event.preventDefault()

    if (password.password !== password.password_confirmation) {
        notify('Konfirmasi password tidak sama.', true)
        return
    }

    setLoading(true)
    notify()

    try {
        await api.updateProfile({
        current_password: password.current_password,
        password: password.password,
        password_confirmation: password.password_confirmation,
        })

        setPassword(initialPassword)
        notify('Password berhasil diperbarui.')
    } catch (err) {
        notify(
        err.errors?.current_password?.[0] ||
        err.errors?.password?.[0] ||
        err.message ||
        'Gagal mengubah password.',
        true
        )
    } finally {
        setLoading(false)
    }
    }

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-base text-slate-800 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100'

  const labelClass = 'mb-2 block text-sm font-semibold text-slate-700'

  const tabs = [
    { id: 'profil', label: 'Profil Saya', desc: 'Informasi akun', icon: UserRound },
    { id: 'password', label: 'Keamanan Akun', desc: 'Ubah password', icon: LockKeyhole },
    { id: 'ttd', label: 'Tanda Tangan', desc: 'Digital atau upload', icon: PenLine },
  ]

  return (
    <main className="w-full space-y-5 px-4 py-5 sm:px-6 lg:px-8">

      {/* HEADER */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-blue-700">
            Pengaturan Akun
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Pengaturan Satpam
          </h1>
          <p className="mt-1 text-sm text-slate-500 sm:text-base">
            Kelola informasi pribadi dan keamanan akun petugas.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
          <ShieldCheck size={18} />
          Akun Petugas
        </div>
      </header>

      {/* PROFILE SUMMARY */}
      <section className="flex flex-wrap items-center gap-4 border-b border-slate-200 bg-white py-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#102B54] text-xl font-bold text-white">
          {(profile.nama || 'S').charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-slate-900">
            {profile.nama || 'Petugas Satpam'}
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            NIP: {profile.nip || '-'}
          </p>
          <p className="mt-1 text-xs font-bold tracking-wide text-blue-700">
            PETUGAS SATPAM
          </p>
        </div>
      </section>

      {/* NOTIFICATION */}
      {message && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          <CheckCircle2 size={19} />
          {message}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={19} />
          {error}
        </div>
      )}

      {/* CONTENT LAYOUT */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">

        {/* LEFT NAVIGATION */}
        <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id)
                  notify()
                }}
                className={`flex min-w-[145px] flex-1 items-center gap-3 rounded-xl border p-3 text-left transition lg:w-full lg:flex-none ${
                  active
                    ? 'border-blue-200 bg-blue-50 text-blue-800'
                    : 'border-transparent bg-white text-slate-600 hover:border-slate-200 hover:bg-white'
                }`}
              >
                <span className={`rounded-lg p-2 ${active ? 'bg-blue-100' : 'bg-slate-100'}`}>
                  <Icon size={20} />
                </span>

                <span className="min-w-0">
                  <span className="block whitespace-nowrap text-sm font-bold">
                    {tab.label}
                  </span>
                  <span className="hidden text-xs text-slate-500 lg:block">
                    {tab.desc}
                  </span>
                </span>
              </button>
            )
          })}

          <div className="hidden rounded-xl bg-slate-100 p-4 lg:block">
            <ShieldCheck size={22} className="mb-2 text-blue-700" />
            <p className="text-sm font-bold text-slate-800">
              Keamanan Akun
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Jaga kerahasiaan password dan gunakan tanda tangan resmi milik Anda.
            </p>
          </div>
        </nav>

        {/* RIGHT CONTENT */}
        <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">

          <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
            <h2 className="text-lg font-bold text-slate-900">
              {tabs.find((tab) => tab.id === activeTab)?.label}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {tabs.find((tab) => tab.id === activeTab)?.desc}
            </p>
          </div>

          <div className="p-5 sm:p-6">

            {/* PROFIL */}
            {activeTab === 'profil' && (
              <form onSubmit={handleProfileSave} className="space-y-5">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>Nama Lengkap</label>
                    <input
                      className={inputClass}
                      value={profile.nama}
                      onChange={(e) =>
                        setProfile({ ...profile, nama: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className={labelClass}>NIP</label>
                    <input
                      className={`${inputClass} bg-slate-50`}
                      value={profile.nip}
                      readOnly
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Email</label>
                    <input
                      type="email"
                      className={inputClass}
                      value={profile.email}
                      onChange={(e) =>
                        setProfile({ ...profile, email: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Unit Kerja</label>
                    <input
                      className={inputClass}
                      value={profile.unit_kerja}
                      onChange={(e) =>
                        setProfile({ ...profile, unit_kerja: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end border-t border-slate-100 pt-5">
                  <button
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#102B54] px-6 py-3 text-sm font-bold text-white hover:bg-blue-900 disabled:opacity-60 sm:w-auto"
                  >
                    {loading
                      ? <LoaderCircle size={18} className="animate-spin" />
                      : <Save size={18} />}
                    Simpan Profil
                  </button>
                </div>
              </form>
            )}

            {/* PASSWORD */}
            {activeTab === 'password' && (
              <form onSubmit={handlePasswordSave} className="max-w-xl space-y-5">
                <div className="rounded-lg bg-blue-50 p-4">
                  <div className="flex gap-3">
                    <ShieldCheck className="shrink-0 text-blue-700" size={21} />
                    <p className="text-sm leading-relaxed text-blue-900">
                      Gunakan password pribadi yang kuat dan jangan membagikannya kepada orang lain.
                    </p>
                  </div>
                </div>

                {[
                  ['current_password', 'Password Saat Ini'],
                  ['password', 'Password Baru'],
                  ['password_confirmation', 'Konfirmasi Password Baru'],
                ].map(([key, label]) => (
                  <div key={key}>
                    <label className={labelClass}>{label}</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className={`${inputClass} pr-12`}
                        value={password[key]}
                        minLength={8}
                        required
                        onChange={(e) =>
                          setPassword({ ...password, [key]: e.target.value })
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                        aria-label="Tampilkan password"
                      >
                        {showPassword
                          ? <EyeOff size={19} />
                          : <Eye size={19} />}
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#102B54] px-6 py-3 text-sm font-bold text-white hover:bg-blue-900 sm:w-auto"
                >
                  <LockKeyhole size={18} />
                  Simpan Password
                </button>

              </form>
            )}

            {/* TANDA TANGAN */}
            {activeTab === 'ttd' && (
              <div className="space-y-5">

                <div>
                  <h3 className="font-bold text-slate-900">
                    Tanda Tangan Resmi Petugas
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Pilih cara membuat tanda tangan yang akan digunakan untuk konfirmasi checkout tamu.
                  </p>
                </div>

                {/* EXISTING SIGNATURE */}
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-700">
                      Tanda Tangan Tersimpan
                    </p>
                    {user?.has_signature && (
                      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                        Tersedia
                      </span>
                    )}
                  </div>

                  {user?.has_signature || user?.signature_path ? (
                    <img
                      key={signatureVersion}
                      src={api.getSignatureUrl(signatureVersion > 0)}
                      alt="Tanda tangan tersimpan"
                      className="h-32 w-full rounded-lg bg-slate-50 object-contain"
                    />
                  ) : (
                    <div className="flex h-32 flex-col items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                      <ImageIcon size={28} />
                      <p className="mt-2 text-sm">Belum ada tanda tangan tersimpan</p>
                    </div>
                  )}
                </div>

                {/* MODE */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSignatureMode('digital')
                      setSignatureFile(null)
                      setPreview('')
                      setHasDrawing(false)
                    }}
                    className={`flex items-center gap-3 rounded-xl border p-4 text-left ${
                      signatureMode === 'digital'
                        ? 'border-blue-500 bg-blue-50 text-blue-800'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="rounded-lg bg-white p-2">
                      <Pencil size={21} />
                    </span>
                    <span>
                      <span className="block text-sm font-bold">
                        Tanda Tangan Digital
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        Gambar langsung di layar
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSignatureMode('upload')
                      setHasDrawing(false)
                    }}
                    className={`flex items-center gap-3 rounded-xl border p-4 text-left ${
                      signatureMode === 'upload'
                        ? 'border-blue-500 bg-blue-50 text-blue-800'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="rounded-lg bg-white p-2">
                      <Upload size={21} />
                    </span>
                    <span>
                      <span className="block text-sm font-bold">
                        Upload Gambar
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        Pilih PNG atau JPG
                      </span>
                    </span>
                  </button>
                </div>

                {/* DIGITAL CANVAS */}
                {signatureMode === 'digital' && (
                  <div className="space-y-3">
                    <div className="overflow-hidden rounded-xl border border-slate-300 bg-white">
                      <canvas
                        ref={canvasRef}
                        className="block h-[220px] w-full touch-none"
                        onPointerDown={startDrawing}
                        onPointerMove={draw}
                        onPointerUp={stopDrawing}
                        onPointerCancel={stopDrawing}
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs text-slate-500">
                        Gunakan mouse atau jari untuk membubuhkan tanda tangan.
                      </p>
                      <button
                        type="button"
                        onClick={clearDrawing}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        <Eraser size={17} />
                        Bersihkan
                      </button>
                    </div>
                  </div>
                )}

                {/* UPLOAD */}
                {signatureMode === 'upload' && (
                  <div className="space-y-3">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/png,image/jpeg"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex min-h-36 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 text-center hover:border-blue-400 hover:bg-blue-50"
                    >
                      <Upload size={30} className="text-blue-700" />
                      <span className="mt-3 text-sm font-bold text-slate-700">
                        Pilih File Tanda Tangan
                      </span>
                      <span className="mt-1 text-xs text-slate-500">
                        PNG/JPG · Maksimal 2 MB
                      </span>
                    </button>

                    {preview && (
                      <div className="rounded-xl border border-slate-200 p-4">
                        <p className="mb-3 text-sm font-bold text-slate-700">
                          Pratinjau File
                        </p>
                        <img
                          src={preview}
                          alt="Pratinjau tanda tangan"
                          className="mx-auto max-h-36 max-w-full object-contain"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* SAVE */}
                <div className="flex justify-end border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={handleSignatureSave}
                    disabled={
                      loading ||
                      (signatureMode === 'digital'
                        ? !hasDrawing
                        : !signatureFile)
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#102B54] px-6 py-3 text-sm font-bold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {loading
                      ? <LoaderCircle size={18} className="animate-spin" />
                      : <Save size={18} />}
                    Simpan Tanda Tangan
                  </button>
                </div>

                <p className="text-xs leading-relaxed text-slate-500">
                  Tanda tangan yang disimpan menjadi tanda tangan default akun Satpam. Riwayat checkout tetap perlu menyimpan salinan tanda tangan pada saat konfirmasi.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
