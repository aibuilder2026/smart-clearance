// The agents at work, the sign-ins' stage (SC-195, round 2, option A, The agent mesh; design3's AgentStage in
// system/product.jsx): the walk of a batch through the nine stops, where the named nodes sit, and one frame of the field.
// ThreeUI's constellation field, adapted (MIT; THIRD_PARTY_NOTICES.md beside this file). No client's data, so a live
// workspace shows it before anyone signs in.

import type { IconName } from '../../icons/registry';

export type Stop = { id: string; t: string; human?: boolean };
export type Crew = {
	id: string;
	name: string;
	icon: IconName;
	stop: number;
	human?: boolean;
	did: string;
	call: string;
};
export type AgState = 'done' | 'now' | 'later';
/** a named node: an agent on its orbit, and the way out from the orbit's middle */
export type Star = { c: Crew; x: number; y: number; ox: number; oy: number };
type Dot = { x: number; y: number; vx: number; vy: number; bx: number; by: number; r: number };
export type Ripple = { x: number; y: number; born: number; t: number; r: number };
/** what the stage tells its field and its caption */
export type Walk = {
	readonly k: number;
	readonly reduce: boolean;
	readonly held: Crew | null;
	readonly moving: boolean;
	readonly playing: boolean;
	readonly done: boolean;
	state: (c: Crew) => AgState;
	pick: (c: Crew) => void;
	release: () => void;
	toggle: () => void;
};
/** one frame's picture of the field */
export type Field = {
	w: number;
	h: number;
	band: boolean;
	k: number;
	done: boolean;
	playing: boolean;
	held: Crew | null;
	moving: boolean;
	reduce: boolean;
	dark: boolean;
	state: (c: Crew) => AgState;
	stars: Star[];
	nodes: Dot[];
	ripples: Ripple[];
	pointer: { x: number; y: number } | null;
	stepAt: number;
	resetAt: number;
	/** where the stage's orbit sits in the canvas, so the ground keeps the stage's words clear (SC-198) */
	off?: { x: number; y: number };
	ground?: HTMLCanvasElement;
	groundKey?: string;
};

