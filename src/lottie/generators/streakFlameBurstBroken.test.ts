import { describe, expect, it } from 'vitest'
import { generateStreakBroken, streakBrokenDefaults } from './streakBroken'
import { lintForRN } from '../validate'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function gradients(node: any, acc: any[] = []): any[] {
  if (Array.isArray(node)) node.forEach((n) => gradients(n, acc))
  else if (node && typeof node === 'object') {
    if ((node.ty === 'gf' || node.ty === 'gs') && node.g?.k) acc.push(node)
    for (const k of Object.keys(node)) gradients(node[k], acc)
  }
  return acc
}

describe('streak-broken (fire.json 기반)', () => {
  const json = generateStreakBroken(streakBrokenDefaults)

  it('fire.json 소스 사용', () => {
    expect(json.assets.length).toBe(1)
    expect(json.layers.some((l) => l.ty === 0)).toBe(true)
  })

  it('불꽃이 끝에서 투명해짐 (페이드 아웃)', () => {
    const precomp = json.layers.find((l) => l.ty === 0)!
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const o = precomp.ks.o as any
    expect(o.a).toBe(1)
    expect(o.k[o.k.length - 1].s[0]).toBe(0)
  })

  it('축소 애니메이션 (끝이 시작보다 작음)', () => {
    const precomp = json.layers.find((l) => l.ty === 0)!
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = precomp.ks.s as any
    expect(s.k[0].s[0]).toBeGreaterThan(s.k[s.k.length - 1].s[0])
  })

  it('★ desaturate — 그라디언트가 애니메이션화되고 끝 색이 회색', () => {
    const gs = gradients(json.assets[0].layers).filter((g) => g.g.k.a === 1)
    expect(gs.length).toBeGreaterThan(0)
    // 임의 그라디언트의 마지막 키프레임 첫 스톱 rgb 가 회색(r≈g≈b)
    const last = gs[0].g.k.k[gs[0].g.k.k.length - 1].s
    const [r, g, b] = [last[1], last[2], last[3]]
    expect(Math.abs(r - g)).toBeLessThan(0.02)
    expect(Math.abs(g - b)).toBeLessThan(0.02)
  })

  it('연기 퍼프 레이어 존재', () => {
    expect(json.layers.filter((l) => (l.nm ?? '').startsWith('smoke-')).length).toBe(3)
  })

  it('RN lint 통과', () => expect(lintForRN(json).warnings).toEqual([]))
})
