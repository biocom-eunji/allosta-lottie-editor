import { describe, expect, it } from 'vitest'
import { generateConfettiStarBurst, confettiStarBurstDefaults } from './confettiStarBurst'
import { generateConfettiRain, confettiRainDefaults } from './confettiRain'
import { collectSourceColors, loadDoc } from './confettiSource'
import starSource from '../sources/confetti-star-burst.json'
import rainSource from '../sources/confetti-rain.json'
import { lintForRN } from '../validate'
import type { LottieJSON } from '../types'

// 문서 전체(루트 + assets comp)에서 단색 fill rgb(0~1) 수집
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function collectFillRgbs(node: any, acc: number[][] = []): number[][] {
  if (Array.isArray(node)) node.forEach((n) => collectFillRgbs(n, acc))
  else if (node && typeof node === 'object') {
    if (node.ty === 'fl' && node.c?.a === 0) acc.push(node.c.k.slice(0, 3))
    for (const k of Object.keys(node)) collectFillRgbs(node[k], acc)
  }
  return acc
}

const rootScale = (j: LottieJSON) => (j.layers[0].ks.s as { k: number[] }).k[0]

const presets = [
  { id: 'star-burst', gen: generateConfettiStarBurst, def: confettiStarBurstDefaults, src: starSource, fr: 60 },
  { id: 'rain', gen: generateConfettiRain, def: confettiRainDefaults, src: rainSource, fr: 30 },
] as const

describe.each(presets)('confetti source preset: $id', ({ gen, def, src, fr }) => {
  it('소스 기반 구조: 단일 루트 precomp + 원본 comp 보존', () => {
    const j = gen(def)
    expect(j.layers.length).toBe(1)
    expect(j.layers[0].ty).toBe(0) // precomp 래퍼
    // 원본 comp asset + 래퍼 comp asset 모두 존재
    const srcAssets = (src as LottieJSON).assets.length
    expect(j.assets.length).toBe(srcAssets + 1)
  })

  it('컬러 편집 off = 원본 색 유지', () => {
    const j = gen({ ...def, editColors: false })
    const before = collectSourceColors(loadDoc(src)).sort()
    const after = collectSourceColors(j).sort()
    expect(after).toEqual(before)
  })

  it('컬러 편집 on = 팔레트로 재배정 (다색 유지, 팔레트 색만 사용)', () => {
    const j = gen({
      ...def,
      editColors: true,
      colorA: { mode: 'solid', hex: '#FF0000', opacity: 100 },
      colorB: { mode: 'solid', hex: '#00FF00', opacity: 100 },
      colorC: { mode: 'solid', hex: '#0000FF', opacity: 100 },
    })
    const rgbs = collectFillRgbs(j.assets) // comp 내부 fill
    const uniq = new Set(rgbs.map((r) => r.map((x) => Math.round(x * 255)).join(',')))
    // 모든 색이 팔레트(빨/초/파) 안에만 존재
    for (const c of uniq) expect(['255,0,0', '0,255,0', '0,0,255']).toContain(c)
    // 다색 유지 (2색 이상)
    expect(uniq.size).toBeGreaterThanOrEqual(2)
  })

  it('크기 → 루트 scale 반영', () => {
    expect(rootScale(gen({ ...def, size: 450 }))).toBeGreaterThan(rootScale(gen({ ...def, size: 150 })))
  })

  it('속도 → fr 재생속도 반영', () => {
    const slow = gen({ ...def, speed: 50 })
    const fast = gen({ ...def, speed: 200 })
    expect(fast.fr).toBeGreaterThan(slow.fr)
    expect(gen({ ...def, speed: 100 }).fr).toBeCloseTo(fr)
  })

  it('밀도 단계 → 표시 파티클(인스턴스) 수 증가', () => {
    const count = (level: string) => {
      const j = gen({ ...def, density: level })
      // 래퍼 comp(마지막 asset)의 내부 레이어 수 = 표시 파티클 수
      const wrap = j.assets[j.assets.length - 1]
      return (wrap.layers ?? []).length
    }
    expect(count('low')).toBeLessThan(count('medium'))
    expect(count('medium')).toBeLessThan(count('high'))
  })

  it('RN lint 통과 (expression/외부참조 없음) — 컬러편집 on 포함', () => {
    expect(lintForRN(gen(def)).warnings).toEqual([])
    expect(lintForRN(gen({ ...def, editColors: true, density: 'low', size: 200, speed: 150 })).warnings).toEqual([])
  })
})

it('star-burst 는 one-shot, rain 은 loop 성격 (fr/op 합리적 범위)', () => {
  const star = generateConfettiStarBurst(confettiStarBurstDefaults)
  const rain = generateConfettiRain(confettiRainDefaults)
  expect(star.op).toBeGreaterThan(0)
  expect(rain.op).toBeGreaterThan(0)
  expect(star.fr).toBeCloseTo(60)
  expect(rain.fr).toBeCloseTo(30)
})
