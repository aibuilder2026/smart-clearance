// SC-208: Priya's Record of the Masala Chips (MF-2409-117) on the live workspace (munchly-smartclearance.web.app), read
// only: the photos sent for the batch, its audit trail (every agent's run and every person's step, as Cloud SQL keeps
// them) and its yeses, at her tablet's size, frame-exact at 2x on the virtual clock (vclock.js), the page scrolled
// slowly from the photos down the audit trail. Priya is signed in as the journey suites sign people in (SC-95,
// frontend/workspace/tests/journey/auth.ts): backend-api/scripts/sessions.sh mints her a Firebase custom token, it is
// exchanged with the workspace's own browser key, and the session is left where the app's Firebase SDK keeps it. No
// password is handled, typed or printed, and nothing is sent but reads.
//   node capture-record.mjs <outdir>
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
const REPO = '/Users/arundutta/projects/smart-clearance';
const require = createRequire(`${REPO}/frontend/workspace/package.json`);
const { chromium } = require('@playwright/test');
const [out] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const ORIGIN = 'https://munchly-smartclearance.web.app', PATH = '/record/MF-2409-117';
const FPS = 25, HOLD = +(process.env.HOLD || 30), SCROLL = +(process.env.SCROLL || 150), N = HOLD + SCROLL + +(process.env.END || 20);

// production's public build settings for the workspace (the repository's variables), and Priya's session
const vars = JSON.parse(execFileSync('gh', ['variable', 'list', '--json', 'name,value'], { encoding: 'utf8', cwd: REPO }));
const v = (n) => vars.find((x) => x.name === n).value;
const apiKey = v('WORKSPACE_FIREBASE_API_KEY');
const people = JSON.parse(execFileSync(`${REPO}/backend-api/scripts/sessions.sh`, ['priya'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }));
const p = people.priya;
const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`, {
	method: 'POST', headers: { 'Content-Type': 'application/json', Referer: `${ORIGIN}/` },
	body: JSON.stringify({ token: p.token, returnSecureToken: true })
});
if (!r.ok) throw new Error(`Firebase refused the session: ${r.status}`);
const s = await r.json();
const user = { key: `firebase:authUser:${apiKey}:[DEFAULT]`, value: JSON.stringify({ uid: p.uid, email: p.email, emailVerified: false, isAnonymous: false, providerData: [],
	stsTokenManager: { refreshToken: s.refreshToken, accessToken: s.idToken, expirationTime: Date.now() + Number(s.expiresIn) * 1000 },
	createdAt: String(Date.now()), lastLoginAt: String(Date.now()), apiKey, appName: '[DEFAULT]' }) };

const browser = await chromium.launch({ headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu'] });
const ctx = await browser.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2, colorScheme: 'light', reducedMotion: 'no-preference', serviceWorkers: 'block' });
await ctx.addInitScript(({ origin, key, value }) => { if (location.origin === origin) localStorage.setItem(key, value); }, { origin: ORIGIN, ...user });
// never anything but reads: a write from this page is refused before it leaves
await ctx.route(/./, (route) => (['GET', 'HEAD', 'OPTIONS'].includes(route.request().method()) || /identitytoolkit|securetoken/.test(route.request().url()) ? route.continue() : route.abort()));
await ctx.addInitScript({ content: readFileSync(new URL('./vclock.js', import.meta.url), 'utf8') });
const page = await ctx.newPage();
page.on('console', (m) => m.type() === 'error' && console.log('page error:', m.text().slice(0, 200)));
await page.goto(ORIGIN + PATH, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.getByText('Audit trail', { exact: false }).first().waitFor({ timeout: 45000 });
await page.waitForTimeout(6000);
await page.evaluate(() => document.fonts.ready);
// the page's own scroller, and where the parts the film rings sit (in page px, before scrolling)
const meta = await page.evaluate(() => {
	const sc = [document.scrollingElement, ...document.querySelectorAll('main, #main, [class*="scroll"]')].find((e) => e && e.scrollHeight > e.clientHeight + 40) || document.scrollingElement;
	window.__sc = sc;
	const box = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return [r.x, r.y + sc.scrollTop, r.width, r.height]; };
	const byText = (t) => [...document.querySelectorAll('h1,h2,h3,h4,p,span,div,button')].find((e) => e.childElementCount <= 2 && e.textContent.trim().startsWith(t));
	return { scrollMax: sc.scrollHeight - sc.clientHeight, audit: box(byText('Audit trail')), yeses: box(byText('The yeses')), agents: box(byText('Agents')), label: box(byText('Label photo')) };
});
const top = Math.max(0, Math.min(meta.scrollMax, (meta.audit ? meta.audit[1] - 120 : meta.scrollMax)));
console.log(JSON.stringify(meta), 'to', top);
await page.evaluate(() => (window.__vt.follow = false));
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const ys = [];
for (let i = 0; i < N; i++) {
	const q = Math.min(1, Math.max(0, (i - HOLD) / SCROLL));
	const y = Math.round(top * ease(q));
	await page.evaluate((y) => { window.__sc.scrollTop = y; }, y);
	ys.push(y);
	await page.evaluate((d) => window.__vt.step(d), 1000 / FPS);
	await page.screenshot({ path: `${out}/f${String(i).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 94, animations: 'allow' });
	if (i % 40 === 0) console.log(i, '/', N);
}
writeFileSync(`${out}/meta.json`, JSON.stringify({ size: [1180, 820], ...meta, scroll: ys }, null, 1));
await browser.close();
