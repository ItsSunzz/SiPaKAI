import React, { useState, useEffect } from 'react';
import { Database, Search, X, Loader2, CheckSquare } from 'lucide-react';
import { api } from '../services/api';
import MasterImportActions from './MasterImportActions';

/**
 * Normalisasi objek Master Aset berdasarkan mapping Excel "Aset daop 6_1.xlsx",
 * kolom database `aset`, dan alias properti API JSON.
 */
export function normalizeMasterAsset(raw = {}) {
  const ciId =
    raw.ci_id ||
    raw.kode_aset ||
    raw.asset_code ||
    raw.code ||
    raw.no_inventaris ||
    raw.nomor_aset ||
    raw.id_aset ||
    '';

  const productName =
    raw.product_name ||
    raw.nama ||
    raw.name ||
    raw.nama_aset ||
    raw.nama_barang ||
    '';

  const manufacturer =
    raw.manufacturer ||
    raw.merk_tipe ||
    raw.brand_series ||
    raw.brand ||
    raw.merk ||
    '';

  const serialNumber =
    raw.serial_number ||
    raw.nomor_seri ||
    raw.serial_nomor ||
    raw.sn ||
    '';

  const statusCi =
    raw.status_ci ||
    raw.status ||
    '';

  const rawTier1 =
    raw.tier_1 ||
    raw.tipe ||
    raw.type ||
    raw.jenis_aset ||
    '';

  const t1Lower = String(rawTier1).toLowerCase();
  let jenisAset = 'Fisik';
  if (t1Lower.includes('network') || t1Lower.includes('jaringan')) {
    jenisAset = 'Jaringan';
  } else if (
    t1Lower.includes('application') ||
    t1Lower.includes('software') ||
    t1Lower.includes('informasi') ||
    t1Lower.includes('lisensi')
  ) {
    jenisAset = 'Informasi';
  } else if (t1Lower.includes('hardware') || t1Lower.includes('fisik')) {
    jenisAset = 'Fisik';
  }

  const tier1Display = rawTier1
    ? rawTier1.toLowerCase() !== jenisAset.toLowerCase()
      ? `${rawTier1} → ${jenisAset}`
      : rawTier1
    : jenisAset;

  const tier2 = raw.tier_2 || raw.category || raw.kategori || '';
  const tier3 = raw.tier_3 || '';
  const company = raw.company || 'PT Kereta Api Indonesia (Persero)';
  const site = raw.site || raw.lokasi || raw.location || raw.unit_kerja || '';

  return {
    ...raw,
    id: raw.id || ciId || `${productName}-${serialNumber}`,
    // Kolom Database & Alias API JSON
    ci_id: ciId,
    kode_aset: ciId,
    asset_code: ciId,
    product_name: productName,
    nama: productName,
    name: productName,
    manufacturer,
    merk_tipe: manufacturer,
    brand_series: manufacturer,
    serial_number: serialNumber,
    nomor_seri: serialNumber,
    status_ci: statusCi,
    status: statusCi,
    tier_1: rawTier1 || jenisAset,
    tipe: jenisAset,
    type: jenisAset,
    jenis_aset: jenisAset,
    tier_1_display: tier1Display,
    tier_2: tier2,
    tier_3: tier3,
    company,
    site,
    lokasi: site,
    location: site,
  };
}

export default function MasterAssetPickerModal({
  isOpen,
  onClose,
  onSelectAssets,
  allowImport = true,
}) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  const loadAssets = async (q = '') => {
    setLoading(true);
    try {
      const res = await api.getAssets(q);
      const list = Array.isArray(res) ? res : (res?.data || []);
      setAssets(list.map(normalizeMasterAsset));
    } catch (err) {
      console.warn('Gagal memuat master aset:', err);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedIds([]);
      loadAssets();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredAssets = assets.filter((a) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      a.ci_id.toLowerCase().includes(q) ||
      a.product_name.toLowerCase().includes(q) ||
      a.manufacturer.toLowerCase().includes(q) ||
      a.serial_number.toLowerCase().includes(q) ||
      a.status_ci.toLowerCase().includes(q) ||
      a.tier_1.toLowerCase().includes(q) ||
      a.jenis_aset.toLowerCase().includes(q) ||
      a.tier_2.toLowerCase().includes(q) ||
      a.tier_3.toLowerCase().includes(q) ||
      a.site.toLowerCase().includes(q) ||
      a.company.toLowerCase().includes(q)
    );
  });

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    const chosen = assets.filter((a) => selectedIds.includes(a.id));
    if (onSelectAssets) onSelectAssets(chosen);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[88vh]">
        <div className="bg-[#0b2046] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-[#f05a22]" />
            <div>
              <h3 className="font-bold text-sm">Pilih dari Daftar Master Aset TI (Daop / SAP)</h3>
              <p className="text-[11px] text-slate-300">
                Sesuai struktur kolom CI ID+, Product Name+, Manufacturer, Serial Number, Status*, Tier 1-3, Company+, dan Site+
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari CI ID (IT.045...), Product Name, Manufacturer, Serial Number, Tier 1/2/3, atau Site..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#f05a22]"
            />
          </div>
          {allowImport && (
            <MasterImportActions
              module="assets"
              label="Master Aset"
              compact
              onImported={() => loadAssets(searchQuery)}
            />
          )}
        </div>

        <div className="overflow-auto flex-1">
          {loading ? (
            <div className="py-14 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#f05a22]" />
              <span className="text-xs">Memuat daftar Master Aset...</span>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="py-14 text-center text-xs text-slate-400">
              Tidak ada data Master Aset ditemukan.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 text-[10px] uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">Pilih</th>
                  <th className="py-2.5 px-3">CI ID+ (kode_aset)</th>
                  <th className="py-2.5 px-3">Product Name+ (nama)</th>
                  <th className="py-2.5 px-3">Manufacturer (merk_tipe)</th>
                  <th className="py-2.5 px-3">Serial Number (nomor_seri)</th>
                  <th className="py-2.5 px-3">Status*</th>
                  <th className="py-2.5 px-3">Tier 1 → Jenis</th>
                  <th className="py-2.5 px-3">Tier 2 &amp; Tier 3</th>
                  <th className="py-2.5 px-3">Site+ (lokasi)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssets.map((a) => {
                  const isChecked = selectedIds.includes(a.id);
                  return (
                    <tr
                      key={a.id}
                      onClick={() => toggleSelect(a.id)}
                      className={`cursor-pointer transition-colors ${
                        isChecked ? 'bg-orange-50/70' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded text-[#f05a22]"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#0b2046] whitespace-nowrap">
                        {a.ci_id || '-'}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {a.product_name || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {a.manufacturer || '-'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">
                        {a.serial_number || '-'}
                      </td>
                      <td className="py-2.5 px-3">
                        {a.status_ci ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 whitespace-nowrap">
                            {a.status_ci}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 whitespace-nowrap">
                          {a.tier_1_display}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-600">
                        <div>{a.tier_2 || '-'}</div>
                        {a.tier_3 && <div className="text-[10px] text-slate-400">{a.tier_3}</div>}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-600">
                        <div>{a.site || '-'}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[160px]">{a.company}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600">
            {selectedIds.length} aset dipilih
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={selectedIds.length === 0}
              onClick={handleConfirm}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#f05a22] hover:bg-[#d94a18] disabled:opacity-50 rounded-xl shadow-xs cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Tambahkan ke Daftar Aset</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
