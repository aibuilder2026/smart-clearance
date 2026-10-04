import { defineEnvVars } from '@sveltejs/kit/env';

// Every variable is public and inlined at build time: the site is static, so there is no server to read them later.
const optionalUrl = (value: string | undefined) => {
	if (!value) return undefined;
	new URL(value); // throws on a malformed address, which fails the build
	return value.replace(/\/$/, '');
};

export const variables = defineEnvVars({
	PUBLIC_API_BASE: {
		public: true,
		static: true,
		schema: optionalUrl,
		description:
			'The backend API, e.g. https://api.smartclearance.com. Unset, the app reads the prototype data from the in-browser mock.'
	},
	PUBLIC_MOCK_LATENCY_MS: {
		public: true,
		static: true,
		schema: (value) => (value ? Number(value) : 0),
		description: 'Delay, in milliseconds, the mock API adds to each call, to see loading states. Default 0.'
	}
});
