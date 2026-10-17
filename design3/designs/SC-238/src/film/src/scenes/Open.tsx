// SC-238 · 1 and 2: the cold open and the godown. Black, a phone rings; the distributor at dawn and the lead at home,
// one call cross-cut, shot and reverse shot; her "Write it off, then." cuts on "then" to the carton's real label, its
// best-before ringed, WRITTEN OFF stamped on it. Then the godown dolly, every carton's printed label tracked, a scan
// tagging each with its days to its best-before, the days running out to day 0.
import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { AMBER, DISPLAY, EASE, EASE_IO, Footage, GREEN, MONO, RED, SANS, Shot, clamp, lerp, ramp } from '../kit/core';
import { Ring } from '../kit/device';
import { Stamp, jolt } from '../kit/ui';
import { FPS, SceneData, dlg, shot } from '../edl';
import { useTrack } from './tracks';

// the label photo (the label maker's MF-2410-118, 1184 × 896), cover-fitted: its best-before line on the frame
const LBL = { w: 1184, h: 896, bb: [578, 398, 214, 26] as [number, number, number, number] };
const LS = Math.max(1920 / LBL.w, 1080 / LBL.h), LOX = (1920 - LBL.w * LS) / 2, LOY = (1080 - LBL.h * LS) / 2;
const lx = (x: number) => LOX + x * LS, ly = (y: number) => LOY + y * LS;

export const ColdOpen: React.FC<{ s: SceneData }> = ({ s }) => {
	const d4 = dlg(s, 'd04');
	const cut = d4.t + 0.52;                                  // "Write it off, | then." the label on "then"
	const sh = (m: string) => shot(s, m);
	const M = s.marks;
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
		</AbsoluteFill>
	);
};

// the godown's tagged cartons (SC-207's label tracks, cartons.py): the Instant Poha on the left of the aisle, the Mango
// Drink on the right; their days to the best-before run down the month to day 0 (the Mango MF-2410-118 has 22 left on
// 2 Oct, the Poha 200)
const DAYS = { mango: [53, 22], poha: [231, 200] } as const;
const DATES = ['1 Sep', '8 Sep', '15 Sep', '22 Sep', '29 Sep', '2 Oct'];

export const Godown: React.FC<{ s: SceneData }> = ({ s }) => {
	const t = useCurrentFrame() / FPS;
	const tr = useTrack('aisle');
	const m = shot(s, 'godown-aisle');
	const SRC = 5.95, D = m.t1 - m.t0;                       // the clip's 5.95 s played over the shot
	const scan0 = 0.55, scan1 = 2.7, count0 = 3.7, count1 = 6.5;
	const scanX = (u: number) => lerp(-200, 2120, EASE_IO(clamp((u - scan0) / (scan1 - scan0))));
	const ck = EASE_IO(clamp((t - count0) / (count1 - count0)));
	const date = DATES[Math.min(DATES.length - 1, Math.floor(ck * (DATES.length - 1) + 0.0001))];
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
					const a = trk.f[i], b = trk.f[j] || a; if (!a || !b) continue;
					const cx = lerp(a[0], b[0], k), top = lerp(a[1], b[1], k) - 4, w = lerp(a[2], b[2], k);
					if (cx < -40 || cx > 1960) continue;
					const tOn = scan0 + (scan1 - scan0) * clamp((cx + 200) / 2320) * 0.95;   // when the scan passes it
					if (u < tOn) continue;
					const kind = trk.kind as 'mango' | 'poha';
					const [d0, d1] = DAYS[kind];
					const days = Math.round(lerp(d0, d1, ck));
					const ink = kind === 'poha' ? GREEN.mint2 : days >= 30 ? AMBER : RED;
					const sc = clamp(w / 120, 0.55, 1.15);
					const ap = ramp(u, tOn, tOn + 0.25, EASE);
					out.push(
						<div key={id} style={{ position: 'absolute', left: cx, top: top - 8, transform: `translate(-50%, -100%) scale(${sc * lerp(0.7, 1, ap)})`, transformOrigin: '50% 100%', opacity: ap }}>
							<div style={{ padding: '7px 12px 8px', borderRadius: 10, background: 'rgba(6,14,10,0.84)', border: `2px solid ${ink}`, whiteSpace: 'nowrap', textAlign: 'center' }}>
								<div style={{ font: `700 13px/1 ${SANS}`, letterSpacing: 1.6, color: ink }}>{kind === 'mango' ? 'MANGO DRINK' : 'INSTANT POHA'}</div>
								<div style={{ marginTop: 4, font: `760 30px/1 '${DISPLAY}'`, color: '#f4f8f5', fontVariantNumeric: 'tabular-nums' }}>{days} <span style={{ font: `700 16px/1 ${SANS}`, letterSpacing: 1.2 }}>DAYS</span></div>
							</div>
							<div style={{ width: 2, height: 16, margin: '0 auto', background: ink }} />
						</div>,
					);
				}
				return <AbsoluteFill>{out}</AbsoluteFill>;
			}} />
			{/* the date: the month running out to day 0 */}
			<div style={{ position: 'absolute', left: '50%', top: 54, transform: 'translateX(-50%)', opacity: Math.min(ramp(t, count0 - 0.6, count0 - 0.2), 1 - ramp(t, s.dur - 0.25, s.dur)),
				display: 'flex', alignItems: 'center', gap: 14, padding: '12px 22px', borderRadius: 999, background: 'rgba(6,14,10,0.78)', border: '1.5px solid rgba(255,255,255,0.16)',
				font: `700 24px/1 ${SANS}`, color: '#eef4f0', fontVariantNumeric: 'tabular-nums' }}>
				<span style={{ font: `600 15px/1 ${MONO}`, color: '#9fb7aa', letterSpacing: 1 }}>TODAY</span>{date} 2026
				{ck >= 0.999 && <span style={{ font: `700 16px/1 ${SANS}`, letterSpacing: 2, color: GREEN.mint2, marginLeft: 4 }}>DAY 0</span>}
			</div>
		</AbsoluteFill>
	);
};
