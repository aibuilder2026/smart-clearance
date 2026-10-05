// The landing page's API as the prototype answers it, in the browser: the seed and the prototype's own rule for taking
// a demo request (design3/site's DemoSheet). backend-api implements the same contract.
import { isEmail } from '@smart-clearance/core/identity';
import showcase from '../seed/showcase.json';
import { ApiError, type DemoRequest, type DemoRequestInput } from '../types/shared';
import type { Showcase, SiteApi } from '../types/site';
import { browserStorage, catalog, lookupWorkspaces, waiter, type MockOptions } from './shared';

/** where the mock keeps demo requests, in the shape the console lists them (design3/core/platform.js requests) */
export const DEMO_REQUESTS_KEY = 'sc-demo-requests';

export function demoRequestErrors(input: DemoRequestInput): Record<string, string> {
	const e: Record<string, string> = {};
	if (!input.name.trim()) e.name = 'Enter your name.';
	if (!input.company.trim()) e.company = "Enter your company's name.";
	if (!isEmail(input.email)) e.email = 'Enter a work email address, like name@company.in.';
	return e;
}

export function siteMock({ latency = 0, storage = browserStorage }: MockOptions = {}): SiteApi {
	const wait = waiter(latency);
	return {
		async showcase() {
			await wait();
			return structuredClone(showcase) as Showcase;
		},
		async catalog() {
			await wait();
			return catalog();
		},
		async lookupWorkspaces(query) {
			await wait();
			return lookupWorkspaces(query);
		},
		// design3/site DemoSheet: the request, stamped and kept in this browser
		async requestDemo(input) {
			await wait();
			const fields = demoRequestErrors(input);
			if (Object.keys(fields).length) throw new ApiError(422, 'Check the highlighted fields.', fields);
			const req: DemoRequest = {
				id: 'rq-' + Date.now().toString(36),
				at: new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
				name: input.name.trim(),
				company: input.company.trim(),
				email: input.email.trim().toLowerCase(),
				makes: input.makes,
				plan: input.plan || null,
				note: input.note.trim(),
				status: 'new'
			};
			try {
				const s = storage();
				if (s) s.setItem(DEMO_REQUESTS_KEY, JSON.stringify([req, ...JSON.parse(s.getItem(DEMO_REQUESTS_KEY) || '[]')]));
			} catch {
				// storage blocked: the request still counts as sent for this visit
			}
			return req;
		}
	};
}
