import { anim, ellipse, fill, gradientFill, group, imageLayer, keyframes, rect, resetInd, root, shapeLayer, transform, val } from '../builders'
import { getToken, shiftLightness } from '../../tokens/colors'
import type { ColorValue, ImageValue, Params } from '../controls'
import type { Layer, ShapeItem, Transform, LottieJSON } from '../types'
import { imagesToAssets } from './confettiCommon'
import { mulberry32, seededRange } from '../../lib/prng'

// ─────────────────────────────────────────────────────────────
// square-confetti — 중앙 방사형 버스트 (one-shot, ~90f/60fps)
// 모든 파티클이 중앙에서 팝 → 방사 확산 → 페이드아웃. 낙하 없음(파티팝).
// seed 기반 결정성: 프리뷰와 다운로드 JSON 이 항상 동일.
// ─────────────────────────────────────────────────────────────

const W = 300
const H = 300
const P = 90 // one-shot 길이(프레임)
const FR = 60
const CENTER: [number, number] = [W / 2, H / 2]
const BASE_RADIUS = 110 // 확산 기준 반경
const BASE_PX = 24 // 파티클 1.0배 기준 크기(px)
const SEED = 1337

export interface SquareConfettiParams extends Params {
  mode: string // 'color' | 'image'
  colorA: ColorValue
  colorB: ColorValue
  colorC: ColorValue
  count: number
  images: (ImageValue | null)[]
}

export const squareConfettiDefaults: SquareConfettiParams = {
  mode: 'color',
  // 민트/시안/스카이블루 파스텔 팔레트 (그라데이션 베이스 = 아래쪽 톤)
  colorA: { mode: 'solid', hex: getToken('Brand/Mint-300'), opacity: 100 }, // 민트/아쿠아
  colorB: { mode: 'solid', hex: getToken('Accent/Cyan-200'), opacity: 100 }, // 시안
  colorC: { mode: 'solid', hex: getToken('Accent/Light Blue-200'), opacity: 100 }, // 스카이블루
  count: 10,
  images: [null, null, null],
}

interface ParticleSpec {
  target: [number, number]
  full: number // 최종 scale(%) — sizeMul(이미지면 fit 포함) 반영
  rotEnd: number
  delay: number
}

/**
 * 크기 분위수 순열 (결정론적, 시드 운에 의존 X).
 * 균등 분위수 u 에 강한 지수 바이어스 → 작은 것 다수 + 큰 것 2~3개.
 * golden-ratio 저불일치 순열로 "큰 것"이 링에서 한쪽에 몰리지 않게 분산.
 */
function sizeMuls(count: number): number[] {
  const PHI = 0.6180339887
  const idx = Array.from({ length: count }, (_, i) => i)
  idx.sort((a, b) => (((a + 1) * PHI) % 1) - (((b + 1) * PHI) % 1))
  const out = new Array<number>(count)
  idx.forEach((i, rank) => {
    const u = (rank + 0.5) / count // 0..1 균등
    out[i] = 0.42 + 1.5 * Math.pow(u, 2.4) // 작은 쪽에 몰림(소수만 큼)
  })
  return out
}

/** 가장 큰 파티클 인덱스 */
function biggestIndex(muls: number[]): number {
  let bi = 0
  for (let i = 1; i < muls.length; i++) if (muls[i] > muls[bi]) bi = i
  return bi
}

/** 맨 아래 젤 큰 파티클을 살짝 오른쪽 위로 이동 (target 보정) */
function nudgeBiggest(spec: ParticleSpec, i: number, big: number): ParticleSpec {
  if (i !== big) return spec
  return { ...spec, target: [spec.target[0] + 18, spec.target[1] - 26] }
}

/** seed 기반 파티클 속성(각도/거리/회전/딜레이) 고정. 크기(full)는 외부에서 주입 */
function specFor(i: number, count: number, full: number): ParticleSpec {
  const rng = mulberry32(SEED + i * 101)
  // 느슨한 원형 링: 각도 균등 분할 + 큰 jitter, 반경도 넓게 변동
  const jitter = ((Math.PI * 2) / count) * 0.45
  const angle = (i / count) * Math.PI * 2 + seededRange(rng, -jitter, jitter)
  const r = BASE_RADIUS * seededRange(rng, 0.55, 1.05)
  const rotEnd = (rng() > 0.5 ? 1 : -1) * seededRange(rng, 60, 90)
  const delay = Math.round(seededRange(rng, 0, 8))
  return {
    target: [CENTER[0] + Math.cos(angle) * r, CENTER[1] + Math.sin(angle) * r],
    full,
    rotEnd,
    delay,
  }
}

