import { error } from '@sveltejs/kit';
import { routeOf } from '@smart-clearance/core/console';
import { data } from '#lib/api/client.ts';

// Every address is one route: the console's place it names (routeOf: /, /clients, /clients/munchly/supply,
// /new-client?request=…), its code and data read before it draws, and its reads the splash's stops after a sign-in
// (ConsoleData.load). An address the console doesn't have is a 404, which ConsoleApp shows as Not found
export const load = ({ url }) => {
	const route = routeOf(url.pathname, url.searchParams);
	if (!route) error(404, 'Not found');
	return data.load(route);
};
