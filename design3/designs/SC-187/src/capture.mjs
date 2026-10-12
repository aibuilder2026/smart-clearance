#!/usr/bin/env node
// SC-187: screenshots of the workspace app and the console at one stage of both batches' live journeys (the Masala
// Chips at Rakesh Traders, the Mango Drink at Lakshmi Agencies), each as the person who reads that screen, for the demo
// film. Adapted from SC-158's capture.mjs: this one drives the main checkout's live stack (backend-api on :8000, the
// workspace on :5175, the console on :5174). Signs people in the way the journey suites do (a Firebase custom token
// from backend-api/scripts/sessions.sh, exchanged with the app's own key and left where the app's Firebase SDK keeps
// it); nothing is typed and no password is handled. Uses the main checkout's Playwright (SC_REPO).
//   SC_REPO=/path/to/main node capture.mjs --stage detect [--out src/screens] [--only name] [--debug 1]
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const MAIN = process.env.SC_REPO || path.resolve(HERE, "../../../..");
const require = createRequire(path.join(MAIN, "frontend/testing/package.json"));
const { chromium } = require("@playwright/test");
const args = Object.fromEntries(process.argv.slice(2).map((a, i, all) => (a.startsWith("--") ? [a.slice(2), all[i + 1]] : [])).filter(Boolean));
const stage = args.stage;
const out = path.resolve(args.out || path.join(HERE, "screens"));
fs.mkdirSync(out, { recursive: true });

const CHIPS = "MF-2409-117";
const MANGO = "MF-2410-118";
const PAST = "MF-2407-116"; // a pilot-quarter batch destroyed at the godown (SC-139, the history)
const GANESH = "ganesh"; // Ganesh ji, Rakesh Traders' first ordering kirana
const K_HYD = "kirana-sri-lakshmi-ganapathi-kirana"; // Lakshmi Agencies' first ordering kirana
const LAKSHMI = "lakshmi-owner";
const NOBODY = "nobody"; // a fresh context with no session: the sign-in screen
const ORIGIN = { workspace: process.env.WS_ORIGIN || "http://localhost:5175", console: process.env.CONSOLE_ORIGIN || "http://localhost:5174" };
/** the browser key is restricted to the apps' own dev origins (infra/prod auth.tf) */
const KEY_REFERER = { workspace: "http://localhost:5175/", console: "http://localhost:5174/" };
const DESKTOP = { width: 1600, height: 1000, dpr: 2 };
const PHONE = { width: 390, height: 844, dpr: 3 };
const F = { full: true };

/** every capture of every stage: who, which app, the path, the name, how it is framed, and what to do on the page first.
 *  click: buttons (regex or text) pressed in turn, each followed by a settle; tab: a `.bh-tabs` tab; full: a full-page copy too */
