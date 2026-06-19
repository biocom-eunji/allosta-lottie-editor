import { describe, expect, it } from 'vitest'
import { ANIMATIONS } from './registry'
import { lintForRN } from './validate'

describe('모든 애니메이션 generator', () => {
  for (const def of ANIMATIONS) {
    describe(def.id, () => {
      const json = def.generate(def.defaultParams)

      it('유효한 루트 구조', () => {
        expect(json.v).toMatch(/^5\./)
        expect(json.fr).toBeGreaterThan(0)
        expect(json.op).toBeGreaterThan(json.ip)
        expect(json.w).toBeGreaterThan(0)
        expect(json.h).toBeGreaterThan(0)
        expect(Array.isArray(json.layers)).toBe(true)
        expect(json.layers.length).toBeGreaterThan(0)
      })

      it('레이어 ip/op 범위 유효', () => {
        for (const l of json.layers) {
          expect(typeof l.ty).toBe('number')
          expect(l.op).toBeGreaterThan(l.ip)
        }
      })

      it('RN lint 통과 (expression/외부참조 없음)', () => {
        const res = lintForRN(json)
        expect(res.warnings).toEqual([])
        expect(res.ok).toBe(true)
      })

      it('JSON 직렬화 가능', () => {
        expect(() => JSON.stringify(json)).not.toThrow()
      })
    })
  }

  it('registry id 중복 없음', () => {
    const ids = ANIMATIONS.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
