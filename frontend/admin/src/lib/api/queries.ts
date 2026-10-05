import { queryOptions } from '@tanstack/svelte-query';
import { api } from './client';

// TanStack Query keys and fetchers, shared by load functions (prefetch) and components (createQuery)
export const showcaseQuery = () =>
	queryOptions({ queryKey: ['site', 'showcase'] as const, queryFn: () => api.showcase() });
export const catalogQuery = () =>
	queryOptions({ queryKey: ['platform', 'catalog'] as const, queryFn: () => api.catalog() });
