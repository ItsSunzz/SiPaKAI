import { useState, useEffect } from 'react'
import { X, Send, Save, AlertCircle, FilePlus2 } from 'lucide-react'
import { api } from '../services/api'

const MODULE_TITLES = {
  dsp01: 'Permohonan Pemusnahan Aset TI (DSP-01)',
  dsp02: 'Berita Acara Pemusnahan Aset (DSP-02)',
  dsp03: 'Form Penghapusan Aset TI (DSP-03)',
  ho01: 'Berita Acara Serah Terima Barang (HO-01)',
  ho02: 'BAST User & Hak Akses Aplikasi (HO-02)',
}

export default function DocumentCreateModal({ type, currentUser, onClose, onSuccess }) {
  const [approvers, setApprovers] = useState([])
  const [selectedApproverId, setSelectedApproverId] = useState('')
  const [verifikator2Id, setVerifikator2Id] = useState('')
  const [verifikator3Id, setVerifikator3Id] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Form states based on module
  const [formData, setFormData] = useState({
    nama_aset: '',
    jenis_aset: 'Fisik',
    id_aset: '',
    alasan_pemusnahan: '',
    nilai_buku: '',
    lokasi: currentUser?.unit_kerja || 'DAOP 1 Jakarta',
    tanggal: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    async function loadApprovers() {
      try {
        const res = await api.getApprovers()
        const list = Array.isArray(res) ? res : (res?.data || [])
        setApprovers(list)
        if (list.length > 0) setSelectedApproverId(String(list[0].id))
        if (list.length > 1) setVerifikator2Id(String(list[1].id))
        if (list.length > 2) setVerifikator3Id(String(list[2].id))
      } catch (err) {
        console.error('Failed to load approvers:', err)
      }
    }
    loadApprovers()
  }, [])

  const handleSubmit = async (submitNow) => {
    setIsSubmitting(true)
    setError(null)
    try {
      let payload = {}

      const v1 = selectedApproverId ? Number(selectedApproverId) : null
      const v2 = verifikator2Id ? Number(verifikator2Id) : null
      const v3 = verifikator3Id ? Number(verifikator3Id) : null
      const chain = [v1, v2, v3].filter(Boolean)

      if (type === 'dsp01') {
        payload = {
          type: 'dsp01',
          submit: submitNow,
          approver_id: submitNow ? v1 : undefined,
          data: {
            tanggal_permohonan: formData.tanggal,
            nama_pemohon: currentUser.name,
            nip_pemohon: currentUser.nip,
            unit_kerja: currentUser.jabatan,
            id_aset: formData.id_aset || 'KAI-INV-TMP',
            nilai_buku: Number(formData.nilai_buku) || 50000000,
            verifikator_1_id: v1,
            verifikator_2_id: v2,
            verifikator_3_id: v3,
            approval_chain: chain,
          },
          items: [
            {
              nama_aset: formData.nama_aset || 'Perangkat TI',
              jenis_aset: formData.jenis_aset,
              id_aset: formData.id_aset || 'KAI-INV-TMP',
              alasan_pemusnahan: formData.alasan_pemusnahan || 'Kerusakan teknis permanen',
            },
          ],
        }
      } else if (type === 'dsp03') {
        payload = {
          type: 'dsp03',
          submit: submitNow,
          approver_id: submitNow ? Number(selectedApproverId) : undefined,
          data: {
            tanggal: formData.tanggal,
            nama_pelaksana: currentUser.name,
            nipp_pelaksana: currentUser.nip,
            jabatan_pelaksana: currentUser.jabatan,
            lokasi: formData.lokasi,
            status_kondisi: 'Dimusnahkan',
            id_aset: formData.id_aset || 'KAI-HW-SW',
            nilai_buku: Number(formData.nilai_buku) || 75000000,
          },
          items: [
            {
              nama_barang: formData.nama_aset || 'Switch Core Cisco',
              jumlah: 1,
              no_inventaris: formData.id_aset || 'KAI-HW-SW',
              serial_nomor: 'SN-' + Date.now().toString().slice(-6),
              lokasi_aset: formData.lokasi,
              keterangan: formData.alasan_pemusnahan || 'Penghentian operasional perangkat',
            },
          ],
        }
      } else if (type === 'ho01') {
        payload = {
          type: 'ho01',
          submit: submitNow,
          approver_id: submitNow ? Number(selectedApproverId) : undefined,
          data: {
            penyerah: {
              nama: currentUser.name,
              nipp: currentUser.nip,
              jabatan: currentUser.jabatan,
              tempat_kedudukan: 'Jakarta',
              personal_area: 'DAOP 1',
            },
            penerima: {
              nama: 'Budi Santoso',
              nipp: '58492',
              jabatan: 'VP IT Operation',
              tempat_kedudukan: 'Kantor Pusat',
              personal_area: 'Pusat',
            },
            id_aset: formData.id_aset || 'BAST-LOGISTIK',
            nilai_buku: Number(formData.nilai_buku) || 120000000,
          },
          items: [
            {
              nama_barang: formData.nama_aset || 'Laptop Operasional Daop',
              brand_series: 'Lenovo ThinkPad',
              no_inventaris: formData.id_aset || 'BAST-LOGISTIK',
              serial_number: 'SN-LOG-' + Date.now().toString().slice(-5),
              keterangan: 'Distribusi hardware workstation',
            },
          ],
        }
      } else {
        // Generic fallback for dsp02 / ho02
        payload = {
          type,
          submit: submitNow,
          approver_id: submitNow ? Number(selectedApproverId) : undefined,
          data: {
            tanggal_pelaksanaan: formData.tanggal,
            waktu_pelaksanaan: '10:00',
            lokasi: formData.lokasi,
            konfirmasi_backup: true,
          },
          items: [
            {
              nama_aset: formData.nama_aset || 'Aset TI Terkait',
              jenis_aset: 'Fisik',
              id_aset: formData.id_aset || 'INV-REF',
              metode_pemusnahan: 'Pencacahan fisik dan degaussing magnetik',
            },
          ],
        }
      }

      const res = await api.createDocument(payload)
      onSuccess(res.message || 'Dokumen berhasil dibuat.')
    } catch (err) {
      setError(err.message || 'Gagal menyimpan dokumen.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FilePlus2 className="w-5 h-5 text-orange-400" />
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                {MODULE_TITLES[type] || 'Formulir Dokumen TI'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Pemohon: {currentUser.name || currentUser.nama} ({typeof currentUser.jabatan === 'object' ? currentUser.jabatan?.nama : (currentUser.jabatan || currentUser.roleLabel || '-')})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nama Perangkat / Barang <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nama_aset}
                onChange={(e) => setFormData({ ...formData, nama_aset: e.target.value })}
                placeholder="Contoh: Server IBM x3650 M4 / 15 Unit Laptop"
                className="w-full rounded-lg border border-slate-300 p-2 text-slate-800 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Kode / No. Inventaris SAP <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.id_aset}
                onChange={(e) => setFormData({ ...formData, id_aset: e.target.value })}
                placeholder="Contoh: 104-KAI-SRV-2018"
                className="w-full rounded-lg border border-slate-300 p-2 text-slate-800 focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Jenis Kategori Aset
              </label>
              <select
                value={formData.jenis_aset}
                onChange={(e) => setFormData({ ...formData, jenis_aset: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2 text-slate-800 focus:ring-1 focus:ring-blue-500"
              >
                <option value="Fisik">Fisik Hardware</option>
                <option value="Jaringan">Jaringan Network</option>
                <option value="Informasi">Informasi Data</option>
                <option value="Informasi HC">Informasi HC</option>
                <option value="Informasi SC">Informasi SC</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Estimasi Nilai Buku (Rp)
              </label>
              <input
                type="number"
                value={formData.nilai_buku}
                onChange={(e) => setFormData({ ...formData, nilai_buku: e.target.value })}
                placeholder="Contoh: 148500000"
                className="w-full rounded-lg border border-slate-300 p-2 text-slate-800 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                Keterangan / Alasan Disposisi <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={formData.alasan_pemusnahan}
                onChange={(e) => setFormData({ ...formData, alasan_pemusnahan: e.target.value })}
                placeholder="Jelaskan kondisi teknis dan alasan pengajuan pengesahan ini..."
                className="w-full rounded-lg border border-slate-300 p-2 text-slate-800 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2 pt-3 border-t border-slate-200">
              <label className="block font-bold text-slate-800 mb-2">
                Alur Persetujuan (Pilih 3 Pejabat Verifikator) <span className="text-rose-500">*</span>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Verifikator 1 */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-orange-600 uppercase block mb-1">
                    Verifikator 1 (Atasan)
                  </span>
                  <select
                    value={selectedApproverId}
                    onChange={(e) => setSelectedApproverId(e.target.value)}
                    className="w-full rounded-md border border-slate-300 p-1.5 text-xs text-slate-800 bg-white"
                  >
                    <option value="">-- Pilih --</option>
                    {approvers.map((appr) => (
                      <option key={appr.id} value={appr.id}>
                        {appr.name || appr.nama} ({typeof appr.jabatan === 'object' ? appr.jabatan?.nama : (appr.jabatan || '-')})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Verifikator 2 */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-blue-700 uppercase block mb-1">
                    Verifikator 2 (Pengelola Aset)
                  </span>
                  <select
                    value={verifikator2Id}
                    onChange={(e) => setVerifikator2Id(e.target.value)}
                    className="w-full rounded-md border border-slate-300 p-1.5 text-xs text-slate-800 bg-white"
                  >
                    <option value="">-- Pilih --</option>
                    {approvers.map((appr) => (
                      <option key={appr.id} value={appr.id}>
                        {appr.name || appr.nama} ({typeof appr.jabatan === 'object' ? appr.jabatan?.nama : (appr.jabatan || '-')})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Verifikator 3 */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase block mb-1">
                    Verifikator 3 (Penyetuju Akhir)
                  </span>
                  <select
                    value={verifikator3Id}
                    onChange={(e) => setVerifikator3Id(e.target.value)}
                    className="w-full rounded-md border border-emerald-300 p-1.5 text-xs text-slate-800 bg-white"
                  >
                    <option value="">-- Pilih --</option>
                    {approvers.map((appr) => (
                      <option key={appr.id} value={appr.id}>
                        {appr.name || appr.nama} ({typeof appr.jabatan === 'object' ? appr.jabatan?.nama : (appr.jabatan || '-')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 mt-2">
                Dokumen akan dialirkan berjenjang dari Verifikator 1 ke Verifikator 2 hingga Verifikator 3 secara otomatis.
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Draf</span>
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#ea580c] hover:bg-[#c2410c] text-white font-semibold transition-all shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Mengirim...' : 'Kirim Pengajuan'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
