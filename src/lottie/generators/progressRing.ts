import { anim, fill, group, keyframes, rect, resetInd, root, shapeLayer, transform, val } from '../builders'
import type { ColorValue, Params } from '../controls'
import { BRAND_HEX, getToken, hexToRgb, rgbToHex, type GradientStop } from '../../tokens/colors'
import type { LottieJSON, ShapeItem } from '../types'

export interface ProgressRingParams extends Params {
  strokeWidth: number
  color: ColorValue
}

export const progressRingDefaults: ProgressRingParams = {
  strokeWidth: 13,
  color: {
    mode: 'gradient',
    hex: BRAND_HEX,
    opacity: 100,
    gradientType: 1,
    stops: [
      { pos: 0, hex: BRAND_HEX },
      { pos: 1, hex: getToken('Brand/Mint-200') },
    ],
  },
}

const N = 8 // 스포크 개수

function sampleHex(color: ColorValue, t: number): string {
  if (color.mode !== 'gradient' || !color.stops || !color.stops.length) return color.hex
  const stops = [...(color.stops as GradientStop[])].sort((a, b) => a.pos - b.pos)
  if (t <= stops[0].pos) return stops[0].hex
  const last = stops[stops.length - 1]
  if (t >= last.pos) return last.hex
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i]
    const b = stops[i + 1]
    if (t >= a.pos && t <= b.pos) {
      const f = (t - a.pos) / (b.pos - a.pos || 1)
      const ca = hexToRgb(a.hex)
      const cb = hexToRgb(b.hex)
      return rgbToHex([ca[0] + (cb[0] - ca[0]) * f, ca[1] + (cb[1] - ca[1]) * f, ca[2] + (cb[2] - ca[2]) * f])
    }
  }
  return last.hex
}

export function generateProgressRing(p: ProgressRingParams): LottieJSON {
  resetInd()
  const W = 300
  const H = 300
  const cx = W / 2
  const cy = H / 2
  const P = 80
  const outerR = 90
  const innerR = 52
  const len = outerR - innerR
  const midR = (outerR + innerR) / 2
  const width = p.strokeWidth

  // 8개 스포크를 항상 전부 렌더 (둥근 캡슐), 인덱스별 graduated opacity/색
  const spokes: ShapeItem[] = []
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1)
    const hex = sampleHex(p.color, t)
    const op = 100 - (i / N) * 84 // 진(100) -> 연(16) 그라데이션
    spokes.push(
      group(
        [
          rect({ size: val([width, len], 2), position: val([0, -midR], 3), roundness: val(width / 2, 4) }),
          fill(hex, (p.color.opacity / 100) * op),
        ],
        transform({ r: val(i * (360 / N), 10) }),
        `spoke-${i}`,
      ),
    )
  }

  // 전체 그룹을 N단계 stepped 회전 (틱틱 도는 스피너)
  const ring = group(
    spokes,
    transform({
      p: val([cx, cy], 2),
      r: anim(
        keyframes(Array.from({ length: N + 1 }, (_, k) => ({ t: Math.round((k / N) * P), s: [k * (360 / N)], ease: 'hold' as const }))),
        10,
      ),
    }),
    'spinner',
  )
  return root({ name: 'progress-gradient', w: W, h: H, op: P, layers: [shapeLayer({ name: 'spinner', shapes: [ring], ip: 0, op: P })] })
}
