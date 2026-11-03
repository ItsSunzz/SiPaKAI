import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Bell, 
  CheckCheck, 
  CheckCircle2, 
  Trash2, 
  Clock, 
  FileText, 
  Check, 
  AlertTriangle, 
  PenTool, 
  ExternalLink,
  RefreshCw,
  Inbox
} from 'lucide-react'
import { api } from '../services/api'

// Fallback data representatif jika backend belum memiliki data notifikasi
const FALLBACK_NOTIFICATIONS = [
  {
    id: 'demo-notif-1',
    type: 'App\\Notifications\\NewApprovalRequest',
    data: {
      title: 'Pengajuan BAST Baru Menunggu Verifikasi',
      message: 'Dokumen BAST Laptop Operasional telah diajukan dan membutuhkan disposisi/persetujuan Anda.',
      document_id: 2,
      document_number: 'BAST-TI/2025/10/0122',
      document_type: 'ho01',
      category_type: 'bast',
      action_url: '/bast-barang/2',
      sender_name: 'Rian Hidayat',
    },
    read_at: null,
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    time_ago: '15 menit yang lalu',
  },
  {
    id: 'demo-notif-2',
    type: 'App\\Notifications\\DocumentApproved',
    data: {
      title: 'Pemusnahan Aset Telah Disetujui',
      message: 'Berita Acara Pemusnahan Aset TI (Scrap) telah disetujui sepenuhnya oleh VP TI.',
      document_id: 1,
      document_number: 'BA-TI/01/2025/10/0048',
      document_type: 'dsp01',
      category_type: 'pemusnahan',
      action_url: '/pemusnahan/1',
      sender_name: 'Fajar Prasetyo',
    },
    read_at: null,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    time_ago: '2 jam yang lalu',
  },
  {
    id: 'demo-notif-3',
    type: 'App\\Notifications\\SignatureRequested',
    data: {
      title: 'Permintaan Tanda Tangan Digital Pihak Kedua',
      message: 'Harap bubuhkan tanda tangan digital (PIN) untuk penyelesaian dokumen BAST.',
      document_id: 2,
      document_number: 'BAST-TI/2025/10/0122',
      document_type: 'ho01',
      category_type: 'bast',
      action_url: '/bast-barang/2',
      sender_name: 'Unit TI DAOP 1',
    },
    read_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    time_ago: 'Kemarin',
  },
]

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState('all') // 'all' | 'unread'
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  // Ambil data notifikasi dari API
  const fetchNotifications = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true)
    else setIsRefreshing(true)

    try {
      const res = await api.getNotifications({
        unread_only: filter === 'unread' ? 1 : 0,
        per_page: 20,
      })

      if (res && Array.isArray(res.notifications)) {
        setNotifications(res.notifications)
        setUnreadCount(typeof res.unread_count === 'number' ? res.unread_count : 0)
        setTotalCount(typeof res.total_count === 'number' ? res.total_count : res.notifications.length)
      } else {
        // Fallback jika response kosong / testing
        applyFallbackData()
      }
    } catch {
      // Jika request API gagal atau rute belum siap, gunakan fallback
      applyFallbackData()
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [filter])

  const applyFallbackData = () => {
    const list = filter === 'unread' 
      ? FALLBACK_NOTIFICATIONS.filter((n) => !n.read_at)
      : FALLBACK_NOTIFICATIONS
    setNotifications(list)
    setUnreadCount(FALLBACK_NOTIFICATIONS.filter((n) => !n.read_at).length)
    setTotalCount(FALLBACK_NOTIFICATIONS.length)
  }

  // Load awal & saat filter berubah
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Polling berkala setiap 45 detik untuk memperbarui unread count
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications(true)
    }, 45000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Deteksi klik di luar popover untuk menutup otomatis
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Tandai satu notifikasi sudah dibaca
  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation()
    try {
      await api.markNotificationAsRead(id).catch(() => {})
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, read_at: new Date().toISOString() } : item
        )
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {
      // Tetap update optimistik di UI
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, read_at: new Date().toISOString() } : item
        )
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
  }

  // Tandai semua notifikasi sudah dibaca
  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead().catch(() => {})
    } catch {
      // Ignored
    }
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, read_at: new Date().toISOString() }))
    )
    setUnreadCount(0)
  }

  // Hapus notifikasi
  const handleDelete = async (id, isUnread, e) => {
    if (e) e.stopPropagation()
    try {
      await api.deleteNotification(id).catch(() => {})
    } catch {
      // Ignored
    }
    setNotifications((prev) => prev.filter((item) => item.id !== id))
    if (isUnread) {
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
    setTotalCount((prev) => Math.max(0, prev - 1))
  }

  // Navigasi saat notifikasi diklik
  const handleItemClick = (item) => {
    if (!item.read_at) {
      handleMarkAsRead(item.id)
    }
    setIsOpen(false)

    // Tentukan URL tujuan berdasarkan payload data notifikasi
    if (item.data?.action_url) {
      navigate(item.data.action_url)
      return
    }

    const docId = item.data?.document_id
    const docType = item.data?.document_type || ''
    const catType = item.data?.category_type || ''
    const docNumber = item.data?.document_number || ''

    if (docId) {
      if (docType === 'ho02') {
        navigate(`/bast-aplikasi/${docId}`)
      } else if (docType === 'ho01' || catType === 'bast' || docNumber.startsWith('BAST')) {
        navigate(`/bast-barang/${docId}`)
      } else if (docType.startsWith('dsp') || catType === 'pemusnahan' || docNumber.startsWith('BA-TI')) {
        navigate(`/pemusnahan/${docId}/review`)
      } else {
        navigate(`/documents/${docId}`)
      }
    }
  }

  // Helper render ikon notifikasi berdasarkan tipe
  const renderIcon = (type, data) => {
    const text = (type || '' + (data?.title || '')).toLowerCase()

    if (text.includes('approved') || text.includes('setuju') || text.includes('selesai')) {
      return (
        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      )
    }
    if (text.includes('reject') || text.includes('tolak') || text.includes('batal')) {
      return (
        <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
      )
    }
    if (text.includes('sign') || text.includes('ttd') || text.includes('tanda tangan')) {
      return (
        <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
          <PenTool className="w-4 h-4" />
        </div>
      )
    }
    return (
      <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
        <FileText className="w-4 h-4" />
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Tombol Lonceng Notifikasi */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Buka Notifikasi"
        aria-expanded={isOpen}
        className={`relative p-2.5 rounded-full transition-all duration-200 outline-none ${
          isOpen 
            ? 'bg-blue-50 text-blue-700 ring-2 ring-blue-500/20' 
            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
        }`}
      >
        <Bell className="w-5 h-5" />

        {/* Badge Unread Count */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-white text-[10px] font-bold leading-none shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-400 animate-ping opacity-75" />
          </span>
        )}
      </button>

      {/* Popover Panel Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/80 z-50 overflow-hidden transform transition-all duration-200 animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold tracking-wide">Notifikasi</h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-rose-500/90 text-white text-[10px] font-semibold rounded-full">
                  {unreadCount} baru
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => fetchNotifications(false)}
                title="Muat ulang notifikasi"
                className={`p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors ${
                  isRefreshing ? 'animate-spin' : ''
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  title="Tandai semua telah dibaca"
                  className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Baca Semua</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Tab: Semua & Belum Dibaca */}
          <div className="flex items-center border-b border-slate-100 bg-slate-50/70 px-4 py-2 text-xs">
            <div className="flex items-center gap-2 bg-slate-200/60 p-0.5 rounded-lg w-full">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`flex-1 py-1 rounded-md font-semibold transition-all text-center ${
                  filter === 'all'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('unread')}
                className={`flex-1 py-1 rounded-md font-semibold transition-all text-center ${
                  filter === 'unread'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Belum Dibaca ({unreadCount})
              </button>
            </div>
          </div>

          {/* Body: Daftar Notifikasi */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-8 text-center space-y-3">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent" />
                <p className="text-xs text-slate-500">Memuat notifikasi...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 px-6 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <Inbox className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-800">Tidak ada notifikasi</h4>
                <p className="text-xs text-slate-500 mt-1">
                  {filter === 'unread' 
                    ? 'Semua notifikasi sudah Anda baca.' 
                    : 'Belum ada aktivitas atau pemberitahuan baru.'}
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const isUnread = !item.read_at
                const title = item.data?.title || 'Pemberitahuan Sistem'
                const message = item.data?.message || item.data?.keterangan || '-'
                const docNumber = item.data?.document_number || item.data?.nomor_dokumen || ''
                const sender = item.data?.sender_name || item.data?.nama_pemohon || ''

                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`relative p-3.5 transition-colors cursor-pointer group flex items-start gap-3 ${
                      isUnread 
                        ? 'bg-blue-50/60 hover:bg-blue-50/90' 
                        : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    {/* Unread Indicator Bar */}
                    {isUnread && (
                      <span className="absolute left-0 top-3.5 bottom-3.5 w-1 bg-blue-600 rounded-r-full" />
                    )}

                    {/* Icon */}
                    {renderIcon(item.type, item.data)}

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4 className={`text-xs tracking-tight truncate ${
                          isUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-800'
                        }`}>
                          {title}
                        </h4>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap flex items-center gap-1 shrink-0">
                          <Clock className="w-2.5 h-2.5" />
                          {item.time_ago || (item.created_at ? new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '')}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                        {message}
                      </p>

                      {/* Chips / Sub-info */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                        {docNumber && (
                          <span className="inline-flex items-center font-mono font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {docNumber}
                          </span>
                        )}
                        {sender && (
                          <span className="text-slate-500 font-medium truncate max-w-[140px]">
                            oleh {sender}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons (hover or mobile visible) */}
                    <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isUnread && (
                        <button
                          type="button"
                          onClick={(e) => handleMarkAsRead(item.id, e)}
                          title="Tandai dibaca"
                          className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-100/80 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleDelete(item.id, isUnread, e)}
                        title="Hapus notifikasi"
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-100/80 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>SiPaKAI Notification Center</span>
            <span className="text-[10px] text-slate-400">Pemberitahuan Otomatis</span>
          </div>
        </div>
      )}
    </div>
  )
}
