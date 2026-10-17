// SC-238 · 10 to 12: the record, the call weeks later, and the close.
// The record: every paper flat and square on a row, each landing on its word, the camera gliding along them and down
// each while its line is ringed, over the footage of what it records (graded to the brand's green): the tax invoice and
// its e-invoice (the truck), the credit note (the godown), the tax-credit memo (the office), the receipts (the food
// bank), the destruction log, step by step (the landfill; the certificate itself is read with the chips). Then the
// audit trail (SC-211's, captured frame-exact on these words), then the lead's tablet at dusk: how the batch adds up
// against the bin, the impact ledger, the mango's own line. The call: two people, one phone call, evening. The close:
// the line, then the card held five seconds.
import React from 'react';
import { AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { DISPLAY, EASE, EASE_IO, Footage, GREEN, Icon, SANS, clamp, lerp, Media, ramp, springAt } from '../kit/core';
import { Mark } from '../kit/device';
import { Clock, Rise } from '../kit/ui';
import { PlanShots } from '../kit/plan';
import { FPS, SceneData, shot, voEnd, word } from '../edl';

// a paper's image is 1320 × 1867 (an A4 page at 200 dpi, scaled); its lines in those pixels. Each paper lands on its
// word, large and square in the middle of the frame, its neighbours at the sides; the camera glides down it to the line
// the voice names (glide: 0 the top, 1 the foot of what shows)
type Paper = { img: string; at: string; bg: string; label: string; hi: [number, number, number, number][]; glide?: number };
const PAPERS: Paper[] = [
	{ img: 'paper-invoice', at: 'drawn', bg: 'r-truck', label: 'Tax invoice', hi: [[60, 320, 1200, 330]], glide: 0.0 },
	{ img: 'paper-invoice', at: 'signed', bg: 'r-truck', label: 'Signed by the seller', hi: [[985, 1495, 270, 240]], glide: 1.0 },
	{ img: 'paper-invoice', at: 'gst', bg: 'r-truck', label: 'GST, line by line', hi: [[60, 975, 1200, 215], [60, 1265, 1200, 110]], glide: 0.62 },
	{ img: 'paper-invoice', at: 'einv', bg: 'r-truck', label: 'Its e-invoice: IRN and QR', hi: [[60, 138, 1200, 175]], glide: 0.0 },
	{ img: 'paper-support', at: 'credit', bg: 'r-godown', label: 'Credit note', hi: [[60, 465, 1200, 255]], glide: 0.1 },
	{ img: 'paper-itc', at: 'memo', bg: 'r-office', label: 'Tax-credit memo', hi: [[100, 255, 1110, 120], [100, 555, 1110, 85]], glide: 0.0 },
	{ img: 'paper-receipt', at: 'receipts', bg: 'r-foodbank', label: 'Food bank receipt', hi: [[100, 500, 1110, 140], [100, 780, 1110, 52]], glide: 0.0 },
	{ img: 'paper-cert2', at: 'certs', bg: 'r-landfill', label: 'Its destruction log, step by step', hi: [[40, 150, 1240, 345], [1030, 150, 232, 1150]], glide: 0.3 },
];
const PW = 760, PH = PW * 1867 / 1320, VIS = 880, GAP = 170;

export const Record: React.FC<{ s: SceneData }> = ({ s }) => {
	const t = useCurrentFrame() / FPS;
	const M = s.marks;
	const W = (k: string, w: string, n = 0) => word(s, k, w, n);
	const papersEnd = M.audit;
	const AT: Record<string, number> = { ...M, drawn: W('n36', 'drawn') - 0.5, signed: W('n36', 'signed') - 0.1 };
	// which paper is in focus, and the camera's x along the row (a glide between them, eased)
	const at = PAPERS.map((p) => AT[p.at]);
	const IMGS = PAPERS.map((p) => p.img).filter((v, i, a) => a.indexOf(v) === i);
	const slot = (i: number) => IMGS.indexOf(PAPERS[i].img);
	const xOf = (i: number) => slot(i) * (PW + GAP);
	let camX = 0;
	for (let i = 0; i < at.length; i++) {
		const k = ramp(t, at[i] - 0.15, at[i] + 0.4, EASE_IO);
		camX = i === 0 ? xOf(0) : lerp(camX, xOf(i), k);
	}
	return (
		<AbsoluteFill style={{ background: '#030a07' }}>
			{/* the footage of what each paper records, under the brand's green; it cuts mid-slide, on the camera's move */}
			{PAPERS.map((p, i) => {
				const t0 = i === 0 ? 0 : at[i] + 0.12, t1 = i === PAPERS.length - 1 ? papersEnd + 0.3 : at[i + 1] + 0.12;
				if (p.bg === PAPERS[i - 1]?.bg) return null;
				let j = i + 1; while (j < PAPERS.length && PAPERS[j].bg === p.bg) j++;
				const tt1 = j >= PAPERS.length ? papersEnd + 0.3 : at[j] + 0.12;
				return <Footage key={i} name={p.bg} t0={t0} t1={Math.max(t1, tt1)} push={0.06} blur={6} grade="greenSoft" />;
			})}
			{t < papersEnd + 0.3 && (
				<>
					<AbsoluteFill style={{ background: 'rgba(3,10,7,0.2)' }} />
					<div style={{ position: 'absolute', left: 0, right: 0, top: 46, textAlign: 'center' }}>
						<Rise t={t} t0={W('n36', 'Every') - 0.05} t1={papersEnd} text="Every paper drawn, signed and reviewed" size={46} weight={700} align="center" />
					</div>
					{/* reviewed: the lead's sign-off stamped on the pack */}
					{(() => { const r0 = W('n36', 'reviewed') - 0.1, a = Math.min(ramp(t, r0, r0 + 0.25), 1 - ramp(t, M.gst - 0.2, M.gst + 0.1)); if (a <= 0) return null; const sp = springAt(t, r0, FPS, 10, 220);
						return <div style={{ position: 'absolute', left: 884, top: 760, transform: `rotate(-8deg) scale(${lerp(1.6, 1, clamp(sp))})`, opacity: a, padding: '12px 22px', border: '5px solid #34d380', borderRadius: 12, font: `800 46px/1 '${DISPLAY}'`, color: '#5fe3a1', background: 'rgba(4,20,12,0.6)', letterSpacing: 2 }}>REVIEWED ✓</div>; })()}
					{/* the row of papers, flat and square, the camera on the one in focus */}
					<AbsoluteFill style={{ transform: `translateX(${960 - PW / 2 - camX}px)` }}>
						{PAPERS.map((p, i) => {
							if (PAPERS.findIndex((q) => q.img === p.img) !== i) return null;
							const land = springAt(t, at[i] - 0.45, FPS, 16, 130);
							const dx = Math.abs(xOf(i) - camX), near = Math.pow(clamp(1 - dx / (PW + GAP)), 0.8);
							// the glide down the page while its line is said
							let gl = 0;
							PAPERS.forEach((q, k) => { if (q.img === p.img && t >= at[k] - 0.5) gl = lerp(gl, q.glide ?? 0, ramp(t, at[k] - 0.5, at[k] + 0.3, EASE_IO)); });
							const vis = VIS;                     // the frame shows VIS px of the page; the glide moves down it
							const off = gl * (PH - vis);
							return (
								// (opaque once landed: the row pans as a camera would, a paper never seen through another; the one out of
								// focus only a touch smaller. The page and its rings glide as one, by a transform, at sub-pixel steps)
								<div key={p.img + i} style={{ position: 'absolute', left: xOf(i), top: 128, width: PW, height: vis, opacity: clamp(land * 1.4), transform: `translateY(${(1 - land) * 90}px) scale(${lerp(0.94, 1, near)})`,
									transformOrigin: '50% 0%', borderRadius: 8, overflow: 'hidden', background: '#fff', boxShadow: '0 40px 90px rgba(0,0,0,0.55)' }}>
									<div style={{ position: 'absolute', left: 0, top: 0, width: PW, height: PH, transform: `translate3d(0, ${(-off).toFixed(3)}px, 0)` }}>
										<Img src={staticFile(`img/${p.img}.webp`)} style={{ position: 'absolute', left: 0, top: 0, width: PW, height: PH }} />
										{PAPERS.map((q, k) => q.img === p.img && q.hi.map(([x, y, w, h], n) => {
											const a = Math.min(ramp(t, at[k] + 0.05, at[k] + 0.35), 1 - ramp(t, (at[k + 1] ?? papersEnd) - 0.15, at[k + 1] ?? papersEnd));
											if (a <= 0) return null;
											const sc = PW / 1320;
											return <div key={`${k}-${n}`} style={{ position: 'absolute', left: x * sc - 4, top: y * sc - 4, width: w * sc + 8, height: h * sc + 8, borderRadius: 8, border: '3px solid #34d380', background: 'rgba(52,211,128,0.10)', opacity: a, boxShadow: '0 0 0 6px rgba(52,211,128,0.15)' }} />;
										}))}
									</div>
									<div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 60, background: 'linear-gradient(180deg, rgba(255,255,255,0), #fff)' }} />
								</div>
							);
						})}
						{PAPERS.map((p, i) => {
							const a = Math.min(ramp(t, at[i], at[i] + 0.3), 1 - ramp(t, (at[i + 1] ?? papersEnd) - 0.1, (at[i + 1] ?? papersEnd) + 0.1));
							if (a <= 0) return null;
							const px = PAPERS.findIndex((q) => q.img === p.img);
							return <div key={`l${i}`} style={{ position: 'absolute', left: xOf(px), width: PW, top: 128 + VIS + 20, textAlign: 'center', opacity: a, font: `700 32px/1 '${DISPLAY}'`, color: GREEN.ink }}>{p.label}</div>;
						})}
					</AbsoluteFill>
				</>
			)}
			{/* the audit trail (audit11, captured on n37) */}
			<Sequence from={Math.round(M.audit * FPS)} durationInFrames={Math.round(M.swing * FPS) - Math.round(M.audit * FPS)} layout="none">
				<AbsoluteFill>
					<Footage name="r-office" t0={0} t1={(Math.round(M.swing * FPS) - Math.round(M.audit * FPS)) / FPS} push={0.05} blur={14} grade="green" />
					<AbsoluteFill style={{ background: 'rgba(3,10,7,0.35)' }} />
					<Media name='audit' style={{ width: '100%', height: '100%', mixBlendMode: 'screen' }} />
				</AbsoluteFill>
			</Sequence>
			{/* the lead's tablet at dusk: the swing, the ledger, the mango's own line (plan.py's shots) */}
			<PlanShots s={s} skip={PAPERS.map((p) => p.bg)} />
			<div style={{ display: 'none' }}>{voEnd(s, 'n38b')}{SANS}{Icon.name}</div>
		</AbsoluteFill>
	);
};

