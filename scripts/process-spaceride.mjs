// Space Ride.json → src/lottie/sources/space-ride.json
//  · 행성 삭제: Purple 토성(44,45,46,47) / 지구·달(48,49,50,56) / 소행성+점구름(51,52,53,54,55)
//  · 연기 회색 점 삭제: S 1 Outlines 점들(8~39) + Right smoke(40, comp_1)
//  · 배경(59)을 딤 단색으로 교체. 미사용 asset(comp_1/2/3) 제거.
//  · 유지: 로켓(2,3,6,7), 뭉게구름 본체 smoke base(43), 별(57), 스피드라인(58)
import fs from 'fs'
const IN = 'Space Ride.json'
const OUT = 'src/lottie/sources/space-ride.json'
const BG_HEX = '#2C2E32' // Mono/Neutral-800 (딤 단색)

const hexToRgb = (h) => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255]

const d = JSON.parse(fs.readFileSync(IN, 'utf8'))
const comp0 = d.assets.find((a) => a.id === 'comp_0')

// 삭제 대상 ind
const DEL = new Set([40, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56])
for (let i = 8; i <= 39; i++) DEL.add(i) // S 1 Outlines 점들
const before = comp0.layers.length
comp0.layers = comp0.layers.filter((L) => !DEL.has(L.ind))

// 배경 리컬러 (ind59)
const [r, g, b] = hexToRgb(BG_HEX)
const bg = comp0.layers.find((L) => L.ind === 59)
const recolor = (it) => { for (const s of it) { if (s.ty === 'fl' && s.c) s.c = { a: 0, k: [r, g, b, 1], ix: s.c.ix || 4 }; if (s.ty === 'gr') recolor(s.it) } }
if (bg && bg.shapes) recolor(bg.shapes)

// 미사용 asset 제거 (comp_1/2/3)
const usedRefs = new Set()
const collectRefs = (layers) => { for (const L of layers) if (L.refId) usedRefs.add(L.refId) }
collectRefs(d.layers)
collectRefs(comp0.layers)
d.assets = d.assets.filter((a) => a.id === 'comp_0' || usedRefs.has(a.id))

fs.writeFileSync(OUT, JSON.stringify(d))
console.log(`space-ride: comp_0 layers ${before}→${comp0.layers.length}, assets→${d.assets.length} [${d.assets.map((a) => a.id)}]`)
console.log('kept layers:', comp0.layers.map((L) => `${L.ind}:${L.nm}`).join(' | '))
