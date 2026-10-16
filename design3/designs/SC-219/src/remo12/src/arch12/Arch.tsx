// SC-219 cut 12 · under the hood, as concept B made whole: the data centre as one isometric hall floating in a dark green
// void, built and lit in motion on the narration's words, sharp, with the flow between its parts drawn as it happens.
//   0.9  under the hood: the camera leaves one agent's light and pulls back, turning, as the hall rises row by row
//   3.7  four apps rise at the edge (Firebase); a call runs along the floor to the core, where Cloud Run's containers
//        stack; Cloud SQL's disks stack and the records fly in
//   9.3  Pub/Sub: events leave the core and run the spine, the camera travelling with them; the Scheduler's clock ticks
//  13.8  nine AI agents light one by one, each named with its model once Gemini answers, the Watcher in plain code;
//        BigQuery's sales rise as bars and reach the Watcher and the Valuer; a label photo leaves Cloud Storage for Vision
//  20.9  Gemini's accelerators wake behind the agents; Pro's beams reach the Valuer, the Router and the Negotiator, Flash's
//        the six that read and write
//  26.2  the money: a glass wall rises round the API, and Gemini's beam stops at it; the API works out the figure; a
//        person says yes at the desk, and the yes runs across the hall, every rack turning green
import React from 'react';
import { AbsoluteFill, Img, staticFile, useVideoConfig } from 'remotion';
import { Audio } from '@remotion/media';
import { CameraMotionBlur } from '@remotion/motion-blur';
import { ActTitle, CUE as T, EASE, EASE_IO, Finish, INK, IndexBar, Note, clamp, fade, lerp, ramp, rng, springAt, useT } from '../lib/base';
import {
	AGENTS, Cam, DESK, EDGE, GCS, P3, PLATFORM, SCHED, SCREENS, SPINE, SQL, VAULT, agentRack, bqRack, camAt, depth, geminiRack, proj, racks, Rack, Zone, CORE_FRONT,
} from './world';

export const ARCH_END = T.end;
const MINT = '#5fe3a1', MINT2 = '#9ff0c4', BLUE = '#8ab4f8', BLUE2 = '#c9dcff', VIOLET = '#c58af9', AMBER = '#f7c04a', FIRE = '#ffa45c', GREEN = '#34d380', CODE = '#a9b6af';
const ZINK: Record<Zone, string> = { hall: '#9cc7b3', firebase: FIRE, run: BLUE, sql: BLUE, pubsub: MINT, sched: BLUE, agents: MINT, bq: BLUE, gcs: BLUE, gemini: VIOLET };
const TIER = { pro: VIOLET, flash: BLUE, code: CODE };

// ------------------------------------------------------------------ what is lit when (0 dark, 1 lit), on the words
const on = (t: number, a: number, d = 0.45) => ramp(t, a, a + d);
const agentOn = (t: number, i: number) => on(t, T.nine + 0.1 + i * 0.165, 0.3);
const yesWave = (t: number, x: number, y: number) => on(t, T.yes + 0.12 + Math.hypot(x - 14.8, y - 14.6) * 0.03, 0.35);
function zoneLit(t: number, z: Zone): number {
	switch (z) {
		case 'firebase': return on(t, T.firebase);
		case 'run': return on(t, T.run - 0.05);
		case 'sql': return on(t, T.sql);
		case 'pubsub': return on(t, T.pubsub);
		case 'sched': return on(t, T.scheduler);
		case 'bq': return on(t, T.bigquery);
		case 'gcs': return on(t, T.storage);
		case 'gemini': return on(t, T.gemini - 0.1, 0.6);
		default: return 0;
	}
}
const R = rng(2192);
const TW = Array.from({ length: 4000 }, () => [R(), R() * 6.28, 0.6 + R() * 2.2]);

// ------------------------------------------------------------------ drawing in the world
type Ctx = { c: Cam; t: number };
const pts = (ctx: Ctx, ps: P3[]) => ps.map((p) => proj(ctx.c, p[0], p[1], p[2]).map((v) => v.toFixed(1)).join(',')).join(' ');
const mix = (a: string, b: string, k: number) => {
	const h = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16)); const A = h(a), B = h(b);
	return '#' + A.map((v, i) => Math.round(lerp(v, B[i], clamp(k))).toString(16).padStart(2, '0')).join('');
};

/** a rack: its top and two faces lit from the upper left, its front's server slots and lights, and its glow when lit */
function Box({ ctx, x, y, z0 = 0, w, d, h, ink, lit, leds, seed = 0, glass = 0 }: { ctx: Ctx; x: number; y: number; z0?: number; w: number; d: number; h: number; ink: string; lit: number; leds?: boolean; seed?: number; glass?: number }) {
	if (h <= 0.002) return null;
	const { t } = ctx; const x1 = x + w, y1 = y + d, zt = z0 + h;
	const top = pts(ctx, [[x, y, zt], [x1, y, zt], [x1, y1, zt], [x, y1, zt]]);
	const front = pts(ctx, [[x, y1, z0], [x1, y1, z0], [x1, y1, zt], [x, y1, zt]]);
	const side = pts(ctx, [[x1, y, z0], [x1, y1, z0], [x1, y1, zt], [x1, y, zt]]);
	const L = 0.35 + 0.65 * lit;
	const els: React.ReactNode[] = [];
	if (leds) {
		const slots = Math.max(3, Math.round(h * 4.2));
		for (let s = 0; s < slots; s++) {
			const z = z0 + h * (s + 0.55) / slots;
			const [ax, ay] = proj(ctx.c, x + w * 0.07, y1, z), [bx, by] = proj(ctx.c, x1 - w * 0.07, y1, z);
			els.push(<line key={`s${s}`} x1={ax} y1={ay} x2={bx} y2={by} stroke="rgba(220,255,236,0.07)" strokeWidth={0.9} />);
			for (let j = 0; j < 3; j++) {
				const tw = TW[(seed * 37 + s * 7 + j) % TW.length];
				const blink = 0.5 + 0.5 * Math.sin(t * tw[2] * 3.2 + tw[1]);
				const [lx, ly] = proj(ctx.c, x + w * (0.15 + j * 0.11), y1, z);
				const a = (0.35 + 0.65 * blink) * (tw[0] < 0.2 ? 0.25 : 1) * (0.5 + 0.5 * L);
				els.push(<circle key={`l${s}${j}`} cx={lx} cy={ly} r={1.9 * Math.min(1.6, Math.max(0.7, ctx.c.zoom))} fill={lit > 0.05 ? mix('#d8ffe9', ink, 0.6) : tw[0] > 0.78 ? BLUE : MINT} opacity={a} />);
			}
		}
	}
	return (
		<g opacity={glass > 0 ? undefined : 1}>
			<polygon points={side} fill={mix('#081a12', mix('#0f2a1f', ink, 0.2), lit)} stroke={ink} strokeOpacity={0.25 * L} strokeWidth={1} />
			<polygon points={front} fill={mix('#10291f', mix('#163a2e', ink, 0.24), lit)} stroke={ink} strokeOpacity={0.32 * L} strokeWidth={1} />
			<polygon points={top} fill={mix('#24543f', mix('#2a5c47', ink, 0.5), lit)} stroke={mix('#a6f0c8', ink, lit)} strokeOpacity={0.55 + 0.4 * lit} strokeWidth={1.3} />
			{els}
		</g>
	);
}

