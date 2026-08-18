import type { QueryService } from './user-components/interfaces/query-service';
import { getContext, setContext } from 'svelte';

const QUERY_SERVICE_CONTEXT_KEY = Symbol('QUERY_SERVICE_CONTEXT');

export const setQueryService = (queryService: QueryService) => {
	setContext(QUERY_SERVICE_CONTEXT_KEY, queryService);
};

export const getQueryService = (): QueryService => {
	const queryService = getContext<QueryService | undefined>(QUERY_SERVICE_CONTEXT_KEY);
	if (!queryService) {
		throw new Error('QueryService context not set!');
	}
	return queryService;
};
