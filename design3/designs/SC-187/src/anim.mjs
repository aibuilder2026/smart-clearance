#!/usr/bin/env node
// SC-187 cut 3: four short motion-graphics animations for the film's feature beats, each on a white card in the right
// half of the frame (the feature label sits at the left), rendered from HTML on design system v3's own tokens
// (tokens.css: the inks, the greens, the amber of the human yes, Bricolage Grotesque and Geist) with Playwright, as
// overlays.mjs renders the stills: a transparent PNG a frame at 1920×1080, 24 fps. Nothing runs on a clock: each
// animation is a pure render(t) that sets the DOM for a time t, screenshotted at t = i/24, so every frame is
// deterministic and the last frame is the animation's resting state, which the film holds.
//   SC_REPO=/path/to/smart-clearance node anim.mjs [id…]   → anim/<id>/f-0001.png… and anim/<id>.json
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const REPO = path.resolve(HERE, "../../../..");
const require = createRequire(path.join(process.env.SC_REPO || REPO, "frontend/testing/package.json"));
const { chromium } = require("@playwright/test");
const tokens = fs.readFileSync(path.join(REPO, "design3/system/tokens.css"), "utf8");
const OUT = path.join(HERE, "anim");
const FPS = 24;
const only = new Set(process.argv.slice(2));

// the card: the right half of the frame, x 760 to 1860, y 120 to 980; everything inside it is placed in frame
// coordinates through L and T, which take the card's own origin (inside its 1px border) off
const CARD = { x: 760, y: 120, w: 1100, h: 860 };
const L = (x) => x - CARD.x - 1;
const T = (y) => y - CARD.y - 1;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

const BASE = `
${tokens}
* { box-sizing: border-box; margin: 0; }
html, body { background: transparent; }
body { font-family: var(--font-ui); color: var(--fg); -webkit-font-smoothing: antialiased; }
.display { font-family: var(--font-display); font-variation-settings: "opsz" 96, "wdth" 100; letter-spacing: -0.02em; }
.hi { font-family: var(--font-hi); }
.stage { width: 1920px; height: 1080px; position: relative; overflow: hidden; }
.card { position: absolute; left: ${CARD.x}px; top: ${CARD.y}px; width: ${CARD.w}px; height: ${CARD.h}px; background: #fff; border-radius: 28px; border: 1px solid rgb(13 28 21 / 0.08); box-shadow: var(--shadow-float); opacity: 0; }
.head { position: absolute; left: 48px; top: 48px; right: 48px; }
.eyebrow { display: inline-block; font-size: 18px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--amber-text); background: var(--amber-soft); padding: 6px 12px; border-radius: 999px; opacity: 0; }
.sub { margin-top: 12px; font-size: 28px; font-weight: 500; line-height: 1.3; color: var(--fg-2); text-wrap: balance; opacity: 0; }
.tag { position: absolute; right: 60px; top: 992px; font-size: 16px; font-weight: 500; letter-spacing: 0.04em; color: var(--fg-3); background: rgb(255 255 255 / 0.85); padding: 4px 12px; border-radius: 999px; opacity: 0; }
`;

// in-page helpers, shared by every render(t): the segment of a motion, the easings, the entrances
const HELPERS = `
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const seg = (t, a, d) => clamp01((t - a) / d);
const easeOut = (u) => 1 - Math.pow(1 - u, 3);
const pop = (u) => { const v = u - 1; return 1 + 2 * v * v * v + v * v; };   /* ease-out-back, s = 1: at most 3.7% over */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
function rise(el, t, a, d, dy, pre) {
  const e = easeOut(seg(t, a, d));
  el.style.opacity = e;
  el.style.transform = (pre || '') + ' translateY(' + (1 - e) * (dy == null ? 12 : dy) + 'px)';
}
function cardIn(t) {
  const e = easeOut(seg(t, 0, 0.45));
  const c = $('#card');
  c.style.opacity = e;
  c.style.transform = 'translateY(' + (1 - e) * 28 + 'px)';
  rise($('.eyebrow'), t, 0.18, 0.4);
  rise($('.sub'), t, 0.3, 0.45);
  const tag = $('.tag');
  if (tag) tag.style.opacity = seg(t, 0.7, 0.4);
}
`;

const ANIMS = [];

