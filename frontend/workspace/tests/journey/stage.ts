import {
	chromium,
	expect,
	type Browser,
	type CDPSession,
	type Locator,
	type Page,
	type TestInfo
} from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import { ORIGIN, person, PROD, signInOnScreen, STAND_IN, type App } from './auth.ts';
import { ROLES, settled } from './flow.ts';
import { Run, type About } from './record.ts';

// Three screens at once (SC-179): a journey played out as it would be in the field. The supply chain operator holds a
// tablet in landscape and the distributor one in portrait (SC-184), and a phone serves everyone else (each kirana, the
// ExpireSoon buyer, Smart-Clearance staff in the console), side by side in one window. Everyone signs in on the app's
// own sign-in screen, on camera: the two tablets at the start, staying signed in to the end and moving from screen to
// screen in the app; the phone as each person is needed, the last one signing out of the workspace before the next
// signs in (the console stays signed in on its own address, as an app on a phone does: the console has no sign-out on a
// phone). The password check is answered with the person's own session (auth.ts signInOnScreen): no password is typed.
//
// The three screens run in a headless Chromium, each at its own size; each streams its frames (CDP screencast) into
// the stage, a page in a second headless Chromium that lays them out as devices, names who holds each, and captions who
// is acting and what they do. The stage itself is recorded: its frames are piped into ffmpeg at a steady 25 fps, so the
// recording is the stage as it was, every screen in it, timed as it happened. The stage is never a window on the
// screen, so nothing about a window (its size, a display it moves to) can crop what is recorded (SC-184: a visible stage
// window was captured cropped from a minute in); a monitor window shows the recorded frames live.
//
// Every screen draws a cursor (an init script): each click glides it to its target and ripples where it lands, a
// person reading glides it over what they read, and a pen drawing on a signature pad is followed exactly. A step ends
// only once every screen's photos and placeholders have landed.
//
// E2E_LIVE=0 opens no monitor window (the stage is recorded all the same).

export type PaneId = 'operator' | 'distributor' | 'phone';
/** a note the stage shows beside what a person reads: why it is done this way in a demo, or what to see there */
export type Note = { tag: string; title: string; text: string };

type PaneSpec = {
	label: string;
	size: string;
	viewport: { width: number; height: number };
	scale: number;
	/** the screencast's largest frame: the screen drawn on the stage at about twice its size, for a sharp recording */
	max: { width: number; height: number };
};

/** the stage, in CSS pixels (drawn at twice that, and recorded at 2560 × 1440) */
const W = 1720;
const H = 968;
const M = 14;
/** the bar along the top, and a device's label and address above it */
const TOP = 64;
const HEAD = 46;
/** a tablet's bezel and a phone's, each side */
const TAB_BEZEL = 11;
const PHONE_BEZEL = 9;
/** the distributor's tablet, in portrait, takes the stage's height */
const DIST_SCALE = (H - TOP - HEAD - M - 2 * TAB_BEZEL) / 1180;
const DIST_COL = 820 * DIST_SCALE + 2 * TAB_BEZEL;
const PHONE_SCALE = 0.78;
const PHONE_COL = 390 * PHONE_SCALE + 2 * PHONE_BEZEL;
/** the operator's tablet, in landscape, takes what is left, the narrator under it */
const OP_COL = W - 4 * M - DIST_COL - PHONE_COL;
const OP_SCALE = (OP_COL - 2 * TAB_BEZEL) / 1180;

const PANES: Record<PaneId, PaneSpec> = {
	operator: {
		label: 'Tablet',
		size: '1180 × 820 · landscape',
		viewport: { width: 1180, height: 820 },
		scale: OP_SCALE,
		max: { width: 1600, height: 1112 }
	},
	distributor: {
		label: 'Tablet',
		size: '820 × 1180 · portrait',
		viewport: { width: 820, height: 1180 },
		scale: DIST_SCALE,
		max: { width: 1180, height: 1698 }
	},
	phone: {
		label: 'Phone',
		size: '390 × 844',
		viewport: { width: 390, height: 844 },
		scale: PHONE_SCALE,
		max: { width: 700, height: 1515 }
	}
};
const COL: Record<PaneId, number> = { operator: OP_COL, distributor: DIST_COL, phone: PHONE_COL };

/** the recording's size */
const OUT = { width: 2560, height: 1440 };
const FPS = 25;
const LIVE = process.env.E2E_LIVE !== '0';
/** flags that keep every page drawing, so no screencast stalls */
const KEEP_DRAWING = [
	'--disable-backgrounding-occluded-windows',
	'--disable-renderer-backgrounding',
	'--disable-background-timer-throttling'
];
/** how long the cursor takes to glide to its target, and how long it rests there before the click */
const GLIDE = 520;

/** the cursor every screen draws: an arrow that follows the mouse, gliding, and a ripple where it presses. Its place
 *  is kept across a page's loads (sessionStorage), so it glides on from where it was */
