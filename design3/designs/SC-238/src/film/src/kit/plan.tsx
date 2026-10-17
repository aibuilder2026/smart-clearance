// SC-238: a scene's shots as plan.py laid them out, drawn from film.json alone, so the picture and the mix read one cue
// list. A person's shot (`clip` or `ots`, the over-the-shoulder shot with the app's real screen in the glass) racks out
// of focus and dims as the screen it carries lifts out (`win`); a window carries its rings, its cards, its agents at
// work, its clock and its badge; a talking clip plays at its own pace. Scenes add only what is theirs on top.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { EASE_IO, Footage, GREEN, Grade, Icon, SANS, Shot as ShotSeq, ramp } from './core';
import { CardDef, DevKind, Rect, RingDef, Window } from './device';
import { AgentHead, Clock, Tier } from './ui';
import { FPS, SceneData, Shot, media } from '../edl';

export type Place = { kind: DevKind; cx: number; cy: number; sh?: number; sw?: number };
export const PLACE: Record<string, Place> = {
	P: { kind: 'tablet', cx: 1165, cy: 556, sh: 770 },
	L: { kind: 'tablet', cx: 1260, cy: 546, sh: 884 },
	H: { kind: 'phone', cx: 1300, cy: 546, sh: 884 },
	A: { kind: 'laptop', cx: 1170, cy: 540, sw: 1320 },
};
type Head = { t0: number; t1: number; name: string; stop: string; tier: Tier; icon: string; calls?: [number, string][]; done?: number };
type PShot = Shot & { lift?: number; fromRect?: Rect; rings?: RingDef[]; cards?: CardDef[]; heads?: Head[]; clock?: [string, string];
	badge?: { t0: number; t1: number; text: string; icon?: string }; place?: Partial<Place>; enter?: 'lift' | 'none'; dim?: number };

/** the person's shot under a window: the window whose t0 is this shot's, or that names it */
const winOf = (s: SceneData, bg: PShot) => s.shots.find((w) => w.kind === 'win' && (Math.abs(w.t0 - bg.t0) < 0.02 || (bg as PShot).under === w.media)) as PShot | undefined;

/** the journey's clock, one chip a scene: it comes in with the first shot that names a time, stays up while the shots
 *  that follow name one (its words turning over in place as the time moves on), and leaves when they stop */
export const SceneClock: React.FC<{ s: SceneData; t: number }> = ({ s, t }) => {
	const cs = (s.shots as PShot[]).filter((x) => x.clock).map((x) => ({ t0: x.t0, t1: x.t1, label: x.clock![0], sub: x.clock![1] })).sort((a, b) => a.t0 - b.t0);
	if (!cs.length) return null;
	const segs: { t0: number; t1: number; items: typeof cs }[] = [];
	for (const c of cs) {
		const last = segs[segs.length - 1];
		if (last && c.t0 <= last.t1 + 0.6) { last.t1 = Math.max(last.t1, c.t1); last.items.push(c); } else segs.push({ t0: c.t0, t1: c.t1, items: [c] });
	}
	const seg = segs.find((g) => t >= g.t0 && t < g.t1); if (!seg) return null;
	const cur = [...seg.items].reverse().find((c) => t >= c.t0 - 0.05) ?? seg.items[0];
	const prev = seg.items[seg.items.indexOf(cur) - 1];
	const flip = prev && prev.label !== cur.label ? ramp(t, cur.t0, cur.t0 + 0.35) : 1;
	return <Clock t={t} t0={seg.t0 + 0.15} t1={seg.t1} label={cur.label} sub={cur.sub} flip={flip} />;
};

export const Badge: React.FC<{ t: number; t0: number; t1: number; text: string; icon?: string; x?: number; y?: number }> = ({ t, t0, t1, text, icon = 'fast-forward', x = 1290, y = 112 }) => {
	const a = Math.min(ramp(t, t0, t0 + 0.2), 1 - ramp(t, t1 - 0.2, t1)); if (a <= 0) return null;
	return (
		<div style={{ position: 'absolute', left: x, top: y, opacity: a, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 999, background: 'rgba(5,14,10,0.84)', border: `1.5px solid ${GREEN.mint2}88`, font: `700 18px/1 ${SANS}`, color: '#eaf3ee' }}>
			<Icon name={icon} size={18} color={GREEN.mint2} sw={2.4} />{text}
		</div>
	);
};

/** every footage, talking and window shot of a scene, as plan.py placed it; `skip` leaves a shot to the scene */
export const PlanShots: React.FC<{ s: SceneData; skip?: string[]; grade?: Record<string, Grade> }> = ({ s, skip = [], grade = {} }) => {
	const t = useCurrentFrame() / FPS;
	const out: React.ReactNode[] = [];
	// footage first, windows over it: a person's shot never covers the screen lifted out of their device
	const rank = (k: string) => (k === 'win' ? 1 : 0);
	const shots = [...(s.shots as PShot[])].sort((a, b) => rank(a.kind) - rank(b.kind));
	for (const sh of shots) {
		if (!sh.media || skip.includes(sh.media)) continue;
		if (sh.kind === 'talk') { out.push(<Footage key={sh.media} name={sh.media} t0={sh.t0} t1={sh.t1} push={0.035} origin="50% 40%" grade={grade[sh.media] ?? 'none'} />); continue; }
		if (sh.kind === 'clip' || sh.kind === 'ots') {
			const w = winOf(s, sh);
			const lift = w?.lift ?? sh.sharp ?? 0;
			const blur = sh.blur || w ? 16 : undefined;
			out.push(<Footage key={sh.media} name={sh.media} t0={sh.t0} t1={sh.t1} push={sh.kind === 'ots' ? 0.02 : 0.035} blur={blur} sharp={w ? lift : sh.sharp ?? 0} rack={0.75}
				grade={(grade[sh.media] ?? (sh.grade as Grade)) || 'none'} />);
			if (w) out.push(<ShotSeq key={`${sh.media}-dim`} id={`${sh.media}-dim`} t0={sh.t0} t1={sh.t1}>{(u) => <AbsoluteFill style={{ background: '#030a07', opacity: (w.dim ?? 0.34) * ramp(u, lift, lift + 0.75, EASE_IO) }} />}</ShotSeq>);
			continue;
		}
		if (sh.kind === 'win') {
			const m = media(sh.media); const pl = { ...PLACE[m.dev!], ...(sh.place || {}) };
			const bg = (s.shots as PShot[]).find((b) => (b.kind === 'ots' || b.kind === 'clip') && (Math.abs(b.t0 - sh.t0) < 0.02 || b.under === sh.media));
			const isOts = bg?.kind === 'ots';
			out.push(<Window key={sh.media} name={sh.media} kind={pl.kind} t0={sh.t0} t1={sh.t1} cx={pl.cx} cy={pl.cy} sh={pl.sh} sw={pl.sw} liftAt={sh.t0 + (sh.lift ?? 0)}
				quads={isOts ? bg!.media : undefined} quadsT0={bg?.t0} from={!isOts ? sh.fromRect : undefined} rings={sh.rings} cards={sh.cards} enter={sh.enter} />);
			for (const [i, h] of (sh.heads || []).entries()) out.push(<AgentHead key={`${sh.media}-h${i}`} t={t} {...h} />);
			if (sh.badge) out.push(<Badge key={`${sh.media}-b`} t={t} {...sh.badge} />);
		}
	}
	return <>{out}<SceneClock s={s} t={t} /></>;
};
