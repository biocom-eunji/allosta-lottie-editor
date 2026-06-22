import { anim, ellipse, fill, group, keyframes, resetInd, root, shapeLayer, transform, val } from '../builders'
import { getToken, hexToRgb } from '../../tokens/colors'
import { FLAME_H, flameInnerPath, flameOuterPath } from './flameShape'
import type { ColorValue, Params } from '../controls'
import type { Layer, LottieJSON, ShapeItem } from '../types'

// streak-broken — 첨부 SVG 불꽃이 회색으로 사그라들며 축소·페이드 + 연기. (RN 안전)

const W = 300
const H = 300
const FLAME_SIZE = 150

export interface StreakBrokenParams extends Params {
  color: ColorValue
  fadeSpeed: number // 50~200
}

export const streakBrokenDefaults: StreakBrokenParams = {
  color: { mode: 'solid', hex: getToken('Semantic/Orange-300'), opacity: 100 },
  fadeSpeed: 100,
}

export function generateStreakBroken(p: StreakBrokenParams): LottieJSON {
  resetInd()
  const speed = Math.max(50, Math.min(200, p.fadeSpeed))
  const P = Math.max(20, Math.round(70 * (100 / speed)))
  const cx = W / 2
  const cy = H / 2
  const scl = (FLAME_SIZE / FLAME_H) * 100
  const f = (frac: number) => Math.round(frac * P)

  const [r, g, b] = hexToRgb(p.color.hex)
  const [gr, gg, gb] = hexToRgb(getToken('Mono/Neutral-400')) // 사그라든 재 색

  // 외곽 불꽃 — 색이 회색으로 desaturate
  const outerFill: ShapeItem = {
    ty: 'fl',
    c: anim(keyframes([
      { t: 0, s: [r, g, b, 1], ease: 'in-out' },
      { t: f(0.7), s: [gr, gg, gb, 1], ease: 'in-out' },
    ]), 4),
    o: val(p.color.opacity, 5),
    r: 1,
    nm: 'Fill',
  }

  const flame = group(
    [
      group([flameInnerPath(), fill(getToken('Semantic/Yellow-50'), 100)], transform({
        o: anim(keyframes([{ t: 0, s: [100] }, { t: f(0.45), s: [0] }]), 11),
      }), 'inner'),
      group([flameOuterPath(), outerFill], transform(), 'outer'),
    ],
    transform({
      p: val([cx, cy], 2),
      a: val([0, 0], 1),
      s: anim(keyframes([
        { t: 0, s: [scl, scl], ease: 'in-out' },
        { t: f(0.18), s: [scl * 1.04, scl * 1.04], ease: 'in-out' },
        { t: P, s: [scl * 0.5, scl * 0.62], ease: 'in' }, // 사그라들며 쪼그라듦
      ]), 6),
      r: anim(keyframes([{ t: 0, s: [0], ease: 'in-out' }, { t: P, s: [10], ease: 'in-out' }]), 10),
      o: anim(keyframes([
        { t: 0, s: [100], ease: 'linear' },
        { t: f(0.6), s: [100], ease: 'in' },
        { t: P, s: [0], ease: 'in' },
      ]), 11),
    }),
    'flame',
  )

  // 연기 퍼프 3개 (위로 떠오르며 사라짐)
  const smoke: Layer[] = []
  for (let i = 0; i < 3; i++) {
    const sx = cx + (i - 1) * 18
    const delay = f(0.45) + i * Math.round(P * 0.08)
    smoke.push(
      shapeLayer({
        name: `smoke-${i}`,
        shapes: [group([ellipse({ size: val([26, 26], 2) }), fill(getToken('Mono/Neutral-300'), 100)], transform({
          p: anim(keyframes([{ t: delay, s: [sx, cy - 20], ease: 'out' }, { t: P, s: [sx + (i - 1) * 10, cy - 90], ease: 'out' }]), 2),
          s: anim(keyframes([{ t: delay, s: [40, 40], ease: 'out' }, { t: P, s: [120, 120], ease: 'out' }]), 6),
          o: anim(keyframes([{ t: delay, s: [0] }, { t: delay + Math.round(P * 0.12), s: [40] }, { t: P, s: [0] }]), 11),
        }), `smoke-${i}`)],
        ip: 0,
        op: P,
      }),
    )
  }

  return root({ name: 'streak-broken', w: W, h: H, op: P, layers: [...smoke, shapeLayer({ name: 'flame', shapes: [flame], ip: 0, op: P })] })
}
