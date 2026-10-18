const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'

export const fallbackDocuments = [
  {
    id: 1,
    number: 'BA-TI/01/2025/10/0048',
    inventory_code: '104-KAI-SRV-2018',
    type: 'dsp01',
    category_label: 'Pemusnahan Aset TI (Scrap)',
    category_type: 'pemusnahan',
    requester_name: 'Fajar Prasetyo',
    requester_unit: 'Kepala Stasiun Gambir',
    date: '24 Okt 2025',
    book_value: 'Rp 148.500.000',
    status: 'in_review',
    status_label: 'Menunggu Disposisi VP',
  },
  {
    id: 2,
    number: 'BAST-TI/2025/10/0122',
    inventory_code: 'Batch: 18 Unit Laptop ThinkPad',
    type: 'ho01',
    category_label: 'BAST Laptop Operasional',
    category_type: 'bast',
    requester_name: 'Rian Hidayat',
    requester_unit: 'Unit TI Senen & Jatinegara',
    date: '23 Okt 2025',
    book_value: 'Rp 324.000.000',
    status: 'in_review',
    status_label: 'Menunggu Disposisi VP',
  },
  {
    id: 3,
    number: 'BA-TI/01/2025/10/0045',
    inventory_code: 'Inv: CORE-SW-CISCO-3850',
    type: 'dsp03',
    category_label: 'Penghapusan Switch Core',
    category_type: 'pemusnahan',
    requester_name: 'Ezar Athilla',
    requester_unit: 'Spv Jaringan TI DAOP 1',
    date: '22 Okt 2025',
    book_value: 'Rp 89.200.000',
    status: 'in_review',
    status_label: 'Menunggu Disposisi VP',
  },
]

export function getToken() {
  return localStorage.getItem('sipakai_token') || ''
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('sipakai_token', token)
  } else {
    localStorage.removeItem('sipakai_token')
  }
}

async function request(endpoint, options = {}) {
  const token = getToken()
  const headers = {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(options.body)
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const error = new Error(errorData.message || `HTTP ${response.status}: Permintaan gagal`)
    error.status = response.status
    error.errors = errorData.errors
    throw error
  }

  return response.json()
}

export const api = {
  // Auth
  async login(nip, password, role = null) {
    const data = await request('/auth/login', {
      method: 'POST',
      body: { nip, password, role },
    })
    if (data.token) {
      setToken(data.token)
    }
    return data
  },

  async getMe() {
    return request('/auth/me')
  },

  async logout() {
    try {
      await request('/auth/logout', { method: 'POST' })
    } finally {
      setToken(null)
    }
  },

  // Documents
  async getInbox(page = 1) {
    return request(`/documents/inbox?page=${page}`)
  },

  async getDocuments(params = {}) {
    const query = new URLSearchParams(params).toString()
    return request(`/documents?${query}`)
  },

  async getDocument(id) {
    return request(`/documents/${id}`)
  },

  async getSchema() {
    return request('/documents/schema')
  },

  async createDocument(payload) {
    return request('/documents', {
      method: 'POST',
      body: payload,
    })
  },

  async actionDocument(id, { action, notes = '', next_approver_id = null, pin = null }) {
    return request(`/documents/${id}/action`, {
      method: 'POST',
      body: {
        action,
        note: notes,
        next_approver_id,
        pin,
      },
    })
  },

  getDocumentPdfUrl(id) {
    const token = getToken()
    return `${API_BASE_URL}/documents/${id}/pdf?token=${encodeURIComponent(token)}`
  },

  // Approvers list
  async getApprovers() {
    return request('/approvers')
  },

  // Profile & Digital Signature
  async getProfile() {
    return request('/profile')
  },

  async updateProfile(data) {
    return request('/profile', {
      method: 'PUT',
      body: data,
    })
  },

  async uploadSignature(formData) {
    const token = getToken()
    const res = await fetch(`${API_BASE_URL}/profile/signature`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    })
    const json = await res.json()
    if (!res.ok) {
      throw new Error(json.message || Object.values(json.errors || {})[0]?.[0] || 'Gagal mengunggah tanda tangan')
    }
    return json
  },

  getSignatureUrl(bustCache = false) {
    const token = getToken()
    const cb = bustCache ? `&t=${Date.now()}` : ''
    return `${API_BASE_URL}/profile/signature?token=${encodeURIComponent(token)}${cb}`
  },

  async verifyPin(pin) {
    return request('/profile/verify-pin', {
      method: 'POST',
      body: { pin },
    })
  },

  async deleteSignature() {
    return request('/profile/signature', {
      method: 'DELETE',
    })
  },

  // Master Data Aset TI
  async getAssets(params = {}) {
    const query = new URLSearchParams(params).toString()
    return request(`/assets${query ? `?${query}` : ''}`)
  },

  async getAsset(id) {
    return request(`/assets/${id}`)
  },

  // Master Data Jabatan & Posisi
  async getPositions() {
    return request('/positions')
  },

  // Dokumen: Submit / Pengesahan
  async submitDocument(id, payload = {}) {
    return request(`/documents/${id}/submit`, {
      method: 'POST',
      body: payload,
    })
  },

  // BAST: Tanda Tangan Pihak Kedua
  async signDocument(id, signaturePin) {
    return request(`/documents/${id}/sign`, {
      method: 'POST',
      body: { signature_pin: signaturePin },
    })
  },
}
