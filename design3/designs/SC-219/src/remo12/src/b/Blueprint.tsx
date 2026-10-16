// SC-219 cut 12, concept B · The blueprint: the data centre drawn as one isometric floor plan in Smart-Clearance's
// greens, built and lit in motion. The camera starts on one rack's light and pulls back as the hall extrudes row by
// row; each part of the stack is a place on the floor, rising and lighting as the voice names it, with cut 10's notes.
import React from 'react';
import { AbsoluteFill, staticFile, useVideoConfig } from 'remotion';
import { Audio } from '@remotion/media';
import { CameraMotionBlur } from '@remotion/motion-blur';
import { ActTitle, CUE, EASE_IO, Finish, INK, IndexBar, Note, TEST_END, clamp, fade, lerp, ramp, rng, springAt, useT } from '../lib/base';

const U = 52, C30 = Math.cos(Math.PI / 6);
type P3 = [number, number, number];
const iso = (x: number, y: number, z = 0): [number, number] => [(x - y) * C30 * U, (x + y) * 0.5 * U - z * U];
const poly = (pts: P3[]) => pts.map((p) => iso(p[0], p[1], p[2]).map((v) => v.toFixed(1)).join(',')).join(' ');

type Zone = 'hall' | 'firebase' | 'run' | 'sql' | 'pubsub' | 'sched' | 'agents' | 'bq' | 'gcs' | 'gemini';
const ZINK: Record<Zone, string> = { hall: '#bfe9d2', firebase: INK.fire, run: INK.blue, sql: INK.blue, pubsub: INK.mint, sched: INK.blue, agents: INK.mint, bq: INK.blue, gcs: INK.blue, gemini: INK.violet };
type Rack = { x: number; y: number; w: number; d: number; h: number; zone: Zone; i: number };
const racks: Rack[] = [];
const row = (zone: Zone, x0: number, y: number, n: number, w: number, d: number, h: number) => { for (let i = 0; i < n; i++) racks.push({ x: x0 + i * (w + 0.06), y, w, d, h, zone, i }); };
row('hall', 2.0, 1.0, 12, 1.08, 1.0, 2.2);      // the hall's own rows
row('gemini', 17.2, 0.9, 6, 1.24, 1.25, 2.7);   // the accelerators, liquid cooled
row('hall', 1.4, 4.2, 5, 1.08, 1.0, 2.2);
row('agents', 8.6, 4.2, 10, 1.13, 1.0, 2.2);   // the agents' row
row('hall', 1.4, 6.9, 6, 1.08, 1.0, 2.2);
row('bq', 17.8, 6.9, 6, 1.1, 1.0, 2.0);
row('run', 8.6, 9.0, 4, 1.14, 1.0, 2.2);        // the core
row('hall', 18.2, 13.6, 4, 1.08, 1.0, 2.2);
const AGENTS = [['Data', 'flash'], ['Watcher', 'code'], ['Vision', 'flash'], ['Valuer', 'pro'], ['Router', 'pro'], ['Outreach', 'flash'], ['Lister', 'flash'], ['Negotiator', 'pro'], ['Paperwork', 'flash'], ['Impact', 'flash']];
const TIER: Record<string, string> = { pro: INK.violet, flash: INK.blue, code: '#9aa69f' };
const VAULT = { x0: 8.25, x1: 16.05, y0: 8.6, y1: 10.55, h: 3.1 };
const DESK = { x: 18.7, y: 14.95, w: 3.0, d: 0.75, h: 0.72 };
const SQL = { x: 15.0, y: 9.5, r: 0.78 }, GCS = { x: 22.6, y: 10.4, r: 0.92 }, SCHED = { x: 17.0, y: 9.4, r: 0.42 };
const SPINE = { x0: 1.0, x1: 25.0, y: 12.0 };
const SCREENS = [['landing', 'app-landing.webp', 'Landing page'], ['console', 'app-console.webp', 'Console'], ['workspace', 'app-workspace.webp', 'Workspace'], ['demo', 'app-demo.webp', 'Guided demo']]
	.map(([id, src, b], i) => ({ id, src, b, x: 1.35 + i * 1.6, y: 14.9, w: 1.44, h: 0.9, z0: 0.5 }));

