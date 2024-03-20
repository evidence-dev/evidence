import { forceArray } from '../utils/forceArray.js';
import { type Query, avg, sum } from '@uwdata/mosaic-sql';

type MaybeAliased = string | { col: string; alias: string };

type AggArgs = {
	sum: MaybeAliased[] | MaybeAliased;
	avg: MaybeAliased[] | MaybeAliased;
};

export const agg = (q: Query, aggConfig: AggArgs): Query => {
	if ('sum' in aggConfig) {
		for (const column of forceArray(aggConfig.sum)) {
			// Column may be a string or { alias: string, name: string }
			// We need to unpack this to either use the value or to use the `.alias`
			const alias =
				typeof column === 'object' && 'alias' in column ? column.alias : `sum_${column}`;
			q.select({ [alias]: sum(column) });
		}
	}
	if ('avg' in aggConfig) {
		for (const column of forceArray(aggConfig.avg)) {
			// Column may be a string or { alias: string, name: string }
			// We need to unpack this to either use the value or to use the `.alias`
			const alias =
				typeof column === 'object' && 'alias' in column ? column.alias : `avg_${column}`;
			q.select({ [alias]: avg(column) });
		}
	}

	return q;
};
