import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { api } from '../services/api'

export const ROLE_LABEL = { super_admin: 'Super Admin', admin: 'Admin', user: 'Karyawan' }

export const JABATAN_BY_ROLE = {
  super_admin: [
    { value: 'Manager', label: 'Manager' },
  ],
  admin: [
    { value: 'Asisten Manager', label: 'Asisten Manager (Asmen)' },
    { value: 'Vice President', label: 'Vice President (VP)' },
    { value: 'Kepala Daop', label: 'Kepala Daop (KDaop)' },
  ],
  user: [
    { value: 'Staff / Pegawai', label: 'Staff / Pegawai' },
  ],
}

export const inputCls =
  'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff5a00]/30 focus:border-[#ff5a00] bg-white transition-colors'

function Field({ label, name, errors, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      {children}
      {errors[name] && <p className="text-[11px] text-rose-600 mt-1">{errors[name][0]}</p>}
    </div>
  )
}

export default function UserFormModal({ user, onClose, onSaved, currentUserId }) {
  const isEdit = !!user

  // Tentukan default jabatan berdasarkan role awal
  const initialRole = user?.role || 'user'
  const defaultJabatan = () => {
    if (user?.jabatan) return user.jabatan
    const available = JABATAN_BY_ROLE[initialRole] || []
    return available[0]?.value || ''
  }

  const [form, setForm] = useState({
    nip: user?.nip || '',
    name: user?.name || user?.nama || '',
    jabatan: defaultJabatan(),
    unit_kerja: user?.unit_kerja || '',
    role: initialRole,
    password: '',
    is_active: user?.is_active ?? true,
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const isSelf = isEdit && user.id === currentUserId

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  // Ketika role berubah, sesuaikan pilihan jabatan struktural secara otomatis
  const handleRoleChange = (newRole) => {
    const available = JABATAN_BY_ROLE[newRole] || []
    const isCurrentValid = available.some((j) => j.value.toLowerCase() === (form.jabatan || '').toLowerCase())
    const newJabatan = isCurrentValid ? form.jabatan : (available[0]?.value || '')

    setForm((prev) => ({
      ...prev,
      role: newRole,
      jabatan: newJabatan,
    }))
  }

  // Opsi jabatan struktural berdasarkan role yang sedang aktif
  const currentJabatanOptions = JABATAN_BY_ROLE[form.role] || JABATAN_BY_ROLE.user

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setFieldErrors({})
    const payload = { ...form }
    if (isEdit && !payload.password) delete payload.password
    try {
      if (isEdit) await api.updateUser(user.id, payload)
      else await api.createUser(payload)
      onSaved(isEdit ? 'Data pengguna berhasil diperbarui.' : 'Pengguna baru berhasil ditambahkan.')
    } catch (err) {
      setError(err.message)
      setFieldErrors(err.errors || {})
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-[#0b2046]">{isEdit ? 'Edit Pengguna' : 'Tambah Pengguna'}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {error && <div className="p-2.5 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">{error}</div>}
          
          <div className="grid grid-cols-2 gap-3">
            <Field errors={fieldErrors} label="NIP" name="nip">
              <input className={inputCls} value={form.nip} onChange={(e) => set('nip', e.target.value)} placeholder="Contoh: 100001" required />
            </Field>
            {/* Jabatan/Role diganti menjadi Role */}
            <Field errors={fieldErrors} label="Role" name="role">
              <select 
                className={inputCls} 
                value={form.role} 
                disabled={isSelf} 
                onChange={(e) => handleRoleChange(e.target.value)}
              >
                {Object.entries(ROLE_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field errors={fieldErrors} label="Nama Lengkap" name="name">
            <input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Nama lengkap beserta gelar" required />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            {/* Jabatan Struktural Dropdown Sesuai Role Terpilih */}
            <Field errors={fieldErrors} label="Jabatan Struktural" name="jabatan">
              <select
                className={inputCls}
                value={form.jabatan}
                onChange={(e) => set('jabatan', e.target.value)}
                required
              >
                {currentJabatanOptions.map((j) => (
                  <option key={j.value} value={j.value}>
                    {j.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field errors={fieldErrors} label="Unit Kerja / Daop" name="unit_kerja">
              <input 
                className={inputCls} 
                value={form.unit_kerja} 
                onChange={(e) => set('unit_kerja', e.target.value)} 
                placeholder="Contoh: Daop 1 Jakarta" 
                list="unit-kerja-list"
              />
              <datalist id="unit-kerja-list">
                <option value="Unit Kantor Pusat" />
                <option value="Daop 1 Jakarta" />
                <option value="Daop 2 Bandung" />
                <option value="Daop 4 Semarang" />
                <option value="Daop 6 Yogyakarta" />
                <option value="Daop 8 Surabaya" />
                <option value="Balai Yasa Manggarai" />
                <option value="Unit TI & Sistem Informasi" />
              </datalist>
            </Field>
          </div>

          <Field errors={fieldErrors} label={isEdit ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password'} name="password">
            <input
              type="password"
              className={inputCls}
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              minLength={8}
              required={!isEdit}
              placeholder={isEdit ? 'Masukkan jika ingin mengubah password' : 'Min. 8 karakter'}
              autoComplete="new-password"
            />
          </Field>

          <label className="flex items-center gap-2 text-sm text-slate-700 select-none">
            <input type="checkbox" checked={form.is_active} disabled={isSelf} onChange={(e) => set('is_active', e.target.checked)} className="rounded text-[#ff5a00] focus:ring-[#ff5a00]" />
            Akun aktif
          </label>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm font-semibold text-white bg-[#ff5a00] rounded-lg hover:bg-[#e65100] disabled:opacity-60 transition-colors shadow-xs"
          >
            {saving ? 'Menyimpan…' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  )
}
