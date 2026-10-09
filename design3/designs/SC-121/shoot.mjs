// SC-121's stills: each shot loads a page from the design3 server (8787), in light or dark, at 1440 or 390 wide, holds
// it, and saves a PNG original into src/ (local only), then a WebP beside the design with cwebp.
//   node design3/designs/SC-121/shoot.mjs <jobs.json>
// A job: { url, out, width, theme, wait?, height?, full?, ls?: {localStorage}, js?: string (run after load), click?: [selector...], el?: selector, css?: string }
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
// the worktree's own install, else the main checkout's (a worktree has no node_modules)
const pw = "frontend/node_modules/.pnpm/playwright@1.63.0/node_modules/playwright/index.mjs";
const local = join(here, "../../..", pw);
const { chromium } = await import(existsSync(local) ? local : join(process.env.SC_MAIN || "/Users/arundutta/projects/smart-clearance", pw));
const jobs = JSON.parse(readFileSync(process.argv[2], "utf8"));
const browser = await chromium.launch();
for (const j of jobs) {
  const phone = j.width < 768;
  const ctx = await browser.newContext({
    viewport: { width: j.width, height: j.height || (phone ? 844 : 900) },
    deviceScaleFactor: phone ? 2 : 1,
    colorScheme: j.theme,
    hasTouch: phone,
    isMobile: phone,
  });
  await ctx.addInitScript(([t, ls]) => { try { localStorage.setItem("sc3-theme", t); for (const [k, v] of Object.entries(ls || {})) localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)); } catch (e) {} }, [j.theme, j.ls]);
  const page = await ctx.newPage();
  page.on("pageerror", e => console.error("pageerror", j.out, e.message));
  page.on("console", m => m.type() === "error" && console.error("console", j.out, m.text()));
  await page.goto(j.url, { waitUntil: "networkidle" });
  await page.waitForTimeout(j.wait ?? 1800);
  if (j.js) { await page.evaluate(j.js); await page.waitForTimeout(900); }
  if (j.css) await page.addStyleTag({ content: j.css });
  // images lower down load lazily: load them all before a crop
  await page.evaluate(() => document.querySelectorAll("img[loading=lazy]").forEach(i => (i.loading = "eager")));
  await page.waitForLoadState("networkidle"); await page.waitForTimeout(400);
  for (const sel of j.click || []) { await page.click(sel); await page.waitForTimeout(700); }
  const png = join(here, "src", j.out + ".png");
  mkdirSync(dirname(png), { recursive: true });
  if (j.el) await page.locator(j.el).first().screenshot({ path: png });
  else await page.screenshot({ path: png, fullPage: !!j.full });
  const webp = join(here, j.out + ".webp");
  mkdirSync(dirname(webp), { recursive: true });
  execFileSync("cwebp", ["-quiet", "-q", "82", png, "-o", webp]);
  console.log("shot", j.out);
  await ctx.close();
}
await browser.close();
