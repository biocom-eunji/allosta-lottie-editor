import { describe, expect, it } from 'vitest'
import { gradientStopsToLottie, hexToHsl, hexToRgb, hslToHex, rgbToHex, shiftLightness } from './colors'

describe('hexToRgb', () => {
  it('6자리 hex를 0~1 정규화', () => {
    expect(hexToRgb('#ffffff')).toEqual([1, 1, 1])
    expect(hexToRgb('#000000')).toEqual([0, 0, 0])
    const [r, g, b] = hexToRgb('#3B82F6')
    expect(r).toBeCloseTo(59 / 255)
    expect(g).toBeCloseTo(130 / 255)
    expect(b).toBeCloseTo(246 / 255)
  })

  it('3자리 shorthand 지원', () => {
    expect(hexToRgb('#fff')).toEqual([1, 1, 1])
    expect(hexToRgb('#f00')).toEqual([1, 0, 0])
  })

  it('잘못된 입력은 검정', () => {
    expect(hexToRgb('zzz')).toEqual([0, 0, 0])
  })
})

describe('rgbToHex', () => {
  it('round-trip', () => {
    expect(rgbToHex([1, 1, 1])).toBe('#ffffff')
    expect(rgbToHex(hexToRgb('#3b82f6'))).toBe('#3b82f6')
  })
  it('범위를 클램프', () => {
    expect(rgbToHex([2, -1, 0.5])).toBe('#ff0080')
  })
})

describe('hexToHsl / hslToHex', () => {
  it('round-trip 근사', () => {
    expect(hslToHex(...hexToHsl('#22C3BC'))).toBe('#22c3bc')
    expect(hslToHex(...hexToHsl('#FF0000'))).toBe('#ff0000')
  })
  it('회색(채도0) 처리', () => {
    const [h, s, l] = hexToHsl('#808080')
    expect(s).toBeCloseTo(0)
    expect(hslToHex(h, s, l)).toBe('#808080')
  })
})

describe('shiftLightness', () => {
  it('+ 는 밝게, - 는 어둡게', () => {
    const base = '#22C3BC'
    const lBase = hexToHsl(base)[2]
    expect(hexToHsl(shiftLightness(base, 12))[2]).toBeGreaterThan(lBase)
    expect(hexToHsl(shiftLightness(base, -12))[2]).toBeLessThan(lBase)
  })
  it('명도 0~100 클램프', () => {
    expect(shiftLightness('#ffffff', 50)).toBe('#ffffff')
    expect(shiftLightness('#000000', -50)).toBe('#000000')
  })
})

describe('gradientStopsToLottie', () => {
  it('[pos,r,g,b,...] 평탄화 + 정렬', () => {
    const k = gradientStopsToLottie([
      { pos: 1, hex: '#ffffff' },
      { pos: 0, hex: '#000000' },
    ])
    expect(k).toEqual([0, 0, 0, 0, 1, 1, 1, 1])
  })
})
