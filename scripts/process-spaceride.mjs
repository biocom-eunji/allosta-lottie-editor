// Space Ride.json → src/lottie/sources/space-ride.json
//  · 행성 삭제: Purple 토성(44,45,46,47) / 지구(49,56) / 달=깜빡이는 회색 점(48,50) / 소행성+점구름(51,52,53,54,55)
//  · 배경 별(57) + 보라색 줄무늬 cky lines(58) 삭제
//  · 배경(59)을 딤 단색으로 교체. 미사용 asset(comp_2/3) 제거.
//  · 유지(뭉게구름 원복): 로켓(2,3,6,7), 연기 S1 점(8~39)+Right smoke(40,comp_1)+smoke base(43)
import fs from 'fs'
const IN = 'Space Ride.json'
const OUT = 'src/lottie/sources/space-ride.json'
const BG_HEX = '#1E2939' // Tailwind gray-800 (= image-swipe 프리뷰 딤 배경 bg-gray-800)

const hexToRgb = (h) => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255]

const d = JSON.parse(fs.readFileSync(IN, 'utf8'))
const comp0 = d.assets.find((a) => a.id === 'comp_0')

// 삭제 대상 ind: 행성(달=깜빡 회색점 포함) + 별 + 보라 줄무늬
const DEL = new Set([44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58])
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

// ── 기우는(tilt) 모션 제거 + 루프 크롭 ──
// 분석(자기유사도): 연기는 누적형 1-pass라 긴 루프 불가, 최적 루프 = START 135 / 길이 35f(플레임 1주기).
const START = 135
const P = 35

// 애니메이션 prop 선형 샘플
const sampleProp = (pr, t) => {
  const k = pr.k
  if (t <= k[0].t) return k[0].s
  if (t >= k[k.length - 1].t) return k[k.length - 1].s
  for (let i = 0; i < k.length - 1; i++) {
    if (t >= k[i].t && t <= k[i + 1].t) {
      const u = (t - k[i].t) / ((k[i + 1].t - k[i].t) || 1)
      return k[i].s.map((v, j) => v + (k[i + 1].s[j] - v) * u)
    }
  }
  return k[k.length - 1].s
}
// ind2(Rockit) 날개/그룹 tilt(p 애니메이션)를 START 시점 포즈로 freeze
const freezeTilt = (it) => {
  for (const s of it) {
    if (s.ty === 'tr' && s.p && s.p.a === 1) s.p = { a: 0, k: sampleProp(s.p, START), ix: s.p.ix || 2 }
    if (s.ty === 'gr') freezeTilt(s.it)
  }
}
const L2 = comp0.layers.find((L) => L.ind === 2)
if (L2 && L2.shapes) freezeTilt(L2.shapes)

// 시간 시프트: 키프레임 t + 레이어 ip/op/st 를 -START
const shiftTimes = (node, delta) => {
  if (Array.isArray(node)) { node.forEach((n) => shiftTimes(n, delta)); return }
  if (node && typeof node === 'object') {
    if (node.a === 1 && Array.isArray(node.k) && node.k[0] && typeof node.k[0].t === 'number') {
      node.k.forEach((kf) => (kf.t += delta)); return
    }
    for (const k of Object.keys(node)) shiftTimes(node[k], delta)
  }
}
for (const L of comp0.layers) {
  shiftTimes(L.ks, -START)
  if (L.shapes) shiftTimes(L.shapes, -START)
  if (typeof L.ip === 'number') L.ip -= START
  if (typeof L.op === 'number') L.op -= START
  if (typeof L.st === 'number') L.st -= START
}
// 루프 경계
const main = d.layers[0]
main.ip = 0; main.op = P; main.st = 0
d.ip = 0; d.op = P

fs.writeFileSync(OUT, JSON.stringify(d))
console.log(`space-ride: comp_0 layers ${before}→${comp0.layers.length}, assets→${d.assets.length} [${d.assets.map((a) => a.id)}]`)
console.log(`tilt freeze(ind2) + 루프 크롭: op ${353}→${P}f (START=${START})`)
console.log('kept layers:', comp0.layers.map((L) => `${L.ind}:${L.nm}`).join(' | '))
