// SC-238 · 6: the platform. The sunrise's light is the mark; it holds over the town waking, from above (graded to the
// brand's green), and the line lands word by word. Every brand gets its own workspace: the platform lead at her console, the real
// console in her laptop's glass lifting out, its clients, a brand's first stock export mapped, its distributors, its
// people and its own rules, each ringed on its word; then the Overview, live. Each team's own part, on its own device,
// lands on its word: the brand, the distributor, the kirana, the food bank. Then it installs straight from the browser,
// and every alert arrives as a notification (SC-211's install scene, captured frame-exact on this narration).
import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion';
import { DISPLAY, EASE, EASE_IO, Footage, GREEN, MONO, SANS, lerp, Media, ramp, springAt } from '../kit/core';
import { Mark, Window, geom } from '../kit/device';
import { PlanShots } from '../kit/plan';
import { Rise, Scrim } from '../kit/ui';
import { FPS, SceneData, media, shot, word } from '../edl';

export const Platform: React.FC<{ s: SceneData }> = ({ s }) => {
	const t = useCurrentFrame() / FPS;
	const M = s.marks;
	const W = (k: string, w: string, n = 0) => word(s, k, w, n);
	const intro1 = M.console;                         // the mark and the line hold until the console
	// the town waking under the brand's green, behind the mark (from above; the godown was on screen twice already)
	const markK = ramp(t, 0.05, 1.0, EASE_IO);
	const teamsT0 = M.teams - 0.15 + 0.3, teamsT1 = shot(s, 'team-brand').t1;   // (the sequence starts 0.3 s before teamsT0)
	const pwa0 = teamsT1;
	return (
		<AbsoluteFill style={{ background: '#03100a' }}>
			{/* 1 · the mark and the line */}
			<Sequence from={0} durationInFrames={Math.round((intro1 + 0.4) * FPS)} layout="none">
				<AbsoluteFill>
					{/* (less blurred, so its streets read as a town from above: r4 took its blurred roofs for the godown's cartons) */}
					<Footage name="p-town" t0={0} t1={intro1 + 0.4} push={0.06} pushFrom={1.04} blur={4} grade="green" />
					<AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 42%, rgba(52,211,128,0.10), rgba(2,10,6,0.55) 70%)' }} />
					{/* the turn's white light, fading under the mark it left (so the mark never washes out at the cut) */}
					<AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 42%, #fff6de, #ffecbe)', opacity: Math.pow(1 - ramp(t, 0, 0.45), 1.6) }} />
					{/* the sunrise's shafts carried on behind the mark, turning slowly */}
					<AbsoluteFill style={{ overflow: 'hidden', mixBlendMode: 'screen', opacity: 0.5 * ramp(t, 0.2, 1.4), WebkitMaskImage: 'linear-gradient(180deg, #000 0%, rgba(0,0,0,0.55) 45%, transparent 85%)' }}>
						<div style={{ position: 'absolute', left: -480, top: -1660, width: 2880, height: 2880, transformOrigin: '50% 50%', transform: `rotate(${lerp(-5, 5, ramp(t, 0, intro1 + 0.4))}deg)`, filter: 'blur(9px)',
							background: 'repeating-conic-gradient(from 150deg at 50% 50%, rgba(190,255,220,0.0) 0deg 5deg, rgba(190,255,220,0.10) 7deg 8deg, rgba(190,255,220,0.0) 10deg 17deg)' }} />
					</AbsoluteFill>
					{/* (a slow push the whole hold, so the card never stands still: r3 measured a second's freeze before the console) */}
					<AbsoluteFill style={{ transformOrigin: '50% 44%', transform: `scale(${1 + 0.075 * ramp(t, 1.0, intro1 + 0.4, EASE_IO)})` }}>
					{/* the mark the turn's light left, picked up where it is (a match cut): it rises and grows into place; a sheen
					    crosses it once the line has landed */}
					<div style={{ position: 'absolute', left: 960 - lerp(180, 220, markK) / 2, top: lerp(454, 300, markK) - lerp(180, 220, markK) / 2 }}>
						<Mark size={lerp(180, 220, markK)} draw={1} />
						{(() => { const k = ramp(t, intro1 - 1.6, intro1 - 0.6, EASE_IO); if (k <= 0 || k >= 1) return null;
							return <div style={{ position: 'absolute', inset: 0, borderRadius: '30%', overflow: 'hidden', mixBlendMode: 'screen', pointerEvents: 'none' }}>
								<div style={{ position: 'absolute', top: '-40%', bottom: '-40%', width: '38%', left: `${lerp(-60, 130, k)}%`, transform: 'rotate(18deg)', background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.42), rgba(255,255,255,0))' }} />
							</div>; })()}
					</div>
					<div style={{ position: 'absolute', left: 0, right: 0, top: 560, textAlign: 'center' }}>
						<Rise t={t} t0={W('n09', 'smart') - 0.1} t1={intro1 + 0.4} text="Smart-Clearance" size={104} align="center" />
					</div>
					<div style={{ position: 'absolute', left: 0, right: 0, top: 708, textAlign: 'center' }}>
						<Rise t={t} t0={W('n09', 'agentic') - 0.05} t1={intro1 + 0.4} text="Agentic software that turns write-offs into recovery." size={44} weight={600} align="center" color="#cfe2d8" marks={['recovery.']} />
					</div>
					</AbsoluteFill>
				</AbsoluteFill>
			</Sequence>
			{/* 2 · the console: the platform lead at her laptop, the real console in its glass lifting out; then the Overview, live (plan.py's shots) */}
			<PlanShots s={s} skip={['team-brand', 'team-dist', 'team-kirana', 'team-foodbank', 'team-bg']} />
			{/* 3 · each team's own part, on its own device, landing on its word */}
			<Sequence from={Math.round((teamsT0 - 0.3) * FPS)} durationInFrames={Math.round(teamsT1 * FPS) - Math.round((teamsT0 - 0.3) * FPS)} layout="none">
				<Teams s={s} t0={teamsT0 - 0.3} />
			</Sequence>
			{/* 4 · installed from the browser; every alert a notification (pwa11, captured on these words) */}
			<Sequence from={Math.round(pwa0 * FPS)} durationInFrames={Math.round(s.dur * FPS) - Math.round(pwa0 * FPS)} layout="none">
				<AbsoluteFill>
					<Media name='pwa' style={{ width: '100%', height: '100%' }} />
				</AbsoluteFill>
			</Sequence>
			<div style={{ display: 'none' }}>{MONO}{SANS}{lerp(0, 1, 0)}{springAt(0, 0, FPS)}{GREEN.ink}{DISPLAY}</div>
		</AbsoluteFill>
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
				const sh = shot(s, m.media) as ReturnType<typeof shot> & { hi?: number };
				const lab = ramp(t, sh.t0 + 0.25, sh.t0 + 0.6, EASE);
				// each device rises awake as the console leaves; on its word a ring of light lands round it
				const md = media(m.media); const [, , sw0, sh0] = md.rect!;
				const g = geom(m.kind, sw0, sh0, { sh: m.sh });
				const hi = sh.hi ?? sh.t0, kh = Math.min(ramp(t, hi, hi + 0.25, EASE), 1 - ramp(t, hi + 1.6, hi + 2.1));
				return (
					<React.Fragment key={m.media}>
						<Window name={m.media} kind={m.kind} t0={sh.t0 - t0} t1={sh.t1 - t0} cx={xs[i]} cy={520} sh={m.sh} />
						{kh > 0 && <div style={{ position: 'absolute', left: xs[i] - g.fw / 2 - 12, top: 520 - g.fh / 2 - 12, width: g.fw + 24, height: g.fh + 24, borderRadius: g.b.rad + 12,
							border: `3px solid ${GREEN.mint2}`, boxShadow: `0 0 ${30 * kh}px rgba(52,211,128,${0.55 * kh})`, opacity: kh, transform: `scale(${lerp(1.04, 1, kh)})` }} />}
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
