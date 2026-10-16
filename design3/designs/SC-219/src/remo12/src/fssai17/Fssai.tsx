// SC-228 (SC-219 cut 17): FSSAI's rule for food sold online, the problem's regulatory backing, as two transparent
// overlays for the opening's first two scenes (rendered as PNG sequences with alpha and laid over the shots by
// shots13.py). The rule, as the regulation states it: food delivered to a consumer by an e-commerce food business must
// have 30% of its shelf life, or 45 days, remaining before expiry at the time of delivery. The Mango Drink batch has
// 22 days left of a 180-day shelf life, so it fails both thresholds (45 days, and 30% = 54 days).
//
//   FssaiRule   over the godown, while the voice says the rule: the rule card, its two thresholds landing on the words
//   FssaiBatch  over the label, while the voice says the batch has 22 days: the batch's shelf life against the rule
//
// Every time is the overlay's own second (0 = its shot's start), from the voice's word cues (props).
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { EASE, EASE_IO, INK, Icon, clamp, fade, lerp, ramp, springAt, useT } from '../lib/base';
import { useVideoConfig } from 'remotion';

const RED = '#ff7a66', RED_DEEP = 'rgba(255,122,102,0.16)', GREEN = '#5fe3a1';
const CARD: React.CSSProperties = {
	position: 'absolute', borderRadius: 18, background: 'rgba(8,18,13,0.88)', border: '1.5px solid rgba(115,201,157,0.38)',
	boxShadow: '0 18px 60px rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', fontFamily: 'Geist', color: INK.ink,
};
const KICK: React.CSSProperties = { fontFamily: 'Geist', fontWeight: 700, fontSize: 17, letterSpacing: 3.2, textTransform: 'uppercase' };

export type RuleProps = { dur: number; t0: number; thirty: number; fortyFive: number; remain: number; t1: number };
export const FssaiRule: React.FC<RuleProps> = ({ t0, thirty, fortyFive, remain, t1 }) => {
	const t = useT(); const { fps } = useVideoConfig();
	const a = fade(t, t0, t1, 0.35, 0.4);
	const inn = springAt(t, t0, fps, 16, 110);
	const tile = (cue: number) => springAt(t, cue - 0.08, fps, 13, 150);
	const s30 = tile(thirty), s45 = tile(fortyFive);
	const glow = ramp(t, remain - 0.1, remain + 0.45);
	const Tile: React.FC<{ k: number; big: string; unit: string; sub: string }> = ({ k, big, unit, sub }) => (
		<div style={{ width: 320, height: 176, borderRadius: 16, padding: '18px 22px', boxSizing: 'border-box', opacity: clamp(k * 1.4),
			transform: `translateY(${(1 - k) * 22}px) scale(${lerp(0.92, 1, k)})`, background: `rgba(52,211,128,${0.1 + 0.08 * glow})`,
			border: `1.5px solid rgba(95,227,161,${0.4 + 0.45 * glow})`, boxShadow: `0 0 ${28 * glow}px rgba(95,227,161,${0.35 * glow})` }}>
			<div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
				<span style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 760, fontSize: 84, lineHeight: 1, color: '#e9fff3', letterSpacing: -2 }}>{big}</span>
				<span style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 640, fontSize: 36, color: INK.mint2 }}>{unit}</span>
			</div>
			<div style={{ marginTop: 12, fontSize: 21, color: INK.ink2, lineHeight: 1.25 }}>{sub}</div>
		</div>
	);
	return (
		<AbsoluteFill>
			<div style={{ ...CARD, left: 72, top: 452, width: 812, padding: '26px 30px 24px', boxSizing: 'border-box', opacity: a,
				transform: `translateX(${(1 - inn) * -40}px)` }}>
				<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
					<div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(52,211,128,0.16)', display: 'grid', placeItems: 'center' }}>
						<Icon name="shield-check" size={24} color={GREEN} sw={2.2} />
					</div>
					<span style={{ ...KICK, fontSize: 15, letterSpacing: 2.2, color: INK.g300 }}>FSSAI · Food Safety and Standards Authority of India</span>
				</div>
				<div style={{ marginTop: 18, fontFamily: 'Bricolage Grotesque', fontWeight: 700, fontSize: 40, letterSpacing: -0.8, lineHeight: 1.12 }}>
					At delivery, food sold online<br />must still have
				</div>
				<div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 18 }}>
					<Tile k={s30} big="30%" unit="" sub="of its shelf life left" />
					<span style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 700, fontSize: 30, color: INK.ink3, opacity: clamp(s45 * 1.5) }}>or</span>
					<Tile k={s45} big="45" unit="days" sub="before its expiry date" />
				</div>
				<div style={{ marginTop: 18, fontSize: 17, color: INK.ink3, letterSpacing: 0.2, opacity: ramp(t, remain - 0.2, remain + 0.3) }}>
					For food delivered by e-commerce and quick-commerce platforms
				</div>
			</div>
		</AbsoluteFill>
	);
};

