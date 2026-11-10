import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  ShieldCheck,
  CheckCheck,
  Trash2,
  Inbox,
  RefreshCw,
  FileText,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';

export default function NotificationDropdown() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread'
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await api.getNotifications({ per_page: 30 });
      if (res && res.notifications) {
        setNotifications(res.notifications);
        setUnreadCount(res.unread_count || 0);
        setTotalCount(res.total_count || res.notifications.length);
      }
    } catch (err) {
      // If unauthorized or network error, silently fail
      console.warn('Gagal memuat notifikasi:', err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Polling & focus auto-refresh
  useEffect(() => {
    fetchNotifications(false);

    const intervalId = setInterval(() => {
      fetchNotifications(true);
    }, 20000); // refresh every 20 seconds

    const handleFocus = () => {
      fetchNotifications(true);
    };
    const handleCustomRefresh = () => {
      fetchNotifications(true);
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('sipakai:notification_refresh', handleCustomRefresh);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('sipakai:notification_refresh', handleCustomRefresh);
    };
  }, [fetchNotifications]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Gagal menandai notifikasi dibaca:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Gagal menandai semua dibaca:', err);
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.deleteNotification(id);
      const target = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (target && !target.read_at) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      setTotalCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Gagal menghapus notifikasi:', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    // 1. Mark as read if not already read
    if (!notif.read_at) {
      handleMarkAsRead(notif.id);
    }

    setIsOpen(false);

    // 2. Navigate based on notification data
    const docId = notif.data?.document_id;
    const actionType = notif.data?.action_type;

    if (docId) {
      if (actionType === 'need_approval') {
        // Navigasi ke halaman review persetujuan
        navigate(`/pemusnahan/${docId}/review`);
      } else {
        // Navigasi ke pratinjau dokumen / daftar dokumen
        navigate(`/pemusnahan/${docId}/review`);
      }
    }
  };

  const getActionConfig = (actionType) => {
    switch (actionType) {
      case 'need_approval':
        return {
          icon: Clock,
          color: 'text-amber-600 bg-amber-50 border-amber-200',
          badgeText: 'Persetujuan',
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
        };
      case 'approved':
        return {
          icon: CheckCircle2,
          color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
          badgeText: 'Disetujui',
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        };
      case 'completed':
        return {
          icon: ShieldCheck,
          color: 'text-blue-600 bg-blue-50 border-blue-200',
          badgeText: 'Selesai',
          badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
        };
      case 'rejected':
        return {
          icon: XCircle,
          color: 'text-rose-600 bg-rose-50 border-rose-200',
          badgeText: 'Ditolak',
          badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
        };
      case 'forwarded':
        return {
          icon: ArrowRight,
          color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
          badgeText: 'Diteruskan',
          badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        };
      default:
        return {
          icon: FileText,
          color: 'text-slate-600 bg-slate-50 border-slate-200',
          badgeText: 'Informasi',
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        };
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.read_at;
    return true;
  });

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Buka notifikasi"
        className={`relative p-2.5 rounded-xl transition-all duration-200 ${
          isOpen
            ? 'bg-blue-50 text-blue-700 shadow-sm'
            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
        }`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1.5 bg-rose-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-sm animate-in zoom-in-50">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-[380px] sm:w-[440px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
                <Bell className="w-4 h-4 text-blue-300" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight">Notifikasi</h3>
                <p className="text-[11px] text-slate-300">
                  {unreadCount > 0 ? `${unreadCount} pemberitahuan belum dibaca` : 'Semua telah dibaca'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => fetchNotifications(true)}
                disabled={isRefreshing}
                title="Segarkan notifikasi"
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/10"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Tandai Semua Dibaca</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-slate-100 bg-slate-50/70 px-4 pt-2 gap-2 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`pb-2.5 px-3 border-b-2 transition-all ${
                activeTab === 'all'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Semua ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('unread')}
              className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
                activeTab === 'unread'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Belum Dibaca</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 text-[10px] rounded-full font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* List Content */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                <span className="text-xs">Memuat notifikasi...</span>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="py-12 px-6 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-3 shadow-inner">
                  <Inbox className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold text-slate-700">Tidak ada notifikasi</h4>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[240px]">
                  {activeTab === 'unread'
                    ? 'Bagus sekali! Semua notifikasi telah selesai Anda baca.'
                    : 'Pemberitahuan aktivitas dokumen dan giliran persetujuan Anda akan muncul di sini.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isUnread = !notif.read_at;
                const config = getActionConfig(notif.data?.action_type);
                const IconComponent = config.icon;

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-4 transition-all flex items-start gap-3.5 cursor-pointer relative group ${
                      isUnread
                        ? 'bg-blue-50/40 hover:bg-blue-50/80 border-l-4 border-l-blue-600'
                        : 'bg-white hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Icon Category */}
                    <div className={`p-2.5 rounded-xl border shrink-0 ${config.color}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${config.badgeClass}`}>
                          {config.badgeText}
                        </span>
                        {notif.data?.document_number && (
                          <span className="text-[11px] font-mono font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {notif.data.document_number}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 ml-auto">
                          {notif.time_ago || 'Baru saja'}
                        </span>
                      </div>

                      <h4 className={`text-xs ${isUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'} leading-snug line-clamp-2`}>
                        {notif.data?.title || 'Pemberitahuan Dokumen'}
                      </h4>

                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">
                        {notif.data?.message}
                      </p>

                      {notif.data?.actor_name && (
                        <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                          <span>Oleh:</span>
                          <span className="text-slate-600 font-semibold">{notif.data.actor_name}</span>
                        </div>
                      )}
                    </div>

                    {/* Right Action Buttons */}
                    <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isUnread && (
                        <button
                          type="button"
                          onClick={(e) => handleMarkAsRead(notif.id, e)}
                          title="Tandai sudah dibaca"
                          className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleDelete(notif.id, e)}
                        title="Hapus notifikasi"
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Unread indicator dot */}
                    {isUnread && (
                      <span className="absolute top-4 right-3 w-2 h-2 rounded-full bg-blue-600 group-hover:hidden" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Sistem Notifikasi Dokumen KAI</span>
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
              Live Sync
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
