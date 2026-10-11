// The signature maker's stamps and seals (SC-174): each firm's rubber stamp, drawn, never generated. A distributor's is
// the trader's rectangle ("For RAKESH TRADERS ... Proprietor", the signature going between); a company's and an
// agency's is a round seal. The ink is broken by a fractal texture, as an impression is, and the paper is transparent.
// Every firm and number is fictional.
//   node design3/system/signatures/seals.mjs      writes system/img/seals/<id>.webp (via a PNG in src/)
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const PW = join(here, "../../../frontend/node_modules/.pnpm/playwright@1.63.0/node_modules/playwright/index.mjs");
const { chromium } = await import(process.env.SC_PLAYWRIGHT || PW);
const OUT = join(here, "../img/seals");
mkdirSync(OUT, { recursive: true });
mkdirSync(join(here, "src"), { recursive: true });

// id: a rectangle (firm, role) or a round seal (top, bottom, mid); each in its own ink
export const SEALS = {
  rakesh: { kind: "rect", firm: "RAKESH TRADERS", role: "Proprietor", ink: "#3f37a3" },
  lakshmi: { kind: "rect", firm: "LAKSHMI AGENCIES", role: "Partner", ink: "#38359c" },
  patil: { kind: "rect", firm: "PATIL DISTRIBUTORS", role: "Proprietor", ink: "#3f37a3" },
  gupta: { kind: "rect", firm: "GUPTA & SONS", role: "Partner", ink: "#38359c" },
  munchly: { kind: "round", top: "MUNCHLY FOODS LIMITED", bottom: "PUNE · 410501", mid: "★", ink: "#3b3a9e" },
  oce: { kind: "round", top: "ORANGE CITY ENVIRO SERVICES", bottom: "MPCB/SWM/NGP/0412", mid: "NAGPUR", ink: "#3d3699" },
  vwc: { kind: "round", top: "VIDARBHA WASTE CARE", bottom: "MPCB/SWM/NGP/0538", mid: "NAGPUR", ink: "#3d3699" },
  dgw: { kind: "round", top: "DECCAN GREEN WASTE MGMT", bottom: "TSPCB/SWM/HYD/0287", mid: "HYDERABAD", ink: "#3d3699" },
};

const rough = (seed) => `<filter id="r"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="${seed}" /><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -1.7 0 0 0 1.55" /><feComposite in="SourceGraphic" operator="in" /></filter>`;
function svg(id, s, seed) {
  const c = s.ink;
  if (s.kind === "rect")
    return `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="192" viewBox="0 0 180 96"><defs>${rough(seed)}</defs>
      <g filter="url(#r)" fill="${c}" stroke="${c}"><rect x="2" y="2" width="176" height="92" rx="6" fill="none" stroke-width="2.4"/><rect x="7" y="7" width="166" height="82" rx="4" fill="none" stroke-width="0.9"/>
      <text x="90" y="25" text-anchor="middle" font-size="${s.firm.length > 16 ? 11 : 12}" font-weight="700" stroke="none">For ${s.firm.replace("&", "&amp;")}</text>
      <text x="90" y="80" text-anchor="middle" font-size="10.5" font-weight="700" stroke="none">${s.role}</text></g></svg>`;
  // the top line runs 220° over the top, the bottom 116° under it, each sized to fit its arc
  const top = Math.min(9.6, 126 / (s.top.length * 0.7)), bottom = Math.min(7.6, 74 / (s.bottom.length * 0.7)), mid = s.mid.length > 2 ? (s.mid.length > 7 ? 7.6 : 9) : 16;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 100 100"><defs>${rough(seed)}
    <path id="t" d="M 15.23 62.65 A 37 37 0 1 1 84.77 62.65"/><path id="b" d="M 14.38 72.26 A 42 42 0 0 0 85.62 72.26"/></defs>
    <g filter="url(#r)" fill="none" stroke="${c}"><circle cx="50" cy="50" r="47.5" stroke-width="2.4"/><circle cx="50" cy="50" r="29" stroke-width="1.3"/>
    <text fill="${c}" stroke="none" font-size="${top}" font-weight="700" letter-spacing="0.6"><textPath href="#t" startOffset="50%" text-anchor="middle">${s.top}</textPath></text>
    <text fill="${c}" stroke="none" font-size="${bottom}" font-weight="700" letter-spacing="0.4"><textPath href="#b" startOffset="50%" text-anchor="middle">${s.bottom}</textPath></text>
    <text x="50" y="${s.mid.length > 2 ? 53 : 56}" text-anchor="middle" fill="${c}" stroke="none" font-size="${mid}" font-weight="700">${s.mid}</text></g></svg>`;
}

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
let seed = 3;
for (const [id, s] of Object.entries(SEALS)) {
  seed += 4;
  // the system's own type (DESIGN.md), loaded for the drawing
  await page.setContent(`<!doctype html><html><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@700&display=block"><style>html,body{margin:0;background:transparent}svg{display:block;font-family:Geist,sans-serif}</style></head><body>${svg(id, s, seed)}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  const png = join(here, "src", `seal-${id}.png`);
  await page.locator("svg").screenshot({ path: png, omitBackground: true });
  execFileSync("cwebp", ["-quiet", "-q", "90", "-alpha_q", "100", png, "-o", join(OUT, `${id}.webp`)]);
  console.log("seal", id);
}
await browser.close();
