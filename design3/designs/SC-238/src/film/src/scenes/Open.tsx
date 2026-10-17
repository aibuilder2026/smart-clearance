// SC-238 · 1 and 2: the cold open and the godown. Black, a phone rings; the distributor at dawn and the lead at home,
// one call cross-cut, shot and reverse shot; her "Write it off, then." cuts on "then" to the carton's real label, its
// best-before ringed, WRITTEN OFF stamped on it. Then the godown dolly, every carton's printed label tracked, a scan
// tagging each with its days to its best-before, the days running out to day 0.
import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { AMBER, DISPLAY, EASE, EASE_IO, Footage, GREEN, Icon, MONO, RED, SANS, Shot, clamp, lerp, ramp, springAt } from '../kit/core';
import { Ring } from '../kit/device';
import { SAFE, Stamp, jolt } from '../kit/ui';
import { FPS, SceneData, dlg, shot } from '../edl';
import { useTrack } from './tracks';

// the label photo (the label maker's MF-2410-118, 1184 × 896), cover-fitted: its best-before line on the frame
const LBL = { w: 1184, h: 896, bb: [578, 398, 214, 26] as [number, number, number, number] };
const LS = Math.max(1920 / LBL.w, 1080 / LBL.h), LOX = (1920 - LBL.w * LS) / 2, LOY = (1080 - LBL.h * LS) / 2;
const lx = (x: number) => LOX + x * LS, ly = (y: number) => LOY + y * LS;

// the call, as a card the film keeps up across the cut-aways (the first critic of the opening: "what is this scene?"):
// when, how long, and who is on it, each party's own face, role and place; the one on screen lit, bars moving while they
// speak; at the cut to the label the call ends and the card leaves. Then the batch named on its own card.
const PARTY = [
	{ face: 'face-distributor', role: 'The distributor', place: 'Hyderabad · at her godown' },
	{ face: 'face-lead', role: "The brand's supply chain lead", place: 'Pune · at home' },
];
const GLASS: React.CSSProperties = { background: 'rgba(6,18,12,0.74)', border: '1.5px solid rgba(95,227,161,0.40)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', boxShadow: '0 18px 50px rgba(0,0,0,0.42)' };

const Bars: React.FC<{ t: number; on: boolean }> = ({ t, on }) => (
	<div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 20, width: 22 }}>
		{[0, 1, 2].map((i) => (
			<i key={i} style={{ width: 4, borderRadius: 2, background: GREEN.mint2, height: on ? 5 + 13 * (0.5 + 0.5 * Math.sin(t * 13 + i * 1.9)) * (0.6 + 0.4 * Math.sin(t * 5.3 + i)) : 4, opacity: on ? 1 : 0.35 }} />
		))}
	</div>
);

const CallCard: React.FC<{ t: number; t0: number; cut: number; onScreen: (t: number) => number; speaking: (t: number) => boolean }> = ({ t, t0, cut, onScreen, speaking }) => {
	const sp = springAt(t, t0, FPS, 16, 140), out = ramp(t, cut + 0.3, cut + 0.75, EASE_IO);
	const a = clamp((t - t0) / 0.3) * (1 - out); if (a <= 0) return null;
	const ended = t >= cut, secs = Math.max(0, Math.floor(Math.min(t, cut) - 0.53));
	const who = onScreen(t);
	return (
		<div style={{ position: 'absolute', right: SAFE.right, bottom: SAFE.bottom, width: 600, padding: '18px 22px 16px', borderRadius: 22, boxSizing: 'border-box', opacity: a,
			transform: `translateY(${(1 - sp) * 16 + out * 24}px)`, fontFamily: SANS, color: GREEN.ink, ...GLASS }}>
			<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
				<div style={{ position: 'relative', width: 34, height: 34, borderRadius: 17, display: 'grid', placeItems: 'center', background: ended ? 'rgba(255,107,87,0.20)' : 'rgba(52,211,128,0.20)' }}>
					{!ended && <i style={{ position: 'absolute', inset: -6 * ((t * 1.1) % 1), borderRadius: '50%', border: `2px solid ${GREEN.mint2}`, opacity: 1 - ((t * 1.1) % 1) }} />}
					<Icon name="phone" size={18} color={ended ? RED : GREEN.mint2} sw={2.4} />
				</div>
				<span style={{ font: `700 20px/1 ${SANS}`, letterSpacing: 0.3 }}>2 Oct · 6:10 am</span>
				<span style={{ font: `500 17px/1 ${SANS}`, color: ended ? '#ffb3a8' : '#9fb7aa' }}>{ended ? 'Call ended' : 'On a call'}</span>
				<span style={{ marginLeft: 'auto', font: `600 18px/1 ${MONO}`, color: '#cfe2d8', fontVariantNumeric: 'tabular-nums' }}>0:{String(secs).padStart(2, '0')}</span>
			</div>
			<div style={{ height: 1, background: 'rgba(255,255,255,0.09)', margin: '14px 0 12px' }} />
			{PARTY.map((p, i) => {
				const lit = who === i ? 1 : 0;
				return (
					<div key={p.role} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '6px 0', opacity: 0.46 + 0.54 * lit }}>
						<Img src={staticFile(`img/${p.face}.webp`)} style={{ width: 50, height: 50, borderRadius: 25, objectFit: 'cover', border: `2px solid ${lit ? GREEN.mint2 : 'rgba(255,255,255,0.18)'}` }} />
						<div style={{ flex: 1 }}>
							<div style={{ font: `700 22px/1.1 ${SANS}` }}>{p.role}</div>
							<div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 6, font: `500 17px/1 ${SANS}`, color: '#9fb7aa' }}><Icon name="map-pin" size={15} color="#9fb7aa" sw={2.2} />{p.place}</div>
						</div>
						<Bars t={t} on={lit > 0 && speaking(t) && !ended} />
					</div>
				);
			})}
		</div>
	);
};

