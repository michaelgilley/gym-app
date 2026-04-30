import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.GYM_APP_PORT ?? 8765);
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    serviceWorkers: 'block',
  },

  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
      animations: 'disabled',
      caret: 'hide',
    },
  },

  projects: [
    {
      // iPhone 13 → defaultBrowserType: webkit (matches the iOS Safari this
      // PWA actually runs in). Snapshots are platform-specific so changing
      // engines later will require regenerating baselines.
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
  ],

  webServer: {
    command: `python3 -m http.server ${PORT} --directory .`,
    url: `${BASE_URL}/index.html`,
    reuseExistingServer: true,
    timeout: 10_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
