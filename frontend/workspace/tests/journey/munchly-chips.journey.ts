import { test } from '@playwright/test';
import { mint } from './auth.ts';
import { CHIPS, HERO, PEOPLE } from './chips.ts';
import { begin } from './flow.ts';
import { Run } from './record.ts';

// Munchly Chips E2E (SC-95): the Masala Chips 150 g batch (MF-2409-117, Rakesh Traders, Nagpur) from a fresh journey to
// Impact's report, on the happy path, every person acting in the real UI in turn: Neha in the console, Priya (Supply
// Chain), Rakesh (the distributor), each of his kiranas, Agrawal Wholesale on ExpireSoon, and Priya again for the
// papers and the ledger (SC-127). The agents do the rest on live Gemini, through the local pull worker. The steps follow backend-api's walk
// (src/sc_api/cli/walk.py), which takes the same journey over HTTP. The Mango Drink is flagged too and is left where
// the agents take it: this flow is the chips'.
//
// E2E_DAY_MINUTES (60, Rehearsal): the journey day the reset starts; a 48-hour offer is open 2 hours of real time.
// E2E_FROM=<step id> resumes on the journey as it stands; E2E_UNTIL=<step id> stops after that step.

// The steps live in chips.ts, which Munchly Chips Leftover E2E (SC-116) shares.
const STEPS = CHIPS;

let run: Run;

test.describe.configure({ mode: 'serial' });

test('Munchly Chips E2E: the Masala Chips batch, end to end, every person in the real UI', async ({ page }, info) => {
	run = new Run(page, info);
	begin(run, HERO);
	mint(PEOPLE);
	const from = process.env.E2E_FROM ? STEPS.findIndex((s) => s.id === process.env.E2E_FROM) : 0;
	const to = process.env.E2E_UNTIL ? STEPS.findIndex((s) => s.id === process.env.E2E_UNTIL) : STEPS.length - 1;
	let error: string | undefined;
	try {
		for (const s of STEPS.slice(from, to + 1)) {
			run.stage = `${STEPS.indexOf(s) + 1}/${STEPS.length}`;
			await test.step(s.title, () => s.run(page));
		}
	} catch (e) {
		error = (e as Error).message;
		throw e;
	} finally {
		const md = run.write(error ? 'failed' : 'passed', error);
		await info.attach('report.md', { body: md, contentType: 'text/markdown' });
	}
});
