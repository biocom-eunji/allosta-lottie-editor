import { fill, gradientFill, pathShape, type ShapeData } from '../builders'
import type { ColorValue } from '../controls'
import type { GradientStop } from '../../tokens/colors'
import type { ShapeItem } from '../types'

// "의지의 불꽃" 첨부 SVG(51x44) → Lottie 패스. viewBox 중심(25.5,22) 기준 평행이동(원점 중심).
// 3 path: 외곽 불꽃(#08B1FF) + 좌상단 스파크(#08B1FF, 외곽과 동색) + 물방울 코어(#FFF8D8).
// SVG cubic(C) → Lottie 탄젠트(o=C1-P0, i=C2-P3), 직선(L)=탄젠트 0.

export const WILL_TOP = -16.8559
export const WILL_BOTTOM = 16.5017
export const WILL_H = WILL_BOTTOM - WILL_TOP // ≈ 33.36 (sizing 기준 높이)
export const WILL_HALF_W = 14.0356

/** 물방울 코어 중심(원점 기준) — 펄스 앵커용 */
export const WILL_CORE_CENTER: [number, number] = [0.2163, 9.3852]

/** 외곽 불꽃 실루엣 (10 정점) */
export const WILL_OUTER: ShapeData = {
  c: true,
  v: [
    [-3.0356, -5.4983],
    [0.9446, -16.4071],
    [2.6616, -16.8559],
    [13.4644, 2.7517],
    [9.4371, 12.4744],
    [-0.2856, 16.5017],
    [-10.0084, 12.4744],
    [-14.0356, 2.7517],
    [-9.4412, -10.0006],
    [-7.8183, -10.136],
  ],
  i: [
    [0, 0],
    [0, 0],
    [-0.5677, -0.5062],
    [0, -8.6787],
    [2.5786, -2.5786],
    [3.6467, 0],
    [2.5787, 2.5786],
    [0, 3.6467],
    [-2.5283, 3.5704],
    [-0.4731, -0.4588],
  ],
  o: [
    [0, 0],
    [0.2607, -0.71456],
    [4.0395, 3.60165],
    [0, 3.6467],
    [-2.5787, 2.5786],
    [-3.6468, 0],
    [-2.5786, -2.5786],
    [0, -4.7973],
    [0.3809, -0.5379],
    [0, 0],
  ],
}

/** 좌상단 스파크(작은 잎) — 외곽과 동색 (4 정점) */
export const WILL_SPARK: ShapeData = {
  c: true,
  v: [
    [-6.3118, -12.3297],
    [-6.7603, -18.8513],
    [-5.5447, -18.3741],
    [-5.2596, -12.3425],
  ],
  i: [
    [0.3108, 0.252],
    [-3.2797, 1.72198],
    [-0.205, -0.47474],
    [1.8495, -1.75207],
  ],
  o: [
    [-2.9818, -2.41766],
    [0.4579, -0.24039],
    [0.9612, 2.22581],
    [-0.2905, 0.27519],
  ],
}

/** 물방울 코어 하이라이트 (7 정점) */
export const WILL_CORE: ShapeData = {
  c: true,
  v: [
    [-4.5962, 9.7787],
    [-3.1866, 13.1443],
    [0.2163, 14.5384],
    [3.6193, 13.1443],
    [5.0288, 9.7787],
    [0.9312, 2.656],
    [-0.4986, 2.656],
  ],
  i: [
    [0, -3.6025],
    [-0.9026, -0.8926],
    [-1.2763, 0],
    [-0.9026, 0.8926],
    [0, 1.2624],
    [1.3405, 1.0083],
    [0.4288, -0.3226],
  ],
  o: [
    [0, 1.2624],
    [0.9025, 0.8926],
    [1.2764, 0],
    [0.9025, -0.8926],
    [0, -3.6025],
    [-0.4287, -0.3226],
    [-1.3405, 1.0083],
  ],
}

/** 외곽 불꽃 fill — gradient 면 세로 그라디언트, solid 면 단색 */
export function willOuterPaint(flameColor: ColorValue): ShapeItem {
  if (flameColor.mode === 'gradient' && flameColor.stops?.length) {
    return gradientFill({
      stops: flameColor.stops as GradientStop[],
      type: 1,
      start: [0, WILL_TOP],
      end: [0, WILL_BOTTOM],
      opacity: flameColor.opacity,
    })
  }
  return fill(flameColor.hex, flameColor.opacity)
}

export const willOuterPath = (): ShapeItem => pathShape(WILL_OUTER, 1)
export const willSparkPath = (): ShapeItem => pathShape(WILL_SPARK, 1)
export const willCorePath = (): ShapeItem => pathShape(WILL_CORE, 1)
