import { val } from '../builders'
import { hexToRgb } from '../../tokens/colors'
import fireSource from '../sources/fire.json'
import type { ColorValue } from '../controls'
import type { GradientStop } from '../../tokens/colors'
import type { Layer, LottieJSON, Prop } from '../types'

// fire.json 소스 상수
export const FIRE_FR = 24
export const FIRE_BASE_OP = 26 // sr=0.55 기준 한 루프(프레임)
export const FIRE_BASE_SR = 0.55
export const FIRE_REF_HEIGHT = 470 // 불꽃 실루엣 높이(comp 단위)
export const FIRE_ANCHOR: [number, number] = [255, 430] // 불꽃 시각적 중심

// comp 레이어 이름(트레일링 공백 있음) — trim 비교
const CORE_LAYER = 'White Fire'
const SIDE_LAYERS = ['Indv. Flame 01', 'Indv. Flame 02']

type RGB = [number, number, number]
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export function colorRamp(c: ColorValue): { pos: number; rgb: RGB }[] {
  if (c.mode === 'gradient' && c.stops && c.stops.length) {
    return [...(c.stops as GradientStop[])]
      .sort((a, b) => a.pos - b.pos)
      .map((s) => ({ pos: s.pos, rgb: hexToRgb(s.hex) as RGB }))
  }
  const rgb = hexToRgb(c.hex) as RGB
  return [
    { pos: 0, rgb },
    { pos: 1, rgb },
  ]
}

export function sampleRamp(ramp: { pos: number; rgb: RGB }[], t: number): RGB {
  if (t <= ramp[0].pos) return ramp[0].rgb
  const last = ramp[ramp.length - 1]
  if (t >= last.pos) return last.rgb
  for (let i = 0; i < ramp.length - 1; i++) {
    const a = ramp[i]
    const b = ramp[i + 1]
    if (t >= a.pos && t <= b.pos) {
      const f = (t - a.pos) / (b.pos - a.pos || 1)
      return [lerp(a.rgb[0], b.rgb[0], f), lerp(a.rgb[1], b.rgb[1], f), lerp(a.rgb[2], b.rgb[2], f)]
    }
  }
  return last.rgb
}

/** fire.json 문서 깊은 복제 */
export function loadFireDoc(): LottieJSON {
  return structuredClone(fireSource as unknown as LottieJSON)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function eachGradient(items: any[], cb: (g: any) => void) {
  for (const it of items) {
    if (it.ty === 'gr' && Array.isArray(it.it)) eachGradient(it.it, cb)
    else if ((it.ty === 'gf' || it.ty === 'gs') && it.g?.k) cb(it)
  }
}

/** 곁불꽃 개수 매핑 (Indv. Flame 01/02 show/hide) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setSideFlames(comp: any, count: number) {
  const n = Math.max(0, Math.min(2, Math.round(count)))
  const keep = new Set(SIDE_LAYERS.slice(0, n))
  comp.layers = (comp.layers as { nm?: string }[]).filter((l) => {
    const nm = (l.nm ?? '').trim()
    if (SIDE_LAYERS.includes(nm)) return keep.has(nm)
    return true
  })
}

/**
 * 정적 색상 재매핑 — 소스 morph/스톱 위치는 유지, rgb 만 교체.
 * 본체: flameColor ramp 를 스톱 위치에서 샘플. 코어(White Fire): coreColor 로 중앙 tint.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function recolorFlame(comp: any, flameColor: ColorValue, coreColor: ColorValue) {
  const flameRamp = colorRamp(flameColor)
  const coreRgb = hexToRgb(coreColor.hex) as RGB
  for (const l of comp.layers) {
    if (!l.shapes) continue
    const nm = (l.nm ?? '').trim()
    const isCore = nm === CORE_LAYER
    eachGradient(l.shapes, (g) => {
      if (g.g.k.a !== 0) return
      const k: number[] = g.g.k.k
      const p: number = g.g.p
      for (let i = 0; i < p; i++) {
        const o = i * 4
        const pos = k[o]
        const orig: RGB = [k[o + 1], k[o + 2], k[o + 3]]
        const rgb = isCore
          ? [lerp(coreRgb[0], orig[0], pos), lerp(coreRgb[1], orig[1], pos), lerp(coreRgb[2], orig[2], pos)]
          : sampleRamp(flameRamp, pos)
        k[o + 1] = rgb[0]
        k[o + 2] = rgb[1]
        k[o + 3] = rgb[2]
      }
    })
  }
}

/**
 * 시간에 따른 desaturate — 각 정적 그라디언트를 [start: 현재색, end: 회색]으로 애니메이션화.
 * (streak-broken: 불꽃이 회색/재로 사그라듦)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function desaturateOverTime(comp: any, startFrame: number, endFrame: number, darken = 0.5) {
  for (const l of comp.layers) {
    if (!l.shapes) continue
    eachGradient(l.shapes, (g) => {
      if (g.g.k.a !== 0) return
      const k: number[] = g.g.k.k
      const p: number = g.g.p
      const grayK = [...k]
      for (let i = 0; i < p; i++) {
        const o = i * 4
        const lum = k[o + 1] * 0.3 + k[o + 2] * 0.59 + k[o + 3] * 0.11
        const gv = Math.max(0, Math.min(1, lum * darken))
        grayK[o + 1] = gv
        grayK[o + 2] = gv
        grayK[o + 3] = gv
      }
      g.g.k = {
        a: 1,
        k: [
          { t: startFrame, s: k.slice(), i: { x: [0.5], y: [0.5] }, o: { x: [0.5], y: [0.5] } },
          { t: endFrame, s: grayK },
        ],
      }
    })
  }
}

/** precomp(Retime) 레이어를 300x300 캔버스 중앙에 배치 + 크기/속도 설정 */
export function configurePrecomp(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  precomp: any,
  opts: { W: number; H: number; size: number; sr: number; op: number; scale?: Prop<number[]>; opacity?: Prop<number>; posY?: Prop<number[]> },
): Layer {
  const sclv = (opts.size / FIRE_REF_HEIGHT) * 100
  precomp.ind = 2
  precomp.sr = opts.sr
  precomp.ip = 0
  precomp.op = opts.op
  precomp.st = 0
  precomp.ks = {
    ...precomp.ks,
    a: val([FIRE_ANCHOR[0], FIRE_ANCHOR[1], 0], 1),
    p: opts.posY ?? val([opts.W / 2, opts.H / 2, 0], 2),
    s: opts.scale ?? val([sclv, sclv, 100], 6),
    o: opts.opacity ?? precomp.ks.o ?? val(100, 11),
  }
  return precomp as Layer
}

/** size(px) -> precomp scale 퍼센트 */
export function sizeToScale(size: number): number {
  return (size / FIRE_REF_HEIGHT) * 100
}

/** speed(%) -> { sr, op } */
export function retime(speed: number): { sr: number; op: number } {
  const s = Math.max(50, Math.min(200, speed))
  return { sr: FIRE_BASE_SR * (100 / s), op: Math.max(6, Math.round(FIRE_BASE_OP * (100 / s))) }
}
