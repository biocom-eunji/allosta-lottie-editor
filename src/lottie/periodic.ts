import type { Keyframe } from './types'

/**
 * 주기 함수 f(u) (u: 0~1) 를 phase 만큼 어긋나게 샘플링해
 * [0, P] 구간의 seamless 루프 키프레임을 생성한다.
 *
 * t=0 과 t=P 의 값이 동일해지도록 마지막 샘플을 t=P 에 둔다.
 * (f(0)==f(1) 인 함수는 완전 seamless, 톱니형 함수는
 *  리셋 지점이 invisible 한 위치(opacity 0 등)에 오도록 설계한다.)
 *
 * @param P       전체 프레임 길이
 * @param phase   위상 오프셋 (0~1)
 * @param f       주기 함수: u(0~1) -> 값(스칼라 또는 배열)
 * @param samples 샘플 수 (많을수록 부드러움)
 */
export function periodicKeyframes(
  P: number,
  phase: number,
  f: (u: number) => number | number[],
  samples = 24,
): Keyframe[] {
  const out: Keyframe[] = []
  for (let j = 0; j <= samples; j++) {
    const u = j / samples
    const t = Math.round(u * P * 1000) / 1000
    const v = f((u + phase) % 1)
    out.push({
      t,
      s: Array.isArray(v) ? v : [v],
      o: { x: [0.5], y: [0.5] },
      i: { x: [0.5], y: [0.5] },
    })
  }
  return out
}

/** 선형 보간 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * 삼각형(bump) 펄스: u=0,1 에서 0, u=peakAt 에서 peak.
 * opacity 펄스 등에 사용 (양끝 0 -> seamless).
 */
export function bump(peak: number, peakAt = 0.3): (u: number) => number {
  return (u: number) => {
    if (u <= peakAt) return lerp(0, peak, u / peakAt)
    return lerp(peak, 0, (u - peakAt) / (1 - peakAt))
  }
}
