import { defineConfig } from 'vitest/config'

// A dedicated Vitest config keeps test tooling independent of the Start build
// pipeline. jsdom + Testing Library cover component tests; pure logic (domain,
// permissions, date helpers) runs in the same suite without a DOM. The "@/*"
// alias is resolved natively from tsconfig.json (Vite 8+).
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    css: false,
  },
})
