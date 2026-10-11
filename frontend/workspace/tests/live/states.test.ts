// @vitest-environment jsdom
import { createHash } from 'node:crypto';
import { dayLabel } from '../../src/lib/live/when';
import { fireEvent, render, waitFor, within, type RenderResult } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type {
	CaseDetail,
	EventsHandle,
	EventsOptions,
	Liveness,
	UploadLink,
	WorkspaceApi,
	WorkspacePublic,
	WorkspaceSnapshot,
	WsAuditRow,
	WsLedger,
	WsPartner,
	WsRecord,
	WsStaffReceipt
} from '@smart-clearance/api/workspace';
import { ApiError, NotAMember } from '@smart-clearance/api/workspace';
import type { PartnerCase } from '@smart-clearance/core/workspace/app';
import { HISTORY_CASES } from '@smart-clearance/core/workspace/stub';
import { LiveSource } from '../../src/lib/live/source.svelte';
import LiveHost from './LiveHost.svelte';

// SC-68 option B's live states, drawn through the workspace app on what backend-api answered (fixtures/): the sign-in on
// email and password with the story's people as chips, an account that is not a member here, the live line and the
// band while the stream is down, a failed approval with Retry and approving offline, the flagged batches as tabs, and
// the label photo's Send filling as it goes

type Seen = {
	snapshot: WorkspaceSnapshot;
	cases: Record<string, CaseDetail>;
	records?: Record<string, WsRecord>;
	ledger: WsLedger | null;
	audit: WsAuditRow[];
	partner: WsPartner | null;
};
type Moment = { public: WorkspacePublic; members: Record<string, Seen> };
const MOMENTS = import.meta.glob<Moment>('./fixtures/*.json', { eager: true, import: 'default' });
const moment = (name: string): Moment => structuredClone(MOMENTS[`./fixtures/${name}.json`]);
// the two batches the story's journey runs (SC-86): each its own case
const CHIPS = 'MF-2409-117';
const MANGO = 'MF-2410-118';

/** the staff sale's consolidated receipt as backend-api sends it (SC-174, views.staff_receipt_out): being read, or read
 *  with a payment for each number of packs at ₹8 */
function receipt(status: 'reading' | 'read', packs: number[] = []): WsStaffReceipt {
	const who = ['Ayesha Sultana', 'D. Ramya', 'Shaik Imran'];
	const payments = packs.map((units, i) => ({
		n: i + 1,
		rrn: `62751657839${i}`,
		who: who[i],
		at: `2026-10-0${2 + Math.floor(i / 2)}T1${6 + i}:42`,
		units,
		amount: units * 8
	}));
	const read = status === 'read';
	return {
		id: 'sr-1',
		status,
		no: read ? 'LA/SR/26-27/0002' : null,
		date: read ? '2026-10-03' : null,
		payments,
		paid: read ? payments.reduce((t, x) => t + x.amount, 0) : null,
		units: read ? packs.reduce((t, x) => t + x, 0) : null,
		from: read ? payments[0].at : null,
		to: read ? payments[payments.length - 1].at : null,
		at: '2026-10-03T14:50',
		readAt: read ? '2026-10-03T14:51' : null,
		contentType: 'image/jpeg',
		url: 'http://storage/receipt?get'
	};
}
/** a case whose staff sale carries the receipt she attached; recorded, the count is what the payments make */
function withReceipt(c: CaseDetail, r: WsStaffReceipt) {
	c.journey.staff!.receipt = r;
	return c;
}
const RECEIPT_LINK: UploadLink = { id: 'sr-1', url: 'http://storage/sr-1', headers: {}, expiresAt: '' };
/** who signs Munchly's papers, as the client's record has it (SC-174) */
const SIGNED = { name: 'Vinod Patwardhan', title: 'Head of Accounts', sign: 'munchly', seal: 'munchly' };
/** Deccan Green Waste Management's facility, officer and panel of witnesses, as the client's setup has them (SC-174) */
const DGW = {
	method: 'landfill' as const,
	facility: {
		name: 'Municipal sanitary landfill, cell 7',
		address: 'Jawaharnagar, Hyderabad 500087, Telangana',
		gps: '17.5193° N, 78.5862° E'
	},
	vehicle: 'TG-09-ZX-0000',
	officer: { name: 'M. Srinivas Reddy', title: 'Site supervisor', sign: 'dgw' },
	seal: 'dgw',
	witnesses: [
		{
			name: 'Syed Mujeeb',
			address: 'House 14, Gandhi Nagar, Hyderabad 500080',
			proof: 'Voter ID, last four 5831',
			sign: 'dgw-w1'
		},
		{
			name: 'P. Anitha',
			address: 'Flat 3, Kavadiguda, Hyderabad 500080',
			proof: 'Voter ID, last four 3390',
			sign: 'dgw-w2'
		}
	]
};
const withPanel = (snap: WorkspaceSnapshot) => {
	for (const a of snap.setup.destruction?.agencies ?? []) if (a.id === 'dgw') Object.assign(a, DGW);
};
/** the agency's certificate as backend-api lays it out (SC-174, ledger.js destructionDetail): destroyed in the 25 minutes
 *  up to the after photo, before its officer, a witness on its panel and one he named, with the log from the godown to
 *  the cover */
function certificateInFull(c: CaseDetail) {
	const d = c.docs.find((x) => x.id === 'destruction')!;
	const on = '2026-10-02',
		at = (t: string) => `${on}T${t}`;
	Object.assign(d, {
		reason: 'expiry',
		methodId: 'landfill',
		methodName: 'Sanitary landfill, CPCB-compliant',
		methodHow: 'the packs slit open and emptied into the active cell, covered with 30 cm of soil the same day',
		facility: DGW.facility,
		vehicle: DGW.vehicle,
		officer: DGW.officer,
		seal: DGW.seal,
		witnesses: [
			DGW.witnesses[0],
			{ name: 'P. Anitha', address: 'Flat 3, Kavadiguda, Hyderabad 500080', proof: null, sign: null }
		],
		window: { from: '07:35', to: '08:00' },
		destroyedOn: on,
		photos: {
			before: { name: 'before', at: at('08:00'), url: 'http://storage/before?get' },
			after: { name: 'after', at: at('08:00'), url: 'http://storage/after?get' }
		},
		handedBy: { name: 'K. Lakshmi Narayana', title: 'Partner', sign: 'lakshmi' },
		goods: 'Munchly Mango Drink 200 ml',
		mfg: '2026-04-27',
		mrp: 20,
		perCarton: 27,
		log: [
			{
				at: at('06:20'),
				step: 'Photographed at the godown',
				detail: '1318 packs at Begum Bazaar godown',
				photo: 'before'
			},
			{ at: at('06:40'), step: 'Loaded', detail: 'On the covered vehicle TG-09-ZX-0000, sealed with seal SL-0099' },
			{ at: at('07:20'), step: 'Received and weighed', detail: '283.37 kg on weighbridge slip WB/26-27/0099' },
			{ at: at('07:35'), step: 'Slit open and emptied', detail: 'Into the active cell' },
			{ at: at('07:50'), step: 'Buried and covered', detail: 'Covered with 30 cm of soil' },
			{ at: at('08:00'), step: 'Photographed with the slate', detail: 'Slate: MF-2410-118', photo: 'after' },
			{ at: at('08:10'), step: 'Packaging sent on', detail: '2.64 kg of plastic film' }
		]
	});
	return c;
}
/** an upload that arrives at once */
class DoneXhr {
	upload: { onprogress?: (e: { lengthComputable: boolean; loaded: number; total: number }) => void } = {};
	status = 200;
	onload?: () => void;
	onerror?: () => void;
	onabort?: () => void;
	open() {}
	setRequestHeader() {}
	send() {
		setTimeout(() => this.onload?.(), 0);
	}
	abort() {}
}

/** backend-api as one member sees it; any route can be answered otherwise */
function fakeApi(m: Moment, who: string, over: Partial<Record<keyof WorkspaceApi, unknown>> = {}): WorkspaceApi {
	const seen = m.members[who];
	const none = (status: number) => Promise.reject(new ApiError(status, 'no'));
	const done = () => Promise.resolve({ seq: seen.snapshot.seq, case: null });
	const base: Partial<Record<keyof WorkspaceApi, unknown>> = {
		workspace: () => Promise.resolve(m.public),
		me: () => Promise.resolve(seen.snapshot.me),
		snapshot: () => Promise.resolve(structuredClone(seen.snapshot)),
		case: (ref: string) => (seen.cases[ref] ? Promise.resolve(structuredClone(seen.cases[ref])) : none(404)),
		record: (ref: string) => (seen.records?.[ref] ? Promise.resolve(structuredClone(seen.records[ref])) : none(404)),
		ledger: () => (seen.ledger ? Promise.resolve(seen.ledger) : none(403)),
		partner: () => (seen.partner ? Promise.resolve(structuredClone(seen.partner)) : none(403)),
		audit: () => Promise.resolve({ rows: seen.audit, before: null }),
		events: () => Promise.resolve({ seq: seen.snapshot.seq, events: [], reset: false })
	};
	return new Proxy({} as WorkspaceApi, {
		get: (_t, name: keyof WorkspaceApi) => over[name] ?? base[name] ?? done
	});
}

/** a stream whose state the test sets */
function stream() {
	let say: ((s: Liveness) => void) | undefined;
	const poke = vi.fn();
	const events = (o: EventsOptions): EventsHandle => {
		say = o.onStatus;
		say?.('live');
		return { stop() {}, poke, position: 0, status: 'live' };
	};
	return { events, set: (s: Liveness) => say?.(s), poke };
}

function source(api: WorkspaceApi, events = stream().events) {
	return new LiveSource({ api, base: 'http://api', ws: 'munchly', token: async () => 'token', events, settleMs: 0 });
}

const norm = (t: string | null | undefined) => (t ?? '').replace(/\s+/g, ' ').trim();
const text = (r: RenderResult<never>) => norm(r.container.textContent);

async function draw(s: LiveSource, screen: string | null, at: string | null = null) {
	const r = render(LiveHost, { props: { source: s, screen, at } }) as unknown as RenderResult<never>;
	await waitFor(() => expect(s.status.phase).toBe('ready'));
	return r;
}

/** a tab of a batch's page in the ledger (SC-121): Money, Papers or Impact */
async function tab(r: RenderResult<never>, name: string) {
	const nav = await waitFor(() => r.container.querySelector<HTMLElement>('.bh-tabs')!);
	await fireEvent.click(within(nav).getByRole('button', { name }));
}

afterEach(() => vi.restoreAllMocks());

describe('the sign-in, on email and password', () => {
	const signedOut = (over: Partial<Record<keyof WorkspaceApi, unknown>> = {}) => {
		const m = moment('planned');
		return { m, s: source(fakeApi(m, 'priya', { me: () => Promise.resolve(null), ...over })) };
	};

	it("offers the story's people as chips that fill the email only, and no prototype's sign-in", async () => {
		const { m, s } = signedOut();
		const r = await draw(s, null);
		const t = text(r);
		expect(t).toContain('Sign in');
		expect(t).toContain('Use the email address you were invited with, and your password.');
		expect(t).toContain('Nothing is sent by email.');
		expect(t).not.toContain('246810');
		expect(t).not.toContain('Explore as someone in the story');
		const priya = m.public.accounts.flatMap((g) => g.people).find((p) => p.id === 'priya')!;
		for (const g of m.public.accounts) expect(t).toContain(g.group);
		await fireEvent.click(r.getByRole('button', { name: priya.name }));
		expect((r.container.querySelector('#si-email') as HTMLInputElement).value).toBe(priya.email);
		expect((r.container.querySelector('#si-pw') as HTMLInputElement).value).toBe('');
		// show and hide the password
		const eye = r.getByRole('button', { name: 'Show password' });
		await fireEvent.click(eye);
		expect((r.container.querySelector('#si-pw') as HTMLInputElement).type).toBe('text');
	});

	it('says one thing for any wrong sign-in, and nothing about which part', async () => {
		const WRONG = 'That email and password do not match an account in this workspace.';
		const { m, s } = signedOut({ signIn: () => Promise.reject(new ApiError(400, WRONG)) });
		const r = await draw(s, null);
		const priya = m.public.accounts.flatMap((g) => g.people).find((p) => p.id === 'priya')!;
		await fireEvent.input(r.container.querySelector('#si-email')!, { target: { value: priya.email } });
		await fireEvent.input(r.container.querySelector('#si-pw')!, { target: { value: 'not-it' } });
		await fireEvent.submit(r.container.querySelector('form')!);
		await waitFor(() => expect(r.getByRole('alert').textContent).toContain(WRONG));
		expect((r.container.querySelector('#si-pw') as HTMLInputElement).value).toBe('');
	});

	it('signs in, welcomes the person by name, then opens their workspace', async () => {
		const { m, s } = signedOut({ signIn: () => Promise.resolve(m.members.priya.snapshot.me) });
		const r = await draw(s, null);
		await fireEvent.input(r.container.querySelector('#si-email')!, { target: { value: 'priya@x.example' } });
		await fireEvent.input(r.container.querySelector('#si-pw')!, { target: { value: 'right-one' } });
		await fireEvent.submit(r.container.querySelector('form')!);
		await waitFor(() => expect(text(r)).toContain(`Welcome, ${m.members.priya.snapshot.me.short}`));
		await waitFor(() => expect(text(r)).toContain('Command Center'), { timeout: 3000 });
	});

	it("tells an account that is not a member here so, in the backend's words, and lets it try another", async () => {
		const OUT = 'This account is not a member of this workspace.';
		const { s } = signedOut({ signIn: () => Promise.reject(new NotAMember(OUT)) });
		const r = await draw(s, null);
		await fireEvent.input(r.container.querySelector('#si-email')!, { target: { value: 'neha@console.example' } });
		await fireEvent.input(r.container.querySelector('#si-pw')!, { target: { value: 'right-one' } });
		await fireEvent.submit(r.container.querySelector('form')!);
		await waitFor(() => expect(text(r)).toContain('Not a member here'));
		expect(text(r)).toContain('Signed in as');
		expect(text(r)).toContain('neha@console.example');
		expect(text(r)).toContain(OUT);
		expect(s.outsider).toBe(OUT);
		await fireEvent.click(r.getByRole('button', { name: 'Sign in with another account' }));
		expect(text(r)).toContain('Use the email address you were invited with');
	});

	it('says so too when the session found on opening is not a member here', async () => {
		const OUT = 'This account is not a member of this workspace.';
		const { s } = signedOut({ me: () => Promise.reject(new NotAMember(OUT)) });
		const r = await draw(s, null);
		expect(text(r)).toContain('Not a member here');
		expect(text(r)).toContain(OUT);
		expect(text(r)).not.toContain('Signed in as');
	});
});

