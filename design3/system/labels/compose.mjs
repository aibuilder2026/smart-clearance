// The label maker's compositor (SC-147): renders a carton label (label.py's HTML) at its print size, prints it onto a
// base photo's blank sticker as ink does (warped onto the sticker's quad in perspective, multiplied, so the paper's
// creases and the light stay, with a touch of blur), lays any cover over a line (packing tape, a thumb, a tear), and reads
// every code back from the finished photo with Chromium's BarcodeDetector, so nothing ships that does not scan.
//   node design3/system/labels/compose.mjs <jobs.json>
// A job: { base, label, out, quad: [[x, y] top-left, top-right, bottom-right, bottom-left], size: { w, h },
//          covers?: [{ on: line or [lines] ("batch", "mfg", "bb", "mrp"), kind: "tape" | "thumb" | "tear" }], blur?,
//          quality?,
//          expect?: { ean_13?, qr_code? }, scan?: false }
// `scan: false` keeps a photo whose codes are covered or too small to read. A PNG is written beside each WebP (keep it in
// a git-ignored src/ folder).
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const PW = new URL("../../../frontend/node_modules/.pnpm/playwright@1.63.0/node_modules/playwright/index.mjs", import.meta.url).pathname;
const { chromium } = await import(process.env.SC_PLAYWRIGHT || PW);
const jobs = JSON.parse(readFileSync(process.argv[2], "utf8"));
const browser = await chromium.launch({ channel: "chromium", args: ["--enable-experimental-web-platform-features", "--allow-file-access-from-files"] });

// the homography taking the rectangle w × h to the quad, as CSS matrix3d (column-major); the unit square to the quad
// after Heckbert, the rectangle scaled down to the unit square first
function matrix3d(w, h, q) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2;
  const sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (sx * dy2 - dx2 * sy) / den, k = (dx1 * sy - sx * dy1) / den;
  const a = x1 - x0 + g * x1, b = x3 - x0 + k * x3, d = y1 - y0 + g * y1, e = y3 - y0 + k * y3;
  return `matrix3d(${[a / w, d / w, 0, g / w, b / h, e / h, 0, k / h, 0, 0, 1, 0, x0, y0, 0, 1].map(n => +n.toFixed(9)).join(",")})`;
}

// a cover over a line, in the label's own pixels, so it warps with the label; drawn opaque, never multiplied
function cover(kind, r) {
  if (kind === "tape") {
    return `<div style="position:absolute;left:${r.x - 46}px;top:${r.y - 10}px;width:${r.w + 150}px;height:${r.h + 20}px;
      transform:rotate(-1.6deg);background:linear-gradient(180deg,#bf9466 0%,#a87c4f 38%,#b38759 62%,#9d7148 100%);
      box-shadow:0 1px 2px rgba(0,0,0,.35);opacity:.985">
      <div style="position:absolute;inset:18% 0 auto 0;height:22%;background:linear-gradient(90deg,transparent,rgba(255,240,215,.35),transparent)"></div></div>`;
  }
  if (kind === "thumb") {
    // a thumb come in from the right, holding the carton: its pad and nail over the lines' figures, running on off the
    // label towards the hand; level, so it never reaches the line above
    const th = r.h * 1.36, len = r.w * 0.86 + 260;
    return `<div style="position:absolute;left:${r.x + r.w * 0.14}px;top:${r.y - r.h * 0.18}px;width:${len}px;height:${th}px;
      transform:rotate(-1.2deg);border-radius:${th * 0.5}px 0 0 ${th * 0.5}px / ${th * 0.5}px 0 0 ${th * 0.5}px;
      background:linear-gradient(180deg,#dca487 0%,#ebbd9f 20%,#dba080 55%,#b9795a 85%,#97593e 100%);
      box-shadow:0 12px 24px rgba(40,20,10,.42),inset 0 -8px 14px rgba(120,60,40,.32);
      -webkit-mask-image:linear-gradient(90deg,#000 70%,rgba(0,0,0,.92));">
      <div style="position:absolute;left:3%;top:13%;width:${th * 0.66}px;height:60%;border-radius:50% 24% 24% 50% / 50%;
        background:linear-gradient(180deg,#f7e3d6,#e0b39d);box-shadow:inset 0 0 0 1.5px rgba(150,90,70,.4)"></div>
      <div style="position:absolute;left:${th * 1.25}px;top:22%;width:2.5px;height:56%;border-radius:2px;background:rgba(130,72,52,.35)"></div>
      <div style="position:absolute;left:${th * 1.38}px;top:26%;width:2px;height:48%;border-radius:2px;background:rgba(130,72,52,.28)"></div>
      <div style="position:absolute;right:0;top:0;bottom:0;width:38%;background:linear-gradient(90deg,transparent,rgba(110,58,38,.4))"></div></div>`;
  }
  // a tear: the label torn away over the line, the board showing through, a ragged paper edge round it
  const pts = [];
  for (let i = 0; i <= 14; i++) pts.push(`${(i / 14) * 100}% ${((i * 37) % 11) + 2}%`);
  for (let i = 14; i >= 0; i--) pts.push(`${(i / 14) * 100}% ${100 - (((i * 53) % 13) + 2)}%`);
  return `<div style="position:absolute;left:${r.x - 24}px;top:${r.y - 16}px;width:${r.w + 70}px;height:${r.h + 34}px;
    clip-path:polygon(${pts.join(",")});background:repeating-linear-gradient(90deg,#a47a50 0 3px,#9a7149 3px 6px),#a47a50"></div>`;
}

