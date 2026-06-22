import type { ControlSchema, Params } from './controls'
import type { LottieJSON } from './types'
import { gradientLoaderDefaults, generateGradientLoader, type GradientLoaderParams } from './generators/gradientLoader'
import { rippleDefaults, generateRipple, type RippleParams } from './generators/ripple'
import { loader3dotDefaults, generateLoader3Dot, type Loader3DotParams } from './generators/loader3dot'
import { progressRingDefaults, generateProgressRing, type ProgressRingParams } from './generators/progressRing'
import { confettiStarBurstDefaults, generateConfettiStarBurst, type ConfettiStarBurstParams } from './generators/confettiStarBurst'
import { confettiRainDefaults, generateConfettiRain, type ConfettiRainParams } from './generators/confettiRain'
import { generateStreakFlame, streakFlameDefaults, type StreakFlameParams } from './generators/streakFlame'
import { generateStreakDayCheck, streakDayCheckDefaults, type StreakDayCheckParams } from './generators/streakDayCheck'
import { generateStreakWeekRow, streakWeekRowDefaults, type StreakWeekRowParams } from './generators/streakWeekRow'
import { generateCoinFlip, coinFlipDefaults, type CoinFlipParams } from './generators/coinFlip'
import { generateImageSwipe, imageSwipeDefaults, type ImageSwipeParams } from './generators/imageSwipe'
import { generateImageScan, imageScanDefaults, type ImageScanParams } from './generators/imageScan'
import { generateGradientFrame, gradientFrameDefaults, type GradientFrameParams } from './generators/gradientFrame'
import { generateLoadingOrbit, loadingOrbitDefaults, type LoadingOrbitParams } from './generators/loadingOrbit'
import { generateWillFlame, willFlameDefaults, type WillFlameParams } from './generators/willFlame'

export type Category = 'Loading' | 'Confetti' | 'Streak' | 'Point' | 'Image'

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
  Loading: '로딩/진행 인디케이터 애니메이션입니다. 크기, 라운딩, 스트로크, 속도 등을 수정할 수 있습니다.',
  Confetti: '축하/컨페티 연출 애니메이션입니다. 색상·밀도·파티클 등을 수정할 수 있습니다.',
  Streak: '스트릭(연속 기록) 애니메이션입니다. 불꽃, 주간 진행 바 등을 수정할 수 있습니다.',
  Point: '포인트/리워드 적립 애니메이션입니다. 코인 획득, 완료 체크 등을 수정할 수 있습니다.',
  Image: '이미지 기반 애니메이션입니다. 사진을 업로드해 스와이프/스캔 효과 등을 만들 수 있습니다.',
}

export const CATEGORY_ORDER: Category[] = ['Loading', 'Confetti', 'Streak', 'Point', 'Image']

export const ANIMATIONS: AnimationDef[] = [
  {
    id: 'loading-squircle',
    name: 'loading-squircle',
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
    id: 'loading-ripple',
    name: 'loading-ripple',
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
    id: 'loading-dots',
    name: 'loading-dots',
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
    id: 'loading-spinner',
    name: 'loading-spinner',
    category: 'Loading',
    defaultParams: progressRingDefaults,
    controls: [
      { type: 'slider', key: 'strokeWidth', label: 'Stroke 두께', min: 4, max: 40, step: 1, unit: 'px' },
      { type: 'color', key: 'color', label: '색상', allowGradient: true },
    ],
    generate: (p) => generateProgressRing(p as ProgressRingParams),
  },
  {
    id: 'loading-orbit',
    name: 'loading-orbit',
    category: 'Loading',
    loop: true,
    previewFrame: 100,
    defaultParams: loadingOrbitDefaults,
    controls: [
      { type: 'slider', key: 'speed', label: '속도', min: 50, max: 200, step: 5, unit: '%' },
    ],
    generate: (p) => generateLoadingOrbit(p as LoadingOrbitParams),
  },
  {
    id: 'confetti-burst',
    name: 'confetti-burst',
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
    id: 'image-gradient',
    name: 'image-gradient',
    category: 'Image',
    loop: true,
    previewFrame: 90,
    defaultParams: gradientFrameDefaults,
    controls: [
      { type: 'slider', key: 'speed', label: '속도', min: 50, max: 200, step: 5, unit: '%' },
    ],
    generate: (p) => generateGradientFrame(p as GradientFrameParams),
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
      { type: 'slider', key: 'speed', label: '속도', min: 50, max: 200, step: 5, unit: '%' },
      { type: 'slider', key: 'size', label: '크기', min: 80, max: 240, step: 1, unit: 'px' },
    ],
    generate: (p) => generateStreakFlame(p as StreakFlameParams),
  },
  {
    id: 'streak-will-flame',
    name: 'streak-will-flame',
    category: 'Streak',
    loop: true,
    previewFrame: 40,
    defaultParams: willFlameDefaults,
    controls: [
      {
        type: 'segmented',
        key: 'mode',
        label: '모드',
        options: [
          { value: 'icon', label: '아이콘(플리커)' },
          { value: 'receive', label: '받기(낙하)' },
        ],
      },
      { type: 'color', key: 'flameColor', label: '불꽃 색', allowGradient: true },
      { type: 'color', key: 'coreColor', label: '코어 색' },
      { type: 'color', key: 'glowColor', label: '글로우 색' },
      { type: 'color', key: 'bloomColor', label: '블룸 색', visibleWhen: { key: 'mode', equals: 'receive' } },
      { type: 'slider', key: 'size', label: '크기', min: 48, max: 240, step: 1, unit: 'px' },
      { type: 'slider', key: 'speed', label: '속도', min: 50, max: 200, step: 5, unit: '%' },
    ],
    generate: (p) => generateWillFlame(p as WillFlameParams),
  },
  {
    id: 'point-check',
    name: 'point-check',
    category: 'Point',
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
    id: 'streak-week',
    name: 'streak-week',
    category: 'Streak',
    defaultParams: streakWeekRowDefaults,
    loop: false,
    previewFrame: 52,
    controls: [
      { type: 'color', key: 'completeColor', label: '완료색', allowGradient: true },
      { type: 'color', key: 'incompleteColor', label: '미완료색' },
      { type: 'slider', key: 'completedCount', label: '완료 개수', min: 0, max: 7, step: 1 },
      { type: 'slider', key: 'staggerDelay', label: 'Stagger 딜레이', min: 0, max: 20, step: 1, unit: 'f' },
    ],
    generate: (p) => generateStreakWeekRow(p as StreakWeekRowParams),
  },
  {
    id: 'point-coin',
    name: 'point-coin',
    category: 'Point',
    loop: true,
    previewFrame: 95,
    defaultParams: coinFlipDefaults,
    controls: [
      { type: 'slider', key: 'speed', label: '속도', min: 50, max: 200, step: 5, unit: '%' },
    ],
    generate: (p) => generateCoinFlip(p as CoinFlipParams),
  },
]

export function getAnimation(id: string): AnimationDef | undefined {
  return ANIMATIONS.find((a) => a.id === id)
}