const CURSOR = `(() => {
	if (window.__e2eCursor) return;
	window.__e2eCursor = true;
	const KEY = 'e2e-cursor';
	const at = () => { try { return JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch { return null; } };
	const make = () => {
		let c = document.getElementById('e2e-cursor');
		if (c) return c;
		c = document.createElement('div');
		c.id = 'e2e-cursor';
		c.setAttribute('aria-hidden', 'true');
		c.innerHTML = '<svg width="26" height="26" viewBox="0 0 26 26"><path d="M4 2.5v18.2l5-4.5 3.3 7.3 3.2-1.4-3.2-7.2 6.9-.3z" fill="#141a17" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
		c.style.cssText = 'position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;transition:transform ${GLIDE - 60}ms cubic-bezier(.25,.7,.2,1);filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))';
		const p = at() || [innerWidth * 0.55, innerHeight * 0.62];
		c.style.transform = 'translate(' + p[0] + 'px,' + p[1] + 'px)';
		document.documentElement.appendChild(c);
		return c;
	};
	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', make); else make();
	addEventListener('mousemove', (e) => {
		const c = make();
		// a pen on a pad is followed exactly; otherwise the cursor glides to where the mouse went
		c.style.transitionDuration = e.buttons & 1 ? '0ms' : '${GLIDE - 60}ms';
		c.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)';
		try { sessionStorage.setItem(KEY, JSON.stringify([e.clientX, e.clientY])); } catch {}
	}, true);
	addEventListener('mousedown', (e) => {
		// no ripple for a pen touching a signature pad: it draws
		if (e.target instanceof Element && e.target.closest('.signpad')) return;
		const r = document.createElement('div');
		r.setAttribute('aria-hidden', 'true');
		r.style.cssText = 'position:fixed;left:' + (e.clientX - 22) + 'px;top:' + (e.clientY - 22) + 'px;width:44px;height:44px;border-radius:50%;border:3px solid #f5c542;background:rgba(245,197,66,.28);z-index:2147483646;pointer-events:none;transform:scale(.35);opacity:1;transition:transform .5s ease-out,opacity .6s ease-out';
		document.documentElement.appendChild(r);
		requestAnimationFrame(() => requestAnimationFrame(() => { r.style.transform = 'scale(1.5)'; r.style.opacity = '0'; }));
		setTimeout(() => r.remove(), 800);
	}, true);
})();`;

type Pane = {
	id: PaneId;
	page: Page;
	cdp: CDPSession;
	/** who holds it now, and in which app */
	who: string | null;
	app: App | null;
	/** who is signed in to each app on it: the console stays signed in on its own address while the phone is in the
	 *  workspace */
	signedIn: Partial<Record<App, string>>;
	lastFrame: number;
};

/** the people who keep a screen of their own; everyone else takes the phone */
const HOLDS: Record<string, PaneId> = { priya: 'operator', rakesh: 'distributor' };

const initials = (name: string) =>
	name
		.replace(/\b(ji|bhai)\b/gi, '')
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((w) => w[0]!.toUpperCase())
		.join('');
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const appOf = (who: string): App => (who === 'neha' ? 'console' : 'workspace');
const roleOf = (who: string) => ROLES[who] ?? `Kirana · ${person(who).org}`;

/** a run whose caption, step log and stills are the stage's */
class StageRun extends Run {
	constructor(
		page: Page,
		info: TestInfo,
		about: About,
		private board: Stage
	) {
		super(page, info, about);
		this.shotScale = 'css';
	}
	protected override async draw() {
		const { who, role, did } = this.caption;
		if (!who || !this.board) return;
		await this.board.caption(who, role, did, this.stage);
	}
	protected override screens() {
		return this.board.pages();
	}
	override async done(did: string, settle?: number) {
		// every screen fully drawn first: its photos landed, its placeholders gone
		await Promise.all(this.board.pages().map((p) => loaded(p, 6000)));
		await super.done(did, settle);
		await this.board.log(this.steps.length, did);
	}
}

/** a screen has finished drawing: every image in view has landed, and no loading placeholder is left */
export async function loaded(page: Page, timeout = 12_000) {
	await page
		.waitForFunction(
			() => {
				const shown = (el: Element) => {
					const r = el.getBoundingClientRect();
					return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight;
				};
				const images = [...document.images].filter((i) => i.id !== 'e2e-cursor' && shown(i));
				if (images.some((i) => !i.complete || i.naturalWidth === 0)) return false;
				return ![...document.querySelectorAll('.skeleton, .cs-splash, [aria-busy="true"]')].some(shown);
			},
			null,
			{ timeout, polling: 200 }
		)
		.catch(() => {});
}

export class Stage {
	readonly run: Run;
	private panes = {} as Record<PaneId, Pane>;
	private latest: Partial<Record<PaneId, string>> = {};
	private pumping = false;
	private timers: NodeJS.Timeout[] = [];
	/** the stage's newest frame: as the recording writes it, and as the monitor shows it */
	private frame: Buffer | null = null;
	private frame64: string | null = null;
	private shown: string | null = null;
	private ffmpeg: ChildProcess | null = null;
	private written = 0;
	private recording = 0;
	private ended: Promise<void> | null = null;
	/** the note on the sign-ins has been shown */
	private told = false;

	private constructor(
		private stageBrowser: Browser,
		private paneBrowser: Browser,
		private monitor: Page | null,
		readonly stage: Page,
		info: TestInfo,
		about: About,
		readonly video: string
	) {
		this.run = new StageRun(stage, info, about, this);
	}

