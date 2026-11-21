import { useCallback, useEffect, useRef, useState } from 'react'
import {
  X,
  PenLine,
  Upload,
  Trash2,
  Save,
  Eraser,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
  FileImage,
} from 'lucide-react'
import { api } from '../services/api'

const CANVAS_WIDTH = 900
const CANVAS_HEIGHT = 240

export default function DefaultOfficerSignatureModal({
  isOpen,
  onClose,
  onSaved,
}) {
  const canvasRef = useRef(null)
  const drawingRef = useRef(false)
  const fileRef = useRef(null)
  const savedUrlRef = useRef(null)
  const uploadUrlRef = useRef(null)
  const closeTimerRef = useRef(null)

  const [mode, setMode] = useState('draw')
  const [hasDrawing, setHasDrawing] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [savedPreview, setSavedPreview] = useState('')
  const [uploadPreview, setUploadPreview] = useState('')
  const [hasSavedSignature, setHasSavedSignature] = useState(false)
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawingRef.current = false
    setHasDrawing(false)
  }, [])

  const clearUpload = useCallback(() => {
    if (uploadUrlRef.current) URL.revokeObjectURL(uploadUrlRef.current)
    uploadUrlRef.current = null
    setUploadPreview('')
    setSelectedFile(null)
    if (fileRef.current) fileRef.current.value = ''
  }, [])

  const clearSavedPreview = useCallback(() => {
    if (savedUrlRef.current) URL.revokeObjectURL(savedUrlRef.current)
    savedUrlRef.current = null
    setSavedPreview('')
  }, [])

  const loadSavedSignature = useCallback(async () => {
    try {
      const result = await api.getDefaultOfficerSignature()
      const exists = Boolean(result?.has_signature)
      setHasSavedSignature(exists)

      if (!exists) {
        clearSavedPreview()
        return
      }

      const url = await api.getDefaultOfficerSignatureBlob()
      if (url) {
        clearSavedPreview()
        savedUrlRef.current = url
        setSavedPreview(url)
      }
    } catch (err) {
      setError(err.message || 'Gagal memuat tanda tangan tersimpan.')
    }
  }, [clearSavedPreview])

  useEffect(() => {
    if (!isOpen) return

    setError('')
    setMessage('')
    setConfirmDelete(false)
    setMode('draw')
    clearUpload()
    clearCanvas()
    loadSavedSignature()

    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
      clearSavedPreview()
      if (uploadUrlRef.current) URL.revokeObjectURL(uploadUrlRef.current)
      uploadUrlRef.current = null
    }
  }, [isOpen, clearUpload, clearCanvas, clearSavedPreview, loadSavedSignature])

  const getPosition = (event) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()

    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    }
  }

  const startDrawing = (event) => {
    if (loading || mode !== 'draw') return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const { x, y } = getPosition(event)

    drawingRef.current = true
    setHasDrawing(true)
    setError('')
    setMessage('')

    if (event.pointerId !== undefined) {
      canvas.setPointerCapture(event.pointerId)
    }

    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#10264b'
  }

  const draw = (event) => {
    if (!drawingRef.current || mode !== 'draw') return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const { x, y } = getPosition(event)

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    drawingRef.current = false
  }

  const hasCanvasSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return false

    // Periksa piksel canvas langsung; hasDrawing menjadi fallback
    // untuk mencegah coretan yang terlihat dianggap kosong.
    const ctx = canvas.getContext('2d')
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] > 0) return true
    }

    return hasDrawing
  }

  const handleFile = (event) => {
    const file = event.target.files?.[0]
    setError('')
    setMessage('')

    if (!file) {
      setSelectedFile(null)
      setUploadPreview('')
      return
    }

    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      setError('File harus berupa PNG atau JPG.')
      event.target.value = ''
      setSelectedFile(null)
      setUploadPreview('')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Ukuran file maksimal 2 MB.')
      event.target.value = ''
      setSelectedFile(null)
      setUploadPreview('')
      return
    }

    if (uploadUrlRef.current) URL.revokeObjectURL(uploadUrlRef.current)

    const url = URL.createObjectURL(file)
    uploadUrlRef.current = url
    setSelectedFile(file)
    setUploadPreview(url)
  }

  const handleSave = async () => {
    setError('')
    setMessage('')

    if (mode === 'draw' && !hasCanvasSignature()) {
      setError('Gambar tanda tangan terlebih dahulu.')
      return
    }

    if (mode === 'upload' && !selectedFile) {
      setError('Pilih file PNG/JPG terlebih dahulu.')
      return
    }

    setLoading(true)

    try {
      let result

      if (mode === 'draw') {
        const signatureData = canvasRef.current.toDataURL('image/png')
        result = await api.saveDefaultOfficerSignature({
          signature_data: signatureData,
        })
      } else {
        const formData = new FormData()
        formData.append('signature', selectedFile)
        result = await api.saveDefaultOfficerSignature(formData)
      }

      setMessage(result?.message || 'Tanda tangan berhasil disimpan.')
      setHasSavedSignature(true)
      clearUpload()
      clearCanvas()
      await loadSavedSignature()
      onSaved?.()

      closeTimerRef.current = setTimeout(() => {
        onClose?.()
      }, 700)
    } catch (err) {
      setError(err.message || 'Gagal menyimpan tanda tangan.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    setError('')
    setMessage('')

    try {
      await api.deleteDefaultOfficerSignature()
      setHasSavedSignature(false)
      clearSavedPreview()
      clearUpload()
      clearCanvas()
      setConfirmDelete(false)
      setMessage('Tanda tangan default berhasil dihapus.')
      onSaved?.()
    } catch (err) {
      setError(err.message || 'Gagal menghapus tanda tangan.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-5">
      <section className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <header className="flex items-start justify-between border-b border-slate-100 px-6 py-5 sm:px-7">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-orange-600">
              Pengaturan Sistem
            </p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[#10264b] sm:text-[26px]">
              Tanda Tangan Petugas Default
            </h2>
            <p className="mt-1.5 text-base text-slate-500">
              Atur tanda tangan untuk proses Auto Checkout.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pengaturan"
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 active:scale-95"
          >
            <X size={23} />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5 sm:px-7">
          <div className="rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-3.5 text-[15px] leading-6 text-blue-950">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
              <p>
                Tanda tangan ini digunakan untuk Auto Checkout. Checkout manual
                tetap memakai tanda tangan Satpam yang mengonfirmasi.
              </p>
            </div>
          </div>

          {hasSavedSignature && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
              <div className="mb-3 flex items-center gap-2 text-base font-bold text-emerald-800">
                <CheckCircle2 size={20} />
                Tanda tangan default tersimpan
              </div>
              {savedPreview ? (
                <div className="flex min-h-28 items-center justify-center rounded-lg border border-emerald-100 bg-white p-3">
                  <img
                    src={savedPreview}
                    alt="TTD default tersimpan"
                    className="max-h-28 max-w-full object-contain"
                  />
                </div>
              ) : (
                <p className="text-sm text-emerald-800">
                  Tanda tangan tersimpan. Memuat pratinjau…
                </p>
              )}
              <button
                type="button"
                disabled={loading}
                onClick={() => setConfirmDelete(true)}
                className="mt-3 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 size={17} />
                Hapus tanda tangan
              </button>
            </div>
          )}

          <div>
            <h3 className="mb-2.5 text-base font-bold text-slate-800">
              Metode tanda tangan
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setMode('draw')
                  setError('')
                  setMessage('')
                }}
                className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-3 py-3 text-[15px] font-bold transition-all active:scale-[0.98] ${
                  mode === 'draw'
                    ? 'border-[#10264b] bg-blue-50 text-[#10264b] shadow-sm ring-2 ring-blue-100'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <PenLine size={19} />
                Gambar Manual
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('upload')
                  setError('')
                  setMessage('')
                }}
                className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-3 py-3 text-[15px] font-bold transition-all active:scale-[0.98] ${
                  mode === 'upload'
                    ? 'border-[#10264b] bg-blue-50 text-[#10264b] shadow-sm ring-2 ring-blue-100'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Upload size={19} />
                Upload Gambar
              </button>
            </div>
          </div>

          {mode === 'draw' ? (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-[15px] font-semibold text-slate-700">
                  Area tanda tangan
                </label>
                <button
                  type="button"
                  onClick={() => {
                    clearCanvas()
                    setError('')
                    setMessage('')
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
                >
                  <Eraser size={16} />
                  Bersihkan
                </button>
              </div>
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
                onPointerCancel={stopDrawing}
                onPointerLeave={stopDrawing}
                className="h-44 w-full touch-none rounded-xl border-2 border-dashed border-slate-300 bg-white transition-colors hover:border-slate-400"
              />
              <p className="mt-2 text-sm text-slate-500">
                Gunakan mouse, stylus, atau jari untuk menggambar.
              </p>
            </div>
          ) : (
            <div>
              <label className="mb-2 block text-[15px] font-semibold text-slate-700">
                Unggah gambar tanda tangan
              </label>
              <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 px-4 py-6 text-center text-slate-600 transition hover:border-blue-400 hover:bg-blue-50/60">
                <Upload size={28} className="text-slate-500" />
                <span className="text-base font-semibold">
                  {selectedFile ? 'Pilih file lain' : 'Klik untuk memilih file'}
                </span>
                <span className="text-sm text-slate-500">
                  PNG atau JPG · Maksimal 2 MB
                </span>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={handleFile}
                />
              </label>

              {selectedFile && uploadPreview && (
                <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                  <div className="mb-2 flex items-center justify-between gap-2 text-sm">
                    <span className="inline-flex min-w-0 items-center gap-2 font-semibold text-slate-700">
                      <FileImage size={17} />
                      <span className="truncate">{selectedFile.name}</span>
                    </span>
                    <button
                      type="button"
                      onClick={clearUpload}
                      className="shrink-0 text-sm font-semibold text-red-600 hover:text-red-700"
                    >
                      Hapus pilihan
                    </button>
                  </div>
                  <div className="flex min-h-28 items-center justify-center rounded-lg bg-slate-50 p-2">
                    <img
                      src={uploadPreview}
                      alt="Pratinjau file yang akan diunggah"
                      className="max-h-28 max-w-full object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[15px] text-red-700"
            >
              {error}
            </div>
          )}
          {message && (
            <div
              role="status"
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[15px] text-emerald-700"
            >
              {message}
            </div>
          )}
        </div>

        <footer className="flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-white px-6 py-4 sm:px-7">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-xl border border-slate-200 px-5 py-2.5 text-[15px] font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-[0.98]"
          >
            Tutup
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleSave}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#10264b] px-5 py-2.5 text-[15px] font-bold text-white shadow-sm transition hover:bg-[#183967] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {loading ? 'Menyimpan…' : 'Simpan TTD Default'}
          </button>
        </footer>

        {confirmDelete && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px] animate-in fade-in duration-150">
            <div className="w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-5 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
                <Trash2 size={21} />
              </div>
              <h3 className="text-lg font-extrabold text-[#10264b]">
                Hapus tanda tangan?
              </h3>
              <p className="mt-2 text-[15px] leading-6 text-slate-600">
                Tanda tangan default tidak tersedia untuk Auto Checkout
                berikutnya. Arsip kunjungan yang sudah selesai tetap
                dipertahankan.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setConfirmDelete(false)}
                  className="min-h-10 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleDelete}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {loading && (
                    <LoaderCircle size={16} className="animate-spin" />
                  )}
                  Ya, hapus
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
