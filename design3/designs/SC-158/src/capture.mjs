#!/usr/bin/env node
// SC-158: screenshots of the workspace app and the console at one stage of the Mango Drink's live journey, each as the
// person who reads that screen, for the demo film. Signs people in the way the journey suites do (a Firebase custom
// token from backend-api/scripts/sessions.sh, exchanged with the app's own key and left where the app's Firebase SDK
// keeps it); nothing is typed and no password is handled. Uses the main checkout's Playwright and dev servers.
//   node capture.mjs --stage detect [--out src/screens] [--only name]
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const MAIN = process.env.SC_REPO || path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../../..");
const require = createRequire(path.join(MAIN, "frontend/testing/package.json"));
const { chromium } = require("@playwright/test");
const args = Object.fromEntries(process.argv.slice(2).map((a, i, all) => (a.startsWith("--") ? [a.slice(2), all[i + 1]] : [])).filter(Boolean));
const stage = args.stage;
const out = path.resolve(args.out || path.join(path.dirname(new URL(import.meta.url).pathname), "screens"));
fs.mkdirSync(out, { recursive: true });

const HERO = "MF-2410-118";
const K0 = "kirana-sri-lakshmi-ganapathi-kirana";
const ORIGIN = { workspace: process.env.WS_ORIGIN || "http://localhost:5185", console: process.env.CONSOLE_ORIGIN || "http://localhost:5184" };
/** the browser key is restricted to the apps' own dev origins (infra/prod auth.tf), so Firebase is called with those
 *  as the referrer, whichever port this checkout's dev servers run on */
const KEY_REFERER = { workspace: "http://localhost:5175/", console: "http://localhost:5174/" };
const DESKTOP = { width: 1600, height: 1000, dpr: 1 };
const PHONE = { width: 390, height: 844, dpr: 2 };

