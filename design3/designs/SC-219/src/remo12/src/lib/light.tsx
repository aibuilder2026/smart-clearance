// SC-219 cut 12's concept round 2: the light, Google-look pieces the bright hall carries. A product tile for each part
// (white glass, its icon in one of Google's four colours, the part's name, one line), cut 10's note restyled light, the
// act's title in dark ink, the stack's index in light pills, and a flow: B's drawn connection, running between two
// points the camera carries, with a light travelling along it.
import React from 'react';
import { evolvePath } from '@remotion/paths';
import { useVideoConfig } from 'remotion';
import { CUE, EASE, Icon, INDEX, NOTES, clamp, fade, ramp, springAt, useT } from './base';

export const G = { blue: '#4285F4', red: '#EA4335', yellow: '#FBBC05', green: '#34A853', violet: '#8e6bf2', ink: '#13261d', ink2: '#3c5046', ink3: '#66786e', brand: '#1f9d63' };
export type GTone = 'blue' | 'red' | 'yellow' | 'green' | 'violet';

/** a part's product tile beside it: icon, name, a line; in on its word with a spring, a leader to the part */
export const Tile: React.FC<{ icon: string; name: string; line: string; tone: GTone; t0: number; t1: number; x: number; y: number; anchor?: [number, number]; side?: 'l' | 'r'; w?: number }> = ({ icon, name, line, tone, t0, t1, x, y, anchor, side = 'r', w = 330 }) => {
	const t = useT(); const { fps } = useVideoConfig();
	const a = fade(t, t0, t1, 0.25, 0.35); if (a <= 0) return null;
	const sp = springAt(t, t0, fps, 15, 150); const ink = G[tone];
	const lead = anchor ? ramp(t, t0 + 0.05, t0 + 0.5) : 0;
	const ex = side === 'r' ? x : x + w, ey = y + 38;
	const path = anchor ? `M ${ex} ${ey} C ${(ex + anchor[0]) / 2} ${ey}, ${(ex + anchor[0]) / 2} ${anchor[1]}, ${anchor[0]} ${anchor[1]}` : '';
	const ev = anchor ? evolvePath(lead, path) : null;
	return (
		<>
			{anchor && (
				<svg width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0, opacity: a, overflow: 'visible' }}>
					<path d={path} fill="none" stroke={ink} strokeWidth={2.4} strokeLinecap="round" strokeDasharray={ev!.strokeDasharray} strokeDashoffset={ev!.strokeDashoffset} />
					<circle cx={anchor[0]} cy={anchor[1]} r={7 * clamp(lead * 3)} fill="#fff" stroke={ink} strokeWidth={3} />
				</svg>
			)}
			<div style={{
				position: 'absolute', left: x, top: y, width: w, display: 'flex', gap: 14, alignItems: 'center', padding: '14px 16px', borderRadius: 18, boxSizing: 'border-box',
				background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(19,38,29,0.08)', boxShadow: '0 22px 50px rgba(19,38,29,0.22), 0 2px 6px rgba(19,38,29,0.08)',
				opacity: a, translate: `${(1 - sp) * (side === 'r' ? 24 : -24)}px ${(1 - sp) * 10}px`, scale: String(0.94 + 0.06 * sp), fontFamily: 'Geist',
			}}>
				<div style={{ width: 52, height: 52, borderRadius: 14, display: 'grid', placeItems: 'center', flex: 'none', background: `${ink}1f`, color: ink }}><Icon name={icon} size={28} sw={2.2} /></div>
				<div style={{ minWidth: 0 }}>
					<div style={{ font: "700 23px/1.05 'Bricolage Grotesque'", color: G.ink, letterSpacing: -0.4, whiteSpace: 'nowrap' }}>{name}</div>
					<div style={{ marginTop: 5, font: "500 15.5px/1.3 'Geist'", color: G.ink2 }}>{line}</div>
				</div>
			</div>
		</>
	);
};

