import { useEffect, useRef, useState } from 'react'
import lottie, { type AnimationItem } from 'lottie-web'
import type { LottieJSON } from '../lottie/types'

interface Props {
  json: LottieJSON
  loop?: boolean
  /** 웹 프리뷰 배경 딤(어둡게) — 흰 그래픽 가시성용 */
  dim?: boolean
}

export function PreviewCanvas({ json, loop = true, dim = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<AnimationItem | null>(null)
  const [playing, setPlaying] = useState(true)
  const [frame, setFrame] = useState(0)
  const [total, setTotal] = useState(0)
  const scrubbingRef = useRef(false)

  // JSON 변경 시 애니메이션 재생성 (현재 프레임/재생상태 유지)
  useEffect(() => {
    if (!containerRef.current) return
    const prevFrame = animRef.current?.currentFrame ?? 0
    const wasPlaying = playing

    animRef.current?.destroy()
    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop,
      autoplay: wasPlaying,
      animationData: structuredClone(json),
    })
    animRef.current = anim

    const onReady = () => {
      const t = anim.getDuration(true)
      setTotal(t)
      const startFrame = Math.min(prevFrame, t - 1)
      if (!wasPlaying) anim.goToAndStop(startFrame, true)
    }
    anim.addEventListener('DOMLoaded', onReady)

    const onEnter = () => {
      if (!scrubbingRef.current) setFrame(anim.currentFrame)
    }
    anim.addEventListener('enterFrame', onEnter)

    return () => {
      anim.removeEventListener('DOMLoaded', onReady)
      anim.removeEventListener('enterFrame', onEnter)
      anim.destroy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [json])

  const togglePlay = () => {
    const anim = animRef.current
    if (!anim) return
    if (playing) {
      anim.pause()
      setPlaying(false)
    } else {
      anim.play()
      setPlaying(true)
    }
  }

  const onScrub = (v: number) => {
    scrubbingRef.current = true
    setFrame(v)
    animRef.current?.goToAndStop(v, true)
    if (playing) setPlaying(false)
    animRef.current?.pause()
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6">
      <div
        ref={containerRef}
        className={`flex aspect-square w-full max-w-md items-center justify-center overflow-hidden rounded-3xl ${dim ? 'bg-gray-800' : 'bg-gray-100'}`}
      />
      <div className="flex w-full max-w-md items-center gap-3">
        <button
          onClick={togglePlay}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-700"
          title={playing ? '일시정지' : '재생'}
        >
          {playing ? '❚❚' : '▶'}
        </button>
        <input
          type="range"
          min={0}
          max={Math.max(0, total - 1)}
          step={0.1}
          value={frame}
          onChange={(e) => onScrub(Number(e.target.value))}
          onMouseUp={() => (scrubbingRef.current = false)}
          className="flex-1 accent-brand"
        />
        <span className="w-16 text-right text-xs tabular-nums text-gray-400">
          {Math.round(frame)}/{Math.round(total)}
        </span>
      </div>
    </div>
  )
}
