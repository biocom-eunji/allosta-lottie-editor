import source from '../sources/space-ride.json'
import { applySpeed, loadDoc } from './confettiSource'
import type { Params } from '../controls'
import type { LottieJSON } from '../types'

// space-ride — 우주 비행 씬 (소스 기반). precomp 구성, 이펙트/expression/3D 없음 → RN 안전.

const SRC_FR = 31

export interface SpaceRideParams extends Params {
  speed: number // 50~200 (%)
}

export const spaceRideDefaults: SpaceRideParams = {
  speed: 100,
}

export function generateSpaceRide(p: SpaceRideParams): LottieJSON {
  const doc = loadDoc(source)
  applySpeed(doc, SRC_FR, p.speed)
  return doc
}
