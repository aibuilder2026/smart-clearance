/* Smart-Clearance v3 · offline shell. Pages and our own scripts: network first, cache as fallback.
   Pinned CDN libraries, fonts and images: cache first. Bump VERSION to retire old caches. */
const VERSION = "sc3-v2";
const SHELL = ["./", "./Smart-Clearance%20app%20v3.html", "./app.css", "./app.js", "./manifest.webmanifest",
  "./system/tokens.css", "./system/base.css", "./system/components.css", "./system/icons.js", "./system/kit.js", "./system/world.js", "./system/product.js", "./system/img/icon.svg",
  "./screens/screens.css", "./screens/common.js", "./screens/brand.js", "./screens/trade.js", "./screens/finance.js", "./screens/admin.js", "./screens/auth.js", "./screens/roles.js",
  "./core/money.js", "./core/data.js", "./core/store.js", "./core/flow.js", "./icons/icon-192.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(VERSION).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => null)))).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  const pinned = /unpkg\.com|fonts\.(googleapis|gstatic)\.com|raw\.githubusercontent\.com/.test(url.host) || /\.(webp|png|svg|woff2?)$/.test(url.pathname);
  if (pinned) { e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => { if (res.ok || res.type === "opaque") { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return res; }))); return; }
  if (url.origin !== location.origin) return;
  e.respondWith(fetch(req).then(res => { if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return res; }).catch(() => caches.match(req).then(hit => hit || caches.match("./Smart-Clearance%20app%20v3.html"))));
});
