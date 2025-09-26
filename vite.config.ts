import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/NMS_Trade-frontend/', // <-- Add this line
  plugins: [vue()],
})