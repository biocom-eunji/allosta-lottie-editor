import source from '../sources/rocket.json'
import { applySpeed, loadDoc } from './confettiSource'
import type { Params } from '../controls'
import type { LottieJSON } from '../types'

// rocket — 로켓 발사 씬 (소스 기반).
// ★ RN 안전화: loopOut('cycle') expression 을 키프레임 반복으로 베이크, 이펙트 제거 (scripts/bake-rocket.mjs).

const SRC_FR = 30

export interface RocketParams extends Params {
  speed: number // 50~200 (%)
}

export const rocketDefaults: RocketParams = {
  speed: 100,
}

export function generateRocket(p: RocketParams): LottieJSON {
  const doc = loadDoc(source)
  applySpeed(doc, SRC_FR, p.speed)
  return doc
}
