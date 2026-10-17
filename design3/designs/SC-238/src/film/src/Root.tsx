import React from 'react';
import { Composition } from 'remotion';
import { F, FPS } from './edl';
import { Film, SceneView } from './Film';

export const Root: React.FC = () => (
	<>
		<Composition id="Film" component={Film} durationInFrames={Math.round(F.end * FPS)} fps={FPS} width={F.w} height={F.h} />
		{F.scenes.map((s) => (
			<Composition key={s.id} id={`S-${s.id}`} component={() => <SceneView s={s} />} durationInFrames={Math.max(1, Math.round(s.dur * FPS))} fps={FPS} width={F.w} height={F.h} />
		))}
	</>
);
