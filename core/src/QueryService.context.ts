import type { QueryService } from './user-components/interfaces/query-service';
import { getContext, setContext } from 'svelte';
import {
	setConnectionRegistry,
	createSingleConnectionRegistry,
	connectionFromQueryService
} from './connection';

// Re-exported here so consumers migrating off the ambient query service can import the
// connection accessor from the same module (the registry is set alongside, below).
export { getDefaultConnection, getConnectionRegistry } from './connection';

const QUERY_SERVICE_CONTEXT_KEY = Symbol('QUERY_SERVICE_CONTEXT');

export const setQueryService = (queryService: QueryService) => {
	setContext(QUERY_SERVICE_CONTEXT_KEY, queryService);
	// Registry-of-one: expose the same warehouse as a Connection so consumers can migrate
	// off ambient `queryService.dialect`/`.query()` onto a resolved connection (no-op today).
	setConnectionRegistry(
		createSingleConnectionRegistry(
			connectionFromQueryService(queryService, {
				id: 'default',
				type: queryService.connectionType
			})
		)
	);
};

export const getQueryService = (): QueryService => {
	const queryService = getContext<QueryService | undefined>(QUERY_SERVICE_CONTEXT_KEY);
	if (!queryService) {
		throw new Error('QueryService context not set!');
	}
	return queryService;
};
