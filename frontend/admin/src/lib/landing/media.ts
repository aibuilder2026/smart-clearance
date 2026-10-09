// The landing page's moving pictures, referenced where design3 keeps them and hashed into the build: the film of one
// day at the miniature business under the heading (design3/site/assets/media, SC-111), the journey in four acts that
// loop without a cut, and the demo's poster for the pill that stays at hand (design3/system/media).
const clips = import.meta.glob('$design3/site/assets/media/one-day.mp4', {
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

/** where each act's place is on the plate, for the page's camera to lean on */
export type Place = { x: number; y: number };
/** the film: 14.2 s of one day in four acts (sunrise at the factory's bay, a high sun at the community kitchen, a
 *  violet dusk at the kirana lane and the staff-sale table, an indigo-violet night in the office), each act dissolving
 *  into the next and the last running back into the first; where each chapter begins, where the night starts (the
 *  dark theme's first frame), its frame, and how far and on what the page's camera leans */
export const FILM = {
	src: url(clips, 'one-day.mp4'),
	bounds: [0, 3.28, 6.84, 10.41],
	night: 10.5,
	ar: 1280 / 704,
	lean: 1.5,
	at: [
		{ x: 0.37, y: 0.67 },
		{ x: 0.575, y: 0.42 },
		{ x: 0.64, y: 0.66 },
		{ x: 0.14, y: 0.64 }
	] as Place[]
};
/** the 6-minute demo's poster, in the pill */
export const DEMO_POSTER = url(posters, 'carton-loop-poster.webp');
