// Blooming Lotus.json (Flow 6) → bloom-burst.json
//  ① petal(Rectangle 1~7 = ind4~10)만 유지, 흰패널/라인/배경 제거
//  ② #00B7C4 → Light Blue 토큰 리컬러 (저투명 20% 유지)
//  ③ 리타임 180f→90f (3s→1.5s one-shot)
//  ④ headless lottie-web 으로 렌더 union bbox 측정 → 불꽃 중심 정렬용 변환값 산출
import { JSDOM } from 'jsdom'
import fs from 'fs'

const IN = 'Blooming Lotus.json'
const OUT = 'src/lottie/sources/bloom-burst.json'
const KEEP = [4, 5, 6, 7, 8, 9, 10] // Rectangle 3,7,6,5,4,2,1 = 7 petals
const RETIME = 0.5 // 180 → 90
const BLOOM_HEX = '#45C4FF' // Accent/Light Blue-300

const hexToRgb = (h) => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255]

const src = JSON.parse(fs.readFileSync(IN, 'utf8'))
const [br, bg, bb] = hexToRgb(BLOOM_HEX)

// 리타임 헬퍼: 모든 애니메이션 키프레임 t 스케일
const retime = (node) => {
  if (Array.isArray(node)) { node.forEach(retime); return }
  if (node && typeof node === 'object') {
    if (node.a === 1 && Array.isArray(node.k) && node.k[0] && typeof node.k[0].t === 'number') {
      node.k.forEach((kf) => (kf.t = Math.round(kf.t * RETIME)))
    }
    for (const k of Object.keys(node)) retime(node[k])
  }
}
// 리컬러 헬퍼: 모든 fl 색을 블룸색으로
const recolor = (node) => {
  if (Array.isArray(node)) { node.forEach(recolor); return }
  if (node && typeof node === 'object') {
    if (node.ty === 'fl' && node.c) node.c = { a: 0, k: [br, bg, bb, 1], ix: node.c.ix || 4 }
    for (const k of Object.keys(node)) recolor(node[k])
  }
}

const layers = src.layers.filter((L) => KEEP.includes(L.ind))
for (const L of layers) {
  delete L.parent
  L.ef = []
  retime(L.ks)
  if (L.shapes) { retime(L.shapes); recolor(L.shapes) }
  L.op = Math.round(L.op * RETIME)
  L.ip = Math.round(L.ip * RETIME)
}

const out = {
  v: src.v, fr: src.fr, ip: 0, op: Math.round(src.op * RETIME),
  w: src.w, h: src.h, nm: 'bloom-burst', ddd: 0, assets: [], layers,
}
fs.writeFileSync(OUT, JSON.stringify(out))
console.log(`bloom-burst: ${layers.length} petals, op=${out.op}f, color=${BLOOM_HEX}`)

// ── headless 렌더 union bbox 측정 ──
const dom = new JSDOM('<!DOCTYPE html><body><div id="c"></div></body>', { pretendToBeVisual: true })
const { window } = dom
window.HTMLCanvasElement.prototype.getContext = function () { let f = 'rgba(0,0,0,0)'; return { get fillStyle() { return f }, set fillStyle(v) { f = v }, fillRect() {}, clearRect() {}, beginPath() {}, fill() {}, save() {}, restore() {} } }
globalThis.window = window; globalThis.document = window.document
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 16); globalThis.cancelAnimationFrame = clearTimeout
const lottie = (await import('lottie-web')).default
const anim = lottie.loadAnimation({ container: document.getElementById('c'), renderer: 'svg', loop: false, autoplay: false, animationData: JSON.parse(JSON.stringify(out)) })
const elByInd = {}; for (const el of anim.renderer.elements) elByInd[el.data.ind] = el
const matOf = (el) => { const p = el.finalTransform.mat.props; return [p[0], p[1], p[4], p[5], p[12], p[13]] }
const localV = (L) => { let r = null; const w = (it) => { for (const s of it) { if (s.ty === 'sh' && !r) r = (s.ks.a === 0 ? s.ks.k : s.ks.k[0].s[0]).v; if (s.ty === 'gr') w(s.it) } }; w(L.shapes); return r }
let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9
for (let f = 0; f <= out.op; f += 3) {
  anim.goToAndStop(f, true)
  for (const L of layers) {
    const M = matOf(elByInd[L.ind]); const vs = localV(L)
    for (const [x, y] of vs) { const X = M[0] * x + M[2] * y + M[4], Y = M[1] * x + M[3] * y + M[5]; minx = Math.min(minx, X); maxx = Math.max(maxx, X); miny = Math.min(miny, Y); maxy = Math.max(maxy, Y) }
  }
}
const bcx = (minx + maxx) / 2, bcy = (miny + maxy) / 2
console.log(`union bbox: x[${minx.toFixed(0)}..${maxx.toFixed(0)}] y[${miny.toFixed(0)}..${maxy.toFixed(0)}]`)
console.log(`center=(${bcx.toFixed(1)}, ${bcy.toFixed(1)}) size=${(maxx - minx).toFixed(0)}x${(maxy - miny).toFixed(0)}`)
process.exit(0)
