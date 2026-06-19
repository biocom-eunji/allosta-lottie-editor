import type { ImageValue } from '../lottie/controls'
import { getToken } from '../tokens/colors'

export interface RasterizeOpts {
  size?: number
  weight?: number
  color?: string
  maxWidth?: number
  font?: string
}

/**
 * 텍스트를 canvas 로 그려 base64 PNG(ImageValue)로 반환.
 * 브라우저 전용 — document 가 없으면(node 등) null.
 * retina 대응을 위해 2x 로 그린다 (레이어에서 50% 스케일).
 */
export function rasterizeText(text: string, opts: RasterizeOpts = {}): ImageValue | null {
  if (typeof document === 'undefined') return null
  if (!text) return null

  const scale = 2
  const size = opts.size ?? 15
  const weight = opts.weight ?? 400
  const color = opts.color ?? getToken('Mono/Neutral-900')
  const family = opts.font ?? "-apple-system, 'Pretendard', sans-serif"
  const font = `${weight} ${size * scale}px ${family}`

  const measure = document.createElement('canvas').getContext('2d')!
  measure.font = font
  let display = text
  let w = measure.measureText(display).width
  const maxW = (opts.maxWidth ?? 220) * scale
  if (w > maxW) {
    // 말줄임
    while (display.length > 1 && measure.measureText(display + '…').width > maxW) {
      display = display.slice(0, -1)
    }
    display += '…'
    w = measure.measureText(display).width
  }

  const padX = 2 * scale
  const cw = Math.ceil(w + padX * 2)
  const ch = Math.ceil(size * scale * 1.4)

  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d')!
  ctx.font = font
  ctx.fillStyle = color
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.fillText(display, padX, ch / 2)

  return { dataUri: canvas.toDataURL('image/png'), w: cw, h: ch }
}
