#!/usr/bin/env node
// SC-187: the film's overlays, rendered from HTML on design system v3's own tokens (tokens.css: the inks, the greens,
// the amber of the human yes, Bricolage Grotesque and Geist) with Playwright, each a PNG with a transparent background:
// the phone pop-ups (backend-api's own push texts), the captions, the lower thirds that introduce each person, the
// chapter cards, the callouts that name a figure on a screen, the title and the end card. film.json names them.
//   node overlays.mjs [id…]
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const REPO = path.resolve(HERE, "../../../..");
const require = createRequire(path.join(process.env.SC_REPO || REPO, "frontend/testing/package.json"));
const { chromium } = require("@playwright/test");
const film = JSON.parse(fs.readFileSync(path.join(HERE, "film.json"), "utf8"));
const OUT = path.join(HERE, "overlays", "out");
fs.mkdirSync(OUT, { recursive: true });
const only = new Set(process.argv.slice(2));
const icon = fs.readFileSync(path.join(REPO, "design3/system/img/icon.svg"), "utf8");
const tokens = fs.readFileSync(path.join(REPO, "design3/system/tokens.css"), "utf8");

const CSS = `
${tokens}
* { box-sizing: border-box; margin: 0; }
html, body { background: transparent; }
body { font-family: var(--font-ui); color: var(--fg); -webkit-font-smoothing: antialiased; }
.display { font-family: var(--font-display); font-variation-settings: "opsz" 96, "wdth" 100; letter-spacing: -0.02em; }
.hi { font-family: var(--font-hi); }
.stage { width: 1920px; height: 1080px; position: relative; overflow: hidden; }
b { color: var(--green-200); font-weight: 700; }
em { font-style: normal; color: var(--amber); font-weight: 700; }

/* a phone pop-up, as a lock screen shows it: the mark, the app, the title, the body */
.push { position: absolute; top: 46px; right: 52px; width: 700px; background: rgb(255 255 255 / 0.93); backdrop-filter: blur(28px); border-radius: 30px; padding: 22px 26px 24px; box-shadow: 0 34px 70px -24px rgb(13 28 21 / 0.5), 0 10px 24px -12px rgb(13 28 21 / 0.28); border: 1px solid rgb(255 255 255 / 0.7); }
.push .head { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.push .head svg { width: 42px; height: 42px; border-radius: 12px; }
.push .app { font-size: 19px; font-weight: 600; color: var(--fg-2); letter-spacing: 0.01em; }
.push .when { margin-left: auto; font-size: 18px; color: var(--fg-3); }
.push .ptitle { font-size: 26px; font-weight: 700; line-height: 1.25; margin-bottom: 6px; }
.push .pbody { font-size: 22px; line-height: 1.38; color: var(--fg-2); }
.push .to { position: absolute; left: 26px; bottom: -40px; font-size: 18px; font-weight: 600; color: #fff; background: rgb(13 28 21 / 0.74); padding: 6px 14px; border-radius: 999px; backdrop-filter: blur(10px); }
.push.left { right: auto; left: 52px; }

/* a caption on the foot of the frame: a label pill and the line */
.caption { position: absolute; left: 72px; right: 72px; bottom: 58px; display: flex; flex-direction: column; gap: 10px; align-items: flex-start; }
.caption .label { font-size: 19px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #fff; background: var(--green-600); padding: 7px 14px 6px; border-radius: 999px; }
.caption .label.amber { background: var(--amber); color: var(--amber-fg); }
.caption .label.violet { background: var(--violet); color: #fff; }
.caption .text { font-size: 36px; line-height: 1.3; font-weight: 500; color: #fff; background: rgb(7 38 26 / 0.74); backdrop-filter: blur(16px); padding: 16px 26px 18px; border-radius: 18px; max-width: 1380px; text-wrap: balance; }
.caption.right { align-items: flex-end; text-align: right; }

/* a lower third that introduces a person: the name, then who they are */
.lower { position: absolute; left: 72px; bottom: 170px; display: flex; align-items: stretch; gap: 0; }
.lower .bar { width: 10px; background: var(--amber); border-radius: 6px 0 0 6px; }
.lower .box { background: rgb(7 38 26 / 0.78); backdrop-filter: blur(14px); padding: 16px 28px 18px 22px; border-radius: 0 16px 16px 0; color: #fff; }
.lower .name { font-size: 40px; font-weight: 700; line-height: 1.1; }
.lower .role { font-size: 22px; color: var(--green-100); margin-top: 6px; letter-spacing: 0.01em; }
.lower .place { font-size: 19px; color: var(--green-200); margin-top: 2px; letter-spacing: 0.06em; text-transform: uppercase; font-weight: 600; }

/* a callout: a figure and what it is, pinned near what it names, with a short leader line */
.callout { position: absolute; display: flex; flex-direction: column; gap: 4px; }
.callout .fig { font-size: 54px; font-weight: 700; color: #fff; line-height: 1; text-shadow: 0 4px 24px rgb(0 0 0 / 0.45); }
.callout .fig.amber { color: var(--amber); }
.callout .fig.red { color: #ff8f8d; }
.callout .what { font-size: 22px; color: #e6f3ec; font-weight: 500; text-shadow: 0 2px 12px rgb(0 0 0 / 0.5); }
.callout .pill { align-self: flex-start; font-size: 18px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #fff; background: var(--green-600); padding: 6px 12px 5px; border-radius: 999px; margin-bottom: 6px; }
.callout .pill.amber { background: var(--amber); color: var(--amber-fg); }
.callout .pill.red { background: var(--red); }
.callout .pill.violet { background: var(--violet); }
.callout.card { background: rgb(7 38 26 / 0.78); backdrop-filter: blur(14px); padding: 18px 24px 20px; border-radius: 18px; }

/* cut 2: a pointer beside a UI element: a dot with a soft ring, a short leader and a label pill */
.pointer { position: absolute; display: flex; align-items: center; gap: 0; }
.pointer .dot { width: 18px; height: 18px; border-radius: 50%; background: var(--amber); box-shadow: 0 0 0 7px rgb(242 180 55 / 0.28), 0 0 0 14px rgb(242 180 55 / 0.12); flex: none; }
.pointer .lead { width: 54px; height: 3px; background: var(--amber); flex: none; }
.pointer .pill { font-size: 24px; font-weight: 600; color: var(--fg); background: rgb(255 255 255 / 0.96); border: 1px solid rgb(17 41 30 / 0.12); padding: 10px 18px; border-radius: 999px; box-shadow: 0 12px 30px -12px rgb(13 28 21 / 0.35); white-space: nowrap; }
.pointer .pill b { color: var(--primary-text); }
.pointer.left { flex-direction: row-reverse; }
.pointer.green .dot { background: var(--green-500); box-shadow: 0 0 0 7px rgb(31 149 99 / 0.25), 0 0 0 14px rgb(31 149 99 / 0.1); }
.pointer.green .lead { background: var(--green-500); }

/* cut 2: a role card in place of a name: who this is, in the story */
.role { position: absolute; left: 72px; bottom: 150px; display: flex; align-items: center; gap: 16px; background: rgb(7 38 26 / 0.74); backdrop-filter: blur(14px); padding: 14px 24px 14px 16px; border-radius: 999px; color: #fff; }
.role .mark { width: 14px; height: 14px; border-radius: 50%; background: var(--amber); flex: none; }
.role .who { font-size: 28px; font-weight: 700; }
.role .where { font-size: 20px; color: var(--green-100); }

/* cut 2: a feature label: an eyebrow and one line, top left under the chapter, for what a screen does */
.feature { position: absolute; left: 72px; top: 120px; max-width: 620px; }
.feature .eyebrow { font-size: 18px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--amber-text); background: var(--amber-soft); padding: 6px 12px; border-radius: 999px; display: inline-block; margin-bottom: 10px; }
.feature .line { font-size: 30px; font-weight: 600; line-height: 1.25; color: var(--fg); text-wrap: balance; }
.feature .line b { color: var(--primary-text); }
.feature.dark .line { color: #fff; text-shadow: 0 2px 14px rgb(0 0 0 / 0.5); }
.feature.dark .eyebrow { background: var(--amber); color: var(--amber-fg); }

/* a ring that marks a UI element the camera has closed in on */
.ring { position: absolute; border: 4px solid var(--amber); border-radius: 14px; box-shadow: 0 0 0 6px rgb(242 180 55 / 0.25), 0 10px 40px rgb(0 0 0 / 0.25); }

/* the title card */
.title { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 20px; background: linear-gradient(180deg, rgb(7 38 26 / 0.18), rgb(7 38 26 / 0.66)); }
.title .mark { width: 132px; height: 132px; filter: drop-shadow(0 20px 40px rgb(0 0 0 / 0.35)); }
.title h1 { font-size: 124px; font-weight: 700; color: #fff; text-shadow: 0 6px 30px rgb(0 0 0 / 0.4); line-height: 1; }
.title p { font-size: 40px; color: var(--green-50); font-weight: 500; max-width: 1240px; text-wrap: balance; text-shadow: 0 2px 16px rgb(0 0 0 / 0.5); }
.title .sub { font-size: 24px; color: var(--green-200); letter-spacing: 0.14em; text-transform: uppercase; font-weight: 700; }

/* a chapter card: a number, a title, one line, over the scene's dark ground */
.chapter-card { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: flex-end; padding: 0 120px 150px; background: linear-gradient(90deg, rgb(7 38 26 / 0.82), rgb(7 38 26 / 0.35) 60%, rgb(7 38 26 / 0.1)); color: #fff; }
.chapter-card .n { font-size: 24px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--amber); margin-bottom: 14px; }
.chapter-card h2 { font-size: 110px; font-weight: 700; line-height: 1; margin-bottom: 16px; }
.chapter-card p { font-size: 34px; color: var(--green-100); max-width: 1100px; text-wrap: balance; }

/* a chapter label at the top left, while a chapter runs */
.chapter { position: absolute; top: 48px; left: 72px; display: flex; align-items: center; gap: 14px; }
.chapter .n { font-size: 22px; font-weight: 800; color: var(--amber-fg); background: var(--amber); width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; }
.chapter .t { font-size: 28px; font-weight: 700; color: #fff; text-shadow: 0 2px 12px rgb(0 0 0 / 0.55); }

/* the problem's statements, one after another, big */
.statement { position: absolute; left: 110px; right: 120px; top: 150px; }
.statement h2 { font-size: 92px; font-weight: 700; color: #fff; line-height: 1.02; text-shadow: 0 6px 30px rgb(0 0 0 / 0.45); max-width: 1500px; text-wrap: balance; }
.statement h2 em { color: var(--amber); }
.statement h2 .red { color: #ff8f8d; font-style: normal; }

/* the stops: nine chips in a row, the active ones lit */
.stops { position: absolute; left: 72px; right: 72px; bottom: 170px; display: flex; gap: 10px; justify-content: center; }
.stops span { font-size: 22px; font-weight: 700; color: rgb(255 255 255 / 0.6); border: 2px solid rgb(255 255 255 / 0.3); padding: 10px 20px; border-radius: 999px; background: rgb(7 38 26 / 0.5); backdrop-filter: blur(10px); }
.stops span.on { color: #fff; border-color: var(--green-300); background: var(--green-700); }
.stops span.yes { color: var(--amber-fg); border-color: var(--amber); background: var(--amber); }

/* the end card */
.end { position: absolute; inset: 0; background: linear-gradient(180deg, rgb(7 38 26 / 0.58), rgb(7 38 26 / 0.86)); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 34px; }
.end .grid { display: grid; grid-template-columns: repeat(4, 360px); gap: 22px; }
.end .card { background: rgb(255 255 255 / 0.1); border: 1px solid rgb(255 255 255 / 0.18); border-radius: 22px; padding: 24px 26px; color: #fff; backdrop-filter: blur(12px); }
.end .card .who { font-size: 19px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--green-200); margin-bottom: 8px; }
.end .card .fig { font-size: 50px; font-weight: 700; line-height: 1.05; }
.end .card .what { font-size: 21px; color: var(--green-50); margin-top: 8px; line-height: 1.3; }
.end .brand { display: flex; align-items: center; gap: 20px; }
.end .brand svg { width: 80px; height: 80px; }
.end .brand .name { font-size: 62px; font-weight: 700; color: #fff; }
.end .links { display: flex; gap: 18px; }
.end .link { font-size: 24px; color: #fff; background: rgb(255 255 255 / 0.12); border: 1px solid rgb(255 255 255 / 0.2); padding: 14px 24px; border-radius: 999px; }
.end .link b { color: var(--green-200); margin-right: 10px; }
.end .link.amber { background: var(--amber); color: var(--amber-fg); border-color: var(--amber); }
.end .link.amber b { color: var(--amber-fg); }
.end .built { font-size: 21px; color: var(--green-200); margin-top: -10px; }
`;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const rich = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/__(.+?)__/g, "<em>$1</em>");