describe('live, and the journey clock', () => {
	it('says under every title that it is live, the journey time, and the pace when days are compressed', async () => {
		const m = moment('planned');
		Object.assign(m.members.priya.snapshot.clock, { dayMinutes: 5, compressed: true });
		const s = source(fakeApi(m, 'priya'));
		const r = await draw(s, 'command');
		await waitFor(() => expect(text(r)).toContain('Live'));
		const line = r.container.querySelector('.lv-line')!;
		// the journey's date, from the API's clock (the story's own calendar), and its time in quarter hours
		const day = dayLabel(m.members.priya.snapshot.clock.now).replace(/ /g, '\\s?');
		expect(norm(line.textContent)).toMatch(new RegExp(`^Live\\s?${day}\\s?\\d\\d:(00|15|30|45)\\s?1 day = 5 min$`));
		// the clock is never announced: no live region holds it
		expect(line.closest('[aria-live], [role="status"], [role="alert"]')).toBeNull();
	});

	it("says under the clock that it is the prototype's, and its guide says how to reset or fast-forward (SC-176)", async () => {
		const m = moment('planned');
		Object.assign(m.members.priya.snapshot.clock, { dayMinutes: 5, compressed: true });
		const s = source(fakeApi(m, 'priya'));
		const r = await draw(s, 'command');
		await waitFor(() => expect(r.container.querySelector('.lv-clock .jc-note')).not.toBeNull());
		const note = r.container.querySelector('.lv-clock .jc-note')!;
		expect(norm(note.textContent)).toContain(
			"Prototype time: the story's own calendar, so its batches' best-before dates hold."
		);
		await fireEvent.click(within(note as HTMLElement).getByRole('button', { name: 'How to reset or fast-forward' }));
		const guide = await r.findByRole('dialog', { name: 'Prototype time' });
		const g = norm(guide.textContent);
		// the journey time now, from the same clock, and the steps in the console
		expect(g).toContain('Journey time now');
		expect(g).toContain('1 day = 5 min');
		expect(g).toContain(`${m.members.priya.snapshot.workspace.name}' workspace runs on a fixed dataset`);
		for (const step of [
			'Start the journey again',
			'Reset journey…',
			'Move it forward',
			'Run now',
			'Close now',
			'Report now'
		])
			expect(g).toContain(step);
		expect(within(guide).getByRole('button', { name: 'Open the console' })).toBeTruthy();
	});

	it('shows a band while the stream is down, and approving waits for a connection', async () => {
		const m = moment('planned');
		const st = stream();
		const s = source(fakeApi(m, 'priya'), st.events);
		const r = await draw(s, 'route', CHIPS);
		await waitFor(() => expect(s.case?.batch.id).toBe(CHIPS));
		st.set('reconnecting');
		await waitFor(() => expect(text(r)).toContain('Reconnecting…'));
		expect(text(r)).toContain('Updates paused at 08:00');
		st.set('offline');
		await waitFor(() => expect(text(r)).toContain("You're offline."));
		expect(text(r)).toContain('Approving needs a connection');
		const approve = r.getAllByRole('button', { name: 'Review and approve' })[0];
		expect(approve.getAttribute('aria-disabled')).toBe('true');
		await fireEvent.click(r.getByRole('button', { name: 'Try again' }));
		expect(st.poke).toHaveBeenCalled();
		st.set('live');
		await waitFor(() => expect(text(r)).not.toContain("You're offline."));
		expect(text(r)).toContain('Back live. Caught up from 08:00.');
	});
});

describe('Setup before the first export is mapped (SC-79)', () => {
	it("says it is waiting, keeps the fields, names the Data agent's run, and holds Confirm with its reason", async () => {
		// a workspace whose first export no one has mapped yet (the story's comes mapped, SC-84)
		const m = moment('start');
		Object.assign(m.members.priya.snapshot.setup, { mapped: 0, lastImport: null });
		const r = await draw(source(fakeApi(m, 'priya')), 'setup');
		await waitFor(() => expect(text(r)).toContain('No stock export mapped yet'));
		expect(text(r)).toContain('Waiting for an export');
		expect(text(r)).not.toContain('Mapped · confirm below');
		const time = m.members.priya.snapshot.rules.dataTime;
		expect(text(r)).toContain(`the Data Agent maps the day's export at its run at ${time} today`);
		const confirm = [...r.container.querySelectorAll('button')].find((b) =>
			b.textContent?.includes('Confirm and start')
		)!;
		expect(confirm.disabled).toBe(true);
		const why = r.container.querySelector(`#${confirm.getAttribute('aria-describedby')}`)!;
		expect(norm(why.textContent)).toBe('Confirm once the Data agent has mapped an export.');
	});

	it('is the screen as designed once an export is mapped and Setup confirmed', async () => {
		const r = await draw(source(fakeApi(moment('at-risk'), 'priya')), 'setup');
		await waitFor(() => expect(text(r)).toContain('Loaded into BigQuery'));
		expect(text(r)).toContain('Data Agent mapped');
		expect(text(r)).not.toContain('No stock export mapped yet');
		expect(text(r)).not.toContain('Waiting for an export');
	});
});

describe('a step that did not go through', () => {
	it('says so in the approve sheet, with an amber Retry that goes through', async () => {
		const m = moment('planned');
		const NO = 'The workspace did not answer in time.';
		let tries = 0;
		const approve = vi.fn(() =>
			tries++ ? Promise.resolve({ seq: 1, case: null }) : Promise.reject(new ApiError(500, NO))
		);
		const s = source(fakeApi(m, 'priya', { approve }));
		const r = await draw(s, 'route', CHIPS);
		await waitFor(() => expect(s.case?.batch.id).toBe(CHIPS));
		window.dispatchEvent(new Event('sc3:approve-open'));
		await waitFor(() => expect(r.getByRole('button', { name: 'Approve · release the agents' })).toBeTruthy());
		await fireEvent.click(r.getByRole('button', { name: 'Approve · release the agents' }));
		await waitFor(() => expect(text(r)).toContain("The approval didn't go through."), { timeout: 3000 });
		expect(text(r)).toContain(NO);
		expect(s.failed?.action).toBe('approve');
		// the plan is still waiting: what was shown at once is put back
		expect(s.state.hero.phase).toBe('planned');
		expect(text(r)).not.toContain('Approved by');
		const retry = r.getByRole('button', { name: 'Retry · release the agents' });
		expect(retry.className).toContain('btn-approve');
		await fireEvent.click(retry);
		await waitFor(() => expect(approve).toHaveBeenCalledTimes(2));
		await waitFor(() => expect(s.failed).toBeNull());
	});

	it('says any other step that did not go through in a band, with Retry', async () => {
		const m = moment('at-risk');
		const NO = 'The workspace is offline. Check the connection.';
		const s = source(fakeApi(m, 'rakesh', { permit: () => Promise.reject(new ApiError(0, NO)) }));
		const r = await draw(s, 'home');
		await s.act('permit');
		await waitFor(() => expect(text(r)).toContain("That didn't go through."));
		expect(text(r)).toContain(NO);
		expect(r.getByRole('button', { name: 'Retry' })).toBeTruthy();
		await fireEvent.click(r.getByRole('button', { name: 'Dismiss' }));
		expect(text(r)).not.toContain("That didn't go through.");
	});
});

describe("a partner's own step reads its facts again (SC-180)", () => {
	it('once a step Lakshmi Agencies sends has gone through, her facts are read again, so her screens show what she sent', async () => {
		const m = moment('destruction-asked');
		const seen = m.members['lakshmi-owner'];
		const partner = vi.fn(() => Promise.resolve(structuredClone(seen.partner!)));
		const s = source(fakeApi(m, 'lakshmi-owner', { partner }));
		await draw(s, 'home');
		await waitFor(() => expect(partner).toHaveBeenCalled());
		const before = partner.mock.calls.length;
		await s.act('permit');
		// with no event on the stream (stream() says nothing), only her own step can ask for them
		await waitFor(() => expect(partner.mock.calls.length).toBeGreaterThan(before));
	});
});

describe('a button that waits on the network (SC-152)', () => {
	it('says why a step was refused under its own button, with Try again: no success, and no band', async () => {
		const m = moment('executing');
		const seen = m.members.ganesh;
		seen.cases[CHIPS].journey.orders = [];
		seen.partner!.cases = seen.partner!.cases.map((c) => (c.ref === CHIPS ? { ...c, kiranas: [] } : c));
		const NO = 'The scheme has closed for your shop.';
		let tries = 0;
		const declineOffer = vi.fn(() =>
			tries++ ? Promise.resolve({ seq: seen.snapshot.seq, case: null }) : Promise.reject(new ApiError(409, NO))
		);
		const s = source(fakeApi(m, 'ganesh', { declineOffer }));
		const r = await draw(s, 'home');
		await fireEvent.click(await waitFor(() => r.getByRole('button', { name: 'Not this time' })));
		const note = await waitFor(() => {
			const n = r.container.querySelector<HTMLElement>('.btn-note.err');
			expect(n).not.toBeNull();
			return n!;
		});
		expect(note.getAttribute('role')).toBe('alert');
		expect(norm(note.textContent)).toContain(NO);
		const button = note.closest('.btn-wait')!.querySelector('button.btn')!;
		expect(button.getAttribute('aria-describedby')).toBe(note.id);
		// the screen said nothing went through: no success toast, and no band saying it again
		expect(text(r)).not.toContain('Declined ·');
		expect(text(r)).not.toContain("That didn't go through.");
		expect(s.failed).toBeNull();
		// Try again sends it once more, and this time it lands
		await fireEvent.click(within(note).getByRole('button', { name: 'Try again' }));
		await waitFor(() => expect(declineOffer).toHaveBeenCalledTimes(2));
		await waitFor(() => expect(text(r)).toContain('Declined ·'));
		expect(r.container.querySelector('.btn-note.err')).toBeNull();
		r.unmount();
	});

	it('lands as its done word once the answer has come, and only then says so', async () => {
		const m = moment('cleared');
		let answer: (v: { seq: number; case: null }) => void = () => {};
		const saveRules = vi.fn(() => new Promise<{ seq: number; case: null }>((done) => (answer = done)));
		const s = source(fakeApi(m, 'arjun', { saveRules }));
		const r = await draw(s, 'rules');
		await fireEvent.click(await waitFor(() => r.getByRole('button', { name: 'More Routes needing approval' })));
		const save = r.getAllByRole('button', { name: 'Save' })[0];
		await fireEvent.click(save);
		await waitFor(() => expect(saveRules).toHaveBeenCalled());
		// on its way: it says what it is doing, and holds; nothing says it was saved yet
		await waitFor(() => expect(save.getAttribute('data-phase')).toBe('busy'));
		expect(norm(save.textContent)).toContain('Saving…');
		expect(save.getAttribute('aria-busy')).toBe('true');
		expect(text(r)).not.toContain('Guardrails saved');
		answer({ seq: 1, case: null });
		await waitFor(() => expect(save.getAttribute('data-phase')).toBe('done'));
		expect(norm(save.textContent)).toContain('Saved');
		await waitFor(() => expect(text(r)).toContain('Guardrails saved · agents use them from the next run'));
	});

	it('keeps a message that did not reach the seller in the box, and says why under it', async () => {
		const NO = 'The listing has closed.';
		const message = vi.fn(() => Promise.reject(new ApiError(409, NO)));
		const s = source(fakeApi(moment('executing'), 'agrawal', { message }));
		const r = await draw(s, 'listing', CHIPS);
		const box = await waitFor(() => r.getByRole('textbox', { name: 'Message the seller' }));
		await fireEvent.input(box, { target: { value: 'Can you dispatch by Monday?' } });
		await fireEvent.submit(box.closest('form')!);
		await waitFor(() => expect(r.getByRole('alert').textContent).toContain(NO));
		expect((box as HTMLInputElement).value).toBe('Can you dispatch by Monday?');
		expect(box.getAttribute('aria-describedby')).toBe('lv-chat-note');
		expect(s.failed).toBeNull();
	});
});

describe('the flagged batches', () => {
	// the Watcher flags the chips and the Mango Drink, each its own journey (SC-86): the Mango waits for its label, the
	// chips' plan for Priya's yes
	function twoFlagged() {
		return { m: moment('planned'), mango: MANGO, chips: CHIPS };
	}

	it('are tabs over the Command Center tracker card, and a tab puts its batch in focus', async () => {
		const { m, mango, chips } = twoFlagged();
		const s = source(fakeApi(m, 'priya'));
		const r = await draw(s, 'command');
		await waitFor(() => expect(r.getByRole('tablist', { name: 'Flagged batches' })).toBeTruthy());
		expect(text(r)).toContain('Watcher checked');
		expect(text(r)).toContain('2 flagged');
		// the most urgent batch is in focus first; a person waits on the chips batch's plan
		expect(r.getAllByRole('tab').map((t) => t.id)).toEqual([`lv-tab-${mango}`, `lv-tab-${chips}`]);
		expect(r.getByRole('tab', { selected: true }).id).toBe(`lv-tab-${mango}`);
		expect(text(r)).toContain('2 batches · one needs a yes');
		await fireEvent.click(r.container.querySelector(`#lv-tab-${chips}`)!);
		await waitFor(() => expect(s.case?.batch.id).toBe(chips));
		await waitFor(() => expect(r.getByRole('tab', { selected: true }).id).toBe(`lv-tab-${chips}`));
		expect(norm(r.getByRole('tabpanel').textContent)).toContain(chips);
		// the arrow keys move between the tabs
		await fireEvent.keyDown(r.container.querySelector(`#lv-tab-${chips}`)!, { key: 'ArrowLeft' });
		await waitFor(() => expect(s.case?.batch.id).toBe(mango));
	});

	it("each has its own page: the batch's head, with its screens as tabs in place of the Route Room's batch tabs (SC-112)", async () => {
		const { m, mango } = twoFlagged();
		const s = source(fakeApi(m, 'priya'));
		const r = await draw(s, 'route', mango);
		await waitFor(() => expect(s.case?.batch.id).toBe(mango));
		await waitFor(() => expect(norm(r.container.querySelector('.bhead h1')?.textContent)).toBe('Mango Drink 200 ml'));
		expect(norm(r.container.querySelector('.bhead')?.textContent)).toContain(mango);
		expect(r.container.querySelector('.bh-tab[aria-current="page"]')?.textContent).toContain('Route');
		expect(r.container.querySelector(`#lv-tab-${mango}`)).toBeNull();
	});
});

