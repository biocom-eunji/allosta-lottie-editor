import type { LottieJSON } from '../lottie/types'
import { lintForRN, validateWithLottie } from '../lottie/validate'

export interface DownloadResult {
  ok: boolean
  warnings: string[]
  error?: string
}

/**
 * 현재 JSON을 검증 후 {id}.json 으로 저장.
 * - lottie-web 로 메모리 로드 검증
 * - RN lint (expression/외부참조)
 */
export async function downloadLottie(id: string, json: LottieJSON): Promise<DownloadResult> {
  const lint = lintForRN(json)
  const validity = await validateWithLottie(json)

  if (!validity.ok) {
    return { ok: false, warnings: lint.warnings, error: validity.error ?? '유효성 검증 실패' }
  }

  const blob = new Blob([JSON.stringify(json)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${id}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)

  return { ok: true, warnings: lint.warnings }
}
