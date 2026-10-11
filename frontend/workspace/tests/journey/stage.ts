import { chromium, expect, type Browser, type CDPSession, type Page, type TestInfo } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import { ORIGIN, openAs, person, type App } from './auth.ts';
import { ROLES, settled } from './flow.ts';
import { Run, type About } from './record.ts';

// Three screens at once (SC-179): a journey played out as it would be in the field, the supply chain operator on a
// laptop, the distributor on a tablet, and a phone for everyone else (each kirana, the ExpireSoon buyer, Smart-Clearance
// staff in the console), side by side in one live window. The laptop and the tablet sign in once and stay signed in,
// moving from screen to screen in the app; the phone signs people in as they are needed.
//
// The three screens run in a headless Chromium, each at its own size; each streams its frames (CDP screencast) into
// the stage, a page in a visible Chromium window that lays them out as devices, names who holds each, and captions
// who is acting and what they do. The stage itself is recorded: its frames are piped into ffmpeg at a steady 25 fps,
// so the recording is the stage as watched, every screen in it, timed as it happened.
//
// E2E_LIVE=0 keeps the stage window hidden (it is still recorded).

export type PaneId = 'laptop' | 'tablet' | 'phone';

type PaneSpec = {
	label: string;
	viewport: { width: number; height: number };
	scale: number;
	mobile: boolean;
	/** the screencast's largest frame: the screen drawn on the stage at twice its size, for a sharp recording */
	max: { width: number; height: number };
};

const PANES: Record<PaneId, PaneSpec> = {
	laptop: {
		label: 'Laptop',
		viewport: { width: 1440, height: 900 },
		scale: 0.54,
		mobile: false,
		max: { width: 1600, height: 1000 }
	},
	tablet: {
		label: 'Tablet',
		viewport: { width: 820, height: 1180 },
		scale: 0.655,
		mobile: true,
		max: { width: 1100, height: 1584 }
	},
	phone: {
		label: 'Phone',
		viewport: { width: 390, height: 844 },
		scale: 0.79,
		mobile: true,
		max: { width: 620, height: 1342 }
	}
};

/** the stage window, in CSS pixels (drawn at twice that on a Retina screen); it fits a 14-inch MacBook's screen */
const W = 1720;
const H = 968;
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

type Pane = {
	id: PaneId;
	page: Page;
	cdp: CDPSession;
	/** who is signed in on it, and to which app */
	who: string | null;
	app: App | null;
	lastFrame: number;
};

/** the people who keep a screen of their own; everyone else takes the phone */
const HOLDS: Record<string, PaneId> = { priya: 'laptop', rakesh: 'tablet' };

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
		await super.done(did, settle);
		await this.board.log(this.steps.length, did);
	}
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

	/** opens the stage and its three screens, and starts recording */
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
		s.timers.push(setInterval(() => void s.pump(), 60));
		s.timers.push(setInterval(() => void s.watchdog(), 3000));
		await s.record();
		return s;
	}

	private async addPane(id: PaneId) {
		const spec = PANES[id];
		const ctx = await this.paneBrowser.newContext({
			viewport: spec.viewport,
			deviceScaleFactor: 2,
			isMobile: spec.mobile,
			hasTouch: spec.mobile,
			colorScheme: 'light',
			// a live build registers a service worker; the dev servers register none (playwright.journey.config.ts)
			serviceWorkers: 'block'
		});
		ctx.setDefaultTimeout(20_000);
		const page = await ctx.newPage();
		const cdp = await ctx.newCDPSession(page);
		const pane: Pane = { id, page, cdp, who: null, app: null, lastFrame: 0 };
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
				quality: 82,
				maxWidth: max.width,
				maxHeight: max.height,
				everyNthFrame: 1
			})
			.catch(() => {});
	}

	/** a screen that has sent nothing for a while (a quiet page, or one whose renderer was swapped on a navigation)
	 *  is asked again, so its last frame is never stale */
	private async watchdog() {
		for (const pane of Object.values(this.panes)) {
			if (Date.now() - pane.lastFrame < 6000) continue;
			await pane.cdp.send('Page.stopScreencast').catch(() => {});
			await this.cast(pane);
		}
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

	/** the stage, recorded: its screencast's newest frame written to ffmpeg 25 times a second */
	private async record() {
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
			await openAs(pane.page, app, who, path);
			pane.who = who;
			pane.app = app;
			await this.hold(id, who, app);
		}
		await settled(pane.page);
		if (app === 'workspace') await expect(pane.page.locator('#main')).toBeVisible();
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
	}

	/** how long the recording runs, so far */
	get seconds() {
		return Math.round(this.written / FPS);
	}
}

// ---------------------------------------------------------------------------------------------------------------
// The stage: the three devices at the sizes above, each under its holder's name, with the narrator under the laptop

const px = (n: number) => `${Math.round(n)}px`;
/** a screen before its first frame: blank white, as a device waking */
const BLANK =
	'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%221%22 height=%221%22%3E%3Crect width=%221%22 height=%221%22 fill=%22%23fff%22/%3E%3C/svg%3E';
const scr = (id: PaneId) => ({
	w: PANES[id].viewport.width * PANES[id].scale,
	h: PANES[id].viewport.height * PANES[id].scale
});

