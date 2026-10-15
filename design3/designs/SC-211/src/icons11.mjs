// SC-211: the Lucide icons a scene page uses (lucide-static 0.468.0, ISC licence), taken from design3/system/icons.js
// into a small script for the page: window.ICONS = {name: svg inner}.
//   node icons11.mjs <out.js> name…
import { readFileSync, writeFileSync } from 'node:fs';
const [out, ...names] = process.argv.slice(2);
const src = readFileSync(new URL('../../../system/icons.js', import.meta.url), 'utf8');
const I = new Function('window', src + '; return window.SC3_ICONS;')({});
const miss = names.filter((n) => !I[n]);
if (miss.length) { console.error('missing', miss.join(' ')); process.exit(1); }
writeFileSync(out, '// Lucide (lucide-static 0.468.0, ISC licence), the icons design3/system/icons.js carries\nwindow.ICONS = ' +
	JSON.stringify(Object.fromEntries(names.map((n) => [n, I[n]]))) + ';\n');
console.log(out, names.length);
