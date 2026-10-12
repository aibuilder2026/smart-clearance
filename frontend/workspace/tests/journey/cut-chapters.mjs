#!/usr/bin/env node
// A journey's recording cut into one clip per chapter (SC-197), for the edit that makes the final walkthrough: the stage
// writes <video>.chapters.json beside the recording (each chapter's title, start and end, in seconds from its first
// frame), and this cuts each into its own file, re-encoded so every cut lands on its frame, with a list of the chapters
// in YouTube's form and as CSV.
//
//   node tests/journey/cut-chapters.mjs <recording.mp4> [out-dir] [--1080]
//
// --1080 cuts 1920 × 1080 copies (the recording is 2560 × 1440). The clips start a quarter second before their chapter
// and end a quarter second after it, so a dissolve in the edit has frames to work with.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

const args = process.argv.slice(2);
const small = args.includes('--1080');
const [video, outArg] = args.filter((a) => !a.startsWith('--'));
if (!video || !existsSync(video)) {
	console.error('usage: cut-chapters.mjs <recording.mp4> [out-dir] [--1080]');
	process.exit(2);
}
const list = video.replace(/\.mp4$/, '.chapters.json');
if (!existsSync(list)) {
	console.error(`no chapters beside the recording: ${list}`);
	process.exit(2);
}
/** @type {{ n: number; title: string; start: number; end: number }[]} */
const chapters = JSON.parse(readFileSync(list, 'utf8'));
const out = outArg ?? join(dirname(video), 'chapters');
mkdirSync(out, { recursive: true });

/** @param {string} t */
const slug = (t) =>
	t
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 60);
/** @param {number} s */
const stamp = (s) => {
	const t = Math.max(0, Math.floor(s));
	const h = Math.floor(t / 3600),
		m = Math.floor((t % 3600) / 60),
		x = t % 60;
	return (h ? `${h}:${String(m).padStart(2, '0')}` : `${m}`) + `:${String(x).padStart(2, '0')}`;
};

const PAD = 0.25;
/** @type {(typeof chapters[number] & { file: string; length: number })[]} */
const rows = [];
for (const c of chapters) {
	const from = Math.max(0, c.start - PAD);
	const length = c.end - c.start + 2 * PAD;
	const name = `${String(c.n).padStart(2, '0')}-${slug(c.title)}${small ? '-1080p' : ''}.mp4`;
	const file = join(out, name);
	execFileSync(
		'ffmpeg',
		[
			...['-hide_banner', '-loglevel', 'error', '-y'],
			...['-ss', from.toFixed(3), '-i', video, '-t', length.toFixed(3)],
			...(small ? ['-vf', 'scale=1920:1080:flags=lanczos'] : []),
			...['-c:v', 'libx264', '-preset', 'slow', '-crf', small ? '20' : '18', '-pix_fmt', 'yuv420p'],
			...['-an', '-movflags', '+faststart', file]
		],
		{ stdio: 'inherit' }
	);
	rows.push({ ...c, file: name, length: c.end - c.start });
	console.log(`${name}  ${(c.end - c.start).toFixed(1)} s`);
}

writeFileSync(join(out, 'chapters.txt'), chapters.map((c) => `${stamp(c.start)} ${c.title}`).join('\n') + '\n');
writeFileSync(
	join(out, 'chapters.csv'),
	'n,title,start,end,length,file\n' +
		rows
			.map((r) =>
				[r.n, JSON.stringify(r.title), r.start.toFixed(2), r.end.toFixed(2), r.length.toFixed(2), r.file].join(',')
			)
			.join('\n') +
		'\n'
);
console.log(`${rows.length} clips from ${basename(video)} in ${out}`);
