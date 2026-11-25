import { defineConfig, devices } from '@playwright/test';

const chrome = process.env.CHROME_PATH || (process.env.CI ? undefined : '/usr/bin/google-chrome');
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:4321',
    launchOptions: chrome ? { executablePath: chrome } : {},
    trace: 'retain-on-failure',
  },
  webServer: process.env.BASE_URL ? undefined : { command: 'node scripts/serve.mjs', url: 'http://localhost:4321', reuseExistingServer: true },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 860 } } },
    { name: 'mobile-360', use: { ...devices['Pixel 5'], viewport: { width: 360, height: 740 }, defaultBrowserType: 'chromium' } },
  ],
});
