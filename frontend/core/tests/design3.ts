// Reading design3, the source of truth, from the tests: its files, and its plain-JS modules run as a browser page would.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url));
export const design3 = (path: string) => join(here, '../../../design3', path);
/** a file of this package, from its root */
export const own = (path: string) => readFileSync(join(here, '..', path), 'utf8');
export const read = (path: string) => readFileSync(design3(path), 'utf8');

/** runs design3 scripts in order in one sandbox, as <script> tags would, and returns its window */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the prototype's modules are untyped browser globals
export function run(...paths: string[]): Record<string, any> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const window: Record<string, any> = { SC3_IMG: 'sc3img:/' };
	const sandbox = vm.createContext({ window, console, Date, Intl, Math, JSON });
	for (const p of paths) vm.runInContext(read(p), sandbox, { filename: design3(p) });
	return window;
}
