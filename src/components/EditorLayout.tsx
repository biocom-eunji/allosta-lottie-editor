import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getAnimation } from '../lottie/registry'
import { useEditorStore } from '../store/editorStore'
import { PreviewCanvas } from './PreviewCanvas'
import { PropertyPanel } from './PropertyPanel'
import { downloadLottie } from '../lib/download'
import type { LottieJSON } from '../lottie/types'

export function EditorLayout() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const def = id ? getAnimation(id) : undefined

  const { params, setParam, resetParams, setParams } = useEditorStore()

  // 진입 시 기본값 로드
  useEffect(() => {
    if (def) {
      setParams(structuredClone(def.defaultParams))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def?.id])

  // 실시간 반영: 60ms 디바운스 대신 rAF throttle
  // → 다음 프레임(~16ms 내)에 즉시 반영, 빠른 드래그 시엔 프레임당 1회로 합쳐 부하/플리커 방지
  const [debounced, setDebounced] = useState<Params2>(params)
  const rafRef = useRef<number>()
  useEffect(() => {
    if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => setDebounced(params))
    return () => {
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current)
    }
  }, [params])

  // params 가 현재 def 의 컨트롤 키로 채워졌는지 (네비게이션 직후 빈 store 보호)
  const panelReady = useMemo(
    () => (def ? def.controls.every((c) => params[c.key] !== undefined) : false),
    [def, params],
  )

  const json: LottieJSON | null = useMemo(() => {
    if (!def || Object.keys(debounced).length === 0) return null
    try {
      return def.generate(debounced)
    } catch (e) {
      console.error('generate error', e)
      return null
    }
  }, [def, debounced])

  const [status, setStatus] = useState<string>('')

  if (!def) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        알 수 없는 애니메이션입니다.
        <button onClick={() => navigate('/')} className="ml-2 text-brand underline">
          돌아가기
        </button>
      </div>
    )
  }

  const handleDownload = async () => {
    if (!json) return
    setStatus('검증 중…')
    const res = await downloadLottie(def.id, json)
    if (res.ok) {
      setStatus(res.warnings.length ? `다운로드 완료 (경고 ${res.warnings.length}건)` : '다운로드 완료 ✓')
      if (res.warnings.length) console.warn('RN lint 경고:', res.warnings)
    } else {
      setStatus(`다운로드 실패: ${res.error}`)
    }
    setTimeout(() => setStatus(''), 3000)
  }

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* 상단 바 */}
      <header className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
        <button onClick={() => navigate('/')} className="text-sm text-gray-400 hover:text-gray-700">
          ← 갤러리
        </button>
        <div className="text-center">
          <div className="font-mono text-sm font-bold text-gray-900">{def.id}</div>
          <div className="text-xs text-gray-400">{def.category}</div>
        </div>
        <div className="flex items-center gap-2">
          {status && <span className="text-xs text-gray-400">{status}</span>}
          <button
            onClick={handleDownload}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            ↓ JSON
          </button>
          <button onClick={() => navigate('/')} className="rounded-lg bg-brand px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-hover">
            완료
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* 좌측 프리뷰 */}
        <div className="flex flex-1 items-center justify-center p-10">
          {/* 편집 페이지 진입 시 항상 루프 자동재생 (one-shot 항목 포함) */}
          {json ? <PreviewCanvas json={json} loop dim={def.previewDim} /> : <div className="text-gray-400">렌더링 준비 중…</div>}
        </div>

        {/* 우측 패널 */}
        <aside className="flex w-[360px] shrink-0 flex-col border-l border-gray-100">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="text-base font-bold text-gray-900">속성 편집</h2>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
            {panelReady ? (
              <PropertyPanel controls={def.controls} params={params} onChange={setParam} />
            ) : (
              <div className="text-sm text-gray-400">로딩…</div>
            )}
          </div>
          <div className="border-t border-gray-100 px-5 py-3">
            <button
              onClick={() => resetParams(def.defaultParams)}
              className="w-full rounded-lg border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              기본값으로 초기화
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}

type Params2 = ReturnType<typeof useEditorStore.getState>['params']
