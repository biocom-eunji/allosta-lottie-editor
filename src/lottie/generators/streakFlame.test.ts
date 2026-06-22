import { describe, expect, it } from 'vitest'
import { generateStreakFlame, streakFlameDefaults } from './streakFlame'
import { lintForRN } from '../validate'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findGroup(node: any, nm: string, acc: any[] = []): any[] {
  if (Array.isArray(node)) node.forEach((n) => findGroup(n, nm, acc))
  else if (node && typeof node === 'object') {
    if (node.ty === 'gr' && node.nm === nm) acc.push(node)
    for (const k of Object.keys(node)) findGroup(node[k], nm, acc)
  }
  return acc
}

describe('generateStreakFlame (SVG 불꽃 형태)', () => {
  const json = generateStreakFlame(streakFlameDefaults)

  it('유효한 루트 + 불꽃/글로우 레이어', () => {
    expect(json.v).toMatch(/^5\./)
    expect(json.op).toBeGreaterThan(0)
    expect(json.layers.length).toBe(2)
    expect(json.layers.some((l) => l.nm === 'flame')).toBe(true)
    expect(json.layers.some((l) => l.nm === 'glow')).toBe(true)
  })

  it('외곽/내부 불꽃 path 존재 (sh)', () => {
    const outer = findGroup(json, 'outer')[0]
    const inner = findGroup(json, 'inner')[0]
    expect(outer.it.some((i: { ty: string }) => i.ty === 'sh')).toBe(true)
    expect(inner.it.some((i: { ty: string }) => i.ty === 'sh')).toBe(true)
  })

  it('flameColor(gradient) 가 외곽 fill 에 반영', () => {
    const outer = findGroup(json, 'outer')[0]
    expect(outer.it.some((i: { ty: string }) => i.ty === 'gf')).toBe(true)
  })

  it('coreColor override 가 내부 불꽃에 반영', () => {
    const j = generateStreakFlame({ ...streakFlameDefaults, coreColor: { mode: 'solid', hex: '#00FF00', opacity: 100 } })
    const inner = findGroup(j, 'inner')[0]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fl = inner.it.find((i: any) => i.ty === 'fl')
    expect(fl.c.k[1]).toBeGreaterThan(0.9) // green
  })

  it('크기/속도 반영', () => {
    const big = generateStreakFlame({ ...streakFlameDefaults, size: 220 })
    const small = generateStreakFlame({ ...streakFlameDefaults, size: 90 })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const peakScale = (j: any) => Math.max(...findGroup(j, 'flame')[0].it.find((i: any) => i.ty === 'tr').s.k.map((k: { s: number[] }) => k.s[0]))
    expect(peakScale(big)).toBeGreaterThan(peakScale(small))
    const slow = generateStreakFlame({ ...streakFlameDefaults, speed: 50 })
    const fast = generateStreakFlame({ ...streakFlameDefaults, speed: 200 })
    expect(slow.op).toBeGreaterThan(fast.op)
  })

  it('RN lint 통과 (expression/외부참조 없음)', () => {
    expect(lintForRN(json).warnings).toEqual([])
  })
})
