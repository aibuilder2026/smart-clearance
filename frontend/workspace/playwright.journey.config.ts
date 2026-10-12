import { defineConfig } from '@playwright/test';

// Munchly Chips E2E (SC-95): the Masala Chips batch's live journey, end to end, in a real browser, on this machine's
// stack: backend-api (backend-api/scripts/dev.sh, :8000), the agents' pull worker (agents/scripts/dev.sh), and the
// workspace app's and the console's dev servers (:5175, :5174) with their .env.local pointing at the API
// (backend-api/scripts/app-env.sh). Each person is signed in with a Firebase custom token (tests/journey/auth.ts), so
// no password is handled. One page drives every person in turn, so the whole journey is one recording.
//
//   corepack pnpm test:journey                      Munchly Chips E2E, headless, recorded (it resets the journey)
//   corepack pnpm test:journey:mango                Munchly Mango E2E (SC-104), from where the journey stands
//   corepack pnpm test:journey:leftover             Munchly Chips Leftover E2E (SC-116): kiranas that do not order,
//                                                   closed by Report now (it resets the journey)
//   corepack pnpm test:journey:mango-leftover       Munchly Mango Leftover E2E (SC-135): the Mango Drink with kiranas
//                                                   that do not buy, settled on expiry day (it resets the journey)
//   corepack pnpm test:journey:sad                  Munchly Chips Sad Path E2E (SC-179, SC-184): two kiranas order, the
//                                                   window closes on the rest, the packs left destroyed at the godown;
//                                                   three screens side by side, everyone signing in on screen, recorded
//                                                   as one video (it resets the journey)
//   corepack pnpm test:journey:mango-stage          Munchly Mango E2E on three screens (SC-190): the Mango Drink's happy
//                                                   path from a fresh journey, everyone signing in on screen, with the
//                                                   stage's notes, recorded as one video (it resets the journey)
//   corepack pnpm test:journey:admin                Admin and console E2E on three screens (SC-191): a prospect books a
//                                                   demo on the landing page, Neha sets the company up as a client and
//                                                   configures it, Support is refused a plan change, the dashboards
//                                                   (each run adds a client; it never resets the journey)
//   corepack pnpm test:journey --headed             watch it run (E2E_SLOWMO=250 slows each action, in ms)
//   corepack pnpm test:journey --ui                 Playwright's UI mode, step by step
//
// Like the other browser suites it runs on request only (SC-55). It resets Munchly's journey first, and the agents
// call live Gemini (about GBP 0.05-0.10 a journey) unless the worker runs with MODEL_TIER=stub.
export default defineConfig({
	testDir: 'tests/journey',
	testMatch: /.*\.journey\.ts/,
	outputDir: 'test-results/journey',
	timeout: 45 * 60_000,
	expect: { timeout: 20_000 },
	fullyParallel: false,
	workers: 1,
	retries: 0,
	reporter: [
		['list'],
		['html', { open: 'never', outputFolder: 'playwright-report-journey' }],
		['json', { outputFile: 'test-results/journey/results.json' }]
	],
	use: {
		viewport: { width: 1440, height: 900 },
		colorScheme: 'light',
		video: { mode: 'on', size: { width: 1440, height: 900 } },
		// a run's full trace is about half a gigabyte: kept when it fails, or always with E2E_TRACE=on
		trace: process.env.E2E_TRACE === 'on' ? 'on' : 'retain-on-failure',
		screenshot: 'only-on-failure',
		actionTimeout: 20_000,
		launchOptions: { slowMo: Number(process.env.E2E_SLOWMO ?? 0) },
		// a live build registers a service worker (the offline shell and pushes, SC-73): on production it would serve the
		// app's cached shell for the bare page auth.ts signs a person in from, so the app's code would race the session
		// put in place (SC-137). The dev servers register none
		serviceWorkers: 'block'
	},
	// one project a flow, so running one never starts another (the chips flows reset the journey; the Mango's never does)
	projects: [
		{ name: 'Munchly Chips E2E', testMatch: /munchly-chips\.journey\.ts/ },
		{ name: 'Munchly Mango E2E', testMatch: /munchly-mango\.journey\.ts/ },
		{ name: 'Munchly Chips Leftover E2E', testMatch: /munchly-chips-leftover\.journey\.ts/ },
		{ name: 'Munchly Mango Leftover E2E', testMatch: /munchly-mango-leftover\.journey\.ts/ },
		// SC-179: three screens at once, its own browsers and its own recording (stage.ts)
		{ name: 'Munchly Chips Sad Path E2E', testMatch: /munchly-chips-sad\.journey\.ts/ },
		{ name: 'Munchly Mango Stage E2E', testMatch: /munchly-mango-stage\.journey\.ts/ },
		// SC-191: the platform's own side, the landing page and the console, on the same stage
		{ name: 'Admin Console E2E', testMatch: /admin-console\.journey\.ts/ }
	]
});
