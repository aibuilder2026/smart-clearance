import type { Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// Signing the journey's people in without a password (SC-95). backend-api/scripts/sessions.sh mints a Firebase custom
// token for each, signed as sc-api-local (as walk.sh does); here each is exchanged at Identity Toolkit with the app's
// own browser key, from the app's own origin, and the session is left where the app's Firebase SDK keeps it
// (browserLocalPersistence: localStorage, `firebase:authUser:<key>:[DEFAULT]`). The page then loads signed in, exactly
// as after the app's own sign-in, and refreshes its own token. No password is handled, typed or printed.

const REPO = new URL('../../../../', import.meta.url);

export type App = 'workspace' | 'console';
/** the stack a run takes: this machine's dev servers and local API (the default), or production's (E2E_TARGET=prod,
 *  SC-137): the deployed apps on Firebase Hosting, backend-api on Cloud Run, the agents on Cloud Run */
export const PROD = process.env.E2E_TARGET === 'prod';
export const ORIGIN: Record<App, string> = {
	workspace:
		process.env.E2E_WORKSPACE_URL ?? (PROD ? 'https://munchly-smartclearance.web.app' : 'http://localhost:5175'),
	console: process.env.E2E_CONSOLE_URL ?? (PROD ? 'https://smartclearance-console.web.app' : 'http://localhost:5174')
};

export type Person = { uid: string; email: string; name: string; role: string; org: string; token: string };
type Session = { idToken: string; refreshToken: string; expiresAt: number };

/** production's build settings for an app, as CI builds it: the repository's variables (public values: the API's
 *  address and the app's browser key), read once with gh */
const PROD_VARS: Record<App, { PUBLIC_API_BASE: string; PUBLIC_FIREBASE_API_KEY: string }> = {
	workspace: { PUBLIC_API_BASE: 'WORKSPACE_API_BASE', PUBLIC_FIREBASE_API_KEY: 'WORKSPACE_FIREBASE_API_KEY' },
	console: { PUBLIC_API_BASE: 'PUBLIC_API_BASE', PUBLIC_FIREBASE_API_KEY: 'PUBLIC_FIREBASE_API_KEY' }
};
const prodEnv = new Map<App, Record<string, string>>();
function prodSettings(app: App): Record<string, string> {
	const had = prodEnv.get(app);
	if (had) return had;
	const vars = JSON.parse(
		execFileSync('gh', ['variable', 'list', '--json', 'name,value'], { encoding: 'utf8', cwd: REPO.pathname })
	) as { name: string; value: string }[];
	const value = (name: string) => {
		const v = vars.find((x) => x.name === name)?.value;
		if (!v) throw new Error(`the repository has no ${name}: production's ${app} cannot be reached`);
		return v;
	};
	const out = Object.fromEntries(Object.entries(PROD_VARS[app]).map(([k, name]) => [k, value(name)]));
	prodEnv.set(app, out);
	return out;
}

/** what an app's .env.local names (backend-api/scripts/app-env.sh writes them); on production, its build settings */
export function appEnv(app: App): Record<string, string> {
	if (PROD) return prodSettings(app);
	const text = readFileSync(new URL(`frontend/${app}/.env.local`, REPO), 'utf8');
	return Object.fromEntries(
		text
			.split('\n')
			.filter((l) => /^[A-Z_]+=/.test(l))
			.map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()])
	);
}

let people: Record<string, Person> = {};

/** the custom tokens for everyone the suite acts as, minted once (each is good for an hour) */
export function mint(ids: string[]) {
	const out = execFileSync(new URL('backend-api/scripts/sessions.sh', REPO).pathname, ids, {
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'inherit'],
		maxBuffer: 16 * 1024 * 1024
	});
	people = { ...people, ...(JSON.parse(out) as Record<string, Person>) };
	return people;
}

export const person = (id: string) => {
	const p = people[id];
	if (!p) throw new Error(`no session minted for ${id}`);
	return p;
};

const sessions = new Map<string, Session>();

/** a Firebase session for a person on an app: the custom token exchanged with that app's key, from its origin */
async function session(app: App, id: string): Promise<Session> {
	const key = `${app}:${id}`;
	const had = sessions.get(key);
	if (had && had.expiresAt > Date.now() + 5 * 60_000) return had;
	const apiKey = appEnv(app).PUBLIC_FIREBASE_API_KEY;
	const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Referer: `${ORIGIN[app]}/` },
		body: JSON.stringify({ token: person(id).token, returnSecureToken: true })
	});
	if (!r.ok) throw new Error(`Firebase refused ${id}'s custom token on the ${app}: ${r.status}`);
	const j = (await r.json()) as { idToken: string; refreshToken: string; expiresIn: string };
	const s = { idToken: j.idToken, refreshToken: j.refreshToken, expiresAt: Date.now() + Number(j.expiresIn) * 1000 };
	sessions.set(key, s);
	return s;
}

/** backend-api, read as a person (for the figures the report keeps, and to wait on what the agents do) */
export async function api<T = unknown>(app: App, id: string, path: string, init: RequestInit = {}): Promise<T> {
	const base = appEnv(app).PUBLIC_API_BASE || 'http://localhost:8000';
	const s = await session(app, id);
	const r = await fetch(base + path, {
		...init,
		headers: {
			Authorization: `Bearer ${s.idToken}`,
			Origin: ORIGIN[app],
			'Content-Type': 'application/json',
			...init.headers
		}
	});
	if (!r.ok) throw new Error(`${init.method ?? 'GET'} ${path} as ${id} answered ${r.status}: ${await r.text()}`);
	return (r.status === 204 ? null : await r.json()) as T;
}

/** the user record the Firebase SDK persists after a sign-in (UserImpl.toJSON) */
async function record(app: App, id: string) {
	const p = person(id);
	const s = await session(app, id);
	const apiKey = appEnv(app).PUBLIC_FIREBASE_API_KEY;
	return {
		key: `firebase:authUser:${apiKey}:[DEFAULT]`,
		value: JSON.stringify({
			uid: p.uid,
			email: p.email,
			emailVerified: false,
			isAnonymous: false,
			providerData: [],
			stsTokenManager: { refreshToken: s.refreshToken, accessToken: s.idToken, expirationTime: s.expiresAt },
			createdAt: String(Date.now()),
			lastLoginAt: String(Date.now()),
			apiKey,
			appName: '[DEFAULT]'
		})
	};
}

const BLANK = '/__e2e-session';
const routed = new WeakSet<Page>();

/** opens an app at a path, signed in as a person. The session is put in place from a bare page on the app's origin
 *  (served here, so none of the app's code runs while it changes: its Firebase SDK moves a stored user between
 *  localStorage and IndexedDB as it starts), every other Firebase session there is cleared (one person at a time, as
 *  the app's own sign-out leaves it), then the app loads */
export async function openAs(page: Page, app: App, id: string, path = '/') {
	const { key, value } = await record(app, id);
	const origin = ORIGIN[app];
	if (!routed.has(page)) {
		routed.add(page);
		await page.route(`**${BLANK}`, (r) =>
			r.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Signing in</title>' })
		);
	}
	await page.goto(origin + BLANK);
	await page.evaluate(
		async ([key, value]) => {
			for (const k of Object.keys(localStorage)) if (k.startsWith('firebase:authUser:')) localStorage.removeItem(k);
			localStorage.setItem(key, value);
			await new Promise((done) => {
				const r = indexedDB.deleteDatabase('firebaseLocalStorageDb');
				r.onsuccess = r.onerror = r.onblocked = () => done(null);
			});
		},
		[key, value] as const
	);
	await page.goto(origin + path);
}
