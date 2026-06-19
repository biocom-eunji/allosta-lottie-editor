import { anim, group, imageLayer, keyframes, shapeLayer, transform, val } from '../builders'
import { periodicKeyframes } from '../periodic'
import { mulberry32, seededRange } from '../../lib/prng'
import type { ImageValue } from '../controls'
import type { Asset, Layer, ShapeItem } from '../types'

export interface ParticleField {
  W: number
  H: number
  P: number
}

interface ParticleMotion {
  baseX: number
  swayPhase: number
  swayAmp: number
  phase: number
  spins: number
  dir: 1 | -1
}

function motionFor(rng: () => number, W: number): ParticleMotion {
  return {
    baseX: seededRange(rng, 24, W - 24),
    swayPhase: seededRange(rng, 0, Math.PI * 2),
    swayAmp: seededRange(rng, 8, 26),
    phase: rng(),
    spins: Math.round(seededRange(rng, 1, 3)),
    dir: rng() > 0.5 ? 1 : -1,
  }
}

/** 낙하 위치 prop (x sway는 주기적, y는 톱니: 리셋이 화면 밖에서 발생 -> 안 보임) */
function fallPosition(m: ParticleMotion, f: ParticleField) {
  const yTop = -50
  const yBottom = f.H + 50
  return anim(
    periodicKeyframes(
      f.P,
      m.phase,
      (u) => {
        const x = m.baseX + Math.sin(u * Math.PI * 2 + m.swayPhase) * m.swayAmp
        const y = yTop + (yBottom - yTop) * u
        return [x, y]
      },
      28,
    ),
    2,
  )
}

function spinRotation(m: ParticleMotion, f: ParticleField) {
  return anim(
    periodicKeyframes(f.P, m.phase, (u) => m.dir * 360 * m.spins * u, 16),
    10,
  )
}

/** 도형 파티클 레이어 (라운드 사각형 등) */
export function shapeParticle(index: number, shapes: ShapeItem[], f: ParticleField): Layer {
  const rng = mulberry32(1000 + index * 97)
  const m = motionFor(rng, f.W)
  const grp = group(
    shapes,
    transform({ p: fallPosition(m, f), r: spinRotation(m, f) }),
    `particle-${index}`,
  )
  return shapeLayer({ name: `particle-${index}`, shapes: [grp], ip: 0, op: f.P })
}

/** 이미지 파티클 레이어 (refId 참조, 중심 anchor + 목표 크기로 스케일) */
export function imageParticle(
  index: number,
  refId: string,
  imgW: number,
  imgH: number,
  targetSize: number,
  f: ParticleField,
): Layer {
  const rng = mulberry32(2000 + index * 131)
  const m = motionFor(rng, f.W)
  const scale = (targetSize / Math.max(imgW, imgH)) * 100
  return imageLayer({
    name: `img-particle-${index}`,
    refId,
    ks: transform({
      a: val([imgW / 2, imgH / 2], 1),
      p: fallPosition(m, f),
      r: spinRotation(m, f),
      s: val([scale, scale], 6),
    }),
    ip: 0,
    op: f.P,
  })
}

/** ImageValue 목록을 Lottie assets 로 변환 (base64 임베드, e:1) */
export function imagesToAssets(images: (ImageValue | null)[], idPrefix = 'img'): { assets: Asset[]; refIds: string[] } {
  const assets: Asset[] = []
  const refIds: string[] = []
  images.forEach((img, i) => {
    if (!img) return
    const id = `${idPrefix}_${i}`
    assets.push({ id, w: img.w, h: img.h, e: 1, u: '', p: img.dataUri })
    refIds.push(id)
  })
  return { assets, refIds }
}

/**
 * 방사형 스파크 1개 (one-shot). 중심에서 바깥으로 튀어나가며 축소·페이드.
 * confetti 파티클 빌더(시드 PRNG + group/shapeLayer)를 재사용한 burst 변형.
 */
export function burstSparkLayer(
  index: number,
  shapes: ShapeItem[],
  opts: { cx: number; cy: number; P: number; intensity: number; spread?: number },
): Layer {
  const rng = mulberry32(4000 + index * 167)
  const angle = seededRange(rng, 0, Math.PI * 2)
  const dist = (opts.spread ?? 110) * (0.5 + opts.intensity * 0.5) * (0.6 + rng() * 0.4)
  const ex = opts.cx + Math.cos(angle) * dist
  const ey = opts.cy + Math.sin(angle) * dist
  const spin = (rng() > 0.5 ? 1 : -1) * (90 + rng() * 180)
  const f = (frac: number) => Math.round(frac * opts.P)

  return shapeLayer({
    name: `spark-${index}`,
    shapes: [
      group(
        shapes,
        transform({
          p: anim(
            keyframes([
              { t: 0, s: [opts.cx, opts.cy], ease: 'out' },
              { t: f(0.7), s: [ex, ey], ease: 'out' },
              { t: f(1), s: [ex, ey], ease: 'linear' },
            ]),
            2,
          ),
          s: anim(
            keyframes([
              { t: 0, s: [40, 40], ease: 'out' },
              { t: f(0.25), s: [110, 110], ease: 'out' },
              { t: f(1), s: [30, 30], ease: 'in' },
            ]),
            6,
          ),
          r: anim(
            keyframes([
              { t: 0, s: [0], ease: 'linear' },
              { t: f(1), s: [spin], ease: 'linear' },
            ]),
            10,
          ),
          o: anim(
            keyframes([
              { t: 0, s: [0], ease: 'out' },
              { t: f(0.15), s: [100], ease: 'linear' },
              { t: f(0.7), s: [100], ease: 'in' },
              { t: f(1), s: [0], ease: 'in' },
            ]),
            11,
          ),
        }),
        `spark-${index}`,
      ),
    ],
    ip: 0,
    op: opts.P,
  })
}
