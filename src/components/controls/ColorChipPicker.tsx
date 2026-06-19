import { useMemo, useState } from 'react'
import { SYSTEM_TOKENS, TOKEN_COLLECTIONS, colorLabel, type TokenColor } from '../../tokens/colors'
import type { ColorValue } from '../../lottie/controls'
import { GradientEditor } from './GradientEditor'

interface Props {
  label?: string
  value: ColorValue
  allowGradient?: boolean
  /** opacity 슬라이더 숨김 (그라디언트 스톱 등) */
  hideOpacity?: boolean
  onChange: (v: ColorValue) => void
}

type Tab = 'custom' | 'libraries'

const FALLBACK: ColorValue = { mode: 'solid', hex: '#000000', opacity: 100 }
const ALL = 'All libraries'

export function ColorChipPicker({ label, value: rawValue, allowGradient, hideOpacity, onChange }: Props) {
  const value = rawValue ?? FALLBACK
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('libraries')
  const [search, setSearch] = useState('')
  const [collection, setCollection] = useState<string>(ALL)

  const setMode = (mode: 'solid' | 'gradient') => {
    if (mode === 'gradient' && !value.stops) {
      onChange({ ...value, mode, stops: [{ pos: 0, hex: value.hex }, { pos: 1, hex: '#ffffff' }], gradientType: 1 })
    } else {
      onChange({ ...value, mode })
    }
  }

  const pickToken = (t: TokenColor) => {
    onChange({ ...value, hex: t.hex, opacity: Math.round(t.alpha * 100), tokenName: t.name })
  }
  const setCustomHex = (hex: string) => {
    onChange({ ...value, hex, tokenName: undefined })
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return SYSTEM_TOKENS.filter((t) => {
      if (collection !== ALL && t.collection !== collection) return false
      if (!q) return true
      return t.label.toLowerCase().includes(q) || t.family.toLowerCase().includes(q) || t.hex.toLowerCase().includes(q)
    })
  }, [search, collection])

  const isGradient = value.mode === 'gradient' && allowGradient

  return (
    <div className="space-y-1.5">
      {/* 필드 라벨 — 피커 바깥 위 */}
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}

      {/* 닫힌 pill: 스와치 + 값 + chevron */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-lg border border-gray-200 px-2 py-1.5 text-left hover:border-gray-300"
      >
        <span
          className="h-5 w-5 shrink-0 rounded-md border border-gray-200"
          style={
            isGradient
              ? { background: gradientCss(value) }
              : { backgroundColor: value.hex, opacity: value.opacity / 100 }
          }
        />
        <span className="truncate text-xs tabular-nums text-gray-500">
          {isGradient ? 'Gradient' : colorLabel(value.hex, value.tokenName)}
        </span>
        <Chevron className="ml-auto text-gray-400" />
      </button>

      {open && (
        <div className="rounded-lg border border-gray-200 p-2">
          {/* 모드 토글 (gradient 허용 시) */}
          {allowGradient && (
            <div className="mb-2 flex rounded-md bg-gray-100 p-0.5">
              <button
                onClick={() => setMode('solid')}
                className={`flex-1 rounded px-2 py-0.5 text-xs ${value.mode === 'solid' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
              >
                Solid
              </button>
              <button
                onClick={() => setMode('gradient')}
                className={`flex-1 rounded px-2 py-0.5 text-xs ${value.mode === 'gradient' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
              >
                Gradient
              </button>
            </div>
          )}

          {isGradient ? (
            <GradientEditor
              stops={value.stops ?? [{ pos: 0, hex: value.hex }, { pos: 1, hex: '#ffffff' }]}
              type={value.gradientType ?? 1}
              onChange={(stops, type) => onChange({ ...value, stops, gradientType: type })}
            />
          ) : (
            <>
              {/* 탭 + 닫기(X) */}
              <div className="mb-2 flex items-center border-b border-gray-100">
                <button
                  onClick={() => setTab('custom')}
                  className={`-mb-px border-b-2 px-1 pb-1.5 text-xs ${
                    tab === 'custom' ? 'border-gray-900 font-semibold text-gray-900' : 'border-transparent text-gray-400'
                  }`}
                >
                  Custom
                </button>
                <button
                  onClick={() => setTab('libraries')}
                  className={`-mb-px ml-3 border-b-2 px-1 pb-1.5 text-xs ${
                    tab === 'libraries' ? 'border-gray-900 font-semibold text-gray-900' : 'border-transparent text-gray-400'
                  }`}
                >
                  Libraries
                </button>
                <button onClick={() => setOpen(false)} className="ml-auto pb-1.5 text-gray-300 hover:text-gray-600" title="닫기">
                  ✕
                </button>
              </div>

              {tab === 'custom' ? (
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={value.hex}
                    onChange={(e) => setCustomHex(e.target.value)}
                    className="h-8 w-8 cursor-pointer rounded border border-gray-200"
                  />
                  <input
                    type="text"
                    value={value.hex}
                    onChange={(e) => setCustomHex(e.target.value)}
                    placeholder="#a855f7"
                    className="w-28 rounded-md border border-gray-200 bg-white px-2 py-1 text-sm"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  {/* 검색 (돋보기 아이콘) */}
                  <div className="relative">
                    <SearchIcon className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="색 검색 (예: green)"
                      className="w-full rounded-md border border-gray-200 bg-white py-1 pl-7 pr-2 text-sm"
                    />
                  </div>

                  {/* 컬렉션 필터 — 컴팩트 pill + 단일 chevron */}
                  <div className="relative">
                    <select
                      value={collection}
                      onChange={(e) => setCollection(e.target.value)}
                      className="w-full appearance-none rounded-md border border-gray-200 bg-white py-1 pl-2 pr-7 text-xs text-gray-600"
                    >
                      <option value={ALL}>{ALL}</option>
                      {TOKEN_COLLECTIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <Chevron className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>

                  {/* 칩 리스트 — 라운드 사각 스와치 + 이름 (hex 미표시, 헤더 없음, 타이트) */}
                  <div className="max-h-56 overflow-y-auto pr-1">
                    {filtered.length === 0 && <div className="px-1 py-2 text-xs text-gray-400">검색 결과 없음</div>}
                    {filtered.map((t) => {
                      const selected = value.hex.toLowerCase() === t.hex.toLowerCase()
                      return (
                        <button
                          key={`${t.collection}-${t.name}`}
                          onClick={() => pickToken(t)}
                          className={`flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left hover:bg-gray-50 ${selected ? 'bg-gray-50 ring-1 ring-brand' : ''}`}
                        >
                          <span
                            className="h-4 w-4 shrink-0 rounded border border-gray-200"
                            style={{ backgroundColor: t.hex, opacity: t.alpha }}
                          />
                          <span className="text-xs text-gray-700">{t.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* opacity */}
              {!hideOpacity && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-gray-400">Opacity</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={value.opacity}
                    onChange={(e) => onChange({ ...value, opacity: Number(e.target.value) })}
                    className="flex-1 accent-brand"
                  />
                  <span className="w-9 text-right text-xs tabular-nums text-gray-400">{value.opacity}%</span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function Chevron({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SearchIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function gradientCss(v: ColorValue): string {
  const stops = (v.stops ?? [{ pos: 0, hex: v.hex }, { pos: 1, hex: '#ffffff' }])
    .slice()
    .sort((a, b) => a.pos - b.pos)
    .map((s) => `${s.hex} ${Math.round(s.pos * 100)}%`)
    .join(', ')
  return `linear-gradient(90deg, ${stops})`
}
