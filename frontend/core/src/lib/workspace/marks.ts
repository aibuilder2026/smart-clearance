// The signatures and stamps the papers carry (SC-174, option A): each signatory's specimen signature in ink
// (design3/system/img/signatures/<sign>.webp) and each firm's rubber stamp or round seal (img/seals/<seal>.webp), from
// design3's signature maker, referenced where design3 keeps them (never copied). They are named for their signatories
// (rakesh, oce-w1), never for a batch or a person in the story, and the live workspace's papers are signed too, so a
// live build keeps them (unlike story-photos.ts).
const files = import.meta.glob(
	['../../../../../design3/system/img/signatures/*.webp', '../../../../../design3/system/img/seals/*.webp'],
	{ query: '?url', import: 'default', eager: true }
) as Record<string, string>;

const byPath: Record<string, string> = Object.fromEntries(
	Object.entries(files).map(([path, url]) => [path.slice(path.indexOf('/img/') + 5), url])
);

/** a signatory's specimen signature by its id ("rakesh", "oce-w1"), or undefined where none is on file */
export const signUrl = (id: string | null | undefined) => (id ? byPath[`signatures/${id}.webp`] : undefined);
/** a firm's stamp or seal by its id ("rakesh", "munchly") */
export const sealUrl = (id: string | null | undefined) => (id ? byPath[`seals/${id}.webp`] : undefined);