const BatchCard: React.FC<{ t: number; t0: number; t1: number }> = ({ t, t0, t1 }) => {
	const sp = springAt(t, t0, FPS, 16, 140), a = Math.min(clamp((t - t0) / 0.3), 1 - ramp(t, t1 - 0.25, t1)); if (a <= 0) return null;
	return (
		<div style={{ position: 'absolute', right: SAFE.right, bottom: SAFE.bottom, width: 600, padding: '20px 24px', borderRadius: 22, boxSizing: 'border-box', opacity: a, transform: `translateY(${(1 - sp) * 16}px)`, fontFamily: SANS, color: GREEN.ink, ...GLASS }}>
			<div style={{ display: 'flex', alignItems: 'center', gap: 10, font: `700 15px/1 ${SANS}`, letterSpacing: 3, textTransform: 'uppercase', color: '#73e0a6' }}><Icon name="package" size={17} color={GREEN.mint2} sw={2.3} />The batch</div>
			<div style={{ marginTop: 10, font: `760 40px/1.05 '${DISPLAY}'`, letterSpacing: -0.8, opacity: ramp(t, t0 + 0.1, t0 + 0.4) }}>Mango drink, 200 ml</div>
			<div style={{ marginTop: 8, font: `500 20px/1.3 ${SANS}`, color: '#b5c8bd', opacity: ramp(t, t0 + 0.25, t0 + 0.55) }}>1,580 packs at the distributor's godown</div>
		</div>
	);
};

export const ColdOpen: React.FC<{ s: SceneData }> = ({ s }) => {
	const d4 = dlg(s, 'd04');
	const cut = d4.t + 0.52;                                  // "Write it off, | then." the label on "then"
	const sh = (m: string) => shot(s, m);
	const M = s.marks;
	const t = useCurrentFrame() / FPS;
	return (
		<AbsoluteFill style={{ background: '#000' }}>
			<Footage name="cold-d01" t0={sh('cold-d01').t0} t1={sh('cold-d02').t0} push={0.035} grade="cold" />
			<Footage name="cold-d02" t0={sh('cold-d02').t0} t1={sh('cold-d03').t0} push={0.03} origin="40% 45%" />
			<Footage name="cold-d03" t0={sh('cold-d03').t0} t1={sh('cold-d04').t0} push={0.05} origin="60% 40%" grade="cold" />
			<Footage name="cold-d04" t0={sh('cold-d04').t0} t1={cut} push={0.03} origin="45% 40%" />
			<Shot id="label" t0={cut} t1={s.dur}>
				{(u) => {
					const T = cut + u;
					const zoom = lerp(1.0, 1.16, EASE_IO(clamp(u / (s.dur - cut))));
					const [bx, by, bw, bh] = LBL.bb;
					const ocx = lx(bx + bw / 2), ocy = ly(by + bh / 2);
					const after = ramp(T, M.ringbb + 0.3, M.ringbb + 0.7);
					return (
						<AbsoluteFill style={{ transform: jolt(T, M.stamp) }}>
							<AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: `${ocx}px ${ocy}px` }}>
								<Img src={staticFile('img/label-mango.webp')} style={{ position: 'absolute', left: LOX, top: LOY, width: LBL.w * LS, height: LBL.h * LS }} />
								{/* cold dawn light across the carton, drifting */}
								<AbsoluteFill style={{ background: `linear-gradient(${100 + 8 * u}deg, rgba(120,170,255,0.18), rgba(0,0,0,0) 45%, rgba(0,0,0,0.25))`, mixBlendMode: 'soft-light' }} />
								<svg width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
									<g>{/* the ring on the best-before, in the photo's own pixels */}</g>
								</svg>
								<div style={{ position: 'absolute', left: lx(bx), top: ly(by), width: bw * LS, height: bh * LS }}>
									<Ring t={T} t0={M.ringbb} t1={s.dur + 1} r={[0, 0, bw * LS, bh * LS]} scale={1} tone="red" pad={9} />
								</div>
								<div style={{ position: 'absolute', left: lx(bx + bw) + 30, top: ly(by) - 12, opacity: after, transform: `translateX(${(1 - after) * -16}px)`,
									padding: '10px 16px', borderRadius: 12, background: 'rgba(40,8,6,0.82)', border: `2px solid ${RED}`, font: `700 30px/1 '${DISPLAY}'`, color: '#ffd5cd', whiteSpace: 'nowrap' }}>
									22 days left
								</div>
							</AbsoluteFill>
							<Stamp t={T} t0={M.stamp} x={980} y={600} sub="−₹22,657" size={1.7} rot={-8} />
						</AbsoluteFill>
					);
				}}
			</Shot>
			{/* the call's card over its pictures, then the batch's over the label (both over every picture of the cold open) */}
			<CallCard t={t} t0={M.card} cut={cut}
				onScreen={(u) => (u < sh('cold-d02').t0 ? 0 : u < sh('cold-d03').t0 ? 1 : u < sh('cold-d04').t0 ? 0 : 1)}
				speaking={(u) => s.dlg.some((d) => u >= d.t && u <= d.t + (d.e - d.s))} />
			<BatchCard t={t} t0={M.batch} t1={s.dur} />
		</AbsoluteFill>
	);
};

