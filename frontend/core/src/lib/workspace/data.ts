// Munchly Foods' workspace as the prototype sets it up (design3/core/data.js), read from the seed frontend/scripts/
// seed.mjs writes from design3: every figure was worked out by money.js, and none is typed here. The app's stub until
// backend-api serves the workspace (SC-62).
import history from './seed/history.json';
import stories from './seed/stories.json';
import seed from './seed/workspace.json';
import type {
	Actual,
	Batch,
	BatchView,
	Doc,
	FeedEvent,
	LedgerBatch,
	PlanLine,
	Shop,
	Story,
	StoryKey,
	WorkspaceSeed
} from './types';

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

/* ---------- the stub's three journeys (SC-168) ---------- */

// the chips' own moments and people beside workspace.json, and the Mango Drink's and the slow chips' journeys whole,
// as design3's data.js works them out (seed/stories.json)
type StoryOwn = Pick<
	Story,
	| 'key'
	| 'title'
	| 'accounts'
	| 'shop'
	| 'decliner'
	| 'fills'
	| 'scheme'
	| 'evidence'
	| 'at'
	| 'cleared'
	| 'outcome'
	| 'vanDay'
	| 'pron'
	| 'setupDone'
	| 'stages'
>;
type StorySeed = StoryOwn &
	Omit<Story, keyof StoryOwn | 'sku' | 'dist' | 'donation' | 'second' | 'actual'> & {
		sku: string;
		dist: string;
		actual: Omit<Actual, 'esPlanned' | 'esActual'> & Partial<Pick<Actual, 'esPlanned' | 'esActual'>>;
		donation: { batch: string; units: number; partner: string; receipt: Doc } | null;
	};
const S_ = stories as unknown as { chips: StoryOwn } & Record<'mango' | 'slow', StorySeed>;

/** the journeys the stub runs, the story's chips first */
export const SCENARIOS: StoryKey[] = ['chips', 'mango', 'slow'];
const HERO = D.batches.find((b) => b.hero)!;
const SECOND = D.batches.find((b) => b.second)!;
const partnerNamed = (name: string) => D.setup.partners.find((p) => p.name === name) ?? D.setup.partners[0];
const seeded = (key: 'mango' | 'slow'): Story => {
	const x = S_[key];
	const donated = x.donation;
	return {
		...x,
		sku: D.skus[x.sku],
		dist: D.distributors[x.dist],
		actual: { esPlanned: 0, esActual: 0, ...x.actual },
		donation: donated
			? {
					batch: D.batches.find((b) => b.id === donated.batch)!,
					plan: D.mangoPlan,
					units: donated.units,
					partner: partnerNamed(donated.partner),
					receipt: donated.receipt
				}
			: null,
		second: null
	};
};
const STORIES: Record<StoryKey, Story> = {
	// the story's own: every value is the one the stub always read
	chips: {
		...S_.chips,
		batch: HERO,
		batches: D.batches,
		sku: CHIPS,
		dist: D.distributors[HERO.distributor],
		people: D.people,
		kiranas: D.kiranas,
		offered: D.offered,
		risk: D.risk,
		plan: PLAN,
		KL,
		ES,
		counter: D.counter,
		award: D.award,
		actual: D.actual,
		support: D.support,
		supportPlan: D.supportPlan,
		claim: D.claim,
		docs: D.docs,
		invoice: INVOICE,
		returnBy: D.returnBy,
		realised: null,
		expiry: null,
		push: D.push,
		chat: D.chat,
		events: D.events,
		journey: D.journey,
		listing: D.journey.listing,
		donation: {
			batch: SECOND,
			plan: D.mangoPlan,
			units: D.mangoFb,
			partner: partnerNamed(D.journey.donation.partner),
			receipt: D.mangoReceipt
		},
		second: SECOND,
		agency: null,
		certificate: null,
		expiryNo: null,
		expiryDay: null,
		explore: D.explore,
		initial: D.initial,
		end: { docs: D.docs, row: history.story.row as unknown as LedgerBatch }
	},
	mango: seeded('mango'),
	slow: seeded('slow')
};
/** a journey's story by its key (the state's scenario; the chips when it has none) */
export const storyOf = (key: StoryKey | undefined | null): Story => STORIES[key ?? 'chips'] ?? STORIES.chips;
