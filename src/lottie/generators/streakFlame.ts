import { anim, ellipse, group, keyframes, radialGlow, root, shapeLayer, transform, val } from '../builders'
import { configurePrecomp, loadFireDoc, recolorFlame, retime, setSideFlames } from './fireFlame'
import { getToken } from '../../tokens/colors'
import type { ColorValue, Params } from '../controls'
import type { Layer, LottieJSON } from '../types'

export interface StreakFlameParams extends Params {
  flameColor: ColorValue // 메인 불꽃 ramp (따뜻한 fire — 민트 미적용)
  coreColor: ColorValue // 중앙 밝은 부분 (White Fire)
  glowColor: ColorValue
  glowIntensity: number // 0~100
  sideFlames: number // 0~2 (Indv. Flame 01/02 show/hide)
  speed: number // 50~200 (%) — Retime
  size: number // px
}

export const streakFlameDefaults: StreakFlameParams = {
  // ★ 불꽃은 따뜻한 fire 컬러 유지 (앞서 적용한 민트 키컬러 예외)
  flameColor: {
    mode: 'gradient',
    hex: getToken('Semantic/Orange-300'),
    opacity: 100,
    gradientType: 1,
    stops: [
      { pos: 0, hex: getToken('Semantic/Red-400') },
      { pos: 0.5, hex: getToken('Semantic/Orange-400') },
      { pos: 1, hex: getToken('Semantic/Orange-300') },
    ],
  },
  coreColor: { mode: 'solid', hex: getToken('Semantic/Yellow-200'), opacity: 100 },
  glowColor: { mode: 'solid', hex: getToken('Semantic/Orange-300'), opacity: 100 },
  glowIntensity: 70,
  sideFlames: 2,
  speed: 100,
  size: 100,
}

export function generateStreakFlame(p: StreakFlameParams): LottieJSON {
  const doc = loadFireDoc()
  const comp = doc.assets[0]
  setSideFlames(comp, p.sideFlames)
  recolorFlame(comp, p.flameColor, p.coreColor)

  const W = 300
  const H = 300
  const { sr, op: P } = retime(p.speed)

  const precomp = configurePrecomp(doc.layers[0], { W, H, size: p.size, sr, op: P })

  // 글로우 (불꽃 뒤, radial gradient — blur 미사용), 호흡
  const glowSize = p.size * 2.4
  const glow = shapeLayer({
    name: 'glow',
    shapes: [
      group(
        [ellipse({ size: val([glowSize, glowSize], 2) }), radialGlow({ hex: p.glowColor.hex, opacity: 100, size: glowSize })],
        transform({
          p: val([W / 2, H / 2 + p.size * 0.1], 2),
          o: anim(
            keyframes([
              { t: 0, s: [Math.round(p.glowIntensity * 0.7)], ease: 'in-out' },
              { t: Math.round(P / 2), s: [p.glowIntensity], ease: 'in-out' },
              { t: P, s: [Math.round(p.glowIntensity * 0.7)], ease: 'in-out' },
            ]),
            11,
          ),
          s: anim(
            keyframes([
              { t: 0, s: [94, 94], ease: 'in-out' },
              { t: Math.round(P / 2), s: [104, 104], ease: 'in-out' },
              { t: P, s: [94, 94], ease: 'in-out' },
            ]),
            6,
          ),
        }),
        'glow',
      ),
    ],
    ip: 0,
    op: P,
  })
  glow.ind = 1

  const layers: Layer[] = [precomp, glow] // precomp 앞(위), glow 뒤
  return root({ name: 'streak-flame', w: W, h: H, fr: doc.fr ?? 24, op: P, layers, assets: doc.assets })
}
