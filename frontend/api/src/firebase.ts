// Firebase Authentication for every app that signs people in with an email and a password (SC-46, SC-66): the
// console's staff and a workspace's members share one user pool. The SDK loads only when an app talks to backend-api,
// and only its auth part; the workspace app also opens Cloud Messaging on the same Firebase app, for push. Every
// account was made by backend-api on a default password; nobody signs themselves up, and nothing is mailed.
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import { ApiError, type PasswordAuth } from './types/shared';

export type FirebaseConfig = {
	apiKey?: string;
	authDomain?: string;
	projectId?: string;
	appId?: string;
	messagingSenderId?: string;
};

export type FirebaseOptions = {
	/** Firebase's refusal in the app's words: one message for any wrong email or password (enumeration protection) */
	refusal: (code: string) => ApiError;
	/** what to say when the app was built without its Firebase config */
	unset: string;
	/** called as a sign-out reaches each of its stops (the console's splash marks them) */
	onStep?: (step: 'session-end' | 'firebase') => void;
};

export type Firebase = {
	auth: PasswordAuth;
	/** the Firebase app, for Cloud Messaging */
	app(): Promise<FirebaseApp>;
};

type AuthModule = typeof import('firebase/auth');

export function createFirebase(config: FirebaseConfig, options: FirebaseOptions): Firebase {
	let ready: Promise<{ app: FirebaseApp; auth: Auth; fb: AuthModule }> | null = null;
	const load = () =>
		(ready ??= (async () => {
			if (!config.apiKey || !config.authDomain || !config.projectId) throw new Error(options.unset);
			const [{ initializeApp }, fb] = await Promise.all([import('firebase/app'), import('firebase/auth')]);
			const app = initializeApp({
				apiKey: config.apiKey,
				authDomain: config.authDomain,
				projectId: config.projectId,
				appId: config.appId,
				messagingSenderId: config.messagingSenderId
			});
			const auth = fb.getAuth(app);
			// the session survives a reload, in this browser only
			await fb.setPersistence(auth, fb.browserLocalPersistence);
			await auth.authStateReady();
			return { app, auth, fb };
		})());
	return {
		auth: {
			async signIn(email, password) {
				const { auth, fb } = await load();
				try {
					await fb.signInWithEmailAndPassword(auth, email, password);
				} catch (e) {
					throw options.refusal((e as { code?: string })?.code ?? '');
				}
			},
			async signOut() {
				options.onStep?.('session-end');
				const { auth, fb } = await load();
				await fb.signOut(auth);
				options.onStep?.('firebase');
			},
			async token(fresh = false) {
				const { auth } = await load();
				return auth.currentUser ? auth.currentUser.getIdToken(fresh) : null;
			}
		},
		app: async () => (await load()).app
	};
}

/** the refusals both apps make in the same words, given what they call themselves ("the console", "the workspace") */
export const refusals =
	(app: string, wrong: string) =>
	(code: string): ApiError => {
		if (code === 'auth/too-many-requests')
			return new ApiError(429, 'Too many tries. Wait a few minutes, then sign in again.');
		if (code === 'auth/network-request-failed') return new ApiError(0, `${app} is offline. Check the connection.`);
		if (code === 'auth/user-disabled') return new ApiError(401, `This account cannot sign in to ${app.toLowerCase()}.`);
		return new ApiError(401, wrong);
	};
