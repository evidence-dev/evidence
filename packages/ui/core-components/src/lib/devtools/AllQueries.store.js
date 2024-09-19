import { writable } from 'svelte/store';
import { batchUp } from '@evidence-dev/sdk/utils';
import { Query } from '@evidence-dev/sdk/usql';
const allQueries = writable(new Map());

Query.addEventListener(
	'queryCreated',
	batchUp((insertedQueries) => {
		allQueries.update(($allQueries) => {
			for (const query of insertedQueries) {
				if (Query.isQuery(query)) $allQueries.set(query.hash, query);
			}
			return $allQueries;
		});
	})
);

// Cache was cleared so we can reasonably assume that all queries are no longer active
// 🚩 Is this actually a true assumption?
Query.addEventListener('cacheCleared', () => allQueries.set(new Map()));

export const AllQueries = {
	subscribe: allQueries.subscribe.bind(allQueries),
	reset: () => allQueries.set(new Map())
};
