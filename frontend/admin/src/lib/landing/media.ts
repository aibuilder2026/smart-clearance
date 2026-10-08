// The landing page's moving pictures, referenced where design3 keeps them and hashed into the build: the film of one
// day at the miniature business under the heading (design3/site/assets/media, SC-78), as two clips chained without a
// cut, morning to night and night to morning, and the demo's poster for the pill that stays at hand
// (design3/system/media).
const clips = import.meta.glob('$design3/site/assets/media/{day-to-night,night-to-day}.mp4', {
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

/** the film: ten seconds from morning to night, and ten from night to morning, each ending on the frame the other
 *  begins on, so they chain and loop without a cut */
export const FILM = { dusk: url(clips, 'day-to-night.mp4'), dawn: url(clips, 'night-to-day.mp4') };
/** the 6-minute demo's poster, in the pill */
export const DEMO_POSTER = url(posters, 'carton-loop-poster.webp');
