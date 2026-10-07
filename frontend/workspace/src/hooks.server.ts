import type { Handle } from '@sveltejs/kit/hooks';
import { PUBLIC_API_BASE } from '$app/env/public';
import styles from '$design3/screens/screens.css?raw';
import splash from '$design3/console/splash.js?raw';

// The live workspace's first load (SC-73, SC-68 option B): the console's splash (design3/console/splash.js, SC-51) goes
// into the page's HTML as the first thing in <body>, so the first load is covered from the first paint, before the
// app's scripts load. It is taken from design3 as it is, never copied, in the workspace's own words and look (its block
// of screens.css, between the @splash-ws markers, inlined beside it); until the app's stylesheet is in, a few lines give
// the cover its ground and keep its status line for screen readers. The workspace's name and mark, and who is signing in,
// arrive once the backend has answered (WorkspaceApp). A build on the stub has its own splash, and none of this.
const block = styles.slice(styles.indexOf('/* @splash-ws'), styles.indexOf('/* @splash-ws-end */'));
const first =
	'.cs-splash.ws{position:fixed;inset:0;z-index:80;background:#f2f6f3}[data-theme="dark"] .cs-splash.ws{background:#070b09}' +
	'.cs-splash .sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}';
// the workspace's words for the splash's three waits; its reads are named as the app makes them
const setup = `window.SC3_SPLASH_SETUP={cls:"ws",brand:"",words:{boot:{title:"Opening your workspace",sub:"",late:"Waking the workspace up…",say:"Opening the workspace."},enter:{title:function(w){return w?"Welcome, "+w:"Welcome"},sub:"",say:function(w){return "Signed in. Opening the workspace"+(w?" for "+w:"")+"."}},leave:{sub:""},fail:{title:"The workspace did not answer",text:"It is taking too long. Check the connection, then try again."}},reads:{boot:[{id:"workspace",label:"Your workspace"},{id:"session",label:"Signed in"}]}};`;
// (the closing tag is put together, so this file reads as a script wherever it is parsed as one)
const close = ['</', 'script>'].join('');
const inline = `<style>${first}${block}</style><script>${setup}${splash}${close}`;

export const handle: Handle = ({ event, resolve }) =>
	PUBLIC_API_BASE
		? resolve(event, { transformPageChunk: ({ html }) => html.replace(/<body[^>]*>/, (body) => body + inline) })
		: resolve(event);
