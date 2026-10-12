#!/usr/bin/env node
// SC-187 cut 2: the working app recorded for the film, shot by shot (tour.json). Each shot signs a person in (the live
// stack, as capture.mjs does, or the stub at a journey stage, as record.mjs does), opens a screen at desktop
// (1600×1000 @2×) or phone (390×844 @3×) size, waits for it to settle, then plays its actions with a visible pointer that
// glides to what it reads or presses (the journey suites' cursor): scrolls as a person reads, hovers, opens tabs and
// sheets, types. The screen is streamed through CDP (Page.startScreencast, JPEG at device pixels) and written at a
// steady 25 fps into ffmpeg, so a recording is sharp at 2× and plays smoothly however the page drew.
//   SC_REPO=/path/to/main node tour.mjs --stage detect [--only name] [--out tour]
// The stub shots (stub: true in tour.json) need the stub build served (record.mjs: --stub-origin http://localhost:4197).
import { createRequire } from "node:module";
import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const WT = path.resolve(HERE, "../../../..");
const MAIN = process.env.SC_REPO || WT;
const require = createRequire(path.join(MAIN, "frontend/testing/package.json"));
const { chromium } = require("@playwright/test");
const args = Object.fromEntries(process.argv.slice(2).map((a, i, all) => (a.startsWith("--") ? [a.slice(2), all[i + 1] ?? true] : [])).filter(Boolean));
const stage = args.stage;
const out = path.resolve(args.out || path.join(HERE, "tour"));
fs.mkdirSync(out, { recursive: true });
const ORIGIN = { workspace: process.env.WS_ORIGIN || "http://localhost:5175", console: process.env.CONSOLE_ORIGIN || "http://localhost:5174", stub: args["stub-origin"] || process.env.STUB_ORIGIN || "http://localhost:4197", site: process.env.SITE_ORIGIN || "https://smartclearance.web.app", demo: process.env.DEMO_ORIGIN || "https://smartclearance-demo.web.app" };
const KEY_REFERER = { workspace: "http://localhost:5175/", console: "http://localhost:5174/" };
const SIZE = { desktop: { viewport: { width: 1600, height: 1000 }, dpr: 2, max: { width: 3200, height: 2000 } }, phone: { viewport: { width: 390, height: 844 }, dpr: 3, max: { width: 1170, height: 2532 } }, tablet: { viewport: { width: 1180, height: 820 }, dpr: 2, max: { width: 2360, height: 1640 } } };
const FPS = 25;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const TOUR = JSON.parse(fs.readFileSync(path.join(HERE, "tour.json"), "utf8"));
const shots = (TOUR[stage] || []).filter((s) => !args.only || s.name === args.only);
if (!shots.length) { console.error(`no shots for stage ${stage}`); process.exit(1); }

// --- the pointer: the journey suites' cursor, gliding, with a ripple on a press ---------------------------------
const GLIDE = 520;
const CURSOR = `(() => {
  if (window.__e2eCursor) return; window.__e2eCursor = true;
  const KEY = 'e2e-cursor';
  const at = () => { try { return JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch { return null; } };
  const make = () => {
    let c = document.getElementById('e2e-cursor'); if (c) return c;
    c = document.createElement('div'); c.id = 'e2e-cursor'; c.setAttribute('aria-hidden', 'true');
    c.innerHTML = '<svg width="30" height="30" viewBox="0 0 26 26"><path d="M4 2.5v18.2l5-4.5 3.3 7.3 3.2-1.4-3.2-7.2 6.9-.3z" fill="#141a17" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    c.style.cssText = 'position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;transition:transform ${GLIDE - 60}ms cubic-bezier(.25,.7,.2,1);filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))';
    const p = at() || [innerWidth * 0.62, innerHeight * 0.7];
    c.style.transform = 'translate(' + p[0] + 'px,' + p[1] + 'px)';
    document.documentElement.appendChild(c); return c;
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', make); else make();
  addEventListener('mousemove', (e) => { const c = make(); c.style.transitionDuration = e.buttons & 1 ? '0ms' : '${GLIDE - 60}ms'; c.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)'; try { sessionStorage.setItem(KEY, JSON.stringify([e.clientX, e.clientY])); } catch {} }, true);
  addEventListener('mousedown', (e) => {
    if (e.target instanceof Element && e.target.closest('.signpad')) return;
    const r = document.createElement('div'); r.setAttribute('aria-hidden', 'true');
    r.style.cssText = 'position:fixed;left:' + (e.clientX - 22) + 'px;top:' + (e.clientY - 22) + 'px;width:44px;height:44px;border-radius:50%;border:3px solid #f2b437;background:rgba(242,180,55,.28);z-index:2147483646;pointer-events:none;transform:scale(.35);opacity:1;transition:transform .5s ease-out,opacity .6s ease-out';
    document.documentElement.appendChild(r);
    requestAnimationFrame(() => requestAnimationFrame(() => { r.style.transform = 'scale(1.5)'; r.style.opacity = '0'; }));
    setTimeout(() => r.remove(), 800);
  }, true);
})();`;

