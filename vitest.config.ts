import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// "All" suite: component + integration tests that need a DOM.
export default defineConfig({
  resolve: {
    alias: [
      { find: '@/shared', replacement: resolve(__dirname, 'shared') },
      { find: '@', replacement: resolve(__dirname, 'src') },
    ],
  },
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}', 'shared/**/*.test.ts', 'test/**/*.test.{ts,tsx}'],
    setupFiles: ['./test/setup.ts'],
  },
})
