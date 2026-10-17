// SC-238: renders the film (or a scene) with Remotion's Node APIs. The bundle links public/ (several GB of media)
// instead of copying it. Stills land in ../build/stills/<comp>/t<sec>.jpg; a render in ../build/render/<comp>.mov.
//   node render.mjs still <Comp> <t1,t2,…>          stills at those scene seconds (a quick look)
//   node render.mjs video <Comp> [from-to] [out]    the composition, or a span of it in seconds, ProRes 422 HQ
//   node render.mjs check <Comp>                     every 2 s, as a contact sheet's frames
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import { mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const [cmd, comp, arg, outArg] = process.argv.slice(2);
const serveUrl = await bundle({
	entryPoint: path.join(HERE, 'src/index.ts'),
	publicDir: path.join(HERE, 'public'),
	symlinkPublicDir: true,
	onProgress: () => {},
	webpackOverride: (c) => c,
});
const chromiumOptions = { gl: 'angle', enableMultiProcessOnLinux: true };
const composition = await selectComposition({ serveUrl, id: comp, chromiumOptions, timeoutInMilliseconds: 120000 });
const fps = composition.fps;

if (cmd === 'still' || cmd === 'check') {
	const ts = cmd === 'check'
		? Array.from({ length: Math.floor(composition.durationInFrames / fps / 2) + 1 }, (_, i) => i * 2)
		: arg.split(',').map(Number);
	const dir = path.join(HERE, '../build/stills', comp);
	mkdirSync(dir, { recursive: true });
	for (const t of ts) {
		const frame = Math.min(composition.durationInFrames - 1, Math.round(t * fps));
		const output = path.join(dir, `t${t.toFixed(2)}.jpg`);
		await renderStill({ serveUrl, composition, frame, output, imageFormat: 'jpeg', jpegQuality: 90, chromiumOptions, timeoutInMilliseconds: 120000 });
		console.log(output);
	}
} else if (cmd === 'video') {
	let frameRange = null;
	if (arg && arg.includes('-')) { const [a, b] = arg.split('-').map(Number); frameRange = [Math.round(a * fps), Math.min(composition.durationInFrames - 1, Math.round(b * fps) - 1)]; }
	const out = outArg || path.join(HERE, '../build/render', `${comp}${arg ? '-' + arg : ''}${process.env.PREVIEW ? '-preview.mp4' : '.mov'}`);
	mkdirSync(path.dirname(out), { recursive: true });
	const t0 = Date.now(); let last = 0;
	const preview = !!process.env.PREVIEW;   // a quick look: half size, H.264
	await renderMedia({
		serveUrl, composition, outputLocation: out, frameRange, chromiumOptions, imageFormat: 'jpeg', jpegQuality: preview ? 85 : 95,
		...(preview ? { codec: 'h264', crf: 22, scale: 0.5 } : { codec: 'prores', proResProfile: 'hq' }),
		concurrency: Number(process.env.CONCURRENCY || 6), timeoutInMilliseconds: 240000, muted: true, enforceAudioTrack: false,
		onProgress: ({ progress }) => { const p = Math.floor(progress * 100); if (p >= last + 5) { last = p; console.log(`${p}% ${((Date.now() - t0) / 1000).toFixed(0)} s`); } },
	});
	console.log('done', out, existsSync(out));
}
