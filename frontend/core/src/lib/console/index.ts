// @smart-clearance/core/console: the staff console (SC-169), the port of design3/console, as one component a host
// renders: the console app on real paths (frontend/console), the guided demo in a laptop. ConsoleApp takes the API (or
// the host's ConsoleData over it), the route and what to do when the console moves; everything else lives here. Its
// stylesheet is @smart-clearance/core/console/console.css (design3/console/console.css, verbatim), which the host
// imports after core's (tokens, fonts, base, components and screens.css), as the console app's layout does: the cascade
// puts the console's rules over the kit's.
export { default as ConsoleApp } from './ConsoleApp.svelte';
export { ConsoleData, queriesOf, type ConsoleQueries, type ConsoleSplash } from './data.svelte';
export { Console, useConsole, provideConsole, type ConsoleLinks } from './console.svelte';
export {
	routePath,
	routeOf,
	routeHash,
	routeOfHash,
	sameScreen,
	sameRoute,
	SCREENS,
	TABS,
	type ConsoleRoute,
	type ConsoleScreen,
	type GoOptions
} from './route';
export { navOf, TITLES } from './nav';
