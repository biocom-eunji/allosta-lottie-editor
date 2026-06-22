import { anim, ellipse, fill, gradientFill, group, keyframes, pathShape, resetInd, root, shapeLayer, stroke, transform, val, type ShapeData } from '../builders'
import { getToken } from '../../tokens/colors'
import type { Params } from '../controls'
import type { Layer, ShapeItem, LottieJSON } from '../types'

// coin-flip — 동전이 뒤집히며 반짝이는 리워드 애니메이션.
// ★ RN 안전: 3D 회전/트랙 매트 미사용. 2D scaleX(100→0→-100→0→100) 트릭으로 플립 연출.
//   전부 shape + keyframe, gradient fill, 색은 토큰 참조. expression 없음.

const W = 300
const H = 300
const FR = 60
const CX = W / 2
const CY = H / 2
const R = 88 // 동전 반지름

// 4각 반짝임(sparkle) path — 원점 중심
const SPARKLE: ShapeData = {
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

export interface CoinFlipParams extends Params {
  speed: number // 50~200 (%)
}

export const coinFlipDefaults: CoinFlipParams = {
  speed: 100,
}

/** 동전 면(그라디언트 골드 원 + 림) */
function coinFaceShapes(): ShapeItem[] {
  return [
    // 림(테두리)
    group(
      [ellipse({ size: val([R * 2, R * 2], 2) }), stroke(getToken('Semantic/Orange-400'), 8)],
      transform(),
      'rim',
    ),
    // 면(대각선 골드 그라디언트)
    group(
      [
        ellipse({ size: val([R * 2 - 10, R * 2 - 10], 2) }),
        gradientFill({
          stops: [
            { pos: 0, hex: getToken('Semantic/Yellow-300') }, // 밝은 골드
            { pos: 0.5, hex: getToken('Semantic/Yellow-400') },
            { pos: 1, hex: getToken('Semantic/Orange-300') }, // 깊은 골드
          ],
          type: 1,
          start: [-R, -R],
          end: [R, R],
        }),
      ],
      transform(),
      'face',
    ),
    // 안쪽 하이라이트 링
    group(
      [ellipse({ size: val([R * 1.35, R * 1.35], 2) }), stroke(getToken('Semantic/Yellow-200'), 5)],
      transform(),
      'inner',
    ),
  ]
}

/** 반짝임 1개 — 팝(scale 0→1.5) + 페이드, 약간 회전 */
function sparkleLayer(name: string, pos: [number, number], start: number, P: number, baseSize: number): Layer {
  const dur = Math.round(P * 0.42)
  const f = (frac: number) => start + Math.round(frac * dur)
  return shapeLayer({
    name,
    shapes: [
      group(
        [pathShape(SPARKLE), fill(getToken('Semantic/Yellow-100'), 100)],
        transform({
          p: val([pos[0], pos[1]], 2),
          s: anim(
            keyframes([
              { t: f(0), s: [0, 0], ease: 'out' },
              { t: f(0.45), s: [baseSize, baseSize], ease: 'out' },
              { t: f(1), s: [baseSize * 0.6, baseSize * 0.6], ease: 'in' },
            ]),
            6,
          ),
          r: anim(
            keyframes([
              { t: f(0), s: [0], ease: 'linear' },
              { t: f(1), s: [55], ease: 'linear' },
            ]),
            10,
          ),
          o: anim(
            keyframes([
              { t: f(0), s: [0], ease: 'out' },
              { t: f(0.3), s: [100], ease: 'linear' },
              { t: f(0.7), s: [100], ease: 'in' },
              { t: f(1), s: [0], ease: 'in' },
            ]),
            11,
          ),
        }),
        name,
      ),
    ],
    ip: 0,
    op: P,
  })
}

export function generateCoinFlip(p: CoinFlipParams): LottieJSON {
  resetInd()
  const speed = Math.max(50, Math.min(200, p.speed))
  const P = Math.max(24, Math.round(78 * (100 / speed))) // 한 바퀴 플립 길이

  // 그림자(동전 아래) — 플립에 맞춰 가로 폭이 줄었다 늘어남
  const shadow = shapeLayer({
    name: 'shadow',
    shapes: [
      group(
        [ellipse({ size: val([R * 1.7, R * 0.34], 2) }), fill(getToken('Mono/Neutral-900'), 100)],
        transform({
          p: val([CX, CY + R + 18], 2),
          o: val(16, 11),
          s: anim(
            keyframes([
              { t: 0, s: [100, 100], ease: 'in-out' },
              { t: Math.round(P * 0.25), s: [40, 100], ease: 'in-out' },
              { t: Math.round(P * 0.5), s: [100, 100], ease: 'in-out' },
              { t: Math.round(P * 0.75), s: [40, 100], ease: 'in-out' },
              { t: P, s: [100, 100], ease: 'in-out' },
            ]),
            6,
          ),
        }),
        'shadow',
      ),
    ],
    ip: 0,
    op: P,
  })

  // 동전 — scaleX 100→0→-100→0→100 (2D 플립 트릭). 살짝 위아래 바운스.
  const coin = shapeLayer({
    name: 'coin',
    shapes: [group(coinFaceShapes(), transform(), 'coin-face')],
    ks: transform({
      p: anim(
        keyframes([
          { t: 0, s: [CX, CY], ease: 'in-out' },
          { t: Math.round(P * 0.25), s: [CX, CY - 14], ease: 'in-out' },
          { t: Math.round(P * 0.5), s: [CX, CY], ease: 'in-out' },
          { t: Math.round(P * 0.75), s: [CX, CY - 14], ease: 'in-out' },
          { t: P, s: [CX, CY], ease: 'in-out' },
        ]),
        2,
      ),
      s: anim(
        keyframes([
          { t: 0, s: [100, 100], ease: 'in-out' },
          { t: Math.round(P * 0.25), s: [0, 100], ease: 'in-out' },
          { t: Math.round(P * 0.5), s: [-100, 100], ease: 'in-out' },
          { t: Math.round(P * 0.75), s: [0, 100], ease: 'in-out' },
          { t: P, s: [100, 100], ease: 'in-out' },
        ]),
        6,
      ),
    }),
    ip: 0,
    op: P,
  })

  // 반짝임 2개 (시차)
  const sp1 = sparkleLayer('star', [CX + R + 6, CY - R + 10], Math.round(P * 0.12), P, 130)
  const sp2 = sparkleLayer('star-2', [CX - R + 4, CY + R - 6], Math.round(P * 0.55), P, 95)

  // 렌더 순서: 반짝임(앞) → 동전 → 그림자(뒤)
  return root({ name: 'coin-flip', w: W, h: H, fr: FR, op: P, layers: [sp1, sp2, coin, shadow] })
}
