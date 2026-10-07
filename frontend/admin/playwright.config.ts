import { defineConfig, devices } from '@playwright/test';

// The landing page's browser suites, run against the production build (vite preview on :4174):
// - test:a11y, the a11y suite (SC-58): WCAG 2.2 AA with axe-core in five viewport and theme projects, and the keyboard
//   and motion behaviour axe cannot see, then the coverage check (every core component the landing page uses, on
//   screen in a scan: testing/src/a11y-coverage.ts). The dev route /ds is not scanned;
// - test:e2e: a smoke run in Firefox and WebKit, the Tech Stack's other browsers.
// Each script builds first. Firefox and WebKit need `playwright install firefox webkit`.
const A11Y = /.*\.a11y\.spec\.ts/;
export default defineConfig({
	testDir: 'tests/e2e',
	timeout: 120_000,
	fullyParallel: true,
	workers: 4,
	retries: 0,
	reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
	use: {
		baseURL: 'http://127.0.0.1:4174',
		// reduced motion settles every animation at once, so contrast is measured on final colours
		contextOptions: { reducedMotion: 'reduce' },
		trace: 'retain-on-failure'
	},
	webServer: {
		command: 'corepack pnpm exec vite preview --port 4174 --strictPort --host 127.0.0.1',
		url: 'http://127.0.0.1:4174/',
		reuseExistingServer: false,
		stdout: 'ignore',
		stderr: 'pipe'
	},
	projects: [
		{ name: 'desktop-light', testMatch: A11Y, use: { viewport: { width: 1440, height: 900 }, colorScheme: 'light' } },
		{ name: 'desktop-dark', testMatch: A11Y, use: { viewport: { width: 1440, height: 900 }, colorScheme: 'dark' } },
		{
			name: 'tablet-light',
			testMatch: A11Y,
			use: { viewport: { width: 820, height: 1180 }, colorScheme: 'light', hasTouch: true }
		},
		{
			name: 'phone-light',
			testMatch: A11Y,
			use: {
				viewport: { width: 390, height: 844 },
				colorScheme: 'light',
				isMobile: true,
				hasTouch: true,
				deviceScaleFactor: 2
			}
		},
		{
			name: 'phone-dark',
			testMatch: A11Y,
			use: {
				viewport: { width: 390, height: 844 },
				colorScheme: 'dark',
				isMobile: true,
				hasTouch: true,
				deviceScaleFactor: 2
			}
		},
		{
			name: 'firefox-desktop',
			testMatch: /smoke\.spec\.ts/,
			use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 900 } }
		},
		{ name: 'webkit-tablet', testMatch: /smoke\.spec\.ts/, use: { ...devices['iPad (gen 7)'] } },
		{ name: 'webkit-phone', testMatch: /smoke\.spec\.ts/, use: { ...devices['iPhone 13'] } }
	]
});