/* 1. agents-ring: the ten agents as chips on a ring, each landing with a thread to the centre, where the one yes
      from a person appears last */
{
  const AGENTS = ["Data", "Watcher", "Vision", "Valuer", "Router", "Lister", "Outreach", "Negotiator", "Paperwork", "Impact"];
  const RING = { cx: 1310, cy: 600, rx: 330, ry: 245, r0: 94 };
  const pts = AGENTS.map((n, i) => {
    const a = ((-90 + 36 * i) * Math.PI) / 180;
    return { n, x: RING.cx + RING.rx * Math.cos(a), y: RING.cy + RING.ry * Math.sin(a) };
  });
  ANIMS.push({
    id: "agents-ring",
    seconds: 5.0,
    eyebrow: "The agents",
    sub: "Each one owns a stop; nothing moves before the yes.",
    body: `
      <svg class="threads" viewBox="0 0 1098 858" width="1098" height="858">${pts.map((p) => `<line class="th" x1="${L(p.x)}" y1="${T(p.y)}" x2="${L(p.x)}" y2="${T(p.y)}"/>`).join("")}</svg>
      ${pts.map((p) => `<div class="chip" style="left:${L(p.x)}px;top:${T(p.y)}px"><i></i>${esc(p.n)}</div>`).join("")}
      <div class="badge" style="left:${L(RING.cx)}px;top:${T(RING.cy)}px"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg><div class="y1 display">One yes</div><div class="y2">from a person</div></div>`,
    css: `
.threads { position: absolute; left: 0; top: 0; }
.th { stroke: var(--green-200); stroke-width: 2.5; stroke-linecap: round; opacity: 0; }
.chip { position: absolute; display: flex; align-items: center; gap: 10px; height: 46px; padding: 0 20px; border-radius: 999px; background: #fff; border: 1px solid var(--green-200); box-shadow: 0 8px 20px -8px rgb(13 28 21 / 0.18); font-size: 22px; font-weight: 700; color: var(--fg); white-space: nowrap; opacity: 0; transform: translate(-50%, -50%) scale(0.6); }
.chip i { width: 10px; height: 10px; border-radius: 50%; background: var(--green-500); flex: none; }
.badge { position: absolute; width: 168px; height: 168px; border-radius: 50%; background: var(--amber); display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 18px 36px -14px rgb(242 180 55 / 0.6); opacity: 0; transform: translate(-50%, -50%) scale(0.6); }
.badge svg { width: 46px; height: 46px; fill: none; stroke: #fff; stroke-width: 3.4; stroke-linecap: round; stroke-linejoin: round; margin-bottom: 4px; }
.badge .y1 { font-size: 27px; font-weight: 700; color: var(--amber-fg); line-height: 1.1; }
.badge .y2 { font-size: 16px; font-weight: 500; color: var(--amber-fg); opacity: 0.8; margin-top: 3px; }`,
    js: `
const P = ${JSON.stringify(pts.map((p) => ({ x: L(p.x), y: T(p.y) })))};
const C = { x: ${L(RING.cx)}, y: ${T(RING.cy)} }, R0 = ${RING.r0};
const chips = $$('.chip'), th = $$('.th'), badge = $('.badge');
window.render = (t) => {
  cardIn(t);
  P.forEach((p, i) => {
    const s0 = 0.6 + 0.25 * i;
    chips[i].style.opacity = seg(t, s0, 0.15);
    chips[i].style.transform = 'translate(-50%,-50%) scale(' + (0.6 + 0.4 * pop(seg(t, s0, 0.45))) + ')';
    /* the thread from the chip to the badge's edge draws as the chip lands */
    const q = easeOut(seg(t, s0 + 0.2, 0.4));
    const dx = C.x - p.x, dy = C.y - p.y, d = Math.hypot(dx, dy);
    const ex = C.x - (dx / d) * R0, ey = C.y - (dy / d) * R0;
    th[i].setAttribute('x2', p.x + (ex - p.x) * q);
    th[i].setAttribute('y2', p.y + (ey - p.y) * q);
    th[i].style.opacity = q > 0 ? 1 : 0;
  });
  badge.style.opacity = seg(t, 3.2, 0.15);
  badge.style.transform = 'translate(-50%,-50%) scale(' + (0.6 + 0.4 * pop(seg(t, 3.2, 0.5))) + ')';
};`,
  });
}

