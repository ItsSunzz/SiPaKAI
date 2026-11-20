import React, { useState, useEffect } from 'react';
import { Database, Search, X, Loader2, CheckSquare, Ban, Filter } from 'lucide-react';
import { api } from '../services/api';
import MasterImportActions from './MasterImportActions';

/**
 * Daftar status CI resmi:
 * Deployed, End of Life, In Inventory, In Repair, On Loan, Destroyed
 */
export const CI_STATUSES = [
  'Deployed',
  'End of Life',
  'In Inventory',
  'In Repair',
  'On Loan',
  'Destroyed',
];

/**
 * Helper untuk styling badge Status CI (termasuk status Destroyed / Dimusnahkan).
 */
export function getStatusCiBadge(statusCi, isDestroyed = false) {
  const norm = String(statusCi || '').toLowerCase().trim();
  if (isDestroyed || norm === 'destroyed' || norm === 'dimusnahkan') {
    return {
      label: 'Destroyed',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-300 font-bold',
      dotClass: 'bg-rose-600',
      description: 'Dimusnahkan (Tidak dapat dipilih)',
    };
  }

  switch (norm) {
    case 'deployed':
      return {
        label: 'Deployed',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold',
        dotClass: 'bg-emerald-600',
        description: 'Terpasang / Aktif Operasional',
      };
    case 'end of life':
      return {
        label: 'End of Life',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 font-semibold',
        dotClass: 'bg-amber-500',
        description: 'Masa Pakai Habis',
      };
    case 'in inventory':
      return {
        label: 'In Inventory',
        badgeClass: 'bg-sky-50 text-sky-800 border-sky-300 font-semibold',
        dotClass: 'bg-sky-500',
        description: 'Tersedia di Gudang / Stok',
      };
    case 'in repair':
      return {
        label: 'In Repair',
        badgeClass: 'bg-orange-50 text-orange-800 border-orange-300 font-semibold',
        dotClass: 'bg-orange-500',
        description: 'Dalam Proses Perbaikan',
      };
    case 'on loan':
      return {
        label: 'On Loan',
        badgeClass: 'bg-purple-50 text-purple-800 border-purple-300 font-semibold',
        dotClass: 'bg-purple-500',
        description: 'Dipinjamkan Sementara',
      };
    default:
      return {
        label: statusCi || 'Deployed',
        badgeClass: 'bg-slate-50 text-slate-700 border-slate-300 font-medium',
        dotClass: 'bg-slate-400',
        description: statusCi || 'Deployed',
      };
  }
}

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

  const rawStatus = String(raw.status || '').toLowerCase().trim();
  const rawStatusCi = String(raw.status_ci || '').toLowerCase().trim();

  // Deteksi status dimusnahkan (Destroyed)
  const isDestroyed = Boolean(
    raw.is_destroyed ||
    rawStatus === 'destroyed' ||
    rawStatusCi === 'destroyed' ||
    rawStatus === 'dimusnahkan' ||
    rawStatusCi === 'dimusnahkan'
  );

  const statusCi = isDestroyed
    ? 'Destroyed'
    : (raw.status_ci || (raw.status && raw.status !== 'active' ? raw.status : 'Deployed'));

  const status = isDestroyed
    ? 'destroyed'
    : (raw.status || 'active');

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
    status: status,
    is_destroyed: isDestroyed,
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
  const [statusFilter, setStatusFilter] = useState('available'); // 'available' | 'all' | 'destroyed'

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
    // 1. Filter status ketersediaan
    if (statusFilter === 'available' && a.is_destroyed) {
      return false;
    }
    if (statusFilter === 'destroyed' && !a.is_destroyed) {
      return false;
    }

    // 2. Filter query pencarian
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

  const toggleSelect = (id, isDestroyed) => {
    if (isDestroyed) return;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    // Pastikan aset yang berstatus Destroyed tidak pernah bisa ikut terpilih
    const chosen = assets.filter((a) => selectedIds.includes(a.id) && !a.is_destroyed);
    if (onSelectAssets) onSelectAssets(chosen);
    onClose();
  };

  const totalDestroyed = assets.filter((a) => a.is_destroyed).length;
  const totalAvailable = assets.filter((a) => !a.is_destroyed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[88vh]">
        <div className="bg-[#0b2046] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-[#f05a22]" />
            <div>
              <h3 className="font-bold text-sm">Pilih dari Daftar Master Aset TI (Daop / SAP)</h3>
              <p className="text-[11px] text-slate-300">
                Pilih aset berstatus Deployed, End of Life, In Inventory, In Repair, atau On Loan. Aset yang telah dihancurkan (Destroyed) tidak dapat dipilih.
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
              placeholder="Cari CI ID, Product Name, Manufacturer, Serial Number, Tier 1/2/3, atau Site..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#f05a22]"
            />
          </div>

          {/* Filter Status CI Toggle Tabs */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setStatusFilter('available')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                statusFilter === 'available'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dapat Dipilih ({totalAvailable})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                statusFilter === 'all'
                  ? 'bg-[#0b2046] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({assets.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('destroyed')}
              className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                statusFilter === 'destroyed'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-rose-600 hover:bg-rose-50'
              }`}
            >
              <Ban className="w-3 h-3" />
              <span>Destroyed ({totalDestroyed})</span>
            </button>
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
              {statusFilter === 'destroyed'
                ? 'Tidak ada aset yang berstatus Destroyed.'
                : 'Tidak ada data Master Aset yang sesuai kriteria pencarian.'}
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
                  <th className="py-2.5 px-3">Status CI</th>
                  <th className="py-2.5 px-3">Tier 1 → Jenis</th>
                  <th className="py-2.5 px-3">Tier 2 &amp; Tier 3</th>
                  <th className="py-2.5 px-3">Site+ (lokasi)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssets.map((a) => {
                  const isChecked = selectedIds.includes(a.id);
                  const isDestroyed = a.is_destroyed;
                  const badge = getStatusCiBadge(a.status_ci, isDestroyed);

                  return (
                    <tr
                      key={a.id}
                      onClick={() => toggleSelect(a.id, isDestroyed)}
                      title={isDestroyed ? 'Aset telah dimusnahkan (Destroyed) dan tidak dapat dipilih.' : ''}
                      className={`transition-colors ${
                        isDestroyed
                          ? 'opacity-55 bg-rose-50/30 cursor-not-allowed select-none'
                          : isChecked
                          ? 'bg-orange-50/70 cursor-pointer'
                          : 'hover:bg-slate-50 cursor-pointer'
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isDestroyed}
                          onChange={() => {}}
                          className={`rounded text-[#f05a22] ${
                            isDestroyed ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                          }`}
                        />
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#0b2046] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {isDestroyed && <Ban className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                          <span>{a.ci_id || '-'}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        <div>{a.product_name || '-'}</div>
                        {isDestroyed && (
                          <div className="text-[10px] font-bold text-rose-600 mt-0.5">
                            Dimusnahkan (Destroyed) - Tidak dapat dipilih
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {a.manufacturer || '-'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">
                        {a.serial_number || '-'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] border whitespace-nowrap inline-flex items-center gap-1.5 ${badge.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
                          {badge.label}
                        </span>
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
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">
              {selectedIds.length} aset dipilih
            </span>
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-[11px] text-slate-400 hover:text-slate-600 underline"
              >
                Reset pilihan
              </button>
            )}
          </div>
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
