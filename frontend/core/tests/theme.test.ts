import { beforeEach, describe, expect, it } from 'vitest';
import { THEME_KEY, Theme } from '../src/lib/theme.svelte';

// the theme: the reader's choice, kept for every page; or a page's fixed theme (the landing page, always in day, SC-165)
describe('the theme', () => {
	beforeEach(() => localStorage.clear());

	it("follows the reader's saved choice", () => {
		localStorage.setItem(THEME_KEY, 'dark');
		const theme = new Theme();
		expect(theme.resolved).toBe('dark');
		theme.setMode('light');
		expect(theme.wanted).toBe('light');
		expect(localStorage.getItem(THEME_KEY)).toBe('light');
	});

	it('keeps a fixed page in its theme, and leaves the saved choice for the other pages', () => {
		localStorage.setItem(THEME_KEY, 'dark');
		const theme = new Theme('system', 'light');
		expect(theme.resolved).toBe('light');
		expect(theme.wanted).toBe('light');
		theme.setMode('dark');
		expect(theme.wanted, 'no choice turns a fixed page').toBe('light');
		expect(localStorage.getItem(THEME_KEY), 'and the saved choice is untouched').toBe('dark');
		theme.fixed = null;
		expect(theme.wanted, 'unfixed, the page follows the saved choice again').toBe('dark');
	});
});
