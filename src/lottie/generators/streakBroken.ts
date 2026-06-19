import { anim, ellipse, fill, group, keyframes, resetInd, root, shapeLayer, transform, val } from '../builders'
import { configurePrecomp, desaturateOverTime, FIRE_BASE_SR, loadFireDoc, recolorFlame, sizeToScale } from './fireFlame'
import { getToken } from '../../tokens/colors'
import type { ColorValue, Params } from '../controls'
import type { Layer, LottieJSON } from '../types'

export interface StreakBrokenParams extends Params {
  color: ColorValue
  fadeSpeed: number // 50~200
}

export const streakBrokenDefaults: StreakBrokenParams = {
  // ★ 따뜻한 fire 컬러에서 회색으로 사그라듦
  color: {
    mode: 'gradient',
    hex: getToken('Semantic/Orange-300'),
    opacity: 100,
    gradientType: 1,
    stops: [
      { pos: 0, hex: getToken('Semantic/Red-400') },
      { pos: 0.5, hex: getToken('Semantic/Orange-400') },
      { pos: 1, hex: getToken('Semantic/Orange-300') },
    ],
  },
  fadeSpeed: 100,
}

const CORE: ColorValue = { mode: 'solid', hex: getToken('Semantic/Yellow-200'), opacity: 100 }
const FLAME_SIZE = 150

export function generateStreakBroken(p: StreakBrokenParams): LottieJSON {
  resetInd()
  const W = 300
  const H = 300
  const cx = W / 2
  const cy = H / 2
  const speed = Math.max(50, Math.min(200, p.fadeSpeed))
  const P = Math.round(66 * (100 / speed))
  const f = (frac: number) => Math.round(frac * P)

  // --- fire.json 불꽃: 색 적용 후 시간에 따라 회색으로 desaturate ---
  const doc = loadFireDoc()
  const comp = doc.assets[0]
  recolorFlame(comp, p.color, CORE)
  desaturateOverTime(comp, f(0.1), P, 0.5)

  // precomp: 축소 + 페이드 + 가라앉음
  const base = sizeToScale(FLAME_SIZE)
  const precomp = configurePrecomp(doc.layers[0], {
    W,
    H,
    size: FLAME_SIZE,
    sr: FIRE_BASE_SR,
    op: P,
    posY: anim(
      keyframes([
        { t: 0, s: [cx, cy, 0], ease: 'in-out' },
        { t: P, s: [cx, cy + FLAME_SIZE * 0.18, 0], ease: 'in' },
      ]),
      2,
    ),
    scale: anim(
      keyframes([
        { t: 0, s: [base, base, 100], ease: 'in-out' },
        { t: f(0.55), s: [base * 0.82, base * 0.62, 100], ease: 'in-out' },
        { t: P, s: [base * 0.3, base * 0.14, 100], ease: 'in' },
      ]),
      6,
    ),
    opacity: anim(
      keyframes([
        { t: 0, s: [100], ease: 'in-out' },
        { t: f(0.6), s: [80], ease: 'in-out' },
        { t: P, s: [0], ease: 'in' },
      ]),
      11,
    ),
  })

  // --- 연기 퍼프 (회색 타원이 위로 떠오르며 흩어지고 사라짐) ---
  const smoke: Layer[] = []
  for (let i = 0; i < 3; i++) {
    const dx = (i - 1) * 22
    const delay = f(0.15 * i)
    smoke.push(
      shapeLayer({
        name: `smoke-${i}`,
        shapes: [
          group(
            [ellipse({ size: val([34, 34], 2) }), fill(getToken('Mono/Neutral-300'), 100)],
            transform({
              p: anim(keyframes([
                { t: delay, s: [cx + dx, cy + 30], ease: 'out' },
                { t: P, s: [cx + dx * 2.2, cy - 70], ease: 'out' },
              ]), 2),
              s: anim(keyframes([
                { t: delay, s: [20, 20], ease: 'out' },
                { t: P, s: [120, 120], ease: 'out' },
              ]), 6),
              o: anim(keyframes([
                { t: delay, s: [0], ease: 'out' },
                { t: delay + f(0.2), s: [38], ease: 'in-out' },
                { t: P, s: [0], ease: 'in' },
              ]), 11),
            }),
            `smoke-${i}`,
          ),
        ],
        ip: 0,
        op: P,
      }),
    )
  }

  // 앞->뒤: 연기, 불꽃(precomp)
  const layers: Layer[] = [...smoke, precomp]
  return root({ name: 'streak-broken', w: W, h: H, fr: doc.fr ?? 24, op: P, layers, assets: doc.assets })
}
