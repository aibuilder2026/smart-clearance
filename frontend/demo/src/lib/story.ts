// The guided demo's story (design3/demo/story.jsx, SC-167): the console first, then three journeys in Munchly's
// workspace, drawn as lines on the route map. Each act is a line of stations; each station a stage of a journey with
// its beats (types.ts). Every figure is the seed's, written from design3's money.js; every company and person is
// fictional. A test holds this to the prototype's story, beat for beat (tests/unit/shared.test.ts).
import { fmt } from '@smart-clearance/core';
import { act as runAct, D, fastForward, INVOICE, store, type LockPush, type State } from '@smart-clearance/core/workspace';
import type { Act, Beat, Line, Pos, StoryAct } from './types.ts';

const P = D.push as unknown as Record<string, LockPush>;
const PLAN = D.plan, MP = D.mangoPlan;
const KL = PLAN.lines.find((l) => l.id === 'kirana')!;
const ES = PLAN.lines.find((l) => l.id === 'expiresoon')!;
const ML = (id: string) => MP.lines.find((l) => l.id === id) || { units: 0 };
const HERO = D.batches.find((b) => b.hero)!;
const INVITE: LockPush = {
	app: 'Messages',
	icon: 'message-circle',
	title: 'Munchly Foods',
	body: `Munchly Foods has added Rakesh Traders to its Smart-Clearance workspace. Sign in at ${D.workspace.domain} with this number.`
};
const pushTo = (title: string, body: string, at = 'now'): LockPush => ({ title, body, at }) as LockPush;

// the slow week: the last 8 of the 31 shops that ordered do not (144 packets), as in Munchly Chips Leftover E2E
const SLOW_SHOPS = D.kiranas.slice(0, 23);
const SLOW_LEFT = D.kiranas.slice(23).reduce((t, k) => t + k.units, 0);
export const SLOW = { left: SLOW_LEFT, ordered: KL.units - SLOW_LEFT, net: 18632.4, x: { amount: 3542.4 } };

