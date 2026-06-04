import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/oyakimatu/', // 👈 記得改成你的 GitHub 專案名稱，前後都要有斜線！
})