function STAGE_HTML(about: About) {
	const L = scr('laptop');
	const T = scr('tablet');
	const P = scr('phone');
	const label = (id: PaneId, size: string) => `
		<div class="label">
			<span class="ini" id="ini-${id}">·</span>
			<span class="who"><b id="name-${id}">Waiting to sign in</b><span id="sub-${id}">${esc(PANES[id].label)}</span></span>
			<span class="dev-chip">${esc(PANES[id].label)} · ${size}</span>
		</div>
		<div class="url" id="url-${id}"></div>`;
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
#clock{font:500 13px 'Geist Mono',monospace;color:#cfdcd4;min-width:72px;text-align:right}
.rec{display:flex;align-items:center;gap:6px;font:600 11px Geist;color:#ff7b6b;letter-spacing:.06em}
.rec i{width:9px;height:9px;border-radius:50%;background:#ff5a47}
.col{position:absolute;top:64px}
.label{height:30px;display:flex;align-items:center;gap:8px}
.ini{width:26px;height:26px;border-radius:50%;background:#2a3a33;display:grid;place-items:center;font:600 11px Geist;color:#e8efe9;flex:none}
.who{display:flex;flex-direction:column;min-width:0;flex:1}
.who b{font:600 13px/1.15 Geist;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.who span{font-size:11px;color:#9fb3a8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dev-chip{font:500 10.5px 'Geist Mono',monospace;color:#8aa196;border:1px solid #2a3a33;border-radius:6px;padding:2px 6px;flex:none}
.url{height:14px;padding-left:34px;font:400 10.5px/14px 'Geist Mono',monospace;color:#6f877c;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dev{position:relative;transition:box-shadow .25s}
.dev img{display:block;background:#fff}
.dev.on{box-shadow:0 0 0 2px #f5c542,0 0 28px rgba(245,197,66,.25)}
#dev-laptop{margin-top:2px;border-radius:9px;overflow:hidden;background:#1a2420;border:1px solid #2b3933}
#dev-laptop .chrome{height:22px;display:flex;align-items:center;gap:5px;padding:0 9px;background:#202c27;border-bottom:1px solid #2b3933}
#dev-laptop .chrome i{width:8px;height:8px;border-radius:50%;background:#3b4b44}
#dev-tablet{margin-top:2px;padding:10px;border-radius:24px;background:#151d1a;border:1px solid #2b3933}
#dev-tablet img{border-radius:12px}
#dev-phone{margin-top:2px;padding:8px;border-radius:34px;background:#151d1a;border:1px solid #2b3933}
#dev-phone img{border-radius:26px}
#narr{position:absolute;left:14px;top:${px(64 + 30 + 16 + 24 + L.h + 16)};width:${px(L.w)};bottom:14px;border:1px solid #22312b;border-radius:12px;background:rgba(18,28,24,.86);padding:14px 16px;display:flex;flex-direction:column;gap:9px}
#chapter{font:600 12px Geist;color:#f5c542;letter-spacing:.01em}
.cap{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
#cap-who{font:700 19px/1.2 Geist;letter-spacing:-.01em}
#cap-role{font-size:13px;color:#9fb3a8}
#cap-did{font:500 16px/1.3 Geist;color:#e8efe9}
#stats{display:flex;gap:8px;flex-wrap:wrap}
.stat{border:1px solid #2a3a33;border-radius:8px;padding:4px 9px;display:flex;gap:6px;align-items:baseline}
.stat b{font:600 13px 'Geist Mono',monospace;color:#7fe0a8}
.stat span{font-size:11px;color:#9fb3a8}
#log{list-style:none;padding:0;display:flex;flex-direction:column;gap:3px;overflow:hidden;flex:1}
#log li{display:flex;gap:8px;font-size:12px;color:#b9c9c0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#log li:first-child{color:#e8efe9}
#log i{font:500 11px 'Geist Mono',monospace;color:#6f877c;font-style:normal;min-width:20px;text-align:right}
#phone-note{position:absolute;font-size:11.5px;color:#8aa196;line-height:1.45}
</style></head><body>
<div id="bar"><span class="mark">S</span><div><h1>${esc(about.flow)}</h1><p>${esc(about.batch)} · live on this machine's stack</p></div>
<span class="grow"></span><span id="step"></span><span class="rec"><i></i>REC</span><span id="clock">00:00</span></div>
<div class="col" style="left:14px;width:${px(L.w)}">${label('laptop', '1440 × 900')}
	<div class="dev" id="dev-laptop"><div class="chrome"><i></i><i></i><i></i></div><img id="scr-laptop" src="${BLANK}" style="width:${px(L.w)};height:${px(L.h)}" alt=""></div></div>
<div id="narr"><div id="chapter"></div><div class="cap"><span id="cap-who"></span><span id="cap-role"></span></div><div id="cap-did"></div><div id="stats"></div><ol id="log"></ol></div>
<div class="col" style="left:${px(14 + L.w + 14)};width:${px(T.w + 22)}">${label('tablet', '820 × 1180')}
	<div class="dev" id="dev-tablet"><img id="scr-tablet" src="${BLANK}" style="width:${px(T.w)};height:${px(T.h)}" alt=""></div></div>
<div class="col" style="left:${px(14 + L.w + 14 + T.w + 22 + 14)};width:${px(P.w + 18)}">${label('phone', '390 × 844')}
	<div class="dev" id="dev-phone"><img id="scr-phone" src="${BLANK}" style="width:${px(P.w)};height:${px(P.h)}" alt=""></div>
	<div id="phone-note" style="top:${px(30 + 16 + P.h + 18 + 14)};width:${px(P.w + 18)}">Signs people in as they are needed: each kirana, Agrawal Wholesale on ExpireSoon, and Neha in the Smart-Clearance console.</div></div>
<script>
const t0 = Date.now();
setInterval(() => {
	const s = Math.floor((Date.now() - t0) / 1000);
	document.getElementById('clock').textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}, 500);
</script></body></html>`;
}