/* 2. nine-stops: the nine stops as a rail; the line draws left to right and lights each stop as it reaches it,
      Approve in amber with "a person" under it; the agents' names fade in under their stops */
{
  const STOPS = [
    ["Connect", ["Data"]],
    ["Detect", ["Watcher"]],
    ["Verify", ["Vision"]],
    ["Value", ["Valuer"]],
    ["Decide", ["Router"]],
    ["Approve", ["you"]],
    ["Execute", ["Lister", "Outreach", "Negotiator", "Donation"]],
    ["Settle", ["Paperwork"]],
    ["Report", ["Impact"]],
  ];
  const X = STOPS.map((_, i) => 808 + (1004 * (i + 0.5)) / 9);
  const RY = 520;
  ANIMS.push({
    id: "nine-stops",
    seconds: 4.5,
    eyebrow: "Nine stops",
    sub: "Detect, verify, value, decide, execute, settle, report.",
    body: `
      <div class="track" style="left:${L(X[0])}px;top:${T(RY)}px;width:${X[8] - X[0]}px"></div>
      <div class="drawn" style="left:${L(X[0])}px;top:${T(RY)}px"></div>
      ${STOPS.map(([n], i) => `<div class="stop${n === "Approve" ? " yes" : ""}" style="left:${L(X[i])}px;top:${T(RY)}px"><span class="fill"></span><span class="t">${esc(n)}</span><span class="t lit">${esc(n)}</span></div>`).join("")}
      <div class="who" style="left:${L(X[5])}px;top:${T(RY + 30)}px">a person</div>
      ${STOPS.map(([, names], i) => `<div class="names" style="left:${L(X[i])}px;top:${T(RY + 80)}px">${names.map((n) => `<div>${esc(n)}</div>`).join("")}</div>`).join("")}`,
    css: `
.track { position: absolute; height: 4px; border-radius: 2px; background: var(--line-2); transform: translateY(-50%); }
.drawn { position: absolute; height: 4px; border-radius: 2px; background: var(--green-700); transform: translateY(-50%); width: 0; }
.stop { position: absolute; height: 38px; padding: 0 12px; border-radius: 999px; background: #fff; border: 1px solid var(--green-200); display: grid; place-items: center; font-size: 17px; font-weight: 700; transform: translate(-50%, -50%); white-space: nowrap; }
.stop .fill { position: absolute; inset: -1px; border-radius: 999px; background: var(--green-700); opacity: 0; }
.stop.yes .fill { background: var(--amber); }
.stop .t { grid-area: 1 / 1; position: relative; color: var(--fg-2); }
.stop .t.lit { color: #fff; opacity: 0; }
.stop.yes .t.lit { color: var(--amber-fg); }
.who { position: absolute; transform: translateX(-50%) scale(0.6); font-size: 14px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--amber-text); background: var(--amber-soft); padding: 4px 10px; border-radius: 999px; opacity: 0; white-space: nowrap; }
.names { position: absolute; transform: translateX(-50%); text-align: center; font-size: 18px; line-height: 24px; color: var(--fg-3); white-space: nowrap; }
.names div { opacity: 0; }`,
    js: `
const X = ${JSON.stringify(X.map(L))};
const stops = $$('.stop'), fills = $$('.stop .fill'), lits = $$('.stop .lit'), drawn = $('.drawn'), who = $('.who'), names = $$('.names');
const at = (i) => 0.5 + (2.2 * i) / 8;   /* when the line reaches stop i */
window.render = (t) => {
  cardIn(t);
  drawn.style.width = (X[8] - X[0]) * seg(t, 0.5, 2.2) + 'px';
  stops.forEach((el, i) => {
    const q = easeOut(seg(t, at(i), 0.3));
    fills[i].style.opacity = q;
    lits[i].style.opacity = q;
    el.style.transform = 'translate(-50%,-50%) scale(' + (1 + 0.06 * Math.sin(Math.PI * seg(t, at(i), 0.4))) + ')';
    $$('div', names[i]).forEach((n, j) => rise(n, t, at(i) + 0.15 + 0.08 * j, 0.35, 8));
  });
  who.style.opacity = seg(t, at(5) + 0.1, 0.15);
  who.style.transform = 'translateX(-50%) scale(' + (0.6 + 0.4 * pop(seg(t, at(5) + 0.1, 0.35))) + ')';
};`,
  });
}

