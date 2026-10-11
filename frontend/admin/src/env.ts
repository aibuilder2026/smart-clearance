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
			'The backend API, e.g. https://backend-api-….run.app. Unset, the app reads the prototype data from the in-browser mock.'
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
		schema: url('https://smartclearance-demo.web.app'),
		description:
			'The guided demo (smartclearance-demo.web.app), the default; the demo film offers it when it ends (SC-164).'
	},
	PUBLIC_DEMO_FILM: {
		public: true,
		static: true,
		schema: (value) => {
			if (!value) return 'EWFLqM3oHYU';
			if (value === 'off') return undefined;
			if (!/^[\w-]{11}$/.test(value))
				throw new Error(`PUBLIC_DEMO_FILM is a YouTube video id (11 characters): ${value}`);
			return value;
		},
		description:
			"The demo film's YouTube video id (unlisted), played in the theatre over the page (SC-164). Default: youtu.be/EWFLqM3oHYU; `off` makes Watch open the guided demo."
	},
	PUBLIC_APP_URL: {
		public: true,
		static: true,
		schema: url('https://munchly-smartclearance.web.app'),
		description: "Munchly Foods' workspace (munchly-smartclearance.web.app), the default."
	},
	PUBLIC_CONSOLE_URL: {
		public: true,
		static: true,
		schema: url('https://smartclearance-console.web.app'),
		description: 'The staff console (smartclearance-console.web.app), the default.'
	},
	PUBLIC_DEV_ROUTES: {
		public: true,
		static: true,
		schema: (value) => value === '1' || value === 'true',
		description: 'Set to 1 to serve the /ds design-system page outside the dev server. Off by default.'
	}
});
