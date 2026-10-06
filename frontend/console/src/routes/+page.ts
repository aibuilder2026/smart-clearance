import {
	batchesQuery,
	clientsQuery,
	dashboardQuery,
	overviewQuery,
	prefetch,
	requestsQuery
} from '#lib/api/queries.ts';
import { apiQuery, readView } from '#lib/overview.ts';

export const load = ({ url }) => {
	const v = readView(url);
	return prefetch(dashboardQuery(v.days), batchesQuery(apiQuery(v)), overviewQuery(), clientsQuery(), requestsQuery());
};
