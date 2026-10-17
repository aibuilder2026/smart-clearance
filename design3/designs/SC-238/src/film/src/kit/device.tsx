// SC-238's device kit: the app's own screens, pixel-sharp, in the device the person in the shot is holding. A window is
// a production recording's device screen (media.py crops it at its own pixels, 60 fps), drawn in a laptop, a tablet, a
// phone or a monitor, and lifted out of the device in the footage (its rect there) so the screen people watch is the
// screen we show. Rings mark what the voice names, in the recording's own pixels, so they land where the app drew it;
// a card beside a ring says why it matters, its caret on the ring.
import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion';
import { EASE, EASE_IO, GREEN, DISPLAY, Icon, MONO, SANS, Media, clamp, lerp, ramp, springAt } from './core';
import { FPS, media } from '../edl';
import { useQuads } from '../scenes/tracks';

export type DevKind = 'laptop' | 'tablet' | 'phone' | 'monitor';
export type Rect = [number, number, number, number];
export type RingDef = { t0: number; t1: number; r: Rect; tone?: 'mint' | 'amber' | 'red'; pad?: number };
export type CardDef = { t0: number; t1: number; at: Rect; side?: 'l' | 'r'; k: string; h: string; s?: string; tone?: 'mint' | 'amber' | 'red'; icon?: string; w?: number; dy?: number };

const TONES = { mint: { line: '#34d380', glow: 'rgba(52,211,128,0.45)', fill: 'rgba(52,211,128,0.08)', k: '#73e0a6' }, amber: { line: '#f7c04a', glow: 'rgba(247,192,74,0.45)', fill: 'rgba(247,192,74,0.10)', k: '#ffd98a' }, red: { line: '#ff6b57', glow: 'rgba(255,107,87,0.45)', fill: 'rgba(255,107,87,0.10)', k: '#ffb3a8' } };

/** the frame around a screen of the content's own aspect, the screen `sh` pixels tall (or `sw` wide) */
export function geom(kind: DevKind, srcW: number, srcH: number, size: { sh?: number; sw?: number }) {
	const asp = srcW / srcH;
	let sw = size.sw ?? (size.sh! * asp), sh = size.sh ?? (size.sw! / asp);
	sw = Math.round(sw); sh = Math.round(sh);
	const b = kind === 'phone' ? { t: 14, l: 14, r: 14, bo: 14, rad: 58, srad: 46 } : kind === 'tablet' ? { t: 24, l: 24, r: 24, bo: 24, rad: 40, srad: 18 }
		: kind === 'laptop' ? { t: 22, l: 18, r: 18, bo: 30, rad: 20, srad: 8 } : { t: 18, l: 18, r: 18, bo: 34, rad: 14, srad: 6 };
	return { kind, sw, sh, fw: sw + b.l + b.r, fh: sh + b.t + b.bo, b, scale: sw / srcW };
}

