import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const narrationProxy = {
  '/api/narration': {
    target: process.env.READ_ATLAS_URL ?? 'http://127.0.0.1:4317',
    changeOrigin: true,
  },
};

export default defineConfig({
  base: './',
  plugins: [react()],
  server: { proxy: narrationProxy },
  preview: { proxy: narrationProxy },
  test: { environment: 'node' },
});