export const ACTS: StoryAct[] = [
	/* ---------- the platform: Smart-Clearance's own console ---------- */
	{
		id: 'console',
		console: true,
		title: 'The platform',
		sub: "Smart-Clearance's console",
		place: 'Bengaluru',
		who: ['neha'],
		minutes: 2,
		outcome: { value: null, line: "Five manufacturers live, each in its own workspace; Munchly's agents set up" },
		stations: [
			{
				id: 'signin',
				title: 'Sign in',
				date: 'Sunday 11 October',
				desk: { console: '/overview' },
				beats: [
					{ text: 'Neha Kulkarni signs in to the console with her work email', who: 'neha', focus: 'desk', time: '09:00', desk: { signin: true }, screen: 'Console · sign-in' },
					{ text: 'The splash reads the platform, and the Overview opens', who: 'neha', focus: 'desk', time: '09:00', screen: 'Console · Overview' }
				]
			},
			{
				id: 'overview',
				title: 'Overview',
				date: 'Sunday 11 October',
				desk: { console: '/overview' },
				beats: [
					{ text: 'Every client at once: recovered this month, batches in flight, plans waiting for a yes, agent runs today', who: 'neha', focus: 'desk', time: '09:01', screen: 'Overview · figures' },
					{ text: "Agents at work: every client's batches on the nine stops, moving as the agents finish", agent: 'Watcher', focus: 'desk', time: '09:01', desk: { scrollTo: 'Agents at work' }, screen: 'Overview · Agents at work' },
					{ text: 'Food, by day: kilos kept out of landfill against the kilos destroyed', who: 'neha', focus: 'desk', time: '09:02', desk: { scrollTo: 'Food, by day' }, screen: 'Overview · Food, by day' }
				]
			},
			{
				id: 'clients',
				title: 'Existing clients',
				date: 'Sunday 11 October',
				desk: { console: '/clients' },
				beats: [
					{ text: 'Five manufacturers, each in its own workspace at <client>-smartclearance.web.app', who: 'neha', focus: 'desk', time: '09:03', screen: 'Clients' },
					{ text: 'Munchly Foods: live, its journey day, its agents on', who: 'neha', focus: 'desk', time: '09:03', desk: { console: '/clients/munchly/agents' }, screen: 'A client · head' }
				]
			},
			{
				id: 'new',
				title: 'A new client',
				date: 'Sunday 11 October',
				desk: { console: '/overview' },
				beats: [
					{ text: 'A demo request from the landing page: Kesari Foods, three distributors around Indore', who: 'neha', focus: 'desk', time: '09:04', desk: { scrollTo: 'Demo requests' }, screen: 'Overview · Demo requests' },
					{ text: 'Set up: the company, its workspace address, its supply chain, its exits, how much the agents may do, its admin and plan', who: 'neha', focus: 'desk', time: '09:05', desk: { console: '/new-client?request=rq-kesari' }, screen: 'New client · seven steps' }
				]
			},
			{
				id: 'munchly',
				title: "Munchly's setup",
				date: 'Sunday 11 October',
				desk: { console: '/clients/munchly/supply' },
				beats: [
					{ text: "Munchly's first stock export, uploaded by Neha and mapped by the Data agent: 312 rows, 9 batches", agent: 'Data', focus: 'desk', time: '09:06', screen: 'Supply chain · First stock export' },
					{ text: "Each SKU's quick-commerce gates, and the batches that carry their own", who: 'neha', focus: 'desk', time: '09:06', desk: { scrollTo: 'SKUs' }, screen: 'Supply chain · SKUs with gates' },
					{ text: 'The exits Munchly allows, and expired packs destroyed at the godown against evidence Priya approves', who: 'neha', focus: 'desk', time: '09:07', desk: { console: '/clients/munchly/rules' }, screen: 'Channels & rules · Destroyed at the godown' }
				]
			},
			{
				id: 'agents',
				title: 'Agent setup',
				date: 'Sunday 11 October',
				desk: { console: '/clients/munchly/agents' },
				beats: [
					{ text: "Eleven agents in working order, each on Suggest, Ask or Act; the approval is always a person's", who: 'neha', focus: 'desk', time: '09:08', screen: 'Agents · working order' },
					{ text: "Each agent's runs and timers, in journey time, with Run now", agent: 'Watcher', focus: 'desk', time: '09:08', desk: { scrollTo: 'Runs and timers' }, screen: 'Agents · runs and timers' },
					{ text: "Priya and Rakesh bhai are invited by email; Munchly's workspace is ready", who: 'neha', focus: 'desk', time: '09:09', desk: { console: '/clients/munchly/people' }, screen: 'People' }
				]
			}
		]
	},
	/* ---------- journey 1: the chips, every pack sold ---------- */
	{
		id: 'chips',
		title: 'Masala Chips',
		sub: 'Every pack sold',
		place: 'Nagpur · Rakesh Traders',
		img: 'pack-chips',
		batch: HERO.id,
		who: ['priya', 'rakesh', 'ganesh', 'agrawal'],
		minutes: 6,
		outcome: { value: D.actual.net, line: `recovered, where the bin would have cost ${fmt.inr(PLAN.writeOff.total)} · nothing destroyed` },
		stations: [
			{
				id: 'connect',
				title: 'Connect',
				date: 'Thursday 1 October',
				scenario: 'chips',
				ff: 0,
				desk: { who: 'priya', route: 'setup' },
				phone: { who: 'rakesh', lock: { who: 'rakesh', push: null } },
				figures: [{ label: 'Destroying one packet costs', value: -PLAN.writeOff.perUnit, decimals: true, tone: 'red' }],
				beats: [
					{ text: `Priya opens ${D.workspace.domain} and signs in`, who: 'priya', focus: 'desk', time: '16:20', desk: { signin: 'priya' }, screen: 'Sign-in' },
					{ text: 'The export Neha mapped, the floors, the territory guard and the return window: she confirms', who: 'priya', focus: 'desk', time: '16:41', acts: [['connect']], screen: 'Setup' },
					{ text: "Rakesh bhai's invitation lands on his phone", who: 'rakesh', focus: 'phone', time: '16:48', phone: { lock: { who: 'rakesh', push: INVITE } }, screen: 'Lock screen' },
					{ text: 'He signs in with his number and a one-time code', who: 'rakesh', focus: 'phone', time: '16:50', phone: { signin: 'rakesh', lock: null }, screen: 'Sign-in · one-time code' },
					{ text: "He lets Smart-Clearance act in his name, inside Munchly's floors", who: 'rakesh', focus: 'phone', human: true, time: '16:52', acts: [['permit']], phone: { route: 'home', lock: null }, screen: 'Today · permission' }
				]
			},
			{
				id: 'detect',
				title: 'Detect',
				date: 'Friday 2 October',
				scenario: 'chips',
				ff: 1,
				desk: { who: 'priya', route: 'command' },
				phone: { who: 'priya', lock: { who: 'priya', push: null } },
				figures: [
					{ label: 'At risk, at MRP', value: D.risk.atRiskMRP, tone: 'red' },
					{ label: 'If it is destroyed', value: -PLAN.writeOff.total, tone: 'red' }
				],
				beats: [
					{ text: '09:00 · the Watcher checks 312 batches; MF-2409-117 fails all three quick-commerce gates', agent: 'Watcher', focus: 'desk', time: '09:00', acts: [['detect']], screen: 'Command Center' },
					{ text: "The push lands on Priya's phone", who: 'priya', focus: 'phone', time: '09:00', phone: { lock: { who: 'priya', push: P.detect } }, screen: 'Lock screen' },
					{ text: 'Batches: every lot the Watcher sees, and the months already cleared', who: 'priya', focus: 'desk', time: '09:02', desk: { route: 'batches' }, phone: { route: 'command', lock: null }, screen: 'Batches' },
					{ text: "The batch's page opens on its Journey: the tracker, the cluster, the agents", who: 'priya', focus: 'desk', time: '09:03', desk: { route: 'journey', params: { ref: HERO.id } }, phone: { route: 'command', lock: null }, screen: 'Batch page · Journey' }
				]
			},
			{
				id: 'verify',
				title: 'Verify',
				date: 'Friday 2 October',
				scenario: 'chips',
				ff: 2,
				desk: { who: 'priya', route: 'route', anchor: 'label' },
				phone: { who: 'rakesh', route: 'photo' },
				figures: [{ label: 'MRP, confirmed from the pack', value: 30, decimals: true }],
				beats: [
					{ text: 'Vision asks Rakesh bhai for one label photo before any price is quoted', agent: 'Vision', focus: 'desk', time: '09:05', acts: [['requestPhoto']], phone: { lock: { who: 'rakesh', push: null } }, screen: 'Route Room · label' },
					{ text: 'He opens the push at the godown', who: 'rakesh', focus: 'phone', time: '09:05', phone: { lock: { who: 'rakesh', push: P.verify } }, screen: 'Lock screen' },
					{ text: 'Take a photo, or upload one: a carton on shelf B4, its barcode and QR code in view', who: 'rakesh', focus: 'phone', time: '09:19', acts: [['sendPhoto']], screen: 'Label photo · take or upload' },
					{ text: 'Gemini reads the batch, the dates and the MRP; they match the DMS record', agent: 'Vision', focus: 'desk', time: '09:20', acts: [['verify']], screen: 'Route Room · label verified' }
				]
			},
			{
				id: 'value',
				title: 'Value',
				date: 'Friday 2 October',
				scenario: 'chips',
				ff: 3,
				desk: { who: 'priya', route: 'route', anchor: 'channels' },
				phone: { who: 'priya', route: 'route', anchor: 'channels' },
				figures: [
					{ label: 'Best channel, a packet after costs', value: KL.price - D.rules.vanPerUnit, decimals: true, tone: 'green' },
					{ label: 'The bin, a packet', value: -PLAN.writeOff.perUnit, decimals: true, tone: 'red' }
				],
				beats: [
					{ text: `The Valuer prices five exits against ${HERO.daysLeft} days left, the caps and the floor`, agent: 'Valuer', focus: 'desk', time: '09:21', acts: [['value']], screen: 'Route Room · five exits' }
				]
			},
			{
				id: 'decide',
				title: 'Decide',
				date: 'Friday 2 October',
				scenario: 'chips',
				ff: 4,
				desk: { who: 'priya', route: 'route', anchor: 'split' },
				phone: { who: 'priya', route: 'route', anchor: 'split' },
				figures: [
					{ label: 'Net recovered', value: PLAN.net, tone: 'green' },
					{ label: 'Swing against the bin', value: PLAN.swing }
				],
				beats: [
					{ text: 'The Router fills the best-paying exit to its cap, then the next, and writes why', agent: 'Router', focus: 'desk', time: '09:22', acts: [['decide']], screen: 'Route Room · the split' },
					{ text: "The plan reaches Priya's phone", who: 'priya', focus: 'phone', time: '09:23', phone: { lock: { who: 'priya', push: P.plan } }, screen: 'Lock screen' }
				]
			},
			{
				id: 'approve',
				title: 'Approve',
				date: 'Friday 2 October',
				scenario: 'chips',
				ff: 5,
				amber: true,
				desk: { who: 'priya', route: 'command' },
				phone: { who: 'priya', route: 'route', anchor: 'split' },
				figures: [
					{ label: 'Net recovered', value: PLAN.net, tone: 'green' },
					{ label: 'Swing', value: PLAN.swing },
					{ label: 'GST credit kept', value: PLAN.itcRetained }
				],
				beats: [
					{ text: 'Priya opens the approval: three numbers and what happens next', who: 'priya', focus: 'phone', time: '09:40', event: 'sc3:approve-open', screen: 'The approve sheet' },
					{ text: 'One tap. Nothing was listed, messaged or shipped before it', who: 'priya', focus: 'phone', human: true, time: '09:40', acts: [['approve', 'priya']], screen: 'Plan placed' }
				]
			},
			{
				id: 'execute',
				title: 'Execute',
				date: 'Friday 2 October',
				scenario: 'chips',
				ff: 6,
				desk: { who: 'priya', route: 'execution' },
				phone: { who: 'ganesh', route: 'offer' },
				figures: [
					{ label: 'ExpireSoon, a packet', value: ES.price, decimals: true },
					{ label: 'after the counter', value: D.counter.price, decimals: true, tone: 'green' }
				],
				beats: [
					{ text: `The Lister posts ${ES.units} packets on ExpireSoon in Rakesh Traders' name, hidden inside Munchly's territories`, agent: 'Lister', focus: 'desk', time: '09:41', acts: [['list']], phone: { lock: { who: 'ganesh', push: null } }, screen: 'Execution · Lister' },
					{ text: `Outreach pushes the Hindi scheme to ${D.offered} kiranas`, agent: 'Outreach', focus: 'desk', time: '09:41', acts: [['outreach']], phone: { lock: { who: 'ganesh', push: P.offer } }, screen: 'Execution · the scheme' },
					{ text: 'Ganesh ji takes a carton in one tap, and his tax invoice comes with it', who: 'ganesh', focus: 'phone', time: '09:52', acts: [['order', 'k0']], screen: 'Offer · one tap' },
					{ text: `${D.kiranas.length - 1} more kiranas order ${KL.units - D.kiranas[0].units} packets in about two hours`, agent: 'Outreach', focus: 'desk', time: '11:41', acts: [['allOrders']], phone: { route: 'orders' }, screen: 'Orders · each with its invoice' },
					{ text: `On ExpireSoon, ${D.buyer.name} in ${D.buyer.city} bids ₹13 for all ${ES.units}`, who: 'agrawal', focus: 'phone', time: '11:02', acts: [['bid', 13]], phone: { who: 'agrawal', route: 'listing' }, screen: 'ExpireSoon · the lot' },
					{ text: `The Negotiator counters at ₹${D.counter.price.toFixed(2)} with a 24-hour dispatch promise`, agent: 'Negotiator', focus: 'phone', time: '11:03', acts: [['counter']], phone: { who: 'agrawal', route: 'listing' }, screen: 'ExpireSoon · the counter' },
					{ text: `Agrawal ji accepts and pays the ${fmt.inr(D.award.token)} token`, who: 'agrawal', focus: 'phone', time: '11:09', acts: [['accept']], phone: { who: 'agrawal', route: 'listing' }, screen: 'ExpireSoon · won' }
				]
			},
			{
				id: 'settle',
				title: 'Settle',
				date: 'Monday 5 October',
				scenario: 'chips',
				ff: 7,
				desk: { who: 'priya', route: 'paperwork' },
				phone: { who: 'rakesh', route: 'van' },
				figures: [
					{ label: `Rakesh's invoice to ${D.buyer.city}`, value: INVOICE.total! },
					{ label: 'Price support to Rakesh', value: D.support.total },
					{ label: 'GST credit kept', value: PLAN.itcRetained, tone: 'green' }
				],
				beats: [
					{ text: `The balance lands; Rakesh bhai's staff load ${D.buyer.name}'s truck`, who: 'rakesh', focus: 'phone', time: '10:15', acts: [['dispatch']], phone: { anchor: 'lot' }, screen: 'Deliveries · the truck' },
					{ text: "Paperwork drafts the tax invoice, the credit note and the GST memo, in Tally's layout", agent: 'Paperwork', focus: 'desk', time: '10:16', acts: [['settle']], screen: 'Paperwork · the pack' },
					{ text: 'Rakesh bhai issues his invoice from Tally, with its e-invoice', who: 'rakesh', focus: 'phone', time: '10:24', acts: [['issueInvoice']], phone: { route: 'orders' }, screen: 'Orders · issue from Tally' },
					{ text: "Priya reviews Munchly's papers: nothing to chase", who: 'priya', focus: 'desk', time: '10:30', acts: [['review']], screen: 'Paperwork · reviewed' },
					{ text: `Saturday: the van takes the scheme to ${D.kiranas.length} shops`, who: 'rakesh', focus: 'phone', date: 'Saturday 3 October', time: '07:30', acts: [['vanRound']], screen: 'Deliveries · the van round' }
				]
			},
			{
				id: 'report',
				title: 'Report',
				date: 'Friday 30 October',
				scenario: 'chips',
				ff: 8,
				desk: { who: 'priya', route: 'report' },
				phone: { who: 'priya', route: 'command' },
				figures: [
					{ label: 'Recovered', value: D.actual.net, tone: 'green' },
					{ label: 'Better than the bin', value: D.actual.swing }
				],
				beats: [
					{ text: 'The return window has closed: Impact posts the ledger and writes the BRSR row, with evidence', agent: 'Impact', focus: 'desk', time: '18:00', acts: [['report']], phone: { lock: { who: 'priya', push: null } }, screen: 'Ledger · Money' },
					{ text: "Priya's phone: batch closed, nothing destroyed", who: 'priya', focus: 'phone', time: '18:01', phone: { lock: { who: 'priya', push: P.closed } }, screen: 'Lock screen' },
					{ text: 'The GST reading: credit kept and reversed, every invoice and credit note', who: 'priya', focus: 'desk', time: '18:02', desk: { params: { reading: 'gst' } }, screen: 'Ledger · GST' },
					{ text: 'The Impact reading: kilos kept out of landfill, CO₂e, meals, by week', who: 'priya', focus: 'desk', time: '18:03', desk: { params: { reading: 'impact' } }, screen: 'Ledger · Impact' },
					{ text: "The batch's Record: the photo sent, each yes, every step by person and agent", who: 'priya', focus: 'desk', time: '18:04', desk: { route: 'record', params: { ref: HERO.id } }, screen: 'Batch page · Record' },
					{ text: "Rakesh bhai's portal: the batch ends him whole, with his papers and his photo", who: 'rakesh', focus: 'phone', time: '18:05', phone: { who: 'rakesh', route: 'batches', params: { ref: HERO.id } }, screen: "Distributor · a batch's page" }
				]
			}
		]
	}
];