describe('the label photo on its way', () => {
	it('fills the Send button as the photo uploads, and Cancel stops it', async () => {
		const m = moment('at-risk');
		const link: UploadLink = { id: 'u1', url: 'http://storage/u1', headers: {}, expiresAt: '' };
		const sent: { xhr: FakeXhr | null } = { xhr: null };
		class FakeXhr {
			upload: { onprogress?: (e: { lengthComputable: boolean; loaded: number; total: number }) => void } = {};
			status = 0;
			onload?: () => void;
			onerror?: () => void;
			onabort?: () => void;
			open() {}
			setRequestHeader() {}
			send() {
				sent.xhr = this;
				this.upload.onprogress?.({ lengthComputable: true, loaded: 1, total: 2 });
			}
			abort() {
				this.onabort?.();
			}
		}
		vi.stubGlobal('XMLHttpRequest', FakeXhr);
		vi.stubGlobal('matchMedia', (q: string) => ({
			matches: false,
			media: q,
			addEventListener() {},
			removeEventListener() {}
		}));
		const s = source(fakeApi(m, 'rakesh', { uploadPhoto: () => Promise.resolve(link) }));
		const r = await draw(s, 'photo');
		const input = r.container.querySelector('input[type="file"]:not([capture])') as HTMLInputElement;
		const photo = new File(['label'], 'label.jpg', { type: 'image/jpeg' });
		vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: () => 'blob:label' }));
		await fireEvent.change(input, { target: { files: [photo] } });
		await fireEvent.click(r.getByRole('button', { name: 'Send photo' }));
		await waitFor(() => expect(r.getByRole('progressbar', { name: 'Sending the photo' })).toBeTruthy());
		expect(r.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('50');
		expect(text(r)).toContain('Sending · 50%');
		await fireEvent.click(r.getByRole('button', { name: 'Cancel' }));
		await waitFor(() => expect(r.queryByRole('progressbar')).toBeNull());
		// stopping it is not a failure
		expect(s.failed).toBeNull();
		vi.unstubAllGlobals();
	});
});

describe('the label photo, taken or uploaded (SC-80)', () => {
	const desktop = () =>
		vi.stubGlobal('matchMedia', (q: string) => ({
			matches: false,
			media: q,
			addEventListener() {},
			removeEventListener() {}
		}));

	it('refuses a file that is not a photo, or one of 8 MB or more, and says why', async () => {
		desktop();
		const s = source(fakeApi(moment('at-risk'), 'rakesh'));
		const r = await draw(s, 'photo');
		expect(r.getByRole('button', { name: 'Take a photo' })).toBeTruthy();
		const input = r.container.querySelector('input[type="file"]:not([capture])') as HTMLInputElement;
		expect(input.accept).toBe('image/jpeg,image/png,image/webp');
		await fireEvent.change(input, { target: { files: [new File(['x'], 'notes.txt', { type: 'text/plain' })] } });
		expect(norm(r.getByRole('alert').textContent)).toBe(
			'That file is not a photo Vision can read. Send a JPEG, PNG or WebP.'
		);
		const big = new File(['x'], 'big.jpg', { type: 'image/jpeg' });
		Object.defineProperty(big, 'size', { value: 9 * 1048576 });
		await fireEvent.change(input, { target: { files: [big] } });
		expect(norm(r.getByRole('alert').textContent)).toBe('That photo is 9.0 MB. Send one under 8 MB.');
		expect(r.queryByRole('button', { name: 'Send photo' })).toBeNull();
		vi.unstubAllGlobals();
	});

	it('on a laptop, Take a photo asks for the camera, and a refused camera says so and points to Upload', async () => {
		desktop();
		const getUserMedia = vi.fn(() => Promise.reject(Object.assign(new Error('denied'), { name: 'NotAllowedError' })));
		vi.stubGlobal('navigator', Object.assign(Object.create(navigator), { mediaDevices: { getUserMedia } }));
		const s = source(fakeApi(moment('at-risk'), 'rakesh'));
		const r = await draw(s, 'photo');
		await fireEvent.click(r.getByRole('button', { name: 'Take a photo' }));
		await waitFor(() =>
			expect(norm(r.getByRole('alert').textContent)).toBe(
				"The camera is blocked for this page. Allow it in the browser's site settings, or upload a photo."
			)
		);
		expect(getUserMedia).toHaveBeenCalledWith(expect.objectContaining({ audio: false }));
		// the frame is back to the example, with both ways
		expect(r.getByRole('button', { name: 'Upload a photo' })).toBeTruthy();
		expect(r.container.querySelector('video')).toBeNull();
		vi.unstubAllGlobals();
	});
});

describe('the Command Center (SC-82)', () => {
	it("opens every batch's page from the watchlist: one in a journey where it stands, one in no journey its Journey (SC-112)", async () => {
		const m = moment('executing');
		const s = source(fakeApi(m, 'priya'));
		const go = vi.fn();
		const r = render(LiveHost, {
			props: { source: s, screen: 'command', at: null, onnavigate: go }
		}) as unknown as RenderResult<never>;
		await waitFor(() => expect(s.status.phase).toBe('ready'));
		await waitFor(() => expect(r.container.querySelector('button.batchrow')).toBeTruthy());
		const rows = [...r.container.querySelectorAll('button.batchrow')];
		await fireEvent.click(rows.find((b) => b.textContent?.includes(CHIPS))!);
		expect(go).toHaveBeenCalledWith('execution', { replace: undefined, ref: CHIPS });
		// a batch in no journey opens its own page, on its Journey
		go.mockClear();
		await fireEvent.click(rows.find((b) => b.textContent?.includes('MF-2408-311'))!);
		expect(go).toHaveBeenCalledWith('journey', { replace: undefined, ref: 'MF-2408-311' });
	});
});

describe("each batch's screens follow its own plan (SC-85)", () => {
	it("the Mango Drink's Route Room and Execution say only what its plan holds", async () => {
		const m = moment('executing');
		const s = source(fakeApi(m, 'priya'));
		const r = await draw(s, 'route', MANGO);
		await waitFor(() => expect(s.case?.batch.id).toBe(MANGO));
		await waitFor(() => expect(text(r)).toContain('Recommended split'));
		const route = text(r);
		// a sentence for each line of its plan, and the exit it left out with its reason
		expect(route).toContain('1372 units to the kirana cluster');
		expect(route).toContain('Capped by what 58 kiranas can move');
		expect(route).toContain('150 units to the Hyderabad staff sale');
		expect(route).toContain('58 units to a food bank');
		expect(route).toContain('ExpireSoon is left out (needs 30+ days, has 22)');
		expect(route).not.toContain('units to ExpireSoon at ₹0');
		expect(route).not.toContain('gets nothing this time');
		expect(route).not.toContain('Alternative considered'); // no single exit could take it all
		const r2 = await draw(s, 'execution', MANGO);
		await waitFor(() => expect(text(r2)).toContain('Lister · ExpireSoon'));
		const ex = text(r2);
		expect(ex).toContain('not in this plan');
		expect(ex).not.toContain('ExpireSoon request');
		expect(ex).not.toContain('Negotiator');
		expect(ex).toContain('Outreach · 58 kiranas');
		// its own cluster on the map: Lakshmi Agencies' godown and shops, not Nagpur's
		const map = r2.container.querySelector('.map[role="img"]')!;
		expect(map.getAttribute('aria-label')).toMatch(/^Hyderabad cluster: Begum Bazaar godown and 58 kiranas/);
		expect(norm(map.textContent)).not.toContain('Itwari');
		expect(ex).toContain('Donation · Mango Drink');
		expect(ex).toContain('two agents');
	});

	it("the chips' Execution has no donation card: its plan has no food bank", async () => {
		const s = source(fakeApi(moment('executing'), 'priya'));
		const r = await draw(s, 'execution', CHIPS);
		await waitFor(() => expect(s.case?.batch.id).toBe(CHIPS));
		await waitFor(() => expect(text(r)).toContain('Negotiator'));
		expect(text(r)).not.toContain('Donation ·');
		expect(text(r)).toContain('three agents');
	});
});

describe('the staff sale and what is left at the godown (SC-87)', () => {
	it("Lakshmi Agencies' Today asks for the Mango Drink's staff sale, and her Deliveries records it with its receipt, once (SC-133, SC-174)", async () => {
		const home = await draw(source(fakeApi(moment('executing'), 'lakshmi-owner')), 'home');
		await waitFor(() => expect(text(home)).toContain('Record the staff sale'));
		expect(text(home)).toContain('150 packs at ₹8.00 · count what sold, once');
		expect(text(home)).toContain('Staff sale150 packs to your staff at ₹8.00, at Begum Bazaar godown');
		home.unmount();
		// the receipt goes to its signed link at once, and comes back read: 147 packs paid for, three did not sell
		const m = moment('executing');
		const read = withReceipt(structuredClone(m.members['lakshmi-owner'].cases[MANGO]), receipt('read', [50, 50, 47]));
		const staffReceipt = vi.fn(() => Promise.resolve(RECEIPT_LINK));
		const staffReceiptSent = vi.fn(() => Promise.resolve({ seq: 1, case: read }));
		const staffSale = vi.fn(() => Promise.resolve({ seq: 1, case: null }));
		vi.stubGlobal('XMLHttpRequest', DoneXhr);
		const s = source(fakeApi(m, 'lakshmi-owner', { staffSale, staffReceipt, staffReceiptSent }));
		const r = await draw(s, 'van', MANGO);
		await waitFor(() => expect(text(r)).toContain('Staff sale · Mango Drink'));
		const t = text(r);
		expect(t).toContain('150 packs for your staff at ₹8 a pack, at Begum Bazaar godown');
		// her own address, from her distributor's record, beside a code drawn from it that nothing reads out
		expect(t).toContain('lakshmi-agencies@exampleupi');
		expect(r.container.querySelector('svg.paycode')?.getAttribute('aria-hidden')).toBe('true');
		// the sale records only with its consolidated receipt
		expect(t).toContain('Consolidated receiptOne receipt listing every staff payment by its UPI reference');
		expect(t).toContain("Attach the consolidated receipt first: it is the sale's evidence for Munchly's papers.");
		expect(r.getByRole('button', { name: 'Record the sale' })).toHaveProperty('disabled', true);
		// the count starts at every pack; three did not sell
		const fewer = r.getByRole('button', { name: 'Fewer packs sold to staff' });
		for (let i = 0; i < 3; i++) await fireEvent.click(fewer);
		const upload = r.container.querySelector<HTMLInputElement>('input[type="file"]:not([capture])')!;
		expect(upload.accept).toBe('image/jpeg,image/png,image/webp,application/pdf');
		await fireEvent.change(upload, {
			target: { files: [new File(['receipt'], 'receipt.jpg', { type: 'image/jpeg' })] }
		});
		await waitFor(() => expect(staffReceiptSent).toHaveBeenCalledWith(MANGO, 'sr-1'));
		expect(staffReceipt).toHaveBeenCalledWith(MANGO, { contentType: 'image/jpeg', bytes: 7, fileName: 'receipt.jpg' });
		await waitFor(() => expect(text(r)).toContain('Vision read LA/SR/26-27/0002'));
		expect(text(r)).toContain('3 UPI payments · ₹1,176.00');
		expect(text(r)).toContain('147 packs × ₹8 · matches your count');
		await fireEvent.click(r.getByRole('button', { name: 'Show the 3 UPI references' }));
		expect(r.getByRole('list', { name: 'The 3 UPI references' }).getAttribute('tabindex')).toBe('0');
		expect(text(r)).toContain('627516578390Ayesha Sultana50 × ₹8');
		await fireEvent.click(r.getByRole('button', { name: 'Record the sale' }));
		await waitFor(() => expect(staffSale).toHaveBeenCalledWith(MANGO, 147, 'sr-1'));
		await waitFor(() => expect(text(r)).toContain('147 of 150 sold to staff at ₹8 a pack'));
		expect(text(r)).toContain('Consolidated receiptLA/SR/26-27/0002 · 3 UPI payments · read by Vision₹1,176');
		expect(text(r)).toContain("3 packs stay at Begum Bazaar godown. The receipt is in your batch's papers");
		expect(r.queryByRole('button', { name: 'Record the sale' })).toBeNull();
		vi.unstubAllGlobals();
	});

	it('while Vision reads the receipt the card says so, and the sale waits for the read (SC-174)', async () => {
		const m = moment('executing');
		withReceipt(m.members['lakshmi-owner'].cases[MANGO], receipt('reading'));
		const r = await draw(source(fakeApi(m, 'lakshmi-owner')), 'van', MANGO);
		await waitFor(() => expect(text(r)).toContain('Vision is reading the receipt'));
		expect(r.getAllByRole('status').map((x) => x.textContent)).toContain('Vision is reading the receipt');
		expect(text(r)).toContain('Each UPI reference, who paid and how much');
		expect(r.getByRole('button', { name: 'Record the sale' })).toHaveProperty('disabled', true);
		expect(r.queryByRole('button', { name: 'Take a photo' })).toBeNull();
	});

	it('a receipt short of the count says so, and offers another receipt or the count its payments make (SC-174)', async () => {
		const m = moment('executing');
		withReceipt(m.members['lakshmi-owner'].cases[MANGO], receipt('read', [50, 50, 47]));
		const staffSale = vi.fn(() => Promise.resolve({ seq: 1, case: null }));
		const r = await draw(source(fakeApi(m, 'lakshmi-owner', { staffSale })), 'van', MANGO);
		await waitFor(() => expect(text(r)).toContain('Vision read LA/SR/26-27/0002'));
		const t = text(r);
		// the count is every pack, the payments make 147
		expect(t).toContain('₹1,176.00 is 147 packs at ₹8, not 150');
		expect(norm(r.getByRole('alert').textContent)).toBe(
			'The receipt has 3 payments, ₹1,176.00: count again, or send the receipt with every payment.'
		);
		expect(r.queryByRole('button', { name: 'Record the sale' })).toBeNull();
		await fireEvent.click(r.getByRole('button', { name: 'Record 147 sold' }));
		await waitFor(() => expect(staffSale).toHaveBeenCalledWith(MANGO, 147, 'sr-1'));
		r.unmount();
		// Send another sets this one aside, and the slot asks again
		const m2 = moment('executing');
		withReceipt(m2.members['lakshmi-owner'].cases[MANGO], receipt('read', [50, 50, 47]));
		const r2 = await draw(source(fakeApi(m2, 'lakshmi-owner')), 'van', MANGO);
		await waitFor(() => expect(text(r2)).toContain('Vision read LA/SR/26-27/0002'));
		await fireEvent.click(r2.getByRole('button', { name: 'Send another' }));
		await waitFor(() => expect(r2.getByRole('button', { name: 'Take a photo' })).toBeTruthy());
		expect(text(r2)).not.toContain('Vision read LA/SR/26-27/0002');
	});

	it("once recorded, Priya's Execution shows what Vision read, and her pack keeps the receipt as a paper (SC-174)", async () => {
		vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1440); // a desktop: the paper open beside the pack
		const m = moment('cleared');
		// the receipt as backend-api answers it: read, matching the 120 packs, and a paper of the pack (views.staff_doc)
		const r = await draw(source(fakeApi(m, 'priya')), 'execution', MANGO);
		await waitFor(() => expect(text(r)).toContain('Vision read LA/SR/26-27/0002'));
		expect(text(r)).toContain('12 UPI payments · ₹960.00');
		expect(text(r)).toContain('120 packs × ₹8 · matches the count');
		r.unmount();
		const p = await draw(source(fakeApi(m, 'priya')), 'paperwork', MANGO);
		await waitFor(() => expect(text(p)).toContain('Staff sale receipt'));
		await fireEvent.click(p.getAllByRole('button', { name: /Staff sale receipt/ })[0]);
		await waitFor(() => expect(text(p)).toContain('READ'));
		const t = text(p);
		expect(t).toContain('LA/SR/26-27/0002 · Lakshmi Agencies');
		expect(t).toContain('Packs sold to staff Munchly Mango Drink 200 ml at ₹8.00120');
		expect(t).toContain('Received by UPI₹960.00');
		expect(t).toContain('627517000001Staff 1');
		expect(
			p.getByRole('img', { name: 'The consolidated receipt LA/SR/26-27/0002, as Lakshmi Agencies sent it' })
		).toBeTruthy();
	});

	it("Priya's Execution shows the sale open, and Rakesh Traders' Today has none", async () => {
		const s = source(fakeApi(moment('executing'), 'priya'));
		const r = await draw(s, 'execution', MANGO);
		await waitFor(() => expect(text(r)).toContain('Staff sale · Lakshmi Agencies'));
		expect(text(r)).toContain('open — / 150sold to staff');
		expect(text(r)).toContain('Lakshmi Agencies runs it at Begum Bazaar godown and records what sold');
		expect(text(r)).not.toContain('Left at the godown'); // its lines are still running
		const r2 = await draw(source(fakeApi(moment('executing'), 'rakesh')), 'home');
		await waitFor(() => expect(text(r2)).toContain('Today'));
		expect(text(r2)).not.toContain('Staff sale ·');
	});

	it('once every line is done, Execution says what each line left at the godown', async () => {
		const s = source(fakeApi(moment('cleared'), 'priya'));
		const r = await draw(s, 'execution', MANGO);
		await waitFor(() => expect(text(r)).toContain('Left at the godown'));
		const c = moment('cleared').members.priya.cases[MANGO];
		const took = (id: string) => c.realised!.lines.find((l) => l.id === id)!.units;
		const t = text(r);
		expect(t).toContain(`${c.realised!.godown.toLocaleString('en-IN')} packs`);
		expect(t).toContain(`Kirana clusterplanned, not taken${(1372 - took('kirana')).toLocaleString('en-IN')}`);
		expect(t).toContain(`Staff saleplanned, not taken${150 - took('staff')}`);
		expect(t).not.toContain('Food bankplanned, not taken'); // it took every pack
		expect(t).toContain('recorded 120 / 150sold to staff');
		expect(t).toContain('of the ₹16,917 planned');
	});
});

