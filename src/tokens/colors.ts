import type { RGB } from '../lottie/types'
import systemTokens from './system-tokens.gen.json'

/**
 * 디자인 시스템 컬러 토큰 (단일 출처).
 * src/tokens/system-tokens.json(Figma export, 깨진 JSON) →
 * scripts/normalize-tokens.mjs 가 정규화한 system-tokens.gen.json 을 그대로 사용.
 * 앱은 이 SYSTEM_TOKENS 만 참조한다 (하드코딩 색 목록 금지).
 */
export interface TokenColor {
  collection: string // Mono | WHBK | Brand | Semantic | Accent
  name: string // 원본 토큰 키 ("Mint-400")
  label: string // 표시명 ("Mint 400")
  family: string // 패밀리 그룹 ("Mint")
  hex: string // "#22C3BC"
  alpha: number // 0~1
  scopes: string[]
}

export const SYSTEM_TOKENS: TokenColor[] = systemTokens as TokenColor[]

/** 컬렉션 목록 (등장 순서 유지) */
export const TOKEN_COLLECTIONS: string[] = SYSTEM_TOKENS.reduce<string[]>((acc, t) => {
  if (!acc.includes(t.collection)) acc.push(t.collection)
  return acc
}, [])

/** 'Collection/Name' → hex 조회 맵 (단일 출처) */
const TOKEN_BY_ID = new Map<string, string>(SYSTEM_TOKENS.map((t) => [`${t.collection}/${t.name}`, t.hex]))

/**
 * ★ 토큰 id('Collection/Name', 예 'Brand/Mint-400')로 hex 를 resolve.
 * 코드에서는 이 함수로 토큰을 "참조"하고, 생성 시점에 concrete hex 로 baked 되어 Lottie JSON 에 들어간다.
 * (RN 은 토큰명을 못 읽으므로 출력 JSON 엔 실제 hex 필요)
 */
export function getToken(id: string): string {
  const hex = TOKEN_BY_ID.get(id)
  if (!hex) throw new Error(`getToken: 알 수 없는 토큰 id "${id}"`)
  return hex
}

/*
 * ── 하드코딩 hex → 토큰 매핑표 (generator/defaults 교체 기준) ──
 * 동일 토큰이 없으면 최근접 토큰으로 매핑(디자인 시스템 팔레트에 스냅).
 *   #22C3BC  Brand/Mint-400      (BRAND_HEX)
 *   #1BA39D  Brand/Mint-500      (brand hover, UI)
 *   #7FE6DF  Brand/Mint-200      (loader/progress 그라디언트 끝)
 *   #6FE6D2  Brand/Mint-300      (square-confetti A)
 *   #6CC9DE  Accent/Cyan-200     (square-confetti B)
 *   #79B6CE  Accent/Light Blue-200 (square-confetti C)
 *   #23E5DB  Accent/Cyan-300     (image-scan 스캔색)
 *   #FDE047  Semantic/Yellow-200 (confetti/streak 강조 노랑)
 *   #FFEA77  Semantic/Yellow-200 (flame core)
 *   #FB7185  Semantic/Red-300    (confetti C)
 *   #EF4444  Semantic/Red-400    (push badge)
 *   #F44336  Semantic/Red-400    (flame stop0)
 *   #FB923C  Semantic/Orange-300 (flame/streak 오렌지)
 *   #FB7A21  Semantic/Orange-400 (flame stop mid)
 *   #FF8D1A  Semantic/Orange-300 (flame stop end)
 *   #111827  Mono/Neutral-900    (텍스트/폰목업 다크)
 *   #374151  Mono/Neutral-700    (streak 미완료)
 *   #6B7280  Mono/Neutral-500    (push 내용)
 *   #9CA3AF  Mono/Neutral-300    (streak-broken 재)
 *   #F3F4F6  Mono/Neutral-50     (폰목업 스크린)
 *   #FFFFFF  WHBK/WH             (흰색)
 *   #000000  WHBK/BK             (gradient fallback)
 */

/**
 * ★ 브랜드 키컬러 단일 소스 — 디자인 토큰 Brand/Mint-400 참조.
 * 토큰을 바꾸면 generator 기본값 + UI(Tailwind `brand` 유틸)가 모두 따라간다.
 */
