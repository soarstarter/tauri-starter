import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// "Core" suite: the fast logic subset (plain `.ts` tests) run as `pnpm test`.
// jsdom is used so tests that touch `window` (the Tauri IPC/event wrappers) work
// here too; component (`.tsx`) and integration (`test/`) tests live in the full
// suite. Domain tests get added by glob as their phases land.
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
    include: ['shared/**/*.test.ts', 'src/**/*.test.ts'],
    setupFiles: ['./test/setup.ts'],
  },
})
