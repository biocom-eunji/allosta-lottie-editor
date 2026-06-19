import { anim, group, keyframes, rect, root, shapeLayer, stroke, transform, trimPath, val, gradientStroke, resetInd } from '../builders'
import type { ColorValue, Params } from '../controls'
import type { LottieJSON, ShapeItem } from '../types'
import { BRAND_HEX, getToken, type GradientStop } from '../../tokens/colors'

export interface GradientLoaderParams extends Params {
  width: number
  height: number
  roundness: number
  strokeWidth: number
  strokeColor: ColorValue
}

export const gradientLoaderDefaults: GradientLoaderParams = {
  width: 150,
  height: 150,
  roundness: 44,
  strokeWidth: 13,
  strokeColor: {
    mode: 'gradient',
    hex: BRAND_HEX,
    opacity: 100,
    gradientType: 1,
    stops: [
      { pos: 0, hex: BRAND_HEX },
      { pos: 1, hex: getToken('Brand/Mint-200') },
    ],
  },
}

export function generateGradientLoader(p: GradientLoaderParams): LottieJSON {
  resetInd()
  const W = 300
  const H = 300
  const op = 90 // 1.5s @ 60fps -> 한 바퀴

  const stops: GradientStop[] =
    p.strokeColor.mode === 'gradient'
      ? p.strokeColor.stops ?? [
          { pos: 0, hex: p.strokeColor.hex },
          { pos: 1, hex: p.strokeColor.hex },
        ]
      : [
          { pos: 0, hex: p.strokeColor.hex },
          { pos: 1, hex: p.strokeColor.hex },
        ]

  // 닫힌 squircle stroke (track / highlight 공통 path + 색)
  const rectShape = (): ShapeItem => rect({ size: val([p.width, p.height], 2), roundness: val(p.roundness, 4) })
  const strokeShape = (opacityMul: number): ShapeItem =>
    p.strokeColor.mode === 'gradient'
      ? gradientStroke({
          stops,
          type: p.strokeColor.gradientType ?? 1,
          start: [-p.width / 2, -p.height / 2],
          end: [p.width / 2, p.height / 2],
          width: p.strokeWidth,
          opacity: p.strokeColor.opacity * opacityMul,
        })
      : stroke(p.strokeColor.hex, p.strokeWidth, p.strokeColor.opacity * opacityMul)

  // ① 트랙: 닫힌 링 전체를 항상 100% 렌더 (희미하게)
  const track = group([rectShape(), strokeShape(0.22)], transform({ p: val([W / 2, H / 2], 2) }), 'track')

  // ② 하이라이트: trim 세그먼트가 한 바퀴. 머리=불투명 → 꼬리=투명으로
  //    꼬리 끝이 트랙/배경과 자연스럽게 이어지게 한다.
  //    ★ 경계(seam) 방지: 조각을 butt 캡으로 정확히 맞붙여(겹침 0) 반투명 이중칠 제거,
  //      조각 수를 늘려 opacity 계단을 부드럽게.
  const ARC = 32 // 호 전체 길이(%)
  const K = 24 // 페이드 조각 수(많을수록 매끄러움)
  const segW = ARC / K
  // 같은 회전(offset) 애니메이션을 모든 조각이 공유 → 한 호처럼 함께 돈다
  const spin = () =>
    anim(
      keyframes([
        { t: 0, s: [0], ease: 'linear' },
        { t: op, s: [360], ease: 'linear' },
      ]),
      3,
    )

  const segments: ShapeItem[] = []
  for (let j = 0; j < K; j++) {
    const s = j * segW
    const e = (j + 1) * segW // 겹침 없이 정확히 맞붙임
    const fade = (j + 1) / K // 꼬리(0 근처) → 머리(1)
    const strk = strokeShape(fade)
    // 머리만 둥근 캡(부드러운 팁), 나머지는 butt 캡(맞붙는 조각끼리 겹침·이음새 없음)
    strk.lc = j === K - 1 ? 2 : 1
    strk.lj = 1
    segments.push(
      group([rectShape(), trimPath({ s: val(s, 1), e: val(e, 2), o: spin() }), strk], transform({ p: val([W / 2, H / 2], 2) }), `seg-${j}`),
    )
  }
  // 머리(밝은 쪽)가 앞에 오도록 역순 배치
  segments.reverse()

  // 하이라이트(조각들)가 트랙 위(앞)
  const layer = shapeLayer({ name: 'loader', shapes: [...segments, track], ip: 0, op })
  return root({ name: 'gradient-loader', w: W, h: H, op, layers: [layer] })
}