/** the device's body: bezel, glass edge, the laptop's deck or the monitor's stand, a soft shadow under it */
export const Body: React.FC<{ g: ReturnType<typeof geom>; lift: number }> = ({ g, lift }) => {
	const { kind, fw, fh, b } = g;
	const metal = kind === 'phone' ? 'linear-gradient(160deg,#2a2f2d,#121514 55%,#1d2120)' : kind === 'tablet' ? 'linear-gradient(160deg,#2b302e,#151817 60%,#202422)' : 'linear-gradient(180deg,#1c201f,#0e1110)';
	return (
		<>
			<div style={{ position: 'absolute', left: fw * 0.06, right: fw * 0.06, top: fh * 0.9, height: fh * 0.16, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', filter: `blur(${28 + 18 * lift}px)`, transform: `translateY(${16 + 26 * lift}px)` }} />
			<div style={{ position: 'absolute', inset: 0, borderRadius: b.rad, background: metal, boxShadow: `0 ${18 + 30 * lift}px ${50 + 50 * lift}px rgba(0,0,0,${0.45 + 0.15 * lift}), inset 0 0 0 1.5px rgba(255,255,255,0.10), inset 0 1px 0 rgba(255,255,255,0.18)` }} />
			{kind === 'laptop' && (
				<div style={{ position: 'absolute', left: -fw * 0.07, width: fw * 1.14, top: fh - 2, height: 26, borderRadius: '0 0 18px 18px', background: 'linear-gradient(180deg,#3a403e,#1b1f1e 70%,#0f1211)', boxShadow: '0 22px 40px rgba(0,0,0,0.5)' }}>
					<div style={{ position: 'absolute', left: '50%', top: 0, width: 190, height: 9, marginLeft: -95, borderRadius: '0 0 10px 10px', background: '#141716' }} />
				</div>
			)}
			{kind === 'monitor' && (
				<>
					<div style={{ position: 'absolute', left: fw / 2 - 70, width: 140, top: fh, height: 110, background: 'linear-gradient(90deg,#1a1e1d,#2c3230,#1a1e1d)' }} />
					<div style={{ position: 'absolute', left: fw / 2 - 210, width: 420, top: fh + 104, height: 18, borderRadius: 9, background: '#202524', boxShadow: '0 18px 30px rgba(0,0,0,0.5)' }} />
				</>
			)}
		</>
	);
};

export type WindowProps = {
	name: string; kind: DevKind; t0: number; t1: number;
	/** where the screen ends up: its centre and the screen's height (or width) */
	cx: number; cy: number; sh?: number; sw?: number;
	/** the device in the footage it lifts out of (film px), and when the lift starts (scene s; default t0) */
	from?: Rect; liftAt?: number; liftDur?: number;
	/** or the tracked device itself: the over-the-shoulder shot's media (its quads, film px, 60 fps) and its start */
	quads?: string; quadsT0?: number; enter?: 'lift' | 'none';
	/** how it leaves: 'down' into its device, 'push' through, or just ends at t1 */
	out?: 'none' | 'down' | 'away'; outDur?: number;
	rings?: RingDef[]; cards?: CardDef[]; tilt?: number; children?: React.ReactNode; zoom?: { t0: number; t1: number; r: Rect; k?: number }[];
};

/** a recording's screen in its device, lifted out of the footage and held, rings and cards on what the voice names */
export const Window: React.FC<WindowProps> = (p) => {
	const f0 = Math.round(p.t0 * FPS), n = Math.max(1, Math.round(p.t1 * FPS) - f0);
	return <Sequence from={f0} durationInFrames={n} layout="none"><WindowInner {...p} /></Sequence>;
};
const WindowInner: React.FC<WindowProps> = ({ name, kind, t0, t1, cx, cy, sh, sw, from, liftAt, liftDur = 0.75, out = 'none', outDur = 0.45, rings = [], cards = [], tilt = 0, children, zoom = [], quads, quadsT0, enter = 'lift' }) => {
	const t = useCurrentFrame() / FPS + t0;   // scene seconds
	const m = media(name); const [, , srcW, srcH] = m.rect!;
	const g = geom(kind, srcW, srcH, sh ? { sh } : { sw: sw! });
	const Q = useQuads(quads);
	const la = liftAt ?? t0;
	const k = enter === 'none' ? 1 : (from || Q) ? springAt(t, la, FPS, 20, 115) : clamp((t - la) / 0.35);
	const lift = clamp(k);
	// the screen's corners where it ends up (film px)
	const X0 = cx - g.sw / 2, Y0 = cy - g.sh / 2;
	let tgt: number[][] = [[X0, Y0], [X0 + g.sw, Y0], [X0 + g.sw, Y0 + g.sh], [X0, Y0 + g.sh]];
	// a slow camera drift on the held screen: it is never a resting picture
	const hold = clamp((t - la - liftDur) / Math.max(1, t1 - la - liftDur));
	let S = 1 + 0.03 * EASE_IO(hold);
	let zx = 0, zy = 0, op = 1, dy = 0;
	for (const z of zoom) {
		const kz = Math.min(ramp(t, z.t0, z.t0 + 0.7, EASE_IO), 1 - ramp(t, z.t1 - 0.6, z.t1, EASE_IO));
		if (kz <= 0) continue;
		const zk = z.k ?? 1.55; const [rx, ry, rw, rh] = z.r;
		const ccx = (rx + rw / 2) * g.scale - g.sw / 2, ccy = (ry + rh / 2) * g.scale - g.sh / 2;
		const zs = lerp(1, zk, kz); S *= zs; zx = -ccx * (zs - 1); zy = -ccy * (zs - 1);
	}
	if (out !== 'none') {
		const ko = clamp((t1 - t) / outDur); const u = 1 - EASE_IO(ko);
		if (out === 'down') dy = u * 900;
		if (out === 'away') { S *= lerp(1, 1.25, u); op *= 1 - u; }
	}
	tgt = tgt.map(([x, y]) => [cx + (x - cx) * S + zx, cy + (y - cy) * S + zy + dy]);
	// where it starts: the device's quad in the footage (tracked), or a rect there, or just below its place
	let src0: number[][] | null = null;
	if (Q) { const fi = Math.round((la - (quadsT0 ?? t0)) * FPS); const q = Q.quads[Math.max(0, Math.min(Q.quads.length - 1, fi))]; src0 = q; }
	else if (from) { const [fx, fy, fw, fh] = from; src0 = [[fx, fy], [fx + fw, fy], [fx + fw, fy + fh], [fx, fy + fh]]; }
	let corners = tgt;
	if (src0 && lift < 1) corners = tgt.map(([x, y], i) => [lerp(src0![i][0], x, k), lerp(src0![i][1], y, k)]);
	if (!src0 && enter === 'lift') { op *= lift; corners = corners.map(([x, y]) => [x, y + (1 - EASE(lift)) * 40]); }
	if (src0) op *= clamp((t - la) / 0.06);
	const M = rectToQuad(g.sw, g.sh, corners);
	const bodyA = src0 ? EASE(clamp((k - 0.15) / 0.6)) : 1;
	return (
		<AbsoluteFill style={{ pointerEvents: 'none' }}>
			<div style={{ position: 'absolute', left: 0, top: 0, width: g.sw, height: g.sh, transformOrigin: '0 0', transform: M, opacity: op }}>
				<div style={{ position: 'absolute', left: -g.b.l, top: -g.b.t, width: g.fw, height: g.fh, opacity: bodyA }}><Body g={g} lift={lift} /></div>
				<div style={{ position: 'absolute', left: 0, top: 0, width: g.sw, height: g.sh, borderRadius: g.b.srad * bodyA, overflow: 'hidden', background: '#f4f7f5' }}>
					<Media name={name} style={{ width: '100%', height: '100%', objectFit: 'fill' }} />
					{rings.map((r, i) => <Ring key={i} t={t} {...r} scale={g.scale} />)}
					{children}
					<div style={{ position: 'absolute', inset: 0, background: `linear-gradient(118deg, rgba(255,255,255,${0.05 + 0.06 * (1 - lift)}) 0%, rgba(255,255,255,0) 38%)`, pointerEvents: 'none' }} />
				</div>
				{kind === 'phone' && <div style={{ position: 'absolute', left: g.sw / 2 - 58, top: 10, width: 116, height: 32, borderRadius: 16, background: '#050706', opacity: bodyA }} />}
			</div>
			{cards.map((c, i) => <Card key={i} t={t} c={c} frame={{ x: cx - g.fw / 2, y: cy - g.fh / 2 + dy, fw: g.fw, fh: g.fh }} g={g} s={S} zx={zx} zy={zy} op={op * lift} />)}
		</AbsoluteFill>
	);
};

/** the CSS transform that carries a w × h box (origin at its top left) onto four corners: a projective map */
export function rectToQuad(w: number, h: number, q: number[][]): string {
	const src = [[0, 0], [w, 0], [w, h], [0, h]];
	const A: number[][] = [], b: number[] = [];
	for (let i = 0; i < 4; i++) {
		const [x, y] = src[i], [u, v] = q[i];
		A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
		A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
	}
	const hh = solve(A, b); if (!hh) return 'none';
	const [h0, h1, h2, h3, h4, h5, h6, h7] = hh;
	return `matrix3d(${h0}, ${h3}, 0, ${h6}, ${h1}, ${h4}, 0, ${h7}, 0, 0, 1, 0, ${h2}, ${h5}, 0, 1)`;
}
function solve(A: number[][], b: number[]): number[] | null {
	const n = b.length; const M = A.map((r, i) => [...r, b[i]]);
	for (let c = 0; c < n; c++) {
		let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
		if (Math.abs(M[p][c]) < 1e-12) return null;
		[M[c], M[p]] = [M[p], M[c]];
		for (let r = 0; r < n; r++) { if (r === c) continue; const f = M[r][c] / M[c][c]; for (let k2 = c; k2 <= n; k2++) M[r][k2] -= f * M[c][k2]; }
	}
	return M.map((r, i) => r[n] / r[i]);
}

/** a ring on a part of the screen: corner brackets close in on it, a soft glow pulses once, it holds while it is read */
export const Ring: React.FC<RingDef & { t: number; scale: number }> = ({ t, t0, t1, r, tone = 'mint', pad = 6, scale }) => {
	const a = Math.min(ramp(t, t0, t0 + 0.25), 1 - ramp(t, t1 - 0.25, t1)); if (a <= 0) return null;
	const T = TONES[tone];
	const [x, y, w, h] = r.map((v) => v * scale);
	const k = EASE(ramp(t, t0, t0 + 0.45));
	const P = pad + (1 - k) * 18;
	const pulse = ramp(t, t0 + 0.25, t0 + 1.1);
	const L = Math.min(26, w / 3, h / 3);
	const corner = (cx: number, cy: number, sx: number, sy: number) => <path d={`M ${cx + sx * L} ${cy} H ${cx} V ${cy + sy * L}`} fill="none" stroke={T.line} strokeWidth={3.4} strokeLinecap="round" />;
	const X0 = x - P, Y0 = y - P, X1 = x + w + P, Y1 = y + h + P;
	return (
		<svg style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', overflow: 'visible', opacity: a, pointerEvents: 'none' }}>
			<rect x={X0} y={Y0} width={X1 - X0} height={Y1 - Y0} rx={10} fill={T.fill} stroke={T.line} strokeOpacity={0.55 * k} strokeWidth={2} />
			<rect x={X0 - 6 * pulse} y={Y0 - 6 * pulse} width={X1 - X0 + 12 * pulse} height={Y1 - Y0 + 12 * pulse} rx={14} fill="none" stroke={T.line} strokeWidth={2} opacity={(1 - pulse) * 0.8} />
			{corner(X0, Y0, 1, 1)}{corner(X1, Y0, -1, 1)}{corner(X0, Y1, 1, -1)}{corner(X1, Y1, -1, -1)}
		</svg>
	);
};

/** a card beside the window, its caret on the ringed part: why it matters, in a line */
const Card: React.FC<{ t: number; c: CardDef; frame: { x: number; y: number; fw: number; fh: number }; g: ReturnType<typeof geom>; s: number; zx: number; zy: number; op: number }> = ({ t, c, frame, g, s, zx, zy, op }) => {
	const a = Math.min(ramp(t, c.t0, c.t0 + 0.3), 1 - ramp(t, c.t1 - 0.3, c.t1)) * op; if (a <= 0) return null;
	const T = TONES[c.tone ?? 'mint'];
	const sp = springAt(t, c.t0, FPS, 15, 150);
	// the ringed part in film px (the frame scales about its centre)
	const fcx = frame.x + frame.fw / 2, fcy = frame.y + frame.fh / 2;
	const px = (sx: number) => fcx + (g.b.l + sx * g.scale - frame.fw / 2) * s + zx;
	const py = (sy: number) => fcy + (g.b.t + sy * g.scale - frame.fh / 2) * s + zy;
	const [rx, ry, rw, rh] = c.at;
	const side = c.side ?? 'r';
	const ax = side === 'r' ? px(rx + rw) + 10 : px(rx) - 10, ay = py(ry + rh / 2);
	const w = c.w ?? 440;
	const right = frame.x + frame.fw / 2 + (frame.fw / 2) * s;
	const left = frame.x + frame.fw / 2 - (frame.fw / 2) * s;
	const cx = side === 'r' ? Math.min(1920 - w - 56, right + 46) : Math.max(56, left - 46 - w);
	const cy = Math.max(70, Math.min(1080 - 250, ay - 70 + (c.dy ?? 0)));
	const ex = side === 'r' ? cx : cx + w, ey = cy + 46;
	const lead = ramp(t, c.t0 + 0.1, c.t0 + 0.5, EASE);
	const path = `M ${ex} ${ey} C ${(ex + ax) / 2} ${ey}, ${(ex + ax) / 2} ${ay}, ${ax} ${ay}`;
	return (
		<>
			<svg width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0, opacity: a, overflow: 'visible' }}>
				<path d={path} fill="none" stroke={T.line} strokeWidth={2.4} strokeLinecap="round" strokeDasharray={1400} strokeDashoffset={1400 * (1 - lead)} />
				<circle cx={ax} cy={ay} r={5.5 * clamp(lead * 3)} fill={T.line} />
			</svg>
			<div style={{ position: 'absolute', left: cx, top: cy, width: w, padding: '18px 22px 18px 20px', borderRadius: 18, boxSizing: 'border-box', opacity: a,
				transform: `translate(${(1 - sp) * (side === 'r' ? 22 : -22)}px, ${(1 - sp) * 10}px)`, background: 'linear-gradient(180deg, rgba(9,24,17,0.92), rgba(5,14,10,0.92))',
				border: `1.5px solid ${T.line}55`, boxShadow: '0 26px 70px rgba(0,0,0,0.5)', fontFamily: SANS, color: GREEN.ink }}>
				<div style={{ display: 'flex', alignItems: 'center', gap: 10, font: `700 13.5px/1 ${SANS}`, letterSpacing: 2.4, textTransform: 'uppercase', color: T.k }}>
					{c.icon && <Icon name={c.icon} size={17} color={T.line} sw={2.4} />}{c.k}
				</div>
				<div style={{ marginTop: 9, font: `700 30px/1.08 '${DISPLAY}'`, letterSpacing: -0.5 }}>{c.h}</div>
				{c.s && <div style={{ marginTop: 9, font: `500 18px/1.34 ${SANS}`, color: '#b5c8bd', opacity: ramp(t, c.t0 + 0.2, c.t0 + 0.55) }}>{c.s}</div>}
			</div>
		</>
	);
};

