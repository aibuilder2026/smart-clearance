// The route map's geometry (design3/demo/director.jsx): in a 1320 × 620 box (the SVG's viewBox is 40 36 1380 640), the
// platform's line runs into Munchly's workspace (the hub); from it the chips, the Mango Drink and the slow week, which
// leaves the chips' line after the yes. Each line's stations, the side its names sit on, where it ends and where its
// outcome is written.
import type { Line, Station, StoryAct } from './types.ts';

type Geo = {
	d: string;
	st: [number, number][];
	side: 'up' | 'down' | ('up' | 'down' | 'left')[];
	end?: [number, number];
	out?: [number, number, 'start' | 'end'];
};
export const HUB: [number, number] = [450, 380];
export const GEO: Record<Line, Geo> = {
	console: {
		d: 'M70 150 H390 L450 210 V380',
		st: [
			[70, 150],
			[150, 150],
			[230, 150],
			[310, 150],
			[390, 150],
			[450, 290]
		],
		side: ['up', 'up', 'up', 'up', 'up', 'left']
	},
	chips: {
		d: 'M450 380 L570 260 H1156',
		st: [
			[600, 260],
			[660, 260],
			[720, 260],
			[780, 260],
			[840, 260],
			[900, 260],
			[966, 260],
			[1032, 260],
			[1098, 260]
		],
		side: 'up',
		end: [1156, 260],
		out: [1174, 0, 'start']
	},
	slow: {
		d: 'M900 260 L988 348 H1316',
		st: [
			[1020, 348],
			[1080, 348],
			[1140, 348],
			[1200, 348],
			[1260, 348]
		],
		side: 'down',
		end: [1316, 348],
		out: [1330, 64, 'end']
	},
	mango: {
		d: 'M450 380 L570 500 H1070',
		st: [
			[600, 500],
			[680, 500],
			[760, 500],
			[840, 500],
			[920, 500],
			[1000, 500]
		],
		side: 'down',
		end: [1070, 500],
		out: [1088, 0, 'start']
	}
};
/** the chips' track to the yes, lit under the slow week, which rides it */
export const SHARED = 'M450 380 L570 260 H900';
/** where each line's badge sits */
export const BADGE_AT: [Line, number, number][] = [
	['console', 56, 46],
	['chips', 588, 152],
	['slow', 790, 400],
	['mango', 588, 558]
];
/** what each line's badge says under its name */
export const BADGE: Record<Line, string> = {
	console: "Smart-Clearance's console",
	chips: 'every pack sold',
	slow: 'destroyed at the godown, on a second yes',
	mango: 'kiranas, a staff sale, a food bank'
};
/** the river under the lines, in light */
export const RIVER = 'M20 612 C 300 548, 520 694, 772 604 S 1180 492, 1440 528';
/** the plate's city blocks: small clusters in the map's gaps (light only) */
export const BLOCKS: [number, number][] = (
	[
		[752, 66, 3, 2],
		[1148, 64, 4, 2],
		[70, 446, 2, 2],
		[70, 570, 3, 1],
		[640, 300, 3, 2],
		[1206, 560, 3, 2]
	] as const
).flatMap(([x0, y0, c, r]) =>
	Array.from({ length: c * r }, (_, k): [number, number] => [x0 + (k % c) * 62, y0 + Math.floor(k / c) * 46])
);

/** the map's station names, short where the line is tight */
const SHORT: Record<string, string> = {
	"Munchly's setup": 'Setup',
	'Agent setup': 'Agents',
	'Existing clients': 'Clients',
	'A new client': 'New client',
	'Expiry day': 'Expiry',
	'The second yes': 'Yes'
};
export const short = (t: string) => SHORT[t] || t;
export const lineName = (a: StoryAct) => a.title + (a.id === 'slow' ? ' · a slow week' : '');
/** a station waits on a person (amber), or meets the bin (red) */
export const toneOf = (st: Station) => (st.id === 'expiry' ? 'red' : st.amber ? 'amber' : '');
/** the order the lines draw in, so the chips' line lies over the slow week's branch */
export const DRAW_ORDER: Line[] = ['console', 'mango', 'chips', 'slow'];
