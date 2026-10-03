import { defineConfig } from '@playwright/test';

// WCAG checks for design v3. serve.py serves design3/ (the folder above this one); the pages load React
// from unpkg, so the run needs a network connection.
export default defineConfig({
  testDir: '.',
  testMatch: /.*\.a11y\.spec\.ts/,
  timeout: 240_000,
  fullyParallel: true,
  workers: 4,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  globalSetup: './setup.mjs',
  globalTeardown: './summarize.mjs',
  use: {
    baseURL: 'http://127.0.0.1:8790',
    // reduced motion settles every animation at once, so contrast is measured on final colours
    contextOptions: { reducedMotion: 'reduce' },
    trace: 'off',
  },
  webServer: {
    command: 'python3 serve.py 8790',
    url: 'http://127.0.0.1:8790/demo/Smart-Clearance%20demo%20v3.html',
    reuseExistingServer: true,
    stdout: 'ignore',
    stderr: 'ignore',
  },
  projects: [
    { name: 'desktop-light', use: { viewport: { width: 1440, height: 900 }, colorScheme: 'light' } },
    { name: 'desktop-dark', use: { viewport: { width: 1440, height: 900 }, colorScheme: 'dark' } },
    { name: 'tablet-light', use: { viewport: { width: 820, height: 1180 }, colorScheme: 'light', hasTouch: true } },
    { name: 'phone-light', use: { viewport: { width: 390, height: 844 }, colorScheme: 'light', isMobile: true, hasTouch: true, deviceScaleFactor: 2 } },
    { name: 'phone-dark', use: { viewport: { width: 390, height: 844 }, colorScheme: 'dark', isMobile: true, hasTouch: true, deviceScaleFactor: 2 } },
  ],
});
