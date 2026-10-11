import { fireEvent, render } from '@testing-library/svelte';
import { createRawSnippet, flushSync } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Button from '../src/lib/components/Button.svelte';
import Money from '../src/lib/components/Money.svelte';
import Icon from '../src/lib/icons/Icon.svelte';
import Photo from '../src/lib/workspace/screens/common/Photo.svelte';
import { Wait, WAIT } from '../src/lib/wait.svelte';
import FieldFixture from './fixtures/FieldFixture.svelte';

describe('Money', () => {
	it('says the figure in hidden text and draws it silently', () => {
		const { container } = render(Money, { value: -10290 });
		const money = container.querySelector('.num.money')!;
		expect(money.querySelector('.sr-only')!.textContent).toBe('minus ₹10,290');
		expect(money.querySelector('.sign')!.textContent).toBe('−');
		expect(money.querySelector('.cur')!.getAttribute('aria-hidden')).toBe('true');
		expect(money.textContent).toBe('minus ₹10,290−₹10,290');
	});
	it('sets paise small', () => {
		const { container } = render(Money, { value: 14.2, decimals: true });
		expect(container.querySelector('.sr-only')!.textContent).toBe('₹14.2');
		expect(container.querySelector('.dec')!.textContent).toBe('.20');
	});
	it('rolls its digits when asked, still saying the figure once', () => {
		const { container } = render(Money, { value: 21152, roll: true, from: 0 });
		expect(container.querySelectorAll('.sr-only')).toHaveLength(1);
		expect(container.querySelectorAll('.roll .rd')).toHaveLength(5);
	});
});

describe('Field', () => {
	it('ties its error to the control and marks it invalid', () => {
		const { container } = render(FieldFixture, { error: 'Enter a work email address.' });
		const input = container.querySelector('input')!;
		const error = container.querySelector('.error')!;
		expect(container.querySelector('label')!.getAttribute('for')).toBe('bd-email');
		expect(error.getAttribute('role')).toBe('alert');
		expect(input.getAttribute('aria-describedby')).toBe(error.id);
		expect(input.getAttribute('aria-invalid')).toBe('true');
	});
	it('ties its help when there is no error', () => {
		const { container } = render(FieldFixture, { help: 'We reply within a day.' });
		const input = container.querySelector('input')!;
		expect(input.getAttribute('aria-describedby')).toBe(container.querySelector('.help')!.id);
		expect(input.hasAttribute('aria-invalid')).toBe(false);
	});
});

describe('Button', () => {
	it('is a button by default', () => {
		const { container } = render(Button, { variant: 'primary', size: 'lg', block: true });
		const b = container.querySelector('button')!;
		expect(b.className).toBe('btn btn-primary btn-lg btn-block btn-icon');
		expect(b.getAttribute('type')).toBe('button');
	});
	it('is a link that looks like a button when given an href', () => {
		const { container } = render(Button, {
			props: { variant: 'secondary', href: 'https://example.com/demo', target: '_blank', rel: 'noopener' }
		});
		const a = container.querySelector('a')!;
		expect(a.className).toBe('btn btn-secondary btn-icon');
		expect(a.getAttribute('rel')).toBe('noopener');
	});
});

describe('Icon', () => {
	it('draws a Lucide icon, hidden from assistive tech', () => {
		const { container } = render(Icon, { name: 'check' });
		const svg = container.querySelector('svg.ic')!;
		expect(svg.getAttribute('aria-hidden')).toBe('true');
		expect(svg.getAttribute('stroke-width')).toBe('1.75');
		expect(svg.querySelector('path')).not.toBeNull();
	});
	it('is an image with a name when titled', () => {
		const { container } = render(Icon, { name: 'shield', title: 'Staff' });
		const svg = container.querySelector('svg')!;
		expect(svg.getAttribute('role')).toBe('img');
		expect(svg.querySelector('title')!.textContent).toBe('Staff');
	});
});

