import { describe, expect, it } from 'vitest'
import { generateLoader3Dot, loader3dotDefaults } from './loader3dot'
import { lintForRN } from '../validate'
import { hexToHsl } from '../../tokens/colors'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function trOf(layer: any) {
  const grp = layer.shapes[0]
  return grp.it.find((i: { ty: string }) => i.ty === 'tr')
}
// 점 모양(rounded rect) — 변형은 size(w,h) keyframe 으로 처리
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rcOf(layer: any) {
  return layer.shapes[0].it.find((i: { ty: string }) => i.ty === 'rc')
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fillOf(layer: any) {
  return layer.shapes[0].it.find((i: { ty: string }) => i.ty === 'fl')
}

describe('generateLoader3Dot', () => {
  const json = generateLoader3Dot(loader3dotDefaults)

  it('루트 구조 + 점 3개', () => {
    expect(json.v).toMatch(/^5\./)
    expect(json.layers.length).toBe(3)
    expect(json.layers.every((l) => l.ty === 4)).toBe(true)
  })

  it('점은 ellipse 가 아니라 rounded rect(rc) — transform scale 변형 미사용', () => {
    for (const layer of json.layers) {
      expect(rcOf(layer)).toBeDefined()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items = (layer.shapes as any[])[0].it as { ty: string }[]
      expect(items.some((i) => i.ty === 'el')).toBe(false)
      // transform.s 는 정적 100 (모양 변형에 미사용)
      expect(trOf(layer).s.a).toBe(0)
      expect(trOf(layer).s.k).toEqual([100, 100])
    }
  })

  it('★ 캡슐: 코너 반경 r == min(w,h)/2 (매 키프레임)', () => {
    for (const layer of json.layers) {
      const rc = rcOf(layer)
      const sizeK = rc.s.k
      const radK = rc.r.k
      expect(sizeK.length).toBe(radK.length)
      for (let i = 0; i < sizeK.length; i++) {
        const [w, h] = sizeK[i].s
        expect(radK[i].s[0]).toBeCloseTo(Math.min(w, h) / 2, 5)
      }
    }
  })

  it('seamless: 모든 점의 position/size 첫 키프레임 == 마지막 키프레임', () => {
    for (const layer of json.layers) {
      const pos = trOf(layer).p.k
      const size = rcOf(layer).s.k
      expect(pos[0].s).toEqual(pos[pos.length - 1].s)
      expect(size[0].s).toEqual(size[size.length - 1].s)
      // 마지막 키프레임 t == 전체 op (주기 끝)
      expect(pos[pos.length - 1].t).toBe(json.op)
      expect(size[size.length - 1].t).toBe(json.op)
    }
  })

  it('웨이브 시차: 점0→점1→점2 바운스 시작이 순차 지연', () => {
    const starts = json.layers.map((layer) => {
      const pos = trOf(layer).p.k
      // 최초로 y 가 기준선(cy=150)에서 벗어나기 시작하는 키프레임 t
      const rise = pos.find((k: { s: number[] }) => k.s[1] < 150)
      return rise.t
    })
    expect(starts[0]).toBeLessThan(starts[1])
    expect(starts[1]).toBeLessThan(starts[2])
  })

  it('squash & stretch: 정점에서 세로 신장(캡슐), 착지에서 눌림 — size(w,h)로 변형', () => {
    const d = loader3dotDefaults.dotSize
    const size = rcOf(json.layers[0]).s.k
    const maxH = Math.max(...size.map((k: { s: number[] }) => k.s[1]))
    const minH = Math.min(...size.map((k: { s: number[] }) => k.s[1]))
    // 정점: h>d & 그 때 w<d (세로 캡슐)
    const top = size.find((k: { s: number[] }) => k.s[1] === maxH)
    expect(maxH).toBeGreaterThan(d)
    expect(top.s[0]).toBeLessThan(d)
    // 착지: h<d (가로 캡슐로 눌림)
    expect(minH).toBeLessThan(d)
  })

  it('오버슈트(포잉): 착지 눌림 이후 미세 2차 바운스 키프레임 존재', () => {
    const d = loader3dotDefaults.dotSize
    const h = rcOf(json.layers[0]).s.k.map((k: { s: number[] }) => k.s[1])
    const minIdx = h.indexOf(Math.min(...h))
    // 착지(최소 h) 다음에 다시 d 위로 살짝 솟는 키프레임
    const after = h.slice(minIdx + 1)
    expect(after.some((v: number) => v > d)).toBe(true)
  })

  it('색상: 좌(밝음)→중(원색)→우(어둠) 명도 그라데이션', () => {
    const [l0, l1, l2] = json.layers.map((layer) => hexToHsl(rgbHex(fillOf(layer)))[2])
    expect(l0).toBeGreaterThan(l1)
    expect(l1).toBeGreaterThan(l2)
  })

  it('색 하나 바꾸면 3셰이드 자동 갱신', () => {
    const red = generateLoader3Dot({
      ...loader3dotDefaults,
      color: { mode: 'solid', hex: '#FF0000', opacity: 100 },
    })
    const hexes = red.layers.map((layer) => rgbHex(fillOf(layer)))
    expect(new Set(hexes).size).toBe(3) // 3색 모두 다름
  })

  it('RN lint 통과 (expression/외부참조 없음)', () => {
    const res = lintForRN(json)
    expect(res.ok).toBe(true)
    expect(res.warnings).toEqual([])
  })
})

// fill 의 c.k([r,g,b,1]) → "#rrggbb"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rgbHex(fl: any): string {
  const [r, g, b] = fl.c.k
  const to = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}
