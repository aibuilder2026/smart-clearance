// The landing page's part of the contract (smartclearance.com): the showcase it tells its story with, and the calls its
// visitors make. Shared shapes are in shared.ts.
import type { Catalog, DemoRequest, DemoRequestInput, WorkspaceMatch } from './shared';

export type PlanLine = {
	id: string;
	short: string;
	units: number;
	price: number;
	packPrice: number | null;
	gross: number;
	cost: number;
	net: number;
};
export type ChannelRow = { id: string; short: string; net: number; eligible: boolean; capacity: number | null };
export type Stage = { id: string; title: string; human: boolean };
/** a quick-commerce shelf-life gate and whether the batch passes it (money.js gates()) */
export type Gate = { id: string; app: string; rule: string; has: number; need: number; pass: boolean };

/** GET /v1/site/showcase: one batch with every figure worked out, as the landing page tells it. It names no client, no
 *  person and no partner: the platform's own page tells it as an illustrative batch (SC-28) */
export type Showcase = {
	platform: { name: string; domain: string };
	/** product: the pack's own name, without its brand; mrp: its printed price; bestBefore: the batch's date (ISO) */
	batch: {
		daysLeft: number;
		distributorCity: string;
		units: number;
		sellPerDay: number;
		product: string;
		mrp: number;
		bestBefore: string;
	};
	risk: { atRisk: number; gates: Gate[] };
	/** the pricing rules the Valuer works to: a kirana takes up to 14 days' scheme volume, 2 free with every 10; a food
	 *  bank takes food with 15 or more days left; the Negotiator holds a reserve a pack on the marketplace */
	rules: {
		kiranaWindowDays: number;
		scheme: { buy: number; free: number };
		foodbankMinDays: number;
		reservePerUnit: number;
	};
	/** the plan: what it recovers (net, and as a share of MRP), what it keeps out of the bin (swing, kg, co2 in kg CO₂e,
	 *  indicative), the GST credit it keeps, and its lines and every exit's row */
	plan: {
		net: number;
		pctMRP: number;
		swing: number;
		soldUnits: number;
		itcRetained: number;
		kg: number;
		co2: number;
		writeOff: { total: number; perUnit: number };
		lines: PlanLine[];
		rows: ChannelRow[];
	};
	/** the marketplace award: the buyer's opening bid, the price countered to, and the token paid */
	award: { units: number; price: number; gross: number; token: number; bid: number };
	/** the brand's price-support credit note to the distributor */
	support: { total: number };
	/** the kirana offer's title, in Hindi; its body is composed on the page, since the prototype's names its client */
	offer: { title: string };
	actual: { net: number; pnl: number; swing: number };
	shops: number;
	stages: Stage[];
};

/** what the landing page calls */
export interface SiteApi {
	showcase(): Promise<Showcase>;
	catalog(): Promise<Catalog>;
	lookupWorkspaces(query: string): Promise<WorkspaceMatch[]>;
	requestDemo(input: DemoRequestInput): Promise<DemoRequest>;
}
