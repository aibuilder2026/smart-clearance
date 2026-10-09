// What a partner's own pages share (SC-130, screens/trade.jsx): their days and times, a batch's stop, a paper's icon
// and who issued it, and the world the partner's moments name.
import type { IconName } from '../../../icons/registry';
import { offersFor, type PartnerWorld } from '../../partners';
import type { WorkspaceSource } from '../../source';
import type { Doc, PartnerCase, PtOffer, Shop } from '../../types';

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