const STAGES = {
  quiet: [
    ["neha", "console", "/", "neha-console-overview", DESKTOP, F],
    ["neha", "console", "/clients", "neha-console-clients", DESKTOP],
    ["neha", "console", "/clients/munchly/supply", "neha-console-munchly-supply", DESKTOP, F],
    ["neha", "console", "/clients/munchly/agents", "neha-console-munchly-agents", DESKTOP, F],
    ["neha", "console", "/agents", "neha-console-agents", DESKTOP],
    ["priya", "workspace", "/command", "priya-command", DESKTOP],
    [NOBODY, "workspace", "/", "signin", DESKTOP],
    [NOBODY, "workspace", "/", "signin-phone", PHONE],
  ],
  detect: [
    ["priya", "workspace", "/command", "priya-command", DESKTOP],
    ["priya", "workspace", "/command", "priya-command-phone", PHONE],
    ["priya", "workspace", `/command/${CHIPS}`, "priya-journey-chips", DESKTOP, F],
    ["priya", "workspace", `/command/${MANGO}`, "priya-journey-mango", DESKTOP],
    ["rakesh", "workspace", "/home", "rakesh-today-phone", PHONE],
    [LAKSHMI, "workspace", "/home", "lakshmi-today-phone", PHONE],
  ],
  plan: [
    ["priya", "workspace", `/route/${CHIPS}`, "priya-route-chips", DESKTOP, F],
    ["priya", "workspace", `/route/${MANGO}`, "priya-route-mango", DESKTOP, F],
    ["priya", "workspace", `/route/${CHIPS}`, "priya-approve-sheet", DESKTOP, { click: ["Review and approve"] }],
    ["priya", "workspace", `/route/${CHIPS}`, "priya-approve-sheet-phone", PHONE, { click: ["Review and approve"] }],
    ["rakesh", "workspace", "/photo", "rakesh-photos", DESKTOP, F],
    ["rakesh", "workspace", "/photo", "rakesh-photos-phone", PHONE, F],
  ],
  approve: [
    ["priya", "workspace", `/execution/${CHIPS}`, "priya-execution-chips", DESKTOP, F],
    ["priya", "workspace", `/execution/${MANGO}`, "priya-execution-mango", DESKTOP, F],
    ["rakesh", "workspace", "/home", "rakesh-today-phone", PHONE],
    [LAKSHMI, "workspace", "/home", "lakshmi-today", DESKTOP, { click: ["Record what sold"], optional: true }],
    [LAKSHMI, "workspace", "/home", "lakshmi-today-phone", PHONE],
    [GANESH, "workspace", `/offer/${CHIPS}`, "kirana-ganesh-offer-phone", PHONE],
    [K_HYD, "workspace", `/offer/${MANGO}`, "kirana-hyd-offer-phone", PHONE],
    ["agrawal", "workspace", "/market", "agrawal-market", DESKTOP],
    ["agrawal", "workspace", "/market", "agrawal-listing", DESKTOP, { click: ["View lot"], full: true }],
    ["meera", "workspace", "/pickups", "meera-pickups", DESKTOP],
    ["meera", "workspace", "/pickups", "meera-pickups-phone", PHONE],
  ],
  orders: [
    [GANESH, "workspace", `/offer/${CHIPS}`, "kirana-ganesh-offer-ordered-phone", PHONE],
    [GANESH, "workspace", "/orders", "kirana-ganesh-orders-phone", PHONE],
    [GANESH, "workspace", "/orders", "kirana-ganesh-order-page-phone", PHONE, { click: [/Masala Chips/], full: true }],
    [GANESH, "workspace", "/orders", "kirana-ganesh-invoice-phone", PHONE, { click: [/Masala Chips/, /Tax invoice/], full: true }],
    ["priya", "workspace", `/execution/${CHIPS}`, "priya-execution-chips", DESKTOP, F],
    ["priya", "workspace", `/execution/${MANGO}`, "priya-execution-mango", DESKTOP, F],
    ["rakesh", "workspace", "/orders", "rakesh-orders", DESKTOP, F],
  ],
  deal: [
    ["agrawal", "workspace", "/market", "agrawal-listing-won", DESKTOP, { click: ["View lot"], full: true }],
    ["priya", "workspace", `/execution/${CHIPS}`, "priya-execution-chips", DESKTOP, F],
    ["rakesh", "workspace", `/van/${CHIPS}`, "rakesh-deliveries", DESKTOP, F],
  ],
  donation: [
    [LAKSHMI, "workspace", "/home", "lakshmi-today", DESKTOP, F],
    [LAKSHMI, "workspace", "/home", "lakshmi-today-phone", PHONE],
    ["priya", "workspace", `/execution/${MANGO}`, "priya-execution-mango", DESKTOP, F],
    ["meera", "workspace", "/pickups", "meera-pickups", DESKTOP, F],
    ["meera", "workspace", "/pickups", "meera-pickups-phone", PHONE],
    ["meera", "workspace", `/pickups/${MANGO}`, "meera-pickup-page", DESKTOP, F],
    ["meera", "workspace", `/pickups/${MANGO}`, "meera-receipt-sheet", DESKTOP, { click: [".receipt-row"], full: true }],
  ],
  settle: [
    ["priya", "workspace", `/paperwork/${CHIPS}`, "priya-paperwork-chips", DESKTOP, F],
    ["priya", "workspace", `/paperwork/${CHIPS}`, "paper-chips-invoice-draft", DESKTOP, { click: [/Tax invoice\s*INV/], full: true }],
    ["priya", "workspace", `/paperwork/${CHIPS}`, "paper-chips-credit-note", DESKTOP, { click: [/Price-support credit note/], full: true }],
    ["priya", "workspace", `/paperwork/${CHIPS}`, "paper-chips-itc-memo", DESKTOP, { click: [/GST ITC memo/], full: true }],
    ["priya", "workspace", `/paperwork/${CHIPS}`, "paper-chips-kirana-register", DESKTOP, { click: [/Tax invoices to kiranas/], full: true }],
    ["priya", "workspace", `/paperwork/${MANGO}`, "priya-paperwork-mango", DESKTOP, F],
    ["priya", "workspace", `/paperwork/${MANGO}`, "paper-mango-credit-note", DESKTOP, { click: [/Price-support credit note/], full: true }],
    ["priya", "workspace", `/paperwork/${MANGO}`, "paper-mango-itc-memo", DESKTOP, { click: [/GST ITC memo/], full: true }],
    ["priya", "workspace", `/paperwork/${MANGO}`, "paper-mango-fssai", DESKTOP, { click: [/FSSAI/], full: true }],
    ["priya", "workspace", `/paperwork/${MANGO}`, "paper-mango-donation-receipt", DESKTOP, { click: [/Donation receipt|Donation acknowledgement/], full: true }],
    ["priya", "workspace", `/paperwork/${MANGO}`, "paper-mango-staff-receipt", DESKTOP, { click: [/Staff sale/], full: true }],
    ["rakesh", "workspace", "/home", "rakesh-today-phone", PHONE],
    ["rakesh", "workspace", `/van/${CHIPS}`, "rakesh-deliveries", DESKTOP, F],
  ],
  papers: [
    ["priya", "workspace", `/paperwork/${CHIPS}`, "priya-paperwork-chips", DESKTOP, F],
    ["priya", "workspace", `/paperwork/${CHIPS}`, "paper-chips-invoice-issued", DESKTOP, { click: [/Tax invoice\s*INV/], full: true }],
    ["rakesh", "workspace", `/batches/${CHIPS}`, "rakesh-batch-papers", DESKTOP, { tab: "Papers", full: true }],
    ["rakesh", "workspace", `/van/${CHIPS}`, "rakesh-deliveries-done", DESKTOP, F],
    ["priya", "workspace", `/execution/${CHIPS}`, "priya-execution-chips", DESKTOP, F],
    ["priya", "workspace", `/execution/${MANGO}`, "priya-execution-mango", DESKTOP, F],
  ],
  ledger: [
    ["priya", "workspace", `/execution/${CHIPS}`, "priya-execution-chips-cleared", DESKTOP, F],
    ["priya", "workspace", "/report?reading=money", "ledger-money", DESKTOP, F],
    ["priya", "workspace", "/report?reading=gst", "ledger-gst", DESKTOP, F],
    ["priya", "workspace", "/report?reading=impact", "ledger-impact", DESKTOP, F],
    ["priya", "workspace", "/command", "priya-command-cleared", DESKTOP, F],
    ["priya", "workspace", "/batches", "priya-batches", DESKTOP, F],
    ["priya", "workspace", `/report/${CHIPS}`, "batch-chips-money", DESKTOP, F],
    ["priya", "workspace", `/report/${CHIPS}`, "batch-chips-papers", DESKTOP, { tab: "Papers", full: true }],
    ["priya", "workspace", `/report/${CHIPS}`, "batch-chips-impact", DESKTOP, { tab: "Impact", full: true }],
    ["priya", "workspace", `/report/${CHIPS}?tab=record`, "batch-chips-record", DESKTOP, F],
    ["priya", "workspace", `/report/${MANGO}`, "batch-mango-money", DESKTOP, F],
    ["priya", "workspace", `/report/${MANGO}`, "batch-mango-impact", DESKTOP, { tab: "Impact", full: true }],
    ["rakesh", "workspace", "/batches", "rakesh-batches", DESKTOP, F],
    ["rakesh", "workspace", `/batches/${CHIPS}`, "rakesh-batch-chips", DESKTOP, F],
    ["rakesh", "workspace", `/batches/${CHIPS}`, "rakesh-batch-chips-money", DESKTOP, { tab: "Money", full: true }],
    ["rakesh", "workspace", `/batches/${CHIPS}`, "rakesh-batch-chips-papers", DESKTOP, { tab: "Papers", full: true }],
    ["rakesh", "workspace", `/batches/${CHIPS}`, "rakesh-batch-chips-photos", DESKTOP, { tab: "Photos", full: true }],
    ["rakesh", "workspace", "/orders", "rakesh-orders", DESKTOP, F],
    [LAKSHMI, "workspace", "/batches", "lakshmi-batches", DESKTOP, F],
    [LAKSHMI, "workspace", `/batches/${MANGO}`, "lakshmi-batch-mango-papers", DESKTOP, { tab: "Papers", full: true }],
    [LAKSHMI, "workspace", `/batches/${MANGO}`, "lakshmi-batch-mango-photos", DESKTOP, { tab: "Photos", full: true }],
    [GANESH, "workspace", "/orders", "kirana-ganesh-orders-phone", PHONE],
    ["meera", "workspace", "/pickups", "meera-pickups-phone", PHONE],
    ["neha", "console", "/", "neha-console-overview", DESKTOP, F],
    ["neha", "console", "/clients/munchly/agents", "neha-console-munchly-agents", DESKTOP, F],
  ],
  history: [
    ["priya", "workspace", `/report/${PAST}?tab=record`, "priya-past-record", DESKTOP, F],
    ["priya", "workspace", `/report/${PAST}`, "priya-past-papers", DESKTOP, { tab: "Papers", full: true }],
    ["priya", "workspace", `/report/${PAST}`, "paper-past-destruction-certificate", DESKTOP, { tab: "Papers", click: [/Destruction certificate/], full: true }],
    ["priya", "workspace", `/report/${PAST}`, "paper-past-expiry-credit-note", DESKTOP, { tab: "Papers", click: [/Expiry credit note/], full: true }],
    ["rakesh", "workspace", `/batches/${PAST}`, "rakesh-past-photos", DESKTOP, { tab: "Photos", full: true }],
    ["rakesh", "workspace", `/batches/${PAST}`, "rakesh-past-papers", DESKTOP, { tab: "Papers", full: true }],
  ],
};

