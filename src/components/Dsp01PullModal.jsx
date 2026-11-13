import React, { useState, useEffect, useCallback } from 'react';
import { Search, FileText, Download, X, CheckCircle2, Layers } from 'lucide-react';
import { api } from '../services/api';

export default function Dsp01PullModal({
  isOpen,
  onClose,
  targetType = 'dsp02', // 'dsp02' | 'dsp03'
  onSelectPrefill,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [dsp01List, setDsp01List] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pullingId, setPullingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchApprovedDsp01 = useCallback(async (q = '') => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await api.getApprovedDsp01({
        target_type: targetType,
        ...(q ? { q } : {}),
      });
      const list = Array.isArray(res) ? res : (res?.data || res?.documents || []);
      setDsp01List(list);
    } catch {
      // Fallback ke getDocuments jika endpoint khusus belum mengembalikan data
      try {
        const fallbackRes = await api.getDocuments({ type: 'dsp01', status: 'approved', q });
        const list = (fallbackRes?.data || []).filter(
          (d) => String(d.status || '').toLowerCase() === 'approved'
        );
        setDsp01List(list);
      } catch (err2) {
        setErrorMsg(err2.message || 'Gagal memuat daftar dokumen DSP-01 yang disetujui.');
        setDsp01List([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [targetType]);

  useEffect(() => {
    if (isOpen) {
      fetchApprovedDsp01('');
    }
  }, [isOpen, fetchApprovedDsp01]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchApprovedDsp01(searchQuery.trim());
  };

  const handleChooseDocument = async (doc) => {
    setPullingId(doc.id);
    setErrorMsg('');
    try {
      const prefillKey = targetType === 'dsp03' ? 'dsp03_prefill' : 'dsp02_prefill';
      let prefill = doc[prefillKey] || null;
      let pulledDoc = doc;

      if (!prefill) {
        try {
          const pullRes = await api.pullDocumentFromDsp01(doc.id, targetType);
          prefill = pullRes?.[prefillKey] || pullRes?.prefill || pullRes?.data || pullRes;
          pulledDoc = pullRes?.parent_document || pullRes?.document || doc;
        } catch {
          const fullRes = await api.getDocument(doc.id);
          pulledDoc = fullRes?.data || fullRes || doc;
          prefill = pulledDoc[prefillKey] || {
            parent_id: pulledDoc.id,
            data: pulledDoc.data || {},
            items: pulledDoc.items || pulledDoc.data?.items || [],
          };
        }
      }

      const headerData = prefill?.data || prefill?.header || pulledDoc?.data || {};
      const rawItems =
        prefill?.items ||
        headerData?.items ||
        pulledDoc?.items ||
        pulledDoc?.data?.items ||
        [];

      onSelectPrefill({
        parentId: doc.id,
        parentDoc: {
          id: doc.id,
          number: doc.number || headerData.nomor_referensi || `DSP01-${doc.id}`,
          nama_pemohon:
            doc.nama_pemohon ||
            doc.requester_name ||
            doc.requester?.name ||
            headerData.nama_pemohon ||
            '-',
          unit_kerja:
            doc.unit_kerja ||
            doc.requester_unit ||
            doc.requester?.unit_kerja ||
            headerData.unit_kerja ||
            headerData.lokasi ||
            '-',
          tanggal_permohonan:
            doc.tanggal_permohonan ||
            headerData.tanggal_permohonan ||
            headerData.tanggal ||
            doc.date ||
            '',
        },
        headerData,
        items: Array.isArray(rawItems) ? rawItems : [],
        rawPrefill: prefill,
      });
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menarik data dari dokumen DSP-01.');
    } finally {
      setPullingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-[#0b2046] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <Layers className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold tracking-wide">
                Tarik dari Dokumen DSP-01 (Approved)
              </h3>
              <p className="text-[11px] text-slate-300">
                Pilih dokumen Permohonan Pemusnahan (DSP-01) yang telah disahkan penuh untuk mengisi otomatis {targetType.toUpperCase()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nomor dokumen DSP-01, nama pemohon, atau unit kerja..."
                className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-[#0b2046]"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl bg-[#0b2046] hover:bg-[#163368] text-white text-xs font-bold transition"
            >
              Cari
            </button>
          </form>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {errorMsg}
            </div>
          )}

          <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
            {isLoading ? (
              <div className="py-12 text-center text-xs text-slate-500 font-medium">
                Memuat daftar dokumen DSP-01 yang telah disetujui...
              </div>
            ) : dsp01List.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                Tidak ada dokumen DSP-01 berstatus <strong>Approved</strong> yang ditemukan.
              </div>
            ) : (
              dsp01List.map((doc) => {
                const docNumber = doc.number || doc.no_dokumen || `DSP01-#${doc.id}`;
                const pemohon =
                  doc.nama_pemohon ||
                  doc.requester_name ||
                  doc.requester?.name ||
                  doc.data?.nama_pemohon ||
                  'Pemohon TI';
                const unitKerja =
                  doc.unit_kerja ||
                  doc.requester_unit ||
                  doc.requester?.unit_kerja ||
                  doc.data?.unit_kerja ||
                  doc.data?.lokasi ||
                  'DAOP 1 Jakarta';
                const itemsCount =
                  doc.items_count ??
                  (Array.isArray(doc.items)
                    ? doc.items.length
                    : Array.isArray(doc.data?.items)
                    ? doc.data.items.length
                    : 0);

                return (
                  <div
                    key={doc.id}
                    className="p-4 hover:bg-blue-50/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                          <CheckCircle2 className="w-3 h-3" /> Approved
                        </span>
                        <span className="text-xs font-extrabold text-[#0b2046] font-mono">
                          {docNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-700">
                          {itemsCount} Aset TI
                        </span>
                      </div>
                      <p className="text-xs text-slate-700">
                        Pemohon: <strong>{pemohon}</strong> • Unit Kerja: <strong>{unitKerja}</strong>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleChooseDocument(doc)}
                      disabled={pullingId === doc.id}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#f05a22] hover:bg-[#d94a18] text-white text-xs font-bold shadow-xs transition shrink-0 disabled:opacity-50 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{pullingId === doc.id ? 'Menarik Data...' : 'Tarik Dokumen Ini'}</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span>Data header, referensi, dan daftar aset akan terisi otomatis ke form {targetType.toUpperCase()}.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

