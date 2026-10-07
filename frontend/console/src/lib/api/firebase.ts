import {
	PUBLIC_FIREBASE_API_KEY,
	PUBLIC_FIREBASE_APP_ID,
	PUBLIC_FIREBASE_AUTH_DOMAIN,
	PUBLIC_FIREBASE_PROJECT_ID
} from '$app/env/public';
import { SIGN_IN_FAILED, type ConsoleAuth } from '@smart-clearance/api/console';
import { createFirebase, refusals } from '@smart-clearance/api/firebase';

// Staff sign in to the console with Firebase Authentication, a work email and a password (SC-46), through the module
// the workspace app shares (@smart-clearance/api/firebase). Every account was made by backend-api on a default
// password; nobody signs themselves up, and nothing is mailed.
const firebase = createFirebase(
	{
		apiKey: PUBLIC_FIREBASE_API_KEY,
		authDomain: PUBLIC_FIREBASE_AUTH_DOMAIN,
		projectId: PUBLIC_FIREBASE_PROJECT_ID,
		appId: PUBLIC_FIREBASE_APP_ID
	},
	{
		refusal: refusals('The console', SIGN_IN_FAILED),
		unset: 'PUBLIC_FIREBASE_* is not set: run backend-api/scripts/app-env.sh',
		// backend-api has closed the session by the time Firebase signs out (consoleHttp): the splash's two stops
		onStep: (step) => window.SC3_SPLASH?.mark(step)
	}
);

export const firebaseAuth: ConsoleAuth = firebase.auth;