// the camera: world target and zoom, eased between holds that drift a little
type Cam = { x: number; y: number; z: number; zoom: number };
const KEYS: [number, Cam][] = [
	[0.0, { x: 15.68, y: 5.2, z: 1.27, zoom: 5.2 }],
	[0.55, { x: 15.68, y: 5.2, z: 1.27, zoom: 4.9 }],
	[3.15, { x: 13.4, y: 9.2, z: 0.6, zoom: 0.76 }],
	[3.35, { x: 13.4, y: 9.2, z: 0.6, zoom: 0.77 }],
	[4.5, { x: 4.4, y: 15.0, z: 0.9, zoom: 1.62 }],
	[5.3, { x: 4.4, y: 15.0, z: 0.9, zoom: 1.66 }],
	[6.35, { x: 11.9, y: 9.7, z: 1.0, zoom: 1.5 }],
	[8.85, { x: 12.3, y: 9.6, z: 1.0, zoom: 1.56 }],
	[9.9, { x: 13.4, y: 9.2, z: 0.6, zoom: 0.78 }],
];
function camAt(t: number): Cam {
	let k = 0; while (k < KEYS.length - 2 && t > KEYS[k + 1][0]) k++;
	const [t0, a] = KEYS[k], [t1, b] = KEYS[k + 1];
	const e = EASE_IO(clamp((t - t0) / (t1 - t0)));
	return { x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), z: lerp(a.z, b.z, e), zoom: Math.exp(lerp(Math.log(a.zoom), Math.log(b.zoom), e)) };
}
const toScreen = (c: Cam, x: number, y: number, z = 0): [number, number] => { const p = iso(x, y, z), q = iso(c.x, c.y, c.z); return [(p[0] - q[0]) * c.zoom + 960, (p[1] - q[1]) * c.zoom + 540]; };

// how lit each part is at scene time t (0 dim, 1 lit); a still passes its own
type Lit = Record<Zone, number> & { vault: number; yes: number };
export function litAt(t: number): Lit {
	const on = (a: number) => ramp(t, a, a + 0.5);
	return { hall: 0, firebase: on(CUE.firebase), run: on(CUE.run), sql: on(CUE.sql), pubsub: on(CUE.pubsub), sched: on(CUE.clock), agents: on(CUE.nine), bq: on(CUE.bigquery), gcs: on(CUE.storage), gemini: on(CUE.gemini), vault: on(CUE.money), yes: on(CUE.yes) };
}

const R = rng(2191);
const TW = Array.from({ length: 4000 }, () => [R(), R() * 6.28, 0.6 + R() * 2.2]);   // each light's twinkle

const Box: React.FC<{ x: number; y: number; w: number; d: number; h: number; ink: string; lit: number; leds?: number; seed?: number; t: number; edge?: number; z0?: number }> = ({ x, y, w, d, h, ink, lit, leds = 0, seed = 0, t, edge = 0.32, z0 = 0 }) => {
	if (h <= 0.001) return null;
	const x1 = x + w, y1 = y + d;
	const zt = z0 + h;
	const top: P3[] = [[x, y, zt], [x1, y, zt], [x1, y1, zt], [x, y1, zt]];
	const front: P3[] = [[x, y1, z0], [x1, y1, z0], [x1, y1, zt], [x, y1, zt]];   // faces the viewer's left (+y)
	const side: P3[] = [[x1, y, z0], [x1, y1, z0], [x1, y1, zt], [x1, y, zt]];     // faces the viewer's right (+x)
	const L = 0.42 + 0.58 * lit;
	const slots = Math.max(3, Math.round(h * 4));
	const els: React.ReactNode[] = [];
	if (leds) {
		for (let s = 0; s < slots; s++) {
			const z = h * (s + 0.5) / slots;
			const [ax, ay] = iso(x + w * 0.08, y1, z), [bx, by] = iso(x1 - w * 0.08, y1, z);
			els.push(<line key={`s${s}`} x1={ax} y1={ay} x2={bx} y2={by} stroke="rgba(255,255,255,0.05)" strokeWidth={0.8} />);
			for (let j = 0; j < 2; j++) {
				const tw = TW[(seed * 31 + s * 7 + j) % TW.length];
				const blink = 0.55 + 0.45 * Math.sin(t * tw[2] * 3 + tw[1]);
				const [lx, ly] = iso(x + w * (0.16 + j * 0.13), y1, z);
				const a = (0.35 + 0.65 * blink) * (tw[0] < 0.18 ? 0.3 : 1) * (0.55 + 0.45 * L);
				els.push(<circle key={`l${s}-${j}`} cx={lx} cy={ly} r={2.1} fill={lit > 0.05 ? ink : (tw[0] > 0.8 ? INK.blue : INK.mint)} opacity={a} />);
			}
		}
	}
	return (
		<g>
			<polygon points={poly(side)} fill="rgba(8,22,16,0.97)" stroke={ink} strokeOpacity={edge * 0.6 * L} strokeWidth={1} />
			<polygon points={poly(front)} fill="rgba(12,32,24,0.97)" stroke={ink} strokeOpacity={edge * L} strokeWidth={1} />
			<polygon points={poly(top)} fill={`rgba(${lit > 0.05 ? '30,62,48' : '22,48,36'},0.98)`} stroke={ink} strokeOpacity={(edge + 0.2) * L} strokeWidth={1.2} />
			{lit > 0.02 && <polygon points={poly(top)} fill={ink} opacity={0.16 * lit} />}
			{els}
		</g>
	);
};

