import { anim, ellipse, fill, group, keyframes, radialGlow, resetInd, root, shapeLayer, transform, val } from '../builders'
import { getToken } from '../../tokens/colors'
import { WILL_CORE_CENTER, WILL_H, willCorePath, willOuterPaint, willOuterPath, willSparkPath } from './willFlameShape'
import type { ColorValue, Params } from '../controls'
import type { LottieJSON, ShapeItem } from '../types'

// streak-will-flame — "의지의 불꽃"(파란 톤). streak-flame 과 동일 실루엣을 파랑으로.
//  · icon    : 작은 크기, 약한 플리커 루프. (week-row saver 칸 / "의지의 불꽃 N개" 배지용)
//  · receive : 단독 one-shot. 위에서 톡 떨어져 바운스 + 은은한 글로우. ("의지의 불꽃을 받았어요")
// 전부 shape+keyframe, 글로우는 radial-gradient(블러 미사용) → RN 안전. 색은 토큰 resolve→baked.

const W = 300
const H = 300

export interface WillFlameParams extends Params {
  mode: 'icon' | 'receive'
  flameColor: ColorValue // 외곽 불꽃 (gradient 가능)
  coreColor: ColorValue // 내부 코어 하이라이트
  glowColor: ColorValue
  size: number // px (불꽃 높이 기준)
  speed: number // 50~200 (%)
}

export const willFlameDefaults: WillFlameParams = {
  mode: 'receive',
  flameColor: {
    mode: 'gradient',
    hex: getToken('Accent/Light Blue-400'),
    opacity: 100,
    gradientType: 1,
    stops: [
      { pos: 0, hex: getToken('Accent/Light Blue-300') }, // 위(끝) 밝은 하늘
      { pos: 1, hex: getToken('Accent/Light Blue-500') }, // 아래(밑동) 진한 파랑
    ],
  },
  coreColor: { mode: 'solid', hex: getToken('Semantic/Yellow-50'), opacity: 100 },
  glowColor: { mode: 'solid', hex: getToken('Accent/Light Blue-400'), opacity: 100 },
  size: 150,
  speed: 100,
}

/**
 * 불꽃 본체(외곽+코어) 그룹. 원점(0,0) 중심으로 그려지며 자체 플리커(호흡/sway)를 가짐.
 * 호출측이 group/레이어 transform 으로 위치·추가 모션을 부여한다. (week-row saver 칸에서 재사용)
 */
export function willFlameBody(opts: { flameColor: ColorValue; coreColor: ColorValue; scl: number; period: number; flicker?: number }): ShapeItem {
  const P = Math.max(2, Math.round(opts.period))
  const fl = opts.flicker ?? 1
  // 코어: path 가 절대좌표(원점기준)이므로 자기 중심(WILL_CORE_CENTER)에 앵커=포지션을 두고 펄스
  const inner = group(
    [willCorePath(), fill(opts.coreColor.hex, opts.coreColor.opacity)],
    transform({
      p: val([WILL_CORE_CENTER[0], WILL_CORE_CENTER[1]], 2),
      a: val([WILL_CORE_CENTER[0], WILL_CORE_CENTER[1]], 1),
      s: anim(keyframes([
        { t: 0, s: [100, 100], ease: 'in-out' },
        { t: Math.round(P * 0.45), s: [100 - 10 * fl, 100 + 10 * fl], ease: 'in-out' },
        { t: P, s: [100, 100], ease: 'in-out' },
      ]), 6),
    }),
    'inner',
  )
  // 외곽 + 스파크(동색) → 하나의 fill 공유
  const outer = group([willOuterPath(), willSparkPath(), willOuterPaint(opts.flameColor)], transform(), 'outer')
  return group(
    [inner, outer],
    transform({
      a: val([0, 0], 1),
      s: anim(keyframes([
        { t: 0, s: [opts.scl, opts.scl], ease: 'in-out' },
        { t: Math.round(P * 0.28), s: [opts.scl * (1 - 0.05 * fl), opts.scl * (1 + 0.06 * fl)], ease: 'in-out' },
        { t: Math.round(P * 0.6), s: [opts.scl * (1 + 0.04 * fl), opts.scl * (1 - 0.03 * fl)], ease: 'in-out' },
        { t: P, s: [opts.scl, opts.scl], ease: 'in-out' },
      ]), 6),
      r: anim(keyframes([
        { t: 0, s: [-2.5 * fl], ease: 'in-out' },
        { t: Math.round(P / 2), s: [2.5 * fl], ease: 'in-out' },
        { t: P, s: [-2.5 * fl], ease: 'in-out' },
      ]), 10),
    }),
    'will-flame-body',
  )
}

