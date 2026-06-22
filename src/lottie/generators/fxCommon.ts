import { anim, fill, group, keyframes, pathShape, shapeLayer, transform, val, type ShapeData } from '../builders'
import { getToken } from '../../tokens/colors'
import type { AnimatedValue, Layer, ShapeItem } from '../types'

// 추가 애니메이션 공통 헬퍼 — 전부 shape + keyframe, RN 안전.
export const CX = 150
export const CY = 150

/** speed(%) → 길이(프레임) */
export const lenFor = (base: number, speed: number) => Math.max(18, Math.round(base * (100 / Math.max(25, Math.min(400, speed)))))

/** 등장 팝 스케일(0 → peak → settle 유지) */
export function popScale(P: number, peak = 114, settle = 100): AnimatedValue {
  return anim(
    keyframes([
      { t: 0, s: [0, 0], ease: 'out' },
      { t: Math.round(P * 0.22), s: [peak, peak], ease: 'out' },
      { t: Math.round(P * 0.36), s: [settle, settle], ease: 'in-out' },
      { t: P, s: [settle, settle], ease: 'linear' },
    ]),
    6,
  )
}

/** 빠른 등장 후 유지되는 opacity */
export function fadeIn(P: number, at = 0.12): AnimatedValue {
  return anim(
    keyframes([
      { t: 0, s: [0], ease: 'out' },
      { t: Math.round(P * at), s: [100], ease: 'linear' },
      { t: P, s: [100], ease: 'linear' },
    ]),
    11,
  )
}

/** 4각 반짝임 path (원점 중심) */
export const SPARKLE: ShapeData = {
  v: [
    [0, -11],
    [-11, 0],
    [0, 11],
    [11, 0],
  ],
  i: [
    [2, 7],
    [7, -2],
    [-2, -7],
    [-7, 2],
  ],
  o: [
    [-2, 7],
    [7, 2],
    [2, -7],
    [-7, -2],
  ],
  c: true,
}

/** 반짝임 1개 레이어 (팝+페이드+회전) */
export function sparkleLayer(name: string, pos: [number, number], start: number, P: number, size: number, hexTokenId = 'Semantic/Yellow-100'): Layer {
  const dur = Math.round(P * 0.4)
  const f = (frac: number) => start + Math.round(frac * dur)
  return shapeLayer({
    name,
    shapes: [
      group(
        [pathShape(SPARKLE), fill(getToken(hexTokenId), 100)] as ShapeItem[],
        transform({
          p: val([pos[0], pos[1]], 2),
          s: anim(keyframes([
            { t: f(0), s: [0, 0], ease: 'out' },
            { t: f(0.45), s: [size, size], ease: 'out' },
            { t: f(1), s: [size * 0.6, size * 0.6], ease: 'in' },
          ]), 6),
          r: anim(keyframes([{ t: f(0), s: [0], ease: 'linear' }, { t: f(1), s: [50], ease: 'linear' }]), 10),
          o: anim(keyframes([
            { t: f(0), s: [0], ease: 'out' },
            { t: f(0.3), s: [100], ease: 'linear' },
            { t: f(0.7), s: [100], ease: 'in' },
            { t: f(1), s: [0], ease: 'in' },
          ]), 11),
        }),
        name,
      ),
    ],
    ip: 0,
    op: P,
  })
}