/** every capture of every stage: who, which app, the path, how it is framed, and what to do on the page first */
const STAGES = {
  quiet: [
    ["priya", "workspace", "/command", "priya-command-quiet", DESKTOP],
    ["priya", "workspace", "/batches", "priya-batches-quiet", DESKTOP],
  ],
  detect: [
    ["priya", "workspace", "/command", "priya-command-at-risk", DESKTOP],
    ["priya", "workspace", "/command", "priya-command-at-risk-phone", PHONE],
    ["priya", "workspace", `/command/${HERO}`, "priya-journey-flagged", DESKTOP],
    ["lakshmi-owner", "workspace", "/home", "lakshmi-today-photo-asked", DESKTOP],
    ["lakshmi-owner", "workspace", "/home", "lakshmi-today-photo-asked-phone", PHONE],
  ],
  verified: [
    ["priya", "workspace", `/route/${HERO}`, "priya-route-vision", DESKTOP],
    ["lakshmi-owner", "workspace", "/photo", "lakshmi-photos", DESKTOP],
  ],
  planned: [
    ["priya", "workspace", `/route/${HERO}`, "priya-route-plan", DESKTOP, { full: true }],
    ["priya", "workspace", `/route/${HERO}`, "priya-route-plan-phone", PHONE, { full: true }],
    ["priya", "workspace", `/command/${HERO}`, "priya-journey-planned", DESKTOP],
    ["priya", "workspace", "/command", "priya-command-waiting", DESKTOP],
  ],
  approved: [
    ["priya", "workspace", `/execution/${HERO}`, "priya-execution-sent", DESKTOP, { full: true }],
    ["lakshmi-owner", "workspace", "/home", "lakshmi-today-approved", DESKTOP],
    ["lakshmi-owner", "workspace", "/home", "lakshmi-today-approved-phone", PHONE],
    [K0, "workspace", `/offer/${HERO}`, "kirana-offer", DESKTOP],
    [K0, "workspace", `/offer/${HERO}`, "kirana-offer-phone", PHONE],
    ["meera", "workspace", "/pickups", "meera-pickup-request", DESKTOP],
    ["meera", "workspace", "/pickups", "meera-pickup-request-phone", PHONE],
  ],
  ordered: [
    [K0, "workspace", `/offer/${HERO}`, "kirana-offer-ordered-phone", PHONE],
    [K0, "workspace", "/orders", "kirana-orders", DESKTOP],
    [K0, "workspace", "/orders", "kirana-orders-phone", PHONE],
    ["priya", "workspace", `/execution/${HERO}`, "priya-execution-ordered", DESKTOP, { full: true }],
    ["lakshmi-owner", "workspace", "/orders", "lakshmi-orders", DESKTOP],
  ],
  staff: [
    ["lakshmi-owner", "workspace", "/home", "lakshmi-today-staff-recorded", DESKTOP],
    ["lakshmi-owner", "workspace", "/home", "lakshmi-today-staff-recorded-phone", PHONE],
  ],
  collected: [
    ["meera", "workspace", "/pickups", "meera-pickups-collected", DESKTOP],
    ["meera", "workspace", "/pickups", "meera-pickup-page", DESKTOP, { click: ["Mango Drink"] }],
    ["meera", "workspace", "/pickups", "meera-pickup-page-phone", PHONE, { click: ["Mango Drink"] }],
    ["priya", "workspace", `/execution/${HERO}`, "priya-execution-collected", DESKTOP, { full: true }],
  ],
  papers: [
    ["priya", "workspace", `/paperwork/${HERO}`, "priya-paperwork", DESKTOP, { full: true }],
    ["priya", "workspace", `/paperwork/${HERO}`, "paper-credit-note", DESKTOP, { click: ["Price-support credit note"], full: true }],
    ["priya", "workspace", `/paperwork/${HERO}`, "paper-itc-memo", DESKTOP, { click: ["GST ITC memo"], full: true }],
    ["priya", "workspace", `/paperwork/${HERO}`, "paper-fssai", DESKTOP, { click: ["FSSAI surplus-food checklist"], full: true }],
    ["priya", "workspace", `/paperwork/${HERO}`, "paper-receipt", DESKTOP, { click: ["Donation receipt"], full: true }],
    ["priya", "workspace", `/paperwork/${HERO}`, "priya-paperwork-phone", PHONE],
    ["lakshmi-owner", "workspace", "/home", "lakshmi-today-van", DESKTOP],
    ["lakshmi-owner", "workspace", `/van/${HERO}`, "lakshmi-deliveries", DESKTOP, { full: true }],
    ["lakshmi-owner", "workspace", `/van/${HERO}`, "lakshmi-deliveries-phone", PHONE],
  ],
  van: [
    ["lakshmi-owner", "workspace", `/van/${HERO}`, "lakshmi-deliveries-done", DESKTOP, { full: true }],
    ["priya", "workspace", `/execution/${HERO}`, "priya-execution-van", DESKTOP, { full: true }],
  ],
  ledger: [
    ["priya", "workspace", `/execution/${HERO}`, "priya-execution-cleared", DESKTOP, { full: true }],
    ["priya", "workspace", `/command/${HERO}`, "priya-journey-cleared", DESKTOP],
    ["priya", "workspace", "/report", "ledger-money", DESKTOP, { full: true }],
    ["priya", "workspace", "/report", "ledger-gst", DESKTOP, { reading: "GST", full: true }],
    ["priya", "workspace", "/report", "ledger-impact", DESKTOP, { reading: "Impact", full: true }],
    ["priya", "workspace", "/report", "ledger-impact-phone", PHONE, { reading: "Impact" }],
    ["priya", "workspace", `/report/${HERO}`, "batch-money", DESKTOP, { full: true }],
    ["priya", "workspace", `/report/${HERO}`, "batch-papers", DESKTOP, { tab: "Papers", full: true }],
    ["priya", "workspace", `/report/${HERO}`, "batch-impact", DESKTOP, { tab: "Impact", full: true }],
    ["priya", "workspace", `/report/${HERO}?tab=record`, "batch-record", DESKTOP, { full: true }],
    ["priya", "workspace", "/batches", "priya-batches-cleared", DESKTOP],
    ["priya", "workspace", "/command", "priya-command-cleared", DESKTOP],
    ["lakshmi-owner", "workspace", `/batches/${HERO}`, "lakshmi-batch", DESKTOP, { full: true }],
    ["lakshmi-owner", "workspace", `/batches/${HERO}`, "lakshmi-batch-money", DESKTOP, { tab: "Money", full: true }],
    ["lakshmi-owner", "workspace", `/batches/${HERO}`, "lakshmi-batch-papers", DESKTOP, { tab: "Papers", full: true }],
    ["lakshmi-owner", "workspace", "/batches", "lakshmi-batches", DESKTOP, { full: true }],
    ["lakshmi-owner", "workspace", "/orders", "lakshmi-orders-cleared", DESKTOP, { full: true }],
    [K0, "workspace", "/orders", "kirana-orders-cleared", DESKTOP],
    [K0, "workspace", "/orders", "kirana-orders-cleared-phone", PHONE],
    ["meera", "workspace", "/pickups", "meera-pickups-cleared", DESKTOP],
  ],
  console: [
    ["neha", "console", "/", "console-overview", DESKTOP, { full: true }],
    ["neha", "console", "/clients", "console-clients", DESKTOP],
    ["neha", "console", "/clients/munchly", "console-munchly-agents", DESKTOP, { full: true }],
    ["neha", "console", "/clients/munchly/rules", "console-munchly-rules", DESKTOP, { full: true }],
    ["neha", "console", "/clients/munchly/supply", "console-munchly-supply", DESKTOP, { full: true }],
    ["neha", "console", "/agents", "console-agents", DESKTOP, { full: true }],
  ],
};

