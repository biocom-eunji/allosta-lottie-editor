import type { ControlSchema, Params } from './controls'
import type { LottieJSON } from './types'
import { gradientLoaderDefaults, generateGradientLoader, type GradientLoaderParams } from './generators/gradientLoader'
import { rippleDefaults, generateRipple, type RippleParams } from './generators/ripple'
import { loader3dotDefaults, generateLoader3Dot, type Loader3DotParams } from './generators/loader3dot'
import { progressRingDefaults, generateProgressRing, type ProgressRingParams } from './generators/progressRing'
import { squareConfettiDefaults, generateSquareConfetti, type SquareConfettiParams } from './generators/squareConfetti'
import { confettiStarBurstDefaults, generateConfettiStarBurst, type ConfettiStarBurstParams } from './generators/confettiStarBurst'
import { confettiRainDefaults, generateConfettiRain, type ConfettiRainParams } from './generators/confettiRain'
import { generatePushToast, pushSoloSlideUpDefaults, type PushToastParams } from './generators/pushToast'
import { generatePushMockup, pushSoloMockupScreenDefaults, type PushMockupParams } from './generators/pushMockup'
import { generateStreakFlame, streakFlameDefaults, type StreakFlameParams } from './generators/streakFlame'
import { generateStreakDayCheck, streakDayCheckDefaults, type StreakDayCheckParams } from './generators/streakDayCheck'
import { generateStreakWeekRow, streakWeekRowDefaults, type StreakWeekRowParams } from './generators/streakWeekRow'
import { generateStreakBroken, streakBrokenDefaults, type StreakBrokenParams } from './generators/streakBroken'
import { generateCoinFlip, coinFlipDefaults, type CoinFlipParams } from './generators/coinFlip'
import {
  generateSuccessCheck, successCheckDefaults,
  generateErrorCross, errorCrossDefaults,
  generateWarningPulse, warningPulseDefaults,
  generateHeartLike, heartLikeDefaults,
  type FeedbackParams,
} from './generators/feedback'
import {
  generateEmptyBox, emptyBoxDefaults,
  generateSearchEmpty, searchEmptyDefaults,
  generateBellRing, bellRingDefaults,
  type EmptyParams,
} from './generators/emptyState'
import {
  generateSpinnerOrbit, spinnerOrbitDefaults,
  generateSkeletonShimmer, skeletonShimmerDefaults,
  generatePullRefresh, pullRefreshDefaults,
  type LoadingExtraParams,
} from './generators/loadingExtra'
import { generateFireworkBurst, fireworkBurstDefaults, type FireworkParams, generateEmojiRain, emojiRainDefaults, type EmojiRainParams } from './generators/confettiExtra'
import {
  generateFlameGrow, flameGrowDefaults, type FlameGrowParams,
  generateStreakCountUp, streakCountUpDefaults, type StreakCountUpParams,
  generateTrophyPop, trophyPopDefaults, type TrophyPopParams,
} from './generators/streakExtra'
import { generateImageSwipe, imageSwipeDefaults, type ImageSwipeParams } from './generators/imageSwipe'
import { generateImageScan, imageScanDefaults, type ImageScanParams } from './generators/imageScan'

const TEXT_MODE_CONTROL = {
  type: 'segmented' as const,
  key: 'textMode',
  label: '텍스트 처리',
  options: [
    { value: 'raster', label: 'Canvas 래스터' },
    { value: 'overlay', label: 'RN 오버레이' },
  ],
}

export type Category = 'Loading' | 'Push' | 'Confetti' | 'Image' | 'Streak' | 'Feedback' | 'Empty'

export interface AnimationDef {
  id: string
  name: string
  category: Category
  defaultParams: Params
  controls: ControlSchema[]
  generate: (params: Params) => LottieJSON
  /** 프리뷰 루프 여부 (one-shot 은 false). 기본 true */
  loop?: boolean
  /** 갤러리 카드 대표 프레임(정지 시). 미지정 시 op*0.5 */
  previewFrame?: number
  /** 웹 프리뷰 배경을 딤(어둡게) 처리 — 흰 그래픽 가시성용. 다운로드 JSON 에는 미반영 */
  previewDim?: boolean
}

