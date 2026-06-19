import type { AnimatedValue, Keyframe, Layer, LottieJSON, Prop, ShapeItem, Transform } from './types'
import { hexToRgb, type GradientStop, gradientStopsToLottie } from '../tokens/colors'

const EASE_OUT = { x: [0.33], y: [0] }
const EASE_IN = { x: [0.67], y: [1] }
const EASE_IN_OUT_O = { x: [0.42, 0.42], y: [0, 0] }
const EASE_IN_OUT_I = { x: [0.58, 0.58], y: [1, 1] }

/** 정적 스칼라/벡터 prop */
export function val<T extends number | number[]>(k: T, ix?: number): Prop<T> {
  return { a: 0, k, ...(ix !== undefined ? { ix } : {}) } as Prop<T>
}

/** 키프레임 prop */
export function anim(keyframes: Keyframe[], ix?: number): AnimatedValue {
  return { a: 1, k: keyframes, ...(ix !== undefined ? { ix } : {}) }
}

interface KfInput {
  t: number
  s: number[]
  /** 'in-out' | 'out' | 'in' | 'hold' | 'linear' */
  ease?: 'in-out' | 'out' | 'in' | 'hold' | 'linear'
}

/** 키프레임 배열을 ease 옵션과 함께 생성 */
export function keyframes(inputs: KfInput[]): Keyframe[] {
  return inputs.map((kf) => {
    const out: Keyframe = { t: kf.t, s: kf.s }
    switch (kf.ease) {
      case 'hold':
        out.h = 1
        break
      case 'out':
        out.o = EASE_OUT
        out.i = EASE_IN
        break
      case 'in':
        out.o = EASE_OUT
        out.i = EASE_IN
        break
      case 'in-out':
        out.o = EASE_IN_OUT_O
        out.i = EASE_IN_OUT_I
        break
      case 'linear':
      default:
        out.o = { x: [0.5], y: [0.5] }
        out.i = { x: [0.5], y: [0.5] }
        break
    }
    return out
  })
}

/** 트랜스폼 (기본값 채움) */
export function transform(t: Partial<Transform> = {}): Transform {
  return {
    ty: 'tr',
    p: t.p ?? val([0, 0], 2),
    a: t.a ?? val([0, 0], 1),
    s: t.s ?? val([100, 100], 6),
    r: t.r ?? val(0, 10),
    o: t.o ?? val(100, 11),
    ...(t.sk ? { sk: t.sk } : {}),
    ...(t.sa ? { sa: t.sa } : {}),
  }
}

// ---- shape primitives ----

export function rect(opts: {
  size: Prop<number[]>
  position?: Prop<number[]>
  roundness?: Prop<number>
}): ShapeItem {
  return {
    ty: 'rc',
    d: 1,
    s: opts.size,
    p: opts.position ?? val([0, 0], 3),
    r: opts.roundness ?? val(0, 4),
    nm: 'Rect',
  }
}

export function ellipse(opts: { size: Prop<number[]>; position?: Prop<number[]> }): ShapeItem {
  return {
    ty: 'el',
    d: 1,
    s: opts.size,
    p: opts.position ?? val([0, 0], 3),
    nm: 'Ellipse',
  }
}

export function fill(hex: string, opacity = 100): ShapeItem {
  const [r, g, b] = hexToRgb(hex)
  return {
    ty: 'fl',
    c: val([r, g, b, 1], 4),
    o: val(opacity, 5),
    r: 1,
    nm: 'Fill',
  }
}

export function stroke(hex: string, width: number, opacity = 100): ShapeItem {
  const [r, g, b] = hexToRgb(hex)
  return {
    ty: 'st',
    c: val([r, g, b, 1], 4),
    o: val(opacity, 5),
    w: val(width, 6),
    lc: 2, // round cap
    lj: 2, // round join
    ml: 4,
    nm: 'Stroke',
  }
}

interface GradientOpts {
  stops: GradientStop[]
  /** 1 linear, 2 radial */
  type?: 1 | 2
  start?: [number, number]
  end?: [number, number]
  opacity?: number
}

function gradientData(opts: GradientOpts) {
  const k = gradientStopsToLottie(opts.stops)
  return {
    s: val(opts.start ?? [-50, 0], 4),
    e: val(opts.end ?? [50, 0], 5),
    t: opts.type ?? 1,
    g: { p: opts.stops.length, k: val(k) },
  }
}

export function gradientFill(opts: GradientOpts): ShapeItem {
  return {
    ty: 'gf',
    ...gradientData(opts),
    o: val(opts.opacity ?? 100, 6),
    r: 1,
    nm: 'GradientFill',
  }
}

