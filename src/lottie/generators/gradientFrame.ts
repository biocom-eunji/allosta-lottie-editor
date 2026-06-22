import source from '../sources/gradient.json'
import { applySpeed, loadDoc } from './confettiSource'
import type { Params } from '../controls'
import type { LottieJSON } from '../types'

// gradient — 코너 브래킷이 그려지며 회전 그라디언트 배경 + 별이 반짝이는 프레임 (소스 기반).
// 소스: 임베드 PNG + precomp. 이펙트(Drop Shadow/Gaussian Blur)는 null 레이어에만 있어 제거됨(RN 안전).

const SRC_FR = 30

export interface GradientFrameParams extends Params {
  speed: number // 50~200 (%)
}

export const gradientFrameDefaults: GradientFrameParams = {
  speed: 100,
}

export function generateGradientFrame(p: GradientFrameParams): LottieJSON {
  const doc = loadDoc(source)
  applySpeed(doc, SRC_FR, p.speed)
  return doc
}