const list = (STAGES[stage] || []).filter((c) => !args.only || c[3] === args.only);
if (!list.length) { console.error(`no captures for stage ${stage}`); process.exit(2); }

/** the custom tokens, minted once for everyone this stage needs */
const who = [...new Set(list.map((c) => c[0]))].filter((id) => id !== NOBODY);
const people = who.length ? JSON.parse(execFileSync(path.join(MAIN, "backend-api/scripts/sessions.sh"), who, { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"], maxBuffer: 16 << 20 })) : {};
const env = (app) => Object.fromEntries(fs.readFileSync(path.join(MAIN, `frontend/${app}/.env.local`), "utf8").split("\n").filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]));
const sessions = new Map();
async function session(app, id) {
  const key = `${app}:${id}`;
  if (sessions.has(key)) return sessions.get(key);
  const apiKey = env(app).PUBLIC_FIREBASE_API_KEY;
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`, {
    method: "POST", headers: { "Content-Type": "application/json", Referer: KEY_REFERER[app] },
    body: JSON.stringify({ token: people[id].token, returnSecureToken: true }),
  });
  if (!r.ok) throw new Error(`Firebase refused ${id}'s token on the ${app}: ${r.status}`);
  const j = await r.json();
  const s = { apiKey, idToken: j.idToken, refreshToken: j.refreshToken, expiresAt: Date.now() + Number(j.expiresIn) * 1000 };
  sessions.set(key, s);
  return s;
}
async function openAs(page, app, id, p) {
  await page.route(/googleapis\.com/, (r) => r.continue({ headers: { ...r.request().headers(), referer: KEY_REFERER[app] } }));
  if (id === NOBODY) { await page.goto(ORIGIN[app] + p, { waitUntil: "load" }); return; }
  const s = await session(app, id);
  const person = people[id];
  const key = `firebase:authUser:${s.apiKey}:[DEFAULT]`;
  const value = JSON.stringify({ uid: person.uid, email: person.email, emailVerified: false, isAnonymous: false, providerData: [],
    stsTokenManager: { refreshToken: s.refreshToken, accessToken: s.idToken, expirationTime: s.expiresAt },
    createdAt: String(Date.now()), lastLoginAt: String(Date.now()), apiKey: s.apiKey, appName: "[DEFAULT]" });
  await page.route("**/__film-session", (r) => r.fulfill({ contentType: "text/html", body: "<!doctype html><title>Signing in</title>" }));
  await page.goto(ORIGIN[app] + "/__film-session");
  await page.evaluate(async ([key, value]) => {
    for (const k of Object.keys(localStorage)) if (k.startsWith("firebase:authUser:")) localStorage.removeItem(k);
    localStorage.setItem(key, value);
    await new Promise((done) => { const r = indexedDB.deleteDatabase("firebaseLocalStorageDb"); r.onsuccess = r.onerror = r.onblocked = () => done(null); });
  }, [key, value]);
  await page.goto(ORIGIN[app] + p, { waitUntil: "load" }); // never networkidle: the live stream stays open
}

/** the page once its splash has lifted, its reads have landed, and its photos and placeholders have settled */
async function settled(page, ms = 1400) {
  await page.waitForFunction(() => !document.documentElement.classList.contains("cs-covered") && !document.querySelector(".cs-splash") && !document.querySelector(".splash, .ws-splash, #splash:not([hidden])"), null, { timeout: 45_000 }).catch(() => {});
  await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), null, { timeout: 15_000 }).catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 6000 }).catch(() => {});
  // the photos (SC-144, SC-146): every image on screen has loaded, and no skeleton is left over a photo
  await page.waitForFunction(() => [...document.images].every((i) => i.complete) && !document.querySelector(".photo .skeleton, .skeleton"), null, { timeout: 12_000 }).catch(() => {});
  await page.waitForTimeout(ms);
}

