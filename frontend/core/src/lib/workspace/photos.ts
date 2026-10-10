// The photos sent for a batch, from a partner's facts (SC-142): a distributor's batch page reads the label photo and the
// destruction's two from his own facts (GET …/partner), each with its short-lived link, and the client's yes on the
// destruction. The stub's photos come through its record (stub.svelte.ts); nothing here reads the seed, so a live build
// carries none of it. Also the days in India's time the record and Batches print.
import { fmt } from '../format';
import type { PartnerCase, RecordPhoto, RecordStep, StoryPerson } from './types';

const IST = 'T00:00:00+05:30';
/** an IST day as the record heads it (2026-08-27 → Thu, 27 Aug) */
export const istDay = (iso: string) =>
	new Date(iso.slice(0, 10) + IST).toLocaleDateString('en-IN', {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
		timeZone: 'Asia/Kolkata'
	});
/** an IST day's month, as Batches heads the batches cleared in it (2026-08-27 → August 2026) */
export const istMonth = (iso: string) =>
	new Date(iso.slice(0, 10) + IST).toLocaleDateString('en-IN', {
		month: 'long',
		year: 'numeric',
		timeZone: 'Asia/Kolkata'
	});

const min = (t: string | null | undefined) => (t ? t.slice(0, 16) : '');

/** the photos a distributor sent for a batch, from his facts on the live workspace: null where his facts carry none
 *  (the stub's), so the screen reads the stub's record instead */
export function factsPhotos(pc: PartnerCase, by: string): RecordPhoto[] | null {
	if (pc.photo === undefined) return null;
	const out: RecordPhoto[] = [];
	const ph = pc.photo;
	if (ph?.url)
		out.push({ id: 'label', src: ph.url, at: min(ph.at), by, read: ph.read ? { at: min(ph.at), ...ph.read } : null });
	const xd = pc.destruction;
	if (xd?.photos)
		for (const w of ['before', 'after'] as const) {
			const p = xd.photos[w];
			if (p?.url)
				out.push({
					id: w,
					src: p.url,
					at: min(p.at),
					by,
					checks: (xd.checks ?? []).filter((x) =>
						(w === 'before' ? ['batch', 'count'] : ['slate', 'when']).includes(x.id)
					)
				});
		}
	return out;
}
/** the client's yes on the destruction he evidenced, from his facts */
export function factsYes(pc: PartnerCase, godown: string, people: Record<string, StoryPerson>): RecordStep | null {
	const xd = pc.destruction;
	if (!xd?.approvedAt) return null;
	const by = xd.approvedBy ?? '';
	return {
		key: 'destruction.approve',
		at: min(xd.approvedAt),
		who: { kind: 'person', id: by || null, name: people[by]?.name ?? by, org: null },
		text: `approved the destruction of ${fmt.num(xd.units)} packs at ${godown}`,
		yes: true
	};
}