// --- signing in: the live stack (capture.mjs) or the stub at a stage (record.mjs) ---------------------------------
const liveWho = [...new Set(shots.filter((s) => !s.stub && s.who && s.app !== "site" && s.app !== "demo").map((s) => s.who))];
const people = liveWho.length ? JSON.parse(execFileSync(path.join(MAIN, "backend-api/scripts/sessions.sh"), liveWho, { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"], maxBuffer: 16 << 20 })) : {};
const env = (app) => Object.fromEntries(fs.readFileSync(path.join(MAIN, `frontend/${app}/.env.local`), "utf8").split("\n").filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]));
const sessions = new Map();
async function session(app, id) {
  const key = `${app}:${id}`;
  if (sessions.has(key)) return sessions.get(key);
  const apiKey = env(app).PUBLIC_FIREBASE_API_KEY;
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`, { method: "POST", headers: { "Content-Type": "application/json", Referer: KEY_REFERER[app] }, body: JSON.stringify({ token: people[id].token, returnSecureToken: true }) });
  if (!r.ok) throw new Error(`Firebase refused ${id}'s token on the ${app}: ${r.status}`);
  const j = await r.json();
  const s = { apiKey, idToken: j.idToken, refreshToken: j.refreshToken, expiresAt: Date.now() + Number(j.expiresIn) * 1000 };
  sessions.set(key, s);
  return s;
}
async function openLive(page, app, id, p) {
  await page.route(/googleapis\.com/, (r) => r.continue({ headers: { ...r.request().headers(), referer: KEY_REFERER[app] } }));
  if (!id) { await page.goto(ORIGIN[app] + p, { waitUntil: "load" }); return; }
  const s = await session(app, id);
  const person = people[id];
  const key = `firebase:authUser:${s.apiKey}:[DEFAULT]`;
  const value = JSON.stringify({ uid: person.uid, email: person.email, emailVerified: false, isAnonymous: false, providerData: [], stsTokenManager: { refreshToken: s.refreshToken, accessToken: s.idToken, expirationTime: s.expiresAt }, createdAt: String(Date.now()), lastLoginAt: String(Date.now()), apiKey: s.apiKey, appName: "[DEFAULT]" });
  await page.route("**/__film-session", (r) => r.fulfill({ contentType: "text/html", body: "<!doctype html><title>Signing in</title>" }));
  await page.goto(ORIGIN[app] + "/__film-session");
  await page.evaluate(async ([key, value]) => {
    for (const k of Object.keys(localStorage)) if (k.startsWith("firebase:authUser:")) localStorage.removeItem(k);
    localStorage.setItem(key, value);
    await new Promise((done) => { const r = indexedDB.deleteDatabase("firebaseLocalStorageDb"); r.onsuccess = r.onerror = r.onblocked = () => done(null); });
  }, [key, value]);
  await page.goto(ORIGIN[app] + p, { waitUntil: "load" });
}
const CORE = ["core/money.js", "core/papers.js", "core/data.js", "core/store.js", "core/flow.js"];
function storeAt(stage, after = [], scenario = "chips") {
  const window = { SC3_IMG: "sc3img:/" };
  const sandbox = vm.createContext({ window, console, Date, Intl, Math, JSON, btoa, unescape, encodeURIComponent });
  for (const p of CORE) vm.runInContext(fs.readFileSync(path.join(WT, "design3", p), "utf8"), sandbox);
  if (scenario !== "chips") window.SC3_FLOW.useScenario(scenario);
  window.SC3_FLOW.fastForward(stage);
  for (const a of after) window.SC3_FLOW[a.fn](...(a.args || []));
  return JSON.stringify(window.SC3_STORE.get());
}
async function openStub(page, who, p, { stage = 9, after = [], scenario = "chips" } = {}) {
  await page.addInitScript(([store, uid]) => {
    try { if (sessionStorage.getItem("sc-film")) return; sessionStorage.setItem("sc-film", "1"); localStorage.setItem("sc3-store", store); localStorage.setItem("sc3-session", JSON.stringify({ uid, at: 1 })); sessionStorage.setItem("sc3-app-splash", "1"); } catch {}
  }, [storeAt(stage, after, scenario), who]);
  await page.goto(ORIGIN.stub + p);
  await page.waitForSelector(".app[data-mounted] .largetitle h1, .app[data-mounted] .bhead h1, .app[data-mounted] #main", { timeout: 20_000 }).catch(() => {});
}
async function settled(page, ms = 1200) {
  await page.waitForFunction(() => !document.documentElement.classList.contains("cs-covered") && !document.querySelector(".cs-splash") && !document.querySelector(".splash, .ws-splash, #splash:not([hidden])"), null, { timeout: 45_000 }).catch(() => {});
  await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), null, { timeout: 15_000 }).catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 6000 }).catch(() => {});
  await page.waitForFunction(() => [...document.images].every((i) => i.complete) && !document.querySelector(".photo .skeleton, .skeleton"), null, { timeout: 12_000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(ms);
}

// --- the actions ----------------------------------------------------------------------------------------------------
let mouseAt = [900, 700];
async function glide(page, x, y, ms = 700) {
  const steps = 16;
  for (let i = 1; i <= steps; i++) { const t = i / steps, e = 1 - Math.pow(1 - t, 3); await page.mouse.move(mouseAt[0] + (x - mouseAt[0]) * e, mouseAt[1] + (y - mouseAt[1]) * e); await sleep(ms / steps); }
  mouseAt = [x, y];
}
function locate(page, what) {
  if (what.startsWith("role=")) { const [role, name] = what.slice(5).split("|"); return page.getByRole(role, { name: new RegExp(name, "i") }).first(); }
  if (what.startsWith("text=")) return page.getByText(new RegExp(what.slice(5), "i")).first();
  return page.locator(what).first();
}
/** the page scrolls as a person reads: a smooth travel of `by` pixels (or to an element), in small wheel steps */
/** an element's box once it has stopped moving (a sheet sliding in, a list settling): two readings 120 ms apart agree */
async function box(loc, timeout = 2500) {
  let b = await loc.boundingBox({ timeout }).catch(() => null);
  for (let k = 0; b && k < 12; k++) {
    await sleep(120);
    const n = await loc.boundingBox({ timeout: 1500 }).catch(() => null);
    if (!n) return b;
    const same = Math.abs(n.x - b.x) < 0.5 && Math.abs(n.y - b.y) < 0.5 && Math.abs(n.width - b.width) < 0.5;
    b = n;
    if (same) break;
  }
  return b;
}
async function scroll(page, a) {
  let dy = a.by ?? 0;
  if (a.to) {
    const b = await box(locate(page, a.to), a.timeout);
    if (b) dy = b.y - (a.offset ?? 140); else { console.log(`    (no ${a.to} to scroll to)`); return; }
  }
  const ms = a.ms ?? Math.min(2600, Math.max(900, Math.abs(dy) * 2.2));
  const steps = Math.max(8, Math.round(ms / 40));
  let done = 0;
  for (let i = 1; i <= steps; i++) { const t = i / steps, e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; const target = Math.round(dy * e); await page.mouse.wheel(0, target - done); done = target; await sleep(ms / steps); }
}
async function inView(page, loc, b, a) {
  const vh = page.viewportSize().height;
  if (b.y >= 72 && b.y + b.height <= vh - 32) return b;
  await scroll(page, { by: b.y + b.height / 2 - vh * (a.frac ?? 0.45), ms: a.scrollMs });
  await sleep(250);
  return (await box(loc, 4000)) || b;
}
/** the certificate signed in place (SC-183): press the next "Sign here", draw a signature on the pad with the mouse, press
 *  "Sign as …"; `times` places in turn (default 1) */
async function sign(page, a) {
  for (let i = 0; i < (a.times ?? 1); i++) {
    const here = page.locator(a.at || ".dz-here").first();
    let b = await box(here, 4000);
    if (!b) { console.log("    (no Sign here left)"); return; }
    b = await inView(page, here, b, a);
    await glide(page, b.x + b.width / 2, b.y + b.height / 2); await sleep(300); await page.mouse.down(); await sleep(90); await page.mouse.up();
    const pad = page.getByRole("dialog").locator(".signpad svg").first();
    await pad.waitFor({ state: "visible", timeout: 6000 }).catch(() => {});
    await sleep(600);
    const pb = await box(pad, 6000);
    if (!pb) throw new Error("no signature pad opened");
    console.log(`    pad at ${Math.round(pb.x)},${Math.round(pb.y)} ${Math.round(pb.width)}x${Math.round(pb.height)}`);
    // a tall first loop, a run of humps, and a flourish underneath, each stroke a curve of many points
    const strokes = [
      (t) => [0.12 + 0.18 * t, 0.66 - 0.55 * Math.sin(Math.PI * t) + 0.1 * t],
      (t) => [0.28 + 0.44 * t, 0.58 - 0.2 * Math.abs(Math.sin(Math.PI * 3.5 * t)) + 0.08 * Math.sin(Math.PI * t)],
      (t) => [0.16 + 0.6 * t, 0.84 - 0.07 * Math.sin(Math.PI * 2 * t)],
    ];
    for (const f of strokes) {
      const pts = Array.from({ length: 22 }, (_, k) => f(k / 21)).map(([u, v]) => [pb.x + u * pb.width, pb.y + v * pb.height]);
      await glide(page, pts[0][0], pts[0][1], 260); await sleep(60);
      await page.mouse.down();
      for (const [x, y] of pts.slice(1)) { await page.mouse.move(x, y, { steps: 3 }); await sleep(14); }
      await page.mouse.up(); mouseAt = pts[pts.length - 1]; await sleep(160);
    }
    await sleep(700);
    const as = page.getByRole("dialog").getByRole("button", { name: /^Sign as / });
    const ab = await box(as, 4000);
    if (ab) { await glide(page, ab.x + ab.width / 2, ab.y + ab.height / 2); await sleep(300); await page.mouse.down(); await sleep(90); await page.mouse.up(); }
    await page.getByRole("dialog").waitFor({ state: "hidden", timeout: 8000 }).catch(() => {});
    await sleep(a.ms ?? 900);
  }
}
async function act(page, a) {
  switch (a.do) {
    case "wait": return sleep(a.ms ?? 800);
    case "scroll": return scroll(page, a);
    case "move": { const b = a.at ? await box(locate(page, a.at), a.timeout) : null; if (b) await glide(page, b.x + b.width * (a.fx ?? 0.5), b.y + b.height * (a.fy ?? 0.5), a.ms ?? 700); else if (a.x != null) await glide(page, a.x, a.y, a.ms ?? 700); return; }
    case "hover": { const loc = locate(page, a.at); let b = await box(loc, a.timeout); if (!b) { console.log(`    (no ${a.at} to hover)`); return; } b = await inView(page, loc, b, a); await glide(page, b.x + b.width * (a.fx ?? 0.5), b.y + b.height * (a.fy ?? 0.5)); await loc.hover({ timeout: 2000 }).catch(() => {}); return sleep(a.ms ?? 900); }
    case "press": { const loc = locate(page, a.at); let b = await box(loc, a.timeout ?? 8000); if (!b) { if (a.optional) { console.log(`    (no ${a.at}; skipped)`); return; } throw new Error(`no control ${a.at}`); } b = await inView(page, loc, b, a); await glide(page, b.x + b.width * (a.fx ?? 0.5), b.y + b.height * (a.fy ?? 0.5)); await sleep(a.rest ?? 350); await page.mouse.down(); await sleep(90); await page.mouse.up(); return sleep(a.ms ?? 900); }
    case "sign": return sign(page, a);
    case "type": { const loc = locate(page, a.at); await loc.click(); for (const ch of a.text) { await page.keyboard.type(ch); await sleep(45 + Math.random() * 60); } return sleep(a.ms ?? 500); }
    case "key": await page.keyboard.press(a.key); return sleep(a.ms ?? 500);
    case "settle": return settled(page, a.ms ?? 800);
    default: throw new Error(`unknown action ${a.do}`);
  }
}

// --- recording: the screencast's newest frame written at a steady rate ------------------------------------------
async function recordShot(browser, shot) {
  const size = SIZE[shot.size || "desktop"];
  const ctx = await browser.newContext({ viewport: size.viewport, deviceScaleFactor: size.dpr, isMobile: shot.size === "phone", hasTouch: shot.size === "phone", colorScheme: "light", serviceWorkers: "block" });
  ctx.setDefaultTimeout(20_000);
  await ctx.addInitScript(CURSOR);
  if (shot.stub) await ctx.addInitScript(() => { const st = window.setTimeout; window.setTimeout = (fn, ms, ...a) => (ms === 12000 ? 0 : st(fn, ms, ...a)); });
  const page = await ctx.newPage();
  const app = shot.app || "workspace";
  if (shot.stub) await openStub(page, shot.who, shot.path, shot.stubAt || {});
  else if (app === "site" || app === "demo") await page.goto(ORIGIN[app] + (shot.path || "/"), { waitUntil: "load" });
  else await openLive(page, app, shot.who, shot.path);
  await settled(page, shot.settle ?? 1200);
  for (const a of shot.before || []) await act(page, a);
  mouseAt = [size.viewport.width * 0.62, size.viewport.height * 0.7];
  await page.mouse.move(mouseAt[0], mouseAt[1]);
  // the recording
  const file = path.join(out, `${stage}--${shot.name}.mp4`);
  const ff = spawn("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-f", "image2pipe", "-vcodec", "mjpeg", "-framerate", String(FPS), "-i", "-", "-c:v", "libx264", "-preset", "fast", "-crf", "17", "-pix_fmt", "yuv420p", "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2", "-r", String(FPS), file], { stdio: ["pipe", "inherit", "inherit"] });
  const cdp = await ctx.newCDPSession(page);
  let latest = null;
  cdp.on("Page.screencastFrame", (f) => { latest = Buffer.from(f.data, "base64"); cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {}); });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 90, maxWidth: size.max.width, maxHeight: size.max.height, everyNthFrame: 1 });
  const t0 = Date.now();
  while (!latest && Date.now() - t0 < 4000) await sleep(40);
  if (!latest) { await page.mouse.move(mouseAt[0] + 1, mouseAt[1]); while (!latest && Date.now() - t0 < 8000) await sleep(40); }
  let frames = 0, stop = false;
  const writer = (async () => { const start = Date.now(); while (!stop) { if (latest) { ff.stdin.write(latest); frames++; } const due = start + (frames * 1000) / FPS; const wait = due - Date.now(); await sleep(wait > 0 ? wait : 1); } })();
  let failed = null;
  try {
    await sleep(shot.lead ?? 700);
    for (const a of shot.actions || []) await act(page, a);
    await sleep(shot.tail ?? 1200);
  } catch (e) { failed = e; }
  stop = true;
  await writer;
  await cdp.send("Page.stopScreencast").catch(() => {});
  await new Promise((r) => { ff.stdin.end(); ff.on("close", r); });
  await ctx.close();
  if (failed) { fs.renameSync(file, file.replace(/\.mp4$/, "--failed.mp4")); throw failed; }
  console.log(`${stage}--${shot.name}: ${(frames / FPS).toFixed(1)} s, ${size.max.width}x${size.max.height}`);
}

const browser = await chromium.launch({ headless: true, args: ["--disable-backgrounding-occluded-windows", "--disable-renderer-backgrounding", "--disable-background-timer-throttling"] });
for (const shot of shots) {
  try { await recordShot(browser, shot); } catch (e) { console.log(`${stage}--${shot.name}: FAILED ${e.message.split("\n")[0]}`); }
}
await browser.close();
