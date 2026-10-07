// The landing page's moving pictures, referenced where design3 keeps them and hashed into the build: the film of the
// miniature business under the heading (design3/site/assets/media, SC-60), by day and by night, and the demo's poster
// for the pill that stays at hand (design3/system/media).
const clips = import.meta.glob('$design3/site/assets/media/{town,town-night}.mp4', {
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

/** the film: 8 s by day, 6 s by night, each played once */
export const FILM = { day: url(clips, 'town.mp4'), night: url(clips, 'town-night.mp4') };
/** the 6-minute demo's poster, in the pill */
export const DEMO_POSTER = url(posters, 'carton-loop-poster.webp');
