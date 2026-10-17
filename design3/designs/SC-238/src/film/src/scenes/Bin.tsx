// SC-238 · 4 and 5: the bin and the turn. The batch's cartons in a trail across dark earth, a drone descending; if it
// is written off, the bill builds on its words (the stock at cost, the GST credit reversed, disposal, EPR) to the
// write-off, and what the planet loses with it. Week after week, brand after brand: three cuts, each stamped. Eight
// frames of silence. Then the godown at sunrise, the light rising through the roof: what if every pack found a home?
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { DISPLAY, EASE, Footage, GREEN, SANS, Shot, clamp, lerp, ramp } from '../kit/core';
import { Bill, Kicker, Rise, Scrim, Stamp, jolt } from '../kit/ui';
import { Mark } from '../kit/device';
import { FPS, SceneData, shot, word } from '../edl';

export const Bin: React.FC<{ s: SceneData }> = ({ s }) => {
	const t = useCurrentFrame() / FPS;
	const M = s.marks;
	const tr = shot(s, 'bin-trail');
	const stamps = [['bin-factory', M.st1, 'A biscuit line'], ['bin-hold', M.st2, 'A dock on hold'], ['bin-heap', M.st3, 'A landfill']] as const;
	const wOff = word(s, 'n06', 'written');
	return (
		<AbsoluteFill style={{ background: '#000' }}>
			<Footage name="bin-trail" t0={tr.t0} t1={tr.t1} push={0.07} origin="50% 60%" grade="none" />
			{t < tr.t1 && (
				<>
					<Scrim side="r" a={0.72} />
					<Scrim side="b" a={0.55} />
					<div style={{ position: 'absolute', left: 92, bottom: 190 }}>
						<Kicker t={t} t0={wOff - 0.4} t1={tr.t1} text="One batch · 1,580 packs · 22 days left" color="#ff9d8c" />
						<div style={{ height: 18 }} />
						<Rise t={t} t0={wOff - 0.15} t1={tr.t1} text="If it is written off…" size={84} />
					</div>
					<Bill t={t} t0={M.stock - 0.5} t1={tr.t1 - 0.05} x={1196} y={214} w={640} dp={0} title="What the bin costs the brand, on one batch"
						rows={[
							{ at: M.stock, label: 'The stock, at cost', sub: '1,580 packs × ₹11.00', v: -17380, tone: 'red' },
							{ at: M.credit, label: 'GST input credit reversed', sub: 'as the law requires on goods destroyed', v: -869, tone: 'red' },
							{ at: M.destroy, label: 'Disposal', sub: 'carried to a landfill and destroyed', v: -2370, tone: 'red' },
							{ at: M.destroy + 0.35, label: 'EPR on the packaging', sub: 'extended producer responsibility', v: -2038, tone: 'red' },
						]}
						total={{ at: M.total, label: 'Written off', v: -22657, tone: 'red' }}
						foot={{ at: M.total + 1.2, text: '339.7 kg of good food buried, and the gas it gives off.' }} />
				</>
			)}
			{stamps.map(([name, at], i) => {
				const sh = shot(s, name);
				return (
					<Shot key={name} id={name} t0={sh.t0} t1={sh.t1}>
						{() => (
							<AbsoluteFill style={{ transform: jolt(t, at) }}>
								<Footage name={name} t0={0} t1={sh.t1 - sh.t0} push={0.06} grade={i === 2 ? 'none' : 'cold'} />
								<AbsoluteFill style={{ background: 'rgba(0,0,0,0.18)' }} />
								<Stamp t={t} t0={at} x={960 + (i - 1) * 120} y={540 + (i % 2 ? -40 : 30)} sub="" size={1.25} rot={[-9, 6, -4][i]} />
							</AbsoluteFill>
						)}
					</Shot>
				);
			})}
			{/* (SC-245: the heap, darkening, where eight black frames were) */}
			<AbsoluteFill style={{ background: '#000', opacity: 0.7 * ramp(t, shot(s, 'bin-heap').t1 - 0.2, shot(s, 'bin-heap').t1, EASE) }} />
		</AbsoluteFill>
	);
};

export const Turn: React.FC<{ s: SceneData }> = ({ s }) => {
	const t = useCurrentFrame() / FPS;
	const sh = shot(s, 'turn-sunrise');
	const end = s.dur;
	const wHome = word(s, 'n08', 'home');
	// the light swells at the end and becomes the mark
	const swell = ramp(t, end - 1.3, end - 0.1, EASE);
	const mark = ramp(t, end - 0.9, end - 0.05, EASE);
	return (
		<AbsoluteFill style={{ background: '#000' }}>
			<Footage name="turn-sunrise" t0={sh.t0} t1={sh.t1} push={0.08} origin="50% 42%" />
			<AbsoluteFill style={{ opacity: ramp(t, 0, 0.6) * (1 - swell), background: 'linear-gradient(180deg, rgba(0,0,0,0.2), rgba(0,0,0,0) 40%, rgba(0,0,0,0.45))' }} />
			<div style={{ position: 'absolute', left: 0, right: 0, bottom: 190, textAlign: 'center', opacity: 1 - swell }}>
				<Rise t={t} t0={word(s, 'n08', 'What') - 0.05} t1={end - 0.6} text="What if every pack could still find a home?" size={64} align="center" marks={['home?']} markColor="#ffe3a3" />
			</div>
			{/* the light: a bloom from the roof that whitens the frame and leaves the mark */}
			<AbsoluteFill style={{ background: `radial-gradient(circle at 50% 42%, rgba(255,246,222,${swell}) ${lerp(0, 60, swell)}%, rgba(255,236,190,${swell * 0.85}) ${lerp(10, 100, swell)}%)` }} />
			{mark > 0 && (
				<div style={{ position: 'absolute', left: 960 - 90, top: 454 - 90, opacity: clamp(mark * 1.4), transform: `scale(${lerp(0.7, 1, mark)})` }}>
					<Mark size={180} draw={mark} />
				</div>
			)}
			<div style={{ display: 'none' }}>{wHome}</div>
		</AbsoluteFill>
	);
};

export const Placeholder: React.FC<{ s: SceneData }> = ({ s }) => {
	const t = useCurrentFrame() / FPS;
	return (
		<AbsoluteFill style={{ background: 'linear-gradient(135deg,#06140d,#0d2e20)', display: 'grid', placeItems: 'center', fontFamily: SANS, color: GREEN.ink }}>
			<div style={{ textAlign: 'center' }}>
				<div style={{ font: `700 64px/1 '${DISPLAY}'` }}>{s.comp}</div>
				<div style={{ marginTop: 16, font: `500 26px/1 ${SANS}`, color: '#9fb7aa' }}>{s.id} · {t.toFixed(2)} / {s.dur.toFixed(2)} s</div>
			</div>
		</AbsoluteFill>
	);
};
