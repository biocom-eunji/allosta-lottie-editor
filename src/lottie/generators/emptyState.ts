import { anim, ellipse, fill, group, keyframes, rect, resetInd, root, shapeLayer, stroke, transform, val } from '../builders'
import { getToken } from '../../tokens/colors'
import { CX, CY } from './fxCommon'
import type { ColorValue, Params } from '../controls'
import type { LottieJSON } from '../types'

const W = 300
const H = 300
const FR = 60
const sLen = (base: number, speed: number) => Math.max(24, Math.round(base * (100 / Math.max(50, Math.min(200, speed)))))

export interface EmptyParams extends Params {
  color: ColorValue
  speed: number
}

// ── empty-box: 빈 상자(뚜껑 들림) + 위아래 부유 (loop) ──
export const emptyBoxDefaults: EmptyParams = { color: { mode: 'solid', hex: getToken('Brand/Mint-400'), opacity: 100 }, speed: 100 }
export function generateEmptyBox(p: EmptyParams): LottieJSON {
  resetInd()
  const P = sLen(120, p.speed)
  const line = getToken('Mono/Neutral-300')
  const body = getToken('Mono/Neutral-50')
  const bob = anim(keyframes([
    { t: 0, s: [CX, CY + 6], ease: 'in-out' },
    { t: Math.round(P / 2), s: [CX, CY - 6], ease: 'in-out' },
    { t: P, s: [CX, CY + 6], ease: 'in-out' },
  ]), 2)
  // 상자 본체
  const boxBody = group([
    rect({ size: val([120, 84], 2), position: val([0, 26], 3), roundness: val(12, 4) }),
    fill(body, 100),
    stroke(line, 6),
  ], transform(), 'box')
  // 뚜껑 (살짝 들림 회전)
  const lid = group([
    group([rect({ size: val([136, 26], 2), roundness: val(8, 4) }), fill(body, 100), stroke(line, 6)], transform(), 'lidShape'),
  ], transform({
    p: val([0, -22], 2),
    a: val([-60, 0], 1),
    r: anim(keyframes([
      { t: 0, s: [-6], ease: 'in-out' },
      { t: Math.round(P / 2), s: [-18], ease: 'in-out' },
      { t: P, s: [-6], ease: 'in-out' },
    ]), 10),
  }), 'lid')
  // 빈 표시 점선/대시 대신 accent 작은 원 떠오름
  const spark = group([ellipse({ size: val([14, 14], 2), position: val([0, -2], 3) }), fill(p.color.hex, 100)], transform({
    o: anim(keyframes([{ t: 0, s: [0] }, { t: Math.round(P * 0.3), s: [100] }, { t: Math.round(P * 0.7), s: [100] }, { t: P, s: [0] }]), 11),
    p: anim(keyframes([{ t: 0, s: [0, 6] }, { t: P, s: [0, -34] }]), 2),
  }), 'spark')
  const box = shapeLayer({ name: 'box', shapes: [group([spark, lid, boxBody], transform({ p: bob }), 'g')], ip: 0, op: P })
  return root({ name: 'empty-box', w: W, h: H, fr: FR, op: P, layers: [box] })
}

// ── search-empty: 돋보기 좌우 흔들 + 호흡 (loop) ──
export const searchEmptyDefaults: EmptyParams = { color: { mode: 'solid', hex: getToken('Brand/Mint-400'), opacity: 100 }, speed: 100 }
export function generateSearchEmpty(p: EmptyParams): LottieJSON {
  resetInd()
  const P = sLen(110, p.speed)
  const line = getToken('Mono/Neutral-400')
  const lens = group([
    // 렌즈 링
    group([ellipse({ size: val([96, 96], 2) }), stroke(p.color.hex, 12)], transform(), 'ring'),
    // 손잡이
    group([rect({ size: val([18, 52], 2), position: val([46, 46], 3), roundness: val(9, 4) }), fill(line, 100)], transform({ r: val(45, 10) }), 'handle'),
  ], transform(), 'lens')
  const layer = shapeLayer({
    name: 'magnifier',
    shapes: [group([lens], transform({
      p: val([CX - 6, CY - 6], 2),
      a: val([0, 0], 1),
      r: anim(keyframes([
        { t: 0, s: [-12], ease: 'in-out' },
        { t: Math.round(P * 0.25), s: [10], ease: 'in-out' },
        { t: Math.round(P * 0.5), s: [-12], ease: 'in-out' },
        { t: Math.round(P * 0.75), s: [10], ease: 'in-out' },
        { t: P, s: [-12], ease: 'in-out' },
      ]), 10),
    }), 'g')],
    ip: 0,
    op: P,
  })
  return root({ name: 'search-empty', w: W, h: H, fr: FR, op: P, layers: [layer] })
}

// ── bell-ring: 종 흔들림 + 음파 (loop) ──
export const bellRingDefaults: EmptyParams = { color: { mode: 'solid', hex: getToken('Semantic/Yellow-300'), opacity: 100 }, speed: 100 }
export function generateBellRing(p: EmptyParams): LottieJSON {
  resetInd()
  const P = sLen(96, p.speed)
  const gold = p.color.hex
  const deep = getToken('Semantic/Orange-400')
  // 종 본체 (둥근 사다리꼴 근사: 위 둥근 rect + 아래 넓은 rect + 바닥 바)
  const bell = group([
    group([ellipse({ size: val([16, 16], 2), position: val([0, -68], 3) }), fill(deep, 100)], transform(), 'knob'),
    group([rect({ size: val([74, 92], 2), position: val([0, -8], 3), roundness: val(34, 4) }), fill(gold, 100)], transform(), 'dome'),
    group([rect({ size: val([104, 18], 2), position: val([0, 40], 3), roundness: val(9, 4) }), fill(gold, 100)], transform(), 'rim'),
    group([ellipse({ size: val([18, 18], 2), position: val([0, 56], 3) }), fill(deep, 100)], transform(), 'clapper'),
  ], transform(), 'bell')
  const swing = shapeLayer({
    name: 'bell',
    shapes: [group([bell], transform({
      p: val([CX, CY + 4], 2),
      a: val([0, -68], 1),
      r: anim(keyframes([
        { t: 0, s: [0], ease: 'in-out' },
        { t: Math.round(P * 0.2), s: [16], ease: 'in-out' },
        { t: Math.round(P * 0.5), s: [-16], ease: 'in-out' },
        { t: Math.round(P * 0.8), s: [16], ease: 'in-out' },
        { t: P, s: [0], ease: 'in-out' },
      ]), 10),
    }), 'g')],
    ip: 0,
    op: P,
  })
  // 음파 호 2개(좌우)
  const wave = (x: number, flip: number, ix: number) => shapeLayer({
    name: `wave-${ix}`,
    shapes: [group([ellipse({ size: val([40, 40], 2) }), stroke(deep, 6)], transform({
      p: val([CX + x, CY - 30], 2),
      s: val([flip * 100, 100], 6),
      o: anim(keyframes([{ t: 0, s: [0] }, { t: Math.round(P * 0.2), s: [70] }, { t: Math.round(P * 0.6), s: [0] }, { t: P, s: [0] }]), 11),
    }), `wave-${ix}`)],
    ip: 0,
    op: P,
  })
  return root({ name: 'bell-ring', w: W, h: H, fr: FR, op: P, layers: [wave(-70, -1, 0), wave(70, 1, 1), swing] })
}
