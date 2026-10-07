// A live build carries no prototype data (SC-73): the workspace app built with PUBLIC_API_BASE reads everything from
// backend-api, so none of the stub's seed may be in it. This looks for the seed's tell-tale values in the built files:
// the story's batch ids, the prototype's one-time code, and the story's people's names.
//   node scripts/no-seed.mjs workspace/build
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2];
if (!dir) throw new Error('usage: node scripts/no-seed.mjs <build dir>');
const seed = JSON.parse(
	readFileSync(new URL('../core/src/lib/workspace/seed/workspace.json', import.meta.url), 'utf8')
);
const tells = [
	...seed.batches.map((b) => b.id),
	seed.explore.code,
	...Object.values(seed.people).map((p) => p.name)
].filter((x) => typeof x === 'string' && x.length >= 6);

const files = [];
const walk = (d) =>
	readdirSync(d).forEach((f) => {
		const p = join(d, f);
		if (statSync(p).isDirectory()) walk(p);
		else if (/\.(js|html|json|webmanifest)$/.test(f)) files.push(p);
	});
walk(dir);
const found = [];
for (const f of files) {
	const text = readFileSync(f, 'utf8');
	for (const t of tells) if (text.includes(t)) found.push(`${f}: ${t}`);
}
if (found.length) {
	console.error(`no-seed: the build carries the prototype's data:\n${found.slice(0, 20).join('\n')}`);
	process.exit(1);
}
console.log(`no-seed: ${files.length} files, none of the seed's ${tells.length} tell-tale values`);
