// SC-238 · 3: the rule. The distributor reads a mango pack's date at an open carton: not spoiled, just short on days.
// Then, over a quick-commerce dark store turning a short-dated carton away (graded to the brand's green, its story kept):
// FSSAI's direction to e-commerce food businesses (Nov 2024) in detail, its sliding floor on two shelf lives; the
// quick-commerce apps' far stricter gates at their warehouse door; and this batch on its own 180-day life, its marker
// sliding to 22 days, below every line. Every figure lands on its word.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { DISPLAY, EASE, Footage, GREEN, Icon, RED, SANS, clamp, lerp, ramp, springAt } from '../kit/core';
import { Rise, Scrim } from '../kit/ui';
import { FPS, SceneData, shot, voEnd, word } from '../edl';

const AMBER = '#f7c04a';
const panel = (a: number, sp: number, dx = 0, dy = 0): React.CSSProperties => ({
	position: 'absolute', borderRadius: 22, background: 'linear-gradient(180deg, rgba(8,20,14,0.9), rgba(5,12,9,0.9))', border: '1.5px solid rgba(115,201,157,0.34)',
	boxShadow: '0 30px 80px rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', fontFamily: SANS, color: GREEN.ink, opacity: a, boxSizing: 'border-box',
	transform: `translate(${(1 - sp) * dx}px, ${(1 - sp) * dy}px)`,
});
const KICK: React.CSSProperties = { font: `700 15px/1 ${SANS}`, letterSpacing: 2.6, textTransform: 'uppercase' };

const Tile: React.FC<{ k: number; big: string; unit?: string; sub: string; tone?: 'mint' | 'amber'; glow?: number }> = ({ k, big, unit, sub, tone = 'mint', glow = 0 }) => {
	const ink = tone === 'mint' ? '95,227,161' : '247,192,74';
	return (
		<div style={{ width: 330, padding: '18px 22px 16px', borderRadius: 16, boxSizing: 'border-box', opacity: clamp(k * 1.4), transform: `translateY(${(1 - k) * 22}px) scale(${lerp(0.92, 1, k)})`,
			background: `rgba(${ink},${0.1 + 0.08 * glow})`, border: `1.5px solid rgba(${ink},${0.42 + 0.4 * glow})`, boxShadow: `0 0 ${26 * glow}px rgba(${ink},${0.35 * glow})` }}>
			<div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
				<span style={{ font: `760 76px/1 '${DISPLAY}'`, letterSpacing: -2, color: tone === 'mint' ? '#e9fff3' : '#fff4dc' }}>{big}</span>
				{unit && <span style={{ font: `640 32px/1 '${DISPLAY}'`, color: tone === 'mint' ? GREEN.pale : '#ffd98a' }}>{unit}</span>}
			</div>
			<div style={{ marginTop: 10, font: `500 20px/1.25 ${SANS}`, color: '#b5c8bd' }}>{sub}</div>
		</div>
	);
};

