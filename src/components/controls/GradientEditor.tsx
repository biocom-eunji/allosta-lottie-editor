import type { GradientStop } from'../../tokens/colors'
import { ColorChipPicker } from './ColorChipPicker'

interface Props {
  stops: GradientStop[]
  type: 1 | 2
  onChange: (stops: GradientStop[], type: 1 | 2) => void
}

/** 스톱(위치 + hex)과 각 스톱 면적(%)을 편집하는 그라디언트 에디터 */
export function GradientEditor({ stops, type, onChange }: Props) {
  const css = `linear-gradient(90deg, ${[...stops]
    .sort((a, b) => a.pos - b.pos)
    .map((s) => `${s.hex} ${Math.round(s.pos * 100)}%`)
    .join(', ')})`

  const update = (i: number, patch: Partial<GradientStop>) => {
    const next = stops.map((s, idx) => (idx === i ? { ...s, ...patch } : s))
    onChange(next, type)
  }
  const addStop = () => {
    onChange([...stops, { pos: 1, hex: '#ffffff' }], type)
  }
  const removeStop = (i: number) => {
    if (stops.length <= 2) return
    onChange(
      stops.filter((_, idx) => idx !== i),
      type,
    )
  }

  return (
    <div className="space-y-2">
      <div className="h-6 w-full rounded-md border border-gray-200" style={{ background: css }} />

      <div className="flex gap-2">
        <button
          onClick={() => onChange(stops, 1)}
          className={`flex-1 rounded-md py-1 text-xs ${type === 1 ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          Linear
        </button>
        <button
          onClick={() => onChange(stops, 2)}
          className={`flex-1 rounded-md py-1 text-xs ${type === 2 ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          Radial
        </button>
      </div>

      <div className="space-y-2">
        {stops.map((s, i) => (
          <div key={i} className="space-y-1 rounded-md border border-gray-100 p-1.5">
            <div className="flex items-center gap-2">
              {/* 스톱 색 = 시스템 토큰 칩 피커 (opacity 미사용) */}
              <div className="flex-1">
                <ColorChipPicker
                  value={{ mode: 'solid', hex: s.hex, opacity: 100 }}
                  hideOpacity
                  onChange={(v) => update(i, { hex: v.hex })}
                />
              </div>
              <button
                onClick={() => removeStop(i)}
                disabled={stops.length <= 2}
                className="text-gray-300 hover:text-red-400 disabled:opacity-30"
                title="스톱 제거"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(s.pos * 100)}
                onChange={(e) => update(i, { pos: Number(e.target.value) / 100 })}
                className="flex-1 accent-brand"
              />
              <span className="w-9 text-right text-xs tabular-nums text-gray-400">{Math.round(s.pos * 100)}%</span>
            </div>
          </div>
        ))}
      </div>

      <button onClick={addStop} className="text-xs text-brand hover:underline">
        + 스톱 추가
      </button>
    </div>
  )
}
