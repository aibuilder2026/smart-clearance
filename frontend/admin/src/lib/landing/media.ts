// The landing page's moving pictures, referenced where design3 keeps them and hashed into the build: the film of one
// day of the journey with real people under the heading (design3/site/assets/media, SC-154), four chapters that loop
// through a dissolve, and the demo's poster for the pill that stays at hand (design3/system/media).
const clips = import.meta.glob('$design3/site/assets/media/one-journey.mp4', {
	query: '?url',
	import: 'default',
	eager: true
}) as Record<string, string>;
const posters = import.meta.glob('$design3/system/media/carton-loop-poster.webp', {
	query: '?url',
	import: 'default',
	eager: true
}) as Record<string, string>;

const url = (files: Record<string, string>, file: string) => {
	const hit = Object.entries(files).find(([path]) => path.endsWith('/' + file));
	if (!hit) throw new Error(`media missing from design3: ${file}`);
	return hit[1];
};

/** where each chapter's subject is in the frame, for the page's camera to lean on */
export type Place = { x: number; y: number };
/** the film (SC-154): about 15 s of one day of the journey, live action, in four chapters (dawn at the factory's bay,
 *  a high sun at the godown's counter, a violet dusk in the yard with the food bank's van and the staff-sale table,
 *  evening in the office), each dissolving into the next and the tail into the head, so it loops; both themes start
 *  on its first frame. Where each chapter begins, its frame, and how far and on what the page's camera leans */
export const FILM = {
	src: url(clips, 'one-journey.mp4'),
	bounds: [0, 3.55, 7.35, 11.15],
	ar: 16 / 9,
	lean: 1.25,
	at: [
		{ x: 0.62, y: 0.5 },
		{ x: 0.5, y: 0.55 },
		{ x: 0.72, y: 0.5 },
		{ x: 0.5, y: 0.5 }
	] as Place[]
};
/** the 6-minute demo's poster, in the pill */
export const DEMO_POSTER = url(posters, 'carton-loop-poster.webp');
