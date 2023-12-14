import autoImport from 'unplugin-auto-import/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    autoImport({
      imports: 'vitest',
    }),
  ],
  test: {
    coverage: {
      include: ['src'],
      provider: 'istanbul',
      reporter: ['lcov', 'json', 'text'],
    },
    environment: 'jsdom',
    include: ['test/*.{test,spec}.?(c|m)[jt]s?(x)'],
  },
})
