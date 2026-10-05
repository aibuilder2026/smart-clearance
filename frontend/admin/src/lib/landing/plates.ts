// The landing page's plates, referenced where design3 keeps them (design3/site/assets/plates) and hashed into the
// build. Four are composed twice, by day and by night (never inverted); the dusk band is one plate in both themes.
const files = import.meta.glob('$design3/site/assets/plates/*.webp', {
	query: '?url',
	import: 'default',
	eager: true
}) as Record<string, string>;

const url = (file: string) => {
	const hit = Object.entries(files).find(([path]) => path.endsWith('/' + file));
	if (!hit) throw new Error(`plate missing from design3/site/assets/plates: ${file}`);
	return hit[1];
};

export type Plate = { day: string; night: string };
export const PLATES = {
	scene: { day: url('scene.webp'), night: url('scene-night.webp') },
	exits: { day: url('exits.webp'), night: url('exits-night.webp') },
	approve: { day: url('approve.webp'), night: url('approve-night.webp') },
	islands: { day: url('islands.webp'), night: url('islands-night.webp') },
	dusk: { day: url('dusk.webp'), night: url('dusk.webp') }
} satisfies Record<string, Plate>;
