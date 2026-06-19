import { anim, drawStroke, ellipse, group, keyframes, root, shapeLayer, transform, val } from '../builders'
import { getToken, hexToRgb } from '../../tokens/colors'
import source from '../sources/day-check-success.json'
import { applySpeed, loadDoc, wrapInScaledPrecomp } from './confettiSource'
import type { ColorValue, Params } from '../controls'
import type { Layer, LottieJSON } from '../types'

export interface StreakDayCheckParams extends Params {
  incompleteColor: ColorValue
  completeColor: ColorValue
  checkColor: ColorValue
  size: number
  speed: number // 50~200 (%)
}

export const streakDayCheckDefaults: StreakDayCheckParams = {
  // incompleteColor → 파동(halo), completeColor → 원, checkColor → 체크
  incompleteColor: { mode: 'solid', hex: getToken('Semantic/green-100'), opacity: 100 },
  completeColor: { mode: 'solid', hex: getToken('Semantic/green-300'), opacity: 100 },
  checkColor: { mode: 'solid', hex: getToken('WHBK/WH'), opacity: 100 },
  size: 470,
  speed: 100,
}

/** 색이 채워지며 체크가 그려지는 1칸. 좌표는 (cx,cy) 중심, 원점 기준 스케일 pop. */
export function buildCheckCell(opts: {
  cx: number
  cy: number
  D: number
  incomplete: ColorValue
  complete: ColorValue
  check: ColorValue
  P: number
  name: string
  withPop?: boolean
  /** 레이어 표시 종료 프레임 (stagger 시 P 보다 길게 유지). 기본 P */
  op?: number
}): Layer {
  const { D, P } = opts
  const layerOp = opts.op ?? P
  const R = D / 2
  const [ir, ig, ib] = hexToRgb(opts.incomplete.hex)
  const [cr, cg, cb] = hexToRgb(opts.complete.hex)

  const f = (frac: number) => Math.round(frac * P)

  // 원 fill: 미완료색 -> 완료색
  const circleFill = {
    ty: 'fl',
    c: anim(
      keyframes([
        { t: f(0.1), s: [ir, ig, ib, 1], ease: 'in-out' },
        { t: f(0.32), s: [cr, cg, cb, 1], ease: 'in-out' },
      ]),
      4,
    ),
    o: val(opts.complete.opacity, 5),
    r: 1,
    nm: 'Fill',
  }

  // 체크마크 (trim path draw)
  const check = drawStroke({
    points: [
      [-R * 0.36, R * 0.02],
      [-R * 0.08, R * 0.28],
      [R * 0.4, -R * 0.3],
    ],
    hex: opts.check.hex,
    width: Math.max(2, R * 0.16),
    startFrame: f(0.34),
    endFrame: f(0.72),
  })

  const pop = opts.withPop
    ? anim(
        keyframes([
          { t: 0, s: [55, 55], ease: 'out' },
          { t: f(0.16), s: [115, 115], ease: 'in-out' },
          { t: f(0.3), s: [100, 100], ease: 'in-out' },
        ]),
        6,
      )
    : anim(
        keyframes([
          { t: 0, s: [80, 80], ease: 'out' },
          { t: f(0.22), s: [100, 100], ease: 'out' },
        ]),
        6,
      )

  return shapeLayer({
    name: opts.name,
    shapes: [
      check,
      group([ellipse({ size: val([D, D], 2) }), circleFill], transform(), 'circle'),
    ],
    ks: transform({ p: val([opts.cx, opts.cy], 2), a: val([0, 0], 1), s: pop }),
    ip: 0,
    op: layerOp,
  })
}

// ── 소스(day-check-success) 기반: 원 팝 + 체크 드로잉 + 파동(halo) ──
// 색 컨트롤(incomplete/complete/check)은 유지하되 애니메이션만 교체.
const DC_FR = 60
const DC_REF = 512 // size=DC_REF → scale 100%
// 소스에 baked 된 색 (매칭 후 토큰 색으로 치환)
const SRC_CIRCLE: [number, number, number] = [0.172549019608, 0.854901960784, 0.580392156863] // 원(green)
const SRC_HALO: [number, number, number] = [0.783504889993, 0.945098039216, 0.880089314779] // 파동(light)
const SRC_WHITE: [number, number, number] = [1, 1, 1] // 체크/링 stroke

const near3 = (c: number[], t: [number, number, number]) =>
  Math.abs(c[0] - t[0]) < 0.04 && Math.abs(c[1] - t[1]) < 0.04 && Math.abs(c[2] - t[2]) < 0.04

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function recolorDayCheck(items: any[], p: StreakDayCheckParams) {
  const apply = (paint: { c: { a: number; k: number[] }; o?: { a: number; k: number } }, color: ColorValue) => {
    if (paint.c?.a !== 0) return
    const [r, g, b] = hexToRgb(color.hex)
    paint.c.k = [r, g, b, paint.c.k[3] ?? 1]
    if (paint.o && paint.o.a === 0) paint.o.k = color.opacity
  }
  for (const it of items) {
    if (it.ty === 'gr' && Array.isArray(it.it)) recolorDayCheck(it.it, p)
    else if ((it.ty === 'fl' || it.ty === 'st') && it.c?.a === 0) {
      const k = it.c.k
      if (near3(k, SRC_CIRCLE)) apply(it, p.completeColor)
      else if (near3(k, SRC_HALO)) apply(it, p.incompleteColor)
      else if (near3(k, SRC_WHITE)) apply(it, p.checkColor)
    }
  }
}

export function generateStreakDayCheck(p: StreakDayCheckParams): LottieJSON {
  const doc = loadDoc(source)

  // 풀프레임 흰 배경(BG) 제거 → 투명 배지
  doc.layers = (doc.layers as Layer[]).filter((l) => (l.nm ?? '').trim() !== 'BG')

  // 색 치환 (원/파동/체크) — 컨트롤 유지
  for (const l of doc.layers as Layer[]) if (Array.isArray(l.shapes)) recolorDayCheck(l.shapes, p)

  // 속도(재생속도) + 크기(루트 scale)
  applySpeed(doc, DC_FR, p.speed)
  const { layers, assets } = wrapInScaledPrecomp(doc, { compId: 'dc_main', name: 'day-check', size: p.size, ref: DC_REF })

  return root({ name: 'streak-day-check', w: doc.w, h: doc.h, fr: doc.fr, op: Math.round(doc.op), ip: 0, layers, assets })
}