/** what each journey's outcome says on the map */
export const OUTS: Record<Line, string> = {
	console: '',
	chips: 'every pack sold',
	slow: `${SLOW.left} destroyed, on a yes`,
	mango: `${D.mangoFb} meals · all placed`
};

/* ---------- the store for a beat ---------- */

// when an action has happened, read from the store, so the visitor's own move in a device ticks its beat
const ordered = (s: State, id: unknown) => s.hero.orders.some((o) => o.id === id);
const DONE: Record<string, (s: State, arg?: unknown) => boolean> = {
	connect: (s) => s.setup.confirmed,
	permit: (s) => !!s.setup.permission,
	detect: (s) => s.hero.phase !== 'watching',
	requestPhoto: (s) => s.hero.photo.status !== 'none',
	sendPhoto: (s) => ['reading', 'verified'].includes(s.hero.photo.status),
	verify: (s) => s.hero.photo.status === 'verified',
	value: (s) => !['watching', 'at-risk', 'verified'].includes(s.hero.phase),
	decide: (s) => !['watching', 'at-risk', 'verified', 'valued'].includes(s.hero.phase),
	approve: (s) => s.hero.plan?.status === 'approved',
	list: (s) => !!s.hero.listing,
	outreach: (s) => !!s.hero.offer,
	order: ordered,
	allOrders: (s) => s.hero.orders.length >= D.kiranas.length,
	decline: (s, id) => !!s.hero.declined?.[String(id)],
	bid: (s) => s.hero.bids.length > 0,
	counter: (s) => s.hero.bids.some((b) => b.status !== 'placed'),
	accept: (s) => !!s.hero.award,
	donate: (s) => !!s.mango.donation,
	confirmPickup: (s) => s.mango.donation === 'confirmed' || s.mango.donation === 'collected',
	collect: (s) => s.mango.donation === 'collected',
	recordStaffSale: (s) => s.hero.staff?.status === 'recorded' || s.mango.staff?.status === 'recorded',
	dispatch: (s) => s.hero.truck.status === 'dispatched',
	settle: (s) => !!s.hero.docs,
	issueInvoice: (s) => !!s.hero.invoiceIssued,
	review: (s) => !!s.hero.reviewed,
	vanRound: (s) => s.hero.van.status === 'done',
	report: (s) => !!s.hero.posted,
	sendDestruction: (s) => ['checked', 'approved'].includes(s.hero.destruction?.status ?? ''),
	approveDestruction: (s) => s.hero.destruction?.status === 'approved'
};
/** a beat is done when its own test says so, or when every action it runs has happened (null: it cannot tell) */
export const doneOf = (b: Beat, s: State): boolean | null =>
	b.done ? b.done(s) : b.acts?.length && b.acts.every((a) => DONE[a[0]]) ? b.acts.every((a) => DONE[a[0]](s, a[1])) : null;

