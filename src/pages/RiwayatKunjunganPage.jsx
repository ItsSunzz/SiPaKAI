import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'
import {
  History,
  Search,
  RefreshCw,
  CalendarDays,
  Clock,
  Users,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

const PAGE_SIZE = 25

function toDateInput(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getPeriodRange(period, customFrom, customTo) {
  const today = new Date()
  const from = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const to = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  if (period === 'hari_ini') {
    return { from: toDateInput(from), to: toDateInput(to) }
  }

  if (period === 'minggu_ini') {
    const day = from.getDay()
    const diffToMonday = day === 0 ? 6 : day - 1
    from.setDate(from.getDate() - diffToMonday)
    to.setDate(from.getDate() + 6)
    return { from: toDateInput(from), to: toDateInput(to) }
  }

  if (period === 'bulan_ini') {
    from.setDate(1)
    to.setMonth(to.getMonth() + 1, 0)
    return { from: toDateInput(from), to: toDateInput(to) }
  }

  if (period === 'tahun_ini') {
    from.setMonth(0, 1)
    to.setMonth(11, 31)
    return { from: toDateInput(from), to: toDateInput(to) }
  }

  if (period === 'rentang') {
    return { from: customFrom || '', to: customTo || '' }
  }

  return { from: '', to: '' }
}

export default function RiwayatKunjunganPage() {
  const [visitors, setVisitors] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('semua')
  const [period, setPeriod] = useState('semua')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: PAGE_SIZE,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const dateRange = useMemo(
    () => getPeriodRange(period, customFrom, customTo),
    [period, customFrom, customTo]
  )

  const loadVisitors = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const params = {
        page,
        per_page: PAGE_SIZE,
      }

      if (search.trim()) params.q = search.trim()
      if (dateRange.from) params.from = dateRange.from
      if (dateRange.to) params.to = dateRange.to

      // Parameter disesuaikan dengan VisitorController:
      // inside dan checkout_status.
      if (statusFilter === 'lokasi') {
        params.inside = 1
      } else if (statusFilter === 'menunggu') {
        params.checkout_status = 'pending'
      } else if (statusFilter === 'selesai') {
        params.checkout_status = 'confirmed'
      } else if (statusFilter === 'auto') {
        params.checkout_status = 'auto'
      }

      const response = await api.getVisitors(params)
      const rows = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : []

      setVisitors(rows)
      setPagination({
        current_page: Number(response?.current_page || page),
        last_page: Number(response?.last_page || 1),
        total: Number(response?.total ?? rows.length),
        per_page: Number(response?.per_page || PAGE_SIZE),
      })
    } catch (err) {
      console.error('Gagal memuat riwayat kunjungan:', err)
      setError(err?.message || 'Gagal memuat riwayat kunjungan.')
      setVisitors([])
      setPagination({
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: PAGE_SIZE,
      })
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, dateRange])

  useEffect(() => {
    loadVisitors()
  }, [loadVisitors])

  // Kembali ke halaman pertama saat kriteria filter berubah.
  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, period, customFrom, customTo])

  const getStatus = (visitor) => {
    if (visitor.checkout_status === 'auto' || visitor.checkout_type === 'auto') {
      return 'Auto Checkout'
    }
    if (visitor.time_out || visitor.jam_keluar) return 'Selesai'
    if (
      visitor.checkout_status === 'pending' ||
      visitor.checkout_status === 'requested' ||
      visitor.checkout_requested_at
    ) {
      return 'Menunggu Checkout'
    }
    return 'Masih di Lokasi'
  }

  const getDate = (visitor) =>
    visitor.visit_date || visitor.tanggal_kunjungan || visitor.created_at || ''

  const formatDate = (value) => {
    if (!value) return '-'
    const date = new Date(`${String(value).slice(0, 10)}T00:00:00`)
    if (Number.isNaN(date.getTime())) return String(value)
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatTime = (value) => (value ? String(value).slice(0, 5) : '-')

  const statusStyle = (status) => {
    if (status === 'Selesai' || status === 'Auto Checkout') {
      return 'bg-slate-100 text-slate-700'
    }
    if (status === 'Menunggu Checkout') {
      return 'bg-amber-100 text-amber-800'
    }
    return 'bg-emerald-100 text-emerald-800'
  }

  const showingFrom = pagination.total === 0
    ? 0
    : (pagination.current_page - 1) * pagination.per_page + 1
  const showingTo = Math.min(
    pagination.current_page * pagination.per_page,
    pagination.total
  )

  return (
    <div className="w-full max-w-[1500px] mx-auto space-y-6">
      <div>
        <p className="text-sm font-semibold text-[#a8390a] mb-2">
          DATA KUNJUNGAN
        </p>
        <h1 className="text-2xl md:text-3xl font-bold text-[#0b2046]">
          Riwayat Kunjungan
        </h1>
        <p className="text-base text-slate-600 mt-2">
          Lihat dan telusuri catatan kunjungan tamu dari database.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-500">Total Riwayat</p>
              <p className="text-2xl font-bold leading-tight text-[#0b2046] mt-1">
                {loading ? '...' : pagination.total}
              </p>
              <p className="text-xs text-slate-500 mt-1">Sesuai filter database</p>
            </div>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700 shrink-0">
              <History className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-500">Hasil Ditampilkan</p>
              <p className="text-2xl font-bold leading-tight text-[#0b2046] mt-1">
                {loading ? '...' : visitors.length}
              </p>
              <p className="text-xs text-slate-500 mt-1">Data pada halaman ini</p>
            </div>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 md:p-6 border-b border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-[#0b2046]">
                Daftar Riwayat
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Pencarian, status, dan periode diproses oleh server.
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

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nama, instansi, keperluan, atau nomor kartu..."
                className="w-full pl-11 pr-4 py-3.5 border border-slate-300 rounded-lg text-base outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full pl-11 pr-4 py-3.5 border border-slate-300 rounded-lg text-base bg-white outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="semua">Semua Status</option>
                <option value="lokasi">Masih di Lokasi</option>
                <option value="menunggu">Menunggu Checkout</option>
                <option value="selesai">Sudah Checkout Manual</option>
                <option value="auto">Auto Checkout</option>
              </select>
            </div>

            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
                className="w-full pl-11 pr-4 py-3.5 border border-slate-300 rounded-lg text-base bg-white outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="semua">Semua Periode</option>
                <option value="hari_ini">Hari Ini</option>
                <option value="minggu_ini">Minggu Ini</option>
                <option value="bulan_ini">Bulan Ini</option>
                <option value="tahun_ini">Tahun Ini</option>
                <option value="rentang">Rentang Tanggal</option>
              </select>
            </div>
          </div>

          {period === 'rentang' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-sm font-medium text-slate-600">
                Dari tanggal
                <input
                  type="date"
                  value={customFrom}
                  max={customTo || undefined}
                  onChange={(event) => setCustomFrom(event.target.value)}
                  className="mt-1 w-full px-3 py-3 border border-slate-300 rounded-lg bg-white"
                />
              </label>
              <label className="text-sm font-medium text-slate-600">
                Sampai tanggal
                <input
                  type="date"
                  value={customTo}
                  min={customFrom || undefined}
                  onChange={(event) => setCustomTo(event.target.value)}
                  className="mt-1 w-full px-3 py-3 border border-slate-300 rounded-lg bg-white"
                />
              </label>
            </div>
          )}
        </div>

        {error && (
          <div className="m-5 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Tampilan mobile */}
        <div className="md:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Memuat riwayat kunjungan...</div>
          ) : visitors.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <History className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="font-semibold">Data kunjungan tidak ditemukan</p>
              <p className="text-sm mt-1">Coba ubah kata pencarian atau filter.</p>
            </div>
          ) : (
            visitors.map((visitor, index) => {
              const status = getStatus(visitor)
              return (
                <div key={visitor.id || index} className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-400">
                        Kunjungan #{visitor.visitor_card_no || visitor.id || showingFrom + index}
                      </p>
                      <h3 className="text-base font-bold text-[#0b2046] mt-1">
                        {visitor.name || visitor.nama || 'Tanpa Nama'}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">
                        {visitor.institution || visitor.instansi || '-'}
                      </p>
                    </div>
                    <span className={`shrink-0 text-xs font-bold px-3 py-2 rounded-full ${statusStyle(status)}`}>
                      {status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Tanggal</p>
                      <p className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <CalendarDays className="w-4 h-4" />
                        {formatDate(getDate(visitor))}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Jam Masuk</p>
                      <p className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {formatTime(visitor.time_in || visitor.jam_masuk)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Jam Keluar</p>
                      <p className="font-semibold text-slate-700">
                        {formatTime(visitor.time_out || visitor.jam_keluar)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Personil Dituju</p>
                      <p className="font-semibold text-slate-700">
                        {visitor.host_name || visitor.tujuan_nama || '-'}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm">
                    <p className="text-xs text-slate-400 mb-1">Keperluan</p>
                    <p className="text-slate-700">{visitor.purpose || visitor.keperluan || '-'}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Tampilan desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-5 py-4 text-left font-bold">No.</th>
                <th className="px-5 py-4 text-left font-bold">Tanggal</th>
                <th className="px-5 py-4 text-left font-bold">Nama Tamu</th>
                <th className="px-5 py-4 text-left font-bold">Instansi</th>
                <th className="px-5 py-4 text-left font-bold">Keperluan</th>
                <th className="px-5 py-4 text-left font-bold">Personil Dituju</th>
                <th className="px-5 py-4 text-left font-bold">Jam Masuk</th>
                <th className="px-5 py-4 text-left font-bold">Jam Keluar</th>
                <th className="px-5 py-4 text-left font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-5 py-12 text-center text-slate-500">
                    Memuat riwayat kunjungan...
                  </td>
                </tr>
              ) : visitors.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-5 py-12 text-center text-slate-500">
                    Tidak ada data kunjungan yang cocok.
                  </td>
                </tr>
              ) : (
                visitors.map((visitor, index) => {
                  const status = getStatus(visitor)
                  return (
                    <tr key={visitor.id || index} className="hover:bg-slate-50">
                      <td className="px-5 py-4 text-slate-500">
                        {(pagination.current_page - 1) * pagination.per_page + index + 1}
                      </td>
                      <td className="px-5 py-4 text-slate-600">{formatDate(getDate(visitor))}</td>
                      <td className="px-5 py-4 font-semibold text-[#0b2046]">
                        {visitor.name || visitor.nama || '-'}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {visitor.institution || visitor.instansi || '-'}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {visitor.purpose || visitor.keperluan || '-'}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {visitor.host_name || visitor.tujuan_nama || '-'}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {formatTime(visitor.time_in || visitor.jam_masuk)}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {formatTime(visitor.time_out || visitor.jam_keluar)}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex px-3 py-2 rounded-full text-xs font-bold ${statusStyle(status)}`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 md:px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-slate-500">
          <p>
            Menampilkan <strong className="text-[#0b2046]">{loading ? '...' : showingFrom}-{loading ? '...' : showingTo}</strong>
            {' '}dari <strong className="text-[#0b2046]">{loading ? '...' : pagination.total}</strong> kunjungan
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={loading || pagination.current_page <= 1}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
              Sebelumnya
            </button>
            <span className="px-2 font-medium text-slate-600">
              {pagination.current_page} / {pagination.last_page}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(pagination.last_page, current + 1))}
              disabled={loading || pagination.current_page >= pagination.last_page}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Berikutnya
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