function html(o) {
  switch (o.kind) {
    case "push":
      return `<div class="stage"><div class="push${o.left ? " left" : ""}">
        <div class="head">${icon}<span class="app">Smart-Clearance</span><span class="when">now</span></div>
        <div class="ptitle${/[ऀ-ॿ]/.test(o.title) ? " hi" : ""}">${esc(o.title)}</div><div class="pbody${/[ऀ-ॿ]/.test(o.body) ? " hi" : ""}">${esc(o.body)}</div>
        ${o.to ? `<div class="to">${esc(o.to)}</div>` : ""}</div></div>`;
    case "caption":
      return `<div class="stage"><div class="caption${o.right ? " right" : ""}">${o.label ? `<span class="label ${o.tone || ""}">${esc(o.label)}</span>` : ""}<div class="text">${rich(o.text)}</div></div></div>`;
    case "lower":
      return `<div class="stage"><div class="lower"><div class="bar"></div><div class="box"><div class="name display">${esc(o.name)}</div><div class="role">${esc(o.role)}</div>${o.place ? `<div class="place">${esc(o.place)}</div>` : ""}</div></div></div>`;
    case "callout": {
      const pos = `left:${o.x}px;top:${o.y}px;${o.w ? `width:${o.w}px;` : ""}`;
      return `<div class="stage"><div class="callout${o.card ? " card" : ""}" style="${pos}">${o.pill ? `<span class="pill ${o.tone || ""}">${esc(o.pill)}</span>` : ""}<div class="fig display ${o.tone || ""}">${rich(o.fig)}</div>${o.what ? `<div class="what">${rich(o.what)}</div>` : ""}</div>
        ${o.ring ? `<div class="ring" style="left:${o.ring[0]}px;top:${o.ring[1]}px;width:${o.ring[2]}px;height:${o.ring[3]}px"></div>` : ""}</div>`;
    }
    case "pointer":
      return `<div class="stage"><div class="pointer${o.left ? " left" : ""}${o.tone === "green" ? " green" : ""}" style="left:${o.x}px;top:${o.y}px;transform:translate(${o.left ? "-100%" : "-9px"},-50%)"><span class="dot"></span><span class="lead"></span><span class="pill">${rich(o.text)}</span></div></div>`;
    case "role":
      return `<div class="stage"><div class="role"><span class="mark"></span><span class="who">${esc(o.who)}</span>${o.where ? `<span class="where">${esc(o.where)}</span>` : ""}</div></div>`;
    case "feature":
      return `<div class="stage"><div class="feature${o.dark ? " dark" : ""}">${o.eyebrow ? `<span class="eyebrow">${esc(o.eyebrow)}</span>` : ""}<div class="line">${rich(o.text)}</div></div></div>`;
    case "ring":
      return `<div class="stage"><div class="ring" style="left:${o.ring[0]}px;top:${o.ring[1]}px;width:${o.ring[2]}px;height:${o.ring[3]}px"></div></div>`;
    case "title":
      return `<div class="stage"><div class="title">${icon.replace("<svg ", '<svg class="mark" ')}<h1 class="display">${esc(o.title)}</h1><p>${rich(o.text)}</p>${o.sub ? `<div class="sub">${esc(o.sub)}</div>` : ""}</div></div>`;
    case "chapter-card":
      return `<div class="stage"><div class="chapter-card"><div class="n">${esc(o.n)}</div><h2 class="display">${esc(o.title)}</h2>${o.text ? `<p>${rich(o.text)}</p>` : ""}</div></div>`;
    case "chapter":
      return `<div class="stage"><div class="chapter"><span class="n">${esc(o.n)}</span><span class="t">${esc(o.text)}</span></div></div>`;
    case "statement":
      return `<div class="stage"><div class="statement"><h2 class="display">${rich(o.text).replace(/\{\{(.+?)\}\}/g, '<span class="red">$1</span>')}</h2></div></div>`;
    case "stops":
      return `<div class="stage"><div class="stops">${o.stops.map((s) => `<span class="${s.state || ""}">${esc(s.name)}</span>`).join("")}</div></div>`;
    case "end":
      return `<div class="stage"><div class="end">
        <div class="grid">${o.cards.map((c) => `<div class="card"><div class="who">${esc(c.who)}</div><div class="fig display">${esc(c.fig)}</div><div class="what">${esc(c.what)}</div></div>`).join("")}</div>
        <div class="brand">${icon}<span class="name display">Smart-Clearance</span></div>
        <div class="links">${o.links.map((l) => `<span class="link${l.amber ? " amber" : ""}"><b>${esc(l.label)}</b>${esc(l.text)}</span>`).join("")}</div>
        <div class="built">${esc(o.built)}</div></div></div>`;
  }
  throw new Error(`unknown overlay kind ${o.kind}`);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
let n = 0;
for (const o of film.overlays) {
  if (only.size && !only.has(o.id)) continue;
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${html(o)}</body></html>`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(120);
  await page.screenshot({ path: path.join(OUT, `${o.id}.png`), omitBackground: true, fullPage: false });
  n++;
}
console.log(`${n} overlays rendered to ${OUT}`);
await browser.close();
