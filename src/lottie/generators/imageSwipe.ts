import source from '../sources/image-swipe.json'
import { applySpeed, loadDoc } from './confettiSource'
import type { Params } from '../controls'
import type { LottieJSON } from '../types'

// image-swipe — 손으로 스와이프하는 제스처 Lottie (소스 기반). 속도만 override.
// 소스: LottieFiles hand-swipe (expression/effect 없음, 이미지 base64 임베드 → RN 호환).

const SRC_FR = 30

export interface ImageSwipeParams extends Params {
  speed: number // 50~200 (%)
}

export const imageSwipeDefaults: ImageSwipeParams = {
  speed: 100,
}

export function generateImageSwipe(p: ImageSwipeParams): LottieJSON {
  const doc = loadDoc(source)
  applySpeed(doc, SRC_FR, p.speed)
  return doc
}
