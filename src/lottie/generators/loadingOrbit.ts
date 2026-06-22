import source from '../sources/loading-orbit.json'
import { applySpeed, loadDoc } from './confettiSource'
import type { Params } from '../controls'
import type { LottieJSON } from '../types'

// loading-orbit — 꽃잎(다이아) 패널이 구(球)를 이루며 회전하는 로딩 (소스 기반).
// ★ 색상 처리: 원본은 ADBE Tint(블랙→틸, 화이트→퍼플) 이펙트로 그라디언트를 물들였는데,
//   lottie-web/RN 은 Tint 이펙트를 렌더하지 않으므로 색을 그라디언트 스톱에 베이크하고 ef 를 모두 제거함.
// ※ 본 로티는 진짜 3D 회전(ddd/rx/ry/rz/or)+루마 매트로 구성됨 → 웹 에디터(lottie-web)에서는
//   정상 렌더되지만 lottie-react-native 에서는 3D 가 지원되지 않아 충실히 재현되지 않음(웹 프리뷰용).

const SRC_FR = 30

export interface LoadingOrbitParams extends Params {
  speed: number // 50~200 (%)
}

export const loadingOrbitDefaults: LoadingOrbitParams = {
  speed: 100,
}

export function generateLoadingOrbit(p: LoadingOrbitParams): LottieJSON {
  const doc = loadDoc(source)
  applySpeed(doc, SRC_FR, p.speed)
  return doc
}
