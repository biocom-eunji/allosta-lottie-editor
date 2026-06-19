import { describe, expect, it } from 'vitest'
import { generateStreakFlame, streakFlameDefaults } from './streakFlame'
import { lintForRN } from '../validate'

// 문서 전체(루트 layers + assets comp)에서 애니메이션 path(sh, a:1) 키프레임 수집
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function collectMorphPaths(node: any, acc: any[] = []): any[] {
  if (Array.isArray(node)) {
    node.forEach((n) => collectMorphPaths(n, acc))
  } else if (node && typeof node === 'object') {
    if (node.ty === 'sh' && node.ks?.a === 1) acc.push(node.ks.k)
    for (const k of Object.keys(node)) collectMorphPaths(node[k], acc)
  }
  return acc
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function compLayerNames(json: any): string[] {
  return (json.assets?.[0]?.layers ?? []).map((l: { nm?: string }) => (l.nm ?? '').trim())
}

describe('generateStreakFlame (fire.json 기반)', () => {
  const json = generateStreakFlame(streakFlameDefaults)

  it('fire.json 소스 구조 유지 (precomp + comp asset)', () => {
    expect(json.fr).toBe(24)
    expect(json.op).toBeGreaterThan(0)
    expect(json.assets.length).toBe(1)
    expect(json.layers[0].ty).toBe(0) // precomp
    expect(json.assets[0].layers.length).toBeGreaterThan(0)
  })

  it('★ 소스 path-morph 유지 + 각 path 키프레임 정점 수 일정 (RN 안전, 평탄화 금지)', () => {
    const morphs = collectMorphPaths(json)
    expect(morphs.length).toBeGreaterThan(0)
    for (const kf of morphs) {
      const counts = kf.map((k: { s: { v: number[][] }[] }) => k.s[0].v.length)
      expect(new Set(counts).size).toBe(1) // 한 path 내 모든 키프레임 정점 수 동일
    }
  })

  it('곁불꽃 개수 매핑 (Indv. Flame show/hide)', () => {
    const n0 = compLayerNames(generateStreakFlame({ ...streakFlameDefaults, sideFlames: 0 }))
    const n1 = compLayerNames(generateStreakFlame({ ...streakFlameDefaults, sideFlames: 1 }))
    const n2 = compLayerNames(generateStreakFlame({ ...streakFlameDefaults, sideFlames: 2 }))
    const cnt = (a: string[]) => a.filter((x) => x.startsWith('Indv. Flame')).length
    expect(cnt(n0)).toBe(0)
    expect(cnt(n1)).toBe(1)
    expect(cnt(n2)).toBe(2)
  })

  it('글로우는 radial gradient(gf, t:2) — blur 미사용', () => {
    const raw = JSON.stringify(json)
    expect(raw).not.toMatch(/"ty"\s*:\s*"bl"/)
    // 추가한 글로우 레이어에 radial(t:2) gf 존재
    const hasRadial = json.layers.some((l) =>
      JSON.stringify(l).includes('"nm":"glow"') && JSON.stringify(l).includes('"t":2'),
    )
    expect(hasRadial).toBe(true)
  })

  it('불꽃은 따뜻한 fire 컬러 유지 (민트 키컬러 미적용)', () => {
    // 메인 불꽃 본체 그라디언트에 민트(#22C3BC ≈ r0.13 g0.76 b0.74)가 없어야
    const raw = JSON.stringify(json.assets[0])
    expect(raw).not.toContain('0.1333') // 민트 r
  })

  it('크기 파라미터가 precomp scale 에 반영', () => {
    const small = generateStreakFlame({ ...streakFlameDefaults, size: 100 })
    const big = generateStreakFlame({ ...streakFlameDefaults, size: 200 })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scl = (j: any) => j.layers[0].ks.s.k[0]
    expect(scl(big)).toBeGreaterThan(scl(small))
  })

  it('속도 파라미터가 재생 길이(op)에 반영', () => {
    const slow = generateStreakFlame({ ...streakFlameDefaults, speed: 50 })
    const fast = generateStreakFlame({ ...streakFlameDefaults, speed: 200 })
    expect(slow.op).toBeGreaterThan(fast.op)
  })

  it('불꽃 색상 override 가 본체 그라디언트에 반영', () => {
    // 본체(Flame 레이어) gf 첫 스톱 rgb 가 flameColor 변경에 반응
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const firstBodyStop = (j: any): number[] => {
      const flame = j.assets[0].layers.find((l: { nm?: string }) => (l.nm ?? '').trim() === 'Flame')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let found: number[] | null = null
      const walk = (items: any[]) => {
        for (const it of items) {
          if (it.ty === 'gr') walk(it.it)
          else if (it.ty === 'gf' && !found) found = it.g.k.k.slice(1, 4)
        }
      }
      walk(flame.shapes)
      return found!
    }
    const red = firstBodyStop(generateStreakFlame({ ...streakFlameDefaults, flameColor: { mode: 'solid', hex: '#FF0000', opacity: 100 } }))
    const blue = firstBodyStop(generateStreakFlame({ ...streakFlameDefaults, flameColor: { mode: 'solid', hex: '#0000FF', opacity: 100 } }))
    expect(red[0]).toBeGreaterThan(0.9) // red
    expect(blue[2]).toBeGreaterThan(0.9) // blue
    expect(red).not.toEqual(blue)
  })

  it('코어 색상 override 가 White Fire 에 반영', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const coreStop0 = (j: any): number[] => {
      const wf = j.assets[0].layers.find((l: { nm?: string }) => (l.nm ?? '').trim() === 'White Fire')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let found: number[] | null = null
      const walk = (items: any[]) => {
        for (const it of items) {
          if (it.ty === 'gr') walk(it.it)
          else if (it.ty === 'gf' && !found) found = it.g.k.k.slice(1, 4)
        }
      }
      walk(wf.shapes)
      return found!
    }
    // pos 0(최밝은 중앙) 스톱은 coreColor 와 거의 일치
    const green = coreStop0(generateStreakFlame({ ...streakFlameDefaults, coreColor: { mode: 'solid', hex: '#00FF00', opacity: 100 } }))
    expect(green[1]).toBeGreaterThan(0.9) // green dominant
  })

  it('RN lint 통과 (expression/외부참조 없음)', () => {
    expect(lintForRN(json).warnings).toEqual([])
  })
})
