import { val } from '../builders'
import { hexToRgb } from '../../tokens/colors'
import type { Asset, Layer, LottieJSON, ShapeItem } from '../types'

// ─────────────────────────────────────────────────────────────
// 소스 기반 컨페티 공통 헬퍼 (Fire.json 패턴)
// 소스 Lottie 를 베이스로 로드 → 단색 fill 색 치환 / 루트 scale / 재생속도 / 밀도(show-hide)
// 손제작 파티클 로직 없음. 모든 변형은 소스 한계 내 override.
// ─────────────────────────────────────────────────────────────

type RGB = [number, number, number]

/** 소스 문서 깊은 복제 */
export function loadDoc(source: unknown): LottieJSON {
  return structuredClone(source as LottieJSON)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function walkSolidFills(items: ShapeItem[], cb: (f: any) => void) {
  for (const it of items) {
    if (it.ty === 'gr' && Array.isArray(it.it)) walkSolidFills(it.it, cb)
    // 단색 fill 만 (정적 c). 그라디언트(gf/gs)는 소스에 없음.
    else if (it.ty === 'fl' && it.c && it.c.a === 0) cb(it)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function eachFillInDoc(doc: LottieJSON, cb: (f: any) => void) {
  const visit = (layers: Layer[]) => {
    for (const l of layers) if (l.shapes) walkSolidFills(l.shapes, cb)
  }
  visit(doc.layers)
  for (const a of doc.assets) if (Array.isArray(a.layers)) visit(a.layers as Layer[])
}

const rgbKey = (k: number[]) =>
  k
    .slice(0, 3)
    .map((x) => Math.round(x * 255))
    .join(',')

/** 소스에 등장하는 단색 색상을 첫 등장 순서대로 수집 (다색 보존용) */
export function collectSourceColors(doc: LottieJSON): string[] {
  const order: string[] = []
  eachFillInDoc(doc, (f) => {
    const key = rgbKey(f.c.k)
    if (!order.includes(key)) order.push(key)
  })
  return order
}

/**
 * 단색 fill 들을 팔레트로 재배정.
 * 소스의 고유 색상 N개를 등장 순서대로 palette[i % palette.length] 에 매핑 →
 * 원본의 다색 분포를 유지한 채 색만 교체. (소스가 단색 fill 이므로 fill 색 치환으로 처리)
 */
export function recolorByPalette(doc: LottieJSON, paletteHex: string[]) {
  if (!paletteHex.length) return
  const order = collectSourceColors(doc)
  const map = new Map<string, RGB>()
  order.forEach((key, i) => map.set(key, hexToRgb(paletteHex[i % paletteHex.length]) as RGB))
  eachFillInDoc(doc, (f) => {
    const rgb = map.get(rgbKey(f.c.k))
    if (rgb) f.c.k = [rgb[0], rgb[1], rgb[2], f.c.k[3] ?? 1]
  })
}

/** total 개 중 keep 개를 균등 간격으로 선택 (밀도 단계용 — 종류 다양성 보존) */
export function pickEven(total: number, keep: number): number[] {
  const n = Math.max(0, Math.min(total, Math.round(keep)))
  if (n >= total) return Array.from({ length: total }, (_, i) => i)
  if (n <= 1) return n === 1 ? [Math.floor(total / 2)] : []
  const out = new Set<number>()
  for (let i = 0; i < n; i++) out.add(Math.round((i * (total - 1)) / (n - 1)))
  return [...out].sort((a, b) => a - b)
}

/** 밀도 조절: 루트 파티클 레이어 중 keep 개만 show (나머지 hide=제거) */
export function setLayerDensity(doc: LottieJSON, keep: number) {
  const idx = new Set(pickEven(doc.layers.length, keep))
  doc.layers = doc.layers.filter((_, i) => idx.has(i))
}

/** 재생속도(%) → 문서 fr 스케일 (키프레임 보존, retime). speed 200% = 2배속 */
export function applySpeed(doc: LottieJSON, baseFr: number, speedPct: number) {
  const s = Math.max(25, Math.min(400, speedPct))
  doc.fr = (baseFr * s) / 100
}

/**
 * 소스의 루트 레이어 전체를 precomp 로 감싸고 단일 루트 레이어로 scale 적용.
 * (Fire 의 precomp+scale 패턴 — 전체 컴포지션을 중심 기준 균등 스케일)
 * size/ref*100 = scale%. 반환값을 root() 의 layers/assets 로 사용.
 */
export function wrapInScaledPrecomp(
  doc: LottieJSON,
  opts: { compId: string; name: string; size: number; ref: number },
): { layers: Layer[]; assets: Asset[] } {
  const scl = (opts.size / opts.ref) * 100
  const op = Math.round(doc.op)
  const innerAsset: Asset = { id: opts.compId, nm: opts.name, layers: doc.layers }
  const rootLayer: Layer = {
    ddd: 0,
    ind: 1,
    ty: 0,
    nm: opts.name,
    refId: opts.compId,
    sr: 1,
    ks: {
      a: val([doc.w / 2, doc.h / 2, 0], 1),
      p: val([doc.w / 2, doc.h / 2, 0], 2),
      s: val([scl, scl, 100], 6),
      r: val(0, 10),
      o: val(100, 11),
    },
    ao: 0,
    w: doc.w,
    h: doc.h,
    ip: 0,
    op,
    st: 0,
    bm: 0,
  }
  return { layers: [rootLayer], assets: [...doc.assets, innerAsset] }
}
