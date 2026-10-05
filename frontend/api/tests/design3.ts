// Reading design3, the source of truth, from the tests: its plain-JS modules run as a browser page would
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { memory } from './memory';

const here = dirname(fileURLToPath(import.meta.url));
export const read = (path: string) => readFileSync(join(here, '../../../design3', path), 'utf8');

/** runs design3/core's scripts in order in one sandbox, as <script> tags would, and returns its window */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the prototype's modules are untyped browser globals
export function prototype(): Record<string, any> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const window: Record<string, any> = { SC3_IMG: 'sc3img:/' };
	const sandbox = vm.createContext({
		window,
		localStorage: memory(),
		console,
		Date,
		Intl,
		Math,
		JSON,
		structuredClone
	});
	for (const p of ['core/money.js', 'core/data.js', 'core/store.js', 'core/platform.js'])
		vm.runInContext(read(p), sandbox, { filename: p });
	return window;
}