/** a disk, a bucket or the clock tower: an upright cylinder, lit from the upper left */
function Cyl({ ctx, x, y, r, z0, h, ink, lit, open }: { ctx: Ctx; x: number; y: number; r: number; z0: number; h: number; ink: string; lit: number; open?: boolean }) {
	if (h <= 0.002) return null;
	const c = ctx.c; const n = 40;
	const ring = (z: number) => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; return proj(c, x + Math.cos(a) * r, y + Math.sin(a) * r, z); });
	const lo = ring(z0), hi = ring(z0 + h);
	// the silhouette: the two outermost points of the ring on the screen
	let li = 0, ri = 0; lo.forEach((p, i) => { if (p[0] < lo[li][0]) li = i; if (p[0] > lo[ri][0]) ri = i; });
	const near: [number, number][] = []; for (let k = 0; k <= n; k++) { const i = (ri + k) % n; near.push(lo[i]); if (i === li) break; }
	const body = `M ${hi[ri][0]} ${hi[ri][1]} L ${near.map((p) => `${p[0]} ${p[1]}`).join(' L ')} L ${hi[li][0]} ${hi[li][1]}`;
	const topD = 'M ' + hi.map((p) => `${p[0]} ${p[1]}`).join(' L ') + ' Z';
	return (
		<g>
			<path d={body + ' Z'} fill={mix('#0b2018', mix('#13342a', ink, 0.22), lit)} stroke={ink} strokeOpacity={0.3 + 0.3 * lit} />
			<path d={topD} fill={open ? '#020a06' : mix('#173a2b', mix('#21483a', ink, 0.45), lit)} stroke={mix('#7fdcab', ink, lit)} strokeOpacity={0.45 + 0.5 * lit} strokeWidth={1.3} />
		</g>
	);
}

/** a soft pool of light on the floor, where a lit part spills onto it */
function Pool({ ctx, x, y, rx, ry, ink, a }: { ctx: Ctx; x: number; y: number; rx: number; ry: number; ink: string; a: number }) {
	if (a <= 0.01) return null;
	const c = ctx.c; const [cx, cy] = proj(c, x, y, 0.01), [ax, ay] = proj(c, x + rx, y, 0.01), [bx, by] = proj(c, x, y + ry, 0.01);
	const id = `pool${Math.round(x * 10)}_${Math.round(y * 10)}`;
	return (
		<g>
			<defs><radialGradient id={id}><stop offset="0" stopColor={ink} stopOpacity={0.55 * a} /><stop offset="1" stopColor={ink} stopOpacity={0} /></radialGradient></defs>
			<circle r={1} fill={`url(#${id})`} transform={`matrix(${ax - cx} ${ay - cy} ${bx - cx} ${by - cy} ${cx} ${cy})`} style={{ mixBlendMode: 'screen' }} />
		</g>
	);
}

/** a path in the world as screen points, its length, and the point at a fraction of it */
function polyline(ctx: Ctx, ps: P3[]) {
	const s = ps.map((p) => proj(ctx.c, p[0], p[1], p[2]));
	const seg = s.slice(1).map((p, i) => Math.hypot(p[0] - s[i][0], p[1] - s[i][1]));
	const len = seg.reduce((a, b) => a + b, 0);
	const at = (u: number): [number, number] => { let d = clamp(u) * len; for (let i = 0; i < seg.length; i++) { if (d <= seg[i] || i === seg.length - 1) { const k = seg[i] ? d / seg[i] : 0; return [lerp(s[i][0], s[i + 1][0], k), lerp(s[i][1], s[i + 1][1], k)]; } d -= seg[i]; } return s[s.length - 1]; };
	return { d: 'M ' + s.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L '), len, at };
}

/** a cable on the floor: it draws on, then packets of light run along it */
function Cable({ ctx, path, t0, color, packets = 3, speed = 1.0, width = 3.2, until = 99 }: { ctx: Ctx; path: P3[]; t0: number; color: string; packets?: number; speed?: number; width?: number; until?: number }) {
	const { t } = ctx; const vis = fade(t, t0, until, 0.05, 0.4); if (vis <= 0) return null;
	const pl = polyline(ctx, path); const draw = ramp(t, t0, t0 + 0.55, EASE); const L = pl.len;
	const runs = Array.from({ length: packets }, (_, i) => {
		const p = (t - t0 - 0.3 - i * (0.9 / speed) / packets) * speed / 0.9; if (p <= 0) return null; const q = p % 1;
		const head = pl.at(q);
		return (
			<g key={i}>
				<path d={pl.d} fill="none" stroke={mix('#ffffff', color, 0.25)} strokeWidth={width + 1.4} strokeLinecap="round" strokeDasharray={`${Math.min(70, L * 0.12)} ${L * 3}`} strokeDashoffset={-(q * L - Math.min(70, L * 0.12))} />
				<circle cx={head[0]} cy={head[1]} r={width + 2.2} fill="#ffffff" />
			</g>
		);
	});
	return (
		<g opacity={vis}>
			<path d={pl.d} fill="none" stroke={color} strokeWidth={width + 7} strokeLinecap="round" strokeLinejoin="round" opacity={0.16} strokeDasharray={`${L * draw} ${L * 3}`} />
			<path d={pl.d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} strokeDasharray={`${L * draw} ${L * 3}`} />
			{draw >= 1 && runs}
		</g>
	);
}

/** a beam through the air between two points: it arcs over, then light runs along it */
function Beam({ ctx, a, b, t0, color, lift = 2.2, until = 99, width = 2.6, blocked = false }: { ctx: Ctx; a: P3; b: P3; t0: number; color: string; lift?: number; until?: number; width?: number; blocked?: boolean }) {
	const { t } = ctx; const vis = fade(t, t0, until, 0.05, 0.45); if (vis <= 0) return null;
	const n = 24; const path: P3[] = Array.from({ length: n + 1 }, (_, i) => { const u = i / n; return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u) + Math.sin(u * Math.PI) * lift]; });
	const pl = polyline(ctx, path); const draw = ramp(t, t0, t0 + 0.5, EASE_IO); const L = pl.len;
	const head = pl.at(draw);
	const runs = draw >= 1 && !blocked ? [0, 1].map((i) => {
		const q = ((t - t0 - 0.5 - i * 0.45) / 0.9) % 1; if (t - t0 - 0.5 - i * 0.45 < 0) return null;
		return <path key={i} d={pl.d} fill="none" stroke="#ffffff" strokeWidth={width + 1} strokeLinecap="round" strokeDasharray={`${L * 0.07} ${L * 3}`} strokeDashoffset={-(q * L - L * 0.07)} opacity={0.95} />;
	}) : null;
	return (
		<g opacity={vis}>
			<path d={pl.d} fill="none" stroke={color} strokeWidth={width + 6} opacity={0.15} strokeDasharray={`${L * draw} ${L * 3}`} strokeLinecap="round" />
			<path d={pl.d} fill="none" stroke={color} strokeWidth={width} strokeDasharray={`${L * draw} ${L * 3}`} strokeLinecap="round" />
			{draw < 1 && <circle cx={head[0]} cy={head[1]} r={width + 2.5} fill="#fff" />}
			{runs}
		</g>
	);
}