// the godown's tagged cartons (SC-207's label tracks, cartons.py): the Instant Poha on the left of the aisle, the Mango
// Drink on the right; their days to the best-before run down the month to day 0 (the Mango MF-2410-118 has 22 left on
// 2 Oct, the Poha 200)
const DAYS = { mango: [53, 22], poha: [231, 200] } as const;
const DATES = ['1 Sep', '8 Sep', '15 Sep', '22 Sep', '29 Sep', '2 Oct'];
const DAY_OF = [0, 7, 14, 21, 28, 31];      // each date's day from 1 Sep: the tags step with the date chip, a week at a time
// (SC-245: the tags read as shaky: their days changed every frame, their scale every frame (the text re-drawn each time)
// and twelve crowded the frame. Now each keeps one size, the six clearest are tagged, and the days step with the date.)
const TAGGED = 6;

export const Godown: React.FC<{ s: SceneData }> = ({ s }) => {
	const t = useCurrentFrame() / FPS;
	const tr = useTrack('aisle');
	const m = shot(s, 'godown-aisle');
	const SRC = 5.95, D = m.t1 - m.t0;                       // the clip's 5.95 s played over the shot
	const scan0 = 0.55, scan1 = 2.7, count0 = 3.7, count1 = 6.5;
	const scanX = (u: number) => lerp(-200, 2120, EASE_IO(clamp((u - scan0) / (scan1 - scan0))));
	const ck = EASE_IO(clamp((t - count0) / (count1 - count0)));
	const step = Math.min(DATES.length - 1, Math.floor(ck * (DATES.length - 1) + 0.0001));
	const date = DATES[step];
	// when the date last stepped, for the numbers' flip
	const stepAt = step === 0 ? -1 : (() => { let lo = count0, hi = count1; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (Math.floor(EASE_IO(clamp((m - count0) / (count1 - count0))) * (DATES.length - 1) + 0.0001) >= step) hi = m; else lo = m; } return hi; })();
	const flip = step === 0 ? 1 : ramp(t, stepAt, stepAt + 0.22, EASE);
	// each track's one size (its median width) and the clearest few
	const sizes = tr ? Object.fromEntries(Object.entries(tr.tracks).map(([id, k]) => { const ws = k.f.filter(Boolean).map((v) => v![2]).sort((a, b) => a - b); return [id, ws.length ? ws[Math.floor(ws.length / 2)] : 0]; })) : {};
	// (the six longest in the frame's middle, not the ones the dolly carries out at its edge)
	const inFrame = tr ? Object.fromEntries(Object.entries(tr.tracks).map(([id, k]) => [id, k.f.filter((v) => v && v[0] > 160 && v[0] < 1760).length])) : {};
	const keep = new Set(Object.entries(inFrame).sort((a, b) => b[1] - a[1] || sizes[b[0]] - sizes[a[0]]).slice(0, TAGGED).map(([id]) => id));
	return (
		<AbsoluteFill style={{ background: '#000' }}>
			<Footage name="godown-aisle" t0={m.t0} t1={m.t1} push={0.03} ride={(u) => {
				if (!tr) return null;
				const sf = clamp(u / D) * SRC * tr.fps;               // the clip's frame now
				const i = Math.min(tr.n - 1, Math.floor(sf)), j = Math.min(tr.n - 1, i + 1), k = sf - Math.floor(sf);
				const out: React.ReactNode[] = [];
				// the scan's light
				if (u > scan0 - 0.1 && u < scan1 + 0.3) {
					const x = scanX(u), a = Math.min(ramp(u, scan0 - 0.1, scan0 + 0.2), 1 - ramp(u, scan1, scan1 + 0.3));
					out.push(<div key="scan" style={{ position: 'absolute', left: x - 260, top: 0, width: 520, height: 1080, opacity: a,
						background: 'linear-gradient(90deg, rgba(95,227,161,0) 0%, rgba(95,227,161,0.10) 40%, rgba(160,255,210,0.55) 50%, rgba(95,227,161,0.10) 60%, rgba(95,227,161,0) 100%)', mixBlendMode: 'screen' }} />);
				}
				for (const [id, trk] of Object.entries(tr.tracks)) {
					if (!keep.has(id)) continue;
					const a = trk.f[i], b = trk.f[j] || a; if (!a || !b) continue;
					const cx = lerp(a[0], b[0], k), top = lerp(a[1], b[1], k) - 4;
					if (cx < -40 || cx > 1960) continue;
					const tOn = scan0 + (scan1 - scan0) * clamp((cx + 200) / 2320) * 0.95;   // when the scan passes it
					if (u < tOn) continue;
					const kind = trk.kind as 'mango' | 'poha';
					const [d0, d1] = DAYS[kind];
					const days = Math.round(d0 - (d0 - d1) * DAY_OF[step] / 31);
					const ink = kind === 'poha' ? GREEN.mint2 : days >= 30 ? AMBER : RED;
					const sc = clamp(sizes[id] / 80, 0.8, 1.15);
					const ap = ramp(u, tOn, tOn + 0.25, EASE);
					out.push(
						<div key={id} style={{ position: 'absolute', left: cx, top: top - 8, transform: `translate(-50%, -100%) scale(${sc * lerp(0.7, 1, ap)})`, transformOrigin: '50% 100%', opacity: ap }}>
							<div style={{ padding: '7px 12px 8px', borderRadius: 10, background: 'rgba(6,14,10,0.84)', border: `2px solid ${ink}`, whiteSpace: 'nowrap', textAlign: 'center' }}>
								<div style={{ font: `700 13px/1 ${SANS}`, letterSpacing: 1.6, color: ink }}>{kind === 'mango' ? 'MANGO DRINK' : 'INSTANT POHA'}</div>
								<div style={{ marginTop: 4, font: `760 30px/1 '${DISPLAY}'`, color: '#f4f8f5', fontVariantNumeric: 'tabular-nums', opacity: flip, transform: `translateY(${((1 - flip) * 8).toFixed(2)}px)` }}>{days} <span style={{ font: `700 16px/1 ${SANS}`, letterSpacing: 1.2 }}>DAYS</span></div>
							</div>
							<div style={{ width: 2, height: 16, margin: '0 auto', background: ink }} />
						</div>,
					);
				}
				return <AbsoluteFill>{out}</AbsoluteFill>;
			}} />
			{/* the date: the month running out to day 0 */}
			<div style={{ position: 'absolute', right: SAFE.right, bottom: SAFE.bottom, opacity: Math.min(ramp(t, count0 - 0.6, count0 - 0.2), 1 - ramp(t, s.dur - 0.25, s.dur)),
				display: 'flex', alignItems: 'center', gap: 14, padding: '12px 22px', borderRadius: 999, background: 'rgba(6,14,10,0.78)', border: '1.5px solid rgba(255,255,255,0.16)',
				font: `700 24px/1 ${SANS}`, color: '#eef4f0', fontVariantNumeric: 'tabular-nums' }}>
				<span style={{ font: `600 15px/1 ${MONO}`, color: '#9fb7aa', letterSpacing: 1 }}>TODAY</span>{date} 2026
				{ck >= 0.999 && <span style={{ font: `700 16px/1 ${SANS}`, letterSpacing: 2, color: GREEN.mint2, marginLeft: 4 }}>DAY 0</span>}
			</div>
		</AbsoluteFill>
	);
};
