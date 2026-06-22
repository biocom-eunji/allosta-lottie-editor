import source from '../sources/coin-flip.json'
import { applySpeed, loadDoc } from './confettiSource'
import type { Params } from '../controls'
import type { LottieJSON } from '../types'

// coin-flip — 동전이 뒤집히며 반짝이는 리워드 Lottie (소스 기반). 속도만 override.
// 소스: LottieFiles "coin" (gradient fill + 트랙 매트 + 3D Y회전).
// ⚠️ 웹(lottie-web)에선 3D 플립 정상. RN(lottie-react-native)은 3D Y회전이 평면으로 보일 수 있음.

const SRC_FR = 60

export interface CoinFlipParams extends Params {
  speed: number // 50~200 (%)
}

export const coinFlipDefaults: CoinFlipParams = {
  speed: 100,
}

export function generateCoinFlip(p: CoinFlipParams): LottieJSON {
  const doc = loadDoc(source)
  applySpeed(doc, SRC_FR, p.speed)
  return doc
}