/** a control to press: a CSS selector (starts with "."), a regex on a button's name, or a button's text */
async function press(page, what, optional) {
  let target;
  if (typeof what === "string" && what.startsWith(".")) target = page.locator(what).first();
  else {
    target = page.getByRole("button", { name: what }).first();
    if (!(await target.count())) target = page.getByText(what, { exact: false }).first();
  }
  if (!(await target.count())) {
    if (optional) { console.log(`    (no control ${what}; left as is)`); return; }
    throw new Error(`no control ${what}`);
  }
  await target.scrollIntoViewIfNeeded().catch(() => {});
  await target.click();
}

/** the whole page: fullPage where the window scrolls; where the app scrolls inside a container (the console, the
 *  workspace on a phone), the viewport grows to the tallest scroller's content, up to 6000 px, and is put back after */
async function fullShot(page, vp, file) {
  const need = await page.evaluate(() => {
    const doc = document.documentElement;
    if (doc.scrollHeight > doc.clientHeight + 4) return 0; // the window scrolls: fullPage does it
    let extra = 0;
    for (const el of document.querySelectorAll("*")) {
      const cs = getComputedStyle(el);
      if (!/(auto|scroll)/.test(cs.overflowY)) continue;
      if (el.scrollHeight > el.clientHeight + 4) extra = Math.max(extra, el.scrollHeight - el.clientHeight);
    }
    return extra;
  });
  if (!need) { await page.screenshot({ path: file, fullPage: true }); return; }
  const height = Math.min(vp.height + need + 8, 6000);
  await page.setViewportSize({ width: vp.width, height });
  await page.waitForTimeout(700);
  await page.screenshot({ path: file, fullPage: true });
  await page.setViewportSize({ width: vp.width, height: vp.height });
}

