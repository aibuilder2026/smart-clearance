// @vitest-environment jsdom
import { render } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { routesFor } from '@smart-clearance/core/workspace/app';
import type {
	CaseDetail,
	EventsHandle,
	EventsOptions,
	WorkspaceApi,
	WorkspacePublic,
	WorkspaceSnapshot,
	WsAuditRow,
	WsLedger
} from '@smart-clearance/api/workspace';
import { ApiError } from '@smart-clearance/api/workspace';
import { LiveSource } from '../../src/lib/live/source.svelte';
import { caseOf, dataOf, stateOf } from '../../src/lib/live/project';
import LiveHost from './LiveHost.svelte';

// The live source on what backend-api answered at five moments of the story's journey (fixtures/, written by
// backend-api/scripts/live-fixtures.sh): every screen of each person drawn through the workspace app, with no error and
// with the batch's own facts on it, and the projection's shapes checked against what the screens read.

type Seen = {
	snapshot: WorkspaceSnapshot;
	cases: Record<string, CaseDetail>;
	ledger: WsLedger | null;
	audit: WsAuditRow[];
};
type Moment = { public: WorkspacePublic; members: Record<string, Seen> };
const MOMENTS = import.meta.glob<Moment>('./fixtures/*.json', { eager: true, import: 'default' });
const moment = (name: string) => MOMENTS[`./fixtures/${name}.json`];

/** backend-api as one member sees it at one moment; every change answers that nothing changed */
function fakeApi(m: Moment, who: string): WorkspaceApi {
	const seen = m.members[who];
	const none = (status: number) => Promise.reject(new ApiError(status, 'no'));
	const done = () => Promise.resolve({ seq: seen.snapshot.seq, case: null });
	return new Proxy({} as WorkspaceApi, {
		get: (_t, name: keyof WorkspaceApi) =>
			({
				workspace: () => Promise.resolve(m.public),
				me: () => Promise.resolve(seen.snapshot.me),
				snapshot: () => Promise.resolve(structuredClone(seen.snapshot)),
				case: (ref: string) => (seen.cases[ref] ? Promise.resolve(structuredClone(seen.cases[ref])) : none(404)),
				ledger: () => (seen.ledger ? Promise.resolve(seen.ledger) : none(403)),
				audit: () => Promise.resolve({ rows: seen.audit, before: null }),
				events: () => Promise.resolve({ seq: seen.snapshot.seq, events: [], reset: false })
			})[name as string] ?? done
	});
}

/** a stream that opens at once and says nothing more */
const quiet = (o: EventsOptions): EventsHandle => {
	o.onStatus?.('live');
	return { stop() {}, poke() {}, position: 0, status: 'live' };
};

function source(m: Moment, who: string) {
	return new LiveSource({
		api: fakeApi(m, who),
		base: 'http://api',
		ws: 'munchly',
		token: async () => 'token',
		events: quiet,
		settleMs: 0
	});
}

async function until(cond: () => boolean) {
	for (let i = 0; i < 200; i++) {
		if (cond()) return;
		await new Promise((r) => setTimeout(r, 2));
	}
	throw new Error('the workspace did not load');
}

const norm = (t: string | null) => (t ?? '').replace(/\s+/g, ' ').trim();

afterEach(() => vi.restoreAllMocks());

const CASES: [string, string[]][] = [
	['at-risk', ['priya', 'rakesh']],
	['planned', ['priya', 'rakesh', 'anita']],
	['executing', ['priya', 'rakesh', 'ganesh', 'agrawal', 'meera']],
	['cleared', ['priya', 'rakesh', 'anita', 'vikram', 'arjun', 'meera']]
];

/** every screen a member has, drawn through the workspace app on one moment: each one's text, and any error */
async function screensOf(name: string, who: string) {
	const m = moment(name);
	const errors: unknown[] = [];
	vi.spyOn(console, 'error').mockImplementation((...a) => void errors.push(a));
	const out: Record<string, string> = {};
	for (const screen of routesFor(m.members[who].snapshot.me.role)) {
		const s = source(m, who);
		const r = render(LiveHost, { props: { source: s, screen } });
		await until(() => s.status.phase === 'ready' && !!s.me);
		flushSync();
		out[screen] = norm(r.container.textContent);
		r.unmount();
	}
	return { out, errors };
}

describe('every screen, on what backend-api answered', () => {
	// before any batch is at risk the workspace has none in focus (SC-68's quiet day): the Command Center and the
	// partner's day say nothing is at risk, every screen about a batch says what will appear there, and none breaks
	describe('start: a day with no batch at risk', () => {
		for (const who of ['priya', 'rakesh', 'arjun'])
			it(who, async () => {
				const { out, errors } = await screensOf('start', who);
				expect(errors).toEqual([]);
				for (const [screen, text] of Object.entries(out)) expect(text.length, screen).toBeGreaterThan(40);
				const all = Object.values(out).join(' ');
				expect(all).not.toContain('246810');
				if (who === 'priya') {
					expect(out.command).toContain('Nothing at risk today');
					expect(out.command).toContain('nothing flagged');
					expect(out.route).toContain('Nothing to route');
				}
				if (who === 'rakesh') {
					expect(out.home).toContain('Nothing for you today');
					expect(out.photo).toContain('No photo requests');
				}
				// the journey clock is under every title, and never the prototype's dates
				expect(out[routesFor(moment('start').members[who].snapshot.me.role)[0]]).toContain('Live');
			});
	});
	for (const [name, people] of CASES)
		describe(name, () => {
			for (const who of people)
				it(who, async () => {
					const m = moment(name);
					const errors: unknown[] = [];
					vi.spyOn(console, 'error').mockImplementation((...a) => void errors.push(a));
					const role = m.members[who].snapshot.me.role;
					const focus = Object.keys(m.members[who].cases)[0];
					const out: Record<string, string> = {};
					for (const screen of routesFor(role)) {
						const s = source(m, who);
						const r = render(LiveHost, { props: { source: s, screen } });
						await until(() => s.status.phase === 'ready' && !!s.me);
						flushSync();
						out[screen] = norm(r.container.textContent);
						r.unmount();
					}
					expect(errors).toEqual([]);
					for (const [screen, text] of Object.entries(out)) expect(text.length, screen).toBeGreaterThan(40);
					// the batch in focus is the API's (a kiranawala sees its product, not its batch number), and none of the
					// prototype's own sign-in shows
					const sku = focus ? m.members[who].cases[focus].sku.name.replace(/\s+\d.*$/, '') : null;
					if (focus) expect(Object.values(out).join(' ')).toContain(role === 'retailer' ? sku : focus);
					expect(Object.values(out).join(' ')).not.toContain('246810');
				});
		});
});

