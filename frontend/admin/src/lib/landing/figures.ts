// Every figure and line of copy the landing page quotes, worked out from the API's showcase (one batch, computed by
// design3/core/money.js) and catalog, exactly as design3/site/site.jsx does from window.SC3_DATA. Nothing here names
// a client: the platform's own page tells the batch as an illustrative one (SC-28).
import { fmt, rate, type IconName } from '@smart-clearance/core';
import type { Catalog, PlanLine, Showcase } from '@smart-clearance/api/site';
import { AFTER, ORDER, type AgentId } from './scene';

export type Agent = {
	id: AgentId;
	name: string;
	icon: IconName;
	/** the person who says yes: "You", the manufacturer's own team */
	human: boolean;
	/** its post on the table */
	where: string;
	/** what it did for this batch */
	did: string;
};
/** a chapter of the film's day: the hour, who, and what happened (the figures money.js's) */
export type Beat = { at: string; who: string; t: string; human?: boolean };
/** a team of the manufacturer's, as a tab of its workspace */
export type Team = {
	id: 'supply' | 'finance' | 'impact' | 'dist';
	icon: IconName;
	t: string;
	/** the path the window's address shows for it */
	route: string;
	d: string;
	/** what the agents did for this team today: the hour and the agent */
	today: [string, AgentId][];
};
export type Chapter = {
	id: 'watch' | 'price' | 'yes' | 'work';
	tone: 'green' | 'sunken' | 'amber' | 'night';
	title: string;
	lede: string;
	who: string[];
	/** the first name is a person, not an agent */
	person?: boolean;
	/** the chapter's stage runs the full width under its copy */
	wide?: boolean;
};

