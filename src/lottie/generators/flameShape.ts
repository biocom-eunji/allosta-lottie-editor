import { fill, gradientFill, pathShape, type ShapeData } from '../builders'
import type { ColorValue } from '../controls'
import type { GradientStop } from '../../tokens/colors'
import type { ShapeItem } from '../types'

// 첨부 SVG(132x132) 불꽃을 Lottie 패스로 변환 — viewBox 중심(66,66) 기준으로 평행이동(원점 중심).
// 외곽 불꽃 + 내부 불꽃(하이라이트) 2개 path.

export const FLAME_TOP = -50.58
export const FLAME_BOTTOM = 49.5
export const FLAME_H = FLAME_BOTTOM - FLAME_TOP // ≈ 100 (sizing 기준 높이)
export const FLAME_HALF_W = 41.25

/** 외곽 불꽃 실루엣 */
export const FLAME_OUTER: ShapeData = {
  c: true,
  v: [
    [-8.25, -16.5027],
    [3.6906, -49.2291],
    [8.8417, -50.5754],
    [41.25, 8.2473],
    [29.1682, 37.415],
    [0, 49.497],
    [-29.1682, 37.415],
    [-41.25, 8.2473],
    [-27.4666, -30.0096],
    [-22.5979, -30.4158],
  ],
  i: [
    [0, 0],
    [0, 0],
    [-1.7032, -1.5186],
    [0, -26.0362],
    [7.7358, -7.7354],
    [10.9402, 0],
    [7.7359, 7.736],
    [0, 10.9402],
    [-7.5851, 10.7111],
    [-1.4194, -1.3764],
  ],
  o: [
    [0, 0],
    [0.7821, -2.1437],
    [12.1184, 10.805],
    [0, 10.9402],
    [-7.7359, 7.736],
    [-10.9402, 0],
    [-7.7358, -7.7354],
    [0, -14.3919],
    [1.1427, -1.6136],
    [0, 0],
  ],
}

/** 내부 불꽃(밝은 하이라이트) */
export const FLAME_INNER: ShapeData = {
  c: true,
  v: [
    [-12.9316, 29.3362],
    [-8.703, 39.433],
    [1.5059, 43.615],
    [11.7147, 39.433],
    [15.9434, 29.3362],
    [3.6506, 7.9679],
    [-0.6389, 7.9679],
  ],
  i: [
    [0, -10.8077],
    [-2.7076, -2.678],
    [-3.8291, 0],
    [-2.7075, 2.678],
    [0, 3.787],
    [4.0215, 3.025],
    [1.2863, -0.9676],
  ],
  o: [
    [0, 3.787],
    [2.7076, 2.678],
    [3.829, 0],
    [2.7076, -2.678],
    [0, -10.8077],
    [-1.2863, -0.9676],
    [-4.0214, 3.025],
  ],
}

/** 외곽 불꽃 fill — gradient 면 세로 그라디언트, solid 면 단색 */
export function outerPaint(flameColor: ColorValue): ShapeItem {
  if (flameColor.mode === 'gradient' && flameColor.stops?.length) {
    return gradientFill({
      stops: flameColor.stops as GradientStop[],
      type: 1,
      start: [0, FLAME_TOP],
      end: [0, FLAME_BOTTOM],
      opacity: flameColor.opacity,
    })
  }
  return fill(flameColor.hex, flameColor.opacity)
}

/** 불꽃 path 도형 (outer/inner) */
export const flameOuterPath = (): ShapeItem => pathShape(FLAME_OUTER, 1)
export const flameInnerPath = (): ShapeItem => pathShape(FLAME_INNER, 1)
