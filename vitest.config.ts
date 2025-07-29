import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'src/**/__tests__/**/*.(test|spec).+(ts|tsx|js)',
      'src/**/*.(test|spec).+(ts|tsx|js)',
    ],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/**/__tests__/**', 'src/**/index.ts'],
      reporter: ['text', 'lcov', 'html'],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
    testTimeout: 10000,
  },
})
