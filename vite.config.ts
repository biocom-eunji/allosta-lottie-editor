import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages 프로젝트 사이트: /allosta-lottie-editor/ 하위 경로로 서빙.
// 로컬 dev 는 '/' 루트 사용.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/allosta-lottie-editor/' : '/',
  plugins: [react(), tailwindcss()],
}))