export const CATEGORY_DESC: Record<Category, string> = {
  Push: '푸시 알림에 사용되는 그래픽 리소스입니다. 색상, 텍스트, 아이콘 등을 수정할 수 있습니다.',
  Loading: '로딩 애니메이션 그래픽 리소스입니다. 크기, 라운딩, 스트로크 등을 수정할 수 있습니다.',
  Confetti: '컨페티/축하 애니메이션 그래픽 리소스입니다. 파티클 이미지를 교체하여 커스텀 컨페티를 만들 수 있습니다.',
  Image: '이미지 기반 애니메이션 리소스입니다. 사진을 업로드해 스와이프/스캔/플래시 촬영 효과를 만들 수 있습니다.',
  Streak: '스트릭(연속 기록) 동기부여에 사용되는 그래픽 리소스입니다. 불꽃, 카운트, 요일 체크 등을 수정할 수 있습니다.',
  Feedback: '성공/오류/경고/좋아요 등 사용자 피드백 애니메이션입니다. 색상을 수정할 수 있습니다.',
  Empty: '빈 상태/안내 애니메이션입니다. 데이터 없음, 검색 결과 없음, 알림 등에 사용합니다.',
}

export const CATEGORY_ORDER: Category[] = ['Push', 'Loading', 'Confetti', 'Image', 'Streak', 'Feedback', 'Empty']

