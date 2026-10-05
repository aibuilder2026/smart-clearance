import type { Handle } from '@sveltejs/kit/hooks';
import loader from '$design3/site/loader.js?raw';

// The landing page's loader (design3/site/loader.js, SC-35) goes into the page's HTML as the first thing in <body>, so
// it is on screen from the first paint, before the app's scripts load. It is taken from design3 as it is, never copied;
// its styles are in the landing page's stylesheet (site.css).
const script = `<script>${loader}</script>`;

export const handle: Handle = ({ event, resolve }) =>
	resolve(event, {
		transformPageChunk: ({ html }) =>
			event.route.id === '/' ? html.replace(/<body[^>]*>/, (body) => body + script) : html
	});
