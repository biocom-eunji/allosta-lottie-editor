import { describe, expect, it } from 'vitest'
import { generateSquareConfetti, squareConfettiDefaults } from './squareConfetti'
import { lintForRN } from '../validate'
import { hexToHsl, rgbToHex } from '../../tokens/colors'
import type { ImageValue } from '../controls'

// 파티클 레이어의 그라디언트(gf) 스톱 rgb 목록 추출 [[r,g,b],...] (0~1)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function gradientStops(layer: any): number[][] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gf = layer.shapes[0].it.find((x: any) => x.ty === 'gf')
  const k: number[] = gf.g.k.k // [pos,r,g,b, pos,r,g,b, ...]
  const out: number[][] = []
  for (let i = 0; i < k.length; i += 4) out.push([k[i + 1], k[i + 2], k[i + 3]])
  return out
}
const hueOf = (rgb: number[]) => hexToHsl(rgbToHex(rgb as [number, number, number]))[0]

const tinyPng: ImageValue = {
  dataUri:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  w: 1,
  h: 1,
}

describe('generateSquareConfetti (중앙 방사형 버스트)', () => {
  const json = generateSquareConfetti(squareConfettiDefaults)

  it('one-shot 루트 (60fps, ~90f)', () => {
    expect(json.fr).toBe(60)
    expect(json.op).toBe(90)
    expect(json.w).toBe(300)
    expect(json.h).toBe(300)
  })

  it('파티클 수 + 중앙 버스트 링 레이어', () => {
    // 링 1 + 파티클 count
    expect(json.layers.length).toBe(squareConfettiDefaults.count + 1)
    expect(json.layers[0].nm).toBe('burst-ring')
  })

  it('파티클은 그라디언트(gf) 라운드 사각형', () => {
    const raw = JSON.stringify(json.layers.slice(1))
    expect(raw).toMatch(/"ty"\s*:\s*"gf"/) // 그라디언트 fill
    expect(raw).toMatch(/"ty"\s*:\s*"rc"/) // 라운드 사각형
  })

  it('★ 단색+모노 그라디언트 — 한 파티클에 한 hue만 (다색 섞임 없음)', () => {
    const j = generateSquareConfetti({
      ...squareConfettiDefaults,
      colorA: { mode: 'solid', hex: '#ff0000', opacity: 100 }, // hue 0
      colorB: { mode: 'solid', hex: '#00ff00', opacity: 100 }, // hue 120
      colorC: { mode: 'solid', hex: '#0000ff', opacity: 100 }, // hue 240
    })
    for (const layer of j.layers.slice(1)) {
      const stops = gradientStops(layer)
      expect(stops.length).toBe(2)
      // 두 스톱의 hue 차이가 작아야(같은 색 밝은 톤→기본 톤). 서로 다른 팔레트색 혼합 금지.
      const dh = Math.abs(hueOf(stops[0]) - hueOf(stops[1]))
      expect(Math.min(dh, 360 - dh)).toBeLessThan(15)
    }
  })

  it('3색이 파티클들에 고르게 분배 (A/B/C 모두 사용)', () => {
    const j = generateSquareConfetti({
      ...squareConfettiDefaults,
      colorA: { mode: 'solid', hex: '#ff0000', opacity: 100 },
      colorB: { mode: 'solid', hex: '#00ff00', opacity: 100 },
      colorC: { mode: 'solid', hex: '#0000ff', opacity: 100 },
    })
    // 각 파티클 기본 톤(스톱1) hue 를 0/120/240 으로 분류
    const baseHues = j.layers.slice(1).map((l) => Math.round(hueOf(gradientStops(l)[1]) / 120))
    expect(new Set(baseHues).size).toBe(3) // 세 색 모두 등장
  })

  it('크기 편차: 큰 것 2~3개 + 작은 것 다수', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const peaks = (json.layers.slice(1) as any[]).map((l) => l.shapes[0].it.find((x: any) => x.ty === 'tr').s.k[1].s[0])
    expect(Math.max(...peaks) - Math.min(...peaks)).toBeGreaterThan(40) // 충분한 편차
    const big = peaks.filter((p) => p > 120).length // 큰 것
    const small = peaks.filter((p) => p < 70).length // 작은 것
    expect(big).toBeGreaterThanOrEqual(1)
    expect(big).toBeLessThanOrEqual(3) // 큰 것은 2~3개(소수)
    expect(small).toBeGreaterThan(big) // 작은 것이 다수
  })

  it('★ seed 고정 → 동일 파라미터는 항상 동일 JSON (프리뷰=다운로드)', () => {
    const a = JSON.stringify(generateSquareConfetti(squareConfettiDefaults))
    const b = JSON.stringify(generateSquareConfetti(squareConfettiDefaults))
    expect(a).toBe(b)
  })

  it('중앙→방사 확산: 파티클이 중앙에서 시작해 바깥 타겟으로 이동', () => {
    // 첫 파티클 그룹 transform 의 position 키프레임
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const grp = (json.layers[1].shapes as any[])[0]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tr = grp.it.find((x: any) => x.ty === 'tr')
    const kf = tr.p.k
    expect(kf[0].s).toEqual([150, 150]) // 중앙 시작
    const last = kf[kf.length - 1].s
    const dist = Math.hypot(last[0] - 150, last[1] - 150)
    expect(dist).toBeGreaterThan(50) // 바깥으로 확산
  })

  it('scale 가 0에서 시작(팝) → opacity 가 0으로 끝(페이드아웃)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const grp = (json.layers[1].shapes as any[])[0]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tr = grp.it.find((x: any) => x.ty === 'tr')
    expect(tr.s.k[0].s).toEqual([0, 0]) // 팝 시작
    expect(tr.o.k[tr.o.k.length - 1].s).toEqual([0]) // 페이드아웃
  })

  it('파티클 크기 다양성 (큰 것/작은 것 혼재)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const peaks = (json.layers.slice(1) as any[]).map((l) => {
      const tr = l.shapes[0].it.find((x: any) => x.ty === 'tr')
      return tr.s.k[1].s[0] // 팝 정점 scale%
    })
    expect(new Set(peaks).size).toBeGreaterThan(1)
  })

  it('컬러 변경이 그라디언트 스톱에 반영 (빨강 계열 유지)', () => {
    const red = generateSquareConfetti({
      ...squareConfettiDefaults,
      colorA: { mode: 'solid', hex: '#FF0000', opacity: 100 },
      colorB: { mode: 'solid', hex: '#FF0000', opacity: 100 },
      colorC: { mode: 'solid', hex: '#FF0000', opacity: 100 },
    })
    expect(JSON.stringify(red.layers.slice(1))).not.toMatch(/"hex"/) // 정규화 rgb 임베드
    // 모든 스톱이 빨강 계열(같은 hue): r 채널 우세
    for (const layer of red.layers.slice(1)) {
      for (const [r, g, b] of gradientStops(layer)) {
        expect(r).toBeGreaterThan(g)
        expect(r).toBeGreaterThan(b)
      }
    }
  })

  it('★ 명도차 강화: 상단(밝음) > 하단(진함) 으로 또렷한 대비', () => {
    for (const layer of json.layers.slice(1)) {
      const [s0, s1] = gradientStops(layer)
      const l0 = hexToHsl(rgbToHex(s0 as [number, number, number]))[2]
      const l1 = hexToHsl(rgbToHex(s1 as [number, number, number]))[2]
      expect(l0).toBeGreaterThan(l1) // 위가 더 밝음
      expect(l0 - l1).toBeGreaterThan(20) // 평평하지 않게 충분한 명도차
    }
  })

  it('이미지 모드: base64 임베드 asset + 동일 버스트 모션', () => {
    const j = generateSquareConfetti({
      ...squareConfettiDefaults,
      mode: 'image',
      images: [tinyPng, null, null],
    })
    expect(j.assets.length).toBe(1)
    expect(j.assets[0].e).toBe(1) // 임베드
    expect(j.assets[0].p?.startsWith('data:')).toBe(true)
    // 이미지 레이어(ty:2) 존재
    expect(j.layers.some((l) => l.ty === 2)).toBe(true)
  })

  it('이미지 없는 이미지 모드 → 컬러 폴백', () => {
    const j = generateSquareConfetti({ ...squareConfettiDefaults, mode: 'image', images: [null, null, null] })
    expect(JSON.stringify(j)).toMatch(/"ty"\s*:\s*"gf"/)
  })

  it('RN lint 통과 (expression/외부참조 없음) — 컬러·이미지 모드', () => {
    expect(lintForRN(json).warnings).toEqual([])
    const img = generateSquareConfetti({ ...squareConfettiDefaults, mode: 'image', images: [tinyPng, null, null] })
    expect(lintForRN(img).warnings).toEqual([])
  })
})
