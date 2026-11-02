import { ChevronLeft, ChevronRight } from 'lucide-react'

function pageList(current, last) {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1)
  const set = new Set([1, 2, 3, last, current - 1, current, current + 1])
  const nums = [...set].filter((n) => n >= 1 && n <= last).sort((a, b) => a - b)
  const out = []
  nums.forEach((n, i) => {
    if (i && n - nums[i - 1] > 1) out.push('...')
    out.push(n)
  })
  return out
}

export default function TablePagination({ meta, label, onPage }) {
  if (!meta) return null
  const { current_page: cur, last_page: last, from, to, total } = meta
  return (
    <div className="flex items-center justify-between px-5 py-3 text-[11px] text-slate-600">
      <span>
        Menampilkan <b>{from ?? 0}</b> - <b>{to ?? 0}</b> dari total <b>{total}</b> {label}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={cur <= 1}
          onClick={() => onPage(cur - 1)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-100 text-slate-500 disabled:opacity-50 hover:bg-slate-200"
        >
          <ChevronLeft className="w-3 h-3" /> Sebelumnya
        </button>
        {pageList(cur, last).map((p, i) =>
          p === '...' ? (
            <span key={`d${i}`} className="px-1 text-slate-400">...</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPage(p)}
              className={`w-7 h-7 rounded-md font-semibold ${
                p === cur ? 'bg-[#0b2046] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          disabled={cur >= last}
          onClick={() => onPage(cur + 1)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-100 text-slate-700 disabled:opacity-50 hover:bg-slate-200"
        >
          Selanjutnya <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

const AVATAR_TONES = ['bg-[#0b2046] text-white', 'bg-[#a8390a] text-white', 'bg-[#4a5f8a] text-white', 'bg-[#c9ced8] text-slate-700', 'bg-[#d6e4fb] text-[#0b2046]']

export function Avatar({ name = '', id = 0 }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  return (
    <span className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold ${AVATAR_TONES[id % AVATAR_TONES.length]}`}>
      {initials || '?'}
    </span>
  )
}

