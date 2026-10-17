// SC-238 · 6: the platform. The sunrise's light is the mark; it draws its route over the godown (graded to the brand's
// green) and the line lands word by word. Every brand gets its own workspace: the platform lead at her console, the real
// console in her laptop's glass lifting out, its clients, a brand's first stock export mapped, its distributors, its
// people and its own rules, each ringed on its word; then the Overview, live. Each team's own part, on its own device,
// lands on its word: the brand, the distributor, the kirana, the food bank. Then it installs straight from the browser,
// and every alert arrives as a notification (SC-211's install scene, captured frame-exact on this narration).
import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion';
import { DISPLAY, EASE, EASE_IO, Footage, GREEN, MONO, SANS, clamp, lerp, Media, ramp, springAt } from '../kit/core';
import { Body, DevKind, Mark, Window, geom } from '../kit/device';
import { PlanShots } from '../kit/plan';
import { Rise, Scrim } from '../kit/ui';
import { FPS, SceneData, media, shot, word } from '../edl';

export const Platform: React.FC<{ s: SceneData }> = ({ s }) => {
	const t = useCurrentFrame() / FPS;
	const M = s.marks;
	const W = (k: string, w: string, n = 0) => word(s, k, w, n);
	const intro1 = M.console;                         // the mark and the line hold until the console
	// the godown under the brand's green, behind the mark (the sunrise's own clip, carried on)
	const markK = ramp(t, 0, 1.1, EASE);
	const teamsT0 = M.teams - 0.15 + 0.3, teamsT1 = shot(s, 'team-brand').t1;   // (the sequence starts 0.3 s before teamsT0)
	const pwa0 = teamsT1;
	return (
		<AbsoluteFill style={{ background: '#03100a' }}>
			{/* 1 · the mark and the line */}
			<Sequence from={0} durationInFrames={Math.round((intro1 + 0.4) * FPS)} layout="none">
				<AbsoluteFill>
					<Footage name="turn-sunrise" t0={0} t1={intro1 + 0.4} push={0.04} pushFrom={1.06} blur={18} grade="green" />
					<AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 42%, rgba(52,211,128,0.10), rgba(2,10,6,0.55) 70%)' }} />
					<div style={{ position: 'absolute', left: 960 - 110, top: 300 - 110 + (1 - markK) * 20, opacity: clamp(markK * 1.4) }}>
						<Mark size={220} draw={ramp(t, 0.05, 1.5, EASE_IO)} />
					</div>
					<div style={{ position: 'absolute', left: 0, right: 0, top: 560, textAlign: 'center' }}>
						<Rise t={t} t0={W('n09', 'smart') - 0.1} t1={intro1 + 0.4} text="Smart-Clearance" size={104} align="center" />
					</div>
					<div style={{ position: 'absolute', left: 0, right: 0, top: 708, textAlign: 'center' }}>
						<Rise t={t} t0={W('n09', 'agentic') - 0.05} t1={intro1 + 0.4} text="Agentic software that turns write-offs into recovery." size={44} weight={600} align="center" color="#cfe2d8" marks={['recovery.']} />
					</div>
				</AbsoluteFill>
			</Sequence>
			{/* 2 · the console: the platform lead at her laptop, the real console in its glass lifting out; then the Overview, live (plan.py's shots) */}
			<PlanShots s={s} skip={['team-brand', 'team-dist', 'team-kirana', 'team-foodbank', 'team-bg']} />
			{/* 3 · each team's own part, on its own device, landing on its word */}
			<Sequence from={Math.round((teamsT0 - 0.3) * FPS)} durationInFrames={Math.round((teamsT1 - teamsT0 + 0.3) * FPS)} layout="none">
				<Teams s={s} t0={teamsT0 - 0.3} />
			</Sequence>
			{/* 4 · installed from the browser; every alert a notification (pwa11, captured on these words) */}
			<Sequence from={Math.round(pwa0 * FPS)} durationInFrames={Math.round((s.dur - pwa0) * FPS)} layout="none">
				<AbsoluteFill>
					<Media name='pwa' style={{ width: '100%', height: '100%' }} />
				</AbsoluteFill>
			</Sequence>
			<div style={{ display: 'none' }}>{MONO}{SANS}{lerp(0, 1, 0)}{springAt(0, 0, FPS)}{GREEN.ink}{DISPLAY}</div>
		</AbsoluteFill>
	);
};

