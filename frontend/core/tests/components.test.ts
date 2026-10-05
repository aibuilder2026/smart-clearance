import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Button from '../src/lib/components/Button.svelte';
import Money from '../src/lib/components/Money.svelte';
import Icon from '../src/lib/icons/Icon.svelte';
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
