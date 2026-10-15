// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ENDED, chapterAt, clock, filmPlayer, loadYouTube, type YouTubeApi } from '#lib/landing/youtube.ts';

// the demo film's theatre (SC-164): YouTube only after Watch, on its no-cookie host; its chapters from the film's own
// timeline (SC-211's sales film, design3/designs/SC-211/src/transcript11.py, SC-216)
const here = dirname(fileURLToPath(import.meta.url));
const words = JSON.parse(readFileSync(join(here, '../../../../design3/site/assets/media/demo-film.json'), 'utf8')) as {
	duration: number;
	runtime: string;
	chapters: { id: string; title: string; at: number; lines: { at: number; text: string }[] }[];
};

describe("the film's words", () => {
	it('are its thirteen chapters from 0:00, in order, each long enough to be a YouTube chapter, and its 48 lines', () => {
		const starts = words.chapters.map((c) => c.at);
		expect(words.runtime).toBe('6:50');
		expect(starts).toHaveLength(13);
		expect(starts[0]).toBe(0);
		starts.forEach((s, i) => expect((starts[i + 1] ?? words.duration) - s).toBeGreaterThanOrEqual(10));
		expect(words.chapters.flatMap((c) => c.lines)).toHaveLength(48);
		expect(words.chapters.map((c) => `${clock(c.at)} ${c.title}`)).toEqual([
			'0:00 The waste',
			'0:38 Smart-Clearance, as a service',
			'1:01 Every team, on any device',
			'1:39 Ten agents',
			'2:21 Guardrails and one yes',
			'3:04 Flagged, read and planned',
			'3:41 The kiranas',
			'4:05 The staff sale and the food bank',
			'4:23 The marketplace',
			'4:44 The hardest case',
			'5:10 The paperwork and the money',
			'5:42 The record and the impact',
			'6:18 The close'
		]);
	});
	it('mark the chapter a time falls in', () => {
		const starts = words.chapters.map((c) => c.at);
		expect(chapterAt(0, starts)).toBe(0);
		expect(chapterAt(82, starts)).toBe(2);
		expect(chapterAt(200, starts)).toBe(5);
		expect(chapterAt(360, starts)).toBe(11);
		expect(chapterAt(405, starts)).toBe(12);
	});
	it('name no client, in the chapters the theatre shows or in any line of the film (SC-28)', () => {
		const said = words.chapters.flatMap((c) => [c.title, ...c.lines.map((l) => l.text)]).join(' ');
		for (const name of ['Munchly', 'Lakshmi', 'Priya', 'Rakesh', 'Agrawal', 'Meera', 'MF-24', 'Mango', 'Chips'])
			expect(said).not.toContain(name);
	});
});

describe("YouTube's player", () => {
	beforeEach(() => {
		document.head.innerHTML = '';
		delete window.YT;
	});
	it('is loaded once, from YouTube, only when asked for', async () => {
		expect(document.querySelectorAll('script').length).toBe(0);
		const a = loadYouTube();
		const b = loadYouTube();
		expect(a).toBe(b);
		const scripts = [...document.querySelectorAll('script')];
		expect(scripts.map((s) => s.src)).toEqual(['https://www.youtube.com/iframe_api']);
		const api = { Player: vi.fn() } as unknown as YouTubeApi;
		window.YT = api;
		window.onYouTubeIframeAPIReady?.();
		await expect(a).resolves.toBe(api);
	});
	it('plays the film on the no-cookie host at once, titled for the reader, and says when it ends', () => {
		let options: Record<string, unknown> & { events: Record<string, (e: unknown) => void> } = { events: {} };
		const iframe = document.createElement('iframe');
		const api = {
			Player: vi.fn(function (this: unknown, _el: HTMLElement, o: typeof options) {
				options = o;
				return { getIframe: () => iframe };
			})
		} as unknown as YouTubeApi;
		const onend = vi.fn();
		filmPlayer(api, document.createElement('div'), 'abcdefghijk', onend);
		expect(options).toMatchObject({
			host: 'https://www.youtube-nocookie.com',
			videoId: 'abcdefghijk',
			playerVars: { autoplay: 1, rel: 0, playsinline: 1 }
		});
		options.events.onReady({ target: { getIframe: () => iframe } });
		expect(iframe.title).toBe('Smart-Clearance demo film');
		options.events.onStateChange({ data: 1 });
		expect(onend).not.toHaveBeenCalled();
		options.events.onStateChange({ data: ENDED });
		expect(onend).toHaveBeenCalledOnce();
	});
});
