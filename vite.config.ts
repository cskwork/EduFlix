import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    // 터널 등 외부 도메인으로 dev 서버에 접근할 때만 설정
    // 예: VITE_ALLOWED_HOSTS=eduflix.example.com,another.example.com
    allowedHosts: process.env.VITE_ALLOWED_HOSTS?.split(',').map((host) => host.trim()) ?? [],
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
