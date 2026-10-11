// The guided demo's story, as types (design3/demo/story.jsx): acts are lines on the route map, each a run of stations,
// each station a stage of a journey with its beats. A beat is a person's move (who) or an agent's (agent); `focus` says
// which device it happens on; `desk` and `phone` say what each device shows, merged over the station's; `acts` are what
// the beat does to the stub's store, and `done` reads from the store that it has happened.
import type { LockPush, State } from '@smart-clearance/core/workspace';

/** what one device shows: a person's app at a screen (with its batch and tab), their sign-in, or their lock screen */
export type DeviceSpec = {
	who?: string;
	route?: string;
	params?: Record<string, string>;
	/** a section of the screen to scroll to (data-anchor) */
	anchor?: string;
	/** the sign-in, prefilled for this person (a person's id), or the console's sign-in (true) */
	signin?: string | boolean;
	/** the lock screen, with the push that lands on it (none yet: the bare lock screen) */
	lock?: { who: string; push: LockPush | null } | null;
	/** the console, at a route (/overview, /clients/munchly/agents …) */
	console?: string;
	/** a heading in the console to scroll to, by its words */
	scrollTo?: string;
};
/** an action on the stub's store: a flow action by name with its argument */
export type Act = [name: string, arg?: unknown];
export type Beat = {
	text: string;
	who?: string;
	agent?: string;
	focus: 'desk' | 'phone';
	human?: boolean;
	time?: string;
	date?: string;
	/** the screen on show, as the notes name it */
	screen: string;
	acts?: Act[];
	done?: (s: State) => boolean;
	/** a window event to send as the beat begins (the approve sheet's) */
	event?: string;
	/** a button in the laptop to press as the beat begins, by its words */
	click?: string;
	desk?: DeviceSpec;
	phone?: DeviceSpec | null;
};
export type Figure = { label: string; value: number; decimals?: boolean; tone?: 'red' | 'green'; count?: boolean };
export type Station = {
	id: string;
	title: string;
	date: string;
	/** the journey this station plays (the stub's scenario) and the stage it starts from */
	scenario?: 'chips' | 'mango' | 'slow';
	ff?: number;
	/** actions run after the stage's start, before the station's first beat (the slow week's evidence, its yes) */
	prep?: Act[];
	amber?: boolean;
	desk: DeviceSpec;
	phone?: DeviceSpec | null;
	figures?: Figure[];
	beats: Beat[];
};
export type Line = 'console' | 'chips' | 'mango' | 'slow';
export type StoryAct = {
	id: Line;
	console?: boolean;
	title: string;
	sub: string;
	place: string;
	img?: string;
	batch?: string;
	who: string[];
	minutes: number;
	outcome: { value: number | null; line: string; red?: boolean };
	stations: Station[];
};
/** where the story is: the act, the station, the beat (the station's length once every beat is done) */
export type Pos = { a: number; s: number; b: number };
