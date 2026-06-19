import { getToken, hexToRgb } from '../../tokens/colors'
import source from '../sources/image-scan.json'
import { applySpeed, loadDoc } from './confettiSource'
import type { ColorValue, Params } from '../controls'
import type { LottieJSON } from '../types'

// image-scan — QR/매트릭스 스캔 Lottie (소스 기반). 스캔 바·트레일 색과 속도만 override.
// 소스: LottieFiles "Scan matrix" (expression/effect/외부이미지 없음 → RN 호환).

const SRC_FR = 30
// 소스 스캔 바/트레일의 teal 색 (이 색만 scanColor 로 치환 — 매트릭스 점/그리드는 유지)
const TEAL: [number, number, number] = [0.137254901961, 0.898039215686, 0.858823529412]

export interface ImageScanParams extends Params {
  scanColor: ColorValue
  speed: number // 50~200 (%)
}

export const imageScanDefaults: ImageScanParams = {
  scanColor: { mode: 'solid', hex: getToken('Accent/Cyan-300'), opacity: 100 },
  speed: 100,
}

const near = (a: number, b: number) => Math.abs(a - b) < 0.06
const isTeal = (c: number[]) => near(c[0], TEAL[0]) && near(c[1], TEAL[1]) && near(c[2], TEAL[2])

/** 스캔 바(fl) + 트레일(gf 그라디언트)의 teal 을 scanColor 로 치환 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function recolorScan(items: any[], rgb: [number, number, number]) {
  for (const it of items) {
    if (it.ty === 'gr' && Array.isArray(it.it)) recolorScan(it.it, rgb)
    else if (it.ty === 'fl' && it.c?.a === 0 && isTeal(it.c.k)) {
      it.c.k = [rgb[0], rgb[1], rgb[2], it.c.k[3] ?? 1]
    } else if (it.ty === 'gf' && it.g?.k?.k) {
      const k: number[] = it.g.k.k
      const stops: number = it.g.p
      for (let i = 0; i < stops; i++) {
        const o = i * 4
        if (isTeal([k[o + 1], k[o + 2], k[o + 3]])) {
          k[o + 1] = rgb[0]
          k[o + 2] = rgb[1]
          k[o + 3] = rgb[2]
        }
      }
    }
  }
}

export function generateImageScan(p: ImageScanParams): LottieJSON {
  const doc = loadDoc(source)
  const rgb = hexToRgb(p.scanColor.hex) as [number, number, number]

  // 루트 레이어 + comp 레이어 전체의 shapes 재색
  const recolorLayers = (layers: { shapes?: unknown[] }[]) => {
    for (const l of layers) if (Array.isArray(l.shapes)) recolorScan(l.shapes as unknown[], rgb)
  }
  recolorLayers(doc.layers as { shapes?: unknown[] }[])
  for (const a of doc.assets) if (Array.isArray(a.layers)) recolorLayers(a.layers as { shapes?: unknown[] }[])

  applySpeed(doc, SRC_FR, p.speed)
  return doc
}