const Cylinder: React.FC<{ x: number; y: number; r: number; z0: number; h: number; ink: string; lit: number; open?: boolean }> = ({ x, y, r, z0, h, ink, lit, open }) => {
	if (h <= 0.001) return null;
	const [cx, cy0] = iso(x, y, z0), [, cy1] = iso(x, y, z0 + h);
	const rx = r * C30 * U * Math.SQRT2 * 0.82, ry = rx * 0.5;
	const L = 0.3 + 0.7 * lit;
	return (
		<g>
			<path d={`M ${cx - rx} ${cy1} L ${cx - rx} ${cy0} A ${rx} ${ry} 0 0 0 ${cx + rx} ${cy0} L ${cx + rx} ${cy1}`} fill="rgba(7,20,14,0.97)" stroke={ink} strokeOpacity={0.35 * L} />
			<ellipse cx={cx} cy={cy1} rx={rx} ry={ry} fill={open ? 'rgba(2,8,6,1)' : 'rgba(18,40,31,0.98)'} stroke={ink} strokeOpacity={0.6 * L} strokeWidth={1.3} />
			{lit > 0.02 && <ellipse cx={cx} cy={cy1} rx={rx} ry={ry} fill={ink} opacity={(open ? 0.08 : 0.2) * lit} />}
		</g>
	);
};

