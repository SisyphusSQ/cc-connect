import { defineConfig, searchForWorkspaceRoot } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', 'react-i18next', 'i18next', 'zustand', 'react-router-dom'],
    alias: [
      { find: '@factor', replacement: path.resolve(__dirname, './src') },
      { find: '@', replacement: path.resolve(__dirname, '../web/src') },
    ],
  },
  server: {
    port: 9821,
    fs: {
      allow: [searchForWorkspaceRoot(process.cwd()), path.resolve(__dirname, '..')],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:9820',
        changeOrigin: true,
        timeout: 45000,
      },
      '/bridge': {
        target: 'http://localhost:9810',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/react-markdown/') || id.includes('/remark-') || id.includes('/rehype-') || id.includes('/highlight.js/')) return 'markdown';
          if (id.includes('/@ant-design/icons/') || id.includes('/antd/') || id.includes('/@rc-component/') || id.includes('/rc-')) return 'antd';
          if (id.includes('/react-dom/') || id.includes('/react-router/') || id.includes('/react-router-dom/')) return 'react-runtime';
          if (id.includes('/qrcode.react/')) return 'qrcode';
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 900,
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
});