export function gradientStroke(opts: GradientOpts & { width: number }): ShapeItem {
  return {
    ty: 'gs',
    ...gradientData(opts),
    o: val(opts.opacity ?? 100, 6),
    w: val(opts.width, 7),
    lc: 2,
    lj: 2,
    ml: 4,
    nm: 'GradientStroke',
  }
}

/** trim path: s/e (0~100), o offset(deg) */
export function trimPath(opts: { s?: Prop<number>; e?: Prop<number>; o?: Prop<number> }): ShapeItem {
  return {
    ty: 'tm',
    s: opts.s ?? val(0, 1),
    e: opts.e ?? val(100, 2),
    o: opts.o ?? val(0, 3),
    m: 1,
    nm: 'TrimPath',
  }
}

/** 도형들을 그룹으로 묶고 트랜스폼 부여 */
export function group(items: ShapeItem[], tr?: Transform, nm = 'Group'): ShapeItem {
  return {
    ty: 'gr',
    it: [...items, tr ?? transform()],
    nm,
  }
}

let _ind = 0
export function resetInd() {
  _ind = 0
}

/** shape 레이어 (ty:4) */
export function shapeLayer(opts: {
  name?: string
  shapes: ShapeItem[]
  ks?: Transform
  ip: number
  op: number
  st?: number
}): Layer {
  return {
    ddd: 0,
    ind: ++_ind,
    ty: 4,
    nm: opts.name ?? 'Shape',
    sr: 1,
    ks: opts.ks ?? transform(),
    ao: 0,
    shapes: opts.shapes,
    ip: opts.ip,
    op: opts.op,
    st: opts.st ?? 0,
    bm: 0,
  }
}

/** image 레이어 (ty:2) refId로 asset 참조 */
export function imageLayer(opts: {
  name?: string
  refId: string
  ks?: Transform
  ip: number
  op: number
  st?: number
}): Layer {
  return {
    ddd: 0,
    ind: ++_ind,
    ty: 2,
    nm: opts.name ?? 'Image',
    refId: opts.refId,
    sr: 1,
    ks: opts.ks ?? transform(),
    ao: 0,
    ip: opts.ip,
    op: opts.op,
    st: opts.st ?? 0,
    bm: 0,
  }
}

// ===== Streak: path / glow / draw / stagger 헬퍼 =====

/** Lottie bezier path 데이터 (i/o = 정점 상대 탄젠트, v = 정점 절대좌표) */
export interface ShapeData {
  i: number[][]
  o: number[][]
  v: number[][]
  c: boolean
}

/** 정적 path shape (sh) */
export function pathShape(d: ShapeData, ix = 1): ShapeItem {
  return { ty: 'sh', d: 1, ix, ks: { a: 0, k: d }, nm: 'Path' }
}

/**
 * 애니메이션 path shape — variant(ShapeData) 들을 순환하며 morph.
 * ★ 모든 variant 의 정점 수가 동일해야 RN 에서 안전 (flamePathVariants 가 보장).
 * 마지막 키프레임 = 첫 variant 로 seamless loop.
 */
export function morphPathShape(variants: ShapeData[], period: number, ix = 1): ShapeItem {
  const seq = [...variants, variants[0]]
  const k = seq.map((d, idx) => ({
    t: Math.round((idx / variants.length) * period),
    s: [d],
    o: { x: [0.5], y: [0.5] },
    i: { x: [0.5], y: [0.5] },
  }))
  return { ty: 'sh', d: 1, ix, ks: { a: 1, k }, nm: 'MorphPath' }
}

/** Catmull-Rom 기반 자동 탄젠트로 닫힌 실루엣 path 생성 (정점 수 고정) */
function smoothClosed(v: number[][], tipSharpIndex = -1): ShapeData {
  const n = v.length
  const i: number[][] = []
  const o: number[][] = []
  for (let k = 0; k < n; k++) {
    const prev = v[(k - 1 + n) % n]
    const next = v[(k + 1) % n]
    const f = k === tipSharpIndex ? 0.05 : 1 / 6
    const ox = (next[0] - prev[0]) * f
    const oy = (next[1] - prev[1]) * f
    o.push([ox, oy])
    i.push([-ox, -oy])
  }
  return { i, o, v, c: true }
}

/**
 * 불꽃 실루엣 variant n개 (★고정 8 정점). amp = 출렁임 강도(0~1+).
 * sway(좌우 일렁임) / breathe(옆선 호흡) 를 한 주기로 순환시켜 seamless morph.
 */
