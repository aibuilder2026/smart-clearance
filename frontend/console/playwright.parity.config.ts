import { defineConfig } from '@playwright/test';

// Pixel parity with the prototype, as the landing page's: each screen of design3/console (served by
// design3/a11y/serve.py on :8790) and of this build (vite preview on :4178), screenshotted side by side and compared
// with pixelmatch. The report holds each pair and its diff. The prototype loads React from unpkg and fonts from Google,
// so the run needs the network.
export default defineConfig({
	testDir: 'tests/parity',
	testMatch: /.*\.parity\.ts/,
	timeout: 300_000,
	fullyParallel: true,
	workers: 4,
	retries: 0,
	reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report/parity' }]],
	use: { contextOptions: { reducedMotion: 'reduce' }, trace: 'off' },
	webServer: [
		{
			command: 'python3 serve.py 8790',
			cwd: '../../design3/a11y',
			url: 'http://127.0.0.1:8790/console/Smart-Clearance%20console%20v3.html',
			reuseExistingServer: true,
			stdout: 'ignore',
			stderr: 'ignore'
		},
		{
			command: 'corepack pnpm exec vite preview --port 4178 --strictPort --host 127.0.0.1',
			url: 'http://127.0.0.1:4178/',
			reuseExistingServer: false,
			stdout: 'ignore',
			stderr: 'pipe'
		}
	],
	projects: [
		{ name: 'desktop-light', use: { viewport: { width: 1440, height: 900 }, colorScheme: 'light' } },
		{ name: 'desktop-dark', use: { viewport: { width: 1440, height: 900 }, colorScheme: 'dark' } },
		{ name: 'tablet-light', use: { viewport: { width: 820, height: 1180 }, colorScheme: 'light' } },
		{
			name: 'phone-light',
			use: { viewport: { width: 390, height: 844 }, colorScheme: 'light', isMobile: true, hasTouch: true }
		},
		{
			name: 'phone-dark',
			use: { viewport: { width: 390, height: 844 }, colorScheme: 'dark', isMobile: true, hasTouch: true }
		}
	]
});
