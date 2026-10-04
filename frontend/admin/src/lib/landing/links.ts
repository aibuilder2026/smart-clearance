import { PUBLIC_APP_URL, PUBLIC_CONSOLE_URL, PUBLIC_DEMO_URL } from '$app/env/public';
import { prefersReducedMotion } from '@smart-clearance/core';

// where the other pages live: the hosted prototypes on Claude Design unless the build says otherwise (src/env.ts)
export const LINKS = { demo: PUBLIC_DEMO_URL!, app: PUBLIC_APP_URL!, console: PUBLIC_CONSOLE_URL! };

export const external = (href: string) => /^https?:/.test(href);
/** a link to another site opens in a new tab, as the prototype's do; a link within the site stays */
export const linkProps = (href: string) => (external(href) ? { href, target: '_blank', rel: 'noopener' } : { href });
/** opens another site in a new tab from a button (the prototype's open(), without its fallback that also navigated
 *  this tab: window.open returns null whenever noopener is set) */
export const openLink = (href: string) =>
	external(href) ? window.open(href, '_blank', 'noopener') : location.assign(href);

/** the bar's sections */
export const SECTIONS = [
	['how', 'How it works'],
	['agents', 'Agents'],
	['customers', 'Customers'],
	['pricing', 'Pricing']
] as const;

export const goTo = (id: string) =>
	document
		.getElementById(id)
		?.scrollIntoView({ behavior: prefersReducedMotion.current ? 'instant' : 'smooth', block: 'start' });
