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

// how each scene comes in and goes out: motivated, never a dissolve between two pictures. The bin dips to its eight
// frames of black; the light of the turn flashes into the mark; the install's last screen dips into the dark the 3D
// scene builds out of, and its mark pushes through into the lead's morning; the record rises out of the papers; the evening call dips
// in and out of black
const WAYS: Record<string, { in?: Way; out?: Way; inDur?: number; outDur?: number }> = {
	bin: { in: 'push', inDur: 0.3 }, platform: { in: 'flash', inDur: 0.4, out: 'dip', outDur: 0.32 }, agents: { out: 'push', outDur: 0.3 },
	mango: { in: 'push', inDur: 0.3 }, record: { in: 'rise', inDur: 0.4 }, chips: { out: 'dip', outDur: 0.0 }, call: { in: 'dip', inDur: 0.35 },
	close: { in: 'dip', inDur: 0.45 },
};
const SceneWrap: React.FC<{ s: SceneData }> = ({ s }) => {
	const t = useCurrentFrame() / FPS; const w = WAYS[s.id] || {};
	return <Ways id={`sc-${s.id}`} t={t} dur={s.dur} inWay={w.in} outWay={w.out} inDur={w.inDur} outDur={w.outDur}><SceneView s={s} finish={false} /></Ways>;
};

export const Film: React.FC = () => (
	<AbsoluteFill style={{ background: '#000' }}>
		{F.scenes.map((s) => (
			<Sequence key={s.id} from={Math.round(s.t0 * FPS)} durationInFrames={Math.round(s.dur * FPS)} name={s.id}>
				<SceneWrap s={s} />
			</Sequence>
		))}
		<Finish />
	</AbsoluteFill>
);
