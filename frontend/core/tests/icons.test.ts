import { describe, expect, it } from 'vitest';
import { ICONS } from '../src/lib/icons/registry';
import { run } from './design3';

describe('the icon registry', () => {
	const names = Object.keys(run('system/icons.js').SC3_ICONS);
	it('has every icon design3 names, and no others', () => expect(Object.keys(ICONS).sort()).toEqual(names.sort()));
	it('draws each one', () => {
		for (const [name, nodes] of Object.entries(ICONS)) expect(nodes.length, name).toBeGreaterThan(0);
	});
});