const list = (STAGES[stage] || []).filter((c) => !args.only || c[3] === args.only);
if (!list.length) { console.error(`no captures for stage ${stage}`); process.exit(2); }

/** the custom tokens, minted once for everyone this stage needs */
const who = [...new Set(list.map((c) => c[0]))];
const people = JSON.parse(execFileSync(path.join(MAIN, "backend-api/scripts/sessions.sh"), who, { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"], maxBuffer: 16 << 20 }));
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
  const s = await session(app, id);
  const person = people[id];
  const key = `firebase:authUser:${s.apiKey}:[DEFAULT]`;
  const value = JSON.stringify({ uid: person.uid, email: person.email, emailVerified: false, isAnonymous: false, providerData: [],
    stsTokenManager: { refreshToken: s.refreshToken, accessToken: s.idToken, expirationTime: s.expiresAt },
    createdAt: String(Date.now()), lastLoginAt: String(Date.now()), apiKey: s.apiKey, appName: "[DEFAULT]" });
  await page.route("**/__film-session", (r) => r.fulfill({ contentType: "text/html", body: "<!doctype html><title>Signing in</title>" }));
  await page.route(/googleapis\.com/, (r) => r.continue({ headers: { ...r.request().headers(), referer: KEY_REFERER[app] } }));
  await page.goto(ORIGIN[app] + "/__film-session");
  await page.evaluate(async ([key, value]) => {
    for (const k of Object.keys(localStorage)) if (k.startsWith("firebase:authUser:")) localStorage.removeItem(k);
    localStorage.setItem(key, value);
    await new Promise((done) => { const r = indexedDB.deleteDatabase("firebaseLocalStorageDb"); r.onsuccess = r.onerror = r.onblocked = () => done(null); });
  }, [key, value]);
  await page.goto(ORIGIN[app] + p, { waitUntil: "load" }); // never networkidle: the live stream stays open
}

/** the page once its splash has lifted and its reads have landed */
async function settled(page) {
  await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]') && !document.querySelector(".splash, .ws-splash, #splash:not([hidden])"), null, { timeout: 30_000 }).catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 6000 }).catch(() => {});
  await page.waitForTimeout(2200);
}

const browser = await chromium.launch();
for (const [id, app, p, name, vp, opts = {}] of list) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.dpr, colorScheme: "light", isMobile: vp === PHONE, hasTouch: vp === PHONE, reducedMotion: "reduce", extraHTTPHeaders: { Referer: KEY_REFERER[app] } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  if (args.debug) {
    page.on("console", (m) => { const t = m.text(); if (!t.startsWith("[vite]")) console.log("  console", m.type(), t.slice(0, 300)); });
    page.on("response", (r) => { if (r.url().includes(":8000") || r.url().includes("googleapis")) console.log("  resp", r.status(), r.url().slice(0, 140)); });
    page.on("requestfailed", (r) => console.log("  failed", r.url().slice(0, 140), r.failure()?.errorText));
    page.on("framenavigated", (f) => { if (f === page.mainFrame()) console.log("  nav", f.url()); });
  }
  try {
    await openAs(page, app, id, p);
    await settled(page);
    for (const text of opts.click || []) { await page.getByText(text, { exact: false }).first().click(); await settled(page); }
    if (opts.reading) { await page.getByRole("group", { name: "Reading" }).getByRole("button", { name: opts.reading, exact: true }).click(); await settled(page); }
    if (opts.tab) { await page.locator(".bh-tabs, [role=tablist]").getByRole("button", { name: opts.tab, exact: true }).first().click().catch(async () => page.getByRole("tab", { name: opts.tab }).first().click()); await settled(page); }
    await page.screenshot({ path: path.join(out, `${stage}--${name}.png`) });
    if (opts.full) await page.screenshot({ path: path.join(out, `${stage}--${name}--full.png`), fullPage: true });
    console.log(`${stage} ${name}: ${page.url().replace(ORIGIN[app], "")}${errors.length ? " ERRORS " + errors.join(" | ") : ""}`);
  } catch (e) {
    console.log(`${stage} ${name}: FAILED ${String(e).split("\n")[0]}`);
    await page.screenshot({ path: path.join(out, `${stage}--${name}--failed.png`) }).catch(() => {});
  }
  await ctx.close();
}
await browser.close();
