import { anim, ellipse, fill, group, keyframes, root, shapeLayer, staggerLayers, stroke, transform, val } from '../builders'
import { buildCheckCell } from './streakDayCheck'
import { getToken } from '../../tokens/colors'
import type { ColorValue, Params } from '../controls'
import type { Layer, LottieJSON } from '../types'

export interface StreakWeekRowParams extends Params {
  completeColor: ColorValue
  incompleteColor: ColorValue
  todayColor: ColorValue
  cells: number
  staggerDelay: number
  completedCount: number
}

export const streakWeekRowDefaults: StreakWeekRowParams = {
  completeColor: { mode: 'solid', hex: getToken('Semantic/Orange-300'), opacity: 100 },
  incompleteColor: { mode: 'solid', hex: getToken('Mono/Neutral-700'), opacity: 100 },
  todayColor: { mode: 'solid', hex: getToken('Semantic/Yellow-200'), opacity: 100 },
  cells: 7,
  staggerDelay: 6,
  completedCount: 4,
}

export function generateStreakWeekRow(p: StreakWeekRowParams): LottieJSON {
  const cells = Math.max(1, Math.min(14, Math.round(p.cells)))
  const completed = Math.max(0, Math.min(cells, Math.round(p.completedCount)))
  const delay = Math.max(0, Math.round(p.staggerDelay))
  const cellAnim = 30

  const D = 36
  const gap = 16
  const totalW = cells * D + (cells - 1) * gap
  const W = Math.max(320, totalW + 60)
  const H = 120
  const cy = H / 2
  const startX = (W - totalW) / 2 + D / 2
  const cellX = (i: number) => startX + i * (D + gap)

  const rootOp = cellAnim + Math.max(0, completed - 1) * delay + 8
  const todayIndex = completed < cells ? completed : -1

  const layers: Layer[] = []

  // 미완료 칸 (정적 원) — 오늘 칸 포함해 회색으로 깔고 위에 링 강조
  for (let i = completed; i < cells; i++) {
    layers.push(
      shapeLayer({
        name: `cell-empty-${i}`,
        shapes: [
          group(
            [ellipse({ size: val([D, D], 2) }), fill(p.incompleteColor.hex, p.incompleteColor.opacity)],
            transform({ p: val([cellX(i), cy], 2) }),
            `empty-${i}`,
          ),
        ],
        ip: 0,
        op: rootOp,
      }),
    )
  }

  // 오늘 강조 링 (부드러운 펄스)
  if (todayIndex >= 0) {
    layers.push(
      shapeLayer({
        name: 'today-ring',
        shapes: [
          group(
            [ellipse({ size: val([D + 12, D + 12], 2) }), stroke(p.todayColor.hex, 3, p.todayColor.opacity)],
            transform({
              p: val([cellX(todayIndex), cy], 2),
              s: anim(
                keyframes([
                  { t: 0, s: [88, 88], ease: 'in-out' },
                  { t: Math.round(rootOp / 2), s: [104, 104], ease: 'in-out' },
                  { t: rootOp, s: [88, 88], ease: 'in-out' },
                ]),
                6,
              ),
            }),
            'ring',
          ),
        ],
        ip: 0,
        op: rootOp,
      }),
    )
  }

  // 완료 칸 (체크 채우기) — stagger 순차
  const completedLayers: Layer[] = []
  for (let i = 0; i < completed; i++) {
    completedLayers.push(
      buildCheckCell({
        cx: cellX(i),
        cy,
        D,
        incomplete: p.incompleteColor,
        complete: p.completeColor,
        check: { mode: 'solid', hex: getToken('WHBK/WH'), opacity: 100 },
        P: cellAnim,
        op: rootOp,
        name: `cell-done-${i}`,
        withPop: false,
      }),
    )
  }
  layers.push(...staggerLayers(completedLayers, delay))

  return root({ name: 'streak-week-row', w: W, h: H, op: rootOp, layers })
}