/** a phone's notification as it arrives: the app's own push, word for word, dropping in at the top of its screen */
export const Push: React.FC<{ t: number; t0: number; t1: number; title: string; body: string; app?: string; when?: string; x: number; y: number; w?: number; scale?: number }> = ({ t, t0, t1, title, body, app = 'Smart-Clearance', when = 'now', x, y, w = 560, scale = 1 }) => {
	const a = Math.min(ramp(t, t0, t0 + 0.18), 1 - ramp(t, t1 - 0.3, t1)); if (a <= 0) return null;
	const sp = springAt(t, t0, FPS, 14, 170);
	return (
		<div style={{ position: 'absolute', left: x, top: y, width: w, opacity: a, transform: `translateY(${(1 - sp) * -60}px) scale(${scale * lerp(0.92, 1, sp)})`, transformOrigin: '50% 0%',
			borderRadius: 26, padding: '16px 18px', boxSizing: 'border-box', background: 'rgba(246,249,247,0.86)', backdropFilter: 'blur(18px)',
			boxShadow: '0 22px 60px rgba(0,0,0,0.38)', fontFamily: SANS, color: '#13261d' }}>
			<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
				<Mark size={30} />
				<span style={{ font: `600 16px/1 ${SANS}`, letterSpacing: 0.2, color: '#3c5046', textTransform: 'uppercase' }}>{app}</span>
				<span style={{ marginLeft: 'auto', font: `500 15px/1 ${SANS}`, color: '#66786e' }}>{when}</span>
			</div>
			<div style={{ marginTop: 10, font: `700 20px/1.2 ${SANS}` }}>{title}</div>
			<div style={{ marginTop: 4, font: `500 18px/1.32 ${SANS}`, color: '#2b3d34' }}>{body}</div>
		</div>
	);
};

