import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/english-ii-craft/' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      // 所有 /api 转发到 Django 后端(开发阶段)
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      // 开发时 Django /admin、/api/schema/docs 也要能通过
      '/admin': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
});
