// @vitest-environment jsdom
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
	WsQuarter
} from '@smart-clearance/api/workspace';
import { ApiError, NotAMember } from '@smart-clearance/api/workspace';
import { LiveSource } from '../../src/lib/live/source.svelte';
import LiveHost from './LiveHost.svelte';

// SC-68 option B's live states, drawn through the workspace app on what backend-api answered (fixtures/): the sign-in on
// email and password with the story's people as chips, an account that is not a member here, the live line and the
// band while the stream is down, a failed approval with Retry and approving offline, the flagged batches as tabs, and
// the label photo's Send filling as it goes

type Seen = {
	snapshot: WorkspaceSnapshot;
	cases: Record<string, CaseDetail>;
	quarter: WsQuarter | null;
	audit: WsAuditRow[];
};
type Moment = { public: WorkspacePublic; members: Record<string, Seen> };
const MOMENTS = import.meta.glob<Moment>('./fixtures/*.json', { eager: true, import: 'default' });
const moment = (name: string): Moment => structuredClone(MOMENTS[`./fixtures/${name}.json`]);
// the two batches the story's journey runs (SC-86): each its own case
const CHIPS = 'MF-2409-117';
const MANGO = 'MF-2410-118';

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
		quarter: () => (seen.quarter ? Promise.resolve(seen.quarter) : none(403)),
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
	it("Lakshmi Agencies records the Mango Drink's staff sale on her Today, once", async () => {
		const staffSale = vi.fn(() => Promise.resolve({ seq: 1, case: null }));
		const s = source(fakeApi(moment('executing'), 'lakshmi-owner', { staffSale }));
		const r = await draw(s, 'home');
		await waitFor(() => expect(text(r)).toContain('Staff sale · Mango Drink'));
		const t = text(r);
		expect(t).toContain('150 packs for your staff at ₹8 a pack, at Begum Bazaar godown');
		// her own address, from her distributor's record, beside a code drawn from it that nothing reads out
		expect(t).toContain('lakshmi-agencies@exampleupi');
		expect(r.container.querySelector('svg.paycode')?.getAttribute('aria-hidden')).toBe('true');
		// the count starts at every pack; three did not sell
		const fewer = r.getByRole('button', { name: 'Fewer packs sold to staff' });
		for (let i = 0; i < 3; i++) await fireEvent.click(fewer);
		await fireEvent.click(r.getByRole('button', { name: 'Record the sale' }));
		await waitFor(() => expect(staffSale).toHaveBeenCalledWith(MANGO, 147));
		await waitFor(() => expect(text(r)).toContain('147 of 150 sold to staff at ₹8 a pack'));
		expect(text(r)).toContain('3 packs stay at Begum Bazaar godown.');
		expect(r.queryByRole('button', { name: 'Record the sale' })).toBeNull();
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

	it("Priya's Execution settles the packs left at the godown by Munchly's policy, and opens the paper", async () => {
		const go = vi.fn();
		const s = source(fakeApi(moment('cleared'), 'priya'));
		const r = render(LiveHost, {
			props: { source: s, screen: 'execution', at: MANGO, onnavigate: go }
		}) as unknown as RenderResult<never>;
		await waitFor(() => expect(text(r)).toContain('Expiry settlement'));
		const x = moment('cleared').members.priya.cases[MANGO].expiry!;
		expect(x.policy).toBe('full-credit');
		const t = text(r);
		expect(t).toContain('Left at the godown'); // the card stays as it is, and the settlement follows it
		expect(t).toContain('Full credit at expiry');
		expect(t).toContain(`Credit to Lakshmi Agencies${inr(x.credit!)}`);
		expect(t).toContain('Destroyed byMunchly');
		expect(t).toContain(`Disposal, EPR, GST${inr(x.disposal + x.epr + x.itc)}`);
		expect(t).toContain(
			`The ${x.units.toLocaleString('en-IN')} packs come back to Munchly for full credit (${inr(x.credit!)}), and Munchly destroys them.`
		);
		await fireEvent.click(r.getByRole('button', { name: 'Open the paper' }));
		expect(go).toHaveBeenCalledWith('paperwork', { replace: undefined, ref: MANGO });
	});

	it("the chips' Execution has no settlement: every pack went to a channel", async () => {
		const s = source(fakeApi(moment('cleared'), 'priya'));
		const r = await draw(s, 'execution', CHIPS);
		await waitFor(() => expect(text(r)).toContain(`${CHIPS} · day 0 to`));
		expect(moment('cleared').members.priya.cases[CHIPS].expiry!.units).toBe(0);
		expect(text(r)).not.toContain('Expiry settlement');
	});

	it("Anita's Paperwork opens on the expiry credit note, with Munchly's own costs", async () => {
		vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1440); // a desktop: the paper open beside the pack
		const s = source(fakeApi(moment('cleared'), 'anita'));
		const r = await draw(s, 'paperwork', MANGO);
		await waitFor(() => expect(text(r)).toContain('Expiry credit note'));
		const d = moment('cleared').members.anita.cases[MANGO].docs.find((x) => x.id === 'expiry')!;
		const t = text(r);
		expect(t).toContain(`${d.no} · Munchly → Lakshmi Agencies`);
		expect(t).toContain(`${d.units!.toLocaleString('en-IN')} packs expired at the godown`);
		expect(t).toContain(`Credit to Lakshmi Agencies${inr2(d.amount!)}`);
		expect(t).toContain("Munchly's own costs, on destroying them");
		expect(t).toContain(`Disposal${inr2(d.disposal!)}`);
		expect(t).toContain(`Expiry, all in${inr2(d.amount! + d.disposal! + d.epr! + d.itc!)}`);
		expect(t).toContain(d.note);
	});

	it("Lakshmi Agencies' You end whole counts what each line took, and the expiry credit", async () => {
		const s = source(fakeApi(moment('cleared'), 'lakshmi-owner'));
		const r = await draw(s, 'home', MANGO);
		await waitFor(() => expect(text(r)).toContain('You end whole'));
		const c = moment('cleared').members['lakshmi-owner'].cases[MANGO];
		const x = c.expiry!;
		const t = text(r);
		expect(t).toContain('credit note issued');
		expect(t).toContain('(84 packets)₹1,008'); // what the kiranas ordered, at ₹12
		expect(t).toContain('From your staff sale (120 packets)₹960');
		expect(t).toContain(`Price-support credit note from Munchly${inr(c.support!.total)}`);
		expect(t).toContain(
			`Expiry credit note for ${x.units.toLocaleString('en-IN')} packs from Munchly${inr(x.credit!)}`
		);
		expect(t).toContain('Your gain or loss₹0');
	});

	it("Anita's Who keeps what counts what each line took, and the settlement on both sides", async () => {
		const s = source(fakeApi(moment('cleared'), 'anita'));
		const r = await draw(s, 'paperwork', MANGO);
		await waitFor(() => expect(text(r)).toContain('Who keeps what'));
		const c = moment('cleared').members.anita.cases[MANGO];
		const x = c.expiry!;
		const took = c.support!.rows.reduce((t, row) => t + row.units * row.price, 0); // 84 at ₹12, 120 at ₹8, 58 donated
		const t = text(r);
		expect(t).toContain(`Lakshmi Agencies receives${inr(took + c.support!.total)}`);
		expect(t).toContain(`and the expiry credit for ${x.units.toLocaleString('en-IN')} packs${inr(x.credit!)}`);
		expect(t).toContain('He ends whole₹0');
		expect(t).toContain(`and the expiry settlement for ${x.units.toLocaleString('en-IN')} packs−${inr(x.total)}`);
		expect(t).toContain(`Better for Munchly${inr(c.claim!.total - c.support!.total - x.total)}`);
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
		expect((box as HTMLInputElement).value).toBe('');
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
			const r = await draw(source(fakeApi(m, 'vikram')), 'report', ref);
			await fireEvent.click(await waitFor(() => r.getByRole('button', { name: 'This batch' })));
			// the batch asked for, once its case is read (until then the screen shows the first open batch)
			await waitFor(() => expect(text(r)).toContain(`${ref} · `));
			await waitFor(() => expect(text(r)).toContain('BRSR line'));
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
			const r = await draw(source(fakeApi(m, 'vikram')), 'report', ref);
			await fireEvent.click(await waitFor(() => r.getByRole('button', { name: 'This batch' })));
			await waitFor(() => expect(text(r)).toContain(`${ref} · `));
			const line = await waitFor(() => r.getByText(/^Evidence:/));
			const t = norm(line.textContent);
			r.unmount();
			return t;
		};
		// the Mango Drink: no ExpireSoon lot, so no invoice; its donation's FSSAI checklist
		const mango = await evidence(MANGO);
		expect(mango).not.toMatch(/· ·|Evidence: ·/);
		expect(mango).toMatch(/^Evidence: \d+ kirana order logs · CN\/0118 · FSSAI checklist · FI\/HYD\/26-27\/0417$/);
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
		const r = await draw(source(fakeApi(moment('cleared'), 'anita')), 'paperwork', MANGO);
		await waitFor(() => expect(text(r)).toContain(`${MANGO} · prepared by the Paperwork agent`));
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
		const cleared = moment('cleared');
		const chips = await subtitle(cleared, 'anita', CHIPS);
		expect(text(chips)).toContain(`${CHIPS} · prepared by the Paperwork agent at the award`);
		chips.unmount();
		const mango = await subtitle(cleared, 'anita', MANGO);
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
		const r = await draw(source(fakeApi(m, 'anita')), 'paperwork', MANGO);
		await fireEvent.click(await waitFor(() => r.getByRole('button', { name: /GST ITC memo/ })));
		// the Mango's SKU has no itcPerUnit of its own: ₹11 at cost × 5% GST, as money.js works it out
		expect(m.members.anita.cases[MANGO].sku.itcPerUnit ?? null).toBeNull();
		await waitFor(() => expect(text(r)).toContain('₹0.55 a pack, from the cost sheet'));
		expect(text(r)).not.toMatch(/NaN|undefined/);
		expect(r.getByRole('button', { name: /FSSAI surplus-food checklist/ })).toBeTruthy();
	});

	it("from Batches, a batch in a journey opens the person's own screen for it: Finance its processed papers (SC-103)", async () => {
		const m = moment('cleared');
		const open = async (who: string) => {
			const go = vi.fn();
			const s = source(fakeApi(m, who));
			const r = render(LiveHost, {
				props: { source: s, screen: 'batches', at: null, onnavigate: go }
			}) as unknown as RenderResult<never>;
			await waitFor(() => expect(s.status.phase).toBe('ready'));
			const row = (ref: string) =>
				[...r.container.querySelectorAll('tbody tr')].find((tr) => tr.textContent?.includes(ref))!;
			await waitFor(() => expect(row(CHIPS)).toBeTruthy());
			return { go, r, row };
		};
		// Anita: the cleared chips are not her batch in focus, and open their Paperwork
		const anita = await open('anita');
		await fireEvent.click(anita.row(CHIPS));
		expect(anita.go).toHaveBeenCalledWith('paperwork', { replace: undefined, ref: CHIPS });
		// a batch in no journey opens its sheet, and goes nowhere
		anita.go.mockClear();
		await fireEvent.click(anita.row('MF-2408-311'));
		expect(anita.go).not.toHaveBeenCalled();
		anita.r.unmount();
		// Vikram: the batch's report
		const vikram = await open('vikram');
		await fireEvent.click(vikram.row(CHIPS));
		expect(vikram.go).toHaveBeenCalledWith('report', { replace: undefined, ref: CHIPS });
		vikram.r.unmount();
		// and the chips' Paperwork, as Anita lands on it: the papers processed, the pack reviewed
		const r = await draw(source(fakeApi(m, 'anita')), 'paperwork', CHIPS);
		await waitFor(() => expect(text(r)).toContain('INV/26-27/0931'));
		expect(text(r)).toContain('CN/0117');
		expect(text(r)).toContain('GST ITC memo');
		expect(r.getByText('reviewed', { exact: true })).toBeTruthy();
		expect(r.queryByRole('button', { name: 'Mark reviewed' })).toBeNull();
	});

	it('Batches shows every batch at its own journey: a cleared batch reads Cleared, in focus or not (SC-102)', async () => {
		const m = moment('cleared');
		const s = source(fakeApi(m, 'anita'));
		const r = await draw(s, 'batches');
		const row = (ref: string) =>
			[...r.container.querySelectorAll('tr')].find((tr) => tr.textContent?.includes(ref))?.textContent ?? '';
		await waitFor(() => expect(row(CHIPS)).not.toBe(''));
		// Anita's batch in focus is not the chips: both batches' journeys cleared
		expect(m.members.anita.snapshot.batches.find((b) => b.id === CHIPS)?.phase).toBe('cleared');
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
		const s = source(fakeApi(moment('cleared'), 'anita'));
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
