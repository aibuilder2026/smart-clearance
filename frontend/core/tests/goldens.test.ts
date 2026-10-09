import { fireEvent, render } from '@testing-library/svelte';
import { flushSync, type Component } from 'svelte';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import * as W from '../src/lib/workspace';
import GoldenHost from './fixtures/GoldenHost.svelte';

// The workspace app's golden texts (SC-67): every role's screens, rendered through RoleApp on the stub at stages 0, 5, 7
// and 9, on a desktop and a phone, with each screen's text read and compared with what it read before the screens were
// moved onto a data source. A refactor that moves data out of the screens must leave every one of them unchanged.
// Sheets that open on a tap, the sign-in, the lock screen and the documents of the pack are read the same way.
const { fastForward, store, RoleApp, routesFor, SignIn, LockScreen } = W;
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- a screen or part, rendered with the props it takes
type Part = Component<any>;

// the parts a role's screens open on a tap, read on their own (they are not exported by the package)
const parts = import.meta.glob<{ default: Part }>('../src/lib/workspace/screens/**/*.svelte', {
	eager: true
});
const part = (path: string) => {
	const m = parts[`../src/lib/workspace/screens/${path}.svelte`];
	if (!m) throw new Error('no part ' + path);
	return m.default;
};

// the stages the guided demo jumps to, and the moments between them a screen also shows: the photo asked for and being
// read, the donation booked, a bid placed
const STATES: [string, () => void][] = [
	...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n): [string, () => void] => [`stage ${n}`, () => fastForward(n)]),
	['photo asked', () => (fastForward(2), W.act('requestPhoto'))],
	['photo sent', () => (fastForward(2), W.act('requestPhoto'), W.act('sendPhoto'))],
	['donation booked', () => (fastForward(6), ['list', 'outreach', 'donate'].forEach((a) => W.act(a as W.ActionName)))],
	[
		'bid placed',
		() => (
			fastForward(6),
			['list', 'outreach', 'donate'].forEach((a) => W.act(a as W.ActionName)),
			W.act('order', 'k0'),
			W.act('bid', 13)
		)
	]
];
const DESKTOP = 1440;
// a phone draws other parts (the compact tracker, lists for tables): read at the stages the guided demo starts on
const PHONE: [string, number][] = [['phone', 390]];
const PHONE_STATES = ['stage 0', 'stage 5', 'stage 7', 'stage 9'];
// one person for each role, and two who see a screen's other branch (another distributor, another kirana)
const PEOPLE = ['priya', 'rakesh', 'ganesh', 'agrawal', 'anita', 'vikram', 'meera', 'arjun', 'patil-owner', 'jaidurga'];

// what a person reads: the text, then the words that are not text (placeholders, labels, titles, alternatives, values)
const ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
const norm = (t: string | null | undefined) => (t ?? '').replace(/\s+/g, ' ').trim();
const text = (el: Element) => {
	const extra = [...el.querySelectorAll('*')].flatMap((x) => [
		...ATTRS.map((k) => x.getAttribute(k)).filter((v): v is string => !!v),
		...(x instanceof HTMLInputElement && x.value ? [x.value] : [])
	]);
	return norm(el.textContent) + (extra.length ? ' ⟨' + extra.map(norm).join(' | ') + '⟩' : '');
};
const user = (id: string) => store.state.users.find((u) => u.id === id)!;

function show(component: Part, props: Record<string, unknown>, width = 1440, route?: string) {
	const r = render(GoldenHost, { props: { component, props, width, route } });
	flushSync();
	return r;
}

beforeAll(() => {
	// jsdom has no Web Animations; the screens' scan lines and ticks ask for it
	if (!Element.prototype.animate)
		Element.prototype.animate = function () {
			return {
				cancel() {},
				finish() {},
				play() {},
				pause() {},
				finished: Promise.resolve(),
				onfinish: null,
				addEventListener() {},
				removeEventListener() {}
			} as unknown as Animation;
		};
	if (!Element.prototype.scrollTo) Element.prototype.scrollTo = () => {};
	if (!('IntersectionObserver' in window))
		(window as unknown as { IntersectionObserver: unknown }).IntersectionObserver = class {
			observe() {}
			unobserve() {}
			disconnect() {}
			takeRecords() {
				return [];
			}
		};
});
afterEach(() => {
	try {
		localStorage.clear();
	} catch {
		/* none */
	}
});

function screensOf(id: string, width: number) {
	const me = user(id);
	const out: Record<string, string> = {};
	for (const name of routesFor(me.role)) {
		const r = show(RoleApp as Part, { me, route: { name }, ongo: () => {}, onback: () => {} }, width);
		out[name] = text(r.container);
		r.unmount();
	}
	return out;
}

describe('every screen of every role', () => {
	for (const [state, put] of STATES)
		describe(`${state} · desktop`, () => {
			for (const id of PEOPLE)
				it(id, () => {
					put();
					expect(screensOf(id, DESKTOP)).toMatchSnapshot();
				});
		});
	for (const [state, put] of STATES.filter(([n]) => PHONE_STATES.includes(n)))
		for (const [bp, width] of PHONE)
			describe(`${state} · ${bp}`, () => {
				for (const id of PEOPLE)
					it(id, () => {
						put();
						expect(screensOf(id, width)).toMatchSnapshot();
					});
			});
});

