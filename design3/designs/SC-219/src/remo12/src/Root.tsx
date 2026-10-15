// SC-219 cut 12's concept round: three treatments of the architecture scene ("think of Google Cloud Data center"),
// each a motion test on the narration's first two lines (0 to 9.9 s), and stills of its later beats.
import React from 'react';
import { Composition, Still } from 'remotion';
import { TEST_END } from './lib/base';
import { Blueprint, BlueprintScene, litAt } from './b/Blueprint';
import { DataHall } from './a/DataHall';
import { InsideMachine } from './c/InsideMachine';
import { AStillGemini, AStillYes, CStillGemini, CStillYes } from './Stills';

const FPS = 25;
const all = { ...litAt(99) };
export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition id="A-DataHall" component={DataHall} durationInFrames={Math.round(TEST_END * FPS)} fps={FPS} width={1920} height={1080} />
			<Composition id="C-InsideMachine" component={InsideMachine} durationInFrames={Math.round(TEST_END * FPS)} fps={FPS} width={1920} height={1080} />
			<Composition id="B-Blueprint" component={Blueprint} durationInFrames={Math.round(TEST_END * FPS)} fps={FPS} width={1920} height={1080} />
			<Still id="A-still-gemini" component={AStillGemini} width={1920} height={1080} />
			<Still id="A-still-yes" component={AStillYes} width={1920} height={1080} />
			<Still id="C-still-gemini" component={CStillGemini} width={1920} height={1080} />
			<Still id="C-still-yes" component={CStillYes} width={1920} height={1080} />
			<Still id="B-still-agents" component={BlueprintScene} width={1920} height={1080}
				defaultProps={{ still: { t: 24, cam: { x: 16.2, y: 3.2, z: 1.7, zoom: 1.62 }, lit: { ...all, vault: 0, yes: 0, firebase: 0.35, run: 0.35, sql: 0.35, pubsub: 0.4, sched: 0.4, bq: 0.35, gcs: 0.35 } } }} />
			<Still id="B-still-yes" component={BlueprintScene} width={1920} height={1080}
				defaultProps={{ still: { t: 33, cam: { x: 14.2, y: 10.4, z: 0.6, zoom: 0.84 }, lit: { ...all, yes: 0.62 } } }} />
		</>
	);
};
