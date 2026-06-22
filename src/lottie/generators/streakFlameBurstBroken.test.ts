import { describe, expect, it } from 'vitest'
import { generateStreakBroken, streakBrokenDefaults } from './streakBroken'
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

describe('streak-broken (SVG 불꽃 형태)', () => {
  const json = generateStreakBroken(streakBrokenDefaults)

  it('유효한 루트 + 불꽃 path', () => {
    expect(json.v).toMatch(/^5\./)
    expect(json.op).toBeGreaterThan(0)
    expect(findGroup(json, 'outer')[0].it.some((i: { ty: string }) => i.ty === 'sh')).toBe(true)
  })

  it('불꽃이 끝에서 투명해짐 (페이드 아웃)', () => {
    const flame = findGroup(json, 'flame')[0]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tr = flame.it.find((i: any) => i.ty === 'tr')
    expect(tr.o.k[tr.o.k.length - 1].s[0]).toBe(0)
  })

  it('축소 애니메이션 (끝이 시작보다 작음)', () => {
    const flame = findGroup(json, 'flame')[0]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = flame.it.find((i: any) => i.ty === 'tr').s
    expect(s.k[0].s[0]).toBeGreaterThan(s.k[s.k.length - 1].s[0])
  })

  it('★ desaturate — 외곽 fill 색이 회색(r≈g≈b)으로 끝남', () => {
    const outer = findGroup(json, 'outer')[0]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fl = outer.it.find((i: any) => i.ty === 'fl')
    expect(fl.c.a).toBe(1)
    const last = fl.c.k[fl.c.k.length - 1].s
    expect(Math.abs(last[0] - last[1])).toBeLessThan(0.05)
    expect(Math.abs(last[1] - last[2])).toBeLessThan(0.05)
  })

  it('연기 퍼프 레이어 존재', () => {
    expect(json.layers.filter((l) => (l.nm ?? '').startsWith('smoke-')).length).toBe(3)
  })

  it('RN lint 통과', () => expect(lintForRN(json).warnings).toEqual([]))
})
