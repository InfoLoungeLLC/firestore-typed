import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.emulator.(test|spec).+(ts|tsx|js)'],
    testTimeout: 30000,
  },
})
