import { auditQuery, clientQuery, clientsQuery, prefetch } from '#lib/api/queries.ts';

export const load = ({ params }) => prefetch(clientQuery(params.id), clientsQuery(), auditQuery(params.id));
