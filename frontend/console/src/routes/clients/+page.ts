import { clientsQuery, prefetch } from '#lib/api/queries.ts';

export const load = () => prefetch(clientsQuery());
