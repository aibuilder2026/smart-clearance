import { expect, test, type Page } from '@playwright/test';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { api, mint, ORIGIN, PROD } from './auth.ts';
import { begin, running } from './flow.ts';
import { Stage, type Note } from './stage.ts';

// Admin and console tour (SC-199): about a minute on one laptop, the main points of the platform's own side.
//
// - the landing page, briefly, then the bar's Console;
// - the console's sign-in, its agents picked quickly, and Neha Kulkarni, a Super admin, signed in;
// - the Overview: its figures and its agents at work;
// - one client's agents configured: the pipeline, the Watcher's gates, the Lister's reserve, the Negotiator trusted to
//   act, the approval always on; every change goes to the client's audit log.
//
// The notes are green cards beside what is read, their caret pointing at it, and the rings and clicks are green
// (stage.ts `Cast.ink`, `Cast.notes`). It sets up no client: it configures one an earlier Admin and console E2E run set
// up (E2E_CLIENT, kaveri by default). Each setting it changes moves between two values, so every run saves a change and
// writes its audit line.
//
// E2E_LIVE=0 opens no monitor window (it records all the same).

/** the client whose agents the tour configures: one an earlier Admin and console E2E run set up */
const CLIENT = process.env.E2E_CLIENT ?? 'kaveri';
type Client = { id: string; name: string };
const toast = (page: Page) => page.locator('.toast').last();
/** a name's possessive: Kaveri Foods', Munchly's */
const of = (name: string) => (name.endsWith('s') ? `${name}'` : `${name}'s`);

const WHY = {
	site: {
		tag: 'Landing page',
		title: "The platform's front door",
		text: 'smartclearance.web.app shows a manufacturer what the agents do with short-dated stock, and leads to the console and to each client’s workspace.'
	},
	door: {
		tag: 'Console',
		title: "Smart-Clearance's own app",
		text: 'Console is where Smart-Clearance’s staff set up clients and configure their agents.'
	},
	signin: {
		tag: 'Sign in',
		title: 'The agents, before anyone signs in',
		text: 'Behind the sign-in the agents walk a batch through its nine stops; pick one and it says what it did.'
	},
	kpis: {
		tag: 'Dashboard',
		title: 'Every client, at a glance',
		text: 'Money recovered, batches in flight, plans waiting for a yes and agent runs, read live every 30 seconds.'
	},
	pipeline: {
		tag: 'Agents',
		title: 'Eleven agents, in the order they work',
		text: 'Each says how far it may go: Suggest, Ask before acting, or Act within its limits.'
	},
	gates: {
		tag: 'Watcher',
		title: 'The quick-commerce gates',
		text: 'The Watcher flags a batch once Blinkit, Zepto and Instamart would refuse it: too few days, or too little life left.'
	},
	reserve: {
		tag: 'Lister',
		title: 'A floor no buyer sees',
		text: 'The Lister never lists a lot below this price a pack on ExpireSoon, and hides it inside the client’s territories.'
	},
	autonomy: {
		tag: 'Negotiator',
		title: 'Trusted to answer bids',
		text: 'On Act, the Negotiator counters buyers on its own, never below its floor. Every change is in the audit log.'
	},
	approval: {
		tag: 'Control',
		title: 'Nothing moves without a yes',
		text: 'The approval cannot be switched off: every plan waits for one person, with the money on screen.'
	}
} satisfies Record<string, Note>;

/** a number field moved between two values, so every run changes it: the one it does not hold now */
const toggle = async (s: Stage, field: ReturnType<Page['locator']>, a: string, b: string) => {
	const now = await field.inputValue().catch(() => '');
	const next = now === a ? b : a;
	await s.type(field, next);
	return next;
};

test.describe.configure({ mode: 'serial' });

