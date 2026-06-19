import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ANIMATIONS, CATEGORY_DESC, CATEGORY_ORDER, getAnimation, type Category } from '../lottie/registry'
import { MiniPreview } from './MiniPreview'

export function Gallery() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-12">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">알로스타 Lottie 에디터</h1>
        <p className="mt-1.5 text-sm text-gray-500">카테고리에서 애니메이션을 골라 속성을 편집하고 RN용 Lottie JSON으로 내려받으세요.</p>
      </header>

      {CATEGORY_ORDER.map((cat) => {
        const items = ANIMATIONS.filter((a) => a.category === cat)
        if (items.length === 0) return null
        return (
          <section key={cat} className="mb-12">
            <h2 className="text-xl font-medium text-gray-900">{cat}</h2>
            <p className="mb-5 mt-1 text-sm leading-relaxed font-light text-gray-500">{CATEGORY_DESC[cat as Category]}</p>
            <div className="grid grid-cols-2 gap-x-7 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((a) => (
                <Card key={a.id} id={a.id} onClick={() => navigate(`/edit/${a.id}`)} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function Card({ id, onClick }: { id: string; onClick: () => void }) {
  const def = getAnimation(id)!
  const json = useMemo(() => def.generate(def.defaultParams), [def])
  const previewFrame = def.previewFrame ?? Math.round(json.op * 0.5)
  const [hover, setHover] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      className="group flex flex-col bg-transparent text-left focus:outline-none"
    >
      {/* 정사각 프리뷰 박스만 hover 시 리프트+그림자+민트 테두리.
          transform/shadow/border 를 hover state 로 직접 토글 + inline transition →
          Tailwind transform 변수/arbitrary 충돌 없이 확실히 애니메이션.
          (transform 이라 레이아웃 안 밀림 → 이름 고정 / border-2 상시 → 두께 변화 없어 shift 없음) */}
      <div
        style={{
          transition:
            'transform 800ms cubic-bezier(0.16,1,0.3,1), box-shadow 800ms cubic-bezier(0.16,1,0.3,1), border-color 800ms cubic-bezier(0.16,1,0.3,1)',
          transform: hover ? 'translateY(-10px)' : 'translateY(0)',
          boxShadow: hover ? '0 22px 40px -12px rgba(0,0,0,0.22)' : '0 0 0 0 rgba(0,0,0,0)',
          borderColor: hover ? 'var(--color-brand)' : 'transparent',
          willChange: 'transform',
        }}
        className="flex aspect-square items-center justify-center overflow-hidden rounded-xl border-2 bg-gray-50 p-5"
      >
        <MiniPreview json={json} playing={hover} previewFrame={previewFrame} dim={def.previewDim} />
      </div>
      <div className="px-1 pb-1 pt-3 text-center">
        <span className="block text-center text-xs text-gray-500 transition-colors group-hover:text-gray-800">{id}</span>
      </div>
    </button>
  )
}
