import { useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import DashboardPage from './pages/DashboardPage'
import PemusnahanListPage from './pages/PemusnahanListPage'
import PemusnahanFormPage from './pages/PemusnahanFormPage'
import PenghapusanFormPage from './pages/PenghapusanFormPage'
import PemusnahanReviewPage from './pages/PemusnahanReviewPage'
import PengaturanPage from './pages/PengaturanPage'
import ReviewModal from './components/ReviewModal'
import DocumentCreateModal from './components/DocumentCreateModal'
import DocumentDetailModal from './components/DocumentDetailModal'
import Login from './components/Login'
import { api, fallbackDocuments, getToken, setToken } from './services/api'

const formatJabatan = (jabatan) => {
  if (!jabatan) return ''
  if (typeof jabatan === 'string') return jabatan
  if (typeof jabatan === 'object') return jabatan.nama || jabatan.name || jabatan.kode || ''
  return String(jabatan)
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userProfile, setUserProfile] = useState(null)
  const [documents, setDocuments] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedReviewDoc, setSelectedReviewDoc] = useState(null)
  const [selectedDetailDocId, setSelectedDetailDocId] = useState(null)
  const [createModuleType, setCreateModuleType] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notification, setNotification] = useState(null)

  const showToast = (message) => {
    setNotification(message)
    setTimeout(() => {
      setNotification(null)
    }, 4000)
  }

  // Load documents for current active persona from backend
  const loadDocuments = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true)
    try {
      const res = await api.getInbox().catch(() => api.getDocuments())
      if (res.data && res.data.length > 0) {
        const mapped = res.data.map((doc) => ({
          id: doc.id,
          number: doc.number,
          inventory_code: doc.data?.id_aset || doc.data?.no_inventaris || `ID-${doc.id}`,
          type: doc.type,
          category_label:
            doc.type === 'dsp01'
              ? 'Pemusnahan Aset TI (Scrap)'
              : doc.type === 'dsp02'
              ? 'Berita Acara Pemusnahan'
              : doc.type === 'dsp03'
              ? 'Penghapusan Switch Core'
              : doc.type === 'ho01'
              ? 'BAST Laptop Operasional'
              : 'BAST User Aplikasi',
          category_type: doc.type.startsWith('dsp') ? 'pemusnahan' : 'bast',
          requester_name: doc.requester?.name || doc.requester?.nama || 'Petugas TI',
          requester_unit: formatJabatan(doc.requester?.jabatan) || doc.requester?.unit_kerja || 'DAOP 1',
          date: new Date(doc.submitted_at || doc.created_at).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
          book_value: doc.data?.nilai_buku
            ? `Rp ${Number(doc.data.nilai_buku).toLocaleString('id-ID')}`
            : 'Rp 148.500.000',
          status: doc.status,
          status_label: 'Menunggu Disposisi',
        }))
        setDocuments(mapped)
      } else {
        setDocuments(fallbackDocuments)
      }
    } catch {
      setDocuments(fallbackDocuments)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();
      if (token) {
        try {
          const res = await api.getMe();
          const uName = res.user.name || res.user.nama || 'Pengguna';
          setUserProfile({
            id: res.user.id,
            name: uName,
            nip: res.user.nip,
            roleLabel: formatJabatan(res.user.jabatan) || res.user.role || 'Staff',
            location: res.user.unit_kerja,
            role: res.user.role,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(uName)}&background=0b2046&color=fff`,
          });
          setIsAuthenticated(true);
        } catch (err) {
          setToken(null);
          setIsAuthenticated(false);
        }
      }
    };
    initAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadDocuments();
    }
  }, [isAuthenticated, loadDocuments]);

  const handleLoginSuccess = (user, token) => {
    const uName = user.name || user.nama || 'Pengguna';
    setUserProfile({
      id: user.id,
      name: uName,
      nip: user.nip,
      roleLabel: formatJabatan(user.jabatan) || user.role || 'Staff',
      location: user.unit_kerja,
      role: user.role,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(uName)}&background=0b2046&color=fff`,
    });
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {}
    setIsAuthenticated(false);
    setUserProfile(null);
  };

  const handleOpenModule = (moduleId) => {
    setCreateModuleType(moduleId)
  }

  const handleDocumentCreated = (msg) => {
    setCreateModuleType(null)
    showToast(msg)
    loadDocuments()
  }

  const handleReviewDocument = (doc) => {
    setSelectedReviewDoc(doc)
  }

  const handleViewDocument = (doc) => {
    setSelectedDetailDocId(doc.id)
  }

  const handleDocumentAction = async (docId, action, notes, nextApproverId) => {
    setIsSubmitting(true)
    try {
      const res = await api.actionDocument(docId, {
        action,
        notes,
        next_approver_id: nextApproverId,
      })
      setDocuments((prev) => prev.filter((d) => d.id !== docId))
      setSelectedReviewDoc(null)
      showToast(res.message || 'Tindakan pengesahan berhasil diproses dan dicatat.')
      loadDocuments()
    } catch (err) {
      showToast(err.message || 'Terjadi kesalahan saat memproses')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} onGuestBook={() => alert('Buku Tamu belum diimplementasi')} />
  }

  return (
    <BrowserRouter>
      {/* Toast Notification Alert */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center justify-between shadow-lg animate-in fade-in">
          <span>{notification}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-emerald-600 hover:text-emerald-900 ml-3"
          >
            ✕
          </button>
        </div>
      )}

      <Routes>
        <Route path="/" element={<MainLayout user={userProfile} onLogout={handleLogout} />}>
          <Route index element={
            <DashboardPage 
              user={userProfile}
              documents={documents}
              isLoading={isLoading}
              loadDocuments={loadDocuments}
              handleOpenModule={handleOpenModule}
              handleReviewDocument={handleReviewDocument}
              handleViewDocument={handleViewDocument}
            />
          } />
          <Route path="pemusnahan" element={
            <PemusnahanListPage 
              user={userProfile} 
              onReviewDocument={handleReviewDocument} 
              onViewDocument={handleViewDocument} 
            />
          } />
          <Route path="pemusnahan/create" element={<PemusnahanFormPage user={userProfile} />} />
          <Route path="pemusnahan/:id/review" element={<PemusnahanReviewPage user={userProfile} />} />
          <Route path="pemusnahan/review/:id" element={<PemusnahanReviewPage user={userProfile} />} />
          <Route path="pemusnahan/:id" element={<PemusnahanReviewPage user={userProfile} />} />
          <Route path="penghapusan" element={<PenghapusanFormPage user={userProfile} />} />
          <Route path="penghapusan/create" element={<PenghapusanFormPage user={userProfile} />} />
          <Route path="pengaturan" element={<PengaturanPage user={userProfile} onProfileUpdated={loadDocuments} />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Legacy Modals for other modules */}
      {selectedReviewDoc && (
        <ReviewModal
          doc={selectedReviewDoc}
          onClose={() => setSelectedReviewDoc(null)}
          onAction={handleDocumentAction}
          isSubmitting={isSubmitting}
          user={userProfile}
        />
      )}

      {createModuleType && (
        <DocumentCreateModal
          type={createModuleType}
          currentUser={userProfile}
          onClose={() => setCreateModuleType(null)}
          onSuccess={handleDocumentCreated}
        />
      )}

      {selectedDetailDocId && (
        <DocumentDetailModal
          docId={selectedDetailDocId}
          onClose={() => setSelectedDetailDocId(null)}
          onReview={handleReviewDocument}
          user={userProfile}
        />
      )}
    </BrowserRouter>
  )
}