export const Rule: React.FC<{ s: SceneData }> = ({ s }) => {
	const t = useCurrentFrame() / FPS;
	const r1 = shot(s, 'rule-mango'), r2 = shot(s, 'rule-darkstore'), r3 = shot(s, 'rule-batch');
	const W30 = word(s, 'n03', 'thirty'), W45 = word(s, 'n03', 'fortyfive'), WDOOR = word(s, 'n03', 'door'), WLEFT = voEnd(s, 'n03') - 0.4;
	const W60 = word(s, 'n04', 'sixty'), W90 = word(s, 'n04', 'ninety'), WFAR = word(s, 'n04', 'far');
	const W22 = word(s, 'n05', 'twentytwo'), WBELOW = word(s, 'n05', 'below');
	const end = s.dur;
	const aIn = s.vo.find((v) => v.key === 'n03')!.t, bIn = s.vo.find((v) => v.key === 'n04')!.t - 0.1, cIn = s.vo.find((v) => v.key === 'n05')!.t - 0.2;
	const fadeOut = 1 - ramp(t, end - 0.4, end);
	// where the cards stand: FSSAI's alone and large while it is read; aside when the apps' card comes; both a strip once
	// the batch's bar takes the frame
	const kB = springAt(t, bIn - 0.1, FPS, 18, 110), kC = springAt(t, cIn - 0.1, FPS, 18, 110);
	// (side by side they stand in the middle of the frame, not along its top: footage above and below them)
	const posA = { x: lerp(lerp(430, 72, kB), 72, kC), y: lerp(lerp(140, 196, kB), 34, kC), k: lerp(lerp(1.22, 1, kB), 0.72, kC) };
	const posB = { x: lerp(980, 72 + 868 * 0.72 + 28, kC), y: lerp(196, 34, kC), k: lerp(1, 0.72, kC) };
	// A, FSSAI's floor
	const aA = Math.min(ramp(t, aIn, aIn + 0.4), fadeOut);
	const sA = springAt(t, aIn, FPS, 16, 120);
	const k30 = springAt(t, W30 - 0.08, FPS, 13, 150), k45 = springAt(t, W45 - 0.08, FPS, 13, 150);
	const ex = ramp(t, WLEFT, WLEFT + 0.5);
	// B, the apps' gates
	const aB = Math.min(ramp(t, bIn, bIn + 0.4), fadeOut);
	const sB = springAt(t, bIn, FPS, 16, 120);
	const k60 = springAt(t, W60 - 0.08, FPS, 13, 150), k90 = springAt(t, W90 - 0.08, FPS, 13, 150);
	// C, this batch
	const aC = Math.min(ramp(t, cIn, cIn + 0.4), fadeOut);
	const sC = springAt(t, cIn, FPS, 16, 120);
	const LIFE = 180, X0 = 60, BW = 1650;
	const xOf = (d: number) => X0 + (d / LIFE) * BW;
	const slide = ramp(t, W22 - 0.25, W22 + 0.85, EASE);
	const days = lerp(LIFE, 22, slide);
	const verdict = springAt(t, WBELOW - 0.05, FPS, 13, 150);
	const lines: { d: number; label: string; who: string; tone: 'mint' | 'amber'; at: number; up: boolean }[] = [
		{ d: 45, label: '45 days', who: 'FSSAI', tone: 'mint', at: cIn + 0.5, up: false },
		{ d: 54, label: '54 · 30%', who: 'FSSAI', tone: 'mint', at: cIn + 0.65, up: true },
		{ d: 90, label: '90 days', who: 'the apps', tone: 'amber', at: cIn + 0.8, up: false },
		{ d: 108, label: '108 · 60%', who: 'the apps', tone: 'amber', at: cIn + 0.95, up: true },
	];
	return (
		<AbsoluteFill style={{ background: '#000' }}>
			<Footage name="rule-mango" t0={r1.t0} t1={r1.t1} push={0.05} origin="55% 45%" />
			<Footage name="rule-darkstore" t0={r2.t0} t1={r2.t1} push={0.06} grade="green" />
			{/* the batch's own cartons again, closer than the godown's wide (the labelled stack on the right) */}
			<Footage name="rule-batch" t0={r3.t0} t1={r3.t1} push={0.06} pushFrom={1.24} origin="74% 56%" grade="green" />
			{t < r1.t1 && (
				<>
					<Scrim side="b" a={0.62} />
					<div style={{ position: 'absolute', left: 92, bottom: 96 }}>
						<Rise t={t} t0={word(s, 'n02', 'Not') - 0.05} t1={r1.t1} text="Not spoiled." size={84} />
						<Rise t={t} t0={word(s, 'n02', 'Just') - 0.05} t1={r1.t1} text="Just short on days." size={84} color={GREEN.pale} />
					</div>
				</>
			)}
			{t >= r2.t0 && <Scrim side="all" a={0.12} />}
			{/* A · FSSAI's direction */}
			{aA > 0 && (
				<div style={{ ...panel(aA, sA, -40, 0), left: posA.x, top: posA.y, width: 868, padding: '26px 30px 26px', transform: `translate(${(1 - sA) * -40}px, 0px) scale(${posA.k})`, transformOrigin: '0 0' }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
						<div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(52,211,128,0.16)', display: 'grid', placeItems: 'center' }}><Icon name="shield-check" size={25} color={GREEN.mint2} sw={2.2} /></div>
						<div>
							<div style={{ ...KICK, color: '#73e0a6' }}>FSSAI · India's food regulator</div>
							<div style={{ marginTop: 6, font: `500 17px/1 ${SANS}`, color: '#9fb7aa' }}>Direction to e-commerce food businesses · November 2024</div>
						</div>
					</div>
					<div style={{ marginTop: 20, font: `700 37px/1.12 '${DISPLAY}'`, letterSpacing: -0.6, opacity: ramp(t, aIn + 0.2, aIn + 0.6) }}>
						Packaged food sold online must reach the consumer's door with at least
					</div>
					<div style={{ marginTop: 20 * ramp(t, W30 - 0.35, W30), height: 152 * EASE(ramp(t, W30 - 0.35, W30 + 0.1)), overflow: 'visible', display: 'flex', alignItems: 'center', gap: 18 }}>
						<Tile k={k30} big="30%" sub="of its shelf life left" glow={ramp(t, WLEFT, WLEFT + 0.4)} />
						<span style={{ font: `700 28px/1 '${DISPLAY}'`, color: '#7a8c82', opacity: clamp(k45 * 1.5) }}>or</span>
						<Tile k={k45} big="45" unit="days" sub="left before expiry, at delivery" glow={ramp(t, WLEFT, WLEFT + 0.4)} />
					</div>
					{/* the floor slides with the shelf life: two worked lives */}
					<div style={{ marginTop: 22 * ex, height: 196 * EASE(ex), overflow: 'hidden', opacity: ex, transform: `translateY(${(1 - ex) * 10}px)` }}>
						<div style={{ ...KICK, fontSize: 13.5, color: '#9fb7aa' }}>The floor slides with the shelf life · the lower of the two</div>
						{[{ n: 'Fresh paneer', life: 10, floor: 3, why: '30% binds' }, { n: 'Chips, biscuits', life: 120, floor: 36, why: '30% binds' }, { n: 'A mango drink', life: 180, floor: 45, why: '45 days binds' }].map((r, i) => {
							const kk = ramp(t, WLEFT + 0.15 + i * 0.25, WLEFT + 0.75 + i * 0.25, EASE);
							return (
								<div key={r.n} style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
									<div style={{ width: 230, font: `600 19px/1.15 ${SANS}` }}>{r.n}<div style={{ font: `500 15px/1 ${SANS}`, color: '#8ea398', marginTop: 4 }}>a {r.life}-day life</div></div>
									<div style={{ position: 'relative', width: 360, height: 14, borderRadius: 7, background: 'rgba(236,243,239,0.10)' }}>
										<div style={{ position: 'absolute', left: 0, top: 0, height: 14, width: 360 * (r.floor / r.life) * kk, borderRadius: 7, background: 'rgba(95,227,161,0.7)' }} />
									</div>
									<div style={{ font: `700 19px/1 ${SANS}`, color: GREEN.pale, whiteSpace: 'nowrap', opacity: kk }}>{r.floor} days <span style={{ fontWeight: 500, color: '#8ea398' }}>· {r.why}</span></div>
								</div>
							);
						})}
					</div>
					<div style={{ position: 'absolute', right: 24, top: 24, font: `500 14px/1 ${SANS}`, color: '#6f8379', opacity: ramp(t, WDOOR, WDOOR + 0.4) }}>at the consumer's door</div>
				</div>
			)}
			{/* B · the quick-commerce apps' gates */}
			{aB > 0 && (
				<div style={{ ...panel(aB, sB, 40, 0), left: posB.x, top: posB.y, width: 868, padding: '26px 30px 26px', borderColor: 'rgba(247,192,74,0.38)', transform: `translate(${(1 - sB) * 40}px, 0px) scale(${posB.k})`, transformOrigin: '0 0' }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
						<div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(247,192,74,0.16)', display: 'grid', placeItems: 'center' }}><Icon name="store" size={24} color={AMBER} sw={2.2} /></div>
						<div>
							<div style={{ ...KICK, color: '#ffd98a' }}>Quick-commerce apps</div>
							<div style={{ marginTop: 6, font: `500 17px/1 ${SANS}`, color: '#9fb7aa' }}>At their warehouse door · as industry guides report them</div>
						</div>
					</div>
					<div style={{ marginTop: 20, font: `700 37px/1.12 '${DISPLAY}'`, letterSpacing: -0.6, opacity: ramp(t, WFAR - 0.1, WFAR + 0.3) }}>
						Far stricter than the law: they take stock only with
					</div>
					<div style={{ marginTop: 20 * ramp(t, W60 - 0.35, W60), height: 152 * EASE(ramp(t, W60 - 0.35, W60 + 0.1)), display: 'flex', alignItems: 'center', gap: 18 }}>
						<Tile k={k60} big="~60%" sub="of the shelf life left" tone="amber" />
						<span style={{ font: `700 28px/1 '${DISPLAY}'`, color: '#7a8c82', opacity: clamp(k90 * 1.5) }}>or</span>
						<Tile k={k90} big="90+" unit="days" sub="left, and up" tone="amber" />
					</div>
					{/* the gate on the same three lives, beside the floor: line for line, how much more the apps ask */}
					{(() => {
						const eb = ramp(t, W90 + 0.25, W90 + 0.75);
						return (
							<div style={{ marginTop: 22 * eb, height: 196 * EASE(eb), overflow: 'hidden', opacity: eb, transform: `translateY(${(1 - eb) * 10}px)` }}>
								<div style={{ ...KICK, fontSize: 13.5, color: '#d8c08a' }}>The gate on the same lives · about 60% of each</div>
								{[{ n: 'Fresh paneer', life: 10 }, { n: 'Chips, biscuits', life: 120 }, { n: 'A mango drink', life: 180 }].map((r, i) => {
									const kk = ramp(t, W90 + 0.4 + i * 0.25, W90 + 1.0 + i * 0.25, EASE), gate = Math.round(r.life * 0.6);
									return (
										<div key={r.n} style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
											<div style={{ width: 230, font: `600 19px/1.15 ${SANS}` }}>{r.n}<div style={{ font: `500 15px/1 ${SANS}`, color: '#8ea398', marginTop: 4 }}>a {r.life}-day life</div></div>
											<div style={{ position: 'relative', width: 360, height: 14, borderRadius: 7, background: 'rgba(236,243,239,0.10)' }}>
												<div style={{ position: 'absolute', left: 0, top: 0, height: 14, width: 360 * 0.6 * kk, borderRadius: 7, background: 'rgba(247,192,74,0.72)' }} />
											</div>
											<div style={{ font: `700 19px/1 ${SANS}`, color: '#ffd98a', whiteSpace: 'nowrap', opacity: kk }}>{gate} days <span style={{ fontWeight: 500, color: '#8ea398' }}>· about 60%</span></div>
										</div>
									);
								})}
							</div>
						);
					})()}
					<div style={{ marginTop: 18, font: `500 18px/1.35 ${SANS}`, color: '#9fb7aa', opacity: ramp(t, W90 + 0.9, W90 + 1.3) }}>
						A dark store turns stock in days, so it turns away anything short-dated long before its date.
					</div>
				</div>
			)}
			{/* C · this batch, below every line */}
			{aC > 0 && (
				<div style={{ ...panel(aC, sC, 0, 30), left: 72, top: 540, width: 1776, height: 360, transform: `translate(0px, ${(1 - sC) * 30}px) scale(1.0)`, transformOrigin: '50% 0' }}>
					<div style={{ position: 'absolute', left: X0, top: 26, display: 'flex', alignItems: 'baseline', gap: 18 }}>
						<span style={{ ...KICK, color: '#73e0a6' }}>This batch</span>
						<span style={{ font: `600 21px/1 ${SANS}`, color: '#cfe2d8' }}>a mango drink · 1,580 packs · a 180-day shelf life</span>
					</div>
					<div style={{ position: 'absolute', left: X0, top: 166, width: BW, height: 26, borderRadius: 13, background: 'rgba(236,243,239,0.10)', overflow: 'hidden' }}>
						<div style={{ position: 'absolute', left: xOf(108) - X0, top: 0, width: BW - (xOf(108) - X0), height: 26, background: 'rgba(95,227,161,0.32)' }} />
						<div style={{ position: 'absolute', left: xOf(54) - X0, top: 0, width: xOf(108) - xOf(54), height: 26, background: 'rgba(247,192,74,0.22)' }} />
					</div>
					<div style={{ position: 'absolute', left: X0, top: 204, font: `500 17px/1 ${SANS}`, color: '#7a8c82' }}>0 days left</div>
					<div style={{ position: 'absolute', left: X0 + BW - 240, width: 240, textAlign: 'right', top: 204, font: `500 17px/1 ${SANS}`, color: '#7a8c82' }}>180 days left · made</div>
					<div style={{ position: 'absolute', left: xOf(130), top: 140, font: `600 16px/1 ${SANS}`, color: GREEN.pale, opacity: ramp(t, cIn + 1.0, cIn + 1.4) }}>every app takes it</div>
					{lines.map((m) => {
						const k = ramp(t, m.at, m.at + 0.3);
						const ink = m.tone === 'mint' ? GREEN.mint2 : AMBER;
						return (
							<div key={m.d} style={{ position: 'absolute', left: xOf(m.d) - 1.5, top: 150, width: 3, height: 54, background: ink, opacity: k }}>
								<div style={{ position: 'absolute', [m.up ? 'bottom' : 'top']: m.up ? 60 : 62, left: '50%', transform: 'translateX(-50%)', textAlign: 'center', whiteSpace: 'nowrap' } as React.CSSProperties}>
									<div style={{ font: `700 22px/1 ${SANS}`, color: ink }}>{m.label}</div>
									<div style={{ marginTop: 5, font: `500 16px/1 ${SANS}`, color: '#8ea398', letterSpacing: 0.4 }}>{m.who}</div>
								</div>
							</div>
						);
					})}
					{/* the batch: from its full life to the 22 days it has */}
					{slide > 0 && (
						<>
							<div style={{ position: 'absolute', left: xOf(days) - 20, top: 159, width: 40, height: 40, borderRadius: 20, background: days < 54.5 ? RED : GREEN.mint2, boxShadow: `0 0 0 7px ${days < 54.5 ? 'rgba(255,107,87,0.28)' : 'rgba(95,227,161,0.28)'}` }} />
							<div style={{ position: 'absolute', left: xOf(days) - 160, width: 320, top: 238, textAlign: 'center', font: `760 48px/1 '${DISPLAY}'`, color: days < 54.5 ? '#ff8a78' : GREEN.ink, whiteSpace: 'nowrap' }}>{Math.round(days)} days left</div>
						</>
					)}
					<div style={{ position: 'absolute', right: 30, top: 22, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderRadius: 999, background: 'rgba(255,107,87,0.16)', border: `1.5px solid ${RED}`,
						font: `700 21px/1 ${SANS}`, color: '#ffd5cd', opacity: clamp(verdict * 1.3), transform: `scale(${lerp(0.88, 1, verdict)})`, transformOrigin: 'right center' }}>
						<Icon name="x" size={20} color={RED} sw={2.6} />Below every line: it cannot be sold online
					</div>
				</div>
			)}
		</AbsoluteFill>
	);
};
