// The port's stills: the workspace app's stub build on a preview server, the journey put at a stage the way the e2e
// helper does (design3's core scripts run in the page to make the store, then written to localStorage), as Priya.
//   node design3/designs/SC-157/port-shots.mjs <jobs.json>
// A job: { path, out, width, theme, stage, after?: [acts], click?: [selectors], wait?, height? }; PORT and D3 env vars
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const pw = "frontend/node_modules/.pnpm/playwright@1.63.0/node_modules/playwright/index.mjs";
const local = join(here, "../../..", pw);
const { chromium } = await import(existsSync(local) ? local : join(process.env.SC_MAIN || "/Users/arundutta/projects/smart-clearance", pw));
const PORT = process.env.PORT || "4199", D3 = process.env.D3 || "http://127.0.0.1:8790";
const jobs = JSON.parse(readFileSync(process.argv[2], "utf8"));
const browser = await chromium.launch();
for (const j of jobs) {
  const phone = j.width < 768;
  const ctx = await browser.newContext({ viewport: { width: j.width, height: j.height || (phone ? 844 : 900) }, deviceScaleFactor: phone ? 2 : 1, colorScheme: j.theme, hasTouch: phone, isMobile: phone });
  const page = await ctx.newPage();
  page.on("pageerror", e => console.error("pageerror", j.out, e.message));
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: "load" });
  // the store at the stage, made by the prototype's own scripts, as tests/e2e/workspace.ts does in a sandbox
  const store = await page.evaluate(async ([d3, stage, after]) => {
    const w = window; w.SC3_IMG = "sc3img:/";
    for (const p of ["core/money.js", "core/data.js", "core/store.js", "core/flow.js"]) await new Promise((ok, no) => { const s = document.createElement("script"); s.src = `${d3}/${p}`; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
    w.SC3_FLOW.fastForward(stage); for (const a of after) w.SC3_FLOW.act(a);
    return JSON.stringify(w.SC3_STORE.get());
  }, [D3, j.stage, j.after || []]);
  await page.evaluate(([store, theme]) => { localStorage.setItem("sc3-store", store); localStorage.setItem("sc3-session", JSON.stringify({ uid: "priya", at: 1 })); localStorage.setItem("sc3-theme", theme); }, [store, j.theme]);
  await page.goto(`http://localhost:${PORT}${j.path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(j.wait ?? 1800);
  for (const sel of j.click || []) { await page.click(sel); await page.waitForTimeout(600); }
  const png = join(here, "src", j.out + ".png"); mkdirSync(dirname(png), { recursive: true });
  await page.screenshot({ path: png });
  const webp = join(here, j.out + ".webp"); mkdirSync(dirname(webp), { recursive: true });
  execFileSync("cwebp", ["-quiet", "-q", "82", png, "-o", webp]); console.log("shot", j.out);
  await ctx.close();
}
await browser.close();
