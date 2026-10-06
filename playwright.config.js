import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  // Several specs wait up to 60s for a real CPU TTS synthesis to finish
  // (inner `expect(..., { timeout: 60000 })`); the per-test timeout must be
  // longer than that, or Playwright kills the test — and with it the
  // worker-scoped shared page from fixtures.js — well before the inner
  // wait resolves, cascading into "page has been closed" on every test after.
  timeout: 90_000,
  use: {
    baseURL: 'http://localhost:5183',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev -- --port 5183 --strictPort',
    url: 'http://localhost:5183',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
