import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  test: {
    environment: 'node',
    // These tests talk to the real dev database. They create their own rows,
    // prefixed so they are identifiable, and clean up after themselves; they
    // never touch seeded content.
    fileParallelism: false,
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30_000,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      // 'server-only' throws outside a Next server context. The modules it
      // guards are exactly the ones worth testing, so it is stubbed here.
      'server-only': resolve(__dirname, 'tests/server-only-stub.ts'),
    },
  },
})