// ------------------------------------------------------------------ the scene
export const ArchScene: React.FC<{ layer?: 'world' | 'ui' | 'all'; at?: number }> = ({ layer = 'all', at }) => {
	const tNow = useT(); const { fps } = useVideoConfig();
	const t = at ?? tNow;
	const c = camAt(t); const ctx: Ctx = { c, t };
	const P = (x: number, y: number, z = 0) => proj(c, x, y, z);
	const grow = (x: number, y: number) => springAt(t, -0.32 + Math.hypot(x - 14.1, y - 4.6) * 0.048, fps, 13, 105);
	const done = ramp(t, T.yes + 0.1, T.yes + 1.2);

	// ---- the racks, back to front
	const items: { k: number; el: React.ReactNode }[] = [];
	racks.forEach((r, n) => {
		const g = grow(r.x, r.y);
		let ink = ZINK[r.zone], lit = zoneLit(t, r.zone);
		if (r.zone === 'agents') {
			const [, tier] = AGENTS[r.i]; lit = agentOn(t, r.i);
			if (tier === 'code') { ink = CODE; lit = Math.min(lit, 0.55); }
			else if (t > T.pro - 0.1 && tier === 'pro') ink = mix(MINT, VIOLET, on(t, T.pro, 0.4));
			else if (t > T.flash - 0.1 && tier === 'flash') ink = mix(MINT, BLUE, on(t, T.flash, 0.4));
		}
		if (r.zone === 'gemini') lit = zoneLit(t, 'gemini') * (0.82 + 0.18 * Math.sin(t * 5 + r.i));
		const yw = yesWave(t, r.x + r.w / 2, r.y + r.d / 2);
		if (yw > 0) { ink = mix(ink, GREEN, yw); lit = Math.max(lit, yw); }
		items.push({ k: depth(c, r.x + r.w, r.y + r.d), el: <Box key={`r${n}`} ctx={ctx} x={r.x} y={r.y} w={r.w} d={r.d} h={r.h * g} ink={ink} lit={lit} leds seed={n} /> });
	});
	// Cloud Run's containers, scaling up on its word, standing on its racks
	racks.filter((r) => r.zone === 'run').forEach((r, i) => {
		for (let j = 0; j < 2; j++) {
			const s = springAt(t, T.run + 0.1 + (i * 2 + j) * 0.07, fps, 11, 170); if (s <= 0.01) continue;
			items.push({ k: depth(c, r.x + r.w, r.y + r.d) + 0.01 + j * 0.001, el: <Box key={`c${i}${j}`} ctx={ctx} x={r.x + 0.1 + j * 0.52} y={r.y + 0.28} z0={r.h} w={0.4 * s} d={0.44 * s} h={0.38 * s} ink={mix(BLUE2, GREEN, yesWave(t, r.x, r.y))} lit={1} /> });
		}
	});
	// Cloud SQL's three disks, stacking on their word
	for (let k = 0; k < 3; k++) {
		const s = springAt(t, T.sql + k * 0.12, fps, 14, 150); if (s <= 0.01) continue;
		items.push({ k: depth(c, SQL.x + SQL.r, SQL.y + SQL.r) + k * 0.001, el: <g key={`sql${k}`} opacity={clamp(s * 1.6)}><Cyl ctx={ctx} x={SQL.x} y={SQL.y} r={SQL.r} z0={k * 0.68 + (1 - s) * 0.7} h={0.6 * clamp(s)} ink={mix(BLUE, GREEN, yesWave(t, SQL.x, SQL.y))} lit={on(t, T.sql)} /></g> });
	}
	// the Scheduler's tower and Cloud Storage's bucket
	items.push({ k: depth(c, SCHED.x + SCHED.r, SCHED.y + SCHED.r), el: <Cyl key="sched" ctx={ctx} x={SCHED.x} y={SCHED.y} r={SCHED.r} z0={0} h={SCHED.h * grow(SCHED.x, SCHED.y)} ink={mix(BLUE, GREEN, yesWave(t, SCHED.x, SCHED.y))} lit={zoneLit(t, 'sched')} /> });
	items.push({ k: depth(c, GCS.x + GCS.r, GCS.y + GCS.r), el: <Cyl key="gcs" ctx={ctx} x={GCS.x} y={GCS.y} r={GCS.r} z0={0} h={GCS.h * grow(GCS.x, GCS.y)} ink={mix(BLUE, GREEN, yesWave(t, GCS.x, GCS.y))} lit={zoneLit(t, 'gcs')} open /> });
	// BigQuery's sales, as bars rising over its racks
	[0.9, 1.5, 1.15, 2.0].forEach((hh, i) => {
		const r = bqRack(i); const s = springAt(t, T.sales + 0.15 + i * 0.1, fps, 12, 120); if (s <= 0.01) return;
		items.push({ k: depth(c, r.x + r.w, r.y + r.d) + 0.02, el: <Box key={`bar${i}`} ctx={ctx} x={r.x + 0.3} y={r.y + 0.25} z0={r.h + 0.05} w={0.5} d={0.5} h={hh * s} ink={BLUE2} lit={0.8} /> });
	});
	// the desk where a person says yes
	const deskIn = springAt(t, T.person - 0.6, fps, 14, 140);
	if (deskIn > 0.01) items.push({ k: depth(c, DESK.x + DESK.w, DESK.y + DESK.d), el: <Box key="desk" ctx={ctx} x={DESK.x} y={DESK.y} w={DESK.w} d={DESK.d} h={DESK.h * deskIn} ink={AMBER} lit={on(t, T.person)} /> });
	items.sort((a, b) => a.k - b.k);

	// ---- the four apps' screens at the edge, rising on their word
	const screens = SCREENS.map((s, i) => {
		const k = springAt(t, T.apps + i * 0.13, fps, 12, 120); if (k <= 0.01) return null;
		const z1 = s.z0 + s.h - (1 - k) * 0.9;
		const [ox, oy] = P(s.x, s.y, z1), [px, py] = P(s.x + s.w, s.y, z1), [qx, qy] = P(s.x, s.y, z1 - s.h);
		const m = `matrix(${(px - ox) / 1000} ${(py - oy) / 1000} ${(qx - ox) / 625} ${(qy - oy) / 625} ${ox} ${oy})`;
		const frame = pts(ctx, [[s.x, s.y, z1 - s.h], [s.x + s.w, s.y, z1 - s.h], [s.x + s.w, s.y, z1], [s.x, s.y, z1]]);
		const [b0x, b0y] = P(s.x + s.w / 2, s.y, 0.2), [b1x, b1y] = P(s.x + s.w / 2, s.y, z1 - s.h);
		const sheen = (t - T.apps - i * 0.13) / 1.0;
		return (
			<g key={s.src} opacity={clamp(k * 1.4)}>
				<line x1={b0x} y1={b0y} x2={b1x} y2={b1y} stroke="rgba(200,230,215,0.45)" strokeWidth={2} />
				<clipPath id={`scr${i}`}><polygon points={frame} /></clipPath>
				<polygon points={frame} fill="#06120d" />
				<g clipPath={`url(#scr${i})`}>
					<image href={staticFile(`img/${s.src}`)} width={1000} height={625} preserveAspectRatio="xMidYMin slice" transform={m} />
					{sheen > 0 && sheen < 1 && <polygon points={pts(ctx, [[s.x + s.w * (sheen * 1.6 - 0.5), s.y, z1 - s.h], [s.x + s.w * (sheen * 1.6 - 0.3), s.y, z1 - s.h], [s.x + s.w * (sheen * 1.6 - 0.1), s.y, z1], [s.x + s.w * (sheen * 1.6 - 0.3), s.y, z1]])} fill="rgba(255,255,255,0.22)" />}
				</g>
				<polygon points={frame} fill="none" stroke={mix(FIRE, GREEN, yesWave(t, s.x, s.y))} strokeWidth={1.6} strokeOpacity={0.5 + 0.5 * zoneLit(t, 'firebase')} />
			</g>
		);
	});
	// the Approve screen on the desk
	const approve = (() => {
		const k = springAt(t, T.person - 0.35, fps, 13, 120); if (k <= 0.01) return null;
		const w = 2.1, h = 1.45, x0 = DESK.x + 0.5, y0 = DESK.y + 0.12, z0 = DESK.h + 0.1 - (1 - k) * 0.8;
		const [ox, oy] = P(x0, y0, z0 + h), [px, py] = P(x0 + w, y0, z0 + h), [qx, qy] = P(x0, y0, z0);
		const m = `matrix(${(px - ox) / 1078} ${(py - oy) / 1078} ${(qx - ox) / 746} ${(qy - oy) / 746} ${ox} ${oy})`;
		const frame = pts(ctx, [[x0, y0, z0], [x0 + w, y0, z0], [x0 + w, y0, z0 + h], [x0, y0, z0 + h]]);
		return (
			<g opacity={clamp(k * 1.4)}>
				<clipPath id="apv"><polygon points={frame} /></clipPath>
				<polygon points={frame} fill="#fff" />
				<g clipPath="url(#apv)"><image href={staticFile('img/app-approve.webp')} width={1078} height={746} transform={m} /></g>
				<polygon points={frame} fill="none" stroke={AMBER} strokeWidth={2} />
			</g>
		);
	})();

	// ---- the flows between the parts
	const eventsT = T.pubsub - 0.05;
	const flows = (
		<g>
			{/* the call: from the apps along the floor to the API */}
			<Cable ctx={ctx} path={[[4.4, 14.6, 0.03], [4.4, 11.6, 0.03], [10.9, 11.6, 0.03], CORE_FRONT]} t0={T.api + 0.05} color={BLUE} packets={3} speed={1.2} until={T.u03 + 1.2} />
			{/* every step an event: from the core along Pub/Sub's spine to the agents */}
			<Cable ctx={ctx} path={[[10.9, 8.8, 0.03], [10.9, SPINE.y, 0.03], [SPINE.x1, SPINE.y, 0.03]]} t0={eventsT} color={MINT} packets={4} speed={0.75} width={3.6} until={T.u05 + 0.3} />
			{/* the Scheduler's tick into the spine */}
			<Cable ctx={ctx} path={[[SCHED.x, SCHED.y - SCHED.r, 0.03], [SCHED.x, SPINE.y, 0.03]]} t0={T.clock - 0.4} color={BLUE2} packets={2} speed={1.6} until={T.u04 + 1.6} />
			{/* the events up into the agents, one branch an agent, as they light */}
			{AGENTS.map(([n], i) => { const r = agentRack(i); return <Cable key={n} ctx={ctx} path={[[r.x + r.w / 2, SPINE.y, 0.03], [r.x + r.w / 2, r.y + r.d, 0.03]]} t0={T.nine + 0.1 + i * 0.165} color={MINT} packets={1} speed={1.4} width={2.6} until={T.u05 + 0.3} />; })}
		</g>
	);
	const pro = ['Valuer', 'Router', 'Negotiator'], flash = ['Data', 'Vision', 'Outreach', 'Lister', 'Paperwork', 'Impact'];
	const top = (r: Rack, dz = 0.05): P3 => [r.x + r.w / 2, r.y + r.d / 2, r.h + dz];
	const air = (
		<g>
			{/* BigQuery's sales to the Watcher and the Valuer; a label photo from Cloud Storage to Vision */}
			<Beam ctx={ctx} a={top(bqRack(0), 0.6)} b={top(agentRack(1))} t0={T.sales + 0.55} color={BLUE} lift={1.8} until={T.u05 + 0.4} />
			<Beam ctx={ctx} a={top(bqRack(1), 0.9)} b={top(agentRack(3))} t0={T.sales + 0.75} color={BLUE} lift={1.6} until={T.u05 + 0.4} />
			<Beam ctx={ctx} a={[GCS.x, GCS.y, GCS.h + 0.2]} b={top(agentRack(2))} t0={T.photos + 0.2} color={BLUE2} lift={2.6} until={T.u05 + 0.4} />
			{/* Gemini: Pro to the three that price and negotiate, Flash to the six that read and write */}
			{AGENTS.map(([n], i) => {
				const isPro = pro.includes(n), isFlash = flash.includes(n); if (!isPro && !isFlash) return null;
				const g = geminiRack(isPro ? 1 + (i % 2) : 3 + (i % 3));
				return <Beam key={n} ctx={ctx} a={top(g)} b={top(agentRack(i))} t0={(isPro ? T.pro + 0.05 : T.flash + 0.05) + (isPro ? pro.indexOf(n) : flash.indexOf(n)) * 0.09} color={isPro ? VIOLET : BLUE} lift={1.1} until={T.models + 0.5} width={2.4} />;
			})}
			{/* the guardrail: Gemini's beam stops at the glass round the money */}
			<Beam ctx={ctx} a={top(geminiRack(2))} b={[12.4, VAULT.y0, VAULT.h * 0.8]} t0={T.money + 0.35} color={VIOLET} lift={2.4} until={T.figure + 0.2} blocked />
			{/* the yes, from the desk to the API */}
			<Beam ctx={ctx} a={[DESK.x + 1.5, DESK.y, DESK.h + 1.0]} b={[12.0, VAULT.y1, 2.4]} t0={T.yes + 0.05} color={AMBER} lift={1.6} until={99} width={3} />
		</g>
	);
	// the records, flying from the API into Cloud SQL on "the record"
	const recs = [0, 1, 2, 3, 4].map((k) => {
		const p = (t - T.record - k * 0.1) / 0.55; if (p <= 0 || p >= 1) return null;
		const e = EASE_IO(p); const [x, y] = P(lerp(13.2, SQL.x, e), lerp(9.3, SQL.y, e), 2.3 + Math.sin(e * Math.PI) * 1.1 + 0.2 * (1 - e));
		return <rect key={k} x={x - 11} y={y - 2.5} width={22} height={5} rx={2.5} fill="#e6f0ff" opacity={1 - Math.abs(p - 0.5)} />;
	});

	// ---- the light that spills onto the floor
	const pools: React.ReactNode[] = [];
	const zp = (key: string, x: number, y: number, rx: number, ry: number, ink: string, a: number) => pools.push(<Pool key={key} ctx={ctx} x={x} y={y} rx={rx} ry={ry} ink={ink} a={a} />);
	zp('fire', 4.4, 15.2, 3.6, 2.2, FIRE, zoneLit(t, 'firebase') * (1 - done));
	zp('run', 11.0, 10.6, 3.2, 1.6, BLUE, zoneLit(t, 'run') * (1 - done));
	zp('sql', SQL.x, SQL.y + 1.0, 1.6, 1.3, BLUE, zoneLit(t, 'sql') * (1 - done));
	zp('agents', 13.7, 5.4, 6.8, 1.4, mix(MINT, VIOLET, on(t, T.pro, 0.6) * 0.5), on(t, T.nine, 1.2) * (1 - done));
	zp('gem', 12.6, 2.2, 4.2, 1.3, VIOLET, zoneLit(t, 'gemini') * (1 - done));
	zp('bq', 23.4, 5.3, 2.8, 1.2, BLUE, zoneLit(t, 'bq') * (1 - done));
	zp('vault', 12.3, 11.4, 4.8, 1.8, AMBER, on(t, T.money, 0.5) * (1 - done));
	zp('desk', 14.8, 15.8, 3.0, 1.6, AMBER, on(t, T.person, 0.5) * (1 - done));
	zp('all', 13.8, 9.0, 14, 9, GREEN, done * 0.55);

	// ---- the platform, floating: its top, grid and rim, its slab, and its ghost far below
	const pl = PLATFORM; const z = -pl.slab;
	const topP = pts(ctx, [[pl.x0, pl.y0, 0], [pl.x1, pl.y0, 0], [pl.x1, pl.y1, 0], [pl.x0, pl.y1, 0]]);
	const sideX = pts(ctx, [[pl.x1, pl.y0, 0], [pl.x1, pl.y1, 0], [pl.x1, pl.y1, z], [pl.x1, pl.y0, z]]);
	const sideY = pts(ctx, [[pl.x0, pl.y1, 0], [pl.x1, pl.y1, 0], [pl.x1, pl.y1, z], [pl.x0, pl.y1, z]]);
	const ghost = pts(ctx, [[pl.x0, pl.y0, -6], [pl.x1, pl.y0, -6], [pl.x1, pl.y1, -6], [pl.x0, pl.y1, -6]]);
	const outline = ramp(t, 0.0, 1.4, EASE);
	const grid: React.ReactNode[] = [];
	for (let x = 1; x < pl.x1; x++) { const [a, b] = [P(x, pl.y0), P(x, pl.y1)]; grid.push(<line key={`gx${x}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />); }
	for (let y = 1; y < pl.y1; y++) { const [a, b] = [P(pl.x0, y), P(pl.x1, y)]; grid.push(<line key={`gy${y}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />); }
	const rimPer = (() => { const q = [[pl.x0, pl.y0], [pl.x1, pl.y0], [pl.x1, pl.y1], [pl.x0, pl.y1]].map(([x, y]) => P(x, y)); return q.reduce((s, p, i) => s + Math.hypot(p[0] - q[(i + 1) % 4][0], p[1] - q[(i + 1) % 4][1]), 0); })();
	const spine = pts(ctx, [[SPINE.x0, SPINE.y - 0.22, 0.02], [SPINE.x1, SPINE.y - 0.22, 0.02], [SPINE.x1, SPINE.y + 0.22, 0.02], [SPINE.x0, SPINE.y + 0.22, 0.02]]);
	const edgePad = pts(ctx, [[EDGE.x0, EDGE.y0, 0.02], [EDGE.x1, EDGE.y0, 0.02], [EDGE.x1, EDGE.y1, 0.02], [EDGE.x0, EDGE.y1, 0.02]]);
	const vaultUp = ramp(t, T.money - 0.1, T.money + 0.55, EASE);
	const vaultInk = mix(AMBER, GREEN, done);
	const vh = VAULT.h * vaultUp;
	const vFaces = vh > 0.01 ? [
		pts(ctx, [[VAULT.x0, VAULT.y1, 0], [VAULT.x1, VAULT.y1, 0], [VAULT.x1, VAULT.y1, vh], [VAULT.x0, VAULT.y1, vh]]),
		pts(ctx, [[VAULT.x1, VAULT.y0, 0], [VAULT.x1, VAULT.y1, 0], [VAULT.x1, VAULT.y1, vh], [VAULT.x1, VAULT.y0, vh]]),
		pts(ctx, [[VAULT.x0, VAULT.y0, vh], [VAULT.x1, VAULT.y0, vh], [VAULT.x1, VAULT.y1, vh], [VAULT.x0, VAULT.y1, vh]]),
	] : [];
	const vBack = vh > 0.01 ? [pts(ctx, [[VAULT.x0, VAULT.y0, 0], [VAULT.x1, VAULT.y0, 0], [VAULT.x1, VAULT.y0, vh], [VAULT.x0, VAULT.y0, vh]]), pts(ctx, [[VAULT.x0, VAULT.y0, 0], [VAULT.x0, VAULT.y1, 0], [VAULT.x0, VAULT.y1, vh], [VAULT.x0, VAULT.y0, vh]])] : [];
	const hit = P(12.4, VAULT.y0, VAULT.h * 0.8); const hitK = on(t, T.money + 0.85, 0.2) * (1 - on(t, T.figure + 0.2, 0.4));
	const ringK = clamp((t - T.yes - 0.1) / 1.6);
	const [rcx, rcy] = P(14.8, 14.6, 0.02), [rax, ray] = P(14.8 + 1, 14.6, 0.02), [rbx, rby] = P(14.8, 14.6 + 1, 0.02);
	const ringR = 26 * EASE(ringK);
	// the clock on the Scheduler's tower
	const clock = (() => {
		const a = zoneLit(t, 'sched'); if (a <= 0.01) return null;
		const zt = SCHED.h * grow(SCHED.x, SCHED.y) + 0.02; const [cx, cy] = P(SCHED.x, SCHED.y, zt);
		const [ex, ey] = P(SCHED.x + SCHED.r * 0.85, SCHED.y, zt), [fx, fy] = P(SCHED.x, SCHED.y + SCHED.r * 0.85, zt);
		const ang = (t - T.scheduler) * 2.4; const hx = Math.cos(ang), hy = Math.sin(ang);
		const ticks = Array.from({ length: 12 }, (_, i) => { const q = (i / 12) * Math.PI * 2; const u = Math.cos(q), v = Math.sin(q); return <line key={i} x1={cx + (ex - cx) * u * 0.78 + (fx - cx) * v * 0.78} y1={cy + (ey - cy) * u * 0.78 + (fy - cy) * v * 0.78} x2={cx + (ex - cx) * u * 0.95 + (fx - cx) * v * 0.95} y2={cy + (ey - cy) * u * 0.95 + (fy - cy) * v * 0.95} stroke={BLUE2} strokeWidth={1.6} opacity={a} />; });
		const pulse = ((t - T.scheduler) % 0.8) / 0.8;
		return (
			<g>
				{ticks}
				<line x1={cx} y1={cy} x2={cx + (ex - cx) * hx * 0.7 + (fx - cx) * hy * 0.7} y2={cy + (ey - cy) * hx * 0.7 + (fy - cy) * hy * 0.7} stroke="#ffffff" strokeWidth={2.6} strokeLinecap="round" opacity={a} />
				<circle r={1} fill="none" stroke={BLUE2} strokeWidth={0.04} opacity={a * (1 - pulse)} transform={`matrix(${(ex - cx) * (1 + pulse * 1.6)} ${(ey - cy) * (1 + pulse * 1.6)} ${(fx - cx) * (1 + pulse * 1.6)} ${(fy - cy) * (1 + pulse * 1.6)} ${cx} ${cy})`} />
			</g>
		);
	})();

	const world = (
		<AbsoluteFill style={{ overflow: 'hidden' }}>
			<svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
				<defs>
					<linearGradient id="plat" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#0f3324" /><stop offset="1" stopColor="#081d14" /></linearGradient>
					<linearGradient id="ghost" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={MINT} stopOpacity={0.1} /><stop offset="1" stopColor={MINT} stopOpacity={0} /></linearGradient>
					<filter id="bloom" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation={9} /></filter>
					<filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={7} /></filter>
					<radialGradient id="spark"><stop offset="0" stopColor="#ffffff" /><stop offset="0.18" stopColor={MINT2} /><stop offset="1" stopColor={MINT} stopOpacity={0} /></radialGradient>
				</defs>
				{/* the ghost of the hall, far below, as on still water */}
				<polygon points={ghost} fill="url(#ghost)" stroke={MINT2} strokeOpacity={0.24} strokeWidth={1.4} opacity={ramp(t, 0.8, 2.2)} />
				<polygon points={ghost} fill="none" stroke={MINT} strokeOpacity={0.18} strokeWidth={9} filter="url(#soft)" opacity={ramp(t, 0.8, 2.2)} />
				{/* the slab and the floor */}
				<polygon points={sideX} fill="#05130d" stroke={MINT} strokeOpacity={0.25} />
				<polygon points={sideY} fill="#071a12" stroke={MINT} strokeOpacity={0.3} />
				<polygon points={topP} fill="url(#plat)" />
				<g stroke="rgba(150,240,200,0.085)" strokeWidth={1 / Math.max(0.6, c.zoom)} opacity={ramp(t, 0.2, 1.6)}>{grid}</g>
				<polygon points={topP} fill="none" stroke={MINT2} strokeOpacity={0.65} strokeWidth={2} strokeDasharray={rimPer} strokeDashoffset={rimPer * (1 - outline)} />
				<polygon points={edgePad} fill={FIRE} fillOpacity={0.05 + 0.08 * zoneLit(t, 'firebase')} stroke={FIRE} strokeOpacity={0.25 + 0.55 * zoneLit(t, 'firebase')} strokeWidth={1.4} />
				<polygon points={spine} fill={MINT} fillOpacity={0.05 + 0.12 * zoneLit(t, 'pubsub')} stroke={MINT} strokeOpacity={0.25 + 0.6 * zoneLit(t, 'pubsub')} strokeWidth={1.4} />
				<g filter="url(#soft)" opacity={0.75}>
					{racks.map((r, n) => { const g = grow(r.x, r.y); if (g < 0.05) return null; return <polygon key={n} points={pts(ctx, [[r.x - 0.08, r.y - 0.08, 0.005], [r.x + r.w + 0.35 * g, r.y - 0.08, 0.005], [r.x + r.w + 0.35 * g, r.y + r.d + 0.45 * g, 0.005], [r.x - 0.08, r.y + r.d + 0.45 * g, 0.005]])} fill="#000" opacity={0.55} />; })}
				</g>
				<Pool ctx={ctx} x={12.5} y={7.5} rx={13} ry={9} ink={'#9ff0c4'} a={0.32 * ramp(t, 0.6, 2.6)} />
				{pools}
				{flows}
				{vBack.map((f, i) => <polygon key={i} points={f} fill={vaultInk} fillOpacity={0.05} stroke={vaultInk} strokeOpacity={0.5} strokeWidth={1.2} />)}
				{items.map((it) => it.el)}
				{screens}
				{approve}
				{recs}
				{air}
				{clock}
				{vFaces.map((f, i) => <polygon key={i} points={f} fill={vaultInk} fillOpacity={i === 2 ? 0.1 : 0.07} stroke={vaultInk} strokeOpacity={0.9} strokeWidth={1.6} />)}
				{hitK > 0 && <g opacity={hitK}><circle cx={hit[0]} cy={hit[1]} r={20} fill="none" stroke={AMBER} strokeWidth={3} /><path d={`M ${hit[0] - 9} ${hit[1] - 9} L ${hit[0] + 9} ${hit[1] + 9} M ${hit[0] + 9} ${hit[1] - 9} L ${hit[0] - 9} ${hit[1] + 9}`} stroke={AMBER} strokeWidth={3.2} strokeLinecap="round" /></g>}
				{ringK > 0 && ringK < 1 && <circle r={1} fill="none" stroke={AMBER} strokeWidth={0.05} opacity={1 - ringK} transform={`matrix(${(rax - rcx) * ringR} ${(ray - rcy) * ringR} ${(rbx - rcx) * ringR} ${(rby - rcy) * ringR} ${rcx} ${rcy})`} />}
				{(() => { const a = 1 - ramp(t, 0.9, 2.4); if (a <= 0) return null; const [sx, sy] = P(14.1, 4.6, 1.55); const rr = 26 + 140 * a * Math.min(1, c.zoom / 4);
					return <g style={{ mixBlendMode: 'screen' }}><circle cx={sx} cy={sy} r={rr} fill="url(#spark)" opacity={0.9 * a} /><circle cx={sx} cy={sy} r={4 + 4 * a} fill="#ffffff" opacity={a} /></g>; })()}
				{/* the lit parts, bloomed */}
				<g filter="url(#bloom)" style={{ mixBlendMode: 'screen' }} opacity={0.7}>
					{racks.map((r, n) => {
						let a = r.zone === 'agents' ? (AGENTS[r.i][1] === 'code' ? 0 : agentOn(t, r.i)) : zoneLit(t, r.zone);
						a = Math.max(a * (1 - done), yesWave(t, r.x, r.y) * 0.7); if (a <= 0.02) return null;
						const ink = r.zone === 'agents' ? (t > T.flash ? TIER[AGENTS[r.i][1]] : t > T.pro && AGENTS[r.i][1] === 'pro' ? VIOLET : MINT) : ZINK[r.zone];
						return <polygon key={n} points={pts(ctx, [[r.x, r.y, r.h], [r.x + r.w, r.y, r.h], [r.x + r.w, r.y + r.d, r.h], [r.x, r.y + r.d, r.h]])} fill={mix(ink, GREEN, yesWave(t, r.x, r.y))} opacity={0.55 * a} />;
					})}
				</g>
			</svg>
		</AbsoluteFill>
	);
	if (layer === 'world') return world;

	// ---- the parts' names on the hall (screen space, crisp), the notes, the act's title, the index
	const tag = (key: string, x: number, y: number, zz: number, text: string, sub: string | undefined, ink: string, a: number, dx = 0, dy = -26) => {
		if (a <= 0.01) return null; const [px, py] = P(x, y, zz);
		return (
			<div key={key} style={{ position: 'absolute', left: px + dx, top: py + dy, translate: '-50% -50%', opacity: a, display: 'flex', gap: 8, alignItems: 'center', padding: '7px 12px', borderRadius: 999, font: "650 15px/1 'Geist'", whiteSpace: 'nowrap', color: '#e6f6ee', background: 'rgba(4,14,10,0.84)', border: `1px solid ${ink}`, boxShadow: '0 8px 22px rgba(0,0,0,0.5)' }}>
				<i style={{ width: 7, height: 7, borderRadius: '50%', background: ink, display: 'inline-block' }} />{text}{sub && <small style={{ font: "500 13px/1 'Geist'", color: INK.ink3 }}>{sub}</small>}
			</div>
		);
	};
	const dim = (a: number, t1: number) => a * (1 - 0.45 * ramp(t, t1, t1 + 0.6));
	const chips = [['batch.at_risk', 0], ['journey.step', 0.42], ['offer.received', 0.84]].map(([n, off]) => {
		const p = (t - eventsT - 0.6 - (off as number)) / 2.2; if (p <= 0 || p >= 1) return null;
		const pl_ = polyline(ctx, [[10.9, 8.8, 0.03], [10.9, SPINE.y, 0.03], [SPINE.x1, SPINE.y, 0.03]]); const [x, y] = pl_.at(EASE_IO(p));
		return <div key={n as string} style={{ position: 'absolute', left: x, top: y - 30, translate: '-50% -50%', font: "600 14px/1 ui-monospace, 'SF Mono', Menlo, monospace", padding: '6px 9px', borderRadius: 8, background: 'rgba(5,14,10,0.9)', border: `1.2px solid ${MINT}`, color: '#c4f8dc', whiteSpace: 'nowrap', opacity: fade(p, 0, 1, 0.08, 0.15) }}>{n as string}</div>;
	});
	const agentTags = AGENTS.map(([n, tier], i) => {
		const r = agentRack(i); const a = agentOn(t, i) * (1 - on(t, T.u06, 0.5)); if (a <= 0.01) return null;
		const [px, py] = P(r.x + r.w / 2, r.y + r.d * 0.5, r.h);
		const chip = t > T.flash - 0.1 || (tier === 'pro' && t > T.pro - 0.1) || tier === 'code';
		const label = tier === 'code' ? 'plain code' : tier === 'pro' ? '3.1 Pro' : '3.8 Flash';
		return (
			<div key={n} style={{ position: 'absolute', left: px, top: py - 12, translate: '-50% -100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, opacity: a }}>
				<b style={{ font: "650 13.5px/1 'Geist'", color: INK.ink, padding: '4px 7px', borderRadius: 7, background: 'rgba(4,12,9,0.88)', border: '1px solid rgba(115,201,157,0.25)', whiteSpace: 'nowrap' }}>{n}</b>
				{chip && <i style={{ font: "700 11.5px/1 'Geist'", fontStyle: 'normal', padding: '3px 7px', borderRadius: 999, whiteSpace: 'nowrap', color: tier === 'code' ? '#dfe7e2' : tier === 'pro' ? '#ead9ff' : BLUE2, background: tier === 'code' ? 'rgba(20,24,22,0.95)' : tier === 'pro' ? 'rgba(40,24,56,0.95)' : 'rgba(14,26,48,0.95)', border: `1.2px solid ${TIER[tier]}`, opacity: tier === 'code' ? 1 : on(t, tier === 'pro' ? T.pro : T.flash, 0.3) }}>{label}</i>}
			</div>
		);
	});
	const photo = (() => {
		const p = (t - T.photos - 0.15) / 0.9; if (p <= 0 || p >= 1.25) return null;
		const e = EASE_IO(clamp(p)); const r = agentRack(2);
		const [x, y] = P(lerp(GCS.x, r.x + r.w / 2, e), lerp(GCS.y, r.y + r.d / 2, e), lerp(GCS.h + 0.4, r.h + 0.3, e) + Math.sin(e * Math.PI) * 2.6);
		return <div style={{ position: 'absolute', left: x, top: y, width: 120, translate: '-50% -50%', rotate: `${-6 + 10 * e}deg`, opacity: clamp(p * 4) * (1 - clamp((p - 1) * 4)), borderRadius: 8, overflow: 'hidden', border: '3px solid #fff', boxShadow: '0 14px 30px rgba(0,0,0,0.5)' }}><Img src={staticFile('img/label-photo.webp')} style={{ width: '100%', display: 'block' }} /></div>;
	})();
	const figK = ramp(t, T.figure, T.figure + 0.9, EASE);
	const coreTop = P(11.0, 9.3, 3.6);
	const card = (() => {
		const a = fade(t, T.person - 0.05, 99, 0.3) * (1 - ramp(t, T.yes + 0.75, T.yes + 1.15)); if (a <= 0) return null;
		const k = springAt(t, T.person - 0.05, fps, 15, 140); const [dx, dy] = P(DESK.x + DESK.w, DESK.y, DESK.h + 1.0);
		const w = 600, h = Math.round(600 * 746 / 1078), left = Math.min(1920 - w - 60, dx + 60), top = Math.max(110, dy - h * 0.62);
		const bx = left + w * 0.795, by = top + h * 0.802;
		const kk = ramp(t, T.person + 0.25, T.yes - 0.08, EASE_IO); const cx = lerp(bx + 170, bx, kk), cy = lerp(by + 140, by, kk);
		const press = clamp(1 - Math.abs(t - T.yes) / 0.12), rp = clamp((t - T.yes) / 0.6);
		return (
			<>
				<svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, opacity: a * k }}>
					<path d={`M ${dx} ${dy} L ${left} ${top + h * 0.5}`} stroke={AMBER} strokeWidth={2} strokeDasharray="5 7" />
					<circle cx={dx} cy={dy} r={6} fill={AMBER} />
				</svg>
				<div style={{ position: 'absolute', left, top, width: w, height: h, borderRadius: 16, overflow: 'hidden', opacity: a, scale: String(0.9 + 0.1 * k), translate: `0 ${(1 - k) * 30}px`,
					border: `2px solid ${AMBER}`, boxShadow: '0 0 60px rgba(247,192,74,0.35), 0 30px 70px rgba(0,0,0,0.6)' }}>
					<Img src={staticFile('img/app-approve.webp')} style={{ width: '100%', height: '100%', display: 'block' }} />
				</div>
				{rp > 0 && rp < 1 && <div style={{ position: 'absolute', left: bx, top: by, width: 110 * rp + 10, height: 110 * rp + 10, translate: '-50% -50%', borderRadius: '50%', border: `3px solid ${AMBER}`, opacity: (1 - rp) * a }} />}
				<div style={{ position: 'absolute', left: cx, top: cy, opacity: a * ramp(t, T.person + 0.2, T.person + 0.45), scale: String(1 - 0.14 * press), filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.6))' }}>
					<svg width={34} height={34} viewBox="0 0 24 24"><path d="M4 2 L4 20 L9 15 L12.5 22 L15.5 20.6 L12 13.8 L19 13.8 Z" fill="#ffffff" stroke="#0b1a13" strokeWidth={1.4} strokeLinejoin="round" /></svg>
				</div>
			</>
		);
	})();
	const S = (x: number, y: number, zz = 0) => P(x, y, zz);
	const anchorFire = S(4.4, 15.4, 0.3), anchorRun = S(10.4, 9.3, 2.5), anchorSql = S(SQL.x, SQL.y, 2.1), anchorSpine = S(15.0, SPINE.y, 0.05), anchorSched = S(SCHED.x, SCHED.y, SCHED.h);
	const anchorAgents = S(agentRack(0).x + 0.5, agentRack(0).y + 0.5, 2.3), anchorBq = S(bqRack(1).x + 0.5, bqRack(1).y + 0.5, 3.2), anchorGcs = S(GCS.x, GCS.y, GCS.h), anchorGem = S(geminiRack(0).x + 0.5, geminiRack(0).y + 0.6, 2.8);
	const anchorVault = S(VAULT.x0 + 0.4, VAULT.y1, VAULT.h * 0.7), anchorDesk = S(DESK.x + 1.5, DESK.y, DESK.h + 1.4);
	const ui = (
		<AbsoluteFill>
			{tag('fb', 4.4, 16.4, 0, 'Firebase Hosting', undefined, FIRE, dim(zoneLit(t, 'firebase'), 5.6), 0, 22)}
			{SCREENS.map((s, i) => tag(`app${i}`, s.x + s.w / 2, s.y, s.z0 + s.h + 0.25, s.b, undefined, 'rgba(255,164,92,0.6)', fade(t, T.apps + 0.35 + i * 0.13, 5.5, 0.3, 0.3)))}
			{tag('run', 11.0, 9.8, 0, 'Cloud Run', 'backend-api', BLUE, dim(zoneLit(t, 'run'), 9.2), 0, 30)}
			{tag('sql', SQL.x, SQL.y + 0.9, 0, 'Cloud SQL', 'the record', BLUE, dim(zoneLit(t, 'sql'), 9.2), 0, 26)}
			{tag('ps', 21.5, SPINE.y + 0.3, 0, 'Pub/Sub', undefined, MINT, dim(zoneLit(t, 'pubsub'), 13.6), 0, 22)}
			{tag('sch', SCHED.x, SCHED.y, SCHED.h + 0.35, 'Cloud Scheduler', 'sc-tick', BLUE, dim(zoneLit(t, 'sched'), 13.7), 0, -18)}
			{tag('bq', bqRack(1).x + 1, bqRack(1).y + 1, 0, 'BigQuery', 'secondary_sales', BLUE, dim(zoneLit(t, 'bq'), 20), 0, 26)}
			{tag('gcs', GCS.x, GCS.y + GCS.r, 0, 'Cloud Storage', 'photos and papers', BLUE, dim(zoneLit(t, 'gcs'), 20), 0, 26)}
			{tag('gem', geminiRack(5).x + 1.3, geminiRack(5).y + 0.6, 2.9, 'Gemini', 'Agent Platform', VIOLET, dim(zoneLit(t, 'gemini'), 26.3), 0, -16)}
			{tag('adk', 14.0, 5.0, 0, "Google's ADK", 'on Cloud Run', MINT, dim(on(t, T.adk), 20.4), 0, 40)}
			{tag('vault', 16.4, VAULT.y1, VAULT.h + 0.3, 'The money stays in the API', undefined, AMBER, on(t, T.money + 0.2) * (1 - done), 0, -14)}
			{chips}
			{agentTags}
			{photo}
			{figK > 0 && (
				<div style={{ position: 'absolute', left: coreTop[0], top: coreTop[1] - 40, translate: '-50% -100%', opacity: fade(t, T.figure, 99, 0.25) * (1 - 0.6 * done), textAlign: 'center' }}>
					<div style={{ font: "700 13px/1 'Geist'", letterSpacing: 2.4, textTransform: 'uppercase', color: MINT2, marginBottom: 8 }}>Worked out by the API</div>
					<div style={{ font: "700 72px/1 'Bricolage Grotesque'", letterSpacing: -1.6, color: '#d6fbe7', fontVariantNumeric: 'tabular-nums', textShadow: '0 6px 30px rgba(0,0,0,0.6)' }}>₹{Math.round(16917 * figK).toLocaleString('en-IN')}</div>
				</div>
			)}
			{card}
			<Note id="firebase" t0={T.firebase} t1={5.5} x={1290} y={150} anchor={anchorFire} side="r" />
			<Note id="run" t0={T.run} t1={7.75} x={100} y={120} anchor={anchorRun} side="l" />
			<Note id="sql" t0={T.sql + 0.05} t1={9.15} x={1300} y={140} anchor={anchorSql} side="r" />
			<Note id="pubsub" t0={T.pubsub + 0.1} t1={12.0} x={90} y={150} anchor={anchorSpine} side="l" />
			<Note id="sched" t0={T.scheduler} t1={13.65} x={110} y={160} anchor={anchorSched} side="l" />
			<Note id="agents" t0={T.nine + 0.25} t1={16.9} x={90} y={640} anchor={anchorAgents} side="l" />
			<Note id="bq" t0={T.bigquery} t1={18.9} x={100} y={150} anchor={anchorBq} side="l" />
			<Note id="gcs" t0={T.storage} t1={20.7} x={100} y={170} anchor={anchorGcs} side="l" />
			<Note id="gemini" t0={T.gemini} t1={T.pro + 0.05} x={1300} y={640} anchor={anchorGem} side="r" />
			<Note id="pro" t0={T.pro + 0.05} t1={T.flash + 0.05} x={1300} y={640} anchor={anchorGem} side="r" />
			<Note id="flash" t0={T.flash + 0.05} t1={T.u06 + 0.1} x={1300} y={640} anchor={anchorGem} side="r" />
			<Note id="shield" t0={T.money + 0.1} t1={30.1} x={1300} y={150} anchor={anchorVault} side="r" />
			<Note id="yes" t0={T.person} t1={33.6} x={100} y={150} anchor={anchorDesk} side="l" />
			{(() => { const dock = ramp(t, 3.2, 3.95, EASE_IO); return (
				<div style={{ position: 'absolute', left: lerp(960, 76, dock), top: lerp(400, 40, dock), translate: `${lerp(-50, 0, dock)}% 0` }}>
					<ActTitle k="Under the hood" n="1 / 3" h="All on Google Cloud." t0={T.t01 + 0.1} t1={T.u04 - 0.05} inline size={lerp(104, 44, dock)} align={dock < 0.5 ? 'center' : 'left'} />
				</div>); })()}
			<ActTitle k="The agents" n="2 / 3" h="Nine AI agents. Two Gemini models." t0={T.u04 + 0.1} t1={T.u06 - 0.05} />
			<ActTitle k="Guardrails" n="3 / 3" h="The models never touch the money." t0={T.u06 + 0.1} t1={99} />
			<IndexBar t0={3.4} />
			<Finish vignette={0.5} />
		</AbsoluteFill>
	);
	if (layer === 'ui') return ui;
	return (<>{world}{ui}</>);
};

/** the scene's own background: a void of deep green with slow light in it, and motes that drift with the camera */
const Void: React.FC = () => {
	const t = useT(); const c = camAt(t);
	const MOTES = React.useMemo(() => { const r = rng(91); return Array.from({ length: 70 }, () => ({ x: r() * 2400, y: r() * 1500, s: 0.8 + r() * 2, ph: r() * 6.28, d: 0.15 + r() * 0.5 })); }, []);
	return (
		<AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 42%, #0e3524 0%, #072217 38%, #03110b 72%, #010805 100%)' }}>
			{[0, 1, 2].map((i) => <div key={i} style={{ position: 'absolute', left: 420 + i * 470 + Math.sin(t * 0.21 + i * 2) * 40 - c.x * 6, top: -200, width: 150 + i * 40, height: 1500, rotate: '-24deg', transformOrigin: '50% 0', background: 'linear-gradient(180deg, rgba(159,240,196,0.07), rgba(159,240,196,0))', filter: 'blur(18px)', opacity: 0.6 + 0.4 * Math.sin(t * 0.3 + i) }} />)}
			<div style={{ position: 'absolute', left: 260 + Math.sin(t * 0.15) * 60, top: -180, width: 1400, height: 600, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(95,227,161,0.12), rgba(95,227,161,0))' }} />
			<div style={{ position: 'absolute', left: 900 + Math.cos(t * 0.12) * 80, top: 620, width: 1300, height: 520, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(197,138,249,0.06), rgba(197,138,249,0))' }} />
			<svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
				{MOTES.map((m, i) => {
					const x = ((m.x - c.x * 40 * m.d + Math.sin(t * 0.4 + m.ph) * 12) % 2400 + 2400) % 2400 - 240, y = ((m.y - t * 8 * m.d - c.y * 20 * m.d) % 1500 + 1500) % 1500 - 210;
					return <circle key={i} cx={x} cy={y} r={m.s} fill="#c9f7de" opacity={0.18 + 0.2 * Math.sin(t * 1.1 + m.ph)} />;
				})}
			</svg>
		</AbsoluteFill>
	);
};

export const Arch: React.FC = () => {
	const { fps } = useVideoConfig();
	return (
		<AbsoluteFill style={{ background: '#010805' }}>
			<Void />
			<CameraMotionBlur samples={5} shutterAngle={100}>
				<ArchScene layer="world" />
			</CameraMotionBlur>
			<ArchScene layer="ui" />
			<Audio src={staticFile('audio/arch-voice.wav')} premountFor={fps} />
			<Audio src={staticFile('audio/arch-sfx.wav')} premountFor={fps} />
			<Audio src={staticFile('sfx/hum.wav')} volume={0.55} loop premountFor={fps} />
		</AbsoluteFill>
	);
};