// eslint-disable-next-line no-empty-pattern
test('Admin and console tour: the landing page, the console and a client’s agents, in about a minute', async ({}, info) => {
	test.setTimeout(20 * 60_000);
	mint(['neha']);
	const clients = await api<Client[]>('console', 'neha', '/v1/console/clients');
	const client = clients.find((c) => c.id === CLIENT);
	if (!client) throw new Error(`no client ${CLIENT}: run Admin and console E2E first, or name one with E2E_CLIENT`);
	const video = info.outputPath('recording.mp4');
	const s = await Stage.open(
		info,
		{ flow: 'Admin and console tour', batch: `${of(client.name)} agents configured · Neha Kulkarni, Super admin` },
		video,
		{
			layout: 'one',
			holds: { neha: 'operator' },
			host: 'console',
			ink: 'green',
			notes: 'card',
			pace: 0.55,
			quiet: true
		}
	);
	const run = s.run;
	begin(run, CLIENT);
	running().figure('Target', PROD ? 'production' : 'this machine');
	let error: string | undefined;
	try {
		await s.ready({ operator: 'site' });
		await s.record();

		// the landing page, briefly
		await s.chapter('1 · The landing page', { n: 1, of: 3, title: 'The landing page, briefly' }, 900);
		const site = await s.open('neha', '/', 'opens smartclearance.web.app', 'site');
		await s.spot(site.locator('.hero h1').first(), WHY.site, 2800);
		const consoleLink = site.locator('.site-nav').getByRole('link', { name: 'Console', exact: true }).first();
		await s.spot(consoleLink, WHY.door, 2200);
		await consoleLink.evaluate((a, href) => {
			a.removeAttribute('target');
			a.setAttribute('href', href);
		}, ORIGIN.console + '/');
		await s.click(consoleLink, 300);
		await expect(site.locator('#si-email')).toBeVisible({ timeout: 30_000 });
		await s.address('operator');
		await running().done('The landing page, then the bar’s Console');

		// the sign-in: the agents picked quickly, then Neha signs in
		await s.chapter('2 · The console', { n: 2, of: 3, title: 'Into the console' }, 900);
		const chips = site.locator('.ag-crew .ag-chip');
		await site.waitForTimeout(500);
		for (const name of ['Watcher', 'You']) {
			const chip = chips.filter({ hasText: name }).first();
			if (await chip.isVisible().catch(() => false)) await s.click(chip, 500);
		}
		const caption = site.locator('.ag-caption').first();
		if (await caption.isVisible().catch(() => false)) await s.spot(caption, WHY.signin, 2300);
		await site.keyboard.press('Escape');
		const con = await s.open('neha', '/', 'signs in to the console', 'console');
		await expect(con.getByRole('heading', { level: 1 })).toHaveText('Overview', { timeout: 30_000 });
		await running().done('Neha signed in');

		// the Overview's main points
		const kpis = con.locator('.cs-ov-kpi');
		await expect(kpis).toHaveCount(4);
		await s.spot(con.locator('.cs-ov-kpis'), WHY.kpis, 2800);
		await running().done('The Overview: every client at a glance');

		// a client's agents, configured
		await s.chapter('3 · A client’s agents', { n: 3, of: 3, title: `${of(client.name)} agents, configured` }, 900);
		await s.open('neha', '/clients', `opens ${client.name}`);
		const row = con.locator('tr', { hasText: client.name }).first();
		await s.click(row, 400);
		await expect(con).toHaveURL(new RegExp(`/clients/${CLIENT}/agents`), { timeout: 20_000 });
		await s.run.act('Neha Kulkarni', 'Smart-Clearance staff · console', `configures ${of(client.name)} agents`);
		const pipe = con.locator('.cs-pipe');
		await expect(pipe).toBeVisible();
		await s.spot(pipe, WHY.pipeline, 2600);
		const agent = (name: string) => con.locator('.cs-pipe .cs-open', { hasText: name }).first();
		const insp = con.locator('.cs-insp');
		const save = async (name: string) => {
			const b = insp.getByRole('button', { name: 'Save', exact: true });
			if (!(await b.isEnabled().catch(() => false))) return;
			await s.click(b, 200);
			await expect(toast(con)).toContainText(`${name} saved`, { timeout: 15_000 });
		};

		await s.click(agent('Watcher'), 300);
		const days = await toggle(s, insp.locator('#set-watcher-blinkitDays'), '60', '65');
		await s.spot(insp.locator('#set-watcher-blinkitDays'), WHY.gates, 2700);
		await save('Watcher');
		running().figure('Watcher', `Blinkit takes stock with at least ${days} days`);

		await s.click(agent('Lister'), 300);
		const reserve = await toggle(s, insp.locator('#set-lister-reserve'), '12', '12.5');
		await s.spot(insp.locator('#set-lister-reserve'), WHY.reserve, 2700);
		await save('Lister');
		running().figure('Lister', `reserve ₹${reserve} a pack`);

		await s.click(agent('Negotiator'), 300);
		const auto = insp.getByRole('group', { name: 'Negotiator: autonomy' }).first();
		const acting = (await auto.getByRole('button', { name: 'Act' }).getAttribute('aria-pressed')) === 'true';
		const level = acting ? 'Ask' : 'Act';
		await s.click(auto.getByRole('button', { name: level }), 400);
		await expect(toast(con)).toHaveText(`Negotiator: ${level}, for ${client.name}`, { timeout: 15_000 });
		await s.spot(auto, WHY.autonomy, 2500);
		running().figure('Negotiator', level);

		await s.spot(con.locator('.cs-pipe .is-gate').first(), WHY.approval, 2400);
		await running().done(`${of(client.name)} agents configured`);
		// the last frame rests on the configured pipeline
		await s.reveal(con.locator('.cs-pipe'));
		await con.waitForTimeout(1200);
	} catch (e) {
		error = (e as Error).message;
		throw e;
	} finally {
		const md = run.write(error ? 'failed' : 'passed', error);
		await info.attach('report.md', { body: md, contentType: 'text/markdown' });
		await s.close();
		const keep = process.env.E2E_KEEP;
		if (keep && existsSync(video)) {
			mkdirSync(dirname(keep), { recursive: true });
			copyFileSync(video, keep);
			const chapters = video.replace(/\.mp4$/, '.chapters.json');
			if (existsSync(chapters)) copyFileSync(chapters, keep.replace(/\.mp4$/, '.chapters.json'));
		}
	}
});
