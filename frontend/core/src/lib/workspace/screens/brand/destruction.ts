// Packs destroyed at the distributor's godown on expiry day (SC-139, option B): what the operator's and the
// distributor's screens share. Each state's tone and words, and where a photo of the evidence comes from: the live
// workspace's own link to it, else on the stub the batch's evidence as design3 keeps it (never a stand-in on a live
// workspace)
import { imgUrl } from '../../../assets';
import type { Destruction, DestructionStatus } from '../../types';

export const DZ_TONE: Record<DestructionStatus, ['amber' | 'violet' | 'green', string]> = {
	requested: ['amber', 'waiting for the evidence'],
	asked: ['amber', 'asked again'],
	reading: ['violet', 'Vision is checking'],
	checked: ['amber', 'waiting for your yes'],
	approved: ['green', 'approved']
};

export type DzWhich = 'before' | 'after';

/** a destruction photo's file under design3's img/evidence: the one it was sent as (the stub's slow chips send the
 *  landfill photo of expiry day, SC-168), else the batch's own (ledger.js record.evidenceFile) */
export const evidenceFile = (ref: string, which: string, p?: { name?: string } | null) =>
	p && /\.(webp|jpe?g|png)$/i.test(p.name ?? '') ? p.name!.replace(/^.*\//, '') : `${ref}-${which}.webp`;

/** a photo of the evidence: the live workspace's link to it, else on the stub its file as sent, else the example the
 *  journey shows for it (its own evidence), else the batch's */
export const dzPhoto = (
	d: Destruction | null | undefined,
	ref: string,
	which: DzWhich,
	live: boolean,
	example?: string | null
) => {
	const p = d?.photos?.[which];
	if (p?.url) return p.url;
	if (live) return undefined;
	return imgUrl(`evidence/${p ? evidenceFile(ref, which, p) : (example ?? `${ref}-${which}.webp`)}`);
};

/** a photo's time, as the review tags it (11:40) */
export const dzAt = (d: Destruction | null | undefined, which: DzWhich) => {
	const at = d?.photos?.[which]?.at;
	return at ? ` · ${String(at).slice(-5)}` : '';
};