/** 버스트 라이프사이클 트랜스폼: 중앙→방사(ease-out) / 팝 scale / 페이드 / 미세 회전 */
function burstTransform(s: ParticleSpec, anchor: [number, number]): Transform {
  const lo = s.delay
  const span = P - s.delay
  const f = (frac: number) => Math.round(lo + frac * span)
  const full = s.full
  return transform({
    a: val([anchor[0], anchor[1]], 1),
    p: anim(
      keyframes([
        { t: lo, s: [CENTER[0], CENTER[1]], ease: 'out' },
        { t: f(0.85), s: s.target, ease: 'out' },
        { t: P, s: s.target, ease: 'linear' },
      ]),
      2,
    ),
    s: anim(
      keyframes([
        { t: lo, s: [0, 0], ease: 'out' },
        { t: f(0.15), s: [full, full], ease: 'out' }, // 팝
        { t: f(0.8), s: [full, full], ease: 'linear' },
        { t: P, s: [full * 0.7, full * 0.7], ease: 'in' }, // 끝에서 축소
      ]),
      6,
    ),
    r: anim(
      keyframes([
        { t: lo, s: [0], ease: 'out' },
        { t: P, s: [s.rotEnd], ease: 'linear' },
      ]),
      10,
    ),
    o: anim(
      keyframes([
        { t: lo, s: [0], ease: 'out' },
        { t: f(0.12), s: [100], ease: 'linear' }, // 빠르게 등장
        { t: f(0.7), s: [100], ease: 'in' },
        { t: P, s: [0], ease: 'in' }, // 마지막 ~30% 페이드
      ]),
      11,
    ),
  })
}

/**
 * 단색 모노 그라디언트 라운드 사각형 파티클.
 * 한 파티클 = "한 색"만 사용 (다색 섞임 없음). 같은 hue 의 밝은 톤 → 기본 톤을 대각선으로.
 */
function monoSquareLayer(i: number, spec: ParticleSpec, hex: string): Layer {
  const w = BASE_PX
  const rad = w * 0.32
  const shapes: ShapeItem[] = [
    rect({ size: val([w, w], 2), roundness: val(rad, 4) }),
    gradientFill({
      stops: [
        { pos: 0, hex: shiftLightness(hex, 30) }, // 상단: 같은 hue 밝은 톤 (+30%)
        { pos: 1, hex: shiftLightness(hex, -9) }, // 하단: 살짝 더 진한 톤 (-9%)
      ],
      type: 1,
      start: [-w / 2, -w / 2],
      end: [w / 2, w / 2],
    }),
  ]
  return shapeLayer({
    name: `burst-${i}`,
    shapes: [group(shapes, burstTransform(spec, [0, 0]), `burst-${i}`)],
    ip: 0,
    op: P,
  })
}

/** 이미지 파티클 (동일 버스트 모션, 사각형 대신 이미지) */
function imageBurstLayer(i: number, spec: ParticleSpec, refId: string, imgW: number, imgH: number): Layer {
  return imageLayer({
    name: `burst-img-${i}`,
    refId,
    ks: burstTransform(spec, [imgW / 2, imgH / 2]),
    ip: 0,
    op: P,
  })
}

/** 중앙 버스트 링 (은은) — scale 0→1.4 확대 + opacity 0.25→0, 앞 ~25% */
function burstRingLayer(hex: string): Layer {
  const end = Math.round(P * 0.25)
  const ring = group(
    [ellipse({ size: val([130, 130], 2) }), fill(hex, 100)],
    transform({
      p: val([CENTER[0], CENTER[1]], 2),
      s: anim(
        keyframes([
          { t: 0, s: [0, 0], ease: 'out' },
          { t: end, s: [140, 140], ease: 'out' },
        ]),
        6,
      ),
      o: anim(
        keyframes([
          { t: 0, s: [25], ease: 'out' },
          { t: end, s: [0], ease: 'out' },
        ]),
        11,
      ),
    }),
    'burst-ring',
  )
  return shapeLayer({ name: 'burst-ring', shapes: [ring], ip: 0, op: P })
}

export function generateSquareConfetti(p: SquareConfettiParams): LottieJSON {
  resetInd() // 레이어 ind 카운터 초기화 → 호출마다 동일 JSON(결정성)
  const count = Math.max(1, Math.round(p.count))

  // 이미지 모드: 이미지가 하나라도 있으면 이미지 버스트
  if (p.mode === 'image') {
    const { assets, refIds } = imagesToAssets(p.images ?? [], 'square')
    if (refIds.length > 0) {
      const validImages = (p.images ?? []).filter(Boolean) as ImageValue[]
      const muls = sizeMuls(count)
      const big = biggestIndex(muls)
      const layers: Layer[] = [burstRingLayer(p.colorA.hex)]
      for (let i = 0; i < count; i++) {
        const idx = i % refIds.length
        const img = validImages[idx]
        const fitScale = (BASE_PX / Math.max(img.w, img.h)) * 100
        const spec = nudgeBiggest(specFor(i, count, fitScale * muls[i]), i, big)
        layers.push(imageBurstLayer(i, spec, refIds[idx], img.w, img.h))
      }
      return root({ name: 'square-confetti', w: W, h: H, fr: FR, op: P, layers, assets })
    }
    // 이미지 없으면 컬러 폴백
  }

  // 컬러 모드: 각 파티클에 A/B/C 중 한 색만 배정 (i%3 → 3색 고른 분배, seed 고정)
  const palette = [p.colorA.hex, p.colorB.hex, p.colorC.hex]
  const muls = sizeMuls(count)
  const big = biggestIndex(muls)
  const layers: Layer[] = [burstRingLayer(p.colorA.hex)]
  for (let i = 0; i < count; i++) {
    const spec = nudgeBiggest(specFor(i, count, 100 * muls[i]), i, big)
    layers.push(monoSquareLayer(i, spec, palette[i % palette.length]))
  }
  return root({ name: 'square-confetti', w: W, h: H, fr: FR, op: P, layers })
}
