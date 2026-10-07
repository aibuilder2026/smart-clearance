// @smart-clearance/core/workspace/stub: Munchly Foods' workspace as the prototype runs it in the browser (SC-62, SC-67):
// the stub source, its store and journey, the seed they run on, and the people a visitor can step into. Importing it
// makes the stub the default source of every workspace screen.
export { stubSource, data, kase } from './stub.svelte';
export { store, seedState } from './store.svelte';
export { A, SCRIPT, act, run, fastForward, stageOf, Agents, type ActionName } from './flow';
export { D, WS, PLAN, KL, ES, INVOICE, CHIPS, SHOPS, EV, batchView } from './data';
export { DEMO_PEOPLE, TEST_CODE } from './screens/auth/people';
