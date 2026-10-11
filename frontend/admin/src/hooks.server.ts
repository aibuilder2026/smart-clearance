import type { Handle } from '@sveltejs/kit/hooks';
import { firstPaint } from '@smart-clearance/core/firstpaint';
import loader from '$design3/site/loader.js?raw';

// The landing page's loader (design3/site/loader.js, SC-35; SC-131) goes into the page's HTML as the first thing in
// <body>, taken from design3 as it is, never copied. It brings its own styles, so it is on screen with the page's first
// bytes: the page's stylesheets no longer hold back the first paint, and the loader lifts once they and the first
// screen are in (firstPaint).
const cover = `<script>${loader}</script>`;
// the landing page is always in day (SC-165): app.html, which every app shares, names the reader's theme before the
// first paint and gives the browser's bar a colour for each; on the landing page both are day's. The loader sets day too
const day = (html: string) =>
	html
		.replace("setAttribute('data-theme', dark ? 'dark' : 'light')", "setAttribute('data-theme', 'light')")
		.replace(/(<meta name="theme-color" content=")#070b09(" media="\(prefers-color-scheme: dark\)")/, '$1#f2f6f3$2');

export const handle: Handle = ({ event, resolve }) =>
	resolve(event, {
		transformPageChunk: ({ html }) => (event.route.id === '/' ? day(firstPaint(html, { cover })) : html)
	});
