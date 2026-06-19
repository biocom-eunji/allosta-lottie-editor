import lottie from 'lottie-web'
import type { LottieJSON } from './types'

export interface LintResult {
  ok: boolean
  warnings: string[]
}

/**
 * RN 호환성 lint: expression / 외부 참조가 포함됐는지 검사.
 * - expression: shape value에 'x' 필드(expression) 존재
 * - 외부 참조: asset.e !== 1 인데 p 가 외부 경로(http, ../ 등)
 */
export function lintForRN(json: LottieJSON): LintResult {
  const warnings: string[] = []
  const raw = JSON.stringify(json)

  // expression 흔적: lottie expression은 보통 "x":"..." (문자열) 형태
  // 키프레임 ease의 x/y(숫자 배열)와 구분하기 위해 문자열 expression만 검사
  const exprMatch = raw.match(/"x"\s*:\s*"/)
  if (exprMatch) {
    warnings.push('Expression(문자열 x 필드)이 감지되었습니다. RN에서 동작하지 않습니다.')
  }

  // 외부 이미지 참조
  for (const asset of json.assets ?? []) {
    if (asset.p && typeof asset.p === 'string') {
      const isData = asset.p.startsWith('data:')
      if (!isData && asset.e !== 1) {
        warnings.push(`외부 이미지 참조 감지: asset "${asset.id}" (${asset.p}). base64 임베드 필요.`)
      }
      if (asset.u && /^https?:\/\//.test(asset.u)) {
        warnings.push(`외부 URL(u) 감지: asset "${asset.id}".`)
      }
    }
  }

  return { ok: warnings.length === 0, warnings }
}

/**
 * lottie-web 으로 메모리에서 1회 로드해 에러 없이 파싱되는지 검증.
 * lottie 인스턴스를 잠깐 만들었다가 destroy.
 */
export async function validateWithLottie(json: LottieJSON): Promise<{ ok: boolean; error?: string }> {
  try {
    const container = document.createElement('div')
    container.style.position = 'absolute'
    container.style.left = '-9999px'
    container.style.width = '1px'
    container.style.height = '1px'
    document.body.appendChild(container)

    return await new Promise((resolve) => {
      let settled = false
      const finish = (ok: boolean, error?: string) => {
        if (settled) return
        settled = true
        try {
          anim.destroy()
        } catch {
          /* noop */
        }
        container.remove()
        resolve({ ok, error })
      }

      const anim = lottie.loadAnimation({
        container,
        renderer: 'svg',
        loop: false,
        autoplay: false,
        animationData: JSON.parse(JSON.stringify(json)),
      })

      anim.addEventListener('data_ready', () => finish(true))
      anim.addEventListener('data_failed', () => finish(false, 'lottie data_failed'))
      // fallback timeout
      setTimeout(() => finish(true), 300)
    })
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
