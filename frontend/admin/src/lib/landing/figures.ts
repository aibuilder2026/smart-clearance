// Every figure and line of copy the landing page quotes, worked out from the API's showcase (one batch, computed by
// design3/core/money.js) and catalog, exactly as design3/site/site.jsx does from window.SC3_DATA. Nothing here names
// a client: the platform's own page tells the batch as an illustrative one (SC-28).
import { fmt, rate } from '@smart-clearance/core';
import type { Catalog, PlanLine, Showcase } from '#lib/api/types.ts';
import { EXIT_X } from './pan';

export type Exit = {
	id: string;
	name: string;
	line: string;
	x: number;
	taken?: boolean;
	bin?: boolean;
	detail: string;
};

export function figures(s: Showcase, c: Catalog) {
	const line = (id: string) => s.plan.lines.find((l) => l.id === id) as PlanLine;
	const row = (id: string) => s.plan.rows.find((r) => r.id === id)!;
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

	// 2 · how it works: three steps, the agents named under each, the human yes first in the third
	const steps = [
		{
			t: 'Spot it in time',
			art: 'phone-scan',
			who: agentsAt('connect', 'detect', 'verify'),
			text: "Every morning the Watcher checks each batch against its date and the quick-commerce shelf-life rules, and flags the stock that won't sell. Vision reads the label photo to be sure."
		},
		{
			t: 'Price every exit',
			art: 'kirana-plain',
			who: agentsAt('value', 'decide'),
			text: 'Kiranas, a clearance marketplace, a staff sale, a food bank: the Valuer prices each exit against the true cost of the bin, and the Router splits the batch.'
		},
		{
			t: 'Say yes once',
			art: 'van',
			yes: true,
			who: ['a person', ...agentsAt('execute', 'settle', 'report')],
			text: 'A person approves the plan with the money on screen. Then the agents list it, send offers in Hindi, answer bids, draft the invoices and report the impact.'
		}
	];

	// 3 · five exits, one batch
	const exits: Exit[] = [
		{
			id: 'kirana',
			name: 'Kiranas',
			line: `${fmt.num(KL.units)} packs · ${SHOPS} shops`,
			x: EXIT_X[0],
			taken: true,
			detail: `${fmt.num(KL.units)} packs to ${SHOPS} kiranas at ${fmt.inr(KL.price)} a pack, 2 free with every 10: ${fmt.inr(KL.net)} after the van.`
		},
		{
			id: 'expiresoon',
			name: 'ExpireSoon',
			line: `${fmt.num(AW.units)} packs · ${rate(AW.price)}`,
			x: EXIT_X[1],
			taken: true,
			detail: `${fmt.num(AW.units)} packs to one buyer on ExpireSoon at ${rate(AW.price)}, countered from ${rate(ESL.price)}: ${fmt.inr(ES_NET)} after the listing fee.`
		},
		{
			id: 'staff',
			name: 'Staff sale',
			line: 'priced, not needed',
			x: EXIT_X[2],
			detail: `${rate(row('staff').net)} a pack for up to ${row('staff').capacity} packs at the ${s.batch.distributorCity} godown. Not needed this time.`
		},
		{
			id: 'foodbank',
			name: 'Food bank',
			line: 'priced, not needed',
			x: EXIT_X[3],
			detail: `${rate(row('foodbank').net)} a pack, because a donation reverses the GST credit. Kept for food that can't sell.`
		},
		{
			id: 'bin',
			name: 'The bin',
			line: `${fmt.inr(-BIN)} · not taken`,
			x: EXIT_X[4],
			bin: true,
			detail: `${rate(-s.plan.writeOff.perUnit)} a pack: the stock, the GST credit, disposal and EPR, ${fmt.inr(-BIN)} for the batch. Not taken.`
		}
	];
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
		steps,
		exits,
		results,
		stops,
		plans: c.plans.map((p) => ({ ...p, scope: p.scope.map((x) => x.replace(/^The client's /, 'Your ')) })),
		connectors
	};
}

export type Figures = ReturnType<typeof figures>;
