import { fill, group, imageLayer, rect, root, shapeLayer, transform, val } from '../builders'
import { BRAND_HEX, getToken } from '../../tokens/colors'
import type { ImageValue, Params } from '../controls'
import type { Asset, Layer, LottieJSON } from '../types'
import {
  cardBackgroundShapes,
  cardLayer,
  iconShapes,
  PushBaseParams,
  slideDownKeys,
  slidePos,
  textLayer,
} from './pushCommon'

export interface PushMockupParams extends PushBaseParams, Params {
  thumbnail?: ImageValue | null
  screenImage?: ImageValue | null
}

export const pushSoloMockupSlideDownDefaults: PushMockupParams = {
  title: '알림이 도착했어요',
  content: '지금 확인해 보세요.',
  titleColor: { mode: 'solid', hex: getToken('Mono/Neutral-900'), opacity: 100 },
  contentColor: { mode: 'solid', hex: getToken('Mono/Neutral-500'), opacity: 100 },
  iconColor: { mode: 'solid', hex: BRAND_HEX, opacity: 100 },
  textMode: 'raster',
}

export const pushSoloMockupScreenDefaults: PushMockupParams = {
  ...pushSoloMockupSlideDownDefaults,
  title: '새 사진',
  content: '앨범에 사진이 추가되었어요.',
  thumbnail: null,
  screenImage: null,
}

const PHONE_W = 240
const PHONE_H = 480
const SCREEN_INSET = 11
const BODY_RADIUS = 46
const SCREEN_RADIUS = BODY_RADIUS - SCREEN_INSET // 동심 코너
const MOCKUP_CARD_W = 200
const MOCKUP_CARD_H = 72

export function generatePushMockup(
  p: PushMockupParams,
  id: string,
  opts: { withImages: boolean } = { withImages: false },
): LottieJSON {
  const W = 320
  const H = 540
  const P = 150
  const cx = W / 2
  const cy = H / 2
  const screenW = PHONE_W - SCREEN_INSET * 2
  const screenH = PHONE_H - SCREEN_INSET * 2
  const screenTop = cy - screenH / 2

  const dist = 80
  const keys = slideDownKeys(dist)
  const restY = screenTop + 14 + MOCKUP_CARD_H / 2
  const cardPos = slidePos(cx, restY, keys, P)

  const assets: Asset[] = []
  const topLayers: Layer[] = [] // 위에 그릴 것 (텍스트/썸네일)
  const bottomLayers: Layer[] = [] // 카드/스크린/폰

  // --- 카드 본체 ---
  const cardLeftLocal = -MOCKUP_CARD_W / 2
  const thumb = opts.withImages ? p.thumbnail : null
  const cardInnerShapes = thumb
    ? [] // 썸네일은 별도 이미지 레이어
    : [group(iconShapes(40, p.iconColor.hex), transform({ p: val([cardLeftLocal + 14 + 20, 0], 2) }), 'icon')]

  // 앞쪽 항목이 위에 렌더 -> 아이콘을 배경보다 먼저
  bottomLayers.push(
    cardLayer('notif-card', [...cardInnerShapes, ...cardBackgroundShapes(MOCKUP_CARD_W, MOCKUP_CARD_H)], cardPos, P),
  )

  // 썸네일 (이미지 모드)
  if (thumb) {
    assets.push({ id: 'thumb', w: thumb.w, h: thumb.h, e: 1, u: '', p: thumb.dataUri })
    const size = 44
    const sc = (size / Math.max(thumb.w, thumb.h)) * 100
    topLayers.push(
      imageLayer({
        name: 'thumbnail',
        refId: 'thumb',
        ks: {
          ty: 'tr',
          a: val([thumb.w / 2, thumb.h / 2], 1),
          p: slidePos(cx + cardLeftLocal + 14 + size / 2, restY, keys, P),
          s: val([sc, sc], 6),
          r: val(0, 10),
          o: val(100, 11),
        },
        ip: 0,
        op: P,
      }),
    )
  }

  // --- 텍스트 ---
  if (p.textMode === 'raster') {
    const textLeft = cx + cardLeftLocal + 14 + 44 + 10
    const t1 = textLayer(
      { text: p.title, leftX: textLeft, centerY: restY - 10, keys, P, size: 14, weight: 600, color: p.titleColor.hex, maxWidth: 110, assetId: 'm-title' },
      assets,
    )
    const t2 = textLayer(
      { text: p.content, leftX: textLeft, centerY: restY + 12, keys, P, size: 12, weight: 400, color: p.contentColor.hex, maxWidth: 120, assetId: 'm-content' },
      assets,
    )
    if (t2) topLayers.push(t2)
    if (t1) topLayers.push(t1)
  }

  // --- 스크린 배경 이미지 (있으면) ---
  if (opts.withImages && p.screenImage) {
    const si = p.screenImage
    assets.push({ id: 'screen', w: si.w, h: si.h, e: 1, u: '', p: si.dataUri })
    const cover = Math.max(screenW / si.w, screenH / si.h) * 100
    bottomLayers.push(
      imageLayer({
        name: 'screen-image',
        refId: 'screen',
        ks: transform({ a: val([si.w / 2, si.h / 2], 1), p: val([cx, cy], 2), s: val([cover, cover], 6) }),
        ip: 0,
        op: P,
      }),
    )
  } else {
    // 스크린 배경(밝은 회색)
    bottomLayers.push(
      shapeLayer({
        name: 'screen-bg',
        shapes: [
          group(
            [rect({ size: val([screenW, screenH], 2), roundness: val(SCREEN_RADIUS, 4) }), fill(getToken('Mono/Neutral-50'), 100)],
            transform({ p: val([cx, cy], 2) }),
            'screen',
          ),
        ],
        ip: 0,
        op: P,
      }),
    )
  }

  // --- 노치 (스크린 위에 렌더) ---
  // 다이내믹 아일랜드 (둥근 알약)
  const notchLayer = shapeLayer({
    name: 'notch',
    shapes: [
      group([rect({ size: val([62, 17], 2), roundness: val(8.5, 4) }), fill(getToken('Mono/Neutral-900'), 100)], transform({ p: val([cx, cy - PHONE_H / 2 + 26], 2) }), 'island'),
    ],
    ip: 0,
    op: P,
  })

  // --- 폰 바디 (최하단) ---
  const bodyLayer = shapeLayer({
    name: 'phone-body',
    shapes: [
      group([rect({ size: val([PHONE_W, PHONE_H], 2), roundness: val(BODY_RADIUS, 4) }), fill(getToken('Mono/Neutral-900'), 100)], transform({ p: val([cx, cy], 2) }), 'body'),
    ],
    ip: 0,
    op: P,
  })

  // 배열 앞쪽 = 위에 렌더. topLayers(텍스트/썸네일) > 노치 > 카드/스크린 > 바디
  const layers = [...topLayers, notchLayer, ...bottomLayers, bodyLayer]
  return root({ name: id, w: W, h: H, op: P, layers, assets })
}