describe('the projection', () => {
	it("puts the API's journey on the screens' shapes", () => {
		const seen = moment('executing').members.priya;
		const snap = seen.snapshot;
		// the chips, in focus: a plan with no food bank, so no donation beside it (SC-85: each batch is its own journey)
		const focus = snap.cases.find((c) => c.donation == null)!.ref;
		const data = dataOf(snap, seen.ledger, { ref: focus, second: null });
		const state = stateOf(snap, seen.cases[focus], null, seen.audit);
		const c = caseOf(snap, seen.cases[focus], null, data);

		expect(state.hero.id).toBe(focus);
		expect(state.hero.phase).toBe('executing');
		expect(state.hero.orders).toHaveLength(5);
		expect(state.hero.bids.at(-1)?.status).toBe('countered');
		expect(state.mango).toEqual({ id: '', phase: 'watching', donation: null });
		expect(state.setup.permission?.by).toBe('rakesh');
		expect(state.users.every((u) => u.provider === 'password')).toBe(true);
		expect(state.feed.length).toBeGreaterThan(5);
		expect(state.feed.every((f, i) => i === 0 || f.min >= 0)).toBe(true);

		expect(data.batches.find((b) => b.id === focus)?.hero).toBe(true);
		expect(data.batches.some((b) => b.second)).toBe(false);
		expect(data.workspace.emailDomain).toBe('munchly.example');
		expect(data.market.lots.length).toBeGreaterThan(0);

		expect(c.plan.net).toBe(seen.cases[focus].plan!.net);
		expect(c.lines.kirana.units + c.lines.expiresoon.units).toBeGreaterThan(0);
		expect(c.kiranas.length).toBe(seen.cases[focus].offered);
		expect(c.listing.url).toContain(c.listing.id);
		expect(c.van.leaves).toMatch(/^\d\d:\d\d$/);
		expect(c.van.day).toMatch(/day$/);
		expect(c.donation.units).toBe(0);
		expect(c.counter.action).toBe('counter');

		// the Mango Drink, in focus, carries its own donation
		const mango = snap.cases.find((x) => x.donation != null)!.ref;
		const md = seen.cases[mango];
		expect(stateOf(snap, md, md, seen.audit).mango).toEqual({ id: mango, phase: 'executing', donation: 'booked' });
		const mc = caseOf(snap, md, md, dataOf(snap, seen.ledger, { ref: mango, second: mango }));
		expect(mc.donation.units).toBe(58);
		expect(mc.donation.day).toMatch(/day$/);
		expect(mc.donation.slots).toHaveLength(3);
		expect(mc.donation.asked).toMatch(/^Day \d+$/);
	});

	it('gives a batch not planned yet empty figures, never the story', () => {
		const seen = moment('at-risk').members.priya;
		const snap = seen.snapshot;
		const focus = snap.cases.find((c) => c.donation == null)!.ref;
		const data = dataOf(snap, seen.ledger, { ref: focus, second: null });
		const c = caseOf(snap, seen.cases[focus], null, data);
		expect(c.plan.net).toBe(0);
		expect(c.award.price).toBe(0);
		expect(c.kiranas).toEqual([]);
		expect(c.invoice.no).toBe('');
	});

	it('reads Finance & ESG from the ledger, the batches cleared and nothing else (SC-124)', () => {
		const seen = moment('cleared').members.anita;
		const ledger = seen.ledger!;
		const q3 = ledger.periods.find((p) => p.id === 'fy27-q3')!;
		const q = dataOf(seen.snapshot, ledger, { ref: null, second: null }).quarter;
		const sum = (k: 'net' | 'kg' | 'itcKept') => ledger.batches.reduce((t, b) => t + b.figures[k], 0);
		expect(ledger.batches.map((b) => b.ref).sort()).toEqual(['MF-2409-117', 'MF-2410-118']);
		expect([q.label, q.batches]).toEqual(['Q3 FY27', 2]);
		expect(q.recovered).toBeCloseTo(sum('net'), 2);
		expect(q.itc).toBeCloseTo(sum('itcKept'), 2);
		expect(q.co2).toBeCloseTo(q.kg * ledger.co2PerKg, 2);
		expect(q.weeks).toHaveLength(13);
		expect(q.mix.reduce((t, [, p]) => t + p, 0)).toBe(100);
		expect(q.brsr[0].diverted).toBe(q3.totals.kg);
		// a cleared batch's case carries the same row (the case detail's ledger)
		expect(seen.cases['MF-2409-117'].ledger).toEqual(ledger.batches.find((b) => b.ref === 'MF-2409-117'));
		// the partners never read it
		expect(moment('cleared').members.rakesh.ledger).toBeNull();
	});
});
