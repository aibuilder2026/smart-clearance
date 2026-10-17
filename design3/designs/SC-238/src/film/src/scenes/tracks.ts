// SC-238: a clip's tracked points (public/track/<name>.json), loaded once before the frame renders.
import React from 'react';
import { continueRender, delayRender, staticFile } from 'remotion';

export type Tracks = { fps: number; w: number; h: number; n: number; tracks: Record<string, { kind: string; f: ([number, number, number] | null)[] }> };
const CACHE: Record<string, Tracks | null> = {};

export function useTrack(name: string): Tracks | null {
	const [tr, setTr] = React.useState<Tracks | null>(CACHE[name] ?? null);
	const [handle] = React.useState(() => (name in CACHE ? null : delayRender(`track ${name}`)));
	React.useEffect(() => {
		if (name in CACHE) return;
		fetch(staticFile(`track/${name}.json`)).then((r) => (r.ok ? r.json() : null)).catch(() => null)
			.then((j) => { CACHE[name] = j; setTr(j); if (handle !== null) continueRender(handle); });
	}, [name, handle]);
	return tr;
}

export type Quads = { fps: number; n: number; quads: number[][][] };
const QCACHE: Record<string, Quads | null> = {};
/** an over-the-shoulder shot's tracked screen (screens.py): its four corners for every frame, in film pixels */
export function useQuads(name?: string): Quads | null {
	const key = name ?? '';
	const [q, setQ] = React.useState<Quads | null>(key ? QCACHE[key] ?? null : null);
	const [handle] = React.useState(() => (!key || key in QCACHE ? null : delayRender(`quads ${key}`)));
	React.useEffect(() => {
		if (!key || key in QCACHE) return;
		fetch(staticFile(`track/${key}.json`)).then((r) => (r.ok ? r.json() : null)).catch(() => null)
			.then((j) => { QCACHE[key] = j; setQ(j); if (handle !== null) continueRender(handle); });
	}, [key, handle]);
	return q;
}
