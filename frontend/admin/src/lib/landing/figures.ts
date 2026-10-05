// Every figure and line of copy the landing page quotes, worked out from the API's showcase (one batch, computed by
// design3/core/money.js) and catalog, exactly as design3/site/site.jsx does from window.SC3_DATA. Nothing here names
// a client: the platform's own page tells the batch as an illustrative one (SC-28).
import { fmt, rate } from '@smart-clearance/core';
import type { Catalog, PlanLine, Showcase } from '#lib/api/types.ts';
import { EXIT_X, dots } from './street';

export type Exit = {
	id: string;
	name: string;
	x: number;
	/** the packs it took: none for the exits that were priced and not needed */
	packs: number;
	taken?: boolean;
	bin?: boolean;
	/** its render, in the split under the street */
	art: string;
	/** its price a pack, and what it came to (what it would have cost, for the bin) */
	per: string;
	total?: number;
	note?: string;
	/** its chip over the street: a taken exit counts its packs in as they arrive; the others say why they took none */
	line: (n: number) => string;
};

export function figures(s: Showcase, c: Catalog) {
	const line = (id: string) => s.plan.lines.find((l) => l.id === id) as PlanLine;
	const row = (id: string) => s.plan.rows.find((r) => r.id === id)!;
	const planned = (id: string) => s.plan.lines.some((l) => l.id === id);
	const KL = line('kirana');
	const ESL = line('expiresoon');
	const AW = s.award;
	const SHOPS = s.shops;
	const BIN = s.plan.writeOff.total;
	const ES_NET = AW.gross - ESL.cost;

	// the agents at each stop (the approval gate is the person, not an agent)
	const byStage: Record<string, string[]> = {};
	for (const a of c.agents) if (!a.gate) (byStage[a.stage] ??= []).push(a.name);
	const agentsAt = (...stages: string[]) => stages.flatMap((st) => byStage[st] ?? []);

	// 2 · how it works: the moments each team actually sees, the agents named beside each (option B). The third card's
	// agents are the ones its yes releases
	const released = agentsAt('execute', 'settle', 'report');
	const { buy, free } = s.rules.scheme;
	const how = {
		moments: [
			{
				t: 'Spot it while there is time to sell',
				art: 'godown-plain',
				who: agentsAt('connect', 'detect', 'verify'),
				text: "Every morning at 09:00 the Watcher checks each batch against its date and the quick-commerce shelf-life rules, and flags the stock that won't sell in time. Vision reads the label photo from the godown to be sure."
			},
			{
				t: 'Price every exit, the bin included',
				art: 'kirana-plain',
				who: agentsAt('value', 'decide'),
				text: `Kiranas on a ${free}-free-with-${buy} scheme, a clearance marketplace, a staff sale at the godown, a food bank: the Valuer prices each exit against the true cost of destroying the stock, and the Router splits the batch within each exit's limits.`
			},
			{
				t: 'Say yes once. The agents do the rest.',
				art: 'documents',
				yes: true,
				who: ['a person', ...released],
				text: 'A person approves the plan with the money on screen; nothing is listed, messaged or shipped before that tap. Then the agents list the lot, send kirana offers in Hindi, answer bids, draft the invoice, credit note and GST memo, and post the impact.'
			}
		],
		// 1 · the Watcher's alert
		alert: {
			product: s.batch.product,
			where: `${fmt.num(s.batch.units)} packs in a distributor's godown, ${s.batch.distributorCity}`,
			gates: s.risk.gates,
			atRisk: s.risk.atRisk,
			daysLeft: s.batch.daysLeft
		},
		// 2 · the Valuer's price for every exit, net a pack, and the Router's split
		prices: [
			{
				id: 'kirana',
				name: 'Kiranas',
				s: `up to ${fmt.num(row('kirana').capacity!)} packs in ${s.rules.kiranaWindowDays} days`
			},
			{ id: 'expiresoon', name: 'ExpireSoon', s: "no limit; listed in the distributor's name" },
			{ id: 'staff', name: 'Staff sale', s: `up to ${fmt.num(row('staff').capacity!)} packs at the godown` },
			{ id: 'foodbank', name: 'Food bank', s: 'a donation reverses the GST credit' },
			{ id: 'writeoff', dot: 'bin', name: 'The bin', s: 'stock, GST credit, disposal and EPR' }
		].map((p) => ({
			...p,
			dot: p.dot ?? p.id,
			v: fmt.inr2(row(p.id).net),
			bin: p.id === 'writeoff',
			off: p.id !== 'writeoff' && !planned(p.id)
		})),
		split: { kiranas: KL.units, expiresoon: ESL.units, shops: SHOPS, total: s.risk.atRisk },
		// 3 · the plan, waiting for one yes
		plan: {
			net: s.plan.net,
			bin: BIN,
			lines: [
				{ id: 'kirana', label: `${fmt.num(KL.units)} packs to ${SHOPS} kiranas`, net: KL.net },
				{ id: 'expiresoon', label: `${fmt.num(ESL.units)} packs on ExpireSoon`, net: ESL.net }
			],
			released
		}
	};

	// 3 · five exits, one batch: the packs take the street, then the batch is split by exit (options 1 and 2)
	const exits: Exit[] = [
		{
			id: 'kirana',
			name: 'Kiranas',
			x: EXIT_X[0],
			packs: KL.units,
			taken: true,
			art: 'kirana-plain',
			total: KL.net,
			per: `${rate(row('kirana').net)} a pack, after the van`,
			line: (n) => `${fmt.num(n)} packs · ${SHOPS} shops`
		},
		{
			id: 'expiresoon',
			name: 'ExpireSoon',
			x: EXIT_X[1],
			packs: AW.units,
			taken: true,
			art: 'marketplace-bag',
			total: ES_NET,
			per: `${rate(AW.price)} a pack, countered from ${rate(ESL.price)}`,
			line: (n) => `${fmt.num(n)} packs · ${rate(AW.price)}`
		},
		{
			id: 'staff',
			name: 'Staff sale',
			x: EXIT_X[2],
			packs: 0,
			art: 'godown-plain',
			note: 'priced, not needed',
			per: `${rate(row('staff').net)} a pack, up to ${row('staff').capacity} packs`,
			line: () => 'priced, not needed'
		},
		{
			id: 'foodbank',
			name: 'Food bank',
			x: EXIT_X[3],
			packs: 0,
			art: 'donation-crate',
			note: 'priced, not needed',
			per: `${rate(row('foodbank').net)} a pack: a donation reverses the GST credit`,
			line: () => 'priced, not needed'
		},
		{
			id: 'bin',
			name: 'The bin',
			x: EXIT_X[4],
			packs: 0,
			bin: true,
			art: 'bin-plain',
			total: -BIN,
			note: 'not taken',
			per: `${rate(-s.plan.writeOff.perUnit)} a pack`,
			line: () => `${fmt.inr(-BIN)} · not taken`
		}
	];
	const taken = exits.filter((e) => e.taken);
	// the dots the batch leaves the godown as, about 50 packs each, each naming its exit
	const street = { exits, taken, dots: dots(taken[0], taken[1]) };
	// what the batch came to: the board's three cards (L2), each with the arithmetic that makes it
	const results = [
		{
			n: s.actual.net,
			l: 'recovered',
			w: `${fmt.inr(KL.net)} from ${SHOPS} kiranas, after the van, and ${fmt.inr(ES_NET)} from a marketplace buyer, after the listing fee`
		},
		{
			n: s.actual.swing,
			l: 'better than the bin',
			w: `${fmt.inr(s.actual.pnl)} on the brand's books with the plan, price support included, against ${fmt.inr(-BIN)} to destroy it`
		},
		{
			n: 0,
			l: 'cartons destroyed',
			w: `${fmt.num(s.plan.soldUnits)} packs sold on tax invoices, so the ${fmt.inr(s.plan.itcRetained)} GST credit stays`
		}
	];

	// 1 · the hero's town (SC-32): every place in the business and what it is to this batch; the agents and the person
	// who says yes, each at its post, with its job (as the catalog gives it) and what it did; the handoffs between them,
	// the agent graph; and the journey, beat by beat. As design3/site/town.jsx works them out
	const foodbank = s.rules.foodbankMinDays;
	const RESULT = `${fmt.inr(s.actual.net)} recovered, instead of ${fmt.inr(-BIN)} to destroy it`;
	const places = [
		{
			id: 'maker',
			t: 'Manufacturer',
			short: 'Maker',
			icon: 'factory',
			line: `Makes the batch. You approve each plan here, and the money comes back here: ${fmt.inr(s.actual.net)}.`
		},
		{
			id: 'godown',
			t: 'Distributor · stockist',
			short: 'Distributor',
			icon: 'warehouse',
			line: `${fmt.num(s.batch.units)} packs of the batch, selling ${s.batch.sellPerDay} a day: ${fmt.num(s.risk.atRisk)} won't sell in the ${s.batch.daysLeft} days left.`
		},
		{
			id: 'kiranas',
			t: 'Retailers',
			short: 'Kiranas',
			icon: 'store',
			line: `${SHOPS} kiranas take ${fmt.num(KL.units)} packs, buy ${buy} get ${free} free.`
		},
		{
			id: 'buyer',
			t: 'A buyer elsewhere',
			short: 'Buyer',
			icon: 'shopping-bag',
			line: `${fmt.num(AW.units)} packs through an ExpireSoon listing, at ${rate(AW.price)} a pack.`
		},
		{
			id: 'foodbank',
			t: 'Food bank',
			short: 'Food bank',
			icon: 'heart-handshake',
			line: `Takes food with ${foodbank} or more days left, as a donation. This batch sold before it was needed.`
		},
		{
			id: 'landfill',
			t: 'Landfill',
			short: 'Landfill',
			icon: 'trash-2',
			line: `Destroying the ${fmt.num(s.risk.atRisk)} packs would cost ${fmt.inr(-BIN)}. This batch sends none here.`
		}
	] as const;
	const POST: Record<string, (typeof places)[number]['id']> = {
		data: 'godown',
		watcher: 'godown',
		vision: 'godown',
		valuer: 'godown',
		router: 'godown',
		gate: 'maker',
		lister: 'buyer',
		outreach: 'kiranas',
		negotiator: 'buyer',
		paperwork: 'maker',
		impact: 'landfill'
	};
	const DID: Record<string, string> = {
		data: `${fmt.num(s.batch.units)} packs in stock, selling ${s.batch.sellPerDay} a day`,
		watcher: `${fmt.num(s.risk.atRisk)} packs won't sell in the ${s.batch.daysLeft} days left`,
		vision: 'Read the label: the date matches',
		valuer: `Five exits priced; the bin would cost ${fmt.inr(-BIN)}`,
		router: `${fmt.num(KL.units)} to ${SHOPS} kiranas, ${fmt.num(AW.units)} to one buyer`,
		gate: `Approved in one tap, ${fmt.inr(s.plan.net)} on screen`,
		outreach: `${fmt.num(KL.units)} packs to ${SHOPS} kiranas, buy ${buy} get ${free} free`,
		lister: `${fmt.num(AW.units)} packs listed`,
		negotiator: `Countered a bid to ${rate(AW.price)} a pack`,
		paperwork: 'The invoice, credit note and GST memo, drafted',
		impact: `${fmt.num(s.plan.kg)} kg kept out of landfill`
	};
	const beats = [
		{
			id: 'make',
			at: ['maker'],
			t: 'Made',
			did: `${fmt.num(s.batch.units)} packs leave the factory for the distributor`,
			who: [],
			ms: 600,
			batch: 'maker'
		},
		{
			id: 'stock',
			at: ['godown'],
			t: 'Stocked',
			did: `${fmt.num(s.batch.units)} packs in the distributor's godown, selling ${s.batch.sellPerDay} a day`,
			who: [],
			ms: 500,
			batch: 'godown'
		},
		{
			id: 'risk',
			at: ['godown'],
			t: 'At risk',
			did: `${fmt.num(s.risk.atRisk)} packs won't sell in the ${s.batch.daysLeft} days left`,
			who: ['data', 'watcher', 'vision'],
			ms: 700,
			batch: 'godown'
		},
		{
			id: 'route',
			at: ['godown'],
			t: 'Priced and split',
			did: `Five exits priced · ${fmt.num(KL.units)} to ${SHOPS} kiranas, ${fmt.num(AW.units)} to one buyer`,
			who: ['valuer', 'router'],
			ms: 600,
			batch: 'godown'
		},
		{
			id: 'yes',
			at: ['maker'],
			t: 'One yes',
			did: `You approve in one tap · ${fmt.inr(s.plan.net)} on screen`,
			who: ['you'],
			human: true,
			ms: 900,
			batch: 'godown'
		},
		{
			id: 'sell',
			at: ['kiranas', 'buyer'],
			t: 'Sold',
			did: `${fmt.num(KL.units)} packs to ${SHOPS} kiranas · ${fmt.num(AW.units)} to a buyer, countered to ${rate(AW.price)}`,
			who: ['outreach', 'lister', 'negotiator'],
			ms: 700,
			batch: 'sold'
		},
		{
			id: 'report',
			at: ['maker', 'landfill'],
			t: 'Settled',
			did: `${fmt.inr(s.actual.net)} recovered, ${fmt.num(s.plan.kg)} kg kept out of landfill`,
			who: ['paperwork', 'impact'],
			ms: 700,
			batch: null
		}
	] as {
		id: string;
		at: string[];
		t: string;
		did: string;
		who: string[];
		human?: boolean;
		ms: number;
		batch: string | null;
	}[];
	const agents = c.agents.map((a) => ({
		id: a.gate ? 'you' : a.id,
		name: a.gate ? 'You' : a.name,
		icon: a.icon,
		human: !!a.gate,
		at: POST[a.id],
		job: a.gate ? 'You approve every plan, with the money on screen' : a.job,
		did: DID[a.id],
		beat: beats.findIndex((b) => b.who.includes(a.gate ? 'you' : a.id))
	}));
	const town = {
		places,
		agents,
		// the handoffs, in the order they happen: the agent graph
		edges: [
			['data', 'watcher'],
			['watcher', 'vision'],
			['vision', 'valuer'],
			['valuer', 'router'],
			['router', 'you'],
			['you', 'outreach'],
			['you', 'lister'],
			['lister', 'negotiator'],
			['outreach', 'paperwork'],
			['negotiator', 'paperwork'],
			['paperwork', 'impact']
		] as [string, string][],
		beats,
		result: RESULT,
		batch: {
			units: s.batch.units,
			atRisk: s.risk.atRisk,
			kiranas: KL.units,
			buyer: AW.units,
			net: s.actual.net,
			kg: s.plan.kg
		}
	};

	// 4 · the workspace (comp L5): the connectors the comp shows, in its order
	const connectors = ['dms', 'tally', 'bq', 'sso', 'expiresoon', 'irp', 'whatsapp']
		.map((id) => c.connectors.find((x) => x.id === id))
		.filter((x) => x !== undefined);

	return {
		shops: SHOPS,
		atRisk: s.risk.atRisk,
		daysLeft: s.batch.daysLeft,
		actual: s.actual,
		bin: BIN,
		kg: s.plan.kg,
		how,
		street,
		results,
		town,
		plans: c.plans.map((p) => ({ ...p, scope: p.scope.map((x) => x.replace(/^The client's /, 'Your ')) })),
		connectors
	};
}

export type Figures = ReturnType<typeof figures>;
