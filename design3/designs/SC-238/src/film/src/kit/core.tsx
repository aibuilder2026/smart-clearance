// SC-238's film kit: what every scene shares. The inks, the eases and the scene's clock (lib/base.tsx), the footage
// (a clip or window made at 60 fps to its shot's length by media.py, played frame for frame), its grades (the
// brand's green over the story's footage, never mush), its rack focus, a scene's way in and out (cuts, whips, pushes,
// a flash on an impact: never a dissolve between two pictures), and the finish (grain and a vignette).
import React from 'react';
import { AbsoluteFill, OffthreadVideo, Sequence, getStaticFiles, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { EASE, EASE_IO, INK, clamp, lerp, ramp } from '../lib/base';
import { FPS, media } from '../edl';

export { EASE, EASE_IO, INK, Icon, clamp, fade, lerp, ramp, rng, springAt, useT } from '../lib/base';

export const W = 1920, H = 1080;
export const GREEN = { deep: '#04120c', d2: '#0a2a1c', brand: '#167a52', mint: '#34d380', mint2: '#5fe3a1', pale: '#9ff0c4', ink: '#ecf3ef' };
export const RED = '#ff6b57', AMBER = '#f7c04a';
export const SANS = 'Geist', DISPLAY = 'Bricolage Grotesque', MONO = "ui-monospace, 'SF Mono', Menlo, monospace";

/** a media file's own playing time, in the scene, from its shot's t0 */
export const mediaSrc = (name: string) => staticFile(`media/${name}.mp4`);
let FILES: Set<string> | null = null;
/** whether media.py has made a media file yet (a scene draws a placeholder where it has not) */
export const hasMedia = (name: string) => { if (!FILES) FILES = new Set(getStaticFiles().map((f) => f.name)); return FILES.has(`media/${name}.mp4`); };
/** a stand-in for media not made yet: its name on a dark ground */
export const Missing: React.FC<{ name: string }> = ({ name }) => (
	<AbsoluteFill style={{ background: 'linear-gradient(135deg,#0b1712,#16261e)', display: 'grid', placeItems: 'center', color: '#5f7a6c', font: "600 28px/1 Geist" }}>{name} · not made yet</AbsoluteFill>
);
/** a media file played frame for frame, or its stand-in */
export const Media: React.FC<{ name: string; style?: React.CSSProperties }> = ({ name, style }) =>
	hasMedia(name) ? <OffthreadVideo src={mediaSrc(name)} muted style={style} /> : <Missing name={name} />;

export type Grade = 'none' | 'green' | 'greenSoft' | 'cold' | 'dusk' | 'night';
const GRADES: Record<Grade, { filter: string; over: React.CSSProperties[] }> = {
	none: { filter: '', over: [] },
	// the story's footage under the brand's green: the picture kept (its light and its motion), its colour drawn to the green
	green: { filter: 'saturate(0.5) brightness(0.62) contrast(1.08)', over: [
		{ background: 'linear-gradient(180deg, rgba(8,58,38,0.55), rgba(3,22,14,0.7))', mixBlendMode: 'multiply' },
		{ background: 'radial-gradient(ellipse at 50% 38%, rgba(52,211,128,0.22), rgba(52,211,128,0.06) 60%, rgba(0,0,0,0) 80%)', mixBlendMode: 'screen' },
	] },
	greenSoft: { filter: 'saturate(0.72) brightness(0.8) contrast(1.04)', over: [
		{ background: 'linear-gradient(180deg, rgba(20,90,60,0.32), rgba(6,36,24,0.42))', mixBlendMode: 'multiply' },
		{ background: 'rgba(52,211,128,0.08)', mixBlendMode: 'screen' },
	] },
	cold: { filter: 'saturate(0.85) contrast(1.06)', over: [{ background: 'rgba(40,80,140,0.14)', mixBlendMode: 'soft-light' }] },
	dusk: { filter: 'saturate(0.9) contrast(1.05)', over: [{ background: 'rgba(120,80,140,0.10)', mixBlendMode: 'soft-light' }] },
	night: { filter: 'saturate(0.8) brightness(0.85)', over: [{ background: 'rgba(30,40,90,0.18)', mixBlendMode: 'multiply' }] },
};

/** a shot of footage: the media plays frame for frame from the shot's start. `push` drifts the frame in (a camera's
 *  slow move, never a resting picture); `blur` racks the focus out from `sharp` seconds into the shot (or from the start);
 *  `grade` colours it; `x` and `scale` place it for a two-shot or a move */
export const Footage: React.FC<{
	name: string; t0: number; t1: number; push?: number; pushFrom?: number; origin?: string; blur?: number | boolean; sharp?: number; rack?: number;
	grade?: Grade; gradeIn?: number; style?: React.CSSProperties; fit?: 'cover' | 'contain'; children?: React.ReactNode; ride?: (t: number) => React.ReactNode;
}> = ({ name, t0, t1, push = 0.045, pushFrom = 1, origin = '50% 50%', blur, sharp = 0, rack = 0.7, grade = 'none', gradeIn, style, fit = 'cover', children, ride }) => {
	const f0 = Math.round(t0 * FPS), n = Math.max(1, Math.round(t1 * FPS) - f0);   // (both ends rounded once: shots that meet leave no frame between them)
	return (
		<Sequence from={f0} durationInFrames={n} layout="none">
			<FootageInner name={name} dur={t1 - t0} push={push} pushFrom={pushFrom} origin={origin} blur={blur} sharp={sharp} rack={rack} grade={grade} gradeIn={gradeIn} style={style} fit={fit} ride={ride}>{children}</FootageInner>
		</Sequence>
	);
};
const FootageInner: React.FC<{ name: string; dur: number; push: number; pushFrom: number; origin: string; blur?: number | boolean; sharp: number; rack: number; grade: Grade; gradeIn?: number; style?: React.CSSProperties; fit: 'cover' | 'contain'; children?: React.ReactNode; ride?: (t: number) => React.ReactNode }> = ({ name, dur, push, pushFrom, origin, blur, sharp, rack, grade, gradeIn, style, fit, children, ride }) => {
	const fr = useCurrentFrame(); const t = fr / FPS;
	const k = clamp(t / Math.max(0.01, dur));
	const sc = pushFrom + push * EASE_IO(k);
	const bmax = blur === true ? 22 : typeof blur === 'number' ? blur : 0;
	const bk = bmax ? ramp(t, sharp, sharp + rack, EASE_IO) : 0;
	const g = GRADES[grade];
	const gk = gradeIn === undefined ? 1 : ramp(t, gradeIn, gradeIn + rack, EASE_IO);
	const m = media(name);
	return (
		<AbsoluteFill style={{ overflow: 'hidden', ...style }}>
			<AbsoluteFill style={{ transform: `scale(${sc * (1 + 0.04 * bk)})`, transformOrigin: origin }}>
				<Media name={name} style={{ width: '100%', height: '100%', objectFit: fit, filter: [bmax ? `blur(${(bmax * bk).toFixed(2)}px)` : '', gk > 0 ? g.filter : ''].join(' ').trim() || undefined }} />
				{g.over.map((o, i) => <AbsoluteFill key={i} style={{ ...o, opacity: gk }} />)}
				{ride && ride(t)}
			</AbsoluteFill>
			{children}
			<div style={{ display: 'none' }}>{m.kind}</div>
		</AbsoluteFill>
	);
};

/** a picture held by the camera: a still or a page, never left resting: it drifts in and across */
export const Drift: React.FC<{ t: number; dur: number; from?: number; to?: number; dx?: number; dy?: number; children: React.ReactNode; origin?: string }> = ({ t, dur, from = 1.0, to = 1.06, dx = 0, dy = 0, children, origin = '50% 50%' }) => {
	const k = EASE_IO(clamp(t / Math.max(0.01, dur)));
	return <AbsoluteFill style={{ transform: `translate(${dx * k}px, ${dy * k}px) scale(${lerp(from, to, k)})`, transformOrigin: origin }}>{children}</AbsoluteFill>;
};

// ---- the ways in and out of a shot or a scene -------------------------------------------------------------------
export type Way = 'cut' | 'whipL' | 'whipR' | 'whipU' | 'push' | 'flash' | 'dip' | 'rise' | 'pull';
/** an SVG motion blur in one direction (a whip blurs along its move, never all round) */
export const DirBlur: React.FC<{ id: string; x: number; y: number }> = ({ id, x, y }) => (
	<svg width={0} height={0} style={{ position: 'absolute' }}>
		<filter id={id} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB"><feGaussianBlur stdDeviation={`${x.toFixed(1)} ${y.toFixed(1)}`} /></filter>
	</svg>
);
/** wraps a shot or a scene: `inWay` over its first `inDur` seconds, `outWay` over its last `outDur`. The two halves of a
 *  whip meet at the cut, each shot moving the same way, so the eye reads one move across the cut */
export const Ways: React.FC<{ id: string; t: number; dur: number; inWay?: Way; outWay?: Way; inDur?: number; outDur?: number; children: React.ReactNode }> = ({ id, t, dur, inWay = 'cut', outWay = 'cut', inDur = 0.22, outDur = 0.22, children }) => {
	let tx = 0, ty = 0, sc = 1, bx = 0, by = 0, white = 0, black = 0, op = 1;
	const kin = inWay === 'cut' ? 1 : clamp(t / inDur), kout = outWay === 'cut' ? 1 : clamp((dur - t) / outDur);
	const apply = (way: Way, k: number, entering: boolean) => {
		const u = 1 - k;   // 1 at the cut, 0 away from it
		const e = u * u;   // the move eases into and out of the cut
		switch (way) {
			case 'whipL': tx += (entering ? 1 : -1) * W * 0.32 * e; break;   // the picture travels to the left (crisp: no blur between shots)
			case 'whipR': tx += (entering ? -1 : 1) * W * 0.32 * e; break;
			case 'whipU': ty += (entering ? 1 : -1) * H * 0.3 * e; break;
			case 'push': sc *= entering ? lerp(1, 1.18, e) : lerp(1, 1.22, e); break;   // through the frame, crisp
			case 'pull': sc *= entering ? lerp(1, 0.9, e) : lerp(1, 1.08, e); break;
			case 'rise': ty += (entering ? 1 : -1) * 70 * e; op *= entering ? clamp(k * 1.6) : clamp(k * 1.6); break;
			case 'flash': white = Math.max(white, Math.pow(u, 1.6)); break;
			case 'dip': black = Math.max(black, Math.pow(u, 1.2)); break;
		}
	};
	if (inWay !== 'cut' && kin < 1) apply(inWay, kin, true);
	if (outWay !== 'cut' && kout < 1) apply(outWay, kout, false);
	const blurOn = bx > 0.5 || by > 0.5;
	return (
		<AbsoluteFill style={{ overflow: 'hidden' }}>
			{blurOn && <DirBlur id={`w-${id}`} x={bx} y={by} />}
			<AbsoluteFill style={{ transform: `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${sc.toFixed(4)})`, filter: blurOn ? `url(#w-${id})` : undefined, opacity: op }}>{children}</AbsoluteFill>
			{white > 0.001 && <AbsoluteFill style={{ background: '#fffaf0', opacity: white }} />}
			{black > 0.001 && <AbsoluteFill style={{ background: '#000', opacity: black }} />}
		</AbsoluteFill>
	);
};

/** a shot window in a scene: its own Sequence, its own clock (0 at t0), its ways in and out */
export const Shot: React.FC<{ id: string; t0: number; t1: number; inWay?: Way; outWay?: Way; inDur?: number; outDur?: number; children: (t: number, dur: number) => React.ReactNode }> = ({ id, t0, t1, inWay, outWay, inDur, outDur, children }) => {
	const f0 = Math.round(t0 * FPS), n = Math.max(1, Math.round(t1 * FPS) - f0);   // (both ends rounded once: shots that meet leave no frame between them)
	return (
		<Sequence from={f0} durationInFrames={n} layout="none">
			<ShotInner id={id} dur={t1 - t0} inWay={inWay} outWay={outWay} inDur={inDur} outDur={outDur}>{children}</ShotInner>
		</Sequence>
	);
};
const ShotInner: React.FC<{ id: string; dur: number; inWay?: Way; outWay?: Way; inDur?: number; outDur?: number; children: (t: number, dur: number) => React.ReactNode }> = ({ id, dur, inWay, outWay, inDur, outDur, children }) => {
	const t = useCurrentFrame() / FPS;
	return <Ways id={id} t={t} dur={dur} inWay={inWay} outWay={outWay} inDur={inDur} outDur={outDur}>{children(t, dur)}</Ways>;
};

/** film grain, a vignette and a soft gate weave: last over everything */
export const Finish: React.FC<{ vignette?: number; grain?: number }> = ({ vignette = 0.42, grain = 0.045 }) => {
	const f = useCurrentFrame();
	return (
		<>
			<AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 46%, rgba(0,0,0,${vignette}) 100%)`, pointerEvents: 'none' }} />
			<svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, opacity: grain, mixBlendMode: 'overlay', pointerEvents: 'none' }}>
				<filter id={`grain${f % 4}`}><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={(f * 7) % 97} /></filter>
				<rect width={W} height={H} filter={`url(#grain${f % 4})`} />
			</svg>
		</>
	);
};

/** a number rolled up to its value as the voice says it (₹ in Indian grouping) */
export const inr = (v: number, dp = 0) => {
	const neg = v < 0; const s = Math.abs(v).toFixed(dp); const [i, d] = s.split('.');
	const last3 = i.slice(-3), rest = i.slice(0, -3);
	const grp = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3 : last3;
	return `${neg ? '−' : ''}₹${grp}${d ? '.' + d : ''}`;
};
export const num = (v: number, dp = 0) => {
	const s = Math.abs(v).toFixed(dp); const [i, d] = s.split('.');
	const last3 = i.slice(-3), rest = i.slice(0, -3);
	return (v < 0 ? '−' : '') + (rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3 : last3) + (d ? '.' + d : '');
};
export const Roll: React.FC<{ t: number; t0: number; dur?: number; to: number; from?: number; fmt?: (v: number) => string; style?: React.CSSProperties }> = ({ t, t0, dur = 0.9, to, from = 0, fmt = (v) => num(v), style }) => {
	const k = ramp(t, t0, t0 + dur, EASE);
	return <span style={{ fontVariantNumeric: 'tabular-nums', ...style }}>{fmt(lerp(from, to, k))}</span>;
};
export const useVC = () => useVideoConfig();
export { INK as INK_ };
