import type { Handle } from '@sveltejs/kit/hooks';
import { PUBLIC_API_BASE } from '$app/env/public';
import { firstPaint } from '@smart-clearance/core/firstpaint';
import splash from '$design3/console/splash.js?raw';

// The live workspace's first load (SC-73, SC-68 option B; SC-131): the console's splash (design3/console/splash.js)
// goes into the page's HTML as the first thing in <body>, taken from design3 as it is, never copied, in the workspace's
// own words and look (its `ws` class). It brings its own styles, so it is on screen with the page's first bytes: the
// app's stylesheets no longer hold back the first paint, and the connection to backend-api opens while the app's code
// is still arriving (firstPaint). The workspace's name and mark, and who is signing in, arrive once the backend has
// answered (WorkspaceApp). A build on the stub has its own splash, and none of this.
const fail = {
	title: 'The workspace did not answer',
	text: 'Nothing has come back from the workspace for {silent} s. Check the connection, then try again.',
	offline: { title: 'No connection', text: 'This device has gone offline. Check the connection, then try again.' },
	broken: {
		title: 'The workspace did not load',
		text: 'Part of it did not arrive. Check the connection, then try again.'
	}
};
// the workspace's words for the splash's three waits, each phase's line; its reads are named as the app makes them
const setup = `window.SC3_SPLASH_SETUP={cls:"ws",brand:"",words:{boot:{title:"Opening your workspace",line:{code:"Loading your workspace",platform:"Connecting to your workspace",wake:"Waking the workspace up…",open:"Opening"},say:"Opening the workspace."},enter:{title:function(w){return w?"Welcome, "+w:"Welcome"},line:{platform:"Opening your workspace"},say:function(w){return "Signed in. Opening the workspace"+(w?" for "+w:"")+"."}},leave:{line:{platform:""}},fail:${JSON.stringify(fail)}},reads:{boot:[{id:"workspace",label:"Your workspace"},{id:"session",label:"Signed in"}]}};`;
// (the closing tag is put together, so this file reads as a script wherever it is parsed as one)
const close = ['</', 'script>'].join('');
const cover = `<script>${setup}${splash}${close}`;

export const handle: Handle = ({ event, resolve }) =>
	PUBLIC_API_BASE
		? resolve(event, { transformPageChunk: ({ html }) => firstPaint(html, { cover, preconnect: PUBLIC_API_BASE }) })
		: resolve(event);
