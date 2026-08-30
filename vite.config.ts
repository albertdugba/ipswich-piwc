import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vite is the single build tool for the app: it drives TanStack Start (SSR +
// server functions), Tailwind and the React transform. The "@/*" path alias is
// resolved natively from tsconfig.json (Vite 8+).
export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    // Tailwind CSS v4 (no separate postcss config needed).
    tailwindcss(),
    // TanStack Start must come before the React plugin. The build emits a
    // standard fetch handler at dist/server/server.js; server.mjs bridges it to
    // a Node HTTP server for self-hosting (`pnpm start`). For serverless/edge
    // hosts, deploy that handler directly instead.
    tanstackStart(),
    viteReact(),
  ],
})
