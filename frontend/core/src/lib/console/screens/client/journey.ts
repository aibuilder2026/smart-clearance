import type { Client, JourneyStandIn, JourneyTrigger } from '@smart-clearance/api/console';
import type { IconName } from '../../../index';

// a client's runs and timers, fired now (SC-79, option A): what each is called, its button, its rhythm, and the question a
// timer asks before it fires early (closing an offer early can't be undone for that offer). design3/console/console.jsx
type Words = {
	title: string;
	act: string;
	/** what its button (or a timer's alert) says while it fires, and once it has (SC-152) */
	busy: string;
	done: string;
	icon: IconName;
	every?: (c: Client) => string;
	ask?: (t: JourneyTrigger, when: string) => { title: string; message: string };
};
export const TRIG: Record<JourneyTrigger['key'], Words> = {
	'data.daily': { title: 'Daily load', act: 'Run now', busy: 'Starting…', done: 'Started', icon: 'play' },
	'watcher.daily': { title: 'Daily check', act: 'Run now', busy: 'Starting…', done: 'Started', icon: 'play' },
	'offer.close': {
		title: 'Offer window closes',
		act: 'Close now',
		busy: 'Closing…',
		done: 'Closed',
		icon: 'timer',
		every: (c) => `${c.rules.offerWindowHours} h after the offer went out`,
		ask: (t, when) => ({
			title: 'Close the offer window now?',
			message: `The kiranas' offer for ${t.ref} closes now instead of ${when}. What they did not order goes to the ExpireSoon lot while it is open, or stays at the godown. This can't be undone for this offer.`
		})
	},
	'listing.close': {
		title: 'Unsold lot closes',
		act: 'Close now',
		busy: 'Closing…',
		done: 'Closed',
		icon: 'timer',
		every: () => "when the lot's days on ExpireSoon are up",
		ask: (t, when) => ({
			title: 'Close the unsold lot now?',
			message: `The ExpireSoon lot for ${t.ref} closes now instead of ${when}, and its packs stay at the godown. This can't be undone for this lot.`
		})
	},
	'report.due': {
		title: 'Expiry day · report',
		act: 'Report now',
		busy: 'Reporting…',
		done: 'Reported',
		icon: 'timer',
		every: () => 'on best-before',
		ask: (t, when) => ({
			title: 'Expire it and report now?',
			message: `${t.ref} is treated as expired now instead of ${when}: open lines close as they stand, the papers follow, what is left at the godown settles by the client's expiry policy, and Impact writes the report. This can't be undone.`
		})
	}
};
/** what starts an agent that has no schedule of its own */
export const EVENT_OF: Record<string, string> = {
	vision: 'a label photo arrives',
	valuer: 'the label is verified',
	router: 'the channels are priced',
	lister: 'a plan is approved',
	outreach: 'a plan is approved',
	negotiator: 'a buyer bids or writes',
	paperwork: 'a deal closes',
	impact: 'the batch is settled'
};

const JT = new Intl.DateTimeFormat('en-GB', {
	timeZone: 'Asia/Kolkata',
	weekday: 'short',
	day: 'numeric',
	month: 'short',
	hour: '2-digit',
	minute: '2-digit',
	hourCycle: 'h23'
});
/** journey time as the console says it: "Sun 4 Oct, 08:30" */
export const journeyTime = (iso: string) => JT.format(new Date(iso));
/** how long until a wall time: "in 22 h 15 min", "in 1 day 2 h", "due now" */
export function fromNow(iso: string, now = Date.now()): string {
	const ms = Date.parse(iso) - now;
	const m = Math.round(ms / 60000);
	if (ms <= 0) return 'due now';
	if (m < 1) return 'in under a minute';
	if (m < 60) return `in ${m} min`;
	const h = Math.floor(m / 60);
	const d = Math.floor(h / 24);
	if (h < 24) return `in ${h} h${m % 60 ? ` ${m % 60} min` : ''}`;
	return d < 7 && h % 24 ? `in ${d} day${d === 1 ? '' : 's'} ${h % 24} h` : `in ${d} day${d === 1 ? '' : 's'}`;
}
/** a run's or a timer's rhythm */
export const everyOf = (t: JourneyTrigger, c: Client) =>
	t.time ? `every day at ${t.time}` : (TRIG[t.key].every?.(c) ?? '');

/* ---------- standing in for a client's partners, in a demo (SC-215, option C; design3/console/console.jsx) ---------- */
const n0 = (v: number) => v.toLocaleString('en-IN');
/** "1 shop", "50 shops" */
export const shopsN = (n: number) => `${n} ${n === 1 ? 'shop' : 'shops'}`;
/** how the fill places them: the story's shares, topped up to fill the scheme, or stopping at the packets left */
export const fillHow = (x: JourneyStandIn) =>
	x.fill.units > x.fill.story
		? 'as the story has them, topped up to fill it'
		: x.fill.units < x.fill.story
			? 'as the story has them, up to the packets left'
			: 'as the story has them';
/** the row's line: who has answered and what the fill places, or what it placed */
export const standInSub = (x: JourneyStandIn) =>
	x.filled
		? `Filled ${journeyTime(x.filled.at)}: ${shopsN(x.filled.shops)} ordered ${n0(x.filled.units)} packets`
		: `${x.ordered} of ${x.shops} have ordered${x.declined ? `, ${x.declined} said not this time` : ''} · ${x.fill.shops} more order ${fillHow(x)}, ${n0(x.fill.units)} packets`;
/** a stand-in asks first, as a timer does, since it acts for people and can't be undone */
export const STANDIN = {
	act: 'Fill now',
	busy: 'Filling…',
	ask: (x: JourneyStandIn) => {
		const open = x.shops - x.ordered - x.declined;
		const left = x.units - x.placed - x.fill.units;
		return {
			title: `Fill ${x.ref}'s scheme now?`,
			message: `${x.fill.shops === open ? `The ${open}` : `${x.fill.shops} of the ${open}`} shops that haven't answered order ${fillHow(x)}: ${n0(x.fill.units)} packets, each as its own shop, with its own tax invoice from ${x.distributor}. ${left > 0 ? `${n0(left)} packets stay in the scheme until its window closes.` : 'The scheme fills and closes, and the van round can run.'} This stands in for the shops in a demo, and can't be undone.`
		};
	},
	done: (x: JourneyStandIn) => {
		const left = x.units - x.placed - x.fill.units;
		return `${shopsN(x.fill.shops)} ordered ${n0(x.fill.units)} packets: ${left > 0 ? `${n0(left)} are still open in ${x.ref}'s scheme` : `${x.ref}'s scheme is full`}`;
	}
};
