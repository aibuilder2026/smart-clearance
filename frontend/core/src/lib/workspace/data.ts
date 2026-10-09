// Munchly Foods' workspace as the prototype sets it up (design3/core/data.js), read from the seed frontend/scripts/
// seed.mjs writes from design3: every figure was worked out by money.js, and none is typed here. The app's stub until
// backend-api serves the workspace (SC-62).
import history from './seed/history.json';
import seed from './seed/workspace.json';
import type { Batch, BatchView, FeedEvent, PlanLine, Shop, WorkspaceSeed } from './types';

export const D = seed as unknown as WorkspaceSeed;

export const WS = D.workspace;
export const PLAN = D.plan;
export const CHIPS = D.skus.chips;
/** the kiranas that ordered, and how many got the offer */
export const SHOPS = D.kiranas.length;
/** every shop a distributor's scheme goes to (world.js, SC-130) */
export const SHOPS_ALL = history.shops as Shop[];
const line = (id: string): PlanLine => PLAN.lines.find((l) => l.id === id)!;
/** the Router's two lines for the chips batch: the kirana scheme and the ExpireSoon lot */
export const KL = line('kirana');
export const ES = line('expiresoon');
/** the invoice Rakesh Traders issues to the buyer */
export const INVOICE = D.docs.find((d) => d.id === 'invoice')!;
/** each stage's time on the tracker, by its id (the kit's STAGE_TIMES) */
export const STAGE_TIMES: Record<string, string> = Object.fromEntries(D.stages.map((s) => [s.id, s.time]));
/** the nine stages as the trackers draw them */
export const TRACK = D.stages.map((s) => ({ id: s.id, title: s.title, human: s.human }));
/** the nine stages with their time and who acts, as the compact tracker's sheet lists them */
export const TRACK_TIMED = D.stages.map((s) => ({
	id: s.id,
	title: s.title,
	human: s.human,
	time: s.time,
	text: s.who
}));

/** an ISO date n days on (or back) */
export const addDays = (iso: string, n: number) => {
	const d = new Date(iso + 'T00:00:00Z');
	d.setUTCDate(d.getUTCDate() + n);
	return d.toISOString().slice(0, 10);
};

/** a timeline entry of the journey, by its key */
export const EV = (key: string): FeedEvent => D.events.find((e) => e.key === key)!;

/** a batch with its SKU and distributor */
export const batchView = (b: Batch): BatchView => ({
	...b,
	skuObj: D.skus[b.sku],
	dist: D.distributors[b.distributor]
});
