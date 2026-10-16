// SC-219 cut 12, concept C · Inside the machine: a product film shot in macro inside the data centre's machines
// (Qwen plates, LTX camera moves): light running down the fibres for "all Google Cloud"; then a rack focus onto the
// servers' sleds, where each part of the stack is set in large type as the voice names it, the four apps as glass
// tiles, Cloud Run's sled lit along its edge, the record's lights cascading down the sleds.
import React from 'react';
import { AbsoluteFill, Img, Sequence, staticFile, useVideoConfig } from 'remotion';
import { Audio, Video } from '@remotion/media';
import { evolvePath } from '@remotion/paths';
import { CUE, EASE, EASE_IO, Finish, INK, IndexBar, clamp, fade, lerp, ramp, springAt, useT } from '../lib/base';
import { Ride, applyH, useClipT, useTrack } from '../lib/track';
import { Icon } from '../lib/base';

export const HAVE_CLIPS_C = { fibre: true, blade: true };
const CUT = 3.45;

const Plate: React.FC<{ name: string; clip: boolean; from: number; push?: number; blur?: number }> = ({ name, clip, from, push = 0.05, blur = 0 }) => {
	const t = useT(); const { fps } = useVideoConfig();
	const style: React.CSSProperties = { position: 'absolute', width: 1920, height: 1080, filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined };
	if (clip) return <Video src={staticFile(`clips/${name}.mp4`)} muted premountFor={fps} objectFit="cover" style={style} />;
	const k = clamp((t - from) / 6.5);
	return <Img src={staticFile(`plates/${name}.jpg`)} style={{ ...style, scale: String(1 + push * k), transformOrigin: '55% 50%' }} />;
};

// light running down the fibres (the first frame of the fibre clip, 1920 × 1080)
const PULSES = [
	'M 300 820 C 700 640, 1050 470, 1420 330', 'M 380 905 C 760 725, 1080 565, 1480 405', 'M 620 560 C 800 700, 980 860, 1120 1000',
	'M 860 520 C 1000 650, 1130 820, 1240 985', 'M 1100 440 C 1230 560, 1350 740, 1450 900', 'M 200 700 C 560 560, 920 430, 1300 300',
];

/** a headline set large: its kicker, its words rising out of a mask, a light passing across them, a line of specifics */
const Big: React.FC<{ k: string; h: string; spec: string; tone: string; t0: number; t1: number; x?: number; y?: number; size?: number }> = ({ k, h, spec, tone, t0, t1, x = 96, y = 690, size = 120 }) => {
	const t = useT(); const out = ramp(t, t1 - 0.32, t1, EASE_IO); if (t < t0 - 0.05 || out >= 1) return null;
	const words = h.split(' ');
	const shine = clamp((t - t0 - 0.35) / 0.9);
	return (
		<div style={{ position: 'absolute', left: x, top: y, opacity: 1 - out, translate: `0 ${-out * 30}px` }}>
			<div style={{ display: 'flex', alignItems: 'center', gap: 14, font: "700 16px/1 'Geist'", letterSpacing: 3.6, textTransform: 'uppercase', color: tone, opacity: ramp(t, t0, t0 + 0.3) }}>
				<span style={{ width: 46 * ramp(t, t0, t0 + 0.45, EASE), height: 2, background: tone, display: 'inline-block' }} />{k}
			</div>
			<h1 style={{ margin: '14px 0 0', font: `700 ${size}px/0.98 'Bricolage Grotesque'`, letterSpacing: -size * 0.035, whiteSpace: 'nowrap', color: INK.ink }}>
				{words.map((w, i) => {
					const kk = ramp(t, t0 + 0.08 + i * 0.1, t0 + 0.62 + i * 0.1);
					return (
						<span key={i} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom', paddingBottom: Math.round(size * 0.2), marginBottom: -Math.round(size * 0.2) }}>
							<span style={{
								display: 'inline-block', translate: `0 ${(1 - kk) * 112}%`,
								backgroundImage: `linear-gradient(100deg, ${INK.ink} 0%, ${INK.ink} ${shine * 130 - 30}%, #ffffff ${shine * 130 - 14}%, ${tone} ${shine * 130 - 4}%, ${INK.ink} ${shine * 130 + 8}%, ${INK.ink} 100%)`,
								WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
							}}>{w}</span>{i < words.length - 1 ? ' ' : ''}
						</span>
					);
				})}
			</h1>
			<div style={{ marginTop: 18, maxWidth: 560, font: "500 21px/1.4 ui-monospace, 'SF Mono', Menlo, monospace", color: INK.ink2, opacity: ramp(t, t0 + 0.45, t0 + 0.85), letterSpacing: 0.2 }}>{spec}</div>
		</div>
	);
};

