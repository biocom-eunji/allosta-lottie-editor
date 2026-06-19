// 디자인 시스템 토큰 정규화 (robust).
// 입력: src/tokens/system-tokens.json  (Figma export — 끝부분이 여분 중괄호로 깨져 있음)
// 출력: src/tokens/system-tokens.gen.json  (평탄한 TokenColor[])
//
// ★ JSON.parse 에 의존하지 않는다 (파일이 깨져 있으므로).
//   들여쓰기 기반 라인 스캐너로 "$type":"color" 토큰만 추출:
//     - 최상위 키(2칸 들여쓰기) = 컬렉션 (Mono/WHBK/Brand/Semantic/Accent)
//     - 토큰 키(4칸 들여쓰기) = 토큰명 ("Mint-400" 등)
//     - 토큰 내부에서 hex / alpha / scopes 수집
//   깨진 꼬리( 여분 } 등 )는 어떤 패턴에도 안 맞아 자동 무시됨.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SRC = path.join(ROOT, 'src/tokens/system-tokens.json')
const OUT = path.join(ROOT, 'src/tokens/system-tokens.gen.json')

const COLLECTION_ORDER = ['Mono', 'WHBK', 'Brand', 'Semantic', 'Accent']

/** "green-300" / "Light Blue-500" / "Mint-400" -> "Green 300" / "Light Blue 500" / "Mint 400" */
function toLabel(name) {
  return name
    .replace(/-/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (/^\d+$/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join(' ')
}

/** 패밀리 = 라벨에서 끝 숫자(scale) 제거. "Green 300" -> "Green", "White" -> "White" */
function toFamily(label) {
  return label.replace(/\s+\d+$/, '').trim() || label
}

function normalize(raw) {
  const lines = raw.split(/\r?\n/)
  const tokens = []
  let collection = null
  let cur = null
  let inScopes = false

  const flush = () => {
    if (cur && cur.hex) tokens.push(cur)
    cur = null
  }

  for (const line of lines) {
    // 최상위 컬렉션 (2칸 들여쓰기)
    let m = line.match(/^ {2}"([^"]+)":\s*\{\s*$/)
    if (m) {
      flush()
      collection = m[1].startsWith('$') ? null : m[1]
      continue
    }
    // 토큰명 (4칸 들여쓰기)
    m = line.match(/^ {4}"([^"]+)":\s*\{\s*$/)
    if (m && collection) {
      flush()
      const label = toLabel(m[1])
      cur = { collection, name: m[1], label, family: toFamily(label), hex: '', alpha: 1, scopes: [] }
      inScopes = false
      continue
    }
    if (!cur) continue
    const hex = line.match(/"hex":\s*"(#[0-9A-Fa-f]{3,8})"/)
    if (hex) {
      cur.hex = hex[1].toUpperCase()
      continue
    }
    const alpha = line.match(/"alpha":\s*([0-9.]+)/)
    if (alpha) {
      cur.alpha = parseFloat(alpha[1])
      continue
    }
    if (/"com\.figma\.scopes"/.test(line)) {
      inScopes = true
      continue
    }
    if (inScopes) {
      const s = line.match(/"([A-Z_]+)"/)
      if (s) cur.scopes.push(s[1])
      if (/\]/.test(line)) inScopes = false
    }
  }
  flush()

  // 컬렉션 → 패밀리 → scale(숫자) 순 정렬
  const scaleOf = (label) => {
    const mm = label.match(/(\d+)\s*$/)
    return mm ? parseInt(mm[1], 10) : -1
  }
  tokens.sort((a, b) => {
    const ci = COLLECTION_ORDER.indexOf(a.collection) - COLLECTION_ORDER.indexOf(b.collection)
    if (ci !== 0) return ci
    if (a.family !== b.family) return a.family.localeCompare(b.family)
    return scaleOf(a.label) - scaleOf(b.label)
  })
  return tokens
}

const raw = fs.readFileSync(SRC, 'utf8')
const tokens = normalize(raw)
if (tokens.length === 0) {
  console.error('normalize-tokens: 추출된 토큰이 0개입니다. 입력 파일을 확인하세요.')
  process.exit(1)
}
fs.writeFileSync(OUT, JSON.stringify(tokens, null, 2) + '\n')

const byCol = {}
for (const t of tokens) byCol[t.collection] = (byCol[t.collection] || 0) + 1
console.log(`normalize-tokens: ${tokens.length} tokens →`, OUT)
console.log('  collections:', JSON.stringify(byCol))
