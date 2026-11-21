
import React, { useCallback, useEffect, useState } from 'react'
import { api } from '../services/api'
import {
  Clock,
  Search,
  RefreshCw,
  ClipboardCheck,
  CalendarDays,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'

export default function CheckoutTamuPage() {
  const [visitors, setVisitors] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [confirmingId, setConfirmingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadVisitors = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await api.getVisitors({
        checkout_status: 'pending',
        per_page: 100,
      })
      const rows = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.data)
            ? response.data.data
            : []

      setVisitors(rows)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Gagal memuat data tamu.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadVisitors()
  }, [loadVisitors])

  const getStatus = (visitor) => {
  const status = String(visitor.checkout_status || '').toLowerCase()

    // Permintaan checkout harus diperiksa lebih dahulu
    if (status === 'pending' || status === 'requested') {
        return 'Menunggu Checkout'
    }

    // Checkout yang sudah dikonfirmasi
    if (['confirmed', 'auto'].includes(status)) {
        return 'Selesai'
    }

    // Fallback untuk data lama
    if (visitor.time_out || visitor.jam_keluar) {
        return 'Perlu Pemeriksaan'
    }

    return 'Masih di Lokasi'
    }

  const pendingVisitors = visitors.filter(
    (visitor) => getStatus(visitor) === 'Menunggu Checkout'
  )

  const filteredVisitors = pendingVisitors.filter((visitor) => {
    const keyword = search.toLowerCase()

    return (
      (visitor.name || visitor.nama || '').toLowerCase().includes(keyword) ||
      (visitor.institution || visitor.instansi || '').toLowerCase().includes(keyword) ||
      String(visitor.visitor_card_no || visitor.nomor_kartu_tamu || '')
        .toLowerCase()
        .includes(keyword)
    )
  })

  const formatTime = (value) => value ? String(value).slice(0, 5) : '-'

  const handleConfirmCheckout = async (visitor) => {
    const visitorName = visitor.name || visitor.nama || 'Tamu'

    const approved = window.confirm(
      `Konfirmasi bahwa ${visitorName} sudah meninggalkan lokasi?`
    )

    if (!approved) return

    setConfirmingId(visitor.id)
    setError('')
    setSuccess('')

    try {
      await api.confirmVisitorCheckout(visitor.id)

      setSuccess(
        `Checkout ${visitorName} berhasil dikonfirmasi.`
      )

      await loadVisitors()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Gagal mengonfirmasi checkout tamu.')
    } finally {
      setConfirmingId(null)
    }
  }

  return (
    <div className="w-full max-w-[1500px] mx-auto space-y-6">
      <div>
        <p className="text-sm font-semibold text-[#a8390a] mb-2">
          OPERASIONAL SATPAM
        </p>

        <h1 className="text-2xl md:text-3xl font-bold text-[#0b2046]">
          Checkout Tamu
        </h1>

        <p className="text-base text-slate-600 mt-2">
          Periksa permintaan checkout dan pastikan proses kepulangan tamu tercatat.
        </p>
      </div>

      {/* RINGKASAN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs md:text-sm font-semibold text-slate-600">
              Menunggu Konfirmasi
            </p>

            <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <p className="text-2xl md:text-3xl font-bold text-[#0b2046] mt-2">
            {loading ? '...' : pendingVisitors.length}
          </p>

          <p className="text-xs text-slate-500 mt-1">
            Permintaan checkout yang perlu diperiksa
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs md:text-sm font-semibold text-slate-600">
              Data Diperiksa
            </p>

            <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
              <ClipboardCheck className="w-4 h-4" />
            </div>
          </div>

          <p className="text-2xl md:text-3xl font-bold text-[#0b2046] mt-2">
            {loading ? '...' : filteredVisitors.length}
          </p>

          <p className="text-xs text-slate-500 mt-1">
            Sesuai hasil pencarian saat ini
          </p>
        </div>
      </div>

      {/* DAFTAR PERMINTAAN */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 md:p-6 border-b border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-[#0b2046]">
                Permintaan Checkout
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Daftar tamu yang meminta konfirmasi keluar
              </p>
            </div>

            <button
              onClick={loadVisitors}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama, instansi, atau nomor kartu..."
              className="w-full pl-11 pr-4 py-3.5 border border-slate-300 rounded-lg text-base outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
            />
          </div>
        </div>

        {/* NOTIFIKASI */}
        {error && (
          <div className="mx-5 mt-5 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="mx-5 mt-5 p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            {success}
          </div>
        )}

        <div className="p-5 md:p-6">
          {loading ? (
            <div className="py-12 text-center text-slate-500">
              Memuat data checkout...
            </div>
          ) : filteredVisitors.length === 0 ? (
            <div className="py-12 text-center">
              <ClipboardCheck className="w-12 h-12 mx-auto text-slate-300 mb-3" />

              <h3 className="font-bold text-lg text-slate-700">
                Belum ada permintaan checkout
              </h3>

              <p className="text-sm text-slate-500 mt-2">
                Permintaan checkout tamu akan muncul di halaman ini.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredVisitors.map((visitor, index) => (
                <div
                  key={visitor.id || index}
                  className="border border-slate-200 rounded-xl p-4 md:p-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-lg font-bold text-[#0b2046]">
                          {visitor.name || visitor.nama || 'Tanpa Nama'}
                        </h3>

                        <p className="text-sm text-slate-500 mt-1">
                          {visitor.institution || visitor.instansi || '-'}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                        <span className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Masuk: {formatTime(visitor.time_in || visitor.jam_masuk)}
                        </span>

                        <span className="flex items-center gap-2">
                          <CalendarDays className="w-4 h-4" />
                          Kartu: {visitor.visitor_card_no || visitor.nomor_kartu_tamu || '-'}
                        </span>

                        <span className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Rencana selesai: {formatTime(visitor.estimated_end_time)}
                        </span>
                      </div>
                    </div>

                    <span className="inline-flex w-fit px-3 py-2 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                      Menunggu Checkout
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleConfirmCheckout(visitor)}
                    disabled={confirmingId !== null}
                    className="w-full sm:w-auto mt-4 px-5 py-3 rounded-lg bg-[#0b2046] hover:bg-[#173568] text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {confirmingId === visitor.id ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <ClipboardCheck className="w-4 h-4" />
                        Konfirmasi Checkout
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