describe("expiry day's settlement (SC-94)", () => {
	const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
	const inr2 = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

	it("Priya's Execution settles the packs left at the godown under route B, and opens the paper (SC-139)", async () => {
		const go = vi.fn();
		const s = source(fakeApi(moment('cleared'), 'priya'));
		const r = render(LiveHost, {
			props: { source: s, screen: 'execution', at: MANGO, onnavigate: go }
		}) as unknown as RenderResult<never>;
		await waitFor(() => expect(text(r)).toContain('Expiry settlement'));
		const c = moment('cleared').members.priya.cases[MANGO];
		const x = c.expiry!;
		expect(x.policy).toBe('godown');
		const t = text(r);
		expect(t).toContain('Left at the godown'); // the card stays as it is, and the settlement follows it
		expect(t).toContain('Destroyed at the godown');
		expect(t).toContain(`Credit to Lakshmi Agencies${inr(x.amount!)}`);
		expect(t).toContain('Destroyed byLakshmi Agencies');
		expect(t).toContain(`Of it: GST and charges${inr(x.gst! + x.charges!)}`);
		expect(t).toContain(
			`The ${x.units.toLocaleString('en-IN')} packs are destroyed at Begum Bazaar godown through an authorised agency; Munchly credits Lakshmi Agencies the dealer price, the GST it reverses and the agency's charges (${inr(x.amount!)}).`
		);
		// the destruction itself: approved, with both photos
		expect(t).toContain('Destruction at the godownapproved');
		expect(t).toContain(
			`Approved by ${c.destruction!.approvedBy}: the credit note and the agency's certificate are issued.`
		);
		expect(r.getAllByRole('img', { name: /landfill/ }).length).toBeGreaterThan(0);
		await fireEvent.click(r.getByRole('button', { name: 'Open the paper' }));
		expect(go).toHaveBeenCalledWith('paperwork', { replace: undefined, ref: MANGO });
	});

	it("the chips' Execution has no settlement: every pack went to a channel", async () => {
		const s = source(fakeApi(moment('cleared'), 'priya'));
		const r = await draw(s, 'execution', CHIPS);
		await waitFor(() => expect(text(r)).toContain(`${CHIPS} · day 0 to`));
		expect(moment('cleared').members.priya.cases[CHIPS].expiry!.units).toBe(0);
		expect(text(r)).not.toContain('Expiry settlement');
		expect(text(r)).not.toContain('Destruction at the godown');
	});

	it("Priya's Paperwork opens on the expiry credit note's three lines, against the agency's certificate", async () => {
		vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1440); // a desktop: the paper open beside the pack
		const s = source(fakeApi(moment('cleared'), 'priya'));
		const r = await draw(s, 'paperwork', MANGO);
		await waitFor(() => expect(text(r)).toContain('Expiry credit note'));
		const d = moment('cleared').members.priya.cases[MANGO].docs.find((x) => x.id === 'expiry')!;
		const t = text(r);
		// Tally's layout (SC-148): Munchly's credit note to the distributor, against the invoice it billed the batch on
		const n2 = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
		const u = d.units!.toLocaleString('en-IN');
		expect(t).toContain(`Credit Note No.${d.no}`);
		expect(t).toContain('Issued toLakshmi Agencies');
		expect(t).toContain('GSTIN/UIN: 27AAKCM0000M1ZN');
		expect(t).toContain('GSTIN/UIN: 36AAJFL0000L1ZM');
		expect(t).toContain('Against our invoiceMFL/26-27/02418');
		expect(t).toContain(`${u} packs destroyed at the godown, at the dealer price${u}14.50${n2(d.credit!)}`);
		expect(t).toContain(`Input GST he reverses on them, 5%, section 17(5)(h)${n2(d.gst!)}`);
		expect(t).toContain(`Destruction charges, Deccan Green Waste Management${u}1.50${n2(d.charges!)}`);
		expect(t).toContain(`Credit to Lakshmi Agencies₹ ${n2(d.amount!)}`);
		expect(t).not.toContain("Munchly's own costs, on destroying them");
		// what the paper's note says, in the layout's words: financial, against the certificate, on his account
		expect(t).toContain('not a GST credit note under section 34 of the CGST Act');
		expect(t).toContain(
			`Issued against destruction certificate ${d.certificate}, on Munchly's approval of the evidence.`
		);
		expect(t).toContain("Adjusted against Lakshmi Agencies' account");
	});

	it("the agency's certificate in full, and the GST ITC memo keeping Munchly's credit on the packs destroyed at his godown (SC-174)", async () => {
		vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1440);
		const m = moment('cleared');
		certificateInFull(m.members.priya.cases[MANGO]);
		const s = source(fakeApi(m, 'priya'));
		const r = await draw(s, 'paperwork', MANGO);
		await waitFor(() => expect(text(r)).toContain('Expiry credit note'));
		const c = m.members.priya.cases[MANGO];
		const memo = c.docs.find((x) => x.id === 'itc')!;
		const units = c.expiry!.units;
		expect(memo.away).toBe(c.donation!.units); // only the food bank's: his stock is his reversal
		expect(memo.atGodown).toBe(units);
		expect(text(r)).toContain(`Cleared · ${units.toLocaleString('en-IN')} packs destroyed at the godown`);
		await fireEvent.click(r.getAllByRole('button', { name: /GST ITC memo/ })[0]);
		await waitFor(() => expect(text(r)).toContain('ITC PART REVERSED'));
		expect(text(r)).toContain(
			`Destroyed at Lakshmi Agencies' godown his stock: he reverses their credit${units.toLocaleString('en-IN')}`
		);
		await fireEvent.click(r.getAllByRole('button', { name: /Destruction certificate/ })[0]);
		await waitFor(() => expect(text(r)).toContain('DESTROYED'));
		const cert = c.docs.find((x) => x.id === 'destruction')!;
		const t = text(r);
		// page 1: the certificate, the goods and the reason, the method and the facility, the day and the window
		expect(t).toContain(
			'DECCAN GREEN WASTE MANAGEMENTAuthorised waste-management agency · authorisation TSPCB/SWM/HYD/0287'
		);
		expect(t).toContain(`Certificate of Destruction No. ${cert.no}Dated 02/10/2026Page 1 of 2`);
		expect(t).toContain('Goods Munchly Mango Drink 200 ml, HSN 2202, MRP ₹20.00');
		expect(t).toContain('Batch No. MF-2410-118 (made 27 Apr 2026, best before 24 Oct 2026)');
		expect(t).toContain(`Quantity ${cert.units!.toLocaleString('en-IN')} packs, 48 cartons of 27 and 22 loose`);
		expect(t).toContain('Total weight 283.37 kg (280.73 kg food, 2.64 kg packaging), weighed at the facility');
		expect(t).toContain('Owner Lakshmi Agencies, GSTIN 36AAJFL0000L1ZM');
		expect(t).toContain('Method Sanitary landfill, CPCB-compliant (Solid Waste Management Rules, 2016)');
		expect(t).toContain('Facility Municipal sanitary landfill, cell 7, Jawaharnagar, Hyderabad 500087, Telangana');
		expect(t).toContain('Date and time 2 Oct 2026, 07:35 to 08:00 IST');
		expect(t).toContain(`GST ${inr2(cert.reversed!)} reversed by Lakshmi Agencies, s.17(5)(h)`);
		// signed at the facility: the officer by the agency's seal, a witness on its panel, one he named who is not
		expect(t).toContain('Supervising officer M. Srinivas ReddySite supervisor, Deccan Green Waste Management');
		expect(t).toContain(
			'Independent witness 1 Syed MujeebHouse 14, Gandhi Nagar, Hyderabad 500080Voter ID, last four 5831'
		);
		expect(t).toContain("Independent witness 2 signed on the agency's original P. Anitha");
		for (const name of ['M. Srinivas Reddy', 'Syed Mujeeb', 'K. Lakshmi Narayana'])
			expect(r.getAllByRole('img', { name: `Signed by ${name}` }).length).toBeGreaterThan(0);
		expect(t).toContain('Goods handed over byK. Lakshmi NarayanaPartner, Lakshmi Agencies');
		expect(t).toContain(`Evidence approved by${c.destruction!.approvedBy}for Munchly Foods Ltd, 2 Oct, 08:00`);
		// page 2: the log, its two photos from their links, each step initialled
		expect(t).toContain(`Destruction log · ${cert.no}Page 2 of 2`);
		expect(t).toContain('07:20Received and weighed283.37 kg on weighbridge slip WB/26-27/0099');
		const before = r.getByRole('img', { name: "The packs at the godown, the carton's batch label in view" });
		expect(before.getAttribute('src')).toBe('http://storage/before?get');
		expect(r.getAllByRole('img', { name: 'Initialled by Syed Mujeeb' }).length).toBe(7);
		expect(r.container.querySelectorAll('.cert-ini-none').length).toBe(7); // P. Anitha, as initials
	});

	it("Munchly's credit note and GST memo are signed for it, and the draft tax invoice is not (SC-174)", async () => {
		vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1440);
		const m = moment('cleared');
		m.members.priya.snapshot.client.signatory = SIGNED;
		const r = await draw(source(fakeApi(m, 'priya')), 'paperwork', MANGO);
		await waitFor(() => expect(text(r)).toContain('Expiry credit note'));
		await fireEvent.click(r.getAllByRole('button', { name: /Price-support credit note/ })[0]);
		await waitFor(() => expect(text(r)).toContain('Credit Note No.'));
		const paper = r.container.querySelector('.paper.tl')!;
		expect(paper.querySelector('img.sig-hand')?.getAttribute('alt')).toBe('Signed by Vinod Patwardhan');
		expect(paper.querySelector('.sig-ink.round.sealed img.sig-seal')).toBeTruthy();
		expect(norm(paper.textContent)).toContain(
			'for Munchly Foods Ltd Authorised Signatory Vinod Patwardhan, Head of Accounts'
		);
		expect(norm(paper.textContent)).not.toContain('Computer Generated');
		await fireEvent.click(r.getAllByRole('button', { name: /GST ITC memo/ })[0]);
		await waitFor(() => expect(text(r)).toContain('ITC PART REVERSED'));
		const memo = r.container.querySelector('.paper.pp .pp-sign')!;
		expect(norm(memo.textContent)).toBe('for Munchly Foods LtdVinod Patwardhan, Head of Accounts');
	});

	it("Lakshmi Agencies' You end whole, on the batch's page, counts what each line took, and the expiry credit", async () => {
		// a partner is not sent the plan: what each line took is in her partner facts, which the journey's own batch
		// reads once it has cleared, as a batch she cleared before does (SC-94, SC-133, SC-135)
		const s = source(fakeApi(moment('cleared'), 'lakshmi-owner'));
		const r = await draw(s, 'batches', MANGO);
		await tab(r, 'Money');
		await waitFor(() => expect(text(r)).toContain('You end whole'));
		const c = moment('cleared').members['lakshmi-owner'].cases[MANGO];
		const x = c.expiry!;
		const no = (id: string) => c.docs.find((d) => d.id === id)!.no;
		const t = text(r);
		expect(t).toContain('You end wholesettled');
		expect(t).toMatch(/From \d+ kiranas 84 packets₹1,008/); // what the kiranas ordered, at ₹12
		expect(t).toContain('Your staff sale 120 packs₹960');
		expect(t).toContain('Given to Feeding India 58 packs₹0');
		expect(t).toContain(`Price-support credit note ${no('support')}${inr(c.support!.total)}`);
		expect(t).toContain(
			`Expiry credit note for ${x.units.toLocaleString('en-IN')} packs ${no('expiry')}${inr(x.amount!)}`
		);
		// under route B she also reverses the GST on them and pays the agency, which the note makes good (SC-139)
		expect(t).toContain("the van, the listing fee, the GST you reverse and the agency's charges");
		expect(t).toContain('Your gain or loss₹0');
	});

	it("Priya's Who keeps what counts what each line took, and the settlement on both sides", async () => {
		const s = source(fakeApi(moment('cleared'), 'priya'));
		const r = await draw(s, 'paperwork', MANGO);
		await waitFor(() => expect(text(r)).toContain('Who keeps what'));
		const c = moment('cleared').members.priya.cases[MANGO];
		const x = c.expiry!;
		const took = c.support!.rows.reduce((t, row) => t + row.units * row.price, 0); // 84 at ₹12, 120 at ₹8, 58 donated
		const t = text(r);
		expect(t).toContain(`Lakshmi Agencies receives${inr(took + c.support!.total)}`);
		expect(t).toContain(`and the expiry credit for ${x.units.toLocaleString('en-IN')} packs${inr(x.amount!)}`);
		expect(t).toContain(`and the GST he reverses on them and the agency's charges−${inr(x.reversal! + x.charges!)}`);
		expect(t).toContain('He ends whole₹0');
		expect(t).toContain(`and the expiry settlement for ${x.units.toLocaleString('en-IN')} packs−${inr(x.total)}`);
		// the donation's handling and the credit given away with it, as the ledger's swing counts them (SC-122)
		const gift = c.plan!.lines.find((l) => l.id === 'foodbank')!;
		const given = gift.cost + gift.itcLoss;
		expect(t).toContain(`and the donation's handling and credit, ${gift.units} packs−${inr(given)}`);
		expect(t).toContain(`Better for Munchly${inr(c.claim!.total - c.support!.total - x.total - given)}`);
	});
});

