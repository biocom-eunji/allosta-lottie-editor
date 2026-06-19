# 알로스타 Lottie 에디터 (v1)

웹에서 Lottie 애니메이션을 **카테고리별로 고르고 → 속성을 실시간 편집하고 → React Native에 바로 쓸 수 있는 Lottie JSON으로 다운로드**하는 정적 SPA 에디터.

- **v1 범위:** Push / Loading / Confetti
- 백엔드 없음. 모든 처리는 클라이언트.

## 빠른 시작

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 정적 빌드 (dist/)
npm test         # 단위 테스트 (vitest)
```

## 핵심 아키텍처

**각 애니메이션 = `params → LottieJSON` 순수 함수(generator).**

```
params ──▶ generateXxx(params): LottieJSON ──┬─▶ 프리뷰(lottie-web)
                                              └─▶ 다운로드(.json)
```

프리뷰와 다운로드가 **같은 JSON 소스**를 쓰므로 "보이는 그대로" 내려받힙니다.

- [src/lottie/builders.ts](src/lottie/builders.ts) — shape/fill/stroke/gradient/trimPath/transform/keyframe 헬퍼
- [src/lottie/generators/](src/lottie/generators/) — 애니메이션별 generator
- [src/lottie/registry.ts](src/lottie/registry.ts) — `id → {name, category, defaultParams, controls, generate}`
- [src/lottie/controls.ts](src/lottie/controls.ts) — 선언형 컨트롤 스키마
- [src/tokens/colors.ts](src/tokens/colors.ts) — 디자인 토큰 + hex/gradient → Lottie 변환

### 새 애니메이션 추가
1. `src/lottie/generators/`에 `(params) => LottieJSON` 함수 작성
2. `registry.ts`의 `ANIMATIONS`에 항목 1개 추가 (`controls` 스키마 포함)

→ 그리드/에디터에 **자동 노출**됩니다. 패널은 `controls` 스키마로 제네릭하게 렌더됩니다.

## RN 호환 규칙 (준수됨)

- **Expression 미사용** — 모든 움직임은 keyframe으로만 표현
- **이미지는 base64 data URI로 `assets`에 임베드**(`e:1`) — 외부 경로 참조 없음 (자체 완결형 JSON)
- Gradient(`gf`/`gs`), Trim path(`tm`)만 사용 (RN 지원 범위)
- 루프 애니메이션은 **마지막 프레임 = 첫 프레임** 상태로 설계해 seamless
- 다운로드 전 [validate.ts](src/lottie/validate.ts)에서 ① lottie-web 메모리 로드 검증 ② RN lint(expression/외부참조 탐지) 2단계 수행

## React Native 적용 예시

```tsx
import LottieView from 'lottie-react-native'
import anim from './gradient-loader.json'

