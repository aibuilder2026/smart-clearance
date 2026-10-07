// The live workspace (SC-73): backend-api's workspace routes for the workspace this build serves, members signed in
// with Firebase Authentication, the live stream while someone is using the app, and the source the screens read.
import {
	PUBLIC_API_BASE,
	PUBLIC_FIREBASE_API_KEY,
	PUBLIC_FIREBASE_APP_ID,
	PUBLIC_FIREBASE_AUTH_DOMAIN,
	PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	PUBLIC_FIREBASE_PROJECT_ID,
	PUBLIC_WORKSPACE_ID
} from '$app/env/public';
import { createFirebase, refusals } from '@smart-clearance/api/firebase';
import { browserActivity, workspaceHttp } from '@smart-clearance/api/workspace';
import { LiveSource } from './source.svelte';
import { Push, registerWorker } from './push.svelte';

/** one email-and-password refusal for any wrong sign-in, as the console's (enumeration protection) */
export const SIGN_IN_FAILED = 'That email and password do not match an account in this workspace.';

export const firebase = createFirebase(
	{
		apiKey: PUBLIC_FIREBASE_API_KEY,
		authDomain: PUBLIC_FIREBASE_AUTH_DOMAIN,
		projectId: PUBLIC_FIREBASE_PROJECT_ID,
		appId: PUBLIC_FIREBASE_APP_ID,
		messagingSenderId: PUBLIC_FIREBASE_MESSAGING_SENDER_ID
	},
	{
		refusal: refusals('The workspace', SIGN_IN_FAILED),
		unset: 'PUBLIC_FIREBASE_* is not set: run backend-api/scripts/app-env.sh'
	}
);

/** this device's web push, once the live workspace has started */
export let push: Push | null = null;

export function live(): LiveSource {
	if (!PUBLIC_API_BASE || !PUBLIC_WORKSPACE_ID)
		throw new Error('PUBLIC_API_BASE and PUBLIC_WORKSPACE_ID are not set: run backend-api/scripts/app-env.sh');
	const api = workspaceHttp(PUBLIC_API_BASE, PUBLIC_WORKSPACE_ID, { auth: firebase.auth });
	// the offline shell and where pushes arrive; the ask for push is the member's (push)
	void registerWorker();
	push = new Push({ app: firebase.app, api });
	return new LiveSource({
		api,
		base: PUBLIC_API_BASE,
		ws: PUBLIC_WORKSPACE_ID,
		token: (fresh) => firebase.auth.token(fresh),
		activity: browserActivity()
	});
}