const browser = await chromium.launch();
let failed = 0;
for (const [id, app, p, name, vp, opts = {}] of list) {
  const phone = vp === PHONE;
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.dpr, colorScheme: "light", isMobile: phone, hasTouch: phone, reducedMotion: "reduce", extraHTTPHeaders: { Referer: KEY_REFERER[app] }, serviceWorkers: "block" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  if (args.debug) {
    page.on("console", (m) => { const t = m.text(); if (!t.startsWith("[vite]")) console.log("  console", m.type(), t.slice(0, 300)); });
    page.on("response", (r) => { if (r.url().includes(":8000") || r.url().includes("googleapis")) console.log("  resp", r.status(), r.url().slice(0, 140)); });
    page.on("requestfailed", (r) => console.log("  failed", r.url().slice(0, 140), r.failure()?.errorText));
  }
  try {
    await openAs(page, app, id, p);
    await settled(page);
    if (opts.tab) {
      const tabs = page.locator(".bh-tabs, .pt-tabs, [role=tablist]").first();
      let t = tabs.getByRole("button", { name: opts.tab, exact: true }).first();
      if (!(await t.count())) t = page.getByRole("tab", { name: opts.tab }).first();
      if (!(await t.count())) t = tabs.getByText(opts.tab, { exact: true }).first();
      await t.click();
      await settled(page, 900);
    }
    for (const what of opts.click || []) { await press(page, what, opts.optional); await settled(page, 1100); }
    if (opts.wait) await page.waitForTimeout(opts.wait);
    const file = path.join(out, `${stage}--${name}.png`);
    await page.screenshot({ path: file });
    if (opts.full) await fullShot(page, vp, path.join(out, `${stage}--${name}--full.png`));
    console.log(`${stage} ${name}: ${page.url().replace(ORIGIN[app], "")}${errors.length ? " ERRORS " + errors.join(" | ") : ""}`);
  } catch (e) {
    failed++;
    console.log(`${stage} ${name}: FAILED ${String(e).split("\n")[0]}`);
    await page.screenshot({ path: path.join(out, `${stage}--${name}--failed.png`) }).catch(() => {});
  }
  await ctx.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
