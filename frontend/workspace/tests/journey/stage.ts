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
import { ORIGIN, openAs, person, type App } from './auth.ts';
import { ROLES, settled } from './flow.ts';
import { Run, type About } from './record.ts';

// Three screens at once (SC-179): a journey played out as it would be in the field. The supply chain operator and the
// distributor each hold a tablet in landscape, and a phone serves everyone else (each kirana, the ExpireSoon buyer,
// Smart-Clearance staff in the console), side by side in one live window. The two tablets sign in before the recording
// starts and stay signed in, moving from screen to screen in the app; the phone signs people in as they are needed.
//
// The three screens run in a headless Chromium, each at its own size; each streams its frames (CDP screencast) into
// the stage, a page in a visible Chromium window that lays them out as devices, names who holds each, and captions
// who is acting and what they do. The stage itself is recorded: its frames are piped into ffmpeg at a steady 25 fps,
// so the recording is the stage as watched, every screen in it, timed as it happened.
//
// Every screen draws a cursor (an init script): each click glides it to its target and ripples where it lands, and a
// person reading glides it over what they read. While the phone signs someone in, its last frame holds under a
// "Signing in" chip, so no screen ever shows a blank page; and a step ends only once every screen's photos and
// placeholders have landed.
//
// E2E_LIVE=0 keeps the stage window hidden (it is still recorded).

export type PaneId = 'operator' | 'distributor' | 'phone';

type PaneSpec = {
	label: string;
	size: string;
	viewport: { width: number; height: number };
	scale: number;
	/** the screencast's largest frame: the screen drawn on the stage at about twice its size, for a sharp recording */
	max: { width: number; height: number };
};

/** the stage window, in CSS pixels (drawn at twice that on a Retina screen); it fits a 14-inch MacBook's screen */
const W = 1720;
const H = 968;
const M = 14;
/** a tablet's bezel and a phone's, each side */
const TAB_BEZEL = 11;
const PHONE_BEZEL = 9;
const PHONE_SCALE = 0.8;
const PHONE_COL = 390 * PHONE_SCALE + 2 * PHONE_BEZEL;
const TAB_COL = (W - 4 * M - PHONE_COL) / 2;
const TAB_SCALE = (TAB_COL - 2 * TAB_BEZEL) / 1180;

const PANES: Record<PaneId, PaneSpec> = {
	operator: {
		label: 'Tablet',
		size: '1180 × 820 · landscape',
		viewport: { width: 1180, height: 820 },
		scale: TAB_SCALE,
		max: { width: 1600, height: 1112 }
	},
	distributor: {
		label: 'Tablet',
		size: '1180 × 820 · landscape',
		viewport: { width: 1180, height: 820 },
		scale: TAB_SCALE,
		max: { width: 1600, height: 1112 }
	},
	phone: {
		label: 'Phone',
		size: '390 × 844',
		viewport: { width: 390, height: 844 },
		scale: PHONE_SCALE,
		max: { width: 640, height: 1385 }
	}
};