/* 3. five-exits: five bars rise, one an exit, against a dashed red line for the bin; illustrative, no figures */
{
  const EXITS = [
    ["Kiranas", 0.72],
    ["Marketplace", 0.58],
    ["Staff sale", 0.44],
    ["Food bank", 0.3],
    ["Quick commerce", 0.22],
  ];
  const PX0 = 848, PX1 = 1700, BASEY = 830, CH = 500, BW = 112, BIN = 0.12;
  const CX = EXITS.map((_, i) => PX0 + ((PX1 - PX0) * (i + 0.5)) / 5);
  ANIMS.push({
    id: "five-exits",
    seconds: 4.0,
    eyebrow: "The Valuer",
    sub: "Every exit priced per unit, after costs and GST, against the bin.",
    tag: true,
    body: `
      <div class="baseline" style="left:${L(PX0)}px;top:${T(BASEY) - 1}px;width:${1772 - PX0}px"></div>
      ${EXITS.map((_, i) => `<div class="bar${i < 2 ? "" : " lite"}" style="left:${L(CX[i] - BW / 2)}px;top:${T(BASEY)}px;height:0"></div>`).join("")}
      ${EXITS.map(([n], i) => `<div class="xl" style="left:${L(CX[i])}px;top:${T(BASEY + 16)}px">${esc(n)}</div>`).join("")}
      <svg class="bin" viewBox="0 0 1098 858" width="1098" height="858"><line x1="${L(PX0)}" y1="${T(BASEY - BIN * CH)}" x2="${L(PX0)}" y2="${T(BASEY - BIN * CH)}"/></svg>
      <div class="binlab" style="left:${L(PX1 + 14)}px;top:${T(BASEY - BIN * CH) - 12}px">destroy</div>`,
    css: `
.baseline { position: absolute; height: 2px; background: var(--line-2); }
.bar { position: absolute; width: ${BW}px; border-radius: 10px 10px 0 0; background: var(--green-700); }
.bar.lite { background: var(--green-500); }
.xl { position: absolute; font-size: 20px; font-weight: 500; color: var(--fg-2); white-space: nowrap; opacity: 0; }
.bin { position: absolute; left: 0; top: 0; }
.bin line { stroke: #c2410c; stroke-width: 3; stroke-dasharray: 12 9; opacity: 0; }
.binlab { position: absolute; line-height: 24px; font-size: 18px; font-weight: 700; color: #c2410c; letter-spacing: 0.02em; opacity: 0; }`,
    js: `
const H = ${JSON.stringify(EXITS.map((e) => e[1]))};
const bars = $$('.bar'), labs = $$('.xl'), bin = $('.bin line'), binlab = $('.binlab');
const BASEY = ${T(BASEY)}, CH = ${CH}, X0 = ${L(PX0)}, X1 = ${L(PX1)};
window.render = (t) => {
  cardIn(t);
  H.forEach((h, i) => {
    const s0 = 0.5 + 0.15 * i;
    const hh = h * CH * easeOut(seg(t, s0, 0.75));
    bars[i].style.height = hh + 'px';
    bars[i].style.top = BASEY - hh + 'px';
    rise(labs[i], t, s0 + 0.25, 0.3, 6, 'translateX(-50%)');
  });
  const q = easeOut(seg(t, 3.0, 0.55));
  bin.setAttribute('x2', X0 + (X1 - X0) * q);
  bin.style.opacity = q > 0 ? 1 : 0;
  rise(binlab, t, 3.4, 0.3, 6);
};`,
  });
}

