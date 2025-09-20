// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  base: '/NMS_Trade-frontend/',
  plugins: [vue()],
});