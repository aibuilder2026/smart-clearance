import { defineEnvVars } from '@sveltejs/kit/env';

// Every variable is public and inlined at build time: the console is static, so there is no server to read them later.
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
			'The backend API, e.g. https://api.smartclearance.com. Unset, the console reads and changes the prototype data in the in-browser mock.'
	},
	// Firebase Authentication, which staff sign in with when the console talks to backend-api (SC-46). The web app's
	// config is public by design (it ships in this JavaScript); it comes from Terraform's console_firebase_config output
	// (backend-api/scripts/console-env.sh writes .env.local), never from the repository.
	PUBLIC_FIREBASE_API_KEY: {
		public: true,
		static: true,
		schema: (value) => value || undefined,
		description: "The console's Firebase web app's browser key (restricted to Firebase Auth and the console's origins)."
	},
	PUBLIC_FIREBASE_AUTH_DOMAIN: {
		public: true,
		static: true,
		schema: (value) => value || undefined,
		description: 'Firebase Auth domain, e.g. <project>.firebaseapp.com.'
	},
	PUBLIC_FIREBASE_PROJECT_ID: {
		public: true,
		static: true,
		schema: (value) => value || undefined,
		description: 'The Google Cloud and Firebase project.'
	},
	PUBLIC_FIREBASE_APP_ID: {
		public: true,
		static: true,
		schema: (value) => value || undefined,
		description: "The console's Firebase web app id."
	},
	PUBLIC_MOCK_LATENCY_MS: {
		public: true,
		static: true,
		schema: (value) => (value ? Number(value) : 0),
		description: 'Delay, in milliseconds, the mock API adds to each call, to see loading states. Default 0.'
	},
	PUBLIC_SITE_URL: {
		public: true,
		static: true,
		schema: url('https://claude.ai/design/p/976c5462-c3c3-4621-80b5-29b3cdda8326?file=Smart-Clearance+site+v3.html'),
		description: 'The landing page (smartclearance.com). Default: the hosted prototype on Claude Design.'
	},
	PUBLIC_APP_URL: {
		public: true,
		static: true,
		schema: url('https://claude.ai/design/p/78962e0f-7300-46e4-8be7-ee1cbd101839?file=Smart-Clearance+app+v3.html'),
		description:
			"Munchly Foods' workspace (munchly.smartclearance.com). Default: the hosted prototype on Claude Design."
	}
});
