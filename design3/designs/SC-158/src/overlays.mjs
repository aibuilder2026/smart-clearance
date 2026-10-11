#!/usr/bin/env node
// SC-158: the film's overlays, rendered from HTML on design system v3's tokens and fonts with Playwright, each as a PNG
// with a transparent background: the phone pop-ups (backend-api's own push texts), the captions, the chapter labels,
// the title and end cards. film.json names them; this writes overlays/out/<id>.png.
//   node overlays.mjs [id…]
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const REPO = path.resolve(HERE, "../../../..");
const require = createRequire(path.join(REPO, "frontend/testing/package.json"));
const { chromium } = require("@playwright/test");
const film = JSON.parse(fs.readFileSync(path.join(HERE, "film.json"), "utf8"));
const OUT = path.join(HERE, "overlays", "out");
fs.mkdirSync(OUT, { recursive: true });
const only = new Set(process.argv.slice(2));
const icon = fs.readFileSync(path.join(REPO, "design3/system/img/icon.svg"), "utf8");
const munchly = fs.existsSync(path.join(REPO, "design3/app/icons/icon-192.png")) ? "" : "";

const CSS = `
@import url("https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,200..800&family=Geist:wght@300..800&family=Geist+Mono:wght@400..600&family=Noto+Sans+Devanagari:wght@400..800&display=swap");
:root { --ink: #0d1c15; --ink-2: #3d4d45; --ink-3: #6b7a72; --surface: #ffffff; --green-600: #177c52; --green-500: #1f9563; --green-50: #ecf8f1; --amber: #f2b437; --amber-fg: #2a1c00; --night: #0b1510; }
* { box-sizing: border-box; margin: 0; }
html, body { background: transparent; }
body { font-family: "Geist", "Noto Sans Devanagari", system-ui, sans-serif; color: var(--ink); -webkit-font-smoothing: antialiased; }
.display { font-family: "Bricolage Grotesque", "Geist", sans-serif; font-variation-settings: "opsz" 96, "wdth" 100; letter-spacing: -0.02em; }
.stage { width: 1920px; height: 1080px; position: relative; overflow: hidden; }

/* a phone pop-up, as a lock screen shows it */
.push { position: absolute; top: 44px; right: 48px; width: 720px; background: rgba(255,255,255,0.92); backdrop-filter: blur(24px); border-radius: 28px; padding: 22px 26px 24px; box-shadow: 0 30px 60px -20px rgb(13 28 21 / 0.45), 0 10px 22px -10px rgb(13 28 21 / 0.25); border: 1px solid rgba(255,255,255,0.7); }
.push .head { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.push .head svg { width: 44px; height: 44px; border-radius: 12px; }
.push .app { font-size: 20px; font-weight: 600; color: var(--ink-2); letter-spacing: 0.01em; }
.push .when { margin-left: auto; font-size: 19px; color: var(--ink-3); }
.push .ptitle { font-size: 27px; font-weight: 700; line-height: 1.25; margin-bottom: 6px; }
.push .pbody { font-size: 23px; line-height: 1.38; color: var(--ink-2); }
.push .to { position: absolute; left: 26px; bottom: -40px; font-size: 19px; font-weight: 600; color: #fff; background: rgba(13,28,21,0.72); padding: 6px 14px; border-radius: 999px; backdrop-filter: blur(10px); }

/* a caption on the foot of the frame */
.caption { position: absolute; left: 72px; right: 72px; bottom: 60px; display: flex; flex-direction: column; gap: 10px; align-items: flex-start; }
.caption .label { font-size: 20px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #fff; background: var(--green-600); padding: 7px 14px 6px; border-radius: 999px; }
.caption .label.amber { background: var(--amber); color: var(--amber-fg); }
.caption .text { font-size: 38px; line-height: 1.3; font-weight: 500; color: #fff; background: rgba(11,21,16,0.78); backdrop-filter: blur(16px); padding: 18px 28px 20px; border-radius: 18px; max-width: 1400px; text-wrap: balance; }
.caption .text b { color: #9fe3c2; font-weight: 700; }
.caption .text em { font-style: normal; color: var(--amber); font-weight: 700; }

/* the title card */
.title { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 22px; background: linear-gradient(180deg, rgba(11,21,16,0.15), rgba(11,21,16,0.62)); }
.title .mark { width: 128px; height: 128px; filter: drop-shadow(0 20px 40px rgb(0 0 0 / 0.35)); }
.title h1 { font-size: 118px; font-weight: 700; color: #fff; text-shadow: 0 6px 30px rgb(0 0 0 / 0.4); }
.title p { font-size: 40px; color: #ecf8f1; font-weight: 500; max-width: 1200px; text-wrap: balance; text-shadow: 0 2px 16px rgb(0 0 0 / 0.5); }
.title .sub { font-size: 26px; color: #c9e6d6; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; }

/* a chapter label at the top left */
.chapter { position: absolute; top: 52px; left: 72px; display: flex; align-items: center; gap: 14px; }
.chapter .n { font-size: 24px; font-weight: 800; color: var(--amber-fg); background: var(--amber); width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; }
.chapter .t { font-size: 30px; font-weight: 700; color: #fff; text-shadow: 0 2px 12px rgb(0 0 0 / 0.55); }

/* the end card */
.end { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(11,21,16,0.55), rgba(11,21,16,0.82)); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 40px; }
.end .grid { display: grid; grid-template-columns: repeat(4, 360px); gap: 24px; }
.end .card { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.18); border-radius: 22px; padding: 26px 28px; color: #fff; backdrop-filter: blur(12px); }
.end .card .who { font-size: 20px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #9fe3c2; margin-bottom: 8px; }
.end .card .fig { font-size: 52px; font-weight: 700; line-height: 1.05; }
.end .card .what { font-size: 22px; color: #d7eadf; margin-top: 8px; line-height: 1.3; }
.end .brand { display: flex; align-items: center; gap: 20px; }
.end .brand svg { width: 84px; height: 84px; }
.end .brand .name { font-size: 64px; font-weight: 700; color: #fff; }
.end .url { font-size: 30px; color: #c9e6d6; letter-spacing: 0.04em; }
.end .built { font-size: 22px; color: #9fb8aa; margin-top: -16px; }
`;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const rich = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/__(.+?)__/g, "<em>$1</em>");

