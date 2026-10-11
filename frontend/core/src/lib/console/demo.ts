// @smart-clearance/core/console/demo: the console on the demo world (SC-169), as the guided demo shows it: the
// in-browser mock of the platform (consoleMock) on design3's demo world (Munchly Foods and four fictional clients, 180
// days of their batches, two demo requests), kept in memory only, with a staff member already signed in. Nothing is
// read from or written to the visitor's storage, so each demo starts from the same world.
import { consoleMock, memoryStorage, type ConsoleApi } from '@smart-clearance/api/console';

export function demoConsoleApi({
	signedIn = 'neha',
	latency = 0
}: {
	/** the staff member signed in from the start (Neha Kulkarni unless named); null starts at the sign-in */
	signedIn?: string | null;
	/** milliseconds each call waits, to see the loaders */
	latency?: number;
} = {}): ConsoleApi {
	return consoleMock({ storage: memoryStorage(), world: 'demo', signedIn: signedIn ?? undefined, latency });
}
