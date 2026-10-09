import type { Handle } from '@sveltejs/kit/hooks';
import { PUBLIC_API_BASE } from '$app/env/public';
import { firstPaint } from '@smart-clearance/core/firstpaint';
import splash from '$design3/console/splash.js?raw';

// The console's splash (design3/console/splash.js, SC-51; SC-131) goes into the page's HTML as the first thing in
// <body>, taken from design3 as it is, never copied. It brings its own styles, so it is on screen with the page's first
// bytes: the app's stylesheets no longer hold back the first paint, and the connection to backend-api opens while the
// app's code is still arriving (firstPaint).
const cover = `<script>${splash}</script>`;

export const handle: Handle = ({ event, resolve }) =>
	resolve(event, { transformPageChunk: ({ html }) => firstPaint(html, { cover, preconnect: PUBLIC_API_BASE }) });
