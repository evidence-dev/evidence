import { setContext } from 'svelte';
import {
	QUERIES_CONTEXT_KEY,
	ALL_QUERIES_CONTEXT_KEY,
	ALL_QUERIES_MUTS_CONTEXT_KEY
} from '$evidence/contextKeys';
import { ProxyStack } from '$evidence/proxyStack';
import { readable } from 'svelte/store';

export default () => {
	const queryContext = readable({}); // TODO: Stores
	const allQueries = ProxyStack();

	setContext(QUERIES_CONTEXT_KEY, queryContext);
	setContext(ALL_QUERIES_CONTEXT_KEY, allQueries.value);
	setContext(ALL_QUERIES_MUTS_CONTEXT_KEY, { push: allQueries.push, rm: allQueries.rm });
};

export const asObj = () => {
	const queryContext = readable({}); // TODO: Stores
	const allQueries = ProxyStack();
	return {
		[QUERIES_CONTEXT_KEY]: queryContext,
		[ALL_QUERIES_CONTEXT_KEY]: allQueries.value,
		[ALL_QUERIES_MUTS_CONTEXT_KEY]: { push: allQueries.push, rm: allQueries.rm }
	};
};
