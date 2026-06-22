import { anim, ellipse, fill, group, keyframes, radialGlow, resetInd, root, shapeLayer, transform, val } from '../builders'
import { getToken } from '../../tokens/colors'
import { FLAME_H, FLAME_INNER_POS, flameInnerPath, flameOuterPath, outerPaint } from './flameShape'
import type { ColorValue, Params } from '../controls'
import type { Layer, LottieJSON } from '../types'

// streak-flame — 첨부 SVG 불꽃 형태 + 깜빡임(flicker) + 글로우. (전부 shape+keyframe, RN 안전)

const W = 300
const H = 300

export interface StreakFlameParams extends Params {
  flameColor: ColorValue // 외곽 불꽃 (gradient 가능)
  coreColor: ColorValue // 내부 불꽃(하이라이트)
  glowColor: ColorValue
  glowIntensity: number // 0~100
  speed: number // 50~200 (%)
  size: number // px (불꽃 높이 기준)
}

export const streakFlameDefaults: StreakFlameParams = {
  flameColor: {
    mode: 'gradient',
    hex: getToken('Semantic/Orange-300'),
    opacity: 100,
    gradientType: 1,
    stops: [
      { pos: 0, hex: getToken('Semantic/Orange-300') }, // 위(끝)
      { pos: 1, hex: getToken('Semantic/Orange-400') }, // 아래(밑동)
    ],
  },
  coreColor: { mode: 'solid', hex: getToken('Semantic/Yellow-50'), opacity: 100 },
  glowColor: { mode: 'solid', hex: getToken('Semantic/Orange-300'), opacity: 100 },
  glowIntensity: 60,
  speed: 100,
  size: 150,
}

export function generateStreakFlame(p: StreakFlameParams): LottieJSON {
  resetInd()
  const speed = Math.max(50, Math.min(200, p.speed))
  const P = Math.max(20, Math.round(60 * (100 / speed)))
  const cx = W / 2
  const cy = H / 2
  const scl = (p.size / FLAME_H) * 100

  const layers: Layer[] = []

  // 글로우 (불꽃 뒤, radial — blur 미사용)
  const glowSize = p.size * 2.2
  layers.push(
    shapeLayer({
      name: 'glow',
      shapes: [
        group(
          [ellipse({ size: val([glowSize, glowSize], 2) }), radialGlow({ hex: p.glowColor.hex, opacity: 100, size: glowSize })],
          transform({
            p: val([cx, cy + p.size * 0.08], 2),
            o: anim(keyframes([
              { t: 0, s: [Math.round(p.glowIntensity * 0.7)], ease: 'in-out' },
              { t: Math.round(P / 2), s: [p.glowIntensity], ease: 'in-out' },
              { t: P, s: [Math.round(p.glowIntensity * 0.7)], ease: 'in-out' },
            ]), 11),
            s: anim(keyframes([
              { t: 0, s: [94, 94], ease: 'in-out' },
              { t: Math.round(P / 2), s: [104, 104], ease: 'in-out' },
              { t: P, s: [94, 94], ease: 'in-out' },
            ]), 6),
          }),
          'glow',
        ),
      ],
      ip: 0,
      op: P,
    }),
  )

  // 불꽃 (외곽 + 내부) — flicker: 세로 스트레치 호흡 + 좌우 미세 sway
  const flame = group(
    [
      group([flameInnerPath(), fill(p.coreColor.hex, p.coreColor.opacity)], transform({
        // 내부 불꽃: 자기 중심에 배치(앵커 0,0) → 펄스 시 형태 유지
        p: val([FLAME_INNER_POS[0], FLAME_INNER_POS[1]], 2),
        a: val([0, 0], 1),
        s: anim(keyframes([
          { t: 0, s: [100, 100], ease: 'in-out' },
          { t: Math.round(P * 0.45), s: [90, 110], ease: 'in-out' },
          { t: P, s: [100, 100], ease: 'in-out' },
        ]), 6),
      }), 'inner'),
      group([flameOuterPath(), outerPaint(p.flameColor)], transform(), 'outer'),
    ],
    transform({
      p: anim(keyframes([
        { t: 0, s: [cx, cy], ease: 'in-out' },
        { t: Math.round(P * 0.5), s: [cx, cy - p.size * 0.03], ease: 'in-out' },
        { t: P, s: [cx, cy], ease: 'in-out' },
      ]), 2),
      a: val([0, 0], 1),
      s: anim(keyframes([
        { t: 0, s: [scl, scl], ease: 'in-out' },
        { t: Math.round(P * 0.28), s: [scl * 0.95, scl * 1.06], ease: 'in-out' },
        { t: Math.round(P * 0.6), s: [scl * 1.04, scl * 0.97], ease: 'in-out' },
        { t: P, s: [scl, scl], ease: 'in-out' },
      ]), 6),
      r: anim(keyframes([
        { t: 0, s: [-2.5], ease: 'in-out' },
        { t: Math.round(P / 2), s: [2.5], ease: 'in-out' },
        { t: P, s: [-2.5], ease: 'in-out' },
      ]), 10),
    }),
    'flame',
  )
  layers.push(shapeLayer({ name: 'flame', shapes: [flame], ip: 0, op: P }))

  return root({ name: 'streak-flame', w: W, h: H, op: P, layers })
}
