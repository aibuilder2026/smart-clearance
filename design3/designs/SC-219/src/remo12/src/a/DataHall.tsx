// SC-219 cut 12, concept A · The data hall: a real camera moves through a hyperscale data centre (Qwen plates, LTX
// camera moves) and the stack is laid onto it in motion: the title over the cooling plant's pipes in Google's four
// colours; then down the cold aisle, the four apps float in as glass, a call runs to the rack that lights as Cloud Run,
// the record lights row by row across the aisle as Cloud SQL. Every graphic rides its rack (track12c.py), with cut 10's
// notes beside it.
import React from 'react';
import { AbsoluteFill, Img, Sequence, interpolate, staticFile, useVideoConfig } from 'remotion';
import { Audio, Video } from '@remotion/media';
import { evolvePath } from '@remotion/paths';
import { zoomBlur } from '@remotion/effects/zoom-blur';
import { ActTitle, CUE, EASE, EASE_IO, Finish, INK, IndexBar, Note, clamp, fade, lerp, ramp, springAt, useT } from '../lib/base';
import { Ride, applyH, useClipT, useTrack } from '../lib/track';

export const HAVE_CLIPS = { pipes: true, aisle: true };
const CUT = 3.45;          // the cooling plant to the aisle
const AISLE_RATE = 1;      // the aisle's clip is retimed to the shot's length before it is tracked (retime12c.py)

// a push through the cut: the zoom blur rises into it and falls away after (strength in pixels, about the shot's vanishing point)
const Plate: React.FC<{ name: string; clip: boolean; from: number; push?: number; zb?: number; centre?: [number, number] }> = ({ name, clip, from, push = 0.06, zb = 0, centre = [0.5, 0.46] }) => {
	const t = useT(); const { fps } = useVideoConfig();
	const effects = zb > 0.5 ? [zoomBlur({ amount: zb, center: centre, samples: 28 })] : [];
	if (clip) return <Video src={staticFile(`clips/${name}.mp4`)} muted premountFor={fps} objectFit="cover" effects={effects} style={{ position: 'absolute', width: 1920, height: 1080 }} />;
	const k = clamp((t - from) / 6.5);
	return <Img src={staticFile(`plates/${name}.jpg`)} effects={effects} style={{ position: 'absolute', width: 1920, height: 1080, scale: String(1 + push * k), transformOrigin: '50% 47%' }} />;
};

// the aisle's racks in the clip's first frame (1920 × 1080): the left wall's third and fourth, the right wall's
const RUN_QUAD: [number, number][] = [[531, 166], [681, 233], [681, 830], [531, 889]];
const SQL_QUAD: [number, number][] = [[1240, 268], [1377, 219], [1377, 868], [1240, 812]];
const SCREENS = [['app-landing.webp', 'Landing page'], ['app-console.webp', 'Console'], ['app-workspace.webp', 'Workspace'], ['app-demo.webp', 'Guided demo']]
	.map(([src, b], i) => ({ src, b, cx: 655 + i * 205, cy: 390, w: 188, h: 118 }));

