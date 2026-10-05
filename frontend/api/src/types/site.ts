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
	/** product: the pack's own name, without its brand */
	batch: { daysLeft: number; distributorCity: string; units: number; sellPerDay: number; product: string };
	risk: { atRisk: number; gates: Gate[] };
	/** the pricing rules the Valuer works to: a kirana takes up to 14 days' scheme volume, 2 free with every 10; a food
	 *  bank takes food with 15 or more days left */
	rules: { kiranaWindowDays: number; scheme: { buy: number; free: number }; foodbankMinDays: number };
	plan: {
		net: number;
		soldUnits: number;
		itcRetained: number;
		kg: number;
		writeOff: { total: number; perUnit: number };
		lines: PlanLine[];
		rows: ChannelRow[];
	};
	award: { units: number; price: number; gross: number };
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