export const BRAND_HEX = getToken('Brand/Mint-400')
/** 브랜드 hover(약간 어두운 민트) — 토큰 Brand/Mint-500 */
export const BRAND_HEX_HOVER = getToken('Brand/Mint-500')

/**
 * BRAND_HEX 를 CSS 변수(--color-brand / --color-brand-hover)에 주입.
 * Tailwind v4 의 `bg-brand` 등은 var(--color-brand) 를 참조하므로 이 한 번의 호출로 전 UI에 반영.
 * 앱 부트스트랩(main.tsx)에서 1회 호출.
 */
export function applyBrandTheme(): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.style.setProperty('--color-brand', BRAND_HEX)
  root.style.setProperty('--color-brand-hover', BRAND_HEX_HOVER)
}

/** hex 로 토큰 찾기 (라벨 표시용) */
export function findTokenByHex(hex: string): TokenColor | undefined {
  const h = hex.toLowerCase()
  return SYSTEM_TOKENS.find((t) => t.hex.toLowerCase() === h)
}

/** 원본 name 또는 표시 label 로 토큰 찾기 */
export function findTokenByName(name: string): TokenColor | undefined {
  return SYSTEM_TOKENS.find((t) => t.name === name || t.label === name)
}

/** 색 값의 표시 라벨: 토큰명 우선 → hex 매칭 토큰 → raw hex */
export function colorLabel(hex: string, tokenName?: string): string {
  if (tokenName) {
    const t = findTokenByName(tokenName)
    if (t) return t.label
  }
  return findTokenByHex(hex)?.label ?? hex.toUpperCase()
}

/** "#RRGGBB" 또는 "#RGB" -> [r,g,b] (0~1) */
export function hexToRgb(hex: string): RGB {
  let h = hex.replace('#', '').trim()
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('')
  }
  const num = parseInt(h, 16)
  if (Number.isNaN(num) || h.length !== 6) return [0, 0, 0]
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return [r / 255, g / 255, b / 255]
}

/** [r,g,b] (0~1) -> "#RRGGBB" */
export function rgbToHex(rgb: RGB): string {
  const to = (v: number) =>
    Math.round(Math.max(0, Math.min(1, v)) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${to(rgb[0])}${to(rgb[1])}${to(rgb[2])}`
}

/** "#RRGGBB" -> [h(0~360), s(0~100), l(0~100)] */
export function hexToHsl(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  let h = 0
  let s = 0
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      default:
        h = (r - g) / d + 4
    }
    h /= 6
  }
  return [h * 360, s * 100, l * 100]
}

/** [h(0~360), s(0~100), l(0~100)] -> "#RRGGBB" */
export function hslToHex(h: number, s: number, l: number): string {
  const hh = (((h % 360) + 360) % 360) / 360
  const ss = Math.max(0, Math.min(100, s)) / 100
  const ll = Math.max(0, Math.min(100, l)) / 100
  if (ss === 0) return rgbToHex([ll, ll, ll])
  const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss
  const p = 2 * ll - q
  const hue = (t: number) => {
    const tt = (t % 1 + 1) % 1
    if (tt < 1 / 6) return p + (q - p) * 6 * tt
    if (tt < 1 / 2) return q
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6
    return p
  }
  return rgbToHex([hue(hh + 1 / 3), hue(hh), hue(hh - 1 / 3)])
}

/** HSL lightness 를 deltaPct 만큼 가감해 셰이드 파생 (+밝게 / -어둡게) */
export function shiftLightness(hex: string, deltaPct: number): string {
  const [h, s, l] = hexToHsl(hex)
  return hslToHex(h, s, l + deltaPct)
}

export interface GradientStop {
  /** 0~1 위치 (= Lottie gradient 스톱 offset / "면적·퍼짐") */
  pos: number
  hex: string
  /** 2D 캔버스 핸들 위치(0~1). UI 전용 — Lottie 출력(g.k)에는 미사용 */
  x?: number
  y?: number
}

/**
 * 그라디언트 스톱 배열 -> Lottie gradient k 배열
 * 형식: [pos, r, g, b, pos, r, g, b, ...]
 */
export function gradientStopsToLottie(stops: GradientStop[]): number[] {
  const sorted = [...stops].sort((a, b) => a.pos - b.pos)
  const out: number[] = []
  for (const s of sorted) {
    const [r, g, b] = hexToRgb(s.hex)
    out.push(s.pos, r, g, b)
  }
  return out
}
