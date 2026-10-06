import { defineConfig } from '@playwright/test';

// The console and the landing page end to end against the local backend-api and Firebase Authentication: a demo
// request on the landing page becomes a client in the console, with real sign-ins and the real audit log. Run it with
// backend-api/scripts/e2e.sh, which starts nothing it doesn't need and hands the tests the default password (from
// Secret Manager, never on disk). It changes the local database; backend-api/scripts/hydrate.sh --reset rebuilds it.
export default defineConfig({
	testDir: 'tests/live',
	timeout: 120_000,
	workers: 1,
	retries: 0,
	reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report-live' }]],
	use: {
		viewport: { width: 1440, height: 900 },
		contextOptions: { reducedMotion: 'reduce' },
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure'
	},
	// the dev servers, with the .env.local backend-api/scripts/console-env.sh writes; reused when already running
	webServer: [
		{
			command: 'corepack pnpm exec vite dev --port 5174 --strictPort',
			url: 'http://localhost:5174/',
			reuseExistingServer: true,
			stdout: 'ignore',
			stderr: 'pipe'
		},
		{
			command: 'corepack pnpm --filter @smart-clearance/admin exec vite dev --port 5173 --strictPort',
			url: 'http://localhost:5173/',
			reuseExistingServer: true,
			stdout: 'ignore',
			stderr: 'pipe'
		}
	]
});
