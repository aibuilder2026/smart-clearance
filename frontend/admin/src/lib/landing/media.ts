import { PUBLIC_DEMO_FILM } from '$app/env/public';

// The landing page's moving pictures, referenced where design3 keeps them and hashed into the build: the film of one
// day of the journey with real people under the heading (design3/site/assets/media, SC-154), four chapters that loop
// through a dissolve, and the demo film's poster, thumbnail and words (SC-164).
const clips = import.meta.glob('$design3/site/assets/media/one-journey.mp4', {
	query: '?url',
	import: 'default',
	eager: true
}) as Record<string, string>;
const stills = import.meta.glob(
	['$design3/site/assets/plates/film-poster.webp', '$design3/site/assets/plates/film-thumb.webp'],
	{
		query: '?url',
		import: 'default',
		eager: true
	}
) as Record<string, string>;
const words = import.meta.glob('$design3/site/assets/media/demo-film.json', {
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
 *  evening in the office, the workspace's own Command Center on its monitor, SC-237), each dissolving into the next
 *  and the tail into the head, so it loops; both themes start on its first frame. Where each chapter begins, its
 *  frame, and how far and on what the page's camera leans (chapter 4 on the monitor) */
export const FILM = {
	src: url(clips, 'one-journey.mp4'),
	bounds: [0, 3.55, 7.35, 9.78],
	ar: 16 / 9,
	lean: 1.25,
	at: [
		{ x: 0.62, y: 0.5 },
		{ x: 0.5, y: 0.55 },
		{ x: 0.72, y: 0.5 },
		{ x: 0.42, y: 0.5 }
	] as Place[]
};
/** the demo film (SC-238's landing film v3, SC-164, SC-242, SC-245): 7 min 51 s at 25 fps, a batch with twenty-two days left
 *  that no app will take, the rule and the cost of the bin, the product, ten agents and one yes, the happy path and the
 *  hard case, every paper and every rupee, played from YouTube (unlisted) in a theatre over the page. Its poster is the
 *  office scene of SC-211's film, the brand and its distributor at the dashboard; the film names no client either
 *  (SC-28). Its chapters and captions (`words`) are read when the theatre first opens. Until its id is set
 *  (PUBLIC_DEMO_FILM), Watch opens the guided demo */
export const DEMO_FILM = {
	youtube: PUBLIC_DEMO_FILM ?? null,
	runtime: '7:51',
	label: 'Watch the 8-minute demo',
	title: 'The 8-minute demo',
	sub: 'The whole journey, end to end',
	poster: url(stills, 'film-poster.webp'),
	thumb: url(stills, 'film-thumb.webp'),
	words: url(words, 'demo-film.json')
};
/** the film's words: its chapters, each with its start and the captions in it */
export type FilmWords = {
	duration: number;
	chapters: { id: string; title: string; at: number; lines: { at: number; text: string }[] }[];
};