const Aisle: React.FC = () => {
	const t = useT(); const { fps } = useVideoConfig();
	const track = useTrack('dc-a2-aisle');
	const ct = useClipT(CUT, AISLE_RATE);
	const quadPath = (q: [number, number][]) => 'M ' + q.map((p) => p.join(' ')).join(' L ') + ' Z';
	// the four apps: glass panels in the aisle's air, in one after another on "Four apps"
	const fold = ramp(t, CUE.api + 0.25, CUE.api + 1.05, EASE_IO);   // they draw back as the call leaves them
	const screens = SCREENS.map((s, i) => {
		const k = springAt(t, CUE.apps + i * 0.13, fps, 14, 130); if (k <= 0.01) return null;
		const scan = clamp((t - CUE.apps - i * 0.13) / 0.8);
		return (
			<div key={s.src} style={{ position: 'absolute', left: s.cx - s.w / 2, top: s.cy - s.h / 2 + (1 - k) * 40 - fold * 46, width: s.w, height: s.h, opacity: clamp(k * 1.4) * (1 - fold), scale: String((0.7 + 0.3 * k) * (1 - 0.25 * fold)) }}>
				<div style={{ position: 'absolute', inset: 0, borderRadius: 6, overflow: 'hidden', border: '1.5px solid rgba(255,190,120,0.85)', boxShadow: '0 0 26px rgba(255,159,69,0.45), 0 18px 40px rgba(0,0,0,0.5)', background: '#0b1410' }}>
					<Img src={staticFile(`img/${s.src}`)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', opacity: 0.94 }} />
					<div style={{ position: 'absolute', left: 0, right: 0, top: `${scan * 100}%`, height: 3, background: 'rgba(255,220,180,0.9)', boxShadow: '0 0 14px rgba(255,190,120,0.9)', opacity: scan < 1 ? 1 : 0 }} />
					<div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(115deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 38%)' }} />
				</div>
				<div style={{ position: 'absolute', left: '50%', top: s.h + 10, translate: '-50% 0', font: "650 14px/1 'Geist'", color: '#ffe3c7', whiteSpace: 'nowrap', padding: '5px 9px', borderRadius: 999, background: 'rgba(20,10,4,0.72)', border: '1px solid rgba(255,159,69,0.55)', opacity: fade(t, CUE.apps + 0.35 + i * 0.13, CUE.api + 0.2, 0.25, 0.3) }}>{s.b}</div>
			</div>
		);
	});
	// the call from the apps to the API: a light along the overhead tray to the left wall's rack
	const callP = 'M 960 470 C 900 300, 760 250, 610 330';
	const callK = ramp(t, CUE.api + 0.15, CUE.api + 1.0, EASE_IO);
	const ev = evolvePath(callK, callP);
	const runLit = ramp(t, CUE.run - 0.05, CUE.run + 0.45), sqlLit = ramp(t, CUE.sql - 0.05, CUE.sql + 0.45);
	const sweep = (t0: number) => clamp((t - t0) / 0.9);
	const rows = (q: [number, number][], t0: number, n = 11) => Array.from({ length: n }, (_, i) => {
		const k = clamp((t - t0 - i * 0.055) / 0.3); if (k <= 0) return null;
		const v = (i + 0.5) / n; const L = [lerp(q[0][0], q[3][0], v), lerp(q[0][1], q[3][1], v)], R_ = [lerp(q[1][0], q[2][0], v), lerp(q[1][1], q[2][1], v)];
		return <line key={i} x1={L[0] + 8} y1={L[1]} x2={lerp(L[0] + 8, R_[0] - 8, EASE(k))} y2={lerp(L[1], R_[1], EASE(k))} stroke={INK.blue2} strokeWidth={3} strokeLinecap="round" opacity={0.85} />;
	});
	const brackets = (q: [number, number][], a: number) => q.map(([x, y], i) => {
		const n = q[(i + 1) % 4], p = q[(i + 3) % 4]; const L = 26;
		const d1 = Math.hypot(n[0] - x, n[1] - y), d2 = Math.hypot(p[0] - x, p[1] - y);
		return <path key={i} d={`M ${x + (n[0] - x) / d1 * L} ${y + (n[1] - y) / d1 * L} L ${x} ${y} L ${x + (p[0] - x) / d2 * L} ${y + (p[1] - y) / d2 * L}`} fill="none" stroke={INK.blue2} strokeWidth={3} opacity={a} strokeLinecap="round" />;
	});
	const anchorRun = applyH(track, 'run', ct, 606, 420), anchorSql = applyH(track, 'sql', ct, 1308, 470);
	return (
		<AbsoluteFill>
			<Ride track={track} region="run" clipT={ct}>
				<svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
					<defs><filter id="ag"><feGaussianBlur stdDeviation={14} /></filter></defs>
					<path d={quadPath(RUN_QUAD)} fill={INK.blue} opacity={0.22 * runLit} style={{ mixBlendMode: 'screen' }} />
					<path d={quadPath(RUN_QUAD)} fill="none" stroke={INK.blue} strokeWidth={10} filter="url(#ag)" opacity={0.7 * runLit} />
					{runLit > 0 && sweep(CUE.run) < 1 && <line x1={lerp(531, 531, 0)} y1={lerp(166, 889, sweep(CUE.run))} x2={681} y2={lerp(233, 830, sweep(CUE.run))} stroke="#e6f0ff" strokeWidth={4} opacity={0.9} />}
					{brackets(RUN_QUAD, runLit)}
				</svg>
			</Ride>
			<Ride track={track} region="sql" clipT={ct}>
				<svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
					<path d={quadPath(SQL_QUAD)} fill={INK.blue} opacity={0.2 * sqlLit} style={{ mixBlendMode: 'screen' }} />
					<path d={quadPath(SQL_QUAD)} fill="none" stroke={INK.blue} strokeWidth={10} filter="url(#ag)" opacity={0.7 * sqlLit} />
					{rows(SQL_QUAD, CUE.record - 0.1)}
					{brackets(SQL_QUAD, sqlLit)}
				</svg>
			</Ride>
			<Ride track={track} region="mid" clipT={ct}>
				{screens}
				<svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
					{callK > 0 && callK < 1 && <path d={callP} fill="none" stroke={INK.mint2} strokeWidth={5} strokeLinecap="round" strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} style={{ filter: 'drop-shadow(0 0 10px #5fe3a1)' }} />}
				</svg>
			</Ride>
			{/* the parts' names, riding their racks */}
			{[['Cloud Run', 'backend-api', anchorRun, runLit, -150], ['Cloud SQL', 'the record', anchorSql, sqlLit, 150]].map(([n, s, p, a, dx]) => (
				<div key={n as string} style={{ position: 'absolute', left: (p as number[])[0] + (dx as number), top: (p as number[])[1] + 260, translate: '-50% 0', opacity: a as number, display: 'flex', gap: 8, alignItems: 'center', padding: '8px 13px', borderRadius: 999, font: "650 16px/1 'Geist'", color: '#e3eeff', background: 'rgba(4,10,18,0.8)', border: `1px solid ${INK.blue}`, whiteSpace: 'nowrap' }}>
					<i style={{ width: 8, height: 8, borderRadius: '50%', background: INK.blue, display: 'inline-block' }} />{n as string}<small style={{ font: "500 13px/1 'Geist'", color: '#9fb2cc' }}>{s as string}</small>
				</div>
			))}
			<Note id="firebase" t0={CUE.firebase} t1={5.45} x={1290} y={560} anchor={[1268, 452]} side="r" width={560} />
			<Note id="run" t0={CUE.run} t1={7.75} x={84} y={130} anchor={[anchorRun[0], anchorRun[1]]} side="l" width={500} />
			<Note id="sql" t0={CUE.sql + 0.05} t1={9.1} x={1336} y={120} anchor={[anchorSql[0], anchorSql[1]]} side="r" width={500} />
		</AbsoluteFill>
	);
};

