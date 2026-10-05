import { clientsQuery, overviewQuery, prefetch, requestsQuery } from '#lib/api/queries.ts';

export const load = () => prefetch(overviewQuery(), clientsQuery(), requestsQuery());
