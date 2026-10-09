import type { Page, TestInfo } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// What a journey flow's run keeps besides Playwright's own report (SC-95; Munchly Chips E2E, Munchly Mango E2E): a caption on the recording naming who
// is acting and what they do, a still at each step, every figure the journey reached, and the findings (page errors,
// failed API calls, anything the run noticed that was not as the story says). report.md and report.json are written to
// the run's output folder when the test ends, pass or fail.

/** how long a step's screen is held before its still: the figures roll, the cards rise */
const SETTLE = Number(process.env.E2E_SETTLE ?? 1200);

export type Step = { n: number; who: string; role: string; did: string; at: string; ms: number; shot?: string };
export type Finding = { severity: 'error' | 'warning' | 'note'; where: string; what: string };
/** the flow a run is of, and the batch it takes, as its caption and report name them */
export type About = { flow: string; batch: string };

export class Run {
	readonly steps: Step[] = [];
	readonly findings: Finding[] = [];
	readonly figures: Record<string, string | number> = {};
	readonly started = Date.now();
	private last = Date.now();
	private dir: string;
	private caption = { who: '', role: '', did: '' };
	/** the journey step under way, as the caption names it ("7/15") */
	stage = '';

	constructor(
		private page: Page,
		private info: TestInfo,
		readonly about: About = {
			flow: 'Munchly Chips E2E',
			batch: 'MF-2409-117, Masala Chips 150 g, Rakesh Traders, Nagpur'
		}
	) {
		this.dir = info.outputPath('steps');
		mkdirSync(this.dir, { recursive: true });
		// what goes wrong on the page is a finding, wherever the run is
		page.on('pageerror', (e) => this.find('error', page.url(), `page error: ${e.message.split('\n')[0]}`));
		page.on('console', (m) => {
			if (m.type() === 'error' && !/favicon|Download the Svelte|net::ERR_ABORTED/.test(m.text()))
				this.find('warning', page.url(), `console error: ${m.text().slice(0, 240)}`);
		});
		page.on('response', (r) => {
			const u = r.url();
			if (r.status() >= 500 || (r.status() >= 400 && /\/v1\//.test(u) && r.status() !== 401))
				this.find(r.status() >= 500 ? 'error' : 'warning', u, `${r.request().method()} answered ${r.status()}`);
		});
		// the caption is drawn again on every load, from the last one set
		page.on('load', () => void this.draw().catch(() => {}));
	}

	find(severity: Finding['severity'], where: string, what: string) {
		const f = { severity, where: where.replace(/^https?:\/\/[^/]+/, ''), what };
		if (!this.findings.some((x) => x.where === f.where && x.what === f.what)) this.findings.push(f);
	}

	figure(name: string, value: string | number) {
		this.figures[name] = value;
	}

	/** where the run keeps a file a person downloaded (an export), beside its report */
	keep(name: string) {
		const dir = this.info.outputPath('exports');
		mkdirSync(dir, { recursive: true });
		return join(dir, name);
	}

	/** who acts now and what they do: drawn on the recording until the next one */
	async act(who: string, role: string, did: string) {
		this.caption = { who, role, did };
		await this.draw().catch(() => {});
	}

	private async draw() {
		const { who, role, did } = this.caption;
		if (!who) return;
		await this.page.evaluate(
			([who, role, did, n, flow]) => {
				let el = document.getElementById('e2e-caption');
				if (!el) {
					el = document.createElement('div');
					el.id = 'e2e-caption';
					el.setAttribute('aria-hidden', 'true');
					el.style.cssText =
						'position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:2147483647;pointer-events:none;' +
						'background:rgba(15,23,20,.86);color:#fff;font:500 13px/1.35 Inter,system-ui,sans-serif;padding:8px 14px;' +
						'border-radius:10px;box-shadow:0 4px 18px rgba(0,0,0,.25);max-width:80vw;text-align:center';
					document.body.appendChild(el);
				}
				el.innerHTML = `<b style="color:#f5c542">${flow} · ${n}</b> · <b>${who}</b> <span style="opacity:.75">(${role})</span> — ${did}`;
			},
			[who, role, did, this.stage, this.about.flow] as const
		);
	}

	/** a step done: timed, with a still of the page as it ended (once its figures have rolled into place), and the screen
	 *  read for text that should never reach a person: NaN, undefined, [object Object], Invalid Date */
	async done(did: string) {
		const n = this.steps.length + 1;
		await this.page.waitForTimeout(SETTLE);
		const odd = await this.page
			.evaluate(() => {
				const text = (document.getElementById('main') ?? document.body).innerText;
				const hits = text.match(/.{0,40}(?:NaN|\bundefined\b|\[object Object\]|Invalid Date).{0,40}/g) ?? [];
				return [...new Set(hits.map((h) => h.replace(/\s+/g, ' ').trim()))].slice(0, 4);
			})
			.catch(() => [] as string[]);
		for (const o of odd) this.find('error', this.page.url(), `"${o}" on screen at step ${n} (${did})`);
		const shot = join(this.dir, `${String(n).padStart(2, '0')}-${did.replace(/[^a-z0-9]+/gi, '-').slice(0, 48)}.png`);
		await this.page.screenshot({ path: shot }).catch(() => {});
		const now = Date.now();
		this.steps.push({
			n,
			who: this.caption.who,
			role: this.caption.role,
			did,
			at: new Date(now).toISOString(),
			ms: now - this.last,
			shot: shot.slice(this.info.outputPath().length + 1)
		});
		this.last = now;
	}

	write(status: string, error?: string) {
		const out = this.info.outputPath();
		const took = Math.round((Date.now() - this.started) / 1000);
		const json = { flow: this.about.flow, status, error, took, steps: this.steps, figures: this.figures };
		writeFileSync(join(out, 'report.json'), JSON.stringify({ ...json, findings: this.findings }, null, 2));
		const md = [
			`# ${this.about.flow}`,
			'',
			`- **Status:** ${status}${error ? ` (${error.split('\n')[0]})` : ''}`,
			`- **Started:** ${new Date(this.started).toISOString()}, took ${Math.floor(took / 60)} min ${took % 60} s`,
			`- **Batch:** ${this.about.batch}`,
			'',
			'## Steps',
			'',
			'| # | Who | Role | What | Took |',
			'| --- | --- | --- | --- | --- |',
			...this.steps.map((s) => `| ${s.n} | ${s.who} | ${s.role} | ${s.did} | ${(s.ms / 1000).toFixed(1)} s |`),
			'',
			'## Figures',
			'',
			...Object.entries(this.figures).map(([k, v]) => `- **${k}:** ${v}`),
			'',
			'## Findings',
			'',
			...(this.findings.length ? this.findings.map((f) => `- **${f.severity}** \`${f.where}\`: ${f.what}`) : ['None.']),
			''
		].join('\n');
		writeFileSync(join(out, 'report.md'), md);
		return md;
	}
}
