import { anim, ellipse, fill, gradientFill, group, keyframes, rect, resetInd, root, shapeLayer, transform, trimPath, val } from '../builders'
import { getToken } from '../../tokens/colors'
import { CX, CY } from './fxCommon'
import type { ColorValue, Params } from '../controls'
import type { Layer, LottieJSON, ShapeItem } from '../types'

const W = 300
const H = 300
const FR = 60
const sLen = (base: number, speed: number) => Math.max(20, Math.round(base * (100 / Math.max(50, Math.min(200, speed)))))

export interface LoadingExtraParams extends Params {
  color: ColorValue
  speed: number
}

// ── spinner-orbit: 점 3개가 원 궤도를 회전 (loop) ──
export const spinnerOrbitDefaults: LoadingExtraParams = { color: { mode: 'solid', hex: getToken('Brand/Mint-400'), opacity: 100 }, speed: 100 }
export function generateSpinnerOrbit(p: LoadingExtraParams): LottieJSON {
  resetInd()
  const P = sLen(72, p.speed)
  const orbitR = 56
  const dots: ShapeItem[] = []
  for (let i = 0; i < 3; i++) {
    const ang = (i / 3) * Math.PI * 2
    dots.push(group([
      ellipse({ size: val([26, 26], 2), position: val([Math.cos(ang) * orbitR, Math.sin(ang) * orbitR], 3) }),
      fill(p.color.hex, 100),
    ], transform({
      o: anim(keyframes([
        { t: Math.round(((i / 3) % 1) * P), s: [40] },
        { t: Math.round((((i / 3) + 0.33) % 1) * P), s: [100] },
      ].sort((a, b) => a.t - b.t)), 11),
    }), `dot-${i}`))
  }
  const layer = shapeLayer({
    name: 'orbit',
    shapes: [group(dots, transform({
      p: val([CX, CY], 2),
      r: anim(keyframes([{ t: 0, s: [0], ease: 'linear' }, { t: P, s: [360], ease: 'linear' }]), 10),
    }), 'orbit')],
    ip: 0,
    op: P,
  })
  return root({ name: 'spinner-orbit', w: W, h: H, fr: FR, op: P, layers: [layer] })
}

// ── skeleton-shimmer: 스켈레톤 바 + 광택 스윕 (loop) ──
export const skeletonShimmerDefaults: LoadingExtraParams = { color: { mode: 'solid', hex: getToken('Brand/Mint-200'), opacity: 100 }, speed: 100 }
export function generateSkeletonShimmer(p: LoadingExtraParams): LottieJSON {
  resetInd()
  const P = sLen(96, p.speed)
  const base = getToken('Mono/Neutral-100')
  const bars: Layer[] = []
  const rows = [
    { w: 200, y: -56 },
    { w: 200, y: -20 },
    { w: 140, y: 16 },
    { w: 90, y: 52 },
  ]
  rows.forEach((rrow, i) => {
    bars.push(shapeLayer({
      name: `bar-${i}`,
      shapes: [group([rect({ size: val([rrow.w, 22], 2), roundness: val(11, 4) }), fill(base, 100)], transform({ p: val([CX - (220 - rrow.w) / 2, CY + rrow.y], 2) }), `bar-${i}`)],
      ip: 0,
      op: P,
    }))
  })
  // 광택: 반투명 흰 기울어진 바가 좌→우로 스윕 (matte 없이 위에 덮음)
  const shine = shapeLayer({
    name: 'shine',
    shapes: [group([
      rect({ size: val([46, 200], 2) }),
      gradientFill({
        stops: [{ pos: 0, hex: getToken('WHBK/WH') }, { pos: 1, hex: getToken('WHBK/WH') }],
        type: 1, start: [-23, 0], end: [23, 0], opacity: 38,
      }),
    ], transform({ r: val(18, 10) }), 'shine')],
    ks: transform({
      p: anim(keyframes([{ t: 0, s: [CX - 150, CY], ease: 'linear' }, { t: P, s: [CX + 150, CY], ease: 'linear' }]), 2),
      o: anim(keyframes([{ t: 0, s: [0] }, { t: Math.round(P * 0.2), s: [100] }, { t: Math.round(P * 0.8), s: [100] }, { t: P, s: [0] }]), 11),
    }),
    ip: 0,
    op: P,
  })
  return root({ name: 'skeleton-shimmer', w: W, h: H, fr: FR, op: P, layers: [shine, ...bars] })
}

// ── pull-to-refresh: 화살표 달린 원형 스피너 (loop) ──
export const pullRefreshDefaults: LoadingExtraParams = { color: { mode: 'solid', hex: getToken('Brand/Mint-400'), opacity: 100 }, speed: 100 }
export function generatePullRefresh(p: LoadingExtraParams): LottieJSON {
  resetInd()
  const P = sLen(60, p.speed)
  const Rr = 58
  // 70% 호 (trim) + 끝 화살촉
  const arc = group([
    ellipse({ size: val([Rr * 2, Rr * 2], 2) }),
    trimPath({ s: val(8, 1), e: val(78, 2), o: val(0, 3) }),
    { ty: 'st', c: val([...hexRgb(p.color.hex), 1], 4), o: val(100, 5), w: val(12, 6), lc: 2, lj: 2, ml: 4, nm: 'Stroke' } as ShapeItem,
  ], transform(), 'arc')
  const head = group([
    { ty: 'sh', d: 1, ix: 1, ks: { a: 0, k: { c: true, i: [[0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0]], v: [[Rr, -16], [Rr + 16, 4], [Rr - 16, 4] ] } }, nm: 'tip' } as ShapeItem,
    fill(p.color.hex, 100),
  ], transform(), 'head')
  const layer = shapeLayer({
    name: 'refresh',
    shapes: [group([arc, head], transform({
      p: val([CX, CY], 2),
      r: anim(keyframes([{ t: 0, s: [0], ease: 'linear' }, { t: P, s: [360], ease: 'linear' }]), 10),
    }), 'g')],
    ip: 0,
    op: P,
  })
  return root({ name: 'pull-refresh', w: W, h: H, fr: FR, op: P, layers: [layer] })
}

// 로컬 hex→rgb (builders fill/stroke 가 hex 받지만 위 인라인 stroke 용)
function hexRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255]
}