export const ANIMATIONS: AnimationDef[] = [
  {
    id: 'gradient-loader',
    name: 'gradient-loader',
    category: 'Loading',
    defaultParams: gradientLoaderDefaults,
    controls: [
      { type: 'slider', key: 'width', label: 'Width', min: 40, max: 240, step: 1, unit: 'px' },
      { type: 'slider', key: 'height', label: 'Height', min: 40, max: 240, step: 1, unit: 'px' },
      { type: 'slider', key: 'roundness', label: 'Roundness', min: 0, max: 120, step: 1, unit: 'px' },
      { type: 'slider', key: 'strokeWidth', label: 'Stroke width', min: 1, max: 40, step: 1, unit: 'px' },
      { type: 'color', key: 'strokeColor', label: 'Stroke color', allowGradient: true, studio: true },
    ],
    generate: (p) => generateGradientLoader(p as GradientLoaderParams),
  },
  {
    id: 'ripple',
    name: 'ripple',
    category: 'Loading',
    defaultParams: rippleDefaults,
    controls: [
      { type: 'slider', key: 'size', label: '크기', min: 60, max: 280, step: 1, unit: 'px' },
      { type: 'slider', key: 'count', label: '링 개수', min: 1, max: 5, step: 1 },
      { type: 'color', key: 'color', label: '색상' },
    ],
    generate: (p) => generateRipple(p as RippleParams),
  },
  {
    id: 'loader-3dot',
    name: 'loader-3dot',
    category: 'Loading',
    defaultParams: loader3dotDefaults,
    controls: [
      { type: 'color', key: 'color', label: '색상' },
      { type: 'slider', key: 'dotSize', label: '점 크기', min: 12, max: 64, step: 1, unit: 'px' },
      { type: 'slider', key: 'gap', label: '점 간격', min: 32, max: 100, step: 1, unit: 'px' },
      { type: 'slider', key: 'speed', label: '속도', min: 50, max: 200, step: 5, unit: '%' },
      { type: 'slider', key: 'bounce', label: '바운스 강도', min: 0, max: 100, step: 5, unit: '%' },
    ],
    generate: (p) => generateLoader3Dot(p as Loader3DotParams),
  },
  {
    id: 'progress-gradient',
    name: 'progress-gradient',
    category: 'Loading',
    defaultParams: progressRingDefaults,
    controls: [
      { type: 'slider', key: 'strokeWidth', label: 'Stroke 두께', min: 4, max: 40, step: 1, unit: 'px' },
      { type: 'color', key: 'color', label: '색상', allowGradient: true },
    ],
    generate: (p) => generateProgressRing(p as ProgressRingParams),
  },
  {
    id: 'square-confetti',
    name: 'square-confetti',
    category: 'Confetti',
    loop: false,
    previewFrame: 28,
    defaultParams: squareConfettiDefaults,
    controls: [
      {
        type: 'segmented',
        key: 'mode',
        label: '편집 모드',
        options: [
          { value: 'color', label: '컬러 편집' },
          { value: 'image', label: '이미지 교체' },
        ],
      },
      { type: 'color', key: 'colorA', label: 'Color A', hideOpacity: true, visibleWhen: { key: 'mode', equals: 'color' } },
      { type: 'color', key: 'colorB', label: 'Color B', hideOpacity: true, visibleWhen: { key: 'mode', equals: 'color' } },
      { type: 'color', key: 'colorC', label: 'Color C', hideOpacity: true, visibleWhen: { key: 'mode', equals: 'color' } },
      { type: 'imageList', key: 'images', label: '파티클 이미지', count: 3, visibleWhen: { key: 'mode', equals: 'image' } },
      { type: 'slider', key: 'count', label: '파티클 수', min: 4, max: 40, step: 1, caption: (v) => `${v}개 파티클` },
    ],
    generate: (p) => generateSquareConfetti(p as SquareConfettiParams),
  },
  {
    id: 'confetti-star-burst',
    name: 'confetti-star-burst',
    category: 'Confetti',
    loop: false,
    previewFrame: 48,
    defaultParams: confettiStarBurstDefaults,
    controls: [
      { type: 'toggle', key: 'editColors', label: '컬러 편집' },
      { type: 'color', key: 'colorA', label: 'Color A', visibleWhen: { key: 'editColors', equals: 'true' } },
      { type: 'color', key: 'colorB', label: 'Color B', visibleWhen: { key: 'editColors', equals: 'true' } },
      { type: 'color', key: 'colorC', label: 'Color C', visibleWhen: { key: 'editColors', equals: 'true' } },
      { type: 'slider', key: 'size', label: '크기', min: 150, max: 500, step: 1, unit: 'px' },
      { type: 'slider', key: 'speed', label: '속도', min: 50, max: 200, step: 5, unit: '%' },
      {
        type: 'segmented',
        key: 'density',
        label: '밀도',
        options: [
          { value: 'low', label: '낮음' },
          { value: 'medium', label: '보통' },
          { value: 'high', label: '높음' },
        ],
      },
    ],
    generate: (p) => generateConfettiStarBurst(p as ConfettiStarBurstParams),
  },
  {
    id: 'confetti-rain',
    name: 'confetti-rain',
    category: 'Confetti',
    loop: true,
    previewFrame: 30,
    defaultParams: { ...confettiRainDefaults, editColors: true },
    controls: [
      { type: 'color', key: 'colorA', label: 'Color A' },
      { type: 'color', key: 'colorB', label: 'Color B' },
      { type: 'color', key: 'colorC', label: 'Color C' },
      { type: 'slider', key: 'size', label: '크기', min: 150, max: 500, step: 1, unit: 'px' },
      { type: 'slider', key: 'speed', label: '속도', min: 50, max: 200, step: 5, unit: '%' },
      {
        type: 'segmented',
        key: 'density',
        label: '밀도',
        options: [
          { value: 'low', label: '낮음' },
          { value: 'medium', label: '보통' },
          { value: 'high', label: '높음' },
        ],
      },
    ],
    generate: (p) => generateConfettiRain(p as ConfettiRainParams),
  },
  {
    id: 'image-swipe',
    name: 'image-swipe',
    category: 'Image',
    loop: true,
    previewDim: true,
    defaultParams: imageSwipeDefaults,
    controls: [
      { type: 'slider', key: 'speed', label: '속도', min: 50, max: 200, step: 5, unit: '%' },
    ],
    generate: (p) => generateImageSwipe(p as ImageSwipeParams),
  },
  {
    id: 'image-scan',
    name: 'image-scan',
    category: 'Image',
    loop: true,
    defaultParams: imageScanDefaults,
    controls: [
      { type: 'color', key: 'scanColor', label: '스캔 색상' },
      { type: 'slider', key: 'speed', label: '스캔 속도', min: 50, max: 200, step: 5, unit: '%' },
    ],
    generate: (p) => generateImageScan(p as ImageScanParams),
  },
  {
    id: 'push-solo-slide-up',
    name: 'push-solo-slide-up',
    category: 'Push',
    defaultParams: pushSoloSlideUpDefaults,
    controls: [
      { type: 'text', key: 'title', label: 'Header Title', placeholder: '제목' },
      { type: 'text', key: 'content', label: 'Content text', placeholder: '내용' },
      { type: 'color', key: 'titleColor', label: '제목 색상' },
      { type: 'color', key: 'contentColor', label: '내용 색상' },
      { type: 'color', key: 'iconColor', label: '아이콘 색상' },
      TEXT_MODE_CONTROL,
    ],
    generate: (p) => generatePushToast(p as PushToastParams, 'push-solo-slide-up'),
  },
  {
    id: 'push-solo-mockup-screen',
    name: 'push-solo-mockup-screen',
    category: 'Push',
    defaultParams: pushSoloMockupScreenDefaults,
    controls: [
      { type: 'text', key: 'title', label: 'Header Title', placeholder: '제목' },
      { type: 'text', key: 'content', label: 'Content text', placeholder: '내용' },
      { type: 'color', key: 'titleColor', label: '제목 색상' },
      { type: 'color', key: 'contentColor', label: '내용 색상' },
      { type: 'image', key: 'thumbnail', label: 'Thumbnail 이미지' },
      { type: 'image', key: 'screenImage', label: 'Screen Image' },
      TEXT_MODE_CONTROL,
    ],
    generate: (p) => generatePushMockup(p as PushMockupParams, 'push-solo-mockup-screen', { withImages: true }),
  },
  {
    id: 'streak-flame',
    name: 'streak-flame',
    category: 'Streak',
    defaultParams: streakFlameDefaults,
    loop: true,
    controls: [
      { type: 'color', key: 'flameColor', label: '불꽃 색상', allowGradient: true },
      { type: 'color', key: 'coreColor', label: '코어 색상' },
      { type: 'color', key: 'glowColor', label: '글로우 색상' },
      { type: 'slider', key: 'glowIntensity', label: '글로우 강도', min: 0, max: 100, step: 1, unit: '%' },
      { type: 'slider', key: 'sideFlames', label: '곁불꽃 개수', min: 0, max: 2, step: 1 },
      { type: 'slider', key: 'speed', label: '속도', min: 50, max: 200, step: 5, unit: '%' },
      { type: 'slider', key: 'size', label: '크기', min: 80, max: 240, step: 1, unit: 'px' },
    ],
    generate: (p) => generateStreakFlame(p as StreakFlameParams),
  },
  {
    id: 'streak-day-check',
    name: 'streak-day-check',
    category: 'Streak',
    defaultParams: streakDayCheckDefaults,
    loop: false,
    previewFrame: 100,
    controls: [
      { type: 'color', key: 'completeColor', label: '원 색상' },
      { type: 'color', key: 'checkColor', label: '체크 색' },
      { type: 'color', key: 'incompleteColor', label: '파동 색' },
      { type: 'slider', key: 'size', label: '크기', min: 200, max: 512, step: 1, unit: 'px' },
      { type: 'slider', key: 'speed', label: '속도', min: 50, max: 200, step: 5, unit: '%' },
    ],
    generate: (p) => generateStreakDayCheck(p as StreakDayCheckParams),
  },
  {
    id: 'streak-week-row',
    name: 'streak-week-row',
    category: 'Streak',
    defaultParams: streakWeekRowDefaults,
    loop: false,
    previewFrame: 52,
    controls: [
      { type: 'color', key: 'completeColor', label: '완료색' },
      { type: 'color', key: 'incompleteColor', label: '미완료색' },
      { type: 'color', key: 'todayColor', label: '오늘 강조색' },
      { type: 'slider', key: 'cells', label: '칸 개수', min: 3, max: 14, step: 1 },
      { type: 'slider', key: 'completedCount', label: '완료 개수', min: 0, max: 14, step: 1 },
      { type: 'slider', key: 'staggerDelay', label: 'Stagger 딜레이', min: 0, max: 20, step: 1, unit: 'f' },
    ],
    generate: (p) => generateStreakWeekRow(p as StreakWeekRowParams),
  },
  {
    id: 'streak-broken',
    name: 'streak-broken',
    category: 'Streak',
    defaultParams: streakBrokenDefaults,
    loop: false,
    previewFrame: 12,
    controls: [
      { type: 'color', key: 'color', label: '색상' },
      { type: 'slider', key: 'fadeSpeed', label: '페이드 속도', min: 50, max: 200, step: 5, unit: '%' },
    ],
    generate: (p) => generateStreakBroken(p as StreakBrokenParams),
  },
  {
    id: 'coin-flip',
    name: 'coin-flip',
    category: 'Streak',
    loop: true,
    previewFrame: 95,
    defaultParams: coinFlipDefaults,
    controls: [
      { type: 'slider', key: 'speed', label: '속도', min: 50, max: 200, step: 5, unit: '%' },
    ],
    generate: (p) => generateCoinFlip(p as CoinFlipParams),
  },
  {
    id: 'flame-grow',
    name: 'flame-grow',
    category: 'Streak',
    loop: true,
    previewFrame: 24,
    defaultParams: flameGrowDefaults,
    controls: [
      { type: 'color', key: 'flameColor', label: '불꽃 색상', allowGradient: true },
      { type: 'slider', key: 'size', label: '크기', min: 80, max: 240, step: 1, unit: 'px' },
      { type: 'slider', key: 'speed', label: '속도', min: 50, max: 200, step: 5, unit: '%' },
    ],
    generate: (p) => generateFlameGrow(p as FlameGrowParams),
  },
  {
    id: 'streak-count-up',
    name: 'streak-count-up',
    category: 'Streak',
    loop: false,
    previewFrame: 40,
    defaultParams: streakCountUpDefaults,
    controls: [
      { type: 'slider', key: 'count', label: '숫자', min: 1, max: 999, step: 1 },
      { type: 'color', key: 'color', label: '배지 색' },
      { type: 'slider', key: 'speed', label: '속도', min: 50, max: 200, step: 5, unit: '%' },
    ],
    generate: (p) => generateStreakCountUp(p as StreakCountUpParams),
  },
  {
    id: 'trophy-pop',
    name: 'trophy-pop',
    category: 'Streak',
    loop: false,
    previewFrame: 40,
    defaultParams: trophyPopDefaults,
    controls: [
      { type: 'color', key: 'color', label: '트로피 색' },
      { type: 'slider', key: 'speed', label: '속도', min: 50, max: 200, step: 5, unit: '%' },
    ],
    generate: (p) => generateTrophyPop(p as TrophyPopParams),
  },
  {
    id: 'firework-burst',
    name: 'firework-burst',
    category: 'Confetti',
    loop: false,
    previewFrame: 30,
    defaultParams: fireworkBurstDefaults,
    controls: [
      { type: 'slider', key: 'count', label: '파티클 수', min: 6, max: 60, step: 1 },
      { type: 'slider', key: 'speed', label: '속도', min: 50, max: 200, step: 5, unit: '%' },
    ],
    generate: (p) => generateFireworkBurst(p as FireworkParams),
  },
  {
    id: 'emoji-rain',
    name: 'emoji-rain',
    category: 'Confetti',
    loop: true,
    defaultParams: emojiRainDefaults,
    controls: [
      { type: 'imageList', key: 'images', label: '이미지(이모지)', count: 3 },
      { type: 'slider', key: 'count', label: '개수', min: 4, max: 60, step: 1 },
    ],
    generate: (p) => generateEmojiRain(p as EmojiRainParams),
  },
  {
    id: 'spinner-orbit',
    name: 'spinner-orbit',
    category: 'Loading',
    loop: true,
    defaultParams: spinnerOrbitDefaults,
    controls: [
      { type: 'color', key: 'color', label: '색상' },
      { type: 'slider', key: 'speed', label: '속도', min: 50, max: 200, step: 5, unit: '%' },
    ],
    generate: (p) => generateSpinnerOrbit(p as LoadingExtraParams),
  },
  {
    id: 'skeleton-shimmer',
    name: 'skeleton-shimmer',
    category: 'Loading',
    loop: true,
    defaultParams: skeletonShimmerDefaults,
    controls: [
      { type: 'slider', key: 'speed', label: '속도', min: 50, max: 200, step: 5, unit: '%' },
    ],
    generate: (p) => generateSkeletonShimmer(p as LoadingExtraParams),
  },
  {
    id: 'pull-refresh',
    name: 'pull-refresh',
    category: 'Loading',
    loop: true,
    defaultParams: pullRefreshDefaults,
    controls: [
      { type: 'color', key: 'color', label: '색상' },
      { type: 'slider', key: 'speed', label: '속도', min: 50, max: 200, step: 5, unit: '%' },
    ],
    generate: (p) => generatePullRefresh(p as LoadingExtraParams),
  },
  {
    id: 'success-check',
    name: 'success-check',
    category: 'Feedback',
    loop: false,
    previewFrame: 55,
    defaultParams: successCheckDefaults,
    controls: [
      { type: 'color', key: 'color', label: '원 색상' },
      { type: 'slider', key: 'speed', label: '속도', min: 50, max: 200, step: 5, unit: '%' },
    ],
    generate: (p) => generateSuccessCheck(p as FeedbackParams),
  },
  {
    id: 'error-cross',
    name: 'error-cross',
    category: 'Feedback',
    loop: false,
    previewFrame: 60,
    defaultParams: errorCrossDefaults,
    controls: [
      { type: 'color', key: 'color', label: '원 색상' },
      { type: 'slider', key: 'speed', label: '속도', min: 50, max: 200, step: 5, unit: '%' },
    ],
    generate: (p) => generateErrorCross(p as FeedbackParams),
  },
  {
    id: 'warning-pulse',
    name: 'warning-pulse',
    category: 'Feedback',
    loop: true,
    defaultParams: warningPulseDefaults,
    controls: [
      { type: 'color', key: 'color', label: '색상' },
      { type: 'slider', key: 'speed', label: '속도', min: 50, max: 200, step: 5, unit: '%' },
    ],
    generate: (p) => generateWarningPulse(p as FeedbackParams),
  },
  {
    id: 'heart-like',
    name: 'heart-like',
    category: 'Feedback',
    loop: false,
    previewFrame: 30,
    defaultParams: heartLikeDefaults,
    controls: [
      { type: 'color', key: 'color', label: '하트 색' },
      { type: 'slider', key: 'speed', label: '속도', min: 50, max: 200, step: 5, unit: '%' },
    ],
    generate: (p) => generateHeartLike(p as FeedbackParams),
  },
  {
    id: 'empty-box',
    name: 'empty-box',
    category: 'Empty',
    loop: true,
    defaultParams: emptyBoxDefaults,
    controls: [
      { type: 'color', key: 'color', label: '강조 색' },
      { type: 'slider', key: 'speed', label: '속도', min: 50, max: 200, step: 5, unit: '%' },
    ],
    generate: (p) => generateEmptyBox(p as EmptyParams),
  },
  {
    id: 'search-empty',
    name: 'search-empty',
    category: 'Empty',
    loop: true,
    defaultParams: searchEmptyDefaults,
    controls: [
      { type: 'color', key: 'color', label: '렌즈 색' },
      { type: 'slider', key: 'speed', label: '속도', min: 50, max: 200, step: 5, unit: '%' },
    ],
    generate: (p) => generateSearchEmpty(p as EmptyParams),
  },
  {
    id: 'bell-ring',
    name: 'bell-ring',
    category: 'Empty',
    loop: true,
    defaultParams: bellRingDefaults,
    controls: [
      { type: 'color', key: 'color', label: '종 색상' },
      { type: 'slider', key: 'speed', label: '속도', min: 50, max: 200, step: 5, unit: '%' },
    ],
    generate: (p) => generateBellRing(p as EmptyParams),
  },
]

export function getAnimation(id: string): AnimationDef | undefined {
  return ANIMATIONS.find((a) => a.id === id)
}
