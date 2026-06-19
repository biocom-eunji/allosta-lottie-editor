import { anim, fill, group, rect, root, shapeLayer, transform, val } from '../builders'
import { BRAND_HEX, shiftLightness } from '../../tokens/colors'
import type { ColorValue, Params } from '../controls'
import type { Keyframe, Layer, LottieJSON } from '../types'

export interface Loader3DotParams extends Params {
  color: ColorValue
  dotSize: number
  gap: number
  /** 웨이브 속도(%) — 클수록 빠름(주기 짧음) */
  speed: number
  /** 바운스 강도(%) — 오버슈트/스트레치 양 */
  bounce: number
}

export const loader3dotDefaults: Loader3DotParams = {
  color: { mode: 'solid', hex: BRAND_HEX, opacity: 100 },
  dotSize: 30,
  gap: 52,
  speed: 100,
  bounce: 60,
}

/**
 * 한 색 → 좌(가장 밝음)·중(원색)·우(가장 어둠) 3셰이드.
 * Custom hex 기준 HSL lightness +12% / 0 / -12%.
 */
function deriveShades(hex: string): [string, string, string] {
  return [shiftLightness(hex, 12), hex, shiftLightness(hex, -12)]
}

// ── 스프링 이징(커스텀 베지어) ── o=세그먼트 시작 탄젠트, i=도착 탄젠트
type Ease = { o: { x: number[]; y: number[] }; i: { x: number[]; y: number[] } }
const RISE: Ease = { o: { x: [0.12], y: [0.62] }, i: { x: [0.3], y: [1] } } // 솟구침: 가속 후 정점에서 강한 감속(ease-out-back 느낌)
const FALL: Ease = { o: { x: [0.5], y: [0] }, i: { x: [0.82], y: [0.46] } } // 낙하: 중력 가속
const REBOUND: Ease = { o: { x: [0.18], y: [0.7] }, i: { x: [0.42], y: [1] } } // 착지 후 반발: ease-out
const SETTLE: Ease = { o: { x: [0.42], y: [0] }, i: { x: [0.58], y: [1] } } // 복귀: 부드러운 ease-in-out
const LINEAR: Ease = { o: { x: [0.5], y: [0.5] }, i: { x: [0.5], y: [0.5] } }

function kf(t: number, s: number[], ease: Ease | 'hold' = LINEAR): Keyframe {
  if (ease === 'hold') return { t, s, h: 1 }
  return { t, s, o: ease.o, i: ease.i }
}

export function generateLoader3Dot(p: Loader3DotParams): LottieJSON {
  const W = 300
  const H = 300
  const cx = W / 2
  const cy = H / 2

  // 속도(%) → 시간 스케일. 100%=기본, 200%=2배 빠름(주기 절반).
  const factor = 100 / Math.max(20, p.speed)
  const D = Math.round(42 * factor) // 점 1개 바운스 길이
  const delta = Math.round(12 * factor) // 점 간 시차(웨이브)
  const tail = Math.round(14 * factor) // 마지막 점 이후 휴식
  const P = 2 * delta + D + tail // 전체 주기 (마지막 프레임=첫 프레임 → seamless)

  // 바운스 강도 → 진폭/스트레치 양
  const b = Math.max(0, Math.min(1, p.bounce / 100))
  const riseH = p.dotSize * (0.6 + 1.2 * b) // 위로 솟는 거리
  const amp = 0.12 + 0.3 * b // 스트레치 기본 진폭

  // ── 모양 변형은 transform scale 이 아니라 rect size(w,h) 로 직접 처리 ──
  // (scale 로 늘리면 코너까지 늘어나 뾰족한 타원이 됨)
  // 코너 반경 r = min(w,h)/2 → 항상 "직선 옆면 + 원형 캡" 캡슐 유지.
  const d = p.dotSize
  // [w, h] poses
  const REST: [number, number] = [d, d] // 원
  const TOP: [number, number] = [d * (1 - amp * 0.55), d * (1 + amp)] // 세로 캡슐
  const LAND: [number, number] = [d * (1 + amp * 0.55), d * (1 - amp * 0.55)] // 가로 캡슐(착지 눌림)
  const OS: [number, number] = [d * (1 - amp * 0.14), d * (1 + amp * 0.28)] // 오버슈트
  const rad = (wh: [number, number]) => Math.min(wh[0], wh[1]) / 2

  const shades = deriveShades(p.color.hex)

  const layers: Layer[] = []
  for (let i = 0; i < 3; i++) {
    const x = cx + (i - 1) * p.gap
    const s = i * delta // 바운스 시작 프레임(웨이브 시차)
    const t1 = s + Math.round(0.34 * D) // 정점
    const t2 = s + Math.round(0.6 * D) // 착지
    const t3 = s + Math.round(0.78 * D) // 오버슈트
    const tEnd = s + D // 복귀(rest)

    const posK: Keyframe[] = []
    const sizeK: Keyframe[] = [] // rect w,h
    const radK: Keyframe[] = [] // rect 코너 반경 = min(w,h)/2
    const pushShape = (t: number, wh: [number, number], ease: Ease | 'hold') => {
      sizeK.push(kf(t, [wh[0], wh[1]], ease))
      radK.push(kf(t, [rad(wh)], ease))
    }
    if (s > 0) {
      // 시작 전 rest 유지
      posK.push(kf(0, [x, cy], 'hold'))
      pushShape(0, REST, 'hold')
    }
    posK.push(kf(s, [x, cy], RISE))
    posK.push(kf(t1, [x, cy - riseH], FALL))
    posK.push(kf(t2, [x, cy], REBOUND))
    posK.push(kf(t3, [x, cy - riseH * 0.06], SETTLE))
    posK.push(kf(tEnd, [x, cy], 'hold'))

    pushShape(s, REST, RISE)
    pushShape(t1, TOP, FALL) // 솟구침 정점: 세로 캡슐
    pushShape(t2, LAND, REBOUND) // 착지: 가로 캡슐
    pushShape(t3, OS, SETTLE) // 오버슈트
    pushShape(tEnd, REST, 'hold')

    // 주기 끝(=첫 프레임) rest 로 마감 → seamless
    if (tEnd < P) {
      posK.push(kf(P, [x, cy], LINEAR))
      pushShape(P, REST, LINEAR)
    }

    const grp = group(
      // ★ ellipse + scale 가 아니라 rounded rect(rc) + size keyframe → 캡슐 유지
      [rect({ size: anim(sizeK, 2), roundness: anim(radK, 4) }), fill(shades[i], p.color.opacity)],
      transform({
        p: anim(posK, 2),
        o: val(p.color.opacity, 11),
      }),
      `dot-${i}`,
    )
    layers.push(shapeLayer({ name: `dot-${i}`, shapes: [grp], ip: 0, op: P }))
  }

  return root({ name: 'loader-3dot', w: W, h: H, op: P, layers })
}
