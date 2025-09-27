import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { BASE_ROUTE } from './src/config';

export default defineConfig({
  base: BASE_ROUTE,
  plugins: [vue()],
});
