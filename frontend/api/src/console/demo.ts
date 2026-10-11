// @smart-clearance/api/console/demo: the console's demo world (SC-169), design3's platform.js P.seed({ world: 'demo' }):
// Munchly Foods and four fictional clients with 180 days of their batches (the closed ones with what they kept out of
// landfill and destroyed), and two demo requests. Its seed is its own chunk, fetched when a mock starts from it, so the
// console app, which never does, carries none of it:
//   consoleMock({ world: demoWorld, signedIn: 'neha', storage: memoryStorage() })
import type { ConsoleWorld, ConsoleWorldSeed } from './mock';

export const demoWorld: ConsoleWorld = {
	name: 'demo',
	load: () => import('../seed/console-demo.json').then((m) => m.default as unknown as ConsoleWorldSeed)
};