describe('packs destroyed at the godown, live (SC-139)', () => {
	it("Lakshmi Agencies' Today asks her to destroy them first, and the screen takes the two photos", async () => {
		const m = moment('destruction-asked');
		const dz = m.members['lakshmi-owner'].cases[MANGO].destruction!;
		expect(dz.status).toBe('requested');
		const r = await draw(source(fakeApi(m, 'lakshmi-owner')), 'home');
		await waitFor(() => expect(text(r)).toContain('Destroy'));
		const t = text(r);
		expect(t).toContain(`Destroy ${dz.units.toLocaleString('en-IN')} expired packs at your godown`);
		expect(t).toContain("send the evidence: two photos and the agency's certificate");
		r.unmount();
		const d = await draw(source(fakeApi(m, 'lakshmi-owner')), 'destroy', MANGO);
		await waitFor(() => expect(text(d)).toContain('Send to Munchly for approval'));
		const u = text(d);
		expect(u).toContain('Deccan Green Waste Management'); // Hyderabad's agency alone
		expect(u).not.toContain('Orange City Enviro Services');
		expect(u).toContain('Authorisation TSPCB/SWM/HYD/0287');
		expect(d.getByRole('button', { name: 'Send to Munchly for approval' })).toHaveProperty('disabled', true);
		// a live workspace shows no stand-in photo: the frame waits for hers
		expect(d.queryAllByRole('img').filter((x) => /landfill|godown/.test(x.getAttribute('alt') ?? ''))).toEqual([]);
	});

	it('Priya, as it is asked for, reads that the batch waits for the evidence', async () => {
		const m = moment('destruction-asked');
		const r = await draw(source(fakeApi(m, 'priya')), 'execution', MANGO);
		await waitFor(() => expect(text(r)).toContain('Destruction at the godown'));
		expect(text(r)).toContain('waiting for the evidence');
		expect(text(r)).toContain('Lakshmi Agencies is asked to destroy the');
	});

	it("Priya's Command Center asks for her yes, and the review states what the yes issues", async () => {
		const m = moment('destruction-checked');
		const c = m.members.priya.cases[MANGO];
		const approveDestruction = vi.fn(() => Promise.resolve({ seq: m.members.priya.snapshot.seq, case: null }));
		const s = source(fakeApi(m, 'priya', { approveDestruction }));
		s.setFocus(MANGO);
		const r = await draw(s, 'command');
		await waitFor(() => expect(text(r)).toContain('Review the destruction'));
		expect(text(r)).toContain('The destruction waits for your yes');
		await fireEvent.click(r.getByRole('button', { name: 'Review the destruction' }));
		const sheet = await waitFor(() => r.getByRole('dialog'));
		const t = norm(sheet.textContent);
		expect(t).toContain(`Batch ${MANGO} read on the carton label`);
		expect(t).toContain("Deccan Green Waste Management is on Munchly's list");
		expect(t).toContain(`Expiry credit note to Lakshmi Agencies`);
		expect(t).toContain(`₹${c.expiry!.amount!.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
		expect(sheet.querySelectorAll('img.cam-feed').length).toBe(2); // her two photos, from their links
		await fireEvent.click(r.getByRole('button', { name: 'Approve · issue the papers' }));
		await waitFor(() => expect(approveDestruction).toHaveBeenCalledWith(MANGO));
	});

	it('sends both photos to their links, then the evidence with the agency, its certificate, the window and two witnesses', async () => {
		const m = moment('destruction-asked');
		withPanel(m.members['lakshmi-owner'].snapshot);
		class FakeXhr {
			upload: { onprogress?: (e: { lengthComputable: boolean; loaded: number; total: number }) => void } = {};
			status = 200;
			onload?: () => void;
			onerror?: () => void;
			onabort?: () => void;
			open() {}
			setRequestHeader() {}
			send() {
				setTimeout(() => this.onload?.(), 0);
			}
			abort() {}
		}
		vi.stubGlobal('XMLHttpRequest', FakeXhr);
		vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: () => 'blob:evidence' }));
		const links: string[] = [];
		const destructionPhoto = vi.fn((_ref: string, which: string) => {
			links.push(which);
			return Promise.resolve({ id: `dz-${which}`, url: `http://storage/${which}`, headers: {}, expiresAt: '' });
		});
		const sendDestruction = vi.fn(() => Promise.resolve({ seq: m.members['lakshmi-owner'].snapshot.seq, case: null }));
		const s = source(fakeApi(m, 'lakshmi-owner', { destructionPhoto, sendDestruction }));
		const r = await draw(s, 'destroy', MANGO);
		await waitFor(() => expect(text(r)).toContain('Send to Munchly for approval'));
		const inputs = [...r.container.querySelectorAll<HTMLInputElement>('input[type="file"]:not([capture])')];
		expect(inputs.length).toBe(2);
		for (const [i, which] of ['before', 'after'].entries())
			await fireEvent.change(inputs[i], {
				target: { files: [new File([which], `${which}.jpg`, { type: 'image/jpeg' })] }
			});
		await fireEvent.input(r.getByLabelText("Agency's certificate number"), { target: { value: 'DGW/DC/26-27/0099' } });
		// the window starts at the agency's usual and the witnesses at its panel; he names the second one himself
		expect((r.getByLabelText('Destroyed from') as HTMLInputElement).value).toBe('12:55');
		expect((r.getByLabelText('Witness 1 · name') as HTMLInputElement).value).toBe('Syed Mujeeb');
		await fireEvent.input(r.getByLabelText('To'), { target: { value: '13:25' } });
		await fireEvent.input(r.getByLabelText('Witness 2 · name'), { target: { value: 'R. Kavitha' } });
		await fireEvent.click(r.getByRole('button', { name: 'Send to Munchly for approval' }));
		await waitFor(() => expect(sendDestruction).toHaveBeenCalled());
		expect(links).toEqual(['before', 'after']);
		expect(sendDestruction).toHaveBeenCalledWith(MANGO, {
			agency: 'dgw',
			certificate: 'DGW/DC/26-27/0099',
			photos: { before: 'dz-before', after: 'dz-after' },
			window: { from: '12:55', to: '13:25' },
			witnesses: [
				{ name: 'Syed Mujeeb', address: 'House 14, Gandhi Nagar, Hyderabad 500080' },
				{ name: 'R. Kavitha', address: 'Flat 3, Kavadiguda, Hyderabad 500080' }
			]
		});
		vi.unstubAllGlobals();
	});

	it("Lakshmi Agencies' screen says it went for approval, with her photos", async () => {
		const m = moment('destruction-checked');
		const r = await draw(source(fakeApi(m, 'lakshmi-owner')), 'destroy', MANGO);
		await waitFor(() => expect(text(r)).toContain('Sent for approval'));
		expect(r.getAllByRole('img').filter((x) => /godown|landfill/.test(x.getAttribute('alt') ?? '')).length).toBe(2);
	});

	it("Lakshmi Agencies' cleared Mango Drink tells every moment, the destruction's among them", async () => {
		// the journey's own batch, once cleared, reads her partner facts as a batch she cleared before does (SC-135)
		const m = moment('cleared');
		const x = m.members.priya.cases[MANGO].expiry!;
		const r = await draw(source(fakeApi(m, 'lakshmi-owner')), 'batches', MANGO);
		await waitFor(() => expect(text(r)).toContain('You sent the label photo'));
		const t = text(r);
		expect(t).toContain('Your staff sale sold');
		expect(t).toContain('Feeding India collected');
		expect(t).toContain(`Asked to destroy ${x.units.toLocaleString('en-IN')} expired packs at your godown`);
		expect(t).toContain("You sent the destruction's evidence");
		expect(t).toContain('approved the destruction');
		expect(t).toContain(`${x.units.toLocaleString('en-IN')} packs destroyed at your godown`);
		expect(t).not.toContain('Settled: you ended whole');
	});
});

describe('every watchlist row opens something (SC-90)', () => {
	it('an at-risk batch the Watcher has not flagged opens its own page, its Journey saying when it will be (SC-112)', async () => {
		const go = vi.fn();
		const s = source(fakeApi(moment('start'), 'priya'));
		const r = render(LiveHost, {
			props: { source: s, screen: 'command', at: null, onnavigate: go }
		}) as unknown as RenderResult<never>;
		await waitFor(() => expect(s.status.phase).toBe('ready'));
		await waitFor(() => expect(r.container.querySelector('button.batchrow')).toBeTruthy());
		const row = [...r.container.querySelectorAll('button.batchrow')].find((b) => b.textContent?.includes(CHIPS))!;
		await fireEvent.click(row);
		expect(go).toHaveBeenCalledWith('journey', { replace: undefined, ref: CHIPS });
		r.unmount();
		const page = await draw(source(fakeApi(moment('start'), 'priya')), 'journey', CHIPS);
		await waitFor(() =>
			expect(norm(page.container.querySelector('.bhead h1')?.textContent)).toBe('Masala Chips 150 g')
		);
		// a batch in no journey has its Journey alone: no tabs
		expect(page.container.querySelector('.bh-tabs')).toBeNull();
		const t = text(page);
		expect(t).toContain(CHIPS);
		expect(t).toMatch(/At risk: [\d,]+ packs will not sell before the last week\./);
		expect(t).toContain(
			'The Watcher checks every morning at 09:00, and flags it once Setup is confirmed and Rakesh Traders has given Smart-Clearance permission to act.'
		);
	});

	it('on the busy Command Center, a batch in no journey opens its Journey, and one in a journey its page where it stands (SC-112)', async () => {
		const go = vi.fn();
		const s = source(fakeApi(moment('executing'), 'priya'));
		const r = render(LiveHost, {
			props: { source: s, screen: 'command', at: null, onnavigate: go }
		}) as unknown as RenderResult<never>;
		await waitFor(() => expect(s.status.phase).toBe('ready'));
		await waitFor(() => expect(r.container.querySelector('button.batchrow')).toBeTruthy());
		const rows = () => [...r.container.querySelectorAll('button.batchrow')];
		await fireEvent.click(rows().find((b) => b.textContent?.includes('MF-2408-311'))!);
		expect(go).toHaveBeenCalledWith('journey', { replace: undefined, ref: 'MF-2408-311' });
		expect(r.queryByRole('dialog')).toBeNull();
		await fireEvent.click(rows().find((b) => b.textContent?.includes(MANGO))!);
		expect(go).toHaveBeenCalledWith('execution', { replace: undefined, ref: MANGO });
		// the Peanut Chikki's Journey: what the Watcher sees of it
		const page = await draw(source(fakeApi(moment('executing'), 'priya')), 'journey', 'MF-2408-311');
		await waitFor(() => expect(text(page)).toContain('Outside at least one quick-commerce gate'));
		expect(norm(page.container.querySelector('.bhead h1')?.textContent)).toBe('Peanut Chikki 100 g');
	});
});

describe('Execution keeps the batch in focus (SC-91)', () => {
	it("Watch execution in the chips' Route Room opens the chips' Execution", async () => {
		const go = vi.fn();
		const s = source(fakeApi(moment('executing'), 'priya'));
		const r = render(LiveHost, {
			props: { source: s, screen: 'route', at: CHIPS, onnavigate: go }
		}) as unknown as RenderResult<never>;
		await waitFor(() => expect(s.case?.batch.id).toBe(CHIPS));
		await fireEvent.click(await waitFor(() => r.getByRole('button', { name: 'Watch execution' })));
		expect(go).toHaveBeenCalledWith('execution', { replace: undefined, ref: CHIPS });
	});

	it('a screen opened without a batch keeps the one in focus, not the most urgent', async () => {
		const m = moment('executing');
		expect(m.members.priya.snapshot.cases[0].ref).toBe(MANGO); // the most urgent case is the Mango Drink
		const s = source(fakeApi(m, 'priya'));
		const host = render(LiveHost, { props: { source: s, screen: 'route', at: CHIPS } });
		const r = host as unknown as RenderResult<never>;
		await waitFor(() => expect(s.case?.batch.id).toBe(CHIPS));
		await host.rerender({ source: s, screen: 'execution', at: null });
		await waitFor(() => expect(text(r)).toContain(`${CHIPS} · day 0 to`));
		expect(s.case?.batch.id).toBe(CHIPS);
		expect(text(r)).toContain('Lister · ExpireSoon');
		expect(text(r)).not.toContain('Nothing is executing yet');
	});
});