export const EveningCall: React.FC<{ s: SceneData }> = ({ s }) => {
	const t = useCurrentFrame() / FPS;
	const a = shot(s, 'call-d12'), b = shot(s, 'call-d13');
	return (
		<AbsoluteFill style={{ background: '#000' }}>
			<Footage name="call-d12" t0={0} t1={b.t0} push={0.03} grade="dusk" />
			<Footage name="call-d13" t0={b.t0} t1={s.dur} push={0.03} origin="45% 40%" />
			<Clock t={t} t0={0.2} t1={s.dur} label="Weeks later" sub="the evening call" />
			<div style={{ display: 'none' }}>{a.t0}</div>
		</AbsoluteFill>
	);
};

export const Close: React.FC<{ s: SceneData }> = ({ s }) => {
	const t = useCurrentFrame() / FPS;
	const M = s.marks;
	const W = (k: string, w: string, n = 0) => word(s, k, w, n);
	const town = shot(s, 'close-town');
	const card = ramp(t, M.cta - 0.2, M.cta + 0.6, EASE);
	const lineOut = ramp(t, M.cta - 0.5, M.cta, EASE);
	return (
		<AbsoluteFill style={{ background: '#03100a' }}>
			{/* the town the packs went to, seen, under the brand's green (not crushed: it is the film's last picture) */}
			<Footage name="close-town" t0={town.t0} t1={town.t1} push={0.07} grade="greenSoft" />
			<AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 46%, rgba(3,16,10,0.42), rgba(3,10,7,0.58) 82%)' }} />
			{/* the line, word by word */}
			<div style={{ position: 'absolute', left: 0, right: 0, top: 268, textAlign: 'center', opacity: 1 - lineOut }}>
				<div style={{ display: 'inline-block', marginBottom: 30, opacity: ramp(t, 0.15, 0.5) }}><Mark size={156} draw={ramp(t, 0.2, Math.max(1.4, W('n39', 'Smart') + 0.4), EASE_IO)} /></div>
				<Rise t={t} t0={W('n39', 'Smart') - 0.05} text="Smart-Clearance" size={128} align="center" />
				<div style={{ marginTop: 24 }}>
					<Rise t={t} t0={W('n39', 'ten') - 0.05} text="Ten agents. One yes." size={78} weight={650} align="center" color={GREEN.pale} />
				</div>
				<div style={{ marginTop: 16 }}>
					<Rise t={t} t0={W('n39', 'nothing') - 0.05} text="And nothing good goes to waste." size={56} weight={600} align="center" color="#dcebe3" />
				</div>
			</div>
			{/* the card: the guided demo, held five seconds after the last word */}
			{card > 0 && (
				<div style={{ position: 'absolute', left: 0, right: 0, top: 128, display: 'flex', justifyContent: 'center', opacity: card, transform: `translateY(${(1 - card) * 26}px) scale(1.3)`, transformOrigin: '50% 0' }}>
					<div style={{ display: 'flex', gap: 54, alignItems: 'center', padding: '46px 56px', borderRadius: 32, background: 'linear-gradient(180deg, rgba(10,26,18,0.92), rgba(5,14,10,0.92))', border: '1.5px solid rgba(95,227,161,0.35)', boxShadow: '0 40px 100px rgba(0,0,0,0.5)' }}>
						<div>
							<div style={{ display: 'flex', alignItems: 'center', gap: 16 }}><Mark size={64} /><span style={{ font: `700 40px/1 '${DISPLAY}'`, color: GREEN.ink }}>Smart-Clearance</span></div>
							<div style={{ marginTop: 34, font: `760 72px/1.02 '${DISPLAY}'`, color: GREEN.ink, letterSpacing: -1.5 }}>Try the guided demo</div>
							<div style={{ marginTop: 14, font: `600 30px/1.2 ${SANS}`, color: GREEN.pale }}>No sign-in. Ten minutes. Every screen.</div>
							<div style={{ marginTop: 30, display: 'inline-flex', alignItems: 'center', gap: 12, padding: '16px 24px', borderRadius: 999, background: '#167a52', font: `700 30px/1 ${SANS}`, color: '#fff' }}>
								<Icon name="arrow-right" size={28} color="#fff" sw={2.6} />smartclearance-demo.web.app
							</div>
							<div style={{ marginTop: 22, font: `500 24px/1.3 ${SANS}`, color: '#9fb7aa' }}>or book a demo at smartclearance.web.app</div>
						</div>
						<div style={{ padding: 18, borderRadius: 20, background: '#fff' }}>
							<Img src={staticFile('img/qr-demo.png')} style={{ width: 300, height: 300, display: 'block', imageRendering: 'pixelated' }} />
						</div>
					</div>
				</div>
			)}
		</AbsoluteFill>
	);
};