/* 4. ledger: recovered against written off as one bar filling from the left, and three tiles whose rings fill
      and check; illustrative, no figures */
{
  const LX = 808, LW = 488, RX = 1332, TILES = ["Kept out of landfill", "CO₂e avoided", "Meals served"];
  ANIMS.push({
    id: "ledger",
    seconds: 4.5,
    eyebrow: "Impact",
    sub: "One ledger: money, GST and impact, batch by batch.",
    tag: true,
    body: `
      <div class="lg" style="left:${L(LX)}px;top:${T(534)}px;width:${LW}px">
        <div class="lt">Recovered vs written off</div>
        <div class="rbar"><div class="reveal"><div class="full"><div class="seg g"></div><div class="seg r"></div></div></div></div>
        <div class="caps"><span class="c1">recovered</span><span class="c2">written off</span></div>
      </div>
      ${TILES.map((n, i) => `<div class="tile" style="left:${L(RX)}px;top:${T(402 + 140 * i)}px"><svg class="ring" viewBox="0 0 76 76"><circle class="trk" cx="38" cy="38" r="32"/><circle class="prg" cx="38" cy="38" r="32"/><path class="chk" d="M25 39l8.5 8.5L51.5 29"/></svg><div class="tt">${esc(n)}</div></div>`).join("")}`,
    css: `
.lg { position: absolute; }
.lt { font-size: 22px; font-weight: 600; color: var(--fg); margin-bottom: 16px; opacity: 0; }
.rbar { position: relative; height: 58px; border-radius: 14px; background: var(--fill); overflow: hidden; }
.reveal { position: absolute; left: 0; top: 0; bottom: 0; width: 0; overflow: hidden; }
.full { position: absolute; left: 0; top: 0; bottom: 0; width: ${LW}px; }
.seg { position: absolute; top: 0; bottom: 0; }
.seg.g { left: 0; width: 78%; background: var(--green-700); border-radius: 14px 0 0 14px; }
.seg.r { left: calc(78% + 3px); right: 0; background: repeating-linear-gradient(45deg, #c2410c 0 5px, rgb(194 65 12 / 0.14) 5px 13px); border-radius: 0 14px 14px 0; }
.caps { display: flex; justify-content: space-between; margin-top: 14px; font-size: 18px; font-weight: 600; }
.caps span { display: inline-block; opacity: 0; }
.c1 { color: var(--green-700); }
.c2 { color: #c2410c; }
.tile { position: absolute; width: 480px; height: 120px; border-radius: 18px; background: var(--surface-2); border: 1px solid var(--line); display: flex; align-items: center; gap: 20px; padding: 0 22px; opacity: 0; }
.ring { width: 76px; height: 76px; flex: none; }
.trk { fill: none; stroke: var(--line-2); stroke-width: 7; }
.prg { fill: none; stroke: var(--green-700); stroke-width: 7; stroke-linecap: round; transform: rotate(-90deg); transform-origin: 38px 38px; stroke-dasharray: 201.06; stroke-dashoffset: 201.06; opacity: 0; }
.chk { fill: none; stroke: var(--green-700); stroke-width: 4.5; stroke-linecap: round; stroke-linejoin: round; transform-origin: 38px 38px; transform: scale(0.5); opacity: 0; }
.tt { font-size: 22px; font-weight: 600; color: var(--fg); }`,
    js: `
const tiles = $$('.tile'), prg = $$('.prg'), chk = $$('.chk'), reveal = $('.reveal');
const CIRC = 2 * Math.PI * 32, LW = ${LW};
window.render = (t) => {
  cardIn(t);
  rise($('.lt'), t, 0.35, 0.4, 8);
  reveal.style.width = LW * easeOut(seg(t, 0.6, 1.8)) + 'px';
  rise($('.c1'), t, 1.3, 0.3, 6);
  rise($('.c2'), t, 2.3, 0.3, 6);
  tiles.forEach((el, i) => {
    rise(el, t, 0.5 + 0.3 * i, 0.5, 24);
    const r = easeOut(seg(t, 0.9 + 0.3 * i, 1.6));
    prg[i].style.strokeDashoffset = CIRC * (1 - r);
    prg[i].style.opacity = r > 0 ? 1 : 0;
    chk[i].style.opacity = seg(t, 2.5 + 0.3 * i, 0.12);
    chk[i].style.transform = 'scale(' + (0.5 + 0.5 * pop(seg(t, 2.5 + 0.3 * i, 0.35))) + ')';
  });
};`,
  });
}

const doc = (a) => `<!doctype html><html><head><meta charset="utf-8"><style>${BASE}${a.css}</style></head><body>
<div class="stage"><div class="card" id="card"><div class="head"><span class="eyebrow">${esc(a.eyebrow)}</span><div class="sub">${esc(a.sub)}</div></div>${a.body}</div>${a.tag ? '<div class="tag">illustrative</div>' : ""}</div>
<script>{${HELPERS}${a.js}}</script></body></html>`;

const browser = await chromium.launch();
for (const a of ANIMS) {
  if (only.size && !only.has(a.id)) continue;
  const dir = path.join(OUT, a.id);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  // a page of its own for each animation: setContent on one page keeps the window, so a second document's script
  // would collide with the first's top-level declarations and never define its own render
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  page.on("pageerror", (e) => { console.error(`${a.id}: page error: ${e.message}`); process.exitCode = 1; });
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") console.error(`${a.id}: console ${m.type()}: ${m.text()}`); });
  await page.setContent(doc(a), { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(120);
  const ok = await page.evaluate(() => typeof window.render === "function");
  if (!ok) throw new Error(`${a.id}: render(t) was not defined`);
  const frames = Math.round(a.seconds * FPS);
  for (let i = 0; i < frames; i++) {
    await page.evaluate((t) => window.render(t), i / FPS);
    await page.screenshot({ path: path.join(dir, `f-${String(i + 1).padStart(4, "0")}.png`), omitBackground: true });
  }
  await page.close();
  fs.writeFileSync(path.join(OUT, `${a.id}.json`), JSON.stringify({ id: a.id, frames, fps: FPS, seconds: a.seconds, hold: true }, null, 2) + "\n");
  console.log(`${a.id}: ${frames} frames, ${a.seconds} s → ${dir}`);
}
await browser.close();
