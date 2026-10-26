import React, { useRef, useEffect, useState } from 'react';
import { PenTool, UploadCloud, UserCheck, Eraser, CheckCircle2, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { api } from '../services/api';

/**
 * SignatureSelector Component
 * Menyediakan 3 metode tanda tangan berstandar KAI:
 * 1. 'draw'   - Goresan langsung di atas kanvas
 * 2. 'upload' - Unggah berkas gambar (PNG/JPG)
 * 3. 'saved'  - Tanda tangan resmi yang tersimpan di profil akun
 */
export default function SignatureSelector({
  // Mode (mendukung mode maupun signatureMode)
  mode: propMode,
  signatureMode,
  setMode: propSetMode,
  setSignatureMode,

  // Canvas
  canvasRef,

  // Status goresan (mendukung hasDrawn maupun hasDrawnSignature)
  hasDrawn: propHasDrawn,
  hasDrawnSignature,
  setHasDrawn: propSetHasDrawn,
  setHasDrawnSignature,

  // Berkas unggah (mendukung selectedFile maupun selectedSignatureFile)
  selectedFile: propSelectedFile,
  selectedSignatureFile,
  setSelectedFile: propSetSelectedFile,
  setSelectedSignatureFile,

  // Status tanda tangan akun tersimpan
  hasServerSignature = false,
  serverSignatureUrl = '',
  user = null,
  error = null,
}) {
  // Resolve mode & setters with robust fallbacks
  const currentMode = propMode || signatureMode || 'draw';
  const handleSetMode = (newMode) => {
    if (typeof propSetMode === 'function') propSetMode(newMode);
    if (typeof setSignatureMode === 'function') setSignatureMode(newMode);
  };

  const currentHasDrawn = propHasDrawn !== undefined ? propHasDrawn : (hasDrawnSignature || false);
  const handleSetHasDrawn = (val) => {
    if (typeof propSetHasDrawn === 'function') propSetHasDrawn(val);
    if (typeof setHasDrawnSignature === 'function') setHasDrawnSignature(val);
  };

  const currentFile = propSelectedFile || selectedSignatureFile || null;
  const handleSetFile = (file) => {
    if (typeof propSetSelectedFile === 'function') propSetSelectedFile(file);
    if (typeof setSelectedSignatureFile === 'function') setSelectedSignatureFile(file);
  };

  const [filePreview, setFilePreview] = useState(null);
  const isDrawingRef = useRef(false);

  // Sync file preview whenever currentFile changes
  useEffect(() => {
    if (currentFile && currentFile instanceof Blob) {
      const url = URL.createObjectURL(currentFile);
      setFilePreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setFilePreview(null);
    }
  }, [currentFile]);

  // Canvas drawing handlers
  const getCanvasCoords = (e) => {
    const canvas = canvasRef?.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
    const clientY = e.clientY || e.touches?.[0]?.clientY || 0;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDrawing = (e) => {
    const canvas = canvasRef?.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCanvasCoords(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#003580';
    isDrawingRef.current = true;
    handleSetHasDrawn(true);
  };

  const draw = (e) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef?.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCanvasCoords(e);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef?.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    handleSetHasDrawn(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        alert('Format berkas harus berupa gambar PNG atau JPG/JPEG.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran berkas maksimal 5 MB.');
        return;
      }
      handleSetFile(file);
    }
  };

  // Cek apakah akun memiliki TTD
  const hasSavedSig = hasServerSignature || Boolean(user?.has_signature) || Boolean(user?.signature_path);
  const signatureImgSrc = serverSignatureUrl || api.getSignatureUrl(true);

  return (
    <div className="space-y-3">
      {/* 3 Tab Mode Tanda Tangan */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-slate-800">
            Pilihan Metode Tanda Tangan <span className="text-rose-500">*</span>
          </label>
        </div>
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200 text-xs font-bold">
          {/* Tab 1: Goresan */}
          <button
            type="button"
            onClick={() => handleSetMode('draw')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition-all ${
              currentMode === 'draw'
                ? 'bg-white text-[#003580] shadow-xs font-extrabold border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <PenTool className="w-3.5 h-3.5 shrink-0 text-[#f05a22]" />
            <span className="truncate">Goresan</span>
          </button>

          {/* Tab 2: Upload */}
          <button
            type="button"
            onClick={() => handleSetMode('upload')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition-all ${
              currentMode === 'upload'
                ? 'bg-white text-[#003580] shadow-xs font-extrabold border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5 shrink-0 text-blue-600" />
            <span className="truncate">Upload Gambar</span>
          </button>

          {/* Tab 3: Saved */}
          <button
            type="button"
            onClick={() => handleSetMode('saved')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition-all ${
              currentMode === 'saved'
                ? 'bg-white text-[#003580] shadow-xs font-extrabold border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
            <span className="truncate">TTD Akun</span>
          </button>
        </div>
      </div>

      {/* Konten Sesuai Pilihan */}
      {/* 1. GORESAN KANVAS */}
      {currentMode === 'draw' && (
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-700">
              Goreskan tanda tangan Anda pada bidang di bawah:
            </span>
            <button
              type="button"
              onClick={clearCanvas}
              className="text-[11px] text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 px-2 py-0.5 rounded hover:bg-rose-50 transition-colors"
            >
              <Eraser className="w-3 h-3" /> Bersihkan
            </button>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-xl overflow-hidden bg-white shadow-inner relative group">
            <canvas
              ref={canvasRef}
              width={480}
              height={140}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-32 cursor-crosshair touch-none bg-white block"
            />
            {!currentHasDrawn && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 gap-1 bg-slate-50/40">
                <PenTool className="w-5 h-5 text-slate-300" />
                <span className="text-xs font-medium">Klik dan goreskan tanda tangan digital di sini</span>
              </div>
            )}
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-500">
            <span>
              {currentHasDrawn ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Tanda tangan tergores di kanvas
                </span>
              ) : (
                <span className="text-amber-700 font-medium">
                  * Wajib menggoreskan tanda tangan (tidak boleh kosong)
                </span>
              )}
            </span>
            <span>Warna tinta: Biru Korporat KAI (#003580)</span>
          </div>
        </div>
      )}

      {/* 2. UPLOAD GAMBAR */}
      {currentMode === 'upload' && (
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-700">
              Pilih berkas tanda tangan digital (PNG transparan disarankan):
            </span>
          </div>

          {filePreview ? (
            <div className="border-2 border-emerald-300 bg-emerald-50/40 rounded-xl p-3 flex flex-col items-center justify-center space-y-2">
              <div className="h-24 flex items-center justify-center p-2 bg-white rounded-lg w-full border border-dashed border-emerald-200">
                <img
                  src={filePreview}
                  alt="Pratinjau Berkas TTD"
                  className="max-h-20 object-contain mx-auto"
                />
              </div>
              <div className="flex items-center justify-between w-full pt-1.5 border-t border-emerald-200 text-xs">
                <span className="text-emerald-800 font-bold flex items-center gap-1 truncate max-w-[240px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  {currentFile?.name}
                </span>
                <label className="text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer underline">
                  Ganti Berkas
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          ) : (
            <label className="border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/30 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all">
              <UploadCloud className="w-8 h-8 text-slate-400 mb-1" />
              <span className="text-xs font-bold text-slate-700">
                Klik untuk Memilih File Tanda Tangan
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5">
                Mendukung format PNG / JPG (Maksimal 5 MB)
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}

          <p className="text-[10px] text-slate-500">
            * File gambar akan langsung disinkronkan dan disematkan ke lembar PDF dokumen resmi.
          </p>
        </div>
      )}

      {/* 3. TTD AKUN TERSIMPAN */}
      {currentMode === 'saved' && (
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-700">
              Spesimen Tanda Tangan Resmi Akun Anda:
            </span>
          </div>

          {hasSavedSig ? (
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/80 flex flex-col items-center justify-center space-y-2">
              <div className="h-24 flex items-center justify-center p-2 bg-white rounded-lg w-full border border-dashed border-slate-200 shadow-2xs">
                <img
                  src={signatureImgSrc}
                  alt="Tanda Tangan Akun"
                  className="max-h-20 object-contain mx-auto"
                />
              </div>
              <div className="flex items-center justify-between w-full pt-1 border-t border-slate-200 text-xs">
                <span className="text-emerald-800 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Tanda Tangan Terverifikasi di Profil
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {user?.name || 'Pejabat Penandatangan'}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-start gap-2 text-amber-900 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Belum Ada Tanda Tangan Tersimpan di Akun</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Profil akun Anda saat ini belum memiliki spesimen tanda tangan digital di server.
                Silakan beralih ke tab <strong>Goresan</strong> atau <strong>Upload Gambar</strong> untuk membubuhkan tanda tangan.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Global Validation Error Message */}
      {error && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
