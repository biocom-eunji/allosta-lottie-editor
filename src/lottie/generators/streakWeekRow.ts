import { anim, drawStroke, ellipse, fill, gradientFill, group, keyframes, resetInd, rect, root, shapeLayer, transform, val } from '../builders'
import { getToken, type GradientStop } from '../../tokens/colors'
import type { ColorValue, Params } from '../controls'
import type { Layer, LottieJSON, ShapeItem } from '../types'

// streak-week-row — 연결된 스타디움(알약) 트랙. (첨부 SVG 디자인)
// 완료 구간: 그라디언트(노랑→오렌지) 바가 좌→우로 차오르며 흰 체크 표시.
// 미완료: 회색 원. 양 끝 라운드 캡. (전부 shape+keyframe, RN 안전)

export interface StreakWeekRowParams extends Params {
  completeColor: ColorValue // 완료 채움 (gradient 가능)
  incompleteColor: ColorValue // 미완료 원
  cells: number
  staggerDelay: number
  completedCount: number
}

export const streakWeekRowDefaults: StreakWeekRowParams = {
  completeColor: {
    mode: 'gradient',
    hex: getToken('Semantic/Orange-400'),
    opacity: 100,
    gradientType: 1,
    stops: [
      { pos: 0, hex: getToken('Semantic/Yellow-400') }, // 좌(#F0B800)
      { pos: 1, hex: getToken('Semantic/Orange-400') }, // 우(#F67900)
    ],
  },
  incompleteColor: { mode: 'solid', hex: getToken('Mono/Neutral-50'), opacity: 100 },
  cells: 7,
  staggerDelay: 6,
  completedCount: 5,
}

const D = 44 // 셀(원) 지름
const SPACING = 50 // 셀 중심 간격 (gap 6 → 연결된 느낌)

export function generateStreakWeekRow(p: StreakWeekRowParams): LottieJSON {
  resetInd()
  const cells = Math.max(1, Math.min(14, Math.round(p.cells)))
  const completed = Math.max(0, Math.min(cells, Math.round(p.completedCount)))
  const delay = Math.max(0, Math.round(p.staggerDelay))

  const totalW = (cells - 1) * SPACING + D
  const W = totalW + 48
  const H = 120
  const cy = H / 2
  const startX = (W - totalW) / 2 + D / 2
  const cellX = (i: number) => startX + i * SPACING

  const fillDur = 28
  const rootOp = fillDur + Math.max(0, completed - 1) * delay + 16

  // 렌더 순서(배열 앞=위): 체크 → 그라디언트 바 → 회색 원
  const checks: Layer[] = []
  const bars: Layer[] = []
  const empties: Layer[] = []

  // 미완료 회색 원 (맨 뒤)
  for (let i = completed; i < cells; i++) {
    empties.push(
      shapeLayer({
        name: `empty-${i}`,
        shapes: [group([ellipse({ size: val([D, D], 2) }), fill(p.incompleteColor.hex, p.incompleteColor.opacity)], transform({ p: val([cellX(i), cy], 2) }), `empty-${i}`)],
        ip: 0,
        op: rootOp,
      }),
    )
  }

  if (completed > 0) {
    // 완료 구간: 연결된 그라디언트 스타디움 바 (좌→우로 차오름)
    const barLeft = cellX(0) - D / 2
    const barRight = cellX(completed - 1) + D / 2
    const barW = barRight - barLeft
    const paint: ShapeItem =
      p.completeColor.mode === 'gradient' && p.completeColor.stops?.length
        ? gradientFill({ stops: p.completeColor.stops as GradientStop[], type: 1, start: [-barW / 2, 0], end: [barW / 2, 0], opacity: p.completeColor.opacity })
        : fill(p.completeColor.hex, p.completeColor.opacity)
    bars.push(
      shapeLayer({
        name: 'fill-bar',
        shapes: [group([rect({ size: val([barW, D], 2), roundness: val(D / 2, 4) }), paint], transform(), 'bar')],
        // 왼쪽 끝(anchor)을 기준으로 scaleX 0→100 → 좌에서 우로 차오름
        ks: transform({
          p: val([barLeft, cy], 2),
          a: val([-barW / 2, 0], 1),
          s: anim(keyframes([
            { t: 0, s: [0, 100], ease: 'out' },
            { t: fillDur, s: [100, 100], ease: 'out' },
          ]), 6),
        }),
        ip: 0,
        op: rootOp,
      }),
    )

    // 흰 체크 (완료 셀마다, 차오름에 맞춰 순차 등장) — 바 위(맨 앞)
    const f = D / 44
    const pts = (cx: number): number[][] => [
      [cx - 5.56 * f, cy + 0.5 * f],
      [cx - 2.06 * f, cy + 4 * f],
      [cx + 5.6 * f, cy - 3.67 * f],
    ]
    for (let i = 0; i < completed; i++) {
      const t0 = Math.round((i / Math.max(1, completed)) * fillDur) + 4
      checks.push(
        shapeLayer({
          name: `check-${i}`,
          shapes: [drawStroke({ points: pts(cellX(i)), hex: getToken('WHBK/WH'), width: 2.4 * f, startFrame: t0, endFrame: t0 + 8 })],
          ip: 0,
          op: rootOp,
        }),
      )
    }
  }

  return root({ name: 'streak-week-row', w: W, h: H, op: rootOp, layers: [...checks, ...bars, ...empties] })
}
