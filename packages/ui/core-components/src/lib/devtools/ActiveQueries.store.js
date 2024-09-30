import { dev } from '$app/environment';
import { writable } from 'svelte/store';
import { batchUp } from '@evidence-dev/sdk/utils';
import { Query } from '@evidence-dev/sdk/usql';
const activeQueries = writable(new Map());

if (dev) {
	Query.addEventListener(
		'queryCreated',
		batchUp((insertedQueries) => {
			activeQueries.update(($activeQueries) => {
				for (const query of insertedQueries) {
					if (Query.isQuery(query.proxied)) $activeQueries.set(query.proxied.id, query.proxied);
				}
				return $activeQueries;
			});
		})
	);

	// Cache was cleared so we can reasonably assume that all queries are no longer active
	// 🚩 Is this actually a true assumption?
	Query.addEventListener('cacheCleared', () => activeQueries.set(new Map()));
}

export const ActiveQueries = {
	subscribe: activeQueries.subscribe.bind(activeQueries),
	reset: () => activeQueries.set(new Map())
};
