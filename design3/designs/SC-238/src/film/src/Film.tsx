// SC-238: the film, scene after scene from film.json (plan.py). Each scene draws in its own seconds inside its Sequence;
// the finish (grain and a vignette) lies over all of it. The sound is mixed apart (mix.py) and joined in the export.
import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion';
import { F, FPS, SceneData } from './edl';
import { Finish, Way, Ways } from './kit/core';
import { ColdOpen, Godown } from './scenes/Open';
import { Rule } from './scenes/Rule';
import { Bin, Turn, Placeholder } from './scenes/Bin';
import { Platform } from './scenes/Platform';
import { Agents3D } from './scenes/Agents';
import { Mango, Chips } from './scenes/Journey';
import { Record, EveningCall, Close } from './scenes/Record';

export const COMPS: Record<string, React.FC<{ s: SceneData }>> = { ColdOpen, Godown, Rule, Bin, Turn, Platform, Agents3D, Mango, Chips, Record, EveningCall, Close };

export const SceneView: React.FC<{ s: SceneData; finish?: boolean }> = ({ s, finish = true }) => {
	const C = COMPS[s.comp] ?? Placeholder;
	return (
		<AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
			<C s={s} />
			{finish && <Finish />}
		</AbsoluteFill>
	);
};

// how each scene comes in and goes out: motivated, never a dissolve between two pictures and never a dip to black
// (the first critic read every dip as a dropout). The light of the turn flashes into the mark; the install's last screen
// pushes through into the 3D scene, and its mark pushes through into the lead's morning; the record pushes in on its
// papers; the evening call cuts in on its ring, which starts under the record's last shot; the close pushes in.
const WAYS: Record<string, { in?: Way; out?: Way; inDur?: number; outDur?: number }> = {
	bin: { in: 'push', inDur: 0.3 }, platform: { in: 'flash', inDur: 0.4, out: 'push', outDur: 0.32 }, agents: { in: 'push', inDur: 0.32, out: 'push', outDur: 0.3 },
	mango: { in: 'push', inDur: 0.3 }, record: { in: 'push', inDur: 0.3 }, close: { in: 'push', inDur: 0.4 },
};
const SceneWrap: React.FC<{ s: SceneData }> = ({ s }) => {
	const t = useCurrentFrame() / FPS; const w = WAYS[s.id] || {};
	return <Ways id={`sc-${s.id}`} t={t} dur={s.dur} inWay={w.in} outWay={w.out} inDur={w.inDur} outDur={w.outDur}><SceneView s={s} finish={false} /></Ways>;
};

export const Film: React.FC = () => (
	<AbsoluteFill style={{ background: '#000' }}>
		{F.scenes.map((s) => {
			// a scene's length in whole frames, from both its ends rounded once: inside it, its last shots run to that
			// frame (its own dur rounded alone can fall a frame short, which showed the bare background)
			const f0 = Math.round(s.t0 * FPS), n = Math.round((s.t0 + s.dur) * FPS) - f0;
			return (
				<Sequence key={s.id} from={f0} durationInFrames={n} name={s.id}>
					<SceneWrap s={{ ...s, dur: n / FPS, shots: s.shots.map((sh) => (sh.t1 >= s.dur - 0.002 ? { ...sh, t1: n / FPS + 1 / FPS } : sh)) }} />
				</Sequence>
			);
		})}
		<Finish />
	</AbsoluteFill>
);