// the servers' sleds in the blade clip's first frame: the pulled-out sled's edge, and the activity lights' column
const SLED_EDGE = 'M 696 432 L 1588 454';
const SLED_FOOT = 'M 588 562 L 1582 598';
const SLED_FACE = 'M 586 430 L 1590 452 L 1584 600 L 586 564 Z';
const ROWS: [number, number, number, number][] = [[660, 112, 1640, 40], [655, 318, 1640, 268], [700, 500, 1585, 520], [650, 662, 1640, 712], [645, 852, 1640, 912], [640, 985, 1600, 1050]];
const LEDS: [number, number][] = [122, 322, 662, 852, 985].flatMap((y, r) => [0, 1, 2, 3].map((j) => [668 + j * 21 - r * 6, y + j * 1.5] as [number, number]));

const Sleds: React.FC = () => {
	const t = useT(); const { fps } = useVideoConfig();
	const track = useTrack('dc-c2-blade'); const ct = useClipT(CUT);
	const runLit = ramp(t, CUE.run - 0.05, CUE.run + 0.5);
	const ev = evolvePath(ramp(t, CUE.run, CUE.run + 0.7, EASE), SLED_EDGE);
	const apps = [['app-landing.webp', 'Landing page'], ['app-console.webp', 'Console'], ['app-workspace.webp', 'Workspace'], ['app-demo.webp', 'Guided demo']].map(([src, b], i) => {
		const k = springAt(t, CUE.apps + i * 0.12, fps, 15, 150); const out = ramp(t, CUE.api + 0.1, CUE.api + 0.6, EASE_IO);
		if (k <= 0.01 || out >= 1) return null;
		return (
			<div key={src} style={{ position: 'absolute', left: 900 + i * 212, top: 96 + (1 - k) * 60 - out * 40, width: 196, opacity: clamp(k * 1.5) * (1 - out) }}>
				<div style={{ height: 124, borderRadius: 10, overflow: 'hidden', border: '1.4px solid rgba(255,190,120,0.8)', boxShadow: '0 0 30px rgba(255,159,69,0.35), 0 24px 50px rgba(0,0,0,0.55)' }}>
					<Img src={staticFile(`img/${src}`)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
				</div>
				<div style={{ marginTop: 10, font: "650 15px/1 'Geist'", color: '#ffe3c7', display: 'flex', alignItems: 'center', gap: 7 }}><Icon name="flame" size={15} color={INK.fire} />{b}</div>
			</div>
		);
	});
	const anchor = applyH(track, 'sled', ct, 1140, 442);
	return (
		<AbsoluteFill>
			<Ride track={track} region="sled" clipT={ct}>
				<svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
					<defs><filter id="cg"><feGaussianBlur stdDeviation={9} /></filter></defs>
					{runLit > 0 && <path d={SLED_EDGE} fill="none" stroke={INK.blue} strokeWidth={20} filter="url(#cg)" opacity={runLit} strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} />}
					{runLit > 0 && <path d={SLED_EDGE} fill="none" stroke="#eaf2ff" strokeWidth={4} opacity={runLit} strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} strokeLinecap="round" />}
					{runLit > 0 && <path d={SLED_FOOT} fill="none" stroke={INK.blue} strokeWidth={16} filter="url(#cg)" opacity={0.8 * runLit} strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} />}
					{runLit > 0 && <path d={SLED_FACE} fill={INK.blue} opacity={0.2 * runLit * (1 - 0.5 * ramp(t, CUE.sql, CUE.sql + 0.6))} style={{ mixBlendMode: 'screen' }} />}
					{ROWS.map(([x0, y0, x1, y1], i) => {
						const p = (t - CUE.sql - 0.1 - i * 0.13) / 0.55; if (p <= 0) return null;
						const e = EASE(clamp(p)); const hx = lerp(x1, x0, e), hy = lerp(y1, y0, e);
						return (
							<g key={`w${i}`}>
								<line x1={x1} y1={y1} x2={hx} y2={hy} stroke={INK.blue} strokeWidth={10} filter="url(#cg)" opacity={0.55} />
								<line x1={x1} y1={y1} x2={hx} y2={hy} stroke="#dfeaff" strokeWidth={2.2} opacity={0.85} />
								{p < 1 && <circle cx={hx} cy={hy} r={6} fill="#ffffff" filter="url(#cg)" />}
							</g>
						);
					})}
					{LEDS.map(([x, y], i) => {
						const k = clamp((t - CUE.sql - 0.15 - Math.floor(i / 4) * 0.16 - (i % 4) * 0.04) / 0.22); const blink = 0.7 + 0.3 * Math.sin(t * 11 + i * 1.7);
						return k > 0 ? <g key={i}><circle cx={x} cy={y} r={11} fill={INK.blue} opacity={0.5 * k * blink} filter="url(#cg)" /><circle cx={x} cy={y} r={4} fill="#eaf2ff" opacity={k * blink} /></g> : null;
					})}
				</svg>
			</Ride>
			{apps}
			{runLit > 0 && <div style={{ position: 'absolute', left: anchor[0], top: anchor[1], width: 14, height: 14, borderRadius: '50%', translate: '-50% -50%', background: INK.blue2, boxShadow: `0 0 0 ${10 + 18 * ((t * 0.9) % 1)}px rgba(138,180,248,${(0.45 * (1 - ((t * 0.9) % 1))).toFixed(3)})`, opacity: runLit * fade(t, CUE.run, CUE.sql + 0.2, 0.2, 0.3) }} />}
		</AbsoluteFill>
	);
};

