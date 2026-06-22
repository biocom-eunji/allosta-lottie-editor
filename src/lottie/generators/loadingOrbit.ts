import source from '../sources/loading-orbit.json'
import { applySpeed, loadDoc } from './confettiSource'
import type { Params } from '../controls'
import type { LottieJSON } from '../types'

// loading-orbit — 꽃잎(다이아) 패널이 구(球)를 이루며 회전하는 로딩 (소스 기반).
// ★ 색상: 원본 ADBE Tint(블랙→틸/화이트→퍼플)를 그라디언트 스톱에 베이크 후 ef 제거.
// ★ RN 안전화: 원본은 진짜 3D 회전(ddd/rx/ry/rz/or)+루마 매트였음. lottie-web 을 ground-truth 로
//   매 프레임 각 레이어의 최종 2D affine 을 추출해 path 코너점·그라디언트 점을 절대좌표로 베이크
//   (scripts/bake-orbit.mjs). → 레이어 변환 2D 항등, 3D 완전 제거. 웹 렌더 대비 정점오차 <0.01px.
//   원본 3D 는 loading-orbit.src3d.json 에 보존(재베이크용). 매트(tt/td)는 RN 네이티브 지원.

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