export function generateWillFlame(p: WillFlameParams): LottieJSON {
  resetInd()
  const speed = Math.max(50, Math.min(200, p.speed))
  const sf = 100 / speed // 속도 보정 계수
  const cx = W / 2
  const cy = H / 2
  const scl = (p.size / WILL_H) * 100
  const glowSize = p.size * 2.2

  if (p.mode === 'icon') {
    const P = Math.max(20, Math.round(60 * sf))
    const body = willFlameBody({ flameColor: p.flameColor, coreColor: p.coreColor, scl, period: P, flicker: 0.5 })
    const flameLayer = shapeLayer({
      name: 'will-flame',
      shapes: [group([body], transform({ p: val([cx, cy], 2) }), 'pos')],
      ip: 0,
      op: P,
    })
    const glow = shapeLayer({
      name: 'glow',
      shapes: [
        group(
          [ellipse({ size: val([glowSize, glowSize], 2) }), radialGlow({ hex: p.glowColor.hex, opacity: 100, size: glowSize })],
          transform({
            p: val([cx, cy + p.size * 0.06], 2),
            o: anim(keyframes([
              { t: 0, s: [32], ease: 'in-out' },
              { t: Math.round(P / 2), s: [46], ease: 'in-out' },
              { t: P, s: [32], ease: 'in-out' },
            ]), 11),
            s: anim(keyframes([
              { t: 0, s: [96, 96], ease: 'in-out' },
              { t: Math.round(P / 2), s: [104, 104], ease: 'in-out' },
              { t: P, s: [96, 96], ease: 'in-out' },
            ]), 6),
          }),
          'glow',
        ),
      ],
      ip: 0,
      op: P,
    })
    return root({ name: 'streak-will-flame', w: W, h: H, op: P, layers: [flameLayer, glow] })
  }

  // ── receive: one-shot 팝인(ease-out-back 오버슈트) + 살짝 위로 settle + 글로우 ──
  const r = (n: number) => Math.round(n * sf)
  const settle = r(30)
  const op = r(84)
  const body = willFlameBody({ flameColor: p.flameColor, coreColor: p.coreColor, scl, period: op, flicker: 0.6 })

  const flameLayer = shapeLayer({
    name: 'will-flame',
    shapes: [
      group([body], transform({
        // 살짝 아래에서 위로 settle
        p: anim(keyframes([
          { t: 0, s: [cx, cy + 10], ease: 'out' },
          { t: r(18), s: [cx, cy - 4], ease: 'out' },
          { t: settle, s: [cx, cy], ease: 'in-out' },
        ]), 2),
        // scale 0 → 오버슈트(톡) → 정착 (ease-out-back)
        s: anim(keyframes([
          { t: 0, s: [0, 0], ease: 'out' },
          { t: r(12), s: [114, 108], ease: 'out' }, // 오버슈트(세로 더 늘려 "톡")
          { t: r(20), s: [95, 103], ease: 'in-out' },
          { t: settle, s: [100, 100], ease: 'in-out' },
        ]), 6),
      }), 'pos'),
    ],
    ks: transform({
      o: anim(keyframes([
        { t: 0, s: [0], ease: 'out' },
        { t: r(8), s: [100], ease: 'out' },
      ]), 11),
    }),
    ip: 0,
    op,
  })

  const glow = shapeLayer({
    name: 'glow',
    shapes: [
      group(
        [ellipse({ size: val([glowSize, glowSize], 2) }), radialGlow({ hex: p.glowColor.hex, opacity: 100, size: glowSize })],
        transform({
          p: val([cx, cy + p.size * 0.06], 2),
          o: anim(keyframes([
            { t: 0, s: [0], ease: 'out' },
            { t: r(12), s: [56], ease: 'in-out' }, // 팝인과 함께 확 퍼짐
            { t: r(34), s: [34], ease: 'in-out' },
            { t: r(60), s: [44], ease: 'in-out' },
            { t: op, s: [34], ease: 'in-out' },
          ]), 11),
          s: anim(keyframes([
            { t: 0, s: [50, 50], ease: 'out' },
            { t: r(16), s: [108, 108], ease: 'out' },
            { t: r(34), s: [96, 96], ease: 'in-out' },
            { t: op, s: [100, 100], ease: 'in-out' },
          ]), 6),
        }),
        'glow',
      ),
    ],
    ip: 0,
    op,
  })

  // z순서(배열 앞=위): 불꽃 > 글로우. (블룸은 2단계에서 글로우와 불꽃 사이에 삽입)
  return root({ name: 'streak-will-flame', w: W, h: H, op, layers: [flameLayer, glow] })
}