/** the recording's size */
const OUT = { width: 2560, height: 1440 };
const FPS = 25;
const LIVE = process.env.E2E_LIVE !== '0';
/** flags that keep a hidden or covered window drawing, so its screencast never stalls */
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
		make().style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)';
		try { sessionStorage.setItem(KEY, JSON.stringify([e.clientX, e.clientY])); } catch {}
	}, true);
	addEventListener('mousedown', (e) => {
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
	/** who is signed in on it, and to which app */
	who: string | null;
	app: App | null;
	lastFrame: number;
	/** while someone signs in on it, its frames are held back: the stage keeps its last one, under a chip */
	held: boolean;
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
	private frame: Buffer | null = null;
	private ffmpeg: ChildProcess | null = null;
	private written = 0;
	private recording = 0;
	private ended: Promise<void> | null = null;

	private constructor(
		private stageBrowser: Browser,
		private paneBrowser: Browser,
		readonly stage: Page,
		info: TestInfo,
		about: About,
		readonly video: string
	) {
		this.run = new StageRun(stage, info, about, this);
	}

	/** opens the stage and its three screens; the recording starts with record(), once they are signed in */
	static async open(info: TestInfo, about: About, video: string): Promise<Stage> {
		const stageBrowser = await chromium.launch({
			headless: !LIVE,
			args: [...KEEP_DRAWING, '--window-position=0,0', `--window-size=${W},${H + 88}`]
		});
		const paneBrowser = await chromium.launch({ headless: true, args: KEEP_DRAWING });
		const ctx = await stageBrowser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
		const stage = await ctx.newPage();
		await stage.setContent(STAGE_HTML(about));
		await stage.evaluate(() => document.fonts.ready);
		const s = new Stage(stageBrowser, paneBrowser, stage, info, about, video);
		for (const id of Object.keys(PANES) as PaneId[]) await s.addPane(id);
		s.timers.push(setInterval(() => void s.pump(), 50));
		s.timers.push(setInterval(() => void s.watchdog(), 3000));
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
		const cdp = await ctx.newCDPSession(page);
		const pane: Pane = { id, page, cdp, who: null, app: null, lastFrame: 0, held: false };
		cdp.on('Page.screencastFrame', (f: { data: string; sessionId: number }) => {
			if (!pane.held) this.latest[id] = f.data;
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
		for (const pane of Object.values(this.panes))
			if (!pane.held && Date.now() - pane.lastFrame > 6000) await this.recast(pane);
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

	/** signs the people who start the journey in on their screens, before anything is recorded */
	async ready(people: { who: string; path: string; app?: App }[]) {
		for (const p of people) {
			const id = this.paneOf(p.who);
			const pane = this.panes[id];
			const app = p.app ?? (p.who === 'neha' ? 'console' : 'workspace');
			await openAs(pane.page, app, p.who, p.path);
			pane.who = p.who;
			pane.app = app;
			await this.hold(id, p.who, app);
			await settled(pane.page);
			await loaded(pane.page);
			await this.address(id);
		}
		await this.stage.waitForTimeout(800);
	}

	/** the stage, recorded from now on: its screencast's newest frame written to ffmpeg 25 times a second */
	async record() {
		const cdp = await this.stage.context().newCDPSession(this.stage);
		cdp.on('Page.screencastFrame', (f: { data: string; sessionId: number }) => {
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
	private async hold(id: PaneId, who: string, app: App) {
		const p = person(who);
		const role = who === 'neha' ? ROLES.neha : (ROLES[who] ?? `Kirana · ${p.org}`);
		const org = who === 'neha' || ROLES[who] === undefined || who === 'agrawal' ? '' : p.org;
		await this.stage.evaluate(
			([id, ini, name, sub]) => {
				document.getElementById(`ini-${id}`)!.textContent = ini;
				document.getElementById(`name-${id}`)!.textContent = name;
				document.getElementById(`sub-${id}`)!.textContent = sub;
			},
			[
				id,
				initials(p.name),
				p.name,
				[role, org].filter(Boolean).join(' · ') + (app === 'console' ? ' · console' : '')
			] as const
		);
	}

	/** a screen's frames held back while someone signs in on it, the stage keeping its last under a chip */
	private async signing(id: PaneId, name: string | null, verb = 'Signing in') {
		const pane = this.panes[id];
		pane.held = !!name;
		if (!name) delete this.latest[id];
		await this.stage
			.evaluate(
				([id, name, verb]) => {
					const el = document.getElementById(`hold-${id}`)!;
					el.classList.toggle('on', !!name);
					if (name) {
						el.querySelector('em')!.textContent = verb;
						el.querySelector('b')!.textContent = name;
					}
				},
				[id, name, verb] as const
			)
			.catch(() => {});
		if (!name) await this.recast(pane);
	}

	/** a screen that stays signed in loads again where it is (after a reset the stream does not announce), its last
	 *  frame held meanwhile */
	async refresh(who: string) {
		const id = this.paneOf(who);
		const pane = this.panes[id];
		await this.signing(id, person(who).name, 'Catching up');
		try {
			await pane.page.reload();
			await settled(pane.page);
			if (pane.app === 'workspace') await expect(pane.page.locator('#main')).toBeVisible();
			await loaded(pane.page);
		} finally {
			await this.signing(id, null);
		}
	}

	/** someone opens an app at a path on their screen, the caption naming them and what they are about to do. A screen
	 *  already theirs moves within the app, as a click would; otherwise they sign in to it first */
	async open(who: string, path: string, did: string, app: App = who === 'neha' ? 'console' : 'workspace') {
		const id = this.paneOf(who);
		const pane = this.panes[id];
		const p = person(who);
		await this.run.act(p.name, ROLES[who] ?? `Kirana · ${p.org}`, did);
		await this.active(id);
		if (pane.who === who && pane.app === app) await this.go(pane.page, app, path);
		else {
			await this.signing(id, p.name);
			try {
				await openAs(pane.page, app, who, path);
				pane.who = who;
				pane.app = app;
				await this.hold(id, who, app);
				await settled(pane.page);
				if (app === 'workspace') await expect(pane.page.locator('#main')).toBeVisible();
				await loaded(pane.page);
			} finally {
				await this.signing(id, null);
			}
		}
		await settled(pane.page);
		if (app === 'workspace') await expect(pane.page.locator('#main')).toBeVisible();
		await loaded(pane.page);
		await this.address(id);
		return pane.page;
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

	/** the cursor glides to an element, and rests on it: a person reading it, or about to press it */
	async point(target: Locator, rest = 350) {
		const page = target.page();
		await target.scrollIntoViewIfNeeded().catch(() => {});
		const box = await target.boundingBox().catch(() => null);
		if (!box) return;
		await page.mouse.move(box.x + box.width / 2, box.y + Math.min(box.height / 2, 24));
		await page.waitForTimeout(GLIDE + rest);
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
		await page.mouse.wheel(0, Math.round(PANES.operator.viewport.height * by));
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

	/** a figure the narrator keeps in view (the scheme's orders and declines, the packs left …) */
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
					while (ol.children.length > 8) ol.lastElementChild!.remove();
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
	}
}

// ---------------------------------------------------------------------------------------------------------------
// The stage: the two tablets and the phone at the sizes above, each under its holder's name, the narrator under the
// tablets

const px = (n: number) => `${Math.round(n)}px`;
/** a screen before its first frame: blank white, as a device waking */
const BLANK =
	'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%221%22 height=%221%22%3E%3Crect width=%221%22 height=%221%22 fill=%22%23fff%22/%3E%3C/svg%3E';
const scr = (id: PaneId) => ({
	w: PANES[id].viewport.width * PANES[id].scale,
	h: PANES[id].viewport.height * PANES[id].scale
});

function STAGE_HTML(about: About) {
	const T = scr('operator');
	const P = scr('phone');
	const TOP = 64;
	/** a device's label and address above it */
	const HEAD = 30 + 14 + 2;
	const tabH = T.h + 2 * TAB_BEZEL;
	const x = { operator: M, distributor: M + TAB_COL + M, phone: M + 2 * (TAB_COL + M) };
	const label = (id: PaneId) => `
		<div class="label">
			<span class="ini" id="ini-${id}">·</span>
			<span class="who"><b id="name-${id}">Waiting to sign in</b><span id="sub-${id}">${esc(PANES[id].label)}</span></span>
			<span class="dev-chip">${esc(PANES[id].label)} · ${esc(PANES[id].size)}</span>
		</div>
		<div class="url" id="url-${id}"></div>`;
	const device = (id: PaneId, w: number, h: number) => `
		<div class="dev" id="dev-${id}"><img id="scr-${id}" src="${BLANK}" style="width:${px(w)};height:${px(h)}" alt="">
			<div class="hold" id="hold-${id}"><span><em>Signing in</em> · <b></b></span></div></div>`;
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
#dev-phone{padding:${px(PHONE_BEZEL - 1)};border-radius:34px}
#dev-phone img{border-radius:26px}
.hold{position:absolute;inset:0;display:grid;place-items:center;opacity:0;pointer-events:none;transition:opacity .2s;border-radius:inherit;background:rgba(10,16,14,.32)}
.hold.on{opacity:1}
.hold span{background:rgba(15,23,20,.9);color:#fff;border:1px solid #2f4239;border-radius:999px;padding:7px 14px;font:500 12.5px Geist}
.hold b{font-weight:700}
.hold em{font-style:normal}
#narr{position:absolute;left:${px(M)};top:${px(TOP + HEAD + tabH + M)};width:${px(2 * TAB_COL + M)};bottom:${px(M)};border:1px solid #22312b;border-radius:12px;background:rgba(18,28,24,.86);padding:14px 18px;display:grid;grid-template-columns:1.15fr 1fr;grid-template-rows:auto auto auto 1fr;column-gap:22px;row-gap:8px}
#chapter{grid-column:1/-1;font:600 12.5px Geist;color:#f5c542;letter-spacing:.01em}
.cap{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
#cap-who{font:700 20px/1.2 Geist;letter-spacing:-.01em}
#cap-role{font-size:13px;color:#9fb3a8}
#cap-did{font:500 16px/1.32 Geist;color:#e8efe9}
#stats{display:flex;gap:8px;flex-wrap:wrap;align-content:flex-start}
.stat{border:1px solid #2a3a33;border-radius:8px;padding:4px 9px;display:flex;gap:6px;align-items:baseline}
.stat b{font:600 13px 'Geist Mono',monospace;color:#7fe0a8}
.stat span{font-size:11px;color:#9fb3a8}
#log{grid-column:2;grid-row:2/5;list-style:none;padding:0;display:flex;flex-direction:column;gap:3px;overflow:hidden;border-left:1px solid #22312b;padding-left:18px}
#log li{display:flex;gap:8px;font-size:12px;color:#b9c9c0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#log li:first-child{color:#e8efe9}
#log i{font:500 11px 'Geist Mono',monospace;color:#6f877c;font-style:normal;min-width:20px;text-align:right}
#phone-note{position:absolute;font-size:11.5px;color:#8aa196;line-height:1.45}
</style></head><body>
<div id="bar"><span class="mark">S</span><div><h1>${esc(about.flow)}</h1><p>${esc(about.batch)} · live on this machine's stack</p></div>
<span class="grow"></span><span id="step"></span><span class="rec"><i></i>REC</span><span id="clock">00:00</span></div>
<div class="col" style="left:${px(x.operator)};width:${px(TAB_COL)}">${label('operator')}${device('operator', T.w, T.h)}</div>
<div class="col" style="left:${px(x.distributor)};width:${px(TAB_COL)}">${label('distributor')}${device('distributor', T.w, T.h)}</div>
<div class="col" style="left:${px(x.phone)};width:${px(PHONE_COL)}">${label('phone')}${device('phone', P.w, P.h)}
	<div id="phone-note" style="top:${px(HEAD + P.h + 2 * PHONE_BEZEL + 14)};width:${px(PHONE_COL)}">Signs people in as they are needed: each kirana, Agrawal Wholesale on ExpireSoon, and Neha in the Smart-Clearance console.</div></div>
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
