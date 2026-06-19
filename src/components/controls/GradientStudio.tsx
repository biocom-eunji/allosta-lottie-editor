import { useRef, useState } from 'react'
import type { ColorValue } from '../../lottie/controls'
import type { GradientStop } from '../../tokens/colors'
import { ColorChipPicker } from './ColorChipPicker'

// percent-spot 스타일 그라데이션 에디터.
// Solid|Gradient 토글 + 2D 캔버스(드래그 핸들) + 스톱 카드(색 점 / 색피커 / 면적 슬라이더+%).
// 값 계약은 ColorValue(mode/hex/stops). stops 의 pos = gradient offset, x/y = 핸들 위치(UI 전용).

interface Props {
  label?: string
  value: ColorValue
  onChange: (v: ColorValue) => void
}

const FALLBACK: ColorValue = { mode: 'solid', hex: '#000000', opacity: 100 }
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

function defaultStops(v: ColorValue): GradientStop[] {
  return (
    v.stops ?? [
      { pos: 0, hex: v.hex },
      { pos: 1, hex: '#7FE6DF' },
    ]
  )
}

const hx = (s: GradientStop) => (s.x ?? s.pos)
const hy = (s: GradientStop) => (s.y ?? s.pos)

export function GradientStudio({ label, value: rawValue, onChange }: Props) {
  const value = rawValue ?? FALLBACK
  const stops = defaultStops(value)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  const setMode = (mode: 'solid' | 'gradient') => {
    if (mode === 'gradient') onChange({ ...value, mode, stops })
    else onChange({ ...value, mode: 'solid' })
  }

  const commit = (next: GradientStop[]) => onChange({ ...value, mode: 'gradient', stops: next, hex: next[0]?.hex ?? value.hex })
  const updateStop = (i: number, patch: Partial<GradientStop>) => commit(stops.map((s, idx) => (idx === i ? { ...s, ...patch } : s)))
  const addStop = () => {
    if (stops.length >= 3) return
    commit([...stops, { pos: 0.5, x: 0.5, y: 0.5, hex: '#FFFFFF' }])
  }
  const removeStop = (i: number) => {
    if (stops.length <= 2) return
    commit(stops.filter((_, idx) => idx !== i))
  }

  // 캔버스 미리보기 (대각선) — pos 순 정렬
  const css = `linear-gradient(135deg, ${[...stops]
    .sort((a, b) => a.pos - b.pos)
    .map((s) => `${s.hex} ${Math.round(s.pos * 100)}%`)
    .join(', ')})`

  const onMove = (e: React.PointerEvent) => {
    if (dragIdx == null || !canvasRef.current) return
    const r = canvasRef.current.getBoundingClientRect()
    const nx = clamp01((e.clientX - r.left) / r.width)
    const ny = clamp01((e.clientY - r.top) / r.height)
    updateStop(dragIdx, { x: nx, y: ny, pos: clamp01((nx + ny) / 2) })
  }

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}

      {/* Solid | Gradient 토글 */}
      <div className="flex rounded-lg bg-gray-100 p-0.5">
        <button
          onClick={() => setMode('solid')}
          className={`flex-1 rounded-md py-1 text-xs font-medium ${value.mode === 'solid' ? 'bg-brand text-white shadow-sm' : 'text-gray-600'}`}
        >
          Solid
        </button>
        <button
          onClick={() => setMode('gradient')}
          className={`flex-1 rounded-md py-1 text-xs font-medium ${value.mode === 'gradient' ? 'bg-brand text-white shadow-sm' : 'text-gray-600'}`}
        >
          Gradient
        </button>
      </div>

      {value.mode === 'solid' ? (
        <ColorChipPicker value={value} onChange={(v) => onChange({ ...v, mode: 'solid' })} />
      ) : (
        <div className="space-y-2">
          {/* 2D 캔버스 + 드래그 핸들 */}
          <div
            ref={canvasRef}
            onPointerMove={onMove}
            onPointerUp={(e) => {
              setDragIdx(null)
              try {
                canvasRef.current?.releasePointerCapture(e.pointerId)
              } catch {
                /* noop */
              }
            }}
            className="relative aspect-square w-full select-none rounded-xl border border-gray-200"
            style={{ background: css, touchAction: 'none' }}
          >
            {stops.map((s, i) => (
              <button
                key={i}
                onPointerDown={(e) => {
                  setDragIdx(i)
                  try {
                    canvasRef.current?.setPointerCapture(e.pointerId)
                  } catch {
                    /* noop */
                  }
                }}
                className="absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-white shadow active:cursor-grabbing"
                style={{ left: `${hx(s) * 100}%`, top: `${hy(s) * 100}%`, backgroundColor: s.hex }}
                title={`스톱 ${i + 1}`}
              />
            ))}
          </div>

          {/* 스톱 카드 리스트 */}
          <div className="space-y-2">
            {stops.map((s, i) => (
              <div key={i} className="rounded-lg bg-gray-50 p-2">
                <div className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-gray-200" style={{ backgroundColor: s.hex }} />
                  <div className="flex-1">
                    <ColorChipPicker
                      value={{ mode: 'solid', hex: s.hex, opacity: 100, tokenName: undefined }}
                      hideOpacity
                      onChange={(v) => updateStop(i, { hex: v.hex })}
                    />
                  </div>
                  {stops.length > 2 && (
                    <button onClick={() => removeStop(i)} className="text-gray-300 hover:text-red-400" title="스톱 제거">
                      ✕
                    </button>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="w-8 shrink-0 text-xs text-gray-400">면적</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(s.pos * 100)}
                    onChange={(e) => {
                      const v = Number(e.target.value) / 100
                      updateStop(i, { pos: v, x: v, y: v })
                    }}
                    className="flex-1 accent-brand"
                  />
                  <span className="w-9 text-right text-xs tabular-nums text-gray-400">{Math.round(s.pos * 100)}%</span>
                </div>
              </div>
            ))}
          </div>

          {stops.length < 3 && (
            <button onClick={addStop} className="text-xs text-brand hover:underline">
              + 스톱 추가
            </button>
          )}
        </div>
      )}
    </div>
  )
}
