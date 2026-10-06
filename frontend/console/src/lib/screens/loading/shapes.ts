import type { ClientTab } from '@smart-clearance/api/console';
import type { RouteName } from '#lib/links.ts';

// The placeholders a screen or tab shows while it is read (SC-49), as design3's console draws them: each row is
// [kind, height, columns, width or column weights]
export type Kind = 'bar' | 'tile' | 'card' | 'row' | 'head' | 'field';
type Row = [Kind, number, number, (number | number[])?];
export type Shape = 'dashboard' | 'table' | 'list' | 'cards' | 'pipeline' | 'form' | 'client';

export const SHAPES: Record<Shape, Row[]> = {
	dashboard: [
		['bar', 28, 1, 0.38],
		['tile', 132, 4],
		['card', 300, 1],
		['card', 300, 1],
		['bar', 40, 1, 0.3],
		['row', 58, 1],
		['row', 58, 1],
		['row', 58, 1]
	],
	table: [['bar', 40, 1, 0.4], ...Array.from({ length: 6 }, (): Row => ['row', 56, 1])],
	list: [['bar', 32, 1, 0.3], ...Array.from({ length: 5 }, (): Row => ['row', 60, 1])],
	cards: [
		['bar', 32, 1, 0.3],
		['card', 170, 3],
		['card', 170, 3]
	],
	pipeline: [['card', 520, 2, [1.6, 1]]],
	form: [
		['bar', 32, 1, 0.3],
		['field', 64, 2],
		['field', 64, 2],
		['field', 64, 1],
		['card', 140, 1]
	],
	client: [
		['head', 92, 1],
		['bar', 44, 1, 0.62],
		['card', 460, 2, [1.6, 1]]
	]
};

export const SCREEN_SHAPE: Partial<Record<RouteName, Shape>> = {
	overview: 'dashboard',
	clients: 'table',
	'new-client': 'form',
	agents: 'cards',
	connectors: 'cards',
	plans: 'cards',
	staff: 'table',
	audit: 'list'
};

export const TAB_SHAPE: Record<ClientTab, Shape> = {
	agents: 'pipeline',
	supply: 'table',
	rules: 'form',
	people: 'list',
	integrations: 'list',
	plan: 'cards',
	audit: 'list'
};

/** how long a read may take before its placeholders show: a quicker one only draws the route, so nothing flickers */
export const SLOW_MS = 120;

/** the rows of a shape as blocks, numbered in order for the wash's stagger; phones take one column (tiles two) */
export function rows(shape: Shape, phone: boolean) {
	let n = 0;
	return SHAPES[shape].map(([kind, h, cols, w]) => {
		const many = phone ? Math.min(cols, kind === 'tile' ? 2 : 1) : cols;
		const weights = Array.isArray(w) && !phone ? w : null;
		return {
			kind,
			columns: weights ? weights.map((x) => x + 'fr').join(' ') : `repeat(${many}, minmax(0, 1fr))`,
			width: typeof w === 'number' ? w * 100 + '%' : undefined,
			height: phone && kind === 'card' ? Math.min(h, 220) : h,
			blocks: Array.from({ length: many }, () => n++)
		};
	});
}
