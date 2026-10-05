import { defineEnvVars } from '@sveltejs/kit/env';

// Every variable is public and inlined at build time: the site is static, so there is no server to read them later.
// Copy .env.example to .env to set them locally.
const url = (fallback?: string) => (value: string | undefined) => {
	if (!value) return fallback;
	new URL(value); // a malformed address fails the build
	return value.replace(/\/$/, '');
};

export const variables = defineEnvVars({
	PUBLIC_API_BASE: {
		public: true,
		static: true,
		schema: url(),
		description:
			'The backend API, e.g. https://api.smartclearance.com. Unset, the app reads the prototype data from the in-browser mock.'
	},
	PUBLIC_MOCK_LATENCY_MS: {
		public: true,
		static: true,
		schema: (value) => (value ? Number(value) : 0),
		description: 'Delay, in milliseconds, the mock API adds to each call, to see loading states. Default 0.'
	},
	PUBLIC_DEMO_URL: {
		public: true,
		static: true,
		schema: url('https://claude.ai/design/p/8294ec70-3e6b-4359-8de6-2a3fd056c3b2?file=Smart-Clearance+demo+v3.html'),
		description: 'The guided demo. Default: the hosted prototype on Claude Design.'
	},
	PUBLIC_APP_URL: {
		public: true,
		static: true,
		schema: url('https://claude.ai/design/p/78962e0f-7300-46e4-8be7-ee1cbd101839?file=Smart-Clearance+app+v3.html'),
		description:
			"Munchly Foods' workspace (munchly.smartclearance.com). Default: the hosted prototype on Claude Design."
	},
	PUBLIC_CONSOLE_URL: {
		public: true,
		static: true,
		schema: url('https://claude.ai/design/p/976c5462-c3c3-4621-80b5-29b3cdda8326?file=Smart-Clearance+console+v3.html'),
		description: 'The staff console. Default: the hosted prototype on Claude Design.'
	},
	PUBLIC_DEV_ROUTES: {
		public: true,
		static: true,
		schema: (value) => value === '1' || value === 'true',
		description: 'Set to 1 to serve the /ds design-system page outside the dev server. Off by default.'
	}
});
