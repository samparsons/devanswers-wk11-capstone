import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
    css: true,
    // Playwright E2E specs live in tests/e2e and must not be picked up by Vitest.
    exclude: ['**/node_modules/**', 'tests/e2e/**'],
  },
})