const runActs = (acts?: Act[]) => acts?.forEach(([name, arg]) => runAct(name as never, arg as never));
/** put the store where station s's beat j begins: the station's start, plus what the beats before it did */
export function sceneAt(a: number, s: number, j: number) {
	const st = ACTS[a].stations[s];
	fastForward(st.ff ?? 0);
	st.beats.slice(0, j).forEach((b) => runActs(b.acts));
	store.update((x) => x.notifications.forEach((n) => (n.read = true)));
}
export const runAt = (a: number, s: number, b: number) => runActs(ACTS[a].stations[s].beats[b].acts);
export const doneAt = (a: number, s: number, b: number) => doneOf(ACTS[a].stations[s].beats[b], store.state);

/** where the visitor lands: a place in the story from the address (#at=act.station.beat; #stage=N, the chips' station
 *  N), else the map (null) */
export function startOf(hash: string): Pos | null {
	let m = /at=(\d+)\.(\d+)\.(\d+)/.exec(hash);
	if (m) {
		const a = Math.min(ACTS.length - 1, +m[1]);
		const s = Math.min(ACTS[a].stations.length - 1, +m[2]);
		return { a, s, b: Math.min(ACTS[a].stations[s].beats.length - 1, +m[3]) };
	}
	m = /stage=(\d)/.exec(hash);
	const chips = ACTS.findIndex((x) => x.id === 'chips');
	if (m && chips >= 0) return { a: chips, s: Math.min(8, Math.max(0, +m[1] - 1)), b: 0 };
	return null;
}

void fmt;
void P;
void ES;
void ML;
void HERO;
void INVITE;
void pushTo;
void SLOW_SHOPS;
