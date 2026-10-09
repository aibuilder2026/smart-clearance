// What a partner's own pages share (SC-130, screens/trade.jsx): their days and times, a batch's stop, a paper's icon
// and who issued it, and the world the partner's moments name.
import type { IconName } from '../../../icons/registry';
import { distNows, journeyOf, byAsk, type DistNow, type DistWorld } from '../../dist';
import { offersFor, type PartnerWorld } from '../../partners';
import type { WorkspaceSource } from '../../source';
import type { Distributor, Doc, PartnerCase, PtOffer, Shop, User } from '../../types';

// the client's days and times come as its own (2026-08-27, 2026-08-27T12:10): a day is read from its parts, so no
// time zone moves it
const asDay = (iso: string) => {
	const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
	return new Date(Date.UTC(y, m - 1, d, 12));
};
const UTC = 'UTC';
/** 27 Aug */
export const day = (iso: string) =>
	asDay(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: UTC });
/** 27 Aug, 12:10 */
export const when = (iso: string) => (iso.length > 10 ? `${day(iso)}, ${iso.slice(11, 16)}` : day(iso));
/** Monday */
export const weekday = (iso: string) => asDay(iso).toLocaleDateString('en-IN', { weekday: 'long', timeZone: UTC });
/** September 2026 */
export const monthOf = (iso: string) =>
	asDay(iso).toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: UTC });

/** the stop a batch in a journey is at, by its phase */
export const stopOf = (phase: string | null | undefined) =>
	(
		({
			'at-risk': 'Verify',
			verified: 'Value',
			valued: 'Decide',
			planned: 'Approve',
			approved: 'Execute',
			executing: 'Execute',
			dispatched: 'Settle',
			settled: 'Settle',
			cleared: 'Report'
		}) as Record<string, string>
	)[phase ?? ''] || 'Detect';

export const PAPER_ICON: Record<string, IconName> = {
	invoice: 'receipt',
	eway: 'truck',
	support: 'hand-coins',
	expiry: 'warehouse',
	receipt: 'heart-handshake',
	destruction: 'trash-2'
};
/** who issued a paper, from the distributor's side */
export const issuedBy = (c: Pick<PartnerCase, 'partner'>, d: Doc, short: string) =>
	d.id === 'invoice' || d.id === 'eway'
		? 'You issue it'
		: d.id === 'receipt'
			? `${c.partner ? c.partner.name : 'The food bank'} issued it to ${short} · a copy for you`
			: d.id === 'destruction'
				? `${short} destroyed the packs · a copy for you`
				: `${short} issued it to you`;

/** the world a partner's moments name: the workspace's products and distributors, the buyer, the client */
export const worldOf = (ws: WorkspaceSource): PartnerWorld => ({
	skus: ws.data.skus,
	distributors: ws.data.distributors,
	buyer: ws.partners?.buyer ?? { name: ws.case?.buyer.name ?? '', city: ws.case?.buyer.city ?? '' },
	client: ws.data.client.name,
	short: ws.data.workspace.short,
	capTimes: ws.data.rules.shopCapTimes
});

/** every offer the signed-in kirana's shop was sent: on the stub the batch in a journey's comes from the journey's state,
 *  as the prototype has it; on the live workspace every offer, that one too, from what backend-api sent */
export function offersOf(ws: WorkspaceSource, me: { org?: string }): PtOffer[] {
	const shop = shopOf(ws, me);
	if (!shop || !ws.partners) return [];
	const c = ws.case;
	const story = ws.kind === 'stub' && c ? { c, h: ws.state.hero, day0: ws.data.day0 } : null;
	return offersFor(shop, ws.partners.cases, worldOf(ws), story).map((o) =>
		!o.story && c && o.ref === c.batch.id ? { ...o, story: true } : o
	);
}

/** the signed-in kirana's shop: the one backend-api names, else the stub's by the shop's name */
export const shopOf = (ws: WorkspaceSource, me: { org?: string }): Shop | null =>
	ws.partners?.shop ?? ws.data.shops?.find((x) => x.name === me.org) ?? null;

/* ---------- a distributor's portal, batch by batch (SC-133) ---------- */

/** the distributor a person works for: his own, else the batch in focus's, else the first */
export const distOfMe = (ws: WorkspaceSource, me: Pick<User, 'org'>): Distributor =>
	Object.values(ws.data.distributors).find((d) => d.name === me.org) ??
	ws.case?.dist ??
	Object.values(ws.data.distributors)[0];
/** what a distributor's pages name: the products, the distributors, the buyer, the scheme, the client */
export const distWorldOf = (ws: WorkspaceSource): DistWorld => ({
	skus: ws.data.skus,
	distributors: ws.data.distributors,
	buyer: ws.partners?.buyer ?? { name: ws.case?.buyer.name ?? '', city: ws.case?.buyer.city ?? '' },
	scheme: ws.case?.scheme ?? ws.data.rules.scheme,
	short: ws.data.workspace.short
});
/** a shop by its id: one of the batch in focus's, else one of the workspace's, else its id */
export const shopNameOf = (ws: WorkspaceSource) => (id: string) =>
	ws.case?.kiranas.find((k) => k.id === id)?.name ?? ws.data.shops?.find((k) => k.id === id)?.name ?? id;
/** his batches in a journey: the batch in focus from the journey's state, the stub's second from its own, every other
 *  from its partner facts and the phase the snapshot has its journey at */
export function distNowsOf(ws: WorkspaceSource, distId: string): DistNow[] {
	const batch = (ref: string) => ws.data.batches.find((b) => b.id === ref);
	return distNows(
		{
			state: ws.state,
			c: ws.case,
			day0: ws.data.day0,
			shops: ws.data.shops ?? [],
			cases: ws.partners?.cases ?? [],
			phaseOf: (ref) => batch(ref)?.journey,
			shelfOf: (ref) => batch(ref)?.shelf
		},
		distId
	);
}
/** his batches in a journey as he reads them, the one asking most of him first */
export const distJourneysOf = (ws: WorkspaceSource, distId: string) =>
	distNowsOf(ws, distId)
		.map((n) => ({ n, j: journeyOf(n, distWorldOf(ws)) }))
		.sort((a, z) => byAsk(a.j, z.j));
