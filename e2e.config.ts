import type { E2EConfig } from 'e2e';
import { web } from '@e2e-dev/web';
import { existsSync } from 'node:fs';

// Local test accounts (gitignored): E2E_USER_ADMIN_* / E2E_USER_MEMBER_*.
if (existsSync('.env.e2e')) process.loadEnvFile('.env.e2e');

// Deterministic suite (screen + expect + fetch): no agent steps, so no model
// is configured and runs cost nothing. The stack (Vite :5173 → Python API
// :8000 + Go auth-api :8080) must already be running.
export default {
  targets: [
    {
      name: 'web',
      engine: web({ locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh' }),
      app: { url: process.env.APP_URL ?? 'http://localhost:5173' },
    },
  ],
  tests: 'tests/**/*.e2e.ts',
  // One shared auth backend with login rate limiting (5 / 10 s): keep files serial.
  workers: 1,
  credentials: {
    admin: { username: process.env.E2E_USER_ADMIN_USERNAME ?? '', password: () => process.env.E2E_USER_ADMIN_PASSWORD ?? '' },
    member: { username: process.env.E2E_USER_MEMBER_USERNAME ?? '', password: () => process.env.E2E_USER_MEMBER_PASSWORD ?? '' },
  },
} satisfies E2EConfig;