	/** opens the stage and its three screens, each on its app's sign-in screen; the recording starts with record() */
	static async open(info: TestInfo, about: About, video: string): Promise<Stage> {
		const stageBrowser = await chromium.launch({ headless: true, args: KEEP_DRAWING });
		const paneBrowser = await chromium.launch({ headless: true, args: KEEP_DRAWING });
		const ctx = await stageBrowser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
		const stage = await ctx.newPage();
		await stage.setContent(STAGE_HTML(about));
		await stage.evaluate(() => document.fonts.ready);
		let monitor: Page | null = null;
		if (LIVE) {
			// the monitor: a window that shows the stage as it is recorded, whatever its size
			const mb = await chromium.launch({
				headless: false,
				args: [...KEEP_DRAWING, '--window-position=0,0', '--window-size=1440,860']
			});
			monitor = await (await mb.newContext({ viewport: null })).newPage();
			// the stage's own dark ground until its first frame arrives
			await monitor.setContent(
				`<!doctype html><title>Munchly Chips Sad Path E2E · the stage, live</title><style>html,body{margin:0;height:100%;background:#0c1311}img{width:100vw;height:100vh;object-fit:contain;display:block}</style><img id="m" src="${WAITING}" alt="The stage, as it is recorded">`
			);
		}
		const s = new Stage(stageBrowser, paneBrowser, monitor, stage, info, about, video);
		for (const id of Object.keys(PANES) as PaneId[]) await s.addPane(id);
		s.timers.push(setInterval(() => void s.pump(), 50));
		s.timers.push(setInterval(() => void s.watchdog(), 3000));
		if (monitor) s.timers.push(setInterval(() => void s.show(), 160));
		return s;
	}

	private async addPane(id: PaneId) {
		const spec = PANES[id];
		const ctx = await this.paneBrowser.newContext({
			viewport: spec.viewport,
			deviceScaleFactor: 2,
			isMobile: true,
			hasTouch: true,
			colorScheme: 'light',
			// a live build registers a service worker; the dev servers register none (playwright.journey.config.ts)
			serviceWorkers: 'block'
		});
		ctx.setDefaultTimeout(20_000);
		await ctx.addInitScript(CURSOR);
		const page = await ctx.newPage();
		// a sign-in on the app's own screen, its password check answered with the person's session (auth.ts)
		await signInOnScreen(page);
		const cdp = await ctx.newCDPSession(page);
		const pane: Pane = { id, page, cdp, who: null, app: null, signedIn: {}, lastFrame: 0 };
		cdp.on('Page.screencastFrame', (f: { data: string; sessionId: number }) => {
			this.latest[id] = f.data;
			pane.lastFrame = Date.now();
			cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
		});
		this.panes[id] = pane;
		this.run.watch(page);
		await this.cast(pane);
	}

	private async cast(pane: Pane) {
		const { max } = PANES[pane.id];
		await pane.cdp
			.send('Page.startScreencast', {
				format: 'jpeg',
				quality: 84,
				maxWidth: max.width,
				maxHeight: max.height,
				everyNthFrame: 1
			})
			.catch(() => {});
	}

	/** a screen asked for a fresh frame: a quiet page, or one whose renderer was swapped on a navigation */
	private async recast(pane: Pane) {
		await pane.cdp.send('Page.stopScreencast').catch(() => {});
		await this.cast(pane);
	}

	private async watchdog() {
		for (const pane of Object.values(this.panes)) if (Date.now() - pane.lastFrame > 6000) await this.recast(pane);
	}

	/** the screens' newest frames onto the stage, at most one a screen per tick */
	private async pump() {
		if (this.pumping) return;
		const batch = Object.entries(this.latest);
		if (!batch.length) return;
		this.pumping = true;
		this.latest = {};
		try {
			await this.stage.evaluate((b) => {
				for (const [id, data] of b)
					(document.getElementById(`scr-${id}`) as HTMLImageElement).src = `data:image/jpeg;base64,${data}`;
			}, batch);
		} catch {
			/* the stage is closing */
		} finally {
			this.pumping = false;
		}
	}

	/** the monitor window shows the stage's newest frame */
	private async show() {
		if (!this.monitor || !this.frame64 || this.frame64 === this.shown) return;
		this.shown = this.frame64;
		await this.monitor
			.evaluate(
				(d) => ((document.getElementById('m') as HTMLImageElement).src = `data:image/jpeg;base64,${d}`),
				this.shown
			)
			.catch(() => {});
	}

	/** every screen on its app's sign-in screen, fully drawn, before anything is recorded */
	async ready(apps: Record<PaneId, App>) {
		for (const id of Object.keys(apps) as PaneId[]) {
			const page = this.panes[id].page;
			await page.goto(ORIGIN[apps[id]] + '/');
			await settled(page);
			await expect(page.locator('#si-email')).toBeVisible({ timeout: 30_000 });
			await loaded(page);
			await this.address(id);
		}
		await this.stage.waitForTimeout(800);
	}

