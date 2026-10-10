// The landing page's plates, referenced where design3 keeps them (design3/site/assets/plates) and hashed into the
// build: only the ones the page shows, so no other plate is copied into it. Two are composed twice, by day and by
// night (never inverted); the dusk band is one in both themes.
const files = import.meta.glob(
	'$design3/site/assets/plates/{hero-day,hero-night,hero-day-preview,hero-night-preview,table,table-night,dusk}.webp',
	{
		query: '?url',
		import: 'default',
		eager: true
	}
) as Record<string, string>;

const url = (file: string) => {
	const hit = Object.entries(files).find(([path]) => path.endsWith('/' + file));
	if (!hit) throw new Error(`plate missing from design3/site/assets/plates: ${file}`);
	return hit[1];
};

export type Plate = { day: string; night: string };
export const PLATES = {
	// the first viewport's film at its first frame (SC-154), graded for each theme: the film's poster, and what a
	// reader who asks for less motion sees in its place
	hero: { day: url('hero-day.webp'), night: url('hero-night.webp') },
	// the posters' soft previews (SC-131): 48 px copies, small enough to come inlined in the page, shown blurred under
	// the film until its poster arrives
	preview: { day: url('hero-day-preview.webp'), night: url('hero-night-preview.webp') },
	// the table the agents work the batch on (SC-60; re-lit by day in SC-78)
	table: { day: url('table.webp'), night: url('table-night.webp') },
	dusk: { day: url('dusk.webp'), night: url('dusk.webp') }
} satisfies Record<string, Plate>;