/** a device asleep: its body and dark glass rising into place, a glint crossing the glass, before its screen wakes */
const Asleep: React.FC<{ name: string; kind: DevKind; cx: number; cy: number; sh: number; t: number; t0: number; wake: number }> = ({ name, kind, cx, cy, sh, t, t0, wake }) => {
	const m = media(name); const [, , srcW, srcH] = m.rect!;
	const g = geom(kind, srcW, srcH, { sh });
	const e = EASE(ramp(t, t0, t0 + 0.5));
	if (e <= 0) return null;
	const glint = ramp(t, t0 + 0.2, t0 + 1.3, EASE_IO);
	return (
		<div style={{ position: 'absolute', left: cx - g.sw / 2 - g.b.l, top: cy - g.sh / 2 - g.b.t + (1 - e) * 40, width: g.fw, height: g.fh, opacity: e }}>
			<Body g={g} lift={0} />
			<div style={{ position: 'absolute', left: g.b.l, top: g.b.t, width: g.sw, height: g.sh, borderRadius: g.b.srad, overflow: 'hidden',
				background: 'radial-gradient(ellipse at 50% 30%, #13201b, #070c0a 75%)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)' }}>
				<div style={{ position: 'absolute', top: -g.sh * 0.2, bottom: -g.sh * 0.2, width: g.sw * 0.35, left: lerp(-g.sw * 0.5, g.sw * 1.2, glint), transform: 'skewX(-18deg)',
					background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.07), rgba(255,255,255,0))' }} />
				<div style={{ position: 'absolute', inset: 0, background: '#f4f7f5', opacity: 0.5 * Math.sin(Math.PI * clamp(wake)) }} />
			</div>
			{kind === 'phone' && <div style={{ position: 'absolute', left: g.b.l + g.sw / 2 - 58, top: g.b.t + 10, width: 116, height: 32, borderRadius: 16, background: '#050706' }} />}
		</div>
	);
};

const TEAM: { media: string; word: string; label: string; kind: 'tablet' | 'phone'; sh: number }[] = [
	{ media: 'team-brand', word: 'brand', label: 'The brand', kind: 'tablet', sh: 370 },
	{ media: 'team-dist', word: 'distributors', label: 'The distributor', kind: 'tablet', sh: 540 },
	{ media: 'team-kirana', word: 'kiranas', label: 'The kirana', kind: 'phone', sh: 580 },
	{ media: 'team-foodbank', word: 'food', label: 'The food bank', kind: 'phone', sh: 580 },
];
const Teams: React.FC<{ s: SceneData; t0: number }> = ({ s, t0 }) => {
	const t = useCurrentFrame() / FPS + t0;
	const end = shot(s, 'team-brand').t1;
	// the four devices across the frame, each landing on its word, the row easing left as each arrives
	const xs = [330, 835, 1255, 1630];
	const k = ramp(t, t0, t0 + 0.6, EASE);
	return (
		<AbsoluteFill>
			<Footage name="team-bg" t0={0} t1={end - t0} push={0.05} blur={10} grade="green" />
			<AbsoluteFill style={{ background: 'rgba(3,10,7,0.35)', opacity: k }} />
			{TEAM.map((m, i) => {
				const sh = shot(s, m.media);
				const lab = ramp(t, sh.t0 + 0.25, sh.t0 + 0.6, EASE);
				// the four devices rise at once, asleep; each wakes on its word
				const rT = t0 + 0.12 + i * 0.14;
				const wake = ramp(t, sh.t0, sh.t0 + 0.32, EASE);
				return (
					<React.Fragment key={m.media}>
						{t < sh.t0 + 0.4 && <Asleep name={m.media} kind={m.kind} cx={xs[i]} cy={520} sh={m.sh} t={t} t0={rT} wake={wake} />}
						<AbsoluteFill style={{ opacity: wake }}><Window name={m.media} kind={m.kind} t0={sh.t0 - t0} t1={sh.t1 - t0} cx={xs[i]} cy={520} sh={m.sh} enter="none" /></AbsoluteFill>
						<div style={{ position: 'absolute', left: xs[i] - 160, width: 320, top: 520 + m.sh / 2 + 46, textAlign: 'center', opacity: lab, transform: `translateY(${(1 - lab) * 12}px)`,
							font: `700 28px/1 '${DISPLAY}'`, color: GREEN.ink }}>{m.label}</div>
					</React.Fragment>
				);
			})}
			<Scrim side="t" a={0.4} />
			<div style={{ position: 'absolute', left: 0, right: 0, top: 70, textAlign: 'center' }}>
				<Rise t={t} t0={word(s, 'n11', 'Each') - 0.05} t1={word(s, 'n11', 'installed') - 0.15} text="Each team sees its own part" size={46} weight={650} align="center" />
			</div>
			<div style={{ position: 'absolute', left: 0, right: 0, top: 70, textAlign: 'center' }}>
				<Rise t={t} t0={word(s, 'n11', 'installed') - 0.1} t1={end + 1} text="Installed on any phone, tablet or laptop." size={46} weight={650} align="center" />
			</div>
		</AbsoluteFill>
	);
};
