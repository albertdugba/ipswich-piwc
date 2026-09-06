import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { nitro } from 'nitro/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    tsconfigPaths: true,
  },
  // nitro() sits between tanstackStart() and the React plugin. It compiles the
  // server into the host's runtime — on Vercel it auto-detects the environment
  // and emits Vercel Functions (zero-config); locally it builds a Node server.
  plugins: [tailwindcss(), tanstackStart(), nitro(), viteReact()],
})