/** the Smart-Clearance mark, exactly design system v3's icon.svg: the green squircle and its sheen, the route's S from
 *  the godown dot to the amber pin. `draw` draws the route (0 → 1); `tile` false leaves only the route, in `color` */
export const MARK_S = 'M43.5 19H27a7 7 0 0 0 0 14h10a7 7 0 0 1 0 14H20.5';
let markN = 0;
export const Mark: React.FC<{ size?: number; color?: string; draw?: number; tile?: boolean; pin?: number }> = ({ size = 48, color = '#fff', draw = 1, tile = true, pin }) => {
	const [id] = React.useState(() => `mk${markN++}`);
	const pk = pin ?? clamp((draw - 0.86) * 7);
	return (
		<svg width={size} height={size} viewBox="0 0 64 64" style={{ display: 'block', overflow: 'visible' }}>
			<defs>
				<linearGradient id={`${id}g`} x1="8" y1="4" x2="58" y2="62" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#2fbf7f" /><stop offset=".55" stopColor="#178258" /><stop offset="1" stopColor="#0d5a3e" /></linearGradient>
				<linearGradient id={`${id}h`} x1="32" y1="2" x2="32" y2="34" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#fff" stopOpacity=".28" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
			</defs>
			{tile && <path d="M32 2C9.5 2 2 9.5 2 32s7.5 30 30 30 30-7.5 30-30S54.5 2 32 2Z" fill={`url(#${id}g)`} />}
			{tile && <path d="M32 3C10.5 3 3 10.5 3 31.5 10 22 22 18 32 18s22 4 29 13.5C61 10.5 53.5 3 32 3Z" fill={`url(#${id}h)`} />}
			<path d={MARK_S} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
			<circle cx="43.5" cy="19" r="3.4" fill={tile ? '#0d5a3e' : 'none'} stroke={color} strokeWidth={2.6} opacity={clamp(draw * 5)} />
			<circle cx="20.5" cy="47" r={5.2 * (0.6 + 0.4 * pk)} fill="#f7c04a" stroke={color} strokeWidth={2.2} opacity={pk} />
		</svg>
	);
};

/** a mono line the agent's run writes, typed in as it happens */
export const Typed: React.FC<{ t: number; t0: number; text: string; cps?: number; style?: React.CSSProperties }> = ({ t, t0, text, cps = 48, style }) => {
	const nch = Math.max(0, Math.floor((t - t0) * cps));
	if (t < t0) return null;
	return <div style={{ font: `500 17px/1.4 ${MONO}`, whiteSpace: 'pre', ...style }}>{text.slice(0, nch)}{nch < text.length && Math.floor(t * 3) % 2 === 0 ? '▍' : ''}</div>;
};
