// The table the agents work the batch on (SC-60, round 2, option 2): where everything stands on the plate, in
// fractions of its width and height, measured on design3/site/assets/plates/table.webp; the order the agents work in
// and how long each holds; and the geometry of a stage that covers the plate, as design3/site/site.jsx works it out.

export type AgentId =
	| 'data'
	| 'watcher'
	| 'vision'
	| 'valuer'
	| 'router'
	| 'you'
	| 'outreach'
	| 'lister'
	| 'negotiator'
	| 'paperwork'
	| 'impact';

/** the plate's own aspect */
export const TAB_AR = 2752 / 1536;
/** the phone's screen on the plate: its top-left corner and its size */
export const PHONE = { x: 0.633, y: 0.152, w: 0.097, h: 0.398 };
export type Post = { x: number; y: number; side?: 'left' };
/** each agent's post: a node with its name to the right of its dot, or to the left (`side`) */
export const POST: Record<AgentId, Post> = {
	data: { x: 0.14, y: 0.62, side: 'left' },
	watcher: { x: 0.25, y: 0.47 },
	vision: { x: 0.33, y: 0.66 },
	valuer: { x: 0.16, y: 0.74, side: 'left' },
	router: { x: 0.37, y: 0.77 },
	you: { x: 0.615, y: 0.4, side: 'left' },
	outreach: { x: 0.47, y: 0.58 },
	lister: { x: 0.6, y: 0.64 },
	negotiator: { x: 0.635, y: 0.77, side: 'left' },
	paperwork: { x: 0.755, y: 0.58 },
	impact: { x: 0.91, y: 0.79, side: 'left' }
};
/** the places' tags, each above its point on the plate */
export const TAGS = [
	{ id: 'kirana', at: { x: 0.49, y: 0.55 } },
	{ id: 'expiresoon', at: { x: 0.66, y: 0.6 } },
	{ id: 'dump', at: { x: 0.84, y: 0.72 } }
] as const;
/** where the packs land: in the kirana lane, and in the buyer's bay */
export const DROP = { kirana: { x: 0.49, y: 0.63 }, expiresoon: { x: 0.67, y: 0.71 } };

/** the agents in the order they work; the person's yes holds longest */
export const ORDER: AgentId[] = [
	'data',
	'watcher',
	'vision',
	'valuer',
	'router',
	'you',
	'outreach',
	'lister',
	'negotiator',
	'paperwork',
	'impact'
];
export const NS = ORDER.length;
export const YES = ORDER.indexOf('you');
export const ROUTER = ORDER.indexOf('router');
export const OUT = ORDER.indexOf('outreach');
export const LIST = ORDER.indexOf('lister');
/** the agents at work before the yes, and the ones it releases */
export const BEFORE = ORDER.slice(0, YES);
export const AFTER = ORDER.slice(YES + 1);
/** how long a stop holds (ms): 15.8 s in all, so the scene carries Pause (WCAG 2.2.2) */
export const PACE = { agent: 1400, you: 1800 };
export const holds = (id: AgentId) => (id === 'you' ? PACE.you : PACE.agent);
/** the camera's zoom toward the agent at work: closer on desktops, where the stage is wide */
export const ZOOM = { desktop: 1.6, other: 1.45 };
/** on phones and tablets the person's stop frames the phone's screen and the post together, since both cannot fit */
export const YES_SHOT = { x: 0.66, y: PHONE.y + PHONE.h / 2 };

/** the overlay's own coordinates: 1000 wide, the plate's aspect */
export const W = 1000;
export const H = Math.round(W / TAB_AR);
type Pt = { x: number; y: number };
/** a pack's way from a to b: a quadratic curve lifted above both ends */
export const curve = (a: Pt, b: Pt, lift: number) =>
	`M${a.x} ${a.y} Q${(a.x + b.x) / 2} ${Math.min(a.y, b.y) - lift} ${b.x} ${b.y}`;
/** the packs leave the phone's screen for the shops and for the buyer's truck */
export const FROM = { x: (PHONE.x + PHONE.w / 2) * W, y: (PHONE.y + PHONE.h / 2) * H };
export const ROUTES = {
	kirana: curve(FROM, { x: DROP.kirana.x * W, y: DROP.kirana.y * H }, 40),
	expiresoon: curve(FROM, { x: DROP.expiresoon.x * W, y: DROP.expiresoon.y * H }, 30)
};
/** the dots the batch leaves as, about 50 packs each, each naming its exit: the kiranas' first, then the buyer's */
export const dotsOf = (kiranas: number, buyer: number) => [
	...Array<string>(Math.round(kiranas / 50)).fill('kirana'),
	...Array<string>(Math.round(buyer / 50)).fill('expiresoon')
];
/** how a dot flies: 0.8 s, the j-th of its stream leaving 70 ms after the one before */
export const FLIGHT = {
	duration: 0.8,
	first: 0.1,
	every: 0.07,
	ease: [0.45, 0, 0.4, 1] as [number, number, number, number]
};

/** where the plate is drawn inside a stage that covers it (object-fit: cover), so what stands on it follows it: the
 *  stage's size, the plate's, and the plate's offset, `pan` of its overhang to the left */
export type Fit = { w: number; h: number; pw: number; ph: number; x: number; y: number };
export function cover(w: number, h: number, ar = TAB_AR, pan = 0.5, panY = 0.5): Fit {
	const s = Math.max(w / ar, h);
	const pw = s * ar;
	const ph = s;
	return { w, h, pw, ph, x: (w - pw) * pan, y: (h - ph) * panY };
}
/** a point on the plate, in the stage: for the camera */
export const at = (fit: Fit, p: Pt) => ({ left: fit.x + p.x * fit.pw, top: fit.y + p.y * fit.ph });
/** a point on the plate, on its layer, which already sits at the plate's offset: for what stands on it */
export const on = (fit: Fit, p: Pt) => ({ left: p.x * fit.pw, top: p.y * fit.ph });

export type Camera = { tx: number; ty: number; sc: number };
export const REST: Camera = { tx: 0, ty: 0, sc: 1 };
/** the camera toward a point on the plate, which lands in the clear part of the stage above the card (42% down); it may
 *  travel as far as the plate's own edges, which overflow the stage on both sides */
export function camera(fit: Fit, target: Pt, sc: number, cy = 0.42): Camera {
	const f = at(fit, target);
	let tx = fit.w * 0.5 - f.left * sc;
	let ty = fit.h * cy - f.top * sc;
	tx = Math.min(-fit.x * sc, Math.max(fit.w - (fit.x + fit.pw) * sc, tx));
	ty = Math.min(-fit.y * sc, Math.max(fit.h - (fit.y + fit.ph) * sc, ty));
	return { tx, ty, sc };
}
