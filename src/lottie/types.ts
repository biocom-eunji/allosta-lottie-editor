// 최소한의 Lottie JSON 타입 정의 (RN 호환 범위에서만)

/** [r,g,b] 0~1 정규화 색상 (alpha 미포함) */
export type RGB = [number, number, number]
/** [r,g,b,a] */
export type RGBA = [number, number, number, number]

/** 정적 값 */
export interface StaticValue<T = number | number[]> {
  a: 0
  k: T
  ix?: number
}

/** 애니메이션 키프레임 */
export interface Keyframe {
  t: number // frame
  s: number[] // start value
  /** bezier ease out */
  o?: { x: number[]; y: number[] }
  /** bezier ease in */
  i?: { x: number[]; y: number[] }
  /** hold */
  h?: number
}

export interface AnimatedValue {
  a: 1
  k: Keyframe[]
  ix?: number
}

export type Prop<T = number | number[]> = StaticValue<T> | AnimatedValue

export interface Transform {
  ty?: 'tr'
  p?: Prop<number[]> // position
  a?: Prop<number[]> // anchor
  s?: Prop<number[]> // scale
  r?: Prop<number> // rotation
  o?: Prop<number> // opacity
  sk?: Prop<number>
  sa?: Prop<number>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ShapeItem = Record<string, any>

export interface ShapeGroup {
  ty: 'gr'
  it: ShapeItem[]
  nm?: string
}

export interface Layer {
  ddd?: number
  ind?: number
  ty: number // 0:precomp 2:image 4:shape
  nm?: string
  refId?: string
  sr?: number
  ks: Transform
  ao?: number
  shapes?: ShapeItem[]
  ip: number
  op: number
  st: number
  bm?: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

export interface Asset {
  id: string
  w?: number
  h?: number
  e?: number // 1 = embedded
  u?: string
  p?: string // data URI
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

export interface LottieJSON {
  v: string
  fr: number
  ip: number
  op: number
  w: number
  h: number
  nm: string
  ddd: number
  assets: Asset[]
  layers: Layer[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}