describe("the buyer's listing (SC-92)", () => {
	it('sends a message to the seller, and the counter names the token it takes', async () => {
		const message = vi.fn(() => Promise.resolve({ seq: 1, case: null }));
		const s = source(fakeApi(moment('executing'), 'agrawal', { message }));
		const r = await draw(s, 'listing', CHIPS);
		const box = await waitFor(() => r.getByRole('textbox', { name: 'Message the seller' }));
		await fireEvent.input(box, { target: { value: '  Can you dispatch by Monday?  ' } });
		await fireEvent.submit(box.closest('form')!);
		await waitFor(() => expect(message).toHaveBeenCalledWith(CHIPS, 'Can you dispatch by Monday?'));
		// the box clears once the message has gone (SC-152)
		await waitFor(() => expect((box as HTMLInputElement).value).toBe(''));
		// 772 packs at the ₹14.20 counter, a 15% token: ₹1,644, as money.js's award has it
		expect(text(r)).toContain('Accept ₹14.20 · pay ₹1,644 token');
		// the buyer's own bubble carries his face, not a stand-in
		const face = [...r.container.querySelectorAll('.avatar')].find((a) => a.closest('.row.end'));
		expect(face).toBeTruthy();
		expect(face!.textContent?.trim()).not.toBe('?');
	});

	it("a batch's BRSR line says what it donated and the meals that made, or that it donated nothing (SC-106)", async () => {
		const m = moment('cleared');
		const batchLine = async (ref: string) => {
			// the batch's own page in the ledger (SC-121), on its impact
			const r = await draw(source(fakeApi(m, 'priya')), 'report', ref);
			await tab(r, 'Impact');
			await waitFor(() => expect(text(r)).toContain('BRSR line'));
			expect(text(r)).toContain(ref);
			const t = text(r);
			r.unmount();
			return t;
		};
		// the Mango Drink gave 58 packs to Feeding India on the fixtures' journey
		const mango = await batchLine(MANGO);
		expect(mango).toContain('58 meals (58 packs donated)');
		expect(mango).not.toContain('nothing donated');
		// the chips gave nothing
		expect(await batchLine(CHIPS)).toContain('0 meals (nothing donated)');
	});

	it("a batch's evidence names only what it has: no empty slots for an invoice or a lot it never had (SC-107)", async () => {
		const m = moment('cleared');
		const evidence = async (ref: string) => {
			const r = await draw(source(fakeApi(m, 'priya')), 'report', ref);
			await tab(r, 'Impact');
			const line = await waitFor(() => r.getByText(/^Evidence:/));
			const t = norm(line.textContent);
			r.unmount();
			return t;
		};
		// the Mango Drink: no ExpireSoon lot, so no invoice; its donation's FSSAI checklist and receipt; on the fixtures'
		// journey it expired with packs at the godown, so its expiry credit note and the destruction certificate (SC-121)
		const mango = await evidence(MANGO);
		expect(mango).not.toMatch(/· ·|Evidence: ·/);
		expect(mango).toMatch(
			/^Evidence: \d+ kirana order logs · CN\/0118 · CN\/0119 · FSSAI checklist · FI\/HYD\/26-27\/0417 · destruction certificate$/
		);
		// the chips keep their invoice and lot
		expect(await evidence(CHIPS)).toMatch(/^Evidence: INV\/26-27\/0931 · ES-24117 · \d+ kirana order logs · CN\/0117$/);
	});

	it('Meera opens the receipt Feeding India issued as she collected, and its PDF once it is laid out (SC-110)', async () => {
		const m = moment('cleared');
		const open = async (mm: Moment, over: Partial<Record<keyof WorkspaceApi, unknown>> = {}) => {
			const r = await draw(source(fakeApi(mm, 'meera', over)), 'pickups', MANGO);
			const row = await waitFor(() => r.container.querySelector<HTMLElement>('.receipt-row')!);
			expect(norm(row.textContent)).toContain('Donation receipt FI/HYD/26-27/0417');
			expect(norm(row.textContent)).toContain('58 packs · 58 meals · shared with Munchly for its BRSR table');
			await fireEvent.click(row);
			return { r, sheet: await waitFor(() => r.getByRole('dialog')) };
		};
		const { r, sheet } = await open(m);
		const t = norm(sheet.textContent);
		for (const bit of [
			'FI/HYD/26-27/0417 · in-app',
			'RECEIVED',
			'through Lakshmi Agencies, Begum Bazaar godown, Hyderabad',
			'Feeding India',
			'Batch MF-2410-118',
			'Meals a meal for each pack served, indicative58',
			`The same paper is in Munchly's document pack for ${MANGO}.`
		])
			expect(t).toContain(bit);
		// Paperwork has not laid it out yet: no PDF to offer
		expect(t).not.toContain('Download the PDF');
		r.unmount();

		// once it has, the PDF opens from a five-minute link
		const laid = moment('cleared');
		laid.members.meera.cases[MANGO].donation!.receipt!.pdf = true;
		const url = vi.fn(() => Promise.resolve({ url: 'https://storage.example/receipt.pdf', expiresAt: '' }));
		const opened = vi.spyOn(window, 'open').mockImplementation(() => null);
		const again = await open(laid, { documentUrl: url });
		await fireEvent.click(within(again.sheet).getByRole('button', { name: 'Download the PDF' }));
		await waitFor(() =>
			expect(opened).toHaveBeenCalledWith('https://storage.example/receipt.pdf', '_blank', 'noopener')
		);
		expect(url).toHaveBeenCalledWith(MANGO, 'receipt');
		opened.mockRestore();
		again.r.unmount();
	});

	it("the receipt is the Mango Drink's paper after the FSSAI checklist, set out as Meera's is (SC-110)", async () => {
		// a batch's papers on its page in the ledger (SC-121)
		const r = await draw(source(fakeApi(moment('cleared'), 'priya')), 'report', MANGO);
		await tab(r, 'Papers');
		await waitFor(() => expect(text(r)).toContain('Document pack'));
		const cards = [...r.container.querySelectorAll('.docgrid .docpick')].map((x) => norm(x.textContent));
		const at = cards.findIndex((x) => x.includes('FSSAI surplus-food checklist'));
		expect(cards[at + 1]).toContain('Donation receipt');
		expect(cards[at + 1]).toContain('FI/HYD/26-27/0417');
		r.unmount();
	});

	it('Paperwork says "at the award" only for a batch with an award; one without waits on its lines (SC-108)', async () => {
		const subtitle = async (m: Moment, who: string, ref: string) => {
			const r = await draw(source(fakeApi(m, who)), 'paperwork', ref);
			await waitFor(() => expect(text(r)).toContain(`${ref} · prepared by the Paperwork agent`));
			return r;
		};
		// the operator's Paperwork, a screen of the batch's page (SC-112); Finance reads the papers in the ledger (SC-121)
		const cleared = moment('cleared');
		const chips = await subtitle(cleared, 'priya', CHIPS);
		expect(text(chips)).toContain(`${CHIPS} · prepared by the Paperwork agent at the award`);
		chips.unmount();
		const mango = await subtitle(cleared, 'priya', MANGO);
		expect(text(mango)).toContain(`${MANGO} · prepared by the Paperwork agent once every line was done`);
		mango.unmount();
		// before its papers, the Mango Drink's pack waits on its lines, with no tax invoice or truck to wait for
		const waiting = await subtitle(moment('executing'), 'priya', MANGO);
		await waitFor(() => expect(text(waiting)).toContain('The pack is drafted once every line is done'));
		expect(text(waiting)).toContain('Drafts the whole pack once every line of the plan is done.');
		expect(text(waiting)).not.toMatch(/at the award|tax invoice|buyer's truck/);
	});

	it("the Mango Drink's GST ITC memo reads its input credit from the plan, and Paperwork stays up (SC-105)", async () => {
		const m = moment('cleared');
		const r = await draw(source(fakeApi(m, 'priya')), 'paperwork', MANGO);
		await fireEvent.click(await waitFor(() => r.getByRole('button', { name: /GST ITC memo/ })));
		// the Mango's SKU has no itcPerUnit of its own: ₹11 at cost × 5% GST, as money.js works it out, so the memo says
		// it is estimated (SC-122, the maintainer's call)
		expect(m.members.priya.cases[MANGO].sku.itcPerUnit ?? null).toBeNull();
		await waitFor(() => expect(text(r)).toContain('₹0.55 a pack, estimated from the cost and the GST rate'));
		expect(text(r)).not.toMatch(/NaN|undefined/);
		expect(r.getByRole('button', { name: /FSSAI surplus-food checklist/ })).toBeTruthy();
	});

	it("from Batches, Priya's rows open the batch's page, and a cleared batch's papers are processed (SC-103, SC-127)", async () => {
		const m = moment('cleared');
		const go = vi.fn();
		const s = source(fakeApi(m, 'priya'));
		const r = render(LiveHost, {
			props: { source: s, screen: 'batches', at: null, onnavigate: go }
		}) as unknown as RenderResult<never>;
		await waitFor(() => expect(s.status.phase).toBe('ready'));
		const row = (ref: string) =>
			[...r.container.querySelectorAll('tbody tr')].find((tr) => tr.textContent?.includes(ref))!;
		await waitFor(() => expect(row(CHIPS)).toBeTruthy());
		// a cleared batch opens its page on its Journey, its papers a tab away (SC-112), as a batch in no journey does
		await fireEvent.click(row(CHIPS));
		expect(go).toHaveBeenCalledWith('journey', { replace: undefined, ref: CHIPS });
		await fireEvent.click(row('MF-2408-311'));
		expect(go).toHaveBeenCalledWith('journey', { replace: undefined, ref: 'MF-2408-311' });
		r.unmount();
		// and the chips' papers, as Priya lands on them: processed, the pack reviewed
		const page = await draw(source(fakeApi(m, 'priya')), 'paperwork', CHIPS);
		await waitFor(() => expect(text(page)).toContain('INV/26-27/0931'));
		expect(text(page)).toContain('CN/0117');
		expect(text(page)).toContain('GST ITC memo');
		expect(page.getByText('reviewed', { exact: true })).toBeTruthy();
		expect(page.queryByRole('button', { name: 'Mark reviewed' })).toBeNull();
	});

	it('Batches shows every batch at its own journey: a cleared batch reads Cleared, in focus or not (SC-102)', async () => {
		const m = moment('cleared');
		const s = source(fakeApi(m, 'priya'));
		const r = await draw(s, 'batches');
		const row = (ref: string) =>
			[...r.container.querySelectorAll('tr')].find((tr) => tr.textContent?.includes(ref))?.textContent ?? '';
		await waitFor(() => expect(row(CHIPS)).not.toBe(''));
		// both batches' journeys cleared, whichever is in focus
		expect(m.members.priya.snapshot.batches.find((b) => b.id === CHIPS)?.phase).toBe('cleared');
		for (const ref of [CHIPS, MANGO]) {
			expect(norm(row(ref))).toContain('Cleared');
			expect(norm(row(ref))).not.toContain('At risk');
		}
		// a batch in no journey keeps the Watcher's reading
		expect(norm(row('MF-2408-311'))).toContain('Gated');
	});

	it('before the Valuer prices a flagged batch, its card says what destroying it would cost, never ₹0 (SC-99)', async () => {
		const s = source(fakeApi(moment('at-risk'), 'priya'));
		const r = await draw(s, 'command', CHIPS);
		await waitFor(() => expect(text(r)).toContain('if destroyed · 1,360 units at risk'));
		const t = text(r);
		expect(t).toContain('26,330');
		expect(t).not.toMatch(/₹\s?0\s?if destroyed/);
	});

	it('the FSSAI checklist of a batch with no donation says only that, naming no batch as donated (SC-98)', async () => {
		const s = source(fakeApi(moment('cleared'), 'priya'));
		const r = await draw(s, 'paperwork', CHIPS);
		await fireEvent.click(await waitFor(() => r.getByRole('button', { name: /FSSAI surplus-food checklist/ })));
		await waitFor(() => expect(text(r)).toContain('Nothing from this batch was donated.'));
		const t = text(r);
		expect(t).not.toContain('has its own checklist');
		expect(t).not.toMatch(/0 packs to/);
	});

	it("once the lot is won, the bill reads the award's invoice before Paperwork drafts it (SC-96)", async () => {
		const m = moment('executing');
		const detail = structuredClone(m.members.agrawal.cases[CHIPS]);
		const invoice = { taxable: 10962.4, igst: 548, gstPct: 5, roundOff: -0.4, total: 11510 };
		const award = { units: 772, price: 14.2, gross: 10962.4, token: 1644, balance: 9318.4 };
		detail.award = { ...award, invoice };
		detail.journey.award = { ...award, at: detail.journey.bids.at(-1)!.at, buyer: 'Agrawal Wholesale', status: 'won' };
		detail.docs = [];
		const s = source(fakeApi(m, 'agrawal', { case: () => Promise.resolve(structuredClone(detail)) }));
		const r = await draw(s, 'listing', CHIPS);
		await waitFor(() => expect(text(r)).toContain('Lot won at ₹14.20'));
		const t = text(r);
		expect(t).not.toMatch(/NaN|undefined/);
		expect(t).toContain('₹548 IGST due');
		expect(t).toContain('772 × ₹14.20₹10,962.40');
		expect(t).toContain('IGST 5%');
		expect(t).toContain('Invoice total₹11,510.00');
	});
});

describe("the buyer's truck waits for the kirana scheme (SC-118)", () => {
	it('with the lot won and the scheme still open, Rakesh is told the truck loads once it closes', async () => {
		const m = moment('executing');
		const won = moment('cleared').members.rakesh.cases[CHIPS];
		const c = m.members.rakesh.cases[CHIPS];
		Object.assign(c, { award: won.award });
		Object.assign(c.journey, { award: won.journey.award, listing: won.journey.listing });
		const r = await draw(source(fakeApi(m, 'rakesh')), 'van', CHIPS);
		// backend-api refuses the truck until the scheme is over, so the button says so before it is pressed
		const wait = await r.findByRole('button', { name: 'Load once the scheme closes' });
		expect(wait.hasAttribute('disabled')).toBe(true);
		expect(r.queryByRole('button', { name: "Load the buyer's truck" })).toBeNull();

		// once the scheme has closed, the truck loads
		Object.assign(c.journey.offer!, { status: 'closed' });
		const r2 = await draw(source(fakeApi(m, 'rakesh')), 'van', CHIPS);
		const load = await r2.findByRole('button', { name: "Load the buyer's truck" });
		expect(load.hasAttribute('disabled')).toBe(false);
	});
});

describe("a distributor's portal, batch by batch (SC-133)", () => {
	// another batch of Rakesh Traders' in a journey beside the chips, as backend-api's partner facts send it: a history
	// batch as it stood once its papers were drafted, its invoice not yet issued
	const another = (): PartnerCase => {
		const c = structuredClone(
			HISTORY_CASES.find((x) => x.dist === 'rakesh' && x.award && x.docs.some((d) => d.id === 'invoice'))!
		);
		const i = c.steps.findIndex((x) => x.step === 'papers');
		return {
			...c,
			cleared: null,
			outcome: null,
			realised: null,
			offer: { status: 'closed', closesAt: null },
			steps: c.steps.slice(0, i + 1).filter((x) => x.step !== 'invoice' && x.step !== 'van')
		};
	};

	it('Today with two batches in a journey: an index over a card each, and a step acts on its own batch', async () => {
		const m = moment('executing');
		const other = another();
		m.members.rakesh.partner!.cases.push(other as never);
		const issueInvoice = vi.fn(() => Promise.resolve({ seq: 1, case: null }));
		const r = await draw(source(fakeApi(m, 'rakesh', { issueInvoice })), 'home');
		await waitFor(() => expect(text(r)).toContain('2 batches in a journey'));
		const index = r.getByRole('navigation', { name: 'Your batches in a journey' });
		expect(within(index).getAllByRole('button')).toHaveLength(2);
		// the batch asking most of him first: the other one's invoice and van round, then the chips' scheme
		const cards = r.container.querySelectorAll<HTMLElement>('section.dist-batch');
		expect([...cards].map((c) => c.id)).toEqual([`batch-${other.ref}`, `batch-${CHIPS}`]);
		const inv = other.docs.find((d) => d.id === 'invoice')!;
		const card = within(cards[0]);
		expect(card.getByText(`Issue ${inv.no} from Tally`)).toBeTruthy();
		expect(card.getByText('Run the van round')).toBeTruthy();
		expect(text(r)).toContain('2 for you');
		// Issue from Tally on that card names that batch, not the chips in focus
		await fireEvent.click(card.getByRole('button', { name: 'Issue from Tally' }));
		await waitFor(() => expect(issueInvoice).toHaveBeenCalledWith(other.ref, 'invoice'));
	});

	it("his batch's page counts the packs flagged at risk, and his label photo the day the label says it was made", async () => {
		// a partner is not sent the plan: the Watcher's at-risk packs, not the whole batch's 1,840; the label's 18 May,
		// not a day worked out from the shelf life
		const m = moment('cleared');
		const r = await draw(source(fakeApi(m, 'rakesh')), 'batches', CHIPS);
		await waitFor(() => expect(text(r)).toContain('The Watcher flagged 1,360 packs at risk'));
		expect(text(r)).not.toContain('1,840 packs');
		const p = await draw(source(fakeApi(m, 'rakesh')), 'photo');
		await waitFor(() => expect(text(p)).toContain('Earlier label photos'));
		expect(text(p)).toContain(`Vision read batch ${CHIPS}, made 18 May 2026, best before 18 Nov 2026, MRP ₹30.00`);
	});

	it("Lakshmi Agencies' cleared Mango Drink keeps its food bank's pickup, collected, in Deliveries and Orders", async () => {
		// once a batch clears its donation leaves the journey's state: read from her partner facts (SC-134)
		const m = moment('cleared');
		const gift = m.members.priya.cases[MANGO].plan!.lines.find((l) => l.id === 'foodbank')!.units;
		const v = await draw(source(fakeApi(m, 'lakshmi-owner')), 'van', MANGO);
		await waitFor(() => expect(text(v)).toContain('van round'));
		expect(text(v)).toContain('collected');
		expect(text(v)).not.toContain('being booked');
		v.unmount();
		const o = await draw(source(fakeApi(m, 'lakshmi-owner')), 'orders');
		await waitFor(() => expect(text(o)).toContain('Mango Drink'));
		expect(text(o)).toContain(`${gift} packs given`);
	});

	it("Rakesh's cleared chips name the van round by the day it leaves, though it ran before then (SC-137)", async () => {
		const m = moment('cleared');
		const leaves = m.members.priya.cases[CHIPS].moments.van.leavesAt!;
		const day = new Date(leaves).toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'Asia/Kolkata' });
		const r = await draw(source(fakeApi(m, 'rakesh')), 'batches', CHIPS);
		await waitFor(() => expect(text(r)).toContain('You sent the label photo'));
		expect(text(r)).toContain(`Your ${day} van round delivered the scheme`);
	});

	it("Orders lists each batch's orders under it, with the paper each sold on", async () => {
		const m = moment('cleared');
		const r = await draw(source(fakeApi(m, 'rakesh')), 'orders');
		await waitFor(() => expect(text(r)).toContain('Agrawal Wholesale, Raipur'));
		const t = text(r);
		const c = m.members.rakesh.cases[CHIPS];
		expect(t).toContain(`lot ${c.journey.listing!.id} · 772 × ₹14.20`);
		expect(t).toContain('INV/26-27/0931');
		// the row multiplies out to its amount: 588 at ₹18.00 effective is ₹10,584 (SC-141)
		expect(t).toContain('31 kiranas · 588 packets at ₹18.00 effective (₹21.60 a pack, 2 free with every 10)');
		expect(t).toContain("Show the 31 shops' orders ₹10,584");
		expect(t).toContain("Show the 31 shops' orders");
	});

	it('Deliveries waits on a batch the app has yet to put in focus, then reads it', async () => {
		const m = moment('executing');
		const other = another();
		m.members.rakesh.partner!.cases.push(other as never);
		const r = await draw(source(fakeApi(m, 'rakesh')), 'van', other.ref);
		// the other batch has no case in this moment: its head, and the page waits for it
		await waitFor(() => expect(r.container.querySelector('.bhead h1')?.textContent).toBeTruthy());
		expect(r.container.querySelector('.bhead .mono')?.textContent).toBe(other.ref);
		expect(text(r)).not.toContain('Start the round');
	});
});

