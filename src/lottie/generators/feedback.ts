import { anim, drawStroke, ellipse, fill, group, keyframes, pathShape, rect, resetInd, root, shapeLayer, stroke, transform, val } from '../builders'
import { getToken } from '../../tokens/colors'
import { CX, CY, fadeIn, popScale } from './fxCommon'
import type { ColorValue, Params } from '../controls'
import type { Layer, LottieJSON } from '../types'

const W = 300
const H = 300
const FR = 60
const R = 78

export interface FeedbackParams extends Params {
  color: ColorValue
  speed: number
}

const speedLen = (base: number, speed: number) => Math.max(20, Math.round(base * (100 / Math.max(50, Math.min(200, speed)))))

/** 색 원 팝 레이어 */
function circlePop(hex: string, P: number): Layer {
  return shapeLayer({
    name: 'circle',
    shapes: [group([ellipse({ size: val([R * 2, R * 2], 2) }), fill(hex, 100)], transform({ p: val([CX, CY], 2), s: popScale(P), o: fadeIn(P, 0.1) }), 'circle')],
    ip: 0,
    op: P,
  })
}

// ── success-check: 초록 원 + 흰 체크 드로잉 ──
export const successCheckDefaults: FeedbackParams = { color: { mode: 'solid', hex: getToken('Semantic/green-300'), opacity: 100 }, speed: 100 }
export function generateSuccessCheck(p: FeedbackParams): LottieJSON {
  resetInd()
  const P = speedLen(70, p.speed)
  const check = shapeLayer({
    name: 'check',
    shapes: [
      drawStroke({
        points: [
          [CX - 30, CY + 2],
          [CX - 8, CY + 24],
          [CX + 34, CY - 26],
        ],
        hex: getToken('WHBK/WH'),
        width: 14,
        startFrame: Math.round(P * 0.34),
        endFrame: Math.round(P * 0.64),
      }),
    ],
    ip: 0,
    op: P,
  })
  return root({ name: 'success-check', w: W, h: H, fr: FR, op: P, layers: [check, circlePop(p.color.hex, P)] })
}

// ── error-cross: 빨강 원 + 흰 X 드로잉 ──
export const errorCrossDefaults: FeedbackParams = { color: { mode: 'solid', hex: getToken('Semantic/Red-400'), opacity: 100 }, speed: 100 }
export function generateErrorCross(p: FeedbackParams): LottieJSON {
  resetInd()
  const P = speedLen(70, p.speed)
  const d = 28
  const cross = shapeLayer({
    name: 'cross',
    shapes: [
      drawStroke({ points: [[CX - d, CY - d], [CX + d, CY + d]], hex: getToken('WHBK/WH'), width: 14, startFrame: Math.round(P * 0.34), endFrame: Math.round(P * 0.56), ix: 1 }),
      drawStroke({ points: [[CX + d, CY - d], [CX - d, CY + d]], hex: getToken('WHBK/WH'), width: 14, startFrame: Math.round(P * 0.5), endFrame: Math.round(P * 0.72), ix: 2 }),
    ],
    ip: 0,
    op: P,
  })
  return root({ name: 'error-cross', w: W, h: H, fr: FR, op: P, layers: [cross, circlePop(p.color.hex, P)] })
}