export const BlueprintScene: React.FC<{ still?: { t: number; cam: Cam; lit: Lit }; layer?: 'world' | 'ui' | 'all' }> = ({ still, layer = 'all' }) => {
	const tNow = useT(); const { fps } = useVideoConfig();
	const t = still ? still.t : tNow;
	const cam = still ? still.cam : camAt(t);
	const lit = still ? still.lit : litAt(t);
	const q = iso(cam.x, cam.y, cam.z);
	const tf = `translate(${(960 - q[0] * cam.zoom).toFixed(2)} ${(540 - q[1] * cam.zoom).toFixed(2)}) scale(${cam.zoom.toFixed(4)})`;

	// the hall extrudes from the light the camera starts on, outward
	const grow = (r: { x: number; y: number }) => still ? 1 : springAt(t, -0.3 + Math.hypot(r.x - 15.7, r.y - 5.2) * 0.05, fps, 13, 110);
	const outline = still ? 1 : ramp(t, 0.05, 1.5);
	const gridA = still ? 1 : ramp(t, 0.3, 1.8);
	const sweep = still ? -99 : lerp(-6, 46, ramp(t, 1.45, 3.0, EASE_IO));   // a band of light crossing the floor (x+y)
	const items: { k: number; el: React.ReactNode }[] = [];
	for (const [n, r] of racks.entries()) {
		const g = grow(r); const zl = lit[r.zone] ?? 0;
		const band = Math.exp(-Math.pow((r.x + r.y - sweep) / 2.2, 2));
		const tier = r.zone === 'agents' ? AGENTS[r.i][1] : '';
		const ink = tier === 'code' ? TIER.code : tier && lit.gemini > 0.5 ? TIER[tier] : ZINK[r.zone];
		const L = tier === 'code' ? Math.min(zl, 0.25) : zl;
		items.push({ k: r.x + r.w + r.y + r.d, el: <Box key={`r${n}`} {...r} h={r.h * g} ink={ink} lit={Math.max(L, band * 0.9, lit.yes)} leds={1} seed={n} t={t} /> });
	}
	// Cloud Run's containers, scaling up on its word
	const runRacks = racks.filter((r) => r.zone === 'run');
	runRacks.forEach((r, i) => {
		for (let j = 0; j < 2; j++) {
			const s = still ? (lit.run > 0.5 ? 1 : 0) : springAt(t, CUE.run + 0.08 + (i * 2 + j) * 0.07, fps, 11, 170);
			if (s <= 0.01) continue;
			const cw = 0.38 * s;
			items.push({ k: r.x + r.w + r.y + r.d + 0.01 + j * 0.001, el: <Box key={`c${i}${j}`} x={r.x + 0.1 + j * 0.52} y={r.y + 0.28} z0={r.h} w={cw} d={0.42 * s} h={0.36 * s} ink={INK.blue2} lit={1} t={t} edge={0.7} /> });
		}
	});
	// Cloud SQL: three disks stacking on their word
	for (let k = 0; k < 3; k++) {
		const s = still ? (lit.sql > 0.5 ? 1 : 0.0) : springAt(t, CUE.sql + k * 0.12, fps, 14, 150);
		const z0 = k * 0.66 + (1 - s) * 0.6;
		items.push({ k: SQL.x + SQL.y + 0.5 + k * 0.01, el: <g key={`sql${k}`} opacity={clamp(s * 1.5)}><Cylinder x={SQL.x} y={SQL.y} r={SQL.r} z0={z0} h={0.58 * clamp(s)} ink={INK.blue} lit={lit.sql} /></g> });
	}
	// what the camera reaches later: Storage's bucket, the Scheduler's tower (dim outlines until their words)
	items.push({ k: GCS.x + GCS.y, el: <Cylinder key="gcs" x={GCS.x} y={GCS.y} r={GCS.r} z0={0} h={1.3 * grow(GCS)} ink={INK.blue} lit={lit.gcs} open /> });
	items.push({ k: SCHED.x + SCHED.y, el: <Cylinder key="sched" x={SCHED.x} y={SCHED.y} r={SCHED.r} z0={0} h={2.6 * grow(SCHED)} ink={INK.blue} lit={lit.sched} /> });
	if (lit.yes > 0) items.push({ k: DESK.x + DESK.w + DESK.y + DESK.d, el: <Box key="desk" x={DESK.x} y={DESK.y} w={DESK.w} d={DESK.d} h={DESK.h} ink={INK.amber} lit={lit.yes} t={t} edge={0.6} /> });
	items.sort((a, b) => a.k - b.k);

	// the edge: Firebase's platform and the four apps' screens rising on it
	const plat: P3[] = [[0.9, 13.4, 0.22], [7.9, 13.4, 0.22], [7.9, 16.9, 0.22], [0.9, 16.9, 0.22]];
	const platLit = lit.firebase;
	const screens = SCREENS.map((s, i) => {
		const k = still ? (lit.firebase > 0.5 ? 1 : 0) : springAt(t, CUE.apps + i * 0.13, fps, 12, 120);
		if (k <= 0.01) return null;
		const z1 = s.z0 + s.h + (1 - k) * -0.9;
		const [ox, oy] = iso(s.x, s.y, z1);
		const sx = (s.w * C30 * U) / 1000, sy = (s.w * 0.5 * U) / 1000;
		const m = `matrix(${sx} ${sy} 0 ${(s.h * U) / 625} ${ox} ${oy})`;
		const frame: P3[] = [[s.x, s.y, z1 - s.h], [s.x + s.w, s.y, z1 - s.h], [s.x + s.w, s.y, z1], [s.x, s.y, z1]];
		const sheen = ((t - CUE.apps - i * 0.13) / 1.1);
		const [p0x, p0y] = iso(s.x + s.w * 0.5, s.y, s.z0 - 0.3 + (1 - k) * -0.9), [p1x, p1y] = iso(s.x + s.w * 0.5, s.y, z1 - s.h);
		return (
			<g key={s.id} opacity={clamp(k * 1.3)}>
				<line x1={p0x} y1={p0y + 6} x2={p1x} y2={p1y} stroke="rgba(160,200,180,0.35)" strokeWidth={2} />
				<polygon points={poly(frame)} fill="#05110c" stroke={INK.fire} strokeOpacity={0.35 + 0.5 * platLit} strokeWidth={1.4} />
				<g clipPath={`url(#scr${i})`}>
					<image href={staticFile(`img/${s.src}`)} width={1000} height={625} preserveAspectRatio="xMidYMin slice" transform={m} opacity={0.92} />
					{sheen > 0 && sheen < 1 && <polygon points={poly([[s.x + s.w * (sheen * 1.6 - 0.5), s.y, z1 - s.h], [s.x + s.w * (sheen * 1.6 - 0.3), s.y, z1 - s.h], [s.x + s.w * (sheen * 1.6 - 0.1), s.y, z1], [s.x + s.w * (sheen * 1.6 - 0.3), s.y, z1]])} fill="rgba(255,255,255,0.18)" />}
				</g>
				<clipPath id={`scr${i}`}><polygon points={poly(frame)} /></clipPath>
			</g>
		);
	});
	const spineA = still ? 1 : ramp(t, 1.0, 2.2);
	// the call from the apps to the API: a light along the floor, edge → spine → core, on "one API"
	const callK = still ? 0 : ramp(t, CUE.api + 0.05, CUE.api + 0.95, EASE_IO);
	const callPath: [number, number][] = [[4.8, 14.6], [4.8, SPINE.y], [10.5, SPINE.y], [10.5, 10.05]];
	const callPts = callPath.map(([x, y]) => iso(x, y, 0.05));
	const callD = 'M ' + callPts.map((p) => p.join(' ')).join(' L ');
	const callLen = callPath.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - callPath[i - 1][0], p[1] - callPath[i - 1][1]) * U * 0.95 : 0), 0);
	// records flying into Cloud SQL on "the record"
	const recs = [0, 1, 2, 3, 4].map((k) => {
		const p = still ? -1 : (t - CUE.record - k * 0.09) / 0.55; if (p <= 0 || p >= 1) return null;
		const e = EASE_IO(p); const x = lerp(13.4, SQL.x, e), y = lerp(9.5, SQL.y, e), z = 1.2 + Math.sin(e * Math.PI) * 0.9 + 0.8;
		const [px, py] = iso(x, y, z);
		return <rect key={k} x={px - 9} y={py - 2} width={18} height={4} rx={2} fill={INK.blue2} opacity={1 - Math.abs(p - 0.5)} />;
	});
	const fFloor: P3[] = [[0, 0, 0], [26, 0, 0], [26, 18, 0], [0, 18, 0]];
	const floorPts = fFloor.map((p) => iso(p[0], p[1], p[2]));
	const per = floorPts.reduce((s, p, i) => s + Math.hypot(p[0] - floorPts[(i + 1) % 4][0], p[1] - floorPts[(i + 1) % 4][1]), 0);
	const grid: React.ReactNode[] = [];
	for (let x = 1; x < 26; x++) { const [a, b] = [iso(x, 0), iso(x, 18)]; grid.push(<line key={`gx${x}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />); }
	for (let y = 1; y < 18; y++) { const [a, b] = [iso(0, y), iso(26, y)]; grid.push(<line key={`gy${y}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />); }
	const zoneTile = (x: number, y: number, ink: string, a: number, key: string) => {
		const s = 0.55; const pts: P3[] = [[x - s, y - s, 0.02], [x + s, y - s, 0.02], [x + s, y + s, 0.02], [x - s, y + s, 0.02]];
		return <polygon key={key} points={poly(pts)} fill={ink} opacity={0.18 * a} stroke={ink} strokeOpacity={0.8 * a} strokeWidth={1.4} />;
	};
	const S = (x: number, y: number, z = 0) => toScreen(cam, x, y, z);
	// a part's name on the floor beside it (screen space, crisp)
	const Tag: React.FC<{ x: number; y: number; z?: number; text: string; sub?: string; ink: string; a: number; dx?: number; dy?: number }> = ({ x, y, z = 0, text, sub, ink, a, dx = 0, dy = 0 }) => {
		if (a <= 0.01) return null; const [px, py] = S(x, y, z);
		return (
			<div style={{ position: 'absolute', left: px + dx, top: py + dy, translate: '-50% -50%', opacity: a, display: 'flex', gap: 8, alignItems: 'center', padding: '7px 12px', borderRadius: 999, font: "650 15px/1 'Geist'", whiteSpace: 'nowrap', color: '#dff3e8', background: 'rgba(4,14,10,0.82)', border: `1px solid ${ink}`, boxShadow: '0 8px 22px rgba(0,0,0,0.45)' }}>
				<i style={{ width: 7, height: 7, borderRadius: '50%', background: ink, display: 'inline-block' }} />{text}{sub && <small style={{ font: "500 13px/1 'Geist'", color: INK.ink3 }}>{sub}</small>}
			</div>
		);
	};
	const endA = still ? 0 : fade(t, 9.0, 99, 0.45);
	const anchorFire = S(4.4, 15.6, 0.3), anchorRun = S(10.3, 9.5, 2.55), anchorSql = S(SQL.x, SQL.y, 2.1);
	// the title: large at the centre over the pull-back, then docked at the top left
	const dock = still ? 1 : ramp(t, 3.25, 3.95, EASE_IO);
	return (
		<AbsoluteFill style={{ background: layer === 'ui' ? undefined : 'radial-gradient(ellipse at 50% 48%, #0b2a1d 0%, #06170f 42%, #020805 100%)', overflow: 'hidden' }}>
			{layer !== 'ui' && <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
				<defs>
					<filter id="bloom" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={7} /></filter>
					<linearGradient id="floorg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#0c2a1e" /><stop offset="1" stopColor="#051710" /></linearGradient>
				</defs>
				<g transform={tf}>
					<polygon points={poly(fFloor)} fill="url(#floorg)" opacity={0.85 * gridA} />
					<g stroke="rgba(140,235,190,0.075)" strokeWidth={1 / Math.max(0.6, cam.zoom)} opacity={gridA}>{grid}</g>
					<polygon points={poly(fFloor)} fill="none" stroke={INK.mint} strokeOpacity={0.55} strokeWidth={2} strokeDasharray={per} strokeDashoffset={per * (1 - outline)} />
					{/* Pub/Sub's spine along the floor */}
					<g opacity={spineA}>
						<polygon points={poly([[SPINE.x0, SPINE.y - 0.18, 0.02], [SPINE.x1, SPINE.y - 0.18, 0.02], [SPINE.x1, SPINE.y + 0.18, 0.02], [SPINE.x0, SPINE.y + 0.18, 0.02]])} fill="rgba(95,227,161,0.06)" stroke={INK.mint} strokeOpacity={0.25 + 0.6 * lit.pubsub} />
					</g>
					<polygon points={poly(plat)} fill={`rgba(255,159,69,${0.04 + 0.1 * platLit})`} stroke={INK.fire} strokeOpacity={0.22 + 0.6 * platLit} strokeWidth={1.4} opacity={spineA} />
					{zoneTile(4.4, 15.95, INK.fire, platLit, 'zf')}
					{items.map((it) => it.el)}
					{screens}
					{callK > 0 && callK < 1 && (
						<path d={callD} fill="none" stroke={INK.mint2} strokeWidth={4} strokeLinecap="round" strokeDasharray={`${callLen * 0.22} ${callLen * 2}`} strokeDashoffset={-callLen * (callK * 1.25 - 0.22)} />
					)}
					{recs}
					{lit.gemini > 0.02 && AGENTS.map(([n, tier], i) => {
						if (tier === 'code') return null;
						const r = racks.filter((q) => q.zone === 'agents')[i]; const g0 = racks.filter((q) => q.zone === 'gemini')[tier === 'pro' ? 1 : 4];
						const a = iso(g0.x + g0.w / 2, g0.y + g0.d / 2, g0.h), b = iso(r.x + r.w / 2, r.y + r.d / 2, r.h);
						const mx = (a[0] + b[0]) / 2, my = Math.min(a[1], b[1]) - 120;
						return <path key={`beam${n}`} d={`M ${a[0]} ${a[1]} Q ${mx} ${my} ${b[0]} ${b[1]}`} fill="none" stroke={TIER[tier]} strokeWidth={2.4} strokeDasharray="7 9" strokeDashoffset={-t * 40} opacity={0.75 * lit.gemini} />;
					})}
					{lit.vault > 0.02 && (() => {
						const v = VAULT; const A = lit.vault;
						const faces: P3[][] = [[[v.x0, v.y0, v.h], [v.x1, v.y0, v.h], [v.x1, v.y1, v.h], [v.x0, v.y1, v.h]], [[v.x0, v.y1, 0], [v.x1, v.y1, 0], [v.x1, v.y1, v.h], [v.x0, v.y1, v.h]], [[v.x1, v.y0, 0], [v.x1, v.y1, 0], [v.x1, v.y1, v.h], [v.x1, v.y0, v.h]]];
						const g0 = racks.filter((q) => q.zone === 'gemini')[1]; const ga = iso(g0.x + g0.w / 2, g0.y + g0.d / 2, g0.h), hit = iso(12.2, v.y0, v.h * 0.85);
						return (
							<g>
								{faces.map((f, i) => <polygon key={i} points={poly(f)} fill={INK.amber} opacity={0.07 * A} stroke={INK.amber} strokeOpacity={0.75 * A} strokeWidth={1.6} />)}
								<path d={`M ${ga[0]} ${ga[1]} Q ${(ga[0] + hit[0]) / 2} ${Math.min(ga[1], hit[1]) - 90} ${hit[0]} ${hit[1]}`} fill="none" stroke={INK.violet} strokeWidth={2.4} strokeDasharray="7 9" opacity={0.8 * A} />
								<circle cx={hit[0]} cy={hit[1]} r={14} fill="none" stroke={INK.amber} strokeWidth={3} opacity={A} />
								<path d={`M ${hit[0] - 8} ${hit[1] - 8} L ${hit[0] + 8} ${hit[1] + 8} M ${hit[0] + 8} ${hit[1] - 8} L ${hit[0] - 8} ${hit[1] + 8}`} stroke={INK.amber} strokeWidth={3} opacity={A} />
							</g>
						);
					})()}
					{lit.yes > 0.02 && (() => {
						const z0 = DESK.h + 0.08, w = 2.1, h = 1.38, x0 = DESK.x + 0.45, y0 = DESK.y + 0.1;
						const [ox, oy] = iso(x0, y0, z0 + h);
						const m = `matrix(${(w * C30 * U) / 1078} ${(w * 0.5 * U) / 1078} 0 ${(h * U) / 746} ${ox} ${oy})`;
						const fr: P3[] = [[x0, y0, z0], [x0 + w, y0, z0], [x0 + w, y0, z0 + h], [x0, y0, z0 + h]];
						const [cx, cy] = iso(DESK.x + DESK.w / 2, DESK.y + DESK.d / 2, 0); const R_ = 520 * clamp(lit.yes);
						return (
							<g>
								<ellipse cx={cx} cy={cy} rx={R_ * 1.73} ry={R_} fill="none" stroke={INK.amber} strokeWidth={3} opacity={0.85 * (1 - 0.5 * clamp(lit.yes))} />
								<polygon points={poly(fr)} fill="#120d04" stroke={INK.amber} strokeWidth={1.6} />
								<clipPath id="apv"><polygon points={poly(fr)} /></clipPath>
								<g clipPath="url(#apv)"><image href={staticFile('img/app-approve.webp')} width={1078} height={746} transform={m} /></g>
							</g>
						);
					})()}
					{/* the lit parts, bloomed */}
					<g filter="url(#bloom)" style={{ mixBlendMode: 'screen' }} opacity={0.75}>
						{platLit > 0 && <polygon points={poly(plat)} fill="none" stroke={INK.fire} strokeWidth={4} opacity={0.6 * platLit} />}
						{racks.filter((r) => (lit[r.zone] ?? 0) > 0.02 && !(r.zone === 'agents' && AGENTS[r.i][1] === 'code')).map((r, i) => {
							const tier = r.zone === 'agents' ? AGENTS[r.i][1] : '';
							return <polygon key={i} points={poly([[r.x, r.y, r.h], [r.x + r.w, r.y, r.h], [r.x + r.w, r.y + r.d, r.h], [r.x, r.y + r.d, r.h]])} fill={tier && lit.gemini > 0.5 ? TIER[tier] : ZINK[r.zone]} opacity={0.5 * (lit[r.zone] ?? 0)} />;
						})}
						{callK > 0 && callK < 1 && <path d={callD} fill="none" stroke={INK.mint} strokeWidth={10} strokeDasharray={`${callLen * 0.22} ${callLen * 2}`} strokeDashoffset={-callLen * (callK * 1.25 - 0.22)} />}
					</g>
				</g>
			</svg>}
			{layer !== 'world' && <>
			<Tag x={4.4} y={16.4} text="Firebase Hosting" ink={INK.fire} a={platLit} dy={26} />
			{SCREENS.map((s, i) => <Tag key={s.id} x={s.x + s.w / 2} y={s.y} z={s.z0 + s.h + 0.25} text={s.b} ink="rgba(255,159,69,0.6)" a={still ? 0 : fade(t, CUE.apps + 0.35 + i * 0.13, 5.35, 0.3, 0.3)} />)}
			<Tag x={10.4} y={10.0} z={0} text="Cloud Run" sub="backend-api" ink={INK.blue} a={lit.run * (still ? 1 : fade(t, CUE.run, 99))} dy={34} />
			<Tag x={SQL.x} y={SQL.y + 0.8} text="Cloud SQL" sub="the record" ink={INK.blue} a={lit.sql} dy={30} />
			<Tag x={13} y={SPINE.y + 0.2} text="Pub/Sub" ink={INK.mint} a={Math.max(endA * 0.85, lit.pubsub)} dy={20} />
			<Tag x={14.4} y={5.4} z={0} text="Nine AI agents" sub="ADK" ink={INK.mint} a={Math.max(endA * 0.85, lit.agents)} dy={still ? 40 : -20} dx={still ? 170 : 0} />
			<Tag x={20.8} y={7.6} z={2.1} text="BigQuery" ink={INK.blue} a={Math.max(endA * 0.85, lit.bq)} dy={-20} />
			<Tag x={GCS.x} y={GCS.y} z={1.4} text="Cloud Storage" ink={INK.blue} a={Math.max(endA * 0.85, lit.gcs)} dy={-24} />
			<Tag x={21.0} y={1.6} z={2.8} text="Gemini" sub="Agent Platform" ink={INK.violet} a={Math.max(endA * 0.85, lit.gemini)} dy={-22} />
			<Tag x={SCHED.x} y={SCHED.y} z={2.7} text="Scheduler" ink={INK.blue} a={Math.max(endA * 0.85, lit.sched)} dy={-22} />
			{still && lit.agents > 0.5 && lit.vault < 0.5 && AGENTS.map(([n, tier], i) => {
				const r = racks.filter((q) => q.zone === 'agents')[i]; const below = false; const [px, py] = S(r.x + r.w / 2, r.y + r.d * 0.5, r.h);
				const up = -12;
				return (
					<div key={n} style={{ position: 'absolute', left: px, top: py + up, translate: below ? '-50% 0' : '-50% -100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
						<b style={{ font: "650 13.5px/1 'Geist'", color: INK.ink, padding: '4px 7px', borderRadius: 7, background: 'rgba(4,12,9,0.85)', border: '1px solid rgba(115,201,157,0.25)', whiteSpace: 'nowrap' }}>{n}</b>
						<i style={{ font: "700 11.5px/1 'Geist'", fontStyle: 'normal', padding: '3px 7px', borderRadius: 999, whiteSpace: 'nowrap', color: tier === 'code' ? '#dfe7e2' : tier === 'pro' ? '#ead9ff' : INK.blue2, background: tier === 'code' ? 'rgba(20,24,22,0.95)' : tier === 'pro' ? 'rgba(40,24,56,0.95)' : 'rgba(14,26,48,0.95)', border: `1.2px solid ${TIER[tier]}` }}>{tier === 'code' ? 'plain code' : tier === 'pro' ? '3.1 Pro' : '3.8 Flash'}</i>
					</div>
				);
			})}
			{lit.vault > 0.5 && <Tag x={12.2} y={VAULT.y0} z={VAULT.h + 0.2} text="The money stays in the API" sub="₹16,917.10, worked out by the API" ink={INK.amber} a={lit.vault} dy={-30} />}
			{lit.yes > 0.5 && <Tag x={DESK.x + DESK.w / 2} y={DESK.y + DESK.d} z={0} text="A person's yes" sub="Priya approves" ink={INK.amber} a={lit.yes} dy={30} />}
			{!still && (
				<>
					<Note id="firebase" t0={CUE.firebase} t1={5.45} x={1240} y={170} anchor={[anchorFire[0] + 20, anchorFire[1]]} side="r" />
					<Note id="run" t0={CUE.run} t1={7.75} x={110} y={120} anchor={anchorRun} side="l" />
					<Note id="sql" t0={CUE.sql + 0.05} t1={9.05} x={1260} y={130} anchor={anchorSql} side="r" />
					<div style={{ position: 'absolute', left: lerp(960, 76, dock), top: lerp(392, 40, dock), translate: `${lerp(-50, 0, dock)}% 0` }}>
						<ActTitle k="Under the hood" n="1 / 3" h="All on Google Cloud." t0={CUE.t01 + 0.1} t1={9.4} inline size={lerp(104, 44, dock)} align={dock < 0.5 ? 'center' : 'left'} />
					</div>
					<IndexBar t0={3.4} />
				</>
			)}
			<Finish vignette={0.55} />
			</>}
		</AbsoluteFill>
	);
};

export const Blueprint: React.FC = () => {
	const { fps } = useVideoConfig();
	const ev = (src: string, t: number, v = 1) => <Audio key={`${src}${t}`} src={staticFile(`sfx/${src}.wav`)} trimBefore={0} from={Math.round(t * fps)} volume={v} premountFor={fps} />;
	return (
		<AbsoluteFill>
			<CameraMotionBlur samples={6} shutterAngle={160}>
				<BlueprintScene layer="world" />
			</CameraMotionBlur>
			<BlueprintScene layer="ui" />
			<Audio src={staticFile('audio/voice.wav')} premountFor={fps} />
			<Audio src={staticFile('sfx/hum.wav')} volume={0.8} premountFor={fps} />
			{ev('riser', 0.1, 0.9)}{ev('sparkle', 0.5)}{ev('glint', 2.25)}
			{ev('whoosh', 3.3)}{[0, 1, 2, 3].map((i) => ev('pop', CUE.apps + i * 0.13))}{ev('chime', CUE.firebase)}
			{ev('whoosh-short', CUE.api)}{ev('land', CUE.api + 0.95)}{ev('compute', CUE.run + 0.05)}
			{[0, 1, 2].map((k) => ev('thud', CUE.sql + k * 0.12, 0.6))}{ev('land', CUE.record + 0.4)}{ev('whoosh', 8.85)}
		</AbsoluteFill>
	);
};
export const B_END = TEST_END;
