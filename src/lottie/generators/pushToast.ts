import { ellipse, fill, group, root, transform, val } from '../builders'
import { BRAND_HEX, getToken } from '../../tokens/colors'
import type { Params } from '../controls'
import type { Asset, Layer, LottieJSON } from '../types'
import {
  CARD_H,
  CARD_W,
  cardBackgroundShapes,
  cardLayer,
  iconShapes,
  PushBaseParams,
  slidePos,
  slideUpKeys,
  textLayer,
} from './pushCommon'

export interface PushToastParams extends PushBaseParams, Params {
  badge?: boolean
  badgeCount?: number
}

export const pushSoloSlideUpDefaults: PushToastParams = {
  title: '새로운 메시지',
  content: '알로스타에서 새 소식이 도착했어요.',
  titleColor: { mode: 'solid', hex: getToken('Mono/Neutral-900'), opacity: 100 },
  contentColor: { mode: 'solid', hex: getToken('Mono/Neutral-500'), opacity: 100 },
  iconColor: { mode: 'solid', hex: BRAND_HEX, opacity: 100 },
  textMode: 'raster',
}

export const pushCrossSlideUpDefaults: PushToastParams = {
  ...pushSoloSlideUpDefaults,
  title: '3개의 새 알림',
  content: '확인하지 않은 알림이 있어요.',
  badge: true,
  badgeCount: 3,
}

export function generatePushToast(p: PushToastParams, id: string): LottieJSON {
  const W = 340
  const H = 200
  const P = 150
  const cx = W / 2
  const cy = H / 2
  const dist = 160
  const keys = slideUpKeys(dist)

  const cardPos = slidePos(cx, cy, keys, P)
  const assets: Asset[] = []
  const layers: Layer[] = []

  // 로컬 좌표 (카드 중심 기준)
  const iconLocalX = -CARD_W / 2 + 16 + 22
  const textLeftLocal = -CARD_W / 2 + 16 + 44 + 12

  // shape 그룹은 앞쪽 항목이 위에 렌더 -> 아이콘/뱃지를 배경보다 먼저 둔다
  const cardShapes = []
  // 뱃지(크로스 변형): 아이콘 우상단 빨간 원
  if (p.badge) {
    cardShapes.push(
      group(
        [ellipse({ size: val([22, 22], 2) }), fill(getToken('Semantic/Red-400'), 100)],
        transform({ p: val([iconLocalX + 16, -16], 2) }),
        'badge',
      ),
    )
  }
  cardShapes.push(group(iconShapes(44, p.iconColor.hex), transform({ p: val([iconLocalX, 0], 2) }), 'icon'))
  cardShapes.push(...cardBackgroundShapes(CARD_W, CARD_H))

  layers.push(cardLayer('card', cardShapes, cardPos, P))

  // 텍스트 (raster 모드만)
  if (p.textMode === 'raster') {
    const titleLayer = textLayer(
      {
        text: p.title,
        leftX: cx + textLeftLocal,
        centerY: cy - 11,
        keys,
        P,
        size: 15,
        weight: 600,
        color: p.titleColor.hex,
        maxWidth: 150,
        assetId: 'title',
      },
      assets,
    )
    const contentLayer = textLayer(
      {
        text: p.content,
        leftX: cx + textLeftLocal,
        centerY: cy + 13,
        keys,
        P,
        size: 13,
        weight: 400,
        color: p.contentColor.hex,
        maxWidth: 165,
        assetId: 'content',
      },
      assets,
    )
    // 뱃지 숫자
    if (p.badge && p.badgeCount != null) {
      const numLayer = textLayer(
        {
          text: String(p.badgeCount),
          leftX: cx + iconLocalX + 16 - 3,
          centerY: cy - 16,
          keys,
          P,
          size: 11,
          weight: 700,
          color: getToken('WHBK/WH'),
          maxWidth: 20,
          assetId: 'badgeNum',
        },
        assets,
      )
      if (numLayer) layers.unshift(numLayer)
    }
    if (contentLayer) layers.unshift(contentLayer)
    if (titleLayer) layers.unshift(titleLayer)
  }

  return root({ name: id, w: W, h: H, op: P, layers, assets })
}
