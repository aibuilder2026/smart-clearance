import { clientsQuery, prefetch, requestsQuery } from '#lib/api/queries.ts';

export const load = () => prefetch(clientsQuery(), requestsQuery());