export function figures(s: Showcase, c: Catalog) {
	const line = (id: string) => s.plan.lines.find((l) => l.id === id) as PlanLine;
	const row = (id: string) => s.plan.rows.find((r) => r.id === id)!;
	const planned = (id: string) => s.plan.lines.some((l) => l.id === id);
	const KL = line('kirana');
	const ESL = line('expiresoon');
	const AW = s.award;
	const SHOPS = s.shops;
	const N = s.risk.atRisk;
	const BIN = s.plan.writeOff.total;
	const ES_NET = AW.gross - ESL.cost;
	const { buy, free } = s.rules.scheme;

	// the agents at each stop (the approval gate is the person, not an agent)
	const byStage: Record<string, string[]> = {};
	for (const a of c.agents) if (!a.gate) (byStage[a.stage] ??= []).push(a.name);
	const agentsAt = (...stages: string[]) => stages.flatMap((st) => byStage[st] ?? []);
	const released = agentsAt('execute', 'settle', 'report');

	// the agents, with what each did for this batch; the person who says yes is "You"
	const DID: Record<string, string> = {
		data: `${fmt.num(s.batch.units)} packs in stock, selling ${s.batch.sellPerDay} a day`,
		watcher: `${fmt.num(N)} packs won't sell in the ${s.batch.daysLeft} days left`,
		vision: 'Read the label: the date matches',
		valuer: `Five exits priced; the bin would cost ${fmt.inr(-BIN)}`,
		router: `${fmt.num(KL.units)} to ${SHOPS} kiranas, ${fmt.num(AW.units)} to one buyer`,
		gate: `Approved in one tap, ${fmt.inr(s.plan.net)} on screen`,
		outreach: `${fmt.num(KL.units)} packs to ${SHOPS} kiranas, buy ${buy} get ${free} free`,
		lister: `${fmt.num(AW.units)} packs listed in the distributor's name`,
		negotiator: `Countered a bid to ${rate(AW.price)} a pack`,
		paperwork: 'The invoice, credit note and GST memo, drafted',
		impact: `${fmt.num(s.plan.kg)} kg kept out of landfill`
	};
	const WHERE: Record<AgentId, string> = {
		data: 'at the godown',
		watcher: 'at the godown',
		vision: 'at the godown',
		valuer: 'at the godown',
		router: 'at the godown',
		you: 'on your phone',
		outreach: 'at the kiranas',
		lister: "at the buyer's bay",
		negotiator: "at the buyer's truck",
		paperwork: 'on your phone',
		impact: 'at the landfill'
	};
	const agents = Object.fromEntries(
		c.agents.map((a) => {
			const id = (a.gate ? 'you' : a.id) as AgentId;
			return [
				id,
				{
					id,
					name: a.gate ? 'You' : a.name,
					icon: a.icon as IconName,
					human: !!a.gate,
					where: WHERE[id],
					did: DID[a.id]
				}
			];
		})
	) as Record<AgentId, Agent>;
	for (const id of ORDER) if (!agents[id]) throw new Error(`the catalog has no agent for the scene's "${id}"`);

	// the kirana offer as Outreach sends it, with no client in it: the data's copy names the shop, the brand and the
	// distributor, which this page leaves out (SC-28)
	const bestBefore = new Date(s.batch.bestBefore + 'T00:00:00').toLocaleDateString('en-IN', {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	});
	const offer = {
		title: s.offer.title,
		body: `नमस्ते! ${s.batch.product} पर आज खास ऑफर: ${buy} पैकेट लो, ${free} मुफ़्त. Best before ${bestBefore}. सिर्फ़ 48 घंटे. ऑर्डर के लिए टैप करें.`
	};

	// 3 · the agents at work on the table, one in focus at a time: what the card in focus shows live, the places' tags,
	// the phone's screen and the result
	const scene = {
		lede: `${fmt.num(N)} packs of masala chips that won't sell in the ${s.batch.daysLeft} days they have left, on the table. The agents work the batch stop by stop; a person says yes once; the packs leave for the kiranas and a buyer, and nothing goes to the bin.`,
		units: s.batch.units,
		sellPerDay: s.batch.sellPerDay,
		daysLeft: s.batch.daysLeft,
		product: s.batch.product,
		atRisk: N,
		gates: s.risk.gates,
		prices: [
			['kirana', 'Kiranas'],
			['expiresoon', 'ExpireSoon'],
			['staff', 'Staff sale'],
			['foodbank', 'Food bank'],
			['writeoff', 'The bin']
		].map(([id, name]) => ({
			id,
			dot: id === 'writeoff' ? 'bin' : id,
			name,
			net: row(id).net,
			bin: id === 'writeoff'
		})),
		kiranas: KL.units,
		kiranaNet: KL.net,
		buyer: AW.units,
		buyerNet: ESL.net,
		price: AW.price,
		bid: AW.bid,
		token: AW.token,
		reserve: s.rules.reservePerUnit,
		shops: SHOPS,
		buy,
		free,
		offerTitle: offer.title,
		planNet: s.plan.net,
		pctMRP: s.plan.pctMRP,
		swing: s.plan.swing,
		bin: BIN,
		support: s.support.total,
		kg: s.plan.kg,
		net: s.actual.net,
		result: `${fmt.inr(s.actual.net)} recovered, instead of ${fmt.inr(-BIN)} to destroy it`,
		/** what the yes releases, with what each did, for the phone's screen once the plan is placed */
		after: AFTER.map((id) => agents[id])
	};

	// 4 · the chapters: the moments each team actually sees, each in a colour field (SC-28's cards, SC-60's fields)
	const chapters: Chapter[] = [
		{
			id: 'watch',
			tone: 'green',
			title: 'Spot it while there is time to sell',
			lede: 'Every morning at 09:00 the Watcher checks each batch against its date and the quick-commerce shelf-life rules. Vision reads the label photo from the godown to be sure.',
			who: agentsAt('connect', 'detect', 'verify')
		},
		{
			id: 'price',
			tone: 'sunken',
			title: 'Price every exit, the bin included',
			lede: `Kiranas on a ${free}-free-with-${buy} scheme, a clearance marketplace, a staff sale at the godown, a food bank: the Valuer prices each against the true cost of destroying the stock, and the Router splits the batch within each exit's limits.`,
			who: agentsAt('value', 'decide')
		},
		{
			id: 'yes',
			tone: 'amber',
			title: 'Say yes once.',
			lede: 'A person approves the plan with the money on screen. Nothing is listed, messaged or shipped before that tap.',
			who: ['a person'],
			person: true
		},
		{
			id: 'work',
			tone: 'night',
			title: 'The agents do the rest.',
			lede: "They send the kirana offers in Hindi, list the lot in the distributor's name, answer bids, draft the invoice, credit note and GST memo, and post the impact.",
			who: released,
			wide: true
		}
	];
	// the chapters' cards (SC-28): the Watcher's alert, the Valuer's prices with the Router's split, the plan waiting
	// for one yes, and the agents' work after it
	const how = {
		alert: {
			product: s.batch.product,
			where: `${fmt.num(s.batch.units)} packs in a distributor's godown, ${s.batch.distributorCity}`,
			gates: s.risk.gates,
			atRisk: N,
			daysLeft: s.batch.daysLeft
		},
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
		split: { kiranas: KL.units, expiresoon: ESL.units, shops: SHOPS, total: N },
		plan: {
			net: s.plan.net,
			bin: BIN,
			lines: [
				{ id: 'kirana', label: `${fmt.num(KL.units)} packs to ${SHOPS} kiranas`, net: KL.net },
				{ id: 'expiresoon', label: `${fmt.num(ESL.units)} packs on ExpireSoon`, net: ESL.net }
			],
			released
		},
		work: {
			offer,
			packPrice: KL.packPrice!,
			mrp: s.batch.mrp,
			buy,
			free,
			shops: SHOPS,
			kiranas: KL.units,
			listed: AW.units,
			reserve: s.rules.reservePerUnit,
			bid: AW.bid,
			price: AW.price,
			token: AW.token,
			support: s.support.total,
			itcRetained: s.plan.itcRetained
		}
	};

	// 5 · the ledger: Impact's own document for one batch
	const ledger = [
		{
			k: 'Recovered, net',
			s: `${fmt.inr(KL.net)} from ${SHOPS} kiranas after the van, ${fmt.inr(ES_NET)} from a marketplace buyer after the fee`,
			v: s.actual.net,
			kind: 'money' as const
		},
		{
			k: 'Better than the bin',
			s: `against ${fmt.inr(-BIN)} to destroy the stock: the goods, the GST credit, disposal and EPR`,
			v: s.actual.swing,
			kind: 'money' as const
		},
		{
			k: 'GST input credit kept',
			s: 'goods supplied under tax invoices, so the Section 17(5)(h) reversal does not apply',
			v: s.plan.itcRetained,
			kind: 'money' as const
		},
		{ k: 'Kept out of landfill', s: `${fmt.num(s.plan.co2)} kg CO₂e, indicative`, v: s.plan.kg, kind: 'kg' as const },
		{
			k: 'Cartons destroyed',
			s: `${fmt.num(s.plan.soldUnits)} packs sold on tax invoices`,
			v: 0,
			kind: 'zero' as const
		}
	];

	// 1 · the film's story: the four chapters of the journey's day (SC-111); the person's chapter in amber
	const staffCap = row('staff').capacity;
	const story: Beat[] = [
		{
			at: '09:00',
			who: 'The brand and the distributor',
			t: `${fmt.num(N)} packs flagged; one yes, ${fmt.inr(s.plan.net)} on screen`,
			human: true
		},
		{
			at: '13:00',
			who: 'The food bank',
			t: `packs with ${s.rules.foodbankMinDays}+ days left go as meals, on the FSSAI checklist`
		},
		{
			at: '18:30',
			who: 'The kiranas and the staff sale',
			t: `${SHOPS} shops order ${fmt.num(KL.units)} packs; the godown's own staff buy ${staffCap === null ? 'the rest' : `up to ${fmt.num(staffCap)}`}`
		},
		{
			at: '22:00',
			who: 'Paperwork',
			t: `the tax invoice and the credit note drafted; ${fmt.inr(s.plan.itcRetained)} of GST credit kept`
		}
	];

	// 6 · the workspace itself, on a device (SC-78): the four teams as its tabs, each with what it sees of the batch
	// and what the agents did for it today; the connectors the comp shows, in its order
	const teams: Team[] = [
		{
			id: 'supply',
			icon: 'route',
			t: 'Supply chain',
			route: 'route',
			d: 'One tap to approve a plan, with the money on screen.',
			today: [
				['09:00', 'watcher'],
				['09:12', 'vision'],
				['09:31', 'router']
			]
		},
		{
			id: 'finance',
			icon: 'receipt',
			t: 'Finance',
			route: 'paperwork',
			d: 'The invoice, credit note and GST memo, drafted.',
			today: [
				['09:40', 'you'],
				['14:05', 'negotiator'],
				['18:20', 'paperwork']
			]
		},
		{
			id: 'impact',
			icon: 'leaf',
			t: 'Sustainability',
			route: 'report',
			d: 'A BRSR line an auditor can follow back to the batch.',
			today: [
				['18:20', 'paperwork'],
				['Day 7', 'impact'],
				['Day 7', 'data']
			]
		},
		{
			id: 'dist',
			icon: 'handshake',
			t: 'Distributors',
			route: 'permissions',
			d: 'Nothing listed in their name without their permission.',
			today: [
				['09:00', 'data'],
				['09:41', 'outreach'],
				['11:30', 'lister']
			]
		}
	];
	// the addresses: one workspace each, none of them a client's (SC-28)
	const addresses = [
		{ id: 'brand', url: 'your-brand.smartclearance.com', live: true },
		{ id: 'company', url: 'your-company.smartclearance.com', live: false },
		{ id: 'group', url: 'your-group.smartclearance.com', live: false }
	];

	const connectors = ['dms', 'tally', 'bq', 'sso', 'expiresoon', 'irp', 'whatsapp']
		.map((id) => c.connectors.find((x) => x.id === id))
		.filter((x) => x !== undefined);

	return {
		shops: SHOPS,
		atRisk: N,
		daysLeft: s.batch.daysLeft,
		actual: s.actual,
		bin: BIN,
		kg: s.plan.kg,
		agents,
		scene,
		chapters,
		how,
		ledger,
		story,
		teams,
		addresses,
		plans: c.plans.map((p) => ({ ...p, scope: p.scope.map((x) => x.replace(/^The client's /, 'Your ')) })),
		connectors
	};
}

export type Figures = ReturnType<typeof figures>;
