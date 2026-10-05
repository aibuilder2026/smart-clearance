import { dev } from '$app/env';
import { PUBLIC_DEV_ROUTES } from '$app/env/public';
import { error } from '@sveltejs/kit';

// pages for the people building Smart-Clearance, not its visitors: client-side only, and missing from a production
// build unless PUBLIC_DEV_ROUTES is set
export const ssr = false;

export const load = () => {
	if (!dev && !PUBLIC_DEV_ROUTES) error(404, 'Not found');
};
