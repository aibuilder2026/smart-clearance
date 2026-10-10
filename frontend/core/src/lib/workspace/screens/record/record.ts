// a batch's record (SC-142, screens/finance.jsx): what the Record tab's pieces share
import { imgUrl } from '../../../assets';
import { fmt } from '../../model';
import { istDay } from '../../photos';
import type { RecordPhoto } from '../../types';

export const PHOTO: Record<RecordPhoto['id'], [string, string]> = {
	label: ['Label photo', 'Label'],
	before: ['Before, at the godown', '1 · Before'],
	after: ['After, at the landfill', '2 · After']
};
/** a time as the record keeps it: an ISO day and time on the live workspace and in the history, the stub's own (09:19,
 *  Mon 5 Oct) for the story's batch */
export const isIso = (t: string | null | undefined) => /^\d{4}-\d\d-\d\d/.test(t ?? '');
export const recWhen = (t: string | null | undefined) =>
	!t ? '' : !isIso(t) ? t : t.length > 10 ? `${fmt.day(t.slice(0, 10))}, ${t.slice(11, 16)}` : fmt.day(t);
export const recDay = istDay;
/** a photo's src: its signed link on the live workspace, else its file in the design system's img/ */
export const photoSrc = (p: RecordPhoto) => p.src || (p.img ? imgUrl(p.img) : undefined) || null;
export const upFirst = (t: string) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);
