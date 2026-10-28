/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Django during `npm run dev`. Locally the backend from docker compose on port 8000;
// inside the compose frontend container it will be http://backend:8000.
const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:8000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // The browser sees one origin (localhost:5173), so the session and CSRF cookies just work.
    // changeOrigin must be false (the string shorthand would turn it on): Django then gets
    // Host localhost:5173, matching the Origin header, and its CSRF check accepts POST requests.
    proxy: Object.fromEntries(
      ['/api', '/admin', '/static'].map((path) => [path, { target: backendUrl, changeOrigin: false }]),
    ),
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
