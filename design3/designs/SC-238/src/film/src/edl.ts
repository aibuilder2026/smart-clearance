// SC-238: the film's edit decision list (plan.py writes film.json) and how the scenes read it. Every time in a scene is
// that scene's own second (0 = its first frame); the film places each scene at its t0.
import FILM from './film.json';

export type Seg = [number, number, number];
export type Media = { kind: 'clip' | 'talk' | 'win'; dur: number; in?: number; out?: number; rec?: string; dev?: 'A' | 'P' | 'L' | 'H'; rect?: number[]; segs?: Seg[] };
export type Shot = { kind: string; t0: number; t1: number; media?: string; starts?: number[]; line?: string; sharp?: number; under?: string; blur?: boolean; grade?: string; img?: string; shutter?: number; ff?: number[]; clock?: [string, string]; taps?: number[] };
export type Word = { w: string; t: number; e: number };
export type Vo = { id: string; key: string; t: number; from: number; dur: number };
export type Dlg = { id: string; clip: string; t: number; s: number; e: number };
export type SceneData = { id: string; comp: string; t0: number; dur: number; marks: Record<string, number>; vo: Vo[]; dlg: Dlg[]; words: Record<string, Word[]>; shots: Shot[] };
export type FilmData = { fps: number; w: number; h: number; end: number; scenes: SceneData[]; media: Record<string, Media> };

export const F = FILM as unknown as FilmData;
export const FPS = F.fps;
export const scene = (id: string): SceneData => {
	const s = F.scenes.find((x) => x.id === id);
	if (!s) throw new Error(`no scene ${id}`);
	return s;
};
export const media = (name: string): Media => {
	const m = F.media[name];
	if (!m) throw new Error(`no media ${name}`);
	return m;
};
export const shot = (s: SceneData, mediaName: string): Shot => {
	const x = s.shots.find((y) => y.media === mediaName);
	if (!x) throw new Error(`${s.id}: no shot of ${mediaName}`);
	return x;
};
const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, '');
/** when a word of a placed line is said (scene seconds); the nth time it is said, from the start (or the end) */
export const word = (s: SceneData, key: string, w: string, nth = 0, at: 't' | 'e' = 't'): number => {
	const ws = s.words[key];
	if (!ws) throw new Error(`${s.id}: no line ${key}`);
	let hits = ws.filter((x) => norm(x.w) === norm(w));
	if (!hits.length) hits = ws.filter((x) => norm(x.w).startsWith(norm(w)));
	if (hits.length <= nth) throw new Error(`${s.id}: no "${w}" #${nth} in ${key}`);
	return hits[nth][at];
};
export const vo = (s: SceneData, key: string): Vo => {
	const v = s.vo.find((x) => x.key === key);
	if (!v) throw new Error(`${s.id}: no vo ${key}`);
	return v;
};
export const voEnd = (s: SceneData, key: string) => { const v = vo(s, key); return v.t + v.dur; };
export const dlg = (s: SceneData, id: string): Dlg => {
	const d = s.dlg.find((x) => x.id === id);
	if (!d) throw new Error(`${s.id}: no dialogue ${id}`);
	return d;
};
/** a window's time for a moment of its recording: the span holding it, mapped by that span's own speed */
export const winAt = (name: string, srcT: number, starts?: number[]): number => {
	const m = media(name); const segs = m.segs || []; let u = 0;
	for (let i = 0; i < segs.length; i++) {
		const [a, b, d] = segs[i]; const st = starts ? starts[i] : u;
		const sp = (b - a) / d; const play = sp < 0.85 ? 0.9 : sp;   // media.py: a span longer than its source plays at 0.9× and holds
		if (srcT >= a - 1e-6 && srcT <= b + 1e-6) return st + (srcT - a) / play;
		u += d;
	}
	throw new Error(`${name}: ${srcT} is in none of its spans`);
};
