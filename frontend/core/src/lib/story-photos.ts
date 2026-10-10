// The photos the prototype's story and its history show as sent (never copied): the destruction's evidence (SC-139),
// before at the godown and after at the landfill, and the label photos the distributors sent (SC-142). Each is named
// for its batch. A live build reads every photo from backend-api's short-lived links, so the workspace app's live build
// replaces this module with an empty one (frontend/workspace/vite.config.ts), and none of the story's batches is in it.
const files = import.meta.glob(
	['../../../../design3/system/img/evidence/*.webp', '../../../../design3/system/img/labels/*.webp'],
	{ query: '?url', import: 'default', eager: true }
) as Record<string, string>;

/** each photo's URL by its path under design3/system/img ("labels/MF-2409-117.webp") */
export const storyPhotos: Record<string, string> = Object.fromEntries(
	Object.entries(files).map(([path, url]) => [path.slice(path.indexOf('/img/') + 5), url])
);
