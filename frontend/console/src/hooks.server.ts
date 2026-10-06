import type { Handle } from '@sveltejs/kit/hooks';
import styles from '$design3/console/console.css?raw';
import splash from '$design3/console/splash.js?raw';

// The console's splash (design3/console/splash.js, SC-51) goes into the page's HTML as the first thing in <body>, so
// the first load is covered from the first paint, before the app's scripts load. It is taken from design3 as it is,
// never copied, with its block of console.css inlined beside it (the rest of its styles arrive with the app's CSS);
// until the app's stylesheet is in, a few lines give the cover its ground and keep its status line for screen readers.
const block = styles.slice(styles.indexOf('/* @splash'), styles.indexOf('/* @splash-end */'));
const first =
	'.cs-splash{background:#f2f6f3}[data-theme="dark"] .cs-splash{background:#070b09}' +
	'.cs-splash .sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}';
const inline = `<style>${first}${block}</style><script>${splash}</script>`;

export const handle: Handle = ({ event, resolve }) =>
	resolve(event, { transformPageChunk: ({ html }) => html.replace(/<body[^>]*>/, (body) => body + inline) });
