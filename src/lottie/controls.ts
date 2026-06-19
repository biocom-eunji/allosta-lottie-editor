import { getToken, type GradientStop } from '../tokens/colors'

/** 컬러 값: 토큰 이름 또는 custom hex, opacity 포함 */
export interface ColorValue {
  mode: 'solid' | 'gradient'
  /** solid */
  hex: string
  opacity: number // 0~100
  /** 선택이 시스템 토큰이면 토큰명 보관(라벨 표시용). custom hex 면 undefined */
  tokenName?: string
  /** gradient */
  stops?: GradientStop[]
  gradientType?: 1 | 2
}

export interface ImageValue {
  /** data URI (base64) */
  dataUri: string
  w: number
  h: number
}

// 파라미터 값 유니온
export type ParamValue =
  | number
  | string
  | boolean
  | ColorValue
  | ImageValue
  | (ImageValue | null)[]
  | null
  | undefined

export type Params = Record<string, ParamValue>

// ---- 선언형 컨트롤 스키마 ----

interface BaseControl {
  key: string
  label: string
  /** 다른 파라미터 값에 따라 표시 여부 결정 */
  visibleWhen?: { key: string; equals: string }
}

export interface SliderControl extends BaseControl {
  type: 'slider'
  min: number
  max: number
  step?: number
  unit?: string
  /** 슬라이더 하단 캡션 (예: "N개 파티클"). 미지정 시 캡션 없음 */
  caption?: (v: number) => string
}

export interface ColorControl extends BaseControl {
  type: 'color'
  /** gradient 허용 여부 */
  allowGradient?: boolean
  /** opacity 슬라이더 숨김 */
  hideOpacity?: boolean
  /** percent-spot 스타일 그라데이션 스튜디오(2D 캔버스+스톱 카드)로 렌더 */
  studio?: boolean
}

export interface TextControl extends BaseControl {
  type: 'text'
  placeholder?: string
}

export interface SegmentedControl extends BaseControl {
  type: 'segmented'
  options: { value: string; label: string }[]
}

export interface ToggleControl extends BaseControl {
  type: 'toggle'
}

export interface ImageControl extends BaseControl {
  type: 'image'
}

export interface ImageListControl extends BaseControl {
  type: 'imageList'
  count: number
}

export type ControlSchema =
  | SliderControl
  | ColorControl
  | TextControl
  | SegmentedControl
  | ToggleControl
  | ImageControl
  | ImageListControl

/** 기본 solid 컬러값 헬퍼 */
export function solidColor(hex: string, opacity = 100): ColorValue {
  return { mode: 'solid', hex, opacity }
}

export function gradientColor(stops: GradientStop[], type: 1 | 2 = 1): ColorValue {
  return { mode: 'gradient', hex: stops[0]?.hex ?? getToken('WHBK/BK'), opacity: 100, stops, gradientType: type }
}