// ── warning-pulse: 삼각형 + ! + 확장 펄스 링 (loop) ──
export const warningPulseDefaults: FeedbackParams = { color: { mode: 'solid', hex: getToken('Semantic/Orange-300'), opacity: 100 }, speed: 100 }
export function generateWarningPulse(p: FeedbackParams): LottieJSON {
  resetInd()
  const P = speedLen(72, p.speed)
  const hex = p.color.hex
  // 펄스 링
  const pulse = shapeLayer({
    name: 'pulse',
    shapes: [
      group([ellipse({ size: val([R * 2, R * 2], 2) }), stroke(hex, 8)], transform({
        p: val([CX, CY], 2),
        s: anim(keyframes([{ t: 0, s: [70, 70], ease: 'out' }, { t: P, s: [165, 165], ease: 'out' }]), 6),
        o: anim(keyframes([{ t: 0, s: [60], ease: 'out' }, { t: P, s: [0], ease: 'in' }]), 11),
      }), 'pulse'),
    ],
    ip: 0,
    op: P,
  })
  // 삼각형 + ! (정적, 살짝 호흡)
  const breathe = anim(keyframes([
    { t: 0, s: [100, 100], ease: 'in-out' },
    { t: Math.round(P / 2), s: [108, 108], ease: 'in-out' },
    { t: P, s: [100, 100], ease: 'in-out' },
  ]), 6)
  const tri = group([
    pathShape({ v: [[0, -64], [62, 44], [-62, 44]], i: [[0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0]], c: true }),
    fill(hex, 100),
  ], transform(), 'tri')
  const bang = group([
    group([rect({ size: val([12, 30], 2), position: val([0, -8], 3), roundness: val(6, 4) }), fill(getToken('WHBK/WH'), 100)], transform(), 'bar'),
    group([ellipse({ size: val([12, 12], 2), position: val([0, 18], 3) }), fill(getToken('WHBK/WH'), 100)], transform(), 'dot'),
  ], transform(), 'bang')
  const sign = shapeLayer({ name: 'sign', shapes: [group([tri, bang], transform({ p: val([CX, CY], 2), s: breathe }), 'sign')], ip: 0, op: P })
  return root({ name: 'warning-pulse', w: W, h: H, fr: FR, op: P, layers: [sign, pulse] })
}

// ── heart-like: 하트 팝 + 버스트 점 (one-shot) ──
export const heartLikeDefaults: FeedbackParams = { color: { mode: 'solid', hex: getToken('Semantic/Red-300'), opacity: 100 }, speed: 100 }
function heartShapes(hex: string) {
  // 두 로브(원) + 아래 삼각형 = 하트 (같은 색 fill 합집합)
  return group([
    ellipse({ size: val([52, 52], 2), position: val([-22, -18], 3) }),
    ellipse({ size: val([52, 52], 2), position: val([22, -18], 3) }),
    pathShape({ v: [[-45, -4], [45, -4], [0, 54]], i: [[0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0]], c: true }),
    fill(hex, 100),
  ], transform(), 'heart')
}
export function generateHeartLike(p: FeedbackParams): LottieJSON {
  resetInd()
  const P = speedLen(72, p.speed)
  const heart = shapeLayer({
    name: 'heart',
    shapes: [heartShapes(p.color.hex)],
    ks: transform({
      p: val([CX, CY - 4], 2),
      s: anim(keyframes([
        { t: 0, s: [0, 0], ease: 'out' },
        { t: Math.round(P * 0.26), s: [128, 128], ease: 'out' },
        { t: Math.round(P * 0.42), s: [100, 100], ease: 'in-out' },
        { t: P, s: [100, 100], ease: 'linear' },
      ]), 6),
    }),
    ip: 0,
    op: P,
  })
  // 버스트 점 6개
  const dots: Layer[] = []
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2
    const dist = 96
    const ex = CX + Math.cos(ang) * dist
    const ey = CY + Math.sin(ang) * dist
    const f = (frac: number) => Math.round(P * frac)
    dots.push(shapeLayer({
      name: `dot-${i}`,
      shapes: [group([ellipse({ size: val([12, 12], 2) }), fill(p.color.hex, 100)], transform({
        p: anim(keyframes([{ t: f(0.2), s: [CX, CY], ease: 'out' }, { t: f(0.5), s: [ex, ey], ease: 'out' }]), 2),
        o: anim(keyframes([{ t: f(0.2), s: [0] }, { t: f(0.28), s: [100] }, { t: f(0.5), s: [0] }]), 11),
        s: anim(keyframes([{ t: f(0.2), s: [100, 100] }, { t: f(0.5), s: [40, 40] }]), 6),
      }), `dot-${i}`)],
      ip: 0,
      op: P,
    }))
  }
  return root({ name: 'heart-like', w: W, h: H, fr: FR, op: P, layers: [...dots, heart] })
}