export const InsideMachineScene: React.FC = () => {
	const t = useT(); const { fps } = useVideoConfig();
	const track = useTrack('dc-c1-fibre'); const ct = useClipT(0);
	const focusOut = ramp(t, CUT - 0.42, CUT, EASE_IO), focusIn = 1 - ramp(t, CUT, CUT + 0.7, EASE);
	const burst = (i: number) => {
		const starts = [0.35, 1.1, 1.75, CUE.google - 0.05, CUE.google + 0.08, CUE.google + 0.2, 2.95];
		return starts.map((s, j) => {
			const p = (t - s - (i % 3) * 0.07) / 0.9; if (p <= 0 || p >= 1 || (j % PULSES.length) % 2 !== i % 2 && j < 3) return null;
			const ev = evolvePath(1, PULSES[i]); const L = parseFloat(String(ev.strokeDasharray).split(' ')[0]);
			return <path key={j} d={PULSES[i]} fill="none" stroke={INK.mint2} strokeWidth={4} strokeLinecap="round" strokeDasharray={`${L * 0.08} ${L * 2}`} strokeDashoffset={-L * (p * 1.1 - 0.08)} style={{ filter: 'drop-shadow(0 0 9px #5fe3a1)' }} />;
		});
	};
	const dock = ramp(t, CUT - 0.1, CUT + 0.6, EASE_IO);
	return (
		<AbsoluteFill style={{ background: '#000' }}>
			<Sequence durationInFrames={Math.round((CUT + 0.1) * fps)} premountFor={fps}>
				<Plate name="dc-c1-fibre" clip={HAVE_CLIPS_C.fibre} from={0} blur={14 * focusOut * focusOut} />
			</Sequence>
			{t < CUT + 0.1 && (
				<Ride track={track} region="fibre" clipT={ct} style={{ opacity: 1 - focusOut, filter: focusOut > 0.01 ? `blur(${(14 * focusOut * focusOut).toFixed(2)}px)` : undefined }}>
					<svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>{PULSES.map((_, i) => burst(i))}</svg>
				</Ride>
			)}
			<Sequence from={Math.round(CUT * fps)} premountFor={fps}>
				<Plate name="dc-c2-blade" clip={HAVE_CLIPS_C.blade} from={CUT} blur={16 * focusIn * focusIn} push={0.04} />
			</Sequence>
			{t >= CUT && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.55) 28%, rgba(0,0,0,0) 50%)', opacity: ramp(t, CUT, CUT + 0.6) }} />}
			{t >= CUT && <Sleds />}
			<div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.2) 38%, rgba(0,0,0,0) 60%)' }} />
			{/* the title, large, then docked at the top left as the focus moves to the sleds */}
			<div style={{ position: 'absolute', left: lerp(96, 76, dock), top: lerp(700, 40, dock), opacity: fade(t, CUE.t01 + 0.1, 9.4, 0.3, 0.4) }}>
				<div style={{ display: 'flex', alignItems: 'center', gap: 14, font: `700 ${lerp(16, 14, dock)}px/1 'Geist'`, letterSpacing: 3.4, textTransform: 'uppercase', color: INK.g300 }}>
					<span style={{ width: lerp(46, 8, dock) * ramp(t, 1.0, 1.4, EASE), height: lerp(2, 8, dock), borderRadius: 4, background: INK.ring, display: 'inline-block' }} />Under the hood <em style={{ fontStyle: 'normal', color: INK.ink3 }}>1 / 3</em>
				</div>
				<h1 style={{ margin: '14px 0 0', font: `700 ${lerp(132, 44, dock)}px/0.98 'Bricolage Grotesque'`, letterSpacing: -lerp(132, 44, dock) * 0.035, color: INK.ink, whiteSpace: 'nowrap' }}>
					{'All on Google Cloud.'.split(' ').map((w, i) => {
						const kk = ramp(t, 1.05 + i * 0.1, 1.6 + i * 0.1);
						const g = w.startsWith('Google') ? ramp(t, CUE.google - 0.1, CUE.google + 0.5) : 0;
						return <span key={i} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom', paddingBottom: 26, marginBottom: -26 }}><span style={{ display: 'inline-block', translate: `0 ${(1 - kk) * 112}%`, color: g > 0 && dock < 1 ? `rgb(${Math.round(lerp(236, 159, g * (1 - dock)))},${Math.round(lerp(243, 240, g * (1 - dock)))},${Math.round(lerp(239, 196, g * (1 - dock)))})` : undefined }}>{w}</span>{i < 3 ? ' ' : ''}</span>;
					})}
				</h1>
			</div>
			<Big k="Firebase · Hosting and Authentication" h="Four apps." y={360} spec="landing page · console · workspace · guided demo, one sign-in" tone={INK.fire} t0={CUE.apps - 0.05} t1={CUE.api + 0.05} />
			<Big k="Cloud Run" h="One API." y={360} spec="backend-api · FastAPI · every rule, step and figure" tone={INK.blue} t0={CUE.api + 0.05} t1={CUE.sql + 0.02} />
			<Big k="Cloud SQL" h="The record." y={360} spec="PostgreSQL 18 · every batch, case, paper and audit line" tone={INK.blue} t0={CUE.sql + 0.02} t1={9.6} />
			<IndexBar t0={CUT + 0.3} />
			<Finish vignette={0.55} />
		</AbsoluteFill>
	);
};

