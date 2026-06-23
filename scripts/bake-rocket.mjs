// Rocket.json → src/lottie/sources/rocket.json (RN 안전화)
//  · expression loopOut('cycle') → 키프레임 반복으로 베이크 후 .x 제거
//  · 이펙트(ef) 전부 제거 (wiggle 컨트롤은 참조 없음=미사용)
import fs from 'fs'
const IN = 'Rocket.json'
const OUT = 'src/lottie/sources/rocket.json'
const TARGET = 160 // 루프 확장 한계(>maxop 132, >main op 110)

const d = JSON.parse(fs.readFileSync(IN, 'utf8'))
let baked = 0, removed = 0, eff = 0

function bakeProp(prop) {
  if (!prop || typeof prop.x !== 'string') return
  const isLoop = /loopOut/.test(prop.x)
  if (isLoop && prop.a === 1 && Array.isArray(prop.k) && prop.k.length >= 2 && typeof prop.k[0].t === 'number') {
    const base = prop.k.slice()
    const first = base[0].t, last = base[base.length - 1].t
    const period = last - first
    if (period > 0) {
      let shift = period
      while (first + shift < TARGET) {
        for (let i = 1; i < base.length; i++) {
          const kf = structuredClone(base[i])
          kf.t = base[i].t + shift
          prop.k.push(kf)
        }
        shift += period
      }
      baked++
    }
  }
  delete prop.x // expression 제거
  removed++
}

function walk(o) {
  if (Array.isArray(o)) { o.forEach(walk); return }
  if (o && typeof o === 'object') {
    if (typeof o.x === 'string') bakeProp(o)
    for (const k of Object.keys(o)) if (k !== 'x') walk(o[k])
  }
}

const clearEf = (layers) => { for (const L of layers || []) if (L.ef && L.ef.length) { L.ef = []; eff++ } }

walk(d.layers)
clearEf(d.layers)
for (const a of d.assets || []) { walk(a.layers || []); clearEf(a.layers) }

// ── 배경색 교체 + 정사각형(600x600) 프레임 ──
const BG_HEX = '#1E2939' // space-ride 딤 배경(Tailwind gray-800)과 동일
const hexToRgb = (h) => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255]
const [br, bg, bb] = hexToRgb(BG_HEX)
const bgLayer = d.layers.find((L) => /bg/i.test(L.nm || ''))
if (bgLayer && bgLayer.shapes) {
  const w = (it) => { for (const s of it) { if (s.ty === 'fl' && s.c) s.c = { a: 0, k: [br, bg, bb, 1], ix: s.c.ix || 4 }; if (s.ty === 'gr') w(s.it) } }
  w(bgLayer.shapes)
}
// 가로 800→600 으로 트림하며 콘텐츠를 중앙(x 400→300)으로: 최상위(부모없는) 레이어 x -100
const DX = -100
const shiftX = (L, dx) => {
  const p = L.ks && L.ks.p
  if (!p) return
  if (p.s) { // split x/y
    if (p.x) { if (p.x.a === 0) p.x.k += dx; else p.x.k.forEach((kf) => { if (Array.isArray(kf.s)) kf.s[0] += dx; else kf.s += dx }) }
  } else if (p.a === 0) { p.k[0] += dx } else { p.k.forEach((kf) => { if (Array.isArray(kf.s)) kf.s[0] += dx }) }
}
for (const L of d.layers) if (!L.parent) shiftX(L, DX)
d.w = 600 // h 는 이미 600 → 정사각형

fs.writeFileSync(OUT, JSON.stringify(d))
console.log(`rocket: loopOut baked=${baked}, expr removed=${removed}, ef cleared=${eff}`)
const raw = fs.readFileSync(OUT, 'utf8')
console.log('residual expr(x:str):', (raw.match(/"x":"[^"]/g) || []).length, 'loopOut:', (raw.match(/loopOut/g) || []).length)
