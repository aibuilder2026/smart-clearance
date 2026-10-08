// The console's API over HTTP: the same contract as consoleMock, on backend-api's /v1/console routes. Staff sign in
// with Firebase Authentication (the app's ConsoleAuth); every call carries the Firebase ID token.
import { transport, type TransportOptions } from '../http';
import { ApiError } from '../types/shared';
import type { UploadLink } from '../types/workspace';
import { putUpload } from '../workspace/upload';
import type { Client, ConsoleApi, ConsoleAuth, Staff } from '../types/console';

export function consoleHttp(
	base: string,
	{ auth, ...options }: Omit<TransportOptions, 'token'> & { auth: ConsoleAuth }
): ConsoleApi {
	const call = transport(base, { ...options, token: () => auth.token() });
	const c = (id: string) => `/v1/console/clients/${encodeURIComponent(id)}`;
	return {
		catalog: () => call('GET', '/v1/platform/catalog'),
		config: () => call('GET', '/v1/console/config'),
		lookupWorkspaces: (query) => call('POST', '/v1/workspaces/lookup', { query }),

		// Firebase checks the email and password; backend-api answers the staff member the account belongs to (and makes an
		// invited one active). A Firebase account that isn't active staff is signed out again
		async signIn({ email, password }) {
			await auth.signIn(email.trim(), password);
			try {
				return await call<Staff>('POST', '/v1/console/session');
			} catch (e) {
				await auth.signOut();
				throw e;
			}
		},
		async signOut() {
			await call('DELETE', '/v1/console/session').catch(() => undefined);
			await auth.signOut();
		},
		async me() {
			if (!(await auth.token())) return null;
			return call<Staff | null>('GET', '/v1/console/session').catch((e) => {
				if (e instanceof ApiError && e.status === 401) return null;
				throw e;
			});
		},

		overview: () => call('GET', '/v1/console/overview'),
		dashboard: (days, client) =>
			call('GET', `/v1/console/dashboard?days=${days}` + (client ? `&client=${encodeURIComponent(client)}` : '')),
		batches: (query = {}) => {
			const params = new URLSearchParams();
			for (const [k, v] of Object.entries(query)) if (v != null && v !== '') params.set(k, String(v));
			const qs = params.toString();
			return call('GET', '/v1/console/batches' + (qs ? `?${qs}` : ''));
		},
		clients: () => call('GET', '/v1/console/clients'),
		client: (id) =>
			call<Client | null>('GET', c(id)).catch((e) => {
				if (e instanceof ApiError && e.status === 404) return null;
				throw e;
			}),
		staff: () => call('GET', '/v1/console/staff'),
		audit: (client) => call('GET', '/v1/console/audit' + (client ? `?client=${encodeURIComponent(client)}` : '')),
		demoRequests: () => call('GET', '/v1/demo-requests'),

		updateAgent: (id, agent, patch) => call('PATCH', `${c(id)}/agents/${encodeURIComponent(agent)}`, patch),
		runAgent: (id, agent) => call('POST', `${c(id)}/agents/${encodeURIComponent(agent)}/runs`),
		setAllAgents: (id, on) => call('POST', `${c(id)}/agents/${on ? 'resume' : 'pause'}`),
		goLive: (id) => call('POST', `${c(id)}/go-live`),
		setPlan: (id, plan) => call('PATCH', c(id), { plan }),
		saveProfile: (id, input) => call('PUT', `${c(id)}/profile`, input),
		saveRules: (id, input) => call('PUT', `${c(id)}/rules`, input),
		setDayMinutes: (id, dayMinutes) => call('PUT', `${c(id)}/clock`, { dayMinutes }),
		journey: (id) => call('GET', `${c(id)}/journey`),
		fireTrigger: (id, trigger) => call('POST', `${c(id)}/journey/triggers/${encodeURIComponent(trigger)}`),
		resetJourney: (id, input) => call('POST', `${c(id)}/journey/reset`, input ?? {}),
		uploadExport: async (id, file, opts) => {
			const link = await call<UploadLink>('POST', `${c(id)}/exports`, {
				contentType: file.type || 'text/csv',
				bytes: file.size,
				fileName: file.name
			});
			await putUpload(link, file, opts);
			return call<Client>('POST', `${c(id)}/exports/${encodeURIComponent(link.id)}`, { fileName: file.name });
		},
		clientBatches: (id, sku) => call('GET', `${c(id)}/batches` + (sku ? `?sku=${encodeURIComponent(sku)}` : '')),
		saveSkuGates: (id, sku, gates) => call('PUT', `${c(id)}/skus/${encodeURIComponent(sku)}/gates`, { gates }),
		overrideBatch: (id, ref, input) => call('PUT', `${c(id)}/batches/${encodeURIComponent(ref)}/override`, input),
		clearBatchOverride: (id, ref) => call('DELETE', `${c(id)}/batches/${encodeURIComponent(ref)}/override`),
		remindDistributor: (id, d) => call('POST', `${c(id)}/distributors/${encodeURIComponent(d)}/reminders`),
		requestFirstExport: (id) => call('POST', `${c(id)}/integrations/dms/requests`),
		invitePerson: (id, input) => call('POST', `${c(id)}/people`, input),
		updatePerson: (id, person, patch) => call('PATCH', `${c(id)}/people/${encodeURIComponent(person)}`, patch),
		resendInvite: (id, person) => call('POST', `${c(id)}/people/${encodeURIComponent(person)}/invitations`),
		createClient: (input) => call('POST', '/v1/console/clients', input),
		inviteStaff: (input) => call('POST', '/v1/console/staff', input)
	};
}
