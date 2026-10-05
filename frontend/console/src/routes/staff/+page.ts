import { prefetch, staffQuery } from '#lib/api/queries.ts';

export const load = () => prefetch(staffQuery());