export const AG_STOPS: Stop[] = [
	{ id: 'connect', t: 'Connect' },
	{ id: 'detect', t: 'Detect' },
	{ id: 'verify', t: 'Verify' },
	{ id: 'value', t: 'Value' },
	{ id: 'decide', t: 'Decide' },
	{ id: 'approve', t: 'Approve', human: true },
	{ id: 'execute', t: 'Execute' },
	{ id: 'settle', t: 'Settle' },
	{ id: 'report', t: 'Report' }
];
export const AG_CREW: Crew[] = [
	{
		id: 'data',
		name: 'Data',
		icon: 'database',
		stop: 0,
		did: 'Loaded the stock export and mapped its columns',
		call: 'dms.map → 8 fields'
	},
	{
		id: 'watcher',
		name: 'Watcher',
		icon: 'eye',
		stop: 1,
		did: 'Flagged a batch the quick-commerce gates will refuse',
		call: 'gates.check → blinkit · zepto · instamart'
	},
	{
		id: 'vision',
		name: 'Vision',
		icon: 'scan-line',
		stop: 2,
		did: "Read the carton's label from one photo",
		call: 'gemini.vision.read_label → match'
	},
	{
		id: 'valuer',
		name: 'Valuer',
		icon: 'scale',
		stop: 3,
		did: 'Priced every exit, the bin included',
		call: 'price.exits → 5 priced'
	},
	{
		id: 'router',
		name: 'Router',
		icon: 'route',
		stop: 4,
		did: "Split the batch under each exit's caps",
		call: 'split.fill → under the caps'
	},
	{
		id: 'you',
		name: 'You',
		icon: 'hand',
		stop: 5,
		human: true,
		did: 'One yes, with the money on screen',
		call: 'plan.approve → one tap'
	},
	{
		id: 'outreach',
		name: 'Outreach',
		icon: 'send',
		stop: 6,
		did: 'Offered the kiranas a scheme in Hindi',
		call: 'fcm.send → kiranas · Hindi'
	},
	{
		id: 'lister',
		name: 'Lister',
		icon: 'store',
		stop: 6,
		did: "Listed the lot outside the client's territory",
		call: 'expiresoon.list → hidden in territory'
	},
	{
		id: 'negotiator',
		name: 'Negotiator',
		icon: 'gavel',
		stop: 6,
		did: 'Countered a bid, never below the reserve',
		call: 'bid.counter → above reserve'
	},
	{
		id: 'paperwork',
		name: 'Paperwork',
		icon: 'file-text',
		stop: 7,
		did: 'Drafted the invoice, credit note and GST memo',
		call: 'invoice.draft · credit_note.issue'
	},
	{
		id: 'impact',
		name: 'Impact',
		icon: 'leaf',
		stop: 8,
		did: 'Posted the ledger and the BRSR row',
		call: 'ledger.post · brsr.row'
	}
];
export const AG_N = AG_STOPS.length;
export const agAt = (k: number) => AG_CREW.filter((c) => c.stop === k);
export const agNames = (k: number) => {
	const c = agAt(k).map((x) => x.name);
	return c.length > 1 ? c.slice(0, -1).join(', ') + ' and ' + c[c.length - 1] : c[0];
};
// the walk: -1 before it sets off, 0 to 8 at a stop, 9 when it is done. 420 ms a stop, 800 on the yes and 900 while the
// exits work (4.64 s), 600 ms before it sets off, and 2.8 s on the result before it walks again; the handoffs drawn
// fade over 500 ms as it starts again
export const AG_T = { step: 420, yes: 800, exec: 900, start: 600, hold: 2800, fade: 500 };
const stays = (k: number) => (AG_STOPS[k].human ? AG_T.yes : AG_STOPS[k].id === 'execute' ? AG_T.exec : AG_T.step);
/** how long the walk stays where it is, and where it goes next: round again once it has held on the result */
export const agWait = (k: number) => (k < 0 ? AG_T.start : k >= AG_N ? AG_T.hold : stays(k));
export const agNext = (k: number) => (k >= AG_N ? -1 : k + 1);
/** an agent picked holds the walk at its stop: it is at work, those before it have worked, the rest wait */
export const agState = (c: Crew, k: number, held: Crew | null): AgState =>
	held
		? c.id === held.id
			? 'now'
			: c.stop < held.stop
				? 'done'
				: 'later'
		: c.stop < k || k >= AG_N
			? 'done'
			: c.stop === k
				? 'now'
				: 'later';
/** Pause and Play are remembered in the browser */
export const AG_KEY = 'sc3-agents';

