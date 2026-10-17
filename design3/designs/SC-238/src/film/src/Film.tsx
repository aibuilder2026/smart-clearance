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
		{F.scenes.map((s) => (
			<Sequence key={s.id} from={Math.round(s.t0 * FPS)} durationInFrames={Math.round((s.t0 + s.dur) * FPS) - Math.round(s.t0 * FPS)} name={s.id}>
				<SceneWrap s={s} />
			</Sequence>
		))}
		<Finish />
	</AbsoluteFill>
);
