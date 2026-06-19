import { root } from '../builders'
import { BRAND_HEX, getToken } from '../../tokens/colors'
import source from '../sources/confetti-rain.json'
import type { ColorValue, Params } from '../controls'
import type { LottieJSON } from '../types'
import { applySpeed, loadDoc, recolorByPalette, setLayerDensity, wrapInScaledPrecomp } from './confettiSource'

// 소스 상수 (confetti-rain.json — confettis2)
const SRC_FR = 30
const RAIN_REF = 300 // size=RAIN_REF → scale 100%
const INSTANCES = 10 // 소스 시차(stagger) 인스턴스 수

// 밀도 단계 → 표시 인스턴스 수 (10개 시차 인스턴스 show/hide)
const DENSITY: Record<string, number> = {
  low: 4,
  medium: 7,
  high: INSTANCES,
}

export interface ConfettiRainParams extends Params {
  editColors: boolean // 컬러 편집 토글 (off = 원본 유지)
  colorA: ColorValue
  colorB: ColorValue
  colorC: ColorValue
  size: number // px (루트 scale)
  speed: number // 50~200 (%)
  density: string // 'low' | 'medium' | 'high'
}

export const confettiRainDefaults: ConfettiRainParams = {
  editColors: true,
  colorA: { mode: 'solid', hex: BRAND_HEX, opacity: 100 },
  colorB: { mode: 'solid', hex: getToken('Semantic/Yellow-200'), opacity: 100 },
  colorC: { mode: 'solid', hex: getToken('Semantic/Red-300'), opacity: 100 },
  size: RAIN_REF,
  speed: 100,
  density: 'high',
}

export function generateConfettiRain(p: ConfettiRainParams): LottieJSON {
  const doc = loadDoc(source)

  // 1) 밀도 — 10개 시차 인스턴스 중 일부만 show (연속 낙하 유지하도록 균등 선택)
  setLayerDensity(doc, DENSITY[p.density] ?? DENSITY.high)

  // 2) 색상 — 컬러 편집 시에만 팔레트 재배정 (off 면 원본 다색 유지)
  if (p.editColors) {
    recolorByPalette(doc, [p.colorA.hex, p.colorB.hex, p.colorC.hex])
  }

  // 3) 속도 (재생속도)
  applySpeed(doc, SRC_FR, p.speed)

  // 4) 크기 (루트 scale) + precomp 래핑
  const { layers, assets } = wrapInScaledPrecomp(doc, {
    compId: 'cf_rain_main',
    name: 'rain',
    size: p.size,
    ref: RAIN_REF,
  })

  return root({
    name: 'confetti-rain',
    w: doc.w,
    h: doc.h,
    fr: doc.fr,
    op: Math.round(doc.op),
    ip: 0,
    layers,
    assets,
  })
}
