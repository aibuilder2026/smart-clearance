// SC-238 · 8 and 9: one batch, then the hardest case. Every moment opens on the person with their own device, the app's
// real screen in its glass (screens.py, over the shoulder) or the person at work; the screen lifts out of the device as
// the room racks out of focus, and holds, pixel-sharp, while the person stays behind it. Rings land on what the voice
// names, in the recording's own pixels; a card says why it matters; the agent at work names itself, its stop and its
// model, and types the calls it really made (the recordings' own timeline); the clock chip names the day.
import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { DISPLAY, EASE, EASE_IO, Footage, GREEN, Icon, RED, SANS, Shot, clamp, inr, lerp, ramp, springAt } from '../kit/core';
import { AgentHead, Kicker, Rise, Scrim } from '../kit/ui';
import { PlanShots } from '../kit/plan';
import { FPS, SceneData, dlg, shot, voEnd, word } from '../edl';

/** the camera's view, full frame: the label in its finder, the focus closing in, the shutter */
const Viewfinder: React.FC<{ t0: number; t1: number; shutter: number; img: string }> = ({ t0, t1, shutter, img }) => (
	<Shot id={`vf-${t0}`} t0={t0} t1={t1}>
		{(u) => {
			const T = t0 + u;
			const focus = ramp(T, t0, t0 + 0.6, EASE);
			const flash = T >= shutter ? Math.exp(-(T - shutter) * 9) : 0;
			const blur = (1 - focus) * 10;
			return (
				<AbsoluteFill style={{ background: '#000' }}>
					<AbsoluteFill style={{ transform: `scale(${lerp(1.12, 1.04, focus)}) translate(${Math.sin(T * 5.3) * 2.5}px, ${Math.cos(T * 4.1) * 2}px)` }}>
						<Img src={staticFile(`img/${img}.webp`)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: `blur(${blur.toFixed(2)}px)` }} />
					</AbsoluteFill>
					{/* the finder's chrome: corner marks closing on the label, the shutter at the foot */}
					<svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
						{[[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([sx, sy], i) => {
							const cx = 960 - sx * lerp(560, 470, focus), cy = 520 - sy * lerp(330, 270, focus);
							return <path key={i} d={`M ${cx + sx * 60} ${cy} H ${cx} V ${cy + sy * 60}`} fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" opacity={0.95} />;
						})}
						<circle cx={960} cy={985} r={44} fill="none" stroke="#fff" strokeWidth={6} />
						<circle cx={960} cy={985} r={T >= shutter && T < shutter + 0.18 ? 30 : 35} fill="#fff" />
					</svg>
					<div style={{ position: 'absolute', right: 60, top: 210, padding: '10px 16px', borderRadius: 999, background: 'rgba(0,0,0,0.55)', font: `600 20px/1 ${SANS}`, color: '#fff' }}>One carton label, close up</div>
					<AbsoluteFill style={{ background: '#fff', opacity: flash }} />
				</AbsoluteFill>
			);
		}}
	</Shot>
);

