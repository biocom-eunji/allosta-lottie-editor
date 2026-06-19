import { describe, expect, it } from 'vitest'
import { generateGradientLoader, gradientLoaderDefaults } from './gradientLoader'
import { lintForRN } from '../validate'

describe('generateGradientLoader', () => {
  const json = generateGradientLoader(gradientLoaderDefaults)

  it('루트 구조가 올바름', () => {
    expect(json.v).toMatch(/^5\./)
    expect(json.fr).toBe(60)
    expect(json.op).toBeGreaterThan(0)
    expect(json.layers.length).toBe(1)
    expect(json.layers[0].ty).toBe(4)
  })

  it('닫힌 링(트랙)이 항상 렌더 + 하이라이트 trim 오프셋이 0→360 (seamless)', () => {
    const shapes = json.layers[0].shapes!
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const track = shapes.find((s: any) => s.nm === 'track')!
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const segs = shapes.filter((s: any) => typeof s.nm === 'string' && s.nm.startsWith('seg-'))
    expect(track).toBeTruthy()
    expect(segs.length).toBeGreaterThan(1) // 꼬리 페이드용 다중 조각
    // 트랙: trim 없음(전체 링)
    expect(track.it.some((i: { ty: string }) => i.ty === 'tm')).toBe(false)
    // 각 조각: trim 존재 + 오프셋 0→360 (함께 회전)
    for (const seg of segs) {
      const trim = seg.it.find((i: { ty: string }) => i.ty === 'tm')
      expect(trim).toBeTruthy()
      expect(trim.o.k[0].s[0]).toBe(0)
      expect(trim.o.k[trim.o.k.length - 1].s[0]).toBe(360)
    }
    // 꼬리→머리 opacity 가 증가(점점 진해짐) — 자연스러운 페이드
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ops = segs.map((seg: any) => seg.it.find((i: { ty: string }) => i.ty === 'gs' || i.ty === 'st').o.k)
    expect(Math.max(...ops)).toBeGreaterThan(Math.min(...ops))
  })

  it('RN lint 통과 (expression/외부참조 없음)', () => {
    const res = lintForRN(json)
    expect(res.ok).toBe(true)
    expect(res.warnings).toEqual([])
  })

  it('파라미터가 도형에 반영됨', () => {
    const custom = generateGradientLoader({ ...gradientLoaderDefaults, width: 200, height: 80, strokeWidth: 20 })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const grp = custom.layers[0].shapes!.find((s: any) => typeof s.nm === 'string' && s.nm.startsWith('seg-'))!
    const rc = grp.it.find((i: { ty: string }) => i.ty === 'rc')
    expect(rc.s.k).toEqual([200, 80])
    const gs = grp.it.find((i: { ty: string }) => i.ty === 'gs')
    expect(gs.w.k).toBe(20)
  })
})