function html(o) {
  if (o.kind === "push") {
    return `<div class="stage"><div class="push">
      <div class="head">${icon}<span class="app">Smart-Clearance</span><span class="when">now</span></div>
      <div class="ptitle">${esc(o.title)}</div><div class="pbody">${esc(o.body)}</div>
      ${o.to ? `<div class="to">${esc(o.to)}</div>` : ""}</div></div>`;
  }
  if (o.kind === "caption") {
    return `<div class="stage"><div class="caption">${o.label ? `<span class="label${o.amber ? " amber" : ""}">${esc(o.label)}</span>` : ""}<div class="text">${rich(o.text)}</div></div></div>`;
  }
  if (o.kind === "chapter") {
    return `<div class="stage"><div class="chapter"><span class="n">${esc(o.n)}</span><span class="t">${esc(o.text)}</span></div></div>`;
  }
  if (o.kind === "title") {
    return `<div class="stage"><div class="title">${icon.replace("<svg ", '<svg class="mark" ')}<h1 class="display">${esc(o.title)}</h1><p>${esc(o.text)}</p>${o.sub ? `<div class="sub">${esc(o.sub)}</div>` : ""}</div></div>`;
  }
  if (o.kind === "end") {
    return `<div class="stage"><div class="end">
      <div class="grid">${o.cards.map((c) => `<div class="card"><div class="who">${esc(c.who)}</div><div class="fig display">${esc(c.fig)}</div><div class="what">${esc(c.what)}</div></div>`).join("")}</div>
      <div class="brand">${icon}<span class="name display">Smart-Clearance</span></div>
      <div class="url">${esc(o.url)}</div><div class="built">${esc(o.built)}</div></div></div>`;
  }
  throw new Error(`unknown overlay kind ${o.kind}`);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
for (const o of film.overlays) {
  if (only.size && !only.has(o.id)) continue;
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${html(o)}</body></html>`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(OUT, `${o.id}.png`), omitBackground: true, fullPage: false });
  console.log(`overlay ${o.id} (${o.kind})`);
}
await browser.close();
