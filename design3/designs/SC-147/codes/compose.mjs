// SC-147's compositor: renders a carton label (label.py's HTML) at its print size, prints it onto a base photo as ink
// does (a multiply blend, so the sticker's creases and the light stay, with a touch of blur), saves the photo, and reads
// every code back from the finished photo with Chromium's BarcodeDetector, so nothing ships that does not scan.
//   node design3/designs/SC-147/codes/compose.mjs <job.json>
// A job: { base, label, out, box: { x, y, w, h }, blur?, expect: { ean_13?, itf?, qr_code? } }
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const PW = "/Users/arundutta/projects/smart-clearance/frontend/node_modules/.pnpm/playwright@1.63.0/node_modules/playwright/index.mjs";
const { chromium } = await import(process.env.SC_PLAYWRIGHT || PW);
const jobs = JSON.parse(readFileSync(process.argv[2], "utf8"));
const browser = await chromium.launch({ channel: "chromium", args: ["--enable-experimental-web-platform-features", "--allow-file-access-from-files"] });
let failed = 0;
for (const j of [].concat(jobs)) {
  const ctx = await browser.newContext({ deviceScaleFactor: 2, viewport: { width: j.box.w, height: j.box.h } });
  const page = await ctx.newPage();
  // the label, printed at twice its size
  await page.goto("file://" + resolve(j.label));
  await page.evaluate(() => document.fonts.ready);
  const label = await page.screenshot({ type: "png" });
  // the photo: the base, the label multiplied onto it inside the print box
  const work = await ctx.newPage();
  await work.goto("file://" + resolve(dirname(j.label)) + "/");
  const png = await work.evaluate(async ({ base, label, box, blur }) => {
    const load = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
    const b = await load(base), l = await load("data:image/png;base64," + label);
    const c = document.createElement("canvas"); c.width = b.naturalWidth; c.height = b.naturalHeight;
    const x = c.getContext("2d"); x.drawImage(b, 0, 0);
    x.save(); x.globalCompositeOperation = "multiply"; x.filter = `blur(${blur}px)`;
    x.drawImage(l, box.x, box.y, box.w, box.h); x.restore();
    return c.toDataURL("image/png").split(",")[1];
  }, { base: "file://" + resolve(j.base), label: label.toString("base64"), box: j.box, blur: j.blur ?? 0.55 });
  mkdirSync(dirname(resolve(j.out)), { recursive: true });
  const outPng = resolve(j.out).replace(/\.webp$/, ".png");
  writeFileSync(outPng, Buffer.from(png, "base64"));
  // read the codes back from the finished photo
  const read = await work.evaluate(async src => {
    const i = new Image(); i.src = "data:image/png;base64," + src; await i.decode();
    const d = new BarcodeDetector({ formats: ["ean_13", "itf", "qr_code"] });
    return (await d.detect(i)).map(f => [f.format, f.rawValue]);
  }, png);
  const got = Object.fromEntries(read);
  const miss = Object.entries(j.expect || {}).filter(([k, v]) => got[k] !== v);
  if (miss.length) failed++;
  if (j.out.endsWith(".webp")) execFileSync("cwebp", ["-quiet", "-q", String(j.quality ?? 86), outPng, "-o", resolve(j.out)]);
  console.log(miss.length ? "FAIL" : "ok  ", j.out, JSON.stringify(read), miss.length ? "missing " + JSON.stringify(miss) : "");
  await ctx.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
