import { ellipse, fill, rect, resetInd, root, val } from '../builders'
import { getToken } from '../../tokens/colors'
import { burstSparkLayer, imageParticle, imagesToAssets, shapeParticle, type ParticleField } from './confettiCommon'
import { mulberry32 } from '../../lib/prng'
import type { ImageValue, Params } from '../controls'
import type { Layer, LottieJSON } from '../types'

const FR = 60

// ── firework-burst: 중앙에서 색색 스파크가 터져 퍼지며 페이드 (one-shot) ──
export interface FireworkParams extends Params {
  count: number
  speed: number
}
export const fireworkBurstDefaults: FireworkParams = { count: 24, speed: 100 }
const FW_COLORS = ['Semantic/Yellow-300', 'Semantic/Red-300', 'Brand/Mint-400', 'Accent/Light Blue-300', 'Accent/blue-300']
export function generateFireworkBurst(p: FireworkParams): LottieJSON {
  resetInd()
  const W = 300
  const H = 300
  const speed = Math.max(50, Math.min(200, p.speed))
  const P = Math.max(40, Math.round(80 * (100 / speed)))
  const count = Math.max(6, Math.min(60, Math.round(p.count)))
  const layers: Layer[] = []
  for (let i = 0; i < count; i++) {
    const rng = mulberry32(900 + i * 53)
    const hex = getToken(FW_COLORS[Math.floor(rng() * FW_COLORS.length)])
    const w = 10 + Math.round(rng() * 10)
    const shape = rng() > 0.5
      ? [rect({ size: val([w, w * 0.5], 2), roundness: val(w / 4, 4) }), fill(hex, 100)]
      : [ellipse({ size: val([w, w], 2) }), fill(hex, 100)]
    layers.push(burstSparkLayer(i, shape, { cx: W / 2, cy: H / 2, P, intensity: 0.9, spread: 130 }))
  }
  return root({ name: 'firework-burst', w: W, h: H, fr: FR, op: P, layers })
}

// ── emoji-rain: 업로드 이미지(또는 색 조각)가 위→아래로 계속 낙하 (loop) ──
export interface EmojiRainParams extends Params {
  count: number
  images: (ImageValue | null)[]
}
export const emojiRainDefaults: EmojiRainParams = { count: 18, images: [null, null, null] }
const RAIN_FALLBACK = ['Semantic/Yellow-300', 'Semantic/Red-300', 'Brand/Mint-400']
export function generateEmojiRain(p: EmojiRainParams): LottieJSON {
  resetInd()
  const f: ParticleField = { W: 300, H: 300, P: 180 }
  const count = Math.max(1, Math.min(60, Math.round(p.count)))
  const { assets, refIds } = imagesToAssets(p.images ?? [], 'emoji')
  const valid = (p.images ?? []).filter(Boolean) as ImageValue[]
  const layers: Layer[] = []
  for (let i = 0; i < count; i++) {
    if (refIds.length > 0) {
      const idx = i % refIds.length
      const img = valid[idx]
      layers.push(imageParticle(i, refIds[idx], img.w, img.h, 36, f))
    } else {
      const rng = mulberry32(800 + i * 41)
      const hex = getToken(RAIN_FALLBACK[Math.floor(rng() * RAIN_FALLBACK.length)])
      const w = 16 + Math.round(rng() * 12)
      layers.push(shapeParticle(i, [ellipse({ size: val([w, w], 2) }), fill(hex, 100)], f))
    }
  }
  return root({ name: 'emoji-rain', w: f.W, h: f.H, fr: FR, op: f.P, layers, assets: refIds.length ? assets : [] })
}