describe('the sign-in and the lock screen', () => {
	for (const [bp, width] of [['desktop', DESKTOP] as [string, number], ...PHONE]) {
		it(`sign-in · ${bp}`, () => {
			fastForward(0);
			const r = show(SignIn as Part, { onsignin: () => {} }, width);
			expect(text(r.container)).toMatchSnapshot();
		});
		it(`guided sign-in · ${bp}`, () => {
			fastForward(0);
			const r = show(SignIn as Part, { onsignin: () => {}, guided: true, prefill: '98230 44118' }, width);
			expect(text(r.container)).toMatchSnapshot();
		});
	}
	it('the explore sheet and the people in it', async () => {
		fastForward(0);
		const r = show(SignIn as Part, { onsignin: () => {} }, 1440);
		const b = [...r.container.querySelectorAll('button')].find((x) => text(x).startsWith('Explore as'))!;
		await fireEvent.click(b);
		flushSync();
		expect(text(r.container)).toMatchSnapshot();
	});
	it('a wrong email, a deactivated number and an outside buyer', async () => {
		fastForward(0);
		const r = show(SignIn as Part, { onsignin: () => {} }, 1440);
		const out: string[] = [];
		for (const v of [
			'someone@example.com',
			'new.person@munchly.in',
			'98230 60012',
			'orders@agrawalwholesale.example'
		]) {
			const input = r.container.querySelector('#si-id') as HTMLInputElement;
			await fireEvent.input(input, { target: { value: v } });
			await fireEvent.submit(r.container.querySelector('form')!);
			flushSync();
			out.push(text(r.container.querySelector('.si-form')!));
		}
		expect(out).toMatchSnapshot();
	});
	it('the lock screen', () => {
		fastForward(0);
		const r = show(LockScreen as Part, { who: 'rakesh', time: '09:05', date: 'Friday 2 October' }, 390);
		expect(text(r.container)).toMatchSnapshot();
	});
});

describe('the parts a tap opens', () => {
	it('the approval, before and after', () => {
		const out: string[] = [];
		for (const stage of [5, 7]) {
			fastForward(stage);
			const r = show(part('brand/ApproveSheet'), { open: true, me: user('priya') });
			out.push(text(r.container));
			r.unmount();
		}
		expect(out).toMatchSnapshot();
	});
	it('every document of the pack', () => {
		fastForward(9);
		const out: Record<string, string> = {};
		for (const d of W.D.docs) {
			const r = show(part('finance/Paper'), { id: d.id });
			out[d.id] = text(r.container);
			r.unmount();
		}
		expect(out).toMatchSnapshot();
	});
	it('the workspace sheet', () => {
		fastForward(0);
		const out: Record<string, string> = {};
		for (const id of ['priya', 'rakesh', 'meera', 'arjun']) {
			const r = show(part('auth/WorkspaceSheet'), { open: true, me: user(id), onsettings: () => {} });
			out[id] = text(r.container);
			r.unmount();
		}
		expect(out).toMatchSnapshot();
	});
	it('the lot as the operator sees it', () => {
		const out: string[] = [];
		for (const stage of [7, 9]) {
			fastForward(stage);
			const r = show(part('trade/ListingView'), { readOnly: true });
			out.push(text(r.container));
			r.unmount();
		}
		expect(out).toMatchSnapshot();
	});
	it("a batch's sheet", async () => {
		fastForward(7);
		// the sheet is Finance's and Sustainability's; the operator opens a batch's page (SC-112)
		const r = show(
			RoleApp as Part,
			{ me: user('anita'), route: { name: 'batches' }, ongo: () => {}, onback: () => {} },
			390
		);
		const out: string[] = [];
		const rows = [...r.container.querySelectorAll('.list > *')];
		for (const i of [1, 2, 6]) {
			await fireEvent.click(rows[i].querySelector('button') ?? rows[i]);
			flushSync();
			out.push(text(r.container.querySelector('[role="dialog"]') ?? r.container));
		}
		expect(out).toMatchSnapshot();
	});
	it('the invite sheet', async () => {
		fastForward(0);
		const r = show(RoleApp as Part, {
			me: user('arjun'),
			route: { name: 'users' },
			ongo: () => {},
			onback: () => {}
		});
		const b = [...r.container.querySelectorAll('button')].find((x) => text(x) === 'Invite')!;
		await fireEvent.click(b);
		flushSync();
		expect(text(r.container.querySelector('[role="dialog"]')!)).toMatchSnapshot();
	});
	it("the food bank's receipt, from the collected pickup (SC-110)", async () => {
		fastForward(9);
		W.act('collect');
		const r = show(RoleApp as Part, {
			me: user('meera'),
			route: { name: 'pickups' },
			ongo: () => {},
			onback: () => {}
		});
		const out = [text(r.container)];
		await fireEvent.click(r.container.querySelector('.receipt-row')!);
		flushSync();
		out.push(text(r.container.querySelector('[role="dialog"]')!));
		expect(out).toMatchSnapshot();
	});
	it('another pickup time', async () => {
		STATES.find(([n]) => n === 'donation booked')![1]();
		const r = show(RoleApp as Part, {
			me: user('meera'),
			route: { name: 'pickups' },
			ongo: () => {},
			onback: () => {}
		});
		const b = [...r.container.querySelectorAll('button')].find((x) => text(x) === 'Suggest another time');
		if (b) {
			await fireEvent.click(b);
			flushSync();
		}
		expect(text(r.container)).toMatchSnapshot();
	});
});
