import type { ControlSchema, ColorValue, ImageValue, Params } from '../lottie/controls'
import { Slider } from './controls/Slider'
import { ColorChipPicker } from './controls/ColorChipPicker'
import { GradientStudio } from './controls/GradientStudio'
import { TextInput } from './controls/TextInput'
import { SegmentedToggle } from './controls/SegmentedToggle'
import { ImageUpload } from './controls/ImageUpload'

interface Props {
  controls: ControlSchema[]
  params: Params
  onChange: (key: string, value: Params[string]) => void
}

export function PropertyPanel({ controls, params, onChange }: Props) {
  const visible = controls.filter((c) => {
    if (!c.visibleWhen) return true
    return String(params[c.visibleWhen.key]) === c.visibleWhen.equals
  })
  return (
    <div className="space-y-5">
      {visible.map((c) => (
        <Control key={c.key} control={c} params={params} onChange={onChange} />
      ))}
    </div>
  )
}

function Control({ control, params, onChange }: { control: ControlSchema; params: Params; onChange: Props['onChange'] }) {
  const value = params[control.key]

  switch (control.type) {
    case 'slider':
      return (
        <Slider
          label={control.label}
          value={(value as number) ?? control.min}
          min={control.min}
          max={control.max}
          step={control.step}
          unit={control.unit}
          caption={control.caption}
          onChange={(v) => onChange(control.key, v)}
        />
      )
    case 'color':
      if (control.studio) {
        return <GradientStudio label={control.label} value={value as ColorValue} onChange={(v) => onChange(control.key, v)} />
      }
      return (
        <ColorChipPicker
          label={control.label}
          value={value as ColorValue}
          allowGradient={control.allowGradient}
          hideOpacity={control.hideOpacity}
          onChange={(v) => onChange(control.key, v)}
        />
      )
    case 'text':
      return (
        <TextInput
          label={control.label}
          value={(value as string) ?? ''}
          placeholder={control.placeholder}
          onChange={(v) => onChange(control.key, v)}
        />
      )
    case 'segmented':
      return (
        <SegmentedToggle
          label={control.label}
          value={value as string}
          options={control.options}
          onChange={(v) => onChange(control.key, v)}
        />
      )
    case 'toggle':
      return (
        <label className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">{control.label}</span>
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(control.key, e.target.checked)}
            className="h-4 w-4 accent-brand"
          />
        </label>
      )
    case 'image':
      return (
        <ImageUpload
          label={control.label}
          value={(value as ImageValue) ?? null}
          onChange={(v) => onChange(control.key, v as Params[string])}
        />
      )
    case 'imageList': {
      const list = (value as (ImageValue | null)[]) ?? Array.from({ length: control.count }, () => null)
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">{control.label}</label>
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: control.count }).map((_, i) => (
              <ImageUpload
                key={i}
                label={`파티클 ${i + 1}`}
                value={list[i] ?? null}
                onChange={(v) => {
                  const next = [...list]
                  next[i] = v
                  onChange(control.key, next as Params[string])
                }}
              />
            ))}
          </div>
        </div>
      )
    }
    default:
      return null
  }
}
