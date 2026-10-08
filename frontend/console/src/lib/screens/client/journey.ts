import type { Client, JourneyTrigger } from '@smart-clearance/api/console';
import type { IconName } from '@smart-clearance/core';

// a client's runs and timers, fired now (SC-79, option A): what each is called, its button, its rhythm, and the question a
// timer asks before it fires early (closing an offer early can't be undone for that offer). design3/console/console.jsx
type Words = {
	title: string;
	act: string;
	icon: IconName;
	every?: (c: Client) => string;
	ask?: (t: JourneyTrigger, when: string) => { title: string; message: string };
};
export const TRIG: Record<JourneyTrigger['key'], Words> = {
	'data.daily': { title: 'Daily load', act: 'Run now', icon: 'play' },
	'watcher.daily': { title: 'Daily check', act: 'Run now', icon: 'play' },
	'offer.close': {
		title: 'Offer window closes',
		act: 'Close now',
		icon: 'timer',
		every: (c) => `${c.rules.offerWindowHours} h after the offer went out`,
		ask: (t, when) => ({
			title: 'Close the offer window now?',
			message: `The kiranas' offer for ${t.ref} closes now instead of ${when}, and what they did not take is planned again. This can't be undone for this offer.`
		})
	},
	'shelf.due': {
		title: 'Day-7 shelf check',
		act: 'Check now',
		icon: 'timer',
		every: () => '7 days after the offer',
		ask: (t, when) => ({
			title: 'Check the shelves now?',
			message: `Outreach counts what is left on each kirana's shelf for ${t.ref} now instead of ${when}, and books the pickups.`
		})
	},
	'report.due': {
		title: 'Report due',
		act: 'Report now',
		icon: 'timer',
		every: () => 'the morning after the return window',
		ask: (t, when) => ({
			title: 'Write the report now?',
			message: `Impact writes the report for ${t.ref} now instead of ${when}.`
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
