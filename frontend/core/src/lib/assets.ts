// Design system v3's imagery, referenced where design3 keeps it (never copied): the 3D renders, the portraits, the
// destruction's evidence photos and the app icon. Vite hashes each file into the build; a name that isn't here gets no URL, and the components fall back.
const files = import.meta.glob(
	[
		'../../../../design3/system/img/*.{webp,svg}',
		'../../../../design3/system/img/people/*.webp',
		// the destruction's evidence the stub and the history show (SC-139): before at the godown, after at the landfill
		'../../../../design3/system/img/evidence/*.webp'
	],
	{
		query: '?url',
		import: 'default',
		eager: true
	}
) as Record<string, string>;

const byName: Record<string, string> = {};
for (const [path, url] of Object.entries(files)) byName[path.slice(path.indexOf('/img/') + 5)] = url;

/** The URL of a design-system image by its path under design3/system/img ("pack-chips.webp", "people/p-priya.webp").
 *  Data written for the prototype points at "system/img/…" (its SC3_IMG prefix); that prefix is accepted too. */
export function imgUrl(name: string): string | undefined {
	if (/^(https?:|data:|blob:|\/)/.test(name)) return name;
	return byName[name.replace(/^(\.\.\/)*(system\/)?img\//, '').replace(/^sc3img:\/?/, '')];
}

export const ICON_SVG = byName['icon.svg'];
