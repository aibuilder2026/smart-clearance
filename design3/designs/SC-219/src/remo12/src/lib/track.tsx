// SC-219 cut 12's concept round: what lays motion graphics onto a real camera move. track12c.py follows a region of an
// LTX clip from its first frame and writes, for every frame of the clip, the homography that carries the first frame's
// pixels to that frame's (public/track/<clip>.json). A layer drawn in the first frame's coordinates rides the clip with
// CSS matrix3d. Until a clip is tracked, a layer stays where it was drawn.
import React from 'react';
import { staticFile, useCurrentFrame, useVideoConfig, delayRender, continueRender } from 'remotion';

export type Track = { fps: number; w: number; h: number; regions: Record<string, number[][]> };
const CACHE: Record<string, Track | null> = {};
export function useTrack(name: string): Track | null {
	const [tr, setTr] = React.useState<Track | null>(CACHE[name] ?? null);
	const [handle] = React.useState(() => (name in CACHE ? null : delayRender(`track ${name}`)));
	React.useEffect(() => {
		if (name in CACHE) return;
		fetch(staticFile(`track/${name}.json`)).then((r) => (r.ok ? r.json() : null)).catch(() => null)
			.then((j) => { CACHE[name] = j; setTr(j); if (handle !== null) continueRender(handle); });
	}, [name, handle]);
	return tr;
}

/** the homography for the clip's frame at this composition frame: the clip starts at `from` (composition seconds),
 *  at `rate` × speed, scaled from the clip's pixels to the frame's (cover) */
export function homographyAt(tr: Track | null, region: string, clipT: number): number[] | null {
	if (!tr || !tr.regions[region]) return null;
	const hs = tr.regions[region]; const f = clipT * tr.fps; const i = Math.max(0, Math.min(hs.length - 1, Math.floor(f))); const j = Math.min(hs.length - 1, i + 1); const k = f - Math.floor(f);
	return hs[i].map((v, n) => v + (hs[j][n] - v) * Math.max(0, Math.min(1, k)));
}
/** a 3×3 homography (row-major, from the clip's first frame to now) in 1920 × 1080 frame pixels as CSS matrix3d */
export function matrix3d(H: number[] | null, sx = 1, sy = 1): string {
	if (!H) return 'none';
	// scale the clip's pixel space to the frame: S · H · S⁻¹
	const [a, b, c, d, e, f, g, h, i] = H;
	const A = [a, b * sx / sy, c * sx, d * sy / sx, e, f * sy, g / sx, h / sy, i];
	const [m11, m12, m13, m21, m22, m23, m31, m32, m33] = A;
	// CSS matrix3d is column-major; x' = (m11 x + m12 y + m13) / (m31 x + m32 y + m33)
	return `matrix3d(${m11}, ${m21}, 0, ${m31}, ${m12}, ${m22}, 0, ${m32}, 0, 0, 1, 0, ${m13}, ${m23}, 0, ${m33})`;
}

/** a layer drawn in the clip's first frame (1920 × 1080), riding the clip's region */
export const Ride: React.FC<{ track: Track | null; region: string; clipT: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ track, region, clipT, children, style }) => {
	const H = homographyAt(track, region, clipT);
	const sx = track ? 1920 / track.w : 1, sy = track ? 1080 / track.h : 1;
	return <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transformOrigin: '0 0', transform: matrix3d(H, sx, sy), ...style }}>{children}</div>;
};

/** the clip's own seconds at this composition frame */
export function useClipT(from: number, rate = 1): number {
	const f = useCurrentFrame(); const { fps } = useVideoConfig();
	return Math.max(0, (f / fps - from) * rate);
}

/** where a point of the clip's first frame (frame pixels) is now */
export function applyH(track: Track | null, region: string, clipT: number, x: number, y: number): [number, number] {
	const H = homographyAt(track, region, clipT); if (!H || !track) return [x, y];
	const sx = 1920 / track.w, sy = 1080 / track.h; const X = x / sx, Y = y / sy;
	const w = H[6] * X + H[7] * Y + H[8];
	return [((H[0] * X + H[1] * Y + H[2]) / w) * sx, ((H[3] * X + H[4] * Y + H[5]) / w) * sy];
}
