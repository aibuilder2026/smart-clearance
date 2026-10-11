// @smart-clearance/core/workspace/stub: Munchly Foods' workspace as the prototype runs it in the browser (SC-62, SC-67):
// the stub source, its store and journey, the seed they run on, and the people a visitor can step into. Importing it
// makes the stub the default source of every workspace screen.
import { D } from './data';

export { stubSource, data, kase, caseOf, HISTORY_CASES } from './stub.svelte';
export { store, seedState } from './store.svelte';
export {
	A,
	SCRIPT,
	SCRIPTS,
	scriptOf,
	act,
	run,
	fastForward,
	stageOf,
	Agents,
	scenario,
	useScenario,
	type ActionName
} from './flow';
export { D, WS, PLAN, KL, ES, INVOICE, CHIPS, SHOPS, EV, batchView, SCENARIOS, storyOf } from './data';
/** the stub's people to step into, the code it sends and the accounts its sign-in suggests */
export const EXPLORE = D.explore;
