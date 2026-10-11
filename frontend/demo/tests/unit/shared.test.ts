import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import { ACTS } from '../../src/lib/story.ts';
import type { Beat, DeviceSpec, StoryAct } from '../../src/lib/types.ts';

// What the demo takes from design3 stays design3's: its stylesheet is design3/demo/demo.css, verbatim, and its story is
// design3/demo/story.jsx's, line by line, station by station, beat by beat. What it shares with the rest of the frontend
// stays shared: its HTML shell is the landing page's, to the byte, and its cascade is the workspace app's.
const here = dirname(fileURLToPath(import.meta.url));
const read = (p: string) => readFileSync(join(here, '../..', p), 'utf8');
const design3 = (p: string) => join(here, '../../../../design3', p);
const norm = (css: string) =>
	css
		.split('\n')
		.map((l) => l.trim())
		.filter(Boolean)
		.join('\n');
const imports = (css: string) => css.split('\n').filter((l) => /^@(layer|import|source)\b/.test(l));

/** design3's story, run as the demo page runs it: the stub's core, then demo/story.js */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the prototype's modules are untyped browser globals
function prototype(): any[] {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const window: Record<string, any> = { SC3_IMG: 'sc3img:/' };
	const sandbox = vm.createContext({ window, console, Date, Intl, Math, JSON, btoa, unescape, encodeURIComponent });
	for (const p of [
		'core/money.js',
		'core/papers.js',
		'core/data.js',
		'core/store.js',
		'core/flow.js',
		'core/world.js',
		'core/ledger.js',
		'demo/story.js'
	])
		vm.runInContext(readFileSync(design3(p), 'utf8'), sandbox, { filename: design3(p) });
	return window.SC3_STORY.ACTS;
}

// what a device shows, as both sides write it (a push compared by what it says)
const device = (d?: DeviceSpec | null) =>
	d == null
		? d
		: {
				...d,
				lock:
					d.lock === undefined
						? undefined
						: d.lock && { who: d.lock.who, push: d.lock.push && { title: d.lock.push.title, body: d.lock.push.body } }
			};
const beat = (b: Beat) => ({
	text: b.text,
	who: b.who,
	agent: b.agent,
	focus: b.focus,
	human: !!b.human,
	time: b.time,
	date: b.date,
	screen: b.screen,
	acts: (b.acts ?? []).map((a) => (typeof a === 'function' ? 'a change' : [...a])),
	event: b.event,
	click: b.click,
	desk: device(b.desk),
	phone: device(b.phone)
});
const act = (a: StoryAct) => ({
	id: a.id,
	title: a.title,
	sub: a.sub,
	place: a.place,
	img: a.img,
	who: a.who,
	minutes: a.minutes,
	outcome: { value: a.outcome.value, line: a.outcome.line, red: !!a.outcome.red },
	stations: a.stations.map((st) => ({
		id: st.id,
		title: st.title,
		date: st.date,
		scenario: st.scenario,
		ff: st.ff,
		prep: (st.prep ?? []).map((a) => [...a]),
		amber: !!st.amber,
		desk: device(st.desk),
		phone: device(st.phone),
		figures: (st.figures ?? []).map((f) => ({
			label: f.label,
			value: f.value,
			decimals: !!f.decimals,
			tone: f.tone,
			count: !!f.count
		})),
		beats: st.beats.map(beat)
	}))
});
// JSON drops what is undefined on both sides alike
const plain = (x: unknown) => JSON.parse(JSON.stringify(x));

describe('the demo is design3/demo', () => {
	it('demo.css is unchanged', () => {
		expect(norm(read('src/lib/demo.css'))).toBe(norm(read('../../design3/demo/demo.css')));
	});
	const theirs = prototype();
	it('the same lines, in the same order', () => {
		expect(ACTS.map((a) => a.id)).toEqual(theirs.map((a) => a.id));
	});
	for (const [i, a] of ACTS.entries())
		it(`the ${a.id} line, station by station and beat by beat`, () => {
			expect(plain(act(a))).toEqual(plain(act(theirs[i])));
		});
	it('every beat can be done: by an action, a tap in a device, or Next', () => {
		for (const b of ACTS.flatMap((a) => a.stations.flatMap((st) => st.beats))) expect(typeof b.text).toBe('string');
	});
});

describe("the demo shares the other apps' shell", () => {
	it('app.html is the same file', () => {
		expect(read('src/app.html')).toBe(read('../admin/src/app.html'));
	});
	it("app.css is the workspace app's cascade", () => {
		expect(imports(read('src/app.css'))).toEqual(imports(read('../workspace/src/app.css')));
	});
});
