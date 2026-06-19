import { useRef } from 'react'
import type { ImageValue } from '../../lottie/controls'
import { fileToImageValue } from '../../lib/image'

interface Props {
  label: string
  value: ImageValue | null
  onChange: (v: ImageValue | null) => void
}

export function ImageUpload({ label, value, onChange }: Props) {
  const ref = useRef<HTMLInputElement>(null)

  const handleFile = async (file?: File) => {
    if (!file) return
    const img = await fileToImageValue(file)
    onChange(img)
  }

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-2">
        <button
          onClick={() => ref.current?.click()}
          className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-400"
        >
          {value ? (
            <img src={value.dataUri} alt="" className="h-full w-full object-contain" />
          ) : (
            <span className="text-xl">+</span>
          )}
        </button>
        <div className="flex flex-col gap-1">
          <button onClick={() => ref.current?.click()} className="text-xs text-brand hover:underline">
            {value ? '변경' : '업로드'}
          </button>
          {value && (
            <button onClick={() => onChange(null)} className="text-xs text-gray-400 hover:text-red-400">
              제거
            </button>
          )}
        </div>
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  )
}