describe('Finance & ESG, one ledger (SC-121)', () => {
	it('Priya reads the ledger in its three readings, every figure the ledger backend-api posted (SC-127)', async () => {
		const m = moment('cleared');
		const ledger = m.members.priya.ledger!;
		const year = ledger.periods.find((p) => p.kind === 'year')!;
		const r = await draw(source(fakeApi(m, 'priya')), 'report');
		await waitFor(() => expect(text(r)).toContain('One ledger, three readings'));
		// Money first: what was recovered against the bin
		await waitFor(() => expect(text(r)).toContain('recovered'));
		expect(text(r)).toContain(`From ${year.totals.batches} batches`);
		// GST: the credit kept, and what was reversed
		await fireEvent.click(r.getByRole('button', { name: 'GST' }));
		await waitFor(() => expect(text(r)).toContain('of input credit kept'));
		expect(text(r)).toContain(`${year.totals.creditNotes} credit notes`);
		const seg = r.getByRole('button', { name: new RegExp(`^Masala Chips 150 g, ${CHIPS}: `) });
		expect(seg.getAttribute('aria-label')).toContain('Sold through');
		// Impact: the kilos kept out of landfill
		await fireEvent.click(r.getByRole('button', { name: 'Impact' }));
		await waitFor(() => expect(text(r)).toContain('kept out of landfill'));
		expect(text(r)).not.toMatch(/NaN|undefined/);
		r.unmount();
	});

	it("a paper's PDF opens from the Paperwork agent's own, on the batch's page", async () => {
		const m = moment('cleared');
		const detail = m.members.priya.cases[CHIPS];
		detail.docs = detail.docs.map((d) => (d.id === 'invoice' ? { ...d, pdf: true } : d));
		const url = vi.fn(() => Promise.resolve({ url: 'https://storage.example/invoice.pdf', expiresAt: '' }));
		const opened = vi.spyOn(window, 'open').mockImplementation(() => null);
		const r = await draw(source(fakeApi(m, 'priya', { documentUrl: url })), 'report', CHIPS);
		await tab(r, 'Papers');
		// the batch's own tax invoice, not the kiranas' register beside it (SC-153)
		await fireEvent.click(await waitFor(() => r.getByRole('button', { name: /Tax invoice(?!s)/ })));
		const sheet = await waitFor(() => r.getByRole('dialog'));
		await fireEvent.click(within(sheet).getByRole('button', { name: 'Download Tax invoice as a PDF' }));
		await waitFor(() =>
			expect(opened).toHaveBeenCalledWith('https://storage.example/invoice.pdf', '_blank', 'noopener')
		);
		expect(url).toHaveBeenCalledWith(CHIPS, 'invoice');
		opened.mockRestore();
	});
});