// where the named nodes sit in a box: on an orbit round its middle, in the order they work, from the upper left
// clockwise, with a gap at the left between the last and the first
export function agOrbit(w: number, h: number, band: boolean): Star[] {
	const rx = band ? w * 0.38 : Math.min(w * 0.36, w / 2 - 124),
		ry = band ? h * 0.36 : Math.min(h * 0.36, h / 2 - 44);
	return AG_CREW.map((c, i) => {
		const a = (((band ? 196 : 200) + i * 29.5) * Math.PI) / 180,
			ox = Math.cos(a),
			oy = Math.sin(a);
		return { c, x: w / 2 + rx * ox, y: h / 2 + ry * oy, ox, oy };
	});
}
// below desktops (SC-196, Around the card): the eleven on a loop round the card's edges, from the top, clockwise, filling
// the sign-in's visible box below the pill (top: where the pill ends), clear of the edges
export function agAround(w: number, h: number, tab: boolean, top: number): Star[] {
	const t = top + (tab ? 30 : 26),
		b = h - (tab ? 34 : 28),
		rx = w / 2 - (tab ? 40 : 24),
		ry = (b - t) / 2,
		cxp = w / 2,
		cyp = (t + b) / 2;
	return AG_CREW.map((c, i) => {
		const a = ((-90 + (i * 360) / AG_CREW.length) * Math.PI) / 180,
			ox = Math.cos(a),
			oy = Math.sin(a);
		return { c, x: cxp + rx * ox, y: cyp + ry * oy, ox, oy };
	});
}
// the handoffs: each agent to the next, the yes to all three of the exits, and all three to Paperwork
type Thread = { a: Star; b: Star; stop: number; fan?: boolean };
export function agThreads(stars: Star[]): Thread[] {
	const at = (id: string) => stars.find((s) => s.c.id === id)!,
		out: Thread[] = [];
	const order = ['data', 'watcher', 'vision', 'valuer', 'router', 'you'];
	for (let i = 1; i < order.length; i++) out.push({ a: at(order[i - 1]), b: at(order[i]), stop: i });
	['outreach', 'lister', 'negotiator'].forEach((id) => {
		out.push({ a: at('you'), b: at(id), stop: 6, fan: true });
		out.push({ a: at(id), b: at('paperwork'), stop: 7 });
	});
	out.push({ a: at('paperwork'), b: at('impact'), stop: 8 });
	return out;
}
// the field's inks, as rgb, by day and by night (the agents' green and the yes's amber validated on the sign-in's ground)
const AG_INK = {
	light: {
		ink: '13, 28, 21',
		lit: '22, 122, 82',
		amber: '211, 154, 18',
		hole: '#f2f6f3',
		water: 'rgba(112, 166, 199, 0.3)',
		block: 0.06,
		post: 0.085,
		dot: 0.11,
		window: 0
	},
	dark: {
		ink: '214, 255, 232',
		lit: '60, 203, 138',
		amber: '247, 192, 74',
		hole: '#0b110e',
		water: 'rgba(64, 92, 196, 0.32)',
		block: 0.06,
		post: 0.09,
		dot: 0.09,
		window: 0.15
	}
};
type Ink = (typeof AG_INK)['light'];
const seeded = (seed: number) => () => {
	seed = (seed * 1664525 + 1013904223) % 4294967296;
	return seed / 4294967296;
};
// the ground under the field (SC-198, the map under the agents): the guided demo's plate, a dotted grid, the town's
// blocks in clusters, two roads and the river, seeded so every visit draws the same; drawn once a size and a theme
const AG_DOT = 18;
type Box = { x0: number; y0: number; x1: number; y1: number };
function agRiver(w: number, h: number, band: boolean) {
	const y = band ? h * 0.9 : h * 0.86,
		pts: { x: number; y: number }[] = [];
	for (let i = 0; i <= 48; i++) {
		const u = i / 48;
		pts.push({
			x: -40 + u * (w + 80),
			y: y + Math.sin(u * Math.PI * 2.2 + 0.6) * h * (band ? 0.03 : 0.05) - u * h * 0.04
		});
	}
	return pts;
}
export function agGround(w: number, h: number, band: boolean, dark: boolean, stars: Star[], clear: Box[]) {
	const I = AG_INK[dark ? 'dark' : 'light'],
		dpr = Math.min(window.devicePixelRatio || 1, 2),
		c = document.createElement('canvas');
	c.width = Math.round(w * dpr);
	c.height = Math.round(h * dpr);
	const g = c.getContext('2d');
	if (!g) return c;
	g.setTransform(dpr, 0, 0, dpr, 0, 0);
	g.fillStyle = `rgba(${I.ink}, ${I.dot})`;
	for (let x = AG_DOT / 2; x < w; x += AG_DOT)
		for (let y = AG_DOT / 2; y < h; y += AG_DOT) {
			g.beginPath();
			g.arc(x, y, 1, 0, Math.PI * 2);
			g.fill();
		}
	const river = agRiver(w, h, band),
		rw = band ? 22 : Math.max(26, Math.min(44, h * 0.045)),
		bw = AG_DOT * 2 - 4,
		bh = AG_DOT * 1.5;
	const nearRiver = (x: number, y: number, pad: number) =>
		river.some((p) => Math.hypot(p.x - x, p.y - y) < rw / 2 + pad);
	const nearPost = (x: number, y: number) => stars.some((s) => Math.abs(s.x - x) < 52 && Math.abs(s.y - y) < 44);
	// the stage's words keep a clear ground: no block under the head or the foot
	const underWords = (x: number, y: number) =>
		clear.some((r) => x + bw / 2 > r.x0 && x - bw / 2 < r.x1 && y + bh / 2 > r.y0 && y - bh / 2 < r.y1);
	// the roads, under everything else: one across the town, one down between the stage and the card
	g.lineCap = 'round';
	g.strokeStyle = `rgba(${I.ink}, ${I.block * 1.3})`;
	g.lineWidth = band ? 6 : 8;
	g.beginPath();
	g.moveTo(-10, h * 0.4);
	g.bezierCurveTo(w * 0.35, h * 0.37, w * 0.65, h * 0.44, w + 10, h * 0.39);
	g.moveTo(w * 0.6, -10);
	g.bezierCurveTo(w * 0.58, h * 0.3, w * 0.63, h * 0.6, w * 0.6, h + 10);
	g.stroke();
	// the blocks: clusters of two or three a row, on the grid, kept off the river and the agents' posts
	const rnd = seeded(198),
		n = Math.max(6, Math.round((w * h) / (band ? 20000 : 34000)));
	for (let i = 0; i < n; i++) {
		const cx0 = Math.floor((rnd() * w) / AG_DOT) * AG_DOT + 4,
			cy0 = Math.floor((rnd() * h) / AG_DOT) * AG_DOT + 4,
			cols = 2 + Math.floor(rnd() * 2),
			rows = 1 + Math.floor(rnd() * 2);
		for (let a = 0; a < cols; a++)
			for (let b = 0; b < rows; b++) {
				if (rnd() < 0.2) continue;
				const x = cx0 + a * (bw + 6),
					y = cy0 + b * (bh + 6);
				if (
					nearRiver(x + bw / 2, y + bh / 2, 14) ||
					nearPost(x + bw / 2, y + bh / 2) ||
					underWords(x + bw / 2, y + bh / 2)
				)
					continue;
				g.beginPath();
				g.roundRect(x, y, bw, bh, 6);
				// by night some blocks are lit windows
				g.fillStyle = I.window && rnd() < 0.3 ? `rgba(${I.amber}, ${I.window})` : `rgba(${I.ink}, ${I.block})`;
				g.fill();
			}
	}
	g.strokeStyle = I.water;
	g.lineWidth = rw;
	g.lineJoin = 'round';
	g.beginPath();
	river.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)));
	g.stroke();
	return c;
}
// each agent's post: a block under its node, lit while it works, tinted once it has
function agPosts(ctx: CanvasRenderingContext2D, f: Field, I: Ink) {
	const pw = f.band ? 34 : 46,
		ph = f.band ? 26 : 34;
	f.stars.forEach((n) => {
		const st = f.state(n.c),
			col = n.c.human ? I.amber : I.lit;
		ctx.beginPath();
		ctx.roundRect(n.x - pw / 2, n.y - ph / 2, pw, ph, 7);
		ctx.fillStyle =
			st === 'now'
				? `rgba(${col}, ${f.dark ? 0.3 : 0.24})`
				: st === 'done'
					? `rgba(${col}, ${f.dark ? 0.14 : 0.1})`
					: `rgba(${I.ink}, ${I.post})`;
		ctx.fill();
		if (st !== 'later') {
			ctx.lineWidth = 1;
			ctx.strokeStyle = `rgba(${col}, ${st === 'now' ? 0.6 : 0.3})`;
			ctx.stroke();
		}
	});
}
// the ambient field, seeded so every visit draws the same
export function agField(w: number, h: number, band: boolean): Dot[] {
	const rnd = seeded(195),
		n = band ? 26 : Math.min(110, Math.round((w * h) / 15000)),
		out: Dot[] = [];
	while (out.length < n) {
		const vx = (rnd() - 0.5) * 0.28,
			vy = (rnd() - 0.5) * 0.28;
		out.push({ x: rnd() * w, y: rnd() * h, vx, vy, bx: vx, by: vy, r: 1.1 + rnd() * 1.3 });
	}
	return out;
}
// one frame of the field: the drift (only while the walk moves), the pointer pushing nodes aside, a ripple's front
// pushing them out; nodes bounce off the edges. dt is in 60ths of a second
export function agStep(f: Field, dt: number) {
	const go = f.moving ? 1 : 0,
		P = f.band ? 60 : 100;
	f.nodes.forEach((n) => {
		if (f.pointer && !f.reduce) {
			const dx = n.x - f.pointer.x,
				dy = n.y - f.pointer.y,
				d = Math.hypot(dx, dy);
			if (d < P && d > 0.5) {
				const s = (1 - d / P) * 0.2 * dt;
				n.vx += (dx / d) * s;
				n.vy += (dy / d) * s;
			}
		}
		f.ripples.forEach((r) => {
			const dx = n.x - r.x,
				dy = n.y - r.y,
				d = Math.hypot(dx, dy),
				off = Math.abs(d - r.r);
			if (off < 26 && d > 0.5) {
				const s = (1 - off / 26) * 1.1 * (1 - r.t) * dt;
				n.vx += (dx / d) * s;
				n.vy += (dy / d) * s;
			}
		});
		n.vx += (n.bx * go - n.vx) * Math.min(1, 0.045 * dt);
		n.vy += (n.by * go - n.vy) * Math.min(1, 0.045 * dt);
		n.x += n.vx * dt;
		n.y += n.vy * dt;
		if (n.x < 0 || n.x > f.w) {
			n.x = Math.max(0, Math.min(f.w, n.x));
			n.vx *= -1;
			n.bx = Math.abs(n.bx) * (n.x <= 0 ? 1 : -1);
		}
		if (n.y < 0 || n.y > f.h) {
			n.y = Math.max(0, Math.min(f.h, n.y));
			n.vy *= -1;
			n.by = Math.abs(n.by) * (n.y <= 0 ? 1 : -1);
		}
	});
	// how much is still moving off its drift, so the frames can stop once it has settled
	return f.nodes.reduce((e, n) => e + Math.abs(n.vx - n.bx * go) + Math.abs(n.vy - n.by * go), 0);
}
// one frame drawn: the field and its links, the links to the pointer, the handoffs as far as the batch has walked (the
// one being made drawing along its length), the sparks, the ripples, and the named nodes
export function agDraw(ctx: CanvasRenderingContext2D, f: Field, now: number) {
	const I = AG_INK[f.dark ? 'dark' : 'light'],
		band = f.band,
		stars = f.stars,
		all: { x: number; y: number }[] = [...f.nodes, ...stars],
		link = band ? 70 : 120;
	ctx.clearRect(0, 0, f.w, f.h);
	if (f.w < 1 || f.h < 1) return;
	const off = f.off ?? { x: 0, y: 0 },
		clear: Box[] =
			band || !off.y
				? []
				: [
						{ x0: -1, y0: -1, x1: off.x + 620, y1: off.y - 6 },
						{ x0: -1, y0: f.h - 76, x1: off.x + 600, y1: f.h + 1 }
					];
	const gk = `${f.w}x${f.h}|${f.dark}|${band}|${Math.round(off.x)},${Math.round(off.y)}|${stars.map((s) => `${Math.round(s.x)},${Math.round(s.y)}`).join(';')}`;
	if (f.groundKey !== gk || !f.ground) {
		f.ground = agGround(f.w, f.h, band, f.dark, stars, clear);
		f.groundKey = gk;
	}
	ctx.drawImage(f.ground, 0, 0, f.w, f.h);
	if (stars.length) agPosts(ctx, f, I);
	ctx.lineWidth = 1;
	for (let a = 0; a < all.length; a++)
		for (let b = a + 1; b < all.length; b++) {
			const d = Math.hypot(all[a].x - all[b].x, all[a].y - all[b].y);
			if (d >= link) continue;
			ctx.strokeStyle = `rgba(${I.ink}, ${(0.05 + (1 - d / link) * (f.dark ? 0.16 : 0.14)).toFixed(3)})`;
			ctx.beginPath();
			ctx.moveTo(all[a].x, all[a].y);
			ctx.lineTo(all[b].x, all[b].y);
			ctx.stroke();
		}
	ctx.fillStyle = `rgba(${I.ink}, ${f.dark ? 0.34 : 0.26})`;
	f.nodes.forEach((n) => {
		ctx.beginPath();
		ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
		ctx.fill();
	});
	if (f.pointer) {
		const p = f.pointer,
			P = band ? 110 : 190;
		ctx.lineWidth = 1.2;
		all.forEach((n) => {
			const d = Math.hypot(n.x - p.x, n.y - p.y);
			if (d >= P) return;
			ctx.strokeStyle = `rgba(${I.lit}, ${((1 - d / P) * 0.75).toFixed(3)})`;
			ctx.beginPath();
			ctx.moveTo(p.x, p.y);
			ctx.lineTo(n.x, n.y);
			ctx.stroke();
		});
		// the pointer joins the field as a node of its own
		ctx.fillStyle = `rgba(${I.lit}, 0.14)`;
		ctx.beginPath();
		ctx.arc(p.x, p.y, band ? 9 : 12, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = `rgb(${I.lit})`;
		ctx.beginPath();
		ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
		ctx.fill();
	}
	if (!stars.length) return;
	const k = f.done ? AG_N : f.k,
		since = now - f.stepAt;
	const fading = k < 0 && now - f.resetAt < AG_T.fade ? 1 - (now - f.resetAt) / AG_T.fade : 0;
	const p = f.playing ? Math.min(1, since / (f.k === 6 ? 700 : 340)) : 1;
	ctx.lineCap = 'round';
	agThreads(stars).forEach((t) => {
		const held = f.held;
		const shown = fading
			? true
			: held
				? t.stop < held.stop || (t.stop === held.stop && t.b.c.id === held.id)
				: t.stop <= k;
		if (!shown) return;
		const along = !fading && t.stop === k && f.playing ? p : 1;
		ctx.globalAlpha = fading || 1;
		ctx.lineWidth = band ? 1.6 : 2.2;
		ctx.strokeStyle = `rgb(${t.a.c.human || t.b.c.human ? I.amber : I.lit})`;
		ctx.beginPath();
		ctx.moveTo(t.a.x, t.a.y);
		ctx.lineTo(t.a.x + (t.b.x - t.a.x) * along, t.a.y + (t.b.y - t.a.y) * along);
		ctx.stroke();
		if (t.fan && t.stop === k && f.playing && !fading)
			for (let j = 0; j < 3; j++) {
				const u = (since / 520 + j / 3) % 1;
				ctx.fillStyle = `rgb(${I.lit})`;
				ctx.beginPath();
				ctx.arc(t.a.x + (t.b.x - t.a.x) * u, t.a.y + (t.b.y - t.a.y) * u, band ? 2 : 2.8, 0, Math.PI * 2);
				ctx.fill();
			}
	});
	ctx.globalAlpha = 1;
	f.ripples.forEach((r) => {
		ctx.lineWidth = 2;
		ctx.strokeStyle = `rgba(${I.lit}, ${(0.55 * (1 - r.t)).toFixed(3)})`;
		ctx.beginPath();
		ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
		ctx.stroke();
	});
	stars.forEach((n) => {
		const st = f.state(n.c),
			col = n.c.human ? I.amber : I.lit,
			rad = (band ? 4 : 5.5) + (st === 'now' ? 1 : 0);
		if (st === 'now' && f.moving) {
			const u = (since % 1200) / 1200;
			ctx.lineWidth = 1.5;
			ctx.strokeStyle = `rgba(${col}, ${(0.6 * (1 - u)).toFixed(3)})`;
			ctx.beginPath();
			ctx.arc(n.x, n.y, rad + 2 + u * (band ? 10 : 14), 0, Math.PI * 2);
			ctx.stroke();
		}
		ctx.beginPath();
		ctx.arc(n.x, n.y, rad, 0, Math.PI * 2);
		if (st === 'later') {
			ctx.lineWidth = 1.5;
			ctx.strokeStyle = `rgba(${I.ink}, ${f.dark ? 0.45 : 0.35})`;
			ctx.fillStyle = I.hole;
			ctx.fill();
			ctx.stroke();
		} else {
			ctx.fillStyle = `rgb(${col})`;
			ctx.fill();
		}
	});
}
