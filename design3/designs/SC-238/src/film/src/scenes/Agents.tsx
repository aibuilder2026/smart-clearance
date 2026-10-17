// SC-238 · 7: the agents, in 3D. The scene is agents3d/ (three.js, captured frame-exact at 60 fps on this narration's
// cues by capture-page.mjs, encoded as media/agents3d.mp4): the mark's route as a lit road over the godown, the town
// and the kirana lanes from above, nine stops, ten agents, the amber gate for the person, Gemini above, the rules as
// rails, the shield round the money. Until it is captured, a placeholder names the stop the voice is on.
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { DISPLAY, GREEN, SANS, Media, hasMedia } from '../kit/core';
import { FPS, SceneData } from '../edl';

export const Agents3D: React.FC<{ s: SceneData }> = ({ s }) => {
	const t = useCurrentFrame() / FPS;
	if (hasMedia('agents3d')) return <AbsoluteFill><Media name="agents3d" style={{ width: '100%', height: '100%' }} /></AbsoluteFill>;
	const cur = [...s.vo].reverse().find((v) => v.t <= t);
	return (
		<AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 40%, #0d2c1f, #020805 75%)', display: 'grid', placeItems: 'center', fontFamily: SANS, color: GREEN.ink }}>
			<div style={{ textAlign: 'center' }}>
				<div style={{ font: `700 60px/1 '${DISPLAY}'` }}>The agents, in 3D</div>
				<div style={{ marginTop: 18, font: `500 26px/1.3 ${SANS}`, color: '#9fb7aa' }}>{cur ? cur.key : ''} · {t.toFixed(1)} s</div>
			</div>
		</AbsoluteFill>
	);
};
