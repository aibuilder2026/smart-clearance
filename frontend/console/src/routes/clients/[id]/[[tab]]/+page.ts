import { auditQuery, clientBatchesQuery, clientQuery, clientsQuery, prefetch } from '#lib/api/queries.ts';

export const load = ({ params }) =>
	prefetch(
		clientQuery(params.id),
		clientsQuery(),
		auditQuery(params.id),
		...(params.tab === 'supply' ? [clientBatchesQuery(params.id)] : [])
	);
