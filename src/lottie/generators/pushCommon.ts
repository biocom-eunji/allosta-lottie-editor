import { anim, fill, imageLayer, rect, shapeLayer, transform, val } from '../builders'
import { rasterizeText } from '../../lib/text'
import { getToken } from '../../tokens/colors'
import type { ColorValue, ImageValue, Params } from '../controls'
import type { AnimatedValue, Asset, Layer, ShapeItem } from '../types'

export interface PushBaseParams extends Params {
  title: string
  content: string
  titleColor: ColorValue
  contentColor: ColorValue
  iconColor: ColorValue
  textMode: string // 'raster' | 'overlay'
}

export const CARD_W = 280
export const CARD_H = 84

interface SlideKey {
  u: number
  dy: number
  ease?: 'in' | 'out' | 'linear'
}

const EASE = {
  out: { o: { x: [0.16], y: [1] }, i: { x: [0.3], y: [1] } },
  in: { o: { x: [0.7], y: [0] }, i: { x: [0.84], y: [0] } },
  linear: { o: { x: [0.5], y: [0.5] }, i: { x: [0.5], y: [0.5] } },
}

/** 슬라이드 in -> hold -> out 프리셋 (dy 오프셋, u: 0~1) */
export function slideUpKeys(dist: number): SlideKey[] {
  return [
    { u: 0, dy: dist, ease: 'out' },
    { u: 0.18, dy: 0, ease: 'linear' },
    { u: 0.82, dy: 0, ease: 'in' },
    { u: 1, dy: -dist, ease: 'in' },
  ]
}

export function slideDownKeys(dist: number): SlideKey[] {
  return [
    { u: 0, dy: -dist, ease: 'out' },
    { u: 0.18, dy: 0, ease: 'linear' },
    { u: 0.82, dy: 0, ease: 'in' },
    { u: 1, dy: dist, ease: 'in' },
  ]
}

/** base 위치 + 슬라이드 dy 곡선을 적용한 위치 prop */
export function slidePos(baseX: number, baseY: number, keys: SlideKey[], P: number): AnimatedValue {
  return anim(
    keys.map((k) => ({
      t: Math.round(k.u * P),
      s: [baseX, baseY + k.dy],
      ...EASE[k.ease ?? 'linear'],
    })),
    2,
  )
}

/** 카드 배경(그림자 + 라운드 사각형) 도형 묶음 */
export function cardBackgroundShapes(w: number, h: number, bg = getToken('WHBK/WH')): ShapeItem[] {
  return [
    // 그림자
    rect({ size: val([w, h], 2), position: val([0, 4], 3), roundness: val(20, 4) }),
    fill(getToken('Mono/Neutral-900'), 10),
    // 카드
    rect({ size: val([w, h], 2), roundness: val(20, 4) }),
    fill(bg, 100),
  ]
}

/** 아이콘(라운드 사각형 accent) 도형 묶음 */
export function iconShapes(size: number, color: string): ShapeItem[] {
  return [rect({ size: val([size, size], 2), roundness: val(size * 0.3, 4) }), fill(color, 100)]
}

/**
 * 텍스트 이미지 레이어 + asset 생성 (raster 모드). overlay 모드면 null.
 * leftX/centerY = 텍스트의 정지 위치(좌측 중앙). 카드와 동일한 slide 키로 함께 움직인다.
 */
export function textLayer(
  opts: {
    text: string
    leftX: number
    centerY: number
    keys: SlideKey[]
    P: number
    size: number
    weight: number
    color: string
    maxWidth: number
    assetId: string
  },
  assets: Asset[],
): Layer | null {
  const img = rasterizeText(opts.text, {
    size: opts.size,
    weight: opts.weight,
    color: opts.color,
    maxWidth: opts.maxWidth,
  })
  if (!img) return null
  assets.push({ id: opts.assetId, w: img.w, h: img.h, e: 1, u: '', p: img.dataUri })

  // 2x로 그려졌으므로 50% 스케일. anchor 좌측중앙 -> leftX/centerY 에 정렬.
  return imageLayer({
    name: `text-${opts.assetId}`,
    refId: opts.assetId,
    ks: {
      ty: 'tr',
      a: val([0, img.h / 2], 1),
      p: slidePos(opts.leftX, opts.centerY, opts.keys, opts.P),
      s: val([50, 50], 6),
      r: val(0, 10),
      o: val(100, 11),
    },
    ip: 0,
    op: opts.P,
  })
}

/** 카드 본체(배경+아이콘) 한 레이어로 묶기 */
export function cardLayer(name: string, shapes: ShapeItem[], pos: AnimatedValue, op: number): Layer {
  return shapeLayer({
    name,
    shapes: [{ ty: 'gr', it: [...shapes, transform({ p: pos })], nm: name }],
    ip: 0,
    op,
  })
}

/** ImageValue -> asset + image layer (목업 썸네일/스크린용) */
export function uploadedImageLayer(
  name: string,
  img: ImageValue,
  assetId: string,
  centerX: number,
  centerY: number,
  targetW: number,
  targetH: number,
  op: number,
  assets: Asset[],
): Layer {
  assets.push({ id: assetId, w: img.w, h: img.h, e: 1, u: '', p: img.dataUri })
  const sx = (targetW / img.w) * 100
  const sy = (targetH / img.h) * 100
  return imageLayer({
    name,
    refId: assetId,
    ks: transform({
      a: val([img.w / 2, img.h / 2], 1),
      p: val([centerX, centerY], 2),
      s: val([sx, sy], 6),
    }),
    ip: 0,
    op,
  })
}
