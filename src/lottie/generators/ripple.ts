import { anim, ellipse, fill, group, keyframes, root, shapeLayer, transform, val } from '../builders'
import { BRAND_HEX } from '../../tokens/colors'
import { bump, lerp, periodicKeyframes } from '../periodic'
import type { ColorValue, Params } from '../controls'
import type { Layer, LottieJSON } from '../types'

export interface RippleParams extends Params {
  size: number
  count: number
  color: ColorValue
}

export const rippleDefaults: RippleParams = {
  size: 200,
  count: 2,
  color: { mode: 'solid', hex: BRAND_HEX, opacity: 100 },
}

export function generateRipple(p: RippleParams): LottieJSON {
  const W = 300
  const H = 300
  const P = 120
  const count = Math.max(1, Math.round(p.count))
  const centerD = p.size * 0.36

  const layers: Layer[] = []

  // 바깥으로 퍼지는 채움(fill) 원 — scale 확대 + opacity 페이드아웃, 위상차
  for (let i = 0; i < count; i++) {
    const phase = i / count
    const grp = group(
      [ellipse({ size: val([p.size, p.size], 2) }), fill(p.color.hex, p.color.opacity)],
      transform({
        p: val([W / 2, H / 2], 2),
        s: anim(
          periodicKeyframes(P, phase, (u) => {
            const sc = lerp(22, 135, u)
            return [sc, sc]
          }),
          6,
        ),
        // 양끝 0 인 bump (퍼지면서 페이드) — seamless
        o: anim(periodicKeyframes(P, phase, bump(p.color.opacity * 0.38, 0.12)), 11),
      }),
      `ripple-${i}`,
    )
    layers.push(shapeLayer({ name: `ripple-${i}`, shapes: [grp], ip: 0, op: P }))
  }

  // 가운데 solid 원 — 은은한 펄스 (항상 렌더)
  const center = shapeLayer({
    name: 'center',
    shapes: [
      group(
        [ellipse({ size: val([centerD, centerD], 2) }), fill(p.color.hex, p.color.opacity)],
        transform({
          p: val([W / 2, H / 2], 2),
          s: anim(
            keyframes([
              { t: 0, s: [94, 94], ease: 'in-out' },
              { t: P / 2, s: [106, 106], ease: 'in-out' },
              { t: P, s: [94, 94], ease: 'in-out' },
            ]),
            6,
          ),
        }),
        'center',
      ),
    ],
    ip: 0,
    op: P,
  })

  // 중앙 원이 맨 앞
  return root({ name: 'ripple', w: W, h: H, op: P, layers: [center, ...layers] })
}
