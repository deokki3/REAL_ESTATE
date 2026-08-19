import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Tailwind v4: 여기서 플러그인으로 붙인다.
// tailwind.config.js / postcss.config.js / npx tailwindcss init 은 v3 방식이므로 쓰지 않는다.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      // 개발 중 /api/* 를 서버로 넘긴다. 그래서 브라우저 입장에서 동일 출처가 되고 CORS 설정이 필요 없다.
      // 클라이언트 코드에는 절대 http://localhost:4000 을 적지 않는다.
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
