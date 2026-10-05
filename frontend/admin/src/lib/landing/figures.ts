// Every figure and line of copy the landing page quotes, worked out from the API's showcase (Munchly's batch, computed
// by design3/core/money.js) and catalog, exactly as design3/site/site.jsx does from window.SC3_DATA.
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
	const dist = s.batch.distributor;

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
			detail: `${fmt.num(AW.units)} packs to ${s.buyer.name} in ${s.buyer.city} at ${rate(AW.price)}, countered from ${rate(ESL.price)}: ${fmt.inr(ES_NET)} after the listing fee.`
		},
		{
			id: 'staff',
			name: 'Staff sale',
			line: 'priced, not needed',
			x: EXIT_X[2],
			detail: `${rate(row('staff').net)} a pack for up to ${row('staff').capacity} packs at the ${dist.city} godown. Not needed this time.`
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

	// the nine stops: what each one does, and the agents at it (the approval gate is the person, not an agent)
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
	const byStage: Record<string, string[]> = {};
	for (const a of c.agents) if (!a.gate) (byStage[a.stage] ??= []).push(a.name);
	const stops = s.stages.map((st) => ({ ...st, text: STOP_LINES[st.id], agents: byStage[st.id] ?? [] }));

	const cast = [
		{ id: 'rakesh', role: `Distributor, ${dist.city}`, did: `Made whole by a ${fmt.inr(s.support.total)} credit note` },
		{ id: 'ganesh', role: 'Kirana, Itwari', did: '2 free with every 10' },
		{ id: 'anita', role: 'Finance, Munchly', did: 'Credit note and GST memo drafted' },
		{ id: 'vikram', role: 'Sustainability, Munchly', did: `${fmt.num(s.plan.kg)} kg kept out of landfill` }
	] as const;

	return {
		batchId: s.batch.id,
		sku: s.batch.sku,
		dist,
		shops: SHOPS,
		bin: BIN,
		kl: KL,
		esNet: ES_NET,
		atRisk: s.risk.atRisk,
		daysLeft: s.batch.daysLeft,
		actual: s.actual,
		plan: s.plan,
		exits,
		stops,
		cast: cast.map((x) => ({ ...x, person: s.people[x.id] })),
		returnDay: fmt.date(s.returnBy).replace(/ \d{4}$/, ''),
		plans: c.plans.map((p) => ({ ...p, scope: p.scope.map((x) => x.replace(/^The client's /, 'Your ')) })),
		connectors: c.connectors
	};
}

export type Figures = ReturnType<typeof figures>;
