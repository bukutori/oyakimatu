// 📁 修改位置：my-art-tools/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // 👈 換成最標準的 react 套件，不要用 swc 了！

export default defineConfig({
  plugins: [react()],
  base: '/oyakimatu/', // 👈 這裡記得一樣要維持你 GitHub 倉庫的名字喔！
})