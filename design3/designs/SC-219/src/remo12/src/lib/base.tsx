// SC-219 cut 12's concept round: what the three motion tests share. The narration's cues (the architecture scene's own
// local times, build/arch11-cues.json), the film's fonts and inks, an icon, and the film's notes (cut 10's card, the
// part's name beside it, a leader to it), the act's title and the stack's index along the foot, all driven by the frame.
import { loadFont } from '@remotion/fonts';
import { evolvePath } from '@remotion/paths';
import React from 'react';
import { Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { ICONS } from './icons';

loadFont({ family: 'Bricolage Grotesque', url: staticFile('fonts/Bricolage.ttf'), weight: '200 800' });
loadFont({ family: 'Geist', url: staticFile('fonts/Geist.ttf'), weight: '100 900' });

// the words the voice says, in the scene's seconds (the arch shot of cut 11 starts at film 22.54 s)
export const CUE = {
	t01: 0.9, hood: 1.42, google: 2.5, u02: 3.373, apps: 3.713, firebase: 4.233, api: 5.513, run: 6.653, sql: 7.633, record: 8.593,
	u03: 9.184, pubsub: 9.264, step: 10.704, scheduler: 12.124, clock: 13.224, u04: 13.67, nine: 13.75, adk: 15.59, watcher: 16.32,
	sales: 16.47, bigquery: 17.11, photos: 18.01, storage: 18.95, u05: 19.896, platform: 20.916, gemini: 22.016, pro: 22.396,
	prices: 22.656, negotiates: 23.436, flash: 24.636, reads: 24.996, writes: 25.636, u06: 26.233, models: 26.493, money: 27.713,
	api2: 28.693, figure: 30.213, person: 31.253, yes: 32.013, end: 33.637,
} as const;
export const TEST_END = 9.9;   // the motion tests run to the end of u02 ("Cloud SQL as the record") and a breath after

export const INK = {
	ink: '#ecf3ef', ink2: '#aabcb2', ink3: '#7a8c82', mint: '#5fe3a1', mint2: '#9ff0c4', g300: '#73c99d', ring: '#34d380',
	amber: '#f7c04a', blue: '#8ab4f8', blue2: '#c9dcff', violet: '#c58af9', fire: '#ff9f45', code: '#cfd8d3',
};
export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const EASE = Easing.bezier(0.22, 1, 0.36, 1);          // DESIGN.md's ease
export const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
/** 0 → 1 between two scene seconds, eased; clamped */
export const ramp = (t: number, a: number, b: number, ease = EASE) => interpolate(t, [a, b], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
/** in at t0, out at t1 */
export const fade = (t: number, t0: number, t1: number, fi = 0.3, fo = 0.3) => Math.min(clamp((t - t0) / fi), clamp((t1 - t) / fo));
export const useT = () => { const f = useCurrentFrame(); const { fps } = useVideoConfig(); return f / fps; };
/** a spring started at scene second t0 */
export const springAt = (t: number, t0: number, fps: number, damping = 18, stiffness = 120, mass = 1) =>
	t < t0 ? 0 : spring({ frame: (t - t0) * fps, fps, config: { damping, stiffness, mass } });
export function rng(seed: number) { let s = (seed >>> 0) || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }

export const Icon: React.FC<{ name: string; size?: number; color?: string; sw?: number }> = ({ name, size = 24, color = 'currentColor', sw = 2 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
		dangerouslySetInnerHTML={{ __html: ICONS[name] || '' }} />
);

type Tone = 'mint' | 'blue' | 'violet' | 'amber' | 'fire';
const TONE: Record<Tone, { ink: string; k: string; border: string; tile: string; tileInk: string }> = {
	mint: { ink: '#5fd59a', k: INK.g300, border: 'rgba(115,201,157,0.36)', tile: 'rgba(52,211,128,0.14)', tileInk: '#9ff0c4' },
	blue: { ink: INK.blue, k: INK.blue, border: 'rgba(138,180,248,0.45)', tile: 'rgba(138,180,248,0.15)', tileInk: INK.blue2 },
	violet: { ink: INK.violet, k: '#d4adff', border: 'rgba(197,138,249,0.55)', tile: 'rgba(197,138,249,0.22)', tileInk: '#ead9ff' },
	amber: { ink: INK.amber, k: '#f7c04a', border: 'rgba(247,192,74,0.55)', tile: 'rgba(247,192,74,0.16)', tileInk: '#ffd98a' },
	fire: { ink: INK.fire, k: '#ffb470', border: 'rgba(255,159,69,0.45)', tile: 'rgba(255,159,69,0.15)', tileInk: '#ffc58e' },
};
export type NoteDef = { tone: Tone; icon: string; k: string; h: string; s: string; chips?: string[] };
export const NOTES: Record<string, NoteDef> = {   // cut 10's notes, word for word
	firebase: { tone: 'fire', icon: 'flame', k: 'Firebase · Hosting and Authentication', h: 'Four apps', s: 'The landing page, the console, a workspace for each brand and the guided demo, behind one sign-in.', chips: ['Hosting', 'Authentication', 'Cloud Messaging'] },
	run: { tone: 'blue', icon: 'server', k: 'Cloud Run', h: 'One API', s: 'backend-api, in FastAPI: every rule, every step and every figure is worked out here.', chips: ['scales to zero', 'Secret Manager', 'OpenTelemetry'] },
	sql: { tone: 'blue', icon: 'database', k: 'Cloud SQL', h: 'The record', s: 'PostgreSQL 18 holds every batch, case, paper and audit line.', chips: ['IAM sign-in only', 'point-in-time recovery'] },
	agents: { tone: 'mint', icon: 'bot', k: "Google's ADK · on Cloud Run", h: 'Nine AI agents', s: 'Each with one job, one run per event. The Watcher is plain code: rules on BigQuery, no model.', chips: [] },
	gemini: { tone: 'violet', icon: 'sparkles', k: "Google's Agent Platform", h: 'Gemini', s: 'Pro prices and negotiates; Flash reads and writes. Structured output, on the global endpoint.', chips: ['Gemini 3.1 Pro', 'Gemini 3.8 Flash'] },
	shield: { tone: 'amber', icon: 'shield', k: 'Guardrails', h: 'Never the money', s: "The reserve price never reaches a model; the API works out every figure.", chips: ['the reserve stays in the API'] },
	yes: { tone: 'amber', icon: 'hand', k: "A person's yes", h: 'Nothing moves without it', s: 'Priya approves the plan in one tap; only then do the agents set off.', chips: [] },
};

/** cut 10's note: in on its word, the title's letters stepping in, the chips after; a leader drawn to the part */
export const Note: React.FC<{ id: keyof typeof NOTES | string; t0: number; t1: number; x: number; y: number; anchor?: [number, number]; side?: 'l' | 'r'; width?: number }> = ({ id, t0, t1, x, y, anchor, side = 'l', width = 520 }) => {
	const t = useT(); const { fps } = useVideoConfig();
	const d = NOTES[id]; const tone = TONE[d.tone];
	const a = fade(t, t0, t1, 0.28, 0.32); if (a <= 0) return null;
	const sp = springAt(t, t0, fps, 16, 140);
	const lead = anchor ? ramp(t, t0 + 0.05, t0 + 0.55) : 0;
	const cardH = 210 + (d.chips && d.chips.length ? 46 : 0);
	const ex = side === 'l' ? x + width : x, ey = y + 62;
	let path = '';
	if (anchor) { const [ax, ay] = anchor; const mx = (ex + ax) / 2; path = `M ${ex} ${ey} C ${mx} ${ey}, ${mx} ${ay}, ${ax} ${ay}`; }
	const ev = path ? evolvePath(lead, path) : null;
	const ring = anchor ? ((t - t0) % 1.4) / 1.4 : 0;
	return (
		<>
			{anchor && (
				<svg width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0, opacity: a, overflow: 'visible' }}>
					<path d={path} fill="none" stroke={tone.ink} strokeWidth={2.2} strokeLinecap="round" strokeDasharray={ev!.strokeDasharray} strokeDashoffset={ev!.strokeDashoffset} />
					<circle cx={anchor[0]} cy={anchor[1]} r={6 * clamp(lead * 3)} fill={tone.ink} />
					<circle cx={anchor[0]} cy={anchor[1]} r={8 + 26 * ring} fill="none" stroke={tone.ink} strokeWidth={2} opacity={(1 - ring) * clamp(lead * 2)} />
				</svg>
			)}
			<div style={{
				position: 'absolute', left: x, top: y, width, padding: '20px 24px 20px 20px', borderRadius: 20, opacity: a, boxSizing: 'border-box',
				translate: `${(1 - sp) * (side === 'l' ? -26 : 26)}px ${(1 - sp) * 14}px`, scale: String(0.96 + 0.04 * sp),
				background: 'linear-gradient(180deg, rgba(10,22,16,0.88), rgba(5,12,9,0.88))', border: `1.3px solid ${tone.border}`,
				boxShadow: '0 30px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', color: INK.ink, fontFamily: 'Geist',
			}}>
				<div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
					<div style={{ width: 60, height: 60, borderRadius: 16, display: 'grid', placeItems: 'center', flex: 'none', background: tone.tile, color: tone.tileInk, border: `1px solid ${tone.border}` }}>
						<Icon name={d.icon} size={30} />
					</div>
					<div>
						<div style={{ font: "700 13.5px/1 'Geist'", letterSpacing: 2.6, textTransform: 'uppercase', color: tone.k }}>{d.k}</div>
						<h2 style={{ margin: '7px 0 0', font: "700 40px/1.02 'Bricolage Grotesque'", letterSpacing: -0.8, whiteSpace: 'nowrap' }}>
							{[...d.h].map((ch, i) => {
								const k = clamp((t - t0 - 0.12 - i * 0.022) / 0.22);
								return <span key={i} style={{ display: 'inline-block', opacity: k, translate: `0 ${(1 - EASE(k)) * 14}px` }}>{ch === ' ' ? ' ' : ch}</span>;
							})}
						</h2>
					</div>
				</div>
				<div style={{ marginTop: 14, font: "500 19px/1.32 'Geist'", color: INK.ink2, opacity: ramp(t, t0 + 0.25, t0 + 0.6) }}>{d.s}</div>
				{d.chips && d.chips.length > 0 && (
					<div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
						{d.chips.map((c, i) => {
							const k = springAt(t, t0 + 0.4 + i * 0.08, fps, 14, 160);
							return <span key={c} style={{ font: "600 14.5px/1 ui-monospace, 'SF Mono', Menlo, monospace", padding: '7px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#cfe2d8', whiteSpace: 'nowrap', opacity: clamp(k * 1.4), scale: String(0.85 + 0.15 * k) }}>{c}</span>;
						})}
					</div>
				)}
			</div>
			<div style={{ display: 'none' }}>{cardH}</div>
		</>
	);
};

/** the act's title: its kicker, then its words rising out of a mask one by one */
export const ActTitle: React.FC<{ k: string; n: string; h: string; t0: number; t1: number; x?: number; y?: number; size?: number; align?: 'left' | 'center'; inline?: boolean }> = ({ k, n, h, t0, t1, x = 76, y = 40, size = 44, align = 'left', inline }) => {
	const t = useT(); const a = fade(t, t0, t1, 0.25, 0.4); if (a <= 0) return null;
	const words = h.split(' ');
	return (
		<div style={inline ? { position: 'relative', opacity: a, textAlign: align } : { position: 'absolute', left: x, top: y, opacity: a, textAlign: align, width: align === 'center' ? 1920 - 2 * x : undefined }}>
			<div style={{ font: "700 14px/1 'Geist'", letterSpacing: 3.2, textTransform: 'uppercase', color: INK.g300, display: 'flex', gap: 12, alignItems: 'center', justifyContent: align === 'center' ? 'center' : 'flex-start', opacity: ramp(t, t0, t0 + 0.35) }}>
				<i style={{ width: 8, height: 8, borderRadius: '50%', background: INK.ring, display: 'inline-block' }} />{k}<em style={{ fontStyle: 'normal', color: INK.ink3, letterSpacing: 2 }}>{n}</em>
			</div>
			<h1 style={{ margin: '12px 0 0', font: `700 ${size}px/1.05 'Bricolage Grotesque'`, letterSpacing: -size * 0.02, color: INK.ink, whiteSpace: 'nowrap', textShadow: '0 4px 24px rgba(0,0,0,0.6)' }}>
				{words.map((w, i) => {
					const kk = ramp(t, t0 + 0.15 + i * 0.09, t0 + 0.6 + i * 0.09);
					return <span key={i} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom', paddingBottom: Math.round(size * 0.22), marginBottom: -Math.round(size * 0.22) }}><span style={{ display: 'inline-block', translate: `0 ${(1 - kk) * 110}%` }}>{w}</span>{i < words.length - 1 ? ' ' : ''}</span>;
				})}
			</h1>
		</div>
	);
};

/** the stack's parts along the foot: each lights as the voice names it, and stays done */
export const INDEX: [string, string, string, number][] = [['firebase', 'flame', 'Firebase', CUE.firebase], ['run', 'server', 'Cloud Run', CUE.run], ['sql', 'database', 'Cloud SQL', CUE.sql],
	['pubsub', 'radio', 'Pub/Sub', CUE.pubsub], ['sched', 'clock', 'Scheduler', CUE.scheduler], ['agents', 'bot', 'ADK agents', CUE.nine], ['bq', 'chart-column', 'BigQuery', CUE.bigquery],
	['gcs', 'hard-drive', 'Cloud Storage', CUE.storage], ['gemini', 'sparkles', 'Gemini', CUE.gemini], ['shield', 'shield', 'Guardrails', CUE.money]];
export const IndexBar: React.FC<{ t0: number; at?: number }> = ({ t0, at }) => {
	const t0_ = useT(); const t = at ?? t0_;
	const a = ramp(t, t0, t0 + 0.5); if (a <= 0) return null;
	const cur = INDEX.reduce((k, it, i) => (t >= it[3] ? i : k), -1);
	return (
		<div style={{ position: 'absolute', left: 0, right: 0, bottom: 36, display: 'flex', justifyContent: 'center', gap: 10, opacity: a }}>
			{INDEX.map(([id, ic, n, tt], i) => {
				const on = i === cur, done = t >= tt && !on;
				return (
					<div key={id} style={{
						display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px 9px 10px', borderRadius: 999, font: "600 16px/1 'Geist'", whiteSpace: 'nowrap',
						color: on ? '#eafff2' : done ? '#9fb7aa' : '#5f6f67', border: `1px solid ${on ? 'rgba(52,211,128,0.85)' : done ? 'rgba(115,201,157,0.22)' : 'rgba(255,255,255,0.07)'}`,
						background: on ? 'rgba(52,211,128,0.16)' : 'rgba(3,8,6,0.6)',
					}}><Icon name={ic} size={17} color={on ? INK.ring : 'currentColor'} />{n}</div>
				);
			})}
		</div>
	);
};

/** film grain and a vignette, last over everything */
export const Finish: React.FC<{ vignette?: number }> = ({ vignette = 0.5 }) => {
	const f = useCurrentFrame();
	return (
		<>
			<div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 42%, rgba(0,0,0,${vignette}) 100%)` }} />
			<svg width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0, opacity: 0.05, mixBlendMode: 'overlay' }}>
				<filter id={`grain${f % 3}`}><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={f % 97} /></filter>
				<rect width={1920} height={1080} filter={`url(#grain${f % 3})`} />
			</svg>
		</>
	);
};
