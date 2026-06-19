import { useEffect, useRef } from 'react'
import lottie, { type AnimationItem } from 'lottie-web'
import type { LottieJSON } from '../lottie/types'

interface Props {
  json: LottieJSON
  /** true 면 재생, false 면 대표 프레임에서 정지 */
  playing: boolean
  /** 정지 시 보여줄 대표 프레임 */
  previewFrame: number
  /** 썸네일 배경 딤(어둡게) — 흰 그래픽 가시성용 */
  dim?: boolean
}

export function MiniPreview({ json, playing, previewFrame, dim = false }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const animRef = useRef<AnimationItem | null>(null)
  const playingRef = useRef(playing)
  playingRef.current = playing

  // 로드 (autoplay 없음 — 기본은 대표 프레임 정지)
  // ★ 카드당 Lottie 인스턴스는 항상 정확히 1개.
  //   생성 전후로 컨테이너를 비워 이전 SVG 잔존(고스팅)을 차단하고,
  //   cleanup 을 idempotent 하게 만들어 StrictMode 이중 마운트에도 안전.
  useEffect(() => {
    const container = ref.current
    if (!container) return

    // 혹시 남아있을 수 있는 이전 인스턴스/노드 정리 (재생성 전 비우기)
    if (animRef.current) {
      animRef.current.destroy()
      animRef.current = null
    }
    container.innerHTML = ''

    const anim = lottie.loadAnimation({
      container,
      renderer: 'svg',
      loop: true,
      autoplay: false,
      animationData: structuredClone(json),
      // 컨테이너에 맞춰 반응형 스케일 (고정 px 없이 100% + 비율 유지) → 박스 넘침 방지
      rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
    })
    animRef.current = anim
    const onReady = () => {
      if (playingRef.current) anim.play()
      else anim.goToAndStop(previewFrame, true)
    }
    anim.addEventListener('DOMLoaded', onReady)

    return () => {
      anim.removeEventListener('DOMLoaded', onReady)
      anim.destroy()
      // destroy 가 같은 인스턴스를 가리킬 때만 ref 해제 (idempotent)
      if (animRef.current === anim) animRef.current = null
      // 잔상 방지 — destroy 가 미처 제거 못 한 노드까지 정리
      container.innerHTML = ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [json])

  // 재생/정지 토글
  useEffect(() => {
    const anim = animRef.current
    if (!anim) return
    if (playing) anim.play()
    else anim.goToAndStop(previewFrame, true)
  }, [playing, previewFrame])

  // svg 가 컨테이너를 넘지 않도록 block + 100% (lottie 가 svg 에 100% 지정하지만 보강)
  // dim: 흰 그래픽 가시성용 어두운 배경(다운로드 JSON 과 무관)
  return (
    <div
      ref={ref}
      className={`h-full w-full overflow-hidden [&>svg]:block [&>svg]:h-full [&>svg]:w-full ${dim ? 'rounded-md bg-gray-800' : ''}`}
    />
  )
}
