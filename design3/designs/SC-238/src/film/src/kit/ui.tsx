// SC-238's on-screen words: the journey's clock, an agent at work (its orb, its name, its stop and model, the calls it
// makes, typed as they run), the WRITTEN OFF stamp, a line of type rising word by word, a checklist ticking, and a
// figure with its working. Every one comes in on its word, holds while it is read, and leaves; nothing loops.
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { AMBER, DISPLAY, EASE, GREEN, Icon, MONO, RED, SANS, clamp, lerp, ramp, springAt } from './core';
import { Typed } from './device';
import { FPS } from '../edl';

/** SC-245: where the corner furniture sits: the foot's right, above YouTube's controls and clear of its header */
export const SAFE = { right: 56, bottom: 200 } as const;

const fadeIO = (t: number, t0: number, t1: number, fi = 0.3, fo = 0.35) => Math.min(ramp(t, t0, t0 + fi), 1 - ramp(t, t1 - fo, t1));

/** the journey's clock: Day n · hh:mm, at the foot's right (SC-245: clear of YouTube's header over the top of the frame); a new time flips in */
export const Clock: React.FC<{ t: number; t0: number; t1: number; label: string; sub?: string; flip?: number }> = ({ t, t0, t1, label, sub, flip = 1 }) => {
	const a = fadeIO(t, t0, t1, 0.35, 0.4); if (a <= 0) return null;
	const sp = springAt(t, t0, FPS, 16, 140);
	return (
		<div style={{ position: 'absolute', right: SAFE.right, bottom: SAFE.bottom, display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px 11px 14px', borderRadius: 999, opacity: a,
			transform: `translateY(${(1 - sp) * 16}px)`, background: 'rgba(6,18,12,0.72)', border: '1.5px solid rgba(95,227,161,0.42)', backdropFilter: 'blur(8px)',
			boxShadow: '0 14px 40px rgba(0,0,0,0.35)', fontFamily: SANS, color: GREEN.ink }}>
			<Icon name="clock" size={20} color={GREEN.mint2} sw={2.3} />
			<span style={{ font: `700 21px/1 ${SANS}`, letterSpacing: 0.4, fontVariantNumeric: 'tabular-nums', display: 'inline-block', opacity: flip, transform: `translateY(${(1 - flip) * 8}px)` }}>{label}</span>
			{sub && <span style={{ font: `500 17px/1 ${SANS}`, color: '#9fb7aa' }}>{sub}</span>}
		</div>
	);
};

