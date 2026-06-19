import { root } from '../builders'
import { BRAND_HEX, getToken } from '../../tokens/colors'
import source from '../sources/confetti-star-burst.json'
import type { ColorValue, Params } from '../controls'
import type { LottieJSON } from '../types'
import { applySpeed, loadDoc, recolorByPalette, setLayerDensity, wrapInScaledPrecomp } from './confettiSource'

// 소스 상수 (confetti-star-burst.json — Flex Confetti)
const SRC_FR = 60
const STAR_REF = 300 // size=STAR_REF → scale 100%
const ROOT_LAYERS = 30 // 소스 루트 파티클 레이어 수

// 밀도 단계 → 표시 파티클 수
const DENSITY: Record<string, number> = {
  low: 10,
  medium: 20,
  high: ROOT_LAYERS,
}

export interface ConfettiStarBurstParams extends Params {
  editColors: boolean // 컬러 편집 토글 (off = 원본 유지)
  colorA: ColorValue
  colorB: ColorValue
  colorC: ColorValue
  size: number // px (루트 scale)
  speed: number // 50~200 (%)
  density: string // 'low' | 'medium' | 'high'
}

export const confettiStarBurstDefaults: ConfettiStarBurstParams = {
  editColors: false,
  colorA: { mode: 'solid', hex: BRAND_HEX, opacity: 100 },
  colorB: { mode: 'solid', hex: getToken('Semantic/Yellow-200'), opacity: 100 },
  colorC: { mode: 'solid', hex: getToken('Semantic/Red-300'), opacity: 100 },
  size: STAR_REF,
  speed: 100,
  density: 'high',
}

export function generateConfettiStarBurst(p: ConfettiStarBurstParams): LottieJSON {
  const doc = loadDoc(source)

  // 1) 밀도 (show/hide)
  setLayerDensity(doc, DENSITY[p.density] ?? DENSITY.high)

  // 2) 색상 — 컬러 편집 시에만 팔레트 재배정 (off 면 원본 다색 유지)
  if (p.editColors) {
    recolorByPalette(doc, [p.colorA.hex, p.colorB.hex, p.colorC.hex])
  }

  // 3) 속도 (재생속도)
  applySpeed(doc, SRC_FR, p.speed)

  // 4) 크기 (루트 scale) + precomp 래핑
  const { layers, assets } = wrapInScaledPrecomp(doc, {
    compId: 'cf_star_main',
    name: 'star-burst',
    size: p.size,
    ref: STAR_REF,
  })

  return root({
    name: 'confetti-star-burst',
    w: doc.w,
    h: doc.h,
    fr: doc.fr,
    op: Math.round(doc.op),
    ip: 0,
    layers,
    assets,
  })
}
