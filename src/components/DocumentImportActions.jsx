import React, { useState, useRef } from 'react';
import { Download, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X, FileUp, Sparkles, Save } from 'lucide-react';
import { api } from '../services/api';

const MODULE_LABELS = {
  dsp01: 'DSP-01 (Permohonan Pemusnahan)',
  dsp02: 'DSP-02 (Berita Acara Pemusnahan)',
  dsp03: 'DSP-03 (Penghapusan Aset TI)',
  ho01: 'HO-01 (BAST Barang TI)',
  ho02: 'HO-02 (BAST User Aplikasi)',
};

export default function DocumentImportActions({
  type = 'dsp01',
  mode = 'form', // 'form' | 'list'
  parentId = null,
  onPreviewData = null,
  onDraftCreated = null,
  compact = false,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [importOption, setImportOption] = useState(mode === 'form' ? 'preview' : 'draft');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const fileInputRef = useRef(null);

  const handleDownloadTemplate = async () => {
    setIsDownloading(true);
    setFeedback(null);
    try {
      await api.downloadDocumentImportTemplate(type);
    } catch (err) {
      alert(err.message || `Gagal mengunduh template ${type.toUpperCase()}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setSelectedFile(f);
      setFeedback(null);
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
      const isPreview = importOption === 'preview';
      const res = await api.importDocument({
        type,
        file: selectedFile,
        previewOnly: isPreview,
        save: !isPreview,
        parentId,
      });

      if (isPreview) {
        const importedData = res.data || res.document?.data || res.prefill?.data || {};
        const importedItems = res.items || res.document?.items || res.prefill?.items || res.data?.items || [];
        if (onPreviewData) {
          onPreviewData(importedData, Array.isArray(importedItems) ? importedItems : [], res);
        }
        setFeedback({
          type: 'success',
          message: res.message || `Berhasil memuat data & ${Array.isArray(importedItems) ? importedItems.length : 0} baris item ke dalam form.`,
        });
        setTimeout(() => {
          setIsModalOpen(false);
          setSelectedFile(null);
          setFeedback(null);
        }, 900);
      } else {
        const createdDoc = res.document || res.data || res;
        setFeedback({
          type: 'success',
          message: res.message || 'Dokumen draft berhasil dibuat dari file import.',
        });
        setTimeout(() => {
          setIsModalOpen(false);
          setSelectedFile(null);
          setFeedback(null);
          if (onDraftCreated) {
            onDraftCreated(createdDoc, res);
          }
        }, 900);
      }
    } catch (err) {
      const errDetail = err.errors ? Object.values(err.errors).flat().join(', ') : '';
      setFeedback({
        type: 'error',
        message: errDetail ? `${err.message}: ${errDetail}` : (err.message || 'Gagal mengimpor file dokumen.'),
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div className="inline-flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleDownloadTemplate}
          disabled={isDownloading}
          title={`Unduh Template CSV ${MODULE_LABELS[type] || type.toUpperCase()}`}
          className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm disabled:opacity-50 ${
            compact ? 'px-2.5 py-1.5 text-[11px]' : 'px-3.5 py-2 text-xs'
          }`}
        >
          <Download className="w-3.5 h-3.5 text-slate-600" />
          <span>{isDownloading ? 'Mengunduh...' : 'Unduh Template'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setImportOption(mode === 'form' ? 'preview' : 'draft');
            setFeedback(null);
            setIsModalOpen(true);
          }}
          className={`inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-sm ${
            compact ? 'px-2.5 py-1.5 text-[11px]' : 'px-3.5 py-2 text-xs'
          }`}
        >
          <Upload className="w-3.5 h-3.5 text-emerald-600" />
          <span>Import Data</span>
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-[#0b2046] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold tracking-wide">
                    Import Data {MODULE_LABELS[type] || type.toUpperCase()}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Mendukung format file .CSV, .XLSX, atau .JSON
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-300 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="p-6 space-y-4">
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="text-xs text-slate-600">
                  Belum punya format kolom yang sesuai?
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  disabled={isDownloading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-bold text-[#0b2046] hover:bg-slate-100 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isDownloading ? 'Mengunduh...' : 'Unduh Template .CSV'}</span>
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Pilih Metode Import
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {mode === 'form' && (
                    <button
                      type="button"
                      onClick={() => setImportOption('preview')}
                      className={`text-left p-3 rounded-xl border transition flex items-start gap-2.5 ${
                        importOption === 'preview'
                          ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <Sparkles className={`w-4 h-4 mt-0.5 shrink-0 ${importOption === 'preview' ? 'text-blue-600' : 'text-slate-400'}`} />
                      <div>
                        <div className="text-xs font-bold text-slate-800">Isi Otomatis ke Form</div>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                          Preview & sesuaikan dulu di form sebelum disimpan (`preview_only: 1`).
                        </p>
                      </div>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setImportOption('draft')}
                    className={`text-left p-3 rounded-xl border transition flex items-start gap-2.5 ${
                      importOption === 'draft'
                        ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    } ${mode !== 'form' ? 'sm:col-span-2' : ''}`}
                  >
                    <Save className={`w-4 h-4 mt-0.5 shrink-0 ${importOption === 'draft' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Langsung Buat Dokumen Draft</div>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                        Simpan langsung ke database sebagai `draft` (`save: 1`) & buka dokumen.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Pilih File Import (.CSV / .XLSX / .JSON)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-5 text-center cursor-pointer transition bg-slate-50/60 hover:bg-blue-50/30"
                >
                  <FileUp className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  {selectedFile ? (
                    <div>
                      <p className="text-xs font-bold text-slate-800">{selectedFile.name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {(selectedFile.size / 1024).toFixed(1)} KB — Klik untuk mengganti file
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-semibold text-slate-700">
                        Klik untuk memilih file dari komputer Anda
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Format yang didukung: CSV, Excel (.xlsx, .xls), atau JSON
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls,.json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
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
                  <span className="font-medium">{feedback.message}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !selectedFile}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0b2046] hover:bg-[#163368] text-white text-xs font-bold shadow-sm disabled:opacity-50 transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>
                    {isUploading
                      ? 'Memproses Import...'
                      : importOption === 'preview'
                      ? 'Muat ke Form Sekarang'
                      : 'Import & Simpan Draft'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