export const InsideMachine: React.FC = () => {
	const { fps } = useVideoConfig();
	const ev = (src: string, t: number, v = 1) => <Audio key={`${src}${t}`} src={staticFile(`sfx/${src}.wav`)} from={Math.round(t * fps)} volume={v} premountFor={fps} />;
	return (
		<AbsoluteFill>
			<InsideMachineScene />
			<Audio src={staticFile('audio/voice.wav')} premountFor={fps} />
			<Audio src={staticFile('sfx/hum.wav')} volume={0.7} premountFor={fps} />
			{ev('sparkle', 0.3, 0.8)}{ev('glint', 1.1)}{ev('riser', 1.2, 0.7)}{ev('sparkle', CUE.google - 0.05)}{ev('whoosh', CUT - 0.5)}{ev('thud', CUT, 0.8)}
			{[0, 1, 2, 3].map((i) => ev('pop', CUE.apps + i * 0.12))}{ev('chime', CUE.firebase)}
			{ev('whoosh-short', CUE.api)}{ev('glint', CUE.run)}{ev('compute', CUE.run + 0.1)}{ev('whoosh-short', CUE.sql - 0.05)}{ev('compute', CUE.sql + 0.05)}{ev('land', CUE.record + 0.3)}
		</AbsoluteFill>
	);
};
