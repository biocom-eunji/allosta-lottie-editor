import source from '../sources/coin-flip.json'
import { applySpeed, loadDoc } from './confettiSource'
import type { Params } from '../controls'
import type { LottieJSON } from '../types'

// coin-flip — 동전이 뒤집히며 반짝이는 리워드 Lottie (소스 기반).
// ★ RN 안전화: 3D Y회전을 시각 동일하게 2D scaleX 로 베이크.
//   평평한(z=0) 레이어의 Y축 회전은 화면상 가로폭이 cos(ry) 로 변하는 것과 수학적으로 동일하므로
//   ddd/ry 를 제거하고 scaleX = baseScaleX * cos(ry) 로 변환 → 픽셀 단위 동일, RN 호환.
//   (매트 tt/td 는 lottie-react-native 네이티브에서 지원되어 그대로 둠)

const SRC_FR = 60

export interface CoinFlipParams extends Params {
  speed: number // 50~200 (%)
}

export const coinFlipDefaults: CoinFlipParams = {
  speed: 100,
}

const num = (v: number | number[]) => (Array.isArray(v) ? v[0] : v)
const cubic = (t: number, c1: number, c2: number) => 3 * (1 - t) ** 2 * t * c1 + 3 * (1 - t) * t ** 2 * c2 + t ** 3
function solveX(x: number, c1: number, c2: number): number {
  let lo = 0
  let hi = 1
  for (let i = 0; i < 24; i++) {
    const m = (lo + hi) / 2
    cubic(m, c1, c2) < x ? (lo = m) : (hi = m)
  }
  return (lo + hi) / 2
}

/** 애니메이션 스칼라 prop 을 프레임 t 에서 베지어 이징까지 반영해 샘플 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sampleScalar(kfs: any[], t: number): number {
  if (t <= kfs[0].t) return kfs[0].s[0]
  const last = kfs[kfs.length - 1]
  if (t >= last.t) return last.s[0]
  for (let i = 0; i < kfs.length - 1; i++) {
    const a = kfs[i]
    const b = kfs[i + 1]
    if (t >= a.t && t <= b.t) {
      if (a.h === 1) return a.s[0]
      const u = (t - a.t) / (b.t - a.t || 1)
      const s = solveX(u, num(a.o.x), num(a.i.x))
      const y = cubic(s, num(a.o.y), num(a.i.y))
      return a.s[0] + (b.s[0] - a.s[0]) * y
    }
  }
  return last.s[0]
}

/** 3D Y회전 → 2D scaleX 베이크 (시각 동일), 모든 ddd/ry/rx/or 제거 */
function flatten3DFlip(doc: LottieJSON) {
  const op = Math.round(doc.op)
  for (const layer of doc.layers) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const k = layer.ks as any
    if (layer.ddd !== 1 || !k) continue

    const ry = k.ry
    if (ry && ry.a === 1) {
      // baseScale (정적 가정) → scaleX = base * cos(ry)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sk = k.s as any
      const baseSX = Array.isArray(sk.k) ? sk.k[0] : 100
      const baseSY = Array.isArray(sk.k) ? sk.k[1] : 100
      // ry 가 변하는 마지막 프레임까지 매 프레임 샘플(이후는 정적)
      const lastRy = ry.k[ry.k.length - 1].t
      const end = Math.min(op, Math.max(lastRy, 1))
      const keys = []
      for (let f = 0; f <= end; f++) {
        const deg = sampleScalar(ry.k, f)
        const sx = baseSX * Math.cos((deg * Math.PI) / 180)
        keys.push({ t: f, s: [sx, baseSY], o: { x: [0.5], y: [0.5] }, i: { x: [0.5], y: [0.5] } })
      }
      k.s = { a: 1, k: keys, ix: 6 }
    }

    // 3D 속성 제거 → 2D
    layer.ddd = 0
    if (k.rz) k.r = k.rz // 2D 회전으로 이관 (정적 0)
    delete k.ry
    delete k.rx
    delete k.rz
    delete k.or
  }
}

export function generateCoinFlip(p: CoinFlipParams): LottieJSON {
  const doc = loadDoc(source)
  flatten3DFlip(doc)
  applySpeed(doc, SRC_FR, p.speed)
  return doc
}
