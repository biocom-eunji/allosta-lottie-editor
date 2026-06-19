interface Props {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  caption?: (v: number) => string
  onChange: (v: number) => void
}

export function Slider({ label, value, min, max, step = 1, unit, caption, onChange }: Props) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => onChange(clamp(Number(e.target.value), min, max))}
            className="w-16 rounded-md border border-gray-200 bg-white px-2 py-1 text-right text-sm tabular-nums"
          />
          {unit && <span className="text-xs text-gray-400">{unit}</span>}
        </div>
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-brand"
      />
      {caption && <div className="text-xs text-gray-400">{caption(value)}</div>}
    </div>
  )
}

function clamp(v: number, min: number, max: number) {
  if (Number.isNaN(v)) return min
  return Math.max(min, Math.min(max, v))
}
