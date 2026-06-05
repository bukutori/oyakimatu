import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // 👈 關鍵！改成點斜線（相對路徑），這樣不管在哪個倉庫、哪個分支部署，檔案都絕對抓得到，永遠不會變白屏！
})