interface Props {
  label?: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}

export function SegmentedToggle({ label, value, options, onChange }: Props) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <div className="flex rounded-lg bg-gray-100 p-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              value === opt.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