export type BatchProps = { dur: number; t0: number; days: number; quick: number; t1: number };
export const FssaiBatch: React.FC<BatchProps> = ({ t0, days, quick, t1 }) => {
	const t = useT(); const { fps } = useVideoConfig();
	const a = fade(t, t0, t1, 0.3, 0.35);
	const inn = springAt(t, t0, fps, 16, 120);
	const LIFE = 180, X0 = 30, BW = 1040;               // the bar: 0 days left at its left end, 180 at its right
	const xOf = (d: number) => X0 + (d / LIFE) * BW;
	const bar = ramp(t, t0 + 0.05, t0 + 0.6, EASE_IO);
	const tk45 = ramp(t, t0 + 0.45, t0 + 0.75), tk54 = ramp(t, t0 + 0.6, t0 + 0.9);
	const slide = ramp(t, days - 0.25, days + 0.75, EASE);  // the batch's days fall from its full life to what is left
	const d = lerp(LIFE, 22, slide);
	const below = d < 54.5;
	const verdict = springAt(t, quick - 0.1, fps, 14, 140);
	const zero = ramp(t, t0 + 0.5, t0 + 0.9);
	return (
		<AbsoluteFill>
			<div style={{ ...CARD, left: 64, top: 800, width: 1100, height: 232, opacity: a, transform: `translateY(${(1 - inn) * 26}px)` }}>
				<div style={{ position: 'absolute', left: X0, top: 20, display: 'flex', alignItems: 'baseline', gap: 16 }}>
					<span style={{ ...KICK, color: INK.g300 }}>This batch against FSSAI's rule</span>
					<span style={{ fontSize: 18, color: INK.ink3 }}>Mango Drink · a 180-day shelf life</span>
				</div>
				{/* the bar: the days of shelf life left, 0 at its left end; online sale needs the green zone */}
				<div style={{ position: 'absolute', left: X0, top: 104, width: BW * bar, height: 18, borderRadius: 9, background: 'rgba(236,243,239,0.10)', overflow: 'hidden' }}>
					<div style={{ position: 'absolute', left: xOf(54) - X0, top: 0, width: BW - (xOf(54) - X0), height: 18, background: 'rgba(95,227,161,0.34)' }} />
				</div>
				<div style={{ position: 'absolute', left: xOf(54) + 14, top: 74, fontSize: 17, fontWeight: 600, color: 'rgba(159,240,196,0.9)', opacity: tk54 }}>Can be sold online</div>
				<div style={{ position: 'absolute', left: X0, top: 132, fontSize: 15, color: INK.ink3, opacity: zero }}>0</div>
				<div style={{ position: 'absolute', left: X0 + BW - 160, width: 160, textAlign: 'right', top: 132, fontSize: 15, color: INK.ink3, opacity: zero }}>180 days left</div>
				{[{ dd: 45, k: tk45, label: '45 days', dx: -8, right: true }, { dd: 54, k: tk54, label: '54 days · 30% of 180', dx: 10, right: false }].map((m) => (
					<div key={m.dd} style={{ position: 'absolute', left: xOf(m.dd) - 1, top: 92, width: 2.5, height: 42, background: INK.mint2, opacity: m.k }}>
						<div style={{ position: 'absolute', top: 46, fontSize: 17, fontWeight: 600, color: INK.mint2, whiteSpace: 'nowrap',
							...(m.right ? { right: -m.dx } : { left: m.dx }) }}>{m.label}</div>
					</div>
				))}
				{/* the batch */}
				<div style={{ position: 'absolute', left: xOf(d) - 13, top: 100, width: 26, height: 26, borderRadius: 13, opacity: clamp(slide * 4) * bar,
					background: below ? RED : GREEN, boxShadow: `0 0 0 6px ${below ? 'rgba(255,122,102,0.25)' : 'rgba(95,227,161,0.25)'}` }} />
				<div style={{ position: 'absolute', left: xOf(d) - 110, top: 60, width: 220, textAlign: 'center', fontFamily: 'Bricolage Grotesque', whiteSpace: 'nowrap',
					fontWeight: 720, fontSize: 26, color: below ? RED : INK.ink, opacity: clamp(slide * 4) }}>{Math.round(d)} days left</div>
				{/* the verdict */}
				<div style={{ position: 'absolute', right: 26, bottom: 20, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderRadius: 999,
					background: RED_DEEP, border: `1.5px solid ${RED}`, color: '#ffd5cd', fontSize: 19, fontWeight: 650,
					opacity: clamp(verdict * 1.3), transform: `scale(${lerp(0.9, 1, verdict)})`, transformOrigin: 'right center' }}>
					<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth={2.4} strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>
					Below both: too close to its date to sell online
				</div>
			</div>
		</AbsoluteFill>
	);
};
