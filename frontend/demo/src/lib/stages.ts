// The nine stages of the guided demo as beats (design3/demo/director.jsx STAGES): for each stage, what the laptop and
// the phone show, the figures beside the narration, and its beats. A beat is a person's move (who), which the visitor
// makes in a device or with Next, or an agent's (agent), which the agents make on their own or on Skip ahead. A beat
// with `ui` is done when the visitor has done it (a sign-in, a push opened); any other when the store says so.
import { fmt } from '@smart-clearance/core';
import { act, D, ES, INVOICE, KL, offerMath, WS, type LockPush, type State } from '@smart-clearance/core/workspace';

/** what one device shows: a person's app at a screen, their sign-in, or their lock screen with a push */
export type DeviceSpec = {
	who?: string;
	route?: string;
	/** a section of the screen to scroll to (data-anchor) */
	anchor?: string;
	/** the sign-in, prefilled for this person */
	signin?: string;
	/** the lock screen; its key marks it opened once the push is tapped */
	lock?: { key: string; who: string; push: LockPush | null } | null;
};
export type Beat = {
	text: string;
	who?: string;
	agent?: string;
	focus: 'desk' | 'phone';
	time?: string;
	date?: string;
	ui?: string;
	done?: (s: State) => boolean;
	run?: () => void;
	hint?: string;
	human?: boolean;
	desk?: DeviceSpec;
	phone?: DeviceSpec;
};
export type Figure = { label: string; value: number; decimals?: boolean; tone?: 'red' | 'green' };
export type Stage = {
	date: string;
	desk: DeviceSpec;
	phone: DeviceSpec;
	amber?: boolean;
	figures: Figure[];
	beats: Beat[];
};

/** whose device, and where they are */
export const DEVICE: Record<string, string> = {
	priya: "Priya's",
	rakesh: "Rakesh bhai's",
	ganesh: "Ganesh ji's",
	agrawal: "Agrawal ji's",
	anita: "Anita's",
	vikram: "Vikram's",
	meera: "Meera's"
};
export const PLACE: Record<string, string> = {
	priya: 'Munchly Foods, Pune',
	rakesh: 'Kalamna godown, Nagpur',
	ganesh: 'Shree Ganesh Kirana, Itwari',
	agrawal: 'Agrawal Wholesale, Raipur',
	anita: 'Finance, Pune',
	vikram: 'Sustainability, Pune',
	meera: 'Feeding India, Hyderabad'
};
/** who signs in with what, for the two sign-ins in stage 1 */
export const PREFILL: Record<string, string> = {
	priya: D.people.priya.email!,
	rakesh: D.people.rakesh.phone!.replace('+91 ', '')
};
const INVITE: LockPush = {
	app: 'Messages',
	icon: 'message-circle',
	title: 'Munchly Foods',
	body: `Munchly Foods has added Rakesh Traders to its Smart-Clearance workspace. Sign in at ${WS.domain} with this number.`
};
const om = offerMath(D.kiranas[0].units);
const ordered = (s: State, id: string) => s.hero.orders.some((o) => o.id === id);
const P = D.push;

