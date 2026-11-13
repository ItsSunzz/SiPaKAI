import React, { useState, useRef } from 'react';
import { Download, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X, FileUp } from 'lucide-react';
import { api } from '../services/api';

const MODULE_NAMES = {
  assets: 'Master Aset TI',
  visitors: 'Buku Tamu',
  users: 'Manajemen Pengguna',
  positions: 'Master Jabatan',
};

export default function MasterImportActions({
  module = 'users', // 'assets' | 'visitors' | 'users' | 'positions'
  label = null,
  onImportSuccess = null,
  compact = false,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const fileInputRef = useRef(null);

  const displayLabel = label || MODULE_NAMES[module] || module;

  const handleDownloadTemplate = async () => {
    setIsDownloading(true);
    setFeedback(null);
    try {
      await api.downloadMasterImportTemplate(module);
    } catch (err) {
      alert(err.message || `Gagal mengunduh template ${displayLabel}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setFeedback({ type: 'error', message: 'Pilih file .csv, .xlsx, atau .json terlebih dahulu.' });
      return;
    }

    setIsUploading(true);
    setFeedback(null);

    try {
      const res = await api.importMasterData(module, selectedFile);
      setFeedback({
        type: 'success',
        message: res.message || `Import ${displayLabel} berhasil diproses.`,
      });
      if (onImportSuccess) {
        onImportSuccess(res);
      }
      setTimeout(() => {
        setIsModalOpen(false);
        setSelectedFile(null);
        setFeedback(null);
      }, 1000);
    } catch (err) {
      const errDetail = err.errors ? Object.values(err.errors).flat().join(', ') : '';
      setFeedback({
        type: 'error',
        message: errDetail ? `${err.message}: ${errDetail}` : (err.message || `Gagal mengimpor data ${displayLabel}.`),
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div className="inline-flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={handleDownloadTemplate}
          disabled={isDownloading}
          title={`Unduh Template Import ${displayLabel}`}
          className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs disabled:opacity-50 ${
            compact ? 'px-2.5 py-1.5 text-[11px]' : 'px-3 py-2 text-xs'
          }`}
        >
          <Download className="w-3.5 h-3.5 text-slate-600" />
          <span>{isDownloading ? 'Mengunduh...' : `Template ${label || ''}`.trim()}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setFeedback(null);
            setSelectedFile(null);
            setIsModalOpen(true);
          }}
          className={`inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-xs ${
            compact ? 'px-2.5 py-1.5 text-[11px]' : 'px-3 py-2 text-xs'
          }`}
        >
          <Upload className="w-3.5 h-3.5 text-emerald-600" />
          <span>Import {label || 'Data'}</span>
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-[#0b2046] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold">Import {displayLabel}</h3>
                  <p className="text-[11px] text-slate-300">Unggah file .CSV, .XLSX, atau .JSON</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-300 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="p-5 space-y-4">
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-xs text-slate-600 font-medium">Unduh format kolom standar:</span>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  disabled={isDownloading}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-[11px] font-bold text-[#0b2046] hover:bg-slate-100"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isDownloading ? 'Mengunduh...' : 'Download Template'}</span>
                </button>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-5 text-center cursor-pointer transition bg-slate-50/60"
              >
                <FileUp className="w-7 h-7 text-slate-400 mx-auto mb-1.5" />
                {selectedFile ? (
                  <div>
                    <p className="text-xs font-bold text-slate-800">{selectedFile.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {(selectedFile.size / 1024).toFixed(1)} KB — Klik untuk mengganti
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-semibold text-slate-700">Pilih file import (.csv / .xlsx / .json)</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Klik untuk menelusuri file</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,.json"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setSelectedFile(f);
                      setFeedback(null);
                    }
                  }}
                  className="hidden"
                />
              </div>

              {feedback && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                    feedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  )}
                  <span>{feedback.message}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !selectedFile}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0b2046] hover:bg-[#163368] text-white text-xs font-bold disabled:opacity-50 transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'Mengunggah...' : 'Proses Import'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