/** cut 10's note, light: white glass, the kicker in the part's colour, the words as cut 10 had them */
export const LightNote: React.FC<{ id: keyof typeof NOTES | string; tone: GTone; t0: number; t1: number; x: number; y: number; width?: number }> = ({ id, tone, t0, t1, x, y, width = 500 }) => {
	const t = useT(); const { fps } = useVideoConfig(); const d = NOTES[id]; const ink = G[tone];
	const a = fade(t, t0, t1, 0.28, 0.32); if (a <= 0) return null;
	const sp = springAt(t, t0, fps, 16, 140);
	return (
		<div style={{
			position: 'absolute', left: x, top: y, width, padding: '18px 22px', borderRadius: 20, boxSizing: 'border-box', opacity: a,
			translate: `0 ${(1 - sp) * 14}px`, background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(19,38,29,0.08)',
			boxShadow: '0 26px 60px rgba(19,38,29,0.22)', fontFamily: 'Geist', color: G.ink,
		}}>
			<div style={{ font: "700 13px/1 'Geist'", letterSpacing: 2.4, textTransform: 'uppercase', color: ink }}>{d.k}</div>
			<div style={{ marginTop: 8, font: "700 34px/1.02 'Bricolage Grotesque'", letterSpacing: -0.6 }}>{d.h}</div>
			<div style={{ marginTop: 10, font: "500 17.5px/1.32 'Geist'", color: G.ink2, opacity: ramp(t, t0 + 0.2, t0 + 0.55) }}>{d.s}</div>
			{d.chips && d.chips.length > 0 && (
				<div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 7 }}>
					{d.chips.map((c, i) => {
						const k = springAt(t, t0 + 0.35 + i * 0.08, fps, 14, 160);
						return <span key={c} style={{ font: "600 13.5px/1 ui-monospace, 'SF Mono', Menlo, monospace", padding: '6px 9px', borderRadius: 8, background: `${ink}14`, color: G.ink, opacity: clamp(k * 1.4) }}>{c}</span>;
					})}
				</div>
			)}
		</div>
	);
};

/** the act's title in dark ink with Google's four colours in a short bar over it */
export const LightTitle: React.FC<{ k: string; n: string; h: string; t0: number; t1: number; size?: number }> = ({ k, n, h, t0, t1, size = 44 }) => {
	const t = useT(); const a = fade(t, t0, t1, 0.25, 0.4); if (a <= 0) return null;
	const words = h.split(' ');
	return (
		<div style={{ position: 'relative', opacity: a }}>
			<div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
				{[G.blue, G.red, G.yellow, G.green].map((c, i) => <i key={c} style={{ width: 22 * ramp(t, t0 + i * 0.06, t0 + 0.35 + i * 0.06, EASE), height: 4, borderRadius: 2, background: c, display: 'inline-block' }} />)}
			</div>
			<div style={{ font: "700 14px/1 'Geist'", letterSpacing: 3, textTransform: 'uppercase', color: G.ink2, opacity: ramp(t, t0, t0 + 0.35) }}>{k} <span style={{ color: G.ink3 }}>{n}</span></div>
			<h1 style={{ margin: '10px 0 0', font: `700 ${size}px/1.04 'Bricolage Grotesque'`, letterSpacing: -size * 0.025, color: G.ink, whiteSpace: 'nowrap' }}>
				{words.map((w, i) => {
					const kk = ramp(t, t0 + 0.15 + i * 0.09, t0 + 0.6 + i * 0.09);
					return <span key={i} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom', paddingBottom: Math.round(size * 0.22), marginBottom: -Math.round(size * 0.22) }}><span style={{ display: 'inline-block', translate: `0 ${(1 - kk) * 110}%` }}>{w}</span>{i < words.length - 1 ? ' ' : ''}</span>;
				})}
			</h1>
		</div>
	);
};