export type Tier = 'pro' | 'flash' | 'rules' | 'you';
const TIER: Record<Tier, { ink: string; glow: string; model: string; icon: string }> = {
	pro: { ink: '#c58af9', glow: 'rgba(197,138,249,0.5)', model: 'Gemini 3.1 Pro', icon: 'sparkles' },
	flash: { ink: '#8ab4f8', glow: 'rgba(138,180,248,0.5)', model: 'Gemini 3.8 Flash', icon: 'zap' },
	rules: { ink: '#aab6b0', glow: 'rgba(170,182,176,0.4)', model: 'plain rules, no model', icon: 'braces' },
	you: { ink: AMBER, glow: 'rgba(247,192,74,0.5)', model: 'a person', icon: 'hand' },
};
/** an agent at work, at the foot's right over the clock (SC-245): its orb turning while it runs, its name, its stop and model, and its calls typed in */
export const AgentHead: React.FC<{ t: number; t0: number; t1: number; name: string; stop: string; tier: Tier; icon: string; calls?: [number, string][]; done?: number; x?: number; y?: number }> = ({ t, t0, t1, name, stop, tier, icon, calls = [], done, x, y }) => {
	const a = fadeIO(t, t0, t1, 0.3, 0.4); if (a <= 0) return null;
	const T = TIER[tier];
	const sp = springAt(t, t0, FPS, 15, 150);
	const working = done === undefined || t < done;
	const spin = (t - t0) * 140;
	const ok = done !== undefined ? ramp(t, done, done + 0.3) : 0;
	return (
		<div style={{ position: 'absolute', ...(x !== undefined ? { left: x, top: y } : { right: SAFE.right, bottom: SAFE.bottom + 70 }), display: 'flex', flexDirection: x !== undefined ? 'column' : 'column-reverse', alignItems: x !== undefined ? 'flex-start' : 'flex-end', opacity: a, transform: `translateX(${(1 - sp) * (x !== undefined ? -30 : 30)}px)`, fontFamily: SANS, color: GREEN.ink }}>
			<div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 22px 12px 12px', borderRadius: 999, background: 'rgba(6,16,11,0.74)',
				border: `1.5px solid ${T.ink}66`, backdropFilter: 'blur(10px)', boxShadow: `0 16px 46px rgba(0,0,0,0.4), 0 0 ${working ? 26 : 10}px ${T.glow}` }}>
				<div style={{ position: 'relative', width: 54, height: 54 }}>
					<div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `radial-gradient(circle at 35% 30%, ${T.ink}, ${T.ink}55 60%, rgba(0,0,0,0.2))`, boxShadow: `0 0 ${18 + 10 * Math.sin((t - t0) * 6) * (working ? 1 : 0)}px ${T.glow}` }} />
					<svg width={54} height={54} style={{ position: 'absolute', inset: 0, transform: `rotate(${working ? spin : 0}deg)`, opacity: working ? 1 : 0.0 }}>
						<circle cx={27} cy={27} r={25} fill="none" stroke={T.ink} strokeWidth={2.4} strokeDasharray="38 120" strokeLinecap="round" />
					</svg>
					<div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#0b1410' }}><Icon name={ok > 0.5 ? 'check' : icon} size={26} sw={2.5} /></div>
				</div>
				<div>
					<div style={{ font: `700 28px/1 '${DISPLAY}'`, letterSpacing: -0.4 }}>{name}</div>
					<div style={{ marginTop: 6, display: 'flex', gap: 10, alignItems: 'center', font: `600 14px/1 ${SANS}`, letterSpacing: 1.8, textTransform: 'uppercase', color: '#9fb7aa' }}>
						<span>{stop}</span><span style={{ width: 4, height: 4, borderRadius: 2, background: '#56685e' }} /><span style={{ color: T.ink }}>{T.model}</span>
					</div>
				</div>
			</div>
			{calls.length > 0 && (
				<div style={{ margin: x !== undefined ? '12px 0 0 22px' : '0 22px 12px 0', maxWidth: 480, padding: '12px 16px', borderRadius: 14, background: 'rgba(4,10,7,0.66)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)' }}>
					{calls.map(([ct, line], i) => <Typed key={i} t={t} t0={ct} text={line} style={{ color: line.startsWith('✓') ? GREEN.mint2 : '#cfe2d8', fontSize: 16.5 }} />)}
				</div>
			)}
		</div>
	);
};

