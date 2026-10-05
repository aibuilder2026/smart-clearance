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

	// 4 · the nine stops: what each one does, the agents at it, and what it did for this batch
	const STOP_LINES: Record<string, string> = {
		connect: "the distributor's stock export and one permission",
		detect: 'shelf life checked against every gate at 09:00',
		verify: 'the label photo read and matched',
		value: 'five exits priced, the bin included',
		decide: 'the batch split, with the reasons',
		approve: 'one tap, with the money on screen',
		execute: 'listing, offers in Hindi, bids answered, pick-up',
		settle: 'invoice, e-way bill, credit note, GST memo',
		report: 'a BRSR line after the return window'
	};
	const STOP_DONE: Record<string, string> = {
		connect: 'stock export mapped · permission given',
		detect: `${fmt.num(s.risk.atRisk)} packs won't sell in the ${s.batch.daysLeft} days left`,
		verify: 'label read · the date matches',
		value: `five exits priced · the bin costs ${fmt.inr(BIN)}`,
		decide: `${fmt.num(KL.units)} packs to ${SHOPS} kiranas · ${fmt.num(AW.units)} to one buyer`,
		approve: `approved in one tap · ${fmt.inr(s.plan.net)} on screen`,
		execute: `listed · offers sent · a bid countered to ${rate(AW.price)}`,
		settle: 'invoice, credit note and GST memo drafted',
		report: `${fmt.inr(s.actual.net)} recovered · ${fmt.num(s.plan.kg)} kg kept out of landfill`
	};
	const stops = s.stages.map((st) => ({
		...st,
		text: STOP_LINES[st.id],
		done: STOP_DONE[st.id],
		who: st.human ? ['a person'] : (byStage[st.id] ?? [])
	}));

	// 5 · the workspace (comp L5): the connectors the comp shows, in its order
	const connectors = ['dms', 'tally', 'bq', 'sso', 'expiresoon', 'irp', 'whatsapp']
		.map((id) => c.connectors.find((x) => x.id === id))
		.filter((x) => x !== undefined);

	return {
		shops: SHOPS,
		atRisk: s.risk.atRisk,
		daysLeft: s.batch.daysLeft,
		actual: s.actual,
		how,
		street,
		results,
		stops,
		plans: c.plans.map((p) => ({ ...p, scope: p.scope.map((x) => x.replace(/^The client's /, 'Your ')) })),
		connectors
	};
}

export type Figures = ReturnType<typeof figures>;
