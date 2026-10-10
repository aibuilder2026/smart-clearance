import { expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { api, openAs, person } from './auth.ts';
import type { Run } from './record.ts';

// What the journey flows share (SC-95, SC-104): the story's people and kiranas, a batch's case as backend-api answers
// it, waiting on the agents, opening an app as someone with the recording's caption naming them, and the soft checks
// against the story. A flow calls begin() with its run and its batch first.

export const WS = '/v1/workspaces/munchly';
/** what the agents take on live Gemini, with room for a retry or two */
export const AGENT_WAIT = 6 * 60_000;

export type Kirana = {
	id: string;
	name: string;
	member: string;
	orders: number;
	sales14: number;
	distributor: string;
};
export type Member = { id: string; name: string; role: string };
export type Case = {
	journey: {
		phase: string;
		photo: { status: string };
		listing: { id: string; status: string; units: number; price: number } | null;
		offer: { status: string; shops: number } | null;
		orders: { units: number; by?: string }[];
		bids: { id: string; status: string; price: number; counter?: number }[];
		award: { units: number; price: number; token: number } | null;
		truck: { status: string };
		van: { status: string };
		staff: { status: string; units: number; sold: number | null; godown: string } | null;
		invoiceIssued: boolean;
		reviewed: boolean;
		posted: boolean;
	};
	plan: { net: number; lines: { id: string; units: number }[] } | null;
	/** the batch, with what the Watcher read of it when it flagged it */
	batch: { assess?: { atRisk: number } | null };
	writeOff: { total: number } | null;
	actual: { net: number } | null;
	docs: {
		id: string;
		type: string;
		no: string;
		status: string;
		pdf: boolean;
		units?: number | null;
		amount?: number | null;
		reversed?: number | null;
		/** the destruction certificate of packs destroyed at his godown (SC-139), the agency's */
		at?: string | null;
	}[];
	donation: { status: string; partner: string | null; units: number } | null;
	moments: { van: { leavesAt: string | null } };
	push: Record<string, { title: string }>;
	feed: { key: string; text: string }[];
	kiranas: { id: string; name: string }[];
	realised: { lines: { id: string; units: number }[]; godown: number } | null;
	/** expiry day's settlement of the packs left at the godown (SC-94); under route B (SC-139) with the note's amount */
	expiry: {
		policy: string;
		units: number;
		credit: number | null;
		amount?: number | null;
		gst?: number;
		charges?: number;
		destroyedBy: string | null;
	} | null;
	/** packs destroyed at his godown (SC-139): the evidence he sent, Vision's checks and the operator's yes */
	destruction?: {
		status: string;
		units: number;
		reason: string | null;
		agency: { id: string; name: string } | null;
		certificate: string | null;
		checks: { id: string; label: string; ok: boolean }[];
		approvedBy: string | null;
	} | null;
};

/** one step of a flow: it acts in the UI, then waits for what follows from it */
export type Step = { id: string; title: string; run: (page: Page) => Promise<void> };

export const STORY = JSON.parse(
	readFileSync(new URL('../../../../backend-api/src/sc_api/reference/journey.json', import.meta.url), 'utf8')
) as { kiranas: Kirana[]; members: Member[]; rules: { shopCapTimes: number } };

/** a distributor's kiranas that order in the story, in the story's order */
export const kiranasOf = (distributor: string) =>
	STORY.kiranas.filter((k) => k.distributor === distributor && k.orders > 0);

export const ROLES: Record<string, string> = {
	neha: 'Smart-Clearance staff · console',
	priya: 'Supply Chain',
	rakesh: 'Distributor',
	'lakshmi-owner': 'Distributor',
	agrawal: 'Bidder on ExpireSoon',
	meera: 'Food bank'
};

let here: { run: Run; ref: string } | null = null;
/** the run under way and the batch it takes: every helper below reads them */
export function begin(run: Run, ref: string) {
	here = { run, ref };
}
const now = () => {
	if (!here) throw new Error('call begin(run, ref) first');
	return here;
};
/** the run under way, for steps shared between flows (chips.ts, mango.ts, ledger.ts) */
export const running = () => now().run;
/** the batch the run takes */
export const hero = () => now().ref;

/** the batch's case as someone sees it, or null before the Watcher has flagged it */
export async function caseAs(who: string): Promise<Case | null> {
	try {
		return await api<Case>('workspace', who, `${WS}/cases/${now().ref}`);
	} catch {
		return null;
	}
}

/** waits for the agents: polls the case as someone until the check holds, then returns it */
export async function until(
	what: string,
	who: string,
	check: (c: Case) => boolean,
	timeout = AGENT_WAIT
): Promise<Case> {
	let got: Case | null = null;
	const holds = async () => {
		got = await caseAs(who);
		return got ? check(got) : false;
	};
	await expect.poll(holds, { message: what, timeout, intervals: [2000] }).toBe(true);
	return got!;
}

/** the splash (design3/console/splash.js) has lifted off the page */
export async function settled(page: Page) {
	await expect(page.locator('html')).not.toHaveClass(/cs-covered/, { timeout: 60_000 });
	await expect(page.locator('.cs-splash')).toHaveCount(0, { timeout: 15_000 });
}

/** someone opens the workspace app at a path, with the caption naming them and what they are about to do */
export async function as(page: Page, who: string, path: string, did: string) {
	const p = person(who);
	await openAs(page, 'workspace', who, path);
	await now().run.act(p.name, ROLES[who] ?? `Kirana · ${p.org}`, did);
	await settled(page);
	await expect(page.locator('#main')).toBeVisible();
}

/** Neha opens the console at a path */
export async function staff(page: Page, path: string, did: string) {
	await openAs(page, 'console', 'neha', path);
	await now().run.act('Neha Kulkarni', ROLES.neha, did);
	await settled(page);
}

/** a figure the story fixes: kept in the report, checked softly so the run goes on to the end */
export function story(name: string, actual: string | number | undefined, expected: string | number) {
	const { run, ref } = now();
	run.figure(name, actual ?? '(missing)');
	if (actual !== expected) run.find('warning', ref, `${name}: ${actual} where the story has ${expected}`);
	expect.soft(actual, name).toBe(expected);
}

/** what a screen or an export shows, held to the ledger: each part (or one of its spellings) must be in the text */
export function shows(name: string, text: string, parts: (string | string[])[]) {
	// a screen's text breaks its lines where its layout does: compared with and without its spaces
	const flat = (x: string) => x.replace(/\s+/g, '');
	const missing = parts.filter(
		(p) => !(Array.isArray(p) ? p : [p]).some((x) => text.includes(x) || flat(text).includes(flat(x)))
	);
	now().run.figure(name, missing.length ? `missing ${missing.map((p) => [p].flat()[0]).join('; ')}` : 'as posted');
	if (missing.length)
		now().run.find(
			'warning',
			now().ref,
			`${name} does not read ${missing.map((p) => `"${[p].flat()[0]}"`).join(', ')}`
		);
	expect.soft(missing, name).toEqual([]);
}

/** a value an export or a screen carries, against the ledger's */
export function same(name: string, actual: string | number | undefined, posted: string | number | undefined) {
	now().run.figure(name, actual ?? '(missing)');
	if (String(actual) !== String(posted))
		now().run.find('warning', now().ref, `${name}: ${actual} where the ledger has ${posted}`);
	expect.soft(String(actual), name).toBe(String(posted));
}

export const sidebar = (page: Page, label: string) =>
	page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: label, exact: true });
export const inr = (n: number | undefined) => (n == null ? '(none)' : `₹${n.toLocaleString('en-IN')}`);
