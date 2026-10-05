// The console's API over HTTP: the same contract as consoleMock, on backend-api's /v1/console routes
import { transport, type TransportOptions } from '../http';
import { ApiError } from '../types/shared';
import type { Client, ConsoleApi, Staff } from '../types/console';

export function consoleHttp(base: string, options?: TransportOptions): ConsoleApi {
	const call = transport(base, options);
	const c = (id: string) => `/v1/console/clients/${encodeURIComponent(id)}`;
	return {
		catalog: () => call('GET', '/v1/platform/catalog'),
		config: () => call('GET', '/v1/console/config'),
		lookupWorkspaces: (query) => call('POST', '/v1/workspaces/lookup', { query }),

		signInAccounts: () => call('GET', '/v1/console/session/accounts'),
		signIn: (staffId) => call('POST', '/v1/console/session', { staffId }),
		signOut: () => call('DELETE', '/v1/console/session'),
		me: () =>
			call<Staff | null>('GET', '/v1/console/session').catch((e) => {
				if (e instanceof ApiError && e.status === 401) return null;
				throw e;
			}),

		overview: () => call('GET', '/v1/console/overview'),
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
		remindDistributor: (id, d) => call('POST', `${c(id)}/distributors/${encodeURIComponent(d)}/reminders`),
		requestFirstExport: (id) => call('POST', `${c(id)}/integrations/dms/requests`),
		invitePerson: (id, input) => call('POST', `${c(id)}/people`, input),
		updatePerson: (id, person, patch) => call('PATCH', `${c(id)}/people/${encodeURIComponent(person)}`, patch),
		resendInvite: (id, person) => call('POST', `${c(id)}/people/${encodeURIComponent(person)}/invitations`),
		createClient: (input) => call('POST', '/v1/console/clients', input),
		inviteStaff: (input) => call('POST', '/v1/console/staff', input)
	};
}
