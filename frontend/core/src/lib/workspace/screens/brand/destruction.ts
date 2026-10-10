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

export const dzPhoto = (d: Destruction | null | undefined, ref: string, which: DzWhich, live: boolean) =>
	d?.photos?.[which]?.url ?? (live ? undefined : imgUrl(`evidence/${ref}-${which}.webp`));

/** a photo's time, as the review tags it (11:40) */
export const dzAt = (d: Destruction | null | undefined, which: DzWhich) => {
	const at = d?.photos?.[which]?.at;
	return at ? ` · ${String(at).slice(-5)}` : '';
};
