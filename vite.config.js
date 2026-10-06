import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Two backends share the /api prefix: auth-api (Go, RBAC.md/auth-flow.md)
  // owns /api/auth, /api/me, /api/projects, /api/segments, /api/jobs,
  // /api/segment-jobs, /api/audio-versions — everything else (/api/voices,
  // /api/recordings, /api/synthesize, /api/clones, /api/media) stays on the
  // Python TTS API. Order matters: more specific keys must come first.
  server: {
    proxy: {
      '/healthz': { target: 'http://127.0.0.1:8080' },
      '/api/admin': { target: 'http://127.0.0.1:8080', timeout: 0, proxyTimeout: 0 },
      '/api/usage': { target: 'http://127.0.0.1:8080', timeout: 0, proxyTimeout: 0 },
      '/api/auth': { target: 'http://127.0.0.1:8080', timeout: 0, proxyTimeout: 0 },
      '^/api/me(?:[?]|$)': { target: 'http://127.0.0.1:8080', timeout: 0, proxyTimeout: 0 },
      '/api/projects': { target: 'http://127.0.0.1:8080', timeout: 0, proxyTimeout: 0 },
      '/api/segments': { target: 'http://127.0.0.1:8080', timeout: 0, proxyTimeout: 0 },
      '/api/jobs': { target: 'http://127.0.0.1:8080', timeout: 0, proxyTimeout: 0 },
      '/api/segment-jobs': { target: 'http://127.0.0.1:8080', timeout: 0, proxyTimeout: 0 },
      '/api/audio-versions': { target: 'http://127.0.0.1:8080', timeout: 0, proxyTimeout: 0 },
      '/api': { target: 'http://127.0.0.1:8000', timeout: 0, proxyTimeout: 0 },
    },
  },
  preview: {
    proxy: {
      '/healthz': { target: 'http://127.0.0.1:8080' },
      '/api/admin': { target: 'http://127.0.0.1:8080', timeout: 0, proxyTimeout: 0 },
      '/api/usage': { target: 'http://127.0.0.1:8080', timeout: 0, proxyTimeout: 0 },
      '/api/auth': { target: 'http://127.0.0.1:8080', timeout: 0, proxyTimeout: 0 },
      '^/api/me(?:[?]|$)': { target: 'http://127.0.0.1:8080', timeout: 0, proxyTimeout: 0 },
      '/api/projects': { target: 'http://127.0.0.1:8080', timeout: 0, proxyTimeout: 0 },
      '/api/segments': { target: 'http://127.0.0.1:8080', timeout: 0, proxyTimeout: 0 },
      '/api/jobs': { target: 'http://127.0.0.1:8080', timeout: 0, proxyTimeout: 0 },
      '/api/segment-jobs': { target: 'http://127.0.0.1:8080', timeout: 0, proxyTimeout: 0 },
      '/api/audio-versions': { target: 'http://127.0.0.1:8080', timeout: 0, proxyTimeout: 0 },
      '/api': { target: 'http://127.0.0.1:8000', timeout: 0, proxyTimeout: 0 },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    // e2e/ holds Playwright specs (playwright.config.js), not Vitest ones —
    // exclude them so `npm test` doesn't try to run them as unit tests.
    exclude: ['e2e/**', 'node_modules/**'],
  },
})
