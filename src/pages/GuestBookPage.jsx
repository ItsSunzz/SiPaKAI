
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight,
  ClipboardList, LoaderCircle, LogOut, Plus, RefreshCw,
  Save, Search, ShieldCheck, X, PenLine, Trash2,
} from 'lucide-react'
import { api, getToken } from '../services/api'
import Header from '../components/Header'

const today = () => {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

const emptyDraft = () => ({
  visit_date: today(),
  name: '',
  institution: '',
  purpose: '',
  host_name: '',
  phone: '',
  estimated_end_time: '',
})

const formatDate = (value) => {
  if (!value) return '—'
  const d = new Date(`${String(value).slice(0, 10)}T00:00:00`)
  return Number.isNaN(d.getTime())
    ? String(value)
    : d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
}

const formatTime = (value) => value ? String(value).slice(0, 5) : '—'

const maskPhone = (value) => {
  if (!value) return '—'
  const phone = String(value).replace(/\s/g, '')
  if (phone.length <= 7) return `${phone.slice(0, 2)}XXXXX`
  return `${phone.slice(0, 3)}XXXXX${phone.slice(-2)}`
}

const errorText = (error) => {
  const errors = error?.errors
  return errors
    ? Object.values(errors).flat().join(' ')
    : error?.message || 'Terjadi kesalahan. Silakan coba lagi.'
}

const getList = (result) => {
  const payload =
    result?.data && !Array.isArray(result.data) && result.data.data
      ? result.data
      : result

  return {
    rows: Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.visitors)
        ? payload.visitors
        : Array.isArray(payload)
          ? payload
          : [],
    total: Number(payload?.total ?? 0),
    lastPage: Math.max(1, Number(payload?.last_page ?? 1)),
  }
}

