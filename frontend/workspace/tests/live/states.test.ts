// @vitest-environment jsdom
import { dayLabel } from '../../src/lib/live/when';
import { fireEvent, render, waitFor, type RenderResult } from '@testing-library/svelte';
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
		const r = await draw(s, 'route');
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
		const m = moment('start');
		expect(m.members.priya.snapshot.setup.mapped).toBe(0);
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
		const r = await draw(s, 'route');
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
	// a second batch in a journey beside the chips: the Mango Drink batch, flagged and not going to a food bank
	function twoFlagged() {
		const m = moment('planned');
		const seen = m.members.priya;
		const mango = seen.snapshot.cases.find((c) => c.donation != null)!;
		mango.donation = null;
		mango.stage = 2;
		mango.phase = 'at-risk';
		seen.cases[mango.ref].donation = null;
		return { m, mango: mango.ref, chips: seen.snapshot.cases.find((c) => c.ref !== mango.ref)!.ref };
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

	it("are tabs under the Route Room's title, each its own Route Room", async () => {
		const { m, mango } = twoFlagged();
		const s = source(fakeApi(m, 'priya'));
		const r = await draw(s, 'route', mango);
		await waitFor(() => expect(s.case?.batch.id).toBe(mango));
		await waitFor(() =>
			expect(r.container.querySelector(`#lv-tab-${mango}`)?.getAttribute('aria-current')).toBe('page')
		);
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