let failed = 0;
for (const j of [].concat(jobs)) {
  const size = j.size;
  // the label, printed at twice its size, and where its lines sit
  const lctx = await browser.newContext({ deviceScaleFactor: 2, viewport: { width: size.w, height: size.h } });
  const lp = await lctx.newPage();
  await lp.goto("file://" + resolve(j.label));
  await lp.evaluate(() => document.fonts.ready);
  await lp.waitForFunction(() => document.body.dataset.fit === "1");
  const label = (await lp.screenshot({ type: "png" })).toString("base64");
  const rects = await lp.evaluate(() => Object.fromEntries(["batch", "mfg", "bb", "mrp"].map(id => {
    const el = document.getElementById(id); if (!el) return [id, null];
    // the line's own text, not the box's width
    const range = document.createRange(); range.selectNodeContents(el); const r = range.getBoundingClientRect();
    return [id, { x: r.x, y: r.y, w: r.width, h: r.height }];
  })));
  await lctx.close();
  // the stage: the base at its natural size, the label warped onto the quad and multiplied, the covers above it
  const dims = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", resolve(j.base)]).toString();
  const W = +dims.match(/pixelWidth: (\d+)/)[1], H = +dims.match(/pixelHeight: (\d+)/)[1];
  const sctx = await browser.newContext({ deviceScaleFactor: 1, viewport: { width: W, height: H } });
  const work = await sctx.newPage();
  await work.goto("file://" + resolve(dirname(j.label)) + "/");
  const m = matrix3d(size.w, size.h, j.quad), blur = j.blur ?? 0.55;
  const union = on => [].concat(on).map(k => rects[k]).reduce((a, b) => ({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y),
    w: Math.max(a.x + a.w, b.x + b.w) - Math.min(a.x, b.x), h: Math.max(a.y + a.h, b.y + b.h) - Math.min(a.y, b.y) }));
  const covers = (j.covers || []).map(c => cover(c.kind, union(c.on))).join("");
  await work.setContent(`<!doctype html><html><body style="margin:0;width:${W}px;height:${H}px;overflow:hidden;position:relative;isolation:isolate">
    <img src="file://${resolve(j.base)}" style="position:absolute;inset:0;width:${W}px;height:${H}px">
    <img src="data:image/png;base64,${label}" style="position:absolute;left:0;top:0;width:${size.w}px;height:${size.h}px;transform-origin:0 0;transform:${m};mix-blend-mode:multiply;filter:blur(${blur}px)">
    <div style="position:absolute;left:0;top:0;width:${size.w}px;height:${size.h}px;transform-origin:0 0;transform:${m};filter:blur(${blur + 0.2}px)">${covers}</div>
    </body></html>`);
  await work.evaluate(async () => { for (const i of document.images) await i.decode(); });
  const photo = (await work.screenshot({ type: "png" })).toString("base64");
  mkdirSync(dirname(resolve(j.out)), { recursive: true });
  const outPng = resolve(j.png || j.out.replace(/\.webp$/, ".png"));
  mkdirSync(dirname(outPng), { recursive: true });
  writeFileSync(outPng, Buffer.from(photo, "base64"));
  // read the codes back from the finished photo
  const read = await work.evaluate(async src => {
    const i = new Image(); i.src = "data:image/png;base64," + src; await i.decode();
    return (await new BarcodeDetector({ formats: ["ean_13", "itf", "qr_code"] }).detect(i)).map(f => [f.format, f.rawValue]);
  }, photo);
  const got = Object.fromEntries(read);
  const miss = j.scan === false ? [] : Object.entries(j.expect || {}).filter(([k, v]) => got[k] !== v);
  if (miss.length) failed++;
  if (j.out.endsWith(".webp")) execFileSync("cwebp", ["-quiet", "-q", String(j.quality ?? 86), outPng, "-o", resolve(j.out)]);
  console.log(miss.length ? "FAIL" : "ok  ", j.out, JSON.stringify(read), miss.length ? "missing " + JSON.stringify(miss) : "");
  await sctx.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