export function flamePathVariants(n: number, opts: { w: number; h: number; amp: number }): ShapeData[] {
  const { w, h, amp } = opts
  const out: ShapeData[] = []
  for (let j = 0; j < n; j++) {
    const phase = (j / n) * Math.PI * 2
    const sway = Math.sin(phase) * amp
    const breathe = Math.sin(phase * 2) * amp
    const lick = Math.sin(phase + 0.6) * amp // 끝 날름거림
    const v = [
      [sway * w * 0.4, -h * 0.55 - lick * h * 0.06], // 0 tip (sharp)
      [w * (0.3 + breathe * 0.08) + sway * w * 0.2, -h * 0.1],
      [w * (0.5 + breathe * 0.12), h * 0.12],
      [w * 0.22, h * 0.42],
      [0, h * 0.45], // bottom
      [-w * 0.22, h * 0.42],
      [-w * (0.5 + breathe * 0.12), h * 0.12],
      [-w * (0.3 + breathe * 0.08) + sway * w * 0.2, -h * 0.1],
    ]
    out.push(smoothClosed(v, 0))
  }
  return out
}

/**
 * 가짜 글로우 — 반투명 radial gradient 타원 (blur 미사용, RN 안전).
 * 중심 불투명 -> 가장자리 투명. opacity 로 강도 조절.
 */
export function radialGlow(opts: { hex: string; opacity: number; size: number; ix?: number }): ShapeItem {
  const [r, g, b] = hexToRgb(opts.hex)
  // 색상 3스톱(동일색) + 알파 3스톱(1 -> 0.4 -> 0)
  const k = [0, r, g, b, 0.5, r, g, b, 1, r, g, b, 0, 1, 0.55, 0.4, 1, 0]
  return {
    ty: 'gf',
    o: val(opts.opacity, 6),
    r: 1,
    t: 2, // radial
    s: val([0, 0], 4),
    e: val([opts.size / 2, 0], 5),
    g: { p: 3, k: val(k) },
    nm: 'Glow',
  }
}

/**
 * trim path 로 그려지는 선(체크마크 등). points = 절대좌표 폴리라인(열린 path).
 * e 가 startFrame~endFrame 동안 0->100 으로 그려진다.
 */
export function drawStroke(opts: {
  points: number[][]
  hex: string
  width: number
  startFrame: number
  endFrame: number
  ix?: number
}): ShapeItem {
  const d: ShapeData = {
    v: opts.points,
    i: opts.points.map(() => [0, 0]),
    o: opts.points.map(() => [0, 0]),
    c: false,
  }
  return group(
    [
      pathShape(d, opts.ix ?? 1),
      trimPath({
        s: val(0, 1),
        e: anim(
          keyframes([
            { t: opts.startFrame, s: [0], ease: 'out' },
            { t: opts.endFrame, s: [100], ease: 'out' },
          ]),
          2,
        ),
      }),
      stroke(opts.hex, opts.width),
    ],
    transform(),
    'DrawStroke',
  )
}

/** 레이어들에 i*delayFrames 만큼 순차 시간 지연(stagger)을 적용 (키프레임 t 시프트) */
export function staggerLayers(layers: Layer[], delayFrames: number): Layer[] {
  return layers.map((l, i) => timeShiftLayer(l, i * delayFrames))
}

/** 레이어 내 모든 애니메이션 키프레임 t 를 delta 만큼 이동 (deep) */
export function timeShiftLayer<T>(layer: T, delta: number): T {
  if (delta === 0) return layer
  return shiftNode(structuredClone(layer), delta)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function shiftNode(node: any, delta: number): any {
  if (Array.isArray(node)) {
    node.forEach((n) => shiftNode(n, delta))
    return node
  }
  if (node && typeof node === 'object') {
    // 애니메이션 prop: { a:1, k:[{t,s,...}, ...] }
    if (node.a === 1 && Array.isArray(node.k) && node.k[0] && typeof node.k[0].t === 'number') {
      node.k.forEach((kf: { t: number }) => (kf.t += delta))
      return node // 키프레임 t 는 이 레벨에서만 존재 — 하위에 t 없음
    }
    for (const key of Object.keys(node)) {
      shiftNode(node[key], delta)
    }
  }
  return node
}

/** Lottie 루트 문서 */
export function root(opts: {
  name: string
  w: number
  h: number
  fr?: number
  op: number
  ip?: number
  layers: Layer[]
  assets?: LottieJSON['assets']
}): LottieJSON {
  return {
    v: '5.7.4',
    fr: opts.fr ?? 60,
    ip: opts.ip ?? 0,
    op: opts.op,
    w: opts.w,
    h: opts.h,
    nm: opts.name,
    ddd: 0,
    assets: opts.assets ?? [],
    layers: opts.layers,
  }
}
