
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  Train,
  CheckCircle2,
  LoaderCircle,
  Clock3,
  ShieldCheck,
  UserRound,
  Building2,
  Phone,
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  Sparkles,
  MapPin,
  FileCheck2,
  ChevronRight,
  ClipboardCheck,
  Info,
  AlertCircle,
  CalendarCheck2,
  Eraser,
  Search,
  Plus,
  UserSearch,
  Copy,
} from 'lucide-react'
import { api } from '../services/api'
import Header from '../components/Header'

export default function GuestBookPage({ onBackToLogin }) {
  const navigate = useNavigate()
  const location = useLocation()
  const showForm = location.pathname.endsWith('/form')
  const showLookup = location.pathname.endsWith('/list')
  const [searchName, setSearchName] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [checkoutTokens, setCheckoutTokens] = useState({})
  const [checkoutStatus, setCheckoutStatus] = useState({})
  const [form, setForm] = useState({
    visit_date: new Date().toLocaleDateString('en-CA'),
    name: '',
    institution: '',
    purpose: '',
    host_name: '',
    phone: '',
    estimated_end_time: '',
  })

  const [signature, setSignature] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [generatedCardNo, setGeneratedCardNo] = useState('')
  const [generatedCheckoutToken, setGeneratedCheckoutToken] = useState('')

  const updateField = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const openForm = () => {
    setError('')
    navigate('/buku-tamu/form')
  }

  const openLookup = () => {
    setSearchName('')
    setHasSearched(false)
    setSearchResults([])
    setSearchError('')
    navigate('/buku-tamu/list')
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    const query = searchName.trim()
    if (query.length < 3) {
      setSearchError('Masukkan minimal 3 karakter nama atau nomor kartu tamu.')
      return
    }
    setSearchLoading(true)
    setSearchError('')
    setHasSearched(true)
    try {
      const response = await api.searchVisitors(query)
      const payload = response?.data ?? response
      const rows = Array.isArray(payload) ? payload : (payload?.data ?? payload?.visitors ?? [])
      setSearchResults(rows)
    } catch (err) {
      setSearchResults([])
      setSearchError(err.response?.data?.message || err.message || 'Pencarian gagal dilakukan.')
    } finally {
      setSearchLoading(false)
    }
  }

  const handleCheckout = async (visitor) => {
    const visitorId = visitor.id
    const token = checkoutTokens[visitorId] || localStorage.getItem(`sipakai_checkout_${visitorId}`) || ''
    if (!token.trim()) {
      setCheckoutStatus((prev) => ({ ...prev, [visitorId]: 'Masukkan token checkout yang diberikan saat check-in.' }))
      return
    }
    setCheckoutStatus((prev) => ({ ...prev, [visitorId]: 'Memproses checkout...' }))
    try {
      await api.checkoutVisitor(visitorId, token.trim())
      localStorage.removeItem(`sipakai_checkout_${visitorId}`)
      setCheckoutStatus((prev) => ({ ...prev, [visitorId]: 'Checkout berhasil dicatat.' }))
      setSearchResults((prev) => prev.map((item) => item.id === visitorId ? { ...item, time_out: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) } : item))
    } catch (err) {
      setCheckoutStatus((prev) => ({ ...prev, [visitorId]: err.response?.data?.message || err.message || 'Checkout gagal. Periksa token Anda.' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!signature) {
      setError('Silakan bubuhkan tanda tangan terlebih dahulu.')
      return
    }

    if (!form.estimated_end_time) {
      setError('Silakan isi perkiraan waktu selesai kunjungan.')
      return
    }

    setLoading(true)

    try {
      const now = new Date()
      const timeIn = now.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      })

      const response = await api.createVisitor({
        ...form,
        time_in: timeIn,
        visitor_signature: signature,
      })
      const created = response?.data ?? response
      const visitor = created?.visitor ?? created?.data ?? created
      const cardNo = visitor?.visitor_card_no ?? created?.visitor_card_no ?? ''
      const token = created?.checkout_token ?? visitor?.checkout_token ?? ''
      const visitorId = visitor?.id ?? created?.id ?? null

      setGeneratedCardNo(cardNo)
      setGeneratedCheckoutToken(token)
      if (visitorId && token) localStorage.setItem(`sipakai_checkout_${visitorId}`, token)
      setSuccess(true)
    } catch (err) {
      const validationErrors = err.errors
        ? Object.values(err.errors).flat().join(' ')
        : ''

      setError(
        validationErrors ||
        err.response?.data?.message ||
        err.message ||
        'Gagal menyimpan data buku tamu.'
      )
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f3f5f9] font-sans">
        <Header />

        <main className="flex-1 flex items-center justify-center px-5 py-12">
          <section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 md:p-10 text-center shadow-xl success-card">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50">
              <CheckCircle2 className="h-11 w-11 text-emerald-600" />
            </div>

            <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-600">
              Berhasil Dicatat
            </span>

            <h1 className="mt-3 text-2xl md:text-3xl font-extrabold text-[#0b2046]">
              Kunjungan Berhasil!
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">
              Terima kasih telah menggunakan Buku Tamu Digital SIPAKAI.
              Data kunjungan Anda telah berhasil dikirim.
            </p>

            {generatedCardNo && (
              <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50/70 p-5 text-left">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white">
                    <ShieldCheck className="h-5 w-5 text-[#0b2046]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#0b2046]">Nomor Kartu Tamu</p>
                    <p className="mt-0.5 text-xs text-slate-500">Simpan nomor ini sebagai referensi kunjungan Anda.</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-3 rounded-xl border border-blue-100 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="break-all font-mono text-lg font-extrabold tracking-wide text-[#0b2046]">{generatedCardNo}</p>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(generatedCardNo)}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#0b2046] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#153363]"
                  >
                    <Copy className="h-4 w-4" />
                    Salin Nomor
                  </button>
                </div>
              </div>
            )}

            {generatedCheckoutToken && (
              <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-5 text-left">
                <p className="text-sm font-extrabold text-[#0b2046]">Token Checkout (Simpan dengan aman)</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">Token ini diperlukan untuk mencatat waktu keluar. Jangan bagikan kepada orang lain.</p>
                <div className="mt-3 flex flex-col gap-2 rounded-xl border border-orange-100 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                  <code className="break-all text-sm font-bold text-[#0b2046]">{generatedCheckoutToken}</code>
                  <button type="button" onClick={() => navigator.clipboard?.writeText(generatedCheckoutToken)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#f05a22] px-4 py-2.5 text-xs font-bold text-white"><Copy className="h-4 w-4" />Salin Token</button>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => navigate('/buku-tamu')}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b2046] py-3.5 font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#153363]"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Login
            </button>
          </section>
        </main>

        <Footer />
        <PageStyles />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f3f5f9] font-sans text-slate-700">
      <Header />

      {showForm ? (
        <main className="w-full flex-1 px-4 py-8 md:px-6 md:py-10">
          <div className="mx-auto max-w-6xl">
            <button
              type="button"
              onClick={() => {
                setError('')
                navigate('/buku-tamu')
              }}
              className="group mb-7 inline-flex items-center gap-3 font-semibold text-[#0b2046] transition-colors hover:text-[#f05a22]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition-all group-hover:border-orange-200 group-hover:bg-orange-50">
                <ArrowLeft className="h-4 w-4" />
              </span>
              Kembali ke Dashboard
            </button>

            <div className="mb-6">
              <h1 className="text-2xl font-extrabold tracking-tight text-[#0b2046] md:text-3xl">
                Formulir Kunjungan
              </h1>
              <p className="mt-1.5 text-sm text-slate-500">
                Isi data pengunjung dan informasi kunjungan Anda.
              </p>
            </div>

            <section className="form-card overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-5 md:px-8">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                    <ClipboardList className="h-5 w-5 text-[#f05a22]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-[#0b2046] md:text-xl">
                      Data Pengunjung
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Buku Tamu Digital SIPAKAI
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Kolom bertanda <span className="font-bold text-[#f05a22]">*</span>
                  {' '}wajib diisi.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-7 p-6 md:p-8">
                {error && (
                  <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                    <p className="leading-6">{error}</p>
                  </div>
                )}

                <FormSection
                  number="01"
                  title="Identitas Pengunjung"
                  description="Informasi dasar mengenai identitas diri Anda."
                  icon={UserRound}
                >
                  <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                    <Field label="Nama Lengkap" required icon={UserRound}>
                      <input
                        name="name"
                        value={form.name}
                        onChange={updateField}
                        required
                        maxLength={150}
                        placeholder="Masukkan nama lengkap"
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Instansi / Perusahaan" icon={Building2}>
                      <input
                        name="institution"
                        value={form.institution}
                        onChange={updateField}
                        placeholder="Nama instansi atau perusahaan"
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Nomor Telepon" icon={Phone}>
                      <input
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={updateField}
                        placeholder="Contoh: 081234567890"
                        className={inputClass}
                      />
                    </Field>

                    <div className="flex h-[50px] w-full items-center gap-3 self-end overflow-hidden rounded-xl border border-blue-100 bg-blue-50/70 px-3.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white">
                        <ShieldCheck className="h-4 w-4 text-[#0b2046]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold leading-4 text-[#0b2046]">
                          Nomor Kartu Tamu
                        </p>
                        <p className="mt-0.5 text-[11px] leading-4 text-slate-500">
                          Dibuat otomatis setelah formulir dikirim.
                        </p>
                      </div>
                    </div>
                  </div>
                </FormSection>

                <FormDivider />

                <FormSection
                  number="02"
                  title="Informasi Kunjungan"
                  description="Informasi mengenai pegawai tujuan dan waktu kunjungan."
                  icon={BriefcaseBusiness}
                >
                  <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                    <Field label="Pegawai yang Dituju" required icon={BriefcaseBusiness}>
                      <input
                        name="host_name"
                        value={form.host_name}
                        onChange={updateField}
                        required
                        maxLength={150}
                        placeholder="Nama pegawai yang dituju"
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Tanggal Kunjungan" required icon={CalendarDays}>
                      <input
                        type="date"
                        name="visit_date"
                        value={form.visit_date}
                        onChange={updateField}
                        required
                        className={inputClass}
                      />
                    </Field>

                    <div className="flex h-[50px] w-full items-center gap-3 self-end overflow-hidden rounded-xl border border-orange-100 bg-orange-50/70 px-3.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white">
                        <Clock3 className="h-4 w-4 text-[#f05a22]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold leading-4 text-[#0b2046]">
                          Waktu Masuk
                        </p>
                        <p className="mt-0.5 text-[11px] leading-4 text-slate-500">
                          Dicatat otomatis saat formulir dikirim.
                        </p>
                      </div>
                    </div>

                    <Field
                      label="Perkiraan Waktu Selesai Kunjungan"
                      required
                      icon={Clock3}
                    >
                      <input
                        type="time"
                        name="estimated_end_time"
                        value={form.estimated_end_time}
                        onChange={updateField}
                        required
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <div className="mt-5">
                    <Field label="Keperluan Kunjungan" required icon={FileText}>
                      <textarea
                        name="purpose"
                        value={form.purpose}
                        onChange={updateField}
                        required
                        maxLength={500}
                        rows={4}
                        placeholder="Jelaskan secara singkat tujuan kunjungan Anda..."
                        className={`${inputClass} min-h-[120px] resize-y`}
                      />
                      <div className="mt-2 flex justify-end">
                        <span className="text-xs text-slate-400">
                          {form.purpose.length}/500 karakter
                        </span>
                      </div>
                    </Field>
                  </div>
                </FormSection>

                <FormDivider />

                <FormSection
                  number="03"
                  title="Konfirmasi Pengunjung"
                  description="Bubuhkan tanda tangan langsung pada area di bawah."
                  icon={ShieldCheck}
                >
                  <SignaturePad
                    value={signature}
                    onChange={setSignature}
                  />
                </FormSection>

                <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 md:p-5">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#0b2046]" />
                  <div>
                    <p className="text-sm font-bold text-[#0b2046]">
                      Perlindungan Data Pengunjung
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Informasi yang Anda berikan digunakan untuk keperluan
                      administrasi dan pencatatan kunjungan di lingkungan
                      PT Kereta Api Indonesia (Persero).
                    </p>
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => navigate('/buku-tamu/list')}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 font-semibold text-slate-600 transition-all hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50 sm:w-1/3"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Kembali
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#f05a22] px-6 py-3.5 font-bold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#d94a18] hover:shadow-lg hover:shadow-orange-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <LoaderCircle className="h-5 w-5 animate-spin" />
                        Menyimpan Data...
                      </>
                    ) : (
                      <>
                        <ClipboardCheck className="h-5 w-5" />
                        Kirim Buku Tamu
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </main>
      ) : showLookup ? (
        <main className="w-full flex-1 px-5 pb-10 pt-3 md:px-8 md:pt-4">
          <div className="mx-auto max-w-7xl">
            <button
              type="button"
              onClick={() => navigate('/buku-tamu')}
              className="group mb-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-[#f05a22]"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              Kembali
            </button>

            <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl shadow-[#0b2046]/10">
              <div className="relative overflow-hidden bg-[#0b2046] px-6 py-5 text-white md:px-9 md:py-6">
                <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full border-[32px] border-white/[0.04]" />
                <div className="relative z-10">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-blue-100">
                    <UserSearch className="h-3.5 w-3.5 text-orange-300" />
                    Layanan Pengunjung
                  </span>
                  <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight md:text-3xl">Cari Kunjungan</h1>
                  <p className="mt-1.5 w-full max-w-none text-sm leading-5 text-blue-100/80"> 
                    Temukan catatan kunjungan dengan memasukkan nama lengkap yang digunakan saat mengisi Buku Tamu SIPAKAI.
                  </p>
                </div>
              </div>

              <div className="p-5 md:p-6">
                <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-base font-extrabold text-[#0b2046]">Pencarian nama atau nomor kartu</h2>
                    <p className="mt-0.5 text-sm text-slate-500">Masukkan minimal 3 karakter nama atau nomor kartu tamu.</p>
                  </div>
                  <button
                    type="button"
                    onClick={openForm}
                    className="inline-flex h-[52px] shrink-0 items-center justify-center gap-2 rounded-xl bg-[#f05a22] px-6 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#d94a18]"
                  >
                    <Plus className="h-4 w-4" />
                    Tambah Kunjungan
                  </button>
                </div>

                <form
                  onSubmit={handleSearch}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 md:p-4"
                >
                  <label htmlFor="visitor-name-search" className="mb-2 block text-sm font-bold text-[#0b2046]">
                    Nama atau Nomor Kartu Tamu
                  </label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative min-w-0 flex-1">
                      <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input
                        id="visitor-name-search"
                        value={searchName}
                        onChange={(e) => {
                          setSearchName(e.target.value)
                          setHasSearched(false)
                        }}
                        placeholder="Contoh: Andi Saputra / BT-20261107-AB12CD34"
                        className={`${inputClass} pl-12`}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!searchName.trim()}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0b2046] px-6 py-3 font-bold text-white transition hover:bg-[#153363] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Search className="h-4 w-4" />
                      Cari Kunjungan
                    </button>
                  </div>
                </form>

                <div className="mt-4">
                  {searchLoading ? (
                    <div className="flex items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-blue-50/60 px-5 py-8 text-sm font-semibold text-[#0b2046]">
                      <LoaderCircle className="h-5 w-5 animate-spin" /> Mencari data kunjungan...
                    </div>
                  ) : searchError ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{searchError}</div>
                  ) : hasSearched && searchResults.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-7 text-center">
                      <UserSearch className="mx-auto h-8 w-8 text-slate-400" />
                      <h3 className="mt-3 font-bold text-[#0b2046]">Data tidak ditemukan</h3>
                      <p className="mt-1 text-sm text-slate-500">Periksa kembali nama atau nomor kartu tamu yang dimasukkan.</p>
                    </div>
                  ) : hasSearched ? (
                    <div className="space-y-3">
                      {searchResults.map((visitor) => (
                        <article key={visitor.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
                          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                            <div>
                              <h3 className="font-extrabold text-[#0b2046]">{visitor.name}</h3>
                              <p className="mt-1 text-xs font-semibold text-[#f05a22]">{visitor.visitor_card_no || 'Nomor kartu tidak tersedia'}</p>
                              <p className="mt-2 text-sm text-slate-500">Tanggal: {visitor.visit_date || '-'} · Masuk: {visitor.time_in || '-'}</p>
                              <p className="mt-1 text-sm text-slate-500">Status: {visitor.time_out ? `Sudah checkout (${visitor.time_out})` : 'Masih tercatat masuk'}</p>
                            </div>
                          </div>
                          {!visitor.time_out && (
                            <div className="mt-4 border-t border-slate-100 pt-4">
                              <label className="mb-2 block text-xs font-bold text-[#0b2046]">Token checkout</label>
                              <div className="flex flex-col gap-2 sm:flex-row">
                                <input type="password" value={checkoutTokens[visitor.id] ?? ''} onChange={(e) => setCheckoutTokens((prev) => ({ ...prev, [visitor.id]: e.target.value }))} placeholder="Masukkan token checkout" className={inputClass} />
                                <button type="button" onClick={() => handleCheckout(visitor)} className="shrink-0 rounded-xl bg-[#0b2046] px-5 py-3 text-sm font-bold text-white hover:bg-[#153363]">Checkout</button>
                              </div>
                              {checkoutStatus[visitor.id] && <p className="mt-2 text-xs text-slate-600">{checkoutStatus[visitor.id]}</p>}
                            </div>
                          )}
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-5 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><UserSearch className="h-6 w-6" /></div>
                      <h3 className="mt-4 font-bold text-[#0b2046]">Cari catatan kunjungan Anda</h3>
                      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">Hasil hanya menampilkan kunjungan yang cocok dengan pencarian Anda.</p>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-start gap-3 rounded-xl border border-orange-100 bg-orange-50/70 p-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#f05a22]" />
                  <p className="text-xs leading-5 text-slate-600">
                    Demi menjaga privasi, detail kunjungan dan proses checkout nantinya akan memerlukan verifikasi tambahan.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </main>
      ) : (
        <main className="w-full flex-1">
          <div className="mx-auto max-w-7xl px-5 pb-10 pt-8 md:px-8 md:pt-12">
            <section className="relative overflow-hidden rounded-[28px] bg-[#0b2046] text-white shadow-2xl shadow-[#0b2046]/15 guest-fade-up">
              <div className="absolute -right-24 -top-36 h-[430px] w-[430px] rounded-full border-[55px] border-white/[0.045]" />
              <div className="absolute -right-8 -bottom-48 h-[380px] w-[380px] rounded-full border-[45px] border-[#f05a22]/10" />
              <div className="absolute right-[28%] top-0 h-64 w-64 rounded-full bg-[#f05a22]/10 blur-[90px] guest-pulse" />

              <div className="relative z-10 grid items-center gap-10 px-7 py-10 md:px-12 md:py-14 lg:min-h-[390px] lg:grid-cols-[1.15fr_.85fr]">
                <div>
                  <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3.5 py-2">
                    <Sparkles className="h-4 w-4 text-[#ff8759]" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.13em] text-blue-100">
                      Layanan Pengunjung Digital
                    </span>
                  </div>

                  <p className="mb-3 text-xs font-bold tracking-[0.18em] text-orange-300 md:text-sm">
                    SELAMAT DATANG DI
                  </p>

                  <h2 className="max-w-2xl text-3xl font-extrabold leading-[1.13] tracking-tight md:text-5xl">
                    Buku Tamu
                    <span className="mt-1 block text-[#ff7947]">
                      Digital SIPAKAI
                    </span>
                  </h2>

                  <p className="mt-5 max-w-xl text-sm leading-7 text-blue-100/80 md:text-base">
                    Selamat datang di PT Kereta Api Indonesia (Persero).
                    Silakan lakukan pencatatan kunjungan secara digital
                    melalui layanan Buku Tamu SIPAKAI.
                  </p>

                  <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                    <button
                      type="button"
                      onClick={openForm}
                      className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-[#f05a22] px-4 text-sm font-bold text-white shadow-lg shadow-orange-950/20 transition-colors duration-200 hover:bg-[#ff6b32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffad8b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b2046]"
                    >
                      <ClipboardList className="h-5 w-5 shrink-0" />
                      <span className="whitespace-nowrap">Catat Kunjungan</span>
                    </button>

                    <button
                      type="button"
                      onClick={openLookup}
                      className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-xl border border-white/20 bg-white/[0.07] px-4 text-sm font-semibold text-white transition-colors duration-200 hover:border-white/30 hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b2046]"
                    >
                      <Search className="h-5 w-5 shrink-0" />
                      <span className="whitespace-nowrap">Cari Kunjungan</span>
                    </button>

                    <button
                      type="button"
                      onClick={onBackToLogin}
                      className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-xl border border-white/20 bg-white/[0.07] px-4 text-sm font-semibold text-white transition-colors duration-200 hover:border-white/30 hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b2046]"
                    >
                      <ArrowLeft className="h-5 w-5 shrink-0" />
                      <span className="whitespace-nowrap">Kembali ke Login</span>
                    </button>
                  </div>

                  <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-blue-100/65">
                    <span className="inline-flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-300" />
                      Pencatatan digital
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-4 w-4 text-orange-300" />
                      Proses praktis
                    </span>
                  </div>
                </div>

                <div className="relative hidden min-h-[280px] items-center justify-center lg:flex">
                  <div className="absolute h-72 w-72 rounded-full border border-white/10" />
                  <div className="absolute h-60 w-60 rounded-full border border-dashed border-white/15" />
                  <div className="absolute h-48 w-48 rounded-full bg-[#f05a22]/10 blur-2xl guest-pulse" />

                  <div className="relative guest-float">
                    <div className="flex h-48 w-48 rotate-[-5deg] flex-col items-center justify-center rounded-[42px] border border-white/20 bg-white/[0.09] shadow-2xl backdrop-blur-xl">
                      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[#f05a22] shadow-lg shadow-orange-950/30">
                        <Train className="h-12 w-12 text-white" strokeWidth={1.7} />
                      </div>
                      <div className="mt-5 text-center">
                        <p className="text-xl font-extrabold tracking-wide">SIPAKAI</p>
                        <p className="mt-1 text-[10px] tracking-[0.18em] text-blue-100/60">
                          BUKU TAMU DIGITAL
                        </p>
                      </div>
                    </div>

                    <div className="absolute -right-14 top-5 rotate-[7deg] rounded-2xl border border-white/15 bg-[#173765]/90 p-3 shadow-xl backdrop-blur-md">
                      <FileCheck2 className="h-7 w-7 text-emerald-300" />
                    </div>

                    <div className="absolute -left-14 bottom-5 rotate-[-8deg] rounded-2xl border border-white/15 bg-[#173765]/90 p-3 shadow-xl backdrop-blur-md">
                      <ClipboardList className="h-7 w-7 text-orange-300" />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-14 text-center guest-fade-up md:mt-16">
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#f05a22]">
                Mudah, Cepat, dan Tertib
              </p>
              <h3 className="mt-3 text-2xl font-extrabold text-[#0b2046] md:text-3xl">
                Proses Kunjungan Anda
              </h3>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Ikuti tiga langkah sederhana untuk melakukan pencatatan
                kunjungan di lingkungan PT Kereta Api Indonesia (Persero).
              </p>
            </section>

            <section className="mx-auto mt-9 max-w-4xl">
              <div className="space-y-5">
                <ProcessItem
                  number="01"
                  icon={MapPin}
                  title="Tiba di Lokasi"
                  description="Pastikan Anda telah tiba di kantor dan sudah memiliki janji dengan pegawai yang akan dituju."
                  detail="Pengisian buku tamu dilakukan ketika Anda sudah berada di lokasi kunjungan."
                />
                <ProcessItem
                  number="02"
                  icon={ClipboardList}
                  title="Isi Buku Tamu"
                  description="Lengkapi identitas diri, instansi, pegawai tujuan, nomor telepon, dan keperluan kunjungan."
                  detail="Pastikan seluruh informasi yang dimasukkan sudah benar sebelum mengirim formulir."
                />
                <ProcessItem
                  number="03"
                  icon={CheckCircle2}
                  title="Kunjungan Tercatat"
                  description="Kirim formulir dan pastikan data kunjungan berhasil tersimpan dalam sistem."
                  detail="Setelah selesai berkunjung, lakukan checkout untuk mencatat waktu kepulangan Anda."
                  last
                />
              </div>
            </section>

            <section className="mt-12 guest-fade-up">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0b2046]">
                  <Info className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-[#0b2046]">
                    Informasi dan Ketentuan Kunjungan
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Hal penting yang perlu diketahui pengunjung.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <InfoCard
                  icon={Clock3}
                  title="Ketentuan Checkout"
                  tone="orange"
                  tag="15 MENIT"
                >
                  Pengunjung diharapkan melakukan checkout setelah selesai
                  berkunjung. Jika belum dilakukan, sistem akan menutup
                  catatan kunjungan secara administratif setelah 15 menit
                  dari perkiraan waktu selesai.
                  <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-orange-100 bg-orange-50 p-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#f05a22]" />
                    <p className="text-xs leading-5 text-orange-900">
                      Penutupan otomatis bukan bukti bahwa pengunjung sudah
                      meninggalkan lokasi. Status akan ditandai belum
                      terkonfirmasi keluar.
                    </p>
                  </div>
                </InfoCard>

                <InfoCard
                  icon={CalendarCheck2}
                  title="Pastikan Sudah Memiliki Janji"
                  tone="blue"
                >
                  Sebelum berkunjung, pastikan Anda telah berkoordinasi
                  dengan pegawai yang akan dituju. Buku Tamu SIPAKAI
                  digunakan untuk mencatat kunjungan, bukan memesan jadwal
                  pertemuan.
                </InfoCard>

                <InfoCard
                  icon={ShieldCheck}
                  title="Privasi Data Pengunjung"
                  tone="green"
                >
                  Informasi yang Anda masukkan digunakan untuk keperluan
                  administrasi, pencatatan, dan dokumentasi kunjungan.
                </InfoCard>

                <InfoCard
                  icon={FileCheck2}
                  title="Isi Data dengan Benar"
                  tone="purple"
                >
                  Pastikan identitas, pegawai tujuan, dan keperluan
                  kunjungan diisi secara lengkap dan sesuai keadaan
                  sebenarnya.
                </InfoCard>
              </div>
            </section>

            <section className="relative mb-3 mt-10 overflow-hidden rounded-2xl bg-[#0b2046] px-6 py-7 shadow-lg shadow-[#0b2046]/10 guest-fade-up md:px-9 md:py-8">
              <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full border-[35px] border-white/[0.05]" />
              <div className="relative flex flex-col items-center justify-between gap-6 md:flex-row">
                <div className="flex items-center gap-4">
                  <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 sm:flex">
                    <ClipboardCheck className="h-7 w-7 text-orange-300" />
                  </div>
                  <div className="text-center sm:text-left">
                    <h4 className="text-lg font-extrabold text-white md:text-xl">
                      Sudah siap mencatat kunjungan?
                    </h4>
                    <p className="mt-1.5 text-sm text-blue-100/70">
                      Silakan isi formulir Buku Tamu Digital SIPAKAI.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={openForm}
                  className="group inline-flex shrink-0 items-center justify-center gap-3 rounded-xl bg-[#f05a22] px-6 py-4 text-sm font-extrabold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-[#ff6b32]"
                >
                  Catat Kunjungan
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </section>
          </div>
        </main>
      )}

      <Footer />
      <PageStyles />
    </div>
  )
}

/* ================= SIGNATURE PAD ================= */

function SignaturePad({ value, onChange }) {
  const canvasRef = useRef(null)
  const drawingRef = useRef(false)
  const hasDrawnRef = useRef(false)
  const lastPointRef = useRef(null)

  // Pulihkan gambar dari state setiap kali value berubah.
  // Ini mencegah tanda tangan hilang saat React melakukan render ulang.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (!value) {
      hasDrawnRef.current = false
      return
    }

    const image = new Image()
    image.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
      hasDrawnRef.current = true
    }
    image.src = value
  }, [value])

  const getPoint = (event) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()

    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    }
  }

  const startDrawing = (event) => {
    event.preventDefault()

    const canvas = canvasRef.current
    if (!canvas) return

    drawingRef.current = true
    lastPointRef.current = getPoint(event)

    if (canvas.setPointerCapture) {
      canvas.setPointerCapture(event.pointerId)
    }

    const ctx = canvas.getContext('2d')
    ctx.beginPath()
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y)
    ctx.lineWidth = 3.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#0b2046'

    // Titik kecil agar satu ketukan tetap terbaca sebagai tanda tangan.
    ctx.lineTo(
      lastPointRef.current.x + 0.1,
      lastPointRef.current.y + 0.1
    )
    ctx.stroke()
    hasDrawnRef.current = true
  }

  const draw = (event) => {
    if (!drawingRef.current) return
    event.preventDefault()

    const canvas = canvasRef.current
    if (!canvas) return

    const point = getPoint(event)
    const ctx = canvas.getContext('2d')

    ctx.beginPath()
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y)
    ctx.lineTo(point.x, point.y)
    ctx.lineWidth = 3.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#0b2046'
    ctx.stroke()

    lastPointRef.current = point
    hasDrawnRef.current = true
  }

  const stopDrawing = (event) => {
    if (!drawingRef.current) return

    drawingRef.current = false
    lastPointRef.current = null

    const canvas = canvasRef.current
    if (!canvas || !hasDrawnRef.current) return

    onChange(canvas.toDataURL('image/png'))
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    drawingRef.current = false
    hasDrawnRef.current = false
    lastPointRef.current = null

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    onChange('')
  }

  return (
    <div className="rounded-2xl border border-dashed border-orange-300 bg-slate-50/80 p-4 md:p-6">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-[#0b2046]">
            Tanda Tangan Pengunjung
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Gunakan mouse, touchpad, atau jari pada layar sentuh.
          </p>
        </div>
        <span className={`text-xs font-semibold ${value ? 'text-emerald-700' : 'text-slate-400'}`}>
          {value ? 'Tanda tangan tersimpan' : 'Belum ditandatangani'}
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-inner">
        <canvas
          ref={canvasRef}
          width={1200}
          height={320}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
          onLostPointerCapture={stopDrawing}
          className="block h-40 w-full touch-none cursor-crosshair bg-white md:h-48"
          aria-label="Area tanda tangan pengunjung"
        />
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-slate-500">
          Bubuhkan tanda tangan di dalam kotak putih.
        </p>

        <button
          type="button"
          onClick={clearSignature}
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition-all hover:border-orange-200 hover:bg-orange-50 hover:text-[#f05a22] sm:self-auto"
        >
          <Eraser className="h-4 w-4" />
          Hapus Tanda Tangan
        </button>
      </div>
    </div>
  )
}

/* ================= PROCESS ITEM ================= */

function ProcessItem({ number, icon: Icon, title, description, detail, last = false }) {
  return (
    <div className="flex gap-4 md:gap-6 guest-fade-up">
      <div className="flex flex-col items-center">
        <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0b2046] shadow-md shadow-[#0b2046]/10 transition-all duration-300 hover:bg-[#f05a22] md:h-14 md:w-14">
          <Icon className="h-6 w-6 text-white md:h-7 md:w-7" />
        </div>
        {!last && (
          <div className="min-h-[35px] w-0.5 flex-1 bg-gradient-to-b from-[#0b2046]/30 to-slate-200" />
        )}
      </div>

      <div className="mb-5 min-w-0 flex-1">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-lg md:p-6">
          <div className="mb-2 flex items-center gap-3">
            <span className="text-xs font-black tracking-widest text-[#f05a22]">
              LANGKAH {number}
            </span>
            <span className="h-px flex-1 bg-slate-100" />
          </div>
          <h4 className="text-lg font-extrabold text-[#0b2046] md:text-xl">
            {title}
          </h4>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {description}
          </p>
          <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-slate-50 px-4 py-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#f05a22]" />
            <p className="text-xs leading-5 text-slate-500">{detail}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ================= INFORMATION CARD ================= */

function InfoCard({ icon: Icon, title, children, tone = 'blue', tag }) {
  const tones = {
    orange: 'bg-orange-50 text-[#f05a22]',
    blue: 'bg-blue-50 text-[#0b2046]',
    green: 'bg-emerald-50 text-emerald-700',
    purple: 'bg-purple-50 text-purple-700',
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg md:p-6">
      <div className="flex items-start gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-extrabold text-[#0b2046]">{title}</h4>
            {tag && (
              <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[10px] font-bold text-orange-700">
                {tag}
              </span>
            )}
          </div>
          <div className="mt-2 text-sm leading-6 text-slate-600">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ================= FORM SECTION ================= */

function FormSection({ number, title, description, icon: Icon, children }) {
  return (
    <section className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0b2046] text-xs font-bold text-white">
          {number}
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-[#0b2046] md:text-lg">
              {title}
            </h3>
            <Icon className="h-4 w-4 text-[#f05a22]" />
          </div>
          <p className="mt-1 text-xs text-slate-500 md:text-sm">
            {description}
          </p>
        </div>
      </div>
      <div className="md:pl-[52px]">
        {children}
      </div>
    </section>
  )
}

function FormDivider() {
  return <div className="border-t border-slate-100" />
}

/* ================= FIELD ================= */

function Field({ label, required, icon: Icon, children }) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
        {Icon && <Icon className="h-4 w-4 text-slate-400" />}
        {label}
        {required && <span className="text-[#f05a22]">*</span>}
      </span>
      {children}
    </label>
  )
}

/* ================= FOOTER ================= */

function Footer() {
  return (
    <footer className="mt-auto w-full bg-[#0b2046] text-white">
      <div className="flex min-h-[44px] items-center justify-center px-4 py-2">
        <p className="text-center text-[11px] leading-5 text-blue-100/80">
          © 2026 PT Kereta Api Indonesia (Persero).
          {' '}Seluruh hak cipta dilindungi undang-undang.
        </p>
      </div>
    </footer>
  )
}

/* ================= STYLING ================= */

const inputClass =
  'h-[50px] w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 text-sm text-[#0b2046] placeholder:text-slate-400 outline-none transition-all duration-200 hover:border-slate-300 focus:border-[#f05a22] focus:ring-4 focus:ring-orange-100'

function PageStyles() {
  return (
    <style>{`
      .guest-fade-up {
        animation: guestFadeUp .65s cubic-bezier(.2,.7,.2,1) both;
      }

      .guest-fade-in {
        animation: guestFadeIn .45s ease-out both;
      }

      .guest-float {
        animation: guestFloat 5s ease-in-out infinite;
      }

      .guest-pulse {
        animation: guestPulse 5s ease-in-out infinite;
      }

      .form-card {
        animation: guestFadeUp .55s cubic-bezier(.2,.8,.2,1) both;
        transition: box-shadow .3s ease;
      }

      .form-card:hover {
        box-shadow: 0 14px 38px rgba(11,32,70,.07);
      }

      .success-card {
        animation: guestFadeUp .55s cubic-bezier(.2,.8,.2,1) both;
      }

      @keyframes guestFadeUp {
        from { opacity: 0; transform: translateY(18px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @keyframes guestFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes guestFloat {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-12px); }
      }

      @keyframes guestPulse {
        0%, 100% { opacity: .35; transform: scale(1); }
        50% { opacity: .65; transform: scale(1.08); }
      }

      @media (prefers-reduced-motion: reduce) {
        .guest-fade-up,
        .guest-fade-in,
        .guest-float,
        .guest-pulse,
        .form-card,
        .success-card {
          animation: none !important;
        }

        * {
          scroll-behavior: auto !important;
          transition-duration: .01ms !important;
        }
      }
    `}</style>
  )
}