export default function GuestBookPage({ onBackToLogin }) {
  const navigate = useNavigate()

  const [draft, setDraft] = useState(emptyDraft)
  const [signature, setSignature] = useState('')
  const [signatureKey, setSignatureKey] = useState(0)
  const [showSignatureModal, setShowSignatureModal] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [receipt, setReceipt] = useState(null)

  const [suggestions, setSuggestions] = useState([])
  const [searchingNames, setSearchingNames] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const [isOfficer, setIsOfficer] = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [rows, setRows] = useState([])
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [historyDate, setHistoryDate] = useState(today())
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [loadingRows, setLoadingRows] = useState(false)
  const [rowsError, setRowsError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [checkingOut, setCheckingOut] = useState(null)
  const [checkoutMessage, setCheckoutMessage] = useState('')

  useEffect(() => {
    let active = true

    const check = async () => {
      if (!getToken()) {
        setIsOfficer(false)
        setCheckingAccess(false)
        return
      }

      try {
        const result = await api.getMe()
        const user = result?.user ?? result?.data?.user ?? result?.data ?? result
        const role = String(user?.role?.name ?? user?.role ?? '').toLowerCase()

        if (active) {
          setIsOfficer(['admin', 'super_admin', 'satpam'].includes(role))
        }
      } catch {
        if (active) setIsOfficer(false)
      } finally {
        if (active) setCheckingAccess(false)
      }
    }

    check()
    return () => { active = false }
  }, [])

  const loadRows = useCallback(async (signal) => {
    setLoadingRows(true)
    setRowsError('')

    try {
      const result = isOfficer
        ? await api.getVisitors({
            page,
            per_page: 10,
            from: historyDate,
            to: historyDate,
            ...(search ? { q: search } : {}),
          })
        : await api.getPublicDailyVisitors()

      if (signal?.cancelled) return

      const parsed = getList(result)
      setRows(parsed.rows)
      setTotal(parsed.total || parsed.rows.length)
      setLastPage(parsed.lastPage)
    } catch (err) {
      if (signal?.cancelled) return
      setRows([])
      setRowsError(errorText(err))
    } finally {
      if (!signal?.cancelled) setLoadingRows(false)
    }
  }, [isOfficer, page, historyDate, search])

  useEffect(() => {
    const signal = { cancelled: false }
    loadRows(signal)
    return () => { signal.cancelled = true }
  }, [loadRows, refreshKey])

  useEffect(() => {
    const query = draft.name.trim()

    if (query.length < 3) {
      setSuggestions([])
      return undefined
    }

    let active = true

    const timer = setTimeout(async () => {
      setSearchingNames(true)

      try {
        const result = await api.searchVisitors(query)
        const parsed = getList(result)

        if (active) setSuggestions(parsed.rows.slice(0, 6))
      } catch {
        if (active) setSuggestions([])
      } finally {
        if (active) setSearchingNames(false)
      }
    }, 350)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [draft.name])

  useEffect(() => {
    if (!notice) return undefined
    const timer = setTimeout(() => setNotice(''), 4500)
    return () => clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    if (!checkoutMessage) return undefined
    const timer = setTimeout(() => setCheckoutMessage(''), 5000)
    return () => clearTimeout(timer)
  }, [checkoutMessage])

  useEffect(() => {
    if (!receipt) return undefined
    const timer = setTimeout(() => setReceipt(null), 7000)
    return () => clearTimeout(timer)
  }, [receipt])

  const resetDraft = () => {
    setDraft(emptyDraft())
    setSignature('')
    setSignatureKey((v) => v + 1)
    setShowSignatureModal(false)
    setSuggestions([])
    setError('')
  }

  const selectPreviousVisitor = (visitor) => {
    setDraft((current) => ({
      ...current,
      name: visitor.name || current.name,
      institution: visitor.institution || '',
      phone: visitor.phone || '',
    }))

    setShowSuggestions(false)
    setSuggestions([])
    setNotice(
      'Data pengunjung sebelumnya ditemukan. Silakan lengkapi keperluan dan jam selesai kunjungan kali ini.'
    )
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setReceipt(null)

    if (!signature) {
      setError('Mohon isi tanda tangan pengunjung terlebih dahulu.')
      return
    }

    if (!draft.estimated_end_time) {
      setError('Mohon isi perkiraan jam selesai kunjungan.')
      return
    }

    setSaving(true)

    try {
      const response = await api.createVisitor({
        ...draft,
        time_in: undefined,
        visitor_signature: signature,
      })

      const visitor = response?.visitor ?? response?.data?.visitor ?? response?.data ?? response
      const id = visitor?.id
      const card = visitor?.visitor_card_no ?? response?.visitor_card_no ?? '—'
      const token = response?.checkout_token ?? visitor?.checkout_token

      if (id && token) {
        localStorage.setItem(`sipakai_checkout_${id}`, token)
      }

      setReceipt({
        card,
        name: draft.name,
        date: draft.visit_date,
        time: visitor?.time_in,
      })

      setNotice('Data kunjungan berhasil disimpan.')
      resetDraft()
      setShowForm(false)
      setRefreshKey((v) => v + 1)
    } catch (err) {
      setError(errorText(err))
    } finally {
      setSaving(false)
    }
  }

  const handleCheckout = async (row) => {
    const token = localStorage.getItem(`sipakai_checkout_${row.id}`)

    if (!token) {
      setCheckoutMessage(
        'Checkout hanya tersedia pada browser/perangkat yang digunakan saat check-in. Kamu tidak dapat checkout kunjungan orang lain.'
      )
      return
    }

    setCheckingOut(row.id)
    setCheckoutMessage('')

    try {
      await api.checkoutVisitor(row.id, token)
      setCheckoutMessage(
        'Permintaan checkout berhasil dikirim. Silakan menunggu konfirmasi Satpam.'
      )
      setRefreshKey((v) => v + 1)
    } catch (err) {
      setCheckoutMessage(errorText(err))
    } finally {
      setCheckingOut(null)
    }
  }

  const officerSignature = (row) =>
    row.officer_signature_url ||
    (row.id ? api.getVisitorSignatureUrl(row.id, 'officer') : null)

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      <Header />

      <main className="mx-auto max-w-[1720px] px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBackToLogin || (() => navigate('/'))}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={17} />
            Kembali
          </button>

          <div className="text-sm font-semibold text-slate-600">
            <ShieldCheck size={16} className="mr-1 inline text-emerald-600" />
            SIPAKAI · Buku Tamu Digital
          </div>
        </div>

        <section className="overflow-hidden border border-slate-500 bg-white shadow-sm">
          <div className="grid border-b border-slate-500 md:grid-cols-[190px_1fr_330px]">
            <div className="flex items-center justify-center border-b border-slate-400 p-4 md:border-b-0 md:border-r">
              <div className="text-center">
                <img
                  src="/images/kai_logo.png"
                  alt="Logo KAI"
                  className="mx-auto h-auto max-h-16 w-auto max-w-[150px] object-contain"
                />
                <div className="mt-2 inline-block border-2 border-emerald-400 px-8 py-1.5 text-lg font-semibold text-emerald-600">
                  UMUM
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center border-b border-slate-400 p-5 text-center md:border-b-0 md:border-r">
              <div className="text-sm font-bold uppercase tracking-wide text-slate-700 sm:text-base">
                PT Kereta Api Indonesia (Persero)
              </div>
              <div className="text-sm font-bold uppercase tracking-wide text-slate-700 sm:text-base">
                Sistem Informasi
              </div>
              <h1 className="mt-3 text-xl font-extrabold tracking-wide text-slate-900 sm:text-2xl">
                BUKU TAMU
              </h1>
            </div>

            <div className="grid grid-cols-[100px_1fr] text-sm">
              {[
                ['Nomor', 'FR.SM/TI/014.001/10-2020'],
                ['Tanggal', formatDate(today())],
                ['Versi', '003-2020'],
                ['Halaman', '1 dari 1'],
              ].map(([label, value]) => (
                <div key={label} className="contents">
                  <div className="border-b border-r border-slate-300 px-3 py-2.5 text-slate-600">
                    {label}
                  </div>
                  <div className="border-b border-slate-300 px-3 py-2.5 text-slate-800">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-300 px-4 py-4 sm:px-6">
            <div className="grid min-w-[260px] grid-cols-[125px_1fr] border border-slate-400 text-sm sm:min-w-[390px]">
              <div className="border-b border-r border-slate-300 px-3 py-2">No. Ref</div>
              <div className="border-b border-slate-300 px-3 py-2">: Otomatis</div>
              <div className="border-b border-r border-slate-300 px-3 py-2">Tanggal</div>
              <div className="border-b border-slate-300 px-3 py-2">: {formatDate(today())}</div>
              <div className="border-r border-slate-300 px-3 py-2">Business Area</div>
              <div className="px-3 py-2">: Umum</div>
            </div>

            <div className="text-right">
              <div className="text-sm font-semibold text-slate-700">Daftar Kunjungan</div>
              <div className="text-sm text-slate-500">
                {isOfficer
                  ? 'Data dan riwayat sesuai hak akses.'
                  : 'Daftar kunjungan hari ini.'}
              </div>
            </div>
          </div>

          {(notice || checkoutMessage || receipt) && (
            <div className="fixed right-4 top-4 z-[100] flex w-[min(92vw,440px)] flex-col gap-2">
              {notice && (
                <div
                  role="status"
                  className="flex items-start gap-2 rounded-lg border border-emerald-300 bg-white p-3 text-sm text-emerald-800 shadow-xl"
                >
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                  <span className="flex-1">{notice}</span>
                  <button
                    type="button"
                    onClick={() => setNotice('')}
                    aria-label="Tutup notifikasi"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {receipt && (
                <div
                  role="status"
                  className="rounded-lg border border-blue-300 bg-white p-3 text-sm text-slate-800 shadow-xl"
                >
                  <div className="flex items-center justify-between gap-2">
                    <b>Nomor visitor berhasil dibuat</b>
                    <button
                      type="button"
                      onClick={() => setReceipt(null)}
                      aria-label="Tutup notifikasi"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="mt-1 flex items-center justify-between gap-2">
                    <strong className="text-lg text-blue-900">{receipt.card}</strong>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(receipt.card)}
                      className="rounded border border-blue-300 px-3 py-1.5 text-xs font-bold text-blue-800"
                    >
                      Salin
                    </button>
                  </div>

                  <span className="text-xs text-slate-500">
                    {receipt.name} · {formatDate(receipt.date)} {formatTime(receipt.time)}
                  </span>
                </div>
              )}

              {checkoutMessage && (
                <div
                  role="status"
                  className="flex items-start gap-2 rounded-lg border border-blue-300 bg-white p-3 text-sm text-blue-900 shadow-xl"
                >
                  <span className="flex-1">{checkoutMessage}</span>
                  <button
                    type="button"
                    onClick={() => setCheckoutMessage('')}
                    aria-label="Tutup notifikasi"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-400 bg-slate-100 px-4 py-3 sm:px-6">
            <div>
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 sm:text-lg">
                <ClipboardList size={19} />
                {isOfficer ? 'DAFTAR KUNJUNGAN / RIWAYAT' : 'DAFTAR TAMU HARI INI'}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Nomor HP disamarkan. Tanda tangan pengunjung yang sama digunakan pada kolom masuk dan keluar. Tanda tangan Satpam muncul setelah checkout dikonfirmasi petugas.
              </p>
            </div>

            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              {isOfficer && (
                <label className="flex items-center gap-2 rounded border border-slate-400 bg-white px-3 py-2.5 text-sm">
                  <CalendarDays size={16} />
                  <input
                    type="date"
                    value={historyDate}
                    onChange={(e) => {
                      setHistoryDate(e.target.value)
                      setPage(1)
                    }}
                  />
                </label>
              )}

              {isOfficer && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    setSearch(searchInput.trim())
                    setPage(1)
                  }}
                  className="flex flex-1 border border-slate-400 bg-white sm:flex-none"
                >
                  <input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Cari nama / visitor"
                    className="min-w-0 flex-1 px-3 py-2.5 text-sm outline-none sm:w-44"
                  />
                  <button className="border-l border-slate-300 px-3" aria-label="Cari">
                    <Search size={17} />
                  </button>
                </form>
              )}

              <button
                type="button"
                onClick={() => setRefreshKey((v) => v + 1)}
                disabled={loadingRows}
                className="rounded border border-slate-400 bg-white p-2.5 hover:bg-slate-50"
                title="Muat ulang"
              >
                <RefreshCw size={17} className={loadingRows ? 'animate-spin' : ''} />
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowForm((v) => !v)
                  setError('')
                }}
                className="ml-auto inline-flex items-center gap-2 rounded-md bg-[#17345d] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#244b7c] sm:ml-0"
              >
                <Plus size={18} />
                {showForm ? 'Tutup Form' : 'Tambah Data'}
              </button>
            </div>
          </div>

          {rowsError && (
            <div role="alert" className="m-4 border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              {rowsError}
            </div>
          )}

          <p className="px-4 pt-3 text-sm text-slate-600 sm:hidden">
            Geser tabel ke kiri atau kanan untuk melihat kolom lainnya.
          </p>

          <form onSubmit={handleSave}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1780px] border-collapse text-left text-sm">
                <thead className="bg-[#d2d2d2] text-center text-sm font-bold text-black">
                  <tr>
                    {[
                      'NO',
                      'NAMA',
                      'INSTANSI',
                      'KEPERLUAN',
                      'PERSONIL DITUJU',
                      'NO HP',
                      'NO VISITOR',
                      'JAM MASUK',
                      'TTD MASUK',
                      'RENCANA SELESAI',
                      'JAM KELUAR',
                      'TTD KELUAR',
                      'TTD PETUGAS / SATPAM',
                      'AKSI',
                    ].map((label) => (
                      <th key={label} className="border border-slate-600 px-3 py-3">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {showForm && (
                    <tr className="align-middle bg-blue-50/60">
                      <td className="border border-slate-500 p-3 text-center font-bold">+</td>

                      <td className="relative border border-slate-500 p-2">
                        <input
                          required
                          maxLength={150}
                          value={draft.name}
                          onFocus={() => setShowSuggestions(true)}
                          onChange={(e) => {
                            setDraft((p) => ({ ...p, name: e.target.value }))
                            setShowSuggestions(true)
                          }}
                          placeholder="Nama lengkap"
                          className="h-10 w-full min-w-[150px] rounded border border-slate-300 bg-white px-2.5 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                          autoComplete="off"
                        />

                        {showSuggestions && (suggestions.length > 0 || searchingNames) && (
                          <div className="absolute left-2 top-full z-30 mt-1 max-h-64 min-w-[260px] overflow-y-auto rounded-md border border-slate-300 bg-white text-left shadow-xl">
                            {searchingNames && (
                              <div className="px-3 py-2 text-sm text-slate-500">
                                Mencari data sebelumnya...
                              </div>
                            )}

                            {suggestions.map((visitor) => (
                              <button
                                type="button"
                                key={visitor.id}
                                onClick={() => selectPreviousVisitor(visitor)}
                                className="block w-full border-b border-slate-100 px-3 py-3 text-left hover:bg-blue-50"
                              >
                                <span className="block font-semibold text-slate-800">
                                  {visitor.name}
                                </span>
                                <span className="block text-xs text-slate-500">
                                  {visitor.institution || 'Instansi tidak tercatat'} ·{' '}
                                  {visitor.phone ? maskPhone(visitor.phone) : 'No. HP tidak tercatat'}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}

                        <p className="mt-1 text-[11px] leading-4 text-slate-500">
                          Ketik min. 3 huruf untuk mencari data lama.
                        </p>
                      </td>

                      <td className="border border-slate-500 p-1.5">
                        <input
                          maxLength={200}
                          value={draft.institution}
                          onChange={(e) => setDraft((p) => ({ ...p, institution: e.target.value }))}
                          placeholder="Asal instansi"
                          className="h-10 w-full min-w-[130px] rounded border border-slate-300 bg-white px-2.5 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                        />
                      </td>

                      <td className="border border-slate-500 p-1.5">
                        <textarea
                          required
                          maxLength={500}
                          rows={2}
                          value={draft.purpose}
                          onChange={(e) => setDraft((p) => ({ ...p, purpose: e.target.value }))}
                          placeholder="Keperluan kunjungan"
                          className="h-10 w-full min-w-[145px] resize-y rounded border border-slate-300 bg-white px-2.5 py-2 text-sm leading-5 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                        />
                      </td>

                      <td className="border border-slate-500 p-1.5">
                        <input
                          required
                          maxLength={150}
                          value={draft.host_name}
                          onChange={(e) => setDraft((p) => ({ ...p, host_name: e.target.value }))}
                          placeholder="Nama personel KAI"
                          className="h-10 w-full min-w-[140px] rounded border border-slate-300 bg-white px-2.5 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                        />
                      </td>

                      <td className="border border-slate-500 p-1.5">
                        <input
                          type="tel"
                          maxLength={30}
                          value={draft.phone}
                          onChange={(e) => setDraft((p) => ({ ...p, phone: e.target.value }))}
                          placeholder="Nomor HP"
                          className="h-10 w-full min-w-[125px] rounded border border-slate-300 bg-white px-2.5 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                        />
                      </td>

                      <td className="border border-slate-500 p-3 text-center text-slate-500">
                        Otomatis
                      </td>

                      <td className="border border-slate-500 p-3 text-center text-slate-500">
                        Saat disimpan
                      </td>

                      {/* TOMBOL TANDA TANGAN */}
                      <td className="border border-slate-500 p-2 text-center">
                        <button
                          type="button"
                          onClick={() => setShowSignatureModal(true)}
                          className={`inline-flex min-w-[150px] items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm font-semibold transition ${
                            signature
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'border-blue-300 bg-white text-blue-700 hover:bg-blue-50'
                          }`}
                        >
                          {signature ? <CheckCircle2 size={17} /> : <PenLine size={17} />}
                          {signature ? 'Ubah TTD' : 'Isi TTD'}
                        </button>

                        {signature && (
                          <div className="mt-1 text-xs font-medium text-emerald-700">
                            TTD sudah diisi
                          </div>
                        )}
                      </td>

                      <td className="border border-slate-500 p-1.5">
                        <input
                          type="time"
                          required
                          value={draft.estimated_end_time}
                          onChange={(e) => setDraft((p) => ({ ...p, estimated_end_time: e.target.value }))}
                          className="h-10 w-full min-w-[130px] rounded border border-slate-300 bg-white px-2.5 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                        />
                      </td>

                      <td className="border border-slate-500 p-3 text-center text-slate-400">—</td>

                      <td className="border border-slate-500 p-3 text-center text-slate-400">
                        Otomatis dari TTD masuk
                      </td>

                      <td className="border border-slate-500 p-3 text-center text-slate-400">
                        Setelah konfirmasi
                      </td>

                      <td className="border border-slate-500 p-1.5">
                        <div className="flex min-w-[150px] flex-col gap-2">
                          <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center justify-center gap-2 rounded bg-[#17345d] px-3 py-3 text-sm font-bold text-white hover:bg-[#244b7c] disabled:opacity-50"
                          >
                            {saving
                              ? <LoaderCircle size={15} className="animate-spin" />
                              : <Save size={15} />}
                            {saving ? 'Menyimpan' : 'Simpan'}
                          </button>

                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => {
                              resetDraft()
                              setShowForm(false)
                              setShowSuggestions(false)
                            }}
                            className="rounded border border-slate-400 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            Batal
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}

                  {error && showForm && (
                    <tr>
                      <td colSpan={14} className="border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                        {error}
                      </td>
                    </tr>
                  )}

                  {loadingRows ? (
                    <tr>
                      <td colSpan={14} className="border border-slate-500 p-10 text-center text-base">
                        <LoaderCircle className="mx-auto mb-2 animate-spin" size={22} />
                        Memuat data...
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="border border-slate-500 p-10 text-center text-base text-slate-600">
                        Belum ada tamu yang mengisi pada tanggal ini.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row, i) => {
                      const ownToken =
                        typeof window !== 'undefined' &&
                        localStorage.getItem(`sipakai_checkout_${row.id}`)

                      const checkoutStatus = String(row.checkout_status || '').toLowerCase()
                      const isCheckedOut = ['confirmed', 'auto'].includes(checkoutStatus)
                      const isPendingCheckout =
                        checkoutStatus === 'pending' || checkoutStatus === 'requested'
                      const hasUnconfirmedTimeOut = Boolean(row.time_out) && !isCheckedOut
                      const satpamTtd = officerSignature(row)

                      return (
                        <tr key={row.id} className="align-middle hover:bg-slate-50">
                          <td className="border border-slate-500 p-3 text-center font-semibold">
                            {(page - 1) * 10 + i + 1}
                          </td>

                          <td className="border border-slate-500 p-3 font-semibold">{row.name}</td>
                          <td className="border border-slate-500 p-3">{row.institution || '—'}</td>
                          <td className="max-w-[220px] border border-slate-500 p-3">{row.purpose}</td>
                          <td className="border border-slate-500 p-3">{row.host_name || '—'}</td>
                          <td className="border border-slate-500 p-3 text-center">{maskPhone(row.phone)}</td>
                          <td className="border border-slate-500 p-3 text-center">{row.visitor_card_no || '—'}</td>
                          <td className="border border-slate-500 p-3 text-center">{formatTime(row.time_in)}</td>

                          <td className="border border-slate-500 p-2 text-center">
                            {row.visitor_signature_url || row.visitor_signature ? (
                              <img
                                src={row.visitor_signature_url || row.visitor_signature}
                                alt="Tanda tangan pengunjung saat masuk"
                                className="mx-auto max-h-14 max-w-[130px] object-contain"
                              />
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          <td className="border border-slate-500 p-3 text-center">
                            {formatTime(row.estimated_end_time)}
                          </td>

                          <td className="border border-slate-500 p-3 text-center">
                            {formatTime(row.time_out)}
                          </td>

                          <td className="border border-slate-500 p-2 text-center">
                            {isCheckedOut && (row.visitor_signature_url || row.visitor_signature) ? (
                              <img
                                src={row.visitor_signature_url || row.visitor_signature}
                                alt="Tanda tangan pengunjung"
                                className="mx-auto max-h-14 max-w-[130px] object-contain"
                              />
                            ) : (
                              <span className="text-slate-400">
                                {isCheckedOut
                                  ? 'TTD tidak tersedia'
                                  : isPendingCheckout
                                    ? 'Menunggu konfirmasi'
                                    : 'Belum checkout'}
                              </span>
                            )}
                          </td>

                          <td className="border border-slate-500 p-2 text-center">
                            {isCheckedOut && satpamTtd ? (
                              <img
                                src={satpamTtd}
                                alt="Tanda tangan Satpam"
                                className="mx-auto max-h-14 max-w-[130px] object-contain"
                              />
                            ) : (
                              <span className="text-slate-400">
                                {isCheckedOut
                                  ? 'TTD Satpam tidak tersedia'
                                  : isPendingCheckout
                                    ? 'Menunggu konfirmasi Satpam'
                                    : 'Belum checkout'}
                              </span>
                            )}
                          </td>

                          <td className="border border-slate-500 p-3 text-center">
                            {isCheckedOut ? (
                              <div className="font-bold text-emerald-700">
                                {checkoutStatus === 'auto' || row.checkout_type === 'auto'
                                  ? 'Auto Checkout oleh Sistem'
                                  : 'Selesai'}
                              </div>
                            ) : isPendingCheckout ? (
                              <span className="font-semibold text-amber-700">
                                Menunggu konfirmasi Satpam
                              </span>
                            ) : hasUnconfirmedTimeOut ? (
                              <span className="font-semibold text-orange-700">
                                Perlu pemeriksaan Satpam
                              </span>
                            ) : ownToken ? (
                              <button
                                type="button"
                                disabled={checkingOut === row.id}
                                onClick={() => handleCheckout(row)}
                                className="inline-flex items-center gap-1 rounded bg-emerald-600 px-3 py-2 font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                              >
                                {checkingOut === row.id
                                  ? <LoaderCircle size={14} className="animate-spin" />
                                  : <LogOut size={14} />}
                                Checkout
                              </button>
                            ) : (
                              <span className="text-amber-700">Di lokasi</span>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </form>

          {isOfficer && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-400 px-4 py-3 text-sm text-slate-600">
              <span>{total} data · Halaman {page} dari {lastPage}</span>

              <div className="flex gap-2">
                <button
                  disabled={page <= 1 || loadingRows}
                  onClick={() => setPage((p) => p - 1)}
                  className="inline-flex items-center gap-1 rounded border border-slate-400 px-3 py-2 disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Sebelumnya
                </button>

                <button
                  disabled={page >= lastPage || loadingRows}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex items-center gap-1 rounded border border-slate-400 px-3 py-2 disabled:opacity-40"
                >
                  Berikutnya
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </section>

        {checkingAccess && (
          <p className="mt-3 text-center text-sm text-slate-500">
            <LoaderCircle size={15} className="mr-1 inline animate-spin" />
            Memeriksa akses pengguna...
          </p>
        )}

        <footer className="py-6 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} PT Kereta Api Indonesia (Persero) · SIPAKAI
        </footer>
      </main>

      {/* POPUP TANDA TANGAN RESPONSIVE */}
      {showSignatureModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/70 p-3 sm:p-6"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowSignatureModal(false)
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="signature-modal-title"
            className="flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-6">
              <div>
                <h2 id="signature-modal-title" className="flex items-center gap-2 text-lg font-bold text-slate-900 sm:text-xl">
                  <PenLine size={21} className="text-blue-700" />
                  Tanda Tangan Pengunjung
                </h2>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  Silakan tanda tangan pada area putih di bawah ini.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowSignatureModal(false)}
                aria-label="Tutup pop-up tanda tangan"
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                <X size={22} />
              </button>
            </div>

            <div className="overflow-y-auto p-4 sm:p-6">
              <div className="rounded-xl border-2 border-dashed border-blue-200 bg-slate-50 p-2 sm:p-4">
                <SignaturePad
                  key={signatureKey}
                  value={signature}
                  onChange={setSignature}
                />
              </div>

              <p className="mt-3 text-center text-xs text-slate-500 sm:text-sm">
                Gunakan jari, stylus, atau mouse. Pastikan tanda tangan terlihat jelas.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:justify-between sm:px-6">
              <button
                type="button"
                onClick={() => {
                  setSignature('')
                  setSignatureKey((v) => v + 1)
                }}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-50"
              >
                <Trash2 size={17} />
                Hapus TTD
              </button>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setShowSignatureModal(false)}
                  className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Tutup
                </button>

                <button
                  type="button"
                  onClick={() => setShowSignatureModal(false)}
                  disabled={!signature}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#17345d] px-6 py-3 text-sm font-bold text-white hover:bg-[#244b7c] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <CheckCircle2 size={17} />
                  Selesai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SignaturePad({ onChange, value = '' }) {
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const last = useRef(null)

  // Memulihkan tanda tangan saat pop-up dibuka kembali.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !value) return

    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    }

    img.src = value
  }, [value])

  const getPoint = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()

    return {
      x: (e.clientX - rect.left) * e.currentTarget.width / rect.width,
      y: (e.clientY - rect.top) * e.currentTarget.height / rect.height,
    }
  }

  const start = (e) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture?.(e.pointerId)

    const p = getPoint(e)
    const ctx = e.currentTarget.getContext('2d')

    ctx.beginPath()
    ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2)
    ctx.fillStyle = '#172f55'
    ctx.fill()

    last.current = p
    drawing.current = true
  }

  const move = (e) => {
    if (!drawing.current || !last.current) return

    e.preventDefault()

    const p = getPoint(e)
    const ctx = e.currentTarget.getContext('2d')

    ctx.beginPath()
    ctx.moveTo(last.current.x, last.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#172f55'
    ctx.stroke()

    last.current = p
  }

  const stop = (e) => {
    if (!drawing.current) return

    drawing.current = false
    last.current = null

    onChange(e.currentTarget.toDataURL('image/png'))
  }

  const clear = () => {
    const canvas = canvasRef.current

    if (canvas) {
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    }

    onChange('')
  }

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-600 sm:text-sm">
          Area tanda tangan
        </span>
        <span className="text-[10px] text-slate-400 sm:text-xs">
          SIPAKAI
        </span>
      </div>

      <canvas
        ref={canvasRef}
        width={1000}
        height={400}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={stop}
        onPointerCancel={stop}
        onLostPointerCapture={stop}
        className="h-[190px] w-full touch-none rounded-lg border border-slate-300 bg-white sm:h-[300px] md:h-[340px]"
        aria-label="Area tanda tangan pengunjung"
      />
    </div>
  )
}
