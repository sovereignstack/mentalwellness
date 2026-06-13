import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Dedicated test config (no PWA plugin) — runs RTL component tests in jsdom.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': new URL('../shared', import.meta.url).pathname,
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: false,
  },
});