// SC-152: a button that waits on the network keeps its words visible, says what it is doing, and lands on the answer
describe('a button that waits', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		// jsdom has no Web Animations; the faces' transitions ask for it
		if (!Element.prototype.animate)
			Element.prototype.animate = function () {
				return {
					cancel() {},
					finish() {},
					play() {},
					pause() {},
					finished: Promise.resolve(),
					onfinish: null
				} as unknown as Animation;
			};
	});
	afterEach(() => vi.useRealTimers());
	const later = async (ms: number) => {
		await vi.advanceTimersByTimeAsync(ms);
		flushSync();
	};

	it('shows nothing for a fast answer, and locks while it waits', async () => {
		let n = 0;
		const action = () => (n++, new Promise((r) => setTimeout(r, 50)));
		const { container } = render(Button, { props: { action, busy: 'Saving…', children: undefined } });
		const b = container.querySelector('button')!;
		await fireEvent.click(b);
		expect(b.getAttribute('aria-busy')).toBe('true');
		await fireEvent.click(b);
		expect(n).toBe(1);
		await later(60);
		expect(b.dataset.phase).toBe('idle');
		expect(container.querySelector('.btn-arc')).toBeNull();
	});
	it('says what it is doing, then the done word, then rests', async () => {
		const action = () => new Promise((r) => setTimeout(r, 900));
		const { container } = render(Button, { props: { action, busy: 'Approving the plan…', done: 'Plan approved' } });
		const b = container.querySelector('button')!;
		await fireEvent.click(b);
		await later(WAIT.show + 10);
		expect(b.dataset.phase).toBe('busy');
		expect(container.querySelector('.btn-arc')).not.toBeNull();
		expect(container.querySelector('[role=status]')!.textContent).toBe('Approving the plan…');
		await later(900);
		expect(b.dataset.phase).toBe('done');
		expect(container.querySelector('[role=status]')!.textContent).toBe('Plan approved');
		await later(WAIT.hold + 10);
		expect(b.dataset.phase).toBe('idle');
	});
	it('its status line says its own words when they are markup, in their language (SC-163)', async () => {
		// the kirana's order button (OfferOrder.svelte): Hindi words, as snippets
		const hi = (t: string) => createRawSnippet(() => ({ render: () => `<span class="hi" lang="hi">${t}</span>` }));
		const action = () => new Promise((r) => setTimeout(r, 900));
		const { container } = render(Button, {
			props: { action, busy: hi('ऑर्डर हो रहा है…'), done: hi('ऑर्डर हो गया') }
		});
		const b = container.querySelector('button')!;
		const status = () => container.querySelector('[role=status]')!;
		await fireEvent.click(b);
		await later(WAIT.show + 10);
		expect(status().textContent).toBe('ऑर्डर हो रहा है…');
		expect(status().querySelector('[lang=hi]')).not.toBeNull();
		await later(900);
		expect(status().textContent).toBe('ऑर्डर हो गया');
	});
	it('says Working and Done for a button given no words', async () => {
		const action = () => new Promise((r) => setTimeout(r, 900));
		const { container } = render(Button, { props: { action, done: '' } });
		await fireEvent.click(container.querySelector('button')!);
		await later(WAIT.show + 10);
		expect(container.querySelector('[role=status]')!.textContent).toBe('Working');
	});
	it('says when it is slow, and puts a refusal under itself with Try again', async () => {
		let fail = true;
		const action = () =>
			new Promise((ok, no) => setTimeout(() => (fail ? no(new Error('Days left must be 7 or more.')) : ok(1)), 3500));
		const { container } = render(Button, { props: { action, busy: 'Saving…' } });
		const b = container.querySelector('button')!;
		await fireEvent.click(b);
		await later(WAIT.slow + 10);
		expect(container.querySelector('.btn-note')!.textContent).toContain('Still working');
		expect(b.getAttribute('aria-describedby')).toBe(container.querySelector('.btn-note')!.id);
		await later(600);
		const note = container.querySelector('.btn-note.err')!;
		expect(note.getAttribute('role')).toBe('alert');
		expect(note.textContent).toContain('Days left must be 7 or more.');
		fail = false;
		await fireEvent.click(note.querySelector('button')!);
		await later(WAIT.show + 10);
		expect(b.dataset.phase).toBe('busy');
	});
	it('follows a screen that drives it, with its refusal', async () => {
		const { container, rerender } = render(Button, { props: { loading: false, busy: 'Recording…' } });
		const b = container.querySelector('button')!;
		await rerender({ loading: true, busy: 'Recording…' });
		await later(WAIT.show + 10);
		expect(b.textContent).toContain('Recording…');
		await rerender({ loading: false, busy: 'Recording…', error: 'Already recorded on another phone.' });
		await later(WAIT.least);
		expect(container.querySelector('.btn-note.err')!.textContent).toContain('Already recorded on another phone.');
	});
	it('keeps a shown wait long enough to read', async () => {
		const w = new Wait();
		w.begin();
		await later(WAIT.show + 10);
		expect(w.phase).toBe('busy');
		w.end(null);
		await later(WAIT.least - 150);
		expect(w.phase).toBe('busy');
		await later(200);
		expect(w.phase).toBe('idle');
	});
});

describe('a photo whose link changes (SC-180)', () => {
	// a fresh signed link to the same photo comes with every read of the live workspace
	const made: { src: string; onload: (() => void) | null }[] = [];
	beforeEach(() => {
		made.length = 0;
		vi.stubGlobal(
			'Image',
			class {
				onload: (() => void) | null = null;
				onerror: (() => void) | null = null;
				set src(v: string) {
					made.push(this as unknown as { src: string; onload: (() => void) | null });
					(this as unknown as { _src: string })._src = v;
				}
			}
		);
	});
	afterEach(() => vi.unstubAllGlobals());

	it('keeps showing the photo it has while the new link loads, then takes the new one', async () => {
		const r = render(Photo, { src: 'https://x/a.webp?sig=1', alt: 'The label' });
		const img = r.container.querySelector('img')!;
		await fireEvent.load(img);
		expect(r.container.querySelector('.skeleton')).toBeNull();
		await r.rerender({ src: 'https://x/a.webp?sig=2', alt: 'The label' });
		flushSync();
		// still the first link, still drawn: no skeleton in its place
		expect(img.getAttribute('src')).toBe('https://x/a.webp?sig=1');
		expect(r.container.querySelector('.skeleton')).toBeNull();
		expect(img.style.opacity).toBe('1');
		made.at(-1)!.onload!();
		flushSync();
		expect(img.getAttribute('src')).toBe('https://x/a.webp?sig=2');
		expect(img.style.opacity).toBe('1');
	});

	it('loads its first link under its skeleton, as before', () => {
		const r = render(Photo, { src: 'https://x/b.webp?sig=1' });
		expect(r.container.querySelector('.skeleton')).not.toBeNull();
		expect(made).toHaveLength(0);
	});
});