	/** the stage, recorded from now on: its screencast's newest frame written to ffmpeg 25 times a second */
	async record() {
		const cdp = await this.stage.context().newCDPSession(this.stage);
		cdp.on('Page.screencastFrame', (f: { data: string; sessionId: number }) => {
			this.frame64 = f.data;
			this.frame = Buffer.from(f.data, 'base64');
			cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
		});
		await cdp.send('Page.startScreencast', {
			format: 'jpeg',
			quality: 90,
			maxWidth: OUT.width,
			maxHeight: OUT.height + 1,
			everyNthFrame: 1
		});
		const ff = spawn(
			'ffmpeg',
			[
				...['-hide_banner', '-loglevel', 'error', '-y'],
				...['-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(FPS), '-i', 'pipe:0'],
				...['-vf', `scale=${OUT.width}:${OUT.height}:flags=lanczos,format=yuv420p`],
				...['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-movflags', '+faststart'],
				this.video
			],
			{ stdio: ['pipe', 'ignore', 'inherit'] }
		);
		this.ffmpeg = ff;
		this.ended = new Promise((done) => ff.on('close', () => done()));
		ff.stdin!.on('error', () => {});
		await this.stage.evaluate(() => (window as unknown as { startClock: () => void }).startClock());
		this.recording = Date.now();
		this.timers.push(
			setInterval(() => {
				if (!this.frame) return;
				const due = Math.floor(((Date.now() - this.recording) * FPS) / 1000);
				while (this.written < due) {
					ff.stdin!.write(this.frame);
					this.written++;
				}
			}, 20)
		);
	}

	pages() {
		return Object.values(this.panes).map((p) => p.page);
	}

	pane(id: PaneId) {
		return this.panes[id].page;
	}

	/** the screen a person acts on: their own, or the phone */
	paneOf(who: string): PaneId {
		return HOLDS[who] ?? 'phone';
	}

	/** who holds a screen, as its label names them */
	private async hold(id: PaneId, who: string | null, app: App | null) {
		const p = who ? person(who) : null;
		const org = !p || who === 'neha' || ROLES[who!] === undefined || who === 'agrawal' ? '' : p.org;
		await this.stage.evaluate(
			([id, ini, name, sub]) => {
				document.getElementById(`ini-${id}`)!.textContent = ini;
				document.getElementById(`name-${id}`)!.textContent = name;
				document.getElementById(`sub-${id}`)!.textContent = sub;
			},
			[
				id,
				p ? initials(p.name) : '·',
				p ? p.name : 'Signed out',
				p ? [roleOf(who!), org].filter(Boolean).join(' · ') + (app === 'console' ? ' · console' : '') : PANES[id].label
			] as const
		);
	}

	/** a screen that stays signed in loads again where it is (after a reset the stream does not announce): the app's own
	 *  loader shows while it reads the fresh journey */
	async refresh(who: string) {
		const pane = this.panes[this.paneOf(who)];
		await pane.page.reload();
		await settled(pane.page);
		if (pane.app === 'workspace') await expect(pane.page.locator('#main')).toBeVisible();
		await loaded(pane.page);
	}

	/** someone opens an app at a path on their screen, the caption naming them and what they are about to do. A screen
	 *  already theirs moves within the app, as a click would; a phone handed over is signed out of the workspace by the
	 *  one who had it, and the next person signs in on the app's own screen */
	async open(who: string, path: string, did: string, app: App = appOf(who)) {
		const id = this.paneOf(who);
		const pane = this.panes[id];
		const p = person(who);
		await this.run.act(p.name, roleOf(who), did);
		await this.active(id);
		if (pane.who !== who || pane.app !== app) await this.handOver(pane, who, app);
		await this.go(pane.page, app, path);
		await settled(pane.page);
		if (app === 'workspace') await expect(pane.page.locator('#main')).toBeVisible();
		await loaded(pane.page);
		await this.address(id);
		return pane.page;
	}

	/** the screen passes to someone: whoever is in the workspace on it signs out first, then the next person signs in
	 *  to their app (or finds it still signed in, the console on a phone) */
	private async handOver(pane: Pane, who: string, app: App) {
		if (pane.signedIn.workspace && pane.signedIn.workspace !== who) await this.signOut(pane);
		if (pane.signedIn[app] === who) {
			// still signed in on that app's address: the phone switches to it
			await pane.page.goto(ORIGIN[app] + '/');
			await settled(pane.page);
		} else await this.signIn(pane, who, app);
		pane.who = who;
		pane.app = app;
		await this.hold(pane.id, who, app);
	}

	/** signs a person in on the app's own sign-in screen: their email typed, the password field given the stand-in (the
	 *  check is answered with their session, auth.ts), Sign in pressed, the app's welcome and its splash; a workspace asks
	 *  once on a device about notifications, and the person says Not now */
	private async signIn(pane: Pane, who: string, app: App) {
		const page = pane.page;
		if (new URL(page.url()).origin !== ORIGIN[app]) {
			await page.goto(ORIGIN[app] + '/');
			await settled(page);
		}
		await this.address(pane.id);
		const email = page.locator('#si-email');
		await expect(email).toBeVisible({ timeout: 30_000 });
		await loaded(page);
		await this.type(email, person(who).email);
		await this.type(page.locator('#si-pw'), STAND_IN);
		// said once, at the first sign-in: what the password field holds
		if (!this.told) {
			this.told = true;
			await this.spot(page.locator('#si-pw'), {
				tag: 'Note',
				title: 'No password is typed',
				text: "Each person signs in on the app's own sign-in screen. The password field takes a stand-in, and the suite answers Firebase's password check with that person's own session: no real password is typed or sent. Everything after it is the app's own."
			});
		}
		await this.click(page.getByRole('button', { name: 'Sign in', exact: true }), 200);
		await expect(page.getByRole('button', { name: /^Welcome, / }).or(page.locator('#main'))).toBeVisible({
			timeout: 30_000
		});
		await settled(page);
		if (app === 'workspace') {
			const later = page.locator('.lv-step-acts').getByRole('button', { name: /^(Not now|Continue to )/ });
			await expect(page.locator('#main')).toBeVisible({ timeout: 30_000 });
			if (await later.isVisible().catch(() => false)) {
				await loaded(page);
				await this.point(page.locator('.lv-step-t'), 500);
				await this.click(later, 400);
				await expect(later).toBeHidden();
			}
		}
		await loaded(page);
		pane.signedIn[app] = who;
	}

	/** signs whoever is in the workspace on a screen out, from Profile: the app's own sign-out, back to its sign-in */
	private async signOut(pane: Pane) {
		const page = pane.page;
		if (new URL(page.url()).origin !== ORIGIN.workspace) {
			await page.goto(ORIGIN.workspace + '/');
			await settled(page);
		}
		await expect(page.locator('#main')).toBeVisible();
		await this.click(page.getByRole('button', { name: 'Profile and settings' }).first(), 500);
		await loaded(page);
		const out = page.locator('#main').getByRole('button', { name: /^Sign out/ });
		await out.scrollIntoViewIfNeeded();
		await this.click(out, 300);
		await settled(page);
		await expect(page.locator('#si-email')).toBeVisible({ timeout: 30_000 });
		await loaded(page);
		delete pane.signedIn.workspace;
		pane.who = null;
		pane.app = null;
		await this.hold(pane.id, null, null);
		await this.address(pane.id);
	}

	/** moves within the app as a link would (SvelteKit's router takes the click), or loads the address if it does not */
	private async go(page: Page, app: App, path: string) {
		const want = (u: URL) => u.pathname + u.search === path;
		if (want(new URL(page.url()))) return;
		await page.evaluate((p) => {
			const a = document.createElement('a');
			a.href = p;
			a.style.display = 'none';
			document.body.appendChild(a);
			a.click();
			a.remove();
		}, path);
		const moved = await page
			.waitForURL(want, { timeout: 5000 })
			.then(() => true)
			.catch(() => false);
		if (!moved) await page.goto(ORIGIN[app] + path);
	}

	/** the screen scrolls, smoothly, until an element is in view, sideways too inside a scroller; then waits for it to
	 *  stop moving. A person scrolling to what they read, rather than the page jumping */
	async reveal(target: Locator) {
		// an element that is not there is passed over, rather than waited on
		if (
			!(await target
				.first()
				.waitFor({ state: 'attached', timeout: 3000 })
				.then(() => true)
				.catch(() => false))
		)
			return false;
		await target
			.evaluate(
				(el) =>
					new Promise<void>((done) => {
						const r = el.getBoundingClientRect();
						const shown = r.top >= 64 && r.bottom <= innerHeight - 8 && r.left >= 0 && r.right <= innerWidth;
						if (!shown)
							el.scrollIntoView({
								behavior: 'smooth',
								block: r.height > innerHeight * 0.7 ? 'start' : 'center',
								inline: 'nearest'
							});
						let last = '',
							still = 0;
						const t0 = performance.now();
						const tick = () => {
							const b = el.getBoundingClientRect();
							const at = `${Math.round(b.top)},${Math.round(b.left)}`;
							still = at === last ? still + 1 : 0;
							last = at;
							if (still > 6 || performance.now() - t0 > 2000) done();
							else requestAnimationFrame(tick);
						};
						requestAnimationFrame(tick);
					})
			)
			.catch(() => {});
		return true;
	}

	/** a block wider than its screen, read across: its scroller (the block or the nearest one round it) pans smoothly to
	 *  its far side and back. Nothing happens to a block that fits */
	async pan(target: Locator, rest = 900) {
		const page = target.page();
		const wide = await target
			.evaluate((el) => {
				let n: Element | null = el;
				while (n && n !== document.body) {
					const cs = getComputedStyle(n);
					if (/(auto|scroll)/.test(cs.overflowX) && n.scrollWidth > n.clientWidth + 4) {
						(n as HTMLElement).dataset.e2ePan = '1';
						return true;
					}
					n = n.parentElement;
				}
				return false;
			})
			.catch(() => false);
		if (!wide) return false;
		const scroller = page.locator('[data-e2e-pan="1"]').first();
		await this.ring(scroller);
		await scroller.evaluate((el) => el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' }));
		await page.waitForTimeout(1200 + rest);
		await scroller.evaluate((el) => el.scrollTo({ left: 0, behavior: 'smooth' }));
		await page.waitForTimeout(900);
		await scroller.evaluate((el) => delete (el as HTMLElement).dataset.e2ePan);
		await this.unring();
		return true;
	}

	/** the cursor glides to an element, and rests on it: a person reading it, or about to press it. A rest long enough to
	 *  read lights the element with the stage's ring meanwhile */
	async point(target: Locator, rest = 350) {
		const page = target.page();
		if (!(await this.reveal(target))) return;
		const box = await target.boundingBox().catch(() => null);
		if (!box) return;
		await page.mouse.move(box.x + box.width / 2, box.y + Math.min(box.height / 2, 24));
		if (rest >= 400) {
			await page.waitForTimeout(GLIDE - 120);
			await this.ring(target);
			await page.waitForTimeout(120 + rest);
			await this.unring();
		} else await page.waitForTimeout(GLIDE + rest);
	}

	/** an element read with a note: the screen scrolls to it, the rest of its screen dims, a ring lights it, and a card
	 *  beside it says why (a tag, a title and a sentence or two), held long enough to read, then gone */
	async spot(target: Locator, note: Note, hold?: number) {
		const page = target.page();
		if (!(await this.reveal(target))) return;
		const box = await target.boundingBox().catch(() => null);
		if (box) await page.mouse.move(box.x + box.width / 2, box.y + Math.min(box.height / 2, 24));
		await page.waitForTimeout(GLIDE - 120);
		await this.ring(target, note);
		await page.waitForTimeout(hold ?? Math.min(8500, Math.max(4500, (note.title.length + note.text.length) * 34)));
		await this.unring();
		await page.waitForTimeout(300);
	}

	/** the ring round an element on the stage (and the dim and the card for a note), placed from where the element sits
	 *  on its screen */
	private async ring(target: Locator, note?: Note) {
		const page = target.page();
		const pane = Object.values(this.panes).find((p) => p.page === page);
		const box = await target.boundingBox().catch(() => null);
		if (!pane || !box) return;
		const vp = PANES[pane.id].viewport;
		await this.stage
			.evaluate(
				([id, b, vw, note]) => {
					const fx = document.getElementById(`fx-${id}`)!;
					const scr = document.getElementById(`scr-${id}`)!.getBoundingClientRect();
					const k = scr.width / vw;
					// the ring hugs the element, a few pixels out, kept inside the screen
					const pad = 5;
					const x = Math.max(2, b.x * k - pad),
						y = Math.max(2, b.y * k - pad);
					const w = Math.min(scr.width - x - 2, b.width * k + 2 * pad),
						h = Math.min(scr.height - y - 2, b.height * k + 2 * pad);
					const ring = document.createElement('div');
					ring.className = note ? 'ring dim' : 'ring';
					Object.assign(ring.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
					fx.appendChild(ring);
					requestAnimationFrame(() => ring.classList.add('on'));
					if (!note) return;
					// the card beside the element: under it where the stage has room, else over it, its arrow on the element
					const card = document.createElement('div');
					card.className = 'callout';
					card.innerHTML =
						'<div class="co-head"><span class="co-tag"></span><b></b></div><p></p><i class="co-arrow"></i>';
					card.querySelector('.co-tag')!.textContent = note.tag;
					card.querySelector('b')!.textContent = note.title;
					card.querySelector('p')!.textContent = note.text;
					document.getElementById('callouts')!.appendChild(card);
					const cw = card.offsetWidth,
						ch = card.offsetHeight;
					const ex = scr.left + x,
						ey = scr.top + y;
					const below = ey + h + 16 + ch < innerHeight - 10;
					const top = below ? ey + h + 16 : Math.max(60, ey - ch - 16);
					const left = Math.min(innerWidth - cw - 12, Math.max(12, ex + Math.min(w, 220) / 2 - 40));
					Object.assign(card.style, { left: `${left}px`, top: `${top}px` });
					card.classList.add(below ? 'below' : 'above');
					const arrow = card.querySelector('.co-arrow') as HTMLElement;
					arrow.style.left = `${Math.min(cw - 28, Math.max(16, ex + Math.min(w, 220) / 2 - left - 7))}px`;
					requestAnimationFrame(() => card.classList.add('on'));
				},
				[pane.id, box, vp.width, note ?? null] as const
			)
			.catch(() => {});
	}

	/** the rings and cards fade away */
	private async unring() {
		await this.stage
			.evaluate(() => {
				for (const el of document.querySelectorAll('.ring, .callout')) {
					el.classList.remove('on');
					setTimeout(() => el.remove(), 320);
				}
			})
			.catch(() => {});
	}

	/** a click as a person makes it: the cursor glides there, rests, presses (a ripple), and the screen answers */
	async click(target: Locator, after = 300) {
		await this.point(target, 120);
		await target.click();
		await target.page().waitForTimeout(after);
	}

	/** typed as a person types it, after a click into the field */
	async type(field: Locator, text: string) {
		await this.click(field, 100);
		await field.fill('');
		await field.pressSequentially(text, { delay: 55 });
	}

	/** a choice from a list, after the cursor reaches it */
	async select(field: Locator, label: string) {
		await this.point(field, 150);
		await field.selectOption({ label });
		await field.page().waitForTimeout(350);
	}

	/** a file chosen as a person chooses it: a click on the button, and the file picked in the dialog that opens */
	async upload(button: Locator, file: string) {
		const page = button.page();
		const chooser = page.waitForEvent('filechooser');
		await this.click(button, 0);
		await (await chooser).setFiles(file);
		await page.waitForTimeout(500);
	}

	/** the page scrolled smoothly, by a share of the screen's height, as a person reading it scrolls */
	async scroll(page: Page, by = 0.6) {
		await page.mouse.wheel(0, Math.round((page.viewportSize()?.height ?? 820) * by));
		await page.waitForTimeout(700);
	}

	/** the address a screen shows, under its label */
	async address(id: PaneId) {
		const u = new URL(this.panes[id].page.url());
		await this.stage
			.evaluate(([id, a]) => (document.getElementById(`url-${id}`)!.textContent = a), [
				id,
				u.host + u.pathname
			] as const)
			.catch(() => {});
	}

	/** the screen being acted on, lit */
	async active(id: PaneId) {
		await this.stage.evaluate((id) => {
			for (const el of document.querySelectorAll('.dev')) el.classList.toggle('on', el.id === `dev-${id}`);
		}, id);
	}

	async caption(who: string, role: string, did: string, step: string) {
		await this.stage
			.evaluate(
				([who, role, did, step]) => {
					document.getElementById('cap-who')!.textContent = who;
					document.getElementById('cap-role')!.textContent = role;
					document.getElementById('cap-did')!.textContent = did;
					document.getElementById('step')!.textContent = step ? `Step ${step}` : '';
				},
				[who, role, did, step] as const
			)
			.catch(() => {});
	}

	/** the step under way, as the narrator heads it */
	async chapter(title: string) {
		await this.stage.evaluate((t) => (document.getElementById('chapter')!.textContent = t), title).catch(() => {});
	}

	/** a figure the narrator keeps in view (the scheme's orders, the packs left …) */
	async stat(key: string, label: string, value: string) {
		await this.stage
			.evaluate(
				([key, label, value]) => {
					let el = document.getElementById(`stat-${key}`);
					if (!el) {
						el = document.createElement('div');
						el.id = `stat-${key}`;
						el.className = 'stat';
						el.innerHTML = '<b></b><span></span>';
						document.getElementById('stats')!.appendChild(el);
					}
					el.querySelector('b')!.textContent = value;
					el.querySelector('span')!.textContent = label;
				},
				[key, label, value] as const
			)
			.catch(() => {});
	}

	async log(n: number, did: string) {
		await this.stage
			.evaluate(
				([n, did]) => {
					const ol = document.getElementById('log')!;
					const li = document.createElement('li');
					li.innerHTML = `<i>${n}</i><span></span>`;
					li.querySelector('span')!.textContent = did;
					ol.prepend(li);
					while (ol.children.length > 7) ol.lastElementChild!.remove();
				},
				[n, did] as const
			)
			.catch(() => {});
	}

	/** the recording ends with a held last frame; then every browser closes */
	async close() {
		await new Promise((r) => setTimeout(r, 2500));
		for (const t of this.timers) clearInterval(t);
		this.ffmpeg?.stdin?.end();
		await this.ended;
		await this.paneBrowser.close().catch(() => {});
		await this.stageBrowser.close().catch(() => {});
		await this.monitor
			?.context()
			.browser()
			?.close()
			.catch(() => {});
	}
}

// ---------------------------------------------------------------------------------------------------------------
// The stage: the operator's tablet in landscape with the narrator under it, the distributor's in portrait, and the
// phone, each under its holder's name and the address it shows

const px = (n: number) => `${Math.round(n)}px`;
/** a screen before its first frame: blank white, as a device waking */
const BLANK =
	'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%221%22 height=%221%22%3E%3Crect width=%221%22 height=%221%22 fill=%22%23fff%22/%3E%3C/svg%3E';
/** the monitor before the stage's first frame: the stage's dark ground, in its 16:9 */
const WAITING =
	'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%229%22%3E%3Crect width=%2216%22 height=%229%22 fill=%22%230c1311%22/%3E%3C/svg%3E';
const scr = (id: PaneId) => ({
	w: PANES[id].viewport.width * PANES[id].scale,
	h: PANES[id].viewport.height * PANES[id].scale
});

function STAGE_HTML(about: About) {
	const O = scr('operator');
	const opH = O.h + 2 * TAB_BEZEL;
	const x = {
		operator: M,
		distributor: M + OP_COL + M,
		phone: M + OP_COL + M + DIST_COL + M
	};
	const label = (id: PaneId) => `
		<div class="label">
			<span class="ini" id="ini-${id}">·</span>
			<span class="who"><b id="name-${id}">Signed out</b><span id="sub-${id}">${esc(PANES[id].label)}</span></span>
			<span class="dev-chip">${esc(PANES[id].label)} · ${esc(PANES[id].size)}</span>
		</div>
		<div class="url" id="url-${id}"></div>`;
	const device = (id: PaneId) => {
		const { w, h } = scr(id);
		const inset = (id === 'phone' ? PHONE_BEZEL : TAB_BEZEL) - 1;
		// the stage's own layer over the screen: the rings round what is read, clipped to the screen
		return `<div class="dev" id="dev-${id}"><img id="scr-${id}" src="${BLANK}" style="width:${px(w)};height:${px(h)}" alt=""><div class="fx" id="fx-${id}" style="left:${px(inset)};top:${px(inset)};width:${px(w)};height:${px(h)}"></div></div>`;
	};
	const col = (id: PaneId, extra = '') =>
		`<div class="col" style="left:${px(x[id])};width:${px(COL[id])}">${label(id)}${device(id)}${extra}</div>`;
	return `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=block">
<style>
*{box-sizing:border-box;margin:0}
html,body{width:${W}px;height:${H}px;overflow:hidden;background:#0c1311;color:#e8efe9;font:400 13px/1.35 Geist,system-ui,sans-serif}
body{background:radial-gradient(1200px 600px at 30% 0%,#15231d 0%,#0c1311 60%)}
#bar{position:absolute;left:0;right:0;top:0;height:54px;display:flex;align-items:center;gap:14px;padding:0 18px;border-bottom:1px solid #1d2a25}
.mark{width:28px;height:28px;border-radius:8px;background:#1f6b45;display:grid;place-items:center;font:700 15px Geist;color:#fff}
#bar h1{font:600 16px/1.2 Geist;letter-spacing:-.01em}
#bar p{font-size:12px;color:#9fb3a8}
#bar .grow{flex:1}
#step{font:600 13px Geist;color:#f5c542}
#clock{font:500 13px 'Geist Mono',monospace;color:#cfdcd4;min-width:48px;text-align:right}
.rec{display:flex;align-items:center;gap:6px;font:600 11px Geist;color:#ff7b6b;letter-spacing:.06em}
.rec i{width:9px;height:9px;border-radius:50%;background:#ff5a47}
.col{position:absolute;top:${px(TOP)}}
.label{height:30px;display:flex;align-items:center;gap:8px}
.ini{width:26px;height:26px;border-radius:50%;background:#2a3a33;display:grid;place-items:center;font:600 11px Geist;color:#e8efe9;flex:none}
.who{display:flex;flex-direction:column;min-width:0;flex:1}
.who b{font:600 13px/1.15 Geist;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.who span{font-size:11px;color:#9fb3a8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dev-chip{font:500 10.5px 'Geist Mono',monospace;color:#8aa196;border:1px solid #2a3a33;border-radius:6px;padding:2px 6px;flex:none}
.url{height:14px;padding-left:34px;font:400 10.5px/14px 'Geist Mono',monospace;color:#6f877c;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dev{position:relative;margin-top:2px;background:#151d1a;border:1px solid #2b3933;transition:box-shadow .25s}
.dev img{display:block;background:#fff}
.dev.on{box-shadow:0 0 0 2px #f5c542,0 0 28px rgba(245,197,66,.25)}
#dev-operator,#dev-distributor{padding:${px(TAB_BEZEL - 1)};border-radius:20px}
#dev-operator img,#dev-distributor img{border-radius:9px}
#dev-phone{padding:${px(PHONE_BEZEL - 1)};border-radius:30px}
#dev-phone img{border-radius:22px}
#narr{position:absolute;left:${px(M)};top:${px(TOP + HEAD + opH + M)};width:${px(OP_COL)};bottom:${px(M)};border:1px solid #22312b;border-radius:12px;background:rgba(18,28,24,.86);padding:12px 16px;display:grid;grid-template-columns:1.1fr 1fr;grid-template-rows:auto auto auto 1fr;column-gap:18px;row-gap:7px;overflow:hidden}
#chapter{grid-column:1/-1;font:600 12.5px Geist;color:#f5c542;letter-spacing:.01em}
.cap{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
#cap-who{font:700 19px/1.2 Geist;letter-spacing:-.01em}
#cap-role{font-size:12.5px;color:#9fb3a8}
#cap-did{font:500 15px/1.32 Geist;color:#e8efe9}
#stats{display:flex;gap:7px;flex-wrap:wrap;align-content:flex-start}
.stat{border:1px solid #2a3a33;border-radius:8px;padding:3px 8px;display:flex;gap:6px;align-items:baseline}
.stat b{font:600 13px 'Geist Mono',monospace;color:#7fe0a8}
.stat span{font-size:11px;color:#9fb3a8}
#log{grid-column:2;grid-row:2/5;list-style:none;padding:0;display:flex;flex-direction:column;gap:3px;overflow:hidden;border-left:1px solid #22312b;padding-left:16px}
#log li{display:flex;gap:8px;font-size:12px;color:#b9c9c0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#log li:first-child{color:#e8efe9}
#log i{font:500 11px 'Geist Mono',monospace;color:#6f877c;font-style:normal;min-width:20px;text-align:right}
.note{margin-top:12px;font-size:11.5px;color:#8aa196;line-height:1.45}
.fx{position:absolute;overflow:hidden;pointer-events:none;border-radius:9px}
#dev-phone .fx{border-radius:22px}
.ring{position:absolute;border-radius:10px;border:2px solid #f5c542;box-shadow:0 0 0 3px rgba(245,197,66,.2),0 0 22px rgba(245,197,66,.32);opacity:0;transform:scale(1.04);transition:opacity .25s ease,transform .4s cubic-bezier(.22,1,.36,1)}
.ring.dim{box-shadow:0 0 0 3px rgba(245,197,66,.2),0 0 22px rgba(245,197,66,.32),0 0 0 2400px rgba(7,12,10,.46)}
.ring.on{opacity:1;transform:none}
#callouts{position:absolute;inset:0;pointer-events:none;z-index:20}
.callout{position:absolute;width:340px;background:rgba(13,21,18,.97);border:1px solid #3a5247;border-radius:14px;padding:13px 16px 14px;box-shadow:0 18px 44px rgba(0,0,0,.5),0 0 0 1px rgba(245,197,66,.06);opacity:0;transform:translateY(8px);transition:opacity .3s ease,transform .42s cubic-bezier(.22,1,.36,1)}
.callout.above{transform:translateY(-8px)}
.callout.on{opacity:1;transform:none}
.co-head{display:flex;align-items:center;gap:9px;margin-bottom:7px}
.co-tag{flex:none;font:600 10px/1 'Geist Mono',monospace;letter-spacing:.08em;text-transform:uppercase;color:#13201a;background:#f5c542;border-radius:6px;padding:4px 7px 3px}
.callout b{font:600 14.5px/1.25 Geist;color:#f2f6f3;letter-spacing:-.005em}
.callout p{font:400 12.5px/1.5 Geist;color:#c3d3ca;margin:0}
.co-arrow{position:absolute;width:13px;height:13px;background:rgba(13,21,18,.97);border-left:1px solid #3a5247;border-top:1px solid #3a5247;transform:rotate(45deg)}
.callout.below .co-arrow{top:-7.5px}
.callout.above .co-arrow{bottom:-7.5px;transform:rotate(225deg)}
</style></head><body>
<div id="bar"><span class="mark">S</span><div><h1>${esc(about.flow)}</h1><p>${esc(about.batch)} · ${PROD ? `live on production: ${esc(new URL(ORIGIN.workspace).host)}` : "live on this machine's stack"}</p></div>
<span class="grow"></span><span id="step"></span><span class="rec"><i></i>REC</span><span id="clock">00:00</span></div>
${col('operator')}
${col('distributor')}
${col(
	'phone',
	`<div class="note" style="width:${px(PHONE_COL)}">Each kirana, Agrawal Wholesale on ExpireSoon and Neha in the console sign in here as they are needed.</div><div class="note" style="width:${px(PHONE_COL)}">Everyone signs in on the app's own screen. The password check is answered with that person's own session, so no password is typed: the field takes a stand-in.</div>`
)}
<div id="callouts"></div>
<div id="narr"><div id="chapter"></div><div class="cap"><span id="cap-who"></span><span id="cap-role"></span></div><ol id="log"></ol><div id="cap-did"></div><div id="stats"></div></div>
<script>
let t0 = 0;
window.startClock = () => { t0 = Date.now(); };
setInterval(() => {
	if (!t0) return;
	const s = Math.floor((Date.now() - t0) / 1000);
	document.getElementById('clock').textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}, 500);
</script></body></html>`;
}