export function Loader() {
  return <LottieView source={anim} autoPlay loop style={{ width: 120, height: 120 }} />
}
```

## Push 텍스트 처리 (textMode 플래그)

폰트 임베드를 피하기 위해 Push 카드 텍스트는 두 방식을 모두 지원합니다 (에디터의 **텍스트 처리** 토글):

- **`raster` (Canvas 래스터라이즈):** 제목/내용을 canvas로 그려 base64 이미지 레이어로 임베드. JSON이 자체 완결형이라 RN에서 **텍스트까지 그대로** 보입니다. (텍스트 수정 시 재다운로드 필요)
- **`overlay` (RN 오버레이):** Lottie는 카드 배경·아이콘·슬라이드 모션만 포함하고, 텍스트는 RN에서 `<Text>`로 오버레이. JSON이 가볍고 다국어/동적 텍스트에 유리.

### overlay 모드 권장 오버레이 좌표 (canvas 비율 기준)
토스트(`push-solo-slide-up`, 340×200): 카드 중앙 정지 시 텍스트 좌측 X ≈ 카드좌측+72px, 제목 Y ≈ 중앙-11px, 내용 Y ≈ 중앙+13px. 카드의 슬라이드 모션에 맞춰 RN 측에서 동일 트랜지션을 적용하거나, Lottie 위에 절대배치 후 동시에 표시하세요.

## Streak 카테고리 (연속 기록 동기부여)

스트릭 위젯(불꽃 + 연속 일수 + 요일 체크)용 6종. 어두운 배경 기반이라 **프리뷰 기본 테마는 Dark**.

| id | 형태 | 루프 |
|---|---|---|
| `streak-flame` | **fire.json 소스 기반** — 메인 불꽃(path-morph 출렁임) + 곁불꽃(Indv. Flame 01/02) + 코어(White Fire) + 추가 글로우 | loop |
| `streak-day-check` | 원이 채워지며 체크마크 그리기(trim path) + pop | one-shot |
| `streak-week-row` | 월~일 칸이 stagger로 순차 채워짐, 오늘 칸 강조 링 | one-shot |
| `streak-flame-burst` | 불꽃 확대 + 스파크 방사(confetti 파티클 재사용) | one-shot |
| `streak-count-pop` | 카운트 영역 scale bounce + 글로우 플래시 | one-shot |
| `streak-broken` | 불꽃이 회색/연기로 사그라듦(desaturate+페이드) | one-shot |

**RN 호환 핵심**
- **글로우는 blur 이펙트 미사용** → 반투명 radial gradient(`gf`, `t:2`) 타원 겹침으로 구현 (RN 안전).
- **path-morph 정점 수 고정** → 모든 morph 키프레임의 정점 수가 동일해야 RN에서 안 깨짐. 불꽃 3종(`streak-flame` / `streak-flame-burst` / `streak-broken`)은 [fire.json](src/lottie/sources/fire.json) 소스의 morph(레이어별 11/9/7/7/4 정점)를 **평탄화 없이 그대로 유지**하고, 공유 모듈 [fireFlame.ts](src/lottie/generators/fireFlame.ts)로 색/크기/곁불꽃/속도·버스트·페이드만 override. 다른 streak 도형은 `flamePathVariants()`가 보장. 모두 테스트로 강제 검증.
- 불꽃 색상은 **따뜻한 fire 컬러 유지**(민트 키컬러 예외 — 컨페티 다색·빨간 뱃지와 동일). 글로우 톤만 편집 가능. `streak-broken`은 시간에 따라 그라디언트를 회색으로 desaturate(애니메이션 그라디언트, RN 안전).
- 체크마크/선은 `stroke` + `trim path(tm)`의 `e` 0→100 애니메이션.
- one-shot은 `loop=false`(프리뷰에서 1회 재생 후 정지, 스크러버로 프레임 확인).

**숫자·요일 텍스트는 Lottie에 미포함(RN 오버레이 권장)**
- `streak-week-row`의 요일 라벨(월·화…), `streak-count-pop`의 숫자는 Lottie에 넣지 않습니다. RN에서 각 칸/영역 위에 `<Text>`를 절대배치하세요.
- `streak-count-pop`은 `includeText` 토글로 숫자 래스터 임베드도 지원(기본 false). 켜면 자체 완결형이지만 숫자 변경 시 재다운로드 필요.
- 좌표 기준: week-row는 캔버스 폭에서 칸이 균등 배치되며 각 칸 중심에 라벨을, count-pop은 캔버스 중앙(칩 위치)에 숫자를 얹습니다.

```tsx
// one-shot 예시 (loop 끄기)
<LottieView source={require('./streak-flame-burst.json')} autoPlay loop={false} />
// loop 예시
<LottieView source={require('./streak-flame.json')} autoPlay loop />
```

## v1에서 의도적으로 제외 (v2 예정)

- `rolling-number`(Rolling), `brand-loop-marquee`(Rotate) — 폰트 임베드/별도 패턴 필요
- 텍스트가 들어가는 Push 카드의 폰트 임베드 — 위 `raster`/`overlay`로 우회

## 디렉터리

```
src/
  tokens/colors.ts            디자인 토큰 + 변환
  lottie/
    types.ts                  Lottie JSON 타입
    builders.ts               shape/fill/stroke/gradient/trim/transform/keyframe 헬퍼
    periodic.ts               seamless 주기 키프레임 헬퍼
    controls.ts               선언형 컨트롤 스키마
    registry.ts               id -> 애니메이션 정의
    validate.ts               lottie-web 검증 + RN lint
    generators/               애니메이션별 generator
  components/
    Gallery / EditorLayout / PreviewCanvas / PropertyPanel / ThemeToggle / MiniPreview
    controls/ (Slider, ColorPicker, GradientEditor, SegmentedToggle, ImageUpload, TextInput)
  store/editorStore.ts        zustand (params, theme)
  lib/ (download, image, text, prng)
```
