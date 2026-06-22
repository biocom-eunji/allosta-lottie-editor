import { anim, ellipse, fill, gradientFill, group, imageLayer, keyframes, pathShape, rect, resetInd, root, shapeLayer, transform, val } from '../builders'
import { configurePrecomp, loadFireDoc, recolorFlame, retime, setSideFlames, sizeToScale } from './fireFlame'
import { rasterizeText } from '../../lib/text'
import { getToken } from '../../tokens/colors'
import { CX, CY, popScale, sparkleLayer } from './fxCommon'
import type { ColorValue, Params } from '../controls'
import type { Asset, Layer, LottieJSON } from '../types'

const W = 300
const H = 300
const FR = 60
const sLen = (base: number, speed: number) => Math.max(20, Math.round(base * (100 / Math.max(50, Math.min(200, speed)))))

// ── flame-grow: 불꽃이 작게 시작해 커지는 성장 연출 (fire.json 기반, loop) ──
export interface FlameGrowParams extends Params {
  flameColor: ColorValue
  speed: number
  size: number
}
export const flameGrowDefaults: FlameGrowParams = {
  flameColor: {
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
  speed: 100,
  size: 170,
}
export function generateFlameGrow(p: FlameGrowParams): LottieJSON {
  const doc = loadFireDoc()
  const comp = doc.assets[0]
  setSideFlames(comp, 2)
  recolorFlame(comp, p.flameColor, { mode: 'solid', hex: getToken('Semantic/Yellow-200'), opacity: 100 })
  const { sr, op: P } = retime(p.speed)
  const full = sizeToScale(p.size)
  const scale = anim(keyframes([
    { t: 0, s: [full * 0.22, full * 0.22, 100], ease: 'out' },
    { t: Math.round(P * 0.5), s: [full, full, 100], ease: 'out' },
    { t: P, s: [full, full, 100], ease: 'linear' },
  ]), 6)
  const precomp = configurePrecomp(doc.layers[0], { W, H, size: p.size, sr, op: P, scale })
  return root({ name: 'flame-grow', w: W, h: H, fr: doc.fr ?? 24, op: P, layers: [precomp], assets: doc.assets })
}

// ── streak-count-up: 숫자 배지가 팝 + 반짝임 (one-shot) ──
export interface StreakCountUpParams extends Params {
  count: number
  color: ColorValue
  speed: number
}
export const streakCountUpDefaults: StreakCountUpParams = {
  count: 7,
  color: { mode: 'solid', hex: getToken('Semantic/Orange-300'), opacity: 100 },
  speed: 100,
}
export function generateStreakCountUp(p: StreakCountUpParams): LottieJSON {
  resetInd()
  const P = sLen(64, p.speed)
  const assets: Asset[] = []
  const layers: Layer[] = []

  // 배지 원 (팝)
  layers.push(shapeLayer({
    name: 'badge',
    shapes: [group([ellipse({ size: val([150, 150], 2) }), fill(p.color.hex, 100)], transform({ p: val([CX, CY], 2), s: popScale(P) }), 'badge')],
    ip: 0,
    op: P,
  }))

  // 숫자 (canvas 래스터 — node 환경에선 null → 생략, 미리보기/다운로드는 브라우저에서 표시)
  const num = rasterizeText(String(Math.round(p.count)), { size: 92, weight: 800, color: getToken('WHBK/WH') })
  if (num) {
    assets.push({ id: 'cnt', w: num.w, h: num.h, e: 1, u: '', p: num.dataUri })
    const sc = (96 / Math.max(num.w, num.h)) * 100
    layers.unshift(imageLayer({
      name: 'num',
      refId: 'cnt',
      ks: transform({
        a: val([num.w / 2, num.h / 2], 1),
        p: val([CX, CY], 2),
        s: anim(keyframes([
          { t: 0, s: [0, 0], ease: 'out' },
          { t: Math.round(P * 0.3), s: [sc * 1.15, sc * 1.15], ease: 'out' },
          { t: Math.round(P * 0.46), s: [sc, sc], ease: 'in-out' },
          { t: P, s: [sc, sc], ease: 'linear' },
        ]), 6),
      }),
      ip: 0,
      op: P,
    }))
  }

  // 반짝임 2개
  layers.unshift(sparkleLayer('spark-a', [CX + 64, CY - 56], Math.round(P * 0.2), P, 90))
  layers.unshift(sparkleLayer('spark-b', [CX - 60, CY + 50], Math.round(P * 0.4), P, 70))

  return root({ name: 'streak-count-up', w: W, h: H, fr: FR, op: P, layers, assets })
}

// ── trophy-pop: 트로피 팝 + 반짝임 (one-shot) ──
export interface TrophyPopParams extends Params {
  color: ColorValue
  speed: number
}
export const trophyPopDefaults: TrophyPopParams = { color: { mode: 'solid', hex: getToken('Semantic/Yellow-300'), opacity: 100 }, speed: 100 }
export function generateTrophyPop(p: TrophyPopParams): LottieJSON {
  resetInd()
  const P = sLen(72, p.speed)
  const gold = p.color.hex
  const deep = getToken('Semantic/Orange-400')
  const grad = (extra: object = {}) => gradientFill({
    stops: [{ pos: 0, hex: getToken('Semantic/Yellow-300') }, { pos: 0.5, hex: getToken('Semantic/Yellow-400') }, { pos: 1, hex: getToken('Semantic/Orange-300') }],
    type: 1, start: [-40, -40], end: [40, 50], ...extra,
  })
  const trophy = group([
    // 손잡이 (좌우, 컵 뒤)
    group([ellipse({ size: val([46, 56], 2), position: val([-50, -18], 3) }), { ty: 'st', c: rgb(deep), o: val(100, 5), w: val(10, 6), lc: 2, lj: 2, ml: 4, nm: 'Stroke' }], transform(), 'hL'),
    group([ellipse({ size: val([46, 56], 2), position: val([50, -18], 3) }), { ty: 'st', c: rgb(deep), o: val(100, 5), w: val(10, 6), lc: 2, lj: 2, ml: 4, nm: 'Stroke' }], transform(), 'hR'),
    // 컵(보울)
    group([pathShape({ v: [[-46, -40], [46, -40], [33, 26], [-33, 26]], i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]], c: true }), grad()], transform(), 'bowl'),
    // 스템
    group([rect({ size: val([14, 20], 2), position: val([0, 38], 3), roundness: val(3, 4) }), fill(deep, 100)], transform(), 'stem'),
    // 받침
    group([rect({ size: val([66, 14], 2), position: val([0, 52], 3), roundness: val(6, 4) }), fill(gold, 100)], transform(), 'base'),
    // 별 엠블럼
    group([pathShape({ v: [[0, -22], [6, -6], [22, -6], [9, 4], [14, 20], [0, 10], [-14, 20], [-9, 4], [-22, -6], [-6, -6]], i: Array(10).fill([0, 0]), o: Array(10).fill([0, 0]), c: true }), fill(getToken('WHBK/WH'), 80)], transform({ p: val([0, -10], 2), s: val([70, 70], 6) }), 'emblem'),
  ], transform(), 'trophy')

  const layer = shapeLayer({
    name: 'trophy',
    shapes: [trophy],
    ks: transform({
      p: val([CX, CY], 2),
      s: anim(keyframes([
        { t: 0, s: [0, 0], ease: 'out' },
        { t: Math.round(P * 0.26), s: [116, 116], ease: 'out' },
        { t: Math.round(P * 0.42), s: [100, 100], ease: 'in-out' },
        { t: P, s: [100, 100], ease: 'linear' },
      ]), 6),
      r: anim(keyframes([{ t: 0, s: [-8], ease: 'out' }, { t: Math.round(P * 0.42), s: [0], ease: 'in-out' }, { t: P, s: [0], ease: 'linear' }]), 10),
    }),
    ip: 0,
    op: P,
  })
  const sa = sparkleLayer('spark-a', [CX + 70, CY - 60], Math.round(P * 0.3), P, 100)
  const sb = sparkleLayer('spark-b', [CX - 66, CY - 30], Math.round(P * 0.46), P, 76)
  return root({ name: 'trophy-pop', w: W, h: H, fr: FR, op: P, layers: [sa, sb, layer] })
}

function rgb(hex: string) {
  const h = hex.replace('#', '')
  return val([parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255, 1], 4)
}
