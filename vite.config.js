import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

export default defineConfig({
  plugins: [uni()],
  build: {
    // 题库较大，放宽 chunk 体积告警阈值
    chunkSizeWarningLimit: 2048
  }
})
