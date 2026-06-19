/** mulberry32 결정적 PRNG (시드 고정 -> 재현성 확보) */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 시드 기반 [min,max) 난수 */
export function seededRange(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min)
}
