// loading-orbit 3D → 2D 벡터 베이크
// 전략: 웹 프리뷰가 쓰는 lottie-web 을 ground-truth 로 삼아, 각 프레임마다 각 레이어의
// 최종 2D affine(부모 null 누적 포함)을 추출해 path 코너점·그라디언트 점을 절대좌표로 굽는다.
// → 레이어 변환은 항등(2D), 형태/그라디언트가 절대좌표 애니메이션으로 박힘 → 웹과 픽셀 동일, RN 순수 2D.
//
// 입력: src/lottie/sources/loading-orbit.src3d.json (Tint 베이크된 3D 원본)
// 출력: src/lottie/sources/loading-orbit.json (RN 안전 2D)
import { JSDOM } from 'jsdom'
import fs from 'fs'

const IN = 'src/lottie/sources/loading-orbit.src3d.json'
const OUT = 'src/lottie/sources/loading-orbit.json'

const dom = new JSDOM('<!DOCTYPE html><html><body><div id="c"></div></body></html>', { pretendToBeVisual: true })
const { window } = dom
window.HTMLCanvasElement.prototype.getContext = function () {
  let fsv = 'rgba(0,0,0,0)'
  return { get fillStyle() { return fsv }, set fillStyle(v) { fsv = v }, fillRect() {}, clearRect() {}, beginPath() {}, fill() {}, save() {}, restore() {} }
}
globalThis.window = window
globalThis.document = window.document
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 16)
globalThis.cancelAnimationFrame = clearTimeout

const lottie = (await import('lottie-web')).default

const src = JSON.parse(fs.readFileSync(IN, 'utf8'))

// opacity 를 임시로 100 고정 → lottie 가 매 프레임 모든 레이어 변환을 갱신(숨김 스킵 방지). geometry 는 opacity 와 무관.
const probe = JSON.parse(JSON.stringify(src))
for (const L of probe.layers) {
  if (L.ks) L.ks.o = { a: 0, k: 100, ix: 11 }
}

const container = document.getElementById('c')
const anim = lottie.loadAnimation({ container, renderer: 'svg', loop: false, autoplay: false, animationData: probe })
const TF = anim.totalFrames // 297
const ip = Math.round(src.ip)

// affine from finalTransform.mat.props: a=p0 b=p1 c=p4 d=p5 e=p12 f=p13
const matOf = (el) => {
  const p = el.finalTransform.mat.props
  return [p[0], p[1], p[4], p[5], p[12], p[13]]
}
const r2 = (n) => Math.round(n * 100) / 100
const applyPt = (M, x, y) => [r2(M[0] * x + M[2] * y + M[4]), r2(M[1] * x + M[3] * y + M[5])] // full (point)
const applyVec = (M, x, y) => [r2(M[0] * x + M[2] * y), r2(M[1] * x + M[3] * y)] // linear (tangent)

// ind -> element 매핑
const elByInd = {}
for (const el of anim.renderer.elements) elByInd[el.data.ind] = el

// 각 ty4 레이어의 path/gradient 위치를 프레임별로 수집
// matrices[ind][frame] = affine
const frames = []
for (let f = 0; f < TF; f++) {
  anim.goToAndStop(ip + f, true)
  const snap = {}
  for (const L of src.layers) {
    if (L.ty !== 4) continue
    const el = elByInd[L.ind]
    snap[L.ind] = matOf(el)
  }
  frames.push(snap)
}

// 헬퍼: shapes 트리에서 첫 sh(path), 모든 gf 수집
function findPathAndGrads(shapes) {
  let path = null
  const grads = []
  const walk = (it) => {
    for (const s of it) {
      if (s.ty === 'sh' && !path) path = s
      if (s.ty === 'gf') grads.push(s)
      if (s.ty === 'gr') walk(s.it)
    }
  }
  walk(shapes)
  return { path, grads }
}

const LINEAR = () => ({ i: { x: [1], y: [1] }, o: { x: [0], y: [0] } })

// 출력 레이어 구성
const outLayers = []
for (const L of src.layers) {
  if (L.ty !== 4) continue // null(ind1) 등 제거 (parent 미사용)
  const { path, grads } = findPathAndGrads(L.shapes)
  const base = path.ks.k // {c,i,o,v}

  // path 애니메이션 키프레임
  const pkeys = []
  // gradient 별 s/e 키프레임
  const gkeys = grads.map(() => ({ s: [], e: [] }))

  for (let f = 0; f < TF; f++) {
    const M = frames[f][L.ind]
    const np = {
      c: base.c,
      v: base.v.map(([x, y]) => applyPt(M, x, y)),
      i: base.i.map(([x, y]) => applyVec(M, x, y)),
      o: base.o.map(([x, y]) => applyVec(M, x, y)),
    }
    pkeys.push({ ...LINEAR(), t: f, s: [np] })
    grads.forEach((g, gi) => {
      const sp = applyPt(M, g.s.k[0], g.s.k[1])
      const ep = applyPt(M, g.e.k[0], g.e.k[1])
      gkeys[gi].s.push({ ...LINEAR(), t: f, s: sp })
      gkeys[gi].e.push({ ...LINEAR(), t: f, s: ep })
    })
  }

  // path 를 애니메이션으로 교체
  path.ks = { a: 1, k: pkeys, ix: path.ks.ix || 2 }
  // gradient 점을 애니메이션으로 교체
  grads.forEach((g, gi) => {
    g.s = { a: 1, k: gkeys[gi].s, ix: g.s.ix || 5 }
    g.e = { a: 1, k: gkeys[gi].e, ix: g.e.ix || 6 }
  })

  // 레이어 변환 → 2D 항등 (opacity 는 원본 유지)
  const o = L.ks.o
  L.ddd = 0
  L.ks = {
    a: { a: 0, k: [0, 0], ix: 1 },
    p: { a: 0, k: [0, 0], ix: 2 },
    s: { a: 0, k: [100, 100], ix: 6 },
    r: { a: 0, k: 0, ix: 10 },
    o,
    sk: { a: 0, k: 0 },
    sa: { a: 0, k: 0 },
  }
  delete L.parent
  L.ef = []
  outLayers.push(L)
}

const out = {
  v: src.v,
  fr: src.fr,
  ip: src.ip,
  op: src.op,
  w: src.w,
  h: src.h,
  nm: src.nm,
  ddd: 0,
  assets: src.assets || [],
  layers: outLayers,
}

fs.writeFileSync(OUT, JSON.stringify(out))
const kb = (fs.statSync(OUT).size / 1024).toFixed(0)
console.log(`baked ${outLayers.length} layers × ${TF} frames → ${OUT} (${kb} KB)`)

// 3D 잔재 검증
const has3d = JSON.stringify(out).match(/"ddd":1|"ry":|"rx":|"or":\{/g)
console.log('3D residue:', has3d ? has3d.length : 0)
process.exit(0)
