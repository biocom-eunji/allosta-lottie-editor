interface Props {
  label: string
  value: string
  placeholder?: string
  onChange: (v: string) => void
}

export function TextInput({ label, value, placeholder, onChange }: Props) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
      />
    </div>
  )
}
