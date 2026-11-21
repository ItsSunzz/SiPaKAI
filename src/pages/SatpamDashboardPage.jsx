
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  UserCheck,
  Clock,
  LogOut,
  BookOpen,
  ClipboardCheck,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  CalendarDays,
} from 'lucide-react'
import { api } from '../services/api'

export default function SatpamDashboardPage({ user }) {
  const navigate = useNavigate()

  const [visitors, setVisitors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const loadVisitors = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await api.getPublicDailyVisitors()

      const rows = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.data)
            ? response.data.data
            : Array.isArray(response?.visitors)
              ? response.visitors
              : []

      setVisitors(rows)
    } catch (err) {
      console.error('Gagal mengambil data tamu:', err)
      setError(err.message || 'Gagal mengambil data kunjungan.')
      setVisitors([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadVisitors()
  }, [loadVisitors])

  const getVisitorStatus = (visitor) => {
    if (visitor.time_out || visitor.jam_keluar) {
      return 'Selesai'
    }

    if (
      visitor.checkout_requested_at ||
      visitor.checkout_status === 'pending' ||
      visitor.checkout_status === 'requested'
    ) {
      return 'Menunggu Checkout'
    }

    return 'Di Lokasi'
  }

  const totalVisitors = visitors.length
  const stillInside = visitors.filter(
    (visitor) => getVisitorStatus(visitor) === 'Di Lokasi'
  ).length
  const waitingCheckout = visitors.filter(
    (visitor) => getVisitorStatus(visitor) === 'Menunggu Checkout'
  ).length
  const checkedOut = visitors.filter(
    (visitor) => getVisitorStatus(visitor) === 'Selesai'
  ).length

  const stats = [
    {
      label: 'Total Tamu Hari Ini',
      value: totalVisitors,
      description: 'Jumlah seluruh kunjungan',
      icon: Users,
      color: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Masih di Lokasi',
      value: stillInside,
      description: 'Tamu belum checkout',
      icon: UserCheck,
      color: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Menunggu Checkout',
      value: waitingCheckout,
      description: 'Permintaan yang menunggu',
      icon: Clock,
      color: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Sudah Checkout',
      value: checkedOut,
      description: 'Kunjungan telah selesai',
      icon: LogOut,
      color: 'bg-slate-100 text-slate-700',
    },
  ]

  const formatTime = (value) => {
    if (!value) return '-'
    return String(value).slice(0, 5)
  }

  const getName = (visitor) =>
    visitor.name || visitor.nama || 'Tanpa Nama'

  const getInstitution = (visitor) =>
    visitor.institution || visitor.instansi || '-'

  const getTimeIn = (visitor) =>
    visitor.time_in || visitor.jam_masuk

  const statusStyle = (status) => {
    if (status === 'Selesai') {
      return 'bg-slate-100 text-slate-700'
    }

    if (status === 'Menunggu Checkout') {
      return 'bg-amber-100 text-amber-800'
    }

    return 'bg-emerald-100 text-emerald-800'
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-7">

      {/* HEADER */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#a8390a] mb-3">
              <ShieldCheck className="w-5 h-5" />
              PORTAL PETUGAS KEAMANAN
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-[#0b2046]">
              Dashboard Satpam
            </h1>

            <p className="text-base text-slate-600 mt-2">
              Selamat bertugas, {user?.name || 'Petugas Satpam'}
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-4">
            <CalendarDays className="w-6 h-6 text-[#a8390a]" />
            <div>
              <p className="text-sm font-bold text-slate-800">
                {today}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Aktivitas kunjungan hari ini
              </p>
            </div>
          </div>
        </div>
      </div>
     
    {/* STATISTIK */}
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
    {stats.map((stat) => {
        const Icon = stat.icon

        return (
        <div
            key={stat.label}
            className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 shadow-sm"
        >
            <div className="flex items-center justify-between gap-2">
            <p className="text-xs md:text-sm font-semibold text-slate-600 leading-snug">
                {stat.label}
            </p>

            <div className={`p-2 md:p-2.5 rounded-lg shrink-0 ${stat.color}`}>
                <Icon className="w-5 h-5" />
            </div>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-[#0b2046] mt-2">
            {loading ? '...' : stat.value}
            </h2>

            <p className="text-xs text-slate-500 mt-2">
            {stat.description}
            </p>
        </div>
        )
    })}
    </div>

      {/* AKSES CEPAT */}
      <div>
        <h2 className="text-xl font-bold text-[#0b2046] mb-4">
          Akses Cepat
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/buku-tamu')}
            className="bg-[#0b2046] hover:bg-[#163568] text-white rounded-2xl p-6 md:p-7 text-left transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-white/10">
                <BookOpen className="w-7 h-7" />
              </div>
              <ArrowRight className="w-6 h-6" />
            </div>

            <h3 className="font-bold text-xl mt-5">
              Buku Tamu
            </h3>

            <p className="text-sm md:text-base text-slate-300 mt-2">
              Melihat daftar kunjungan dan mencatat tamu VIP/VVIP.
            </p>
          </button>

          <button
            onClick={() => navigate('/checkout-tamu')}
            className="bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl p-6 md:p-7 text-left transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-orange-50 text-[#a8390a]">
                <ClipboardCheck className="w-7 h-7" />
              </div>
              <ArrowRight className="w-6 h-6 text-slate-400" />
            </div>

            <h3 className="font-bold text-xl text-[#0b2046] mt-5">
              Checkout Tamu
            </h3>

            <p className="text-sm md:text-base text-slate-500 mt-2">
              Memeriksa dan mengonfirmasi tamu yang akan keluar.
            </p>
          </button>
        </div>
      </div>

      {/* AKTIVITAS TAMU */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        <div className="p-5 md:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-[#0b2046]">
              Aktivitas Tamu Hari Ini
            </h2>

            <p className="text-sm text-slate-500 mt-2">
              Daftar seluruh kunjungan pada hari ini
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={loadVisitors}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <button
              onClick={() => navigate('/buku-tamu')}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#0b2046] text-white text-sm font-semibold hover:bg-[#163568]"
            >
              Buku Tamu
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && (
          <div className="m-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
            <button
              onClick={loadVisitors}
              className="ml-2 font-bold underline"
            >
              Coba lagi
            </button>
          </div>
        )}

        {/* TAMPILAN MOBILE */}
        <div className="md:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-slate-500">
              Memuat data kunjungan...
            </div>
          ) : visitors.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Users className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="font-semibold">Belum ada kunjungan hari ini</p>
              <p className="text-sm mt-1">
                Data tamu akan muncul setelah tercatat di Buku Tamu.
              </p>
            </div>
          ) : (
            visitors.map((visitor, index) => {
              const status = getVisitorStatus(visitor)

              return (
                <div key={visitor.id || index} className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-400">
                        Kunjungan #{visitor.number || index + 1}
                      </p>
                      <h3 className="text-base font-bold text-[#0b2046] mt-1">
                        {getName(visitor)}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">
                        {getInstitution(visitor)}
                      </p>
                    </div>

                    <span className={`shrink-0 text-xs font-semibold px-3 py-2 rounded-full ${statusStyle(status)}`}>
                      {status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm border-t border-slate-100 pt-3">
                    <span className="text-slate-500">Jam masuk</span>
                    <span className="font-bold text-slate-800">
                      {formatTime(getTimeIn(visitor))}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* TAMPILAN DESKTOP */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-6 py-4 text-left font-bold">No.</th>
                <th className="px-6 py-4 text-left font-bold">Nama Tamu</th>
                <th className="px-6 py-4 text-left font-bold">Instansi</th>
                <th className="px-6 py-4 text-left font-bold">Jam Masuk</th>
                <th className="px-6 py-4 text-left font-bold">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    Memuat data kunjungan...
                  </td>
                </tr>
              ) : visitors.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <Users className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                    <p className="font-semibold">Belum ada kunjungan hari ini</p>
                  </td>
                </tr>
              ) : (
                visitors.map((visitor, index) => {
                  const status = getVisitorStatus(visitor)

                  return (
                    <tr key={visitor.id || index} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-500">
                        {visitor.number || index + 1}
                      </td>

                      <td className="px-6 py-4 font-semibold text-[#0b2046]">
                        {getName(visitor)}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {getInstitution(visitor)}
                      </td>

                      <td className="px-6 py-4 font-medium text-slate-700">
                        {formatTime(getTimeIn(visitor))}
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex text-xs font-semibold px-3 py-2 rounded-full ${statusStyle(status)}`}>
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

        <div className="px-5 md:px-6 py-4 border-t border-slate-100 text-sm text-slate-500">
          Total data ditampilkan: <strong className="text-[#0b2046]">{loading ? '...' : visitors.length}</strong> kunjungan
        </div>
      </div>
    </div>
  )
}