describe("the partners' own history (SC-130)", () => {
	// the client's history as backend-api sends it to each partner: the seed's facts, cut as the partner route cuts them
	const DIST = ['invoice', 'eway', 'support', 'expiry', 'receipt', 'destruction'];
	const cut = {
		rakesh: (c: PartnerCase) =>
			c.dist === 'rakesh' ? { ...c, docs: c.docs.filter((d) => DIST.includes(d.id)) } : null,
		ganesh: (c: PartnerCase) =>
			c.dist === 'rakesh' && c.kirana
				? {
						...c,
						kiranas: c.kiranas.filter((k) => k.kirana === 'k0'),
						realised: null,
						support: null,
						award: null,
						listing: null,
						partner: null,
						donation: null,
						receipt: null,
						expiry: null,
						docs: []
					}
				: null,
		meera: (c: PartnerCase) =>
			c.partner?.name === 'Feeding India'
				? {
						...c,
						kiranas: [],
						kirana: null,
						realised: null,
						support: null,
						award: null,
						listing: null,
						expiry: null,
						docs: c.docs.filter((d) => d.id === 'receipt')
					}
				: null
	};
	const withHistory = (m: Moment, who: keyof typeof cut): WsPartner => {
		const view = m.members[who].partner!;
		const past = HISTORY_CASES.map(cut[who]).filter((c) => c !== null);
		return { ...view, cases: [...view.cases, ...(past as unknown as WsPartner['cases'])] };
	};
	const partnerApi = (m: Moment, who: keyof typeof cut, over: Partial<Record<keyof WorkspaceApi, unknown>> = {}) =>
		fakeApi(m, who, { partner: () => Promise.resolve(withHistory(m, who)), ...over });

	it('Rakesh reads every batch of his: in a journey now, then those he cleared by month under how their figures add up', async () => {
		const m = moment('executing');
		const r = await draw(source(partnerApi(m, 'rakesh')), 'batches');
		await waitFor(() => expect(text(r)).toContain('Cleared · September 2026'));
		const t = text(r);
		expect(t).toContain('In a journey now');
		expect(t).toContain('Masala Chips 150 g');
		// how his figures add up (SC-145): what the batches cost him = what he sold (Orders) + what Munchly credited him
		// (the price support and the expiry credit notes, under SC-139's route B), this page's part marked
		expect(t).toContain('How your 6 cleared batches add up');
		expect(t).toContain('₹1,72,846what they cost you');
		expect(t).toContain('₹1,05,928you soldto your kiranas, buyers and staff · on Orders');
		expect(t).toContain('₹66,918Munchly credited youthis page');
		// each batch its own sum, its credit first: the Peanut Chikki's ₹7,821 + ₹14,640 = ₹22,461
		expect(t).toContain('₹7,821 credited+ ₹14,640 sold = ₹22,461');
		expect(r.getByRole('button', { name: /you sold/ })).toBeTruthy();
		expect(t).toContain('Cleared · August 2026');
		expect(t).not.toMatch(/NaN|undefined|Invalid Date/);
		r.unmount();
	});

	it('Orders opens on the same sum, what he sold marked, and each cleared batch with its sales first (SC-145)', async () => {
		const m = moment('executing');
		const r = await draw(source(partnerApi(m, 'rakesh')), 'orders');
		await waitFor(() => expect(text(r)).toContain('How your 6 cleared batches add up'));
		const t = text(r);
		expect(t).toContain('₹1,05,928you soldthis page');
		expect(t).toContain('₹66,918Munchly credited you8 credit notes · on Batches');
		expect(t).toContain('₹14,640 sold+ ₹7,821 credited = ₹22,461');
		expect(r.getByRole('button', { name: /Munchly credited you/ })).toBeTruthy();
		expect(t).not.toMatch(/NaN|undefined|Invalid Date/);
		r.unmount();
	});

	it('once the chips clear, they are one of his cleared batches on Batches and Orders, and in both sums (SC-162)', async () => {
		const m = moment('cleared');
		const r = await draw(source(partnerApi(m, 'rakesh')), 'batches');
		await waitFor(() => expect(text(r)).toContain('How your 7 cleared batches add up'));
		let t = text(r);
		// out of "In a journey now", into its own cleared month with its sum: ₹8,768 credited + ₹21,546 sold
		expect(t).not.toContain('In a journey now');
		expect(t).toContain('Cleared · October 2026');
		expect(t).toMatch(/MF-2409-117 · flagged \d+ Oct · cleared \d+ Oct/);
		expect(t).toContain('₹8,768 credited+ ₹21,546 sold = ₹30,314');
		expect(t).toContain('₹75,686Munchly credited youthis page');
		r.unmount();
		const o = await draw(source(partnerApi(m, 'rakesh')), 'orders');
		await waitFor(() => expect(text(o)).toContain('How your 7 cleared batches add up'));
		t = text(o);
		expect(t).toContain('₹1,27,474you soldthis page');
		expect(t).toContain('₹75,686Munchly credited you9 credit notes · on Batches');
		expect(t).toContain('₹21,546 sold+ ₹8,768 credited = ₹30,314');
		expect(t).not.toContain('still in a journey');
		expect(t).not.toMatch(/NaN|undefined|Invalid Date/);
		o.unmount();
	});

	it('a batch he cleared opens on what happened, how he ended whole, and his papers with the copies', async () => {
		const m = moment('executing');
		const r = await draw(source(partnerApi(m, 'rakesh')), 'batches', 'MF-2407-114');
		await waitFor(() => expect(text(r)).toContain('What happened'));
		let t = text(r);
		expect(t).toContain('Masala Oats 200 g');
		expect(t).toContain('Feeding India collected 466 packs');
		expect(t).toContain('Receipt FI/NAG/26-27/0416');
		await tab(r, 'Money');
		await waitFor(() => expect(text(r)).toContain('You end whole'));
		t = text(r);
		expect(t).toContain('Your gain or loss₹0');
		expect(t).toContain('Given to Feeding India');
		await tab(r, 'Papers');
		await waitFor(() => expect(text(r)).toContain('Copies for your records'));
		t = text(r);
		expect(t).toContain('Price-support credit note');
		expect(t).toContain('Donation receipt');
		expect(t).toContain('a copy for you');
		expect(t).not.toContain('GST ITC memo');
		expect(t).not.toContain('FSSAI surplus-food checklist');
		r.unmount();
	});

	it('his batch in a journey reads its moments off the steps backend-api stamped, the next ones still to come', async () => {
		const m = moment('executing');
		const r = await draw(source(partnerApi(m, 'rakesh')), 'batches', CHIPS);
		await waitFor(() => expect(text(r)).toContain('What happened'));
		const t = text(r);
		expect(t).toContain('You sent the label photo');
		expect(t).toContain('Munchly approved the plan');
		expect(t).toContain('772 listed on ExpireSoon in your name');
		expect(t).toContain('next');
		r.unmount();
	});

	it("another distributor's batch is not his", async () => {
		const m = moment('executing');
		const r = await draw(source(partnerApi(m, 'rakesh')), 'batches', 'MF-2406-109');
		await waitFor(() => expect(text(r)).toContain('Not one of your batches'));
		r.unmount();
	});

	it('Ganesh ji reads his order on top, every earlier offer and what each order earned', async () => {
		const m = moment('executing');
		let r = await draw(source(partnerApi(m, 'ganesh')), 'home');
		await waitFor(() => expect(text(r)).toContain('Earlier offers'));
		let t = text(r);
		expect(t).toContain('Ordered · 24 packets');
		expect(t).toContain('Peanut Chikki 100 g');
		expect(t).not.toMatch(/NaN|undefined|Invalid Date/);
		r.unmount();
		r = await draw(source(partnerApi(m, 'ganesh')), 'orders');
		await waitFor(() => expect(text(r)).toContain('your margin at MRP'));
		t = text(r);
		expect(t).toContain('7 orders since July');
		r.unmount();
		r = await draw(source(partnerApi(m, 'ganesh')), 'offer', 'MF-2407-116');
		await waitFor(() => expect(text(r)).toContain('Your order'));
		expect(text(r)).toContain('What was offered');
		r.unmount();
	});

	it("Ganesh ji's order names its tax invoice, which opens with its PDF once laid out (SC-153)", async () => {
		const m = moment('executing');
		const seen = m.members.ganesh;
		// the Paperwork agent has laid out the chips' invoice to his shop
		seen.partner!.cases = seen.partner!.cases.map((c) =>
			c.ref === CHIPS
				? { ...c, kiranas: c.kiranas.map((k) => ({ ...k, invoice: k.invoice && { ...k.invoice, pdf: true } })) }
				: c
		);
		const url = vi.fn(() => Promise.resolve({ url: 'https://storage.example/kirana-k0.pdf', expiresAt: '' }));
		const opened = vi.spyOn(window, 'open').mockImplementation(() => null);
		const r = await draw(source(partnerApi(m, 'ganesh', { documentUrl: url })), 'offer', CHIPS);
		await waitFor(() => expect(text(r)).toContain('RT/26-27/1279'));
		let t = text(r);
		expect(t).toContain('Before GST');
		expect(t).toContain('₹432.00');
		expect(t).toContain('₹454');
		expect(t).toContain('₹266.00');
		await fireEvent.click(r.getByRole('button', { name: /Tax invoice/ }));
		const sheet = await waitFor(() => r.getByRole('dialog'));
		t = text(r);
		expect(t).toContain('GSTIN/UIN: Unregistered');
		expect(t).toContain('Place of Supply: Maharashtra (27)');
		expect(t).toContain('₹ 454.00');
		expect(t).not.toMatch(/NaN|undefined|Invalid Date/);
		await fireEvent.click(within(sheet).getByRole('button', { name: 'Download PDF' }));
		await waitFor(() =>
			expect(opened).toHaveBeenCalledWith('https://storage.example/kirana-k0.pdf', '_blank', 'noopener')
		);
		expect(url).toHaveBeenCalledWith(CHIPS, 'kirana.k0');
		opened.mockRestore();
		r.unmount();
	});

	it("Rakesh opens a shop's tax invoice from his Orders, and the batch's register from its papers (SC-153)", async () => {
		const m = moment('executing');
		let r = await draw(source(partnerApi(m, 'rakesh')), 'orders');
		// the scheme's orders so far, each with its invoice in Rakesh Traders' series from the story's next
		await waitFor(() => expect(text(r)).toContain('RT/26-27/1279 to 1283'));
		expect(text(r)).toContain('5 tax invoices');
		await fireEvent.click(r.getAllByRole('button', { name: /shops' orders/ })[0]);
		await fireEvent.click(await waitFor(() => r.getByRole('button', { name: /Shree Ganesh Kirana.*RT\/26-27\/1279/ })));
		await waitFor(() => expect(text(r)).toContain('(ORIGINAL FOR RECIPIENT)'));
		expect(text(r)).toContain('Invoice No.RT/26-27/1279');
		expect(text(r)).toContain('Buyer (Bill to and Ship to)Shree Ganesh Kirana');
		r.unmount();
		r = await draw(source(partnerApi(m, 'rakesh')), 'batches', 'MF-2407-116');
		await tab(r, 'Papers');
		await fireEvent.click(await waitFor(() => r.getByRole('button', { name: /Tax invoices to kiranas · 24/ })));
		await waitFor(() => expect(text(r)).toContain('Sales Register'));
		expect(text(r)).toContain('RT/26-27/1255');
		expect(text(r)).toContain('24 invoices');
		r.unmount();
	});

	it("Priya's pack holds the batch's tax invoices to its kiranas, each opening from the register (SC-153)", async () => {
		vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1440);
		const r = await draw(source(fakeApi(moment('cleared'), 'priya')), 'paperwork', CHIPS);
		await fireEvent.click(await waitFor(() => r.getByRole('button', { name: /Tax invoices to kiranas/ })));
		await waitFor(() => expect(text(r)).toContain('Sales Register'));
		expect(text(r)).toContain('31 invoices');
		await fireEvent.click(r.getByRole('button', { name: 'RT/26-27/1279' }));
		await waitFor(() => expect(text(r)).toContain('Shree Ganesh Kirana'));
		expect(text(r)).toContain('Less: Scheme discount, buy 10 get 2 free');
		r.unmount();
	});

	it('a kirana that has not ordered can say Not this time', async () => {
		const m = moment('executing');
		const seen = m.members.ganesh;
		seen.cases[CHIPS].journey.orders = [];
		seen.partner!.cases = seen.partner!.cases.map((c) => (c.ref === CHIPS ? { ...c, kiranas: [] } : c));
		const decline = vi.fn(() => Promise.resolve({ seq: seen.snapshot.seq, case: null }));
		const r = await draw(source(partnerApi(m, 'ganesh', { declineOffer: decline })), 'home');
		const no = await waitFor(() => r.getByRole('button', { name: 'Not this time' }));
		await fireEvent.click(no);
		await waitFor(() => expect(decline).toHaveBeenCalledWith(CHIPS));
		r.unmount();
	});

	it('Meera reads the pickups she collected, each with the receipt she issued', async () => {
		const m = moment('cleared');
		let r = await draw(source(partnerApi(m, 'meera')), 'pickups');
		await waitFor(() => expect(text(r)).toContain('Collected'));
		const t = text(r);
		expect(t).toContain('FI/NAG/26-27/0416');
		expect(t).toContain('FI/HYD/26-27/0415');
		expect(t).toContain("872meals from Munchly's surplus since July");
		r.unmount();
		r = await draw(source(partnerApi(m, 'meera')), 'pickups', 'MF-2407-114');
		await waitFor(() => expect(text(r)).toContain('Confirmed by you'));
		expect(text(r)).toContain('Donation receipt FI/NAG/26-27/0416');
		expect(text(r)).toContain('FSSAI surplus-food checklist');
		r.unmount();
	});
});

describe("a batch's record (SC-142)", () => {
	it("Priya's Record of a batch: the photo Rakesh sent, the yeses, and every step by the agent or the person who took it", async () => {
		const m = moment('cleared');
		const r = await draw(source(fakeApi(m, 'priya')), 'record', CHIPS);
		await waitFor(() => expect(text(r)).toContain('Audit trail'));
		const t = text(r);
		expect(t).toContain('Photos sent for this batch');
		expect(t).toContain('Label photo');
		expect(t).toContain('Sent by Rakesh bhai · 2 Oct, 08:00');
		expect(t).toContain('Vision read batch MF-2409-117');
		// the yeses: the plan and the papers' review, each in Priya's name
		expect(t).toContain('The yeses');
		expect(t).toContain('Approved the plan · MF-2409-117 · net ₹21,770');
		expect(t).toContain("Reviewed Munchly's credit note and GST memo");
		// the shops' orders, one line a shop in the audit log, are one row holding them
		expect(t).toContain('31 kiranas');
		expect(t).toContain('Ordered 588 packets');
		expect(t).toContain('Issued the invoice from Tally · INV/26-27/0931');
		const img = r.container.querySelector<HTMLImageElement>('.rec-shot img')!;
		expect(img.src).toBe(m.members.priya.cases[CHIPS].journey.photo.url);
		// People: each person's step, none of the agents'
		await fireEvent.click(r.getByRole('button', { name: 'People' }));
		await waitFor(() => expect(text(r)).not.toContain('Watcher · agent'));
		expect(text(r)).toContain('Agrawal ji · Agrawal Wholesale');
		expect(text(r)).not.toMatch(/NaN|undefined|Invalid Date/);
		r.unmount();
	});

	it("a cleared batch's page in the ledger has its Record as a tab", async () => {
		const m = moment('cleared');
		const r = await draw(source(fakeApi(m, 'priya')), 'report', CHIPS);
		await tab(r, 'Record');
		await waitFor(() => expect(text(r)).toContain('Audit trail'));
		expect(text(r)).toContain('Approved the plan');
		expect(text(r)).not.toMatch(/NaN|undefined|Invalid Date/);
		r.unmount();
	});

	it('Batches lists a batch cleared and past its best-before by month, and opens its page on the Record', async () => {
		const m = moment('cleared');
		const ledger = m.members.priya.ledger!;
		const chips = ledger.batches.find((b) => b.ref === CHIPS)!;
		const past = {
			...chips,
			ref: 'MF-2407-116',
			name: 'Peanut Chikki 100 g',
			outcome: 'leftover' as const,
			cleared: '2026-09-28',
			history: true
		};
		const s = source(
			fakeApi(m, 'priya', { ledger: () => Promise.resolve({ ...ledger, batches: [...ledger.batches, past] }) })
		);
		const went = vi.fn();
		const r = render(LiveHost, {
			props: { source: s, screen: 'batches', onnavigate: went }
		}) as unknown as RenderResult<never>;
		await waitFor(() => expect(text(r)).toContain('Cleared · September 2026'));
		const t = text(r);
		expect(t).toContain('In view · from the DMS export');
		expect(t).toContain('MF-2407-116 · Rakesh Traders · flagged');
		expect(t).toContain('3 photos');
		// the story's batches stay in the table above, not under Cleared
		expect(t.split('Cleared · September 2026')[1]).not.toContain(CHIPS);
		await fireEvent.click(r.getByRole('button', { name: /Peanut Chikki 100 g/ }));
		expect(went).toHaveBeenCalledWith('report', expect.objectContaining({ ref: 'MF-2407-116', tab: 'record' }));
		r.unmount();
	});

	it('Rakesh reads the label photo he sent on his batch page, from its own link', async () => {
		const m = moment('cleared');
		const r = await draw(source(fakeApi(m, 'rakesh')), 'batches', CHIPS);
		await tab(r, 'Photos');
		await waitFor(() => expect(text(r)).toContain('Your photos for this batch'));
		const t = text(r);
		expect(t).toContain('Label photo');
		expect(t).toContain('Sent by Rakesh bhai · 2 Oct, 08:00');
		expect(t).toContain('Vision read batch MF-2409-117');
		expect(t).not.toContain('Approved');
		const pc = m.members.rakesh.partner!.cases.find((c) => c.ref === CHIPS)!;
		expect(r.container.querySelector<HTMLImageElement>('.rec-shot img')!.src).toBe(pc.photo!.url);
		expect(t).not.toMatch(/NaN|undefined|Invalid Date/);
		r.unmount();
	});

	it("Lakshmi Agencies reads her destruction photos, Vision's checks and Priya's yes on them", async () => {
		const m = moment('cleared');
		const r = await draw(source(fakeApi(m, 'lakshmi-owner')), 'batches', MANGO);
		await tab(r, 'Photos');
		await waitFor(() => expect(text(r)).toContain('Your photos for this batch'));
		const t = text(r);
		expect(t).toContain('4 · tap to open'); // the label, the two destruction photos and the staff sale's receipt
		expect(t).toContain('Staff sale receipt');
		expect(t).toContain('Vision read LA/SR/26-27/0002: 12 UPI payments, ₹960.00');
		expect(t).toContain('Before, at the godown');
		expect(t).toContain('After, at the landfill');
		expect(t).toContain('Batch MF-2410-118 read on the carton label');
		expect(t).toContain('Approved');
		expect(t).toContain('Priya Deshmukh');
		expect(t).toMatch(/Approved the destruction of [\d,]+ packs at /);
		expect(t).toContain('Munchly credited you on CN/0119 once it approved.');
		expect(r.container.querySelectorAll('.rec-shot img')).toHaveLength(4);
		expect(t).not.toMatch(/NaN|undefined|Invalid Date/);
		r.unmount();
	});
});

describe("Execution's Outreach card says where the kirana scheme stands (SC-156)", () => {
	it('while the window is open: the scheme as the shops see it, its close, and the push behind a button', async () => {
		const s = source(fakeApi(moment('executing'), 'priya'));
		const r = await draw(s, 'execution', CHIPS);
		await waitFor(() => expect(text(r)).toContain('Outreach · 38 kiranas'));
		const ex = text(r);
		expect(ex).toContain('The scheme');
		expect(ex).toContain('588 packets');
		expect(ex).toContain('Offer window · 48 h');
		expect(ex).toMatch(/closes Sun \d\d:\d\d/); // 48 hours after the push, the Sunday
		expect(ex).toMatch(/Sent\d\d:\d\dFirst order\d\d:\d\dClosedwaiting/); // the stops, with their times
		expect(ex).not.toContain('नमस्ते'); // one message to every shop: not on the card
		await fireEvent.click(r.getByRole('button', { name: 'The push, as sent' }));
		await waitFor(() => expect(text(r)).toContain('{shop}'));
		expect(text(r)).toContain('one message to all 38 shops');
	});
	it('once the batch has cleared: filled early, and the van round delivered it', async () => {
		const s = source(fakeApi(moment('cleared'), 'priya'));
		const r = await draw(s, 'execution', CHIPS);
		await waitFor(() => expect(text(r)).toContain('Outreach · 38 kiranas'));
		const ex = text(r);
		expect(ex).toContain('delivered');
		expect(ex).toMatch(/Delivered on Rakesh's van round/);
		expect(ex).toContain('closed early');
		expect(ex).not.toContain('push · Hindi');
	});
});

describe("the Ledger's Impact reading is the dashboard, and the Command Center points at it (SC-157)", () => {
	it("Priya's Impact reading draws the tiles, food by week, where the kilos went and by distributor", async () => {
		const s = source(fakeApi(moment('cleared'), 'priya'));
		const r = await draw(s, 'report');
		await waitFor(() => expect(text(r)).toContain('One ledger, three readings'));
		await fireEvent.click(r.getByRole('button', { name: 'Impact' }));
		await waitFor(() => expect(text(r)).toContain('Food, by week'));
		const t = text(r);
		expect(t).toContain('Kept out of landfill');
		expect(t).toContain('CO₂e avoided');
		expect(t).toContain('Where the kilos went');
		expect(t).toContain('Kirana scheme');
		expect(t).toContain('By distributor');
		expect(t).toContain('Rakesh Traders');
		expect(r.getByRole('img', { name: /Food a week/ })).toBeTruthy();
		await fireEvent.click(r.getByRole('button', { name: 'Show as a table' }));
		await waitFor(() => expect(text(r)).toContain('Week of'));
	});
	it("the Command Center's Impact card reads the quarter and opens the ledger on Impact", async () => {
		const s = source(fakeApi(moment('cleared'), 'priya'));
		const go = vi.fn();
		const r = render(LiveHost, {
			props: { source: s, screen: 'command', at: null, onnavigate: go }
		}) as unknown as RenderResult<never>;
		await waitFor(() => expect(s.status.phase).toBe('ready'));
		await waitFor(() => expect(text(r)).toContain('Impact · '));
		expect(text(r)).toContain('kept out of landfill');
		expect(text(r)).toContain('meals');
		await fireEvent.click(r.getByRole('button', { name: 'Open the ledger' }));
		expect(go).toHaveBeenCalledWith('report', expect.objectContaining({ reading: 'impact' }));
	});
});

describe('the GST papers in Tally’s layout (SC-148)', () => {
	it("an invoice Rakesh issued carries its e-invoice: the IRN from the parties' GSTINs, its acknowledgement and the signed QR", async () => {
		vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1440);
		const s = source(fakeApi(moment('cleared'), 'priya'));
		const r = await draw(s, 'paperwork', CHIPS);
		await waitFor(() => expect(text(r)).toContain('Tax invoice'));
		const c = moment('cleared').members.priya.cases[CHIPS];
		const inv = c.docs.find((d) => d.id === 'invoice')!;
		expect(c.journey.invoiceIssuedAt).toBeTruthy();
		await fireEvent.click(r.getAllByRole('button', { name: /Tax invoice/ })[0]);
		await waitFor(() => expect(text(r)).toContain('(ORIGINAL FOR RECIPIENT)'));
		const irn = createHash('sha256').update(`27ABHPR0000K1ZW2026-27INV${inv.no}`).digest('hex');
		const t = text(r);
		expect(t).toContain(irn);
		expect(t).toMatch(/Ack No\.:\s*1126\d{11}/);
		expect(t).toContain('GSTIN/UIN: 27ABHPR0000K1ZW');
		expect(t).toContain('GSTIN/UIN: 22AAGFA0000A1ZW');
		expect(t).toContain('Place of Supply: Chhattisgarh (22)');
		expect(t).not.toContain('DRAFT, for Rakesh Traders');
		expect(r.container.querySelector('.tl-einv svg')).not.toBeNull();
		expect(t).not.toMatch(/NaN|undefined|Invalid Date/);
		r.unmount();
	});
});