export const STAGES: Stage[] = [
	{
		date: 'Thursday 1 October',
		desk: { who: 'priya', route: 'setup' },
		phone: { who: 'rakesh', lock: { key: 'l0', who: 'rakesh', push: null } },
		figures: [{ label: 'Destroying one packet costs', value: -D.plan.writeOff.perUnit, decimals: true, tone: 'red' }],
		beats: [
			{
				text: `Priya opens ${WS.domain} and signs in with her Munchly Google account`,
				who: 'priya',
				focus: 'desk',
				time: '16:20',
				ui: 'in1',
				desk: { signin: 'priya' },
				hint: "Tap Continue, then Priya's account"
			},
			{
				text: 'She checks the column mapping, the floors, the territory guard and the return window, and confirms',
				who: 'priya',
				focus: 'desk',
				time: '16:41',
				done: (s) => s.setup.confirmed,
				run: () => act('connect'),
				hint: 'Tap Confirm and start watching',
				phone: { lock: { key: 'l0', who: 'rakesh', push: INVITE }, signin: 'rakesh' }
			},
			{
				text: 'Rakesh bhai signs in on his phone with his number and a one-time code',
				who: 'rakesh',
				focus: 'phone',
				time: '16:50',
				ui: 'in2',
				phone: { signin: 'rakesh', lock: null },
				hint: 'Tap Continue, then Verify and continue'
			},
			{
				text: "He lets Smart-Clearance act in his name, inside Munchly's floors",
				who: 'rakesh',
				focus: 'phone',
				human: true,
				time: '16:52',
				done: (s) => !!s.setup.permission,
				run: () => act('permit'),
				hint: 'Tap Allow',
				phone: { route: 'home', lock: null }
			}
		]
	},
	{
		date: 'Friday 2 October',
		desk: { who: 'priya', route: 'command' },
		phone: { who: 'priya', route: 'command' },
		figures: [
			{ label: 'At risk, at MRP', value: D.risk.atRiskMRP, tone: 'red' },
			{ label: 'If it is destroyed', value: -D.plan.writeOff.total, tone: 'red' }
		],
		beats: [
			{
				text: '09:00 · the Watcher checks 312 batches; MF-2409-117 fails all three quick-commerce gates',
				agent: 'Watcher',
				focus: 'desk',
				time: '09:00',
				done: (s) => s.hero.phase !== 'watching',
				phone: { lock: { key: 'l1', who: 'priya', push: null } }
			},
			{
				text: "The push lands on Priya's phone",
				who: 'priya',
				focus: 'phone',
				time: '09:00',
				ui: 'l1',
				hint: 'Tap the notification',
				phone: { lock: { key: 'l1', who: 'priya', push: P.detect } }
			}
		]
	},
	{
		date: 'Friday 2 October',
		desk: { who: 'priya', route: 'route', anchor: 'label' },
		phone: { who: 'rakesh', route: 'photo' },
		figures: [{ label: 'MRP, confirmed from the pack', value: 30, decimals: true }],
		beats: [
			{
				text: 'Vision asks Rakesh bhai for one label photo before any price is quoted',
				agent: 'Vision',
				focus: 'desk',
				time: '09:05',
				done: (s) => s.hero.photo.status !== 'none',
				phone: { lock: { key: 'l2', who: 'rakesh', push: null } }
			},
			{
				text: 'Rakesh bhai opens the push at the godown',
				who: 'rakesh',
				focus: 'phone',
				time: '09:05',
				ui: 'l2',
				hint: 'Tap the notification',
				phone: { lock: { key: 'l2', who: 'rakesh', push: P.verify } }
			},
			{
				text: 'He photographs one carton on shelf B4 and sends it',
				who: 'rakesh',
				focus: 'phone',
				time: '09:19',
				done: (s) => ['reading', 'verified'].includes(s.hero.photo.status),
				run: () => act('sendPhoto'),
				hint: 'Tap Take a photo, then Send photo'
			},
			{
				text: 'Gemini reads batch, dates and MRP; they match the DMS record',
				agent: 'Vision',
				focus: 'desk',
				time: '09:20',
				done: (s) => s.hero.photo.status === 'verified'
			}
		]
	},
	{
		date: 'Friday 2 October',
		desk: { who: 'priya', route: 'route', anchor: 'channels' },
		phone: { who: 'priya', route: 'route', anchor: 'channels' },
		figures: [
			{
				label: 'Best channel, a packet after costs',
				value: KL.price - D.rules.vanPerUnit,
				decimals: true,
				tone: 'green'
			},
			{ label: 'The bin, a packet', value: -D.plan.writeOff.perUnit, decimals: true, tone: 'red' }
		],
		beats: [
			{
				text: `The Valuer prices five channels against ${D.batches[0].daysLeft} days left, capacities and the floor`,
				agent: 'Valuer',
				focus: 'desk',
				time: '09:21',
				done: (s) => !['at-risk', 'verified'].includes(s.hero.phase)
			}
		]
	},
	{
		date: 'Friday 2 October',
		desk: { who: 'priya', route: 'route', anchor: 'split' },
		phone: { who: 'priya', route: 'route', anchor: 'split' },
		figures: [
			{ label: 'Net recovered', value: D.plan.net, tone: 'green' },
			{ label: 'Swing against the bin', value: D.plan.swing }
		],
		beats: [
			{
				text: 'The Router fills the best-paying channel to its cap, then the next, and writes why',
				agent: 'Router',
				focus: 'desk',
				time: '09:22',
				done: (s) => !['at-risk', 'verified', 'valued'].includes(s.hero.phase),
				phone: { lock: { key: 'l4', who: 'priya', push: null } }
			},
			{
				text: "The plan reaches Priya's phone",
				who: 'priya',
				focus: 'phone',
				time: '09:23',
				ui: 'l4',
				hint: 'Tap the notification',
				phone: { lock: { key: 'l4', who: 'priya', push: P.plan } }
			}
		]
	},
	{
		date: 'Friday 2 October',
		desk: { who: 'priya', route: 'command' },
		phone: { who: 'priya', route: 'route', anchor: 'split' },
		amber: true,
		figures: [
			{ label: 'Net recovered', value: D.plan.net, tone: 'green' },
			{ label: 'Swing', value: D.plan.swing },
			{ label: 'GST credit kept', value: D.plan.itcRetained }
		],
		beats: [
			{
				text: 'Priya opens the approval: three numbers and what happens next',
				who: 'priya',
				focus: 'phone',
				time: '09:40',
				ui: 'sheet',
				run: () => window.dispatchEvent(new Event('sc3:approve-open')),
				hint: 'Tap Review and approve'
			},
			{
				text: 'One tap. Nothing was listed, messaged or shipped before it',
				who: 'priya',
				focus: 'phone',
				human: true,
				time: '09:40',
				done: (s) => !!(s.hero.plan && s.hero.plan.status === 'approved'),
				run: () => act('approve', 'priya'),
				hint: 'Tap Approve'
			}
		]
	},
	{
		date: 'Friday 2 October',
		desk: { who: 'priya', route: 'execution' },
		phone: { who: 'ganesh', route: 'offer' },
		figures: [
			{ label: 'ExpireSoon, a packet', value: ES.price, decimals: true },
			{ label: 'after the counter', value: D.counter.price, decimals: true, tone: 'green' }
		],
		beats: [
			{
				text: `The Lister posts ${ES.units} units on ExpireSoon in Rakesh Traders' name, hidden from buyers in Munchly's territories`,
				agent: 'Lister',
				focus: 'desk',
				time: '09:41',
				done: (s) => !!s.hero.listing,
				phone: { lock: { key: 'l6', who: 'ganesh', push: null } }
			},
			{
				text: `Outreach pushes the Hindi scheme to ${D.offered} kiranas`,
				agent: 'Outreach',
				focus: 'desk',
				time: '09:41',
				done: (s) => !!s.hero.offer,
				phone: { lock: { key: 'l6', who: 'ganesh', push: null } }
			},
			{
				text: 'Donation books Feeding India for the Mango Drink batch',
				agent: 'Donation',
				focus: 'desk',
				time: '09:41',
				done: (s) => !!s.mango.donation,
				phone: { lock: { key: 'l6', who: 'ganesh', push: P.offer } }
			},
			{
				text: 'Ganesh ji opens the offer, in Hindi',
				who: 'ganesh',
				focus: 'phone',
				time: '09:50',
				ui: 'l6',
				hint: 'Tap the notification',
				phone: { lock: { key: 'l6', who: 'ganesh', push: P.offer } }
			},
			{
				text: `He takes a carton: ${om.n} packets for ${fmt.inr(om.pay)}, which he sells for ${fmt.inr(om.sell)}`,
				who: 'ganesh',
				focus: 'phone',
				time: '09:52',
				done: (s) => ordered(s, 'k0'),
				run: () => act('order', 'k0'),
				hint: 'Tap ऑर्डर करें'
			},
			{
				text: `${D.kiranas.length - 1} more kiranas order ${KL.units - D.kiranas[0].units} packets in about two hours`,
				agent: 'Outreach',
				focus: 'desk',
				time: '11:41',
				done: (s) => s.hero.orders.length === D.kiranas.length,
				run: () => act('allOrders')
			},
			{
				text: `On ExpireSoon, ${D.buyer.name} in ${D.buyer.city} bids ₹13 for all ${ES.units}`,
				who: 'agrawal',
				focus: 'phone',
				time: '11:02',
				done: (s) => s.hero.bids.length > 0,
				run: () => act('bid', 13),
				hint: 'Tap Bid',
				phone: { who: 'agrawal', route: 'listing' }
			},
			{
				text: `The Negotiator counters at ₹${D.counter.price.toFixed(2)} with a 24-hour dispatch promise`,
				agent: 'Negotiator',
				focus: 'phone',
				time: '11:03',
				done: (s) => s.hero.bids.some((b) => b.status !== 'placed'),
				phone: { who: 'agrawal', route: 'listing' }
			},
			{
				text: `Agrawal ji accepts and pays the ${fmt.inr(D.award.token)} token`,
				who: 'agrawal',
				focus: 'phone',
				time: '11:09',
				done: (s) => !!s.hero.award,
				run: () => act('accept'),
				hint: 'Tap Accept',
				phone: { who: 'agrawal', route: 'listing' }
			},
			{
				text: "Meera at Feeding India confirms Tuesday's pickup",
				who: 'meera',
				focus: 'phone',
				time: '12:30',
				done: (s) => s.mango.donation === 'confirmed' || s.mango.donation === 'collected',
				run: () => act('confirmPickup'),
				hint: 'Tap Confirm',
				phone: { who: 'meera', route: 'pickups' }
			}
		]
	},
	{
		date: 'Monday 5 October',
		desk: { who: 'anita', route: 'paperwork' },
		phone: { who: 'rakesh', route: 'van' },
		figures: [
			{ label: `Rakesh's invoice to ${D.buyer.city}`, value: INVOICE.total! },
			{ label: 'Price support to Rakesh', value: D.support.total },
			{ label: 'GST credit kept', value: D.plan.itcRetained, tone: 'green' }
		],
		beats: [
			{
				text: `The balance lands; Rakesh bhai's staff load ${D.buyer.name}'s truck for ${D.buyer.city}`,
				who: 'rakesh',
				focus: 'phone',
				time: '10:15',
				done: (s) => s.hero.truck.status === 'dispatched',
				run: () => act('dispatch'),
				hint: "Tap Load the buyer's truck",
				phone: { anchor: 'lot' }
			},
			{
				text: "Paperwork drafts Rakesh's invoice, checks the e-way bill rule, issues Munchly's price-support credit note and writes the GST memo",
				agent: 'Paperwork',
				focus: 'desk',
				time: '10:16',
				done: (s) => !!s.hero.docs
			},
			{
				text: "Anita reviews Munchly's papers: nothing to chase",
				who: 'anita',
				focus: 'desk',
				time: '10:30',
				done: (s) => !!s.hero.reviewed,
				run: () => act('review'),
				hint: 'Tap Mark reviewed'
			},
			{
				text: `Tuesday: the van takes the scheme orders to ${D.kiranas.length} shops`,
				who: 'rakesh',
				focus: 'phone',
				date: 'Tuesday 6 October',
				time: '07:30',
				done: (s) => s.hero.van.status === 'done',
				run: () => act('vanRound'),
				hint: 'Tap Start the round'
			},
			{
				text: `Day 7: the shelf counts come in; one ${D.shelf.area} shop gets a pick-up on ${D.shelf.round}`,
				agent: 'Outreach',
				focus: 'phone',
				date: 'Friday 9 October',
				time: '17:00',
				done: (s) => !!s.hero.shelf,
				phone: { anchor: 'shelf' }
			}
		]
	},
	{
		date: 'Friday 30 October',
		desk: { who: 'vikram', route: 'report' },
		phone: { who: 'priya', route: 'command' },
		figures: [
			{ label: 'Recovered', value: D.actual.net, tone: 'green' },
			{ label: 'Better than the bin', value: D.actual.swing }
		],
		beats: [
			{
				text: 'The return window has closed; Impact posts the ledger and writes the BRSR row, with evidence',
				agent: 'Impact',
				focus: 'desk',
				time: '18:00',
				done: (s) => s.hero.posted,
				phone: { lock: { key: 'l8', who: 'priya', push: null } }
			},
			{
				text: "Priya's phone: batch closed, nothing destroyed",
				who: 'priya',
				focus: 'phone',
				time: '18:01',
				ui: 'l8',
				hint: 'Tap the notification',
				phone: { lock: { key: 'l8', who: 'priya', push: P.closed } }
			}
		]
	}
];
