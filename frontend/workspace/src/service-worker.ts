/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
// The workspace app's service worker (SC-73), as design3's app/sw.js: the app's own files cached so it opens offline,
// and the pages network first. It also shows the Notifier's pushes (backend-api, through Firebase Cloud Messaging):
// data-only messages with a title, a body and the screen they open. While the workspace is open and in front, the push is
// handed to the page instead, which already has it from its live stream. Registered only by a live build (push.svelte.ts).
import { version } from '$app/env';
import { assets, immutable } from '$app/manifest';
import { self as sw } from '$app/service-worker';

const CACHE = `sc-workspace-${version}`;
const at = (path: string) => (path.startsWith('/') ? path : '/' + path);
const OWN = new Set([...immutable, ...assets].map((x) => at(x.path)));
const SHELL = ['/', ...OWN];

sw.addEventListener('install', (e) => {
	e.waitUntil(
		caches
			.open(CACHE)
			.then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => null))))
			.then(() => sw.skipWaiting())
	);
});

sw.addEventListener('activate', (e) => {
	e.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
			.then(() => sw.clients.claim())
	);
});

sw.addEventListener('fetch', (e) => {
	const req = e.request;
	if (req.method !== 'GET') return;
	const url = new URL(req.url);
	// backend-api, Firebase and the rest are never cached: they answer live, or not at all
	if (url.origin !== location.origin) return;
	const own = OWN.has(url.pathname);
	if (own) {
		e.respondWith(caches.match(req).then((hit) => hit ?? fetch(req)));
		return;
	}
	// a page: the network, else the app's shell (every path is the same client-side app)
	if (req.mode === 'navigate')
		e.respondWith(fetch(req).catch(() => caches.match('/').then((hit) => hit ?? Response.error())));
});

type PushData = { id?: string; title?: string; body?: string; link?: string; ref?: string; workspace?: string };

sw.addEventListener('push', (e) => {
	let data: PushData = {};
	try {
		const payload = e.data?.json() ?? {};
		data = (payload.data ?? payload) as PushData;
	} catch {
		data = { body: e.data?.text() };
	}
	e.waitUntil(
		sw.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((open) => {
			const front = open.find((c) => c.visibilityState === 'visible' && c.focused);
			if (front) {
				front.postMessage({ type: 'sc-push', data });
				return;
			}
			return sw.registration.showNotification(data.title || 'Smart-Clearance', {
				body: data.body ?? '',
				tag: data.id,
				icon: '/icon-192.png',
				data
			});
		})
	);
});

sw.addEventListener('notificationclick', (e) => {
	e.notification.close();
	const link = (e.notification.data as PushData | undefined)?.link || '/';
	const target = new URL(link, location.origin);
	e.waitUntil(
		sw.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((open) => {
			const same = open.find((c) => new URL(c.url).origin === location.origin);
			if (same) return same.navigate(target.href).then((c) => c?.focus());
			return sw.clients.openWindow(target.href);
		})
	);
});
