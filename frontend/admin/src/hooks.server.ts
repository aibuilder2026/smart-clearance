import type { Handle } from '@sveltejs/kit/hooks';
import { firstPaint } from '@smart-clearance/core/firstpaint';
import loader from '$design3/site/loader.js?raw';

// The landing page's loader (design3/site/loader.js, SC-35; SC-131) goes into the page's HTML as the first thing in
// <body>, taken from design3 as it is, never copied. It brings its own styles, so it is on screen with the page's first
// bytes: the page's stylesheets no longer hold back the first paint, and the loader lifts once they and the first
// screen are in (firstPaint).
const cover = `<script>${loader}</script>`;

export const handle: Handle = ({ event, resolve }) =>
	resolve(event, {
		transformPageChunk: ({ html }) => (event.route.id === '/' ? firstPaint(html, { cover }) : html)
	});