/** a figure that rolls up on its word, in large type, with a label */
const BigFigure: React.FC<{ t: number; t0: number; t1: number; v: number; label: string; tone?: 'mint' | 'red'; x: number; y: number; strike?: number; size?: number; dp?: number }> = ({ t, t0, t1, v, label, tone = 'mint', x, y, strike, size = 120, dp = 0 }) => {
	const a = Math.min(ramp(t, t0, t0 + 0.3), 1 - ramp(t, t1 - 0.35, t1)); if (a <= 0) return null;
	const k = ramp(t, t0, t0 + 1.0, EASE); const sp = springAt(t, t0, FPS, 14, 140);
	const st = strike !== undefined ? ramp(t, strike, strike + 0.4, EASE) : 0;
	return (
		<div style={{ position: 'absolute', left: x, top: y, opacity: a, transform: `translateY(${(1 - sp) * 24}px)` }}>
			<div style={{ font: `700 18px/1 ${SANS}`, letterSpacing: 2.6, textTransform: 'uppercase', color: tone === 'red' ? '#ff9d8c' : '#73e0a6' }}>{label}</div>
			<div style={{ position: 'relative', marginTop: 10, font: `760 ${size}px/1 '${DISPLAY}'`, letterSpacing: -size * 0.03, color: tone === 'red' ? '#ff8a78' : GREEN.pale, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
				{inr(v * k, dp)}
				{st > 0 && <div style={{ position: 'absolute', left: -6, top: '52%', height: 8, width: `${st * 104}%`, background: '#ff8a78', borderRadius: 4 }} />}
			</div>
		</div>
	);
};

// ------------------------------------------------------------------------------------------------- the mango
export const Mango: React.FC<{ s: SceneData }> = ({ s }) => {
	const t = useCurrentFrame() / FPS;
	const W = (k: string, w: string, n = 0) => word(s, k, w, n);
	const vf = s.shots.find((x) => x.kind === 'viewfinder')!;
	const r = shot(s, 'm-report-bg');
	return (
		<AbsoluteFill style={{ background: '#000' }}>
			<PlanShots s={s} grade={{ 'm-report-bg': 'greenSoft' }} />
			{/* 09:16 · her camera's view, full frame, the shutter */}
			<Viewfinder t0={vf.t0} t1={vf.t1} shutter={vf.shutter!} img="label-mango" />
			{/* Day 22 · best before: what the batch came to */}
			{t >= r.t0 && t < r.t1 && (
				<>
					<Scrim side="l" a={0.78} />
					<div style={{ position: 'absolute', left: 96, top: 250 }}>
						<BigFigure t={t} t0={W('n30', 'twentytwo') - 0.2} t1={r.t1} v={-22657} label="If it had been written off" tone="red" x={0} y={0} size={96} strike={W('n30', 'recovered') - 0.4} />
						<BigFigure t={t} t0={W('n30', 'seventeen') - 0.2} t1={r.t1} v={16917} label="Recovered, every line done" x={0} y={200} size={132} />
						<div style={{ position: 'absolute', left: 0, top: 420, opacity: ramp(t, W('n30', 'distributor') - 0.2, W('n30', 'distributor') + 0.3), font: `600 30px/1.3 ${SANS}`, color: GREEN.ink, whiteSpace: 'nowrap' }}>
							<span style={{ color: GREEN.pale }}>₹22,194</span> better than the bin · the distributor ends whole
						</div>
					</div>
				</>
			)}
		</AbsoluteFill>
	);
};

// ------------------------------------------------------------------------------------------------- the chips
export const Chips: React.FC<{ s: SceneData }> = ({ s }) => {
	const t = useCurrentFrame() / FPS;
	const M = s.marks;
	const W = (k: string, w: string, n = 0) => word(s, k, w, n);
	const dusk = shot(s, 'c-dusk');
	const ev = s.shots.find((x) => x.kind === 'evidence')!;
	const splitIn = W('n31', 'split') - 0.2;
	return (
		<AbsoluteFill style={{ background: '#000' }}>
			{/* Nagpur at dusk: not every batch is that easy; the batch split two ways */}
			<Footage name="c-dusk" t0={dusk.t0} t1={dusk.t1} push={0.06} blur={10} sharp={splitIn} rack={0.8} grade="dusk" />
			{t < dusk.t1 && (
				<>
					<Shot id="dusk-dim" t0={splitIn} t1={dusk.t1}>{(u) => <AbsoluteFill style={{ background: '#050a08', opacity: 0.45 * ramp(u, 0, 0.8) }} />}</Shot>
					<div style={{ position: 'absolute', left: 92, bottom: 190, opacity: 1 - ramp(t, splitIn - 0.3, splitIn) }}>
						<Rise t={t} t0={W('n31', 'Not') - 0.05} t1={splitIn} text="Not every batch is that easy." size={72} />
					</div>
					{/* the split: 1,360 at risk, a lot of 772 and a scheme of 588 */}
					{(() => {
						const k = ramp(t, splitIn, splitIn + 0.6, EASE), kl = ramp(t, W('n31', 'lot') - 0.1, W('n31', 'lot') + 0.5, EASE), ks = ramp(t, W('n31', 'scheme') - 0.1, W('n31', 'scheme') + 0.5, EASE);
						const out = 1 - ramp(t, dusk.t1 - 0.35, dusk.t1);
						return (
							<div style={{ position: 'absolute', left: 0, right: 0, top: 210, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: k * out }}>
								<Kicker t={t} t0={splitIn} text="The chips, in Nagpur · 47 days left" style={{ justifyContent: 'center' }} />
								<div style={{ marginTop: 18, font: `760 96px/1 '${DISPLAY}'`, color: GREEN.ink, letterSpacing: -2 }}>1,360 packs at risk</div>
								<svg width={1000} height={150} style={{ marginTop: 6 }}>
									<path d="M 500 10 C 500 70, 250 60, 250 140" fill="none" stroke="#c58af9" strokeWidth={4} strokeDasharray={260} strokeDashoffset={260 * (1 - kl)} />
									<path d="M 500 10 C 500 70, 750 60, 750 140" fill="none" stroke={GREEN.mint2} strokeWidth={4} strokeDasharray={260} strokeDashoffset={260 * (1 - ks)} />
								</svg>
								<div style={{ display: 'flex', gap: 120 }}>
									{[{ k: kl, n: '772', h: 'a lot on a near-expiry marketplace', ink: '#c58af9', icon: 'gavel' }, { k: ks, n: '588', h: 'a scheme for the kiranas', ink: GREEN.mint2, icon: 'store' }].map((c) => (
										<div key={c.n} style={{ width: 420, textAlign: 'center', opacity: c.k, transform: `translateY(${(1 - c.k) * 20}px)` }}>
											<div style={{ display: 'inline-grid', placeItems: 'center', width: 64, height: 64, borderRadius: 18, background: `${c.ink}22`, border: `1.5px solid ${c.ink}88` }}><Icon name={c.icon} size={32} color={c.ink} /></div>
											<div style={{ marginTop: 14, font: `760 64px/1 '${DISPLAY}'`, color: c.ink }}>{c.n}</div>
											<div style={{ marginTop: 8, font: `500 24px/1.3 ${SANS}`, color: '#cfe2d8' }}>{c.h}</div>
										</div>
									))}
								</div>
							</div>
						);
					})()}
				</>
			)}
			<PlanShots s={s} skip={['c-dusk']} grade={{ 'c-landfill': 'cold', 'l-photo': 'cold', 'chips-d11': 'cold', 'x-est': 'cold', 'x-film-a': 'cold', 'x-empty': 'cold',
				'x-cover': 'cold', 'x-film-b': 'cold', 'x-sign1': 'cold', 'x-sign2': 'cold', 'x-film-c': 'cold' }} />
			{/* the lot: the buyer's bid, the Negotiator's counter, the lot won */}
			{/* the scheme: only two shops order; the window closes on 540 */}
			{/* expiry day: the landfill; he photographs the evidence; Vision's checks */}
			<Shot id="evidence" t0={ev.t0} t1={ev.t1}>
				{(u, d) => {
					const T = ev.t0 + u;
					const k1 = ramp(u, 0, 0.5, EASE), k2 = ramp(u, 0.35, 0.85, EASE);
					const checks: [number, string][] = [[ev.t0 + 0.9, 'The batch read on the carton label'], [ev.t0 + 1.4, 'About 540 packs in view'], [ev.t0 + 1.9, 'The slate: the batch, 540 packets, the day'], [ev.t0 + 2.4, 'Both photos taken today']];
					return (
						<AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 40%, #12201a, #050a08 70%)' }}>
							{/* the landfill itself behind the two photos, under the brand's green */}
							<Footage name="c-evidence-bg" t0={0} t1={d} push={0.05} blur={12} grade="green" />
							<AbsoluteFill style={{ background: 'rgba(3,10,7,0.45)' }} />
							{/* the two photos large across the top, Vision and its four checks under them, the line at the foot */}
							{[['evidence-before', 'Before · at the godown', 150, k1, -2.5], ['evidence-after-crop', 'After · at the landfill', 990, k2, 2.0]].map(([img, cap, x, k, rot]) => (
								<div key={img as string} style={{ position: 'absolute', left: x as number, top: 84, width: 780, height: 592, borderRadius: 18, overflow: 'hidden', opacity: k as number,
									transform: `translateY(${(1 - (k as number)) * 40}px) rotate(${(rot as number) * (1 - (k as number))}deg) scale(${1 + 0.03 * clamp(u / d)})`, boxShadow: '0 30px 80px rgba(0,0,0,0.6)', border: '2px solid rgba(255,255,255,0.12)' }}>
									<Img src={staticFile(`img/${img}.webp`)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
									<div style={{ position: 'absolute', left: 16, bottom: 16, padding: '8px 14px', borderRadius: 999, background: 'rgba(0,0,0,0.62)', font: `600 19px/1 ${SANS}`, color: '#fff' }}>{cap as string}</div>
									{/* Vision's sweep */}
									<div style={{ position: 'absolute', left: 0, right: 0, top: `${lerp(-10, 110, ramp(u, 0.5, 2.3, EASE_IO))}%`, height: 3, background: GREEN.mint2, boxShadow: `0 0 18px ${GREEN.mint2}`, opacity: ramp(u, 0.5, 0.7) * (1 - ramp(u, 2.2, 2.4)) }} />
								</div>
							))}
							<div style={{ position: 'absolute', left: 150, top: 718, width: 420 }}>
								<AgentHead t={T} t0={ev.t0 + 0.3} t1={ev.t1} name="Vision" stop="Settle" tier="flash" icon="scan-line" done={ev.t0 + 2.6} x={0} y={0} calls={[]} />
							</div>
							<div style={{ position: 'absolute', left: 590, top: 712, width: 1180, display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 44 }}>
								{checks.map(([at, line], i) => {
									const kk = ramp(T, at, at + 0.3, EASE);
									return (
										<div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '9px 0', opacity: lerp(0.25, 1, kk) }}>
											<div style={{ width: 30, height: 30, borderRadius: 15, flex: 'none', display: 'grid', placeItems: 'center', background: kk > 0.01 ? GREEN.mint : 'rgba(255,255,255,0.08)', color: '#06140d', transform: `scale(${lerp(0.6, 1, kk)})` }}>{kk > 0.01 && <Icon name="check" size={19} sw={3} />}</div>
											<div style={{ font: `600 25px/1.3 ${SANS}`, color: GREEN.ink }}>{line}</div>
										</div>
									);
								})}
							</div>
							<div style={{ position: 'absolute', left: 0, right: 0, top: 912, textAlign: 'center', font: `650 34px/1.3 ${SANS}`, color: '#dcebe3', opacity: ramp(u, 1.2, 1.6) }}>
								Two photos, checked by Vision before anything is credited.
							</div>
						</AbsoluteFill>
					);
				}}
			</Shot>
			{/* the signing at the facility: four signatures, in their own places */}
			{/* the second yes: nothing is credited for them until it */}
			{/* the papers it issues, one at a time and large enough to read: the expiry credit note, then the agency's
			    certificate, the camera gliding down each to the lines the voice names; the distributor made whole */}
			{(() => {
				const a0 = M.issued, a1 = s.dur, aC = W('n35b', 'certificate') - 0.25;
				const PW = 1162, SC = PW / 1320, VIS = 840, TOP = 92;
				const PAP = [
					{ img: 'paper-expiry', t0: a0 + 0.1, t1: aC, cap: 'The expiry credit note', glide: [[a0 + 0.1, 0], [a0 + 0.6, 110, 2.6]],
						hi: [{ r: [60, 505, 1200, 165], t0: W('n35b', 'credit') - 0.1 }, { r: [598, 632, 692, 52], t0: W('n35b', 'credit') + 0.6 }] },
					{ img: 'paper-cert', t0: aC, t1: a1, cap: 'The certificate of destruction', glide: [[aC, 0], [aC + 1.2, 620]], zoom: [aC + 2.4, a1, 1.06, 1140],
						hi: [{ r: [60, 408, 1200, 60], t0: aC + 0.3 }, { r: [60, 975, 1200, 335], t0: aC + 1.5 }] },
				];
				return (
					<Shot id="issued" t0={a0} t1={a1}>
						{(u) => {
							const T = a0 + u;
							return (
								<AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 35%, #0f2a1d, #040b07 75%)' }}>
									<Footage name="c-issued-bg" t0={0} t1={a1 - a0} push={0.04} blur={10} grade="greenSoft" />
									<AbsoluteFill style={{ background: 'rgba(3,10,7,0.34)' }} />
									{PAP.map((p, i) => {
										// in from the right as the last leaves to the left: one paper on screen at rest, no ghosts beside it
										const kin = i === 0 ? springAt(T, p.t0, FPS, 16, 130) : ramp(T, p.t0 - 0.05, p.t0 + 0.45, EASE_IO);
										const kout = i === PAP.length - 1 ? 0 : ramp(T, p.t1 - 0.05, p.t1 + 0.45, EASE_IO);
										if (T < p.t0 - 0.1 || kout >= 1) return null;
										const x = 960 - PW / 2 + (i === 0 ? 0 : (1 - kin) * 1100) - kout * 1100;
										const y = TOP + (i === 0 ? (1 - kin) * 70 : 0);
										const op = (i === 0 ? clamp(kin * 1.5) : 1) * (1 - kout * 0.9);
										// (each glide point eases in over its own length, 1.4 s by default: the last drifts on to the paper's end)
										let off = 0; p.glide.forEach(([gt, gy, gd = 1.4], k) => { off = k === 0 ? gy * SC : lerp(off, gy * SC, ramp(T, gt, gt + gd, EASE_IO)); });
										return (
											<div key={p.img} style={{ position: 'absolute', left: 0, top: 0, width: PW, opacity: op, transform: `translate3d(${x.toFixed(3)}px, ${y.toFixed(3)}px, 0)` }}>
												<div style={{ position: 'relative', height: VIS, borderRadius: 10, overflow: 'hidden', background: '#fff', boxShadow: '0 40px 90px rgba(0,0,0,0.55)' }}>
													{/* the paper and its highlights move as one: the glide down it, and a slow push in on what is read last
													    (zoom: from, to, scale, about the paper's own line y) where a glide would only show blank paper */}
													<div style={{ position: 'absolute', left: 0, top: 0, width: PW, height: PW * 1867 / 1320,
														transform: `translate3d(0, ${(-off).toFixed(3)}px, 0)` + (p.zoom ? ` scale(${lerp(1, p.zoom[2], ramp(T, p.zoom[0], p.zoom[1], EASE_IO)).toFixed(4)})` : ''),
														transformOrigin: p.zoom ? `50% ${(p.zoom[3] * SC).toFixed(1)}px` : undefined }}>
														<Img src={staticFile(`img/${p.img}.webp`)} style={{ position: 'absolute', left: 0, top: 0, width: PW, height: PW * 1867 / 1320, display: 'block' }} />
														{p.hi.map((h, k) => {
															const a = ramp(T, h.t0, h.t0 + 0.3) * (1 - ramp(T, p.t1 - 0.3, p.t1));
															if (a <= 0) return null;
															const [rx, ry, rw, rh] = h.r;
															return <div key={k} style={{ position: 'absolute', left: rx * SC - 5, top: ry * SC - 5, width: rw * SC + 10, height: rh * SC + 10, borderRadius: 10, border: '3px solid #34d380', background: 'rgba(52,211,128,0.10)', boxShadow: '0 0 0 7px rgba(52,211,128,0.15)', opacity: a }} />;
														})}
													</div>
												</div>
												<div style={{ marginTop: 18, textAlign: 'center', font: `700 30px/1 '${DISPLAY}'`, color: GREEN.ink, opacity: ramp(T, p.t0 + 0.2, p.t0 + 0.5) }}>{p.cap}</div>
											</div>
										);
									})}
									<div style={{ position: 'absolute', left: 0, right: 0, bottom: 34, display: 'flex', justifyContent: 'center', opacity: ramp(T, M.whole, M.whole + 0.4) }}>
										<div style={{ padding: '12px 26px', borderRadius: 999, background: 'rgba(4,20,12,0.82)', border: `1.5px solid ${GREEN.mint2}`, font: `700 30px/1 '${DISPLAY}'`, color: GREEN.pale }}>The distributor is made whole</div>
									</div>
								</AbsoluteFill>
							);
						}}
					</Shot>
				);
			})()}
			<div style={{ display: 'none' }}>{RED}{dlg(s, 'd10').t}{voEnd(s, 'n35')}</div>
		</AbsoluteFill>
	);
};
