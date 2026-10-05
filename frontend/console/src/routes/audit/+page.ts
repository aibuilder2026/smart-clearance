import { auditQuery, clientsQuery, prefetch } from '#lib/api/queries.ts';

export const load = () => prefetch(clientsQuery(), auditQuery());