/** the stamp: WRITTEN OFF, thumped down at an angle, the frame jolted under it */
export const Stamp: React.FC<{ t: number; t0: number; t1?: number; text?: string; sub?: string; x: number; y: number; size?: number; rot?: number; ink?: string }> = ({ t, t0, t1 = 1e9, text = 'WRITTEN OFF', sub, x, y, size = 1, rot = -9, ink = RED }) => {
	if (t < t0 - 0.12) return null;
	const k = clamp((t - (t0 - 0.12)) / 0.12);        // it falls in 0.12 s and lands on t0
	const land = t >= t0 ? springAt(t, t0, FPS, 9, 260) : 0;
	const sc = t < t0 ? lerp(1.9, 1.0, k * k) : 1 + 0.04 * (1 - land);
	const a = Math.min(clamp(k * 2), 1 - ramp(t, t1 - 0.3, t1));
	return (
		<div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${sc * size})`, opacity: a, mixBlendMode: 'normal' }}>
			<div style={{ padding: '14px 30px 12px', border: `7px solid ${ink}`, borderRadius: 14, color: ink, font: `800 74px/1 '${DISPLAY}'`, letterSpacing: 4, whiteSpace: 'nowrap',
				background: 'rgba(40,6,4,0.18)', textShadow: '0 2px 0 rgba(0,0,0,0.2)', boxShadow: `0 0 0 3px ${ink}33 inset`, maskImage: 'radial-gradient(circle at 30% 40%, #000 70%, rgba(0,0,0,0.82) 100%)' }}>
				{text}
				{sub && <div style={{ marginTop: 8, font: `800 46px/1 '${DISPLAY}'`, letterSpacing: 1, textAlign: 'center' }}>{sub}</div>}
			</div>
		</div>
	);
};
/** the frame's jolt when a stamp lands (a translate to wrap the shot in) */
export const jolt = (t: number, t0: number) => {
	if (t < t0 || t > t0 + 0.35) return 'none';
	const u = (t - t0) / 0.35; const e = Math.exp(-6 * u) * Math.sin(u * 40);
	return `translate(${(e * 7).toFixed(2)}px, ${(e * 10).toFixed(2)}px)`;
};

/** a line of type: its words rise out of a mask one by one */
export const Rise: React.FC<{ t: number; t0: number; t1?: number; text: string; size?: number; weight?: number; color?: string; font?: string; step?: number; style?: React.CSSProperties; align?: 'left' | 'center' | 'right'; marks?: string[]; markColor?: string }> = ({ t, t0, t1 = 1e9, text, size = 64, weight = 720, color = GREEN.ink, font = DISPLAY, step = 0.075, style, align = 'left', marks = [], markColor = GREEN.mint2 }) => {
	const a = 1 - ramp(t, t1 - 0.35, t1); if (t < t0 || a <= 0) return null;
	const words = text.split(' ');
	return (
		<div style={{ font: `${weight} ${size}px/1.08 '${font}'`, letterSpacing: -size * 0.018, color, textAlign: align, opacity: a, ...style }}>
			{words.map((w, i) => {
				const k = ramp(t, t0 + i * step, t0 + i * step + 0.5, EASE);
				const hi = marks.some((m) => w.toLowerCase().replace(/[^a-z0-9₹%,.-]/g, '').startsWith(m.toLowerCase()));
				return (
					<span key={i} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom', paddingBottom: Math.round(size * 0.18), marginBottom: -Math.round(size * 0.18) }}>
						<span style={{ display: 'inline-block', transform: `translateY(${(1 - k) * 105}%)`, color: hi ? markColor : undefined }}>{w}</span>{i < words.length - 1 ? ' ' : ''}
					</span>
				);
			})}
		</div>
	);
};

/** a kicker: a small caps line with the brand's dot */
export const Kicker: React.FC<{ t: number; t0: number; t1?: number; text: string; color?: string; style?: React.CSSProperties }> = ({ t, t0, t1 = 1e9, text, color = '#73e0a6', style }) => {
	const a = Math.min(ramp(t, t0, t0 + 0.35), 1 - ramp(t, t1 - 0.35, t1)); if (a <= 0) return null;
	return (
		<div style={{ display: 'flex', alignItems: 'center', gap: 12, font: `700 16px/1 ${SANS}`, letterSpacing: 3.2, textTransform: 'uppercase', color, opacity: a, ...style }}>
			<i style={{ width: 9, height: 9, borderRadius: 5, background: GREEN.mint, display: 'inline-block' }} />{text}
		</div>
	);
};

/** a checklist that ticks as the work is done: each item's tick lands at its time */
export const Checks: React.FC<{ t: number; t0: number; t1: number; title?: string; items: [number, string][]; x: number; y: number; w?: number; tone?: 'mint' | 'amber' }> = ({ t, t0, t1, title, items, x, y, w = 520, tone = 'mint' }) => {
	const a = fadeIO(t, t0, t1); if (a <= 0) return null;
	const sp = springAt(t, t0, FPS, 16, 140);
	const ink = tone === 'mint' ? GREEN.mint : AMBER;
	return (
		<div style={{ position: 'absolute', left: x, top: y, width: w, padding: '20px 24px', boxSizing: 'border-box', borderRadius: 20, opacity: a, transform: `translateY(${(1 - sp) * 18}px)`,
			background: 'linear-gradient(180deg, rgba(9,24,17,0.9), rgba(5,14,10,0.9))', border: '1.5px solid rgba(95,227,161,0.32)', boxShadow: '0 26px 70px rgba(0,0,0,0.45)', fontFamily: SANS, color: GREEN.ink }}>
			{title && <div style={{ font: `700 14px/1 ${SANS}`, letterSpacing: 2.6, textTransform: 'uppercase', color: '#73e0a6', marginBottom: 14 }}>{title}</div>}
			{items.map(([it, line], i) => {
				const k = ramp(t, it, it + 0.3, EASE); const tick = springAt(t, it, FPS, 12, 220);
				return (
					<div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '8px 0', opacity: lerp(0.32, 1, k) }}>
						<div style={{ width: 28, height: 28, borderRadius: 14, flex: 'none', display: 'grid', placeItems: 'center', background: k > 0.01 ? ink : 'rgba(255,255,255,0.08)', transform: `scale(${lerp(0.6, 1, tick)})`, color: '#06140d' }}>
							{k > 0.01 && <Icon name="check" size={18} sw={3} />}
						</div>
						<div style={{ font: `500 21px/1.32 ${SANS}` }}>{line}</div>
					</div>
				);
			})}
		</div>
	);
};

/** a soft scrim so words read over footage: from one side, or the foot */
export const Scrim: React.FC<{ side?: 'l' | 'r' | 'b' | 't' | 'all'; a?: number; k?: number }> = ({ side = 'l', a = 0.7, k = 1 }) => {
	const bg = side === 'l' ? `linear-gradient(90deg, rgba(3,10,7,${a}) 0%, rgba(3,10,7,${a * 0.65}) 34%, rgba(3,10,7,0) 62%)`
		: side === 'r' ? `linear-gradient(270deg, rgba(3,10,7,${a}) 0%, rgba(3,10,7,${a * 0.65}) 34%, rgba(3,10,7,0) 62%)`
		: side === 'b' ? `linear-gradient(0deg, rgba(3,10,7,${a}) 0%, rgba(3,10,7,${a * 0.5}) 30%, rgba(3,10,7,0) 55%)`
		: side === 't' ? `linear-gradient(180deg, rgba(3,10,7,${a}) 0%, rgba(3,10,7,0) 40%)` : `rgba(3,10,7,${a})`;
	return <AbsoluteFill style={{ background: bg, opacity: k }} />;
};

/** a panel of figures that build line by line to a total: the bin's bill, or what each exit took */
export const Bill: React.FC<{ t: number; t0: number; t1: number; title: string; rows: { at: number; label: string; sub?: string; v: number; tone?: 'red' | 'mint' | 'mute' }[]; total?: { at: number; label: string; v: number; tone?: 'red' | 'mint' }; x: number; y: number; w?: number; dp?: number; foot?: { at: number; text: string } }> = ({ t, t0, t1, title, rows, total, x, y, w = 600, dp = 0, foot }) => {
	const a = fadeIO(t, t0, t1); if (a <= 0) return null;
	const sp = springAt(t, t0, FPS, 16, 130);
	const fmt = (v: number) => { const s = Math.abs(v).toFixed(dp); const [i, d] = s.split('.'); const l3 = i.slice(-3), r = i.slice(0, -3); return `${v < 0 ? '−' : '+'}₹${r ? r.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + l3 : l3}${d ? '.' + d : ''}`; };
	const col = (tone?: string) => tone === 'red' ? '#ff8a78' : tone === 'mint' ? GREEN.mint2 : '#cfe2d8';
	return (
		<div style={{ position: 'absolute', left: x, top: y, width: w, padding: '22px 26px', boxSizing: 'border-box', borderRadius: 22, opacity: a, transform: `translateY(${(1 - sp) * 22}px)`,
			background: 'linear-gradient(180deg, rgba(10,22,16,0.9), rgba(5,12,9,0.9))', border: '1.5px solid rgba(255,255,255,0.10)', boxShadow: '0 30px 80px rgba(0,0,0,0.5)', fontFamily: SANS, color: GREEN.ink }}>
			<div style={{ font: `700 14.5px/1 ${SANS}`, letterSpacing: 2.6, textTransform: 'uppercase', color: '#9fb7aa' }}>{title}</div>
			<div style={{ marginTop: 14 }}>
				{rows.map((r, i) => {
					const k = ramp(t, r.at, r.at + 0.35, EASE);
					return (
						<div key={i} style={{ display: 'flex', alignItems: 'baseline', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.07)', opacity: lerp(0.0, 1, k), transform: `translateX(${(1 - k) * -14}px)` }}>
							<div><div style={{ font: `600 22px/1.2 ${SANS}` }}>{r.label}</div>{r.sub && <div style={{ font: `500 15.5px/1.3 ${SANS}`, color: '#8ea398', marginTop: 3 }}>{r.sub}</div>}</div>
							<div style={{ marginLeft: 'auto', font: `700 26px/1 '${DISPLAY}'`, color: col(r.tone), fontVariantNumeric: 'tabular-nums' }}>{fmt(r.v * k)}</div>
						</div>
					);
				})}
			</div>
			{total && (() => {
				const k = ramp(t, total.at, total.at + 0.8, EASE);
				return (
					<div style={{ display: 'flex', alignItems: 'baseline', paddingTop: 14, opacity: clamp(k * 3) }}>
						<div style={{ font: `700 22px/1 ${SANS}`, letterSpacing: 0.4 }}>{total.label}</div>
						<div style={{ marginLeft: 'auto', font: `760 52px/1 '${DISPLAY}'`, letterSpacing: -1, color: col(total.tone), fontVariantNumeric: 'tabular-nums' }}>{fmt(total.v * k)}</div>
					</div>
				);
			})()}
			{foot && <div style={{ marginTop: 12, font: `500 17px/1.35 ${SANS}`, color: '#9fb7aa', opacity: ramp(t, foot.at, foot.at + 0.4) }}>{foot.text}</div>}
		</div>
	);
};

/** a mono tag on a carton or a part: what it is and what is left, with a leader */
export const Tag: React.FC<{ t: number; t0: number; t1: number; x: number; y: number; k: string; v: string; tone?: 'red' | 'mint' | 'amber' }> = ({ t, t0, t1, x, y, k, v, tone = 'red' }) => {
	const a = fadeIO(t, t0, t1, 0.2, 0.3); if (a <= 0) return null;
	const ink = tone === 'red' ? '#ff8a78' : tone === 'amber' ? AMBER : GREEN.mint2;
	const sp = springAt(t, t0, FPS, 14, 180);
	return (
		<div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%, -100%) scale(${lerp(0.8, 1, sp)})`, transformOrigin: '50% 100%', opacity: a }}>
			<div style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(6,14,10,0.82)', border: `1.5px solid ${ink}88`, font: `600 15px/1.2 ${MONO}`, color: '#e6efe9', whiteSpace: 'nowrap', backdropFilter: 'blur(6px)' }}>
				<span style={{ color: '#9fb7aa' }}>{k}</span> <span style={{ color: ink, fontWeight: 700 }}>{v}</span>
			</div>
			<div style={{ width: 2, height: 22, margin: '0 auto', background: `${ink}aa` }} />
			<div style={{ width: 10, height: 10, borderRadius: 5, margin: '-2px auto 0', background: ink, boxShadow: `0 0 12px ${ink}` }} />
		</div>
	);
};
