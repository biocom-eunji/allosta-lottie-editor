import { describe, expect, it } from 'vitest'
import { SYSTEM_TOKENS, TOKEN_COLLECTIONS, findTokenByHex, findTokenByName, colorLabel } from './colors'

describe('시스템 토큰 정규화', () => {
  it('깨진 JSON에서도 132개 토큰 추출', () => {
    expect(SYSTEM_TOKENS.length).toBe(132)
  })

  it('컬렉션이 Mono/WHBK/Brand/Semantic/Accent 로 노출', () => {
    expect(TOKEN_COLLECTIONS).toEqual(['Mono', 'WHBK', 'Brand', 'Semantic', 'Accent'])
  })

  it('모든 토큰이 유효한 hex + 패밀리 + 라벨 보유', () => {
    for (const t of SYSTEM_TOKENS) {
      expect(t.hex).toMatch(/^#[0-9A-F]{6}$/)
      expect(t.label.length).toBeGreaterThan(0)
      expect(t.family.length).toBeGreaterThan(0)
      expect(t.collection.length).toBeGreaterThan(0)
    }
  })

  it('"gree" 검색 시 Green 50~900 칩 노출', () => {
    const hits = SYSTEM_TOKENS.filter((t) => t.label.toLowerCase().includes('gree'))
    const labels = hits.map((t) => t.label)
    expect(labels).toEqual(
      expect.arrayContaining(['Green 50', 'Green 100', 'Green 300', 'Green 500', 'Green 900']),
    )
    expect(hits.every((t) => t.family === 'Green')).toBe(true)
  })

  it('표시명 포맷: 하이픈→공백 + Title Case', () => {
    const mint = findTokenByName('Mint-400')
    expect(mint?.label).toBe('Mint 400')
    expect(mint?.hex).toBe('#22C3BC') // 키컬러
  })

  it('hex 로 토큰 라벨 역참조 (제너레이터 기본값 라벨 표시)', () => {
    expect(colorLabel('#22C3BC')).toBe('Mint 400')
    expect(findTokenByHex('#22c3bc')?.label).toBe('Mint 400') // 대소문자 무시
    expect(colorLabel('#123456')).toBe('#123456') // 토큰 없으면 hex
    expect(colorLabel('#000000', 'Mint-400')).toBe('Mint 400') // tokenName 우선
  })
})