export const DataHallScene: React.FC = () => {
	const t = useT(); const { fps } = useVideoConfig();
	const flash = Math.exp(-Math.pow((t - CUT) / 0.035, 2));
	const into = Math.pow(ramp(t, CUT - 0.32, CUT, EASE_IO), 2), outof = 1 - ramp(t, CUT, CUT + 0.42, EASE);
	const dock = ramp(t, CUT - 0.15, CUT + 0.55, EASE_IO);
	return (
		<AbsoluteFill style={{ background: '#000' }}>
			<Sequence durationInFrames={Math.round((CUT + 0.1) * fps)} premountFor={fps}>
				<AbsoluteFill style={{ scale: String(1 + 0.16 * into), transformOrigin: '49% 40%' }}>
					<Plate name="dc-a1-pipes" clip={HAVE_CLIPS.pipes} from={0} push={0.05} zb={90 * into} centre={[0.494, 0.4]} />
					<div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.25) 46%, rgba(0,0,0,0) 70%)' }} />
				</AbsoluteFill>
			</Sequence>
			<Sequence from={Math.round(CUT * fps)} premountFor={fps}>
				<AbsoluteFill style={{ scale: String(1 + 0.12 * outof), transformOrigin: '49.5% 46%' }}>
					<Plate name="dc-a2-aisle" clip={HAVE_CLIPS.aisle} from={CUT} push={0.07} zb={80 * outof} centre={[0.495, 0.46]} />
				</AbsoluteFill>
			</Sequence>
			{t >= CUT && <Aisle />}
			<div style={{ position: 'absolute', inset: 0, background: '#e9fff3', opacity: 0.3 * flash, mixBlendMode: 'screen' }} />
			<div style={{ position: 'absolute', left: lerp(110, 76, dock), top: lerp(372, 40, dock) }}>
				<ActTitle k="Under the hood" n="1 / 3" h="All on Google Cloud." t0={CUE.t01 + 0.1} t1={9.4} inline size={lerp(104, 44, dock)} />
			</div>
			<IndexBar t0={CUT + 0.2} />
			<Finish vignette={0.5} />
		</AbsoluteFill>
	);
};

export const DataHall: React.FC = () => {
	const { fps } = useVideoConfig();
	const ev = (src: string, t: number, v = 1) => <Audio key={`${src}${t}`} src={staticFile(`sfx/${src}.wav`)} from={Math.round(t * fps)} volume={v} premountFor={fps} />;
	return (
		<AbsoluteFill>
			<DataHallScene />
			<Audio src={staticFile('audio/voice.wav')} premountFor={fps} />
			<Audio src={staticFile('sfx/hum.wav')} volume={interpolate(0, [0, 1], [0.9, 0.9])} premountFor={fps} />
			{ev('riser', 0.2, 0.8)}{ev('whoosh', CUT - 0.55)}{ev('boom', CUT, 0.7)}
			{[0, 1, 2, 3].map((i) => ev('pop', CUE.apps + i * 0.13))}{ev('chime', CUE.firebase)}
			{ev('whoosh-short', CUE.api + 0.1)}{ev('land', CUE.api + 1.0)}{ev('glint', CUE.run)}{ev('compute', CUE.run + 0.1)}
			{ev('glint', CUE.sql)}{ev('compute', CUE.record - 0.1, 0.8)}{ev('land', CUE.record + 0.5)}
		</AbsoluteFill>
	);
};