/** the stack's parts along the foot, light pills */
export const LightIndex: React.FC<{ t0: number; at?: number }> = ({ t0, at }) => {
	const tNow = useT(); const t = at ?? tNow;
	const a = ramp(t, t0, t0 + 0.5); if (a <= 0) return null;
	const cur = INDEX.reduce((k, it, i) => (t >= it[3] ? i : k), -1);
	return (
		<div style={{ position: 'absolute', left: 0, right: 0, bottom: 34, display: 'flex', justifyContent: 'center', gap: 9, opacity: a }}>
			{INDEX.map(([id, ic, n, tt], i) => {
				const on = i === cur, done = t >= tt && !on;
				return (
					<div key={id} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 13px 8px 10px', borderRadius: 999, font: "600 15px/1 'Geist'", whiteSpace: 'nowrap',
						color: on ? '#fff' : done ? G.ink : G.ink3, background: on ? G.ink : 'rgba(255,255,255,0.82)', border: `1px solid ${on ? G.ink : 'rgba(19,38,29,0.1)'}`, boxShadow: '0 6px 16px rgba(19,38,29,0.12)' }}>
						<Icon name={ic} size={16} color={on ? '#fff' : done ? G.brand : G.ink3} />{n}
					</div>
				);
			})}
		</div>
	);
};

/** B's connection between two points the camera carries: it draws on, then a light runs along it, again and again */
export const Flow: React.FC<{ a: [number, number]; b: [number, number]; t0: number; t1?: number; color: string; lift?: number; width?: number; label?: string; pulses?: number }> = ({ a, b, t0, t1 = 99, color, lift = 120, width = 4, label, pulses = 3 }) => {
	const t = useT(); const vis = fade(t, t0, t1, 0.05, 0.35); if (vis <= 0) return null;
	const mx = (a[0] + b[0]) / 2, my = Math.min(a[1], b[1]) - lift;
	const d = `M ${a[0]} ${a[1]} Q ${mx} ${my} ${b[0]} ${b[1]}`;
	const draw = ramp(t, t0, t0 + 0.6, EASE); const ev = evolvePath(draw, d);
	const L = parseFloat(String(evolvePath(1, d).strokeDasharray).split(' ')[0]) || 1;
	const runs = Array.from({ length: pulses }, (_, i) => {
		const p = ((t - t0 - 0.35 - i * 0.55) / 1.1); if (p <= 0) return null; const q = p % 1;
		return <path key={i} d={d} fill="none" stroke="#ffffff" strokeWidth={width + 2} strokeLinecap="round" strokeDasharray={`${L * 0.08} ${L * 2}`} strokeDashoffset={-L * (q * 1.1 - 0.08)} style={{ filter: `drop-shadow(0 0 8px ${color})` }} />;
	});
	return (
		<svg width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: vis }}>
			<path d={d} fill="none" stroke={color} strokeWidth={width + 8} strokeLinecap="round" opacity={0.18} strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} />
			<path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} />
			{draw >= 1 && runs}
			<circle cx={a[0]} cy={a[1]} r={6} fill="#fff" stroke={color} strokeWidth={3} />
			{draw > 0.95 && <circle cx={b[0]} cy={b[1]} r={6} fill="#fff" stroke={color} strokeWidth={3} />}
			{label && draw > 0.6 && (
				<foreignObject x={mx - 90} y={my - 8} width={180} height={34}>
					<div style={{ display: 'flex', justifyContent: 'center' }}><span style={{ font: "600 13.5px/1 ui-monospace, 'SF Mono', Menlo, monospace", padding: '6px 9px', borderRadius: 8, background: '#fff', color: G.ink, boxShadow: '0 6px 16px rgba(19,38,29,0.18)', border: `1px solid ${color}55`, whiteSpace: 'nowrap', opacity: ramp(t, t0 + 0.4, t0 + 0.7) }}>{label}</span></div>
				</foreignObject>
			)}
		</svg>
	);
};

export const CUE_ = CUE;
