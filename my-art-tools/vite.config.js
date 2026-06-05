import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // 👈 關鍵！改成點斜線（相對路徑），這樣不管 GitHub 怎麼迷路，它都會在「同一個資料夾」裡直接抓檔案，再也不會 404！
})