// The landing page's plates, referenced where design3 keeps them (design3/site/assets/plates) and hashed into the
// build: only the ones the page shows, so no other plate is copied into it. Three are composed twice, by day and by
// night (never inverted); the dusk band is one in both themes.
const files = import.meta.glob(
	'$design3/site/assets/plates/{business,business-night,table,table-night,islands,islands-night,dusk}.webp',
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
	// the first viewport's town, by day and by night: the film's poster, and what a reader who asks for less motion
	// sees in its place (SC-60)
	town: { day: url('business.webp'), night: url('business-night.webp') },
	// the table the agents work the batch on (SC-60)
	table: { day: url('table.webp'), night: url('table-night.webp') },
	islands: { day: url('islands.webp'), night: url('islands-night.webp') },
	dusk: { day: url('dusk.webp'), night: url('dusk.webp') }
} satisfies Record<string, Plate>;
