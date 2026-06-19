import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { applyBrandTheme } from './tokens/colors'

// 브랜드 키컬러(BRAND_HEX)를 CSS 변수에 주입 — 전 UI의 brand 유틸이 이를 참조
applyBrandTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
