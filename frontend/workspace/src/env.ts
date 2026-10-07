import { defineEnvVars } from '@sveltejs/kit/env';

// Every variable is public and inlined at build time: the workspace app is static, so there is no server to read them
// later. Unset, the app runs Munchly's journey on the prototype's stub in the browser; with PUBLIC_API_BASE it runs on
// backend-api (SC-73), signing members in with Firebase Authentication. backend-api/scripts/app-env.sh writes
// .env.local from Terraform's workspace_firebase_config output; nothing here is ever committed.
const url = (value: string | undefined) => {
	if (!value) return undefined;
	new URL(value); // a malformed address fails the build
	return value.replace(/\/$/, '');
};
const text = (value: string | undefined) => value || undefined;

export const variables = defineEnvVars({
	PUBLIC_API_BASE: {
		public: true,
		static: true,
		schema: url,
		description:
			'The backend API, e.g. https://backend-api-….run.app. Unset, the workspace runs on the prototype’s stub in this browser.'
	},
	PUBLIC_WORKSPACE_ID: {
		public: true,
		static: true,
		schema: text,
		description: 'The client workspace this app serves, e.g. munchly (backend-api’s /v1/workspaces/{id}).'
	},
	PUBLIC_FIREBASE_API_KEY: {
		public: true,
		static: true,
		schema: text,
		description:
			"The workspace's Firebase web app's browser key (restricted to Firebase Auth, installations and messaging)."
	},
	PUBLIC_FIREBASE_AUTH_DOMAIN: {
		public: true,
		static: true,
		schema: text,
		description: 'Firebase Auth domain, e.g. <project>.firebaseapp.com.'
	},
	PUBLIC_FIREBASE_PROJECT_ID: { public: true, static: true, schema: text, description: 'The Google Cloud project.' },
	PUBLIC_FIREBASE_APP_ID: {
		public: true,
		static: true,
		schema: text,
		description: "The workspace's Firebase web app id."
	},
	PUBLIC_FIREBASE_MESSAGING_SENDER_ID: {
		public: true,
		static: true,
		schema: text,
		description: 'Firebase Cloud Messaging’s sender id, for web push.'
	}
});
