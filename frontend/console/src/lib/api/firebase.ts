import {
	PUBLIC_FIREBASE_API_KEY,
	PUBLIC_FIREBASE_APP_ID,
	PUBLIC_FIREBASE_AUTH_DOMAIN,
	PUBLIC_FIREBASE_PROJECT_ID
} from '$app/env/public';
import { ApiError, SIGN_IN_FAILED, type ConsoleAuth } from '@smart-clearance/api/console';

// Staff sign in to the console with Firebase Authentication, a work email and a password (SC-46). The SDK loads only
// when the console talks to backend-api, and only its auth part. Every account was made by backend-api on a default
// password; nobody signs themselves up, and nothing is mailed.

type FirebaseAuth = typeof import('firebase/auth');
let ready: Promise<{ auth: import('firebase/auth').Auth; fb: FirebaseAuth }> | null = null;

function load() {
	ready ??= (async () => {
		if (!PUBLIC_FIREBASE_API_KEY || !PUBLIC_FIREBASE_AUTH_DOMAIN || !PUBLIC_FIREBASE_PROJECT_ID)
			throw new Error('PUBLIC_FIREBASE_* is not set: run backend-api/scripts/console-env.sh');
		const [{ initializeApp }, fb] = await Promise.all([import('firebase/app'), import('firebase/auth')]);
		const app = initializeApp({
			apiKey: PUBLIC_FIREBASE_API_KEY,
			authDomain: PUBLIC_FIREBASE_AUTH_DOMAIN,
			projectId: PUBLIC_FIREBASE_PROJECT_ID,
			appId: PUBLIC_FIREBASE_APP_ID
		});
		const auth = fb.getAuth(app);
		// the session survives a reload, in this browser only
		await fb.setPersistence(auth, fb.browserLocalPersistence);
		await auth.authStateReady();
		return { auth, fb };
	})();
	return ready;
}

// Firebase's refusals, in the console's words: one message for any wrong email or password, as enumeration protection
// requires; the rest say what happened
function refusal(e: unknown): ApiError {
	const code = (e as { code?: string })?.code ?? '';
	if (code === 'auth/too-many-requests')
		return new ApiError(429, 'Too many tries. Wait a few minutes, then sign in again.');
	if (code === 'auth/network-request-failed') return new ApiError(0, 'The console is offline. Check the connection.');
	if (code === 'auth/user-disabled') return new ApiError(401, 'This account cannot sign in to the console.');
	return new ApiError(401, SIGN_IN_FAILED);
}

export const firebaseAuth: ConsoleAuth = {
	async signIn(email, password) {
		const { auth, fb } = await load();
		try {
			await fb.signInWithEmailAndPassword(auth, email, password);
		} catch (e) {
			throw refusal(e);
		}
	},
	async signOut() {
		// backend-api has closed the session by the time this runs (consoleHttp); Firebase's is the second stop
		window.SC3_SPLASH?.mark('session-end');
		const { auth, fb } = await load();
		await fb.signOut(auth);
		window.SC3_SPLASH?.mark('firebase');
	},
	async token() {
		const { auth } = await load();
		return auth.currentUser ? auth.currentUser.getIdToken() : null;
	}
};
