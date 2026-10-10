import { test } from '@playwright/test';
import { mint } from './auth.ts';
import { begin } from './flow.ts';
import { HERO, MANGO, PEOPLE } from './mango.ts';
import { Run } from './record.ts';

// Munchly Mango E2E (SC-104): the Mango Drink 200 ml batch (MF-2410-118, Lakshmi Agencies, Hyderabad) taken on from
// wherever its journey stands to Impact's report, on the happy path. It never resets the journey: each step reads the
// case first and is skipped when it is done.
//
// E2E_FROM=<step id> and E2E_UNTIL=<step id> run part of it.

// The steps live in mango.ts, which Munchly Mango Leftover E2E (SC-135) shares.
const STEPS = MANGO;

let run: Run;

test.describe.configure({ mode: 'serial' });

test('Munchly Mango E2E: the Mango Drink batch, from where it stands, every person in the real UI', async ({
	page
}, info) => {
	run = new Run(page, info, {
		flow: 'Munchly Mango E2E',
		batch: 'MF-2410-118, Mango Drink 200 ml, Lakshmi Agencies, Hyderabad'
	});
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
